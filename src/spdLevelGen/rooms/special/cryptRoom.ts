/** Port of `levels/rooms/special/CryptRoom.java`. `center()` do-while is ported (see room.ts);
 *  the statue placement and locked door are pure geometry, no RNG. `prize()` (`Generator.
 *  randomArmor` + upgrade/curse rolls) is entirely Generator-subsystem-internal - skipped with
 *  `cursedGiftPrize()` - a real
 *  `Generator.randomArmor(floorSet+1)` plus, only when the armor came out uncursed AND without a
 *  good glyph, one `Armor.Glyph.randomCurse()` draw. A placeholder 'armor' tag is dropped, since
 *  this port has no item objects. */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, set } from '../../paintLevel';
import { cursedGiftPrize, floorSetForPrize } from '../../../spdItems/generator';

export function paintCryptRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY);

	const c = room.center();
	let cx = c.x, cy = c.y;

	const entrance = room.entranceDoor();
	entrance.set(DoorType.LOCKED);
	level.drop('ironKey', level.pointToCell({ x: entrance.x, y: entrance.y }), 'itemToSpawn');

	if (entrance.x === room.left) {
		set(level, room.right - 1, room.top + 1, Terrain.STATUE);
		set(level, room.right - 1, room.bottom - 1, Terrain.STATUE);
		cx = room.right - 2;
	} else if (entrance.x === room.right) {
		set(level, room.left + 1, room.top + 1, Terrain.STATUE);
		set(level, room.left + 1, room.bottom - 1, Terrain.STATUE);
		cx = room.left + 2;
	} else if (entrance.y === room.top) {
		set(level, room.left + 1, room.bottom - 1, Terrain.STATUE);
		set(level, room.right - 1, room.bottom - 1, Terrain.STATUE);
		cy = room.bottom - 2;
	} else if (entrance.y === room.bottom) {
		set(level, room.left + 1, room.top + 1, Terrain.STATUE);
		set(level, room.right - 1, room.top + 1, Terrain.STATUE);
		cy = room.top + 2;
	}

	// prize(): `Generator.randomArmor(floorSet+1)`, then - only when the armor came out
	// uncursed AND without a good glyph - one `Armor.Glyph.randomCurse()` draw. `upgrade()`
	// itself costs no RNG. Previously skipped entirely.
	const generated = cursedGiftPrize(floorSetForPrize(1), 'armor');
	level.drop('armor', cx + cy * level.width(), 'tomb')!.sourceClass = generated.cls;
}
