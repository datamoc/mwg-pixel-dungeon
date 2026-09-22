import type { Step } from './combatState';

/** Queries are lazy so waiting and blocked interactions do not inspect later rules. */
export interface MovementWorld {
	occupantAt(target: Step): 'npc' | 'enemy' | null;
	closedDoorAt(target: Step): boolean;
	isRooted(): boolean;
	passable(target: Step): boolean;
}

export type MovementPlan = { kind: 'wait' } | {
	kind: 'interact' | 'attack' | 'door' | 'rooted' | 'move' | 'wall';
	target: Step;
};

/** Preserve this port's bump precedence: actors, roots, closed doors, then terrain.
 * `Hero.getCloser()` (v3.3.8) checks `rooted` before any bump logic, refusing even a
 * door bump outright; attacks aren't affected since Java routes those through the
 * occupant check before `getCloser` is ever called. */
export function planMovement(position: Step, move: Step, world: MovementWorld): MovementPlan {
	if (move.x === 0 && move.y === 0) return { kind: 'wait' };
	const target = { x: position.x + move.x, y: position.y + move.y };
	const occupant = world.occupantAt(target);
	if (occupant) return { kind: occupant === 'npc' ? 'interact' : 'attack', target };
	if (world.isRooted()) return { kind: 'rooted', target };
	if (world.closedDoorAt(target)) return { kind: 'door', target };
	return { kind: world.passable(target) ? 'move' : 'wall', target };
}
