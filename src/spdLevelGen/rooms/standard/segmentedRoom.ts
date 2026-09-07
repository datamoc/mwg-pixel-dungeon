/**
 * Port of `levels/rooms/standard/SegmentedRoom.java` (Prison-region `StandardRoom`, index 4 in
 * `StandardRoom.chances[6..10]`). Fully RNG-faithful - no `Generator`/mob dependency at all.
 *
 * `createWalls()` is recursive and its RNG consumption is highly data-dependent: each level of
 * recursion runs a `do { ... } while (--tries > 0)` loop that burns one `Random.IntRange` per
 * iteration (plus a second one, and two recursive descents, on the iteration that succeeds), for
 * up to 10 iterations. Note the loop does NOT break on success - it sets `tries = 0` and lets
 * `--tries > 0` end it, so `tries` goes 0 -> -1 and the loop exits after the successful pass.
 * That matters because the recursive `createWalls` calls happen INSIDE the successful iteration,
 * before the decrement, so their draws are nested in the middle of the parent's stream.
 */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, set, drawLine } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';

/**
 * Java's `com.watabou.utils.Rect`, NOT `Room` - `width()`/`height()` are the plain
 * `right - left`/`bottom - top` with no `+1`, which is why `createWalls` compares
 * `area.width()+1` against its minimum dimensions. Getting this wrong would change the
 * recursion's termination depth and therefore its whole RNG draw count.
 */
interface Rect { left: number; top: number; right: number; bottom: number }
const rectW = (r: Rect) => r.right - r.left;
const rectH = (r: Rect) => r.bottom - r.top;

export function paintSegmentedRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY);

	for (const door of room.connected.values()) {
		if (!door) continue;
		door.set(DoorType.REGULAR);
		// "set door areas to be empty to help with create walls logic" - this write is what
		// `createWalls`' `map[...] == Terrain.WALL` guards later read, so it must happen here,
		// before the recursion, not in the painter's later door pass.
		set(level, door.x, door.y, Terrain.EMPTY);
	}

	createWalls(level, { left: room.left + 1, top: room.top + 1, right: room.right - 1, bottom: room.bottom - 1 });
}

function createWalls(level: PaintLevel, area: Rect): void {
	const w = rectW(area);
	const h = rectH(area);
	if (Math.max(w + 1, h + 1) < 5 || Math.min(w + 1, h + 1) < 3) return;

	let tries = 10;

	// `area.width() > area.height() || (equal && Random.Int(2) == 0)` - the Int(2) is only drawn
	// on the tie, short-circuited away otherwise.
	if (w > h || (w === h && SpdRandom.int(2) === 0)) {
		// splitting top/bottom
		do {
			const splitX = SpdRandom.intRange(area.left + 2, area.right - 2);

			if (level.map[splitX + level.w * (area.top - 1)] === Terrain.WALL
				&& level.map[splitX + level.w * (area.bottom + 1)] === Terrain.WALL) {
				tries = 0;

				drawLine(level, { x: splitX, y: area.top }, { x: splitX, y: area.bottom }, Terrain.WALL);

				const spaceTop = SpdRandom.intRange(area.top, area.bottom - 1);
				set(level, splitX, spaceTop, Terrain.EMPTY);
				set(level, splitX, spaceTop + 1, Terrain.EMPTY);

				createWalls(level, { left: area.left, top: area.top, right: splitX - 1, bottom: area.bottom });
				createWalls(level, { left: splitX + 1, top: area.top, right: area.right, bottom: area.bottom });
			}
		} while (--tries > 0);
	} else {
		// splitting left/right
		do {
			const splitY = SpdRandom.intRange(area.top + 2, area.bottom - 2);

			if (level.map[area.left - 1 + level.w * splitY] === Terrain.WALL
				&& level.map[area.right + 1 + level.w * splitY] === Terrain.WALL) {
				tries = 0;

				drawLine(level, { x: area.left, y: splitY }, { x: area.right, y: splitY }, Terrain.WALL);

				const spaceLeft = SpdRandom.intRange(area.left, area.right - 1);
				set(level, spaceLeft, splitY, Terrain.EMPTY);
				set(level, spaceLeft + 1, splitY, Terrain.EMPTY);

				createWalls(level, { left: area.left, top: area.top, right: area.right, bottom: splitY - 1 });
				createWalls(level, { left: area.left, top: splitY + 1, right: area.right, bottom: area.bottom });
			}
		} while (--tries > 0);
	}
}
