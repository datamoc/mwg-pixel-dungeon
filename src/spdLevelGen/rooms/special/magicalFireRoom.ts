/** Port of `levels/rooms/special/MagicalFireRoom.java`. `behindFire` is a plain rect (mirrors
 *  Java's own `EmptyRoom` sub-rect, see crystalChoiceRoom.ts for the same pattern). Honeypot
 *  roll, item-count roll, position retries, and `prize()`'s leading `Random.Int(3)` roll are
 *  local/portable, and `prize()` now makes its real draws (the findPrizeItem guard plus the
 *  `oneOf(POTION, SCROLL, FOOD, GOLD)` pick and that category's own draws) past
 *  that leading roll. */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, fillXY, set } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';
import { Cat, generatedGroundKind, oneOfCategories, randomCategory } from '../../../spdItems/generator';

interface Rect { left: number; top: number; right: number; bottom: number; }
function rRandom(r: Rect, m: number): { x: number; y: number } {
	return { x: SpdRandom.intRange(r.left + m, r.right - m), y: SpdRandom.intRange(r.top + m, r.bottom - m) };
}

export function paintMagicalFireRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY);

	const door = room.entranceDoor();
	door.set(DoorType.REGULAR);

	const firePos = room.center();
	// `Room behindFire = new EmptyRoom();` - constructed right after `center()` and before any
	// of the fire/position rolls. `EmptyRoom` extends `StandardRoom`, whose instance initializer
	// `{ setSizeCat(); }` burns one `Random.chances(sizeCatProbs())` float; only the rect is used
	// afterwards, but the draw is real.
	new Room('standard', 'empty');
	let behindFire: Rect;

	if (door.x === room.left || door.x === room.right) {
		firePos.y = room.top + 1;
		while (firePos.y !== room.bottom) {
			level.mobs.push({ pos: level.pointToCell(firePos), kind: 'eternalFire' });
			set(level, firePos.x, firePos.y, Terrain.EMPTY_SP);
			firePos.y++;
		}
		behindFire = door.x === room.left
			? { left: firePos.x + 1, top: room.top + 1, right: room.right - 1, bottom: room.bottom - 1 }
			: { left: room.left + 1, top: room.top + 1, right: firePos.x - 1, bottom: room.bottom - 1 };
	} else {
		firePos.x = room.left + 1;
		while (firePos.x !== room.right) {
			level.mobs.push({ pos: level.pointToCell(firePos), kind: 'eternalFire' });
			set(level, firePos.x, firePos.y, Terrain.EMPTY_SP);
			firePos.x++;
		}
		behindFire = door.y === room.top
			? { left: room.left + 1, top: firePos.y + 1, right: room.right - 1, bottom: room.bottom - 1 }
			: { left: room.left + 1, top: room.top + 1, right: room.right - 1, bottom: firePos.y - 1 };
	}

	fillXY(level, behindFire.left, behindFire.top, behindFire.right - behindFire.left + 1, behindFire.bottom - behindFire.top + 1, Terrain.EMPTY_SP);

	let honeyPot = SpdRandom.int(2) === 0;
	const n = SpdRandom.intRange(3, 4);
	for (let i = 0; i < n; i++) {
		let pos: number;
		do { pos = level.pointToCell(rRandom(behindFire, 0)); } while (level.findHeap(pos) !== undefined);
		if (honeyPot) { level.drop('honeypot', pos); honeyPot = false; }
		else {
			// prize(): `if (Random.Int(3) != 0)` guards `findPrizeItem()` (which draws, and on a
			// hit returns early, skipping the Generator branch entirely).
			let prize: string | null = null;
			if (SpdRandom.int(3) !== 0) prize = level.findPrizeItem();
			if (prize === null) prize = generatedGroundKind(randomCategory(oneOfCategories([Cat.POTION, Cat.SCROLL, Cat.FOOD, Cat.GOLD])));
			level.drop(prize, pos);
		}
	}

	level.drop('potionOfFrost', 0, 'itemToSpawn');
}
