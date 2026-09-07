/** Port of `levels/rooms/secret/SecretLarderRoom.java`. `minWidth()`/`minHeight()` (6/6) live in
 *  `room.ts`'s `SECRET_ROOM_META`. Fully real/portable: the food-count loop is a deterministic
 *  formula off `depth` (no `Random.*` call in Java either), and each food's position-retry loop is
 *  real room-local geometry. `HUNGRY`/`STARVING` match the real constants already used elsewhere in
 *  this port (see PORT_COVERAGE.md's hunger row). */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, fillXY, set } from '../../paintLevel';

const HUNGRY = 300, STARVING = 450;

export function paintLarderRoom(level: PaintLevel, room: Room, depth: number): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY_SP);

	const c = room.center();
	fillXY(level, c.x - 1, c.y - 1, 3, 3, Terrain.WATER);
	set(level, c.x, c.y, Terrain.GRASS);
	level.plant('blandfruitBushSeed', level.pointToCell(c));

	let extraFood = (STARVING - HUNGRY) * (1 + Math.floor(depth / 5));
	while (extraFood > 0) {
		let kind: string;
		if (extraFood >= STARVING) { kind = 'pasty'; extraFood -= STARVING; }
		else { kind = 'chargrilledMeat'; extraFood -= (STARVING - HUNGRY); }

		let pos: number;
		do { pos = level.pointToCell(room.random()); } while (level.map[pos] !== Terrain.EMPTY_SP || level.findHeap(pos));
		level.drop(kind, pos);
	}

	room.entranceDoor().set(DoorType.HIDDEN);
}
