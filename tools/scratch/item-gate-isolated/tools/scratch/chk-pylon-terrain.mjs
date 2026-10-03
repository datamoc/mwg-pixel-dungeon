// Throwaway: what terrain do Java's pylon cells actually carry? The port force-sets them EMPTY.
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

function build(stripPylonSet) {
	const output = mkdtempSync(join(tmpdir(), 'spd-pylon-'));
	for (const file of ['spdRng', 'spdLevelGen/paintLevel', 'spdLevelGen/vaultVisuals', 'spdLevelGen/spdPatch', 'spdLevelGen/bossLevels']) {
		let text = readFileSync(new URL(`../../src/${file}.ts`, import.meta.url), 'utf8');
		if (stripPylonSet && file === 'spdLevelGen/bossLevels') {
			const before = text;
			text = text.replace(/[ \t]*set\(level, x, y, Terrain\.EMPTY\);\r?\n/, '');
			if (text === before) throw new Error('pylon set line not found');
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
	const paint = generateBossFloor(15).paint;
	const name = (v) => Object.entries(Terrain).find(([, x]) => x === v)?.[0] ?? String(v);
	return [[4, 13], [28, 13], [4, 37], [28, 37]].map(([x, y]) => name(paint.map[y * paint.w + x]));
}
console.log('with the port\'s set(EMPTY):', build(false).join(', '));
console.log('without it (stamp terrain):', build(true).join(', '));
