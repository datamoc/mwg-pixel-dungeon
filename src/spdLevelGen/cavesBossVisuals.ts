/**
 * `CavesBossLevel`'s three `CustomTilemap`s, transcribed from tag `v3.3.8`: the gate's
 * `CityEntrance`/`EntranceOverhang` dressing and `ArenaVisuals`' wires.
 *
 * All three draw from the boss floor's own atlas (`Assets.Environment.CAVES_BOSS`,
 * `caves_boss.png`, an 8x8 grid of 16px tiles) rather than the Caves tileset, which is why the
 * gate rendered as plain floor here until they were ported: the frames come from a sheet this port
 * was not even loading.
 *
 * `CityEntrance.create()` and `EntranceOverhang.create()` are *cursor* passes, not rect fills:
 * their 5-wide `entryWay` arrays are consumed five cells at a time at column `tileW/2 - 2` of each
 * row, with `CityEntrance` filling everything else from the row it sits on (row 2 draws the
 * ceiling `13`, row 3 the `21` walls except two metal-structure columns, every other row nothing).
 * `ArenaVisuals` is not a fixed map at all - its frames are a function of the live level (which
 * cells are pylon positions, which are `INACTIVE_TRAP` wires, and the gate's own 5x1 strip), so Java
 * recomputes it from `ArenaVisuals.create()`, `unseal()` and `eliminatePylon()` rather than drawing
 * it once. (`seal()` and `activatePylon()` are the two state changes it does *not* recompute on.)
 *
 * `name`/`desc` are ported with the frames, because Java's examine text on those cells is not the
 * underlying terrain's: the wires and the gate each answer their own `wires_*`/`gate_*` strings.
 */
import { Terrain } from './paintLevel';
import { NULL_TILE, placeRectInto } from './customTilemapLayer';

/** `CavesBossLevel.WIDTH` - the boss floor is 33 wide, so every `entryWay` walk steps 5 cells. */
export const CAVES_BOSS_WIDTH = 33;
/** `CavesBossLevel.gate` (`Rect(14,13,19,14)`), in Java's own exclusive-edge form: the 5x1 dressed
 *  strip between the entrance corridor and the arena. */
export const CAVES_GATE = { left: 14, top: 13, right: 19, bottom: 14 } as const;
/** `CavesBossLevel.pylonPositions`, as cell indices: `(4,13)`, `(28,13)`, `(4,37)`, `(28,37)`. */
export const CAVES_PYLON_POSITIONS: readonly number[] = [
	4 + 13 * CAVES_BOSS_WIDTH, 28 + 13 * CAVES_BOSS_WIDTH,
	4 + 37 * CAVES_BOSS_WIDTH, 28 + 37 * CAVES_BOSS_WIDTH,
];

/** `CityEntrance`'s `entryWay`, verbatim - 11 rows of 5, consumed down the entrance column. */
const ENTRANCE_ENTRY_WAY: readonly number[] = [
	-1, 7, 7, 7, -1,
	-1, 1, 2, 3, -1,
	8, 1, 2, 3, 12,
	16, 9, 10, 11, 20,
	16, 16, 18, 20, 20,
	16, 17, 18, 19, 20,
	16, 16, 18, 20, 20,
	16, 17, 18, 19, 20,
	16, 16, 18, 20, 20,
	16, 17, 18, 19, 20,
	24, 25, 26, 27, 28,
];

/** `EntranceOverhang`'s `entryWay`, verbatim - the same walk, drawn on the wall layer. */
const OVERHANG_ENTRY_WAY: readonly number[] = [
	0, 7, 7, 7, 4,
	0, 15, 15, 15, 4,
	-1, 23, 23, 23, -1,
	-1, -1, -1, -1, -1,
	-1, 6, -1, 14, -1,
	-1, -1, -1, -1, -1,
	-1, 6, -1, 14, -1,
	-1, -1, -1, -1, -1,
	-1, 6, -1, 14, -1,
	-1, -1, -1, -1, -1,
	-1, -1, -1, -1, -1,
];

/**
 * `CityEntrance.create()`: `tileW x tileH` frames for the entrance region (Java's rect is
 * `(0,0,width(),11)`, so 33x11). The cursor pass is transcribed as written: each row's 5-wide
 * `entryWay` block starts at column `tileW/2 - 2` and is copied there as it is consumed, which is
 * what keeps the block aligned to its row. That column is Java's **integer** `tileW/2`, so on this
 * odd-width floor it is 14, not `14.5` - reading it as JS division makes the comparison never
 * match and leaves the whole entrance undressed (which is what this did until its check caught it).
 */
export function cityEntranceFrames(tileW: number, tileH: number): number[] {
	const data = new Array<number>(tileW * tileH).fill(NULL_TILE);
	let entryPos = 0;
	for (let i = 0; i < data.length; i++) {
		if (i % tileW === Math.floor(tileW / 2) - 2) {
			data[i++] = ENTRANCE_ENTRY_WAY[entryPos++]!;
			data[i++] = ENTRANCE_ENTRY_WAY[entryPos++]!;
			data[i++] = ENTRANCE_ENTRY_WAY[entryPos++]!;
			data[i++] = ENTRANCE_ENTRY_WAY[entryPos++]!;
			data[i] = ENTRANCE_ENTRY_WAY[entryPos++]!;
		} else if (Math.floor(i / tileW) === 2) {
			data[i] = 13;
		} else if (Math.floor(i / tileW) === 3) {
			//except on two columns specifically, where we have metal structures
			data[i] = (i % tileW === 9 || i % tileW === 23) ? NULL_TILE : 21;
		}
	}
	return data;
}

/** `EntranceOverhang.create()`: the same walk over the wall layer's own array - only the entry
 *  column is ever drawn, everything else stays blank. Same integer-division caveat as
 *  `cityEntranceFrames` above. */
export function entranceOverhangFrames(tileW: number, tileH: number): number[] {
	const data = new Array<number>(tileW * tileH).fill(NULL_TILE);
	let entryPos = 0;
	for (let i = 0; i < data.length; i++) {
		if (i % tileW === Math.floor(tileW / 2) - 2) {
			data[i++] = OVERHANG_ENTRY_WAY[entryPos++]!;
			data[i++] = OVERHANG_ENTRY_WAY[entryPos++]!;
			data[i++] = OVERHANG_ENTRY_WAY[entryPos++]!;
			data[i++] = OVERHANG_ENTRY_WAY[entryPos++]!;
			data[i] = OVERHANG_ENTRY_WAY[entryPos++]!;
		}
	}
	return data;
}

export interface CavesArenaVisualContext {
	/** the level's own terrain grid, as Java's `Dungeon.level.map`. `ArrayLike` because the port
	 *  has two: the generated floor's mapped kinds and the ported painter's own `Int32Array`. */
	terrain: ArrayLike<number>;
	width: number;
	/** whether the gate is still whole. Java reads this as `Dungeon.level.solid[gatePos]`, which is
	 *  true from `build()` until `unseal()` breaks the gate - `seal()` does not touch it, so the
	 *  gate stays whole for the whole fight. */
	gateIntact: boolean;
	/** `Dungeon.level.locked` - the boss arena's seal, which this port carries as its own flag */
	locked: boolean;
	/** whether a `Pylon` actor currently stands on `cell` (`Actor.findChar(k) instanceof Pylon`) */
	pylonActorAt: (cell: number) => boolean;
	/** `gate.inside(cellToPoint(cell))` */
	insideGate: (cell: number) => boolean;
}

/**
 * `ArenaVisuals.updateState()`: the 33x27 frame block Java keeps for the arena (its rect is
 * `(0,12,width(),27)`), recomputed from the live level each time the pylon/energy state changes.
 *
 * Four cases per cell, in Java's own order: a pylon position draws `38` while the arena is sealed
 * with no pylon actor standing on it (and nothing once one is); a cell Chebyshev-adjacent to a
 * pylon draws the directional wire tile `54 + (x + 8y) - (x' + 8y')`, one of the sheet's eight
 * compass pieces (`x + 8y` is Java's own row-major index form, *not* this level's `x + width*y`);
 * an `INACTIVE_TRAP` cell draws the wire `37`; the gate's 5x1 strip draws `40`/`32` (whole gate vs
 * broken) as a run; everything else draws nothing.
 */
export function cavesArenaFrames(context: CavesArenaVisualContext, tileW: number, tileH: number, tileY: number): number[] {
	const data = new Array<number>(tileW * tileH).fill(NULL_TILE);
	let j = context.width * tileY;
	for (let i = 0; i < data.length; i++) {
		if (context.terrain[j] === Terrain.EMPTY_SP) {
			for (const k of CAVES_PYLON_POSITIONS) {
				if (k === j) {
					data[i] = context.locked && !context.pylonActorAt(k) ? 38 : NULL_TILE;
				} else if (Math.max(Math.abs((k % context.width) - (j % context.width)), Math.abs(Math.floor(k / context.width) - Math.floor(j / context.width))) === 1) {
					//`j / w` and `k / w` are Java's integer division - the tile index is the row
					//number, so a float reading would pick a frame off the sheet's own palette
					data[i] = 54 + (j % context.width + 8 * Math.floor(j / context.width)) - (k % context.width + 8 * Math.floor(k / context.width));
				}
			}
		} else if (context.terrain[j] === Terrain.INACTIVE_TRAP) {
			data[i] = 37;
		} else if (context.insideGate(j)) {
			let idx = context.gateIntact ? 40 : 32;
			data[i++] = idx++;
			data[i++] = idx++;
			data[i++] = idx++;
			data[i++] = idx++;
			data[i] = idx;
			j += 4;
		}
		j++;
	}
	return data;
}

/** `ArenaVisuals.image()`'s own suppression: Java nulls the tilemap's image for *every* cell within
 *  one cell of a pylon, and `WndInfoCell` only consults a tilemap whose `image()` is non-null there -
 *  so those cells fall through to their terrain's name instead, even the wire frames it does draw.
 *  (`Dungeon.level.distance` is Chebyshev, matching the `adjacent` test in the frame pass above.) */
function outsidePylonReach(context: CavesArenaVisualContext, cell: number): boolean {
	const x = cell % context.width;
	const y = Math.floor(cell / context.width);
	return !CAVES_PYLON_POSITIONS.some((k) => Math.max(
		Math.abs((k % context.width) - x), Math.abs(Math.floor(k / context.width) - y)) <= 1);
}

/** `ArenaVisuals.name()`'s overrides: the wires and the gate name themselves, and everything else
 *  falls through to the terrain's own name. Returns the catalog key Java would read. */
export function cavesArenaNameKey(context: CavesArenaVisualContext, cell: number): string | undefined {
	if (!outsidePylonReach(context, cell)) return undefined;
	if (context.terrain[cell] === Terrain.INACTIVE_TRAP) return 'levels.cavesbosslevel.wires_name';
	if (context.insideGate(cell)) return 'levels.cavesbosslevel.gate_name';
	return undefined;
}

/** `ArenaVisuals.desc()`'s overrides, on the same three cases - the gate's description splits on
 *  whether its tiles are still solid (the gate is whole) or broken. */
export function cavesArenaDescKey(context: CavesArenaVisualContext, cell: number): string | undefined {
	if (!outsidePylonReach(context, cell)) return undefined;
	if (context.terrain[cell] === Terrain.INACTIVE_TRAP) return 'levels.cavesbosslevel.wires_desc';
	if (!context.insideGate(cell)) return undefined;
	return context.gateIntact ? 'levels.cavesbosslevel.gate_desc' : 'levels.cavesbosslevel.gate_desc_broken';
}

/** `CityEntrance`'s layer, `(0,0,width,11)` as Java's own `setRect` has it. */
export function cavesEntranceLayer(levelWidth: number, levelHeight: number): number[] {
	return placeRectInto(cityEntranceFrames(levelWidth, 11), levelWidth, 11, 0, 0, levelWidth, levelHeight);
}

/** `EntranceOverhang`'s layer - the same rect, drawn on the wall side. */
export function cavesOverhangLayer(levelWidth: number, levelHeight: number): number[] {
	return placeRectInto(entranceOverhangFrames(levelWidth, 11), levelWidth, 11, 0, 0, levelWidth, levelHeight);
}

/** `ArenaVisuals`' layer, `(0,12,width,27)` - the arena's own rows, recomputed on state change. */
export const CAVES_ARENA_VISUAL_TOP = 12;
export const CAVES_ARENA_VISUAL_HEIGHT = 27;
export function cavesArenaLayer(levelWidth: number, levelHeight: number, context: CavesArenaVisualContext): number[] {
	return placeRectInto(
		cavesArenaFrames(context, levelWidth, CAVES_ARENA_VISUAL_HEIGHT, CAVES_ARENA_VISUAL_TOP),
		levelWidth, CAVES_ARENA_VISUAL_HEIGHT, 0, CAVES_ARENA_VISUAL_TOP, levelWidth, levelHeight,
	);
}
