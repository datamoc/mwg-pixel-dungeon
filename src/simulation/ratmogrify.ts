/**
 * Ratmogrify's `RATSISTANCE` talent (`Ratmogrify.TransmogRat.damageRoll()`, tag `v3.3.8`):
 * a transformed, non-allied rat deals `damage *= 0.9^points`.
 *
 * Only the arithmetic lives here. The dispatch stays in the scene (`resolveHeroAbilityAttack`
 * folds it into the attack's damage multiplier for a `ratmogrifiedTurns` attacker that is not
 * an ally), because the transformed state and the hero's talent ranks live on the live scene,
 * not on the combatant stat block `rollDamage` reads.
 */

/** The per-point base of `Math.pow(0.9f, pointsInTalent(RATSISTANCE))`. */
export const RATSISTANCE_BASE = 0.9;

/** `0.9^points`: 1 at rank 0 (Java gates on `hasTalent`, which is the same value). */
export function ratsistanceFactor(points: number): number {
	return Math.pow(RATSISTANCE_BASE, Math.max(0, points));
}
