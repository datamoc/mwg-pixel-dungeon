/** Port of `levels/rooms/special/MagicWellRoom.java`. Fully portable - the well-water-type pick
 *  (`Random.element`) is a local 2-element array, no Generator dependency at all. */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, set } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';

const WATERS = ['waterOfAwareness', 'waterOfHealth'];

export function paintMagicWellRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY);

	const c = room.center();
	set(level, c.x, c.y, Terrain.WELL);

	const waterKind = SpdRandom.element(WATERS);
	level.mobs.push({ pos: level.pointToCell(c), kind: 'wellWater:' + waterKind });

	room.entranceDoor().set(DoorType.REGULAR);
}
