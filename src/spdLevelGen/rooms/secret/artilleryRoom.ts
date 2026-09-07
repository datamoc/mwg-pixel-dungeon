/** Port of `levels/rooms/secret/SecretArtilleryRoom.java`. Fully real geometry and position-retry
 *  loops; `new Bomb.DoubleBomb()` is a direct, non-Generator construct and each generated missile
 *  keeps its concrete class id through the live bridge. */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, set } from '../../paintLevel';
import { randomMissile, floorSetForPrize } from '../../../spdItems/generator';

export function paintArtilleryRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY_SP);

	const c = room.center();
	set(level, c.x, c.y, Terrain.STATUE_SP);

	for (let i = 0; i < 3; i++) {
		let pos: number;
		do { pos = level.pointToCell(room.random()); } while (level.map[pos] !== Terrain.EMPTY_SP || level.findHeap(pos));
		if (i === 0) level.drop('doubleBomb', pos);
		else {
			// `Generator.randomMissile(true)`: the tier `chances` roll AND - because
			// `useDefaults` routes through `randomUsingDefaults` - the class pick too, both on the
			// level stream, plus `MissileWeapon.random()`'s level/curse/enchant rolls.
			const missile = randomMissile(floorSetForPrize(0), true);
			level.drop('missile', pos)!.sourceClass = missile.cls;
		}
	}

	room.entranceDoor().set(DoorType.HIDDEN);
}
