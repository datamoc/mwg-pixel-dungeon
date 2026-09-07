/** Port of `levels/rooms/secret/SecretSummoningRoom.java`. `maxWidth/maxHeight` (8/8) live in
 *  `room.ts`'s `SECRET_ROOM_META`. Entirely deterministic geometry - `SECRET_TRAP` fills every
 *  interior cell, so every one gets a `SummoningTrap`; `Generator.random()`'s skeleton-item draws are
 *  now reproduced (see `spdItems/generator.ts`); its position is the fixed room center (no retry loop in Java
 *  here, unlike most other secret rooms). */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, roomPoints } from '../../paintLevel';
import { generatedGroundKind, generatorRandom } from '../../../spdItems/generator';

export function paintSummoningRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.SECRET_TRAP);

	const c = room.center();
	// `Generator.random()` (no-arg): the run-level `categoryProbs` deck roll plus the chosen
	// category's own draws, all on the level stream. Previously skipped entirely.
	const generated = generatorRandom();
	level.drop(generatedGroundKind(generated), level.pointToCell(c))!.sourceClass = generated.cls;

	for (const p of roomPoints(room)) {
		const cell = level.pointToCell(p);
		if (level.map[cell] === Terrain.SECRET_TRAP) level.setTrap('summoningTrap', true, true, cell);
	}

	room.entranceDoor().set(DoorType.HIDDEN);
}
