/**
 * Port of `levels/rooms/standard/StudyRoom.java`. `Random.Int(2)` (prize-vs-generator branch) and
 * `Random.oneOf(POTION,SCROLL)` (an array-index Int(2) pick) are real `SpdRandom`, fully portable.
 * `level.findPrizeItem()` DOES draw in Java whenever `itemsToSpawn` is non-empty
 * (`Random.element` over it), and returning an item there skips the Generator branch entirely -
 * so it is wired to the real list here, not stubbed to null. `Generator.random(category)`'s own
 * rolls now go through `spdItems/generator.ts`.
 */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, drawInside, fillXY, set } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';
import { Cat, generatedGroundKind, oneOfCategories, randomCategory } from '../../../spdItems/generator';


export function paintStudyRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.BOOKSHELF);
	fillRoomInset(level, room, 2, Terrain.EMPTY_SP);

	for (const door of room.connected.values()) {
		if (!door) continue;
		drawInside(level, room, door, 2, Terrain.EMPTY_SP);
		door.set(DoorType.REGULAR);
	}

	if (room.sizeCat!.name === 'LARGE') {
		const pillarW = Math.floor((room.width() - 7) / 2);
		const pillarH = Math.floor((room.height() - 7) / 2);

		fillXY(level, room.left + 3, room.top + 3, pillarW, 1, Terrain.BOOKSHELF);
		fillXY(level, room.left + 3, room.top + 3, 1, pillarH, Terrain.BOOKSHELF);
		fillXY(level, room.left + 3, room.bottom - 2 - 1, pillarW, 1, Terrain.BOOKSHELF);
		fillXY(level, room.left + 3, room.bottom - 2 - pillarH, 1, pillarH, Terrain.BOOKSHELF);
		fillXY(level, room.right - 2 - pillarW, room.top + 3, pillarW, 1, Terrain.BOOKSHELF);
		fillXY(level, room.right - 2 - 1, room.top + 3, 1, pillarH, Terrain.BOOKSHELF);
		fillXY(level, room.right - 2 - pillarW, room.bottom - 2 - 1, pillarW, 1, Terrain.BOOKSHELF);
		fillXY(level, room.right - 2 - 1, room.bottom - 2 - pillarH, 1, pillarH, Terrain.BOOKSHELF);
	}

	const center = room.center();
	set(level, center.x, center.y, Terrain.PEDESTAL);

	const prize = SpdRandom.int(2) === 0 ? level.findPrizeItem() : null;
	if (prize !== null) {
		level.drop(prize, level.pointToCell(center));
	} else {
		// `Generator.random(Random.oneOf(POTION, SCROLL))`: the oneOf is the Int(2) below; the
		// category's own class pick runs on its substream and Potion/Scroll inherit
		// `Item.random()`, so no further level-stream draws - but the call is made so the deck
		// state advances exactly as Java's does.
		const cat = oneOfCategories([Cat.POTION, Cat.SCROLL]);
		const generated = randomCategory(cat);
		level.drop(generatedGroundKind(generated), level.pointToCell(center));
	}
}
