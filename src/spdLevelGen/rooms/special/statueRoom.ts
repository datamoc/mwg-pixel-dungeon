/** Port of `levels/rooms/special/StatueRoom.java`. The room's own geometry uses no RNG, but
 *  `Statue.random()` at the end does: the 1-in-10 armored-variant roll plus the statue
 *  constructor's full enchanted weapon (and armor, when armored) - see `randomStatue()`. */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, fillXY } from '../../paintLevel';
import { randomStatue } from '../../../spdItems/generator';

export function paintStatueRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY);

	const c = room.center();
	let cx = c.x, cy = c.y;

	const door = room.entranceDoor();
	door.set(DoorType.LOCKED);
	level.drop('ironKey', level.pointToCell(door), 'itemToSpawn');

	if (door.x === room.left) {
		fillXY(level, room.right - 1, room.top + 1, 1, room.height() - 2, Terrain.STATUE);
		cx = room.right - 2;
	} else if (door.x === room.right) {
		fillXY(level, room.left + 1, room.top + 1, 1, room.height() - 2, Terrain.STATUE);
		cx = room.left + 2;
	} else if (door.y === room.top) {
		fillXY(level, room.left + 1, room.bottom - 1, room.width() - 2, 1, Terrain.STATUE);
		cy = room.bottom - 2;
	} else if (door.y === room.bottom) {
		fillXY(level, room.left + 1, room.top + 1, room.width() - 2, 1, Terrain.STATUE);
		cy = room.top + 2;
	}

	// `Statue statue = Statue.random()` - retain the generated objects as the mob payload so
	// the live bridge can drop the same enchanted weapon (and armored-statue armor) on death.
	const statue = randomStatue();
	level.mobs.push({
		pos: cx + cy * level.width(),
		kind: statue.armored ? 'armoredStatue' : 'statue',
		loot: `statue:${JSON.stringify(statue)}`,
	});
}
