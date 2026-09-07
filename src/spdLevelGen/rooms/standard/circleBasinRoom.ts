/** Port of `levels/rooms/standard/CircleBasinRoom.java` (extends `PatchRoom`). Its `resize()`
 *  override (rejects even width/height) lives in sub-pass 1's `Room.setSize` if/when the graph
 *  stage is revisited for this class - not re-applied here since paint() doesn't call resize. */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillEllipseRoom, drawInside, drawLine, fillXY, set } from '../../paintLevel';
import { setupPatch, xyToPatchCoords } from './patchRoom';

export function paintCircleBasinRoom(level: PaintLevel, room: Room): void {
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

	drawLine(level,
		{ x: room.left + Math.floor(room.width() / 2), y: room.top + 3 },
		{ x: room.left + Math.floor(room.width() / 2), y: room.bottom - 3 },
		Terrain.EMPTY_SP);
	drawLine(level,
		{ x: room.left + 3, y: room.top + Math.floor(room.height() / 2) },
		{ x: room.right - 3, y: room.top + Math.floor(room.height() / 2) },
		Terrain.EMPTY_SP);

	if (room.width() > 11 || room.height() > 11) {
		const center = room.center();
		fillXY(level, center.x - 1, center.y - 1, 3, 3, Terrain.EMPTY_SP);
		set(level, center.x, center.y, Terrain.WALL);
	}

	const patch = setupPatch(room, 0.5, 5, true);
	for (let i = room.top + 1; i < room.bottom; i++) {
		for (let j = room.left + 1; j < room.right; j++) {
			const cell = i * level.w + j;
			if (level.map[cell] === Terrain.EMPTY && patch[xyToPatchCoords(room, j, i)]) {
				level.map[cell] = Terrain.WATER;
				if (level.map[cell - level.w] === Terrain.WALL) level.map[cell - level.w] = Terrain.WALL_DECO;
			}
		}
	}
}
