/**
 * Shop pricing system based on Java Shattered Pixel Dungeon's real item values.
 * Prices scale with dungeon depth and item rarity/tier.
 */

/**
 * Base price for an item at tier 1, before depth/rarity scaling.
 * Formula: price at depth = base_price * (1 + depth_scaling_factor)
 */
const BASE_PRICES: Record<string, number> = {
	// Potions (all same base price regardless of effect)
	potionHealing: 50,
	potionStrength: 50,
	potionFlame: 50,
	potionMindVision: 50,
	potionInvis: 50,
	potionPurity: 50,
	potionLevitation: 50,

	// Scrolls (varying by rarity)
	scrollIdentify: 30,
	scrollUpgrade: 50,
	scrollRage: 35,
	scrollLullaby: 35,
	scrollMapping: 30,
	scrollMirror: 40,
	scrollCleanse: 40,
	scrollRecharging: 30,
	scrollTeleportation: 30,
	scrollTerror: 40,
	scrollRetribution: 40,

	// Weapons (tier 1 base, scale up per tier)
	wornshortsword: 20,
	magesstaff: 20,
	dagger: 20,
	gloves: 20,
	rapier: 25,

	// Armor (tier 1 base)
	clothArmor: 15,

	// Rings (base price for all, don't scale by tier)
	ringAccuracy: 80,
	ringEvasion: 80,
	ringMight: 80,
	ringTenacity: 80,

	// Wands (base price at tier 1, scale by tier)
	wandmagicmissile: 60,
	wandfirebolt: 60,
	wandcorruption: 60,
	wandfrost: 60,
	wandlightning: 60,
	wandblast: 55,
	wandlivingearth: 55,
	wandregrowth: 40,
	wandprismatic: 75,
	wandwarding: 50,

	// Food
	food: 10,
	velvetPouch: 30,
	waterskin: 20,
};

/**
 * Get the price of an item in the shop.
 * @param itemId - The item identifier
 * @param depth - Current dungeon depth (1-26)
 * @param tier - Item tier (1-5). Most items at tier 1; weapons/armor/wands scale by tier
 * @returns Price in gold
 */
export function getShopPrice(itemId: string, depth: number = 1, tier: number = 1): number {
	const basePrice = BASE_PRICES[itemId] ?? 50; // Default price if not found

	// Depth scaling: ~10% per depth level
	const depthMultiplier = Math.pow(1.1, depth - 1);

	// Tier scaling: 1.5x per tier above 1 (weapons, armor, wands only)
	const isScaledItem = ['sword', 'armor', 'wand', 'shortsword', 'axe', 'staff'].some((keyword) =>
		itemId.toLowerCase().includes(keyword)
	);
	const tierMultiplier = isScaledItem ? Math.pow(1.5, tier - 1) : 1;

	return Math.round(basePrice * depthMultiplier * tierMultiplier);
}

/**
 * Get the sell value of an item (typically 50-80% of shop price).
 * @param itemId - The item identifier
 * @param depth - Current dungeon depth
 * @param tier - Item tier (1-5)
 * @param sellFraction - What percentage of shop price the item sells for (default 0.67 = 67%)
 * @returns Sell value in gold
 */
export function getSellPrice(itemId: string, depth: number = 1, tier: number = 1, sellFraction: number = 0.67): number {
	return Math.round(getShopPrice(itemId, depth, tier) * sellFraction);
}
