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
