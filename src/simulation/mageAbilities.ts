/**
 * The Mage's `ElementalBlast` armor-ability arithmetic that is pure data-in/data-out
 * (`actors/hero/abilities/mage/ElementalBlast.java`, tag `v3.3.8`). Rolled values are
 * supplied by hand here, which is the point: `tools/verifyArmorAbilities.mjs` pins them
 * against the Java source without a running game.
 *
 * Only the arithmetic lives here. (An older revision of this comment said the
 * ability stayed unoffered for want of a staff-imbue system; both the imbue
 * choice and the offered, firing blast are live since 2026-09-21 - see
 * `activateElementalBlast` and the coverage row. Leaf helpers stay here so
 * `tools/verifyArmorAbilities.mjs` pins them without a running game.)
 */

/**
 * `ElementalBlast.damageFactors`: the per-wand multiplier on
 * `round(heroDamageIntRange(15, 25) * effectMulti * factor)`. Keyed by the port's own
 * `WandType` names (`src/items/wands.ts` covers all thirteen); the table itself is
 * Java's, so it lives here rather than in MWL.
 */
export const ELEMENTAL_BLAST_DAMAGE_FACTORS: Readonly<Record<string, number>> = {
	magicMissile: 0.5,
	lightning: 1,
	disintegration: 1,
	fireblast: 1,
	corrosion: 0,
	blastWave: 0.67,
	livingEarth: 0.5,
	frost: 1,
	prismaticLight: 0.67,
	warding: 0,
	transfusion: 0,
	corruption: 0,
	regrowth: 0,
};

/** `ELEMENTAL_POWER`: `effectMulti = 1 + 0.25*points`, scaling damage, blob volumes,
 * durations and proc chances. */
export function elementalBlastEffectMulti(elementalPowerPoints: number): number {
	return 1 + 0.25 * elementalPowerPoints;
}

/** `BLAST_RADIUS`: `aoeSize = 4 + points`, the full-circle `ConeAOE` radius. */
export function elementalBlastAoeSize(blastRadiusPoints: number): number {
	return 4 + blastRadiusPoints;
}

/**
 * The aim rule: the blast ignores the target cell and fires down the cardinal
 * direction with the most room - the wider axis wins, ties go horizontal, and each
 * axis fires away from its nearer edge (`x > width/2` fires west, and so on).
 * Coordinates are Java's (`pos % width`, `/ width`).
 */
export function elementalBlastAim(heroX: number, heroY: number, levelWidth: number, levelHeight: number): 'west' | 'east' | 'north' | 'south' {
	if (Math.max(heroX, levelWidth - heroX) >= Math.max(heroY, levelHeight - heroY)) {
		return heroX > levelWidth / 2 ? 'west' : 'east';
	}
	return heroY > levelHeight / 2 ? 'north' : 'south';
}

/**
 * The blast damage: `round(roll(15, 25) * effectMulti * factor)`. Only non-ally chars
 * take it (and only when it is positive), but that filter is the caller's - the roll
 * is passed in like every other helper in this family.
 */
export function elementalBlastDamage(roll15to25: number, effectMulti: number, damageFactor: number): number {
	return Math.round(roll15to25 * effectMulti * damageFactor);
}

/**
 * Transfusion vs undead recomputes the damage WITHOUT the wand's (zero) factor:
 * `round(roll(15, 25) * effectMulti)`. Living targets take no blast damage at all
 * under Transfusion - they are healed below instead.
 */
export function elementalBlastUndeadDamage(roll15to25: number, effectMulti: number): number {
	return Math.round(roll15to25 * effectMulti);
}

/**
 * Transfusion vs allies/charmed: `healing = round(10*effectMulti)`, and the overflow
 * past max HP becomes Barrier (`shielding = HP + healing - HT`, healing reduced by
 * it). Returns both halves; the caller applies them.
 */
export function elementalBlastTransfusionSplit(hp: number, maxHp: number, effectMulti: number): { heal: number; shield: number } {
	const healing = Math.round(10 * effectMulti);
	const shielding = hp + healing - maxHp;
	if (shielding > 0) return { heal: healing - shielding, shield: shielding };
	return { heal: healing, shield: 0 };
}

/**
 * Corrosion: `Corrosion.set(4, round(6*effectMulti))` - a fixed 4-turn setup with a
 * scaled damage rate. Only non-allies take it.
 */
export function elementalBlastCorrosion(effectMulti: number): { duration: number; damage: number } {
	return { duration: 4, damage: Math.round(6 * effectMulti) };
}

/** Lightning: `Paralysis` for `effectMulti * DURATION/2` (`DURATION` 10). */
export function elementalBlastParalysisDuration(effectMulti: number): number {
	return effectMulti * 10 / 2;
}

/** Frost: `Frost` for `effectMulti * DURATION` (`DURATION` 10); the hero's own
 * Burning detaches under Frost. */
export function elementalBlastFrostDuration(effectMulti: number): number {
	return effectMulti * 10;
}

/** Prismatic Light: `Blindness` for `effectMulti * DURATION/2` (`DURATION` 10). */
export function elementalBlastBlindnessDuration(effectMulti: number): number {
	return effectMulti * 10 / 2;
}

/**
 * Prismatic Light self-effect: `Light` for `effectMulti * 10` under the Darkness
 * challenge, `effectMulti * 50` otherwise.
 */
export function elementalBlastLightDuration(effectMulti: number, darknessChallenged: boolean): number {
	return effectMulti * (darknessChallenged ? 10 : 50);
}

/** Transfusion charm (non-ally, non-undead): `Charm` for `effectMulti * DURATION/2`
 * (`DURATION` 10), bound to the hero with hero allies ignored - the binding is the
 * caller's. */
export function elementalBlastCharmDuration(effectMulti: number): number {
	return effectMulti * 10 / 2;
}

/** Corruption: `Amok` for `effectMulti * 5` (prolonged, not fresh). */
export function elementalBlastAmokDuration(effectMulti: number): number {
	return effectMulti * 5;
}

/** Regrowth: non-ally `Roots` for `effectMulti * DURATION` (`DURATION` 5). */
export function elementalBlastRootsDuration(effectMulti: number): number {
	return effectMulti * 5;
}

/** Magic Missile self-effect: `Recharging` for `effectMulti * DURATION/2`
 * (`DURATION` 30). */
export function elementalBlastRechargingDuration(effectMulti: number): number {
	return effectMulti * 30 / 2;
}

/** Regrowth grass: each eligible cell converts on `Random.Float() < 0.33*effectMulti`.
 * Eligibility (terrain + no plant) is the caller's; only the chance is pure. */
export function elementalBlastRegrowthChance(effectMulti: number): number {
	return 0.33 * effectMulti;
}

/**
 * Blast Wave shove: `knockback = aoeSize + 1 - (int)trueDistance`, then
 * `knockback *= effectMulti` - both casts truncate (positive inputs, so toward zero).
 * The `throwChar` itself (path, collision, damage) is the scene's.
 */
export function elementalBlastKnockback(aoeSize: number, trueDistance: number, effectMulti: number): number {
	return Math.trunc(Math.trunc(aoeSize + 1 - Math.trunc(trueDistance)) * effectMulti);
}

/**
 * `REACTIVE_BARRIER`: `charsHit` caps at `4 + points`, and with the talent a positive
 * capped count shields `round(charsHit * 2.5 * points)`. Without the talent (or with
 * nothing caught) there is no shield - the cap alone does nothing.
 */
export function elementalBlastReactiveShield(charsHit: number, reactiveBarrierPoints: number, hasTalent: boolean): number {
	const capped = Math.min(4 + reactiveBarrierPoints, charsHit);
	if (capped > 0 && hasTalent) return Math.round(capped * 2.5 * reactiveBarrierPoints);
	return 0;
}
