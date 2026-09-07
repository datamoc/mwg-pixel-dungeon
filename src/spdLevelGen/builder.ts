/** Port of `levels/builders/Builder.java`'s static geometry helpers. */
import { Room, TOP, BOTTOM, RIGHT, LEFT } from './room';
import { SpdRandom } from '../spdRng';

export function findNeighbours(rooms: Room[]): void {
	for (let i = 0; i < rooms.length - 1; i++) {
		for (let j = i + 1; j < rooms.length; j++) {
			rooms[i].addNeigbour(rooms[j]);
		}
	}
}

interface RectBounds { left: number; top: number; right: number; bottom: number; }

/** Returns a rectangle representing the maximum amount of free space from a specific start point. */
export function findFreeSpace(start: { x: number; y: number }, collision: Room[], maxSize: number): RectBounds {
	const space: RectBounds = { left: start.x - maxSize, top: start.y - maxSize, right: start.x + maxSize, bottom: start.y + maxSize };

	let colliding = collision.slice();
	do {
		colliding = colliding.filter(room =>
			!(room.isEmpty()
				|| Math.max(space.left, room.left) >= Math.min(space.right, room.right)
				|| Math.max(space.top, room.top) >= Math.min(space.bottom, room.bottom)));

		let closestRoom: Room | null = null;
		let closestDiff = Number.MAX_SAFE_INTEGER;
		let inside = true;
		let curDiff = 0;

		for (const curRoom of colliding) {
			if (start.x <= curRoom.left) { inside = false; curDiff += curRoom.left - start.x; }
			else if (start.x >= curRoom.right) { inside = false; curDiff += start.x - curRoom.right; }

			if (start.y <= curRoom.top) { inside = false; curDiff += curRoom.top - start.y; }
			else if (start.y >= curRoom.bottom) { inside = false; curDiff += start.y - curRoom.bottom; }

			if (inside) {
				space.left = space.right = start.x;
				space.top = space.bottom = start.y;
				return space;
			}
			if (curDiff < closestDiff) { closestDiff = curDiff; closestRoom = curRoom; }
		}

		if (closestRoom) {
			let wDiff = Number.MAX_SAFE_INTEGER;
			if (closestRoom.left >= start.x) wDiff = (space.right - closestRoom.left) * ((space.bottom - space.top) + 1);
			else if (closestRoom.right <= start.x) wDiff = (closestRoom.right - space.left) * ((space.bottom - space.top) + 1);

			let hDiff = Number.MAX_SAFE_INTEGER;
			if (closestRoom.top >= start.y) hDiff = (space.bottom - closestRoom.top) * ((space.right - space.left) + 1);
			else if (closestRoom.bottom <= start.y) hDiff = (closestRoom.bottom - space.top) * ((space.right - space.left) + 1);

			if (wDiff < hDiff || (wDiff === hDiff && SpdRandom.int(2) === 0)) {
				if (closestRoom.left >= start.x && closestRoom.left < space.right) space.right = closestRoom.left;
				if (closestRoom.right <= start.x && closestRoom.right > space.left) space.left = closestRoom.right;
			} else {
				if (closestRoom.top >= start.y && closestRoom.top < space.bottom) space.bottom = closestRoom.top;
				if (closestRoom.bottom <= start.y && closestRoom.bottom > space.top) space.top = closestRoom.bottom;
			}
			colliding = colliding.filter(r => r !== closestRoom);
		} else {
			colliding = [];
		}
	} while (colliding.length > 0);

	return space;
}

const A = 180 / Math.PI;

/** Angle in degrees made by the centerpoints of 2 rooms, 0 being straight up. */
export function angleBetweenRooms(from: Room, to: Room): number {
	const fromCenter = { x: (from.left + from.right) / 2, y: (from.top + from.bottom) / 2 };
	const toCenter = { x: (to.left + to.right) / 2, y: (to.top + to.bottom) / 2 };
	return angleBetweenPoints(fromCenter, toCenter);
}

/**
 * Java: `float angle = (float)(A*(Math.atan(m) + Math.PI/2.0)); if (...) angle -= 180f; return angle;`
 * `m`/`A*(...)` are `double`; the explicit `(float)` cast is the one narrowing point, and the
 * following `-= 180f` is itself float arithmetic on an already-float value - both need `fround`.
 */
export function angleBetweenPoints(from: { x: number; y: number }, to: { x: number; y: number }): number {
	const m = (to.y - from.y) / (to.x - from.x);
	let angle = Math.fround(A * (Math.atan(m) + Math.PI / 2.0));
	if (from.x > to.x) angle = Math.fround(angle - 180);
	return angle;
}

/** `Math.round(float)`: Java's float overload rounds via `floor(a + 0.5f)` at FLOAT precision, not double. */
/** Java's `Math.round(float)` - `(int)floor(a + 0.5f)`, evaluated at float precision, which is a
 *  genuinely different operation from `Math.round(double)`. Exported because room `paint()` ports
 *  need it too wherever Java rounds a `float` expression (e.g. `PillarsRoom`'s skew arithmetic). */
export function javaRoundFloat(a: number): number {
	return Math.floor(Math.fround(Math.fround(a) + 0.5));
}

function gate(min: number, value: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

/**
 * Attempts to place `next` such that the angle between the center of `prev` and it matches
 * `angle` ([0-360), 0 = straight up) as closely as possible. Returns the exact resulting angle,
 * or -1 on failure. This is the single most order-sensitive routine in the port: `findFreeSpace`'s
 * `Random.Int(2)` tie-break and `setSizeWithLimit`'s `Random.NormalIntRange` calls only happen
 * when control reaches them, so any earlier divergence changes what runs here too.
 */
export function placeRoom(collision: Room[], prev: Room, next: Room, angleDeg: number): number {
	// Java: `angle %= 360f; if (angle < 0) angle += 360f;` - `angle` is a `float` parameter/local.
	let angle = Math.fround(angleDeg % 360);
	if (angle < 0) angle = Math.fround(angle + 360);

	const prevCenter = { x: (prev.left + prev.right) / 2, y: (prev.top + prev.bottom) / 2 };

	const m = Math.tan(angle / A + Math.PI / 2.0);
	const b = prevCenter.y - m * prevCenter.x;

	let start: { x: number; y: number };
	let direction: typeof TOP | typeof BOTTOM | typeof RIGHT | typeof LEFT;
	if (Math.abs(m) >= 1) {
		if (angle < 90 || angle > 270) {
			direction = TOP;
			start = { x: Math.round((prev.top - b) / m), y: prev.top };
		} else {
			direction = BOTTOM;
			start = { x: Math.round((prev.bottom - b) / m), y: prev.bottom };
		}
	} else {
		if (angle < 180) {
			direction = RIGHT;
			start = { x: prev.right, y: Math.round(m * prev.right + b) };
		} else {
			direction = LEFT;
			start = { x: prev.left, y: Math.round(m * prev.left + b) };
		}
	}

	if (direction === TOP || direction === BOTTOM) {
		start.x = gate(prev.left + 1, start.x, prev.right - 1);
	} else {
		start.y = gate(prev.top + 1, start.y, prev.bottom - 1);
	}

	const space = findFreeSpace(start, collision, Math.max(next.maxWidth(), next.maxHeight()));
	if (!next.setSizeWithLimit(space.right - space.left + 1, space.bottom - space.top + 1)) {
		return -1;
	}

	/**
	 * `PointF targetCenter` fields are `float` in Java, and `Math.round(float)` (used below) is
	 * the FLOAT overload (`floor(a + 0.5f)`), distinct from the double one used above for `start`
	 * - both the field assignments and the final rounds need `fround`/`javaRoundFloat` to match.
	 */
	const targetCenter = { x: 0, y: 0 };
	if (direction === TOP) {
		targetCenter.y = Math.fround(prev.top - Math.fround((next.height() - 1) / 2));
		targetCenter.x = Math.fround((targetCenter.y - b) / m);
		next.setPos(javaRoundFloat(targetCenter.x - Math.fround((next.width() - 1) / 2)), prev.top - (next.height() - 1));
	} else if (direction === BOTTOM) {
		targetCenter.y = Math.fround(prev.bottom + Math.fround((next.height() - 1) / 2));
		targetCenter.x = Math.fround((targetCenter.y - b) / m);
		next.setPos(javaRoundFloat(targetCenter.x - Math.fround((next.width() - 1) / 2)), prev.bottom);
	} else if (direction === RIGHT) {
		targetCenter.x = Math.fround(prev.right + Math.fround((next.width() - 1) / 2));
		targetCenter.y = Math.fround(m * targetCenter.x + b);
		next.setPos(prev.right, javaRoundFloat(targetCenter.y - Math.fround((next.height() - 1) / 2)));
	} else {
		targetCenter.x = Math.fround(prev.left - Math.fround((next.width() - 1) / 2));
		targetCenter.y = Math.fround(m * targetCenter.x + b);
		next.setPos(prev.left - (next.width() - 1), javaRoundFloat(targetCenter.y - Math.fround((next.height() - 1) / 2)));
	}

	if (direction === TOP || direction === BOTTOM) {
		if (next.right < prev.left + 2) next.shift(prev.left + 2 - next.right, 0);
		else if (next.left > prev.right - 2) next.shift(prev.right - 2 - next.left, 0);

		if (next.right > space.right) next.shift(space.right - next.right, 0);
		else if (next.left < space.left) next.shift(space.left - next.left, 0);
	} else {
		if (next.bottom < prev.top + 2) next.shift(0, prev.top + 2 - next.bottom);
		else if (next.top > prev.bottom - 2) next.shift(0, prev.bottom - 2 - next.top);

		if (next.bottom > space.bottom) next.shift(0, space.bottom - next.bottom);
		else if (next.top < space.top) next.shift(0, space.top - next.top);
	}

	if (next.connect(prev)) {
		return angleBetweenRooms(prev, next);
	}
	return -1;
}
