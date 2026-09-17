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
