import { absorbShield } from './buffs';

/** Per-creature `ShieldBuff` pools a non-hero character can carry. */
export interface CreatureShields {
	/** `DivineIntervention.DivineShield`, `shieldUsePriority = 1` (tag `v3.3.8`). */
	divineShield?: number;
}

/**
 * `ShieldBuff.processDamage()` (tag `v3.3.8`) for a non-hero character: every shield buff
 * absorbs in descending `shieldUsePriority` order before HP. Returns the damage left for HP.
 * `DivineShield.shielding()` reads zero without a live AscendBuff on the hero, hence the flag.
 * Lower-priority pools (`PowerOfMany`'s Barrier, priority 0) belong after DivineShield here.
 */
export function absorbCreatureShields(creature: CreatureShields, damage: number, ascendedActive: boolean): number {
	if ((creature.divineShield ?? 0) > 0 && ascendedActive) {
		const absorbed = absorbShield(creature.divineShield ?? 0, damage);
		creature.divineShield = absorbed.shield;
		damage = absorbed.damage;
		if (creature.divineShield <= 0) delete creature.divineShield;
	}
	return damage;
}
