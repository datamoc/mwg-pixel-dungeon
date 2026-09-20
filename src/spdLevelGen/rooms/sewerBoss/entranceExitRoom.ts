/**
 * Port of `levels/rooms/sewerboss/SewerBossEntranceRoom.java`/`SewerBossExitRoom.java`. Both
 * extend `EntranceRoom`/`ExitRoom` and only override `minWidth()`/`minHeight()` (see
 * `room.ts`'s `sewerBossVariant` field) and `paint()`.
 *
 * `SewerBossExitRoom.SewerExit`/`SewerExitOverhang` custom tilemaps and
 * `SewerBossEntranceRoom`/`ExitRoom`'s `LevelTransition` rect-widening (`exit.top--` etc, a
 * click/step hitbox tweak) are NOT ported - purely cosmetic, and this port's `Transition` type
 * is a single cell position, not a rect. The exit cell itself paints as `Terrain.LOCKED_EXIT`
 * (`gameBridge.ts` sends it to `'wall'`, impassable) and no `LevelTransition` is pushed for it: the
 * scene's `unlockPaintedExit` (`scenes/bossUnseal.ts`) turns that niche into a walkable `EXIT`
 * stairs cell when Goo dies, the port's stand-in for Java's `LockedFloor`-gated transition rect.
 */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, fillXY, drawInside } from '../../paintLevel';

export function paintSewerBossEntranceRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY);
	fillXY(level, room.left + 1, room.top + 1, room.width() - 2, 1, Terrain.WALL_DECO);
	fillXY(level, room.left + 1, room.top + 2, room.width() - 2, 1, Terrain.WATER);

	let entrance: number;
	do {
		entrance = level.pointToCell(room.random(3));
	} while (level.findMob(entrance) !== undefined);
	level.map[entrance] = Terrain.ENTRANCE;
	level.transitions.push({ pos: entrance, type: 'regularEntrance' });

	for (const door of room.connected.values()) {
		if (!door) continue;
		door.set(DoorType.REGULAR);
		if (door.y === room.top || door.y === room.top + 1) {
			drawInside(level, room, door, 1, Terrain.WATER);
		}
	}
}

export function paintSewerBossExitRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY);
	for (const door of room.connected.values()) door?.set(DoorType.REGULAR);

	const c = room.center();
	fillXY(level, c.x - 1, c.y - 1, 3, 2, Terrain.WALL);
	fillXY(level, c.x - 1, c.y + 1, 3, 1, Terrain.EMPTY_SP);

	const exitCell = level.pointToCell(c);
	level.map[exitCell] = Terrain.LOCKED_EXIT;
}
