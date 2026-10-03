// Throwaway: is the port's Caves gate strip the same cell set as Java's `gate` rect?
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';
const output = mkdtempSync(join(tmpdir(), 'spd-gate-'));
function compile(source, destination) {
	const file = join(output, destination);
	mkdirSync(dirname(file), { recursive: true });
	writeFileSync(file, ts.transpileModule(readFileSync(source, 'utf8'), {
		compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, rewriteRelativeImportExtensions: true },
	}).outputText);
}
writeFileSync(join(output, 'package.json'), '{"type":"commonjs"}');
for (const file of ['spdRng', 'spdLevelGen/paintLevel', 'spdLevelGen/vaultVisuals', 'spdLevelGen/spdPatch', 'spdLevelGen/bossLevels']) {
	compile(new URL(`../../src/${file}.ts`, import.meta.url), `${file}.js`);
}
writeFileSync(join(output, 'spdLevelGen', 'room.js'), 'module.exports = {};\n');
const require = createRequire(join(output, 'tests.cjs'));
const { generateBossFloor } = require('./spdLevelGen/bossLevels');
const { Terrain } = require('./spdLevelGen/paintLevel');
const { SpdRandom } = require('./spdRng');
SpdRandom.pushGenerator(42n);
const name = (v) => Object.entries(Terrain).find(([, x]) => x === v)?.[0] ?? String(v);
const caves = generateBossFloor(15).paint;
const w = caves.w;
const glyph = (v) => v === Terrain.WALL ? '#' : v === Terrain.SIGN ? 'g' : v === Terrain.EMPTY ? '.'
	: v === Terrain.WATER ? 'w' : v === Terrain.INACTIVE_TRAP ? 't' : v === Terrain.STATUE ? 'S'
	: v === Terrain.EMPTY_SP ? 'o' : v === Terrain.CHASM ? ' ' : '?';
for (let y = 12; y < 16; y++) {
	let row = '';
	for (let x = 0; x < w; x++) row += glyph(caves.map[y * w + x]);
	console.log(String(y).padStart(2), row);
}
const gate = [];
for (let y = 13; y < 14; y++) for (let x = 14; x < 19; x++) gate.push([x, y, name(caves.map[y * w + x])]);
console.log("Java's gate cells (14..18, row 13):", JSON.stringify(gate));
console.log("col 19 row 13:", name(caves.map[13 * w + 19]), "| col 19 row 14:", name(caves.map[14 * w + 19]));
// Java's own energy-eligible set from `activatePylon()`: CUSTOM_DECO/WATER/INACTIVE_TRAP from row 13 down
let javaish = 0;
for (let i = 13 * w; i < caves.map.length; i++) {
	const v = caves.map[i];
	if (v === Terrain.SIGN || v === Terrain.WATER || v === Terrain.INACTIVE_TRAP) javaish++;
}
console.log('port energy-eligible cells from row 13 down:', javaish);
