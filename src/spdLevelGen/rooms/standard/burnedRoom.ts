/** Port of `levels/rooms/standard/BurnedRoom.java`. */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';
import { setupPatch, xyToPatchCoords } from './patchRoom';

export function paintBurnedRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY);
	for (const door of room.connected.values()) door?.set(DoorType.REGULAR);

	// past 8x8 each point of width/height decreases fill by 3%
	const fill = Math.min(1, 1.48 - (room.width() + room.height()) * 0.03);
	const patch = setupPatch(room, fill, 2, false);
	// Java's `PatchRoom.patch` is an instance field, still live when `RegularPainter` later calls
	// `canPlaceWater`/`canPlaceGrass`/`canPlaceTrap` - keep it on the room, not just this scope.
	room.patch = patch;

	for (let i = room.top + 1; i < room.bottom; i++) {
		for (let j = room.left + 1; j < room.right; j++) {
			if (!patch[xyToPatchCoords(room, j, i)]) continue;
			const cell = i * level.w + j;
			// BurningTrap only (no Generator dependency) - fully portable.
			switch (SpdRandom.int(5)) {
				case 0: default:
					level.map[cell] = Terrain.EMPTY;
					break;
				case 1:
					level.map[cell] = Terrain.EMBERS;
					break;
				case 2:
					level.map[cell] = Terrain.TRAP;
					level.setTrap('burning', false, true, cell);
					break;
				case 3:
					level.map[cell] = Terrain.SECRET_TRAP;
					level.setTrap('burning', true, true, cell);
					break;
				case 4:
					level.map[cell] = Terrain.INACTIVE_TRAP;
					level.setTrap('burning', false, false, cell);
					break;
			}
		}
	}
}
