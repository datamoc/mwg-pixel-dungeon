import type { Step } from '../combat';

/**
 * The actor-collision invariant: two live actors never share a cell.
 *
 * Java's contract (`Char.java` / `Mob.java` / `Hero.java`, tag `v3.3.8`):
 * `Char.move()` itself writes the destination unconditionally - the occupancy
 * gates live at step *selection*. `Mob.canPassTo()`/`getCloser()` refuse any
 * cell where `Actor.findChar(cell) != null`; `Hero.getCloser()` only steps
 * adjacent when `findChar(target) == null`, replans when the path head is
 * occupied, and turns occupied cells into Attack/Interact actions instead.
 * Scripted transitions (boss seals, Tengu's arena jumps) write `pos` directly
 * with no gate at all - including `HallsBossLevel.seal()`'s unconditional
 * `boss.pos + 2*width` fallback when every neighbour is taken.
 *
 * This port mirrors that placement exactly: `moveTo`
 * (`scenes/dungeon/bosses/bossLogic.ts`) writes unconditionally like
 * `Char.move`, and every selection path gates on `creatureAt` (the live
 * `creatures` list - `kill()` splices the dead out, so it reads as Java's
 * `findChar`):
 * - voluntary hero steps: `runMovement` (`simulation/movement.ts`) maps an
 *   occupied target to interact/attack/door before `moveTo` is reached.
 * - voluntary monster steps: every `decideMonsterAI`/`pathfinder.find` call
 *   passes a `blocked` set holding all other creatures; `wanderBlocked`,
 *   `isPatrolTargetValid`, `fleeStep` and `nearestFreeCell`
 *   (`simulation/wandering.ts`) check occupants directly.
 * - ally steps: same `blocked`-set shape over all other creatures.
 * - forced shoves (weapon knockbacks, Repulsion/Elastic procs, BlastWave,
 *   geyser, Heroic Leap, crystal-mimic displace, guard chain, necro
 *   push-aside): each stops at the first occupied cell.
 * - teleports (scroll, gateway, displacing, Tengu/fist/succubus/ripper,
 *   beacon, warp beacon, preparation blink, elemental recall, necro
 *   skeleton): each lands on a `randomFreeCell`/free-filtered cell, and the
 *   beacon/warp refusals fire when none is free.
 * - scripted transitions mirror Java's direct writes (Caves/Halls seals with
 *   Java's own fallbacks; the Caves 32-try cap is a deliberate anti-hang
 *   hardening of Java's spin-until-passable loop, and the Halls filter adds
 *   an `inside` check Java lacks).
 *
 * `findSharedCell` below is the standing check for that invariant: the suite
 * (`tools/verifyActorCollision.mjs`) pins it against clean and doubled
 * rosters and pins the selection-layer gates above through stub contexts, so
 * a future move path that skips its gate fails loudly instead of stacking
 * two actors on one cell.
 */
/** The first cell holding two or more actors, or undefined when all are alone. */
export function findSharedCell(actors: ReadonlyArray<Step>): Step | undefined {
	const seen = new Map<string, Step>();
	for (const actor of actors) {
		const key = `${actor.x},${actor.y}`;
		const first = seen.get(key);
		if (first) return first;
		seen.set(key, { x: actor.x, y: actor.y });
	}
	return undefined;
}
