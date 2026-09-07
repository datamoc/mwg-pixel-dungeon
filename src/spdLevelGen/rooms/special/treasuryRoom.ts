/** Port of `levels/rooms/special/TreasuryRoom.java`. The heap-type roll, item-count roll,
 *  position retries, and the depth-gated 20% mimic roll (short-circuited exactly like Java's
 *  `heapType==CHEST && depth>1 && Random.Int(5)==0` - the `Random.Int(5)` call only fires when
 *  the first two conditions hold) are all local/portable. `Gold().random()`'s quantity roll is
 *  real, fully portable `Random.IntRange` draws (no Generator deck), made on every drop -
 *  including the `Mimic.spawnAt` branch, where Java still evaluates it as the argument. */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, set } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';
import { generatedGroundKind, mimicGeneratePrize } from '../../../spdItems/generator';

export function paintTreasuryRoom(level: PaintLevel, room: Room, depth: number): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY);

	const c = room.center();
	set(level, c.x, c.y, Terrain.STATUE);

	const isChest = SpdRandom.int(2) === 0;

	const n = SpdRandom.intRange(2, 3);
	for (let i = 0; i < n; i++) {
		let pos: number;
		do { pos = level.pointToCell(room.random()); } while (level.map[pos] !== Terrain.EMPTY || level.findHeap(pos) !== undefined || level.findMob(pos) !== undefined);
		// Draw ORDER matters here and an earlier revision had it backwards. Java:
		//   if (heapType == CHEST && depth > 1 && Random.Int(5) == 0)
		//       mobs.add(Mimic.spawnAt(pos, new Gold().random()));
		//   else
		//       drop(new Gold().random(), pos).type = heapType;
		// so the mimic GATE rolls first (short-circuiting, hence only when chest && depth>1),
		// and `new Gold().random()`'s `IntRange(30+depth*10, 60+depth*20)` rolls after it - as
		// the argument expression, in both branches. Rolling the gold first swapped which draw
		// fed which decision.
		const mimic = isChest && depth > 1 && SpdRandom.int(5) === 0;
		const goldQty = SpdRandom.intRange(30 + depth * 10, 60 + depth * 20);
		if (mimic) {
			// `Mimic.spawnAt()` also always generates a kill reward on the level stream.
			const bonus = mimicGeneratePrize();
			level.mobs.push({ pos, kind: 'mimic', loot: `${generatedGroundKind(bonus)};heldGold:${goldQty}` });
		} else {
			level.drop('gold', pos, `${isChest ? 'chest' : 'heap'},qty:${goldQty}`);
		}
	}

	if (!isChest) {
		for (let i = 0; i < 6; i++) {
			let pos: number;
			do { pos = level.pointToCell(room.random()); } while (level.map[pos] !== Terrain.EMPTY);
			level.drop('gold', pos, `qty:${SpdRandom.intRange(5, 12)}`);
		}
	}

	room.entranceDoor().set(DoorType.LOCKED);
	level.drop('ironKey', level.pointToCell(room.entranceDoor()), 'itemToSpawn');
}
