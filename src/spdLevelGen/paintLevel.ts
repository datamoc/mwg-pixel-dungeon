/**
 * Minimal tile-grid + `Painter.java`'s static geometry helpers, for the room-content sub-pass
 * (see PORT_COVERAGE.md). This is NOT wired into `main.ts`'s live game/renderer yet - it exists so
 * each `StandardRoom.paint()` port can run against something and be dumped for inspection. Terrain
 * values match the real `Terrain.java` int constants exactly (kept numeric, not enum-renumbered),
 * so a later `RegularPainter`/`SewerPainter` sub-pass and eventual `main.ts` wiring don't need to
 * remap anything.
 */
import { Room } from './room';
import { SpdRandom } from '../spdRng';

/**
 * Which Java `Item` subclass each queued `itemsToSpawn` kind stands for, for
 * `findPrizeItemOfClass`. Only the classes real rooms actually match on are listed; anything
 * absent (keys, in particular) simply never matches, exactly as `IronKey` never matches
 * `Potion.class` in Java.
 */
const ITEM_CLASS_OF_KIND: Record<string, 'potion' | 'scroll' | 'stone'> = {
	potionOfLevitation: 'potion', potionOfLiquidFlame: 'potion', potionOfFrost: 'potion',
	potionOfInvisibility: 'potion', potionOfHaste: 'potion', potionOfPurity: 'potion',
};

/** `Terrain.java`'s real int constants (only the ones any of the 14 ported rooms touch). */
export const Terrain = {
	CHASM: 0,
	EMPTY: 1,
	GRASS: 2,
	EMPTY_WELL: 3,
	WALL: 4,
	DOOR: 5,
	ENTRANCE: 7,
	EXIT: 8,
	EMBERS: 9,
	LOCKED_DOOR: 10,
	PEDESTAL: 11,
	WALL_DECO: 12,
	BARRICADE: 13,
	EMPTY_SP: 14,
	HIGH_GRASS: 15,
	SECRET_DOOR: 16,
	SECRET_TRAP: 17,
	TRAP: 18,
	INACTIVE_TRAP: 19,
	EMPTY_DECO: 20,
	/** SOLID in Java; no room this port paints places it, but `canMerge` must still stop at it. */
	LOCKED_EXIT: 21,
	SIGN: 23,
	WELL: 24,
	STATUE: 25,
	STATUE_SP: 26,
	BOOKSHELF: 27,
	ALCHEMY: 28,
	WATER: 29,
	CRYSTAL_DOOR: 31,
} as const;

/**
 * `Terrain.java`'s `flags[]` table, reduced to the single bit this port needs: `PASSABLE`.
 * `RegularPainter.paintTraps()` rebuilds `level.passable` from these flags to find cells that are
 * not in a 1-wide hallway, so the exact membership matters for trap placement. Read straight off
 * the real `Terrain.java` static initializer - note `TRAP` is `AVOID` (NOT passable) while
 * `SECRET_TRAP`/`INACTIVE_TRAP`/`EMPTY_DECO`/`EMPTY_SP` all alias `flags[EMPTY]` and so are.
 */
const PASSABLE_TERRAIN = new Set<number>([
	Terrain.EMPTY, Terrain.GRASS, Terrain.EMPTY_WELL, Terrain.WATER, Terrain.DOOR,
	Terrain.ENTRANCE, Terrain.EXIT, Terrain.EMBERS, Terrain.PEDESTAL, Terrain.EMPTY_SP,
	Terrain.HIGH_GRASS, Terrain.SECRET_TRAP, Terrain.INACTIVE_TRAP, Terrain.EMPTY_DECO,
]);

export function isPassableTerrain(terrain: number): boolean { return PASSABLE_TERRAIN.has(terrain); }

export interface GroundItem { pos: number; kind: string; note?: string; sourceClass?: string; }
export interface PlacedMob { pos: number; kind: string; loot?: string; }
export interface PlacedTrap { kind: string; hidden: boolean; active: boolean; }
export interface Transition { pos: number; type: 'surface' | 'regularEntrance' | 'regularExit' | 'branchExit'; branch?: number; }

/**
 * Stands in for `Level.map`/`Level.mobs`/`Level.heaps`/`Level.traps`/`Level.transitions`/
 * `Level.plants` - just enough surface for the 14 rooms' `paint()` methods to run and be dumped.
 * Real mob/item/plant content selection is recorded here as compact class ids; the live bridge
 * restores the supported actors and item families while preserving each room's RNG calls.
 * Remaining Generator-internal differences are documented per room and in PORT_COVERAGE.md.
 */
export class PaintLevel {
	readonly map: Int32Array;
	readonly mobs: PlacedMob[] = [];
	readonly groundItems: GroundItem[] = [];
	readonly traps = new Map<number, PlacedTrap>();
	readonly plants: { pos: number; kind: string }[] = [];
	readonly transitions: Transition[] = [];

	/**
	 * `Level.setSize(w, h)`, whose `Arrays.fill` uses **`Terrain.CHASM` on a `Feeling.CHASM`
	 * floor** and `Terrain.WALL` otherwise (`Level.java:290`). This port hardcoded `WALL`,
	 * which left every unpainted cell of a chasm floor solid instead of open - a shared-core
	 * bug, not a Prison one: it just never surfaced because none of the 16 Sewers test floors
	 * rolled CHASM. It is not merely cosmetic either, since `paintTraps`' passable/hallway
	 * analysis and `decorate()`'s per-cell `WALL` adjacency tests both read these cells.
	 */
	/** `Level.feeling`'s ordinal (see regularPainter.ts's `Feeling`), or null for NONE. Stored
	 *  because room `paint()`s read it via `Level.tunnelTile()`, not only the painter stages. */
	feeling: number | null = null;

	constructor(readonly w: number, readonly h: number, backgroundTerrain: number = Terrain.WALL) {
		this.map = new Int32Array(w * h).fill(backgroundTerrain);
	}

	width(): number { return this.w; }
	/**
	 * `Level.tunnelTile()` (Level.java:456): `EMPTY_SP` on a `Feeling.CHASM` floor, else `EMPTY`.
	 * Lives here rather than in a painter module because BOTH room `paint()`s (via
	 * `rooms/standard/registry.ts`) and `RegularPainter.paintDoors()`'s `Door.Type.TUNNEL` case
	 * need it, and having two copies is what let the door case keep a stale "Feeling isn't
	 * modeled" hardcode long after Feeling was wired in - a real desync on chasm floors, since
	 * water/grass only spread over `EMPTY`, so a TUNNEL door wrongly left `EMPTY` becomes a grass
	 * candidate Java never offers. `Feeling.CHASM` is ordinal 0 (see regularPainter.ts).
	 */
	tunnelTile(): number { return this.feeling === 0 ? Terrain.EMPTY_SP : Terrain.EMPTY; }
	pointToCell(p: { x: number; y: number }): number { return p.x + p.y * this.w; }
	cellToPoint(cell: number): { x: number; y: number } { return { x: cell % this.w, y: Math.floor(cell / this.w) }; }
	/** `Level.itemsToSpawn` - items queued by rooms during painting, drained by `findPrizeItem`. */
	readonly itemsToSpawn: string[] = [];
	findMob(cell: number): PlacedMob | undefined { return this.mobs.find(m => m.pos === cell); }
	findHeap(cell: number): GroundItem | undefined { return this.groundItems.find(g => g.pos === cell); }
	/** `Level.adjacent()`: true for the same cell, an orthogonal/diagonal neighbour. */
	adjacent(a: number, b: number): boolean {
		const pa = this.cellToPoint(a), pb = this.cellToPoint(b);
		return Math.abs(pa.x - pb.x) <= 1 && Math.abs(pa.y - pb.y) <= 1;
	}
	/**
	 * `Level.trueDistance()` (`Level.java:1397`) - **plain Euclidean**, `sqrt(dx^2 + dy^2)` over
	 * raw cell coordinates. Earlier revisions of this file and of PORT_COVERAGE.md claimed it was
	 * "really a BFS over passable cells, approximated here"; that was wrong - this is a faithful
	 * port, not a simplification. (`Level.distance()`, the Chebyshev one, is the other overload;
	 * neither does pathfinding. `PathFinder.buildDistanceMap` is the BFS, and it is a separate
	 * API that `trueDistance` never calls.) This matters because `Wandmaker.spawnWandmaker()`
	 * gates a placement-retry loop on it, so a wrong metric there WOULD change the draw count.
	 */
	trueDistance(a: number, b: number): number {
		const pa = this.cellToPoint(a), pb = this.cellToPoint(b);
		return Math.hypot(pa.x - pb.x, pa.y - pb.y);
	}
	setTrap(kind: string, hidden: boolean, active: boolean, cell: number): void {
		this.traps.set(cell, { kind, hidden, active });
	}
	/**
	 * `Level.drop()`. A `note` of `'itemToSpawn'` routes to `addItemToSpawn` instead, mirroring
	 * Java's `level.addItemToSpawn(item)` (which queues an item for later placement rather than
	 * dropping it on a cell).
	 */
	drop(kind: string, cell: number, note?: string): GroundItem | undefined {
		if (note === 'itemToSpawn') { this.addItemToSpawn(kind); return undefined; }
		const item = { pos: cell, kind, note };
		this.groundItems.push(item);
		return item;
	}
	/** `Level.addItemToSpawn()`. No RNG, but the resulting list length IS stream-relevant - see
	 *  `findPrizeItem`. */
	addItemToSpawn(kind: string): void { this.itemsToSpawn.push(kind); }
	/**
	 * `Level.findPrizeItem()` (the no-argument overload). This is NOT the free, always-null stub
	 * this port previously assumed: whenever `itemsToSpawn` is non-empty it makes a real
	 * `Random.element(itemsToSpawn)` draw on the level stream AND returns an item, which makes
	 * every calling room take its prize branch and skip the whole `Generator` path. Since rooms
	 * queue keys/potions via `addItemToSpawn` as they paint, a room painted later in the shuffled
	 * order genuinely can find one.
	 */
	findPrizeItem(): string | null {
		if (this.itemsToSpawn.length === 0) return null;
		const item = SpdRandom.element(this.itemsToSpawn);
		this.itemsToSpawn.splice(this.itemsToSpawn.indexOf(item), 1);
		return item;
	}
	/**
	 * `Level.findPrizeItem(Class)`. Unlike the no-arg form this consumes NO RNG - it scans in
	 * order for the first instance of the class. `cls` here is this port's coarse stand-in for
	 * the Java class (`'potion'`, `'scroll'`, `'stone'`), matched against the queued kind's prefix.
	 */
	findPrizeItemOfClass(cls: 'potion' | 'scroll' | 'stone'): string | null {
		const idx = this.itemsToSpawn.findIndex(k => ITEM_CLASS_OF_KIND[k] === cls);
		if (idx < 0) return null;
		return this.itemsToSpawn.splice(idx, 1)[0];
	}
	plant(kind: string, cell: number): void { this.plants.push({ pos: cell, kind }); }
}

// **** Painter.java's static helpers ****

export function set(level: PaintLevel, x: number, y: number, value: number): void {
	level.map[x + y * level.w] = value;
}
export function setCell(level: PaintLevel, cell: number, value: number): void { level.map[cell] = value; }

export function fillXY(level: PaintLevel, x: number, y: number, w: number, h: number, value: number): void {
	for (let row = y; row < y + h; row++) {
		const start = row * level.w + x;
		level.map.fill(value, start, start + w);
	}
}
/** `Painter.fill(level, rect, value)` - the room's own rect, no margin. */
export function fillRoom(level: PaintLevel, room: Room, value: number): void {
	fillXY(level, room.left, room.top, room.width(), room.height(), value);
}
/** `Painter.fill(level, rect, m, value)` - inset by `m` on every side. */
export function fillRoomInset(level: PaintLevel, room: Room, m: number, value: number): void {
	fillXY(level, room.left + m, room.top + m, room.width() - m * 2, room.height() - m * 2, value);
}

export function drawLine(level: PaintLevel, from: { x: number; y: number }, to: { x: number; y: number }, value: number): void {
	let x = from.x, y = from.y;
	const dxRaw = to.x - from.x, dyRaw = to.y - from.y;
	const movingByX = Math.abs(dxRaw) >= Math.abs(dyRaw);
	let dx: number, dy: number;
	if (movingByX) { dy = dyRaw / Math.abs(dxRaw); dx = dxRaw / Math.abs(dxRaw); }
	else { dx = dxRaw / Math.abs(dyRaw); dy = dyRaw / Math.abs(dyRaw); }

	set(level, Math.round(x), Math.round(y), value);
	while ((movingByX && to.x !== x) || (!movingByX && to.y !== y)) {
		x += dx; y += dy;
		set(level, Math.round(x), Math.round(y), value);
	}
}

export function fillEllipse(level: PaintLevel, x: number, y: number, w: number, h: number, value: number): void {
	const radH = h / 2, radW = w / 2;
	for (let i = 0; i < h; i++) {
		const rowY = -radH + 0.5 + i;
		let rowW = 2 * Math.sqrt(radW * radW * (1 - (rowY * rowY) / (radH * radH)));
		if (w % 2 === 0) rowW = Math.round(rowW / 2) * 2;
		else { rowW = Math.floor(rowW / 2) * 2; rowW++; }
		const cell = x + Math.floor((w - rowW) / 2) + (y + i) * level.w;
		level.map.fill(value, cell, cell + rowW);
	}
}
export function fillEllipseRoom(level: PaintLevel, room: Room, m: number, value: number): void {
	fillEllipse(level, room.left + m, room.top + m, room.width() - m * 2, room.height() - m * 2, value);
}

/** `Painter.drawInside`: walks `n` cells inward from `from` (a door on the room's edge). */
export function drawInside(level: PaintLevel, room: Room, from: { x: number; y: number }, n: number, value: number): { x: number; y: number } {
	let stepX = 0, stepY = 0;
	if (from.x === room.left) stepX = 1;
	else if (from.x === room.right) stepX = -1;
	else if (from.y === room.top) stepY = 1;
	else if (from.y === room.bottom) stepY = -1;

	let x = from.x + stepX, y = from.y + stepY;
	for (let i = 0; i < n; i++) {
		set(level, x, y, value);
		x += stepX; y += stepY;
	}
	return { x, y };
}

/** `PathFinder.NEIGHBOURS8`, relative to level width (see `PathFinder.java` init order). */
export function neighbours8(level: PaintLevel): number[] {
	const w = level.w;
	return [-w - 1, -w, -w + 1, -1, 1, w - 1, w, w + 1];
}

/** `Rect.getPoints()`: column-major (outer x left..right, inner y top..bottom) - order matters
 *  wherever a caller rolls `Random.*` once per point (e.g. `SecretHoardRoom`/`SecretSummoningRoom`). */
export function roomPoints(room: Room): { x: number; y: number }[] {
	const pts: { x: number; y: number }[] = [];
	for (let x = room.left; x <= room.right; x++) {
		for (let y = room.top; y <= room.bottom; y++) pts.push({ x, y });
	}
	return pts;
}
