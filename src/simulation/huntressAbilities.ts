/**
 * The Huntress's armor-ability arithmetic that is pure data-in/data-out. `SpiritHawk.java` and
 * its `HawkAlly` (tag `v3.3.8`) hold all of these as constants and per-talent lookups; keeping
 * them here rather than inline in the scene lets `tools/verifyArmorAbilities.mjs` pin them
 * against the Java source without a running game.
 */

/** `HawkAlly`'s `baseSpeed = 2f + SWIFT_SPIRIT / 2f`: 2, 2.5, 3, 3.5, 4 cells per turn. */
export function spiritHawkSpeed(swiftSpiritPoints: number): number {
	return 2 + swiftSpiritPoints / 2;
}

/**
 * `HawkAlly`'s field of view: the constructor sets
 * `GameMath.gate(6, 6 + pointsInTalent(EAGLE_EYE), 8)` - so 6, 7, 8, 8, 8 - while its `act()`
 * recomputes the same expression *ungated* on every turn. The gate is the constructor's intent
 * (the talent has four ranks and the clamp is what keeps rank 3 and 4 equal); this port keeps the
 * clamped value throughout rather than reproducing Java's own inconsistency, which would widen
 * the hawk's sight back to 9-10 cells from the second turn onward.
 */
export function spiritHawkViewDistance(eagleEyePoints: number): number {
	return Math.min(8, Math.max(6, 6 + eagleEyePoints));
}

/** `HawkAlly.defenseSkill()`'s dodge pool: `2 * pointsInTalent(SWIFT_SPIRIT)` outright dodges. */
export function spiritHawkDodges(swiftSpiritPoints: number): number {
	return 2 * swiftSpiritPoints;
}

/** `HawkAlly.timeRemaining = 100f`, spent down by the ally's own actor time. */
export const SPIRIT_HAWK_LIFESPAN = 100;

export interface GoForTheEyesEffect {
	/** `Buff.prolong(enemy, Blindness.class, blindness)`'s duration, in turns. */
	blindness: number;
	/** `Buff.prolong(enemy, Cripple.class, cripple)`'s duration; 0 means Java attaches no Cripple. */
	cripple: number;
}

/**
 * `HawkAlly.attackProc()`'s `GO_FOR_THE_EYES` switch: rank 1 blinds for 2 turns, rank 2 for 5,
 * rank 3 adds 2 turns of Cripple, rank 4 raises that Cripple to 5. Rank 0 (the talent unlearned)
 * lands no effect at all.
 */
export function goForTheEyesEffect(points: number): GoForTheEyesEffect {
	if (points >= 4) return { blindness: 5, cripple: 5 };
	if (points === 3) return { blindness: 5, cripple: 2 };
	if (points === 2) return { blindness: 5, cripple: 0 };
	if (points === 1) return { blindness: 2, cripple: 0 };
	return { blindness: 0, cripple: 0 };
}
