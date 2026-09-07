/** Port of `levels/rooms/special/TrapsRoom.java`. The trap-or-chasm roll (`Random.Int(4)`,
 *  short-circuiting the `Random.oneOf(levelTraps[depth/5])` call exactly like Java's `switch`
 *  default case), chest-vs-pedestal roll, and `prize()`'s leading roll are all local/portable.
 *  `levelTraps[depth/5]` only ever indexes the Sewers 3-element array for depths 1-4 (the only
 *  scope this port covers - `depth/5` is 0 throughout). `Generator.random*()` internals are
 *  now real: `prizeTrapsRoom()` makes the findPrizeItem draw, the never-cursed weapon/armor
 *  loop at floorSet+1, and the 33% extra-upgrade roll. */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, fillXY, set } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';
import { floorSetForPrize, generatedGroundKind, uncursedWeaponOrArmorPrize } from '../../../spdItems/generator';

/**
 * `TrapsRoom.prize()`: a 33% `findPrizeItem()` guard (our stub always returns null, so it never
 * short-circuits), then the never-cursed weapon/armor loop one floor set higher, then a 33%
 * extra-upgrade roll. Identical in shape to `PoolRoom`/`SentryRoom`'s, and its retry count
 * depends on the `cursed` flag rolled inside `Generator`, so it needs the real generator.
 */
function prizeTrapsRoom(level: PaintLevel): string {
	let prize: string | null = null;
	if (SpdRandom.int(3) !== 0) prize = level.findPrizeItem();
	if (prize === null) {
		prize = generatedGroundKind(uncursedWeaponOrArmorPrize(floorSetForPrize(1)));
		SpdRandom.int(3);
	}
	return prize;
}

/** `levelTraps[0]` (Sewers) - the only region this port's depth range (1-4) ever indexes. */
const SEWERS_TRAPS = ['grippingTrap', 'teleportationTrap', 'flockTrap'];

export function paintTrapsRoom(level: PaintLevel, room: Room, _depth: number): void {
	fillRoom(level, room, Terrain.WALL);

	let trapClass: string | null;
	if (SpdRandom.int(4) === 0) trapClass = null;
	else trapClass = SpdRandom.element(SEWERS_TRAPS);

	if (trapClass === null) fillRoomInset(level, room, 1, Terrain.CHASM);
	else fillRoomInset(level, room, 1, Terrain.TRAP);

	const door = room.entranceDoor();
	door.set(DoorType.REGULAR);

	const lastRow = level.map[room.left + 1 + (room.top + 1) * level.w] === Terrain.CHASM ? Terrain.CHASM : Terrain.EMPTY;

	let x = -1, y = -1;
	if (door.x === room.left) { x = room.right - 1; y = room.top + Math.floor(room.height() / 2); fillXY(level, x, room.top + 1, 1, room.height() - 2, lastRow); }
	else if (door.x === room.right) { x = room.left + 1; y = room.top + Math.floor(room.height() / 2); fillXY(level, x, room.top + 1, 1, room.height() - 2, lastRow); }
	else if (door.y === room.top) { x = room.left + Math.floor(room.width() / 2); y = room.bottom - 1; fillXY(level, room.left + 1, y, room.width() - 2, 1, lastRow); }
	else if (door.y === room.bottom) { x = room.left + Math.floor(room.width() / 2); y = room.top + 1; fillXY(level, room.left + 1, y, room.width() - 2, 1, lastRow); }

	if (trapClass !== null) {
		for (let ry = room.top; ry <= room.bottom; ry++) {
			for (let rx = room.left; rx <= room.right; rx++) {
				const cell = rx + ry * level.w;
				if (level.map[cell] === Terrain.TRAP) level.setTrap(trapClass, false, true, cell);
			}
		}
	}

	const pos = x + y * level.w;
	if (SpdRandom.int(3) === 0) {
		if (lastRow === Terrain.CHASM) set(level, x, y, Terrain.EMPTY);
		level.drop(prizeTrapsRoom(level), pos, 'chest');
	} else {
		set(level, x, y, Terrain.PEDESTAL);
		level.drop(prizeTrapsRoom(level), pos, 'chest');
	}

	level.drop('potionOfLevitation', 0, 'itemToSpawn');
}
