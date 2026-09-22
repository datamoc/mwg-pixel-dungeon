/**
 * Per-carried-wand charge state (`Wand.java`, tag `v3.3.8`): every wand owns
 * `maxCharges`/`curCharges`/`partialCharge`, recharges on its own clock, and
 * arrives full. This port historically kept one shared `Actors.Charges` pool
 * for the wielded wand and absorbed every further pickup into it
 * (`wandabsorbed`), which is exactly what blocks the Mage's two remaining
 * armor abilities - `MagesStaff.imbueWand()` picks among several carried
 * wands and `WildMagic.activate()` fires `getAllItems(Wand.class)`, up to 4
 * (`+FIRE_EVERYTHING`), each spending its own
 * `0.5 * 0.67^CONSERVED_MAGIC` per shot. This module is that per-wand model;
 * the wielded pool is untouched, and pickups of a wand whose class differs
 * from the wielded one now land as spare entries carrying this state.
 */
export interface SpareWandCharges {
	cur: number;
	partial: number;
	max: number;
}

/** `Wand.updateLevel()`: `min(initialCharges + level, 10)`. */
export function spareWandMaxCharges(initialCharges: number, level: number): number {
	return Math.min(initialCharges + Math.max(0, level), 10);
}

/** `Wand` fields on construction: full, no partial progress. */
export function newSpareWandCharges(initialCharges: number, level = 0): SpareWandCharges {
	const max = spareWandMaxCharges(initialCharges, level);
	return { cur: max, partial: 0, max };
}

/**
 * One hero-turn of a spare's own `Charger`: the caller passes this turn's
 * progress (the same `baseRate + recharging bonus` the shared pool advances
 * by - per-wand `Charger`s share that formula). Progress past a full wand is
 * dropped, matching MWG `Charges` at cap.
 */
export function rechargeSpareWand(state: SpareWandCharges, ratePerTurn: number): void {
	if (state.cur >= state.max) {
		state.partial = 0;
		return;
	}
	state.partial += ratePerTurn;
	while (state.partial >= 1 && state.cur < state.max) {
		state.cur += 1;
		state.partial -= 1;
	}
	if (state.cur >= state.max) state.partial = 0;
}

/** `WildMagic.activate()`'s per-shot cost off `partialCharge`. */
export function wildMagicShotCost(conservedMagicRank: number): number {
	return 0.5 * Math.pow(0.67, Math.max(0, conservedMagicRank));
}

/**
 * `WildMagic.activate()`'s shot list over the carried wands: shuffle, drop
 * wands without `cost` total charge, top up to `4 + FIRE_EVERYTHING` from the
 * twice-affordable (`seconds`) then the thrice-affordable (`thirds`, each kept
 * with probability `FIRE_EVERYTHING/4`) rounds, and shuffle again. Returns
 * entry indices (repeats allowed); empty means Java's `no_wands` line.
 * `shuffle`/`randInt` are parameters so the suite pins the shape exactly.
 */
export function wildMagicShots(
	states: readonly { cur: number; partial: number }[],
	conservedMagicRank: number,
	fireEverythingRank: number,
	shuffle: <T>(items: T[]) => T[],
	randInt: (bound: number) => number,
): number[] {
	const cost = wildMagicShotCost(conservedMagicRank);
	const total = (s: { cur: number; partial: number }) => s.cur + s.partial;
	const maxWands = 4 + Math.max(0, fireEverythingRank);
	let wands = shuffle(states.map((_, i) => i).filter((i) => total(states[i]) >= cost));
	if (wands.length < maxWands) {
		const seconds = shuffle(wands.filter((i) => total(states[i]) >= 2 * cost));
		const thirds = shuffle(wands.filter((i) => total(states[i]) >= 3 * cost
			&& randInt(4) < Math.max(0, fireEverythingRank)));
		while (seconds.length > 0 && wands.length < maxWands) wands.push(seconds.shift()!);
		while (thirds.length > 0 && wands.length < maxWands) wands.push(thirds.shift()!);
		wands = shuffle(wands);
	}
	return wands;
}

/**
 * `Wand.buffedLvl()` under `WildMagicTracker`: `bonus = (4 + WILD_POWER +
 * coin) / 2` (integer division: +2/+2.5/+3/+3.5/+4 at 0-4 talent points),
 * applied only while the wand is below `3 + WILD_POWER`. `coinFlip` is the
 * `Random.Int(2) == 0` draw, passed in so the suite pins both halves.
 */
export function wildMagicBoostedLevel(spareLevel: number, wildPowerRank: number, coinFlip: boolean): number {
	const rank = Math.max(0, wildPowerRank);
	const bonus = Math.floor((4 + rank + (coinFlip ? 1 : 0)) / 2);
	const cap = 3 + rank;
	if (spareLevel >= cap) return spareLevel;
	return Math.min(spareLevel + bonus, cap);
}

/** `WildMagic.afterZap()`: the shot cost comes off `partialCharge` first. */
export function spendWildMagicShot(state: SpareWandCharges, cost: number): void {
	state.partial -= cost;
	if (state.partial < 0) {
		state.partial += 1;
		state.cur -= 1;
	}
}
