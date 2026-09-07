/**
 * Port of `levels/rooms/standard/SegmentedLibraryRoom.java` (City-region `StandardRoom`, index 11
 * in `StandardRoom.chances[16..20]`). `sizeCatProbs()` ({0,3,1}) is modeled via `room.ts`'s
 * `STANDARD_ROOM_META`. Recursive wall-splitting is `SegmentedRoom.java`'s algorithm with BOOKSHELF
 * in place of WALL, a 4/3 (not 5/3) minimum-area cutoff, one EMPTY_SP gap cell per split (not two),
 * and the recursion area inset by 2 (not 1) - see `segmentedRoom.ts`'s own comment for the shared
 * `do { ... } while (--tries > 0)` RNG-consumption shape this mirrors.
 */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, set, drawLine, drawInside } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';

interface Rect { left: number; top: number; right: number; bottom: number }
const rectW = (r: Rect) => r.right - r.left;
const rectH = (r: Rect) => r.bottom - r.top;

export function paintSegmentedLibraryRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.BOOKSHELF);
	fillRoomInset(level, room, 2, Terrain.EMPTY_SP);

	for (const door of room.connected.values()) {
		if (!door) continue;
		door.set(DoorType.REGULAR);
		// "set door areas to be empty to help with create walls logic"
		drawInside(level, room, door, 2, Terrain.EMPTY_SP);
	}

	createWalls(level, { left: room.left + 2, top: room.top + 2, right: room.right - 2, bottom: room.bottom - 2 });
}

function createWalls(level: PaintLevel, area: Rect): void {
	const w = rectW(area);
	const h = rectH(area);
	if (Math.max(w + 1, h + 1) < 4 || Math.min(w + 1, h + 1) < 3) return;

	let tries = 10;

	if (w > h || (w === h && SpdRandom.int(2) === 0)) {
		// splitting top/bottom
		do {
			const splitX = SpdRandom.intRange(area.left + 2, area.right - 2);

			if (level.map[splitX + level.w * (area.top - 1)] === Terrain.BOOKSHELF
				&& level.map[splitX + level.w * (area.bottom + 1)] === Terrain.BOOKSHELF) {
				tries = 0;

				drawLine(level, { x: splitX, y: area.top }, { x: splitX, y: area.bottom }, Terrain.BOOKSHELF);

				const spaceTop = SpdRandom.intRange(area.top, area.bottom - 1);
				set(level, splitX, spaceTop, Terrain.EMPTY_SP);

				createWalls(level, { left: area.left, top: area.top, right: splitX - 1, bottom: area.bottom });
				createWalls(level, { left: splitX + 1, top: area.top, right: area.right, bottom: area.bottom });
			}
		} while (--tries > 0);
	} else {
		// splitting left/right
		do {
			const splitY = SpdRandom.intRange(area.top + 2, area.bottom - 2);

			if (level.map[area.left - 1 + level.w * splitY] === Terrain.BOOKSHELF
				&& level.map[area.right + 1 + level.w * splitY] === Terrain.BOOKSHELF) {
				tries = 0;

				drawLine(level, { x: area.left, y: splitY }, { x: area.right, y: splitY }, Terrain.BOOKSHELF);

				const spaceLeft = SpdRandom.intRange(area.left, area.right - 1);
				set(level, spaceLeft, splitY, Terrain.EMPTY_SP);

				createWalls(level, { left: area.left, top: area.top, right: area.right, bottom: splitY - 1 });
				createWalls(level, { left: area.left, top: splitY + 1, right: area.right, bottom: area.bottom });
			}
		} while (--tries > 0);
	}
}
