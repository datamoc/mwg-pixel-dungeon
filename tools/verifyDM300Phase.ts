import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { dm300ChargeEndTurns, dm300PylonsFinished, dm300PylonEnergySeeds, dm300SuperchargeEntry, dm300SuperchargeThreshold, dm300TunnelMove, planDM300Tunnel } from '../src/simulation/dm300Boss';
import { planRatKingWave } from '../src/simulation/ratKingBoss';

// Pins the DM300 supercharge-entry seam (`src/simulation/dm300Boss.ts`) against
// `DM300.damage()` (actors/mobs/DM300.java 496-506, tag `v3.3.8`) and pins both
// damage call sites to the seam: `runBossDamageHooks` (attackSeams.ts) and the
// dispatch tail (combatResolution.ts) must delegate, never a second copy.
//
// Run: esbuild tools/verifyDM300Phase.ts --bundle --platform=node --format=esm \
//   --outfile=tools/scratch/verifyDM300Phase.mjs && node tools/scratch/verifyDM300Phase.mjs

// Thresholds: HT/3*(2-pylons) normally, HT/4*(3-pylons) on the challenge.
assert.equal(dm300SuperchargeThreshold(300, 0, false), 200);
assert.equal(dm300SuperchargeThreshold(300, 1, false), 100);
assert.equal(dm300SuperchargeThreshold(300, 2, false), 0);
assert.equal(dm300SuperchargeThreshold(400, 0, true), 300);
assert.equal(dm300SuperchargeThreshold(400, 2, true), 100);
assert.equal(dm300SuperchargeThreshold(400, 3, true), 0);

// Entry: uncharged, live threshold, HP at or under it (`HP <= threshold && threshold > 0`).
assert.equal(dm300SuperchargeEntry(false, 200, 200), true);
assert.equal(dm300SuperchargeEntry(false, 201, 200), false);
assert.equal(dm300SuperchargeEntry(true, 0, 200), false, 'no re-entry while charged');
assert.equal(dm300SuperchargeEntry(undefined, 200, 200), true, 'fresh DM300 has no flag set');
assert.equal(dm300SuperchargeEntry(false, 50, 0), false, 'spent thresholds stay shut');

// Charge end: `Math.min(turnsSinceLastAbility, MIN_COOLDOWN-3)` with MIN_COOLDOWN 5.
assert.equal(dm300ChargeEndTurns(9), 2);
assert.equal(dm300ChargeEndTurns(2), 2);
assert.equal(dm300ChargeEndTurns(-4), -4, 'negative counters pass through untouched');

// `DM300.totalPylonsToActivate()`/`loseSupercharge()` (`DM300.java`, tag `v3.3.8`).
assert.equal(dm300PylonsFinished(1, false), false);
assert.equal(dm300PylonsFinished(2, false), true);
assert.equal(dm300PylonsFinished(2, true), false);
assert.equal(dm300PylonsFinished(3, true), true);

// CavesBossLevel.activatePylon() scans from (mainArena.top - 1) * width = row 13.
{
	const types = new Map<number, 'water' | 'inactiveTrap' | 'sign'>([
		[12 * 33 + 2, 'water'], [13 * 33 + 2, 'inactiveTrap'], [14 * 33 + 2, 'water'],
		[15 * 33 + 2, 'sign'], [16 * 33 + 2, 'inactiveTrap'],
	]);
	assert.deepEqual(dm300PylonEnergySeeds(33, 42, (cell) => types.get(cell) ?? 'other'),
		[13 * 33 + 2, 14 * 33 + 2, 15 * 33 + 2, 16 * 33 + 2],
		'Java directly seeds water, inactive traps and custom-deco/sign cells from row 13 onward');
}

// Java's `DM300.supercharge()` spends 2 ticks under STRONGER_BOSSES and 3 otherwise.
// This runs during a hero damage action, so the scene must postpone DM300 specifically.
const superchargeScene = readFileSync(join(process.cwd(), 'src/scenes/dungeon/combatResolution.ts'), 'utf8');
const supercharge = /dm300Supercharge\(this: DungeonScene, dm300: Creature\): void \{[\s\S]*?\n\t\},/.exec(superchargeScene);
assert.ok(supercharge, 'scene supercharge adapter still exists');
assert.ok(supercharge[0].includes("this.scheduler.postpone(dm300, isChallengeEnabled('stronger_bosses') ? 2 : 3)"),
	'DM300 receives Java\'s challenge-specific actor cooldown at charge activation');
assert.ok(supercharge[0].includes('dm300PylonEnergySeeds('), 'scene charge setup delegates direct PylonEnergy seed-cell selection');

// DwarfKing.act() passes challenge ? 2 : 3 to summonSubject for P1/P3 arrivals.
// The port immediately exposes the add, but must defer its first scheduled turn by that delay.
const kingScene = readFileSync(join(process.cwd(), 'src/scenes/dungeon/bosses/bossLogic.ts'), 'utf8');
assert.equal((kingScene.match(/this\.kingP1Summon\([^\n]+challenge\), false, challenge \? 2 : 3\)/g) ?? []).length, 2,
	'P1 and P3 servants both receive Java\'s challenge-specific arrival delay');
assert.ok(kingScene.includes('arrivalDelay?: number'), 'summoned servant accepts a Java arrival delay');
assert.ok(kingScene.includes('false, undefined, arrivalDelay)'), 'summoned servant first action waits for the Java delay');

const noRandomChoice = { float: () => 0, normalRange: () => 0, range: () => 0, int: () => 0, chance: () => false };
assert.equal(planRatKingWave(0, 300, false, noRandomChoice)?.arrivalDelay, 3, 'normal first wave uses Java delay 3');
assert.equal(planRatKingWave(4, 200, false, noRandomChoice)?.arrivalDelay, 3, 'normal second wave uses Java delay 3');
assert.equal(planRatKingWave(8, 100, false, noRandomChoice)?.arrivalDelay, 4, 'normal final wave uses Java delay 4');
assert.equal(planRatKingWave(0, 300, true, noRandomChoice)?.arrivalDelay, 3, 'challenge first wave uses Java delay 3');
assert.equal(planRatKingWave(6, 300, true, noRandomChoice)?.arrivalDelay, 3, 'challenge second wave uses Java delay 3');
assert.equal(planRatKingWave(12, 150, true, noRandomChoice)?.arrivalDelay, 3, 'challenge mixed wave uses Java delay 3');
assert.equal(planRatKingWave(16, 150, true, noRandomChoice)?.arrivalDelay, 3, 'challenge golem wave uses Java delay 3');
assert.ok(kingScene.includes('plan.arrivalDelay'), 'phase-two servants use their wave plan arrival delay');

// Both call sites run the seam, not a second copy of the arithmetic (paths resolve
// from the repo root, which is the documented working directory for the run line).
for (const rel of ['src/scenes/dungeon/attackSeams.ts', 'src/scenes/dungeon/combatResolution.ts']) {
	const site = readFileSync(join(process.cwd(), rel), 'utf8');
	assert.ok(site.includes('dm300SuperchargeThreshold'), `${rel} delegates the threshold`);
	assert.ok(site.includes('dm300SuperchargeEntry'), `${rel} delegates the entry`);
	assert.ok(!site.includes('maxHp / 4 * (3 - activated)'), `no duplicated threshold in ${rel}`);
	if (rel.endsWith('combatResolution.ts')) {
		assert.ok(site.includes('dm300ChargeEndTurns'), 'dispatch tail delegates the charge-end clamp');
		assert.ok(!site.includes('Math.min(dm300.dmAbilityTurns'), 'no duplicated clamp remains in the tail');
	} else {
		assert.ok(!site.includes('dm300ChargeEndTurns'), 'charge end lives only in the dispatch tail');
	}
}
assert.ok(readFileSync(join(process.cwd(), 'src/scenes/dungeon/combatResolution.ts'), 'utf8')
	.includes('dm300PylonsFinished(dm300.dmPylonsActivated ?? 0, isChallengeEnabled(\'stronger_bosses\'))'),
	'final charge loss delegates Java totalPylonsToActivate to the shared finale gate');
assert.ok(readFileSync(join(process.cwd(), 'src/scenes/dungeon/coreSpawnTiles.ts'), 'utf8')
	.includes("creature.kind === 'dm300' && !creature.dmSupercharged && dm300PylonsFinished"),
	'final-pylon bleed state is restored after a save/load');
assert.ok(readFileSync(join(process.cwd(), 'src/scenes/dungeon/deathSaveRefresh.ts'), 'utf8')
	.includes('if (this.currentBoss && (boss ?? null) !== this.currentBoss)'),
	'initial restored boss assignment does not clear the saved transition latch');

// Tunnelling (`DM300.getCloser()`, DM300.java 603-651): digs the 3x3's walls toward a target, skipping
// the gate band (y < 14, x in [12,21)) and anything outside diggableArea (2..31 x 11..40).
{
	const walls = new Set<string>();
	for (let x = 0; x < 40; x++) for (let y = 0; y < 50; y++) walls.add(x + ',' + y);
	const none = () => false;
	const wall = (x: number, y: number) => walls.has(x + ',' + y);
	const plan = planDM300Tunnel({ x: 10, y: 20 }, { x: 10, y: 30 }, { occupied: none, isWall: wall });
	assert.ok(plan, 'a closer neighbour exists');
	assert.equal(plan.dig.length, 9, 'all nine 3x3 walls dug inside diggableArea');
	assert.deepEqual(plan.dig[0], { x: 9, y: 19 }, 'NEIGHBOURS9 row-major order');
	const edge = planDM300Tunnel({ x: 2, y: 20 }, { x: 2, y: 30 }, { occupied: none, isWall: wall });
	assert.ok(edge!.dig.every((c) => c.x >= 2), 'nothing dug left of diggableArea');
	assert.equal(edge!.dig.length, 6, 'the x=1 column is outside the arena');
	const gate = planDM300Tunnel({ x: 15, y: 14 }, { x: 15, y: 30 }, { occupied: none, isWall: wall });
	assert.ok(gate!.dig.every((c) => c.y >= 14 || c.x < 12 || c.x >= 21), 'gate band untouched');
	assert.equal(gate!.dig.length, 6, 'row y=13 inside the gate columns skipped');
	assert.equal(planDM300Tunnel({ x: 10, y: 20 }, { x: 10, y: 20 }, { occupied: none, isWall: wall }), null, 'on the target: no closer cell');
	assert.equal(planDM300Tunnel({ x: 10, y: 20 }, { x: 10, y: 30 }, { occupied: (x, y) => y > 20, isWall: wall }), null, 'every closer cell occupied');
	assert.deepEqual(dm300TunnelMove({ x: 10, y: 20 }, { x: 10, y: 30 }, { occupied: none, isOpenSpace: () => true }), { x: 10, y: 21 }, 'strictly closest step; ties go to the first in order');
	assert.equal(dm300TunnelMove({ x: 10, y: 20 }, { x: 10, y: 30 }, { occupied: none, isOpenSpace: () => false }), null, 'no open cell, no step');
}

console.log('dm300 phase seam: all checks pass');
