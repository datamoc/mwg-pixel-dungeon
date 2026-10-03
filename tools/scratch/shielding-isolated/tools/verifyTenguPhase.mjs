import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

// Pins the Tengu HP-bracket seam (`src/simulation/tenguBeam.ts`) against
// `Tengu.damage()` (actors/mobs/Tengu.java 132-200, tag `v3.3.8`) and pins
// `clampTenguBracket`/`tenguBracketJump` to the seam: the hooks must delegate,
// never a second copy of the arithmetic.
const source = new URL('../src/simulation/tenguBeam.ts', import.meta.url);
const output = mkdtempSync(join(tmpdir(), 'spd-tengu-phase-'));
writeFileSync(join(output, 'package.json'), '{"type":"commonjs"}');
writeFileSync(join(output, 'tenguBeam.cjs'), ts.transpileModule(readFileSync(source, 'utf8'), {
	compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText);
const { tenguHpBracket, tenguBracketOf, tenguBracketClamp, tenguBracketChanged, tenguPhase1Edge } = createRequire(import.meta.url)(join(output, 'tenguBeam.cjs'));

// Bracket `HT/8` (floored, never below 1); index is integer division.
assert.equal(tenguHpBracket(200), 25);
assert.equal(tenguHpBracket(7), 1);
assert.equal(tenguBracketOf(200, 25), 8);
assert.equal(tenguBracketOf(199, 25), 7);

// Single-bracket clamp: a multi-bracket blow floors at the next bracket +1.
assert.equal(tenguBracketClamp(200, 160, 25), 176, '200->160 crosses 175, floors at 176');
assert.equal(tenguBracketClamp(200, 180, 25), 180, 'same-bracket hit untouched');
assert.equal(tenguBracketClamp(200, 176, 25), 176, 'landing exactly on the floor keeps it');

// Bracket change drives the deferred jump.
assert.equal(tenguBracketChanged(200, 199, 25), true);
assert.equal(tenguBracketChanged(200, 176, 25), true);
assert.equal(tenguBracketChanged(180, 176, 25), false);

// Phase-1 end: first time at or under half HP while still in the cell.
assert.equal(tenguPhase1Edge('cell', 100, 200), true);
assert.equal(tenguPhase1Edge('cell', 101, 200), false);
assert.equal(tenguPhase1Edge('paused', 100, 200), false);

// The hooks run the seam, not a second copy (scoped to the hook bodies).
const ai = readFileSync(new URL('../src/scenes/dungeon/monsters/monsterAi.ts', import.meta.url), 'utf8');
const hooks = ai.split('clampTenguBracket')[1];
for (const name of ['tenguHpBracket', 'tenguBracketClamp', 'tenguPhase1Edge', 'tenguBracketChanged']) {
	assert.ok(hooks.includes(name), `hooks delegate to ${name}`);
}
assert.ok(!hooks.includes('Math.floor(tengu.maxHp / 8)'), 'no duplicated bracket remains in the hooks');
assert.ok(!hooks.includes('Math.floor(preHp / bracket)'), 'no duplicated bracket index remains in the hooks');

console.log('tengu phase seam: all checks pass');
