/**
 * The null-room half of `CityPainter.decorate()`, split out of `cityPainter.ts` so the
 * fixed-layout boss floor can run it without dragging in the room-graph pipeline
 * (`cityPainter.ts` imports `regularPainter.ts`, which imports the room registry and
 * the item generator) - the same split `cavesDecorate.ts` makes for `CavesPainter`.
 *
 * `CityBossLevel.build()` ends with `new CityPainter().paint(this, null)`, and a null
 * room list does **not** make that pass a no-op: only `RegularPainter.paint`'s sizing
 * block sits inside its `if (rooms != null)`, so the pass still calls
 * `decorate(level, rooms)` with an empty list. `CityPainter.decorate` never reads the
 * room list at all, so the whole pass below still runs: `EMPTY -> EMPTY_DECO` on
 * `Random.Int(10) == 0` and `WALL -> WALL_DECO` over non-stitcheable ground on
 * `Random.Int(21 - depth) == 0` (which on depth 20 is `Int(1)` - every such wall
 * converts, Java's own arithmetic, not a bug).
 *
 * `cityPainter.ts` keeps the regular-floor `decorate()` and imports the basis from
 * here, so there is still one implementation.
 */
import { PaintLevel, Terrain } from './paintLevel';
import { SpdRandom } from '../spdRng';

/**
 * `DungeonTileSheet.wallStitcheable`, narrowed to the terrain values this port models
 * (WALL, WALL_DECO, SECRET_DOOR, LOCKED_EXIT, BOOKSHELF) - `UNLOCKED_EXIT` and
 * off-map `NULL_TILE` are both real members of Java's list but neither is reachable
 * here: this port has no unlocked-exit terrain state (see PORT_COVERAGE.md), and
 * `decorate()` only ever reads `map[i+w]` for `i < w*(h-1)`, which is always
 * in-bounds.
 */
export function cityWallStitcheable(terrain: number): boolean {
	return terrain === Terrain.WALL || terrain === Terrain.WALL_DECO || terrain === Terrain.SECRET_DOOR
		|| terrain === Terrain.LOCKED_EXIT || terrain === Terrain.BOOKSHELF;
}

/** `CityPainter.decorate()`'s whole-level scan, room list unused. */
export function decorateCityBasis(level: PaintLevel, depth: number): void {
	const map = level.map;
	const w = level.w;
	const l = level.w * level.h;

	for (let i = 0; i < l - w; i++) {
		if (map[i] === Terrain.EMPTY && SpdRandom.int(10) === 0) {
			map[i] = Terrain.EMPTY_DECO;
		} else if (map[i] === Terrain.WALL && !cityWallStitcheable(map[i + w]) && SpdRandom.int(21 - depth) === 0) {
			map[i] = Terrain.WALL_DECO;
		}
	}
}

/**
 * `new CityPainter().paint(this, null)` as `CityBossLevel.build()` runs it, at Java's
 * own position (after `impShop.paint()`, before the pillars, which overwrite with
 * plain `WALL` regardless).
 */
export function decorateStandaloneCityBoss(level: PaintLevel, depth: number): void {
	decorateCityBasis(level, depth);
}
