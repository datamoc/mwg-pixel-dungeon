/**
 * The Warrior's three armor abilities' arithmetic, as pure functions.
 *
 * Sources, all tag `v3.3.8`:
 * - `actors/hero/abilities/warrior/HeroicLeap.java`
 * - `actors/hero/abilities/warrior/Shockwave.java`
 * - `actors/hero/abilities/warrior/Endure.java`
 * - `actors/hero/abilities/ArmorAbility.java` (base charge use and the `HEROIC_ENERGY` table)
 *
 * Rolled values are passed in rather than rolled here, so the scene keeps ownership of the RNG
 * stream and these stay checkable headlessly (see `tools/verifySimulation.mjs`).
 */
/** The two Java rolls these formulas need, injected so the caller owns the RNG stream.
 *  `normalIntRange` is `Hero.heroDamageIntRange(min, max)` minus its `ThirteenLeafClover` clause -
 *  this port has no clover trinket, so it is the plain `Random.NormalIntRange(min, max)` Java falls
 *  back to - and `int` is `Random.Int(n)`, exclusive upper bound. */
export interface DamageRoll {
	normalIntRange(min: number, max: number): number;
	int(minExclusive: number): number;
}

/**
 * `HeroicLeap`'s `BODY_SLAM` branch: `heroDamageIntRange(points, 4*points)` plus a quarter of the
 * hero's own armor roll per point, less the target's armor roll. Java applies this to every
 * adjacent enemy after the leap lands and does not clamp it (a negative total simply does nothing
 * once `Char.damage` sees it), so the raw value is returned and the caller decides.
 */
export function bodySlamDamage(points: number, heroArmorRoll: number, targetArmorRoll: number, roll: DamageRoll): number {
	if (points <= 0) return 0;
	return roll.normalIntRange(points, 4 * points)
		+ Math.round(heroArmorRoll * 0.25 * points)
		- targetArmorRoll;
}

/** `IMPACT_WAVE`: `strength = 1 + points` for the blast-wave shove, and one `Random.Int(4) < points`
 *  roll per shoved target for the `Vulnerable` prolong. */
export function impactWaveStrength(points: number): number {
	return 1 + points;
}
export function impactWaveVulnerable(points: number, intRoll: number): boolean {
	return intRoll < points;
}

/** `Shockwave`'s cone: `dist = min(aim.dist, 5 + EXPANDING_WAVE)` and
 *  `degrees = 60 + 15 * EXPANDING_WAVE`, traced with `STOP_SOLID | STOP_TARGET`. */
export function shockwaveCone(expandingWavePoints: number, aimDistance: number): { distance: number; degrees: number } {
	const maxDist = 5 + expandingWavePoints;
	return { distance: Math.min(aimDistance, maxDist), degrees: 60 + 15 * expandingWavePoints };
}

/**
 * `Shockwave`'s damage per caught char: `heroDamageIntRange(5 + scalingStr, 10 + 2*scalingStr)`
 * scaled by `1 + 0.2*SHOCK_FORCE`, less the target's armor roll. `scalingStr` is `hero.STR() - 10`.
 */
export function shockwaveDamage(
	strength: number,
	shockForcePoints: number,
	targetArmorRoll: number,
	roll: DamageRoll,
): number {
	const scalingStr = strength - 10;
	const raw = roll.normalIntRange(5 + scalingStr, 10 + 2 * scalingStr);
	return Math.round(raw * (1 + 0.2 * shockForcePoints)) - targetArmorRoll;
}

/** `STRIKING_WAVE`: `Random.Int(10) < 3*points` promotes the hit to a real `attackProc` (and, for a
 *  Gladiator, feeds the combo counter). */
export function strikingWaveProcs(points: number, intRoll: number): boolean {
	return intRoll < 3 * points;
}

/** `SHOCK_FORCE`'s lingering effect on a survivor: `Random.Int(4) < points` paralyses for 5 turns,
 *  otherwise cripples for 5. */
export function shockForceParalyses(points: number, intRoll: number): boolean {
	return intRoll < points;
}

/** `Endure`'s `EndureTracker.adjustDamageTaken`: while enduring, a hit that reaches the hero from
 *  another char is halved - and further reduced by `0.8^SHRUG_IT_OFF` (total 60/68/74/80%) - with
 *  half the *pre-reduction* damage banked for the counter-attack. */
export function endureDamageTaken(damage: number, shrugItOffPoints: number): number {
	return damage * 0.5 * Math.pow(0.8, shrugItOffPoints);
}
export function endureBankedDamage(damage: number): number {
	return damage / 2;
}

/**
 * `EndureTracker.endEnduring()`, run at the start of the hero's next turn: the banked damage is
 * scaled by `1 + 0.15*SUSTAINED_RETRIBUTION` and by `1 + 0.05*points*EVEN_THE_ODDS` per hostile
 * within distance 2, then split evenly over `1 + SUSTAINED_RETRIBUTION` strikes.
 */
export function endureEndingBonus(
	bankedDamage: number,
	sustainedRetributionPoints: number,
	nearbyEnemies: number,
	evenTheOddsPoints: number,
): { perHitBonus: number; hits: number } {
	let bonus = bankedDamage;
	if (bonus <= 0) return { perHitBonus: 0, hits: 0 };
	bonus *= 1 + 0.15 * sustainedRetributionPoints;
	bonus *= 1 + nearbyEnemies * 0.05 * evenTheOddsPoints;
	const hits = 1 + sustainedRetributionPoints;
	return { perHitBonus: bonus / hits, hits };
}
