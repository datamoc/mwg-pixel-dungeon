/**
 * Port of `levels/rooms/special/DemonSpawnerRoom.java`'s room-content painting only.
 * `canPlaceTrap`/`canPlaceWater`/`canPlaceGrass` all-false overrides are modeled in
 * `regularPainter.ts` (`canPlaceTrapAt`/`canPlaceWaterAt`/`canPlaceGrassAt`, keyed on
 * `specialKind === 'demonSpawner'`), not here. `connect()`'s refusal to connect to the
 * `EntranceRoom` is implemented in `Room.canConnect()` as the same asymmetric receiver-side
 * rule as Java.
 *
 * Placing the real `DemonSpawner` mob is retained in `level.mobs` and consumed by the live
 * bridge, so the room-local position and RNG result survive into the playable floor. Its
 * `DemonSpawnerRoom.CustomFloor` atlas is rendered by `main.ts` after actors are restored;
 * the room painter deliberately remains responsible only for the Java map/content data.
 */
import { Room } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset } from '../../paintLevel';

export function paintDemonSpawnerRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY);

	const center = room.center();
	level.mobs.push({ pos: level.pointToCell(center), kind: 'demonSpawner' });
}
