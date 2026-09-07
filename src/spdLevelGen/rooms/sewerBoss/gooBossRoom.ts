/**
 * Port of `levels/rooms/sewerboss/GooBossRoom.java` and its 4 concrete subclasses
 * (`DiamondGooRoom`/`WalledGooRoom`/`ThinPillarsGooRoom`/`ThickPillarsGooRoom.java`). Every
 * `paint()` here is pure geometry - zero `Random.*` calls, confirmed by reading all four Java
 * files - so the only RNG this room type contributes to the graph stage is its `StandardRoom`
 * instance-initializer `setSizeCat()` roll (via `STANDARD_ROOM_META`'s `sizeCatProbs: [0,1,0]`,
 * forcing LARGE) and `randomGooBossKind()`'s own `Random.Int(4)` pick below.
 *
 * `GooBossRoom.setupGooNest()`'s `GooNest` custom tilemap (a purely decorative floor texture
 * under the boss) is NOT ported - it has no gameplay effect and this port has no equivalent
 * decal-layer asset for it. Likewise the `Goo` boss placement itself
 * (`level.mobs.add(new Goo())`) is not done here: mob spawning for a ported floor is
 * `main.ts`'s job (`populate()`'s existing `BOSSES[depth]` boss-floor branch, which already
 * spawns the region's boss at the last room in `this.level.rooms` - see `gameBridge.ts`'s
 * `extract()`, which moves this room to the end of the returned list for exactly that reason).
 */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillXY, set } from '../../paintLevel';
import { fillPerimeterPaths } from '../connection/paint';
import { SpdRandom } from '../../../spdRng';
import type { StandardRoomKind } from '../../room';

/**
 * `GooBossRoom.randomGooRoom()`: `Random.Int(4)` picks the concrete class. Called directly by
 * `sewerBossInitRooms()` (see `regularLevel.ts`), not through the normal `StandardRoom.chances[]`
 * roll - `gooDiamond`/`gooWalled`/`gooThinPillars`/`gooThickPillars` are deliberately absent from
 * `STANDARD_ROOM_CLASS_ORDER`.
 */
export function randomGooBossKind(): StandardRoomKind {
	switch (SpdRandom.int(4)) {
		case 0: default: return 'gooDiamond';
		case 1: return 'gooWalled';
		case 2: return 'gooThinPillars';
		case 3: return 'gooThickPillars';
	}
}

/**
 * `Painter.fillDiamond(Level, Rect, int m, int value)`: the 3-arg overload used by
 * `DiamondGooRoom` insets by `m` first, then delegates to the 4-arg core below. Java's virtual
 * dispatch on `rect.width()`/`height()` resolves to `Room`'s +1-inclusive override here (the
 * `Rect` static type in the method signature doesn't change that at runtime), so `room.width()`/
 * `height()` are used directly rather than the raw `right-left` form.
 */
function fillDiamondRoom(level: PaintLevel, room: Room, m: number, value: number): void {
	fillDiamond(level, room.left + m, room.top + m, room.width() - m * 2, room.height() - m * 2, value);
}
function fillDiamond(level: PaintLevel, x: number, y: number, w: number, h: number, value: number): void {
	let diamondWidth = w - (h - 2 - (h % 2));
	diamondWidth = Math.max(diamondWidth, w % 2 === 0 ? 2 : 3);
	for (let i = 0; i <= h; i++) {
		fillXY(level, x + Math.floor((w - diamondWidth) / 2), y + i, diamondWidth, h - 2 * i, value);
		diamondWidth += 2;
		if (diamondWidth > w) break;
	}
}

export function paintGooDiamondRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillDiamondRoom(level, room, 1, Terrain.EMPTY);

	for (const door of room.connected.values()) {
		if (!door) continue;
		door.set(DoorType.REGULAR);
		let dx: number, dy: number;
		if (door.x === room.left) { dx = 1; dy = 0; }
		else if (door.y === room.top) { dx = 0; dy = 1; }
		else if (door.x === room.right) { dx = -1; dy = 0; }
		else { dx = 0; dy = -1; }

		let x = door.x, y = door.y;
		do {
			set(level, x, y, Terrain.EMPTY_SP);
			x += dx; y += dy;
		} while (level.map[x + y * level.w] === Terrain.WALL);
	}

	fillXY(level, room.left + Math.floor(room.width() / 2) - 1, room.top + Math.floor(room.height() / 2) - 2, 2 + (room.width() % 2), 4 + (room.height() % 2), Terrain.WATER);
	fillXY(level, room.left + Math.floor(room.width() / 2) - 2, room.top + Math.floor(room.height() / 2) - 1, 4 + (room.width() % 2), 2 + (room.height() % 2), Terrain.WATER);
}

export function paintGooWalledRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillXY(level, room.left + 1, room.top + 1, room.width() - 2, room.height() - 2, Terrain.EMPTY_SP);
	fillXY(level, room.left + 2, room.top + 2, room.width() - 4, room.height() - 4, Terrain.EMPTY);

	const pillarW = Math.floor((room.width() - 6) / 2);
	const pillarH = Math.floor((room.height() - 6) / 2);

	fillXY(level, room.left + 2, room.top + 2, pillarW, 1, Terrain.WALL);
	fillXY(level, room.left + 2, room.top + 2, 1, pillarH, Terrain.WALL);

	fillXY(level, room.left + 2, room.bottom - 2, pillarW, 1, Terrain.WALL);
	fillXY(level, room.left + 2, room.bottom - 1 - pillarH, 1, pillarH, Terrain.WALL);

	fillXY(level, room.right - 1 - pillarW, room.top + 2, pillarW, 1, Terrain.WALL);
	fillXY(level, room.right - 2, room.top + 2, 1, pillarH, Terrain.WALL);

	fillXY(level, room.right - 1 - pillarW, room.bottom - 2, pillarW, 1, Terrain.WALL);
	fillXY(level, room.right - 2, room.bottom - 1 - pillarH, 1, pillarH, Terrain.WALL);

	for (const door of room.connected.values()) {
		if (!door) continue;
		door.set(DoorType.REGULAR);
	}

	fillXY(level, room.left + Math.floor(room.width() / 2) - 1, room.top + Math.floor(room.height() / 2) - 2, 2 + (room.width() % 2), 4 + (room.height() % 2), Terrain.WATER);
	fillXY(level, room.left + Math.floor(room.width() / 2) - 2, room.top + Math.floor(room.height() / 2) - 1, 4 + (room.width() % 2), 2 + (room.height() % 2), Terrain.WATER);
}

export function paintGooThinPillarsRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillXY(level, room.left + 1, room.top + 1, room.width() - 2, room.height() - 2, Terrain.WATER);

	const pillarW = (room.width() === 14 ? 4 : 2) + (room.width() % 2);
	const pillarH = (room.height() === 14 ? 4 : 2) + (room.height() % 2);

	if (room.height() < 12) {
		fillXY(level, room.left + Math.floor((room.width() - pillarW) / 2), room.top + 2, pillarW, 1, Terrain.WALL);
		fillXY(level, room.left + Math.floor((room.width() - pillarW) / 2), room.bottom - 2, pillarW, 1, Terrain.WALL);
	} else {
		fillXY(level, room.left + Math.floor((room.width() - pillarW) / 2), room.top + 3, pillarW, 1, Terrain.WALL);
		fillXY(level, room.left + Math.floor((room.width() - pillarW) / 2), room.bottom - 3, pillarW, 1, Terrain.WALL);
	}

	if (room.width() < 12) {
		fillXY(level, room.left + 2, room.top + Math.floor((room.height() - pillarH) / 2), 1, pillarH, Terrain.WALL);
		fillXY(level, room.right - 2, room.top + Math.floor((room.height() - pillarH) / 2), 1, pillarH, Terrain.WALL);
	} else {
		fillXY(level, room.left + 3, room.top + Math.floor((room.height() - pillarH) / 2), 1, pillarH, Terrain.WALL);
		fillXY(level, room.right - 3, room.top + Math.floor((room.height() - pillarH) / 2), 1, pillarH, Terrain.WALL);
	}

	fillPerimeterPaths(level, room, Terrain.EMPTY_SP);

	for (const door of room.connected.values()) {
		if (!door) continue;
		door.set(DoorType.REGULAR);
	}
}

export function paintGooThickPillarsRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillXY(level, room.left + 1, room.top + 1, room.width() - 2, room.height() - 2, Terrain.WATER);

	const pillarW = Math.floor((room.width() - 8) / 2);
	const pillarH = Math.floor((room.height() - 8) / 2);

	fillXY(level, room.left + 2, room.top + 2, pillarW + 1, pillarH + 1, Terrain.WALL);
	fillXY(level, room.left + 2, room.bottom - 2 - pillarH, pillarW + 1, pillarH + 1, Terrain.WALL);
	fillXY(level, room.right - 2 - pillarW, room.top + 2, pillarW + 1, pillarH + 1, Terrain.WALL);
	fillXY(level, room.right - 2 - pillarW, room.bottom - 2 - pillarH, pillarW + 1, pillarH + 1, Terrain.WALL);

	fillPerimeterPaths(level, room, Terrain.EMPTY_SP);

	for (const door of room.connected.values()) {
		if (!door) continue;
		door.set(DoorType.REGULAR);
	}
}
