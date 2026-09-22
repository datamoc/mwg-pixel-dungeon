/**
 * Port of `levels/rooms/standard/AquariumRoom.java`. `Piranha.random()`'s `Random.Int(50)`
 * phantom-variant roll IS made, once per fish and BEFORE that fish's placement loop, exactly as
 * Java orders it - it is a real level-stream draw and selects PhantomPiranha at 1/50. Piranhas are emitted as live room mobs; the
 * gameplay bridge supplies their depth-scaled stats, meat loot, water-only movement, and land
 * death rule. The placement retry loop (`random(3)` + water/mob checks) was already real.
 */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';

export function paintAquariumRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY);
	fillRoomInset(level, room, 2, Terrain.EMPTY_SP);
	fillRoomInset(level, room, 3, Terrain.WATER);

	const minDim = Math.min(room.width(), room.height());
	const numFish = Math.floor((minDim - 4) / 3);

	for (let i = 0; i < numFish; i++) {
		const phantom = SpdRandom.int(50) === 0; // Piranha.random()
		let pos: number;
		do {
			pos = level.pointToCell(room.random(3));
		} while (level.map[pos] !== Terrain.WATER || level.findMob(pos) !== undefined);
		level.mobs.push({ pos, kind: phantom ? 'phantomPiranha' : 'piranha' });
	}

	for (const door of room.connected.values()) door?.set(DoorType.REGULAR);
}
