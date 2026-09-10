/**
 * Port of `levels/rooms/secret/RatKingRoom.java`. Graph/paint RNG-stream fidelity plus
 * real content now: the perimeter gold chests (`Gold(10-25)` as CHEST heaps, the same
 * `chest,qty:` note convention the treasury/toxic-gas rooms use) and the `RatKing` NPC
 * itself (the `random(2)` king-placement draws were already burned here; pushing the mob
 * adds no new draws).
 */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';

/** `RatKingRoom.addChest()`: door-adjacent cells are skipped, otherwise a `Gold(10-25)`
 * CHEST heap. The quantity draw is real either way - now it also fills the heap. */
function ratKingChest(level: PaintLevel, pos: number, door: number, width: number): void {
	if (pos === door - 1 || pos === door + 1 || pos === door - width || pos === door + width) {
		return;
	}
	level.drop('gold', pos, `chest,qty:${SpdRandom.intRange(10, 25)}`);
}

export function paintRatKingRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY_SP);

	const entrance = room.entranceDoor();
	entrance.set(DoorType.HIDDEN);
	const door = entrance.x + entrance.y * level.w;

	for (let i = room.left + 1; i < room.right; i++) {
		ratKingChest(level, (room.top + 1) * level.w + i, door, level.w);
		ratKingChest(level, (room.bottom - 1) * level.w + i, door, level.w);
	}
	for (let i = room.top + 2; i < room.bottom - 1; i++) {
		ratKingChest(level, i * level.w + room.left + 1, door, level.w);
		ratKingChest(level, i * level.w + room.right - 1, door, level.w);
	}

	//`new RatKing(); king.pos = level.pointToCell(random(2)); level.mobs.add(king);` - the
	//`random(2)` draws were already burned for stream fidelity; the mob itself is live now.
	const king = room.random(2);
	level.mobs.push({ pos: level.pointToCell(king), kind: 'ratKing' });
}
