import type { Step } from './combatState';

/** Query is lazy: search never inspects a cell beyond the first secret it finds - no framework
 * or scene dependency, matching `movement.ts`'s own "plain coordinates and lazy world queries"
 * convention. */
export interface SearchWorld {
	isSecret(cell: Step): boolean;
}

export type SearchOutcome = { kind: 'found'; cell: Step } | { kind: 'nothing' };

/** `Hero.search()`'s radius sweep: the same dy-outer/dx-inner iteration order the port's
 * original inline loop used, preserved exactly so which secret is found first (when more than
 * one is in range) does not change. */
export function planSearch(position: Step, radius: number, world: SearchWorld): SearchOutcome {
	for (let dy = -radius; dy <= radius; dy++) {
		for (let dx = -radius; dx <= radius; dx++) {
			if (dx === 0 && dy === 0) continue;
			const cell = { x: position.x + dx, y: position.y + dy };
			if (world.isSecret(cell)) return { kind: 'found', cell };
		}
	}
	return { kind: 'nothing' };
}
