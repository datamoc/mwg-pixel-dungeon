/**
 * Port of `levels/rooms/special/PoolRoom.java`. Geometry, door-side branch, and `prize()`'s
 * leading `Random.Int(3)` roll (33% `findPrizeItem()` chance - our `findPrizeItem()` stub always
 * returns null like every other room file, so it never short-circuits, but the roll itself still
 * needs to fire for RNG-order fidelity) are portable. `Generator.randomWeapon`/`randomArmor`'s
 * internal rolls plus the `while (cursed || blocked)` retry count are Generator-subsystem-
 * internal - now real via `uncursedWeaponOrArmorPrize()`, whose retry count is driven by the
 * `cursed` flag the Generator rolls (see PORT_COVERAGE.md).
 * `Piranha.random()`'s `Random.Int(50)` phantom-variant roll IS made (one per piranha) - it is a
 * real level-stream draw, even though this port doesn't model the variant itself.
 */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, fillXY, set } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';
import { floorSetForPrize, generatedGroundKind, uncursedWeaponOrArmorPrize } from '../../../spdItems/generator';

const NPIRANHAS = 3;

export function paintPoolRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.WATER);

	const door = room.entranceDoor();
	door.set(DoorType.REGULAR);

	let x = -1, y = -1;
	if (door.x === room.left) {
		x = room.right - 1; y = room.top + Math.floor(room.height() / 2);
		fillXY(level, room.left + 1, room.top + 1, 1, room.height() - 2, Terrain.EMPTY_SP);
	} else if (door.x === room.right) {
		x = room.left + 1; y = room.top + Math.floor(room.height() / 2);
		fillXY(level, room.right - 1, room.top + 1, 1, room.height() - 2, Terrain.EMPTY_SP);
	} else if (door.y === room.top) {
		x = room.left + Math.floor(room.width() / 2); y = room.bottom - 1;
		fillXY(level, room.left + 1, room.top + 1, room.width() - 2, 1, Terrain.EMPTY_SP);
	} else if (door.y === room.bottom) {
		x = room.left + Math.floor(room.width() / 2); y = room.top + 1;
		fillXY(level, room.left + 1, room.bottom - 1, room.width() - 2, 1, Terrain.EMPTY_SP);
	}

	const pos = x + y * level.width();
	// prize(): `if (Random.Int(3) == 0)` guards `findPrizeItem()`; on a hit Java returns that
	// item immediately and neither the weapon/armor loop nor the upgrade roll happens.
	let prize: string | null = null;
	if (SpdRandom.int(3) === 0) prize = level.findPrizeItem();
	if (prize === null) {
		prize = generatedGroundKind(uncursedWeaponOrArmorPrize(floorSetForPrize(1)));
		SpdRandom.int(3);
	}
	level.drop(prize, pos, 'chest');
	set(level, x, y, Terrain.PEDESTAL);

	level.drop('potionOfInvisibility', pos, 'itemToSpawn');

	for (let i = 0; i < NPIRANHAS; i++) {
		// `Piranha.random()`: `Random.Int(50) == 0` picks a `PhantomPiranha` over a plain one -
		// one real level-stream draw PER piranha, made BEFORE the position loop. Previously
		// skipped entirely (documented as an ignorable "variant roll"), which is wrong: the draw
		// exists whether or not this port models the variant.
		SpdRandom.int(50);
		let pos2: number;
		do {
			const p = room.random();
			pos2 = level.pointToCell(p);
		} while (level.map[pos2] !== Terrain.WATER || level.findMob(pos2) !== undefined);
		level.mobs.push({ pos: pos2, kind: 'piranha' });
	}
}
