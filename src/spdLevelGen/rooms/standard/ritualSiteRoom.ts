/**
 * Port of `levels/rooms/standard/RitualSiteRoom.java` - the `Wandmaker` quest type-2 room.
 * Never selected via `StandardRoom.chances[]`; appended directly by
 * `Wandmaker.Quest.spawnRoom()` (see `wandmaker.ts`).
 *
 * Its only draw is the single `center()` call, which rolls `Random.Int(2)` on each axis whose
 * span is even (see `Room.center()`). The four `addItemToSpawn(new CeremonialCandle())` calls
 * are free - `CeremonialCandle`'s constructor takes no random state.
 *
 * Documented simplification: `canPlaceItem`/`canPlaceCharacter` override placement to keep a
 * 2-tile radius clear around `CeremonialCandle.ritualPos`. That is threaded through
 * `ritualPos` below and honoured by this room's own placement predicates, but nothing else in
 * this port consults it, matching how narrowly Java scopes it (both overrides are on this room
 * only). It consumes no RNG either way, so it cannot desync the stream - only shift where a
 * later item lands inside this one room.
 */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, fillXY } from '../../paintLevel';

/** `CeremonialCandle.ritualPos` - static, set while painting, read by this room's placement
 *  predicates. Reset per floor by `wandmaker.ts`'s run-state reset. */
export const ritualSiteState = { ritualPos: -1 };

export function paintRitualSiteRoom(level: PaintLevel, room: Room): void {
	for (const door of room.connected.values()) door?.set(DoorType.REGULAR);

	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY);

	// `RitualMarker` is a CustomTilemap (visual only, no RNG, not modeled beyond the tiles).
	const c = room.center();

	fillXY(level, c.x - 1, c.y - 1, 3, 3, Terrain.EMPTY_DECO);

	level.addItemToSpawn('ceremonialCandle');
	level.addItemToSpawn('ceremonialCandle');
	level.addItemToSpawn('ceremonialCandle');
	level.addItemToSpawn('ceremonialCandle');

	ritualSiteState.ritualPos = c.x + level.w * c.y;
}
