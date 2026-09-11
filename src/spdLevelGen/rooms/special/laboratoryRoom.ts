/** Port of `levels/rooms/special/LaboratoryRoom.java`. Pot-side roll, `EnergyCrystal` position
 *  retry loop, and the reward-count roll are local/portable (position retries use real
 *  terrain/heap-occupancy state this port tracks). `EnergyCrystal().random()`'s own variant roll
 *  and `prize()`'s `Generator.random()` internals are Generator-subsystem-internal - skipped
 *  now real: `new EnergyCrystal().random()`'s `IntRange(4,6)`, `prize()`'s findPrizeItem
 *  short-circuit plus its `oneOf(POTION, STONE)` draw, and the single alchemy-guide page drop
 *  with its own position-retry loop. (The page *selection* has no RNG in Java - pure
 *  journal-state bookkeeping) - not modeled, since this port has no journal system; costs
 *  nothing either way (see PORT_COVERAGE.md). */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, set } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';
import { Cat, generatedGroundKind, oneOfCategories, randomCategory } from '../../../spdItems/generator';

/**
 * `Document.ALCHEMY_GUIDE`'s page count: 10 (5 "given in sewers" + 5 "given in prison", see
 * `Document.java`'s static initializer). All start NOT_FOUND on a fresh install and only the
 * player reading one flips it, so from level generation's point of view this is a constant.
 */
const ALCHEMY_GUIDE_PAGES = 10;

export function paintLaboratoryRoom(level: PaintLevel, room: Room, depth: number): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY_SP);

	const entrance = room.entranceDoor();
	let pot: { x: number; y: number };
	if (entrance.x === room.left) pot = { x: room.right - 1, y: SpdRandom.int(2) === 0 ? room.top + 1 : room.bottom - 1 };
	else if (entrance.x === room.right) pot = { x: room.left + 1, y: SpdRandom.int(2) === 0 ? room.top + 1 : room.bottom - 1 };
	else if (entrance.y === room.top) pot = { x: SpdRandom.int(2) === 0 ? room.left + 1 : room.right - 1, y: room.bottom - 1 };
	else pot = { x: SpdRandom.int(2) === 0 ? room.left + 1 : room.right - 1, y: room.top + 1 };
	set(level, pot.x, pot.y, Terrain.ALCHEMY);
	level.mobs.push({ pos: level.pointToCell(pot), kind: 'alchemyBlob' });

	let pos: number;
	do { pos = level.pointToCell(room.random()); } while (level.map[pos] !== Terrain.EMPTY_SP || level.findHeap(pos) !== undefined);
	// `new EnergyCrystal().random()`: `quantity = Random.IntRange(4, 6)` - one real level-stream
	// draw, previously (wrongly) documented as a skippable variant roll.
	const energyCrystal = level.drop('energyCrystal', pos);
	energyCrystal!.quantity = SpdRandom.intRange(4, 6);

	const n = SpdRandom.normalIntRange(1, 2);
	for (let i = 0; i < n; i++) {
		do { pos = level.pointToCell(room.random()); } while (level.map[pos] !== Terrain.EMPTY_SP || level.findHeap(pos) !== undefined);
		// prize(): `findPrizeItem(Potion.class)` consumes NO RNG (it scans in order), but on a
		// hit Java skips `Generator.random(Random.oneOf(POTION, STONE))` entirely - including
		// that oneOf's real draw.
		if (level.findPrizeItemOfClass('potion') === null) {
			level.drop(generatedGroundKind(randomCategory(oneOfCategories([Cat.POTION, Cat.STONE]))), pos);
		} else {
			level.drop('potion', pos);
		}
	}

	// Alchemy guide pages. `pagesToDrop` is depth-dependent, and an earlier revision hardcoded it
	// to 1 - correct only in the Sewers, which is why this went unnoticed until Prison floors were
	// compared. Java:
	//   chapter       = 1 + Dungeon.depth/5            (integer division)
	//   chapterTarget = missingPages.size() <= 5 ? 2 : 1
	//   pagesToDrop   = min(missingPages.size(), (chapter - chapterTarget) + 1)   if chapter >= chapterTarget
	// `Document.ALCHEMY_GUIDE` has 10 pages and `isPageFound` only flips when the PLAYER reads
	// one - dropping a page never marks it found - so on the fresh journal both sides run with,
	// all 10 missing throughout, hence chapterTarget 1. That makes it 1 page in the Sewers but
	// **2 from depth 5 on**, and each page drop runs its own position-retry loop (two `IntRange`
	// draws per attempt). The missing second page was exactly the 2-draw gap that desynced every
	// Prison Laboratory floor. The page *selection* (`missingPages.remove(0)`) consumes no RNG.
	const missingPages = ALCHEMY_GUIDE_PAGES;
	const chapter = 1 + Math.floor(depth / 5);
	const chapterTarget = missingPages <= 5 ? 2 : 1;
	if (missingPages > 0 && chapter >= chapterTarget) {
		const pagesToDrop = Math.min(missingPages, (chapter - chapterTarget) + 1);
		for (let i = 0; i < pagesToDrop; i++) {
			let pagePos: number;
			do {
				pagePos = level.pointToCell(room.random());
			} while (level.map[pagePos] !== Terrain.EMPTY_SP || level.findHeap(pagePos) !== undefined);
			level.drop('alchemyPage', pagePos);
		}
	}

	entrance.set(DoorType.LOCKED);
	level.drop('ironKey', level.pointToCell(entrance), 'itemToSpawn');
}
