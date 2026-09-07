/** Port of `levels/rooms/special/ToxicGasRoom.java`. Trap-position and gold-position retry
 *  loops are local/portable (real terrain-state checks); `furthestPos` selection uses
 *  `level.trueDistance()`'s Euclidean approximation (see paintLevel.ts - a geometry
 *  simplification, not an RNG-order one, since nothing branches on it further). `Gold().
 *  random()`'s quantity rolls are real level-stream `IntRange` draws - all THREE of them (the
 *  skeleton's plus one per chest) - made via `randomGold()`. */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, set } from '../../paintLevel';
import { randomGold } from '../../../spdItems/generator';

function getPoints(room: Room): { x: number; y: number }[] {
	const pts: { x: number; y: number }[] = [];
	for (let x = room.left; x <= room.right; x++) for (let y = room.top; y <= room.bottom; y++) pts.push({ x, y });
	return pts;
}

export function paintToxicGasRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY);

	const c = room.center();
	set(level, c.x, c.y, Terrain.STATUE);

	// Foliage/ToxicGas ambient seeding: no RNG in Java, not modeled (rendering/blob concern).

	const traps = Math.min(room.width() - 2, room.height() - 2);
	for (let i = 0; i < traps; i++) {
		let cell: number;
		do { cell = level.pointToCell(room.random(2)); } while (level.map[cell] !== Terrain.EMPTY);
		level.setTrap('toxicVent', false, false, cell);
		set(level, cell % level.w, Math.floor(cell / level.w), Terrain.INACTIVE_TRAP);
	}

	const goldPositions: number[] = [];
	for (let i = 0; i < 8; i++) {
		let pos: number;
		do { pos = level.pointToCell(room.random(2)); } while (level.map[pos] === Terrain.STATUE || goldPositions.includes(pos));
		goldPositions.push(pos);
	}

	const entryPos = level.pointToCell(room.entranceDoor());
	let furthestPos = -1;
	for (const p of goldPositions) {
		if (furthestPos === -1 || level.trueDistance(entryPos, p) > level.trueDistance(entryPos, furthestPos)) furthestPos = p;
	}
	goldPositions.splice(goldPositions.indexOf(furthestPos), 1);

	// THREE `new Gold().random()` calls, each one real `Random.IntRange(30 + depth*10, ...)`
	// draw on the level stream: the skeleton's (whose quantity is then doubled - no extra RNG)
	// and one per chest. All three were previously skipped.
	const skeletonGold = randomGold();
	level.drop('gold', furthestPos, `skeleton,qty:${skeletonGold.quantity * 2}`);
	const chestGold1 = randomGold();
	level.drop('gold', goldPositions[0], `chest,qty:${chestGold1.quantity}`);
	const chestGold2 = randomGold();
	level.drop('gold', goldPositions[1], `chest,qty:${chestGold2.quantity}`);

	level.drop('potionOfPurity', 0, 'itemToSpawn');

	room.entranceDoor().set(DoorType.UNLOCKED);
}
