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
	ranged: 1,       // ranged attack attempt (special/quaff/read/upgrade)
	//`Food.TIME_TO_EAT = 3f` (`items/food/Food.java`, tag `v3.3.8`): eating spends
	//three turns via `spend(eatingTime())` - quaffing (`TIME_TO_DRINK = 1f`) and
	//reading (`TIME_TO_READ = 1f`) stay in the 1-cost ranged bucket, only eat moves.
	eat: 3,          // eating food (1 with any meal talent, see planHeroAction)
	//`Hero.TIME_TO_SEARCH = 2f` (tag `v3.3.8`): searching spends two turns via
	//`spendAndNext`, so monsters get twice the turns a 1-cost action would grant.
	search: 2,       // search for secrets
};

export type AttemptAction = 'special' | 'eat' | 'quaff' | 'read' | 'upgrade';
export type FreeAction = 'examine' | 'talents' | 'buyHeal' | 'buyId' | 'sellFood' | 'buyback' | 'save' | 'load' | 'preparation' | 'armorAbility';
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
/**
 * The six talents that cut eating to a single turn (`Food.eatingTime()`, tag
 * `v3.3.8`: `TIME_TO_EAT - 2`), in this port's talent-id spelling. The scene
 * owns rank state; the planner takes the resolved boolean (see planHeroAction).
 */
export const MEAL_TALENTS: readonly string[] = [
	'iron_stomach', 'energizing_meal', 'mystical_meal',
	'invigorating_meal', 'focused_meal', 'enlightening_meal',
];

export function planHeroAction(action: string, paralysed: boolean, turnCostMod: number = 1, hasMealTalent = false): HeroActionPlan {
	if (paralysed && !['save', 'load', 'talents'].includes(action)) return { kind: 'paralysed', turnCost: TURN_COSTS.move * turnCostMod };
	switch (action) {
		case 'search': return { kind: 'search', turnCost: TURN_COSTS.search * turnCostMod };
		case 'eat':
			//`Food.eatingTime()`: 3 turns, or 1 with any meal talent. The scene
			//threads the talent flag through live dispatch (HeroActionPorts
			//carries it, resolved from MEAL_TALENTS ranks), so both branches
			//are live - no residual.
			return { kind: 'attempt', action, turnCost: (hasMealTalent ? 1 : TURN_COSTS.eat) * turnCostMod };
		case 'special': case 'quaff': case 'read': case 'upgrade':
			return { kind: 'attempt', action, turnCost: TURN_COSTS.ranged * turnCostMod };
		case 'examine': case 'talents': case 'buyHeal': case 'buyId': case 'sellFood': case 'buyback': case 'save': case 'load': case 'preparation': case 'armorAbility':
			return { kind: 'free', action };
		default: return Object.hasOwn(MOVES, action) ? { kind: 'move', step: { ...MOVES[action] }, turnCost: TURN_COSTS.move * turnCostMod } : { kind: 'unknown', turnCost: TURN_COSTS.move * turnCostMod };
	}
}
