/** Port of `levels/rooms/special/SacrificeRoom.java`. The door-vs-center parity nudge
 *  (`Random.Int(2)`) is local/portable; `drawInside`'s length and the statue placements are pure
 *  geometry. `prize()` (`Generator.randomWeapon` + upgrade/curse) is Generator-subsystem-
 *  now real via `cursedGiftPrize()` (weapon at floorSet+1, plus a `randomCurse()` draw only when
 *  it came out uncursed and unenchanted). No leading local roll exists in Java here, unlike
 *  Pool/Sentry's rooms - see PORT_COVERAGE.md). */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, fillXY, set, drawInside } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';
import { cursedGiftPrize, floorSetForPrize } from '../../../spdItems/generator';

export function paintSacrificeRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.CHASM);

	const c = room.center();
	const door = room.entranceDoor();
	if (door.x === room.left || door.x === room.right) {
		if (door.y === c.y) c.y += SpdRandom.int(2) === 0 ? -1 : 1;
		let p = drawInside(level, room, door, Math.abs(door.x - c.x) - 2, Terrain.EMPTY_SP);
		// Java is `for (; p.y != c.y; p.y += ...) { set(p) }` - it writes at the CURRENT p and
		// only then advances, so the first cell written is the one `drawInside` stopped on.
		// Advancing before writing (as this did) skips that cell, leaving one CHASM tile behind.
		while (p.y !== c.y) { set(level, p.x, p.y, Terrain.EMPTY_SP); p = { x: p.x, y: p.y + (p.y < c.y ? 1 : -1) }; }
	} else {
		if (door.x === c.x) c.x += SpdRandom.int(2) === 0 ? -1 : 1;
		let p = drawInside(level, room, door, Math.abs(door.y - c.y) - 2, Terrain.EMPTY_SP);
		while (p.x !== c.x) { set(level, p.x, p.y, Terrain.EMPTY_SP); p = { x: p.x + (p.x < c.x ? 1 : -1), y: p.y }; }
	}

	const statue = { x: c.x, y: c.y };
	statue.x -= 2;
	if (statue.x > room.left) set(level, statue.x, statue.y, Terrain.STATUE);
	statue.x += 2; statue.y -= 2;
	if (statue.y > room.top) set(level, statue.x, statue.y, Terrain.STATUE);
	statue.y += 2; statue.x += 2;
	if (statue.x < room.right) set(level, statue.x, statue.y, Terrain.STATUE);
	statue.x -= 2; statue.y += 2;
	if (statue.y < room.bottom) set(level, statue.x, statue.y, Terrain.STATUE);

	fillXY(level, c.x - 1, c.y - 1, 3, 3, Terrain.EMBERS);
	set(level, c.x, c.y, Terrain.PEDESTAL);

	// SacrificialFire.setPrize(prize()): `Generator.randomWeapon(floorSet+1)`, then - only when
	// uncursed AND without a good enchantment - one `Enchantment.randomCurse()` draw.
	const prize = cursedGiftPrize(floorSetForPrize(1), 'weapon');
	// Keep this as a feature record rather than a monster kind.  The live scene consumes
	// it as a Blob and uses the concrete generated class when the fire is completed.
	level.mobs.push({ pos: level.pointToCell(c), kind: 'sacrificialFire', loot: `weapon|${prize.cls}` });

	door.set(DoorType.EMPTY);
}
