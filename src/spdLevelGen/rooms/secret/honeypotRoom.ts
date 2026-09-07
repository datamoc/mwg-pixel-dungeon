/** Port of `levels/rooms/secret/SecretHoneypotRoom.java`. The broken-pot/bee position is
 *  deterministic geometry (midpoint of `center()` and the entrance door). `Bee.spawn(depth)` has
 *  no override in `Bee.java` (inherits `Mob`'s base, which rolls nothing at spawn time) - skipped,
 *  not an RNG-order gap. `placeItem`'s position-retry loop is real for both items; `Honeypot()` is
 *  a direct, non-Generator construct (real content). */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset } from '../../paintLevel';
import { randomBomb } from '../../../spdItems/generator';

function placeItem(level: PaintLevel, room: Room, kind: string, sourceClass?: string): void {
	let pos: number;
	do { pos = level.pointToCell(room.random()); } while (level.findHeap(pos));
	const heap = level.drop(kind, pos);
	if (heap && sourceClass) heap.sourceClass = sourceClass;
}

export function paintHoneypotRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY);

	const c = room.center();
	const entrance = room.entranceDoor();
	const potPos = {
		x: Math.floor((c.x + entrance.x) / 2),
		y: Math.floor((c.y + entrance.y) / 2),
	};
	const potCell = level.pointToCell(potPos);
	level.drop('shatteredPot', potCell);
	level.mobs.push({ pos: potCell, kind: 'bee' });

	placeItem(level, room, 'honeypot');
	// Java evaluates `new Bomb().random()` before `placeItem`, so preserve both the
	// DoubleBomb roll and the concrete item that it selects.
	const bomb = randomBomb();
	placeItem(level, room, bomb.cls === 'DoubleBomb' ? 'doubleBomb' : 'bomb', bomb.cls);

	entrance.set(DoorType.HIDDEN);
}
