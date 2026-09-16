import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// The port's fixed-layout floors, proved against the Java source they were transcribed from: the
// vault (`LastLevel`) - the candle cluster's own tiles at the cells `CustomFloor.create()`'s cursor
// arithmetic puts them on, the decoration and Amulet-obtained variants, the two centre-piece stamps,
// and the `create()` solid list - the three boss arenas' shapes (`PrisonBossLevel`/`CavesBossLevel`/
// `CityBossLevel`), `CavesBossLevel`'s three custom tilemaps, its seal/pause/end maps, the prison's
// stamp tables, and every transition's own destination. Same house pattern as `verifyBanner.mjs`:
// compile the real modules into a private CommonJS tree (with a stub `room.js`, since
// `paintLevel.ts` imports `Room` for its type only) so this needs no DOM or Pixi.
// (The filename is historical - it started as the vault's own check.)
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
	for (const file of ['spdRng', 'spdLevelGen/paintLevel', 'spdLevelGen/vaultVisuals', 'spdLevelGen/spdPatch', 'spdLevelGen/wallTiles', 'spdLevelGen/visualWalls', 'spdLevelGen/customTilemapLayer', 'spdLevelGen/cavesBossVisuals', 'spdLevelGen/hallsBossVisuals', 'spdLevelGen/ritualMarkerVisuals', 'spdLevelGen/cavesDecorate', 'spdLevelGen/bossLevels']) {
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
	const { NULL_TILE } = require('./spdLevelGen/customTilemapLayer');
	const { HALLS_ROOM_LEFT, HALLS_ROOM_TOP, hallsCenterPieceFrames, hallsCenterPieceLayer, hallsCenterWallFrames, hallsCenterWallLayer } =
		require('./spdLevelGen/hallsBossVisuals');
	const { RITUAL_MARKER_DESC_KEY, RITUAL_MARKER_FRAMES, RITUAL_MARKER_NAME_KEY, insideRitualMarker, ritualMarkerLayer } =
		require('./spdLevelGen/ritualMarkerVisuals');
	const { CAVES_GATE, CAVES_PYLON_POSITIONS, cavesArenaDescKey, cavesArenaFrames,
		cavesArenaLayer, cavesArenaNameKey, cityEntranceFrames, entranceOverhangFrames } =
		require('./spdLevelGen/cavesBossVisuals');

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

	// `CavesBossLevel.buildEntrance()`/`buildCorners()`'s mirrored stamps: one of four picked per
	// group by `Random.oneOf`, written into all four quadrants by four cursors that each move in a
	// different direction. Every variant is driven against a fresh level and compared against an
	// independent transcription of Java's cursor arithmetic, so a corrupted stamp string or a
	// cursor written the wrong way fails here rather than in a map no one diffs.
	const { ENTRANCE_STAMPS, CORNER_STAMPS, buildEntranceStamps, buildCornerStamps } = require('./spdLevelGen/bossLevels');
	const STAMP_TERRAIN = { '.': undefined, '#': Terrain.WALL, '_': Terrain.EMPTY, ',': Terrain.EMPTY_SP };
	check('the eight stamp tables are the right size', () => {
		assert.equal(ENTRANCE_STAMPS.length, 4);
		assert.equal(CORNER_STAMPS.length, 4);
		for (const stamp of ENTRANCE_STAMPS) assert.equal(stamp.length, 64, 'an entrance stamp must be 8 rows of 8');
		for (const stamp of CORNER_STAMPS) assert.equal(stamp.length, 100, 'a corner stamp must be 10 rows of 10');
	});
	for (const [group, stamps, size, anchor, apply] of [
		['entrance', ENTRANCE_STAMPS, 8, (w) => {
			const entrance = 16 + 25 * w;
			return { nw: entrance - 7 - 7 * w, ne: entrance + 7 - 7 * w, se: entrance + 7 + 7 * w, sw: entrance - 7 + 7 * w };
		}, buildEntranceStamps],
		['corner', CORNER_STAMPS, 10, (w) => ({ nw: 2 + 11 * w, ne: 30 + 11 * w, se: 30 + 39 * w, sw: 2 + 39 * w }), buildCornerStamps],
	]) {
		stamps.forEach((stamp, index) => check(`${group}${index + 1} mirrors into all four quadrants`, () => {
			const w = 33;
			const level = new PaintLevel(w, 42, Terrain.CHASM);
			apply(level, stamp);
			const cursors = anchor(w);
			const expected = new Map();
			let { nw, ne, se, sw } = cursors;
			for (let i = 0; i < stamp.length; i++) {
				if (i % size === 0 && i !== 0) {
					nw += w - size; ne += w + size; se -= w - size; sw -= w + size;
				}
				const terrain = STAMP_TERRAIN[stamp[i]];
				if (terrain !== undefined) for (const cell of [nw, ne, se, sw]) expected.set(cell, terrain);
				nw++; ne--; sw++; se--;
			}
			const wrong = [...expected].filter(([cell, terrain]) => level.map[cell] !== terrain);
			assert.equal(wrong.length, 0, wrong.slice(0, 1).map(([cell, terrain]) => `cell ${cell} holds ${level.map[cell]} not ${terrain}`).join(''));
			const stray = [...level.map].filter((terrain, cell) => terrain !== Terrain.CHASM && !expected.has(cell)).length;
			assert.equal(stray, 0, `${stray} cells outside the stamp were written`);
		}));
	}

	// `PrisonBossLevel`'s four maps (`setMapStart`'s own base plus the three transition paints
	// `setMapPause`/`setMapArena`/`setMapEnd`, tag `v3.3.8`): geometry, plus whether the hero can
	// actually walk between the cells each transition is about. The connectivity check is the one
	// that matters most - see its own comment.
	const { generateBossFloor, prisonBossPause, prisonBossArena, prisonBossEnd, PRISON_ARENA, PRISON_TENGU_CELL, CAVES_BOSS_ARENA, CITY_BOSS_ARENA, CITY_BOSS_ENTRY, CITY_BOSS_END, CITY_BOTTOM_DOOR, CITY_TOP_DOOR, CITY_THRONE, CITY_PEDESTALS, CITY_IMP_SHOP, CITY_EXIT_CELL, CITY_ENTRANCE_CELL, HALLS_ROOM, HALLS_EXIT_CELL, HALLS_BOSS_POS } = require('./spdLevelGen/bossLevels');
	const { fillEllipseRect, fillDiamondRect } = require('./spdLevelGen/paintLevel');
	check('prisonBossPause opens Tengu\'s cell door, seals the entrance, and cracks startCells[1]', () => {
		const { paint } = prisonBossPause();
		const at = (x, y) => paint.map[x + y * 32];
		assert.equal(at(10, 23), Terrain.DOOR, 'tenguCellDoor is now a plain door, not locked');
		assert.equal(at(8, 4), Terrain.WALL, 'the entrance room is walled shut');
		assert.equal(at(10, 7), Terrain.EMPTY, 'one cell short of the hallway\'s own new door');
		assert.equal(at(10, 8), Terrain.DOOR, 'the hallway\'s fresh door, one cell in from the old entrance');
		assert.equal(at(11, 15), Terrain.EMPTY, 'startCells[1] cracked open (first fill)');
		assert.equal(at(14, 15), Terrain.EMPTY, 'startCells[1] cracked open (second fill)');
	});
	check('prisonBossArena walls the whole floor but the (3,1)-(18,16) ellipse', () => {
		const { paint } = prisonBossArena();
		const at = (x, y) => paint.map[x + y * 32];
		assert.equal(at(10, 8), Terrain.EMPTY, 'the arena\'s own centre is walkable');
		assert.equal(at(0, 0), Terrain.WALL, 'far outside the ellipse stays solid');
		assert.equal(at(10, 23), Terrain.WALL, 'the old tenguCell is walled over entirely');
		// every EMPTY cell must fall inside PRISON_ARENA's rect (the ellipse is inscribed in it)
		for (let cell = 0; cell < paint.map.length; cell++) {
			if (paint.map[cell] !== Terrain.EMPTY) continue;
			const x = cell % 32, y = Math.floor(cell / 32);
			assert.ok(x >= PRISON_ARENA.left && x <= PRISON_ARENA.right && y >= PRISON_ARENA.top && y <= PRISON_ARENA.bottom,
				`empty cell (${x},${y}) falls outside the arena rect`);
		}
	});
	check('prisonBossEnd unlocks the door and pastes the chasm/exit endMap at (11,9)', () => {
		const { paint } = prisonBossEnd();
		const at = (x, y) => paint.map[x + y * 32];
		assert.equal(at(10, 23), Terrain.DOOR, 'tenguCellDoor unlocked for the death transition too');
		assert.equal(at(10, 4), Terrain.ENTRANCE, 'the entrance returns (setMapStart() runs first)');
		assert.equal(at(11, 9), Terrain.WALL, 'endMap row 0 starts with two WALL columns');
		assert.equal(at(13, 9), Terrain.WALL_DECO, 'endMap row 0\'s third column is the WALL_DECO cell');
		assert.equal(at(14, 14), Terrain.CHASM, 'the chasm pool is present partway down endMap');
		assert.equal(at(22, 15), Terrain.EXIT, 'the exit stairway sits beside the chasm');
	});
	check('the two grass kinds keep their own foreground frames', () => {
		const { foregroundGrassFrame } = require('./spdLevelGen/visualWalls');
		// `DungeonTileSheet`: `FLAT/RAISED_HIGH_GRASS` and `FLAT/RAISED_FURROWED_GRASS` are separate
		// cuts, each with a variance>=50 alternate. Anything that collapses the two terrain values
		// onto one makes the furrowed pair unreachable - which is exactly what the live scene did.
		assert.equal(foregroundGrassFrame(15, 0), 151, 'plain high grass');
		assert.equal(foregroundGrassFrame(15, 60), 155, 'plain high grass, alternate');
		assert.equal(foregroundGrassFrame(30, 0), 152, 'furrowed grass');
		assert.equal(foregroundGrassFrame(30, 60), 156, 'furrowed grass, alternate');
		assert.equal(foregroundGrassFrame(1, 0), -1, 'ordinary floor draws no grass overlay');
	});
	check('the fixed-layout dispatcher still returns the START map for depth 10', () => {
		const { paint } = generateBossFloor(10);
		assert.equal(paint.map[10 + 23 * 32], Terrain.LOCKED_DOOR, 'depth entry itself still uses the locked START map');
	});
	// The floor is only playable if the hero can *walk* from where he arrives to the cells each
	// transition is about. Pinning individual cells cannot catch a layout that is right cell by
	// cell and still disconnected: `Painter.fill(level, rect, ...)` takes exclusive `right`/
	// `bottom` edges, and reading them as inclusive put a wall down `startCells[0]`'s border,
	// deleting the one-cell hallway spine at x=10 and sealing the entrance room - and therefore
	// Tengu himself, and the whole fight - off from the rest of the level, with every per-cell
	// assertion above still green. This check is that guard.
	const passable = new Set([Terrain.EMPTY, Terrain.GRASS, Terrain.EMPTY_WELL, Terrain.WATER, Terrain.DOOR,
		Terrain.ENTRANCE, Terrain.EXIT, Terrain.EMBERS, Terrain.PEDESTAL, Terrain.EMPTY_SP, Terrain.HIGH_GRASS,
		Terrain.SECRET_TRAP, Terrain.INACTIVE_TRAP, Terrain.EMPTY_DECO, Terrain.SIGN, Terrain.REGION_DECO, Terrain.REGION_DECO_ALT]);
	const flood = (paint, from) => {
		const width = paint.w, height = paint.map.length / width;
		const seen = new Set();
		const cell0 = from.y * width + from.x;
		if (!passable.has(paint.map[cell0])) return seen;
		seen.add(cell0);
		const queue = [cell0];
		while (queue.length) {
			const cell = queue.pop(), x = cell % width, y = Math.floor(cell / width);
			for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
				const nx = x + dx, ny = y + dy;
				if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
				const n = ny * width + nx;
				if (seen.has(n) || !passable.has(paint.map[n])) continue;
				seen.add(n);
				queue.push(n);
			}
		}
		return seen;
	};
	const walkable = (seen, paint, x, y) => seen.has(y * paint.w + x);
	check('the hero can walk from the prison entrance to Tengu\'s door, and only the locked door bars the cell', () => {
		const { paint } = generateBossFloor(10);
		const seen = flood(paint, { x: 10, y: 4 });
		assert.ok(walkable(seen, paint, 10, 22), 'the hallway reaches the cell door from above');
		for (const [x, y] of [[7, 12], [13, 12], [7, 18], [13, 18]]) {
			assert.ok(walkable(seen, paint, x, y), `start cell (${x},${y}) is reachable from the entrance`);
		}
		assert.ok(walkable(seen, paint, 10, 8) && walkable(seen, paint, 10, 12) && walkable(seen, paint, 10, 22),
			'the whole x=10 hallway spine is walkable, door to door to door');
		assert.equal(paint.map[10 + 23 * 32], Terrain.LOCKED_DOOR, 'Tengu\'s door is the locked one');
		assert.ok(!walkable(seen, paint, 10, PRISON_TENGU_CELL.top + 1),
			'and the cell behind it is sealed until that door is unlocked, as Java intends');
	});
	// Each arena is one `Painter` shape call on a `Rect`, and every one of them is a place the
	// exclusive-`right`/`bottom` reading can silently cost or add a ring of cells: the ellipse's
	// width/height is the rect's own exclusive extent inset by its margin, and the King's room is
	// a *diamond*, not an ellipse. Recomputing each shape from Java's own arguments on a blank map
	// and comparing the walkable sets pins all three at once.
	const shapeCells = (w, h, fill) => {
		const blank = new PaintLevel(w, h, Terrain.WALL);
		fill(blank);
		const out = new Set();
		for (let cell = 0; cell < blank.map.length; cell++) if (blank.map[cell] === Terrain.EMPTY) out.add(cell);
		return out;
	};
	check('the three arena shapes are Java\'s own rect-and-margin, not an inclusive reading of them', () => {
		const { paint: caves } = generateBossFloor(15);
		const cavesExpected = shapeCells(33, 42, (lvl) => fillEllipseRect(lvl, CAVES_BOSS_ARENA.left, CAVES_BOSS_ARENA.top, CAVES_BOSS_ARENA.right, CAVES_BOSS_ARENA.bottom, 0, Terrain.EMPTY));
		assert.equal(caves.map.length, 33 * 42);
		// the cave arena is the only EMPTY region the ellipse owns; compare cell for cell, allowing
		// the port's own non-elliptical additions (the gate row, the entrance/exit block, statues)
		let missing = 0;
		for (const cell of cavesExpected) if (caves.map[cell] === Terrain.CHASM) missing++;
		assert.equal(missing, 0, `${missing} of Java's ${cavesExpected.size} cave-arena cells are not walkable in the port`);
		// The cell that tells the two readings apart: Java's 23-wide top row starts one column
		// further left (col 13) than the 24-wide reading's did, so the ellipse clears this cell and
		// the old call left it chasm. Asserted as "not chasm" rather than "floor" on purpose - the
		// water/trap patch rolls over the whole arena below row 14, so this cell's exact terrain is
		// a function of the RNG stream, while its not being a pit is not.
		assert.notEqual(caves.map[13 + 14 * 33], Terrain.CHASM, 'the arena ellipse\'s top row reaches col 13, as Java\'s 23x23 does');
		// The floor's base fill is `WALL`, as Java's `Level.setSize()` gives every non-CHASM
		// feeling, so the only pits on it are `CavesBossLevel.build()`'s own five strips. Building
		// over a CHASM base instead (as this floor used to) leaves walkable cells beside a pit
		// where Java has rock - and this port lets the hero step into a chasm, so that is a hole
		// out of the boss floor, not scenery. Counting the strips plus the fills that overwrite
		// them is fiddly; asserting that no *other* cell is a pit is not.
		const javaStrips = (x, y) => (y >= 3 && y <= 6) || (y === 7 && x >= 6 && x <= 26)
			|| (y === 8 && x >= 10 && x <= 22) || (y === 9 && x >= 12 && x <= 20) || (y === 10 && x >= 13 && x <= 19);
		let strayPits = 0;
		for (let cell = 0; cell < caves.map.length; cell++) {
			if (caves.map[cell] !== Terrain.CHASM) continue;
			if (!javaStrips(cell % 33, Math.floor(cell / 33))) strayPits++;
		}
		assert.equal(strayPits, 0, `${strayPits} pit cells outside Java's own chasm strips`);
		let rim = 0;
		for (let cell = 0; cell < caves.map.length; cell++) {
			if (caves.map[cell] !== Terrain.EMPTY) continue;
			const x = cell % 33, y = Math.floor(cell / 33);
			if ([[-1, 0], [1, 0], [0, -1], [0, 1]].some(([dx, dy]) => javaStrips(x + dx, y + dy) === false
				&& caves.map[(y + dy) * 33 + (x + dx)] === Terrain.CHASM)) rim++;
		}
		assert.equal(rim, 0, `${rim} walkable cells border a pit Java has as wall`);

		const { paint: city } = generateBossFloor(20);
		const cityExpected = shapeCells(15, 48, (lvl) => fillDiamondRect(lvl, CITY_BOSS_ARENA.left, CITY_BOSS_ARENA.top, CITY_BOSS_ARENA.right, CITY_BOSS_ARENA.bottom, 1, Terrain.EMPTY));
		let cityMissing = 0;
		for (const cell of cityExpected) if (city.map[cell] === Terrain.CHASM) cityMissing++;
		assert.equal(cityMissing, 0, `${cityMissing} of the King's ${cityExpected.size} diamond cells are not walkable in the port`);
		// ...and the corners of the bounding rect must NOT be walkable, which is what tells a
		// diamond from the ellipse this used to be
		for (const [x, y] of [[2, 26], [12, 26], [2, 36], [12, 36]]) {
			assert.notEqual(city.map[x + y * 15], Terrain.EMPTY, `the diamond's corner (${x},${y}) should be wall, not floor`);
		}

		const prisonArena = prisonBossArena().paint;
		const prisonExpected = shapeCells(32, 32, (lvl) => fillEllipseRect(lvl, PRISON_ARENA.left, PRISON_ARENA.top, PRISON_ARENA.right, PRISON_ARENA.bottom, 1, Terrain.EMPTY));
		let prisonMissing = 0, prisonExtra = 0;
		for (const cell of prisonExpected) if (prisonArena.map[cell] !== Terrain.EMPTY) prisonMissing++;
		for (let cell = 0; cell < prisonArena.map.length; cell++) {
			if (prisonArena.map[cell] === Terrain.EMPTY && !prisonExpected.has(cell)) prisonExtra++;
		}
		assert.equal(prisonMissing, 0, `${prisonMissing} of Java's ${prisonExpected.size} Tengu-arena cells are missing`);
		assert.equal(prisonExtra, 0, `${prisonExtra} walkable cells sit outside Java's Tengu arena`);
	});
	check('every transition\'s own destination is walkable from the cell it starts in', () => {
		const pause = prisonBossPause().paint;
		const fromCell = flood(pause, { x: 10, y: 25 });
		assert.ok(walkable(fromCell, pause, 10, 8), 'the retreat row that fires `setMapArena()` is reachable at half HP');
		const end = prisonBossEnd().paint;
		const fromDeath = flood(end, { x: 10, y: 25 });
		const exit = end.map.indexOf(Terrain.EXIT);
		assert.ok(exit >= 0, 'the death map has an exit');
		assert.ok(walkable(fromDeath, end, exit % end.w, Math.floor(exit / end.w)),
			'the walkable exit `setMapEnd()` opens is reachable from the cell it puts the hero back in');
	});

	// `CityBossLevel.build()` (`v3.3.8`): the entrance room's WALL ring, BOOKSHELF lining,
	// freestanding columns, REGION_DECO marks, STATUE rows, EMPTY_SP spine, DOOR and
	// ENTRANCE; the diamond throne room with its EMPTY_SP/SIGN margins, statues,
	// pedestals and locked top door; the exit hallway's CHASM/EMPTY/EXIT fills; the Imp
	// shop's pedestal, statues and corridor link; and the eight 2x2 WALL pillars.
	check('the City throne room is Java\'s build, not the old hand-matched rects', () => {
		const { paint } = generateBossFloor(20);
		const at = (x, y) => paint.map[x + y * 15];
		assert.equal(paint.map.length, 15 * 48);
		//entrance room: WALL ring, BOOKSHELF lining, EMPTY heart
		assert.equal(at(1, 37), Terrain.WALL, 'the entry rect starts with a WALL ring');
		assert.equal(at(2, 38), Terrain.BOOKSHELF, 'one cell in is the BOOKSHELF lining');
		assert.equal(at(3, 39), Terrain.EMPTY, 'two cells in is the EMPTY heart');
		assert.equal(at(4, 40), Terrain.BOOKSHELF, 'the freestanding west column');
		assert.equal(at(10, 44), Terrain.BOOKSHELF, 'and the east one');
		assert.equal(at(6, 38), Terrain.REGION_DECO, 'the west deco mark');
		assert.equal(at(8, 38), Terrain.REGION_DECO, 'and the east one');
		assert.deepEqual([6, 7, 8].map((x) => at(x, 40)), [Terrain.STATUE, Terrain.EMPTY_SP, Terrain.STATUE], 'the first statue row, crossed by the spine');
		assert.deepEqual([6, 7, 8].map((x) => at(x, 44)), [Terrain.STATUE, Terrain.ENTRANCE, Terrain.STATUE], 'and the third, crossed by the entrance');
		assert.equal(at(7, 38), Terrain.EMPTY_SP, 'the EMPTY_SP spine');
		assert.equal(at(7, 37), Terrain.DOOR, 'the entry door, which is also the arena bottom door');
		assert.equal(at(CITY_ENTRANCE_CELL.x, CITY_ENTRANCE_CELL.y), Terrain.ENTRANCE, 'the entrance at entry.center() + 2 rows');
		//throne room: diamond margins, statues, pedestals, locked door
		assert.equal(at(CITY_THRONE.x, CITY_THRONE.y), Terrain.SIGN, 'the throne is CUSTOM_DECO (SIGN stand-in)');
		assert.equal(at(6, 30), Terrain.EMPTY_SP, 'the inset-5 EMPTY_SP margin');
		for (const p of CITY_PEDESTALS) assert.equal(at(p.x, p.y), Terrain.PEDESTAL, `pedestal (${p.x},${p.y})`);
		for (const [x, y] of [[4, 31], [3, 31], [10, 31], [11, 31]]) assert.equal(at(x, y), Terrain.STATUE, `throne statue (${x},${y})`);
		assert.equal(at(CITY_TOP_DOOR.x, CITY_TOP_DOOR.y), Terrain.LOCKED_DOOR, 'the locked top door');
		assert.deepEqual([CITY_BOTTOM_DOOR.x, CITY_BOTTOM_DOOR.y], [7, 37], 'the bottom door is the entry door');
		//exit hallway and Imp shop base marks
		assert.equal(at(0, 0), Terrain.CHASM, 'the end block starts as chasm');
		assert.equal(at(4, 5), Terrain.EXIT, 'the EXIT head of the corridor');
		assert.equal(at(CITY_EXIT_CELL.x, CITY_EXIT_CELL.y), Terrain.EXIT, 'the exit cell inside it');
		assert.equal(at(7, 16), Terrain.PEDESTAL, 'the Imp shop pedestal at the shop rect centre');
		assert.equal(at(5, 12), Terrain.STATUE, 'the shop statues');
		assert.equal(at(9, 12), Terrain.STATUE, 'both of them');
		assert.equal(at(1, 2), Terrain.WALL, 'the first pillar block');
		assert.equal(at(12, 17), Terrain.WALL, 'and the last one');
		//the old reading's giveaways are gone: no BOOKSHELF sea, no second LOCKED_DOOR row,
		//no statues at y=32, no stray EXIT at (7,13), pedestals at Java's ±3 cells
		assert.notEqual(at(7, 13), Terrain.EXIT, 'no stray EXIT halfway down the old map');
		assert.equal(at(4, 28), Terrain.PEDESTAL, 'pedestals at c±3, not the old y=31/37 guess');
	});

	// `HallsBossLevel.build()` (`v3.3.8`): the 11x11 EMPTY ring, the 9x9 EMPTY_SP room
	// with its 26-cell WALL_DECO band (top two rows plus the two bottom corners - solid,
	// so the walkable room is 9x7), the inner 3x4 EMPTY, the boss seat, the exit
	// transition with no EXIT tile yet, and exactly one ENTRANCE tile on the middle arm.
	check('the Halls approach arms roll Java\'s ranges around Java\'s room', () => {
		const { paint } = generateBossFloor(25);
		const at = (x, y) => paint.map[x + y * 32];
		assert.equal(paint.map.length, 32 * 32);
		let wallDeco = 0;
		for (const t of paint.map) if (t === Terrain.WALL_DECO) wallDeco++;
		assert.equal(wallDeco, 26, 'the WALL_DECO band is 18 + 4 + 4, not the old 8 corner cells');
		assert.equal(at(12, 8), Terrain.WALL_DECO, 'the band covers the room top rows');
		assert.equal(at(16, 9), Terrain.WALL_DECO, 'the exit cell sits in the WALL_DECO band until unseal()');
		assert.equal(at(16, 12), Terrain.EMPTY, 'the boss seat is the inner EMPTY');
		assert.ok(paint.transitions.some((t) => t.pos === HALLS_EXIT_CELL.y * 32 + HALLS_EXIT_CELL.x && t.type === 'regularExit'),
			'the REGULAR_EXIT transition is registered at (16,9) with no tile yet');
		const entrances = [];
		for (let cell = 0; cell < paint.map.length; cell++) if (paint.map[cell] === Terrain.ENTRANCE) entrances.push(cell);
		assert.equal(entrances.length, 1, 'exactly one ENTRANCE tile');
		assert.equal(entrances[0] % 32, 16, 'on the middle arm');
		const entranceY = Math.floor(entrances[0] / 32);
		assert.ok(entranceY >= 23 && entranceY <= 27, `at the rolled arm end (y=${entranceY})`);
		assert.ok(paint.transitions.some((t) => t.pos === entrances[0] && t.type === 'regularEntrance'),
			'with its own REGULAR_ENTRANCE transition');
		assert.equal(at(11, 7), Terrain.EMPTY, 'the 11x11 EMPTY ring joins the arms to the room');
	});

	// --- `CavesBossLevel`'s three custom tilemaps (see `cavesBossVisuals.ts`) -------------------
	// The entrance/overhang maps are *cursor* walks, so what they are pinned on is alignment: the
	// 5-wide `entryWay` block must land on `tileW/2 - 2` of every row, in the table's own order, and
	// the two "wall stamp" rows must be left free at exactly the two metal-structure columns.
	const CAVE_W = 33, CAVE_H = 42;
	check('`CityEntrance.create()` copies its 5-wide entry block down `tileW/2 - 2`, row by row', () => {
		const frames = cityEntranceFrames(CAVE_W, 11);
		const at = (x, y) => frames[y * CAVE_W + x];
		const block = (y) => [0, 1, 2, 3, 4].map((k) => at(14 + k, y));
		// Java's own `entryWay` rows 0, 2, 3 and 10 (`CityEntrance.java`, tag v3.3.8)
		assert.deepEqual(block(0), [-1, 7, 7, 7, -1]);
		assert.deepEqual(block(2), [8, 1, 2, 3, 12]);
		assert.deepEqual(block(3), [16, 9, 10, 11, 20]);
		assert.deepEqual(block(10), [24, 25, 26, 27, 28]);
		// and every step between those rows is the next five cells of the same table, in order
		assert.deepEqual(block(1), [-1, 1, 2, 3, -1]);
		assert.deepEqual(block(4), [16, 16, 18, 20, 20], 'the alternating rows from here down');
		assert.deepEqual(block(5), [16, 17, 18, 19, 20]);
		assert.deepEqual([6, 7, 8, 9].map(block), [
			[16, 16, 18, 20, 20], [16, 17, 18, 19, 20], [16, 16, 18, 20, 20], [16, 17, 18, 19, 20],
		]);
		// rows 2 and 3 wall the rest of their own row, except at the two metal columns...
		for (let x = 0; x < CAVE_W; x++) {
			if (x >= 14 && x <= 18) continue;
			assert.equal(at(x, 2), 13, `row 2, col ${x} should be the ceiling frame`);
			assert.equal(at(x, 3), (x === 9 || x === 23) ? NULL_TILE : 21, `row 3, col ${x}`);
		}
		// ...and no other row draws anything outside its entry block
		for (let y = 0; y < 11; y++) {
			if (y === 2 || y === 3) continue;
			for (let x = 0; x < CAVE_W; x++) {
				if (x >= 14 && x <= 18) continue;
				assert.equal(at(x, y), NULL_TILE, `row ${y}, col ${x} should be untouched`);
			}
		}
	});
	check('`EntranceOverhang.create()` draws nothing but its own entry column', () => {
		const frames = entranceOverhangFrames(CAVE_W, 11);
		for (let y = 0; y < 11; y++) {
			for (let x = 0; x < CAVE_W; x++) {
				if (x >= 14 && x <= 18) continue;
				assert.equal(frames[y * CAVE_W + x], NULL_TILE, `row ${y}, col ${x} should be untouched`);
			}
		}
		const block = (y) => [0, 1, 2, 3, 4].map((k) => frames[y * CAVE_W + 14 + k]);
		assert.deepEqual(block(0), [0, 7, 7, 7, 4]);
		assert.deepEqual(block(1), [0, 15, 15, 15, 4]);
		assert.deepEqual(block(2), [-1, 23, 23, 23, -1]);
		assert.deepEqual(block(4), [-1, 6, -1, 14, -1], 'the hanging-light rows are the odd ones');
		assert.deepEqual(block(10), [-1, -1, -1, -1, -1]);
	});
	// `gate` is `Rect(14,13,19,14)`: **five** cells on row 13, since a plain `Rect`'s right/bottom are
	// exclusive. Read inclusively it is twelve cells (and six after the arena ellipse clears row 14),
	// which is what this port painted until 2026-09-16 - an extra `CUSTOM_DECO` at (19,13) that
	// `dm300Supercharge` counted as an energized cell.
	check('the gate is Java\'s five-cell rect, and the frame run covers exactly those cells', () => {
		assert.equal(CAVES_GATE.right - CAVES_GATE.left, 5);
		assert.equal(CAVES_GATE.bottom - CAVES_GATE.top, 1);
		const level = new PaintLevel(CAVE_W, CAVE_H, Terrain.WALL);
		const context = {
			terrain: level.map, width: CAVE_W, gateIntact: true, locked: false,
			pylonActorAt: () => false,
			insideGate: (cell) => {
				const x = cell % CAVE_W, y = Math.floor(cell / CAVE_W);
				return x >= CAVES_GATE.left && x < CAVES_GATE.right && y >= CAVES_GATE.top && y < CAVES_GATE.bottom;
			},
		};
		const frames = cavesArenaFrames(context, CAVE_W, 27, 12);
		const at = (x, y) => frames[(y - 12) * CAVE_W + x];
		assert.deepEqual([14, 15, 16, 17, 18].map((x) => at(x, 13)), [40, 41, 42, 43, 44], 'a whole gate draws 40..44');
		for (const x of [13, 19]) assert.equal(at(x, 13), NULL_TILE, `col ${x} is outside the gate rect`);
		assert.equal(at(14, 14), NULL_TILE, 'and row 14 is outside it too');
		const broken = cavesArenaFrames({ ...context, gateIntact: false }, CAVE_W, 27, 12);
		assert.deepEqual([14, 15, 16, 17, 18].map((x) => broken[(13 - 12) * CAVE_W + x]), [32, 33, 34, 35, 36]);
		// the gate's own description follows the same fact (`ArenaVisuals.desc()`)
		const gateCell = 16 + 13 * CAVE_W;
		assert.equal(cavesArenaDescKey(context, gateCell), 'levels.cavesbosslevel.gate_desc');
		assert.equal(cavesArenaDescKey({ ...context, gateIntact: false }, gateCell), 'levels.cavesbosslevel.gate_desc_broken');
		assert.equal(cavesArenaNameKey(context, gateCell), 'levels.cavesbosslevel.gate_name');
	});
	check('`ArenaVisuals.updateState()` draws the wires, the pylon sockets and the seal-gated `38`', () => {
		const level = new PaintLevel(CAVE_W, CAVE_H, Terrain.WALL);
		// Java's arena floor is `EMPTY_SP` wherever the pylons and their wires are; the pylon cells
		// themselves are set `EMPTY` by the pylon loop, so both are painted here
		for (const pylon of CAVES_PYLON_POSITIONS) {
			level.map[pylon] = Terrain.EMPTY_SP;
			const x = pylon % CAVE_W, y = Math.floor(pylon / CAVE_W);
			for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
				level.map[(y + dy) * CAVE_W + (x + dx)] = Terrain.EMPTY_SP;
			}
		}
		const wire = 15 + 20 * CAVE_W;
		level.map[wire] = Terrain.INACTIVE_TRAP;
		const context = {
			terrain: level.map, width: CAVE_W, gateIntact: true, locked: true,
			pylonActorAt: () => false,
			insideGate: (cell) => {
				const x = cell % CAVE_W, y = Math.floor(cell / CAVE_W);
				return x >= CAVES_GATE.left && x < CAVES_GATE.right && y >= CAVES_GATE.top && y < CAVES_GATE.bottom;
			},
		};
		const frames = cavesArenaFrames(context, CAVE_W, 27, 12);
		const at = (x, y) => frames[(y - 12) * CAVE_W + x];
		// `54 + (j % w + 8*(j / w)) - (k % w + 8*(k / w))`, i.e. one of the eight directional wire
		// tiles, for the cell east of the (4,13) pylon - the formula Java writes verbatim
		assert.equal(at(5, 13), 54 + (5 + 8 * 13) - (4 + 8 * 13));
		assert.equal(at(3, 12), 54 + (3 + 8 * 12) - (4 + 8 * 13), 'diagonals count as adjacent (`Level.adjacent`)');
		// an unwired neighbour of a pylon cell gets nothing: (6,13) is two cells from (4,13)
		assert.equal(at(6, 13), NULL_TILE);
		assert.equal(at(15, 20), 37, 'an `INACTIVE_TRAP` cell is exposed wiring');
		assert.equal(cavesArenaNameKey(context, wire), 'levels.cavesbosslevel.wires_name');
		assert.equal(cavesArenaDescKey(context, wire), 'levels.cavesbosslevel.wires_desc');
		// a sealed arena with no pylon actor on the cell draws the socket frame; a live pylon, or an
		// unsealed arena, draws nothing there
		const pylonCell = CAVES_PYLON_POSITIONS[0];
		assert.equal(frames[pylonCell - 12 * CAVE_W], 38);
		assert.equal(cavesArenaFrames({ ...context, pylonActorAt: (cell) => cell === pylonCell }, CAVE_W, 27, 12)[pylonCell - 12 * CAVE_W], NULL_TILE);
		assert.equal(cavesArenaFrames({ ...context, locked: false }, CAVE_W, 27, 12)[pylonCell - 12 * CAVE_W], NULL_TILE);
		// and the ordinary floor around them is untouched
		assert.equal(at(2, 20), NULL_TILE);
	});
	check('the arena layer is Java\'s (0,12,width,27) rect, and its named cells are the drawn ones', () => {
		const level = new PaintLevel(CAVE_W, CAVE_H, Terrain.WALL);
		for (const pylon of CAVES_PYLON_POSITIONS) level.map[pylon] = Terrain.EMPTY_SP;
		const tramp = 20 + 30 * CAVE_W;
		level.map[tramp] = Terrain.INACTIVE_TRAP;
		const context = {
			terrain: level.map, width: CAVE_W, gateIntact: true, locked: false,
			pylonActorAt: () => false,
			insideGate: (cell) => {
				const x = cell % CAVE_W, y = Math.floor(cell / CAVE_W);
				return x >= CAVES_GATE.left && x < CAVES_GATE.right && y >= CAVES_GATE.top && y < CAVES_GATE.bottom;
			},
		};
		const layer = cavesArenaLayer(CAVE_W, CAVE_H, context);
		assert.equal(layer.length, CAVE_W * CAVE_H);
		// the block starts at row 12 and spans 27 rows: 12..38
		for (let x = 0; x < CAVE_W; x++) {
			assert.equal(layer[x], NULL_TILE, 'row 11 is above the rect');
			assert.equal(layer[39 * CAVE_W + x], NULL_TILE, 'row 39 is below it');
		}
		assert.equal(layer[13 * CAVE_W + 16], 42, 'the gate run is placed at the rect\'s own origin');
		// `WndInfoCell.cellName` only consults a custom tilemap where its `image()` is non-null, and
		// `ArenaVisuals.image()` is null on `NULL_TILE` cells *and* on every cell within one square of
		// a pylon. The port's examine path gates on the name alone, so a cell that names itself must
		// also be one the layer draws on.
		let namedButBlank = 0;
		for (let cell = 0; cell < layer.length; cell++) {
			if (cavesArenaNameKey(context, cell) !== undefined && layer[cell] === NULL_TILE) namedButBlank++;
		}
		assert.equal(namedButBlank, 0, `${namedButBlank} cells name themselves where Java's tilemap draws nothing`);
		// ...and nothing inside a pylon's own 3x3 names itself, which is `ArenaVisuals.image()`'s
		// suppression (`distance(cell, k) <= 1 -> null`), the rule that keeps the wire frames beside a
		// pylon from answering as wiring
		let namedUnderPylon = 0;
		for (const pylon of CAVES_PYLON_POSITIONS) {
			const px = pylon % CAVE_W, py = Math.floor(pylon / CAVE_W);
			for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
				const near = (py + dy) * CAVE_W + (px + dx);
				if (cavesArenaNameKey(context, near) !== undefined) namedUnderPylon++;
			}
		}
		assert.equal(namedUnderPylon, 0, `${namedUnderPylon} pylon-adjacent cells name themselves`);
		// ...and the same must hold on the *real* floor, not just this synthetic one: the examine
		// path reads names off the live context, so a gate cell that were `EMPTY_SP` (which the layer
		// would draw nothing on) would name itself as the gate anyway
		const { paint: realCaves } = generateBossFloor(15);
		const realContext = {
			terrain: realCaves.map, width: CAVE_W, gateIntact: true, locked: false,
			pylonActorAt: () => false,
			insideGate: (cell) => {
				const x = cell % CAVE_W, y = Math.floor(cell / CAVE_W);
				return x >= CAVES_GATE.left && x < CAVES_GATE.right && y >= CAVES_GATE.top && y < CAVES_GATE.bottom;
			},
		};
		const realLayer = cavesArenaLayer(CAVE_W, CAVE_H, realContext);
		let realNamedButBlank = 0;
		for (let cell = 0; cell < realLayer.length; cell++) {
			if (cavesArenaNameKey(realContext, cell) !== undefined && realLayer[cell] === NULL_TILE) realNamedButBlank++;
		}
		assert.equal(realNamedButBlank, 0, `${realNamedButBlank} real-floor cells name themselves where nothing is drawn`);
		// the gate's own terrain on the real floor is Java's five `CUSTOM_DECO`-stand-in cells and
		// nothing else - the six-cell reading this port used until 2026-09-16 painted (19,13) too
		const gateCells = [];
		for (let cell = 0; cell < realCaves.map.length; cell++) if (realCaves.map[cell] === Terrain.SIGN) gateCells.push(cell);
		assert.deepEqual(gateCells, [14, 15, 16, 17, 18].map((x) => x + 13 * CAVE_W));
		// the four pylon cells exist in three copies - the spawned actors, `CAVES_PYLON_POSITIONS` for
		// the frame math, and `cavesBossPylons` in the scene for the seal trigger - so the floor's own
		// copy is checked against the exported one here rather than left to drift silently
		assert.deepEqual(realCaves.mobs.filter((mob) => mob.kind === 'pylon').map((mob) => mob.pos),
			[...CAVES_PYLON_POSITIONS], 'the spawned pylons are the cells the frame math uses');
	});

	// `CavesBossLevel.build()`'s last call is `new CavesPainter().paint(this, null)` (line 140), whose
	// two global scans run even with a null room list - and which the port used to skip entirely, on a
	// recorded claim that the pass was a no-op. The counts below are the pass's own output at seed 42:
	// they are a regression pin in the strict sense (removing the call takes both to zero and fails
	// here), and the water/trap/sign figures beside them are what prove the pass left the pylon
	// mechanic's own terrain alone.
	check('`CavesPainter`\'s null-room pass paints the boss floor\'s floor deco and ore veins', () => {
		const { SpdRandom } = require('./spdRng');
		SpdRandom.pushGenerator(42n);
		let paint;
		try {
			paint = generateBossFloor(15).paint;
		} finally {
			SpdRandom.popGenerator();
		}
		const histogram = new Map();
		for (const terrain of paint.map) histogram.set(terrain, (histogram.get(terrain) ?? 0) + 1);
		assert.equal(histogram.get(Terrain.EMPTY_DECO), 95, 'the EMPTY -> EMPTY_DECO scan');
		assert.equal(histogram.get(Terrain.WALL_DECO), 13, 'and generateGold\'s ore veins');
		// the pass runs before the chasm strips and the corridor fills and paints no pit, and the
		// pylon mechanic's own cells (WATER/INACTIVE_TRAP/SIGN from row 13 down) are untouched by it
		assert.equal(histogram.get(Terrain.CHASM), 132, 'the floor still has Java\'s 132 pits');
		assert.equal(histogram.get(Terrain.WATER), 40);
		assert.equal(histogram.get(Terrain.INACTIVE_TRAP), 36);
		assert.equal(histogram.get(Terrain.SIGN), 5);
		let energy = 0;
		for (let i = 13 * paint.w; i < paint.map.length; i++) {
			const terrain = paint.map[i];
			if (terrain === Terrain.WATER || terrain === Terrain.INACTIVE_TRAP || terrain === Terrain.SIGN) energy++;
		}
		assert.equal(energy, 81, 'the energized-cell set `activatePylon()` seeds');
	});

	// `HallsBossLevel`'s centre pieces (depth 25): two fixed 9x8 blocks, `CenterPieceVisuals` on the
	// floor layer at (ROOM_LEFT, ROOM_TOP+1) and `CenterPieceWalls` on the wall layer one row higher.
	// Java's variant fires when `map[exit()] == EXIT`, which at build time it is not (the arena fill
	// leaves `EMPTY_SP` there for the level's own seal trigger) - so the plain block is the one the
	// fight shows, and the portal/archway variant is `unseal()`'s.
	check("the Halls boss centre piece is Java's two blocks at Java's own origins", () => {
		assert.equal(HALLS_ROOM_LEFT, 12, 'a 32-wide floor, WIDTH/2 - 4');
		assert.equal(HALLS_ROOM_TOP, 8);
		const piece = hallsCenterPieceFrames(false);
		const walls = hallsCenterWallFrames(false);
		assert.equal(piece.length, 9 * 8);
		assert.equal(walls.length, 9 * 8, 'the walls map holds eight rows even though Java declares tileH = 9');
		// the four corners of the floor block are Java's own first/last entries, and the pillars are
		// the two rows of the wall block that are not blank
		assert.equal(piece[0], 8);
		assert.equal(piece[8], 14);
		assert.equal(piece[63], 48, "the block's bottom-left corner");
		assert.equal(piece[71], 49, "and its bottom-right one");
		assert.equal(walls[54], 32);
		assert.equal(walls[62], 33);
		assert.equal(walls[72 - 9 + 0], 40, "the second pillar row starts at the block's own row 7");
		assert.equal(walls.filter((frame) => frame !== NULL_TILE).length, 8, 'only the two pillar rows draw');

		// the layers land where `pos` puts them: rows ROOM_TOP+1..ROOM_TOP+8 for the floor block and
		// ROOM_TOP..ROOM_TOP+7 for the walls, cols ROOM_LEFT..ROOM_LEFT+8 for both
		const pieceLayer = hallsCenterPieceLayer(32, 32, false);
		const wallLayer = hallsCenterWallLayer(32, 32, false);
		assert.equal(pieceLayer.length, 32 * 32);
		assert.deepEqual(
			[0, 1, 2].map((k) => pieceLayer[(HALLS_ROOM_TOP + 1 + k) * 32 + HALLS_ROOM_LEFT]),
			[8, 16, 24], "the block's first column lands on the floor layer");
		assert.equal(pieceLayer[HALLS_ROOM_TOP * 32 + HALLS_ROOM_LEFT], NULL_TILE, 'the floor block starts a row below the walls one');
		assert.deepEqual(
			[0, 1].map((k) => wallLayer[(HALLS_ROOM_TOP + k) * 32 + HALLS_ROOM_LEFT]),
			[NULL_TILE, NULL_TILE], "the wall block's own first rows are blank");
		assert.equal(wallLayer[(HALLS_ROOM_TOP + 6) * 32 + HALLS_ROOM_LEFT], 32, 'and its pillar row is six rows down');
		let drawnOffRect = 0;
		for (let cell = 0; cell < pieceLayer.length; cell++) {
			if (pieceLayer[cell] === NULL_TILE) continue;
			const x = cell % 32, y = Math.floor(cell / 32);
			if (x < HALLS_ROOM_LEFT || x >= HALLS_ROOM_LEFT + 9 || y < HALLS_ROOM_TOP + 1 || y >= HALLS_ROOM_TOP + 9) drawnOffRect++;
		}
		assert.equal(drawnOffRect, 0, `${drawnOffRect} frames drawn outside the block's own rect`);

		// and the unseal variant is exactly Java's four/five changed entries
		const openedPiece = hallsCenterPieceFrames(true);
		assert.equal(openedPiece[4], 19, "the portal tile replaces the block's centre");
		assert.equal(openedPiece[12], 31);
		assert.equal(openedPiece[14], 31);
		assert.equal(openedPiece.filter((frame, index) => frame !== piece[index]).length, 3);
		const openedWalls = hallsCenterWallFrames(true);
		assert.deepEqual([3, 4, 5, 13].map((index) => openedWalls[index]), [1, 0, 2, 23], 'the archway over the exit');
		assert.equal(openedWalls.filter((frame, index) => frame !== walls[index]).length, 4);
	});

	// `RitualSiteRoom.RitualMarker` (the Wandmaker's elemental-embers site): a 3x3 block, but *not*
	// the contiguous frames a naive reading picks - `mapSimpleImage(0, 0, 64)` walks a 4-column
	// atlas, so each row skips its fourth tile. Recomputing the helper's own `x + (texW/SIZE)*y`
	// here is the independent check; the constant is then pinned against it.
	check("the ritual marker takes Java's nine frames from the four-column quest atlas", () => {
		const SIZE = 16, TEX_WIDTH = 64, tileW = 3, texTileWidth = TEX_WIDTH / SIZE;
		const recomputed = [];
		let x = 0, y = 0;
		for (let i = 0; i < tileW * tileW; i++) {
			recomputed.push(x + texTileWidth * y);
			x++;
			if (x === tileW) { x = 0; y++; }
		}
		assert.deepEqual(recomputed, [0, 1, 2, 4, 5, 6, 8, 9, 10], "the atlas columns are 0,1,2 of each row");
		assert.deepEqual([...RITUAL_MARKER_FRAMES], recomputed, "the module's own list matches");
		assert.ok(!RITUAL_MARKER_NAME_KEY.endsWith('.desc') && RITUAL_MARKER_DESC_KEY.endsWith('.desc'));

		// the layer lands on the nine cells around the ritual cell - `pos(center - 1)` - and nowhere
		// else, and the same rect is what the examine path claims
		const WIDTH = 32, ritual = 10 + 10 * WIDTH;
		const layer = ritualMarkerLayer(WIDTH, WIDTH, ritual);
		assert.equal(layer.length, WIDTH * WIDTH);
		assert.deepEqual(
			[0, 1, 2].map((k) => layer[(9 + k) * WIDTH + 9]),
			[0, 4, 8], "the block's left column");
		assert.equal(layer[9 * WIDTH + 9], 0, 'top-left of the block');
		assert.equal(layer[11 * WIDTH + 11], 10, 'and its bottom-right');
		let drawn = 0;
		for (const frame of layer) if (frame !== NULL_TILE) drawn++;
		assert.equal(drawn, 9);
		for (let y = 0; y < WIDTH; y++) {
			for (let x = 0; x < WIDTH; x++) {
				const inside = insideRitualMarker(ritual, WIDTH, x, y);
				const painted = layer[y * WIDTH + x] !== NULL_TILE;
				assert.equal(inside, painted, `cell (${x},${y})`);
			}
		}
		// and a floor with no site draws nothing at all
		assert.ok(ritualMarkerLayer(WIDTH, WIDTH, -1).every((frame) => frame === NULL_TILE));
		assert.equal(insideRitualMarker(-1, WIDTH, 10, 10), false);
	});

	console.log(`${passed} vault checks passed.`);
} catch (error) {
	console.error(error);
	process.exit(1);
}
