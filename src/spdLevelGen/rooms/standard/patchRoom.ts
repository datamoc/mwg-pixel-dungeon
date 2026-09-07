/**
 * Port of `levels/rooms/standard/PatchRoom.java`'s `setupPatch()` (the shared helper `CircleBasinRoom`
 * and `BurnedRoom` both use). `xyToPatchCoords` and the non-`ensurePath` branch are direct
 * translations. The `ensurePath` branch's connectivity check (`PathFinder.buildDistanceMap` over
 * `BArray.not(patch)`) is reimplemented here as an 8-directional BFS - `PathFinder.java`'s own
 * distance-map connectivity wasn't independently re-read for this pass, so 8-directional is a
 * documented best-effort assumption (SPD movement/pathing is generally 8-directional), not a
 * verified byte-exact match. A wrong connectivity model would only change *how many retry attempts*
 * `setupPatch` takes before converging (and thus how much RNG it burns) - a real, currently
 * unverified fidelity risk for `CircleBasinRoom`/`BurnedRoom` specifically, flagged in
 * PORT_COVERAGE.md.
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
