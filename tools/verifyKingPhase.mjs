import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

// Pins the DwarfKing phase-transition seam (`src/simulation/dwarfKingPhase.ts`) against
// `DwarfKing.damage()`'s branches (actors/mobs/DwarfKing.java, tag `v3.3.8`) and pins the
// scene table to the seam: `kingPhaseRules` must delegate, never carry a second copy.
const source = new URL('../src/simulation/dwarfKingPhase.ts', import.meta.url);
const output = mkdtempSync(join(tmpdir(), 'spd-king-phase-'));
writeFileSync(join(output, 'package.json'), '{"type":"commonjs"}');
writeFileSync(join(output, 'dwarfKingPhase.cjs'), ts.transpileModule(readFileSync(source, 'utf8'), {
	compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText);
const { kingPhase2Threshold, kingPhase2Entry, kingPhase3Entry, kingLosingYell } = createRequire(import.meta.url)(join(output, 'dwarfKingPhase.cjs'));

// P1->P2 threshold: HP <= 50, or 100 on STRONGER_BOSSES (DwarfKing.java: `HP <= (challenge ? 100 : 50)`).
assert.equal(kingPhase2Threshold(false), 50);
assert.equal(kingPhase2Threshold(true), 100);
assert.equal(kingPhase2Entry(1, 50, false), true);
assert.equal(kingPhase2Entry(1, 51, false), false);
assert.equal(kingPhase2Entry(1, 100, true), true);
assert.equal(kingPhase2Entry(1, 101, true), false);
assert.equal(kingPhase2Entry(2, 0, false), false, 'one-way: phase 2 never re-enters');

// P2->P3 on the drained barrier (`phase == 2 && shielding() == 0`; the port barrier floors
// at zero through the shared absorb, so `<= 0` fires on the same crossing).
assert.equal(kingPhase3Entry(2, 0), true);
assert.equal(kingPhase3Entry(2, 1), false);
assert.equal(kingPhase3Entry(1, 0), false);

// P3 losing yell under 20 HP.
assert.equal(kingLosingYell(19), true);
assert.equal(kingLosingYell(20), false);

// The scene table runs these predicates, not a second copy of the arithmetic.
const table = readFileSync(new URL('../src/scenes/dungeon/bosses/bossLogic.ts', import.meta.url), 'utf8');
for (const name of ['kingPhase2Entry', 'kingPhase2Threshold', 'kingPhase3Entry', 'kingLosingYell']) {
	assert.ok(table.includes(name), `kingPhaseRules delegates to ${name}`);
}
assert.ok(!table.includes('? 100 : 50'), 'no duplicated threshold ternary remains in the table');

console.log('king phase seam: all checks pass');
