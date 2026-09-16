/**
 * The Duelist's armor-ability arithmetic that is pure data-in/data-out. `Feint.java` (tag
 * `v3.3.8`) holds these as inline talent-scaled `Buff.prolong` calls; keeping them here rather
 * than inline in the scene lets `tools/verifyArmorAbilities.mjs` pin them against the Java
 * source without a running game.
 */

/** `FEIGNED_RETREAT`: `Buff.prolong(hero, Haste.class, 2f * points)`. */
export function feignedRetreatHaste(points: number): number {
	return 2 * points;
}

/** `EXPOSE_WEAKNESS`: `Buff.prolong(enemy, Vulnerable/Weakness.class, 2f * points)`, the same
 *  duration for both buffs. */
export function exposeWeaknessDuration(points: number): number {
	return 2 * points;
}
