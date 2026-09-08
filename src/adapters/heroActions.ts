import { planHeroAction, type AttemptAction, type FreeAction } from '../simulation/heroActions';
import type { Step } from '../simulation/combatState';

export interface HeroActionPorts {
	isParalysed(): boolean;
	beginTurn(): void;
	spendTurn(turnCost?: number): void;  // turnCost: default 1; modified by gear/buffs
	announceParalysis(): void;
	search(): void;
	attempts: Record<AttemptAction, () => boolean>;
	free: Record<FreeAction, () => void>;
	/** Returns true when entering a floor already established its initial input turn. */
	move(step: Step): boolean;
	/** Get turn-cost multiplier from equipment/buffs. Default 1; <1 for faster actions (augment/glyph/ring/haste), >1 for slower. */
	getTurnCostMod(): number;
}

/** Execute the pure policy against current scene state, preserving callback order. */
export function dispatchHeroAction(action: string, ports: HeroActionPorts): boolean {
	const plan = planHeroAction(action, ports.isParalysed(), ports.getTurnCostMod());
	switch (plan.kind) {
		case 'unknown': return false;
		case 'free': ports.free[plan.action](); return true;
		case 'attempt':
			if (!ports.attempts[plan.action]()) return false;
			ports.beginTurn();
			ports.spendTurn(plan.turnCost);
			return true;
		case 'paralysed':
			ports.beginTurn();
			ports.announceParalysis();
			ports.spendTurn(plan.turnCost);
			return true;
		case 'search':
			ports.beginTurn();
			ports.search();
			ports.spendTurn(plan.turnCost);
			return true;
		case 'move':
			ports.beginTurn();
			if (!ports.move(plan.step)) ports.spendTurn(plan.turnCost);
			return true;
	}
}
