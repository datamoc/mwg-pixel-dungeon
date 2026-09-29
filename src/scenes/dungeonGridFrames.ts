import { Terrain } from '../spdLevelGen/paintLevel';
import type { DungeonTileFrameContext } from './dungeonTileFrames';

/**
 * `tiles/GridTileMap.getTileVisual()` (tag `v3.3.8`), the `SPDSettings.visualGrid()` overlay: every other
 * cell in a checkerboard (`(pos % width) % 2 == (pos / width) % 2`) that is a floor tile - `DungeonTileSheet.floorTile()`
 * (water, or a `directVisuals` entry below CHASM: empty, grass, wells, entrance/exit, embers, pedestal, special floor,
 * the three trap floors, deco floor, the exit stairs and the well) plus high and furrowed grass - shows frame
 * `setting` of the 4x4 `environment/visual_grid.png`. A door shows `4 + setting`, or `12 + setting` when the cell
 * above it is a stitched wall (`wallStitcheable`: wall, wall deco, secret door, exits, bookshelf).
 *
 * Simplified: this port's terrain model has no `OPEN_DOOR`, so a door always takes the closed frame `4 + setting`
 * (Java uses `8 + setting` for an opened door); `-1` (grid off) returns no frames at all.
 */
const FLOOR_TERRAIN: ReadonlySet<number> = new Set<number>([
	Terrain.EMPTY, Terrain.GRASS, Terrain.EMPTY_WELL, Terrain.ENTRANCE, Terrain.EXIT, Terrain.EMBERS, Terrain.PEDESTAL,
	Terrain.EMPTY_SP, Terrain.SECRET_TRAP, Terrain.TRAP, Terrain.INACTIVE_TRAP, Terrain.EMPTY_DECO,
	Terrain.LOCKED_EXIT, Terrain.WELL, Terrain.WATER, Terrain.HIGH_GRASS, Terrain.FURROWED_GRASS,
]);
const DOOR_TERRAIN: ReadonlySet<number> = new Set<number>([Terrain.DOOR, Terrain.LOCKED_DOOR, Terrain.CRYSTAL_DOOR]);
const STITCHED_WALL: ReadonlySet<number> = new Set<number>([Terrain.WALL, Terrain.WALL_DECO, Terrain.SECRET_DOOR, Terrain.LOCKED_EXIT, Terrain.BOOKSHELF]);

export function gridFrames(context: DungeonTileFrameContext, setting: number): number[] {
	const frames = new Array<number>(context.width * context.height).fill(-1);
	if (setting < 0) return frames;
	for (let y = 0; y < context.height; y++) {
		for (let x = 0; x < context.width; x++) {
			if (x % 2 !== y % 2) continue;
			const raw = context.rawTerrainAt(x, y);
			if (raw === undefined) continue;
			if (FLOOR_TERRAIN.has(raw)) frames[x + y * context.width] = setting;
			else if (DOOR_TERRAIN.has(raw)) {
				const above = y > 0 ? context.rawTerrainAt(x, y - 1) : undefined;
				frames[x + y * context.width] = above !== undefined && STITCHED_WALL.has(above) ? 12 + setting : 4 + setting;
			}
		}
	}
	return frames;
}
