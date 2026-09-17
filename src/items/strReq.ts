/**
 * Strength requirements for weapons and armor - pure, scene-free translations of the
 * real Java formulas, so the headless item suite can pin them against Java's numbers.
 *
 * `Weapon.STRReq(tier, lvl)` (`items/weapon/Weapon.java`, tags `v2.1.4`/`v3.3.8` -
 * identical): `(8 + tier*2) - (int)(sqrt(8*lvl+1)-1)/2` with `lvl = max(0, lvl)`,
 * "strength req decreases at +1,+3,+6,+10,etc.". Java's `(int)` truncates toward zero
 * and the `/2` is integer division; both operands are non-negative for `lvl >= 0`,
 * so two `Math.trunc` calls reproduce it exactly.
 *
 * `Armor.STRReq(tier, lvl)` (`items/armor/Armor.java`, both tags - identical): the same
 * shape with `Math.round(tier*2)` (armor tiers are whole numbers here, so the round is
 * the identity - kept to mirror the source).
 *
 * `MissileWeapon.STRReq(lvl)` (`items/weapon/missiles/MissileWeapon.java`, both tags):
 * one less STR than normal for the tier.
 *
 * Not applied: the instance-level `-2` for `masteryPotionBonus` (all three classes).
 * This port has no per-item mastery-potion system (the exotic potion itself is
 * unported), stated, not silent.
 */
export function weaponSTRReq(tier: number, level: number): number {
	const lvl = Math.max(0, level);
	return (8 + tier * 2) - Math.trunc(Math.trunc(Math.sqrt(8 * lvl + 1) - 1) / 2);
}

export function armorSTRReq(tier: number, level: number): number {
	const lvl = Math.max(0, level);
	return (8 + Math.round(tier * 2)) - Math.trunc(Math.trunc(Math.sqrt(8 * lvl + 1) - 1) / 2);
}

export function missileSTRReq(tier: number, level: number): number {
	return weaponSTRReq(tier, level) - 1;
}

export interface SurpriseGateInput {
	/** a thrown attack reads the missile, never the melee weapon */
	thrown: boolean;
	/** empty hand (weaponId === 'startingWeapon' here) */
	unarmed: boolean;
	/** the wielded melee weapon is a flail */
	flail: boolean;
	/** Hero.STR() - this port's hero.str, with its ring/talent bonuses */
	heroStr: number;
	weaponTier: number;
	weaponLevel: number;
}

/**
 * Hero.canSurpriseAttack() (Hero.java 738-745, tag v3.3.8): thrown weapons
 * always qualify (MissileWeapon is not a Weapon); an empty hand qualifies too
 * (null instanceof Weapon is false, which also carries the RingOfForce clause);
 * otherwise the hero needs the STR for the wielded weapon and must not be swinging
 * a flail (Flail.java: 'cannot surprise attack'). Char's base returns true.
 */
export function canSurpriseAttack(input: SurpriseGateInput): boolean {
	if (input.thrown || input.unarmed) return true;
	if (input.heroStr < weaponSTRReq(input.weaponTier, input.weaponLevel)) return false;
	if (input.flail) return false;
	return true;
}
