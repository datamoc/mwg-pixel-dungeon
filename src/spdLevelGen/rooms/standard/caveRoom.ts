/** Port of `levels/rooms/standard/CaveRoom.java`. Extends `PatchRoom` in Java (like `BurnedRoom`);
 *  unlike `BurnedRoom`, `CaveRoom` doesn't override `canPlaceWater`/`canPlaceGrass`/`canPlaceTrap`,
 *  so its patch is only used here to carve WALL back into the room, not stored on `Room.patch`. */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset } from '../../paintLevel';
import { setupPatch, xyToPatchCoords, cleanDiagonalEdges } from './patchRoom';

export function paintCaveRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY);
	for (const door of room.connected.values()) door?.set(DoorType.REGULAR);

	// fill scales from ~30% at 4x4 to ~60% at 18x18 (normal/large/giant bands per the Java comment).
	const scale = Math.min(room.width() * room.height(), 18 * 18);
	const fill = 0.3 + scale / 1024;

	const patch = setupPatch(room, fill, 3, room.connected.size > 0);
	cleanDiagonalEdges(patch, room.width() - 2);

	for (let i = room.top + 1; i < room.bottom; i++) {
		for (let j = room.left + 1; j < room.right; j++) {
			if (patch[xyToPatchCoords(room, j, i)]) {
				level.map[i * level.w + j] = Terrain.WALL;
			}
		}
	}
}
