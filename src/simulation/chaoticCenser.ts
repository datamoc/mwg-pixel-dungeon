/**
 * `ChaoticCenser` and its `CenserGasTracker` / `GasSpewer` (`items/trinkets/ChaoticCenser.java`, tag `v3.3.8`) as pure
 * rules: the countdown to the next gas, the gas roll and where it lands. The scene adapter
 * (`scenes/dungeon/trinkets.ts`) owns the hero's target, the field of view, the Storm Cloud blob and the
 * deferred spew.
 */

export type CenserGas = 'toxicGas' | 'confusionGas' | 'regrowth' | 'stormCloud' | 'smokeScreen' | 'stenchGas' | 'inferno' | 'blizzard' | 'corrosiveGas';

/** `GAS_CAT_CHANCES[level]`: common / uncommon / rare weights. */
export const CENSER_CATEGORY_CHANCES: readonly (readonly [number, number, number])[] = [
	[70, 25, 5], [60, 30, 10], [50, 35, 15], [40, 40, 20],
];

/** `COMMON_GASSES`, `UNCOMMON_GASSES`, `RARE_GASSES`: each gas and the volume `Blob.seed` gets. */
export const CENSER_GASES: readonly (readonly { gas: CenserGas; quantity: number }[])[] = [
	[{ gas: 'toxicGas', quantity: 300 }, { gas: 'confusionGas', quantity: 300 }, { gas: 'regrowth', quantity: 200 }],
	[{ gas: 'stormCloud', quantity: 300 }, { gas: 'smokeScreen', quantity: 300 }, { gas: 'stenchGas', quantity: 200 }],
	[{ gas: 'inferno', quantity: 300 }, { gas: 'blizzard', quantity: 300 }, { gas: 'corrosiveGas', quantity: 200 }],
];

/** The Java class' `actors.blobs.<key>.name` message key for each gas (the "about to spew" warning). */
export const CENSER_GAS_NAME_KEY: Readonly<Record<CenserGas, string>> = {
	toxicGas: 'actors.blobs.toxicgas.name', confusionGas: 'actors.blobs.confusiongas.name', regrowth: 'actors.blobs.regrowth.name',
	stormCloud: 'actors.blobs.stormcloud.name', smokeScreen: 'actors.blobs.smokescreen.name', stenchGas: 'actors.blobs.stenchgas.name',
	inferno: 'actors.blobs.inferno.name', blizzard: 'actors.blobs.blizzard.name', corrosiveGas: 'actors.blobs.corrosivegas.name',
};

/** `Integer.MAX_VALUE`: the tracker's initial `left`, always above `avgTurns * 1.2` so the first act rolls a real countdown. */
export const CENSER_UNSET = 2147483647;

export interface CenserRandom {
	/** `Random.IntRange(lo, hi)`, both inclusive. */
	intRange(lo: number, hi: number): number;
	/** `Random.chances(weights)`: the picked index, -1 when every weight is 0. */
	chances(weights: readonly number[]): number;
	element<T>(list: readonly T[]): T;
}

/** The start of `act()`: a countdown still above `avgTurns * 1.2` (the first act, or after the trinket was upgraded down) is re-rolled. */
export function censerRefreshLeft(left: number, avgTurns: number, random: CenserRandom): number {
	if (left > avgTurns * 1.2) return random.intRange(Math.trunc(avgTurns * 0.833), Math.trunc(avgTurns * 1.2));
	return left;
}

/** After a gas was produced: `left += IntRange(avg * 0.9, avg * 1.1)`. */
export function censerAfterGas(left: number, avgTurns: number, random: CenserRandom): number {
	return left + random.intRange(Math.trunc(avgTurns * 0.9), Math.trunc(avgTurns * 1.1));
}

/** The end of `act()`: `left = (int) max(left - delay, -avgTurns / 3f)` (a negative floor, so it fires at once when a target appears). */
export function censerAdvance(left: number, delay: number, avgTurns: number): number {
	return Math.trunc(Math.max(left - delay, -avgTurns / 3));
}

/**
 * `produceGas()`'s gas pick: a category by `GAS_CAT_CHANCES[level]`, then a uniform gas within it (`Random.element` over the
 * category's key set - Java's `HashMap` order is not defined, so uniform is the only reading); a Regrowth roll is rerolled while
 * regeneration is off (`!Regeneration.regenOn()`, a locked boss floor).
 */
export function rollCenserGas(level: number, regenOn: boolean, random: CenserRandom): { gas: CenserGas; quantity: number } | undefined {
	if (level < 0 || level > 3) return undefined;
	const category = random.chances(CENSER_CATEGORY_CHANCES[level]!);
	const pool = CENSER_GASES[category < 0 ? 0 : category]!;
	let pick: { gas: CenserGas; quantity: number };
	do {
		pick = random.element(pool);
	} while (category <= 0 && !regenOn && pick.gas === 'regrowth');
	return pick;
}

/** `Level.trueDistance`. */
export const trueDistance = (a: { x: number; y: number }, b: { x: number; y: number }): number => Math.hypot(a.x - b.x, a.y - b.y);
/** `Level.distance`: Chebyshev. */
export const cellDistance = (a: { x: number; y: number }, b: { x: number; y: number }): number => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

/**
 * `produceGas()`'s aim: a target 4+ cells from the hero is aimed at "in front of" it - for each of the eight neighbours, one step
 * toward the hero when that neighbour is open and strictly nearer than the aim so far (Java's loop condition reads
 * `target.pos + i` every time, so each neighbour moves the aim at most once).
 */
export function censerAimPoint(
	target: { x: number; y: number }, hero: { x: number; y: number }, solid: (x: number, y: number) => boolean,
	neighbours: ReadonlyArray<readonly [number, number]>,
): { x: number; y: number } {
	let aim = { x: target.x, y: target.y };
	if (trueDistance(target, hero) < 4) return aim;
	for (const [dx, dy] of neighbours) {
		const stepped = { x: target.x + dx, y: target.y + dy };
		//`!solid[targetpos + i]`: Java tests the neighbour of the CURRENT aim, then compares the neighbour of the original target.
		if (!solid(aim.x + dx, aim.y + dy) && trueDistance(stepped, hero) < trueDistance(aim, hero)) aim = stepped;
	}
	return aim;
}

/**
 * The landing-cell weights: among the candidate cells (visible, 2-6 steps from the hero) the nearest to the aim point weighs 8,
 * those one step further 1, the rest 0 - "strongly prefer cells closer to target".
 */
export function censerCellWeights(cells: ReadonlyArray<{ x: number; y: number }>, aim: { x: number; y: number }): number[] {
	let closest = 100;
	for (const cell of cells) closest = Math.min(closest, cellDistance(cell, aim));
	return cells.map((cell) => {
		const gap = cellDistance(cell, aim) - closest;
		return gap === 0 ? 8 : gap <= 1 ? 1 : 0;
	});
}
