/**
 * The incoming-damage curves real Java implements as `damage()` overrides on individual mob
 * classes, gathered into one pure function.
 *
 * Why they belong together and where they belong: Java applies every one of these inside
 * `enemy.damage(...)` (`Char.attack()` calls it once the whole multiplier/proc chain is done),
 * so they must run *after* the attacker's multipliers and procs and *before* shields and HP
 * subtraction. `Pylon`'s curve previously ran at the very top of this port's `attack()`, before
 * the augment/talent/proc multipliers - which silently made a charged Pylon far weaker than
 * Java's: a raw 20 became 17 and was then multiplied by the augment, where Java multiplies first
 * and curves the product. Found and fixed 2026-09-12.
 */

/**
 * Java's shared "heavy metal" curve, verbatim from `Pylon`/`DemonSpawner`/`Slime`:
 * `base + (int)(Math.sqrt(8*(dmg - base) + 1) - 1)/2`, applied only at or above `minimum`.
 *
 * The truncations are Java's, not an approximation: it casts the `sqrt` result *before* the
 * integer division. That is equivalent to flooring the division for non-negative values, but
 * written the way the source is so the two can be compared line by line.
 */
export function heavyDamageCurve(damage: number, base: number, minimum: number): number {
	if (damage < minimum) return damage;
	const root = Math.sqrt(8 * (damage - base) + 1);
	return base + Math.floor((Math.trunc(root) - 1) / 2);
}

export interface DefenderCurveFlags {
	/** `Eye.damage()`: `if (beamCharged) dmg /= 4` - while charging its real DeathGaze. */
	beamCharged?: boolean;
}

/**
 * Applies the defender-side curve for `kind`, returning `damage` unchanged for every kind Java
 * gives no override to.
 *
 * - `pylon`: `14 + (int)(sqrt(8*(dmg-14)+1)-1)/2` at `dmg >= 15`. Java's `Pylon` is invulnerable
 *   until active, and this port intercepts the inactive case before reaching here, so no active
 *   check is needed (or wanted) in the curve itself.
 * - `eye`: `dmg /= 4` while `beamCharged`; Java's `/4` is integer division on an `int`, and
 *   damage reaching here is never negative, so `Math.floor` is exact.
 * - `demonSpawner`: the same heavy curve with `base` 19 at `dmg >= 20`, then Java also subtracts
 *   the (possibly reduced) damage from its spawn cooldown - that stays at the call site, since it
 *   mutates the defender rather than the damage.
 * - `slime`/`causticSlime`: the heavy curve with `base` 4 at `dmg >= 5`. `CausticSlime extends
 *   Slime` in Java, and this port's other Slime-family checks already treat the two ids alike.
 *
 * Not modelled: Java's `Slime.damage()` first divides by `AscensionChallenge.statModifier(this)`
 * and multiplies back afterwards, which is the identity while the ascent is unported (see
 * `ASCENSION_MOD`'s note in `./combat`).
 */
export function applyDefenderDamageCurves(kind: string | undefined, damage: number, flags: DefenderCurveFlags = {}): number {
	switch (kind) {
		case 'pylon': return heavyDamageCurve(damage, 14, 15);
		case 'eye': return flags.beamCharged ? Math.floor(damage / 4) : damage;
		case 'demonSpawner': return heavyDamageCurve(damage, 19, 20);
		case 'slime':
		case 'causticSlime': return heavyDamageCurve(damage, 4, 5);
		default: return damage;
	}
}
