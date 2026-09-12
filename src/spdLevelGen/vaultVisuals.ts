/**
 * `LastLevel.java`'s endgame vault (depth 26), transcribed from tag `v3.3.8`: the three
 * `CustomTilemap`s that give the shaft its look, and the `create()` pass that makes its pit cells
 * unwalkable.
 *
 * Java draws the vault from its own atlas (`Assets.Environment.HALLS_SP`, `halls_special.png`,
 * an 8x8 grid of 16px tiles) rather than from the region tileset: `CustomFloor` covers the shaft's
 * 7-column strip with a lit floor, a candle cluster around the Amulet, and decoration-dependent
 * tiles; `CenterPieceVisuals` and `CenterPieceWalls` stamp a fixed 16x10 / 16x9 block over the
 * entrance end. `CustomFloor.create()` is a *streaming* pass with its own cursor arithmetic (index
 * `i` into a 7-wide display strip, cell walked in map order with a row-break recompute), and the
 * candle cluster is embedded mid-loop with three modifiers - so it is transcribed statement for
 * statement here rather than rewritten into something tidier that would place tiles differently.
 *
 * The two physics rules are ported too, because both are gameplay and not cosmetics: pit cells are
 * forced `passable = avoid = false; solid = true` (`create()`), and so is every cell from
 * `height - ROOM_TOP + 2` down - the decorative entrance chamber. In Java that means the hero can
 * neither step into the vault's chasms nor walk down into the chamber; this port used to allow
 * both (walking into a vault chasm is a fall, and a fall is fatal).
 *
 * Not ported, stated rather than hidden: `create()` also marks rows `height - ROOM_TOP + 1` onward
 * `discoverable = false` outside columns 4-12 and `visited = true` inside them, a fog-of-war
 * pre-seeding that Java's `FogOfWar` reads directly. This port's fog derives what is drawable from
 * terrain adjacency instead of a per-cell `discoverable[]`, so reproducing it means adding a
 * per-cell "never draw this" channel to the fog layer - a presentation-only difference in a single
 * room, left as a documented gap.
 */
import { Terrain } from './paintLevel';

/** `LastLevel.ROOM_TOP` - the entrance chamber's height, and the offset the custom tiles use. */
const ROOM_TOP = 10;
/** `LastLevel.WIDTH`/`MID`. */
const WIDTH = 16;
const MID = WIDTH / 2;
/** `LastLevel.AMULET_POS = 12 * WIDTH + MID` - where `createItems()` drops the Amulet. */
export const AMULET_POS = 12 * WIDTH + MID;

/** `CustomFloor`'s `CANDLES` array, verbatim - the 7x7 cluster drawn around `AMULET_POS`. */
const CANDLES: readonly number[] = [
	-1, 42, 46, 46, 46, 43, -1,
	42, 46, 46, 46, 46, 46, 43,
	46, 46, 45, 19, 44, 46, 46,
	46, 46, 19, 19, 19, 46, 46,
	46, 46, 43, 19, 42, 46, 46,
	44, 46, 46, 19, 46, 46, 45,
	-1, 44, 45, 19, 44, 45, -1,
];

/** `CenterPieceVisuals`' 16x10 map, verbatim (`tileW = 16`, `tileH = 10`). */
export const CENTER_PIECE_VISUALS: readonly number[] = [
	-1, -1, -1, -1, -1, -1, -1, -1, 19, -1, -1, -1, -1, -1, -1, -1,
	0, 0, 0, 0, 8, 9, 10, 11, 19, 11, 12, 13, 14, 0, 0, 0,
	0, 0, 0, 0, 16, 17, 18, 31, 19, 31, 20, 21, 22, 0, 0, 0,
	0, 0, 0, 0, 24, 25, 26, 19, 19, 19, 28, 29, 30, 0, 0, 0,
	0, 0, 0, 0, 24, 25, 26, 19, 19, 19, 28, 29, 30, 0, 0, 0,
	0, 0, 0, 0, 24, 25, 26, 19, 19, 19, 28, 29, 30, 0, 0, 0,
	0, 0, 0, 0, 24, 25, 34, 35, 35, 35, 34, 29, 30, 0, 0, 0,
	0, 0, 0, 0, 40, 41, 36, 36, 36, 36, 36, 40, 41, 0, 0, 0,
	0, 0, 0, 0, 48, 49, 36, 36, 36, 36, 36, 48, 49, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

/** `CenterPieceWalls`' 16x9 map, verbatim (`tileW = 16`, `tileH = 9`). */
export const CENTER_PIECE_WALLS: readonly number[] = [
	4, 4, 4, 4, 4, 4, 4, 5, 7, 3, 4, 4, 4, 4, 4, 4,
	0, 0, 0, 0, 0, 0, 0, 1, 15, 2, 0, 0, 0, 0, 0, 0,
	-1, -1, -1, -1, -1, -1, -1, -1, 23, -1, -1, -1, -1, -1, -1, -1,
	-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
	-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
	-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
	-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
	-1, -1, -1, -1, 32, 33, -1, -1, -1, -1, -1, 32, 33, -1, -1, -1,
	-1, -1, -1, -1, 40, 41, -1, -1, -1, -1, -1, 40, 41, -1, -1, -1,
];

/**
 * `LastLevel.CustomFloor.create()`: frames for the shaft's 7-column strip, `-1` where nothing is
 * drawn. `variance` is `DungeonTileSheet.tileVariance` (0-99, one per cell), which decides whether
 * a candle tile (46) becomes its irregular variant (47); `amuletObtained` swaps the floor
 * decoration (27 -> 31) and lights the candles (`+8` on anything above tile 40), which is exactly
 * what Java does when the player picks the Amulet up and looks back.
 */
export function vaultFloorFrames(
	map: Int32Array,
	width: number,
	height: number,
	variance: Uint8Array,
	amuletObtained: boolean,
): number[] {
	const tileX = 5;
	const tileY = 0;
	const tileW = 7;
	const tileH = height - ROOM_TOP;
	const strip = new Array<number>(tileW * tileH).fill(0);
	const candlesStart = AMULET_POS - 3 - 3 * width;

	let cell = tileX + tileY * width;
	for (let i = 0; i < strip.length; i++) {
		if (i % tileW === 0) cell = tileX + (tileY + Math.floor(i / tileW)) * width;
		if (cell === candlesStart) {
			for (const candle of CANDLES) {
				if (strip[i] === 0) strip[i] = candle;
				if (strip[i] === 46 && variance[cell] >= 50) strip[i]++;
				if (amuletObtained && strip[i] > 40) strip[i] += 8;
				if (map[cell] !== Terrain.CHASM && map[cell + width] === Terrain.CHASM) strip[i + tileW] = 6;
				i++;
				cell++;
				if (i % tileW === 0) cell = tileX + (tileY + Math.floor(i / tileW)) * width;
			}
		}
		if (map[cell] === Terrain.EMPTY_DECO) strip[i] = amuletObtained ? 31 : 27;
		else if (map[cell] === Terrain.EMPTY) strip[i] = 19;
		else if (strip[i] === 0) strip[i] = -1;
		cell++;
	}

	const frames = new Array<number>(width * height).fill(-1);
	for (let i = 0; i < strip.length; i++) {
		const at = tileX + (tileY + Math.floor(i / tileW)) * width + (i % tileW);
		frames[at] = strip[i];
	}
	return frames;
}

/** A `CustomTilemap`'s static map stamped at its `setRect`/`pos` position. */
function stamped(map: readonly number[], mapW: number, mapH: number, atX: number, atY: number, width: number, height: number): number[] {
	const frames = new Array<number>(width * height).fill(-1);
	for (let row = 0; row < mapH; row++) {
		for (let column = 0; column < mapW; column++) {
			const x = atX + column;
			const y = atY + row;
			if (x < 0 || y < 0 || x >= width || y >= height) continue;
			frames[y * width + x] = map[row * mapW + column]!;
		}
	}
	return frames;
}

/** `CustomTilemap vis = new CenterPieceVisuals(); vis.pos(0, height - ROOM_TOP)`. */
export function vaultCenterVisualFrames(width: number, height: number): number[] {
	return stamped(CENTER_PIECE_VISUALS, 16, 10, 0, height - ROOM_TOP, width, height);
}

/** `CustomTilemap vis = new CenterPieceWalls(); vis.pos(0, height - ROOM_TOP - 1)`. */
export function vaultCenterWallFrames(width: number, height: number): number[] {
	return stamped(CENTER_PIECE_WALLS, 16, 9, 0, height - ROOM_TOP - 1, width, height);
}

/**
 * `LastLevel.create()`'s solid override, as the cell list it produces: every pit cell (`CHASM` is
 * the only `PIT` terrain in `Terrain.flags`), then every cell from `height - ROOM_TOP + 2` down
 * (the entrance chamber, which Java fills with `EMPTY` and `ENTRANCE` tiles and then makes
 * unwalkable). `restoreFromBundle` repeats both, so this applies on a loaded save too - the caller
 * re-runs it on every floor entry, which is what makes that free here.
 */
export function vaultBlockedCells(map: Int32Array, width: number, height: number): number[] {
	const blocked: number[] = [];
	for (let cell = 0; cell < map.length; cell++) {
		if (map[cell] === Terrain.CHASM) blocked.push(cell);
	}
	for (let cell = (height - ROOM_TOP + 2) * width; cell < map.length; cell++) blocked.push(cell);
	return blocked;
}
