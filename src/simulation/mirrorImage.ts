/**
 * `MirrorImage`'s hero-derived combat stats (`actors/mobs/npcs/MirrorImage.java`,
 * tag `v3.3.8`). `duplicate(hero)` binds the hero for life and every formula
 * below reads it live, so the scene re-syncs on each image turn (the
 * hawk/shadow-clone/prismatic precedent).
 *
 * - `attackSkill()`: `(9 + lvl) * accuracyMultiplier`, truncated. The attacking
 *   weapon's `accuracyFactor` has no expression here (only the cudgel factor is
 *   modeled, hero-side), so the multiplier is the accuracy-ring term alone.
 * - `defenseSkill()`: `super.defenseSkill(enemy) * (base + heroEv) / 2`
 *   with `base = 4 + lvl` and `heroEv = trunc(base * evasionMultiplier)`
 *   through the armor's `evasionFactor` (unmodeled, like the prismatic
 *   image's), truncated. `super` is `Mob`'s 0/1 decision
 *   (`imageSuperDefenseSkill`): 0 when surprised, paralysed,
 *   illuminated-vs-Cleric, or facing the hero itself.
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

/**
 * The inputs to `Mob.defenseSkill(enemy)`'s zero-vs-field decision
 * (`actors/mobs/Mob.java`, tag `v3.3.8`, lines 684-705), shared by both hero
 * images (their `defenseSkill()` multiplies this `super` result by the
 * blended evasion). `attackerIsHero` covers the `alignment == ALLY &&
 * enemy == Dungeon.hero` clause - both images are always ALLY, so an
 * amok hero swinging at their own image faces evasion 0. `heroIsCleric`
 * is `Dungeon.hero.heroClass == HeroClass.CLERIC`; under it, illumination
 * zeroes against every attacker except a hero swinging a `Weapon` with
 * `STRReq() > STR` (that one falls through to the surprise/paralysis
 * checks - moot here, the hero-facing clause zeroes it regardless).
 */
export interface ImageDefenseContext {
	readonly surprised: boolean;
	readonly paralysed: boolean;
	readonly illuminated: boolean;
	readonly heroIsCleric: boolean;
	readonly attackerIsHero: boolean;
	readonly attackerWeaponStrOk: boolean;
}

/**
 * `Mob.defenseSkill(enemy)` reduced to its 0/1 `super` multiplier: 0 when
 * the defender is surprised, paralysed, illuminated under a Cleric hero
 * (with the STR-sufficient hero-weapon fall-through), or facing the hero
 * itself, else the `defenseSkill` field (1 for both images).
 * `attackerWeaponStrOk` is true for a STR-sufficient weapon AND for a
 * non-weapon/unarmed attack (Java's `!(... instanceof Weapon)` branch zeroes
 * too); only a hero swinging a `Weapon` with `STRReq() > STR` falls through
 * the illuminated branch - unobservable for these always-ALLY images, since
 * the hero-facing clause below zeroes that case anyway.
 */
export function imageSuperDefenseSkill(context: ImageDefenseContext): 0 | 1 {
	if (context.illuminated && context.heroIsCleric) {
		if (!context.attackerIsHero || context.attackerWeaponStrOk) return 0;
	}
	if (context.surprised || context.paralysed || context.attackerIsHero) return 0;
	return 1;
}

export function mirrorImageStats(
	heroLevel: number,
	accuracyMult: number,
	evasionMult: number,
	heroDamageMin: number,
	heroDamageMax: number,
	superDefense: 0 | 1 = 1,
): MirrorImageStats {
	const baseEvasion = 4 + heroLevel;
	const heroEvasion = Math.trunc(baseEvasion * evasionMult);
	return {
		accuracy: Math.trunc((9 + heroLevel) * accuracyMult),
		// Java: `super.defenseSkill(enemy) * (baseEvasion + heroEvasion) / 2`
		// in integer math - 0 under `imageSuperDefenseSkill`, else the old blend.
		evasion: Math.trunc(superDefense * (baseEvasion + heroEvasion) / 2),
		damageMin: Math.ceil(heroDamageMin / 2),
		damageMax: Math.ceil(heroDamageMax / 2),
	};
}
