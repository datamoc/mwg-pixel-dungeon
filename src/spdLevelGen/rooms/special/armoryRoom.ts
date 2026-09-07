/** Port of `levels/rooms/special/ArmoryRoom.java`. Statue side-roll, item-count roll and the
 *  `prizeCats` category-weight roll are local/portable; the four prize branches
 *  (`new Bomb().random()` / `Generator.randomWeapon` / `randomArmor` / `randomMissile`) now make
 *  their real level-stream draws via `spdItems/generator.ts`. */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, set } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';
import { randomArmor, randomBomb, randomMissile, randomWeapon } from '../../../spdItems/generator';

const CATEGORY_NAMES = ['bomb', 'weapon', 'armor', 'missile'];

export function paintArmoryRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY);

	const entrance = room.entranceDoor();
	let statue: { x: number; y: number } | null = null;
	if (entrance.x === room.left) statue = { x: room.right - 1, y: SpdRandom.int(2) === 0 ? room.top + 1 : room.bottom - 1 };
	else if (entrance.x === room.right) statue = { x: room.left + 1, y: SpdRandom.int(2) === 0 ? room.top + 1 : room.bottom - 1 };
	else if (entrance.y === room.top) statue = { x: SpdRandom.int(2) === 0 ? room.left + 1 : room.right - 1, y: room.bottom - 1 };
	else if (entrance.y === room.bottom) statue = { x: SpdRandom.int(2) === 0 ? room.left + 1 : room.right - 1, y: room.top + 1 };
	if (statue) set(level, statue.x, statue.y, Terrain.STATUE);

	const n = SpdRandom.intRange(2, 3);
	const prizeCats = [1, 1, 1, 1];
	for (let i = 0; i < n; i++) {
		let pos: number;
		do {
			pos = level.pointToCell(room.random());
		} while (level.map[pos] !== Terrain.EMPTY || level.findHeap(pos) !== undefined);
		const idx = SpdRandom.chances(prizeCats);
		prizeCats[idx] = 0;
		// The four prize branches, each with its own real level-stream draws (previously skipped):
		// `new Bomb().random()`'s Int(4) DoubleBomb roll, or a weapon/armor/missile at the floor's
		// own tier set.
		const generated = idx === 0 ? randomBomb()
			: idx === 1 ? randomWeapon()
				: idx === 2 ? randomArmor()
					: randomMissile();
		level.drop(CATEGORY_NAMES[idx], pos)!.sourceClass = generated.cls;
	}

	entrance.set(DoorType.LOCKED);
	level.drop('ironKey', level.pointToCell(entrance), 'itemToSpawn');
}
