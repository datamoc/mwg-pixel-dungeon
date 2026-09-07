/**
 * Port of `levels/rooms/standard/GrassyGraveRoom.java`. The position math (`Random.Int(nGraves)`
 * index roll, `Random.Int(2)` shift, one `Random.Int(h-2)`/`Random.Int(w-2)` per grave) is real
 * `SpdRandom`, fully portable. `Generator.random()` (the one "prize" grave) and
 * `new Gold().random()` (every other grave) now use the real generator and preserve the
 * generated class id in the heap payload. The live bridge still reduces Gold quantities and
 * unsupported item classes to its playable item family.
 */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';
import { generatorRandom, randomGold } from '../../../spdItems/generator';

export function paintGrassyGraveRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	for (const door of room.connected.values()) door?.set(DoorType.REGULAR);
	fillRoomInset(level, room, 1, Terrain.GRASS);

	const w = room.width() - 2, h = room.height() - 2;
	const nGraves = Math.floor(Math.max(w, h) / 2);
	const index = SpdRandom.int(nGraves);
	const shift = SpdRandom.int(2);

	for (let i = 0; i < nGraves; i++) {
		const pos = w > h
			? (room.left + 1 + shift + i * 2) + (room.top + 2 + SpdRandom.int(h - 2)) * level.w
			: (room.left + 2 + SpdRandom.int(w - 2)) + (room.top + 1 + shift + i * 2) * level.w;
		// Java: `level.drop(i == index ? Generator.random() : new Gold().random(), pos)`.
		// Keep the concrete class id so `gameBridge.portItemKind()` can expose the same family.
		const item = i === index ? generatorRandom() : randomGold();
		level.drop(item.cls, pos, 'tomb')!.sourceClass = item.cls;
	}
}
