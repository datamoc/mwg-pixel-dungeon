import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { verifyCombat } from '../verifyCombat.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const out = mkdtempSync(join(tmpdir(), 'spd-combat-'));
let passed = 0;
function check(name, run) {
	run();
	passed++;
	console.log(`PASS ${name}`);
}
function compile(source, destination) {
	const file = join(out, destination);
	mkdirSync(dirname(file), { recursive: true });
	writeFileSync(file, ts.transpileModule(readFileSync(source, 'utf8'), {
		compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, rewriteRelativeImportExtensions: true },
	}).outputText);
}

writeFileSync(join(out, 'package.json'), '{"type":"commonjs"}');
// every simulation module (verifyCombat reads several via require)
for (const f of readdirSync(join(root, 'src/simulation')).filter((n) => n.endsWith('.ts'))) {
	compile(join(root, 'src/simulation', f), `simulation/${f.replace(/\.ts$/, '.js')}`);
}
for (const f of readdirSync(join(root, 'src/adapters')).filter((n) => n.endsWith('.ts'))) {
	compile(join(root, 'src/adapters', f), `adapters/${f.replace(/\.ts$/, '.js')}`);
}
for (const file of ['combat', 'spdRng', 'dungeonConstants', 'monsters',
	'generated/spdMessages', 'generated/mwlContent', 'mwlContent']) {
	compile(join(root, `src/${file}.ts`), `${file}.js`);
}
const dist = fileURLToPath(new URL('../../node_modules/mwg/dist/', import.meta.url));
function shim(destination, source) {
	const file = join(out, destination);
	mkdirSync(dirname(file), { recursive: true });
	writeFileSync(file, `module.exports = require(${JSON.stringify(source)});\n`);
}
shim(join('node_modules', 'mwg', 'index.js'), join(dist, 'index.js'));
const require = createRequire(join(out, 'x.js'));
verifyCombat(require, check);
console.log(`ALL ${passed} combat checks passed`);
