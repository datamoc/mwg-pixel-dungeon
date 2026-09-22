import type { SimulationRandom } from './random';

export interface LeapStep {
	x: number;
	y: number;
}

/**
 * `RipperDemon.Hunting.act()`'s leap state machine (`RipperDemon.java`, tag `v3.3.8`),
 * scene-free: the dungeon scene owns the sprite jump, the warning log line, the damage
 * application and the turn scheduler, while every number here is Java's.
 *
 * The cycle is two turns. Turn 1 (trigger) arms `leapPos` when the cooldown has expired,
 * the enemy is in FOV, the ripper is not rooted and the enemy is at least 3 cells away;
 * turn 2 (execution) resets the cooldown, re-traces the leap ray, bounces off an occupied
 * landing cell and pounces with an infinite-accuracy hit plus `Bleeding` at 0.75x a fresh
 * damage roll. `act()` decrements the cooldown on every unparalysed turn and records the
 * enemy's cell for the landing prediction below.
 */

/** `leapCooldown = Random.NormalIntRange(2, 4)`, reset when a leap executes. */
export function ripperLeapCooldown(random: SimulationRandom): number {
	return random.normalRange(2, 4);
}

/**
 * `PathFinder.CIRCLE8` as (dx, dy) pairs (`-width-1, -width, -width+1, +1, +width+1,
 * +width, +width-1, -1`): index `(i+4)%8` is the cell opposite index `i` across the
 * enemy, which is what the landing prediction below relies on.
 */
export const RIPPER_CIRCLE8: ReadonlyArray<readonly [number, number]> = [
	[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0],
];

/**
 * `PathFinder.NEIGHBOURS8` as (dx, dy) pairs, in Java's own iteration order: the bounce
 * search below keeps the first strictly-nearest cell, so ties resolve in this order on
 * both sides.
 */
export const RIPPER_NEIGHBOURS8: ReadonlyArray<readonly [number, number]> = [
	[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1],
];

/** `Level.trueDistance()`: plain euclidean distance; only the ordering matters here. */
export function ripperTrueDistance(a: LeapStep, b: LeapStep): number {
	return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * The trigger gate: `leapCooldown <= 0 && enemyInFOV && !rooted &&
 * Dungeon.level.distance(pos, enemy.pos) >= 3`. Java's `distance` is chebyshev, which is
 * what the scene passes in.
 */
export function canRipperLeap(args: { cooldown: number; seesHero: boolean; rooted: boolean; distance: number }): boolean {
	return args.cooldown <= 0 && args.seesHero && !args.rooted && args.distance >= 3;
}

/**
 * The landing prediction: when the enemy has moved since the last turn, Java aims at the
 * far side of its new cell - the `CIRCLE8` neighbour closest to the old cell, mirrored
 * across the enemy - so a retreating hero is cut off rather than chased. With no previous
 * cell (or an unmoved enemy) it aims directly at the enemy. Java runs the prediction off
 * `lastEnemyPos = -1` on the first hunting turn, which degenerates to a near-arbitrary
 * ring cell that the ray check then rejects back to the direct aim; aiming directly is
 * the same observable.
 */
export function predictRipperLeapTarget(enemy: LeapStep, prevEnemy: LeapStep | null | undefined): LeapStep {
	if (prevEnemy === null || prevEnemy === undefined || (prevEnemy.x === enemy.x && prevEnemy.y === enemy.y)) {
		return { x: enemy.x, y: enemy.y };
	}
	let closest = 0;
	for (let i = 1; i < RIPPER_CIRCLE8.length; i++) {
		const cell = RIPPER_CIRCLE8[i]!;
		const best = RIPPER_CIRCLE8[closest]!;
		if (ripperTrueDistance(prevEnemy, { x: enemy.x + cell[0], y: enemy.y + cell[1] })
			< ripperTrueDistance(prevEnemy, { x: enemy.x + best[0], y: enemy.y + best[1] })) {
			closest = i;
		}
	}
	const opposite = RIPPER_CIRCLE8[(closest + 4) % RIPPER_CIRCLE8.length]!;
	return { x: enemy.x + opposite[0], y: enemy.y + opposite[1] };
}

/**
 * The bounce landing: when the leap ray ends on an occupied cell, Java lands on the
 * free, passable neighbour nearest (by true distance) to its own cell, sweeping a
 * second time over free *non-solid* neighbours when the first sweep finds nothing, and
 * aborting the leap (`null` here) only when both fail. `isFree` covers both halves of
 * Java's first test (`Actor.findChar(...) == null && Dungeon.level.passable[...]`); the
 * optional `isFallbackFree` is the second sweep.
 */
export function chooseRipperBounceEnd(
	from: LeapStep,
	leap: LeapStep,
	isFree: (cell: LeapStep) => boolean,
	isFallbackFree?: (cell: LeapStep) => boolean,
): LeapStep | null {
	//Java sweeps twice: free *passable* neighbours first, then free *non-solid* ones.
	for (const pass of isFallbackFree === undefined ? [isFree] : [isFree, isFallbackFree]) {
		let best: LeapStep | null = null;
		for (const [dx, dy] of RIPPER_NEIGHBOURS8) {
			const cell = { x: leap.x + dx, y: leap.y + dy };
			if (!pass(cell)) continue;
			if (best === null || ripperTrueDistance(from, cell) < ripperTrueDistance(from, best)) best = cell;
		}
		if (best !== null) return best;
	}
	return null;
}
