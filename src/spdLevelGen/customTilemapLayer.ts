/**
 * Placement of a `CustomTilemap`'s own rect of frames into one of mwg's full-grid `TileMap` layers.
 *
 * Java's `CustomTilemap` covers only its `setRect`/`pos` area and leaves every other cell alone
 * (`NULL_TILE`); an mwg layer spans the whole level, so the sub-rect's frames are copied to its
 * origin with `NULL_TILE` everywhere else. Shared by the Caves and Halls boss floors' custom maps,
 * which are the same shape with different rects.
 */

/** `DungeonTileSheet.NULL_TILE` (`-1`, `tiles/DungeonTileSheet.java:42`) - a cell this layer leaves
 *  alone. It is what makes a cell blank: watabou's `Tilemap.needsRender(pos)` is `data[pos] >= 0`, and
 *  `CustomTilemap` itself declares no such constant, its inner classes writing the literal. */
export const NULL_TILE = -1;

/**
 * The rect is required to fit the level exactly: a taller one would silently lose its tail, and a
 * wider one would not lose anything at all - `(originY + y) * levelWidth + x` would just write the
 * overflow into the next row's cells, i.e. draw the frames in the wrong place. Both are checked
 * instead of skipped, since neither can be right. (Java cannot hit either: its per-tilemap array is
 * exactly `tileW*tileH`, so a rect that overflows the level still writes inside its own storage.)
 */
export function placeRectInto(frames: readonly number[], tileW: number, tileH: number,
	originX: number, originY: number, levelWidth: number, levelHeight: number): number[] {
	if (originX < 0 || originY < 0 || originX + tileW > levelWidth || originY + tileH > levelHeight) {
		throw new Error(`customTilemapLayer: ${tileW}x${tileH} rect at (${originX},${originY}) does not fit the ${levelWidth}x${levelHeight} level`);
	}
	const layer = new Array<number>(levelWidth * levelHeight).fill(NULL_TILE);
	for (let y = 0; y < tileH; y++) {
		for (let x = 0; x < tileW; x++) {
			layer[(originY + y) * levelWidth + (originX + x)] = frames[y * tileW + x]!;
		}
	}
	return layer;
}
