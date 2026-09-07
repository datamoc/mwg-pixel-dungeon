/** Port of `levels/rooms/standard/ChasmRoom.java`. Extends `PatchRoom`, applying CHASM (not WALL)
 *  into the room interior - the opposite direction from `RuinsRoom`'s rubble patch. Its `merge()`
 *  override (CHASM-merging with another `ChasmRoom`/`PlatformRoom`) is modeled in
 *  `regularPainter.ts`'s `mergeFill`, not here. */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset } from '../../paintLevel';
import { setupPatch, xyToPatchCoords, cleanDiagonalEdges } from './patchRoom';

export function paintChasmRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY);
	for (const door of room.connected.values()) door?.set(DoorType.REGULAR);

	// fill scales from ~30% at 4x4 to ~60% at 18x18 (normal/large/giant bands per the Java comment).
	const scale = Math.min(room.width() * room.height(), 18 * 18);
	const fill = 0.3 + scale / 1024;

	const patch = setupPatch(room, fill, 1, room.connected.size > 0);
	cleanDiagonalEdges(patch, room.width() - 2);

	for (let i = room.top + 1; i < room.bottom; i++) {
		for (let j = room.left + 1; j < room.right; j++) {
			if (patch[xyToPatchCoords(room, j, i)]) {
				level.map[i * level.w + j] = Terrain.CHASM;
			}
		}
	}
}
