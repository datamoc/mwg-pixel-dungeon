import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

// MindForm's synthetic item cast (`MindForm.targetSelector`, tag `v3.3.8`): the pure
// planner (`src/simulation/mindFormCast.ts`) plus the scene flow (`src/items/mindForm.ts`).
// Both are import-free at runtime, so this transpiles just the two files into a private
// CommonJS tree and drives the whole pick-aim-fire flow through a stub context - no DOM,
// Pixi or `mwg`, same house pattern as `verifyDisplaySettings.mjs`. Wired into
// `test:simulation` via `package.json`.
const output = mkdtempSync(join(tmpdir(), 'spd-mindform-'));
let passed = 0;
function check(name, run) {
	run();
	passed++;
	console.log(`PASS ${name}`);
}
function compile(source, destination) {
	const file = join(output, destination);
	mkdirSync(dirname(file), { recursive: true });
	writeFileSync(file, ts.transpileModule(readFileSync(source, 'utf8'), {
		compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
	}).outputText);
}

try {
	writeFileSync(join(output, 'package.json'), '{"type":"commonjs"}');
	for (const file of ['simulation/mindFormCast', 'items/mindForm']) {
		compile(new URL(`../src/${file}.ts`, import.meta.url), `${file}.js`);
	}
	const require = createRequire(join(output, 'tests.cjs'));
	const { mindFormCastGate, resolveMindFormAim } = require('./simulation/mindFormCast');
	const { serializeMindEffect, parseMindEffect,
		startMindFormFlow, confirmMindFormAim, reaimStoredMindForm } = require('./items/mindForm');

	check('the Mind button gate refuses wands under MagicImmune and short charge', () => {
		assert.equal(mindFormCastGate(true, true, 99, 25), 'warded');
		assert.equal(mindFormCastGate(false, true, 99, 25), 'ok');
		assert.equal(mindFormCastGate(true, false, 10, 25), 'charges');
		assert.equal(mindFormCastGate(false, false, 25, 25), 'ok');
	});

	check('aiming at yourself refuses, occupants win over bare cells', () => {
		const hero = { x: 0, y: 0 };
		assert.deepEqual(resolveMindFormAim({ heroCell: hero, aimCell: { x: 0, y: 0 }, collisionCell: { x: 3, y: 0 }, aimOccupied: true, collisionOccupied: true }),
			{ status: 'refused', reason: 'self' });
		assert.deepEqual(resolveMindFormAim({ heroCell: hero, aimCell: { x: 5, y: 0 }, collisionCell: { x: 0, y: 0 }, aimOccupied: false, collisionOccupied: true }),
			{ status: 'refused', reason: 'self' });
		assert.deepEqual(resolveMindFormAim({ heroCell: hero, aimCell: { x: 2, y: 0 }, collisionCell: { x: 4, y: 0 }, aimOccupied: true, collisionOccupied: true }),
			{ status: 'ok', target: 'aim' });
		assert.deepEqual(resolveMindFormAim({ heroCell: hero, aimCell: { x: 2, y: 0 }, collisionCell: { x: 4, y: 0 }, aimOccupied: false, collisionOccupied: true }),
			{ status: 'ok', target: 'collision' });
		assert.deepEqual(resolveMindFormAim({ heroCell: hero, aimCell: { x: 2, y: 0 }, collisionCell: { x: 4, y: 0 }, aimOccupied: false, collisionOccupied: false }),
			{ status: 'refused', reason: 'empty' });
	});

	check('the Trinity slot round-trips, and rejects foreign ids', () => {
		const wand = { kind: 'wand', wandType: 'fireblast', isMultiCharge: true };
		assert.equal(serializeMindEffect(wand), 'mind:wand:fireblast');
		assert.deepEqual(parseMindEffect('mind:wand:fireblast'), wand);
		assert.deepEqual(parseMindEffect('mind:wand:frost'), { kind: 'wand', wandType: 'frost', isMultiCharge: false });
		assert.deepEqual(parseMindEffect('mind:thrown:javelin'), { kind: 'thrown', missileClass: 'javelin' });
		assert.equal(parseMindEffect(null), null);
		assert.equal(parseMindEffect('mind:wand:'), null);
		assert.equal(parseMindEffect('mind:charm:fireblast'), null);
		assert.equal(parseMindEffect('body:wand:fireblast'), null);
		assert.equal(parseMindEffect('garbage'), null);
	});

	/** A stub Trinity scene: armor holds 100 charge, one rat at (2,0), rays stop at (4,0). */
	const stub = () => {
		const said = [];
		const state = {
			said, armor: 100, turns: 0, stored: null, fired: [],
			picked: null, aimed: false,
		};
		const ctx = {
			mindItemLevel: () => 5,
			mindEffectCost: () => 25,
			armorCharge: () => state.armor,
			spendArmor: (amount) => { state.armor -= amount; },
			isMagicImmune: () => false,
			heroCell: () => ({ x: 0, y: 0 }),
			rayCollision: () => ({ x: 4, y: 0 }),
			occupantAt: (cell) => (cell.x === 2 && cell.y === 0 ? { id: 'rat-1' } : null),
			pickMindEffect: (options, onPick) => { state.picked = options.length; onPick(options[0].value); },
			aimMindEffect: (effect, onConfirm) => { state.aimed = true; onConfirm({ x: 2, y: 0 }); },
			fireMindWand: (wandType, level, targetId) => { state.fired.push(['wand', wandType, level, targetId]); return true; },
			fireMindThrown: (missileClass, level, targetId) => { state.fired.push(['thrown', missileClass, level, targetId]); return true; },
			spendTurn: () => { state.turns += 1; },
			say: (key, level) => { said.push([key, level]); },
			storeMindEffect: (id) => { state.stored = id; },
			readMindEffect: () => state.stored,
		};
		return { state, ctx };
	};
	const catalog = {
		wands: [{ value: { kind: 'wand', wandType: 'fireblast', isMultiCharge: true }, label: 'fireblast' }],
		thrown: [{ value: { kind: 'thrown', missileClass: 'javelin' }, label: 'javelin' }],
	};

	check('a wand pick stores, aims, fires at the conjured level, spends armor but no turn', () => {
		const { state, ctx } = stub();
		startMindFormFlow(ctx, catalog);
		assert.equal(state.stored, 'mind:wand:fireblast');
		assert.equal(state.aimed, true);
		assert.deepEqual(state.fired, [['wand', 'fireblast', 5, 'rat-1']]);
		assert.equal(state.armor, 75);
		assert.equal(state.turns, 0);
		assert.deepEqual(state.said, []);
	});

	check('a thrown pick spends a turn, a failed fire spends nothing', () => {
		const onlyThrown = { wands: [], thrown: catalog.thrown };
		const first = stub();
		startMindFormFlow(first.ctx, onlyThrown);
		assert.deepEqual(first.state.fired, [['thrown', 'javelin', 5, 'rat-1']]);
		assert.equal(first.state.armor, 75);
		assert.equal(first.state.turns, 1);
		const fizzle = stub();
		fizzle.ctx.fireMindThrown = () => false;
		startMindFormFlow(fizzle.ctx, onlyThrown);
		assert.equal(fizzle.state.armor, 100);
		assert.equal(fizzle.state.turns, 0);
	});

	check('short charge and self aim refuse with Java-shaped lines and spend nothing', () => {
		const poor = stub();
		poor.state.armor = 10;
		startMindFormFlow(poor.ctx, catalog);
		assert.deepEqual(poor.state.said, [['items.armor.classarmor.low_charge', 'negative']]);
		assert.equal(poor.state.armor, 10);
		assert.deepEqual(poor.state.fired, []);
		const vain = stub();
		vain.ctx.aimMindEffect = (effect, onConfirm) => onConfirm({ x: 0, y: 0 });
		startMindFormFlow(vain.ctx, catalog);
		assert.deepEqual(vain.state.said, [['items.wands.wand.self_target', 'negative']]);
		assert.equal(vain.state.armor, 100);
	});

	check('a stored pick re-aims, a stale slot stays silent', () => {		const { state, ctx } = stub();
		ctx.storeMindEffect('mind:thrown:javelin');
		reaimStoredMindForm(ctx, catalog);
		assert.equal(state.aimed, true);
		assert.deepEqual(state.fired, [['thrown', 'javelin', 5, 'rat-1']]);
		const stale = stub();
		stale.ctx.storeMindEffect('mind:wand:');
		reaimStoredMindForm(stale.ctx, catalog);
		assert.equal(stale.state.aimed, false);
		assert.deepEqual(stale.state.fired, []);
		const retired = stub();
		retired.ctx.storeMindEffect('mind:wand:retiredwand');
		reaimStoredMindForm(retired.ctx, catalog);
		assert.equal(retired.state.aimed, false);
	});

	check('the scene binds the flow with conjured levels and no bag reads', () => {
		//The builder lives in Pixi-bound scene code, so this pins its wiring at
		//source level the way verifyCombat's champion check does.
		const scene = readFileSync(new URL('../src/scenes/dungeon/hero/armorAbilityUse.ts', import.meta.url), 'utf8');
		assert.match(scene, /chooseTrinityMindEffect\(this: DungeonScene, cost: number\)/,
			'the Trinity ability offers a Mind picker');
		assert.match(scene, /mindFormFlowContext\(this: DungeonScene, baseCost: number\)/,
			'the flow context is bound scene-side');
		assert.match(scene, /this\.fireWandShot\(wandType as WandType, level, target, 0\)/,
			'conjured zaps spend zero bag charges');
		assert.match(scene, /trinityChargeUsePerEffect\(baseCost,[\s\S]{0,200}'mind'\)/,
			'conjured fires spend the Trinity armor charge per effect class');
		assert.doesNotMatch(scene, /commitTrinityForm\(this: DungeonScene/,
			'the cosmetic form-commit is gone once Mind fires for real');
		const traps = readFileSync(new URL('../src/scenes/dungeon/environmentFireTraps.ts', import.meta.url), 'utf8');
		assert.match(traps, /useRegrowthWand\(this: DungeonScene, target: Creature, charges: number, levelOverride\?: number\)/,
			'regrowth accepts a conjured level override');
		assert.match(traps, /weaponLevel: levelOverride \?\? this\.effectiveZapLevel\(\)/,
			'fireblast runs a conjured cast at its own level');
	});

	console.log(`\nAll ${passed} mindform checks passed.`);
} catch (error) {
	console.error(`FAIL after ${passed} passed:`, error);
	process.exit(1);
}
