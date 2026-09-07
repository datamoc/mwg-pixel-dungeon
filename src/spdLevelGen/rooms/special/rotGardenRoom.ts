/**
 * Port of `levels/rooms/special/RotGardenRoom.java` - the `Wandmaker` quest type-3 room.
 * Never selected via `SpecialRoom.createRoom()`'s queue; appended directly by
 * `Wandmaker.Quest.spawnRoom()` (see `wandmaker.ts`). Fully RNG-faithful - the plants are
 * `Mob`s whose constructors take no random state, so nothing here is Generator-dependent.
 *
 * Draw order:
 * 1. `Random.IntRange(left+1, right-1)` then `Random.IntRange(top+1, bottom-1)` for the heart
 *    position. Both draws happen unconditionally, even though the entrance-side `if/else if`
 *    chain immediately below usually overwrites one of the two results - a case where the
 *    obvious "optimization" of only drawing the axis that survives would desync the stream.
 * 2. Per lasher (`((width-2)*(height-2))/8` of them): a
 *    `do { random() } while (!validPlantPos(...))` loop, two `Random.IntRange` draws per
 *    attempt. Note `validPlantPos` also rejects any cell with a mob in its 3x3 neighbourhood,
 *    so earlier lashers genuinely constrain later ones.
 *
 * `placePlant` upgrades the 8 neighbours of each plant from `GRASS` to `HIGH_GRASS`, which is
 * what makes `validPlantPos`' `map[pos] != GRASS` check progressively reject more cells.
 */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, neighbours8 } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';

export function paintRotGardenRoom(level: PaintLevel, room: Room): void {
	const entrance = room.entranceDoor();
	entrance.set(DoorType.LOCKED);
	level.addItemToSpawn('ironKey');

	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.GRASS);

	let heartX = SpdRandom.intRange(room.left + 1, room.right - 1);
	let heartY = SpdRandom.intRange(room.top + 1, room.bottom - 1);

	if (entrance.x === room.left) {
		heartX = room.right - 1;
	} else if (entrance.x === room.right) {
		heartX = room.left + 1;
	} else if (entrance.y === room.top) {
		heartY = room.bottom - 1;
	} else if (entrance.y === room.bottom) {
		heartY = room.top + 1;
	}

	placePlant(level, heartX + heartY * level.w, 'rotHeart');

	const lashers = Math.floor(((room.width() - 2) * (room.height() - 2)) / 8);

	for (let i = 1; i <= lashers; i++) {
		let pos: number;
		do {
			pos = level.pointToCell(room.random());
		} while (!validPlantPos(level, pos));
		placePlant(level, pos, 'rotLasher');
	}
}

function validPlantPos(level: PaintLevel, pos: number): boolean {
	if (level.map[pos] !== Terrain.GRASS) return false;

	// PathFinder.NEIGHBOURS9 - the 8 neighbours plus the cell itself.
	for (const i of neighbours8(level)) {
		if (level.findMob(pos + i) !== undefined) return false;
	}
	if (level.findMob(pos) !== undefined) return false;

	return true;
}

function placePlant(level: PaintLevel, pos: number, kind: string): void {
	// These are `Mob`s in Java (RotHeart/RotLasher), not `Plant`s - they occupy cells and are
	// what `validPlantPos`' `findMob` check sees.
	level.mobs.push({ pos, kind });

	for (const i of neighbours8(level)) {
		if (level.map[pos + i] === Terrain.GRASS) {
			level.map[pos + i] = Terrain.HIGH_GRASS;
		}
	}
}
