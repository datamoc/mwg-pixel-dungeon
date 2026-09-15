import { Roguelike } from 'mwg';
import type { SimulationRoguelike } from '../simulation/roguelike';

/** Delegate every call to mwg's real roguelike geometry/content-roll functions, unmodified. */
export const simulationRoguelike: SimulationRoguelike = {
	canTarget: (level, origin, target, options) => Roguelike.canTarget(level, origin, target, options),
	chebyshevDistance: (a, b) => Roguelike.chebyshevDistance(a, b),
	rollRoster: (regular, rare) => Roguelike.rollRoster(regular, rare),
};
