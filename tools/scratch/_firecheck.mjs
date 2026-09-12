import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
const output = mkdtempSync(join(tmpdir(), 'spd-fire-'));
function compile(source, destination) {
	const file = join(output, destination);
	mkdirSync(dirname(file), { recursive: true });
	writeFileSync(file, ts.transpileModule(readFileSync(source, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, rewriteRelativeImportExtensions: true } }).outputText);
}
writeFileSync(join(output, 'package.json'), '{"type":"commonjs"}');
for (const f of ['simulation/random', 'simulation/buffs', 'simulation/mwlBuffDurations']) compile(new URL(`../../src/${f}.ts`, import.meta.url), `${f}.js`);
const require = createRequire(join(output, 'tests.cjs'));
const { advanceBuffs, reigniteBuff, BUFF_DURATION } = require('./simulation/buffs');
const fixture = JSON.parse(readFileSync('tools/fixtures/combat-before-extraction.json', 'utf8'));
// replay the fixture scenarios with the real mwg Random, but from the installed package
const dist = join(process.cwd(), 'node_modules/mwg/dist/core/Random.js');
const ns = await import(pathToFileURL(dist).href);
const Random = ns.Random ?? ns.default?.Random;
for (const item of fixture.buffs) {
	const result = advanceBuffs({ ...item.initial }, Random.push(item.seed) && Random);
	Random.pop();
	console.log(JSON.stringify({ initial: item.initial, damage: result.damage, buffs: result.buffs, old: item.expected.damage }));
}
console.log('burning duration now', BUFF_DURATION.burning);
const draws = [];
const spy = { int: (low, high) => { draws.push([low, high]); return low; }, normalRange: (a, b) => (a + b) / 2, float: () => 0 };
advanceBuffs({ burning: 5 }, spy, 0); advanceBuffs({ burning: 5 }, spy, 12);
console.log('bound draws:', JSON.stringify(draws));
console.log('reignite shorter:', JSON.stringify(reigniteBuff({ burning: 2 }, 'burning', 8).buffs));
console.log('reignite longer:', JSON.stringify(reigniteBuff({ burning: 9 }, 'burning', 4).buffs));
console.log('reignite fresh:', JSON.stringify(reigniteBuff({}, 'burning', 4).buffs));
