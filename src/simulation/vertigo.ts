/**
 * `Vertigo` (`actors/buffs/Vertigo.java`, tag `v3.3.8`): "characters who attempt to move will go in a random
 * direction, instead of the one they intended". `Char.move()` re-rolls an adjacent step to
 * `pos + NEIGHBOURS8[Random.Int(8)]` and simply does nothing when that cell is not passable, is held by
 * another character (or, for a LARGE char, is not open space - this port has no such distinction).
 * Only adjacent steps are affected (`travelling && adjacent(step, pos)`); teleports are not.
 */
export type VertigoCell = { x: number; y: number };

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
	if (Math.max(Math.abs(intended.x - from.x), Math.abs(intended.y - from.y)) !== 1) return intended;
	const [dx, dy] = NEIGHBOURS8[roll]!;
	const cell = { x: from.x + dx, y: from.y + dy };
	if (!passable(cell) || occupied(cell)) return null;
	return cell;
}
