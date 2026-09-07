/** Port of `levels/rooms/secret/SecretChestChasmRoom.java`. `minWidth/maxWidth/minHeight/maxHeight`
 *  (8-9/8-9) live in `room.ts`'s `SECRET_ROOM_META`. Every position here is a fixed offset from the
 *  room's corners - no `Random.*` call in Java at all besides the four `Generator.randomUsingDefaults()`
 *  chest-content rolls, which now go through `randomUsingDefaultsAnyCategory()` - a real
 *  level-stream category roll plus that category's own draws (content dropped as a placeholder
 *  'lockedChest' tag; since nothing here can fail to drop, `chests` is always 4, so all four golden
 *  keys are always placed too - the real `if (chests > 0)` guards are kept for shape fidelity even
 *  though they're unconditionally true in this port). */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, set } from '../../paintLevel';
import { randomUsingDefaultsAnyCategory } from '../../../spdItems/generator';

export function paintChestChasmRoom(level: PaintLevel, room: Room, depth: number): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.CHASM);

	let chests = 0;
	const chestPts = [
		{ x: room.left + 3, y: room.top + 3 },
		{ x: room.right - 3, y: room.top + 3 },
		{ x: room.right - 3, y: room.bottom - 3 },
		{ x: room.left + 3, y: room.bottom - 3 },
	];
	for (const p of chestPts) {
		set(level, p.x, p.y, Terrain.EMPTY_SP);
		const pos = level.pointToCell(p);
		// `Generator.randomUsingDefaults()` (no-arg): rolls the category from `defaultCatProbs`
		// on the level stream, then that category's own draws. Previously skipped entirely.
		randomUsingDefaultsAnyCategory();
		level.drop('lockedChest', pos);
		if (level.findHeap(pos)) chests++;
	}

	const keyPts = [
		{ x: room.left + 1, y: room.top + 1 },
		{ x: room.right - 1, y: room.top + 1 },
		{ x: room.right - 1, y: room.bottom - 1 },
		{ x: room.left + 1, y: room.bottom - 1 },
	];
	for (const p of keyPts) {
		set(level, p.x, p.y, Terrain.EMPTY_SP);
		if (chests > 0) { level.drop('goldenKey', level.pointToCell(p), `depth:${depth}`); chests--; }
	}

	level.drop('potionOfLevitation', 0, 'itemToSpawn');
	room.entranceDoor().set(DoorType.HIDDEN);
}
