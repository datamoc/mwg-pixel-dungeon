// Throwaway: why did fixing the gate rect shift the floor's rolls? Compare the two variants.
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

function build(variant) {
	const output = mkdtempSync(join(tmpdir(), `spd-g2-${variant}-`));
	const sources = new Map();
	for (const file of ['spdRng', 'spdLevelGen/paintLevel', 'spdLevelGen/vaultVisuals', 'spdLevelGen/spdPatch', 'spdLevelGen/bossLevels']) {
		let text = readFileSync(new URL(`../../src/${file}.ts`, import.meta.url), 'utf8');
		if (variant === 'old' && file === 'spdLevelGen/bossLevels') {
			text = text.replace('fillRect(level, 14, 13, 18, 13, Terrain.SIGN);', 'fillRect(level, 14, 13, 19, 14, Terrain.SIGN);');
		}
		const target = join(output, `${file}.js`);
		mkdirSync(dirname(target), { recursive: true });
		writeFileSync(target, ts.transpileModule(text, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, rewriteRelativeImportExtensions: true } }).outputText);
	}
	writeFileSync(join(output, 'package.json'), '{"type":"commonjs"}');
	const require = createRequire(join(output, 't.cjs'));
	writeFileSync(join(output, 'spdLevelGen', 'room.js'), 'module.exports = {};\n');
	const { generateBossFloor } = require('./spdLevelGen/bossLevels');
	const { Terrain } = require('./spdLevelGen/paintLevel');
	const { SpdRandom } = require('./spdRng');
	SpdRandom.pushGenerator(42n);
	return { map: generateBossFloor(15).paint.map, w: 33, Terrain };
}

for (const variant of ['old', 'new']) {
	const { map, w, Terrain } = build(variant);
	// what the ellipse leaves as EMPTY in the loop's own range, and what the loop rolls
	let empty = 0, water = 0, trap = 0, sign = 0;
	for (let i = 14 * w; i < map.length; i++) {
		if (map[i] === Terrain.WATER) water++;
		else if (map[i] === Terrain.INACTIVE_TRAP) trap++;
		else if (map[i] === Terrain.EMPTY) empty++;
	}
	for (let i = 13 * w; i < map.length; i++) if (map[i] === Terrain.SIGN) sign++;
	console.log(variant, { sign, water, trap, empty, 'water+trap+sign': water + trap + sign });
	console.log('  row13 cols 12..21:', [...Array(10)].map((_, k) => map[13 * w + 12 + k] === Terrain.SIGN ? 'g' : map[13 * w + 12 + k] === Terrain.WALL ? '#' : '.').join(''));
}
