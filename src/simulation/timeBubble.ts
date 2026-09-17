/**
 * `Swiftthistle.TimeBubble` per-char ownership from SPD tag `v3.3.8`.
 *
 * Java's bubble is a buff on whoever ate the plant (`Buff.affect(ch, ...)` - hero,
 * mob or ally alike), not a global: `Char.spendConstant()` absorbs the owner's own
 * spends into the bubble's `left` instead of advancing its scheduler clock, so the
 * owner acts ~7 times consecutively while everything else waits at the same
 * timestamp. Delayed presses, on the other hand, only ever land in the HERO's
 * bubble (`Level.pressCell` and `Level.beforeTransition` both read
 * `Dungeon.hero.buff(...)`), so a mob's own bubble detaches with empty presses and
 * fires nothing - the observable half of mob ownership is the rapid turns alone.
 *
 * This port's scheduler (`advanceToInput`) charges the cost `monsterTurnCost`
 * returns after each action, and explicitly allows 0 ("finite and non-negative"),
 * so the scene reproduces the absorption by costing a bubble owner 0 and ticking
 * the counter in `afterMonsterTurn` - the existing generic hooks, no new seam.
 */
export const TIME_BUBBLE_TURNS = 7;

/** A bubble owner spends 0 scheduler clock per action; everyone else pays base. */
export function timeBubbleTurnCost(turns: number | undefined, baseCost: number): number {
	return (turns ?? 0) > 0 ? 0 : baseCost;
}

/** One absorbed own-turn; the bubble clears (undefined) once the last turn is spent. */
export function spendTimeBubbleTurn(turns: number | undefined): number | undefined {
	const left = (turns ?? 0) - 1;
	return left > 0 ? left : undefined;
}
