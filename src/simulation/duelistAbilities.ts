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

/**
 * `CLOSE_THE_GAP`: the duel-opening blink range is `1 + points` (up to five at
 * rank 4). The blink itself is scene pathfinding; only the range is pure.
 */
export function closeTheGapRange(points: number): number {
	return 1 + points;
}

/**
 * `ELIMINATION_MATCH`: while its 3-turn tracker is up, `chargeUse` is multiplied
 * by `0.84^points` (16/30/40/50% off at ranks 1-4). The tracker's own 3 turns
 * are the MWL `eliminationMatch` duration; only the factor lives here.
 */
export function eliminationMatchFactor(points: number): number {
	return Math.pow(0.84, points);
}

/**
 * `INVIGORATING_VICTORY`: when the duel target dies (or converts) mid-duel, the
 * hero heals `round(takenDmg * (1 - 0.707^points)) + 5*points`, capped at the
 * missing HP. `takenDmg` is the hero's own accumulated duel damage (see
 * `Hero.damage()`'s `DuelParticipant.addDamage`, tag `v3.3.8`).
 */
export function invigoratingVictoryHeal(takenDmg: number, points: number, missingHp: number): number {
	return Math.min(Math.round(takenDmg * (1 - Math.pow(0.707, points))) + 5 * points, missingHp);
}

/**
 * `Talent.CombinedLethalityAbilityTracker`'s test in `Char.attack()` (`Char.java` 541-561,
 * tag `v3.3.8`): with a live tracker, a hero melee swing with a *different* weapon instance
 * tests the execute and consumes the tracker one-shot - whether or not the threshold fired.
 * Returns whether the swing tests at all (`tests`, Java's `combinedLethality.detach()`
 * running unconditionally inside the gate) and whether it executes (`executes`, the
 * `enemy.HP <= HT * 0.4*points/3` threshold with the `isAlive`, non-ally and
 * non-`BOSS`/`MINIBOSS` guards). Weapon identity is Java's `!=` on the weapon object;
 * callers pass the equipped instance id (falling back to the bag id) on both sides.
 */
export function combinedLethalityTest(opts: {
	trackerTurns: number;
	storedWeapon: string | null | undefined;
	swingWeapon: string | null | undefined;
	isHeroMelee: boolean;
	targetIsAlly: boolean;
	targetIsBossOrMiniboss: boolean;
	talentPoints: number;
	predictedHp: number;
	targetMaxHp: number;
}): { tests: boolean; executes: boolean } {
	const tests = opts.trackerTurns > 0
		&& opts.storedWeapon !== null && opts.storedWeapon !== undefined
		&& opts.storedWeapon !== opts.swingWeapon
		&& opts.isHeroMelee;
	if (!tests) return { tests: false, executes: false };
	const threshold = opts.targetIsBossOrMiniboss ? 0 : 0.4 * opts.talentPoints / 3;
	const executes = !opts.targetIsAlly && threshold > 0
		&& opts.predictedHp > 0 && opts.predictedHp <= opts.targetMaxHp * threshold;
	return { tests: true, executes };
}

/**
 * `ElementalStrike`'s cone (`actors/hero/abilities/duelist/ElementalStrike.java`, tag
 * `v3.3.8`): `maxDist = 4 + ELEMENTAL_REACH`, `dist = min(aim.dist, maxDist)`, `65 + 10*reach`
 * degrees, traced with `STOP_SOLID | STOP_TARGET`. The aim itself is `WONT_STOP`, so the
 * caller passes the plain aim distance and lets the cone clamp it.
 */
export function elementalStrikeCone(reachPoints: number, aimDistance: number): { distance: number; degrees: number } {
	const maxDist = 4 + reachPoints;
	return { distance: Math.min(aimDistance, maxDist), degrees: 65 + 10 * reachPoints };
}

/**
 * `STRIKING_FORCE`'s `powerMulti`: `1 + 0.30*points`, scaling every imbuement amount, blob
 * volume, grass count, damage roll and proc chance of the strike.
 */
export function elementalPowerMulti(strikingForcePoints: number): number {
	return 1 + 0.30 * strikingForcePoints;
}

/**
 * `DIRECTED_POWER`'s pre-attack boost: `0.30 * targetsHit * points`, added to the primary
 * melee swing's damage multiplier (Java stages it on a one-shot `DirectedPowerTracker`
 * that `Weapon.procDamage` consumes; the scene passes it straight into the forced hit).
 * `targetsHit` counts enemies inside the cone, like the pre-attack pass.
 */
export function directedPowerBoost(directedPowerPoints: number, targetsHit: number): number {
	return 0.30 * targetsHit * directedPowerPoints;
}

/** `Blocking` pre-attack: `round(6*targetsHit*powerMulti)` shield (Java double-rounds,
 *  which is one round for these positive values). No shield when nothing is caught. */
export function elementalBlockingShield(targetsHit: number, powerMulti: number): number {
	if (targetsHit <= 0) return 0;
	return Math.round(6 * targetsHit * powerMulti);
}

/** `Vampiric` pre-attack: `round(2.5*targetsHit*powerMulti)`, capped at the missing HP. */
export function elementalVampiricHeal(targetsHit: number, powerMulti: number, missingHp: number): number {
	if (targetsHit <= 0) return 0;
	return Math.min(Math.round(2.5 * targetsHit * powerMulti), Math.max(0, missingHp));
}

/** `Sacrificial` pre-attack: the hero bleeds for `10*powerMulti`. */
export function elementalSacrificialSelf(powerMulti: number): number {
	return 10 * powerMulti;
}

/** `Blazing`/`Chilling`/`Shocking` per-cell blob volume: `round(8*powerMulti)`. */
export function elementalBlobAmount(powerMulti: number): number {
	return Math.round(8 * powerMulti);
}

/** `Blooming` per-cell grass budget: `round(8*powerMulti)` high-grass placements. */
export function elementalBloomingBudget(powerMulti: number): number {
	return Math.round(8 * powerMulti);
}

/**
 * `Blooming`'s furrow counter (`ElementalStrikeFurrowCounter`, persists across revive):
 * past 40 counted uses every placement is furrowed; otherwise a use with no visible
 * enemies and nothing caught counts 4 (5 uses per hero level) and any other use counts 1
 * (20 per level). Returns whether placements come out furrowed and the count increment.
 */
export function elementalFurrowStep(furrowCount: number, targetsHit: number, enemiesVisible: boolean): { furrowed: boolean; increment: number } {
	if (furrowCount >= 40) return { furrowed: true, increment: 0 };
	if (!enemiesVisible && targetsHit === 0) return { furrowed: false, increment: 4 };
	return { furrowed: false, increment: 1 };
}

/** The unenchanted strike: `round(powerMulti * heroDamageIntRange(6, 12))` per caught char. */
export function elementalBaseDamage(powerMulti: number, intRangeRoll: number): number {
	return Math.round(powerMulti * intRangeRoll);
}

/** `Kinetic` splash to non-primary targets: `round(stored*0.4*powerMulti)`. */
export function elementalKineticSplash(storedDamage: number, powerMulti: number): number {
	return Math.round(storedDamage * 0.4 * powerMulti);
}

/** `Blooming` root duration on caught chars: `round(6*powerMulti)`. */
export function elementalRootsDuration(powerMulti: number): number {
	return Math.round(6 * powerMulti);
}

/** `Elastic` knockback strength: `round(5*powerMulti)` cells away from the hero. */
export function elementalKnockback(powerMulti: number): number {
	return Math.round(5 * powerMulti);
}

/** `Lucky` drop chance per caught enemy: `0.125*powerMulti`. */
export function elementalLuckyChance(powerMulti: number): number {
	return 0.125 * powerMulti;
}

/** `Projecting` splash to non-primary targets: `round(heroRoll*0.3*powerMulti)`. */
export function elementalProjectingSplash(heroDamageRoll: number, powerMulti: number): number {
	return Math.round(heroDamageRoll * 0.3 * powerMulti);
}

/** `Corrupting` conversion chance: `(0.05 + 0.2*hpMissing)*powerMulti` (5-25%). */
export function elementalCorruptingChance(hpMissingFrac: number, powerMulti: number): number {
	return (0.05 + 0.2 * hpMissingFrac) * powerMulti;
}

/** `Grim` execution chance on non-primary targets: `(0.06 + 0.24*hpMissing)*powerMulti` (6-30%). */
export function elementalGrimChance(hpMissingFrac: number, powerMulti: number): number {
	return (0.06 + 0.24 * hpMissingFrac) * powerMulti;
}

/**
 * The shared curse proc chance (`Displacing`, `Dazzling`, `Explosive`, `Wayward`,
 * `Polarized`, `Friendly`): `0.5*powerMulti`. `Annoying` rolls its own `0.2*powerMulti`.
 */
export function elementalCurseChance(powerMulti: number): number {
	return 0.5 * powerMulti;
}

/** `Annoying` amok chance: `0.2*powerMulti` for 6 turns. */
export function elementalAnnoyingChance(powerMulti: number): number {
	return 0.2 * powerMulti;
}

/** `Sacrificial` bleed on caught chars: `12*powerMulti`. */
export function elementalSacrificialOther(powerMulti: number): number {
	return 12 * powerMulti;
}

/**
 * Which ElementalStrike per-char damage sources Java zeroes against an Antimagic
 * champion (`Char.damage()`'s `isImmune(srcClass)` gate against
 * `AntiMagic.RESISTS`, tag `v3.3.8`). The base strike and Polarized pass
 * `ElementalStrike.this`, the execute passes `Grim.class` - all three resisted.
 * Kinetic/Projecting splashes pass their (unresisted) enchantment as source, and
 * the ConjuredBomb blast passes the bomb (base `Bomb` is not resisted, only
 * `ArcaneBomb`/holy damage are) - all three deal full damage.
 */
export type ElementalStrikeDamageSource = 'strike' | 'grim' | 'kinetic' | 'projecting' | 'bomb';
export function elementalStrikeResisted(source: ElementalStrikeDamageSource, targetMagicImmune: boolean): boolean {
	return targetMagicImmune && (source === 'strike' || source === 'grim');
}
