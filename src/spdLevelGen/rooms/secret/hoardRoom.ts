/** Port of `levels/rooms/secret/SecretHoardRoom.java`. Fully real/portable: the trap-class pick
 *  is a real 3-way fixed-tag branch (`Random.Int(2)`, then a deterministic `depth>=10` check - no
 *  Generator involved), each gold drop uses the real `Gold.random()` formula
 *  (`Random.IntRange(30+depth*10, 60+depth*20)`, already used elsewhere in this port per
 *  PORT_COVERAGE.md) scaled by a deterministic ratio, and the per-cell trap-placement loop
 *  (`Random.Int(2)` per `Room.getPoints()` cell, column-major - see `paintLevel.ts`'s `roomPoints`)
 *  is real. `canPlaceTrap()` overriding to false (so the *outer* `RegularPainter.paintTraps()` pass
 *  never also drops a trap here) isn't threaded into `regularPainter.ts`'s `paintTraps` - that
 *  function doesn't consult any room's `canPlaceTrap` for *any* room yet (a pre-existing gap, not
 *  introduced here - see PORT_COVERAGE.md). */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, roomPoints, set } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';

export function paintHoardRoom(level: PaintLevel, room: Room, depth: number): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY);

	let trapClass: string;
	if (SpdRandom.int(2) === 0) trapClass = 'rockfallTrap';
	else if (depth >= 10) trapClass = 'disintegrationTrap';
	else trapClass = 'poisonDartTrap';

	const totalGold = Math.floor(((room.width() - 2) * (room.height() - 2)) / 2);
	const goldRatio = totalGold > 0 ? 8 / totalGold : 0;
	for (let i = 0; i < totalGold; i++) {
		let pos: number;
		do { pos = level.pointToCell(room.random()); } while (level.findHeap(pos));
		const quantity = Math.round(SpdRandom.intRange(30 + depth * 10, 60 + depth * 20) * goldRatio);
		level.drop('gold', pos, `qty:${quantity}`);
	}

	for (const p of roomPoints(room)) {
		const cell = level.pointToCell(p);
		if (SpdRandom.int(2) === 0 && level.map[cell] === Terrain.EMPTY) {
			level.setTrap(trapClass, false, true, cell);
			set(level, p.x, p.y, Terrain.TRAP);
		}
	}

	room.entranceDoor().set(DoorType.HIDDEN);
}
