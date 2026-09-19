/**
 * The Rogue's armor-ability arithmetic that is pure data-in/data-out.
 * `ShadowClone.java` and its `ShadowAlly` (tag `v3.3.8`) hold all of these as
 * constructor expressions and per-talent lookups; keeping them here rather than
 * inline in the scene lets `tools/verifyArmorAbilities.mjs` pin them against
 * the Java source without a running game.
 */

/** `ShadowAlly`'s base `HP = HT = 80`, before `PERFECT_COPY`. */
export const SHADOW_CLONE_HP = 80;

/**
 * `ShadowAlly(heroLevel)`: `hpBonus = 15 + 5*heroLevel`, raised by
 * `round(0.1 * PERFECT_COPY * hpBonus)` and added to both `HT` and `HP` when
 * positive (rank 0 rounds to 0, so nothing is added).
 */
export function shadowCloneHp(heroLevel: number, perfectCopyPoints: number): number {
	return SHADOW_CLONE_HP + Math.round(0.1 * perfectCopyPoints * (15 + 5 * heroLevel));
}

/**
 * `defenseSkill = heroLevel + 4` ("equal to base hero defense skill") and
 * `attackSkill = defenseSkill + 5` ("equal to base hero attack skill"). The
 * port's accuracy-10/evasion-5 base is Java's own attack-10/defense-5 scale,
 * so both land directly on the shared combat stats.
 */
export function shadowCloneAccuracy(heroLevel: number): number {
	return heroLevel + 9;
}

/** See `shadowCloneAccuracy` - `defenseSkill` itself. */
export function shadowCloneEvasion(heroLevel: number): number {
	return heroLevel + 4;
}

/**
 * `ShadowAlly.damageRoll()`: `NormalIntRange(10, 20)` plus
 * `round(0.08 * SHADOW_BLADE * heroDamageRoll / attackDelay)` when positive.
 * Java draws the hero's damage roll live per swing; the scene passes the mean
 * of the hero's current damage range instead (no extra RNG draw) and its own
 * attack-cost rate for `attackDelay()`.
 */
export function shadowCloneBladeShare(bladePoints: number, heroDamageMean: number, attackDelay: number): number {
	if (bladePoints <= 0) return 0;
	return Math.round(0.08 * bladePoints * heroDamageMean / attackDelay);
}

/**
 * `ShadowAlly.drRoll()`: `super.drRoll()` (zero - the clone wears no armor)
 * plus `round(0.12 * CLONED_ARMOR * heroDrRoll)` when positive. As with damage,
 * the scene passes the mean of the hero's current armor range.
 */
export function shadowCloneArmorShare(armorPoints: number, heroArmorMean: number): number {
	if (armorPoints <= 0) return 0;
	return Math.round(0.12 * armorPoints * heroArmorMean);
}
