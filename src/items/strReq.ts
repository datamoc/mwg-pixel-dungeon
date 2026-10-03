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
 * `masteryPotionBonus` (`Weapon`/`Armor`, set by `PotionOfMastery`): `STRReq(lvl)` subtracts 2 on top of the formula in
 * `MeleeWeapon`, `MissileWeapon` and `Armor`; the optional `mastery` argument below is that flag.
 *
 * The two melee overrides: `Greataxe.STRReq(lvl)` is `STRReq(tier+1, lvl)` (20 base, up from 18) and
 * `Pickaxe.STRReq(lvl)` is `super + 2` (tier 3 strength with tier 2 damage).
 */
export function weaponSTRReq(tier: number, level: number, mastery = false): number {
	const lvl = Math.max(0, level);
	return (8 + tier * 2) - Math.trunc(Math.trunc(Math.sqrt(8 * lvl + 1) - 1) / 2) - (mastery ? 2 : 0);
}

/** A wielded melee weapon's `STRReq()` including the Greataxe and Pickaxe overrides; `meleeKey` is `weaponMeleeKey()`. */
export function meleeWeaponSTRReq(meleeKey: string, tier: number, level: number, mastery = false): number {
	if (meleeKey === 'greataxe') return weaponSTRReq(tier + 1, level, mastery);
	return weaponSTRReq(tier, level, mastery) + (meleeKey === 'pickaxe' ? 2 : 0);
}

export function armorSTRReq(tier: number, level: number, mastery = false): number {
	const lvl = Math.max(0, level);
	return (8 + Math.round(tier * 2)) - Math.trunc(Math.trunc(Math.sqrt(8 * lvl + 1) - 1) / 2) - (mastery ? 2 : 0);
}

export function missileSTRReq(tier: number, level: number, mastery = false): number {
	return weaponSTRReq(tier, level, mastery) - 1;
}

/**
 * The under-strength penalties of `Hero` gear (`Weapon.accuracyFactor`/`baseDelay`, `Armor.evasionFactor`/`speedFactor`,
 * `Hero.drRoll`, tag `v3.3.8`), all driven by the encumbrance `STRReq() - STR()` when positive: accuracy and evasion divide by
 * `1.5^enc`, attack delay and armor speed by `1.2^enc`, and each armor/weapon-defense roll drops by `2*enc`.
 */
export function encumbrance(strReq: number, heroStr: number): number {
	return Math.max(0, strReq - heroStr);
}
export const accuracyDivisor = (enc: number): number => Math.pow(1.5, enc);
export const evasionDivisor = accuracyDivisor;
export const delayMultiplier = (enc: number): number => Math.pow(1.2, enc);
export const drPenalty = (enc: number): number => 2 * enc;

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
