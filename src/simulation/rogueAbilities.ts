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

/**
 * `ShadowAlly.canInteract(c)` (tag `v3.3.8`): `super.canInteract(c) || distance(c.pos)
 * <= pointsInTalent(PERFECT_COPY)`. Super's non-ALLY_WARP half is plain adjacency, and
 * ALLY_WARP is a Mage talent the clone never grants, so the effective range is
 * `max(1, points)`: rank 0 stays adjacent-only, each PERFECT_COPY point extends the free
 * place-swap by one cell.
 */
export function shadowCloneCanInteract(distance: number, perfectCopyPoints: number): boolean {
	return distance <= Math.max(1, perfectCopyPoints);
}

/**
 * `ShadowAlly.attackProc()` (`ShadowClone.java` 218-226, tag `v3.3.8`): after
 * `super.attackProc`, the clone swings through the *hero's* weapon when
 * `Random.Int(4) < pointsInTalent(SHADOW_BLADE) && Dungeon.hero.belongings.weapon() != null`,
 * and only then runs `weapon().proc(clone, enemy, damage)`.
 *
 * Java draws the `Int(4)` **before** testing the weapon, so the roll is consumed even for an
 * empty-handed hero - the caller therefore always draws and passes the roll in, which keeps
 * RNG order identical to Java's short-circuit. `roll` is Java's `Random.Int(4)` (0-3), so a
 * non-zero `bladePoints` passes on `bladePoints` of the 4 outcomes (always at rank 4+).
 */
export function shadowCloneBladeProc(roll: number, bladePoints: number, heroHasWeapon: boolean): boolean {
	return roll < bladePoints && heroHasWeapon;
}

/**
 * `ShadowAlly.defenseProc()` (`ShadowClone.java` 249-257, tag `v3.3.8`): after `super`, the
 * clone defends with the *hero's* `Armor.proc` when
 * `Random.Int(4) < pointsInTalent(CLONED_ARMOR) && Dungeon.hero.belongings.armor() != null`.
 *
 * Same draw-first short-circuit as the weapon half, so the roll is consumed even when the hero
 * wears nothing; the caller draws once per landed attack (Java makes exactly one `defenseProc`
 * call per attack) and passes the result to every defend-side glyph site.
 */
export function shadowCloneArmorProc(roll: number, armorPoints: number, heroHasArmor: boolean): boolean {
	return roll < armorPoints && heroHasArmor;
}
