// Throwaway (tools/scratch): is the way out of each boss floor actually reachable on foot?
//
// This port descends the moment a boss dies, so reachability was never tested. Java does not: the
// hero walks to the floor's own exit, and every boss level's `unseal()` is what reopens the way
// (`SewerBossLevel` restores the entrance tile, `CavesBossLevel` opens the gate row,
// `CityBossLevel` unlocks its two doors and spawns the Imp shop, and so on). Before porting that
// flow, this asks the cheap question first: with the ported layouts as they stand, does a
// flood fill from the hero's arrival cell reach the exit tile - and if not, which cells would a
// seal have to open?
//
// Run:  node tools/scratch/boss-reachability.mjs
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = fileURLToPath(new URL('../../', import.meta.url)).replace(/^\//, '').replaceAll('/', '\\');
const output = mkdtempSync(join(tmpdir(), 'spd-bossreach-'));
function compile(file) {
	const source = join(root, 'src', `${file}.ts`);
	const target = join(output, `${file}.js`);
	mkdirSync(dirname(target), { recursive: true });
	writeFileSync(target, ts.transpileModule(readFileSync(source, 'utf8'), {
		compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, rewriteRelativeImportExtensions: true },
	}).outputText);
}
writeFileSync(join(output, 'package.json'), '{"type":"commonjs"}');
for (const file of ['spdRng', 'spdLevelGen/paintLevel', 'spdLevelGen/room', 'spdLevelGen/spdPatch', 'spdLevelGen/bossLevels']) compile(file);
// `room.ts` reaches the item generator, which this probe never calls; a stub keeps the probe to
// the geometry it is asking about
writeFileSync(join(output, 'spdLevelGen', 'room.js'), 'module.exports = { Room: class {} };\n');
const require = createRequire(join(output, 'tests.cjs'));
const { Terrain } = require('./spdLevelGen/paintLevel');
const { generateBossFloor } = require('./spdLevelGen/bossLevels');
const { SpdRandom } = require('./spdRng');

/** `Terrain.java`'s flags, reduced to the two bits that decide a walk */
const PASSABLE = new Set([Terrain.EMPTY, Terrain.GRASS, Terrain.EMPTY_WELL, Terrain.WATER, Terrain.DOOR,
	Terrain.ENTRANCE, Terrain.EXIT, Terrain.EMBERS, Terrain.PEDESTAL, Terrain.EMPTY_SP, Terrain.HIGH_GRASS,
	Terrain.SECRET_TRAP, Terrain.INACTIVE_TRAP, Terrain.EMPTY_DECO, Terrain.SIGN, Terrain.REGION_DECO, Terrain.REGION_DECO_ALT]);

for (const depth of [10, 15, 20, 25, 26]) {
	SpdRandom.pushGenerator(BigInt(depth) * 1000003n + 7n);
	let floor;
	try {
		floor = generateBossFloor(depth, false);
	} finally {
		SpdRandom.popGenerator();
	}
	const { paint } = floor;
	const width = paint.w;
	const height = paint.h;
	const open = (cell) => PASSABLE.has(paint.map[cell]);
	let entrance = -1;
	let exit = -1;
	for (let cell = 0; cell < paint.map.length; cell++) {
		if (paint.map[cell] === Terrain.ENTRANCE && entrance < 0) entrance = cell;
		if (paint.map[cell] === Terrain.EXIT && exit < 0) exit = cell;
	}
	if (entrance < 0 || exit < 0) {
		console.log(`depth ${depth}: ${entrance < 0 ? 'no ENTRANCE tile' : ''}${exit < 0 ? ' no EXIT tile' : ''}`);
		continue;
	}
	// straight flood fill, orthogonal, from the entrance over passable terrain
	const seen = new Set([entrance]);
	const queue = [entrance];
	while (queue.length) {
		const cell = queue.pop();
		const x = cell % width;
		const y = Math.floor(cell / width);
		for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
			const nx = x + dx;
			const ny = y + dy;
			if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
			const next = ny * width + nx;
			if (seen.has(next) || !open(next)) continue;
			seen.add(next);
			queue.push(next);
		}
	}
	const exitCell = { x: exit % width, y: Math.floor(exit / width) };
	const entranceCell = { x: entrance % width, y: Math.floor(entrance / width) };
	console.log(`depth ${depth}: ${width}x${height}, entrance (${entranceCell.x},${entranceCell.y}) -> exit (${exitCell.x},${exitCell.y}) `
		+ `${seen.has(exit) ? 'REACHABLE' : 'NOT REACHABLE'} (${seen.size} cells open)`);
}
