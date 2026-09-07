/** Port of `levels/rooms/standard/MinefieldRoom.java`. */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, setCell, neighbours8 } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';

export function paintMinefieldRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY);
	for (const door of room.connected.values()) door?.set(DoorType.REGULAR);

	let mines = Math.round(Math.sqrt(room.square()));
	switch (room.sizeCat!.name) {
		case 'NORMAL': mines -= 3; break;
		case 'LARGE': mines += 3; break;
		case 'GIANT': mines += 9; break;
	}

	const n8 = neighbours8(level);
	for (let i = 0; i < mines; i++) {
		let pos: number;
		do {
			const p = room.random(1);
			pos = level.pointToCell(p);
		} while (level.traps.has(pos));

		for (let j = 0; j < 8; j++) {
			const c = n8[SpdRandom.int(8)];
			if (!level.traps.has(pos + c) && level.map[pos + c] === Terrain.EMPTY) {
				setCell(level, pos + c, Terrain.EMBERS);
			}
		}

		setCell(level, pos, Terrain.SECRET_TRAP);
		level.setTrap('explosive', true, true, pos);
	}
}
