/**
 * Port of the 6 `levels/rooms/connection/*.java` subclasses' `paint()` methods:
 * `TunnelRoom`, `BridgeRoom`, `PerimeterRoom`, `WalkwayRoom`, `RingTunnelRoom`, `RingBridgeRoom`
 * (plus `MazeConnectionRoom`, which routes to `maze.ts`'s existing port).
 *
 * These were previously left as a bare wall/floor fallback, on the incorrect assumption that
 * connection rooms' paint RNG "doesn't run during graph construction, so it doesn't matter". It
 * does: `TunnelRoom.getDoorCenter()` makes **two `Random.Float()` draws** every time a tunnel-
 * family room is painted, and tunnels are the single most common room type on a floor. Found via
 * the Phase 2 call-by-call RNG trace diff against the real Java harness: the very first diverging
 * draw of seed=1/depth=1 was Java's `next(24)` pair inside `RingTunnelRoom.paint()` against TS's
 * complete absence of those draws, which desynced the entire remainder of the paint stage (doors,
 * water, grass, traps, decoration) on every floor. See PORT_COVERAGE.md.
 *
 * `Level.tunnelTile()` is `feeling == CHASM ? EMPTY_SP : EMPTY`; this port passes the resolved
 * tile in, since `Level.Feeling` lives on the caller's side here.
 */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillXY, fillRoomInset, drawLine, set } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';

interface Rect { left: number; top: number; right: number; bottom: number; }

function gate(min: number, value: number, max: number): number {
	return value < min ? min : value > max ? max : value;
}

/**
 * `TunnelRoom.getDoorCenter()` - the two `Random.Float()` rolls that were meant to round the
 * fractional door centroid up or down.
 *
 * Note a real quirk in the original Java, faithfully reproduced here: `doorCenter` accumulates
 * raw *integer* door coordinates, so it always holds a whole number, and the divide happens only
 * inside the `Point` constructor - which means `doorCenter.x % 1` is **always exactly 0**, and
 * `Random.Float() < 0` is therefore always false. The rounding nudge can never actually fire; the
 * two draws are consumed regardless. (Java almost certainly intended to divide before taking the
 * remainder.) The draws are what matter for stream parity, so this port keeps the same dead
 * comparison rather than "fixing" it into behaviour real SPD does not have.
 */
function getDoorCenter(room: Room): { x: number; y: number } {
	let sumX = 0, sumY = 0;
	for (const door of room.connected.values()) {
		if (!door) continue;
		sumX = Math.fround(sumX + door.x);
		sumY = Math.fround(sumY + door.y);
	}
	const n = room.connected.size;
	const c = { x: Math.trunc(sumX) / n | 0, y: Math.trunc(sumY) / n | 0 };
	// Java: `if (Random.Float() < doorCenter.x % 1) c.x++;` - `%` on the accumulated float sum.
	if (SpdRandom.float() < sumX % 1) c.x++;
	if (SpdRandom.float() < sumY % 1) c.y++;
	c.x = gate(room.left + 1, c.x, room.right - 1);
	c.y = gate(room.top + 1, c.y, room.bottom - 1);
	return c;
}

/** `TunnelRoom.getConnectionSpace()`: a 1x1 rect at the door centre. */
function tunnelConnectionSpace(room: Room): Rect {
	const c = getDoorCenter(room);
	return { left: c.x, top: c.y, right: c.x, bottom: c.y };
}

/** `RingTunnelRoom.getConnectionSpace()`: a 3x3 ring, gated 2 in from the room edge. Cached in
 *  Java via `connSpace`, so `getDoorCenter()`'s two draws happen only ONCE per room even though
 *  `paint()` calls `getConnectionSpace()` after `super.paint()` already did. */
function ringConnectionSpace(room: Room, cache: WeakMap<Room, Rect>): Rect {
	const hit = cache.get(room);
	if (hit) return hit;
	const c = getDoorCenter(room);
	const x = gate(room.left + 2, c.x, room.right - 2);
	const y = gate(room.top + 2, c.y, room.bottom - 2);
	const r: Rect = { left: x - 1, top: y - 1, right: x + 1, bottom: y + 1 };
	cache.set(room, r);
	return r;
}

function rectWidth(r: Rect): number { return r.right - r.left; }
function rectHeight(r: Rect): number { return r.bottom - r.top; }
function rectSquare(r: Rect): number { return rectWidth(r) * rectHeight(r); }

/** `TunnelRoom.paint()`: straight lines from each door inward to the connection space. */
function paintTunnel(level: PaintLevel, room: Room, floor: number, space: Rect): void {
	for (const door of room.connected.values()) {
		if (!door) continue;
		const start = { x: door.x, y: door.y };
		if (start.x === room.left) start.x++;
		else if (start.y === room.top) start.y++;
		else if (start.x === room.right) start.x--;
		else if (start.y === room.bottom) start.y--;

		let rightShift: number;
		let downShift: number;
		if (start.x < space.left) rightShift = space.left - start.x;
		else if (start.x > space.right) rightShift = space.right - start.x;
		else rightShift = 0;
		if (start.y < space.top) downShift = space.top - start.y;
		else if (start.y > space.bottom) downShift = space.bottom - start.y;
		else downShift = 0;

		let mid: { x: number; y: number };
		let end: { x: number; y: number };
		// always goes inward first
		if (door.x === room.left || door.x === room.right) {
			mid = { x: start.x + rightShift, y: start.y };
			end = { x: mid.x, y: mid.y + downShift };
		} else {
			mid = { x: start.x, y: start.y + downShift };
			end = { x: mid.x + rightShift, y: mid.y };
		}
		drawLine(level, start, mid, floor);
		drawLine(level, mid, end, floor);
	}

	// "fill in an extra diagonal tile at center randomly if we're a larger room with many
	// connections" - two more Random.Int(2) draws, but only in this narrow case.
	if (room.width() >= 7 && room.height() >= 7 && room.connected.size > 4 && rectSquare(space) === 0) {
		const p = { x: space.left, y: space.top };
		p.x += SpdRandom.int(2) === 0 ? 1 : -1;
		p.y += SpdRandom.int(2) === 0 ? 1 : -1;
		p.x = gate(room.left + 1, p.x, room.right - 1);
		p.y = gate(room.top + 1, p.y, room.bottom - 1);
		set(level, p.x, p.y, floor);
	}
}

// ---------------------------------------------------------------------------------------------
// PerimeterRoom.fillPerimiterPaths() and its helpers - no RNG, pure geometry.
// ---------------------------------------------------------------------------------------------

function spaceBetween(a: number, b: number): number { return Math.abs(a - b) - 1; }

function distanceBetweenPoints(r: Room, a: { x: number; y: number }, b: { x: number; y: number }): number {
	if (((a.x === r.left + 1 || a.x === r.right - 1) && a.y === b.y)
		|| ((a.y === r.top + 1 || a.y === r.bottom - 1) && a.x === b.x)) {
		return Math.max(spaceBetween(a.x, b.x), spaceBetween(a.y, b.y));
	}
	return Math.min(spaceBetween(r.left, a.x) + spaceBetween(r.left, b.x),
		spaceBetween(r.right, a.x) + spaceBetween(r.right, b.x))
		+ Math.min(spaceBetween(r.top, a.y) + spaceBetween(r.top, b.y),
			spaceBetween(r.bottom, a.y) + spaceBetween(r.bottom, b.y))
		- 1;
}

function fillBetweenPoints(
	level: PaintLevel, r: Room,
	from: { x: number; y: number }, to: { x: number; y: number },
	floor: number, cornersRef: { corners: { x: number; y: number }[] | null },
): void {
	if (((from.x === r.left + 1 || from.x === r.right - 1) && from.x === to.x)
		|| ((from.y === r.top + 1 || from.y === r.bottom - 1) && from.y === to.y)) {
		fillXY(level,
			Math.min(from.x, to.x),
			Math.min(from.y, to.y),
			spaceBetween(from.x, to.x) + 2,
			spaceBetween(from.y, to.y) + 2,
			floor);
		return;
	}
	if (cornersRef.corners === null) {
		cornersRef.corners = [
			{ x: r.left + 1, y: r.top + 1 },
			{ x: r.right - 1, y: r.top + 1 },
			{ x: r.right - 1, y: r.bottom - 1 },
			{ x: r.left + 1, y: r.bottom - 1 },
		];
	}
	for (const c of cornersRef.corners) {
		if ((c.x === from.x || c.y === from.y) && (c.x === to.x || c.y === to.y)) {
			drawLine(level, from, c, floor);
			drawLine(level, c, to, floor);
			return;
		}
	}
	let side: { x: number; y: number };
	if (from.y === r.top + 1 || from.y === r.bottom - 1) {
		if (spaceBetween(r.left, from.x) + spaceBetween(r.left, to.x)
			<= spaceBetween(r.right, from.x) + spaceBetween(r.right, to.x)) {
			side = { x: r.left + 1, y: r.top + Math.floor(r.height() / 2) };
		} else {
			side = { x: r.right - 1, y: r.top + Math.floor(r.height() / 2) };
		}
	} else {
		if (spaceBetween(r.top, from.y) + spaceBetween(r.top, to.y)
			<= spaceBetween(r.bottom, from.y) + spaceBetween(r.bottom, to.y)) {
			side = { x: r.left + Math.floor(r.width() / 2), y: r.top + 1 };
		} else {
			side = { x: r.left + Math.floor(r.width() / 2), y: r.bottom - 1 };
		}
	}
	fillBetweenPoints(level, r, from, side, floor, cornersRef);
	fillBetweenPoints(level, r, side, to, floor, cornersRef);
}

/**
 * `PerimeterRoom.fillPerimiterPaths()` - greedy nearest-point stitching around the perimeter.
 * Exported: also called directly by `ThinPillarsGooRoom`/`ThickPillarsGooRoom.paint()` (see
 * `rooms/sewerBoss/gooBossRoom.ts`), matching Java's static-method reuse across packages.
 */
export function fillPerimeterPaths(level: PaintLevel, r: Room, floor: number): void {
	const cornersRef: { corners: { x: number; y: number }[] | null } = { corners: null };
	const pointsToFill: { x: number; y: number }[] = [];
	for (const door of r.connected.values()) {
		if (!door) continue;
		const p = { x: door.x, y: door.y };
		if (p.y === r.top) p.y++;
		else if (p.y === r.bottom) p.y--;
		else if (p.x === r.left) p.x++;
		else p.x--;
		pointsToFill.push(p);
	}
	if (pointsToFill.length === 0) return;
	const pointsFilled: { x: number; y: number }[] = [pointsToFill.shift()!];
	while (pointsToFill.length > 0) {
		let shortest = Number.MAX_SAFE_INTEGER;
		let from: { x: number; y: number } | null = null;
		let to: { x: number; y: number } | null = null;
		for (const f of pointsFilled) {
			for (const t of pointsToFill) {
				const dist = distanceBetweenPoints(r, f, t);
				if (dist < shortest) { from = f; to = t; shortest = dist; }
			}
		}
		if (!from || !to) break;
		fillBetweenPoints(level, r, from, to, floor, cornersRef);
		pointsFilled.push(to);
		pointsToFill.splice(pointsToFill.indexOf(to), 1);
	}
}

/**
 * `BridgeRoom`/`RingBridgeRoom`/`WalkwayRoom`'s shared trailing block: carve CHASM across the
 * shared edge with any neighbouring bridge/walkway room. No RNG.
 */
function chasmJoinNeighbours(level: PaintLevel, room: Room): void {
	for (const n of room.neigbours) {
		const k = n.connectionKind;
		if (n.kind !== 'connection') continue;
		if (k !== 'bridge' && k !== 'ringBridge' && k !== 'walkway') continue;
		const i = room.intersect(n);
		const iw = i.right - i.left;
		const ih = i.bottom - i.top;
		let { left, top, right, bottom } = i;
		if (iw !== 0) { left++; right--; } else { top++; bottom--; }
		fillXY(level, left, top, (right - left) + 1, (bottom - top) + 1, Terrain.CHASM);
	}
}

/**
 * Cache for `RingTunnelRoom.connSpace`, which Java holds as a per-instance field - so
 * `getDoorCenter()`'s two draws happen exactly once per ring room even though `paint()` asks for
 * the connection space twice. Keyed weakly by room, so it needs no per-level reset (Room
 * instances are discarded after each generation).
 */
const ringSpaceCache = new WeakMap<Room, Rect>();

/**
 * Dispatch for all 7 connection-room kinds. `tunnelTile` is the caller's resolved
 * `Level.tunnelTile()`; `paintMaze` is injected to avoid a cyclic import with the secret-room maze.
 */
export function paintConnectionRoom(
	level: PaintLevel, room: Room, tunnelTile: number,
	paintMaze: (level: PaintLevel, room: Room, floor: number) => void,
): void {
	const kind = room.kind === 'mazeConnection' ? 'mazeConnection' : room.connectionKind ?? 'tunnel';
	const floor = tunnelTile;

	switch (kind) {
		case 'tunnel':
			paintTunnel(level, room, floor, tunnelConnectionSpace(room));
			break;

		case 'bridge':
			// BridgeRoom extends TunnelRoom: chasm fill, then super.paint(), then chasm joins.
			if (Math.min(room.width(), room.height()) > 3) fillRoomInset(level, room, 1, Terrain.CHASM);
			paintTunnel(level, room, floor, tunnelConnectionSpace(room));
			chasmJoinNeighbours(level, room);
			break;

		case 'perimeter':
			fillPerimeterPaths(level, room, floor);
			break;

		case 'walkway':
			// WalkwayRoom extends PerimeterRoom.
			if (Math.min(room.width(), room.height()) > 3) fillRoomInset(level, room, 1, Terrain.CHASM);
			fillPerimeterPaths(level, room, floor);
			chasmJoinNeighbours(level, room);
			break;

		case 'ringTunnel': {
			// RingTunnelRoom extends TunnelRoom: super.paint() uses the (cached) ring space, then
			// the 3x3 ring is stamped with a wall pip in its middle.
			const ring = ringConnectionSpace(room, ringSpaceCache);
			paintTunnel(level, room, floor, ring);
			fillXY(level, ring.left, ring.top, 3, 3, floor);
			fillXY(level, ring.left + 1, ring.top + 1, 1, 1, Terrain.WALL);
			break;
		}

		case 'ringBridge': {
			// RingBridgeRoom extends RingTunnelRoom - unconditional chasm fill first.
			fillRoomInset(level, room, 1, Terrain.CHASM);
			const ring = ringConnectionSpace(room, ringSpaceCache);
			paintTunnel(level, room, floor, ring);
			fillXY(level, ring.left, ring.top, 3, 3, floor);
			fillXY(level, ring.left + 1, ring.top + 1, 1, 1, Terrain.WALL);
			chasmJoinNeighbours(level, room);
			break;
		}

		case 'mazeConnection':
			// MazeConnectionRoom.paint(): EMPTY inset, grow a maze, stamp its FILLED cells as
			// WALL - then sets its doors HIDDEN, not TUNNEL (it leads to a SecretRoom).
			paintMaze(level, room, floor);
			for (const door of room.connected.values()) {
				if (door) door.set(DoorType.HIDDEN);
			}
			return;
	}

	// Every tunnel/bridge/perimeter/walkway room ends by marking all its doors TUNNEL.
	for (const door of room.connected.values()) {
		if (door) door.set(DoorType.TUNNEL);
	}
}
