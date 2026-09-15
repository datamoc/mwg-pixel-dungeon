import type { Step } from './combatState';

export interface FireSpreadPlan {
	next: number[];
	burning: Step[];
	burntOut: Step[];
}

/** `Fire.evolve()`'s deterministic terrain transition. The scene applies content effects and
 * owns the resulting Blob; this planner only computes aging and orthogonal ignition. */
export function planFireSpread(
	width: number,
	height: number,
	before: readonly number[],
	isFlammable: (x: number, y: number) => boolean,
): FireSpreadPlan {
	const inside = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < width && y < height;
	const next = before.map((volume) => volume > 0 ? Math.max(0, volume - 1) : 0);
	const burning: Step[] = [];
	const burntOut: Step[] = [];
	const flammableSources = new Set<number>();
	for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
		const cell = x + y * width;
		if ((before[cell] ?? 0) > 0) {
			burning.push({ x, y });
			if ((next[cell] ?? 0) <= 0 && isFlammable(x, y)) burntOut.push({ x, y });
			continue;
		}
		for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]] as const) {
			const nx = x + dx, ny = y + dy;
			if (inside(nx, ny) && (before[nx + ny * width] ?? 0) > 0) {
				flammableSources.add(cell);
				break;
			}
		}
	}
	for (const cell of flammableSources) {
		const x = cell % width, y = Math.floor(cell / width);
		if (isFlammable(x, y)) {
			next[cell] = 4;
			burning.push({ x, y });
		}
	}
	return { next, burning, burntOut };
}
