import type { Roguelike } from 'mwg';
import type { Step } from './combatState';

/** Explicit roguelike-geometry/content-roll source, mirroring `SimulationRandom`'s role for
 * `Random`: keeps `simulation/` files from importing `mwg` directly while still using mwg's
 * real, unmodified algorithms (injected by `adapters/mwgRoguelike.ts`). */
export interface SimulationRoguelike {
	canTarget(level: Roguelike.Level, origin: Step, target: Step, options: { range: number }): boolean;
	chebyshevDistance(a: Step, b: Step): number;
	rollRoster<T>(regular: readonly Roguelike.RosterEntry<T>[], rare?: readonly Roguelike.RareEntry<T>[]): Roguelike.ContentRollResult<T>;
}
