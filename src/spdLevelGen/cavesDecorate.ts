/**
 * The null-room half of `CavesPainter.decorate()`, split out of `cavesPainter.ts` so the
 * fixed-layout boss floor can run it without dragging in the room-graph pipeline (`cavesPainter.ts`
 * imports `regularPainter.ts`, which imports the room registry and the item generator).
 *
 * `CavesBossLevel.build()` ends with `new CavesPainter().paint(this, null)` (line 140), and a null
 * room list does **not** make that pass a no-op: only `RegularPainter.paint`'s sizing block sits
 * inside its `if (rooms != null)`, so the pass still pushes a substream generator
 * (`Random.pushGenerator(Random.Long())`) and calls `decorate(level, rooms)` with an empty list -
 * where the room loops do nothing but the two whole-level scans below still run, painting floor deco
 * and ore veins off that substream. `MiningLevel` reaches the same code the same way.
 *
 * `cavesPainter.ts` keeps the regular-floor `decorate()` (room merges and corner fills included) and
 * imports these two from here, so there is still one implementation of each.
 */
import { PaintLevel, Terrain } from './paintLevel';
import { SpdRandom } from '../spdRng';

/**
 * `DungeonTileSheet.floorTile(tile)`: `tile == WATER || directVisuals.get(tile, CHASM) < CHASM`.
 * `directVisuals` only maps GROUND-block visuals (all well below `CHASM`'s tile-sheet index), so
 * this reduces to the exact terrain set present in that map, read off its static initializer
 * (`DungeonTileSheet.java`) rather than approximated - notably NOT `HIGH_GRASS` (only in
 * `directFlatVisuals`, so it's excluded; `floorTile` is about the "3D" visual, not the flat one).
 */
export const FLOOR_TILE = new Set<number>([
	Terrain.EMPTY, Terrain.GRASS, Terrain.EMPTY_WELL, Terrain.ENTRANCE, Terrain.EXIT,
	Terrain.EMBERS, Terrain.PEDESTAL, Terrain.EMPTY_SP, Terrain.SECRET_TRAP, Terrain.TRAP,
	Terrain.INACTIVE_TRAP, Terrain.EMPTY_DECO, Terrain.WELL, Terrain.WATER,
	// LOCKED_EXIT/UNLOCKED_EXIT are also in the real map, but neither is reachable on the regular
	// (non-boss) floors this port generates.
]);

/** `CavesPainter.decorate()`'s two global scans, with Java's own empty room list: `RegularPainter`
 *  hands `decorate` an empty `ArrayList` in null-room mode, so the room merges and corner fills are
 *  unreachable and only these two loops run. Used by the Caves boss floor and by `MiningLevel`. */
export function decorateStandaloneCaves(level: PaintLevel): void {
	const map = level.map;
	const w = level.w;
	const l = level.w * level.h;
	for (let i = w + 1; i < l - w; i++) {
		if (map[i] !== Terrain.EMPTY) continue;
		let n = 0;
		if (map[i + 1] === Terrain.WALL) n++;
		if (map[i - 1] === Terrain.WALL) n++;
		if (map[i + w] === Terrain.WALL) n++;
		if (map[i - w] === Terrain.WALL) n++;
		if (SpdRandom.int(6) <= n) map[i] = Terrain.EMPTY_DECO;
	}
	for (let i = 0; i < l - w; i++) {
		if (map[i] === Terrain.WALL && FLOOR_TILE.has(map[i + w]) && SpdRandom.int(4) === 0) {
			map[i] = Terrain.WALL_DECO;
		}
	}
}
