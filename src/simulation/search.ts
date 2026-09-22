import type { Step } from './combatState';

/** Query is lazy: the search only inspects the requested radius - no framework or scene
 * dependency, matching `movement.ts`'s own "plain coordinates and lazy world queries"
 * convention. */
export interface SearchWorld {
	isSecret(cell: Step): boolean;
}

export interface SearchOptions {
	/** Java's +1 Wide Search ring is circular; its +2 ring is square again. */
	circular?: boolean;
	/** Passive search can stop at one success; intentional search must reveal every success. */
	stopAtFirst?: boolean;
}

/** `Hero.search(false)` probabilities from `actors/hero/Hero.java` (tag `v3.3.8`). */
export function passiveSearchChance(depth: number, kind: 'trap' | 'door'): number {
	return kind === 'trap' ? 0.4 - depth / 250 : 0.2 - depth / 100;
}

export type SearchOutcome = { kind: 'found'; cell: Step }
	| { kind: 'found-many'; cells: Step[] }
	| { kind: 'nothing' };

/** `Hero.search()`'s radius sweep: the same dy-outer/dx-inner iteration order the port's
 * original inline loop used, preserved exactly so the first result and multi-result order match
 * Java's row-major sweep. */
export function planSearch(position: Step, radius: number, world: SearchWorld, options: SearchOptions = {}): SearchOutcome {
	const circular = options.circular === true;
	const stopAtFirst = options.stopAtFirst !== false;
	const found: Step[] = [];
	for (let dy = -radius; dy <= radius; dy++) {
		for (let dx = -radius; dx <= radius; dx++) {
			if (dx === 0 && dy === 0) continue;
			if (circular && dx * dx + dy * dy > radius * radius) continue;
			const cell = { x: position.x + dx, y: position.y + dy };
			if (!world.isSecret(cell)) continue;
			if (stopAtFirst) return { kind: 'found', cell };
			found.push(cell);
		}
	}
	return found.length > 0 ? { kind: 'found-many', cells: found } : { kind: 'nothing' };
}
