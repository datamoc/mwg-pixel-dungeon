/** Port of `levels/rooms/special/StorageRoom.java`. The honeypot coin-flip, item-count roll,
 *  position retries, and `prize()`'s leading `Random.Int(3)` roll are local/portable. `prize()`'s
 *  `Generator.random(Random.oneOf(POTION, SCROLL, FOOD, GOLD))` is now reproduced properly via
 *  `spdItems/generator.ts` - the `oneOf` draw and the chosen category's own level-stream draws
 *  (zero for POTION/SCROLL/FOOD, a `chances` + `IntRange` for GOLD) were previously skipped. */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';
import { Cat, generatedGroundKind, oneOfCategories, randomCategory } from '../../../spdItems/generator';

export function paintStorageRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY_SP);

	let honeyPot = SpdRandom.int(2) === 0;

	const n = SpdRandom.intRange(3, 4);
	for (let i = 0; i < n; i++) {
		let pos: number;
		do { pos = level.pointToCell(room.random()); } while (level.map[pos] !== Terrain.EMPTY_SP || level.findHeap(pos) !== undefined);
		if (honeyPot) {
			level.drop('honeypot', pos);
			honeyPot = false;
		} else {
			// prize(): `if (Random.Int(3) != 0)` guards `findPrizeItem()`, which itself draws and
			// can return a queued item - in which case Java returns early and the Generator
			// branch never runs at all.
			let prize: string | null = null;
			if (SpdRandom.int(3) !== 0) prize = level.findPrizeItem();
			if (prize === null) prize = generatedGroundKind(randomCategory(oneOfCategories([Cat.POTION, Cat.SCROLL, Cat.FOOD, Cat.GOLD])));
			level.drop(prize, pos);
		}
	}

	room.entranceDoor().set(DoorType.BARRICADE);
	level.drop('potionOfLiquidFlame', 0, 'itemToSpawn');
}
