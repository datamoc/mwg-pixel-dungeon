import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// `LastLevel`'s vault, proved against the Java source it was transcribed from: the candle cluster's
// own tiles at the cells `CustomFloor.create()`'s cursor arithmetic puts them on, the decoration and
// Amulet-obtained variants, the two centre-piece stamps, and the `create()` solid list. Same house
// pattern as `verifyBanner.mjs`: compile the real modules into a private CommonJS tree (with a stub
// `room.js`, since `paintLevel.ts` imports `Room` for its type only) so this needs no DOM or Pixi.
const output = mkdtempSync(join(tmpdir(), 'spd-vault-'));
let passed = 0;
function check(name, run) {
	run();
	passed++;
	console.log(`PASS ${name}`);
}
function compile(source, destination) {
	const file = join(output, destination);
	mkdirSync(dirname(file), { recursive: true });
	writeFileSync(file, ts.transpileModule(readFileSync(source, 'utf8'), {
		compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, rewriteRelativeImportExtensions: true },
	}).outputText);
}

try {
	writeFileSync(join(output, 'package.json'), '{"type":"commonjs"}');
	for (const file of ['spdRng', 'spdLevelGen/paintLevel', 'spdLevelGen/vaultVisuals']) {
		compile(new URL(`../src/${file}.ts`, import.meta.url), `${file}.js`);
	}
	// `paintLevel`'s only import of `room` is its `Room` type, erased at compile time - the
	// emitted `require('./room')` still has to resolve, and nothing in this check touches it
	const require = createRequire(join(output, 'tests.cjs'));
	const roomShim = join(output, 'spdLevelGen', 'room.js');
	writeFileSync(roomShim, 'module.exports = {};\n');
	const { PaintLevel, Terrain } = require('./spdLevelGen/paintLevel');
	const { vaultBlockedCells, vaultCenterVisualFrames, vaultCenterWallFrames, vaultFloorFrames, AMULET_POS } =
		require('./spdLevelGen/vaultVisuals');

	const WIDTH = 16;
	const HEIGHT = 64;
	const ROOM_TOP = 10;
	/** the vault's real geometry, as `lastLevel()` builds it - only what the tiles read matters */
	function vaultMap() {
		const level = new PaintLevel(WIDTH, HEIGHT, Terrain.CHASM);
		const mid = WIDTH / 2;
		const fill = (left, top, right, bottom, terrain) => {
			for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) level.map[y * WIDTH + x] = terrain;
		};
		fill(mid - 1, 10, mid + 1, 62, Terrain.EMPTY);
		fill(mid - 2, 61, mid + 2, 61, Terrain.EMPTY);
		fill(mid - 3, 62, mid + 3, 62, Terrain.EMPTY);
		fill(0, 54, WIDTH - 1, 55, Terrain.WALL);
		fill(0, 56, WIDTH - 1, 63, Terrain.EMPTY);
		level.map[54 * WIDTH + mid] = Terrain.ENTRANCE;
		level.map[55 * WIDTH + mid] = Terrain.ENTRANCE;
		fill(mid - 1, 56, mid + 1, 56, Terrain.ENTRANCE);
		fill(mid - 2, 9, mid + 2, 15, Terrain.EMPTY);
		fill(mid - 3, 10, mid + 3, 14, Terrain.EMPTY);
		return level;
	}
	const variance = new Uint8Array(WIDTH * HEIGHT);   // < 50 everywhere: candle tile 46, not 47
	const cell = (x, y) => y * WIDTH + x;

	check('the candle cluster lands on the cells Java\'s cursor arithmetic names', () => {
		const frames = vaultFloorFrames(vaultMap().map, WIDTH, HEIGHT, variance, false);
		assert.equal(AMULET_POS, cell(8, 12), 'AMULET_POS is (8,12)');
		// CANDLES' 7x7 block starts at AMULET_POS - 3 - 3*width, so it spans rows 9..15, cols 5..11
		assert.equal(frames[cell(5, 9)], -1, 'the cluster\'s top-left corner is blank');
		assert.equal(frames[cell(6, 9)], 42, 'the tile beside it is a candle stand');
		assert.equal(frames[cell(8, 9)], 46, 'the middle of the top row is a candle');
		assert.equal(frames[cell(8, 12)], 19, 'the Amulet cell carries the cluster centre tile');
		// where the cluster's floor hangs over the void, Java writes an *edge* tile into the cell
		// below it (`map[cell] != CHASM && map[cell+width] == CHASM -> data[i+tileW] = 6`), so the
		// bottom row of the block is not blank even though its own CANDLES entry is
		assert.equal(frames[cell(5, 15)], 6, 'the cluster edge over the void below the block');
		assert.equal(frames[cell(6, 16)], 6, 'and one row further down, at the next column in');
	});

	check('tile variance picks the irregular candle art (Java `tileVariance >= 50`)', () => {
		const varied = new Uint8Array(WIDTH * HEIGHT).fill(60);
		const frames = vaultFloorFrames(vaultMap().map, WIDTH, HEIGHT, varied, false);
		assert.equal(frames[cell(8, 9)], 47, '46 becomes 47 when the cell\'s variance is 50 or more');
	});

	check('the shaft strip is lit, decorated cells use Java\'s deco tile, and the void draws nothing', () => {
		const level = vaultMap();
		level.map[cell(8, 20)] = Terrain.EMPTY;
		level.map[cell(8, 30)] = Terrain.EMPTY_DECO;
		const frames = vaultFloorFrames(level.map, WIDTH, HEIGHT, variance, false);
		assert.equal(frames[cell(8, 20)], 19, 'plain floor in the strip');
		assert.equal(frames[cell(8, 30)], 27, 'decorated floor before the Amulet is taken');
		assert.equal(frames[cell(6, 20)], -1, 'a chasm cell draws nothing');
		assert.equal(frames[cell(0, 0)], -1, 'and nor does one outside the strip');
		assert.equal(frames.length, WIDTH * HEIGHT, 'the layer spans the whole floor');
	});

	check('taking the Amulet swaps the decoration and lights every candle above tile 40', () => {
		const level = vaultMap();
		level.map[cell(8, 30)] = Terrain.EMPTY_DECO;
		const before = vaultFloorFrames(level.map, WIDTH, HEIGHT, variance, false);
		const after = vaultFloorFrames(level.map, WIDTH, HEIGHT, variance, true);
		assert.equal(before[cell(8, 30)], 27);
		assert.equal(after[cell(8, 30)], 31);
		assert.equal(after[cell(8, 9)], before[cell(8, 9)] + 8, 'a candle gains its lit variant');
		assert.equal(after[cell(8, 12)], before[cell(8, 12)], 'the cluster centre (19) is below the threshold');
	});

	check('the two centre pieces are stamped where `CustomTilemap.pos` puts them', () => {
		const center = vaultCenterVisualFrames(WIDTH, HEIGHT);
		const walls = vaultCenterWallFrames(WIDTH, HEIGHT);
		assert.equal(center[cell(0, HEIGHT - ROOM_TOP)], -1, 'the visuals map starts blank at row 54');
		assert.equal(center[cell(0, HEIGHT - ROOM_TOP + 1)], 0, 'and its second row is tile 0 across the width');
		assert.equal(walls[cell(0, HEIGHT - ROOM_TOP - 1)], 4, 'the walls map starts one row higher, on tile 4');
		assert.equal(walls[cell(8, HEIGHT - ROOM_TOP - 1)], 7, 'with the gate tile centred above the entrance');
		assert.equal(center.length, WIDTH * HEIGHT);
		assert.equal(walls.length, WIDTH * HEIGHT);
	});

	check('`create()`\'s solid list is the pit cells plus the sealed entrance chamber', () => {
		const level = vaultMap();
		const blocked = new Set(vaultBlockedCells(level.map, WIDTH, HEIGHT));
		for (let i = 0; i < level.map.length; i++) {
			if (level.map[i] === Terrain.CHASM) assert.ok(blocked.has(i), `chasm cell ${i} is blocked`);
		}
		for (let i = (HEIGHT - ROOM_TOP + 2) * WIDTH; i < level.map.length; i++) assert.ok(blocked.has(i), `chamber cell ${i} is blocked`);
		assert.equal(blocked.has(cell(8, 54)), false, 'the arrival cell stays walkable');
		assert.equal(blocked.has(cell(8, 20)), false, 'and so does the shaft');
		assert.equal(blocked.has(cell(8, 12)), false, 'and the Amulet\'s own cell');
	});

	console.log(`${passed} vault checks passed.`);
} catch (error) {
	console.error(error);
	process.exit(1);
}
