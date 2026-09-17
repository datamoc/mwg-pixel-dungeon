/**
 * Port of `levels/CityLevel.java`'s `painter()`/`trapClasses()`/`trapChances()` and
 * `levels/painters/CityPainter.java`'s `decorate()`. Wires `regularPainter.ts`'s generic pipeline
 * with City's real numbers.
 */
import { Room } from './room';
import { SpdRandom } from '../spdRng';
import { PaintLevel, Terrain } from './paintLevel';
import { paintLevel, TrapTable, Feeling } from './regularPainter';
import { setGeneratorDepth } from '../items/generator';
import { mwlPaintRule, mwlTrapTable } from './mwlDungeonRules';
import { decorateCityBasis } from './cityDecorate';

/** `RegularLevel.nTraps()`: `Random.NormalIntRange(2, 3 + depth/5)` - CityLevel doesn't override it. */
function nTraps(depth: number): number {
	return SpdRandom.normalIntRange(2, 3 + Math.floor(depth / 5));
}

/** `CityLevel.trapClasses()`/`trapChances()`. Trap *behavior* isn't ported (see PORT_COVERAGE.md) -
 *  these are name-only stand-ins, kept in the real class order/weights for RNG-order fidelity. */
function trapTable(): TrapTable {
	return mwlTrapTable('city');
}

/** `CityPainter.decorate()`: one implementation, shared with the boss floor - see `cityDecorate.ts`. */
function decorate(level: PaintLevel, _rooms: Room[], depth: number): void {
	decorateCityBasis(level, depth);
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
		{ fill: feeling === Feeling.WATER ? mwlPaintRule('city').water.feeling : mwlPaintRule('city').water.normal, smoothness: mwlPaintRule('city').water.smoothness },
		{ fill: feeling === Feeling.GRASS ? mwlPaintRule('city').grass.feeling : mwlPaintRule('city').grass.normal, smoothness: mwlPaintRule('city').grass.smoothness },
		{ n: nTraps(depth), table: trapTable() },
		(level, r) => decorate(level, r, depth),
		feeling,
	);
}
