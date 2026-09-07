/**
 * Port of `levels/CityLevel.java`'s `painter()`/`trapClasses()`/`trapChances()` and
 * `levels/painters/CityPainter.java`'s `decorate()`. Wires `regularPainter.ts`'s generic pipeline
 * with City's real numbers.
 */
import { Room } from './room';
import { SpdRandom } from '../spdRng';
import { PaintLevel, Terrain } from './paintLevel';
import { paintLevel, TrapTable, Feeling } from './regularPainter';
import { setGeneratorDepth } from '../spdItems/generator';

/** `RegularLevel.nTraps()`: `Random.NormalIntRange(2, 3 + depth/5)` - CityLevel doesn't override it. */
function nTraps(depth: number): number {
	return SpdRandom.normalIntRange(2, 3 + Math.floor(depth / 5));
}

/** `CityLevel.trapClasses()`/`trapChances()`. Trap *behavior* isn't ported (see PORT_COVERAGE.md) -
 *  these are name-only stand-ins, kept in the real class order/weights for RNG-order fidelity. */
function trapTable(): TrapTable {
	return {
		classes: [
			'frost', 'storm', 'corrosion', 'blazing', 'disintegration',
			'rockfall', 'flashing', 'guardian', 'weakening',
			'disarming', 'summoning', 'warping', 'cursing', 'pitfall', 'distortion', 'gateway', 'geyser',
		],
		chances: [4, 4, 4, 4, 4, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1],
	};
}

/**
 * `DungeonTileSheet.wallStitcheable`, narrowed to the terrain values this port models (WALL,
 * WALL_DECO, SECRET_DOOR, LOCKED_EXIT, BOOKSHELF) - `UNLOCKED_EXIT` and off-map `NULL_TILE` are
 * both real members of Java's list but neither is reachable here: this port has no unlocked-exit
 * terrain state (see PORT_COVERAGE.md), and `decorate()` only ever reads `map[i+w]` for
 * `i < w*(h-1)`, which is always in-bounds.
 */
function wallStitcheable(terrain: number): boolean {
	return terrain === Terrain.WALL || terrain === Terrain.WALL_DECO || terrain === Terrain.SECRET_DOOR
		|| terrain === Terrain.LOCKED_EXIT || terrain === Terrain.BOOKSHELF;
}

/** `CityPainter.decorate()`. */
function decorate(level: PaintLevel, _rooms: Room[], depth: number): void {
	const map = level.map;
	const w = level.w;
	const l = level.w * level.h;

	for (let i = 0; i < l - w; i++) {
		if (map[i] === Terrain.EMPTY && SpdRandom.int(10) === 0) {
			map[i] = Terrain.EMPTY_DECO;
		} else if (map[i] === Terrain.WALL && !wallStitcheable(map[i + w]) && SpdRandom.int(21 - depth) === 0) {
			map[i] = Terrain.WALL_DECO;
		}
	}
}

/**
 * `CityLevel.painter()`'s `.setWater(...)`/`.setGrass(...)` (non-`Feeling`-gated numbers) plus
 * `nTraps()`'s `Random.NormalIntRange` roll - see `sewerPainter.ts`'s `paintSewerLevel` doc
 * comment for the exact RNG-ordering rationale this mirrors.
 */
export function paintCityLevel(rooms: Room[], depth: number, feeling: number | null = null): PaintLevel {
	setGeneratorDepth(depth);
	return paintLevel(
		rooms, depth,
		{ fill: feeling === Feeling.WATER ? 0.90 : 0.3, smoothness: 4 },
		{ fill: feeling === Feeling.GRASS ? 0.8 : 0.2, smoothness: 3 },
		{ n: nTraps(depth), table: trapTable() },
		(level, r) => decorate(level, r, depth),
		feeling,
	);
}
