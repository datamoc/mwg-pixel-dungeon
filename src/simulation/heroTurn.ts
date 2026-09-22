/** Live ports keep scene replacement and effects visible throughout a turn. */
export interface HeroTurnEffects {
	isAlive(): boolean;
	advanceClock(): void;
	advanceHunger(turnCost?: number): void;
	/** `Regeneration.act()` + `LockedFloor.act()`: natural HP regen and the boss-arena lock. */
	tickRegeneration?(): void;
	recoverWandCharge(turnCost?: number): void;
	recoverTomeCharge(turnCost?: number): void;
	/** `ClassArmor.Charger.act()`: armor charge regen, once per spent turn (see the caller's own
	 * `recoverArmorCharge`, which scales by the action's turn cost the way `advanceClock` does). */
	recoverArmorCharge(): void;
	/** `HolyTome.TomeRecharge.act()`: the carried tome's passive charge, once per
	 * spent turn (see the caller's own `recoverHolyTomeCharge`). */
	recoverHolyTomeCharge(): void;
	/** `Hero.act()`'s `endEnduring()` for the Endure armor ability, once per spent turn. */
	tickEndureTracker(): void;
	/** `HeroicLeap.DoubleJumpTracker`'s own countdown, once per spent turn. */
	tickDoubleJumpTracker(): void;
	/** `AscendedForm.AscendBuff`'s ten-turn lifetime, once per spent turn. */
	tickAscendedForm(): void;
	/** Trinity's selected body/mind/spirit activation window, once per spent turn. */
	tickTrinityForm?(): void;
	/** `MeleeWeapon` ability windows (spin, re-cleave, guard, stances, charged shot) and the
	 * weapon-charge refill, once per spent turn. */
	tickWeaponAbility(): void;
	/** `NaturesPower.naturesPowerTracker`'s own countdown, once per spent turn. */
	tickNaturesPowerTracker(): void;
	spreadFire(turnCost?: number): void;
	/** Tick buffs and apply damage; return true when that damage kills the hero. */
	applyBuffDamage(turnCost?: number): boolean;
	/** `Preparation.act()`: grow the invisibility counter while it lasts, or clear it. Runs after
	 * `applyBuffDamage` because that is where this port ticks buff durations, so an invisibility
	 * that expired this turn is already gone - Java's own buff acts last for the same reason
	 * (`Preparation` sets `actPriority = BUFF_PRIO - 1`). */
	updatePreparation(): void;
	spendScheduledTurn(turnCost?: number): void;
	runAutomaticTurns(): void;
}

export type HeroTurnResult = 'already-dead' | 'buff-death' | 'spent';

/**
 * Preserve this port's existing effect order, not Java's independent actor timings.
 * Hunger/fire may kill the hero, but only fatal buff damage stops this sequence early.
 * Changing that legacy ordering requires a separate gameplay change.
 */
export function finishHeroTurn(effects: HeroTurnEffects, turnCost = 1): HeroTurnResult {
	if (!effects.isAlive()) return 'already-dead';
	effects.advanceClock();
	effects.advanceHunger(turnCost);
	effects.tickRegeneration?.();
	effects.recoverWandCharge(turnCost);
	effects.recoverTomeCharge(turnCost);
	effects.recoverArmorCharge();
	effects.recoverHolyTomeCharge();
	effects.tickEndureTracker();
	effects.tickDoubleJumpTracker();
	effects.tickAscendedForm();
	effects.tickTrinityForm?.();
	effects.tickWeaponAbility();
	effects.tickNaturesPowerTracker();
	effects.spreadFire(turnCost);
	if (effects.applyBuffDamage(turnCost)) return 'buff-death';
	effects.updatePreparation();
	effects.spendScheduledTurn(turnCost);
	effects.runAutomaticTurns();
	return 'spent';
}
