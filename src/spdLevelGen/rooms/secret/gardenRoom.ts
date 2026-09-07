/** Port of `levels/rooms/secret/SecretGardenRoom.java`. The high-grass patch (`Patch.generate`,
 *  via `spdPatch.ts`) and the four seed-placement retry loops are fully real/portable - no
 *  Generator/item-subsystem dependency, just fixed plant tags. `Foliage` light-blob seeding is
 *  skipped (no blob/light system exists in this port) - it has no `Random.*` call anyway. */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, set } from '../../paintLevel';
import { spdPatchGenerate } from '../../spdPatch';
import { SpdRandom } from '../../../spdRng';

function plantPos(level: PaintLevel, room: Room): number {
	let pos: number;
	do { pos = level.pointToCell(room.random()); } while (level.plants.some(p => p.pos === pos));
	return pos;
}

export function paintGardenRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.GRASS);

	const pw = room.width() - 2, ph = room.height() - 2;
	const patch = spdPatchGenerate(pw, ph, 0.5, 0, true);
	for (let i = room.top + 1; i < room.bottom; i++) {
		for (let j = room.left + 1; j < room.right; j++) {
			if (patch[(j - room.left - 1) + (i - room.top - 1) * pw]) set(level, j, i, Terrain.HIGH_GRASS);
		}
	}

	room.entranceDoor().set(DoorType.HIDDEN);

	level.plant('starflowerSeed', plantPos(level, room));
	level.plant('seedpodSeed', plantPos(level, room));
	level.plant('dewcatcherSeed', plantPos(level, room));

	if (SpdRandom.int(2) === 0) level.plant('seedpodSeed', plantPos(level, room));
	else level.plant('dewcatcherSeed', plantPos(level, room));

	// Foliage light-blob seeding: no Random.* call in Java, and no blob/light system exists here
	// to seed - skipped entirely (not an RNG-order gap).
}
