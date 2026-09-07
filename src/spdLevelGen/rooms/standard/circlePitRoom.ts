/** Port of `levels/rooms/standard/CirclePitRoom.java`. */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillEllipseRoom, drawInside } from '../../paintLevel';

export function paintCirclePitRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillEllipseRoom(level, room, 1, Terrain.EMPTY);

	for (const door of room.connected.values()) {
		if (!door) continue;
		door.set(DoorType.REGULAR);
		if (door.x === room.left || door.x === room.right) {
			drawInside(level, room, door, Math.floor(room.width() / 2), Terrain.EMPTY);
		} else {
			drawInside(level, room, door, Math.floor(room.height() / 2), Terrain.EMPTY);
		}
	}

	fillEllipseRoom(level, room, 3, Terrain.CHASM);
}
