import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { dm300ChargeEndTurns, dm300SuperchargeEntry, dm300SuperchargeThreshold } from '../src/simulation/dm300Boss';

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

// Java's `DM300.supercharge()` spends 2 ticks under STRONGER_BOSSES and 3 otherwise.
// This runs during a hero damage action, so the scene must postpone DM300 specifically.
const superchargeScene = readFileSync(join(process.cwd(), 'src/scenes/dungeon/combatResolution.ts'), 'utf8');
const supercharge = /dm300Supercharge\(this: DungeonScene, dm300: Creature\): void \{[\s\S]*?\n\t\},/.exec(superchargeScene);
assert.ok(supercharge, 'scene supercharge adapter still exists');
assert.ok(supercharge[0].includes("this.scheduler.postpone(dm300, isChallengeEnabled('stronger_bosses') ? 2 : 3)"),
	'DM300 receives Java\'s challenge-specific actor cooldown at charge activation');

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

console.log('dm300 phase seam: all checks pass');
