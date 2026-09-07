/** Port of `levels/rooms/standard/EmptyRoom.java`. */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset } from '../../paintLevel';

export function paintEmptyRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY);
	for (const door of room.connected.values()) door?.set(DoorType.REGULAR);
}
