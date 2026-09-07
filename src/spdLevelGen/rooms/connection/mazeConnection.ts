/**
 * Port of `levels/rooms/connection/MazeConnectionRoom.java`'s `paint()` - the hidden maze tunnel
 * that leads to a `SecretRoom`. Reuses `rooms/secret/maze.ts`'s existing `Maze.generate()` port
 * (the same algorithm `SecretMazeRoom` uses, with `allowDiagonals = false`).
 *
 * Java fills the inset with EMPTY *twice* (once before generating the maze, once after) - a
 * redundant but harmless double-fill kept here so the tile output matches exactly. Door types are
 * set to HIDDEN by the caller in `paint.ts`, matching Java.
 */
import { Room } from '../../room';
import { PaintLevel, Terrain, fillRoomInset, fillXY } from '../../paintLevel';
import { mazeGenerate } from '../secret/maze';

export function paintMazeConnection(level: PaintLevel, room: Room, _floor: number): void {
	// Painter.fill(level, this, 1, Terrain.EMPTY) - note MazeConnectionRoom uses EMPTY directly,
	// not tunnelTile(), so the floor argument is deliberately unused.
	fillRoomInset(level, room, 1, Terrain.EMPTY);

	const w = room.width(), h = room.height();
	const doorLocalPoints = [...room.connected.values()]
		.filter((d): d is NonNullable<typeof d> => d !== null)
		.map(d => ({ x: d.x - room.left, y: d.y - room.top }));
	const maze = mazeGenerate(w, h, doorLocalPoints);

	fillRoomInset(level, room, 1, Terrain.EMPTY);
	for (let x = 0; x < w; x++) {
		for (let y = 0; y < h; y++) {
			if (maze[x][y]) fillXY(level, x + room.left, y + room.top, 1, 1, Terrain.WALL);
		}
	}
}
