/**
 * Port of `levels/rooms/secret/RatKingRoom.java`. Ported for graph/paint RNG-stream fidelity
 * only (see `room.ts`'s `SecretRoomKind` doc comment): the real room's chest-lined perimeter and
 * `RatKing` NPC are NOT reproduced as gameplay - this port has no `RatKing` mob and no
 * chest/gold-heap system - but every `Random.*` draw the real `paint()` makes is still burned
 * in the same order, since skipping them would desync the rest of the floor's stream. Each
 * skipped draw is called out below with a `// SKIPPED CONTENT` comment, following the same
 * convention `spdItems/generator.ts` uses.
 */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';

/** `RatKingRoom.addChest()`'s door-adjacency skip, then its one `Random.IntRange(10,25)` roll
 *  (a `Gold` quantity - SKIPPED CONTENT, no heap/gold system to drop it into). */
function rollChest(pos: number, door: number, width: number): void {
	if (pos === door - 1 || pos === door + 1 || pos === door - width || pos === door + width) {
		return;
	}
	SpdRandom.intRange(10, 25); // SKIPPED CONTENT: new Gold(...) quantity, never dropped
}

export function paintRatKingRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY_SP);

	const entrance = room.entranceDoor();
	entrance.set(DoorType.HIDDEN);
	const door = entrance.x + entrance.y * level.w;

	for (let i = room.left + 1; i < room.right; i++) {
		rollChest((room.top + 1) * level.w + i, door, level.w);
		rollChest((room.bottom - 1) * level.w + i, door, level.w);
	}
	for (let i = room.top + 2; i < room.bottom - 1; i++) {
		rollChest(i * level.w + room.left + 1, door, level.w);
		rollChest(i * level.w + room.right - 1, door, level.w);
	}

	// SKIPPED CONTENT: `new RatKing(); king.pos = level.pointToCell(random(2)); level.mobs.add(king);`
	// - no RatKing mob exists in this port - but `random(2)`'s two `Random.IntRange` draws are
	// real and must still be burned for stream fidelity.
	room.random(2);
}
