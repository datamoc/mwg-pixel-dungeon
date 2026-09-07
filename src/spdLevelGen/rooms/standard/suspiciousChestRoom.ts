/**
 * Port of `levels/rooms/standard/SuspiciousChestRoom.java`. `level.findPrizeItem()` has no RNG
 * DOES consume RNG in Java whenever `level.itemsToSpawn` is non-empty (`Random.element` over it),
 * and returning an item there skips the `new Gold().random()` fallback entirely. Both halves used
 * to be missing here - the stub was hard-coded null AND the Gold quantity roll was skipped - which
 * put the `Random.Int(3)` mimic-vs-chest roll at the wrong stream position for every
 * SuspiciousChestRoom.
 */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, set } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';
import { generatedGroundKind, mimicGeneratePrize, randomGold } from '../../../spdItems/generator';

export function paintSuspiciousChestRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY);
	for (const door of room.connected.values()) door?.set(DoorType.REGULAR);

	// `Item i = level.findPrizeItem()` - a real `Random.element` draw when anything is queued -
	// and only when it comes back null does `new Gold().random()`'s `IntRange` fire.
	const prize = level.findPrizeItem() ?? (randomGold(), 'gold');

	const center = room.center();
	const cell = level.pointToCell(center);
	set(level, center.x, center.y, Terrain.PEDESTAL);

	if (SpdRandom.int(3) === 0) {
		// `Mimic.spawnAt()` always runs `Mimic.generatePrize()`, which draws on the level stream
		// (a plain `Mimic` here, so the base implementation - unlike `CrystalVaultRoom`, whose
		// `CrystalMimic.generatePrize()` override consumes none).
		const bonus = mimicGeneratePrize();
		level.mobs.push({ pos: cell, kind: 'mimic', loot: `${generatedGroundKind(bonus)};held:${prize}` });
	} else {
		level.drop(prize, cell, 'chest');
	}
}
