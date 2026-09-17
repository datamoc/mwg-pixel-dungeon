/**
 * `WandOfRegrowth.Dewcatcher` / `Seedpod.activate()` (`items/wands/WandOfRegrowth.java`,
 * tag `v3.3.8`): both scatter a rolled number of drops onto *distinct* passable neighbour
 * cells that are neither stair cell, one drop per cell, picked uniformly without replacement.
 * The counts are `Random.NormalIntRange(3, 6)` dewdrops and `Random.NormalIntRange(2, 4)`
 * seeds - triangular, not uniform.
 *
 * Pure functions of their inputs so the suite can pin them without a scene; the scene owns
 * the level reads and the heap spawning, the same split `simulation/plantPools.ts` uses.
 */

import type { SimulationRandom } from './random';

/** One of the eight neighbours with everything the Java candidate test reads. */
export interface DropCandidateCell {
	x: number;
	y: number;
	passable: boolean;
	/** This port's pit cells read passable (the hero can fall into them), so Java's own
	 * passable test needs the explicit chasm refusal alongside it. */
	isChasm: boolean;
	isStairs: boolean;
	isEntrance: boolean;
}

/**
 * Java's candidate loop: `passable[pos+i] && pos+i != entrance() && pos+i != exit()`.
 * The caller maps its own stairs/entrance cells onto the flags.
 */
export function plantDropCandidates(cells: DropCandidateCell[]): { x: number; y: number }[] {
	return cells
		.filter((cell) => cell.passable && !cell.isChasm && !cell.isStairs && !cell.isEntrance)
		.map(({ x, y }) => ({ x, y }));
}

/**
 * Java's `Random.NormalIntRange(min, max)`: `mwg`'s triangular `normalRange` is that same
 * shape (a summed pair of uniforms, peaking in the middle), not the flat `range` this
 * port used to roll here.
 */
export function plantDropCount(min: number, max: number, random: SimulationRandom): number {
	return random.normalRange(min, max);
}
