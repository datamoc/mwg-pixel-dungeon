/** Port of `levels/rooms/standard/StripedRoom.java`. */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, fillXY } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';

export function paintStripedRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	for (const door of room.connected.values()) door?.set(DoorType.REGULAR);

	if (room.sizeCat!.name === 'NORMAL') {
		fillRoomInset(level, room, 1, Terrain.EMPTY_SP);
		if (room.width() > room.height() || (room.width() === room.height() && SpdRandom.int(2) === 0)) {
			for (let i = room.left + 2; i < room.right; i += 2) {
				fillXY(level, i, room.top + 1, 1, room.height() - 2, Terrain.HIGH_GRASS);
			}
		} else {
			for (let i = room.top + 2; i < room.bottom; i += 2) {
				fillXY(level, room.left + 1, i, room.width() - 2, 1, Terrain.HIGH_GRASS);
			}
		}
	} else if (room.sizeCat!.name === 'LARGE') {
		const layers = Math.floor((Math.min(room.width(), room.height()) - 1) / 2);
		for (let i = 1; i <= layers; i++) {
			fillRoomInset(level, room, i, i % 2 === 1 ? Terrain.EMPTY_SP : Terrain.HIGH_GRASS);
		}
	}
}
