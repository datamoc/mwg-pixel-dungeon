/**
 * Port of `levels/CavesLevel.java`'s `painter()`/`trapClasses()`/`trapChances()` and
 * `levels/painters/CavesPainter.java`'s `decorate()`. Same shape as `sewerPainter.ts`/
 * `prisonPainter.ts`; wires `regularPainter.ts`'s generic pipeline with Caves' real numbers.
 *
 * `decorate()` is RNG-lighter than Sewers'/Prison's own decorate passes, but its first loop
 * (merging every still-unconnected room-neighbour pair into `Terrain.CHASM`) is new: it's the
 * only place in this port that calls `regularPainter.ts`'s exported `mergeRooms` a second time,
 * after `paintDoorsForDepth`'s own merge-into-`EMPTY` pass already ran once.
 */
import { Room } from './room';
import { SpdRandom } from '../spdRng';
import { PaintLevel, Terrain } from './paintLevel';
import { paintLevel, TrapTable, Feeling, mergeRooms } from './regularPainter';
import { setGeneratorDepth } from '../spdItems/generator';
import { mwlPaintRule, mwlTrapTable } from './mwlDungeonRules';

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

/**
 * `DungeonTileSheet.floorTile(tile)`: `tile == WATER || directVisuals.get(tile, CHASM) < CHASM`.
 * `directVisuals` only maps GROUND-block visuals (all well below `CHASM`'s tile-sheet index), so
 * this reduces to the exact terrain set present in that map, read off its static initializer
 * (`DungeonTileSheet.java`) rather than approximated - notably NOT `HIGH_GRASS` (only in
 * `directFlatVisuals`, so it's excluded; `floorTile` is about the "3D" visual, not the flat one).
 */
const FLOOR_TILE = new Set<number>([
	Terrain.EMPTY, Terrain.GRASS, Terrain.EMPTY_WELL, Terrain.ENTRANCE, Terrain.EXIT,
	Terrain.EMBERS, Terrain.PEDESTAL, Terrain.EMPTY_SP, Terrain.SECRET_TRAP, Terrain.TRAP,
	Terrain.INACTIVE_TRAP, Terrain.EMPTY_DECO, Terrain.WELL, Terrain.WATER,
	// LOCKED_EXIT/UNLOCKED_EXIT are also in the real map, but neither is reachable on the regular
	// (non-boss) floors this port generates.
]);

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

	for (let i = w + 1; i < l - w; i++) {
		if (map[i] === Terrain.EMPTY) {
			let n = 0;
			if (map[i + 1] === Terrain.WALL) n++;
			if (map[i - 1] === Terrain.WALL) n++;
			if (map[i + w] === Terrain.WALL) n++;
			if (map[i - w] === Terrain.WALL) n++;
			if (SpdRandom.int(6) <= n) map[i] = Terrain.EMPTY_DECO;
		}
	}

	for (let i = 0; i < l - w; i++) {
		if (map[i] === Terrain.WALL && FLOOR_TILE.has(map[i + w]) && SpdRandom.int(4) === 0) {
			map[i] = Terrain.WALL_DECO;
		}
	}
}

/** `CavesPainter.decorate()` when `RegularPainter.paint(level, null)` is used by
 * `MiningLevel`: the room list is intentionally empty, so only the two global decoration
 * scans run after water and grass. Keeping this separate prevents the branch from inventing
 * room-neighbour merges while still producing real empty-deco and mineable ore veins. */
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
