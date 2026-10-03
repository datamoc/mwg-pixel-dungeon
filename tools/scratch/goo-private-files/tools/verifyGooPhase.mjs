import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

// Pins the Goo pump-up decision seam (`src/simulation/gooBoss.ts`) against
// `Goo.doAttack()` (actors/mobs/Goo.java 178-225, tag `v3.3.8`) and pins
// `takeGooTurn` to the seam: the turn must delegate, never a second copy.
const source = new URL('../src/simulation/gooBoss.ts', import.meta.url);
const output = mkdtempSync(join(tmpdir(), 'spd-goo-phase-'));
writeFileSync(join(output, 'package.json'), '{"type":"commonjs"}');
writeFileSync(join(output, 'gooBoss.cjs'), ts.transpileModule(readFileSync(source, 'utf8'), {
	compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText);
const { gooEnraged, gooPumpChance, gooPumpTarget, gooSlamReady, gooChargeStep, takeGooTurn } = createRequire(import.meta.url)(join(output, 'gooBoss.cjs'));

// Enrage gate `HP*2 <= HT`, boundary included.
assert.equal(gooEnraged(50, 100), true);
assert.equal(gooEnraged(51, 100), false);

// Pump roll `Random.Int(bound) == 0`, bound 2 enraged (1/2) / 5 healthy (1/5).
assert.equal(gooPumpChance(true), 0.5);
assert.equal(gooPumpChance(false), 0.2);

// Pump target: straight to the second charge turn on the bosses challenge.
assert.equal(gooPumpTarget(true), 2);
assert.equal(gooPumpTarget(false), 1);

// Slam discharges at 2+, the first charge turn steps on at exactly 1.
assert.equal(gooSlamReady(2), true);
assert.equal(gooSlamReady(1), false);
assert.equal(gooChargeStep(1), true);
assert.equal(gooChargeStep(0), false);
assert.equal(gooChargeStep(2), false);

// `Goo.doAttack()` spends the gated action cost only on the STRONGER_BOSSES pump.
{
	const goo = { x: 1, y: 1, hp: 100, maxHp: 100, pumped: 0 };
	let challengePumpCosts = 0;
	const context = {
		hero: { x: 2, y: 1, hp: 20, maxHp: 20 }, inWater: () => false, strongerBosses: true,
		stats: () => ({ accuracy: 10, damage: [1, 2] }), attack: () => assert.fail('pump roll must not attack'),
		showHeal: () => {}, say: () => {}, foulBossChallenge: () => {}, noteBossScore: () => {},
		onChallengePump: () => challengePumpCosts++, random: { chance: () => true },
		messages: { slam: 'slam', pump: 'pump', pumpMore: 'pump-more' },
	};
	takeGooTurn(goo, context);
	assert.equal(goo.pumped, 2);
	assert.equal(challengePumpCosts, 1, 'challenge pump signals the Java spend exactly once');
	goo.pumped = 0;
	context.strongerBosses = false;
	takeGooTurn(goo, context);
	assert.equal(goo.pumped, 1);
	assert.equal(challengePumpCosts, 1, 'ordinary pump keeps its one-turn default cost');
}

// `takeGooTurn` runs these predicates, not a second copy of the arithmetic.
const turn = readFileSync(source, 'utf8').split('export function takeGooTurn')[1];
for (const name of ['gooEnraged', 'gooPumpChance', 'gooPumpTarget', 'gooSlamReady', 'gooChargeStep']) {
	assert.ok(turn.includes(name), `takeGooTurn delegates to ${name}`);
}
assert.ok(!turn.includes('enraged ? 0.5 : 0.2'), 'no duplicated pump chance remains in the turn');
assert.ok(!turn.includes('hp * 2 <='), 'no duplicated enrage gate remains in the turn');

//`Goo.act()` water recovery precedes the pump state machine and reduces LockedFloor by the increment rolled.
{
	const goo = { x: 1, y: 1, hp: 8, maxHp: 10, gooHealInc: 2, pumped: 1 };
	const healed = [], lockTime = [], messages = [];
	takeGooTurn(goo, {
		hero: { x: 2, y: 1, hp: 20, maxHp: 20 }, inWater: () => true, strongerBosses: true,
		stats: () => ({ accuracy: 10, damage: [1, 2] }), attack: () => assert.fail('first pump turn must not attack'),
		showHeal: (target, amount) => healed.push([target, amount]), onWaterHeal: (amount) => lockTime.push(amount),
		say: (message) => messages.push(message), foulBossChallenge: () => {}, noteBossScore: () => {},
		random: { int: (min) => min, chance: () => true },
		messages: { slam: 'slam', pump: 'pump', pumpMore: 'pump-more' },
	});
	assert.equal(goo.hp, 10);
	assert.equal(goo.gooHealInc, 1, 'full HP resets the next increment');
	assert.deepEqual(healed, [[goo, 2]], 'visible heal amount is actual HP gained');
	assert.deepEqual(lockTime, [2], 'LockedFloor removes the pre-cap heal increment');
	assert.equal(goo.pumped, 2);
}

const bossScene = readFileSync(new URL('../src/scenes/dungeon/bosses/bossLogic.ts', import.meta.url), 'utf8');
assert.match(bossScene,
	/showHeal: \(target, amount\) => \{ if \(this\.fov\.isVisible\(target\.x, target\.y\)\) this\.showHeal\(target, amount\); \}/,
	'Goo water-heal status is shown only in hero FOV, like Java Goo.showStatusWithIcon');
assert.match(bossScene,
	/onChallengePump: \(\) => \{[\s\S]*?pendingMonsterTurnCost = Math\.min\(3, Math\.max\(1, Math\.ceil\(this\.getAttackTurnCostMod\(\)\)\)\);/,
	'Goo challenge pump maps Java gated spend through the scene scheduler');

// Optional Java runtime trace: actual Goo.doAttack() calls with fixed Java RNG seeds exercise
// the same enrage/pump predicates and challenge target used by takeGooTurn().
if (process.argv[2]) {
	const lines = readFileSync(process.argv[2], 'utf8').trim().split(/\r?\n/).map((line) => JSON.parse(line));
	assert.equal(lines[0].tool, 'parityGooPhase-java');
	assert.equal(lines.at(-1).cases, 64);
	const rows = lines.filter((row) => row.kind === 'pump');
	assert.equal(rows.length, 64);
	for (const row of rows) {
		const enraged = gooEnraged(row.hp, 400);
		const bound = enraged ? 2 : 5;
		assert.equal(row.bound, bound, `Java Random.Int bound at HP ${row.hp}`);
		assert.ok(row.roll >= 0 && row.roll < bound, `Java roll is inside bound ${bound}`);
		assert.equal(gooPumpChance(enraged), 1 / bound);
		const startsPump = row.roll === 0;
		assert.equal(row.pumped, startsPump ? gooPumpTarget(row.stronger) : 0,
			`Java pump target at seed ${row.seed}, HP ${row.hp}, stronger=${row.stronger}`);
		assert.equal(row.attackCalls, startsPump ? 0 : 1, 'only a failed pump roll calls the attack path');
		assert.equal(row.pumpWarns, startsPump ? gooPumpTarget(row.stronger) : 0,
			'Java warns at the charge distance selected by the challenge');
		assert.equal(row.returned, startsPump, 'pump turn spends immediately; visible attack animation yields');
		assert.ok(Math.abs(row.spent - (startsPump ? (row.stronger ? 3 : 1) : 0)) < 0.001,
			'Java challenge pump uses the clamped one-to-three turn spend');
	}
	console.log('Java v3.3.8 Goo.doAttack trace: enrage, pump probability/target and challenge spend match');
}

console.log('goo phase seam: all checks pass');
