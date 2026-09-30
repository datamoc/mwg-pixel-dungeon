import { weaponRechargingDamage } from '../talentEffects';

export interface AttackModifierState {
	/** The charm pairing only suppresses this target when it matches the attacker. */
	charmedTowardDefender: boolean;
	defenderSpectatorFrozen: boolean;
	attackerIsHero: boolean;
	weaponAugment?: 'speed' | 'damage' | 'none' | null;
	weaponRechargingRank: number;
	rechargingWindow: boolean;
	ringForceBonus: number;
	/** The Monk's temporary unarmed tracker suppresses Ring of Force's armed bonus. */
	monkUnarmedAttack: boolean;
}

/**
 * Resolves the pure pre-armor damage modifiers in `Char.attack()` and
 * `Hero.damageRoll()` (tag `v3.3.8`). The live scene supplies status and equipment
 * facts; this function owns only the ordered numeric transformation.
 */
export function modifyAttackDamage(damage: number, state: AttackModifierState): number {
	if (state.charmedTowardDefender || state.defenderSpectatorFrozen) damage = 0;
	// `Weapon.Augment` damage factors from `Weapon.java`: SPEED is 0.7 and DAMAGE is 1.5.
	if (state.attackerIsHero && state.weaponAugment === 'speed') damage = Math.round(damage * 0.7);
	else if (state.attackerIsHero && state.weaponAugment === 'damage') damage = Math.round(damage * 1.5);
	if (state.attackerIsHero && state.weaponRechargingRank > 0 && state.rechargingWindow) {
		damage = weaponRechargingDamage(damage, state.weaponRechargingRank);
	}
	if (state.attackerIsHero && !state.monkUnarmedAttack) damage += state.ringForceBonus;
	return damage;
}
