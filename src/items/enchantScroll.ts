/**
 * `ScrollOfEnchantment`'s three offers (`items/scrolls/exotic/ScrollOfEnchantment.java`, tag `v3.3.8`): for a weapon
 * `Weapon.Enchantment.randomCommon / randomUncommon / random(existing, first, second)`, for armor the same three calls on
 * `Armor.Glyph`. The lists and the `{50, 40, 10}` weights are the real `common` / `uncommon` / `rare` arrays and `typeChances`;
 * an exhausted list falls back to `random()` like Java (which can repeat an id, as it does there).
 */
export type EnchantKind = 'weapon' | 'armor';

export const ENCHANT_TIERS: Readonly<Record<EnchantKind, { common: readonly string[]; uncommon: readonly string[]; rare: readonly string[] }>> = {
	weapon: {
		common: ['blazing', 'chilling', 'kinetic', 'shocking'],
		uncommon: ['blocking', 'blooming', 'elastic', 'lucky', 'projecting', 'unstable'],
		rare: ['corrupting', 'grim', 'vampiric'],
	},
	armor: {
		common: ['obfuscation', 'swiftness', 'viscosity', 'potential'],
		uncommon: ['brimstone', 'stone', 'entanglement', 'repulsion', 'camouflage', 'flow'],
		rare: ['affection', 'antimagic', 'thorns'],
	},
};

export const ENCHANT_TYPE_CHANCES: readonly number[] = [50, 40, 10];

export interface EnchantRandom {
	/** `Random.chances(weights)`: the picked index. */
	chances(weights: readonly number[]): number;
	element<T>(list: readonly T[]): T;
}

type Tier = 'common' | 'uncommon' | 'rare';

function pick(kind: EnchantKind, tier: Tier, ignore: readonly (string | null | undefined)[], random: EnchantRandom): string {
	const pool = ENCHANT_TIERS[kind][tier].filter((id) => !ignore.includes(id));
	if (pool.length > 0) return random.element(pool);
	return randomAny(kind, [], random); //Java: `return random();` with no exclusions
}

/** `Enchantment.random(toIgnore...)` / `Glyph.random(toIgnore...)`. */
export function randomAny(kind: EnchantKind, ignore: readonly (string | null | undefined)[], random: EnchantRandom): string {
	const tiers: Tier[] = ['common', 'uncommon', 'rare'];
	const tier = tiers[Math.max(0, random.chances(ENCHANT_TYPE_CHANCES))] ?? 'common';
	return pick(kind, tier, ignore, random);
}

/** The scroll's three offers, in Java's order (common, uncommon, then any rarity avoiding the first two). */
export function rollEnchantOffers(kind: EnchantKind, existing: string | null | undefined, random: EnchantRandom): [string, string, string] {
	const first = pick(kind, 'common', [existing], random);
	const second = pick(kind, 'uncommon', [existing], random);
	const third = randomAny(kind, [existing, first, second], random);
	return [first, second, third];
}
