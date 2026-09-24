/**
 * The Gladiator's `Combo` buff rules (`actors/buffs/Combo.java`, tag `v3.3.8`) as pure functions: the
 * hit counter's timing, which finisher moves a count unlocks, and the finishers' damage numbers. The
 * scene (`scenes/dungeon/hero/comboMoves.ts`) owns the state, the aiming and the attacks.
 */

export type ComboMove = 'clobber' | 'slam' | 'parry' | 'crush' | 'fury';

/** `ComboMove(comboReq, tintColor)`, in enum order (the order `getHighestMove()` scans). */
export const COMBO_MOVES: ReadonlyArray<{ id: ComboMove; req: number; tint: number }> = [
	{ id: 'clobber', req: 2, tint: 0x00FF00 },
	{ id: 'slam', req: 4, tint: 0xCCFF00 },
	{ id: 'parry', req: 6, tint: 0xFFFF00 },
	{ id: 'crush', req: 8, tint: 0xFFCC00 },
	{ id: 'fury', req: 10, tint: 0xFF0000 },
];

/** `getHighestMove()`: the last move whose requirement the count meets, or null below 2. */
export function comboHighestMove(count: number): ComboMove | null {
	let best: ComboMove | null = null;
	for (const move of COMBO_MOVES) if (count >= move.req) best = move.id;
	return best;
}

/** `canUseMove()`: Clobber and Parry are once per combo session; every move needs its count. */
export function comboCanUse(move: ComboMove, count: number, used: { clobber: boolean; parry: boolean }): boolean {
	if (move === 'clobber' && used.clobber) return false;
	if (move === 'parry' && used.parry) return false;
	return (COMBO_MOVES.find((entry) => entry.id === move)?.req ?? Infinity) <= count;
}

/**
 * `hit()`: the combo clock after a landed hit. A normal hit lifts it to at least 5 turns; killing the
 * target (or hitting a full-health Corrupted one) sets 15 + 15 x Cleave ranks.
 */
export function comboTimeAfterHit(current: number, killed: boolean, cleaveRank: number): number {
	return killed ? 15 + 15 * cleaveRank : Math.max(current, 5);
}

/** SLAM: `dmgBonus = Math.round(drRoll * count / 5f)`, added after the multiplier. */
export function comboSlamBonus(heroDrRoll: number, count: number): number {
	return Math.round(heroDrRoll * count / 5);
}

/** CRUSH: the main hit's damage multiplier, `0.25 * count`. */
export function comboCrushMultiplier(count: number): number {
	return 0.25 * count;
}

/**
 * CRUSH's splash on every other enemy within 3 of the target: `round(damageRoll * 0.25 * count) / 2`
 * (integer division) minus the victim's armor roll, x1.33 truncated when Vulnerable. Never negative
 * (`Char.damage` ignores a negative amount).
 */
export function comboCrushSplash(heroDamageRoll: number, count: number, victimDrRoll: number, victimVulnerable: boolean): number {
	let hit = Math.trunc(Math.round(heroDamageRoll * 0.25 * count) / 2);
	hit -= victimDrRoll;
	if (victimVulnerable) hit = Math.trunc(hit * 1.33);
	return Math.max(0, hit);
}

/** FURY: every strike is x0.6, one per combo count. */
export const COMBO_FURY_MULTIPLIER = 0.6;

/** CLOBBER's knock-back distance: 2, or 3 (plus 3 turns of Vertigo) at count >= 7 with Enhanced Combo. */
export function comboClobberEmpowered(count: number, enhancedComboRank: number): boolean {
	return count >= 7 && enhancedComboRank >= 1;
}

/** PARRY stays up through several blows only at count >= 9 with Enhanced Combo 2 (`Hero.defenseVerb`). */
export function comboParryPersists(count: number, enhancedComboRank: number): boolean {
	return count >= 9 && enhancedComboRank >= 2;
}

/** Enhanced Combo 3: a move may leap up to `1 + count/3` cells to reach its target. */
export function comboLeapRange(count: number, enhancedComboRank: number): number {
	return enhancedComboRank >= 3 ? 1 + Math.trunc(count / 3) : 1;
}
