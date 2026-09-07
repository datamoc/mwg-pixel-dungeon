/**
 * Port of `levels/HallsLevel.java`'s `painter()`/`trapClasses()`/`trapChances()` and
 * `levels/painters/HallsPainter.java`'s `decorate()`. Same shape as `sewerPainter.ts`/
 * `prisonPainter.ts`/`cavesPainter.ts`/`cityPainter.ts`; wires `regularPainter.ts`'s generic
 * pipeline with Halls' real numbers.
 *
 * `decorate()`'s neighbour-merge pass (every still-unconnected room-neighbour pair merged into
 * `Terrain.CHASM`) runs AFTER the `EMPTY_DECO`/`WALL_DECO` rolls here - the opposite order from
 * `CavesPainter.decorate()`, which runs its own such pass first (see `cavesPainter.ts`'s own
 * comment). Order doesn't change which cells end up decorated (the two passes touch disjoint
 * terrain), but it does change the RNG call order relative to any deeper Java-fixture comparison,
 * so it's kept faithful to `HallsPainter.java`'s actual statement order rather than copied from
 * Caves'.
 */
import { Room } from './room';
import { SpdRandom } from '../spdRng';
import { PaintLevel, Terrain, isPassableTerrain, neighbours8 } from './paintLevel';
import { paintLevel, TrapTable, Feeling, mergeRooms } from './regularPainter';
import { setGeneratorDepth } from '../spdItems/generator';

/** `RegularLevel.nTraps()`: `Random.NormalIntRange(2, 3 + depth/5)` - `depth/5` is 4 across all
 *  of Halls (21-24), giving range (2, 7). `HallsLevel` doesn't override `nTraps()`. */
function nTraps(depth: number): number {
	return SpdRandom.normalIntRange(2, 3 + Math.floor(depth / 5));
}

/** `HallsLevel.trapClasses()`/`trapChances()` - City's 17-class table plus `GrimTrap` (18
 *  classes total, the only region with it). Trap *behaviour* isn't ported in general (see
 *  PORT_COVERAGE.md) but `grim` specifically already has a real behaviour, routed via
 *  `gameBridge.ts`'s `TRAP_BEHAVIOUR` - shared with `main.ts`'s own `TRAP_KINDS`. */
function trapTable(): TrapTable {
	return {
		classes: [
			'frost', 'storm', 'corrosion', 'blazing', 'disintegration',
			'rockfall', 'flashing', 'guardian', 'weakening',
			'disarming', 'summoning', 'warping', 'cursing', 'grim', 'pitfall', 'distortion', 'gateway', 'geyser',
		],
		chances: [4, 4, 4, 4, 4, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1],
	};
}

/** `HallsPainter.decorate()`. */
function decorate(level: PaintLevel, rooms: Room[]): void {
	const map = level.map;
	const w = level.w;
	const l = level.w * level.h;
	const neigh = neighbours8(level);

	for (let i = w + 1; i < l - w - 1; i++) {
		if (map[i] === Terrain.EMPTY) {
			let count = 0;
			for (const off of neigh) if (isPassableTerrain(map[i + off])) count++;
			if (SpdRandom.int(80) < count) map[i] = Terrain.EMPTY_DECO;
		} else if (map[i] === Terrain.WALL
			&& map[i - 1] !== Terrain.WALL_DECO && map[i - w] !== Terrain.WALL_DECO
			&& SpdRandom.int(20) === 0) {
			map[i] = Terrain.WALL_DECO;
		}
	}

	// `for (Room r : rooms) for (Room n : r.neigbours) if (!r.connected.containsKey(n))
	//     mergeRooms(level, r, n, null, CHASM);` - every room's neighbour list is visited (not
	// just each unordered pair once), exactly mirroring Java's double iteration (same shape as
	// `cavesPainter.ts`'s identical loop).
	for (const r of rooms) {
		for (const n of r.neigbours) {
			if (!r.connected.has(n)) mergeRooms(level, r, n, null, Terrain.CHASM);
		}
	}
}

/**
 * `HallsLevel.painter()`'s `.setWater(...)`/`.setGrass(...)` plus `nTraps()`'s
 * `Random.NormalIntRange` roll - see `sewerPainter.ts`'s `paintSewerLevel` doc comment for the
 * exact RNG-ordering rationale this mirrors.
 */
export function paintHallsLevel(rooms: Room[], depth: number, feeling: number | null = null): PaintLevel {
	setGeneratorDepth(depth);
	return paintLevel(
		rooms, depth,
		{ fill: feeling === Feeling.WATER ? 0.70 : 0.15, smoothness: 6 },
		{ fill: feeling === Feeling.GRASS ? 0.65 : 0.10, smoothness: 3 },
		{ n: nTraps(depth), table: trapTable() },
		decorate,
		feeling,
	);
}
