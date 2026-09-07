/**
 * Port of `levels/painters/RegularPainter.java`'s full `paint()` pipeline: the room-painting
 * driver (was `regularPainterMinimal.ts`'s whole scope - now absorbed here), `paintDoors`
 * (hidden-door rolls + room merging), `paintWater`/`paintGrass` (via `spdPatch.ts`), and
 * `paintTraps`. Region `decorate()` passes (e.g. `sewerPainter.ts`) still run after this.
 *
 * `Level.Feeling` (CHASM/WATER/GRASS/DARK/LARGE/TRAPS/SECRETS) IS modeled: it is rolled per
 * floor and threaded through `PaintLevel.feeling`, so the feeling-gated branches below are live.
 * An earlier revision of this header claimed the opposite, and two hardcodes left behind by that
 * assumption survived long after Feeling was wired in - `Level.setSize()`'s CHASM background and
 * `Door.Type.TUNNEL`'s `tunnelTile()` - each a real desync on chasm floors. If you find another
 * "Feeling isn't modeled" comment in this port, treat it as a bug, not documentation.
 */
import { Room, Door, DoorType } from './room';
import { SpdRandom } from '../spdRng';
import { PaintLevel, Terrain, fillXY, isPassableTerrain } from './paintLevel';
import { paintStandardRoom } from './rooms/standard/registry';
import { entranceRoomContext } from './rooms/standard/entranceRoom';
import { spdPatchGenerate } from './spdPatch';
import { xyToPatchCoords } from './rooms/standard/patchRoom';

/**
 * `Level.Feeling`'s ordinals, matching `Level.java`'s enum order. `null` is `Feeling.NONE`
 * (which `rollLevelFeeling()` returns for depth 1 and for any roll past 6).
 */
export const Feeling = { CHASM: 0, WATER: 1, GRASS: 2, DARK: 3, LARGE: 4, TRAPS: 5, SECRETS: 6 } as const;

/**
 * `RegularPainter.paint()`'s bounds computation + room-shift + `level.setSize(...)`, which runs
 * before anything else in `paint()` (`rooms` is never null in this port's flow, so the
 * null-rooms/pre-initialized-level branch is out of scope).
 */
export function layoutAndCreateLevel(rooms: Room[], feeling: number | null = null): PaintLevel {
	const padding = feeling === Feeling.CHASM ? 2 : 1;
	let leftMost = Infinity, topMost = Infinity;
	for (const r of rooms) { leftMost = Math.min(leftMost, r.left); topMost = Math.min(topMost, r.top); }
	leftMost -= padding; topMost -= padding;

	let rightMost = 0, bottomMost = 0;
	for (const r of rooms) {
		r.shift(-leftMost, -topMost);
		rightMost = Math.max(rightMost, r.right);
		bottomMost = Math.max(bottomMost, r.bottom);
	}
	rightMost += padding; bottomMost += padding;

	// `Level.setSize()` fills with CHASM rather than WALL on a chasm floor - see PaintLevel's
	// constructor.
	const level = new PaintLevel(rightMost + 1, bottomMost + 1, feeling === Feeling.CHASM ? Terrain.CHASM : Terrain.WALL);
	level.feeling = feeling;
	return level;
}

interface RectBounds { left: number; top: number; right: number; bottom: number; }
function getPoints(rect: RectBounds): { x: number; y: number }[] {
	const pts: { x: number; y: number }[] = [];
	for (let x = rect.left; x <= rect.right; x++) {
		for (let y = rect.top; y <= rect.bottom; y++) pts.push({ x, y });
	}
	return pts;
}

function placeDoors(r: Room): void {
	for (const n of r.connected.keys()) {
		if (r.connected.get(n)) continue; // already placed from the other room's turn
		const i = r.intersect(n);
		const doorSpots = getPoints(i).filter(p => r.canConnectPoint(p) && n.canConnectPoint(p));
		if (doorSpots.length === 0) {
			throw new Error(`placeDoors: no door spot found between a '${r.kind}' and a '${n.kind}' room - matches Java's reportException path`);
		}
		const spot = SpdRandom.element(doorSpots);
		const door = new Door();
		door.x = spot.x; door.y = spot.y;
		r.connected.set(n, door);
		n.connected.set(r, door);
	}
}

/**
 * `Room.canMerge()`/`Terrain.SOLID`: whether a room's interior, one cell in from a candidate
 * merge-border point, is currently non-solid. `StandardRoom`'s own override (the general case
 * for 12 of our 14 classes) checks `(Terrain.flags[map[cell]] & SOLID) == 0`; `BurnedRoom` and
 * `MinefieldRoom` narrow that to exactly `Terrain.EMPTY`; `EntranceRoom` and `SewerPipeRoom`
 * always return false (never merge). `ExitRoom` has no override, so it uses the StandardRoom
 * base. `'special'/'shop'/'secret'/'connection'/'mazeConnection'` rooms are unpainted stand-ins
 * this pass (see registry.ts) - `Room.canMerge()`'s own base always returns false, matching
 * that they never merge either, so no special-casing is needed for them here.
 */
/**
 * Every terrain Java flags `SOLID` in `Terrain.java`'s static initializer (lines 73-107), read
 * off it exhaustively rather than by recall: WALL, DOOR, LOCKED_DOOR, CRYSTAL_DOOR, BARRICADE,
 * LOCKED_EXIT, SIGN, STATUE, ALCHEMY, plus the four defined by aliasing another entry -
 * WALL_DECO = flags[WALL], SECRET_DOOR = flags[WALL] | SECRET, STATUE_SP = flags[STATUE],
 * BOOKSHELF = flags[BARRICADE].
 *
 * `LOCKED_EXIT`, `SIGN`, `STATUE`, `STATUE_SP` and `ALCHEMY` were missing from an earlier
 * revision of this set, which would let `canMerge` expand a merge across a statue or an alchemy
 * pot that Java stops at. Not the cause of the 999999999999:6 divergence (that was the
 * `roomMerges` bookkeeping below), and not reachable on the floors verified so far since none of
 * these tiles lands adjacent to a merge candidate - but wrong, so corrected here.
 *
 * Note `EXIT`/`ENTRANCE` are deliberately absent: both are `PASSABLE` in Java, and `ENTRANCE`'s
 * `SOLID` flag is explicitly commented out (`PASSABLE/* | SOLID*​/`).
 */
const SOLID = new Set<number>([
	Terrain.WALL, Terrain.WALL_DECO, Terrain.LOCKED_DOOR, Terrain.CRYSTAL_DOOR,
	Terrain.BARRICADE, Terrain.SECRET_DOOR, Terrain.BOOKSHELF, Terrain.DOOR,
	Terrain.LOCKED_EXIT, Terrain.SIGN, Terrain.STATUE, Terrain.STATUE_SP, Terrain.ALCHEMY,
]);
function canMergeAt(level: PaintLevel, room: Room, p: { x: number; y: number }, mergeTerrain: number): boolean {
	if (room.kind === 'entrance' || (room.kind === 'standard' && (room.standardKind === 'sewerPipe' || room.standardKind === 'hallway'))) return false;
	if (room.kind !== 'standard' && room.kind !== 'exit') return false; // special/shop/secret/connection stand-ins: Room.canMerge() base is false
	const cell = level.pointToCell(room.pointInside(p, 1));
	const value = level.map[cell];
	if (room.standardKind === 'burned' || room.standardKind === 'minefield') return value === Terrain.EMPTY;
	// `CavesFissureRoom.canMerge()`: unconditionally true when merging into CHASM (the only
	// merge terrain `CavesPainter.decorate()`'s unconnected-neighbour pass ever uses), otherwise
	// true unless the interior point is itself already CHASM. Note this does NOT fall through to
	// the generic `!SOLID.has(value)` check at all - a fissure room merges through its own chasm
	// tiles even though CHASM isn't in `SOLID`.
	if (room.standardKind === 'cavesFissure') {
		return mergeTerrain === Terrain.CHASM || value !== Terrain.CHASM;
	}
	// `RuinsRoom.canMerge()`: unconditionally true, no terrain check at all.
	if (room.standardKind === 'ruins') return true;
	return !SOLID.has(value);
}

/**
 * `Room.merge()`'s per-class special-casing among our 17 reachable classes: `GrassyGraveRoom`/
 * `PlantsRoom` merge to GRASS (not the passed `mergeTerrain`) when merging with each other and
 * `mergeTerrain === EMPTY`; `StripedRoom` merges to `EMPTY_SP` when merging with another
 * `StripedRoom` at `mergeTerrain === EMPTY`; `PlatformRoom` merges to `CHASM` (+ an `EMPTY_SP`
 * door tile) when merging with another `PlatformRoom` OR a `ChasmRoom` at any `mergeTerrain !==
 * CHASM`; `ChasmRoom` (Halls) merges to `CHASM` (+ a plain `EMPTY` door tile - not `EMPTY_SP`,
 * the one difference from `PlatformRoom`'s own case) when merging with another `ChasmRoom` OR a
 * `PlatformRoom` at `mergeTerrain === EMPTY` specifically (narrower than Platform's `!== CHASM`).
 * Every other class falls through to the base `Painter.fill`.
 */
function mergeFill(level: PaintLevel, r: Room, n: Room, rect: RectBounds, mergeTerrain: number, doorPoint: { x: number; y: number } | null): void {
	let terrain = mergeTerrain;
	if (r.standardKind === 'grassyGrave' || r.standardKind === 'plants') {
		if (mergeTerrain === Terrain.EMPTY && (n.standardKind === 'grassyGrave' || n.standardKind === 'plants')) terrain = Terrain.GRASS;
	} else if (r.standardKind === 'striped') {
		if (mergeTerrain === Terrain.EMPTY && n.standardKind === 'striped') terrain = Terrain.EMPTY_SP;
	} else if (r.standardKind === 'platform') {
		if (mergeTerrain !== Terrain.CHASM && (n.standardKind === 'platform' || n.standardKind === 'chasm')) {
			terrain = Terrain.CHASM;
			if (doorPoint) level.map[level.pointToCell(doorPoint)] = Terrain.EMPTY_SP;
		}
	} else if (r.standardKind === 'chasm') {
		if (mergeTerrain === Terrain.EMPTY && (n.standardKind === 'chasm' || n.standardKind === 'platform')) {
			terrain = Terrain.CHASM;
			if (doorPoint) level.map[level.pointToCell(doorPoint)] = Terrain.EMPTY;
		}
	}
	fillXY(level, rect.left, rect.top, rect.right - rect.left, rect.bottom - rect.top, terrain);
}

/**
 * `RegularPainter.mergeRooms()`. No `Random.*` calls anywhere in this function or anything it
 * calls (`canMerge`/`merge` are pure geometry/terrain reads in every Java override that exists
 * today - confirmed by reading all of them) - so unlike everything else in this file, its
 * control flow doesn't need to match Java call-for-call to keep the RNG stream in sync; it only
 * needs to produce the same tiles.
 */
export function mergeRooms(level: PaintLevel, r: Room, n: Room, doorPoint: { x: number; y: number } | null, mergeTerrain: number): boolean {
	const i = r.intersect(n);
	// NB: the `doorPoint == null` fallbacks below stand in for Java's `intersect.center()`, which
	// DOES roll `Random.Int(2)` on each even-length axis. They are unreachable in this flow (every
	// door is placed by `placeDoors` during the paint loop, before `paintDoors` runs, so `start` is
	// always non-null) - if that ever changes, they must gain those rolls or they will desync.
	if (i.left === i.right) {
		let top = doorPoint ? doorPoint.y : Math.floor((i.top + i.bottom) / 2);
		let bottom = top;
		let p = { x: i.left, y: top };
		while (top > i.top && canMergeAt(level, n, p, mergeTerrain) && canMergeAt(level, r, p, mergeTerrain)) { top--; p = { x: i.left, y: top }; }
		p = { x: i.left, y: bottom };
		while (bottom < i.bottom && canMergeAt(level, n, p, mergeTerrain) && canMergeAt(level, r, p, mergeTerrain)) { bottom++; p = { x: i.left, y: bottom }; }
		// Java tests `merge.height() >= 3` on a plain `Rect`, whose height() is `bottom - top` with
		// NO +1 (unlike `Room`, which overrides it to `super.height()+1`). Using the inclusive
		// Room-style height here made this port merge room pairs Java rejects, which then removed a
		// door from `paintDoors`' hidden-door roll loop and desynced the stream from there on.
		if (bottom - top >= 3) {
			mergeFill(level, r, n, { left: i.left, top: top + 1, right: i.left + 1, bottom }, mergeTerrain, doorPoint);
			return true;
		}
		return false;
	} else if (i.top === i.bottom) {
		let left = doorPoint ? doorPoint.x : Math.floor((i.left + i.right) / 2);
		let right = left;
		let p = { x: left, y: i.top };
		while (left > i.left && canMergeAt(level, n, p, mergeTerrain) && canMergeAt(level, r, p, mergeTerrain)) { left--; p = { x: left, y: i.top }; }
		p = { x: right, y: i.top };
		while (right < i.right && canMergeAt(level, n, p, mergeTerrain) && canMergeAt(level, r, p, mergeTerrain)) { right++; p = { x: right, y: i.top }; }
		// `Rect.width()` is `right - left`, no +1 - same off-by-one as the height branch above.
		if (right - left >= 3) {
			mergeFill(level, r, n, { left: left + 1, top: i.top, right, bottom: i.top + 1 }, mergeTerrain, doorPoint);
			return true;
		}
		return false;
	}
	return false;
}

/** `RegularPainter.paintDoors()`. */
function paintDoorsForDepth(level: PaintLevel, rooms: Room[], depth: number, feeling: number | null): void {
	let hiddenDoorChance = depth > 1 ? Math.min(1, depth / 20) : 0;
	// SECRETS feeling pulls the extra-secret-door chance toward 50%.
	if (feeling === Feeling.SECRETS) hiddenDoorChance = Math.fround((0.5 + hiddenDoorChance) / 2);

	const roomMerges = new Map<Room, Room>();

	for (const r of rooms) {
		for (const n of r.connected.keys()) {
			if (roomMerges.get(r) === n || roomMerges.get(n) === r) continue;
			if (!roomMerges.has(r) && !roomMerges.has(n) && mergeRooms(level, r, n, r.connected.get(n) ?? null, Terrain.EMPTY)) {
				// Java casts UNCONDITIONALLY - `((StandardRoom) r).sizeCat == NORMAL` - and
				// `EntranceRoom`/`ExitRoom` both EXTEND `StandardRoom`, so they are recorded here
				// too, which is what caps a normal-size room at one merge. Testing
				// `kind === 'standard'` alone left entrance/exit out of `roomMerges`, letting them
				// merge with a second neighbour that Java refuses - and each extra merge swallows
				// a door, removing its hidden-door `Random.Float()` from `paintDoors` and
				// desyncing the stream for the rest of the floor. Found by trace-diffing
				// 999999999999:6, where Java merges ExitRoom+PillarsRoom and then declines
				// ExitRoom+FissureRoom, while this port merged both.
				// (The cast is safe in Java only because a merge can succeed solely when both
				// rooms are StandardRoom subclasses: `Room.canMerge()`'s base returns false, so
				// `mergeRooms` fails for every special/secret/connection room.)
				const isStandardRoomSubclass = (room: Room) =>
					room.kind === 'standard' || room.kind === 'entrance' || room.kind === 'exit';
				if (isStandardRoomSubclass(r) && r.sizeCat?.name === 'NORMAL') roomMerges.set(r, n);
				if (isStandardRoomSubclass(n) && n.sizeCat?.name === 'NORMAL') roomMerges.set(n, r);
				continue;
			}

			const d = r.connected.get(n)!;
			const doorCell = level.pointToCell(d);

			if (d.type === DoorType.REGULAR) {
				if (SpdRandom.float() < hiddenDoorChance) {
					d.type = DoorType.HIDDEN;
					if (feeling !== Feeling.SECRETS) {
						// Off a secrets floor: every standard room must keep an unbroken path to
						// every other one.
						buildDistanceMap(rooms, r);
						if (n.distance === Infinity) d.type = DoorType.UNLOCKED;
					} else {
						// On a secrets floor the requirement is only "not totally isolated":
						// each side must still reach >= 2 non-ConnectionRooms.
						const reachableNonConnection = (focus: Room): number => {
							buildDistanceMap(rooms, focus);
							let count = 0;
							for (const dest of rooms) {
								if (dest.distance !== Infinity && dest.kind !== 'connection' && dest.kind !== 'mazeConnection') count++;
							}
							return count;
						};
						if (reachableNonConnection(r) < 2) d.type = DoorType.UNLOCKED;
						else if (reachableNonConnection(n) < 2) d.type = DoorType.UNLOCKED;
					}
					// Java then unconditionally rebuilds the map from `r` and re-checks, but only
					// applies the downgrade off a secrets floor.
					buildDistanceMap(rooms, r);
					if (feeling !== Feeling.SECRETS && n.distance === Infinity) d.type = DoorType.UNLOCKED;
				} else {
					d.type = DoorType.UNLOCKED;
				}

				// `RegularPainter.paintDoors()`'s entrance-room special case:
				//   if (r instanceof EntranceRoom || n instanceof EntranceRoom) {
				//       if ((depth == 1 && SPDSettings.intro())
				//           || (depth == 2 && !ADVENTURERS_GUIDE.isPageFound(GUIDE_SEARCHING)))
				//           d.type = HIDDEN;
				//   }
				// This is NOT a rarely-taken branch: `SPDSettings.intro()` defaults to `true`
				// (`getBoolean(KEY_INTRO, true)`), so on a fresh install - which is exactly what the
				// Java reference harness runs as - EVERY door touching the entrance room is hidden on
				// floor 1. Leaving it out (as this port previously did, calling it unmodelled save/UI
				// state) left those cells as passable `DOOR` instead of solid `SECRET_DOOR`, which
				// then changed `paintTraps`' `passable` array, hence `validNonHallways`, hence trap
				// positions - and, downstream of that, `SewerPainter.decorate()`'s per-EMPTY-cell
				// rolls. `entranceRoomContext`'s two flags model the real save state; both default
				// false, matching a fresh game.
				if (r.kind === 'entrance' || n.kind === 'entrance') {
					if ((depth === 1 && !entranceRoomContext.guideIntroRead)
						|| (depth === 2 && !entranceRoomContext.guideSearchingFound)) {
						d.type = DoorType.HIDDEN;
					}
				}
			}

			switch (d.type) {
				case DoorType.EMPTY: level.map[doorCell] = Terrain.EMPTY; break;
				case DoorType.TUNNEL: level.map[doorCell] = level.tunnelTile(); break;
				case DoorType.WATER: level.map[doorCell] = Terrain.WATER; break;
				case DoorType.UNLOCKED: level.map[doorCell] = Terrain.DOOR; break;
				case DoorType.HIDDEN: level.map[doorCell] = Terrain.SECRET_DOOR; break;
				case DoorType.BARRICADE: level.map[doorCell] = Terrain.BARRICADE; break;
				case DoorType.LOCKED: level.map[doorCell] = Terrain.LOCKED_DOOR; break;
				case DoorType.CRYSTAL: level.map[doorCell] = Terrain.CRYSTAL_DOOR; break;
			}
		}
	}
}

/** `Graph.buildDistanceMap`: BFS over `Room.edges()` (EMPTY/TUNNEL/UNLOCKED/REGULAR doors only). */
function buildDistanceMap(rooms: Room[], focus: Room): void {
	for (const r of rooms) r.distance = Infinity;
	focus.distance = 0;
	const queue: Room[] = [focus];
	while (queue.length > 0) {
		const room = queue.shift()!;
		const distance = room.distance;
		for (const [edge, door] of room.connected) {
			if (!door) continue;
			if (door.type === DoorType.EMPTY || door.type === DoorType.TUNNEL || door.type === DoorType.UNLOCKED || door.type === DoorType.REGULAR) {
				if (edge.distance > distance + 1) {
					edge.distance = distance + 1;
					queue.push(edge);
				}
			}
		}
	}
}

/** `RegularPainter.paintWater()`. */
function paintWater(level: PaintLevel, rooms: Room[], fill: number, smoothness: number): void {
	const lake = spdPatchGenerate(level.w, level.h, fill, smoothness, true);
	for (const r of rooms) {
		for (let x = r.left; x <= r.right; x++) {
			for (let y = r.top; y <= r.bottom; y++) {
				// canPlaceWater(): true for every one of our 14 classes except SewerPipeRoom
				// (always false) and BurnedRoom (false inside its scorched patch) - see each
				// room file; entrance/exit/standard default to Room's own `true`.
				if (!canPlaceWaterAt(r, x, y)) continue;
				const i = level.pointToCell({ x, y });
				if (lake[i] && level.map[i] === Terrain.EMPTY) level.map[i] = Terrain.WATER;
			}
		}
	}
}

/** `RegularPainter.paintGrass()`. */
function paintGrass(level: PaintLevel, rooms: Room[], fill: number, smoothness: number): void {
	const grass = spdPatchGenerate(level.w, level.h, fill, smoothness, true);
	const grassCells: number[] = [];
	for (const r of rooms) {
		for (let x = r.left; x <= r.right; x++) {
			for (let y = r.top; y <= r.bottom; y++) {
				if (!canPlaceGrassAt(r, x, y)) continue;
				const i = level.pointToCell({ x, y });
				if (grass[i] && level.map[i] === Terrain.EMPTY) grassCells.push(i);
			}
		}
	}
	const w = level.w;
	const neighbours8 = [-w - 1, -w, -w + 1, -1, 1, w - 1, w, w + 1];
	for (const i of grassCells) {
		if (level.findMob(i) || level.groundItems.some(g => g.pos === i)) { level.map[i] = Terrain.GRASS; continue; }
		let count = 1;
		for (const n of neighbours8) if (grass[i + n]) count++;
		level.map[i] = SpdRandom.float() < count / 12 ? Terrain.HIGH_GRASS : Terrain.GRASS;
	}
}

/**
 * `RegularPainter.paint(level, null)` mode used by Java's `MiningLevel`: the level has already
 * been painted by its one hand-placed CaveRoom, so water and grass are allowed on every EMPTY
 * cell instead of being restricted to a room list. No traps or room decoration are requested by
 * that painter configuration.
 */
export function paintStandaloneTerrain(
	level: PaintLevel,
	water: { fill: number; smoothness: number },
	grass: { fill: number; smoothness: number },
): void {
	// `RegularPainter.paint(level, null)` is the MiningLevel path. `null` means
	// "all existing EMPTY cells", not "zero rooms"; the ordinary helper above is
	// intentionally room-scoped for regular floors, so the branch needs this global form.
	if (water.fill > 0) {
		const lake = spdPatchGenerate(level.w, level.h, water.fill, water.smoothness, true);
		for (let i = 0; i < lake.length; i++) {
			if (lake[i] && level.map[i] === Terrain.EMPTY) level.map[i] = Terrain.WATER;
		}
	}
	if (grass.fill > 0) {
		const grassPatch = spdPatchGenerate(level.w, level.h, grass.fill, grass.smoothness, true);
		const grassCells: number[] = [];
		for (let i = 0; i < grassPatch.length; i++) {
			if (grassPatch[i] && level.map[i] === Terrain.EMPTY) grassCells.push(i);
		}
		const neighbours8 = [-level.w - 1, -level.w, -level.w + 1, -1, 1, level.w - 1, level.w, level.w + 1];
		for (const i of grassCells) {
			let count = 1;
			for (const n of neighbours8) if (grassPatch[i + n]) count++;
			level.map[i] = SpdRandom.float() < count / 12 ? Terrain.HIGH_GRASS : Terrain.GRASS;
		}
	}
}

/**
 * `Room.canPlaceWater`/`canPlaceGrass` overrides among the 14 reachable classes: only
 * `SewerPipeRoom` (`canPlaceWater` always false) and `BurnedRoom` (`canPlaceWater`/
 * `canPlaceGrass` both false inside its scorched patch - `PatchRoom.patch`/`xyToPatchCoords`)
 * differ from the base `Room` (`true` everywhere inside the room rect). `BurnedRoom`'s patch
 * array isn't threaded out of its own paint module this pass, so its water/grass exclusion is
 * approximated here as "false everywhere in the room" rather than patch-shaped - a documented
 * simplification (see PORT_COVERAGE.md); it only affects where dew/high-grass can land inside a
 * BurnedRoom, not any RNG call order.
 */
function canPlaceWaterAt(r: Room, x: number, y: number): boolean {
	if (r.kind === 'standard' && r.standardKind === 'sewerPipe') return false;
	if (r.kind === 'standard' && r.standardKind === 'burned') return outsidePatch(r, x, y);
	// SecretRunestoneRoom.canPlaceWater() always false (its EMPTY_SP reading nook must stay dry).
	if (r.kind === 'secret' && r.secretKind === 'runestone') return false;
	// DemonSpawnerRoom.canPlaceWater() always false.
	if (r.kind === 'special' && r.specialKind === 'demonSpawner') return false;
	return true;
}
function canPlaceGrassAt(r: Room, x: number, y: number): boolean {
	if (r.kind === 'standard' && r.standardKind === 'burned') return outsidePatch(r, x, y);
	// `PitRoom` ("we want the player to be able to see the well through the door") and
	// `MagicalFireRoom` are the only two `special/` classes that override `canPlaceGrass()` to
	// false. An earlier revision of this list also named `ToxicGasRoom` - it has NO such override
	// in Java (verified by grepping `public boolean canPlaceGrass` across all of `levels/rooms/`:
	// only `Room`, `SecretRunestoneRoom`, `DemonSpawnerRoom`, `MagicalFireRoom`, `PitRoom` and
	// `BurnedRoom` declare one). That invented override cost 72 candidate points on a
	// ToxicGasRoom floor, dropping 5 grass cells and so 5 `Random.Float()` draws, which desynced
	// the rest of `paintGrass` and everything after it. Found by trace-diffing 42:9.
	if (r.kind === 'special' && (r.specialKind === 'pit' || r.specialKind === 'magicalFire' || r.specialKind === 'demonSpawner')) return false;
	// SecretRunestoneRoom.canPlaceGrass() always false, same reason as canPlaceWater above.
	if (r.kind === 'secret' && r.secretKind === 'runestone') return false;
	return true;
}

/**
 * `Room.canPlaceTrap` overrides. Previously missing entirely from `paintTraps`, which silently
 * treated every EMPTY in-room cell as trappable. The depth-1 case is the load-bearing one:
 * `EntranceRoom.canPlaceTrap()` returns false on floor 1 (`Dungeon.depth == 1`), so the whole
 * entrance room is off-limits there - omitting it shifted floor-1 trap positions even when the RNG
 * draw stream matched Java exactly.
 */
function canPlaceTrapAt(r: Room, x: number, y: number, depth: number): boolean {
	// EntranceRoom.canPlaceTrap(): false on depth 1, base `true` otherwise.
	if (r.kind === 'entrance' && depth === 1) return false;
	// BurnedRoom.canPlaceTrap(): false inside its scorched patch.
	if (r.kind === 'standard' && r.standardKind === 'burned') return outsidePatch(r, x, y);
	// PitRoom.canPlaceTrap(): always false ("the player is already weak after landing").
	if (r.kind === 'special' && r.specialKind === 'pit') return false;
	// DemonSpawnerRoom.canPlaceTrap(): always false.
	if (r.kind === 'special' && r.specialKind === 'demonSpawner') return false;
	// SecretHoardRoom.canPlaceTrap(): always false.
	if (r.kind === 'secret' && r.secretKind === 'hoard') return false;
	return true;
}

/**
 * `BurnedRoom`'s shared `!inside(p) || !patch[xyToPatchCoords(p.x, p.y)]` body. The patch is the
 * room's own instance field (`Room.patch`, set during `paint()`); if it somehow hasn't been painted
 * yet the base `true` is the safe answer, matching a freshly-constructed Java room.
 */
function outsidePatch(r: Room, x: number, y: number): boolean {
	if (!r.patch) return true;
	// Room.inside(): strictly within the wall ring.
	if (!(x > r.left && x < r.right && y > r.top && y < r.bottom)) return true;
	return !r.patch[xyToPatchCoords(r, x, y)];
}

/** `RegularLevel.trapClasses()`/`trapChances()` default (SewerLevel overrides these per-depth - see sewerPainter.ts). */
export interface TrapTable { classes: string[]; chances: number[]; }

/**
 * `Trap.avoidsHallways` per trap class. Read off the real `levels/traps/*.java` sources: exactly
 * eight classes set it (`DisintegrationTrap`, `FlashingTrap`, `GatewayTrap`, `GrimTrap`,
 * `GrippingTrap`, `PoisonDartTrap`, `RockfallTrap`, `WornDartTrap`), of which only `wornDart` and
 * `gateway` appear in Sewers' table. This matters far more than it looks: **depth 1's trap table is
 * `wornDart` alone**, so on floor 1 every single trap takes the `validNonHallways` branch.
 * (An earlier revision of this file claimed `SummoningTrap`/`FlockTrap` avoid hallways too - they
 * do not; both were verified as `avoidsHallways`-free in their own sources.)
 */
const TRAPS_AVOIDING_HALLWAYS = new Set<string>([
	'wornDart', 'gateway', 'disintegration', 'flashing', 'grim', 'gripping', 'poisonDart', 'rockfall',
]);

/** `RegularPainter.paintTraps()`. */
function paintTraps(level: PaintLevel, rooms: Room[], nTrapsRequested: number, table: TrapTable, depth: number, feeling: number | null): void {
	const validCells: number[] = [];
	for (const r of rooms) {
		for (let x = r.left; x <= r.right; x++) {
			for (let y = r.top; y <= r.bottom; y++) {
				if (!canPlaceTrapAt(r, x, y, depth)) continue;
				const i = level.pointToCell({ x, y });
				if (level.map[i] === Terrain.EMPTY) validCells.push(i);
			}
		}
	}

	const nTraps = Math.min(nTrapsRequested, Math.floor(validCells.length / 5));

	// `validNonHallways`: cells with a passable neighbour both vertically AND horizontally, i.e. not
	// in a 1-wide corridor. Java rebuilds `level.passable` from `Terrain.flags` first and indexes
	// `PathFinder.CIRCLE4` = {-width, +1, +width, -1} (up, right, down, left).
	const w = level.w;
	const passable = Array.from(level.map, isPassableTerrain);
	const validNonHallways: number[] = [];
	for (const i of validCells) {
		if ((passable[i - w] || passable[i + w]) && (passable[i + 1] || passable[i - 1])) {
			validNonHallways.push(i);
		}
	}

	const remainingCells = validCells.slice();
	const remainingNonHallways = validNonHallways.slice();

	// 5x as many traps on a TRAPS-feeling floor, but only the first `nTraps` are hidden.
	const trapsToPlace = feeling === Feeling.TRAPS ? 5 * nTraps : nTraps;
	for (let i = 0; i < trapsToPlace; i++) {
		const idx = SpdRandom.chances(table.chances);
		const kind = table.classes[idx];
		const avoidsHallways = TRAPS_AVOIDING_HALLWAYS.has(kind);
		const pos = avoidsHallways && remainingNonHallways.length > 0
			? SpdRandom.element(remainingNonHallways)
			: SpdRandom.element(remainingCells);
		// Java removes the Integer *object* (by value, not index) from BOTH lists.
		const inAll = remainingCells.indexOf(pos);
		if (inAll >= 0) remainingCells.splice(inAll, 1);
		const inNonHall = remainingNonHallways.indexOf(pos);
		if (inNonHall >= 0) remainingNonHallways.splice(inNonHall, 1);
		// `if (i < nTraps) trap.hide(); else trap.reveal();`
		const hidden = i < nTraps;
		level.setTrap(kind, hidden, true, pos);
		level.map[pos] = hidden ? Terrain.SECRET_TRAP : Terrain.TRAP;
	}
}

/** `RegularPainter.paint()`'s full sequence, including its bounds/shift/`setSize` prologue. */
export function paintLevel(
	rooms: Room[], depth: number,
	water: { fill: number; smoothness: number }, grass: { fill: number; smoothness: number },
	traps: { n: number; table: TrapTable },
	decorate: (level: PaintLevel, rooms: Room[]) => void,
	feeling: number | null = null,
): PaintLevel {
	const level = layoutAndCreateLevel(rooms, feeling);

	// `Random.shuffle(rooms)` mutates Java's list IN PLACE, and every later stage
	// (`paintDoors`/`paintWater`/`paintGrass`/`paintTraps`/`decorate`) then iterates that SAME
	// shuffled order. Shuffling a copy and passing the original order downstream - as this port
	// first did - keeps the paint loop right but silently reorders every candidate-cell list
	// (water/grass/trap cells are appended room by room) and, worse, reorders `paintDoors`' own
	// RNG-consuming hidden-door loop. Shuffle in place, exactly like Java.
	SpdRandom.shuffle(rooms);
	for (const r of rooms) {
		placeDoors(r);
		paintStandardRoom(level, r, depth);
	}

	paintDoorsForDepth(level, rooms, depth, feeling);

	if (water.fill > 0) paintWater(level, rooms, water.fill, water.smoothness);
	if (grass.fill > 0) paintGrass(level, rooms, grass.fill, grass.smoothness);
	if (traps.n > 0) paintTraps(level, rooms, traps.n, traps.table, depth, feeling);

	decorate(level, rooms);

	return level;
}

export { DoorType };
