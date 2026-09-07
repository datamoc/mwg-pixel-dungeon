/**
 * Port of `levels/PrisonLevel.java`'s `painter()`/`trapClasses()`/`trapChances()` and
 * `levels/painters/PrisonPainter.java`'s `decorate()`. Same shape as `sewerPainter.ts`; wires
 * `regularPainter.ts`'s generic pipeline with Prison's real numbers.
 *
 * Two differences from Sewers worth flagging, both RNG-relevant:
 * - `decorate()` runs `Wandmaker.Quest.spawnWandmaker()` FIRST, for the first `EntranceRoom` in
 *   the (already shuffled) room list, and that can consume a variable number of draws. So
 *   Prison's decorate pass is not purely cosmetic the way Sewers' is.
 * - Prison's `EMPTY_DECO` pass is probability-weighted by wall-corner adjacency
 *   (`0.05 + 0.2` per adjacent inside corner) via `Random.Float()`, where Sewers uses
 *   `Random.Int(16) < count*count`. Both make exactly one draw per `EMPTY` cell, but they are
 *   different draws off different distributions - not interchangeable.
 */
import { Room } from './room';
import { SpdRandom } from '../spdRng';
import { PaintLevel, Terrain } from './paintLevel';
import { paintLevel, TrapTable, Feeling } from './regularPainter';
import { setGeneratorDepth } from '../spdItems/generator';
import { spawnWandmaker } from './wandmaker';

/** `RegularLevel.nTraps()`: `Random.NormalIntRange(2, 3 + depth/5)` - PrisonLevel doesn't
 *  override it either, but note `depth/5` is 1 across all of Prison, so the range is (2, 4)
 *  rather than Sewers' (2, 3). */
function nTraps(depth: number): number {
	return SpdRandom.normalIntRange(2, 3 + Math.floor(depth / 5));
}

/** `PrisonLevel.trapClasses()`/`trapChances()` - 14 classes, no depth special-case (unlike
 *  Sewers, whose depth 1 is `WornDartTrap`-only). Trap *behavior* isn't ported (see
 *  PORT_COVERAGE.md); these are name-only stand-ins in the real class order/weights, which is
 *  what `Random.chances` and the `avoidsHallways` routing need. */
function trapTable(): TrapTable {
	return {
		classes: [
			'chilling', 'shocking', 'toxic', 'burning', 'poisonDart',
			'alarm', 'ooze', 'gripping',
			'confusion', 'flock', 'summoning', 'teleportation', 'gateway', 'geyser',
		],
		chances: [
			4, 4, 4, 4, 4,
			2, 2, 2,
			1, 1, 1, 1, 1, 1,
		],
	};
}

/** `PrisonPainter.decorate()`. */
function decorate(level: PaintLevel, rooms: Room[]): void {
	// `for (Room r : rooms) if (r instanceof EntranceRoom) { spawnWandmaker(level, r); break; }`
	// - the FIRST entrance room in the current (shuffled) order, then stop.
	for (const r of rooms) {
		if (r.kind === 'entrance') {
			spawnWandmaker(level, r);
			break;
		}
	}

	const map = level.map;
	const w = level.w;
	const l = level.w * level.h;

	for (let i = w + 1; i < l - w - 1; i++) {
		if (map[i] === Terrain.EMPTY) {
			let c = 0.05;
			if (map[i + 1] === Terrain.WALL && map[i + w] === Terrain.WALL) c += 0.2;
			if (map[i - 1] === Terrain.WALL && map[i + w] === Terrain.WALL) c += 0.2;
			if (map[i + 1] === Terrain.WALL && map[i - w] === Terrain.WALL) c += 0.2;
			if (map[i - 1] === Terrain.WALL && map[i - w] === Terrain.WALL) c += 0.2;

			if (SpdRandom.float() < c) {
				map[i] = Terrain.EMPTY_DECO;
			}
		}
	}

	for (let i = 0; i < w; i++) {
		if (map[i] === Terrain.WALL
			&& (map[i + w] === Terrain.EMPTY || map[i + w] === Terrain.EMPTY_SP)
			&& SpdRandom.int(6) === 0) {
			map[i] = Terrain.WALL_DECO;
		}
	}

	for (let i = w; i < l - w; i++) {
		if (map[i] === Terrain.WALL
			&& map[i - w] === Terrain.WALL
			&& (map[i + w] === Terrain.EMPTY || map[i + w] === Terrain.EMPTY_SP)
			&& SpdRandom.int(3) === 0) {
			map[i] = Terrain.WALL_DECO;
		}
	}
}

/** `PrisonLevel.painter()`: `.setWater(WATER ? 0.90 : 0.30, 4).setGrass(GRASS ? 0.80 : 0.20, 3)`.
 *  Note the WATER-feeling fill is 0.90 here against Sewers' 0.85. */
export function paintPrisonLevel(rooms: Room[], depth: number, feeling: number | null = null): PaintLevel {
	setGeneratorDepth(depth);
	return paintLevel(
		rooms, depth,
		{ fill: feeling === Feeling.WATER ? 0.9 : 0.3, smoothness: 4 },
		{ fill: feeling === Feeling.GRASS ? 0.8 : 0.2, smoothness: 3 },
		{ n: nTraps(depth), table: trapTable() },
		decorate,
		feeling,
	);
}
