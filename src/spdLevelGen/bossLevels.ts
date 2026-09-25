/**
 * Fixed-layout boss floors.
 *
 * The four Java boss levels after the Sewers are direct `Level` subclasses, not
 * `RegularLevel`s. They therefore must not go through the room graph builder. This
 * module ports their stable geometry and transition cells into the same PaintLevel
 * surface used by regular floors. Boss phase scripts remain scene-owned.
 */
import { PaintLevel, Terrain, fillEllipseRect, fillDiamondRect, fillXY, isPassableTerrain, set } from './paintLevel';
import type { Room } from './room';
import { spdPatchGenerate } from './spdPatch';
import { decorateStandaloneCaves } from './cavesDecorate';
import { decorateStandaloneCityBoss } from './cityDecorate';
import { SpdRandom, spdSeedForDepth } from '../spdRng';

export interface BossFloorData {
	paint: PaintLevel;
	rooms: Room[];
	feeling: number | null;
}

function room(left: number, top: number, right: number, bottom: number): Room {
	const r = { left, top, right, bottom } as Room;
	return r;
}

/** Inclusive bounds: fills `left..right` x `top..bottom`. Use for Java call sites that pass an
 *  explicit width/height (`Painter.fill(level, x, y, w, h, terrain)`). */
function fillRect(level: PaintLevel, left: number, top: number, right: number, bottom: number, terrain: number): void {
	fillXY(level, left, top, right - left + 1, bottom - top + 1, terrain);
}

/** `Painter.fill(level, rect, terrain)` - Java's own `Rect` arithmetic, whose `right`/`bottom` are
 *  **exclusive** edges (`Rect.width()` is `right - left`). So `Rect(5,9,10,16)` fills x 5..9, not
 *  5..10, and `Rect(6,23,15,32)` fills y 23..31.
 *
 *  This distinction is not cosmetic and is not interchangeable with `fillRect` above: mixing the
 *  two silently shifts a layout by one cell. It cost this floor its entire one-cell hallway spine -
 *  `PrisonBossLevel.startCells[0]`'s border is `x 5..9`, deliberately clearing the hallway column
 *  at x=10, and reading it inclusive put a wall there and sealed the entrance room off from the
 *  rest of the level (see this module's `paintPrisonBossStart`). */
function fillJavaRect(level: PaintLevel, left: number, top: number, right: number, bottom: number, terrain: number): void {
	fillXY(level, left, top, right - left, bottom - top, terrain);
}

/** `Painter.fill(level, rect, margin, terrain)` - Java's inset form: `margin` cells in from every
 *  edge of an exclusive-bounds `Rect`, so `fillJavaRect` + inset 1 is exactly Java's own
 *  "fill the room with WALL, then fill its interior with EMPTY" pair. */
function fillJavaRectInset(level: PaintLevel, left: number, top: number, right: number, bottom: number, margin: number, terrain: number): void {
	fillXY(level, left + margin, top + margin, (right - left) - margin * 2, (bottom - top) - margin * 2, terrain);
}

/** `PrisonBossLevel.tenguCell` (`v3.3.8`): Tengu's own lower cell, in Java's own exclusive-bounds
 *  `Rect` form (`right`/`bottom` are edges, so its interior is x 7..13, y 24..30 - see
 *  `fillJavaRect`). Exported because the fight's own trigger reads its top edge: `progress()`'s
 *  `case START:` fires only once the hero's own move lands past `tenguCell.top` - see
 *  `checkTenguFightStart`. */
export const PRISON_TENGU_CELL = { left: 6, top: 23, right: 15, bottom: 32 } as const;
/** `PrisonBossLevel.tenguCellCenter` (`v3.3.8`): where `progress()`'s `case START:` spawns Tengu
 *  (`pointToCell(tenguCellCenter)`), if nothing is already standing there. */
export const PRISON_TENGU_CELL_CENTER = { x: 10, y: 27 } as const;
/** `PrisonBossLevel.tenguCellDoor` (`v3.3.8`): the door the iron key opens and `progress()`
 *  immediately re-locks behind the hero (`set(pointToCell(tenguCellDoor), Terrain.LOCKED_DOOR)`). */
export const PRISON_TENGU_CELL_DOOR = { x: 10, y: 23 } as const;

/** `PrisonBossLevel.entranceRoom`/`startHallway` (`v3.3.8`), as Java's own exclusive-bounds
 *  `Rect`s.  The hallway's interior is a **single column at x=10, y 8..22** - see `fillJavaRect`
 *  for why that one cell matters. */
const PRISON_ENTRANCE_ROOM = { left: 8, top: 2, right: 13, bottom: 8 } as const;
const PRISON_START_HALLWAY = { left: 9, top: 7, right: 12, bottom: 24 } as const;
/** `PrisonBossLevel.startCells` (`v3.3.8`): the four prison cells flanking the hallway, reached
 *  through the four `DOOR`s set across the hallway's own walls below. */
export const PRISON_START_CELLS = [[5, 9, 10, 16], [11, 9, 16, 16], [5, 15, 10, 22], [11, 15, 16, 22]] as const;

/** `PrisonBossLevel.setMapStart()` (`v3.3.8`): the entrance room, hallway, four start cells, and
 *  Tengu's own lower cell behind a locked door. Shared by `setMapPause()`/`setMapEnd()`, which
 *  both repaint over this same base the way their Java originals call `setMapStart()` first.
 *
 *  Transcribed in Java's own statement order, which is load-bearing: the four start cells are
 *  filled *after* the hallway, so their wall borders overwrite it everywhere except the hallway's
 *  own interior column at x=10 - the spine that connects the entrance room down to Tengu's door.
 *  Getting the `Rect`/`Painter.fill` bounds wrong here (see `fillJavaRect`) does not merely
 *  misplace a wall, it disconnects the level: the hero arrives in the entrance room and can reach
 *  nothing else on the floor, door or boss included.
 *
 *  `addCagesToCells()` runs last here (and again at the end of each transition repaint -
 *  see `paintPrisonCages`); pass `runSeed` to spend Java's own draws, or nothing for the
 *  uncaged map. */
function paintPrisonBossStart(level: PaintLevel, runSeed?: bigint): void {
	fillXY(level, 0, 0, 32, 32, Terrain.WALL);

	//Start
	fillJavaRect(level, PRISON_ENTRANCE_ROOM.left, PRISON_ENTRANCE_ROOM.top, PRISON_ENTRANCE_ROOM.right, PRISON_ENTRANCE_ROOM.bottom, Terrain.WALL);
	fillJavaRectInset(level, PRISON_ENTRANCE_ROOM.left, PRISON_ENTRANCE_ROOM.top, PRISON_ENTRANCE_ROOM.right, PRISON_ENTRANCE_ROOM.bottom, 1, Terrain.EMPTY);
	set(level, 10, 4, Terrain.ENTRANCE);

	fillJavaRect(level, PRISON_START_HALLWAY.left, PRISON_START_HALLWAY.top, PRISON_START_HALLWAY.right, PRISON_START_HALLWAY.bottom, Terrain.WALL);
	fillJavaRectInset(level, PRISON_START_HALLWAY.left, PRISON_START_HALLWAY.top, PRISON_START_HALLWAY.right, PRISON_START_HALLWAY.bottom, 1, Terrain.EMPTY);

	set(level, PRISON_START_HALLWAY.left + 1, PRISON_START_HALLWAY.top, Terrain.DOOR);

	for (const [left, top, right, bottom] of PRISON_START_CELLS) {
		fillJavaRect(level, left, top, right, bottom, Terrain.WALL);
		fillJavaRectInset(level, left, top, right, bottom, 1, Terrain.EMPTY);
	}

	//the four doors punched through the hallway's walls into each flanking cell
	for (const [x, y] of [[PRISON_START_HALLWAY.left, PRISON_START_HALLWAY.top + 5], [PRISON_START_HALLWAY.right - 1, PRISON_START_HALLWAY.top + 5],
		[PRISON_START_HALLWAY.left, PRISON_START_HALLWAY.top + 11], [PRISON_START_HALLWAY.right - 1, PRISON_START_HALLWAY.top + 11]]) {
		set(level, x!, y!, Terrain.DOOR);
	}

	fillJavaRect(level, PRISON_TENGU_CELL.left, PRISON_TENGU_CELL.top, PRISON_TENGU_CELL.right, PRISON_TENGU_CELL.bottom, Terrain.WALL);
	fillJavaRectInset(level, PRISON_TENGU_CELL.left, PRISON_TENGU_CELL.top, PRISON_TENGU_CELL.right, PRISON_TENGU_CELL.bottom, 1, Terrain.EMPTY);
	set(level, PRISON_TENGU_CELL_DOOR.x, PRISON_TENGU_CELL_DOOR.y, Terrain.LOCKED_DOOR);

	for (const [x, y] of [[10, 2], [7, 9], [13, 9], [7, 15], [13, 15], [8, 23], [12, 23]]) set(level, x, y, Terrain.WALL_DECO);

	if (runSeed !== undefined) paintPrisonCages(level, runSeed);
}

/**
 * `PrisonBossLevel.addCagesToCells()` (`v3.3.8`): up to 5 `REGION_DECO` cage cells over the
 * start cells, each pick a random start cell's interior (`Int(4)`, then
 * `IntRange(left+1, right-2)`/`IntRange(top+1, bottom-2)`) kept only when a 4-neighbour is
 * `WALL`. Runs at the end of `setMapStart()`, `setMapPause()` and `setMapEnd()` alike -
 * each on a fresh `pushGenerator(seedCurDepth())`, so every repaint rolls the same five
 * picks (validity is re-checked against that repaint's own map).
 *
 * `spdSeedForDepth(runSeed, 10, 0)` *is* Java's `seedCurDepth()` (see `spdRng.ts`), pushed
 * the same way, with the same bit-matching LCG underneath and the same call order - so
 * these are Java's own cells, not an approximation. Callers that cannot name a run seed
 * (harness spot-checks) pass none and get the uncaged map.
 */
export function paintPrisonCages(level: PaintLevel, runSeed: bigint): void {
	SpdRandom.pushGenerator(spdSeedForDepth(runSeed, 10, 0));
	try {
		for (let i = 0; i < 5; i++) {
			const cell = PRISON_START_CELLS[SpdRandom.int(PRISON_START_CELLS.length)]!;
			const x = SpdRandom.intRange(cell[0] + 1, cell[2] - 2);
			const y = SpdRandom.intRange(cell[1] + 1, cell[3] - 2);
			const w = level.w;
			if (level.map[(y - 1) * w + x] === Terrain.WALL || level.map[(y + 1) * w + x] === Terrain.WALL
				|| level.map[y * w + x - 1] === Terrain.WALL || level.map[y * w + x + 1] === Terrain.WALL) {
				level.map[y * w + x] = Terrain.REGION_DECO;
			}
		}
	} finally {
		SpdRandom.popGenerator();
	}
}

function prisonBoss(runSeed?: bigint): BossFloorData {
	// PrisonBossLevel: setSize(32,32), with the start rooms and Tengu's lower cell.
	const level = new PaintLevel(32, 32);
	paintPrisonBossStart(level, runSeed);
	return { paint: level, rooms: [room(6, 23, 15, 31)], feeling: null };
}

/**
 * `PrisonBossLevel.setMapPause()` (`v3.3.8`), the `FIGHT_START -> FIGHT_PAUSE` transition (the
 * half-health crossing): the same start map, but Tengu's locked door is now a plain `DOOR`, one of
 * the four start cells is partly opened up, and the entrance is walled off with a fresh door one
 * cell further in - matching Java's own `Painter.set`/`Painter.fill` calls exactly, in the same
 * order. **The hero's own position is never touched by this transition or the next one** - see
 * this file's own citation of `progress()`/`cleanMapState()` in `ROADMAP.md`'s Tengu bullet: real
 * Java relies on the fight (Tengu hunting the hero from his cell toward the entrance) having
 * already drifted into the region `setMapArena()` below carves out, rather than relocating anyone.
 */
export function prisonBossPause(runSeed?: bigint): BossFloorData {
	const level = new PaintLevel(32, 32);
	paintPrisonBossStart(level, runSeed);
	set(level, 10, 23, Terrain.DOOR);
	// startCells[1] = (11,9)-(16,16): Painter.fill(startCells[1].left, .top+3, 1, 7, EMPTY) and
	// Painter.fill(startCells[1].left+2, .top+2, 3, 10, EMPTY).
	fillRect(level, 11, 12, 11, 18, Terrain.EMPTY);
	fillRect(level, 13, 11, 15, 20, Terrain.EMPTY);
	fillRect(level, 8, 2, 13, 8, Terrain.WALL);
	set(level, 9 + 1, 7, Terrain.EMPTY);
	set(level, 9 + 1, 8, Terrain.DOOR);
	if (runSeed !== undefined) paintPrisonCages(level, runSeed);
	return { paint: level, rooms: [room(6, 23, 15, 31)], feeling: null };
}

/** `(3,1)-(18,16)`: `PrisonBossLevel.arena`, the ellipse `setMapArena()` carves the whole map
 *  down to for the `FIGHT_PAUSE -> FIGHT_ARENA` transition. */
export const PRISON_ARENA = { left: 3, top: 1, right: 18, bottom: 16 } as const;

/**
 * `PrisonBossLevel.setMapArena()`: walls the entire 32x32 map, then carves `PRISON_ARENA`'s
 * ellipse back to `EMPTY` - Java's own `Painter.fillEllipse(this, arena, 1, EMPTY)`. Nothing
 * outside the ellipse is walkable after this transition, which is exactly why the hero's own
 * position matters (see `prisonBossPause()`'s citation) - anyone left outside it is walled in,
 * matching Java's own accepted failure mode rather than a bug this port introduced.
 */
export function prisonBossArena(): BossFloorData {
	const level = new PaintLevel(32, 32);
	fillRect(level, 0, 0, 31, 31, Terrain.WALL);
	// `Painter.fillEllipse(this, arena, 1, EMPTY)`: `arena` is `Rect(3,1,18,16)` - 15x15 in Java's
	// exclusive-edge terms - inset by 1, so the ellipse is 13x13 at (4,2), not 14x14.
	fillEllipseRect(level, PRISON_ARENA.left, PRISON_ARENA.top, PRISON_ARENA.right, PRISON_ARENA.bottom, 1, Terrain.EMPTY);
	return { paint: level, rooms: [room(PRISON_ARENA.left, PRISON_ARENA.top, PRISON_ARENA.right, PRISON_ARENA.bottom)], feeling: null };
}

/**
 * `PrisonBossLevel.setMapEnd()`, Tengu's death transition: the start map again (so the entrance/
 * hallway/cells return), Tengu's own door unlocked, and `endMap` - a fixed 14-wide x 23-row tile
 * block encoding the chasm/exit room - pasted starting at `endStart = (11, 9)` (`startHallway.left
 * +2, .top+2`), one row of 14 cells at a time down to the last map row. Java's `IronKey`-heap
 * cleanup and the two `CustomTilemap` exit-visual overlays are presentation/item-side, not paint.
 */
export function prisonBossEnd(runSeed?: bigint): BossFloorData {
	const level = new PaintLevel(32, 32);
	paintPrisonBossStart(level, runSeed);
	set(level, 10, 23, Terrain.DOOR);
	let cell = 11 + 9 * 32;
	for (let row = 0; row < PRISON_END_MAP.length / 14; row++) {
		for (let col = 0; col < 14; col++) level.map[cell + col] = PRISON_END_MAP[row * 14 + col]!;
		cell += 32;
	}
	if (runSeed !== undefined) paintPrisonCages(level, runSeed);
	return { paint: level, rooms: [room(6, 23, 15, 31)], feeling: null };
}

const EW = Terrain.WALL, ED = Terrain.WALL_DECO, Ee = Terrain.EMPTY, EE = Terrain.EXIT, EC = Terrain.CHASM;
/** `PrisonBossLevel.endMap` (`v3.3.8`), transcribed row for row - 23 rows of 14 columns. */
const PRISON_END_MAP: readonly number[] = [
	EW, EW, ED, EW, EW, EW, EW, EW, EW, EW, EW, EW, EW, EW,
	EW, Ee, Ee, Ee, EW, EW, EW, EW, EW, EW, EW, EW, EW, EW,
	EW, Ee, Ee, Ee, Ee, Ee, Ee, Ee, Ee, EW, EW, EW, EW, EW,
	Ee, Ee, Ee, Ee, Ee, Ee, Ee, Ee, Ee, Ee, Ee, Ee, EW, EW,
	Ee, Ee, Ee, Ee, Ee, Ee, Ee, Ee, Ee, Ee, Ee, Ee, Ee, EW,
	Ee, Ee, Ee, EC, EC, EC, EC, EC, EC, EC, EC, Ee, Ee, EW,
	Ee, EW, EC, EC, EC, EC, EC, EC, EC, EC, EC, EE, EE, EW,
	Ee, Ee, Ee, EC, EC, EC, EC, EC, EC, EC, EC, EE, EE, EW,
	Ee, Ee, Ee, Ee, Ee, EC, EC, EC, EC, EC, EC, EE, EE, EW,
	Ee, Ee, Ee, Ee, Ee, Ee, Ee, EW, EW, EW, EC, EC, EC, EW,
	EW, Ee, Ee, Ee, Ee, Ee, EW, EW, EW, EW, EC, EC, EC, EW,
	EW, Ee, Ee, Ee, Ee, EW, EW, EW, EW, EW, EW, EC, EC, EW,
	EW, EW, EW, EW, EW, EW, EW, EW, EW, EW, EW, EC, EC, EW,
	EW, EW, EW, EW, EW, EW, EW, EW, EW, EW, EW, EC, EC, EW,
	EW, ED, EW, EW, EW, EW, EW, EW, EW, EW, EW, EC, EC, EW,
	Ee, Ee, Ee, EW, EW, EW, EW, EW, EW, EW, EW, EC, EC, EW,
	Ee, Ee, Ee, EW, EW, EW, EW, EW, EW, EW, EW, EC, EC, EW,
	Ee, Ee, Ee, EW, EW, EW, EW, EW, EW, EW, EW, EC, EC, EW,
	Ee, Ee, Ee, EW, EW, EW, EW, EW, EW, EW, EW, EC, EC, EW,
	Ee, Ee, Ee, EW, EW, EW, EW, EW, EW, EW, EW, EC, EC, EW,
	Ee, Ee, Ee, EW, EW, EW, EW, EW, EW, EW, EW, EC, EC, EW,
	Ee, Ee, Ee, EW, EW, EW, EW, EW, EW, EW, EW, EC, EC, EW,
	EW, EW, EW, EW, EW, EW, EW, EW, EW, EW, EW, EC, EC, EW,
];

/**
 * `CavesBossLevel.mainArena` (5,14)-(28,37). `seal()` spawns DM-300 at a random open point inside
 * it, and `activatePylon()` bands the energy field from `top - 1` down; `main.ts` needs both.
 */
export const CAVES_BOSS_ARENA = { left: 5, top: 14, right: 28, bottom: 37 } as const;
/** `CavesBossLevel`'s transition cells (`v3.3.8`): `exitCell = 16 + 2*width` = (16,2),
 *  inside the `EXIT` block, and `buildEntrance()`'s `16 + 25*width` = (16,25).
 *  `unseal()` restores the entrance and breaks the gate; the exit is live from `build()`. */
export const CAVES_EXIT_CELL = { x: 16, y: 2 } as const;
export const CAVES_ENTRANCE_CELL = { x: 16, y: 25 } as const;

/**
 * `CavesBossLevel`'s semi-randomised entrance and corner stamps (tag `v3.3.8`): four 8x8
 * `entranceVariants`, four 10x10 `cornerVariants`, one of each picked by `Random.oneOf` and then
 * mirrored into all four quadrants around the anchor point.
 *
 * Encoded flat, one character per tile - `.` is Java's `n` (leave the tile alone), `#` is `WALL`,
 * `_` is `EMPTY`, `,` is `EMPTY_SP`. Generated from the Java source by
 * `tools/scratch/gen-caves-stamps.mjs` rather than transcribed: the eight stamps are 656 tiles
 * between them, and a single wrong tile is invisible until someone compares two maps cell by
 * cell. The width of a stamp's rows is `ENTRANCE_STAMP_WIDTH`/`CORNER_STAMP_WIDTH` below.
 */
const ENTRANCE_STAMP_WIDTH = 8;
const CORNER_STAMP_WIDTH = 10;
export const ENTRANCE_STAMPS = [
	'....................#_##...##_##..##____..___##_..##_#__..##____',   // entrance1
	'.....................___...#_##_..._____.._#_##_.._#_#__..______',   // entrance2
	'...........................##_##...##_##..._____...##_#_...##___',   // entrance3
	'..............._......#_.....##_....###_...####_..####__._______',   // entrance4
] as const;
export const CORNER_STAMPS = [
	'###########,,,___####,,,##__###,,,###__##_######_.#_#####...#__###....##__#.....###__.....####......', // corner1
	'###########,,,#######,,,_____##,,,####__##_######_##_####...##_###....##_##.....##__#.....###__.....', // corner2
	'###########,,,#######,,,____###,,,###_####_####_#.##_####__.##_###....##____....#####_....####......', // corner3
	'###########,,,#######,,,___####,,,##_#####_###_##.##_###__..##_____...#####_....#####.....####......', // corner4
] as const;

const STAMP_TERRAIN: Readonly<Record<string, number | undefined>> = {
	'.': undefined,
	'#': Terrain.WALL,
	'_': Terrain.EMPTY,
	',': Terrain.EMPTY_SP,
};

/**
 * `CavesBossLevel.buildEntrance()`/`buildCorners()`'s stamp walk, verbatim - including the part
 * that looks like a mistake and is not one. Each of the four cursors is written in a different
 * direction: `NW`/`SW` increment (their half of the row is written left to right) while `NE`/`SE`
 * decrement, so the four mirrored copies meet in the middle of every row. The row advance is the
 * same `width - size`/`width + size` pair Java uses, applied *before* a row's eight or ten writes,
 * which works out to the cursors descending one row per pass. Cell indices are deliberately raw
 * (no bounds clamping) because Java's are too - a stamp reaching past an edge wraps into the
 * neighbouring row in Java exactly as it does here, and clamping would silently part the two maps.
 */
function stampTiles(level: PaintLevel, stamp: string, size: number, cursors: { nw: number; ne: number; se: number; sw: number }): void {
	const w = level.w;
	for (let i = 0; i < stamp.length; i++) {
		if (i % size === 0 && i !== 0) {
			cursors.nw += w - size;
			cursors.ne += w + size;
			cursors.se -= w - size;
			cursors.sw -= w + size;
		}
		const terrain = STAMP_TERRAIN[stamp[i]!];
		if (terrain !== undefined) {
			level.map[cursors.nw] = terrain;
			level.map[cursors.ne] = terrain;
			level.map[cursors.se] = terrain;
			level.map[cursors.sw] = terrain;
		}
		cursors.nw++; cursors.ne--; cursors.sw++; cursors.se--;
	}
}

/** `buildEntrance()`: anchor is the entrance cell `16 + 25*width`, cursors 7 columns either side
 * of it on the row above, expanding outwards as they descend. */
export function buildEntranceStamps(level: PaintLevel, stamp: string): void {
	const entrance = 16 + 25 * level.w;
	stampTiles(level, stamp, ENTRANCE_STAMP_WIDTH, {
		nw: entrance - 7 - 7 * level.w,
		ne: entrance + 7 - 7 * level.w,
		se: entrance + 7 + 7 * level.w,
		sw: entrance - 7 + 7 * level.w,
	});
}

/** `buildCorners()`: the four hardcoded (2,11)/(30,11)/(2,39)/(30,39) corners. */
export function buildCornerStamps(level: PaintLevel, stamp: string): void {
	stampTiles(level, stamp, CORNER_STAMP_WIDTH, {
		nw: 2 + 11 * level.w,
		ne: 30 + 11 * level.w,
		se: 30 + 39 * level.w,
		sw: 2 + 39 * level.w,
	});
}

function cavesBoss(strongerBosses: boolean): BossFloorData {
	// CavesBossLevel: WIDTH=33, HEIGHT=42, mainArena=(5,14)-(28,37).
	//
	// The base fill is `Terrain.WALL`, as it is for every level whose `feeling` is not CHASM
	// (`Level.setSize()`'s own `feeling == Feeling.CHASM ? CHASM : WALL`, and no boss level sets a
	// feeling). This floor used to be built over a CHASM base, which is not the same thing as
	// Java's own pits: it left 34 walkable cells of the arena and its corridor next to a pit where
	// Java has solid rock - and since this port lets the hero step into a chasm (`canStepOnto`'s
	// pit branch), that was a hole out of the boss floor rather than scenery. Java's real pits are
	// the five explicit strips painted below.
	const level = new PaintLevel(33, 42, Terrain.WALL);
	//`CavesBossLevel.build()`'s very first paint is `Painter.fill(this, gate, Terrain.CUSTOM_DECO)`,
	//*before* the arena ellipse and the water/trap patch. `gate` is `Rect(14,13,19,14)`, an
	//**exclusive-edge** rect, so that is five cells on row 13 and nothing on row 14; the ellipse
	//(`mainArena`'s own 23x23, `Rect(5,14,28,37)`, no margin) starts on row 14 and its top row is
	//seven cells wide (`radW` 11.5, `rowY -11` -> `rowW 2*sqrt(132.25-121)` = 6.71 -> odd width,
	//`floor(6.71/2)*2+1` = 7) from column `x + (23-7)/2` = `5+8` = 13. The two never overlap.
	//
	//**Corrected 2026-09-16: this fill used to be written as the inclusive
	//`fillRect(14, 13, 19, 14, ...)`, and both of the claims that used to follow from that reading
	//were wrong.** It painted twelve cells instead of five: row 13 x 14..19 and row 14 x 14..19. The
	//ellipse then cleared row 14's six, leaving **six** gate cells to Java's five - an extra
	//`CUSTOM_DECO` at (19,13), which Java leaves to whatever `buildEntrance()` stamped there (this
	//floor's own stamp leaves rock). `dm300Supercharge()`'s energy seed picked that cell up, so the
	//pylon field carried one cell Java's does not.
	//
	//And the *ordering* of this fill against the patch loop was only ever observable because of the
	//same misreading: the loop walks rows 14 and down, a correct gate occupies row 13 only, so
	//gate-first and gate-last produce identical floors - same 463 `SpdRandom.int` draws at seed 42,
	//same 102 energy cells (re-measured 2026-09-16 with `tools/scratch/probeCavesGate.ts`, whose two
	//variants now differ only in order). The old reading put gate cells *inside* the loop's range on
	//row 14, which is what let a gate-last fill erase water the loop had just placed. Java's own
	//order is kept regardless; it is simply not load-bearing.
	//
	//`SIGN` is this port's stand-in for Java's `CUSTOM_DECO` here. It plays both of that tile's
	//roles - it is the tile `dm300Supercharge()`'s energy seed keys on, mirroring Java's
	//`CUSTOM_DECO` clause, and it renders as plain floor (`gameBridge.ts`'s `SIGN -> 'floor'`). One
	//difference remains, and it is deliberate: Java's `CUSTOM_DECO` is `SOLID`, so its gate blocks
	//the exit corridor until `unseal()` breaks it, while this port's gate is walkable from the
	//start. Making it solid here would change this floor's walkability, which the port's baked
	//descent flow does not model (`unseal()` is unported); it is recorded in PORT_COVERAGE.md
	//instead. The gate's own art is ported either way, whole for as long as this port can show it -
	//see `cavesBossVisuals.ts`'s `gateIntact`.
	fillRect(level, 14, 13, 18, 13, Terrain.SIGN);
	//`Painter.fillEllipse(this, mainArena, Terrain.EMPTY)` - the no-margin overload, so the
	//ellipse is the rect's own exclusive extent: `Rect(5,14,28,37)` is 23x23, not 24x24.
	fillEllipseRect(level, CAVES_BOSS_ARENA.left, CAVES_BOSS_ARENA.top, CAVES_BOSS_ARENA.right, CAVES_BOSS_ARENA.bottom, 0, Terrain.EMPTY);
	// `CavesBossLevel.build()`: after the arena ellipse, scatter water and sprung traps across it
	// with the real `Patch.generate(width, height-14, 0.15f, 2, true)` and one
	// `Random.Int(challenge ? 4 : 8) == 0` roll per eligible EMPTY cell. These are exactly the
	// cells `activatePylon()`'s `PylonEnergy` seed later energizes (WATER/INACTIVE_TRAP/SIGN), so
	// without them DM-300's pylon mechanic has no terrain to work on at all. The loop starts at row
	// 14, matching Java's own `for (i = 14*width(); ...)` - so the gate's row-13 `SIGN` cells are
	// outside it and only the ellipse's cells roll, in Java's cell order.
	const patch = spdPatchGenerate(level.w, level.h - 14, 0.15, 2, true);
	const patchOffset = 14 * level.w;
	const trapBound = strongerBosses ? 4 : 8;
	for (let i = patchOffset; i < level.w * level.h; i++) {
		if (level.map[i] !== Terrain.EMPTY) continue;
		if (patch[i - patchOffset]) level.map[i] = Terrain.WATER;
		else if (SpdRandom.int(trapBound) === 0) level.map[i] = Terrain.INACTIVE_TRAP;
	}
	//`CavesBossLevel.build()`'s next calls are `buildEntrance()` and `buildCorners()` (lines 137-138
	//at tag `v3.3.8`), each one `Random.oneOf` over its four stamps - so this is where the port's
	//stream catches up with Java's for those two draws, before the chasm/entrance fills below
	//(Java's line 140 is `new CavesPainter().paint(this, null)`; the port runs it as the
	//`decorateStandaloneCaves` call above - see PORT_COVERAGE.md's `DM300` row. An earlier note here
	//called that pass a no-op; it is not, and the item that recorded it as "not ported" has since been
	//implemented, so this paragraph is history rather than a gap.) The entrance stamp's own `Painter.set(this, entrance, Terrain.ENTRANCE)`
	//runs *inside* `buildEntrance()`, which is why the port's explicit `set(..., ENTRANCE)` below
	//still wins over a stamp that happens to cover that cell.
	buildEntranceStamps(level, SpdRandom.element(ENTRANCE_STAMPS as unknown as string[]));
	buildCornerStamps(level, SpdRandom.element(CORNER_STAMPS as unknown as string[]));
	//`CavesBossLevel.build()`'s next call is `new CavesPainter().paint(this, null)` (line 140), which
	//is **not** a no-op - only `RegularPainter.paint`'s sizing block sits inside its
	//`if (rooms != null)`, so with a null room list the pass still pushes a substream generator
	//(`Random.Long()`: exactly one draw off this floor's own stream) and runs
	//`CavesPainter.decorate`'s two global scans *inside* that substream. The port already owns this
	//null-room behaviour for `MiningLevel` (`decorateStandaloneCaves`), so the boss floor reuses it.
	//Position is load-bearing twice over: the scans read the map as it stands *here*, after the arena
	//patch and the stamps and before the chasm strips below, and the pushed substream is what keeps
	//their rolls off this floor's stream - the parent only ever pays that single `Long()`.
	SpdRandom.pushGenerator(SpdRandom.long());
	decorateStandaloneCaves(level);
	SpdRandom.popGenerator();
	//`CavesBossLevel.build()`'s five chasm strips - the floor's only pits, painted over the stamps
	//in Java's own order (`build()` lines 143-149). The exit corridor is the `fill(14,3,5,10,
	//EMPTY)` below, which bridges the first strip rather than being cut by it.
	fillRect(level, 0, 3, 32, 6, Terrain.CHASM);
	fillRect(level, 6, 7, 26, 7, Terrain.CHASM);
	fillRect(level, 10, 8, 22, 8, Terrain.CHASM);
	fillRect(level, 12, 9, 20, 9, Terrain.CHASM);
	fillRect(level, 13, 10, 19, 10, Terrain.CHASM);
	//`Painter.fill(this, 9, 3, 1, 6, ...)` / `fill(this, 23, 3, 1, 6, ...)`: the two
	//`REGION_DECO_ALT` rails flanking the exit corridor, painted after the stamps the same way.
	fillRect(level, 9, 3, 9, 8, Terrain.REGION_DECO_ALT);
	fillRect(level, 23, 3, 23, 8, Terrain.REGION_DECO_ALT);
	fillRect(level, 14, 3, 18, 12, Terrain.EMPTY);
	fillRect(level, 15, 2, 17, 4, Terrain.EMPTY_SP);
	fillRect(level, 15, 5, 17, 5, Terrain.STATUE);
	fillRect(level, 15, 7, 17, 7, Terrain.STATUE);
	fillRect(level, 15, 9, 17, 9, Terrain.STATUE);
	fillRect(level, 16, 5, 16, 10, Terrain.EMPTY_SP);
	fillRect(level, 15, 0, 17, 2, Terrain.EXIT);
	set(level, 16, 25, Terrain.ENTRANCE);
	// Java's four neutral Pylon actors occupy these cells. Their actor payload is preserved
	// separately from terrain so the live bridge can restore the dedicated pylon sprite and
	// activate the pylons when DM-300's gate is triggered.
	//
	// The cells themselves are left exactly as the corner stamps painted them - `EMPTY_SP`, since
	// that is what the stamp data carries there - and that is load-bearing, not incidental:
	// `ArenaVisuals.updateState()`'s pylon branch is guarded by `map[j] == Terrain.EMPTY_SP`, so the
	// socket frame (`38`, drawn once the arena is sealed and the pylon has been destroyed) can only
	// ever appear on an `EMPTY_SP` cell. This port used to force them to `Terrain.EMPTY` here, which
	// silently made that whole branch unreachable; the wire frames around them still drew, because
	// those are decided by each *neighbour's* own terrain.
	for (const [x, y] of [[4, 13], [28, 13], [4, 37], [28, 37]]) {
		level.mobs.push({ pos: x + y * level.w, kind: 'pylon' });
	}
	// Keep the scene's existing boss spawn convention away from the entrance cell; Java's
	// real Caves arena chooses a free point after the gate seals.
	return { paint: level, rooms: [room(8, 18, 24, 34)], feeling: null };
}

/** `CityBossLevel.arena` (`v3.3.8`), in Java's own exclusive-bounds `Rect` form: `(1,25)`-`(13,37)`
 *  of walkable floor. The King's throne room is the diamond `fillDiamond` carves out of it, and
 *  the two locked doors sit on its top edge. */
export const CITY_BOSS_ARENA = { left: 1, top: 25, right: 14, bottom: 38 } as const;
/** `CityBossLevel.entry`/`end` (`v3.3.8`), exclusive-bounds `Rect`s. */
export const CITY_BOSS_ENTRY = { left: 1, top: 37, right: 14, bottom: 48 } as const;
export const CITY_BOSS_END = { left: 0, top: 0, right: 15, bottom: 22 } as const;
/** `CityBossLevel`'s two seal doors (`v3.3.8`): `bottomDoor = 7 + (arena.bottom-1)*15`,
 *  `topDoor = 7 + arena.top*15`. The bottom one gates the arena, the top one the exit
 *  hallway; `seal()` locks the bottom, `unseal()` opens both. */
export const CITY_BOTTOM_DOOR = { x: 7, y: 37 } as const;
export const CITY_TOP_DOOR = { x: 7, y: 25 } as const;
/** `CityBossLevel.throne` (`v3.3.8`): `arena.center()` = (7,31), `CUSTOM_DECO` over the
 *  `fill(arena, 6, CUSTOM_DECO)` 1x1. `SIGN` is this port's stand-in for `CUSTOM_DECO`
 *  (same alias as the Caves gate). */
export const CITY_THRONE = { x: 7, y: 31 } as const;
/** `CityBossLevel.pedestals` (`v3.3.8`): `(c.x±3, c.y±3)` = (4,28)/(10,28)/(10,34)/(4,34). */
export const CITY_PEDESTALS = [{ x: 4, y: 28 }, { x: 10, y: 28 }, { x: 10, y: 34 }, { x: 4, y: 34 }] as const;
/** `CityBossLevel`'s Imp shop rect (`v3.3.8`): `impShop.set(end.left+3, end.top+12,
 *  end.left+11, end.top+20)` = (3,12)-(11,20). Painted as walls/empty by `ShopRoom`
 *  only when `spawnShop()` runs at `unseal()`; the base map carries just its pedestal
 *  and two statues (see `cityBoss()`). Exported so the scene's `unseal()` can paint
 *  the same rect live. */
export const CITY_IMP_SHOP = { left: 3, top: 12, right: 11, bottom: 20 } as const;
/** `CityBossLevel`'s exit cell (`v3.3.8`): `end.left+7 + (end.top+8)*width` = (7,8),
 *  inside the `EXIT` block. The live `unseal()` points the stairs here. */
export const CITY_EXIT_CELL = { x: 7, y: 8 } as const;
/** `CityBossLevel`'s entrance cell (`v3.3.8`): `c.x + (c.y+2)*width` with
 *  `c = entry.center()` = (7,42), so (7,44). */
export const CITY_ENTRANCE_CELL = { x: 7, y: 44 } as const;

function cityBoss(): BossFloorData {
	// `CityBossLevel.build()` (`v3.3.8`), transcribed statement for statement. Base is
	// `WALL` (`Level.setSize()` fills WALL for every non-CHASM feeling, and no boss
	// level sets one) - the top `end` block's `fill(end, CHASM)` is what makes the
	// upper 22 rows a pit, not the base.
	const level = new PaintLevel(15, 48, Terrain.WALL);
	//Entrance room: `fill(entry, WALL)`, `fill(entry, 1, BOOKSHELF)`, `fill(entry, 2, EMPTY)`.
	fillJavaRect(level, CITY_BOSS_ENTRY.left, CITY_BOSS_ENTRY.top, CITY_BOSS_ENTRY.right, CITY_BOSS_ENTRY.bottom, Terrain.WALL);
	fillJavaRectInset(level, CITY_BOSS_ENTRY.left, CITY_BOSS_ENTRY.top, CITY_BOSS_ENTRY.right, CITY_BOSS_ENTRY.bottom, 1, Terrain.BOOKSHELF);
	fillJavaRectInset(level, CITY_BOSS_ENTRY.left, CITY_BOSS_ENTRY.top, CITY_BOSS_ENTRY.right, CITY_BOSS_ENTRY.bottom, 2, Terrain.EMPTY);
	//The two freestanding bookshelf columns and the two REGION_DECO marks.
	fillRect(level, 4, 40, 4, 44, Terrain.BOOKSHELF);
	fillRect(level, 10, 40, 10, 44, Terrain.BOOKSHELF);
	set(level, 6, 38, Terrain.REGION_DECO);
	set(level, 8, 38, Terrain.REGION_DECO);
	//`c = entry.center()` = (7,42): three STATUE rows, the EMPTY_SP spine, the DOOR,
	//and the ENTRANCE two rows below centre.
	fillRect(level, 6, 40, 8, 40, Terrain.STATUE);
	fillRect(level, 6, 42, 8, 42, Terrain.STATUE);
	fillRect(level, 6, 44, 8, 44, Terrain.STATUE);
	fillRect(level, 7, 38, 7, 43, Terrain.EMPTY_SP);
	set(level, 7, 37, Terrain.DOOR);
	set(level, CITY_ENTRANCE_CELL.x, CITY_ENTRANCE_CELL.y, Terrain.ENTRANCE);
	level.transitions.push({ pos: CITY_ENTRANCE_CELL.y * level.w + CITY_ENTRANCE_CELL.x, type: 'regularEntrance' });
	//DK's throne room: the diamond, then the EMPTY_SP/CUSTOM_DECO margins, the four
	//statues across the middle, the four pedestals, and the locked top door.
	fillDiamondRect(level, CITY_BOSS_ARENA.left, CITY_BOSS_ARENA.top, CITY_BOSS_ARENA.right, CITY_BOSS_ARENA.bottom, 1, Terrain.EMPTY);
	fillJavaRectInset(level, CITY_BOSS_ARENA.left, CITY_BOSS_ARENA.top, CITY_BOSS_ARENA.right, CITY_BOSS_ARENA.bottom, 5, Terrain.EMPTY_SP);
	fillJavaRectInset(level, CITY_BOSS_ARENA.left, CITY_BOSS_ARENA.top, CITY_BOSS_ARENA.right, CITY_BOSS_ARENA.bottom, 6, Terrain.SIGN);
	for (const [x, y] of [[4, 31], [3, 31], [10, 31], [11, 31]]) set(level, x, y, Terrain.STATUE);
	for (const p of CITY_PEDESTALS) set(level, p.x, p.y, Terrain.PEDESTAL);
	set(level, CITY_TOP_DOOR.x, CITY_TOP_DOOR.y, Terrain.LOCKED_DOOR);
	//Exit hallway: the whole `end` block goes CHASM first, then the EMPTY corridor
	//and its EXIT head, with the transition Java registers on (7,8).
	fillJavaRect(level, CITY_BOSS_END.left, CITY_BOSS_END.top, CITY_BOSS_END.right, CITY_BOSS_END.bottom, Terrain.CHASM);
	fillRect(level, 4, 5, 10, 22, Terrain.EMPTY);
	fillRect(level, 4, 5, 10, 8, Terrain.EXIT);
	level.transitions.push({ pos: CITY_EXIT_CELL.y * level.w + CITY_EXIT_CELL.x, type: 'regularExit' });
	//The Imp shop's base marks. The room itself stays unpainted until `unseal()`'s
	//`spawnShop()` - `ImpShopRoom.paint()` is a deliberate no-op that only rolls its
	//item list - so this is the pedestal, the two statues and the corridor link below
	//`end`, exactly as `build()` leaves them.
	set(level, 7, 16, Terrain.PEDESTAL);
	set(level, 5, 12, Terrain.STATUE);
	set(level, 9, 12, Terrain.STATUE);
	fillRect(level, 5, 23, 9, 23, Terrain.EMPTY);
	fillRect(level, 6, 24, 8, 24, Terrain.EMPTY);
	//`ImpShopRoom.paint()` is a deliberate no-op (it only rolls its item list), then
	//`new CityPainter().paint(this, null)` runs the scatter pass at Java's own position -
	//after the shop marks, before the pillars below (which overwrite with plain WALL).
	decorateStandaloneCityBoss(level, 20);
	//The eight 2x2 WALL pillars Java stamps last ("no deco on these").
	for (const [x, y] of [[1, 2], [1, 7], [1, 12], [1, 17], [12, 2], [12, 7], [12, 12], [12, 17]]) {
		fillRect(level, x, y, x + 1, y + 1, Terrain.WALL);
	}
	//Not ported, stated: the `CustomGroundVisuals`/`CustomWallVisuals` tilemaps, which
	//are presentation over this same terrain.
	return { paint: level, rooms: [room(1, 25, 13, 38)], feeling: null };
}

/** `HallsBossLevel`'s room constants (`v3.3.8`): `WIDTH/2 ± 4`, `ROOM_TOP 8`,
 *  `ROOM_BOTTOM = ROOM_TOP + 8`. */
export const HALLS_ROOM = { left: 12, top: 8, right: 20, bottom: 16 } as const;
/** `HallsBossLevel`'s exit cell (`v3.3.8`): `width/2 + (ROOM_TOP+1)*width` = (16,9).
 *  `build()` registers the `REGULAR_EXIT` transition here but paints no `EXIT` tile -
 *  the cell is inside the room's `WALL_DECO` band, and only `unseal()` sets it to
 *  `EXIT`. */
export const HALLS_EXIT_CELL = { x: 16, y: 9 } as const;
/** `HallsBossLevel`'s boss seat (`v3.3.8`): `exitCell + width*3` = (16,12), the cell
 *  `seal()` spawns Yog on and the first `Patch` pass measures `distance(i, bossPos)`
 *  from. */
export const HALLS_BOSS_POS = { x: 16, y: 12 } as const;

function hallsBoss(): BossFloorData {
	// `HallsBossLevel.build()` (`v3.3.8`), transcribed in Java's own order - including
	// the RNG draws, which are part of the floor's stream even where their product is
	// scenery. The five approach arms roll their extents (`IntRange` each, ten draws);
	// the first `Patch.generate(..., 0.20f, 0, true)` scatters `REGION_DECO`/`STATUE`
	// by `distance(i, bossPos) + Random.Int(5) >= 10`; the 11x11 `EMPTY` ring lands at
	// (11,7); the second `Patch.generate(..., 0.30f, 3, true)` waters it; a 1-in-4
	// `EMPTY_DECO` pass follows; then the 9x9 `EMPTY_SP` room, its `WALL_DECO` band
	// (top two rows plus the two bottom corners - solid, so the walkable room is 9x7),
	// and the inner 3x4 `EMPTY`; then the exit transition; then the
	// `REGION_DECO -> REGION_DECO_ALT` coin flip. Java's `build()` returns whether a
	// path survives from entrance to exit and the level builder retries on false -
	// this port rebuilds up to 50 times on the same stream rather than failing shut.
	for (let attempt = 0; attempt < 50; attempt++) {
		const level = new PaintLevel(32, 32, Terrain.WALL);
		let entranceCell = -1;
		for (let i = 0; i < 5; i++) {
			let top: number;
			let bottom: number;
			if (i === 0 || i === 4) {
				top = SpdRandom.intRange(HALLS_ROOM.top - 1, HALLS_ROOM.top + 3);
				bottom = SpdRandom.intRange(HALLS_ROOM.bottom + 2, HALLS_ROOM.bottom + 6);
			} else if (i === 1 || i === 3) {
				top = SpdRandom.intRange(HALLS_ROOM.top - 5, HALLS_ROOM.top - 1);
				bottom = SpdRandom.intRange(HALLS_ROOM.bottom + 6, HALLS_ROOM.bottom + 10);
			} else {
				top = SpdRandom.intRange(HALLS_ROOM.top - 6, HALLS_ROOM.top - 3);
				bottom = SpdRandom.intRange(HALLS_ROOM.bottom + 8, HALLS_ROOM.bottom + 12);
			}
			//`Painter.fill(this, 4 + i*5, top, 5, bottom - top + 1, EMPTY)`.
			fillXY(level, 4 + i * 5, top, 5, bottom - top + 1, Terrain.EMPTY);
			if (i === 2) {
				entranceCell = (6 + i * 5) + (bottom - 1) * level.w;
				level.transitions.push({ pos: entranceCell, type: 'regularEntrance' });
			}
		}
		const bossPos = HALLS_BOSS_POS.y * level.w + HALLS_BOSS_POS.x;
		const bossX = HALLS_BOSS_POS.x, bossY = HALLS_BOSS_POS.y;
		let patch = spdPatchGenerate(level.w, level.h, 0.20, 0, true);
		for (let i = 0; i < level.map.length; i++) {
			if (level.map[i] === Terrain.EMPTY && patch[i]) {
				const dx = Math.abs((i % level.w) - bossX), dy = Math.abs(Math.floor(i / level.w) - bossY);
				level.map[i] = Math.max(dx, dy) + SpdRandom.int(5) >= 10 ? Terrain.REGION_DECO : Terrain.STATUE;
			}
		}
		level.map[entranceCell] = Terrain.ENTRANCE;
		//`Painter.fill(this, ROOM_LEFT-1, ROOM_TOP-1, 11, 11, EMPTY)`: the 11x11 ring
		//at (11,7) - the approach arms' random ends stop outside it, this is what
		//guarantees they join the room.
		fillXY(level, HALLS_ROOM.left - 1, HALLS_ROOM.top - 1, 11, 11, Terrain.EMPTY);
		patch = spdPatchGenerate(level.w, level.h, 0.30, 3, true);
		for (let i = 0; i < level.map.length; i++) {
			if ((level.map[i] === Terrain.EMPTY || level.map[i] === Terrain.STATUE || level.map[i] === Terrain.REGION_DECO) && patch[i]) {
				level.map[i] = Terrain.WATER;
			}
		}
		for (let i = 0; i < level.map.length; i++) {
			if (level.map[i] === Terrain.EMPTY && SpdRandom.int(4) === 0) level.map[i] = Terrain.EMPTY_DECO;
		}
		fillXY(level, HALLS_ROOM.left, HALLS_ROOM.top, 9, 9, Terrain.EMPTY_SP);
		fillXY(level, HALLS_ROOM.left, HALLS_ROOM.top, 9, 2, Terrain.WALL_DECO);
		fillXY(level, HALLS_ROOM.left, HALLS_ROOM.bottom - 1, 2, 2, Terrain.WALL_DECO);
		fillXY(level, HALLS_ROOM.right - 1, HALLS_ROOM.bottom - 1, 2, 2, Terrain.WALL_DECO);
		fillXY(level, HALLS_ROOM.left + 3, HALLS_ROOM.top + 2, 3, 4, Terrain.EMPTY);
		const exitCell = HALLS_EXIT_CELL.y * level.w + HALLS_EXIT_CELL.x;
		level.transitions.push({ pos: exitCell, type: 'regularExit' });
		for (let i = 0; i < level.map.length; i++) {
			if (level.map[i] === Terrain.REGION_DECO && SpdRandom.int(2) === 0) level.map[i] = Terrain.REGION_DECO_ALT;
		}
		if (hallsPathExists(level, entranceCell, exitCell)) return { paint: level, rooms: [room(12, 8, 20, 16)], feeling: null };
	}
	//Unreachable in practice (Java's own retry converges the same way); the last
	//attempt's map is still a complete transcription, just possibly disconnected.
	const level = new PaintLevel(32, 32, Terrain.WALL);
	fillXY(level, HALLS_ROOM.left, HALLS_ROOM.top, 9, 9, Terrain.EMPTY_SP);
	return { paint: level, rooms: [room(12, 8, 20, 16)], feeling: null };
}

/** `HallsBossLevel.build()`'s return: a `PathFinder.getStep(entrance, exit, passable)`
 *  over `passable[]` built from `Terrain.flags & PASSABLE`. Four-way steps here read
 *  the same membership this port's `isPassableTerrain` carries. */
function hallsPathExists(level: PaintLevel, from: number, to: number): boolean {
	const w = level.w, h = level.map.length / w;
	const seen = new Uint8Array(level.map.length);
	const queue = [from];
	seen[from] = 1;
	while (queue.length) {
		const cell = queue.pop()!;
		if (cell === to) return true;
		const x = cell % w, y = Math.floor(cell / w);
		for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) {
			const nx = x + dx, ny = y + dy;
			if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
			const n = ny * w + nx;
			if (seen[n]) continue;
			const t = level.map[n];
			if (!isPassableTerrain(t) && n !== to) continue;
			seen[n] = 1;
			queue.push(n);
		}
	}
	return false;
}

function lastLevel(): BossFloorData {
	// LastLevel: a 16x64 chasm shaft, entrance chamber, and the lower Amulet vault.
	const level = new PaintLevel(16, 64, Terrain.CHASM);
	const mid = 8;
	fillRect(level, mid - 1, 10, mid + 1, 62, Terrain.EMPTY);
	fillRect(level, mid - 2, 61, mid + 2, 61, Terrain.EMPTY);
	fillRect(level, mid - 3, 62, mid + 3, 62, Terrain.EMPTY);
	fillRect(level, 0, 54, 15, 55, Terrain.WALL);
	fillRect(level, 0, 56, 15, 63, Terrain.EMPTY);
	// LastLevel's transition spans the two wall rows before the lower chamber;
	// the chamber itself repeats the entrance on its centre three cells.
	set(level, mid, 54, Terrain.ENTRANCE);
	set(level, mid, 55, Terrain.ENTRANCE);
	fillRect(level, mid - 1, 56, mid + 1, 56, Terrain.ENTRANCE);
	//`LastLevel`'s transition, whose *cell* is the one the hero arrives on (`Level.entrance()`
	//returns the `REGULAR_ENTRANCE` transition, not the tiles): Java widens that transition to a
	//3x3 area with `left--; right++; bottom += 2` and paints the extra ENTRANCE tiles inside it,
	//so the three tiles and the one arrival cell are different things. `extract` prefers this
	//declared cell over its last-ENTRANCE-tile scan because of it - without that the hero lands
	//on (9,56), a corner of the entrance chamber, which is unwalkable here (`create()` seals it).
	level.transitions.push({ pos: (level.h - 10) * level.w + 8, type: 'regularEntrance' });
	//`LastLevel.build()`'s floor-decoration scatter, in its exact stream position: after the
	//entrance chamber is filled, before the two centre-piece fills below (which is why the
	//chamber and centre cells it overwrites stay plain). One `Random.Int(5)` per `EMPTY` cell,
	//cell order - the draws are part of the floor's stream even though nothing after them
	//consumes randomness on this floor.
	for (let cell = 0; cell < level.map.length; cell++) {
		if (level.map[cell] === Terrain.EMPTY && SpdRandom.int(5) === 0) level.map[cell] = Terrain.EMPTY_DECO;
	}
	fillRect(level, mid - 2, 9, mid + 2, 15, Terrain.EMPTY);
	fillRect(level, mid - 3, 10, mid + 3, 14, Terrain.EMPTY);
	return { paint: level, rooms: [room(mid - 1, 10, mid + 1, 62)], feeling: null };
}

export function generateBossFloor(depth: number, strongerBosses = false, runSeed?: bigint): BossFloorData {
	switch (depth) {
	case 10: return prisonBoss(runSeed);
		case 15: return cavesBoss(strongerBosses);
		case 20: return cityBoss();
		case 25: return hallsBoss();
		case 26: return lastLevel();
		default: throw new Error(`generateBossFloor: unsupported depth ${depth}`);
	}
}
