/**
 * Port of `levels/CavesLevel.java`'s `painter()`/`trapClasses()`/`trapChances()` and
 * `levels/painters/CavesPainter.java`'s `decorate()`. Same shape as `sewerPainter.ts`/
 * `prisonPainter.ts`; wires `regularPainter.ts`'s generic pipeline with Caves' real numbers.
 *
 * `decorate()` is RNG-lighter than Sewers'/Prison's own decorate passes, but its first loop
 * (merging every still-unconnected room-neighbour pair into `Terrain.CHASM`) is new: it's the
 * only place in this port that calls `regularPainter.ts`'s exported `mergeRooms` a second time,
 * after `paintDoorsForDepth`'s own merge-into-`EMPTY` pass already ran once.
 *
 * `decorate()`'s two global scans live in `cavesDecorate.ts`, which is import-light; this module
 * calls them through `decorateStandaloneCaves` after its own room loops, and re-exports that
 * function for `gameBridge.ts`'s `MiningLevel` path - so the regular floors, the boss floor and the
 * mining branch all run one implementation of the scans rather than three copies.
 */
import { Room } from './room';
import { SpdRandom } from '../spdRng';
import { PaintLevel, Terrain } from './paintLevel';
import { paintLevel, TrapTable, Feeling, mergeRooms } from './regularPainter';
import { setGeneratorDepth } from '../items/generator';
import { decorateStandaloneCaves } from './cavesDecorate';
import { mwlPaintRule, mwlTrapTable } from './mwlDungeonRules';

export { decorateStandaloneCaves };

/** `RegularLevel.nTraps()`: `Random.NormalIntRange(2, 3 + depth/5)` - `depth/5` is 2 across all
 *  of Caves (11-14), giving range (2, 5), against Sewers' (2,3) and Prison's (2,4). */
function nTraps(depth: number): number {
	return SpdRandom.normalIntRange(2, 3 + Math.floor(depth / 5));
}

/** `CavesLevel.trapClasses()`/`trapChances()`. Trap *behaviour* isn't ported (see
 *  PORT_COVERAGE.md/gameBridge.ts's `TRAP_BEHAVIOUR`); these are name-only stand-ins in the real
 *  class order/weights, which is what `Random.chances`/`avoidsHallways` need. */
function trapTable(): TrapTable {
	return mwlTrapTable('caves');
}

/** `CavesPainter.decorate()`. */
function decorate(level: PaintLevel, rooms: Room[]): void {
	const map = level.map;
	const w = level.w;
	const l = level.w * level.h;

	// `for (Room r : rooms) for (Room n : r.neigbours) if (!r.connected.containsKey(n))
	//     mergeRooms(level, r, n, null, CHASM);` - every room's neighbour list is visited (not just
	// each unordered pair once), exactly mirroring Java's double iteration.
	for (const r of rooms) {
		for (const n of r.neigbours) {
			if (!r.connected.has(n)) mergeRooms(level, r, n, null, Terrain.CHASM);
		}
	}

	for (const room of rooms) {
		if (room.kind !== 'standard' && room.kind !== 'entrance' && room.kind !== 'exit') continue;
		if (room.width() <= 4 || room.height() <= 4) continue;

		const s = room.square();

		if (SpdRandom.int(s) > 8) {
			const corner = (room.left + 1) + (room.top + 1) * w;
			if (map[corner - 1] === Terrain.WALL && map[corner - w] === Terrain.WALL) {
				map[corner] = Terrain.WALL;
				level.traps.delete(corner);
			}
		}
		if (SpdRandom.int(s) > 8) {
			const corner = (room.right - 1) + (room.top + 1) * w;
			if (map[corner + 1] === Terrain.WALL && map[corner - w] === Terrain.WALL) {
				map[corner] = Terrain.WALL;
				level.traps.delete(corner);
			}
		}
		if (SpdRandom.int(s) > 8) {
			const corner = (room.left + 1) + (room.bottom - 1) * w;
			if (map[corner - 1] === Terrain.WALL && map[corner + w] === Terrain.WALL) {
				map[corner] = Terrain.WALL;
				level.traps.delete(corner);
			}
		}
		if (SpdRandom.int(s) > 8) {
			const corner = (room.right - 1) + (room.bottom - 1) * w;
			if (map[corner + 1] === Terrain.WALL && map[corner + w] === Terrain.WALL) {
				map[corner] = Terrain.WALL;
				level.traps.delete(corner);
			}
		}
	}

	// the two global scans, shared verbatim with the boss floor's null-room call - one implementation
	// of each, so a floor that runs `decorate` through `RegularPainter` and one that runs it directly
	// cannot drift apart
	decorateStandaloneCaves(level);
}

/** `CavesLevel.painter()`: `.setWater(WATER ? 0.85 : 0.30, 6).setGrass(GRASS ? 0.65 : 0.15, 3)`. */
export function paintCavesLevel(rooms: Room[], depth: number, feeling: number | null = null): PaintLevel {
	setGeneratorDepth(depth);
	return paintLevel(
		rooms, depth,
		{ fill: feeling === Feeling.WATER ? mwlPaintRule('caves').water.feeling : mwlPaintRule('caves').water.normal, smoothness: mwlPaintRule('caves').water.smoothness },
		{ fill: feeling === Feeling.GRASS ? mwlPaintRule('caves').grass.feeling : mwlPaintRule('caves').grass.normal, smoothness: mwlPaintRule('caves').grass.smoothness },
		{ n: nTraps(depth), table: trapTable() },
		decorate,
		feeling,
	);
}
