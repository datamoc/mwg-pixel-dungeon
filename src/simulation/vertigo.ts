/**
 * `Vertigo` (`actors/buffs/Vertigo.java`, tag `v3.3.8`): "characters who attempt to move will go in a random
 * direction, instead of the one they intended". `Char.move()` re-rolls an adjacent step to
 * `pos + NEIGHBOURS8[Random.Int(8)]` and simply does nothing when that cell is not passable, is held by
 * another character (or, for a LARGE char, is not open space - this port has no such distinction).
 * Only adjacent steps are affected (`travelling && adjacent(step, pos)`); teleports are not.
 */
import { chebyshevDistance } from './combatState';

export type VertigoCell = { x: number; y: number };

export interface PlaceSwapRestrictions {
	allyCellPassable: boolean;
	heroFlying: boolean;
	heroImmovable: boolean;
	allyImmovable: boolean;
	heroParalysed: boolean;
	allyParalysed: boolean;
	heroRooted: boolean;
	allyRooted: boolean;
	heroVertigo: boolean;
	allyVertigo: boolean;
}

/** `Char.interact()`'s default place-swap gates (`Char.java`, tag `v3.3.8`),
 * after the earlier ALLY_WARP override: the hazard gate
 * `!passable[allyCell] && !heroFlying` (Char.java 247-251), IMMOVABLE on
 * either side (264-267) and paralysis/Roots/Vertigo on either side (284-288).
 * Not modeled: the LARGE/`openSpace` room gate (253-257) - this port has no
 * LARGE property or open-space map and none of its bumpable allies can be
 * LARGE, so that refusal is unreachable (documented Divergence, R066). */
export function canDefaultPlaceSwap(state: PlaceSwapRestrictions): boolean {
	if (!state.allyCellPassable && !state.heroFlying) return false;
	if (state.heroImmovable || state.allyImmovable) return false;
	return !(state.heroParalysed || state.allyParalysed || state.heroRooted || state.allyRooted
		|| state.heroVertigo || state.allyVertigo);
}

const NEIGHBOURS8: readonly (readonly [number, number])[] = [
	[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1],
];

/**
 * @param roll a uniform integer in 0..7 (`Random.Int(8)`)
 * @returns the cell to step to, or null when the drunken step goes nowhere (the mover stays put)
 */
export function vertigoStep(
	from: VertigoCell,
	intended: VertigoCell,
	roll: number,
	passable: (cell: VertigoCell) => boolean,
	occupied: (cell: VertigoCell) => boolean,
): VertigoCell | null {
	if (chebyshevDistance(intended, from) !== 1) return intended;
	const [dx, dy] = NEIGHBOURS8[roll]!;
	const cell = { x: from.x + dx, y: from.y + dy };
	if (!passable(cell) || occupied(cell)) return null;
	return cell;
}
