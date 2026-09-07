/**
 * Port of `levels/SewerLevel.java`'s `painter()`/`trapClasses()`/`trapChances()` and
 * `levels/painters/SewerPainter.java`'s `decorate()`. Wires `regularPainter.ts`'s generic
 * pipeline with Sewers' real numbers.
 */
import { Room } from './room';
import { SpdRandom } from '../spdRng';
import { PaintLevel, Terrain } from './paintLevel';
import { paintLevel, TrapTable, Feeling } from './regularPainter';
import { setGeneratorDepth } from '../spdItems/generator';

/** `RegularLevel.nTraps()`: `Random.NormalIntRange(2, 3 + depth/5)` - SewerLevel doesn't override it. */
function nTraps(depth: number): number {
	return SpdRandom.normalIntRange(2, 3 + Math.floor(depth / 5));
}

/** `SewerLevel.trapClasses()`/`trapChances()`. Trap *behavior* isn't ported (see PORT_COVERAGE.md) -
 *  these are name-only stand-ins, kept in the real class order/weights for RNG-order fidelity. */
function trapTable(depth: number): TrapTable {
	if (depth === 1) return { classes: ['wornDart'], chances: [1] };
	return {
		classes: ['chilling', 'shocking', 'toxic', 'wornDart', 'alarm', 'ooze', 'confusion', 'flock', 'summoning', 'teleportation', 'gateway'],
		chances: [4, 4, 4, 4, 2, 2, 1, 1, 1, 1, 1],
	};
}

/** `SewerPainter.decorate()`. */
function decorate(level: PaintLevel, _rooms: Room[]): void {
	const map = level.map;
	const w = level.w;
	const l = level.w * level.h;

	for (let i = 0; i < w; i++) {
		if (map[i] === Terrain.WALL && map[i + w] === Terrain.WATER && SpdRandom.int(4) === 0) {
			map[i] = Terrain.WALL_DECO;
		}
	}

	for (let i = w; i < l - w; i++) {
		if (map[i] === Terrain.WALL && map[i - w] === Terrain.WALL && map[i + w] === Terrain.WATER && SpdRandom.int(2) === 0) {
			map[i] = Terrain.WALL_DECO;
		}
	}

	for (let i = w + 1; i < l - w - 1; i++) {
		if (map[i] === Terrain.EMPTY) {
			const count =
				(map[i + 1] === Terrain.WALL ? 1 : 0) +
				(map[i - 1] === Terrain.WALL ? 1 : 0) +
				(map[i + w] === Terrain.WALL ? 1 : 0) +
				(map[i - w] === Terrain.WALL ? 1 : 0);
			if (SpdRandom.int(16) < count * count) {
				map[i] = Terrain.EMPTY_DECO;
			}
		}
	}
}

/**
 * `SewerLevel.painter()`'s `.setWater(...)`/`.setGrass(...)` (non-`Feeling`-gated numbers -
 * `Level.Feeling` isn't modeled, see regularPainter.ts's module comment) plus `nTraps()`'s
 * `Random.NormalIntRange` roll, which in real Java happens as `painter()`'s call happens - i.e.
 * right before `.paint()` runs, *after* the room graph is fully built (`RegularLevel.build()`
 * calls `painter().paint(this, rooms)` only once the `do...while(rooms==null)` loop succeeds,
 * not before `initRooms()` as an earlier research pass on this port mistakenly noted - confirmed
 * against the real `RegularLevel.java:92-109` source directly).
 */
export function paintSewerLevel(rooms: Room[], depth: number, feeling: number | null = null): PaintLevel {
	// `Generator`'s floorSet/`Gold.random()` arithmetic reads `Dungeon.depth`; this port passes it
	// explicitly once per floor instead of having a global Dungeon object.
	setGeneratorDepth(depth);
	// `SewerLevel.painter()`: WATER feeling floods to 0.85 fill, GRASS feeling to 0.80.
	return paintLevel(
		rooms, depth,
		{ fill: feeling === Feeling.WATER ? 0.85 : 0.3, smoothness: 5 },
		{ fill: feeling === Feeling.GRASS ? 0.8 : 0.2, smoothness: 4 },
		{ n: nTraps(depth), table: trapTable(depth) },
		decorate,
		feeling,
	);
}

/**
 * `SewerBossLevel.painter()`: fixed 0.50/5 water and 0.20/4 grass, `Feeling`-independent (unlike
 * `SewerLevel.painter()` above) - it doesn't branch on `feeling` at all, even though `feeling` is
 * still rolled for this depth (see `rollLevelFeeling()`'s doc comment: the roll always happens
 * past depth 1, but `SewerBossLevel.initRooms()`'s room-graph shape and this painter both ignore
 * it entirely). `nTraps()` is overridden to a flat 0, so no traps are painted at all - `paintLevel`
 * skips `paintTraps` whenever `traps.n <= 0`, matching Java's `if (traps.n() > 0)` gate exactly.
 * Reuses `SewerPainter.decorate()` unchanged, since `SewerBossLevel` doesn't override it.
 */
export function paintSewerBossLevel(rooms: Room[], depth: number): PaintLevel {
	setGeneratorDepth(depth);
	return paintLevel(
		rooms, depth,
		{ fill: 0.50, smoothness: 5 },
		{ fill: 0.20, smoothness: 4 },
		{ n: 0, table: trapTable(depth) },
		decorate,
		null,
	);
}
