/**
 * Port of `levels/rooms/Room.java` (+ the bits of `Rect.java` and `StandardRoom.java`'s
 * `SizeCategory` it needs). This is the **graph-geometry sub-pass** (see PORT_COVERAGE.md): it
 * ports the room shape/connection machinery faithfully, but collapses the real `Room` subclass
 * hierarchy (`EntranceRoom`, `ExitRoom`, `StandardRoom` + its ~14 reachable Sewers subclasses,
 * `SpecialRoom` + its ~25 subclasses, `ConnectionRoom` + its 6 subclasses, `SecretRoom`) into one
 * class parameterized by a `kind` discriminator, since concrete room *content* (their `paint()`
 * methods, and `StandardRoom`'s per-subclass `sizeCatProbs()`) isn't ported yet. Every place a
 * concrete subclass would normally override sizing/connection rules is called out below with the
 * real Java values, `kind`-branched.
 */
import { SpdRandom } from '../spdRng';
import { generateShopItems } from '../spdItems/shopItems';

export const ALL = 0, LEFT = 1, TOP = 2, RIGHT = 3, BOTTOM = 4;
export type Direction = typeof ALL | typeof LEFT | typeof TOP | typeof RIGHT | typeof BOTTOM;

/** `Room.Door.Type` - ordinal order matters (`Door.set` only raises, never lowers, the type). */
export enum DoorType { EMPTY, TUNNEL, WATER, REGULAR, UNLOCKED, HIDDEN, BARRICADE, LOCKED, CRYSTAL }

export class Door {
	x = 0;
	y = 0;
	type: DoorType = DoorType.EMPTY;
	set(type: DoorType): void {
		if (type > this.type) this.type = type;
	}
}

/** `StandardRoom.SizeCategory`: NORMAL(4,10,1), LARGE(10,14,2), GIANT(14,18,3). */
export interface SizeCategory {
	name: 'NORMAL' | 'LARGE' | 'GIANT';
	minDim: number;
	maxDim: number;
	roomValue: number;
	connectionWeight: number;
}
export const SIZE_CATEGORIES: SizeCategory[] = [
	{ name: 'NORMAL', minDim: 4, maxDim: 10, roomValue: 1, connectionWeight: 1 },
	{ name: 'LARGE', minDim: 10, maxDim: 14, roomValue: 2, connectionWeight: 4 },
	{ name: 'GIANT', minDim: 14, maxDim: 18, roomValue: 3, connectionWeight: 9 },
];

/**
 * Stands in for the real `Room` subclass hierarchy. `standard` rooms carry a `sizeCat` (as
 * `StandardRoom` does); `entrance`/`exit` are `StandardRoom` subclasses that additionally floor
 * their min width/height at 5 (`EntranceRoom.minWidth()`/`ExitRoom.minWidth()`, both
 * `Math.max(super.minWidth(), 5)`); `special`/`shop`/`secret` are single-connection, 5-10 sized
 * (`SpecialRoom.minWidth/maxWidth`); `connection`/`mazeConnection` are the tunnel rooms
 * (`ConnectionRoom`: 3-10, `minConnections(ALL)=2`; `MazeConnectionRoom` additionally caps
 * `maxConnections()` at 2 in every direction).
 */
export type RoomKind = 'entrance' | 'exit' | 'standard' | 'special' | 'shop' | 'secret' | 'connection' | 'mazeConnection';

/**
 * `ConnectionRoom`'s 6 concrete subclasses (`ConnectionRoom.rooms[]`, in the real registration
 * order used by `Random.chances(chances[depth])`'s index). All share the base `ConnectionRoom`
 * 3/10 min/max width/height EXCEPT `RingTunnelRoom`/`RingBridgeRoom`, which override
 * `minWidth()`/`minHeight()` to `Math.max(5, super.minWidth())` = 5 - found while fixing the
 * connector-room-count mismatch against the real Java harness: treating every connector as 3-10
 * let ring rooms squeeze into spaces too small for them in Java, changing how many placement
 * retries/branch tunnels get consumed downstream.
 */
export type ConnectionRoomKind = 'tunnel' | 'bridge' | 'perimeter' | 'walkway' | 'ringTunnel' | 'ringBridge';
interface ConnectionRoomMeta { minDim: number }
export const CONNECTION_ROOM_META: Record<ConnectionRoomKind, ConnectionRoomMeta> = {
	tunnel: { minDim: 3 }, bridge: { minDim: 3 }, perimeter: { minDim: 3 }, walkway: { minDim: 3 },
	ringTunnel: { minDim: 5 }, ringBridge: { minDim: 5 },
};

/**
 * The 14 `StandardRoom` subclasses reachable in Sewers depths 1-4 (per `StandardRoom.chances[]`'s
 * nonzero weights there - see PORT_COVERAGE.md's census). `standardRoomRegistry.ts` maps these to
 * their `paint()` implementations; this table only carries what `room.ts`'s own geometry needs
 * (the real per-class `sizeCatProbs()` and `minWidth()`/`minHeight()` floor overrides) so sub-pass
 * 1's graph-geometry stage uses the *real* per-class values instead of the generic stand-in.
 */
export type StandardRoomKind =
	| 'empty' | 'sewerPipe' | 'ring' | 'circleBasin'
	| 'segmented' | 'pillars' | 'cellBlock'
	| 'cave' | 'cavesFissure' | 'circlePit'
	| 'plants' | 'aquarium' | 'platform' | 'burned' | 'fissure'
	| 'grassyGrave' | 'striped' | 'study' | 'suspiciousChest' | 'minefield'
	// City-region trio (`StandardRoom.chances[16..20]` indices 9/10/11).
	| 'hallway' | 'statues' | 'segmentedLibrary'
	// Halls-region trio (`StandardRoom.chances[21..26]` indices 12/13/14).
	| 'ruins' | 'chasm' | 'skulls'
	// `BlacksmithRoom` also extends `StandardRoom`, but like `RitualSiteRoom` is never selected
	// through `StandardRoom.chances[]` - `Blacksmith.Quest.spawn()` appends it directly (see
	// `blacksmith.ts`). Its `minWidth()`/`minHeight()` override feeds the graph stage the same way.
	| 'blacksmith'
	// `RitualSiteRoom` also extends `StandardRoom`, but is never selected through
	// `StandardRoom.chances[]` - `Wandmaker.Quest.spawnRoom()` appends it directly (see
	// `wandmaker.ts`). It still gets a `StandardRoomKind` because its construction runs
	// `StandardRoom`'s `{ setSizeCat(); }` instance initializer like any other, and its
	// `minWidth()`/`minHeight()` override feeds the graph stage.
	| 'ritualSite'
	// `GooBossRoom`'s 4 concrete subclasses (`rooms/sewerboss/*.java`) also extend `StandardRoom`
	// directly, same shape as `blacksmith`/`ritualSite` above: never selected through
	// `StandardRoom.chances[]`, placed directly by `SewerBossLevel.initRooms()`'s
	// `GooBossRoom.randomGooRoom()` (`Random.Int(4)`, ported in `rooms/sewerBoss/gooBossRoom.ts`).
	| 'gooDiamond' | 'gooWalled' | 'gooThinPillars' | 'gooThickPillars';

interface StandardRoomMeta {
	/** `sizeCatProbs()` - defaults to StandardRoom's own `[1,0,0]` (always NORMAL) when omitted. */
	sizeCatProbs?: [number, number, number];
	/** `minWidth()`/`minHeight()` floor, applied as `Math.max(sizeCat.minDim, floor)`, both axes
	 *  (every one of these 14 classes floors both axes identically - see PORT_COVERAGE.md). */
	minDimFloor?: number;
	/** `CircleBasinRoom` alone overrides to `sizeCat.minDim+1` (not a flat floor) on both axes,
	 *  with no matching `maxWidth()`/`maxHeight()` override. */
	minDimPlusOne?: boolean;
}
export const STANDARD_ROOM_META: Record<StandardRoomKind, StandardRoomMeta> = {
	empty: {},
	sewerPipe: { sizeCatProbs: [4, 2, 1], minDimFloor: 7 },
	ring: { sizeCatProbs: [9, 3, 1], minDimFloor: 7 },
	circleBasin: { sizeCatProbs: [0, 3, 1], minDimPlusOne: true },
	// Prison-region trio (`StandardRoom.chances[6..10]` indices 4/5/6). `CellBlockRoom` is the
	// only one of the 17 with no min-dimension override at all - its `{0,3,1}` probs already
	// force LARGE/GIANT, so `sizeCat.minDim` (10) is the floor.
	segmented: { sizeCatProbs: [9, 3, 1], minDimFloor: 7 },
	pillars: { sizeCatProbs: [9, 3, 1], minDimFloor: 7 },
	cellBlock: { sizeCatProbs: [0, 3, 1] },
	// Caves-region trio (`StandardRoom.chances[11..14]` indices 7/8/9). `CaveRoom` extends
	// `PatchRoom` (no size override of its own, unlike `BurnedRoom`); `CavesFissureRoom`/
	// `CirclePitRoom` both floor at 7/8 respectively.
	cave: { sizeCatProbs: [4, 2, 1] },
	cavesFissure: { sizeCatProbs: [9, 3, 1], minDimFloor: 7 },
	circlePit: { sizeCatProbs: [4, 2, 1], minDimFloor: 8 },
	plants: { sizeCatProbs: [3, 1, 0], minDimFloor: 5 },
	aquarium: { sizeCatProbs: [3, 1, 0], minDimFloor: 7 },
	platform: { sizeCatProbs: [6, 3, 1], minDimFloor: 6 },
	burned: { sizeCatProbs: [4, 1, 0] },
	fissure: { sizeCatProbs: [6, 3, 1] },
	grassyGrave: {},
	striped: { sizeCatProbs: [2, 1, 0] },
	study: { sizeCatProbs: [2, 1, 0], minDimFloor: 7 },
	suspiciousChest: { minDimFloor: 5 },
	minefield: { sizeCatProbs: [4, 1, 0] },
	// City-region trio (`StandardRoom.chances[16..20]` indices 9/10/11). `HallwayRoom` floors both
	// axes at 5 (default `{1,0,0}` sizeCatProbs, unstated); `StatuesRoom` floors at 7 with
	// `{9,3,1}`; `SegmentedLibraryRoom` has no min-dimension override at all (its `{0,3,1}` probs
	// already force LARGE/GIANT, same as `cellBlock` above).
	hallway: { minDimFloor: 5 },
	statues: { sizeCatProbs: [9, 3, 1], minDimFloor: 7 },
	segmentedLibrary: { sizeCatProbs: [0, 3, 1] },
	// Halls-region trio (`StandardRoom.chances[21..26]` indices 12/13/14). `RuinsRoom`/`ChasmRoom`
	// both extend `PatchRoom` with no min-dimension override of their own (`{4,2,1}` sizeCatProbs);
	// `SkullsRoom` floors at 7 with `{0,3,1}`, same shape as `statues` above.
	ruins: { sizeCatProbs: [4, 2, 1] },
	chasm: { sizeCatProbs: [4, 2, 1] },
	skulls: { sizeCatProbs: [0, 3, 1], minDimFloor: 7 },
	// `RitualSiteRoom.minWidth()/minHeight()` = max(super, 5); default `{1,0,0}` sizeCatProbs.
	ritualSite: { minDimFloor: 5 },
	// `BlacksmithRoom.minWidth()/minHeight()` = max(super, 6); default `{1,0,0}` sizeCatProbs.
	blacksmith: { minDimFloor: 6 },
	// `GooBossRoom.sizeCatProbs()` = `{0,1,0}` (always LARGE, ordinal 1) for all 4 subclasses; none
	// override `minWidth()`/`minHeight()`, so `sizeCat.minDim` (10) is the floor, same shape as
	// `cellBlock`/`segmentedLibrary` above.
	gooDiamond: { sizeCatProbs: [0, 1, 0] },
	gooWalled: { sizeCatProbs: [0, 1, 0] },
	gooThinPillars: { sizeCatProbs: [0, 1, 0] },
	gooThickPillars: { sizeCatProbs: [0, 1, 0] },
};

/**
 * The 21 `SpecialRoom` subclasses actually reachable via `SpecialRoom.createRoom()`'s
 * run-level queue (9 `EQUIP_SPECIALS` + 10 `CONSUMABLE_SPECIALS` + `LaboratoryRoom` +
 * `PitRoom` - see `rooms/special/registry.ts`). Unlike `StandardRoomKind`, reachability here
 * isn't depth-gated by a `chances[]` table - any of the 19 run-queue classes can appear at any
 * depth depending on the run's shuffle order, so all of them are in scope for Sewers 1-4, not a
 * depth-restricted subset. `ShopRoom` (also under `rooms/special/` in Java) and
 * `DemonSpawnerRoom` are excluded - the former is instantiated directly by `RegularLevel` (only
 * where `Dungeon.shopOnLevel()`, i.e. depths 6/11/16), the latter is spawned by NPC quest logic
 * elsewhere, never through `SpecialRoom.createRoom()`.
 *
 * `massGrave`/`rotGarden` ARE listed here (they extend `SpecialRoom`, so they share its 7/7
 * geometry handling and the `'special'` paint dispatch) but likewise never come out of
 * `createRoom()`'s queue - `Wandmaker.Quest.spawnRoom()` appends one directly on a Prison floor.
 * See `wandmaker.ts`.
 */
export type SpecialRoomKind =
	| 'weakFloor' | 'crypt' | 'pool' | 'armory' | 'sentry' | 'statue' | 'crystalVault' | 'crystalChoice' | 'sacrifice'
	| 'runestone' | 'garden' | 'library' | 'storage' | 'treasury' | 'magicWell' | 'toxicGas' | 'magicalFire' | 'traps' | 'crystalPath'
	| 'laboratory' | 'pit'
	| 'massGrave' | 'rotGarden'
	// `DemonSpawnerRoom` also extends `SpecialRoom`, but like `massGrave`/`rotGarden` is never
	// selected through `SpecialRoom.createRoom()`'s run-level queue - `HallsLevel.initRooms()`
	// appends it directly, unconditionally, on every Halls floor (see `regularLevel.ts`).
	| 'demonSpawner';

interface SpecialRoomMeta {
	minWidth?: number; maxWidth?: number; minHeight?: number; maxHeight?: number;
}
/** Per-class `minWidth()`/`maxWidth()`/`minHeight()`/`maxHeight()` overrides (base `SpecialRoom` is 5/10 both axes). */
export const SPECIAL_ROOM_META: Record<SpecialRoomKind, SpecialRoomMeta> = {
	weakFloor: {}, crypt: {}, statue: {}, armory: {},
	pool: { minWidth: 6, minHeight: 6 },
	sentry: { minWidth: 7, minHeight: 7 },
	crystalVault: { minWidth: 7, maxWidth: 7, minHeight: 7, maxHeight: 7 },
	crystalChoice: { minWidth: 7, minHeight: 7 },
	sacrifice: { minWidth: 7, minHeight: 7 },
	runestone: { minWidth: 6, minHeight: 6 },
	garden: {}, library: {}, storage: {}, treasury: {}, magicWell: {},
	toxicGas: { minWidth: 7, minHeight: 7 },
	magicalFire: { minWidth: 7, minHeight: 7 },
	traps: {},
	crystalPath: { minWidth: 7, minHeight: 7 },
	laboratory: {},
	pit: { minWidth: 6, maxWidth: 9, minHeight: 6, maxHeight: 9 },
	// Wandmaker quest rooms: both hard-override min to 7 (no `Math.max(super, ...)`).
	massGrave: { minWidth: 7, minHeight: 7 },
	rotGarden: { minWidth: 7, minHeight: 7 },
	// `DemonSpawnerRoom` has no minWidth()/minHeight() override at all - base `SpecialRoom` 5/10.
	demonSpawner: {},
};

/**
 * The 12 `SecretRoom` subclasses in `SecretRoom.ALL_SECRETS` (`levels/rooms/secret/
 * SecretRoom.java`), all reachable in Sewers via the run-level `runSecrets` shuffle (see
 * `rooms/secret/registry.ts`), plus `ratKing`: `RatKingRoom` also lives under `rooms/secret/` in
 * Java but is NOT in `ALL_SECRETS` - it's placed directly by `SewerBossLevel.initRooms()`
 * (`sewerBossInitRooms()` in `regularLevel.ts`), never through `SecretRoom.createRoom()`'s
 * run-level queue, same shape as `blacksmith`/`ritualSite`/`gooDiamond` etc under
 * `StandardRoomKind`. Its own room (walls/floor/connections) is ported for graph-stage RNG
 * fidelity - the `createBranches`/`placeRoom` calls that place it burn real RNG regardless of
 * gameplay content - and its chest-lined perimeter plus the `RatKing` NPC are live now too
 * (see `rooms/sewerBoss/ratKingRoom.ts`); only the crown exchange stays blocked (no King's
 * Crown item or Ratmogrify ability yet), tracked in PORT_COVERAGE.md.
 */
export type SecretRoomKind =
	| 'garden' | 'laboratory' | 'library' | 'larder' | 'well' | 'runestone'
	| 'artillery' | 'chestChasm' | 'honeypot' | 'hoard' | 'maze' | 'summoning'
	| 'ratKing';

interface SecretRoomMeta { minWidth?: number; maxWidth?: number; minHeight?: number; maxHeight?: number; }
/** Per-class `minWidth()`/`maxWidth()`/`minHeight()`/`maxHeight()` overrides (base `SecretRoom`,
 *  via `SpecialRoom`, is 5/10 both axes - same base as `SpecialRoomKind`). */
export const SECRET_ROOM_META: Record<SecretRoomKind, SecretRoomMeta> = {
	garden: {}, laboratory: {}, well: {}, runestone: {}, artillery: {}, honeypot: {}, hoard: {},
	library: { minWidth: 7, minHeight: 7 },
	larder: { minWidth: 6, minHeight: 6 },
	// `RatKingRoom.maxHeight()`/`maxWidth()` = 7 (down from `SecretRoom`'s base 10) - "reduced max
	// size to limit chest numbers... normally 8-28, this limits it to 8-16" (comment in the real
	// Java). No `minWidth`/`minHeight` override, so the base 5 floor applies.
	ratKing: { maxWidth: 7, maxHeight: 7 },
	chestChasm: { minWidth: 8, maxWidth: 9, minHeight: 8, maxHeight: 9 },
	maze: { minWidth: 14, maxWidth: 18, minHeight: 14, maxHeight: 18 },
	summoning: { maxWidth: 8, maxHeight: 8 },
};

interface RectLike { left: number; top: number; right: number; bottom: number; }
function rectWidth(r: RectLike): number { return r.right - r.left; }
function rectHeight(r: RectLike): number { return r.bottom - r.top; }

export class Room {
	left = 0;
	top = 0;
	right = 0;
	bottom = 0;

	neigbours: Room[] = [];
	/** `LinkedHashMap<Room,Door>` - a JS `Map` preserves insertion order the same way. */
	connected: Map<Room, Door | null> = new Map();

	distance = 0;
	price = 1;

	readonly kind: RoomKind;
	sizeCat: SizeCategory | null = null;
	/**
	 * Set post-construction (not a constructor param, like `shopDepth`) for `kind === 'entrance'`/
	 * `'exit'` rooms that are actually `SewerBossEntranceRoom`/`SewerBossExitRoom`
	 * (`rooms/sewerboss/*.java`, both extend `EntranceRoom`/`ExitRoom`) - they float `minWidth()`/
	 * `minHeight()` to 7/8 (`Math.max(super.minWidth(), 7)`/`8`) instead of the base 5, and paint
	 * differently (see `rooms/sewerBoss/entranceExitRoom.ts`). Every other `canConnect`/
	 * `maxConnections`/etc rule is identical to a plain `EntranceRoom`/`ExitRoom`, since neither
	 * subclass overrides them.
	 */
	sewerBossVariant?: 'entrance' | 'exit';
	/** Only set when `kind === 'standard'` - which of the 14 reachable concrete classes this is. */
	readonly standardKind?: StandardRoomKind;
	/** Only set when `kind === 'special'` - which of the 21 reachable concrete classes this is. */
	readonly specialKind?: SpecialRoomKind;
	/** Only set when `kind === 'secret'` - which of the 12 reachable concrete classes this is. */
	readonly secretKind?: SecretRoomKind;
	/** Only set when `kind === 'connection'` - which of the 6 reachable concrete classes this is. */
	readonly connectionKind?: ConnectionRoomKind;
	/**
	 * `PatchRoom.patch` - the room's own scorched/overgrown cell mask, stored on the instance the
	 * same way Java's `PatchRoom` field is, so `RegularPainter`'s `canPlaceWater`/`canPlaceGrass`/
	 * `canPlaceTrap` calls can consult it after `paint()` has run (`BurnedRoom` overrides all three
	 * as `!inside(p) || !patch[xyToPatchCoords(p.x, p.y)]`). Only set for patch-based rooms.
	 */
	patch?: boolean[];

	/**
	 * `Dungeon.depth` at the time this room was created. Only meaningful for `kind === 'shop'`,
	 * whose stock (and therefore its size) is depth-dependent - `generateItems()` reads
	 * `Dungeon.depth` directly, and `minWidth()` gives us nowhere to thread it through.
	 */
	shopDepth = 0;
	/** `ShopRoom.itemsToSpawn` - `null` until `itemCount()` first forces `generateItems()`. */
	private shopItems: string[] | null = null;

	/**
	 * `ShopRoom.itemCount()`: `if (itemsToSpawn == null) itemsToSpawn = generateItems();` then
	 * `itemsToSpawn.size()`. The cache is what keeps `generateItems()`'s draws to exactly one
	 * batch per instance no matter how many times the builder re-measures the room.
	 */
	shopItemCount(): number { return this.shopStock().length; }

	/** The generated stock, forcing `generateItems()` on first access exactly as Java does. */
	shopStock(): string[] {
		if (this.shopItems === null) this.shopItems = generateShopItems(this.shopDepth);
		return this.shopItems;
	}

	constructor(kind: RoomKind, standardKind?: StandardRoomKind, specialKind?: SpecialRoomKind, secretKind?: SecretRoomKind, connectionKind?: ConnectionRoomKind) {
		this.kind = kind;
		this.standardKind = standardKind;
		this.specialKind = specialKind;
		this.secretKind = secretKind;
		this.connectionKind = connectionKind;
		if (kind === 'entrance' || kind === 'exit' || kind === 'standard') {
			// StandardRoom's `{ setSizeCat(); }` instance initializer runs during construction,
			// before any caller sees the object - it burns one Random.chances call immediately,
			// using the concrete subclass's own sizeCatProbs() (real values now for 'standard'
			// via STANDARD_ROOM_META; 'entrance'/'exit' never override it, so they keep the base
			// [1,0,0]).
			this.setSizeCat(0, SIZE_CATEGORIES.length - 1);
		}
	}

	private sizeCatProbs(): [number, number, number] {
		if (this.kind === 'standard' && this.standardKind) {
			return STANDARD_ROOM_META[this.standardKind].sizeCatProbs ?? [1, 0, 0];
		}
		return [1, 0, 0];
	}

	// **** Rect-ish geometry (Rect.java + Room.java's width()/height() override) ****

	isEmpty(): boolean { return this.right <= this.left || this.bottom <= this.top; }
	setEmpty(): void { this.left = this.right = this.top = this.bottom = 0; }

	/** Rooms are inclusive of their right/bottom edge, so these are `+1` over the raw rect. */
	width(): number { return this.right - this.left + 1; }
	height(): number { return this.bottom - this.top + 1; }
	/** `Room.square()`. */
	square(): number { return this.width() * this.height(); }

	setPos(x: number, y: number): void {
		const w = this.right - this.left, h = this.bottom - this.top;
		this.left = x; this.top = y; this.right = x + w; this.bottom = y + h;
	}
	shift(dx: number, dy: number): void {
		this.left += dx; this.top += dy; this.right += dx; this.bottom += dy;
	}
	/**
	 * `Rect.resize(w,h)`: sets width/height directly off `left`/`top`, not `width()`'s +1 form.
	 * `CircleBasinRoom.resize()` overrides this to force an odd `width()`/`height()` ("cannot roll
	 * even numbers") by shrinking `right`/`bottom` by 1 whenever `super.resize()` left an even
	 * size - found via the Phase 2 Java-fixture harness: seed 123456789 depth 1's CircleBasinRoom
	 * came out 14x14 here (even, from an unmodified `resize()`) against Java's 13x13, and that one
	 * off-by-one cascaded into every room placed after it in the same loop, eventually producing
	 * one fewer connector room than Java by the end of `createBranches`.
	 */
	resize(w: number, h: number): void {
		this.right = this.left + w; this.bottom = this.top + h;
		if (this.kind === 'standard' && this.standardKind === 'circleBasin') {
			if (this.width() % 2 === 0) this.right--;
			if (this.height() % 2 === 0) this.bottom--;
		}
	}
	intersect(other: RectLike): RectLike {
		return {
			left: Math.max(this.left, other.left), right: Math.min(this.right, other.right),
			top: Math.max(this.top, other.top), bottom: Math.min(this.bottom, other.bottom),
		};
	}

	pointInside(from: { x: number; y: number }, n: number): { x: number; y: number } {
		if (from.x === this.left) return { x: from.x + n, y: from.y };
		if (from.x === this.right) return { x: from.x - n, y: from.y };
		if (from.y === this.top) return { x: from.x, y: from.y + n };
		if (from.y === this.bottom) return { x: from.x, y: from.y - n };
		return { x: from.x, y: from.y };
	}

	random(m = 1): { x: number; y: number } {
		return { x: SpdRandom.intRange(this.left + m, this.right - m), y: SpdRandom.intRange(this.top + m, this.bottom - m) };
	}

	center(): { x: number; y: number } {
		const oddW = ((this.right - this.left) % 2) === 1;
		const oddH = ((this.bottom - this.top) % 2) === 1;
		// Order matters: x's Random.Int(2) (if any) is always evaluated before y's.
		const x = Math.floor((this.left + this.right) / 2) + (oddW ? SpdRandom.int(2) : 0);
		const y = Math.floor((this.top + this.bottom) / 2) + (oddH ? SpdRandom.int(2) : 0);
		return { x, y };
	}

	// **** Sizing (Room.java's setSize family + StandardRoom's SizeCategory/setSizeCat) ****

	minWidth(): number {
		switch (this.kind) {
			case 'entrance': case 'exit': {
				// `SewerBossEntranceRoom.minWidth()` = `max(super, 7)`; `SewerBossExitRoom.minWidth()`
				// = `max(super, 8)`. `super` is `EntranceRoom`/`ExitRoom`'s own `max(sizeCat.minDim, 5)`.
				const base = Math.max(this.sizeCat!.minDim, 5);
				if (this.sewerBossVariant === 'entrance') return Math.max(base, 7);
				if (this.sewerBossVariant === 'exit') return Math.max(base, 8);
				return base;
			}
			case 'standard': {
				const meta = this.standardKind ? STANDARD_ROOM_META[this.standardKind] : undefined;
				if (meta?.minDimPlusOne) return this.sizeCat!.minDim + 1;
				if (meta?.minDimFloor) return Math.max(this.sizeCat!.minDim, meta.minDimFloor);
				return this.sizeCat!.minDim;
			}
			case 'special': return this.specialKind ? (SPECIAL_ROOM_META[this.specialKind].minWidth ?? 5) : 5;
			case 'secret': return this.secretKind ? (SECRET_ROOM_META[this.secretKind].minWidth ?? 5) : 5;
			/**
			 * `ShopRoom.minWidth()`/`minHeight()` are both
			 * `Math.max(7, (int)(Math.sqrt(itemCount()) + 3))` - so the shop's size is driven by
			 * how much stock it rolled, and `itemCount()` lazily runs `generateItems()` on first
			 * call (`if (itemsToSpawn == null)`). That laziness is load-bearing for RNG order:
			 * the instance is constructed in `initRooms()` but this is not reached until the
			 * builder attempts to place the shop, and `setSizeWithLimit()` tests `minWidth()`
			 * *before* `setSize()`'s two `NormalIntRange` draws (Room.java:90-94), so
			 * `generateItems()`'s draws land ahead of the size draws - once only, since
			 * `RegularLevel.build()`'s retry loop reuses this same object.
			 *
			 * Java truncates with a `(int)` cast, hence `Math.trunc` (all values here are
			 * positive, so `floor` would agree, but the cast is what the source says).
			 */
			case 'shop': return Math.max(7, Math.trunc(Math.sqrt(this.shopItemCount()) + 3));
			case 'connection': return this.connectionKind ? CONNECTION_ROOM_META[this.connectionKind].minDim : 3;
			case 'mazeConnection': return 3;
		}
	}
	maxWidth(): number {
		switch (this.kind) {
			case 'entrance': case 'exit': case 'standard': return this.sizeCat!.maxDim;
			case 'special': return this.specialKind ? (SPECIAL_ROOM_META[this.specialKind].maxWidth ?? 10) : 10;
			case 'secret': return this.secretKind ? (SECRET_ROOM_META[this.secretKind].maxWidth ?? 10) : 10;
			case 'shop': return 10;
			case 'connection': case 'mazeConnection': return 10;
		}
	}
	/** All ported kinds use the same min/max on both axes (dims are symmetric per-kind in Java too). */
	minHeight(): number { return this.minWidth(); }
	maxHeight(): number { return this.maxWidth(); }

	setSize(): boolean {
		return this.setSizeBounded(this.minWidth(), this.maxWidth(), this.minHeight(), this.maxHeight());
	}
	forceSize(w: number, h: number): boolean {
		return this.setSizeBounded(w, w, h, h);
	}
	setSizeWithLimit(w: number, h: number): boolean {
		if (w < this.minWidth() || h < this.minHeight()) return false;
		this.setSize();
		if (this.width() > w || this.height() > h) {
			this.resize(Math.min(this.width(), w) - 1, Math.min(this.height(), h) - 1);
		}
		return true;
	}
	private setSizeBounded(minW: number, maxW: number, minH: number, maxH: number): boolean {
		if (minW < this.minWidth() || maxW > this.maxWidth() || minH < this.minHeight() || maxH > this.maxHeight() || minW > maxW || minH > maxH) {
			return false;
		}
		// subtract one because rooms are inclusive to their right and bottom sides
		this.resize(SpdRandom.normalIntRange(minW, maxW) - 1, SpdRandom.normalIntRange(minH, maxH) - 1);
		return true;
	}

	/** `StandardRoom.setSizeCat()`/`setSizeCat(maxRoomValue)`/`setSizeCat(minOrdinal,maxOrdinal)`. */
	setSizeCat(minOrdinal = 0, maxOrdinal = SIZE_CATEGORIES.length - 1): boolean {
		const probs = this.sizeCatProbs().slice();
		for (let i = 0; i < minOrdinal; i++) probs[i] = 0;
		for (let i = maxOrdinal + 1; i < SIZE_CATEGORIES.length; i++) probs[i] = 0;
		const ordinal = SpdRandom.chances(probs);
		if (ordinal !== -1) {
			this.sizeCat = SIZE_CATEGORIES[ordinal];
			return true;
		}
		return false;
	}

	// **** Connections ****

	minConnections(direction: Direction): number {
		if (this.kind === 'connection' || this.kind === 'mazeConnection') return direction === ALL ? 2 : 0;
		return direction === ALL ? 1 : 0;
	}
	maxConnections(_direction: Direction): number {
		switch (this.kind) {
			case 'mazeConnection': return 2; // overridden for every direction, including ALL
			case 'special': case 'shop': case 'secret': return 1;
			default: return _direction === ALL ? 16 : 4;
		}
	}
	curConnections(direction: Direction): number {
		if (direction === ALL) return this.connected.size;
		let total = 0;
		for (const r of this.connected.keys()) {
			const i = this.intersect(r);
			const iw = rectWidth(i), ih = rectHeight(i);
			if (direction === LEFT && iw === 0 && i.left === this.left) total++;
			else if (direction === TOP && ih === 0 && i.top === this.top) total++;
			else if (direction === RIGHT && iw === 0 && i.right === this.right) total++;
			else if (direction === BOTTOM && ih === 0 && i.bottom === this.bottom) total++;
		}
		return total;
	}
	remConnections(direction: Direction): number {
		if (this.curConnections(ALL) >= this.maxConnections(ALL)) return 0;
		return this.maxConnections(direction) - this.curConnections(direction);
	}
	canConnectDirection(direction: Direction): boolean { return this.remConnections(direction) > 0; }
	canConnectPoint(p: { x: number; y: number }): boolean {
		const base = (p.x === this.left || p.x === this.right) !== (p.y === this.top || p.y === this.bottom);
		if (!base) return false;
		// SecretWellRoom.canConnect(Point) / SewerPipeRoom.canConnect(Point): both refuse a door
		// spot adjacent to a corner with the identical formula - found (SewerPipeRoom's copy) via
		// the Phase 2 Java-fixture harness: without it, a door position Java rejects (both this
		// room's AND its neighbour's corner-adjacency check must independently reject every
		// candidate point for `canConnect(Room)` to correctly return false) let TS's `connect()`
		// succeed where Java's failed, desyncing every RNG call made in the extra failed retries
		// Java's `placeRoom` do-while loop burns that TS's early success skips.
		if ((this.kind === 'secret' && this.secretKind === 'well') || (this.kind === 'standard' && this.standardKind === 'sewerPipe')) {
			return (p.x > this.left + 1 && p.x < this.right - 1) || (p.y > this.top + 1 && p.y < this.bottom - 1);
		}
		// CrystalPathRoom.canConnect(Point) / SentryRoom.canConnect(Point): refuse the exact
		// center point on whichever axis has odd width/height. Java calls `center()` separately
		// in EACH `if` (not once, hoisted) - `center()` itself unconditionally computes both x
		// and y, rolling `Random.Int(2)` on whichever axis has odd (right-left)/(bottom-top) (the
		// *even*-width/height axis), independent of which component the caller actually reads. A
		// hoisted single call here was a real RNG-count bug found via the Phase 2 harness: when
		// both width and height are even, Java's two `if` guards are both false and `center()` is
		// never invoked at all (0 rolls), where a hoisted call would always burn 1-2.
		if (this.kind === 'special' && (this.specialKind === 'crystalPath' || this.specialKind === 'sentry')) {
			if (this.width() % 2 === 1 && p.x === this.center().x) return false;
			if (this.height() % 2 === 1 && p.y === this.center().y) return false;
		}
		return true;
	}
	canConnect(r: Room): boolean {
		// `DemonSpawnerRoom.connect(Room)`: the Halls spawner room refuses to connect to
		// EntranceRoom. This is intentionally asymmetric, matching Java's override: the
		// rejection applies only when the demon-spawner room is the receiver.
		if (this.kind === 'special' && this.specialKind === 'demonSpawner' && r.kind === 'entrance') {
			return false;
		}
		// `RatKingRoom.canConnect(Room)`: `!(r instanceof SewerBossEntranceRoom) && super.canConnect(r)`.
		// Asymmetric on purpose, matching Java: only fires when RatKingRoom itself is the receiver
		// (`this`), not when it's the argument - `Room.connect()` only ever calls `this.canConnect`.
		if (this.kind === 'secret' && this.secretKind === 'ratKing' && r.kind === 'entrance' && r.sewerBossVariant === 'entrance') {
			return false;
		}
		const i = this.intersect(r);
		let foundPoint = false;
		for (let x = i.left; x <= i.right && !foundPoint; x++) {
			for (let y = i.top; y <= i.bottom; y++) {
				const p = { x, y };
				if (this.canConnectPoint(p) && r.canConnectPoint(p)) { foundPoint = true; break; }
			}
		}
		if (!foundPoint) return false;

		const iw = rectWidth(i), ih = rectHeight(i);
		if (iw === 0 && i.left === this.left) return this.canConnectDirection(LEFT) && r.canConnectDirection(RIGHT);
		if (ih === 0 && i.top === this.top) return this.canConnectDirection(TOP) && r.canConnectDirection(BOTTOM);
		if (iw === 0 && i.right === this.right) return this.canConnectDirection(RIGHT) && r.canConnectDirection(LEFT);
		if (ih === 0 && i.bottom === this.bottom) return this.canConnectDirection(BOTTOM) && r.canConnectDirection(TOP);
		return false;
	}

	addNeigbour(other: Room): boolean {
		if (this.neigbours.includes(other)) return true;
		const i = this.intersect(other);
		const iw = rectWidth(i), ih = rectHeight(i);
		if ((iw === 0 && ih >= 2) || (ih === 0 && iw >= 2)) {
			this.neigbours.push(other);
			other.neigbours.push(this);
			return true;
		}
		return false;
	}

	connect(room: Room): boolean {
		// EntranceRoom.connect()/ExitRoom.connect(): refuses to connect to each other directly,
		// otherwise works normally. Found while porting the always-present entrance/exit rooms
		// (sub-pass 2) - missing from sub-pass 1's graph-geometry port, corrected here since it's
		// a one-line graph-shape rule, not room content.
		if ((this.kind === 'entrance' && room.kind === 'exit') || (this.kind === 'exit' && room.kind === 'entrance')) {
			return false;
		}
		if ((this.neigbours.includes(room) || this.addNeigbour(room)) && !this.connected.has(room) && this.canConnect(room)) {
			this.connected.set(room, null);
			room.connected.set(this, null);
			return true;
		}
		return false;
	}

	/** `SpecialRoom.entrance()`: the single door of a 1-connection room (special/shop/secret). */
	entranceDoor(): Door {
		const first = this.connected.values().next();
		if (first.done || !first.value) throw new Error(`entranceDoor: '${this.kind}' room has no placed door yet`);
		return first.value;
	}

	clearConnections(): void {
		for (const r of this.neigbours) {
			const idx = r.neigbours.indexOf(this);
			if (idx !== -1) r.neigbours.splice(idx, 1);
		}
		this.neigbours = [];
		for (const r of this.connected.keys()) r.connected.delete(this);
		this.connected.clear();
	}
}
