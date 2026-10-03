import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

// Pins the Yog phase-decision seam (`src/simulation/yogBoss.ts`) against
// `YogDzewa.damage()` (actors/mobs/YogDzewa.java 388-420, tag `v3.3.8`) and the
// Bright/Dark fist half-HP edges (actors/mobs/YogFist.java 528-540 and 598-610),
// and pins `yogDamageHook`/`brightDarkHalfHp` to the seam: the hooks must
// delegate, never a second copy of the arithmetic.
const source = new URL('../src/simulation/yogBoss.ts', import.meta.url);
const output = mkdtempSync(join(tmpdir(), 'spd-yog-phase-'));
writeFileSync(join(output, 'package.json'), '{"type":"commonjs"}');
writeFileSync(join(output, 'yogBoss.cjs'), ts.transpileModule(readFileSync(source, 'utf8'), {
	compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText);
const { yogPhaseStep, yogPhaseThreshold, yogPhase4Floor, yogPhaseAdvance, fistHalfHpCrossed, yogFinalPhase } = createRequire(import.meta.url)(join(output, 'yogBoss.cjs'));

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
for (const name of ['yogPhaseThreshold', 'yogPhase4Floor', 'yogPhaseAdvance', 'fistHalfHpCrossed']) {
	assert.ok(scene.includes(name), `bossLogic delegates to ${name}`);
}
assert.ok(!scene.includes('0.3 * yog.maxHp'), 'no duplicated phase step remains in the hooks');
assert.ok(!scene.includes('maxHp - step * phase'), 'no duplicated phase line remains in the hooks');
assert.ok(!scene.includes("=== 4 && !this.creatures.some"), 'no duplicated final-phase gate remains in the hooks');

// The final-phase gate lives in the kill flow, not the damage hooks.
const kill = readFileSync(new URL('../src/scenes/dungeon/deathSaveRefresh.ts', import.meta.url), 'utf8');
assert.ok(kill.includes('yogFinalPhase'), 'kill flow delegates to yogFinalPhase');
assert.ok(!kill.includes("=== 4 && !this.creatures.some"), 'no duplicated final-phase gate remains in the kill flow');

console.log('yog phase seam: all checks pass');
