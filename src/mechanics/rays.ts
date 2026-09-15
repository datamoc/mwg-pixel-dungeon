import { Roguelike } from 'mwg';
import type { Step } from '../combat';

/**
 * Shared Ballistica-backed ray traversal for cone and beam effects.
 * MWG owns terrain stopping; the caller supplies actor lookup because actors are not part of
 * the generic level grid. The stopping cell is retained, matching SPD's `subPath(1, dist)`.
 */
export function traceRayToTarget(
	level: Parameters<typeof Roguelike.ballistica>[0],
	from: Step,
	to: Step,
	creatureAt: (x: number, y: number) => unknown,
	stopAtTarget = true,
): Step[] {
	const cells = Roguelike.ballistica(level, from, to, { stop: 'impassable' }).cells.slice(1);
	if (!stopAtTarget) return cells;
	const blocker = cells.findIndex((cell) => creatureAt(cell.x, cell.y) !== null);
	return blocker === -1 ? cells : cells.slice(0, blocker + 1);
}
