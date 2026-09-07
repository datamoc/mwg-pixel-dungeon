/** Port of `levels/rooms/special/PitRoom.java`. Well-side rolls, main-loot category roll
 *  (`Random.Int(3)`), and the extra-prize count roll are local/portable. `Generator.random()`'s
 *  internal item rolls (main loot and each extra prize) are Generator-subsystem-internal -
 *  now real for every branch (RING / ARTIFACT / oneOf(WEAPON,ARMOR)) past the category pick;
 *  the `do-while (mainLoot==null ||
 *  blocked)` retry count isn't modeled (see PORT_COVERAGE.md, same convention as every other
 *  room here). */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, set } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';
import { Cat, generatedGroundKind, oneOfCategories, randomCategory } from '../../../spdItems/generator';

const MAIN_LOOT_CATEGORY = ['ring', 'artifact', 'weaponOrArmor'];

export function paintPitRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY);

	const entrance = room.entranceDoor();
	entrance.set(DoorType.CRYSTAL);

	let well: { x: number; y: number };
	if (entrance.x === room.left) well = { x: room.right - 1, y: SpdRandom.int(2) === 0 ? room.top + 1 : room.bottom - 1 };
	else if (entrance.x === room.right) well = { x: room.left + 1, y: SpdRandom.int(2) === 0 ? room.top + 1 : room.bottom - 1 };
	else if (entrance.y === room.top) well = { x: SpdRandom.int(2) === 0 ? room.left + 1 : room.right - 1, y: room.bottom - 1 };
	else well = { x: SpdRandom.int(2) === 0 ? room.left + 1 : room.right - 1, y: room.top + 1 };
	set(level, well.x, well.y, Terrain.EMPTY_WELL);

	const remains = level.pointToCell(room.center());

	// mainLoot's `do { switch (Random.Int(3)) ... } while (mainLoot == null || blocked)`. The
	// loop can only run once (every branch assigns, and `random(ARTIFACT)` falls back to a RING
	// rather than returning null), so the switch is taken exactly once. Each branch's own
	// level-stream draws were previously skipped entirely.
	const mainLootRoll = SpdRandom.int(3);
	const category = MAIN_LOOT_CATEGORY[mainLootRoll];
	const mainLoot = mainLootRoll === 0 ? randomCategory(Cat.RING)
		: mainLootRoll === 1 ? randomCategory(Cat.ARTIFACT)
			: randomCategory(oneOfCategories([Cat.WEAPON, Cat.ARMOR]));
	level.drop(generatedGroundKind(mainLoot), remains, 'skeleton,hauntedIfCursed');

	const n = SpdRandom.intRange(1, 2);
	for (let i = 0; i < n; i++) {
		// prize(): `Generator.random(Random.oneOf(POTION, SCROLL, FOOD, GOLD))` - the oneOf draw
		// plus the chosen category's own draws (GOLD adds a `chances` and an `IntRange`).
		const extra = randomCategory(oneOfCategories([Cat.POTION, Cat.SCROLL, Cat.FOOD, Cat.GOLD]));
		level.drop(generatedGroundKind(extra), remains, 'hauntedIfCursed');
	}

	level.drop('crystalKey', remains);
}
