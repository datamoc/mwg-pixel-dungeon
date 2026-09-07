/** Port of `levels/rooms/standard/RingRoom.java`. */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset } from '../../paintLevel';

export function paintRingRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY);

	const minDim = Math.min(room.width(), room.height());
	const passageWidth = Math.floor(0.25 * (minDim + 1));
	fillRoomInset(level, room, passageWidth + 1, Terrain.WALL);

	for (const door of room.connected.values()) door?.set(DoorType.REGULAR);
}
