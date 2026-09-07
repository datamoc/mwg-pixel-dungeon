/** Port of `levels/rooms/secret/SecretRunestoneRoom.java`. Geometry is deterministic off door
 *  side; `addItemToSpawn(PotionOfLiquidFlame)` is recorded the same placeholder way `trapsRoom.ts`
 *  records its levitation potion (pos 0, note `'itemToSpawn'`, no map position of its own).
 *  `Generator.randomUsingDefaults(STONE)` (x2) each burn one real `chances(STONE.defaultProbs)`
 *  draw on the level stream (it pushes no substream), alongside each drop's position-retry loop; `StoneOfEnchantment` is a direct, non-Generator construct, so
 *  it's kept as a real content drop, not skipped. `canPlaceWater`/`canPlaceGrass` (both false) are
 *  wired in `regularPainter.ts`; `canPlaceCharacter` (blocks mob spawns onto `EMPTY_SP`) isn't
 *  modeled - this port doesn't place mobs during generation. */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, fillXY, drawLine } from '../../paintLevel';
import { Cat, randomUsingDefaults } from '../../../spdItems/generator';

export function paintRunestoneRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY);

	const entrance = room.entranceDoor();
	const c = room.center();

	if (entrance.x === room.left || entrance.x === room.right) {
		drawLine(level, { x: c.x, y: room.top + 1 }, { x: c.x, y: room.bottom - 1 }, Terrain.BOOKSHELF);
		if (entrance.x === room.left) fillXY(level, c.x + 1, room.top + 1, room.right - c.x - 1, room.height() - 2, Terrain.EMPTY_SP);
		else fillXY(level, room.left + 1, room.top + 1, c.x - room.left - 1, room.height() - 2, Terrain.EMPTY_SP);
	} else {
		drawLine(level, { x: room.left + 1, y: c.y }, { x: room.right - 1, y: c.y }, Terrain.BOOKSHELF);
		if (entrance.y === room.top) fillXY(level, room.left + 1, c.y + 1, room.width() - 2, room.bottom - c.y - 1, Terrain.EMPTY_SP);
		else fillXY(level, room.left + 1, room.top + 1, room.width() - 2, c.y - room.top - 1, Terrain.EMPTY_SP);
	}

	level.drop('potionOfLiquidFlame', 0, 'itemToSpawn');

	let pos: number;
	do { pos = level.pointToCell(room.random()); } while (level.map[pos] !== Terrain.EMPTY);
	// `Generator.randomUsingDefaults(STONE)` does NOT push a substream - its
	// `chances(STONE.defaultProbs)` is one real draw on the level stream (Runestone itself
	// inherits `Item.random()`, so nothing more). Previously skipped.
	randomUsingDefaults(Cat.STONE);
	level.drop('stone', pos);

	do { pos = level.pointToCell(room.random()); } while (level.map[pos] !== Terrain.EMPTY || level.findHeap(pos));
	randomUsingDefaults(Cat.STONE); // same one real draw again, for the second stone.
	level.drop('stone', pos);

	do { pos = level.pointToCell(room.random()); } while (level.map[pos] !== Terrain.EMPTY_SP);
	level.drop('stoneOfEnchantment', pos);

	entrance.set(DoorType.HIDDEN);
}
