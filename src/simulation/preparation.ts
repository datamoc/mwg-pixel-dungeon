/**
 * `Preparation` (`actors/buffs/Preparation.java`, tag `v3.3.8`) - the Assassin's stealth state, and
 * the tables it drives. Kept pure and here rather than inline in the scene so `verifyCombat` can
 * pin every number against the source.
 *
 * The buff is applied when a character turns invisible (`Invisibility.attachTo`), counts the turns
 * it has been invisible, and detaches the moment it is not. While it holds, the character's attack
 * damage roll is replaced by `AttackLevel.damageRoll()` and the attack may execute a weak enemy
 * outright (`Char.attack()` 404-412 and 524-539). One hidden *side* effect: because the buff only
 * exists while invisible, and an attack dispels invisibility, the whole state is per-invisibility
 * rather than permanent.
 *
 * Unmodelled here, recorded rather than faked: `Preparation`'s blink action (`AttackLevel
 * .blinkDistance()` is ported as data below, but the action itself needs a cell picker and a
 * teleport-strike this port does not have), and the `Talent.BOUNTY_HUNTER` loot bonus that reads
 * `attackLevel()` in `Mob.lootChance()`.
 */

/** `AttackLevel`: the turns of invisibility each level needs, its damage bonus, and how many
 * damage rolls it takes the best of. */
export interface PreparationLevel {
	/** 1-4, Java's `ordinal() + 1`. */
	level: number;
	/** turnsInvis needed to reach this level. */
	turnsReq: number;
	/** `baseDmgBonus`: a fraction added on top of the best roll. */
	damageBonus: number;
	/** `damageRolls`: take the maximum of this many rolls. */
	damageRolls: number;
}

export const PREPARATION_LEVELS: readonly PreparationLevel[] = [
	{ level: 1, turnsReq: 1, damageBonus: 0.10, damageRolls: 1 },
	{ level: 2, turnsReq: 3, damageBonus: 0.20, damageRolls: 1 },
	{ level: 3, turnsReq: 5, damageBonus: 0.35, damageRolls: 2 },
	{ level: 4, turnsReq: 9, damageBonus: 0.50, damageRolls: 3 },
];

/**
 * `AttackLevel.getLvl(turnsInvis)`: the highest level whose requirement is met, walking the levels
 * in reverse - and `LVL_1` when none is, which is what Java's fallback returns (so 0 turns still
 * reports level 1; the buff itself is what tells a caller whether Preparation is up at all).
 */
export function preparationLevel(turnsInvis: number): PreparationLevel {
	for (let i = PREPARATION_LEVELS.length - 1; i >= 0; i--) {
		const level = PREPARATION_LEVELS[i]!;
		if (turnsInvis >= level.turnsReq) return level;
	}
	return PREPARATION_LEVELS[0]!;
}

/**
 * The level for a plain level *number* (1-4), for callers that already know which level they are
 * at - `Combatant.prepLevel` carries the number, so reading it must not be confused with reading
 * turns of invisibility (which is what `preparationLevel` takes, and which would silently shift
 * every level by one when handed a number). Out-of-range numbers clamp to the nearest level.
 */
export function preparationLevelByNumber(level: number): PreparationLevel {
	const index = Math.min(Math.max(Math.round(level), 1), PREPARATION_LEVELS.length) - 1;
	return PREPARATION_LEVELS[index]!;
}

/**
 * `AttackLevel.KOThresholds`, indexed by preparation level (1-4) and then by
 * `Talent.ENHANCED_LETHALITY` rank (0-3) - Java's own `[ordinal()][pointsInTalent(...)]`.
 */
const KO_THRESHOLDS: readonly (readonly number[])[] = [
	[0.03, 0.04, 0.05, 0.06],
	[0.10, 0.13, 0.17, 0.20],
	[0.20, 0.27, 0.33, 0.40],
	[0.50, 0.67, 0.83, 1.0],
];

/** `AttackLevel.KOThreshold()` for a preparation level and talent rank, both clamped to the table
 * (the talent cannot exceed rank 3, and a level outside 1-4 has no row). */
export function preparationKoThreshold(level: number, enhancedLethalityRank: number): number {
	const row = KO_THRESHOLDS[Math.min(Math.max(level, 1), 4) - 1]!;
	return row[Math.min(Math.max(enhancedLethalityRank, 0), 3)] ?? row[0]!;
}

/**
 * `AttackLevel.canKO(defender)`: the target is below the threshold *fraction of its own maximum*,
 * and a `BOSS`/`MINIBOSS` is only killable at one fifth of it. Java compares with a strict `<`.
 * The caller supplies current HP (Java reads `defender.HP/defender.HT`), and is responsible for the
 * `isAlive`/`alignment !=`/`isInvulnerable` guards that sit around the call in `Char.attack()`.
 */
export function preparationCanKo(
	currentHp: number,
	maxHp: number,
	level: number,
	enhancedLethalityRank: number,
	bossOrMiniboss: boolean,
): boolean {
	if (maxHp <= 0) return false;
	const threshold = preparationKoThreshold(level, enhancedLethalityRank);
	return currentHp / maxHp < (bossOrMiniboss ? threshold / 5 : threshold);
}

/**
 * `AttackLevel.blinkRanges`, indexed by preparation level (1-4) and `Talent.ASSASSINS_REACH` rank
 * (0-3). Exported as data even though the action itself is unported, so the table is checkable.
 */
const BLINK_RANGES: readonly (readonly number[])[] = [
	[1, 1, 2, 2],
	[2, 3, 4, 5],
	[3, 4, 6, 7],
	[4, 6, 8, 10],
];

/** `AttackLevel.blinkDistance()` - the range of `Preparation`'s blink action. */
export function preparationBlinkDistance(level: number, assassinsReachRank: number): number {
	const row = BLINK_RANGES[Math.min(Math.max(level, 1), 4) - 1]!;
	return row[Math.min(Math.max(assassinsReachRank, 0), 3)] ?? row[0]!;
}

/**
 * `AttackLevel.damageRoll(attacker)`: roll the attacker's damage `damageRolls` times, keep the
 * best, and add `baseDmgBonus` on top of it - `Math.round(dmg * (1f + baseDmgBonus))`.
 *
 * `roll` is supplied by the caller so the RNG draws stay in the attack's own deterministic order,
 * exactly as Java's `attacker.damageRoll()` calls do; the rolls happen before the rounding.
 */
export function preparationDamageRoll(level: PreparationLevel, roll: () => number): number {
	let best = roll();
	for (let i = 1; i < level.damageRolls; i++) {
		const candidate = roll();
		if (candidate > best) best = candidate;
	}
	return Math.round(best * (1 + level.damageBonus));
}
