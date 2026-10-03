import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

const source = new URL('../src/simulation/cursedWand.ts', import.meta.url);
const output = mkdtempSync(join(tmpdir(), 'spd-cursed-wand-tier-dispatch-'));
writeFileSync(join(output, 'package.json'), '{"type":"commonjs"}');
writeFileSync(join(output, 'cursedWand.cjs'), ts.transpileModule(readFileSync(source, 'utf8'), {
	compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText);

const { pickCursedTier } = createRequire(import.meta.url)(join(output, 'cursedWand.cjs'));
const tiers = Array.from({ length: 100 }, (_, roll) => pickCursedTier((bound) => {
	assert.equal(bound, 100, 'tier draw must use Java’s full 100-point weight total');
	return roll;
}));
assert.deepEqual(tiers.slice(0, 60), Array(60).fill('common'));
assert.deepEqual(tiers.slice(60, 90), Array(30).fill('uncommon'));
assert.deepEqual(tiers.slice(90, 99), Array(9).fill('rare'));
assert.deepEqual(tiers.slice(99), ['veryRare']);

const scene = readFileSync(new URL('../src/scenes/dungeon/hero/cursedWandCast.ts', import.meta.url), 'utf8');
assert.match(scene, /else if \(tier === 'rare'\) this\.castCursedWandRareEffect[\s\S]*?else this\.castCursedWandVeryRareEffect\(cell\);/);
console.log('PASS CursedWand keeps Java’s 60/30/9/1 tier weights and does not redirect unsupported VeryRare casts.');
