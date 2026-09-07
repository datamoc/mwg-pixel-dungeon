/** Port of `levels/rooms/standard/RuinsRoom.java`. Extends `PatchRoom` (like `CaveRoom`/
 *  `BurnedRoom`); `canMerge()` unconditionally true is modeled in `regularPainter.ts`'s
 *  `canMergeAt` (keyed on `standardKind === 'ruins'`), not here. The patch here re-applies WALL
 *  into an otherwise-open room (rubble), the opposite direction from `ChasmRoom`'s CHASM patch. */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset } from '../../paintLevel';
import { setupPatch, xyToPatchCoords, cleanDiagonalEdges } from './patchRoom';

export function paintRuinsRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY);
	for (const door of room.connected.values()) door?.set(DoorType.REGULAR);

	// fill scales from ~20% at 4x4 to ~50% at 18x18 (normal/large/giant bands per the Java comment).
	const scale = Math.min(room.width() * room.height(), 18 * 18);
	const fill = 0.2 + scale / 1024;

	const patch = setupPatch(room, fill, 0, room.connected.size > 0);
	cleanDiagonalEdges(patch, room.width() - 2);

	for (let i = room.top + 1; i < room.bottom; i++) {
		for (let j = room.left + 1; j < room.right; j++) {
			if (patch[xyToPatchCoords(room, j, i)]) {
				level.map[i * level.w + j] = Terrain.WALL;
			}
		}
	}
}
