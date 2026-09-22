import type { SimulationRandom } from './random';

export interface BlinkStep {
	x: number;
	y: number;
}

/**
 * `Succubus.getCloser()`/`blink()` (`Succubus.java`, tag `v3.3.8`), scene-free: the
 * dungeon scene owns the FOV check, the ray trace, the teleport presentation and the
 * turn scheduler, while every number here is Java's.
 *
 * While hunting, a succubus that sees her target more than 2 cells away, off cooldown
 * and unrooted blinks to it instead of stepping: a `PROJECTILE` ray takes her to the
 * collision cell (backing up one when it is occupied), and a blocked landing falls back
 * to a random free passable neighbour of the collision. A failed blink wastes the turn;
 * a successful one is free (Java's `spend(-1/speed())` nets against the act's own
 * `spend(1/speed())`). The cooldown resets to `IntRange(4, 6)` on any attempt and ticks
 * down only on turns that take the ordinary approach - never on adjacent-attack,
 * wandering, fleeing or attempted-blink turns.
 */

/** `blinkCooldown = Random.IntRange(4, 6)`, reset on every blink attempt. */
export function succubusBlinkCooldown(random: SimulationRandom): number {
	return random.range(4, 6);
}

/**
 * The `getCloser` gate: `fieldOfView[target] && distance > 2 && blinkCooldown <= 0 &&
 * !rooted`. Java's `distance` is chebyshev, which is what the scene passes in; fleeing
 * mobs never reach `Hunting.getCloser`, so the scene keeps them out too.
 */
export function shouldSuccubusBlink(args: { cooldown: number; seesHero: boolean; rooted: boolean; fleeing: boolean; distance: number }): boolean {
	return args.cooldown <= 0 && args.seesHero && !args.rooted && !args.fleeing && args.distance > 2;
}

/**
 * The eight neighbours in `PathFinder.NEIGHBOURS8` order, for the fallback draw below.
 * The order itself is irrelevant (Java draws uniformly), but the set must be the full
 * ring.
 */
export const SUCCUBUS_NEIGHBOURS8: ReadonlyArray<readonly [number, number]> = [
	[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1],
];

/**
 * The blink destination off a traced ray (`cells` runs from the cell after the succubus
 * to the collision cell, mirroring `route.path.slice(1)`/`route.collisionPos` - the
 * port's ray helper keeps the stopping cell, matching Java's `subPath(1, dist)`).
 * Java backs up one cell only off an OCCUPIED collision (`Actor.findChar(cell) != null
 * && cell != this.pos` → `route.path.get(route.dist - 1)`); an impassable-but-empty
 * collision is kept into the avoid-check below. Backing up past the ray's first step
 * (`dist == 1`, an adjacent occupied collision) lands on the succubus's own cell, and
 * `ScrollOfTeleportation.appear` there succeeds without moving - a no-op success, not
 * a failure. A landing that is still not free falls back to a uniform draw over the
 * free passable neighbours of the collision, and `null` aborts the blink when none
 * exists. `isFree` covers Java's `passable` plus unoccupied halves; `isOccupied` is
 * the occupancy half alone (the scene's `creatureAt`), and `ownCell` is the ray
 * source. Both default to the legacy shape when unthreaded: without them an adjacent
 * occupied collision falls into the neighbour draw below instead of staying put
 * (stated). The `avoid`-cell reroute has no port-side map (stated at the call site),
 * so reaching here already means the ray's own answer.
 */
export function chooseSuccubusBlinkCell(
	cells: readonly BlinkStep[],
	isFree: (cell: BlinkStep) => boolean,
	random: SimulationRandom,
	isOccupied: (cell: BlinkStep) => boolean = () => false,
	ownCell?: BlinkStep,
): BlinkStep | null {
	if (cells.length === 0) return null;
	const collision = cells[cells.length - 1]!;
	let landing = collision;
	const occupied = isOccupied(collision);
	if (occupied && cells.length >= 2) landing = cells[cells.length - 2]!;
	else if (occupied && ownCell !== undefined) return { x: ownCell.x, y: ownCell.y };
	else if (!occupied && !isFree(collision) && cells.length >= 2) landing = cells[cells.length - 2]!;
	if (isFree(landing)) return { x: landing.x, y: landing.y };
	const candidates: BlinkStep[] = [];
	for (const [dx, dy] of SUCCUBUS_NEIGHBOURS8) {
		const cell = { x: collision.x + dx, y: collision.y + dy };
		if (isFree(cell)) candidates.push(cell);
	}
	if (candidates.length === 0) return null;
	return candidates[random.range(0, candidates.length - 1)]!;
}
