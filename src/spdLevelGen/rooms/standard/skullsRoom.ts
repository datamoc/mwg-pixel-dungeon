/** Port of `levels/rooms/standard/SkullsRoom.java`. `minWidth()`/`minHeight()` floor at 7 and
 *  `sizeCatProbs()` ({0,3,1}) are modeled via `room.ts`'s `STANDARD_ROOM_META`, not here. Four
 *  nested ellipses: WALL, then EMPTY inset 2, then STATUE inset 4, then WALL inset 6 - a ring of
 *  statues around an open floor, itself ringed by wall.
 */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillEllipseRoom, drawInside } from '../../paintLevel';

export function paintSkullsRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillEllipseRoom(level, room, 2, Terrain.EMPTY);

	for (const door of room.connected.values()) {
		if (!door) continue;
		door.set(DoorType.REGULAR);
		if (door.x === room.left || door.x === room.right) {
			drawInside(level, room, door, Math.floor(room.width() / 2), Terrain.EMPTY);
		} else {
			drawInside(level, room, door, Math.floor(room.height() / 2), Terrain.EMPTY);
		}
	}

	fillEllipseRoom(level, room, 4, Terrain.STATUE);
	fillEllipseRoom(level, room, 6, Terrain.WALL);
}
