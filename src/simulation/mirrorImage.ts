/**
 * `MirrorImage`'s hero-derived combat stats (`actors/mobs/npcs/MirrorImage.java`,
 * tag `v3.3.8`). `duplicate(hero)` binds the hero for life and every formula
 * below reads it live, so the scene re-syncs on each image turn (the
 * hawk/shadow-clone/prismatic precedent).
 *
 * - `attackSkill()`: `(9 + lvl) * accuracyMultiplier`, truncated. The attacking
 *   weapon's `accuracyFactor` has no expression here (only the cudgel factor is
 *   modeled, hero-side), so the multiplier is the accuracy-ring term alone.
 * - `defenseSkill()`: `1 * (base + heroEv) / 2` with `base = 4 + lvl` and
 *   `heroEv = trunc(base * evasionMultiplier)` through the armor's
 *   `evasionFactor` (unmodeled, like the prismatic image's), truncated.
 * - `damageRoll()`: the hero weapon roll (or unarmed hero roll) halved rounded
 *   up - `(damage+1)/2` in integer math is `ceil(d/2)`. The port rolls uniform
 *   bounds, so each live bound halves rounded up (same range, uniform draw).
 * - `drRoll()`: `super` plus half the weapon's `defenseFactor()` - the weapon
 *   term has no model here, so DR copies the hero's tuple (stated).
 * - Immune to ToxicGas, CorrosiveGas, Burning and AllyBuff: the gases ride the
 *   scene's blob paths, Burning rides `fireImmune` through `buffBlocked`, and
 *   AllyBuff has no system here.
 */

export interface MirrorImageStats {
	readonly accuracy: number;
	readonly evasion: number;
	readonly damageMin: number;
	readonly damageMax: number;
}

export function mirrorImageStats(
	heroLevel: number,
	accuracyMult: number,
	evasionMult: number,
	heroDamageMin: number,
	heroDamageMax: number,
): MirrorImageStats {
	const baseEvasion = 4 + heroLevel;
	const heroEvasion = Math.trunc(baseEvasion * evasionMult);
	return {
		accuracy: Math.trunc((9 + heroLevel) * accuracyMult),
		evasion: Math.trunc((baseEvasion + heroEvasion) / 2),
		damageMin: Math.ceil(heroDamageMin / 2),
		damageMax: Math.ceil(heroDamageMax / 2),
	};
}
