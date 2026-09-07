/** Port of `levels/rooms/standard/FissureRoom.java`. */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, set } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';

export function paintFissureRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	for (const door of room.connected.values()) door?.set(DoorType.REGULAR);
	fillRoomInset(level, room, 1, Terrain.EMPTY);

	if (room.square() <= 25) {
		const p = room.center();
		set(level, p.x, p.y, Terrain.CHASM);
	} else {
		const smallestDim = Math.min(room.width(), room.height());
		const floorW = Math.floor(Math.sqrt(smallestDim));
		let edgeFloorChance = Math.sqrt(smallestDim) % 1;
		edgeFloorChance = (edgeFloorChance + (floorW - 1) * 0.5) / floorW;

		for (let i = room.top + 2; i <= room.bottom - 2; i++) {
			for (let j = room.left + 2; j <= room.right - 2; j++) {
				const v = Math.min(i - room.top, room.bottom - i);
				const h = Math.min(j - room.left, room.right - j);
				if (Math.min(v, h) > floorW || (Math.min(v, h) === floorW && SpdRandom.float() > edgeFloorChance)) {
					set(level, j, i, Terrain.CHASM);
				}
			}
		}
	}
}
