/** Port of `levels/rooms/standard/ExitRoom.java`. */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset } from '../../paintLevel';

export function paintExitRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY);
	for (const door of room.connected.values()) door?.set(DoorType.REGULAR);

	const exit = level.pointToCell(room.random(2));
	level.map[exit] = Terrain.EXIT;
	level.transitions.push({ pos: exit, type: 'regularExit' });
}
