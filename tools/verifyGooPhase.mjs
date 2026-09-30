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
const { gooEnraged, gooPumpChance, gooPumpTarget, gooSlamReady, gooChargeStep } = createRequire(import.meta.url)(join(output, 'gooBoss.cjs'));

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

// `takeGooTurn` runs these predicates, not a second copy of the arithmetic.
const turn = readFileSync(source, 'utf8').split('export function takeGooTurn')[1];
for (const name of ['gooEnraged', 'gooPumpChance', 'gooPumpTarget', 'gooSlamReady', 'gooChargeStep']) {
	assert.ok(turn.includes(name), `takeGooTurn delegates to ${name}`);
}
assert.ok(!turn.includes('enraged ? 0.5 : 0.2'), 'no duplicated pump chance remains in the turn');
assert.ok(!turn.includes('hp * 2 <='), 'no duplicated enrage gate remains in the turn');

console.log('goo phase seam: all checks pass');
