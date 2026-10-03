/**
 * `ElixirOfAquaticRejuvenation.AquaHealing` (`items/potions/elixirs/ElixirOfAquaticRejuvenation.java`,
 * tag `v3.3.8`) as hero-turn math: a keep-max `left` pool (`set()` raises, never
 * lowers) that pays gradually, only while its owner swims - not flying, standing
 * in WATER, and still hurt. The scene owns the pool, the water/flying read and
 * the per-turn call; this module owns the numbers.
 */

/** `ElixirOfAquaticRejuvenation.apply()`: `Buff.affect(hero, AquaHealing.class).set(round(HT*1.5))`. */
export function aquaHealingDose(maxHp: number): number {
	return Math.round(maxHp * 1.5);
}

export interface AquaHealingTickInput {
	left: number;
	maxHp: number;
	missingHp: number;
	/** `!target.flying && Dungeon.level.water[pos]`: the pool pauses otherwise. */
	swims: boolean;
}

export interface AquaHealingTick {
	left: number;
	healed: number;
}

/** `AquaHealing.act()`: `gate(1, HT/50, left)`, capped at the missing HP, with
 * Java's probabilistic ceil/floor on the fraction (`Random.Float() < frac`);
 * the pool drains by the whole paid tick and the buff ends at zero. A swimless
 * or unhurt turn pays nothing and keeps the pool (the effect pauses, matching
 * Java's `spend(TICK)`-without-heal path). */
export function tickAquaHealing(input: AquaHealingTickInput, rand: () => number): AquaHealingTick {
	let { left } = input;
	let healed = 0;
	if (input.swims && input.missingHp > 0 && left > 0) {
		const gated = Math.min(Math.max(1, input.maxHp / 50), left);
		const amount = Math.min(gated, input.missingHp);
		const paid = rand() < amount % 1 ? Math.ceil(amount) : Math.floor(amount);
		healed = paid;
		left -= paid;
	}
	return { left, healed };
}
