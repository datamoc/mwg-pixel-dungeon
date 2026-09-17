/**
 * `ScrollOfTeleportation.teleportChar` / `Level.randomRespawnCell`
 * (`items/scrolls/ScrollOfTeleportation.java`, `levels/Level.java`, tag `v3.3.8`):
 * a random teleport lands on a passable, unoccupied cell outside the hero's field of
 * view, with secret cells re-rolled (up to 20 tries before `no_tele`). Every random
 * teleport in the port (fadeleaf, the displacing/displacement curses, beacon zaps,
 * PhaseShift, the scroll's own fallback, the fadeleaf tipped dart) routes through the
 * shared free-cell search, so the constraints live here once.
 *
 * Pure functions of their inputs so the suite can pin them without a scene; the scene
 * owns the level reads. Deliberately not here: LARGE chars needing `openSpace` (no
 * open-space concept exists here), the try-cap failure mode (the port collects the
 * accepted set instead of probing with a cap, so it never fails spuriously where Java
 * can return -1), and `teleportPreferringUnseen`'s unseen-room preference.
 */

export interface TeleportCell {
	x: number;
	y: number;
	passable: boolean;
	/** Any char already there - Java rejects `Actor.findChar(cell) != null`, the mover's
	 * own cell included (it is occupied by the mover). */
	occupied: boolean;
	/** Inside the hero's current field of view. */
	visible: boolean;
	secret: boolean;
	/** This port's pit cells read passable (the hero can fall in), so Java's own
	 * `passable[]` refusal needs the explicit chasm flag alongside it. */
	chasm: boolean;
}

/** `randomRespawnCell`'s acceptance test plus `teleportChar`'s secret re-roll. */
export function teleportCandidates(cells: TeleportCell[]): { x: number; y: number }[] {
	return cells
		.filter((cell) => cell.passable && !cell.occupied && !cell.visible && !cell.secret && !cell.chasm)
		.map(({ x, y }) => ({ x, y }));
}

/**
 * `Swiftthistle.TimeBubble.disarmPresses()` (`plants/Swiftthistle.java`, tag `v3.3.8`),
 * run from `Level.beforeTransition()`: leaving the floor with delayed presses disarms
 * them on the old floor instead of carrying them along - delayed-press plants are
 * uprooted (Rotberry is explicitly spared) and delayed-press traps with
 * `disarmedByActivation` are disarmed. Every trap kind this port models is one-shot,
 * so disarming is spending it (plus revealing it, as Java's `disarm()` does).
 */
export function disarmBubblePresses(
	pressed: number[],
	plantKindAt: (cell: number) => string | undefined,
	hasTrap: (cell: number) => boolean,
): { uproot: number[]; disarm: number[] } {
	const uproot: number[] = [];
	const disarm: number[] = [];
	for (const cell of pressed) {
		const kind = plantKindAt(cell);
		if (kind !== undefined && kind !== 'rotberry') uproot.push(cell);
		if (hasTrap(cell)) disarm.push(cell);
	}
	return { uproot, disarm };
}
