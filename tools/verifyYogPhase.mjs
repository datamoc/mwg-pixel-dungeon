import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

// Pins the Yog phase-decision seam (`src/simulation/yogBoss.ts`) against
// `YogDzewa.damage()`/`processFistDeath()` (actors/mobs/YogDzewa.java 356-420, tag `v3.3.8`) and the
// Bright/Dark fist half-HP edges (actors/mobs/YogFist.java 528-540 and 598-610),
// and pins `yogDamageHook`/`brightDarkHalfHp` to the seam: the hooks must
// delegate, never a second copy of the arithmetic.
const source = new URL('../src/simulation/yogBoss.ts', import.meta.url);
const output = mkdtempSync(join(tmpdir(), 'spd-yog-phase-'));
writeFileSync(join(output, 'package.json'), '{"type":"commonjs"}');
writeFileSync(join(output, 'yogBoss.cjs'), ts.transpileModule(readFileSync(source, 'utf8'), {
	compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText);
const { yogPhaseStep, yogPhaseThreshold, yogPhase4Floor, yogPhaseAdvance, yogDamageResolution, fistHalfHpCrossed, yogFinalPhase } = createRequire(import.meta.url)(join(output, 'yogBoss.cjs'));

// Phase line `HT - 300*phase` as 0.3 of the live max (identical at Java's fixed 1000 HT).
assert.equal(yogPhaseStep(1000), 300);
assert.equal(yogPhaseThreshold(1, 1000), 700);
assert.equal(yogPhaseThreshold(2, 1000), 400);
assert.equal(yogPhaseThreshold(3, 1000), 100);
assert.equal(yogPhase4Floor(1000), 100);

// Advance below phase 4 at or under the line; never from dormancy.
assert.equal(yogPhaseAdvance(1, 700, 1000), true);
assert.equal(yogPhaseAdvance(1, 701, 1000), false);
assert.equal(yogPhaseAdvance(3, 100, 1000), true);
assert.equal(yogPhaseAdvance(4, 0, 1000), false);
assert.equal(yogPhaseAdvance(0, 0, 1000), false);

// `damage()` floors phase 4 at 100, then derives cooldown acceleration from the post-floor loss.
assert.deepEqual(yogDamageResolution(4, 150, 50, 1000), { hp: 100, hpLost: 50, advances: false });
assert.deepEqual(yogDamageResolution(1, 720, 670, 1000), { hp: 700, hpLost: 20, advances: true });
assert.deepEqual(yogDamageResolution(0, 1000, 900, 1000), { hp: 1000, hpLost: 0, advances: false });

// Fist half-HP edge `beforeHP > HT/2 && HP <= HT/2`.
assert.equal(fistHalfHpCrossed(600, 500, 1000), true);
assert.equal(fistHalfHpCrossed(500, 499, 1000), false, 'already at half: no crossing');
assert.equal(fistHalfHpCrossed(600, 501, 1000), false, 'never reached half');

// Final phase: the last fist's death at phase 4 opens phase 5.
assert.equal(yogFinalPhase(4, 0), true);
assert.equal(yogFinalPhase(4, 1), false);
assert.equal(yogFinalPhase(5, 0), false);
assert.equal(yogFinalPhase(3, 0), false);

// The hooks run the seam, not a second copy of the arithmetic.
const scene = readFileSync(new URL('../src/scenes/dungeon/bosses/bossLogic.ts', import.meta.url), 'utf8');
const kill = readFileSync(new URL('../src/scenes/dungeon/deathSaveRefresh.ts', import.meta.url), 'utf8');
for (const name of ['yogDamageResolution', 'fistHalfHpCrossed']) {
	assert.ok(scene.includes(name), `bossLogic delegates to ${name}`);
}
assert.ok(!scene.includes('0.3 * yog.maxHp'), 'no duplicated phase step remains in the hooks');
assert.ok(!scene.includes('maxHp - step * phase'), 'no duplicated phase line remains in the hooks');
assert.ok(!scene.includes("=== 4 && !this.creatures.some"), 'no duplicated final-phase gate remains in the hooks');

// Optional runtime parity: the project-authored Java harness calls real YogDzewa.damage().
if (process.argv[2]) {
	const lines = readFileSync(process.argv[2], 'utf8').trim().split(/\r?\n/).map((line) => JSON.parse(line));
	assert.equal(lines[0].tool, 'parityYogDamage-java');
	assert.equal(lines.at(-1).cases, 3);
	assert.equal(lines.at(-1).phaseCases, 4);
	assert.equal(lines.at(-1).finalCases, 1);
	const rows = lines.filter((row) => row.kind === 'damage');
	assert.equal(rows.length, 3);
	for (const row of rows) {
		const result = yogDamageResolution(row.phase, row.preHp, row.preHp - row.damage, 1000);
		assert.equal(row.hp, result.hp, `Java HP clamp for phase ${row.phase}`);
		const expectedAbility = row.phase === 0 ? 10 : 10 - result.hpLost / 10;
		const expectedSummon = row.phase === 0 ? 10 : 10 - result.hpLost / 10;
		assert.equal(row.abilityCd, expectedAbility, `Java ability cooldown for phase ${row.phase}`);
		assert.equal(row.summonCd, expectedSummon, `Java summon cooldown for phase ${row.phase}`);
	}
	const phaseRows = lines.filter((row) => row.kind === 'phase-edge');
	assert.equal(phaseRows.length, 4);
	for (const row of phaseRows) {
		const resolution = yogDamageResolution(row.phaseBefore, row.preHp, row.preHp - row.damage, 1000);
		assert.equal(row.hp, resolution.hp, 'Java phase-edge HP clamp');
		assert.equal(resolution.advances, true);
		assert.equal(row.phase, row.phaseBefore + 1, 'Java phase advances at the threshold');
		assert.equal(row.addFistCalls, row.stronger ? 2 : 1, 'Java adds the regular and challenge fist sets');
		assert.equal(row.abilityCd, 7, 'Java phase-edge ability cooldown uses the clamped HP loss');
		assert.equal(row.summonCd, 7, 'Java phase-edge summon cooldown uses the clamped HP loss');
		assert.equal(row.stoppedAtVisualBoundary, true, 'the fixture stops at the unavailable scene emitter');
	}
	const final = lines.find((row) => row.kind === 'final-phase');
	assert.ok(final, 'Java last-fist phase trace exists');
	assert.equal(final.phase, 5, 'Java last-fist death opens phase 5');
	assert.equal(final.summonCd, -15, 'Java schedules the final summon burst');
	assert.equal(final.bleeding, true, 'Java latches the boss bar into its finale state');
	assert.equal(yogFinalPhase(4, 0), true, 'production final-phase gate opens for the Java last-fist case');
	assert.ok(kill.includes('yog.yogSummonCd = -15'), 'production kill path schedules Java final summon burst');
	assert.ok(kill.includes('this.bossBleedLatched = true'), 'production kill path latches boss-bar finale bleeding');
}

// The final-phase gate lives in the kill flow, not the damage hooks.
assert.ok(kill.includes('yogFinalPhase'), 'kill flow delegates to yogFinalPhase');
assert.ok(!kill.includes("=== 4 && !this.creatures.some"), 'no duplicated final-phase gate remains in the kill flow');

console.log('yog phase seam: all checks pass');
