/**
 * Fixed-layout boss floors.
 *
 * The four Java boss levels after the Sewers are direct `Level` subclasses, not
 * `RegularLevel`s. They therefore must not go through the room graph builder. This
 * module ports their stable geometry and transition cells into the same PaintLevel
 * surface used by regular floors. Boss phase scripts remain scene-owned.
 */
import { PaintLevel, Terrain, fillEllipse, fillXY, set } from './paintLevel';
import type { Room } from './room';
import { spdPatchGenerate } from './spdPatch';
import { SpdRandom } from '../spdRng';

export interface BossFloorData {
	paint: PaintLevel;
	rooms: Room[];
	feeling: number | null;
}

function room(left: number, top: number, right: number, bottom: number): Room {
	const r = { left, top, right, bottom } as Room;
	return r;
}

function fillRect(level: PaintLevel, left: number, top: number, right: number, bottom: number, terrain: number): void {
	fillXY(level, left, top, right - left + 1, bottom - top + 1, terrain);
}

/** `PrisonBossLevel.setMapStart()` (`v3.3.8`): the entrance room, hallway, four start cells, and
 *  Tengu's own lower cell behind a locked door. Shared by `setMapPause()`/`setMapEnd()`, which
 *  both repaint over this same base the way their Java originals call `setMapStart()` first. */
function paintPrisonBossStart(level: PaintLevel): void {
	fillRect(level, 0, 0, 31, 31, Terrain.WALL);
	fillRect(level, 8, 2, 13, 8, Terrain.EMPTY);
	fillRect(level, 9, 7, 12, 24, Terrain.EMPTY);
	for (const [left, top, right, bottom] of [[5, 9, 10, 16], [11, 9, 16, 16], [5, 15, 10, 22], [11, 15, 16, 22]]) {
		fillRect(level, left, top, right, bottom, Terrain.WALL);
		fillRect(level, left + 1, top + 1, right - 1, bottom - 1, Terrain.EMPTY);
	}
	fillRect(level, 6, 23, 15, 31, Terrain.EMPTY);
	set(level, 10, 4, Terrain.ENTRANCE);
	set(level, 10, 23, Terrain.LOCKED_DOOR);
	for (const [x, y] of [[10, 2], [7, 9], [13, 9], [7, 15], [13, 15], [8, 23], [12, 23]]) set(level, x, y, Terrain.WALL_DECO);
}

function prisonBoss(): BossFloorData {
	// PrisonBossLevel: setSize(32,32), with the start rooms and Tengu's lower cell.
	const level = new PaintLevel(32, 32);
	paintPrisonBossStart(level);
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
export function prisonBossPause(): BossFloorData {
	const level = new PaintLevel(32, 32);
	paintPrisonBossStart(level);
	set(level, 10, 23, Terrain.DOOR);
	// startCells[1] = (11,9)-(16,16): Painter.fill(startCells[1].left, .top+3, 1, 7, EMPTY) and
	// Painter.fill(startCells[1].left+2, .top+2, 3, 10, EMPTY).
	fillRect(level, 11, 12, 11, 18, Terrain.EMPTY);
	fillRect(level, 13, 11, 15, 20, Terrain.EMPTY);
	fillRect(level, 8, 2, 13, 8, Terrain.WALL);
	set(level, 9 + 1, 7, Terrain.EMPTY);
	set(level, 9 + 1, 8, Terrain.DOOR);
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
	// `Painter.fillEllipse(this, arena, 1, EMPTY)`: margin 1 on a (16,16) rect -> (4,2), 14x14.
	fillEllipse(level, PRISON_ARENA.left + 1, PRISON_ARENA.top + 1, 14, 14, Terrain.EMPTY);
	return { paint: level, rooms: [room(PRISON_ARENA.left, PRISON_ARENA.top, PRISON_ARENA.right, PRISON_ARENA.bottom)], feeling: null };
}

/**
 * `PrisonBossLevel.setMapEnd()`, Tengu's death transition: the start map again (so the entrance/
 * hallway/cells return), Tengu's own door unlocked, and `endMap` - a fixed 14-wide x 23-row tile
 * block encoding the chasm/exit room - pasted starting at `endStart = (11, 9)` (`startHallway.left
 * +2, .top+2`), one row of 14 cells at a time down to the last map row. Java's `IronKey`-heap
 * cleanup and the two `CustomTilemap` exit-visual overlays are presentation/item-side, not paint.
 */
export function prisonBossEnd(): BossFloorData {
	const level = new PaintLevel(32, 32);
	paintPrisonBossStart(level);
	set(level, 10, 23, Terrain.DOOR);
	let cell = 11 + 9 * 32;
	for (let row = 0; row < PRISON_END_MAP.length / 14; row++) {
		for (let col = 0; col < 14; col++) level.map[cell + col] = PRISON_END_MAP[row * 14 + col]!;
		cell += 32;
	}
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
	const level = new PaintLevel(33, 42, Terrain.CHASM);
	//`CavesBossLevel.build()`'s very first paint is `Painter.fill(this, gate, Terrain.CUSTOM_DECO)`,
	//*before* the arena ellipse and the water/trap patch. The ordering is load-bearing, and the
	//reason is geometric: `gate` is `Rect(14,13,19,14)`, and `Painter.fillEllipse`'s top row for a
	//24-wide ellipse is six cells wide (`radW` 12, `rowY -11.5` -> `rowW 2*sqrt(144-132.25)` = 6.86
	//-> rounded to 6), starting at `x + (24-6)/2` = `5+9` = column 14. So Java's ellipse lands
	//*exactly* on the gate's bottom row (cols 14-19 of row 14) and clears it to plain arena floor.
	//The gate therefore keeps only row 13 as `CUSTOM_DECO`; row 14 becomes ordinary floor, and the
	//patch loop below rolls water and traps across it like any other arena cell.
	//
	//This port used to paint the gate *after* the loop instead. That did **not** move the RNG
	//stream: whichever order the two fills run in, the ellipse has already cleared row 14 to `EMPTY`
	//before the loop begins, so the loop's cell set - and the 489 `SpdRandom.int` draws that patch
	//generation and the trap rolls together consume at seed 42 - are identical both ways. What the
	//old order changed was the loop's *results*: the six gate cells were force-painted `SIGN`
	//afterwards, erasing the water the loop had placed on them (3 of the 6 at seed 42). That
	//mattered beyond looks - `activatePylon()` seeds `PylonEnergy` on `INACTIVE_TRAP`/`WATER`/
	//`CUSTOM_DECO` cells from `mainArena.top - 1` (row 13) down, so all six counted as energy cells
	//instead of the three the roll had actually made, inflating the pylon field's cell set from
	//Java's 108 to 111.
	//
	//`SIGN` is this port's stand-in for Java's `CUSTOM_DECO` here. It plays both of that tile's
	//roles - it is the tile `dm300Supercharge()`'s energy seed keys on, mirroring Java's
	//`CUSTOM_DECO` clause, and it renders as plain floor (`gameBridge.ts`'s `SIGN -> 'floor'`), so
	//painting it a row earlier changes nothing visually: row 14 ends up `EMPTY`, which maps to
	//`floor` as well. Java's gate is dressed by the `CityEntrance`/`ArenaVisuals` `CustomTilemap`s
	//painted over the whole entrance region, which this port has no equivalent for - see
	//PORT_COVERAGE.md.
	fillRect(level, 14, 13, 19, 14, Terrain.SIGN);
	fillEllipse(level, CAVES_BOSS_ARENA.left, CAVES_BOSS_ARENA.top, 24, 24, Terrain.EMPTY);
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
	//(Java's line 140 is `new CavesPainter().paint(this, null)`, which the port does not run; see
	//PORT_COVERAGE.md). The entrance stamp's own `Painter.set(this, entrance, Terrain.ENTRANCE)`
	//runs *inside* `buildEntrance()`, which is why the port's explicit `set(..., ENTRANCE)` below
	//still wins over a stamp that happens to cover that cell.
	buildEntranceStamps(level, SpdRandom.element(ENTRANCE_STAMPS as unknown as string[]));
	buildCornerStamps(level, SpdRandom.element(CORNER_STAMPS as unknown as string[]));
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
	for (const [x, y] of [[4, 13], [28, 13], [4, 37], [28, 37]]) {
		set(level, x, y, Terrain.EMPTY);
		level.mobs.push({ pos: x + y * level.w, kind: 'pylon' });
	}
	// Keep the scene's existing boss spawn convention away from the entrance cell; Java's
	// real Caves arena chooses a free point after the gate seals.
	return { paint: level, rooms: [room(8, 18, 24, 34)], feeling: null };
}

function cityBoss(): BossFloorData {
	// CityBossLevel: WIDTH=15, HEIGHT=48, entry=(1,37)-(14,48), arena=(1,25)-(14,38).
	const level = new PaintLevel(15, 48, Terrain.CHASM);
	fillRect(level, 1, 37, 13, 47, Terrain.EMPTY);
	fillRect(level, 2, 38, 12, 46, Terrain.BOOKSHELF);
	fillRect(level, 4, 42, 10, 46, Terrain.EMPTY);
	set(level, 7, 44, Terrain.ENTRANCE);
	fillEllipse(level, 1, 25, 14, 14, Terrain.EMPTY);
	for (const [x, y] of [[4, 31], [10, 31], [10, 37], [4, 37]]) set(level, x, y, Terrain.PEDESTAL);
	for (const x of [3, 4, 10, 11]) set(level, x, 32, Terrain.STATUE);
	set(level, 7, 25, Terrain.LOCKED_DOOR);
	fillRect(level, 4, 5, 10, 22, Terrain.EMPTY);
	fillRect(level, 4, 5, 10, 8, Terrain.EXIT);
	set(level, 7, 13, Terrain.EXIT);
	return { paint: level, rooms: [room(1, 25, 13, 38)], feeling: null };
}

function hallsBoss(): BossFloorData {
	// HallsBossLevel: a 32x32 cross-shaped approach and a central 9x9 boss room.
	const level = new PaintLevel(32, 32, Terrain.WALL);
	for (let i = 0; i < 5; i++) {
		const left = 4 + i * 5;
		const top = i === 2 ? 2 : i === 1 || i === 3 ? 3 : 4;
		const bottom = i === 2 ? 24 : i === 1 || i === 3 ? 22 : 20;
		fillRect(level, left, top, left + 4, bottom, Terrain.EMPTY);
	}
	fillRect(level, 12, 8, 20, 16, Terrain.EMPTY_SP);
	fillRect(level, 15, 10, 17, 13, Terrain.EMPTY);
	set(level, 16, 16, Terrain.ENTRANCE);
	set(level, 16, 9, Terrain.EXIT);
	for (const [x, y] of [[12, 8], [13, 8], [19, 8], [20, 8], [12, 15], [13, 15], [19, 15], [20, 15]]) set(level, x, y, Terrain.WALL_DECO);
	return { paint: level, rooms: [room(12, 8, 20, 16)], feeling: null };
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

export function generateBossFloor(depth: number, strongerBosses = false): BossFloorData {
		switch (depth) {
		case 10: return prisonBoss();
		case 15: return cavesBoss(strongerBosses);
		case 20: return cityBoss();
		case 25: return hallsBoss();
		case 26: return lastLevel();
		default: throw new Error(`generateBossFloor: unsupported depth ${depth}`);
	}
}
