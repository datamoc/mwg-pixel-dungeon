import type { Step } from './combatState';

export interface FireSpreadPlan {
	next: number[];
	burning: Step[];
	burntOut: Step[];
	/** Burning cells that went out for frost (`freeze.clear(cell)` in Java) - the
	 * scene clears its frost volume at these alongside applying `next`. */
	extinguished: Step[];
}

/** `Fire.evolve()`'s deterministic terrain transition. The scene applies content effects and
 * owns the resulting Blob; this planner only computes aging and orthogonal ignition.
 * `isFrozen` is Java's `freeze.volume > 0 && freeze.cur[cell] > 0` half of the
 * Fire/Freezing interplay (`Fire.java`, tag `v3.3.8`): a burning frozen cell is
 * extinguished outright (`freeze.clear(cell)`, `off = cur = 0`, `continue` - no burn,
 * no decay, no destroy), and a frozen empty cell never ignites (`fire = 0`). Both
 * default off, preserving the legacy shape; the freeze-into-fire direction already
 * runs scene-side, so only this half was missing. */
export function planFireSpread(
	width: number,
	height: number,
	before: readonly number[],
	isFlammable: (x: number, y: number) => boolean,
	isFrozen: (x: number, y: number) => boolean = () => false,
): FireSpreadPlan {
	const inside = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < width && y < height;
	const next = before.map((volume) => volume > 0 ? Math.max(0, volume - 1) : 0);
	const burning: Step[] = [];
	const burntOut: Step[] = [];
	const extinguished: Step[] = [];
	const flammableSources = new Set<number>();
	for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
		const cell = x + y * width;
		const frozen = isFrozen(x, y);
		if ((before[cell] ?? 0) > 0) {
			if (frozen) {
				//Java's freeze branch: extinguish outright, skipping burn, decay
				//and destroy alike (`off[cell] = cur[cell] = 0`, `continue`).
				next[cell] = 0;
				extinguished.push({ x, y });
				continue;
			}
			burning.push({ x, y });
			if ((next[cell] ?? 0) <= 0 && isFlammable(x, y)) burntOut.push({ x, y });
			continue;
		}
		if (frozen) continue;
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
	return { next, burning, burntOut, extinguished };
}
