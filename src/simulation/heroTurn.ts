/** Live ports keep scene replacement and effects visible throughout a turn. */
export interface HeroTurnEffects {
	isAlive(): boolean;
	advanceClock(): void;
	advanceHunger(): void;
	recoverWandCharge(): void;
	recoverTomeCharge(): void;
	spreadFire(): void;
	/** Tick buffs and apply damage; return true when that damage kills the hero. */
	applyBuffDamage(): boolean;
	spendScheduledTurn(): void;
	runAutomaticTurns(): void;
}

export type HeroTurnResult = 'already-dead' | 'buff-death' | 'spent';

/**
 * Preserve this port's existing effect order, not Java's independent actor timings.
 * Hunger/fire may kill the hero, but only fatal buff damage stops this sequence early.
 * Changing that legacy ordering requires a separate gameplay change.
 */
export function finishHeroTurn(effects: HeroTurnEffects): HeroTurnResult {
	if (!effects.isAlive()) return 'already-dead';
	effects.advanceClock();
	effects.advanceHunger();
	effects.recoverWandCharge();
	effects.recoverTomeCharge();
	effects.spreadFire();
	if (effects.applyBuffDamage()) return 'buff-death';
	effects.spendScheduledTurn();
	effects.runAutomaticTurns();
	return 'spent';
}
