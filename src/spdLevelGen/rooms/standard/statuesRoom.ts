/**
 * Port of `levels/rooms/standard/StatuesRoom.java`. `sizeCatProbs()` ({9,3,1}) and `minWidth()`/
 * `minHeight()` (floor 7) are modeled via `room.ts`'s `STANDARD_ROOM_META`, not here. Tiles a grid
 * of statue alcoves (`rows` x `cols`, sized from the room's own dimensions) across the interior.
 */
import { Room, Door, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, fillXY, set } from '../../paintLevel';

export function paintStatuesRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY);

	for (const door of room.connected.values() as IterableIterator<Door | null>) {
		if (door) door.set(DoorType.REGULAR);
	}

	const rows = Math.floor((room.width() + 1) / 6);
	const cols = Math.floor((room.height() + 1) / 6);

	const w = Math.floor((room.width() - 4 - (rows - 1)) / rows);
	const h = Math.floor((room.height() - 4 - (cols - 1)) / cols);

	const wSpacing = rows % 2 === room.width() % 2 ? 2 : 1;
	const hSpacing = cols % 2 === room.height() % 2 ? 2 : 1;

	for (let x = 0; x < rows; x++) {
		for (let y = 0; y < cols; y++) {
			const left = room.left + 2 + x * (w + wSpacing);
			const top = room.top + 2 + y * (h + hSpacing);

			fillXY(level, left, top, w, h, Terrain.EMPTY_SP);

			set(level, left, top, Terrain.STATUE_SP);
			set(level, left + w - 1, top, Terrain.STATUE_SP);
			set(level, left, top + h - 1, Terrain.STATUE_SP);
			set(level, left + w - 1, top + h - 1, Terrain.STATUE_SP);

			if (w >= 5 && h >= 5) {
				fillXY(level, left + 2, top + 2, w - 4, h - 4, Terrain.STATUE_SP);
			}
		}
	}
}
