/** Port of `levels/rooms/special/RunestoneRoom.java`. Reward-count roll and position retry loop
 *  are local/portable. `prize()` (`findPrizeItem()` stub null, then `Generator.random(STONE)`)
 *  is only reached when `findPrizeItem(Runestone.class)` misses; like SCROLL it adds no
 *  level-stream draws of its own, but the short-circuit and deck bookkeeping are real. */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, drawInside } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';
import { Cat, randomCategory } from '../../../items/generator';

export function paintRunestoneRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.CHASM);

	drawInside(level, room, room.entranceDoor(), 2, Terrain.EMPTY_SP);
	fillRoomInset(level, room, 2, Terrain.EMPTY);

	const n = SpdRandom.normalIntRange(2, 3);
	for (let i = 0; i < n; i++) {
		let pos: number;
		do { pos = level.pointToCell(room.random()); } while (level.map[pos] !== Terrain.EMPTY || level.findHeap(pos) !== undefined);
		// prize(): `findPrizeItem(TrinketCatalyst.class)` first, then
		// `findPrizeItem(Runestone.class)` (any runestone - the coarse match is
		// correct here, unlike Laboratory's Strength-only match). Neither consumes
		// RNG; only on a double miss does `Generator.random(STONE)` run (substream
		// class pick, `Item.random()`, so no level-stream draws - but the deck
		// bookkeeping is real). On a hit the actual queued item is kept, never
		// replaced by a generic placeholder.
		const found = level.findPrizeItemOfExactKind('trinketCatalyst')
			?? level.findPrizeItemOfClass('stone');
		if (found === null) {
			const generated = randomCategory(Cat.STONE);
			level.drop('runestone', pos)!.sourceClass = generated?.cls ?? 'Runestone';
		} else {
			level.drop(found, pos);
		}
	}

	room.entranceDoor().set(DoorType.LOCKED);
	level.drop('ironKey', level.pointToCell(room.entranceDoor()), 'itemToSpawn');
}
