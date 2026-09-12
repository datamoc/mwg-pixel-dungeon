/**
 * Port of `levels/rooms/standard/PatchRoom.java`'s `setupPatch()` (the shared helper `CircleBasinRoom`
 * and `BurnedRoom` both use). `xyToPatchCoords` and the non-`ensurePath` branch are direct
 * translations. The `ensurePath` branch's connectivity check (`PathFinder.buildDistanceMap` over
 * `BArray.not(patch)`) is reimplemented here as a local 8-directional BFS, and that neighbourhood is
 * **verified against `PathFinder.java` at tag v3.3.8** (it was previously flagged as a best-effort
 * assumption with an RNG-burn risk, on the grounds that the neighbour set had not been re-read):
 * the two-argument `buildDistanceMap(to, passable)` (lines 382-412) walks `dirLR` (line 67), whose
 * eight offsets are the four axis neighbours plus the four diagonals this loop's `-1..1` box
 * produces. Two equivalences make it a match rather than an approximation: Java's row-edge
 * protection (`start = step % width == 0 ? 3 : 0`, `end = (step+1) % width == 0 ? 3 : 0`) exists only
 * to stop the flat-index arithmetic wrapping into the next row, which the explicit
 * `nx < 0 || ny < 0 || nx >= pw || ny >= ph` bound here achieves the same way; and Java's
 * distance-guarded queue (`distance[n] > nextDistance`) re-visits cells while a unit-weight flood
 * marks on first visit, which yields the same `seen` set. The predicate matches too - every
 * non-patch cell must be reached - so the retry count, and therefore the RNG this consumes, is
 * Java's. `CavesFissureRoom`'s own local BFS (`cavesFissureRoom.ts`, over the room interior via
 * `PathFinder.setMapSize(width()-2, height()-2)`) relies on the same 8-directional set.
 */
import { Room, Door } from '../../room';
import { spdPatchGenerate } from '../../spdPatch';

export function xyToPatchCoords(room: Room, x: number, y: number): number {
	return (x - room.left - 1) + (y - room.top - 1) * (room.width() - 2);
}

function bfsReachesEverywhere(patch: boolean[], pw: number, ph: number, startIdx: number): boolean {
	if (patch[startIdx]) return false;
	const seen = new Array<boolean>(patch.length).fill(false);
	const queue = [startIdx];
	seen[startIdx] = true;
	let head = 0;
	while (head < queue.length) {
		const i = queue[head++];
		const x = i % pw, y = Math.floor(i / pw);
		for (let dy = -1; dy <= 1; dy++) {
			for (let dx = -1; dx <= 1; dx++) {
				if (dx === 0 && dy === 0) continue;
				const nx = x + dx, ny = y + dy;
				if (nx < 0 || ny < 0 || nx >= pw || ny >= ph) continue;
				const ni = nx + ny * pw;
				if (seen[ni] || patch[ni]) continue;
				seen[ni] = true;
				queue.push(ni);
			}
		}
	}
	for (let i = 0; i < patch.length; i++) {
		if (!patch[i] && !seen[i]) return false;
	}
	return true;
}

/** `PatchRoom.cleanDiagonalEdges()`: removes a diagonal-only patch connection (down-left/down-right)
 *  when neither of its orthogonal neighbours is also patch, so a patch never touches itself only at
 *  a corner. Pure geometry, no RNG - shared by `CaveRoom` (the only current caller). */
export function cleanDiagonalEdges(patch: boolean[], pWidth: number): void {
	for (let i = 0; i < patch.length - pWidth; i++) {
		if (!patch[i]) continue;
		if (i % pWidth !== 0) {
			if (patch[i - 1 + pWidth] && !(patch[i - 1] || patch[i + pWidth])) patch[i - 1 + pWidth] = false;
		}
		if ((i + 1) % pWidth !== 0) {
			if (patch[i + 1 + pWidth] && !(patch[i + 1] || patch[i + pWidth])) patch[i + 1 + pWidth] = false;
		}
	}
}

export function setupPatch(room: Room, fill: number, clustering: number, ensurePath: boolean): boolean[] {
	const pw = room.width() - 2, ph = room.height() - 2;
	let patch: boolean[];

	if (!ensurePath) {
		return spdPatchGenerate(pw, ph, fill, clustering, true);
	}

	let attempts = 0;
	let f = fill;
	for (;;) {
		patch = spdPatchGenerate(pw, ph, f, clustering, true);

		let startIdx = xyToPatchCoords(room, room.left + Math.floor(room.width() / 2), room.top + Math.floor(room.height() / 2));
		for (const [, door] of room.connected as Map<unknown, Door | null>) {
			if (!door) continue;
			if (door.x === room.left) {
				startIdx = xyToPatchCoords(room, door.x + 1, door.y);
				patch[xyToPatchCoords(room, door.x + 1, door.y)] = false;
				patch[xyToPatchCoords(room, door.x + 2, door.y)] = false;
			} else if (door.x === room.right) {
				startIdx = xyToPatchCoords(room, door.x - 1, door.y);
				patch[xyToPatchCoords(room, door.x - 1, door.y)] = false;
				patch[xyToPatchCoords(room, door.x - 2, door.y)] = false;
			} else if (door.y === room.top) {
				startIdx = xyToPatchCoords(room, door.x, door.y + 1);
				patch[xyToPatchCoords(room, door.x, door.y + 1)] = false;
				patch[xyToPatchCoords(room, door.x, door.y + 2)] = false;
			} else if (door.y === room.bottom) {
				startIdx = xyToPatchCoords(room, door.x, door.y - 1);
				patch[xyToPatchCoords(room, door.x, door.y - 1)] = false;
				patch[xyToPatchCoords(room, door.x, door.y - 2)] = false;
			}
		}

		if (bfsReachesEverywhere(patch, pw, ph, startIdx)) return patch;

		attempts++;
		if (attempts > 100) { f -= 0.01; attempts = 0; }
	}
}
