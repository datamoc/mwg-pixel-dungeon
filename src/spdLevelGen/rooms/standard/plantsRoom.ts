/**
 * Port of `levels/rooms/standard/PlantsRoom.java`. `randomSeed()`'s
 * `Generator.randomUsingDefaults(SEED)` (excluding Firebloom, via a do-while) is a real,
 * NOW PORTED (was an unported RNG-order divergence): `randomSeed()`'s
 * `Generator.randomUsingDefaults(SEED)` rolls on the level-gen stream, so it is reproduced via
 * `generatorSeeds.ts`. Previously this placed a generic 'seed' marker with ZERO
 * Random calls, rather than fabricating a guess at Generator's internal call shape. Every OTHER
 * roll in this room (orientation, which corner layout) is real Random.Int(2), fully portable.
 */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, drawLine } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';
import { randomNonFirebloomSeed } from '../../generatorSeeds';

export function paintPlantsRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.GRASS);
	fillRoomInset(level, room, 2, Terrain.HIGH_GRASS);

	if (Math.min(room.width(), room.height()) >= 7) fillRoomInset(level, room, 3, Terrain.GRASS);

	const center = room.center();

	if (Math.max(room.width(), room.height()) >= 9) {
		if (Math.min(room.width(), room.height()) >= 11) {
			drawLine(level, { x: room.left + 2, y: center.y }, { x: room.right - 2, y: center.y }, Terrain.HIGH_GRASS);
			drawLine(level, { x: center.x, y: room.top + 2 }, { x: center.x, y: room.bottom - 2 }, Terrain.HIGH_GRASS);
			level.plant(randomNonFirebloomSeed(), level.pointToCell({ x: center.x - 1, y: center.y - 1 }));
			level.plant(randomNonFirebloomSeed(), level.pointToCell({ x: center.x + 1, y: center.y - 1 }));
			level.plant(randomNonFirebloomSeed(), level.pointToCell({ x: center.x - 1, y: center.y + 1 }));
			level.plant(randomNonFirebloomSeed(), level.pointToCell({ x: center.x + 1, y: center.y + 1 }));
		} else if (room.width() > room.height() || (room.width() === room.height() && SpdRandom.int(2) === 0)) {
			drawLine(level, { x: center.x, y: room.top + 2 }, { x: center.x, y: room.bottom - 2 }, Terrain.HIGH_GRASS);
			level.plant(randomNonFirebloomSeed(), level.pointToCell({ x: center.x - 1, y: center.y }));
			level.plant(randomNonFirebloomSeed(), level.pointToCell({ x: center.x + 1, y: center.y }));
		} else {
			drawLine(level, { x: room.left + 2, y: center.y }, { x: room.right - 2, y: center.y }, Terrain.HIGH_GRASS);
			level.plant(randomNonFirebloomSeed(), level.pointToCell({ x: center.x, y: center.y - 1 }));
			level.plant(randomNonFirebloomSeed(), level.pointToCell({ x: center.x, y: center.y + 1 }));
		}
	} else {
		level.plant(randomNonFirebloomSeed(), level.pointToCell(center));
	}

	for (const door of room.connected.values()) door?.set(DoorType.REGULAR);
}
