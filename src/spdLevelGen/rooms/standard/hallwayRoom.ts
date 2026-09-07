/**
 * Port of `levels/rooms/standard/HallwayRoom.java`. `minWidth()`/`minHeight()` floor at 5 and
 * `canMerge()` unconditionally false are modeled via `room.ts`'s `STANDARD_ROOM_META`/
 * `regularPainter.ts`'s `canMergeAt` (both keyed on `standardKind === 'hallway'`), not here.
 * Doors are routed inward to a shared 3x3 "connection space" at (near) the room's centre via two
 * axis-aligned line segments (`Painter.drawLine` x2 per door), then that hub is stamped
 * EMPTY_SP/STATUE_SP and every door is raised to REGULAR.
 */
import { Room, Door, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, drawLine, fillXY, set } from '../../paintLevel';

function gate(min: number, value: number, max: number): number {
	return Math.max(min, Math.min(value, max));
}

/** `HallwayRoom.getConnectionSpace()`: a 3x3 rect (inclusive) gated to stay 2 cells from every edge. */
function getConnectionSpace(room: Room): { left: number; top: number; right: number; bottom: number } {
	const c = room.center();
	const cx = gate(room.left + 2, c.x, room.right - 2);
	const cy = gate(room.top + 2, c.y, room.bottom - 2);
	return { left: cx - 1, top: cy - 1, right: cx + 1, bottom: cy + 1 };
}

export function paintHallwayRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY);

	const c = getConnectionSpace(room);

	for (const door of room.connected.values() as IterableIterator<Door | null>) {
		if (!door) continue;

		const start = { x: door.x, y: door.y };
		if (start.x === room.left) start.x++;
		else if (start.y === room.top) start.y++;
		else if (start.x === room.right) start.x--;
		else if (start.y === room.bottom) start.y--;

		let rightShift: number;
		if (start.x < c.left) rightShift = c.left - start.x;
		else if (start.x > c.right) rightShift = c.right - start.x;
		else rightShift = 0;

		let downShift: number;
		if (start.y < c.top) downShift = c.top - start.y;
		else if (start.y > c.bottom) downShift = c.bottom - start.y;
		else downShift = 0;

		let mid: { x: number; y: number };
		let end: { x: number; y: number };
		// always goes inward first
		if (door.x === room.left || door.x === room.right) {
			mid = { x: start.x + rightShift, y: start.y };
			end = { x: mid.x, y: mid.y + downShift };
		} else {
			mid = { x: start.x, y: start.y + downShift };
			end = { x: mid.x + rightShift, y: mid.y };
		}

		drawLine(level, start, mid, Terrain.EMPTY_SP);
		drawLine(level, mid, end, Terrain.EMPTY_SP);
	}

	fillXY(level, c.left, c.top, 3, 3, Terrain.EMPTY_SP);
	set(level, c.left + 1, c.top + 1, Terrain.STATUE_SP);

	for (const door of room.connected.values() as IterableIterator<Door | null>) {
		if (door) door.set(DoorType.REGULAR);
	}
}
