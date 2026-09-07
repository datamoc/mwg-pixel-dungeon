/** Port of `levels/rooms/special/LibraryRoom.java`. Item-count roll, position retries, and the
 *  first item's identify-vs-remove-curse pick are all local/portable (that first pick is a
 *  direct two-item choice, no Generator dependency). Later items' `prize()` (`Generator.
 *  random(SCROLL)`) is only reached when `findPrizeItem(Scroll.class)` misses; `Scroll` inherits
 *  `Item.random()` and its class pick is on a substream, so it adds no level-stream draws, but
 *  the deck bookkeeping and the findPrizeItem short-circuit are real. */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, fillXY, drawInside } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';
import { Cat, randomCategory } from '../../../spdItems/generator';

export function paintLibraryRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY_SP);

	const entrance = room.entranceDoor();
	fillXY(level, room.left + 1, room.top + 1, room.width() - 2, 1, Terrain.BOOKSHELF);
	drawInside(level, room, entrance, 1, Terrain.EMPTY_SP);

	const n = SpdRandom.normalIntRange(1, 3);
	for (let i = 0; i < n; i++) {
		let pos: number;
		do { pos = level.pointToCell(room.random()); } while (level.map[pos] !== Terrain.EMPTY_SP || level.findHeap(pos) !== undefined);
		if (i === 0) {
			const scroll = SpdRandom.int(2) === 0 ? 'ScrollOfIdentify' : 'ScrollOfRemoveCurse';
			level.drop(scroll.toLowerCase(), pos)!.sourceClass = scroll;
		} else {
			// prize(): `findPrizeItem(Scroll.class)` consumes no RNG; only on a miss does
			// `Generator.random(SCROLL)` run (its class pick is on SCROLL's own substream and
			// `Scroll` inherits `Item.random()`, so it adds no level-stream draws either - but
			// the deck bookkeeping differs).
			const generated = level.findPrizeItemOfClass('scroll') === null ? randomCategory(Cat.SCROLL) : undefined;
			level.drop('scroll', pos)!.sourceClass = generated?.cls ?? 'Scroll';
		}
	}

	entrance.set(DoorType.LOCKED);
	level.drop('ironKey', level.pointToCell(entrance), 'itemToSpawn');
}
