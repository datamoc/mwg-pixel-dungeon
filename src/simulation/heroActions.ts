import type { Step } from './combatState';

export const MOVES: Record<string, Step> = {
	up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
	left: { x: -1, y: 0 }, right: { x: 1, y: 0 },
	upLeft: { x: -1, y: -1 }, upRight: { x: 1, y: -1 },
	downLeft: { x: -1, y: 1 }, downRight: { x: 1, y: 1 },
	wait: { x: 0, y: 0 },
};

/** Default turn costs for each action type. Can be modified by gear/buffs. */
export const TURN_COSTS: Record<string, number> = {
	move: 1,         // movement in a direction
	wait: 1,         // wait action
	attack: 1,       // melee attack (part of movement when adjacent)
	ranged: 1,       // ranged attack attempt (special/eat/quaff/read/upgrade)
	search: 1,       // search for secrets
};

export type AttemptAction = 'special' | 'eat' | 'quaff' | 'read' | 'upgrade';
export type FreeAction = 'examine' | 'talents' | 'buyHeal' | 'buyId' | 'sellFood' | 'save' | 'load';
export type HeroActionPlan =
	| { kind: 'paralysed' | 'search' | 'unknown'; turnCost?: number }
	| { kind: 'attempt'; action: AttemptAction; turnCost: number }
	| { kind: 'free'; action: FreeAction }
	| { kind: 'move'; step: Step; turnCost: number };

/**
 * The port's action policy, after scene/modal guards. Paralysis consumes even unknown
 * actions, except save/load/talents, exactly as the previous onAction ordering did.
 * Actual effects and whether a consumable/ranged attempt succeeds remain with the caller.
 * Includes turn cost (can be modified by gear/buffs at the call site).
 */
export function planHeroAction(action: string, paralysed: boolean, turnCostMod: number = 1): HeroActionPlan {
	if (paralysed && !['save', 'load', 'talents'].includes(action)) return { kind: 'paralysed', turnCost: TURN_COSTS.move * turnCostMod };
	switch (action) {
		case 'search': return { kind: 'search', turnCost: TURN_COSTS.search * turnCostMod };
		case 'special': case 'eat': case 'quaff': case 'read': case 'upgrade':
			return { kind: 'attempt', action, turnCost: TURN_COSTS.ranged * turnCostMod };
		case 'examine': case 'talents': case 'buyHeal': case 'buyId': case 'sellFood': case 'save': case 'load':
			return { kind: 'free', action };
		default: return Object.hasOwn(MOVES, action) ? { kind: 'move', step: { ...MOVES[action] }, turnCost: TURN_COSTS.move * turnCostMod } : { kind: 'unknown', turnCost: TURN_COSTS.move * turnCostMod };
	}
}
