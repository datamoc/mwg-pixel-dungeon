/** Port of `levels/rooms/special/WeakFloorRoom.java`. Fully portable - no item/mob-generator
 *  dependency at all; the `HiddenWell` custom-tile visual is a rendering concern out of scope
 *  for level-gen. */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, drawInside, set } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';

export function paintWeakFloorRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.CHASM);

	const door = room.entranceDoor();
	door.set(DoorType.REGULAR);

	let well: { x: number; y: number };
	if (door.x === room.left) {
		for (let i = room.top + 1; i < room.bottom; i++) {
			drawInside(level, room, { x: room.left, y: i }, SpdRandom.intRange(1, room.width() - 4), Terrain.EMPTY_SP);
		}
		well = { x: room.right - 1, y: SpdRandom.int(2) === 0 ? room.top + 2 : room.bottom - 1 };
	} else if (door.x === room.right) {
		for (let i = room.top + 1; i < room.bottom; i++) {
			drawInside(level, room, { x: room.right, y: i }, SpdRandom.intRange(1, room.width() - 4), Terrain.EMPTY_SP);
		}
		well = { x: room.left + 1, y: SpdRandom.int(2) === 0 ? room.top + 2 : room.bottom - 1 };
	} else if (door.y === room.top) {
		for (let i = room.left + 1; i < room.right; i++) {
			drawInside(level, room, { x: i, y: room.top }, SpdRandom.intRange(1, room.height() - 4), Terrain.EMPTY_SP);
		}
		well = { x: SpdRandom.int(2) === 0 ? room.left + 1 : room.right - 1, y: room.bottom - 1 };
	} else {
		for (let i = room.left + 1; i < room.right; i++) {
			drawInside(level, room, { x: i, y: room.bottom }, SpdRandom.intRange(1, room.height() - 4), Terrain.EMPTY_SP);
		}
		well = { x: SpdRandom.int(2) === 0 ? room.left + 1 : room.right - 1, y: room.top + 2 };
	}

	set(level, well.x, well.y, Terrain.CHASM);
}
