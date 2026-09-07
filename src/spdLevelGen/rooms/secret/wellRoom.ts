/** Port of `levels/rooms/secret/SecretWellRoom.java`. `canConnect(Point)`'s corner-refusal
 *  override lives in `room.ts`'s `canConnectPoint`. Fully real/portable: the well-position
 *  geometry is deterministic off the door side, and `Random.element(WATERS)` is a real 2-element
 *  fixed-array pick (not Generator-internal) - fully reproducible. `WellWater.seed()` (blob
 *  system) has no `Random.*` call in Java and isn't modeled here regardless. */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillXY, drawLine, set } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';

const WATERS = ['awareness', 'health'];

export function paintWellRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	const door = room.entranceDoor();

	let well: { x: number; y: number };
	if (door.x === room.left) well = { x: room.right - 2, y: door.y };
	else if (door.x === room.right) well = { x: room.left + 2, y: door.y };
	else if (door.y === room.top) well = { x: door.x, y: room.bottom - 2 };
	else well = { x: door.x, y: room.top + 2 };

	fillXY(level, well.x - 1, well.y - 1, 3, 3, Terrain.CHASM);
	drawLine(level, { x: door.x, y: door.y }, well, Terrain.EMPTY);
	set(level, well.x, well.y, Terrain.WELL);

	const waterKind = SpdRandom.element(WATERS);
	// WellWater.seed(): no Random.* call in Java; no blob system exists here, so the picked kind is
	// recorded as a plant tag purely so the verify script can show which water this well rolled.
	level.plant(`wellWater:${waterKind}`, level.pointToCell(well));

	door.set(DoorType.HIDDEN);
}
