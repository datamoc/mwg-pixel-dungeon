/** Port of `levels/features/Maze.java`'s growing-tree maze algorithm (`allowDiagonals = false`,
 *  the only mode `SecretMazeRoom` uses) and the 8-directional BFS distance map `SecretMazeRoom`
 *  runs over it (`PathFinder.buildDistanceMap`, ported directly here rather than reused from
 *  `regularPainter.ts`'s room-graph BFS, which walks `Room` edges, not a raw grid). Both are
 *  self-contained, fully real/portable algorithms - no Generator/item dependency anywhere in them. */
import { SpdRandom } from '../../../spdRng';

const FILLED = true, EMPTY = false;

function checkValidMove(maze: boolean[][], x: number, y: number, movX: number, movY: number, allowDiagonals: boolean): boolean {
	const sideX = 1 - Math.abs(movX), sideY = 1 - Math.abs(movY);
	const w = maze.length, h = maze[0].length;

	x += movX; y += movY;
	if (x <= 0 || x >= w - 1 || y <= 0 || y >= h - 1) return false;
	if (maze[x][y] || maze[x + sideX][y + sideY] || maze[x - sideX][y - sideY]) return false;

	x += movX; y += movY;
	if (x <= 0 || x >= w - 1 || y <= 0 || y >= h - 1) return false;
	if (maze[x][y]) return false;
	if (!allowDiagonals && (maze[x + sideX][y + sideY] || maze[x - sideX][y - sideY])) return false;

	return true;
}

/** `decideDirection`: each of the 3 `Random.Int` rolls is its own `if`, not an else-if chain, so
 *  all reached rolls happen in order even when an earlier direction's `checkValidMove` fails - only
 *  an early *success* (roll hits AND the move is valid) short-circuits the rest. */
function decideDirection(maze: boolean[][], x: number, y: number, allowDiagonals: boolean): [number, number] | null {
	if (SpdRandom.int(4) === 0 && checkValidMove(maze, x, y, 0, -1, allowDiagonals)) return [0, -1];
	if (SpdRandom.int(3) === 0 && checkValidMove(maze, x, y, 1, 0, allowDiagonals)) return [1, 0];
	if (SpdRandom.int(2) === 0 && checkValidMove(maze, x, y, 0, 1, allowDiagonals)) return [0, 1];
	if (checkValidMove(maze, x, y, -1, 0, allowDiagonals)) return [-1, 0];
	return null;
}

/** `Maze.generate(boolean[][])`'s 2500-fail loop, carving into an already-bordered `maze`. */
function growMaze(maze: boolean[][], allowDiagonals: boolean): void {
	let fails = 0;
	while (fails < 2500) {
		let x: number, y: number;
		do { x = SpdRandom.int(maze.length); y = SpdRandom.int(maze[0].length); } while (!maze[x][y]);

		const mov = decideDirection(maze, x, y, allowDiagonals);
		if (mov === null) {
			fails++;
		} else {
			fails = 0;
			let moves = 0;
			do {
				x += mov[0]; y += mov[1];
				maze[x][y] = FILLED;
				moves++;
			} while (SpdRandom.int(moves) === 0 && checkValidMove(maze, x, y, mov[0], mov[1], allowDiagonals));
		}
	}
}

/** `Maze.generate(Room)`: `width x height` grid, bordered, with each already-placed door on the
 *  room's edge carved open before growth starts. Door positions must already be assigned (this
 *  port's paint driver places doors before calling a room's `paint()`, matching Java's own order). */
export function mazeGenerate(width: number, height: number, doorLocalPoints: { x: number; y: number }[]): boolean[][] {
	const maze: boolean[][] = Array.from({ length: width }, () => new Array<boolean>(height).fill(EMPTY));
	for (let x = 0; x < width; x++) {
		for (let y = 0; y < height; y++) {
			if (x === 0 || x === width - 1 || y === 0 || y === height - 1) maze[x][y] = FILLED;
		}
	}
	for (const d of doorLocalPoints) maze[d.x][d.y] = EMPTY;

	growMaze(maze, false);
	return maze;
}

/**
 * `PathFinder.buildDistanceMap(to, passable)`: 8-directional BFS over a flat `w x h` grid
 * (`dirLR` order `[-1-w,-1,-1+w,-w,+w,+1-w,+1,+1+w]`, trimmed at the left/right edges to avoid
 * horizontal wraparound - exactly `PathFinder.java`'s own edge handling).
 */
export function buildGridDistanceMap(w: number, h: number, passable: boolean[], from: number): number[] {
	const size = w * h;
	const distance = new Array<number>(size).fill(Infinity);
	const dirLR = [-1 - w, -1, -1 + w, -w, w, 1 - w, 1, 1 + w];

	distance[from] = 0;
	const queue: number[] = [from];
	let head = 0;
	while (head < queue.length) {
		const step = queue[head++];
		const nextDistance = distance[step] + 1;
		const start = step % w === 0 ? 3 : 0;
		const end = (step + 1) % w === 0 ? 3 : 0;
		for (let i = start; i < dirLR.length - end; i++) {
			const n = step + dirLR[i];
			if (n >= 0 && n < size && passable[n] && distance[n] > nextDistance) {
				distance[n] = nextDistance;
				queue.push(n);
			}
		}
	}
	return distance;
}
