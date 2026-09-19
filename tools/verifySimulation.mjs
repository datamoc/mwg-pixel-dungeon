import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { verifyCombat } from './verifyCombat.mjs';
import { verifyMovement } from './verifyMovement.mjs';
import { verifyHeroTurn } from './verifyHeroTurn.mjs';
import { verifyHeroActions } from './verifyHeroActions.mjs';
import { verifySearch } from './verifySearch.mjs';
import { verifyCone } from './verifyCone.mjs';
import { verifyRipperLeap } from './verifyRipperLeap.mjs';
import { verifySuccubusBlink } from './verifySuccubusBlink.mjs';
import { verifyArmorAbilities } from './verifyArmorAbilities.mjs';

// Compile the actual implementation into a private temporary CommonJS tree. Type-only
// mwg imports disappear, so tests never load Pixi, a DOM, or the full framework barrel.
// Type checking remains npm run check's responsibility; no extra test dependency needed.
const output = mkdtempSync(join(tmpdir(), 'spd-simulation-'));
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
		compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, rewriteRelativeImportExtensions: true },
	}).outputText);
}

try {
	writeFileSync(join(output, 'package.json'), '{"type":"commonjs"}');
	for (const file of ['simulation/movement', 'simulation/heroTurn', 'simulation/hunger', 'simulation/turns', 'adapters/sceneSimulation',
		'adapters/hungerSimulation', 'simulation/random', 'simulation/combatState', 'simulation/mwlBuffDurations', 'simulation/mwlStatusImmunities', 'simulation/mwlMonsterImmunities', 'simulation/buffs', 'simulation/combat', 'simulation/entityId', 'talentEffects',
		'adapters/combatSimulation', 'adapters/mwgRandom', 'combat', 'simulation/heroActions', 'adapters/heroActionSimulation', 'adapters/heroActions',
	'simulation/search', 'adapters/searchSimulation', 'adapters/movementSimulation', 'simulation/attackResolution', 'adapters/attackSimulation', 'simulation/warriorAbilities', 'simulation/huntressAbilities', 'simulation/duelistAbilities', 'talents', 'armorAbilities', 'simulation/tenguAbility', 'simulation/tenguBeam', 'simulation/gooBoss', 'simulation/ratKingBoss', 'simulation/dm300Boss', 'simulation/yogBoss', 'simulation/defenderDamageCurves', 'simulation/preparation', 'simulation/disintegration', 'items/wands', 'mechanics/cone', 'dungeonConstants',
	'simulation/javaBlob', 'simulation/environmentalBlobs', 'simulation/wraith', 'simulation/plantPools', 'simulation/plantDrops', 'simulation/teleport', 'simulation/teleportAppear', 'simulation/timeBubble', 'simulation/targeting', 'simulation/ripperLeap', 'simulation/succubusBlink',
	// `dungeonConstants` and `items/wands` read the MWL item tables, so the harness compiles the
	// real adapter and the real generated catalogue instead of a hand-copied stub of them - a stub
	// is how the old, hand-listed framework set above drifted once already, and how the item-frame
	// table silently lost a ground kind the moment the game's union grew one.
	'generated/mwlContent', 'mwlContent',
	// The five per-domain adapters are thin facades over this shared runtime module.
	'adapters/gameSimulation']) {
		compile(new URL(`../src/${file}.ts`, import.meta.url), `${file}.js`);
	}
	compile(new URL('../src/simulation/highGrass.ts', import.meta.url), 'simulation/highGrass.js');
	// The framework half of the harness is the INSTALLED package - the same
	// `@datamoc/mw_games` build the game itself ships - rather than a sibling checkout of the
	// framework's sources. The two are different versions in general (the checkout is typically
	// ahead), so compiling a checkout would exercise something this port does not depend on.
	//
	// mwg's dist is ESM and this temporary tree is CommonJS; `require()` bridges that directly on
	// Node >= 22.12, and none of these modules use top-level await. Shim rather than compile, so
	// the harness follows whatever the package re-exports: the previous hand-listed set silently
	// missed `Campaign.ts` once the framework's `simulation/index.ts` grew it, leaving an
	// `index.js` that required a file never emitted and failing the suite.
	const dist = fileURLToPath(new URL('../node_modules/mwg/dist/', import.meta.url));
	function shim(destination, source) {
		const file = join(output, destination);
		mkdirSync(dirname(file), { recursive: true });
		writeFileSync(file, `module.exports = require(${JSON.stringify(source)});\n`);
	}
	shim('scheduler.js', join(dist, 'roguelike', 'Scheduler.js'));
	shim('random.js', join(dist, 'core', 'Random.js'));
	shim(join('node_modules', 'mwg', 'roguelike', 'Scheduler.js'), join(dist, 'roguelike', 'Scheduler.js'));
	shim(join('node_modules', 'mwg', 'core', 'Random.js'), join(dist, 'core', 'Random.js'));
	shim(join('node_modules', 'mwg', 'simulation', 'index.js'), join(dist, 'simulation', 'index.js'));
	// `src/mwlContent.ts` reads the generated catalogue through the framework's own
	// `contentCatalog`, so the harness needs that one entry point too - shimmed from the installed
	// package, exactly like the rest of the framework half.
	shim(join('node_modules', 'mwg', 'mwl', 'index.js'), join(dist, 'mwl', 'index.js'));
	// The adapters take only `Random`/`Generator` from the barrel, so nothing rendering-side is
	// pulled in; the real namespace module is re-exported under the barrel's own names.
	mkdirSync(join(output, 'node_modules', 'mwg'), { recursive: true });
	writeFileSync(join(output, 'node_modules', 'mwg', 'index.js'),
		`const random = require(${JSON.stringify(join(dist, 'core', 'Random.js'))}); exports.Random = random; exports.Generator = random.Generator;\n`);
	const require = createRequire(join(output, 'tests.cjs'));
	const { advanceHunger } = require('./simulation/hunger');
	const { runHungerStep } = require('./adapters/hungerSimulation');
	const { runMovement } = require('./adapters/movementSimulation');
	const { resolveAttack } = require('./simulation/attackResolution');
	const { runAttackResolution } = require('./adapters/attackSimulation');
	const { stepTenguAbility, tenguTargetAbilityUses, tenguAbilityCost } = require('./simulation/tenguAbility');
	const { planDisintegration } = require('./simulation/disintegration');
	const { wandTypeFromSource, wandTargetRange, wandChargesPerCast } = require('./items/wands');
	const { runUntilHeroInput } = require('./adapters/sceneSimulation');
	const { SceneSimulationAdapter } = require('./adapters/sceneSimulation');
	const { trampleHighGrass } = require('./simulation/highGrass');
	const { evolveElectricity, evolveJavaBlob } = require('./simulation/javaBlob');
	const { wraithCombatStats, dustSpawnerStep, dustSpawnerCap } = require('./simulation/wraith');
const { grantSungrassHealth, tickSungrassHealth, grantEarthrootArmor, absorbEarthrootArmor } = require('./simulation/plantPools');
const { plantDropCandidates, plantDropCount } = require('./simulation/plantDrops');
const { teleportCandidates, disarmBubblePresses } = require('./simulation/teleport');
const { teleportAppearPlan } = require('./simulation/teleportAppear');
const { selectRangedTarget } = require('./simulation/targeting');
const { TIME_BUBBLE_TURNS, timeBubbleTurnCost, spendTimeBubbleTurn } = require('./simulation/timeBubble');
	const { applyEnvironmentalBlobs } = require('./simulation/environmentalBlobs');
	// The four coefficients `HighGrass.trample` reads, as the port's MWL rows carry them.
	const grassRules = { seedChanceBase: 25, seedChancePerLevel: 4, dewChanceBase: 6, dewChanceLevelDivisor: 2 };
	check('Huntress furrows high grass before clearing it without drops', () => {
		assert.deepEqual(trampleHighGrass('high', true, grassRules), { next: 'furrowed', rollDrops: false, drops: null });
		assert.deepEqual(trampleHighGrass('furrowed', true, grassRules), { next: 'furrowed', rollDrops: false, drops: null });
		assert.deepEqual(trampleHighGrass('furrowed', false, grassRules), { next: 'plain', rollDrops: false, drops: null });
		assert.deepEqual(trampleHighGrass('high', false, grassRules), {
			next: 'plain', rollDrops: true, drops: { seedChance: 1 / 25, dewChance: 1 / 6 },
		});
	});
	check('grass loot scales with Sandals of Nature, and a cursed pair suppresses it', () => {
		// Java's own table: seed `1/(25 - 4*naturalismLevel)`, dew `1/(6 - naturalismLevel/2)`.
		// naturalismLevel is `itemLevel()+1`, so the artifact's 0..3 levels give 1..4.
		for (const [level, seedDenominator, dewDenominator] of [[1, 21, 5.5], [2, 17, 5], [3, 13, 4.5], [4, 9, 4]]) {
			const { drops } = trampleHighGrass('high', false, grassRules, { naturalismLevel: level });
			assert.equal(drops.seedChance, 1 / seedDenominator, `seed chance at naturalismLevel ${level}`);
			assert.equal(drops.dewChance, 1 / dewDenominator, `dew chance at naturalismLevel ${level}`);
		}
		// Cursed footwear: Java sets `naturalismLevel = -1` and skips the whole drop block, while
		// still returning through its ordinary trample path.
		assert.deepEqual(trampleHighGrass('high', false, grassRules, { naturalismLevel: -1 }), {
			next: 'plain', rollDrops: true, drops: null,
		});
		// A GRASS-feeling floor halves the dew chance and nothing else.
		const grassy = trampleHighGrass('high', false, grassRules, { naturalismLevel: 2, grassFeeling: true });
		assert.equal(grassy.drops.seedChance, 1 / 17);
		assert.equal(grassy.drops.dewChance, 1 / 10);
	});
	check('Java blob evolution diffuses through four neighbours and loses one volume', () => {
		const before = new Array(25).fill(0);
		before[12] = 5;
		const next = evolveJavaBlob(5, 5, before, () => false);
		assert.equal(next[12], 4);
		for (const cell of [7, 11, 13, 17]) assert.equal(next[cell], 1);
		assert.equal(next[0], 0);
		const blocked = evolveJavaBlob(5, 5, before, (x, y) => x === 2 && y === 1);
		assert.equal(blocked[7], 0);
	});
	check('Electricity conducts full power through connected water, then loses one volume', () => {
		//5x5: water is the middle row plus a cell below its centre; the seed sits dry above.
		const isWater = (x, y) => (y === 2 && x >= 0 && x <= 4) || (x === 2 && y === 3);
		const before = new Array(25).fill(0);
		before[7] = 10;
		const next = evolveElectricity(5, 5, before, isWater);
		//The dry seed keeps its own charge minus one; every connected water cell
		//conducts the full 10 first, so all read 9 after the decrement.
		assert.equal(next[7], 9);
		for (const cell of [10, 11, 12, 13, 14, 17]) assert.equal(next[cell], 9);
		//Dry cells off the water stay uncharged, and diagonal water never conducts.
		assert.equal(next[0], 0);
		assert.equal(next[6], 0);
		assert.equal(next[8], 0);
	});
	check('TimeBubble ownership absorbs the owner\'s own clock and clears after seven turns', () => {
		assert.equal(TIME_BUBBLE_TURNS, 7);
		//A bubble owner costs 0 scheduler clock; everyone else pays the base cost.
		assert.equal(timeBubbleTurnCost(7, 1), 0);
		assert.equal(timeBubbleTurnCost(1, 1), 0);
		assert.equal(timeBubbleTurnCost(undefined, 1), 1);
		assert.equal(timeBubbleTurnCost(0, 2.5), 2.5);
		//Each own-turn spends one bubble turn; the last spend clears the bubble.
		assert.equal(spendTimeBubbleTurn(7), 6);
		assert.equal(spendTimeBubbleTurn(2), 1);
		assert.equal(spendTimeBubbleTurn(1), undefined);
		assert.equal(spendTimeBubbleTurn(undefined), undefined);
		//Seven absorbed spends end exactly where the eighth would overdraw.
		let turns = TIME_BUBBLE_TURNS;
		let acts = 0;
		while (turns !== undefined) { assert.equal(timeBubbleTurnCost(turns, 1), 0); turns = spendTimeBubbleTurn(turns); acts++; }
		assert.equal(acts, 7);
		assert.equal(timeBubbleTurnCost(turns, 1), 1);
	});
	check('Electricity never diffuses into dry cells and dies out by one per turn', () => {
		const dry = new Array(25).fill(0);
		dry[12] = 3;
		const next = evolveElectricity(5, 5, dry, () => false);
		assert.equal(next[12], 2);
		for (const cell of [7, 11, 13, 17]) assert.equal(next[cell], 0);
		const spent = evolveElectricity(5, 5, next, () => false);
		assert.equal(spent[12], 1);
		const gone = evolveElectricity(5, 5, spent, () => false);
		assert.equal(gone[12], 0);
	});
	check('Wraith.adjustStats scales accuracy, evasion and damage with the spawn level', () => {
		assert.deepEqual(wraithCombatStats(0), { accuracy: 10, evasion: 50, damageMin: 1, damageMax: 2 });
		assert.deepEqual(wraithCombatStats(1), { accuracy: 11, evasion: 55, damageMin: 1, damageMax: 3 });
		//The +1 runs after Java's integer division: level 2 already rolls 2-4.
		assert.deepEqual(wraithCombatStats(2), { accuracy: 12, evasion: 60, damageMin: 2, damageMax: 4 });
		assert.deepEqual(wraithCombatStats(9), { accuracy: 19, evasion: 95, damageMin: 5, damageMax: 11 });
	});
	check('CorpseDust spawner banks one power per tick toward min(49, wraiths^2)', () => {
		assert.deepEqual(dustSpawnerStep(0, 0), { power: 0, spawn: true, cost: 1 });
		assert.deepEqual(dustSpawnerStep(0, 1), { power: 1, spawn: false, cost: 4 });
		assert.deepEqual(dustSpawnerStep(3, 1), { power: 0, spawn: true, cost: 4 });
		assert.deepEqual(dustSpawnerStep(48, 7), { power: 0, spawn: true, cost: 49 });
		assert.deepEqual(dustSpawnerStep(0, 8), { power: 1, spawn: false, cost: 49 });
		assert.equal(dustSpawnerCap(30, 1), 4, 'with no candidate the bank caps at 2*wraiths');
		assert.equal(dustSpawnerCap(3, 1), 3);
	});
	check('Sungrass.Health boosts additively and pays out (40+HT)/150 per turn', () => {
	assert.deepEqual(grantSungrassHealth(undefined, 20), { level: 20, partial: 0 });
	//`boost()` is additive, never keep-max, and keeps the fractional carry.
	assert.deepEqual(grantSungrassHealth({ level: 5, partial: 0.5 }, 20), { level: 25, partial: 0.5 });
	//HT 110 accrues exactly 1.0/turn: the first turn banks the carry without healing.
	assert.deepEqual(tickSungrassHealth({ level: 110, partial: 0 }, 110, 50, false), { pool: { level: 110, partial: 1 }, healed: 0 });
	//A carry landing exactly on 1.0 heals nothing - Java's gate is a strict `> 1`.
	const payout = tickSungrassHealth({ level: 110, partial: 1 }, 110, 50, false);
	assert.deepEqual(payout, { pool: { level: 108, partial: 0 }, healed: 2 });
	//The HP gain caps at what is missing, but the pool still drains the whole tick.
	assert.deepEqual(tickSungrassHealth({ level: 110, partial: 1 }, 110, 1, false), { pool: { level: 108, partial: 0 }, healed: 1 });
	//Exhaustion ends the buff.
	assert.deepEqual(tickSungrassHealth({ level: 1, partial: 1 }, 110, 50, false), { pool: null, healed: 2 });
	//Leaving the grant cell ends it with no parting tick.
	assert.deepEqual(tickSungrassHealth({ level: 110, partial: 1 }, 110, 50, true), { pool: null, healed: 0 });
});
check('Earthroot.Armor grants keep-max and absorbs min(damage, blocking) per hit', () => {
	assert.equal(grantEarthrootArmor(undefined, 20), 20);
	//`level()` keeps the higher pool, unlike Sungrass's additive boost.
	assert.equal(grantEarthrootArmor(25, 20), 25);
	assert.equal(grantEarthrootArmor(10, 20), 20);
	assert.deepEqual(absorbEarthrootArmor(20, 10, 5, false), { level: 15, damage: 5 });
	assert.deepEqual(absorbEarthrootArmor(20, 3, 5, false), { level: 17, damage: 0 });
	//The detaching hit still blocks the full cap, not just the remaining pool.
	assert.deepEqual(absorbEarthrootArmor(2, 10, 5, false), { level: null, damage: 5 });
	//A moved owner detaches and takes the hit whole.
	assert.deepEqual(absorbEarthrootArmor(20, 10, 5, true), { level: null, damage: 10 });
});
check('Dewcatcher/Seedpod drops avoid stairs and the entrance on distinct cells', () => {
	const ring = [];
	for (let i = 0; i < 8; i++) ring.push({ x: i, y: 0, passable: true, isChasm: false, isStairs: i === 2, isEntrance: i === 5 });
	assert.deepEqual(plantDropCandidates(ring), [
		{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 },
	]);
	//Impassable and chasm neighbours are out too, like Java's own passable test.
	assert.deepEqual(plantDropCandidates([
		{ x: 0, y: 0, passable: false, isChasm: false, isStairs: false, isEntrance: false },
		{ x: 1, y: 0, passable: true, isChasm: true, isStairs: false, isEntrance: false },
		{ x: 2, y: 0, passable: true, isChasm: false, isStairs: false, isEntrance: false },
	]), [{ x: 2, y: 0 }]);
});
check('Dewcatcher/Seedpod counts roll triangular like NormalIntRange', () => {
	//The roll delegates to the triangular distribution with the same bounds, never the flat one.
	let seen = null;
	const stub = { normalRange: (min, max) => { seen = [min, max]; return min; } };
	assert.equal(plantDropCount(3, 6, stub), 3);
	assert.deepEqual(seen, [3, 6]);
	//Shape check against the real distribution: middles outweigh ends ~3:1, uniform would tie.
	const { Random: SeededRandom } = require('mwg');
	const draws = 2000;
	let middle = 0;
	SeededRandom.withSeed(20260917, () => {
		for (let i = 0; i < draws; i++) {
			const v = plantDropCount(3, 6, SeededRandom);
			assert(v >= 3 && v <= 6, `count ${v} inside [3, 6]`);
			if (v === 4 || v === 5) middle++;
		}
	});
	assert(middle > 1200, `triangular middle ${middle}/${draws} beats uniform`);
});
check('HazardAssistTracker lasts 50 turns toward a 10-kill badge', () => {
	const { MWL_TABLE_ROWS } = require('./mwlContent');
	const durationRow = MWL_TABLE_ROWS('buffDurations', 'buff').find((row) => row.buff === 'hazardAssist');
	assert.equal(durationRow.duration, 50);
	const { BUFF_DURATION } = require('./simulation/buffs');
	assert.equal(BUFF_DURATION.hazardAssist, 50);
	const badgeRow = MWL_TABLE_ROWS('badgeCatalogue', 'id').find((row) => row.id === 'enemy_hazards');
	assert.equal(badgeRow.counter, 'hazard_assists');
	assert.equal(badgeRow.target, 10);
	assert.equal(badgeRow.icon, 64);
});
check('Ranged targeting picks the nearest visible hero or ally, never the invisible', () => {
	const roguelike = {
		canTarget: () => true,
		chebyshevDistance: (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)),
	};
	const monster = { x: 0, y: 0, buffs: {} };
	const hero = { x: 5, y: 0, hp: 10, isHero: true, buffs: {} };
	const ally = { x: 2, y: 0, hp: 10, isAlly: true, buffs: {} };
	assert.equal(selectRangedTarget({}, monster, hero, [ally], 8, roguelike), ally);
	const nearHero = { ...hero, x: 1 };
	assert.equal(selectRangedTarget({}, monster, nearHero, [ally], 8, roguelike), nearHero);
	assert.equal(selectRangedTarget({}, monster, { ...hero, buffs: { invisibility: 3 } }, [ally], 8, roguelike), ally);
	assert.equal(selectRangedTarget({}, monster, { ...hero, buffs: { invisibility: 3 } }, [{ ...ally, buffs: { invisibility: 3 } }], 8, roguelike), null);
	assert.equal(selectRangedTarget({}, monster, hero, [{ ...ally, hp: 0 }], 8, roguelike), hero);
});
check('Teleport lands passable, unoccupied, unseen, non-secret and out of pits', () => {
	const open = { passable: true, occupied: false, visible: false, secret: false, chasm: false };
	assert.deepEqual(teleportCandidates([
		{ x: 0, y: 0, ...open },
		{ x: 1, y: 0, ...open, passable: false },
		{ x: 2, y: 0, ...open, occupied: true },
		{ x: 3, y: 0, ...open, visible: true },
		{ x: 4, y: 0, ...open, secret: true },
		{ x: 5, y: 0, ...open, chasm: true },
	]), [{ x: 0, y: 0 }]);
});
check('Teleport appear plays visibility-gated sound, bursts and fade', () => {
	assert.deepEqual(teleportAppearPlan(true, false, true, false),
		{ sound: true, burstFrom: false, fade: true, burstTo: true });
	assert.deepEqual(teleportAppearPlan(true, true, false, false),
		{ sound: true, burstFrom: true, fade: true, burstTo: true });
	assert.deepEqual(teleportAppearPlan(false, false, false, false),
		{ sound: false, burstFrom: false, fade: true, burstTo: false });
	assert.deepEqual(teleportAppearPlan(true, true, false, true),
		{ sound: true, burstFrom: true, fade: false, burstTo: true });
});
check('TimeBubble disarm uproots presses but spares Rotberry', () => {
	assert.deepEqual(
		disarmBubblePresses([3, 7, 9], (cell) => (cell === 3 ? 'rotberry' : cell === 7 ? 'firebloom' : undefined), (cell) => cell === 7 || cell === 9),
		{ uproot: [7], disarm: [7, 9] },
	);
	assert.deepEqual(disarmBubblePresses([], () => undefined, () => false), { uproot: [], disarm: [] });
});
check('StenchGas applies its distinct two-turn paralysis effect', () => {
		const target = { hp: 10 };
		const advanced = [];
		const buffs = [];
		applyEnvironmentalBlobs({
			creatures: [], passable: () => true,
			advance: blob => advanced.push(blob),
			cellsAbove: blob => blob === 'stenchGas' || blob === 'corrosiveGas' ? [{ x: 1, y: 1 }] : [],
			creatureAt: () => target,
			addBuff: (...args) => buffs.push(args),
			applyCorrosion: (...args) => buffs.push(args),
			corrosiveStrength: () => 3,
			toxicDamage: () => 1,
			isToxicImmune: () => false,
			applyDamage: () => true,
		});
		assert.deepEqual(advanced, ['plantGas', 'plantFreeze', 'toxicGas', 'paralyticGas', 'stenchGas', 'corrosiveGas', 'confusionGas', 'web', 'electricity']);
		assert.deepEqual(buffs, [[target, 'paralysis', 2], [target, 3]]);
	});
	const { takeGooTurn } = require('./simulation/gooBoss');
	const { ratKingP1Summon, planRatKingWave } = require('./simulation/ratKingBoss');
	const { chooseDM300Ability, dm300VentPath, planDM300Rockfall } = require('./simulation/dm300Boss');
	const { aimYogDeathGaze } = require('./simulation/yogBoss');
	const { Scheduler } = require('./scheduler');
	const talents = require('./talentEffects');
	const initial = (extra = {}) => ({ hunger: 0, partialDamage: 0, hp: 20, maxHp: 20, ...extra });
	check('movement runtime preserves the pure decision and lazy query order', () => {
		const calls = [];
		const plan = runMovement({ x: 4, y: 8 }, { x: -1, y: 1 }, {
			occupantAt: target => { assert.deepEqual(target, { x: 3, y: 9 }); calls.push('actor'); return null; },
			closedDoorAt: () => { calls.push('door'); return true; },
			isRooted: () => { throw new Error('queried after closed door'); },
			passable: () => { throw new Error('queried after closed door'); },
		});
		assert.deepEqual(plan, { kind: 'door', target: { x: 3, y: 9 } });
		assert.deepEqual(calls, ['actor', 'door']);
		assert.deepEqual(runMovement({ x: 4, y: 8 }, { x: 0, y: 0 }, {}), { kind: 'wait' });
	});
	check('attack resolution preserves hit short-circuit and base damage rolls', () => {
		const random = {
			float: () => 0,
			normalRange: (min) => min,
			range: (min) => min,
			int: (min) => min,
		};
		const attacker = { id: 'hero-1', x: 1, y: 1, hp: 20, maxHp: 20, accuracy: 10, evasion: 5, damage: [3, 7], armor: [0, 0], buffs: {}, isHero: true };
		const defender = { id: 'rat-1', x: 2, y: 1, hp: 10, maxHp: 10, accuracy: 5, evasion: 0, damage: [1, 2], armor: [1, 1], buffs: {}, isHero: false };
		assert.deepEqual(resolveAttack(attacker, defender, random), { hit: true, damage: 2 });
		assert.deepEqual(runAttackResolution(attacker, defender, random), { hit: true, damage: 2 });
		const untargetable = { ...defender, evasion: 1000000 };
		assert.deepEqual(resolveAttack(attacker, untargetable, random), { hit: false, damage: 0 });
		assert.deepEqual(runAttackResolution(attacker, untargetable, random), { hit: false, damage: 0 });
	});
	check('recent talent effects cover thresholds, class gates, and rank scaling', () => {
		//ironWillReduction was removed (2026-09-14): Iron Will's real effect is a Warrior-only
		//BrokenSeal shield-cap boost, now read directly as talentRank('iron_will') in
		//dungeonScene.ts's seal-shield regen tick - see talentEffects.ts's historical note.
		assert.equal(talents.shieldBatteryGain(3, 2), 2);
		assert.equal(talents.shieldBatteryGain(0, 2), 0);
		assert.equal(talents.rejuvenatingStepHeal(4, 4, 19, 20, 2), 1);
		assert.equal(talents.rejuvenatingStepHeal(3, 4, 10, 20, 2), 0);
		assert.equal(talents.lethalHasteDuration(1), 4);
		assert.equal(talents.lethalHasteDuration(2), 6);
		assert.equal(talents.LETHAL_HASTE_COOLDOWN, 100);
		assert.equal(talents.weaponRechargingDamage(100, 2), 103);
		assert.equal(talents.weaponRechargingDamage(40, 1), 41);
		assert.equal(talents.farsightMultiplier('sniper', 2), 1.5);
		assert.equal(talents.farsightMultiplier('warden', 2), 1);
		assert.equal(talents.shieldingDewGain('warden', 2), 2);
		assert.equal(talents.shieldingDewGain('sniper', 2), 0);
		assert.equal(talents.preservationChance(1), 0.2);
		assert.equal(talents.preservationChance(2), 0.35);
		assert.equal(talents.preservationChance(0), 0);
		assert.equal(talents.ironStomachReduction('warrior', 2), 4);
		assert.equal(talents.ironStomachReduction('rogue', 2), 0);
		assert.equal(talents.cachedRationChance('rogue', 2), 0.4);
		assert.equal(talents.cachedRationChance('warrior', 2), 0);
		assert.equal(talents.canImproviseProjectile('warrior', 1, 1), true);
		assert.equal(talents.canImproviseProjectile('warrior', 1, 0), false);
		assert.equal(talents.evasiveArmorBonus('freerunner', 2, 3), 6);
		assert.equal(talents.evasiveArmorBonus('assassin', 2, 3), 0);
		assert.equal(talents.assassinReachBonus('assassin', 2), 2);
		assert.equal(talents.empoweredStrikeBonus('battlemage', 2), 2);
		//Bounty Hunter: Java's real term is a drop-chance *multiplier* of `0.02 * 2^(prep-1) *
		//points`, not the flat gold this used to stand in with. Ranks 1-3 at prep level 4 give
		//0.16 / 0.32 / 0.48; a level-1 prepare gives an eighth of that.
		assert.equal(talents.bountyHunterDropBonus(4, 3), 0.48);
		assert.equal(talents.bountyHunterDropBonus(4, 1), 0.16);
		assert.equal(talents.bountyHunterDropBonus(1, 3), 0.06);
		assert.equal(talents.bountyHunterDropBonus(4, 0), 0);
		assert.equal(talents.unencumberedSpiritEvasion('monk_sub', 2), 2);
		assert.equal(talents.lethalDefenseShield('gladiator', 2), 2);
		assert.equal(talents.monasticVigorShield('monk_sub', 2), 2);
		assert.equal(talents.sharedUpgradeArmor('sniper', 1, 1), 1);
		assert.equal(talents.sharedUpgradeArmor('sniper', 1, 3), 0);
		assert.equal(talents.twinUpgradeArmor('champion', 1, 1), 1);
		assert.equal(talents.soulSiphonCharge('warlock', 2), 2);
		assert.equal(talents.projectileMomentumBonus('freerunner', 2, true), 2);
		assert.equal(talents.projectileMomentumBonus('sniper', 2, true), 0);
		assert.equal(talents.enragedCatalystBonus('berserker', 2, 10, 20), 2);
		assert.equal(talents.enragedCatalystBonus('berserker', 2, 11, 20), 0);
		assert.equal(talents.cleaveComboSeed('gladiator', 2), 2);
		assert.equal(talents.cleaveComboSeed('berserker', 2), 0);
		assert.equal(talents.deathlessFuryTriggers('berserker', 1, false, 20, 10), true);
		assert.equal(talents.deathlessFuryTriggers('berserker', 1, true, 20, 10), false);
		//`enhancedLethalityThreshold` (the flat `0.2*rank` stand-in for the Assassin's execute) is
		//gone: the talent now feeds `AttackLevel.KOThreshold()`'s table column directly, and that
		//whole table is pinned in verifyCombat.
		assert.equal(talents.arcaneVisionDuration(2), 15);
		assert.equal(talents.arcaneVisionDuration(0), 5);
		assert.equal(talents.necromancerMinionChance('warlock', 1), 0.13);
		assert.equal(talents.necromancerMinionChance('warlock', 3), 0.4);
		assert.equal(talents.necromancerMinionChance('battlemage', 3), 0);
		//2026-09-19 pass: the five T3 talents whose formulas were tabled but unwired.
		assert.equal(talents.EMPOWERING_SCROLLS_BONUS, 3);
		assert.equal(talents.empoweringScrollsCharges(1), 1);
		assert.equal(talents.empoweringScrollsCharges(3), 3);
		assert.equal(talents.empoweringScrollsCharges(0), 0);
		assert.equal(talents.enhancedRingsDuration(1), 3);
		assert.equal(talents.enhancedRingsDuration(3), 9);
		assert.equal(talents.lightCloakRechargeRate(1), 0.25);
		assert.equal(talents.lightCloakRechargeRate(3), 0.75);
		assert.equal(talents.lightCloakArtifactBonus(1), 0.07);
		assert.equal(talents.lightCloakArtifactBonus(2), 0.13);
		assert.equal(talents.lightCloakArtifactBonus(3), 0.2);
		assert.equal(talents.allyWarpRange(1), 2);
		assert.equal(talents.allyWarpRange(3), 6);
		assert.equal(talents.SEER_SHOT_COOLDOWN, 20);
		assert.equal(talents.seerShotDuration(1), 5);
		assert.equal(talents.seerShotDuration(3), 15);
	});

	check('hunger runtime dispatch matches the direct transition exactly', () => {
		for (const state of [initial({ hunger: 290 }), initial({ hunger: 440, hp: 20 }), initial({ hunger: 450, hp: 20, maxHp: 20 })]) {
			const direct = advanceHunger(state);
			const routed = runHungerStep(state);
			assert.deepEqual(routed.state, direct.state);
			assert.deepEqual(routed.events, direct.events);
		}
	});
	check('hunger transition is immutable and warns once at 300', () => {
		const input = Object.freeze(initial({ hunger: 290 }));
		const result = advanceHunger(input);
		assert.equal(input.hunger, 290);
		assert.equal(result.state.hunger, 300);
		assert.deepEqual(result.events, [{ type: 'hungry' }]);
		assert.deepEqual(advanceHunger(result.state).events, []);
	});
	check('crossing 450 fires starving + an immediate 1 damage, matching hero.damage(1,this)', () => {
		assert.deepEqual(advanceHunger(initial({ hunger: 280 })).events, []);
		const result = advanceHunger(initial({ hunger: 440, hp: 20 }));
		assert.deepEqual(result.events, [{ type: 'starving' }, { type: 'starvation-damage', damage: 1 }]);
		assert.equal(result.state.hp, 19);
		assert.equal(result.state.hunger, 450);
	});
	check('once starving, level freezes and partialDamage accrues STEP*HT/1000 per turn (Hunger.act isStarving branch)', () => {
		let state = initial({ hunger: 450, hp: 20, maxHp: 20 });
		for (let i = 0; i < 5; i++) {
			const result = advanceHunger(state);
			assert.deepEqual(result.events, []);
			state = result.state;
		}
		assert.equal(state.hunger, 450);
		assert.equal(state.hp, 20);
		assert.ok(Math.abs(state.partialDamage - 1) < 1e-9);
		const result = advanceHunger(state);
		assert.deepEqual(result.events, [{ type: 'starvation-damage', damage: 1 }]);
		assert.equal(result.state.hp, 19);
		assert.ok(Math.abs(result.state.partialDamage - 0.2) < 1e-9);
	});
	check('high max HP can deal multiple damage per turn, and death follows the damage event', () => {
		const result = advanceHunger(initial({ hunger: 450, hp: 2, maxHp: 250 }));
		assert.equal(result.state.hp, 0);
		assert.deepEqual(result.events, [{ type: 'starvation-damage', damage: 2 }, { type: 'starvation-death' }]);
	});
	check('feeding remains a caller decision; partialDamage is untouched while not starving', () => {
		const result = advanceHunger(initial({ hunger: 0, partialDamage: 0.7 }));
		assert.equal(result.state.partialDamage, 0.7);
		assert.equal(result.state.hunger, 10);
		assert.deepEqual(result.events, []);
	});
	check('no actor runs when empty or already game over', () => {
		const ports = { scheduler: new Scheduler(), isGameOver: () => false,
			takeMonsterTurn: () => assert.fail('unexpected actor') };
		assert.equal(runUntilHeroInput(ports), 'empty');
		assert.equal(runUntilHeroInput({ ...ports, isGameOver: () => true }), 'game-over');
	});
	check('real scheduler preserves speed and stops before spending the hero turn', () => {
		const scheduler = new Scheduler();
		const monster = { isHero: false, speed: 2 };
		const hero = { isHero: true };
		scheduler.add(monster, 0);
		scheduler.add(hero, 0.75);
		let actions = 0;
		assert.equal(runUntilHeroInput({ scheduler, isGameOver: () => false,
			takeMonsterTurn: (actor) => { assert.equal(actor, monster); actions++; } }), 'hero-input');
		assert.equal(actions, 2);
		assert.equal(scheduler.peek(), hero);
		assert.equal(scheduler.timeOf(hero), 0.75);
	});
	check('monster turn hooks run after each actor action', () => {
		const scheduler = new Scheduler();
		const monster = { isHero: false, speed: 2 };
		const hero = { isHero: true };
		scheduler.add(monster, 0);
		scheduler.add(hero, 0.75);
		let after = 0;
		assert.equal(runUntilHeroInput({ scheduler, isGameOver: () => false,
			takeMonsterTurn: () => {}, afterMonsterTurn: (actor) => { assert.equal(actor, monster); after++; },
		}), 'hero-input');
		assert.equal(after, 2);
	});
	check('game-over is checked on the next iteration, after the existing spend', () => {
		let over = false;
		const trace = [];
		assert.equal(runUntilHeroInput({
			scheduler: { peek: () => ({ isHero: false }), spend: (cost) => trace.push(cost) },
			isGameOver: () => over,
			takeMonsterTurn: () => { trace.push('act'); over = true; },
		}), 'game-over');
		assert.deepEqual(trace, ['act', 1]);
	});
	check('actor removal keeps the scheduler current-entry spending behaviour', () => {
		const scheduler = new Scheduler();
		const monster = { isHero: false };
		const hero = { isHero: true };
		scheduler.add(monster);
		scheduler.add(hero);
		runUntilHeroInput({ scheduler, isGameOver: () => false,
			takeMonsterTurn: (actor) => scheduler.remove(actor) });
		assert.equal(scheduler.timeOf(hero), 1);
	});
	check('iteration bound is explicit and does not manufacture a hero turn', () => {
		let actions = 0;
		assert.equal(runUntilHeroInput({
			scheduler: { peek: () => ({ isHero: false }), spend: () => {} },
			isGameOver: () => false, takeMonsterTurn: () => actions++,
		}), 'iteration-limit');
		assert.equal(actions, 1000);
	});
	check('adapter reads replacement state and writes it before presenting events', () => {
		let state = initial();
		let ready = 0;
		const scheduler = new Scheduler();
		const events = [];
		const adapter = new SceneSimulationAdapter({ scheduler, isGameOver: () => false,
			takeMonsterTurn: () => assert.fail('unexpected actor'), awaitHeroInput: () => ready++,
			readHunger: () => state, writeHunger: (next) => { state = next; },
			presentHungerEvent: (event) => { assert.equal(state.hp, 0); events.push(event.type); },
		});
		adapter.hungerStep();
		state = initial({ hunger: 440, hp: 1 }); // e.g. state after loading, one turn from crossing into starving
		adapter.hungerStep();
		assert.deepEqual(events, ['starving', 'starvation-damage', 'starvation-death']);
		assert.equal(adapter.runTurns(), 'empty');
		assert.equal(ready, 0);
		scheduler.add({ isHero: true });
		assert.equal(adapter.runTurns(), 'hero-input');
		assert.equal(ready, 1);
		scheduler.clear(); // entering a floor reuses the scheduler instance
		scheduler.add({ isHero: true });
		adapter.runTurns();
		assert.equal(ready, 2);
	});
	verifyMovement(require, check);
	check('extracted boss planners preserve deterministic Goo, Rat King, DM-300, and Yog rules', () => {
		const random = { int: (min) => min, chance: () => true };
		const hero = { x: 4, y: 4, hp: 20, maxHp: 20 };
		const goo = { x: 3, y: 4, hp: 100, maxHp: 100, pumped: 0 };
		const attacks = [];
		const messages = [];
		const gooContext = {
			hero, inWater: () => false, strongerBosses: false,
			stats: () => ({ accuracy: 10, damage: [2, 4] }),
			attack: (attacker, defender) => attacks.push({ attacker, defender }),
			showHeal: () => assert.fail('dry Goo must not heal'), say: (message) => messages.push(message), random,
			messages: { slam: 'slam', pump: 'pump', pumpMore: 'pump-more' },
		};
		takeGooTurn(goo, gooContext); takeGooTurn(goo, gooContext); takeGooTurn(goo, gooContext);
		assert.equal(goo.pumped, 0);
		assert.equal(attacks.length, 1);
		assert.deepEqual(attacks[0].attacker.damage, [6, 12]);
		assert.equal(attacks[0].attacker.accuracy, 20);
		assert.deepEqual(messages, ['pump', 'pump-more', 'slam']);
		assert.deepEqual(planRatKingWave(0, 300, false, random), { adds: ['ghoul'], nextSummonsMade: 1, announcement: 'wave_1' });
		assert.deepEqual(ratKingP1Summon(8, true, random), 'golem');
		assert.deepEqual(planRatKingWave(12, 150, true, random), { adds: ['warlock', 'monk', 'ghoul', 'ghoul'], nextSummonsMade: 16, announcement: 'wave_3' });
		assert.equal(chooseDM300Ability(0, random), 'vent');
		assert.equal(chooseDM300Ability(2, random), 'rockfall');
		// Java's weighted repeat rule, pinned exactly: fresh is 50/50, a repeat lands
		// only on the 1-in-4 roll, a switch on the other three.
		const cycle = (last, rolls) => { let i = 0; return rolls.map(() => chooseDM300Ability(last, { int: () => rolls[i++] })); };
		assert.deepEqual(cycle(0, [0, 1]), ['vent', 'rockfall']);
		assert.deepEqual(cycle(1, [0, 1, 2, 3]), ['vent', 'rockfall', 'rockfall', 'rockfall']);
		assert.deepEqual(cycle(2, [0, 1, 2, 3]), ['rockfall', 'vent', 'vent', 'vent']);
		assert.deepEqual(dm300VentPath({ x: 0, y: 0 }, { x: 3, y: 3 }, (x, y) => !(x === 2 && y === 2)), [{ x: 1, y: 1 }]);
		const rockfall = planDM300Rockfall({ x: 3, y: 3 }, { x: 0, y: 0 }, 7, 7, () => true, random);
		assert.deepEqual(rockfall.safe, { x: 2, y: 2 });
		assert.equal(rockfall.cells.length, 48);
		const yog = aimYogDeathGaze({ width: 9, height: 9, hero: { x: 4, y: 4 }, yog: { x: 0, y: 0 }, maxHp: 400, hp: 400,
			neighbours: [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]],
			index: (x, y) => y * 9 + x, passable: () => true, trace: (from, to) => {
				const cells = []; let x = from.x, y = from.y;
				while (x !== to.x || y !== to.y) { cells.push({ x, y }); x += Math.sign(to.x - x); y += Math.sign(to.y - y); }
				cells.push({ x, y }); return cells;
			}, random });
		assert.deepEqual(yog, [40]);
	});
	check('tengu ability cadence matches Java targetAbilityUses and catch-up cooldown', () => {
		// Tengu.targetAbilityUses(): 1 base, +2 per jump, +2 more for jumps 3 and 4.
		assert.deepEqual([0, 1, 2, 3, 4, 5].map(tenguTargetAbilityUses), [1, 3, 5, 8, 11, 14]);
		// Phase 1 (HP > HT/2) never draws, never casts, and leaves the cooldown untouched.
		let draws = 0;
		let step = stepTenguAbility({ hp: 101, maxHp: 200, cooldown: 2, used: 0, arenaJumps: 0, strongerBosses: false },
			() => { draws++; return 4; });
		assert.equal(step.ready, false); assert.equal(step.cooldown, 2); assert.equal(draws, 0);
		// Phase 2 starts at cooldown 2: one waiting turn (2->1), then a cast (1->0).
		step = stepTenguAbility({ hp: 100, maxHp: 200, cooldown: 2, used: 0, arenaJumps: 0, strongerBosses: false },
			() => { draws++; return 4; });
		assert.equal(step.ready, false); assert.equal(step.cooldown, 1); assert.equal(draws, 0);
		step = stepTenguAbility({ hp: 100, maxHp: 200, cooldown: 1, used: 0, arenaJumps: 0, strongerBosses: false },
			() => { draws++; return 4; });
		assert.equal(step.ready, true); assert.equal(step.cooldown, 0); assert.equal(draws, 0);
		// After a cast the cooldown sits at 0; the next turn draws the real IntRange(1,4).
		step = stepTenguAbility({ hp: 100, maxHp: 200, cooldown: 0, used: 0, arenaJumps: 0, strongerBosses: false }, () => 3);
		assert.equal(step.ready, false); assert.equal(step.cooldown, 3); assert.equal(step.target, 1);
		// The cast budget scales with arena jumps, so a two-jump fight stops at five casts.
		assert.equal(stepTenguAbility({ hp: 100, maxHp: 200, cooldown: 1, used: 5, arenaJumps: 2, strongerBosses: false }, () => 1).ready, false);
		assert.equal(stepTenguAbility({ hp: 100, maxHp: 200, cooldown: 1, used: 4, arenaJumps: 2, strongerBosses: false }, () => 1).ready, true);
		// 3+ behind: pinned to every other turn (cooldown forced to 1), no draw.
		const lag3 = stepTenguAbility({ hp: 100, maxHp: 200, cooldown: 0, used: 2, arenaJumps: 2, strongerBosses: false },
			() => { assert.fail('3-behind must not draw'); });
		assert.equal(lag3.cooldown, 1); assert.equal(lag3.ready, false); assert.equal(lag3.behind, 3);
		// 4+ behind, normal rules: cast immediately, no draw.
		const lag4 = stepTenguAbility({ hp: 100, maxHp: 200, cooldown: 2, used: 1, arenaJumps: 2, strongerBosses: false },
			() => { assert.fail('4-behind must not draw'); });
		assert.equal(lag4.cooldown, 0); assert.equal(lag4.ready, true);
		// 4+ behind, bosses challenge: the instant branch is skipped, so it paces like 3-behind.
		const lag4s = stepTenguAbility({ hp: 100, maxHp: 200, cooldown: 0, used: 1, arenaJumps: 2, strongerBosses: true },
			() => { assert.fail('challenge 4-behind must not draw either'); });
		assert.equal(lag4s.cooldown, 1); assert.equal(lag4s.ready, false);
		// Dead Tengu is inert.
		assert.equal(stepTenguAbility({ hp: 0, maxHp: 200, cooldown: 0, used: 0, arenaJumps: 0, strongerBosses: false }, () => 1).ready, false);
		// Ability turn cost (`Tengu.useAbility()`'s trailing spend, `Actor.TICK = 1`): normal mode
		// costs 2 ticks, or 1 when 4+ behind; the bosses challenge costs 1 tick, or 0 when 4+ behind.
		assert.deepEqual(
			[[false, 0], [false, 1], [false, 3], [false, 4], [false, 8], [true, 1], [true, 3], [true, 4], [true, 8]]
				.map(([stronger, behind]) => tenguAbilityCost(stronger, behind)),
			[2, 2, 2, 1, 1, 1, 1, 0, 0],
		);
	});
	check('disintegration plans the Java range, hit bonus, terrain bonus, and flammable cells', () => {
		const cells = Array.from({ length: 10 }, () => ({ solid: false, flammable: false, victim: false, eligibleVictim: false }));
		cells[1].victim = cells[1].eligibleVictim = true;
		cells[2].solid = true;
		cells[3].flammable = true;
		cells[4].victim = cells[4].eligibleVictim = true;
		cells[5].victim = true; // an NPC/passive target: present, but not an eligible hit
		const plan = planDisintegration(1, cells);
		assert.equal(plan.maxDistance, 8);
		assert.deepEqual(plan.victimCells, [1, 4]);
		assert.deepEqual(plan.flammableCells, [3]);
		assert.equal(plan.terrainBonus, 1);
		assert.equal(plan.effectiveLevel, 3); // wand 1 + one extra hit + one terrain level
	});
	check('wand categories centralize identity and category-specific formulas', () => {
		const classes = [
			['WandOfMagicMissile', 'magicMissile'], ['WandOfFrost', 'frost'], ['WandOfFireblast', 'fireblast'],
			['WandOfLightning', 'lightning'], ['WandOfCorrosion', 'corrosion'], ['WandOfCorruption', 'corruption'],
			['WandOfDisintegration', 'disintegration'], ['WandOfBlastWave', 'blastWave'],
			['WandOfLivingEarth', 'livingEarth'], ['WandOfPrismaticLight', 'prismaticLight'],
			['WandOfRegrowth', 'regrowth'], ['WandOfTransfusion', 'transfusion'], ['WandOfWarding', 'warding'],
		];
		for (const [source, type] of classes) assert.equal(wandTypeFromSource(source), type);
		assert.equal(wandTypeFromSource(undefined), null);
		assert.equal(wandTypeFromSource('WandOfNotARealWand'), null);
		assert.equal(wandTargetRange('disintegration', 3), 12);
		assert.equal(wandTargetRange('frost', 9), 6);
		assert.equal(wandChargesPerCast('fireblast', 4), 2);
		assert.equal(wandChargesPerCast('magicMissile', 4), 1);
	});
	verifyHeroTurn(require, check);
	verifyCombat(require, check);
	check('Freezing escalates capped Chill into the shared Frost immobilization', () => {
		const { applyChillFreeze, BUFF_DURATION } = require('./simulation/buffs');
		const chilled = applyChillFreeze({ burning: 4 });
		assert.equal(chilled.frozen, false);
		assert.equal(chilled.buffs.chill, BUFF_DURATION.chill);
		assert.equal(chilled.buffs.burning, 4);
		const frozen = applyChillFreeze({ chill: BUFF_DURATION.chill, paralysis: 1 });
		assert.equal(frozen.frozen, true);
		assert.equal(frozen.buffs.chill, undefined);
		assert.equal(frozen.buffs.frost, BUFF_DURATION.frost);
		assert.equal(frozen.buffs.paralysis, BUFF_DURATION.frost);
	});
	verifyHeroActions(require, check);
	verifySearch(require, check);
	verifyCone(require, check);
	verifyRipperLeap(require, check);
	verifySuccubusBlink(require, check);
	verifyArmorAbilities(require, check);
	console.log(`${passed} simulation checks passed.`);
} finally {
	// Only the fresh directory returned by mkdtempSync above is removed.
	rmSync(output, { recursive: true, force: true });
}
