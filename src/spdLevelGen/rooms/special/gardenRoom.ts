/** Port of `levels/rooms/special/GardenRoom.java`. The bush-type roll, its nested 20% roll, and
 *  each `plantPos()` position retry (against real `level.plants` occupancy) are fully local -
 *  no Generator dependency at all for this room. The `Foliage` ambient-light blob seeding loop
 *  has no RNG in Java and isn't modeled (a lighting/rendering concern, not level-gen). */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';

function plantPos(level: PaintLevel, room: Room): number {
	let pos: number;
	do { pos = level.pointToCell(room.random()); } while (level.plants.some(p => p.pos === pos));
	return pos;
}

export function paintGardenRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.HIGH_GRASS);
	fillRoomInset(level, room, 2, Terrain.GRASS);

	room.entranceDoor().set(DoorType.REGULAR);

	const bushes = SpdRandom.int(3);
	if (bushes === 0) {
		level.plant('sungrass', plantPos(level, room));
	} else if (bushes === 1) {
		level.plant('blandfruit', plantPos(level, room));
	} else if (SpdRandom.int(5) === 0) {
		level.plant('sungrass', plantPos(level, room));
		level.plant('blandfruit', plantPos(level, room));
	}
}
