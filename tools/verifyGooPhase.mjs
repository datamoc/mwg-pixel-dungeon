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
const { gooAttackOozeProc, gooEnraged, gooPumpChance, gooPumpTarget, gooSlamReady, gooChargeStep, takeGooTurn } = createRequire(import.meta.url)(join(output, 'gooBoss.cjs'));

// Goo.attackProc(): `Random.Int(3) == 0` applies the 20-turn Ooze buff on landed hits.
assert.equal(gooAttackOozeProc(0), true);
assert.equal(gooAttackOozeProc(1), false);
assert.equal(gooAttackOozeProc(2), false);
const mobOnHit = readFileSync(new URL('../src/scenes/mobOnHit.ts', import.meta.url), 'utf8');
assert.match(mobOnHit, /attacker\.kind === 'goo' && gooAttackOozeProc\(Random\.int\(3\)\)/,
	'the production Goo hit proc uses the traced one-in-three predicate');

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

//`Goo.act()` water recovery precedes the pump state machine, shows the actual HP delta,
//and reduces LockedFloor by the increment rolled (not the HP capped at HT).
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
	assert.equal(goo.gooHealInc, 3, 'stronger bosses increments after the heal even when it reaches full HP');
	assert.deepEqual(healed, [[goo, 2]], 'visible heal amount is actual HP gained');
	assert.deepEqual(lockTime, [2], 'LockedFloor removes the pre-cap heal increment');
	assert.equal(goo.pumped, 2);
}

//`GooSprite.pumpUp(warnDist)` presentation fires on each charge transition with the new charge, and the primed slam fires the trigger hook before discharging so the scene still sees the charge.
{
	const goo = { x: 1, y: 1, hp: 100, maxHp: 100, pumped: 0 };
	const warns = [];
	let slammedAt = -1;
	const context = {
		hero: { x: 2, y: 1, hp: 20, maxHp: 20 }, inWater: () => false, strongerBosses: false,
		stats: () => ({ accuracy: 10, damage: [1, 2] }), attack: () => {},
		showHeal: () => {}, say: () => {}, foulBossChallenge: () => {}, noteBossScore: () => {},
		onPumpWarn: (warnDist) => warns.push(warnDist),
		onPumpSlam: () => { slammedAt = goo.pumped; },
		random: { chance: () => true },
		messages: { slam: 'slam', pump: 'pump', pumpMore: 'pump-more' },
	};
	takeGooTurn(goo, context);
	assert.equal(goo.pumped, 1);
	assert.deepEqual(warns, [1], 'a fresh pump warns at distance 1');
	takeGooTurn(goo, context);
	assert.equal(goo.pumped, 2);
	assert.deepEqual(warns, [1, 2], 'the first charge turn steps on and re-warns at 2');
	takeGooTurn(goo, context);
	assert.equal(slammedAt, 2, 'the slam hook fires before pumped zeroes');
	assert.equal(goo.pumped, 0);
}

const bossScene = readFileSync(new URL('../src/scenes/dungeon/bosses/bossLogic.ts', import.meta.url), 'utf8');
assert.match(bossScene,
	/showHeal: \(target, amount\) => \{ if \(this\.fov\.isVisible\(target\.x, target\.y\)\) this\.showHeal\(target, amount\); \}/,
	'Goo water-heal status is shown only in hero FOV, like Java Goo.showStatusWithIcon');
assert.match(bossScene,
	/onChallengePump: \(\) => \{[\s\S]*?pendingMonsterTurnCost = Math\.min\(3, Math\.max\(1, Math\.ceil\(this\.getAttackTurnCostMod\(\)\)\)\);/,
	'Goo challenge pump maps Java gated spend through the scene scheduler');
assert.match(bossScene,
	/onPumpWarn: \(warnDist\) => \{ runState\.audio\.cue\('chargeup', 0\.7, warnDist === 1 \? 0\.8 : 1\); \}/,
	'Goo pump-up plays CHARGEUP at Java warnDist == 1 ? 0.8 : 1 rate');
assert.match(bossScene,
	/onPumpSlam: \(\) => \{[\s\S]*?if \(this\.fov\.isVisible\(goo\.x, goo\.y\)\) return;[\s\S]*?spawnTrapSpecks\(this\.effectLayer, this\.effectBursts, cell\.x, cell\.y, 'elmo'\);/,
	'an unseen primed slam bursts Elmo over the warn cells');
assert.match(bossScene,
	/gooPumpWarnCells\(this: DungeonScene, creature: Creature\)/,
	'the aura sync reads Goo warn cells through a scene method');

// Optional Java runtime trace: actual Goo.doAttack() calls with fixed Java RNG seeds exercise
// the same enrage/pump predicates and challenge target used by takeGooTurn().
if (process.argv[2]) {
	const lines = readFileSync(process.argv[2], 'utf8').trim().split(/\r?\n/).map((line) => JSON.parse(line));
	assert.equal(lines[0].tool, 'parityGooPhase-java');
	assert.equal(lines.at(-1).cases, 116);
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
	const healRows = lines.filter((row) => row.kind === 'heal');
	assert.equal(healRows.length, 4);
	for (const row of healRows) {
		const goo = { x: 1, y: 1, hp: row.hpBefore, maxHp: 10, gooHealInc: row.healIncBefore, pumped: 0 };
		let lockLeft = 10;
		const shown = [];
		const context = {
			hero: { x: 2, y: 1, hp: 20, maxHp: 20 }, inWater: () => true, strongerBosses: row.stronger,
			stats: () => ({ accuracy: 10, damage: [1, 2] }), attack: () => {},
			showHeal: (_target, amount) => shown.push(amount), onWaterHeal: (amount) => { lockLeft -= amount; },
			say: () => {}, foulBossChallenge: () => {}, noteBossScore: () => {}, random: { chance: () => false },
			messages: { slam: 'slam', pump: 'pump', pumpMore: 'pump-more' },
		};
		takeGooTurn(goo, context);
		assert.equal(goo.hp, row.hpAfter, `Java water-heal HP at ${row.hpBefore}/${row.healIncBefore}`);
		assert.equal(goo.gooHealInc, row.healIncAfter, `Java healInc progression at ${row.hpBefore}/${row.healIncBefore}`);
		assert.equal(lockLeft, row.lockLeft, `Java LockedFloor reduction at ${row.hpBefore}/${row.healIncBefore}`);
		assert.equal(!row.badgeQualified, row.hpBefore < 10, 'Java water healing fouls the boss challenge badge');
		if (row.hpBefore < 10) {
			assert.equal(shown[0], Math.min(row.healIncBefore, 10 - row.hpBefore), 'port displays actual HP healed');
			assert.equal(Number(row.statusAmount), row.healIncBefore, 'Java displays the rolled heal increment');
		} else assert.deepEqual(shown, [], 'full HP does not display a heal');
		takeGooTurn(goo, context);
		assert.equal(goo.hp, row.hpAfterNext, `Java next water tick HP at ${row.hpBefore}/${row.healIncBefore}`);
		assert.equal(goo.gooHealInc, row.healIncAfterNext, `Java next-tick healInc reset at ${row.hpBefore}/${row.healIncBefore}`);
	}
	const slamRows = lines.filter((row) => row.kind === 'slam-roll');
	assert.equal(slamRows.length, 32);
	for (const row of slamRows) {
		const enraged = gooEnraged(row.hp, 400);
		const baseAccuracy = enraged ? 15 : 10;
		const baseDamage = enraged ? 12 : 8;
		let attack;
		let fouls = 0;
		let score = 0;
		const goo = { x: 1, y: 1, hp: row.hp, maxHp: 400, gooHealInc: 1, pumped: 2 };
		takeGooTurn(goo, {
			hero: { x: 2, y: 1, hp: 20, maxHp: 20 }, inWater: () => false, strongerBosses: row.stronger,
			stats: () => ({ accuracy: baseAccuracy, damage: [1, baseDamage] }), attack: (attacker) => { attack = attacker; },
			showHeal: () => {}, say: () => {}, foulBossChallenge: () => { fouls++; }, noteBossScore: (delta) => { score += delta; },
			random: { chance: () => assert.fail('a primed slam does not pump-roll') },
			messages: { slam: 'slam', pump: 'pump', pumpMore: 'pump-more' },
		});
		assert.equal(row.attackSkill, baseAccuracy * 2, `Java Goo.attackSkill() doubles at HP ${row.hp}`);
		assert.equal(row.minDamage, 3);
		assert.equal(row.maxDamage, baseDamage * 3, `Java Goo.damageRoll() triples the enraged range at HP ${row.hp}`);
		assert.equal(row.actualDamage, row.expectedDamage, `seeded Java NormalIntRange at seed ${row.seed}`);
		assert.ok(row.actualDamage >= row.minDamage && row.actualDamage <= row.maxDamage);
		assert.equal(row.pumpedAfter, 0, 'Java damageRoll consumes the pump');
		assert.equal(row.bossScore, -100, 'Java damageRoll scores one Goo slam penalty against the hero');
		assert.equal(row.badgeQualified, false, 'Java damageRoll fouls the boss challenge badge');
		assert.equal(attack.accuracy, row.attackSkill, 'the production slam uses Java doubled accuracy');
		assert.deepEqual(attack.damage, [row.minDamage, row.maxDamage], 'the production slam uses Java tripled damage bounds');
		assert.equal(goo.pumped, 0);
		assert.equal(fouls, 1);
		assert.equal(score, -100);
	}
	const attackProcRows = lines.filter((row) => row.kind === 'attack-proc');
	assert.equal(attackProcRows.length, 16);
	for (const row of attackProcRows) {
		assert.ok(row.roll >= 0 && row.roll < 3, `Java Goo.attackProc roll at seed ${row.seed}`);
		assert.equal(row.ooze, gooAttackOozeProc(row.roll), `Java Goo Ooze attach at seed ${row.seed}`);
		assert.equal(row.damage, 13, 'Goo.attackProc leaves shared attack damage unchanged');
	}
	console.log('Java v3.3.8 Goo traces: pump/enrage, water-heal state, amplified slam rolls and landed-hit Ooze chance match; heal text reports actual HP gained');
}

console.log('goo phase seam: all checks pass');
