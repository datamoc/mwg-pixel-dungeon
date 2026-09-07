/**
 * SPD's two-layer wall rendering, as pure functions over a terrain grid.
 *
 * This is `DungeonTerrainTilemap.getTileVisual` and `DungeonWallsTilemap.getTileVisual`
 * (plus the `DungeonTileSheet` stitchers they call) translated block for block. It lives
 * apart from `main.ts` so the rules can be dumped and checked without booting a renderer -
 * see `tools/scratch/wallDump.ts`.
 *
 * The one rule worth stating up front, because it is the whole visual effect: a wall draws
 * its lit south face *only* when the cell below it is not itself wall
 * (`getRaisedWallTile`'s first line). A deep mass of rock therefore shows one row of brick
 * along its bottom edge and nothing behind it - the interior gets the dark top from the
 * upper layer instead. Without that test every wall cell draws a face and a five-deep mass
 * renders as a five-tile slab of brick.
 */

/** what the two rules need of a level: enough to read a cell and know where the edges are */
export interface TerrainGrid {
	readonly width: number;
	readonly height: number;
	inside(x: number, y: number): boolean;
	get(x: number, y: number): number;
	index(x: number, y: number): number;
}

/** the handful of this port's terrain ids the wall rules care about */
export interface WallTileKinds {
	readonly wall: number;
	readonly door: number;
	readonly doorClosed: number;
	readonly grass: number;
	readonly highGrass: number;
}

/** the frames the rules can return; `main.ts` owns the numbers, as it does for the kind ids */
export interface WallTileFrames {
	readonly floor: number;
	readonly grass: number;
	readonly wall: number;
	readonly wallAlt: number;
	readonly wallBehindDoor: number;
	readonly wallInternal: number;
	readonly wallOverhang: number;
	readonly doorSidewaysOverhangOpen: number;
	readonly doorSidewaysOverhangShut: number;
	readonly doorOverhangShut: number;
	readonly doorOverhangOpen: number;
	readonly doorSideways: number;
	readonly raisedDoorShut: number;
	readonly raisedDoorOpen: number;
	readonly raisedDoorSideways: number;
}

/** mwg's blank-cell sentinel, which is also Java's `DungeonTileSheet.NULL_TILE` - both -1 */
export const NO_TILE = -1;

/**
 * `DungeonTileSheet.wallStitcheable`: which cells a wall blends into.
 *
 * Java's list is `WALL`/`WALL_DECO`/`SECRET_DOOR`/`LOCKED_EXIT`/`UNLOCKED_EXIT`/
 * `BOOKSHELF`/`NULL_TILE`; of those this port only has plain wall, and an undiscovered
 * secret door is *already* stored as `wall` by `Secrets.conceal` - which is exactly why
 * Java lists `SECRET_DOOR` here, since a hidden door has to blend in. A shut door is not
 * stitcheable: Java keeps doors in `doorTiles` and gives them their own frames.
 *
 * Off-map counts as wall, because Java passes `-1` for a missing neighbour and `-1` is
 * `NULL_TILE`, which is in the stitcheable list. A mass of rock running off the edge of the
 * map therefore stitches to the edge instead of growing a face along it.
 */
export function stitchesAsWall(grid: TerrainGrid, kinds: WallTileKinds, x: number, y: number): boolean {
	if (!grid.inside(x, y)) return true;
	return grid.get(x, y) === kinds.wall;
}

/**
 * The lower layer (`DungeonTerrainTilemap`, drawn under the actors).
 *
 * `variance` is `DungeonTileSheet.tileVariance`, one byte per cell; `getVisualWithAlts`
 * takes the rare variant at >= 95 and the common one at >= 50, but of the wall frames only
 * `RAISED_WALL` appears in `commonAltVisuals` and none appears in `rareAltVisuals`, so for
 * walls the rule collapses to the single threshold at 50.
 */
export function terrainFrameAt(
	grid: TerrainGrid,
	kinds: WallTileKinds,
	frames: WallTileFrames,
	variance: ArrayLike<number>,
	x: number,
	y: number
): number {
	const kind = grid.get(x, y);

	//getRaisedDoorTile: a door with wall below it is seen from above, so it draws the
	//flat-ish sideways piece; otherwise it stands up, shut or open
	if (kind === kinds.door || kind === kinds.doorClosed) {
		if (stitchesAsWall(grid, kinds, x, y + 1)) return frames.raisedDoorSideways;
		return kind === kinds.doorClosed ? frames.raisedDoorShut : frames.raisedDoorOpen;
	}

	if (stitchesAsWall(grid, kinds, x, y)) {
		//the whole point: no exposed face below, so nothing is drawn on this layer
		if (stitchesAsWall(grid, kinds, x, y + 1)) return NO_TILE;

		const below = grid.get(x, y + 1);
		let frame =
			below === kinds.door || below === kinds.doorClosed
				? frames.wallBehindDoor
				: (variance[grid.index(x, y)] ?? 0) >= 50
					? frames.wallAlt
					: frames.wall;
		//getRaisedWallTile: +1 open to the right, +2 open to the left
		if (!stitchesAsWall(grid, kinds, x + 1, y)) frame += 1;
		if (!stitchesAsWall(grid, kinds, x - 1, y)) frame += 2;
		return frame;
	}

	if (kind === kinds.grass || kind === kinds.highGrass) return frames.grass;
	return frames.floor;
}

/**
 * The upper layer (`DungeonWallsTilemap`), which Java draws *above* the actors so a wall's
 * top and its overhanging lip cover whoever stands behind them. Two jobs:
 *
 * - a wall whose neighbour below is also wall draws `WALL_INTERNAL`, the dark top of the
 *   mass, stitched on its four corners (`stitchInternalWallTile`);
 * - a *non*-wall cell whose neighbour below is wall draws `WALL_OVERHANG`, the lip that
 *   wall casts up into this cell (`stitchWallOverhangTile`).
 *
 * A wall with open floor below it draws nothing here, its face having gone on the lower
 * layer - which is Java falling out of the `wallStitcheable` branch to `return -1`.
 */
export function wallFrameAt(
	grid: TerrainGrid,
	kinds: WallTileKinds,
	frames: WallTileFrames,
	x: number,
	y: number
): number {
	const belowInside = grid.inside(x, y + 1);
	const below = belowInside ? grid.get(x, y + 1) : NO_TILE;

	if (stitchesAsWall(grid, kinds, x, y)) {
		if (belowInside && !stitchesAsWall(grid, kinds, x, y + 1)) {
			//a shut door below is seen edge-on through the wall above it; an open one is
			//Java's explicit NULL_TILE, and plain floor falls through to nothing
			if (below === kinds.doorClosed) return frames.doorSideways;
			return NO_TILE;
		}

		//stitchInternalWallTile: +1 right, +2 right-below, +4 left-below, +8 left. Reached
		//for a bottom-edge wall too, since off-map below is stitcheable.
		let frame = frames.wallInternal;
		if (!stitchesAsWall(grid, kinds, x + 1, y)) frame += 1;
		if (!stitchesAsWall(grid, kinds, x + 1, y + 1)) frame += 2;
		if (!stitchesAsWall(grid, kinds, x - 1, y + 1)) frame += 4;
		if (!stitchesAsWall(grid, kinds, x - 1, y)) frame += 8;
		return frame;
	}

	if (belowInside && stitchesAsWall(grid, kinds, x, y + 1)) {
		//stitchWallOverhangTile: +1 open down-right, +2 open down-left. A door standing in a
		//side wall keeps its own overhang art.
		const kind = grid.get(x, y);
		let frame =
			kind === kinds.door
				? frames.doorSidewaysOverhangOpen
				: kind === kinds.doorClosed
					? frames.doorSidewaysOverhangShut
					: frames.wallOverhang;
		if (!stitchesAsWall(grid, kinds, x + 1, y + 1)) frame += 1;
		if (!stitchesAsWall(grid, kinds, x - 1, y + 1)) frame += 2;
		return frame;
	}

	//the lip above a doorway, so a door reads as set into the wall rather than painted on it
	if (below === kinds.doorClosed) return frames.doorOverhangShut;
	if (below === kinds.door) return frames.doorOverhangOpen;

	//Java would put a statue/alchemy-pot/barricade/high-grass overhang here; this port has no
	//raised art for any of those, so the cell above one of them stays clear
	return NO_TILE;
}
