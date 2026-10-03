/**
 * `ScrollOfDivination.doRead()`'s pick loop (`items/scrolls/exotic/ScrollOfDivination.java`, tag `v3.3.8`): up to four
 * identifications drawn from the unknown potion, scroll and ring classes, three tickets each category that fall by one per
 * pick, a category with nothing left zeroed, and the tickets reset once they run out. Pure: the scene supplies the unknown
 * lists and the random source and applies the result.
 */
export interface DivinationRandom {
	/** `Random.chances(weights)`: the picked index, -1 when every weight is 0. */
	chances(weights: readonly number[]): number;
	element<T>(list: readonly T[]): T;
}

/** `Ring.getUnknown()`'s candidate set: the twelve ring classes (`Generator.Category.RING`). */
export const DIVINATION_RING_IDS = [
	'ringAccuracy', 'ringArcana', 'ringElements', 'ringEnergy', 'ringEvasion', 'ringForce',
	'ringFuror', 'ringHaste', 'ringMight', 'ringSharpshooting', 'ringTenacity', 'ringWealth',
] as const;

export type DivinationCategory = 'potion' | 'scroll' | 'ring';

export function rollDivination(
	unknown: Readonly<Record<DivinationCategory, readonly string[]>>, random: DivinationRandom,
): Array<{ category: DivinationCategory; id: string }> {
	const pools = { potion: [...unknown.potion], scroll: [...unknown.scroll], ring: [...unknown.ring] };
	const order: DivinationCategory[] = ['potion', 'scroll', 'ring'];
	const base = [3, 3, 3];
	let probs = base.slice();
	let left = 4;
	let total = pools.potion.length + pools.scroll.length + pools.ring.length;
	const picked: Array<{ category: DivinationCategory; id: string }> = [];
	while (left > 0 && total > 0) {
		const index = random.chances(probs);
		if (index < 0) { probs = base.slice(); continue; }
		const category = order[index]!;
		const pool = pools[category];
		if (pool.length === 0) { probs[index] = 0; continue; }
		probs[index]!--;
		const id = random.element(pool);
		pool.splice(pool.indexOf(id), 1);
		picked.push({ category, id });
		left--;
		total--;
	}
	return picked;
}
