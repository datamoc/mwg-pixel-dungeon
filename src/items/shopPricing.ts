/**
 * Shop pricing, mirroring `Shopkeeper.java` + each item's `value()` (tag `v3.3.8`).
 *
 * - `Shopkeeper.sellPrice(item) = item.value() * 5 * (Dungeon.depth / 5 + 1)` - the
 *   parenthesised depth bracket (integer division: depths 1-4 x1, 5-9 x2, 10-14 x3,
 *   15-19 x4, 20+ x5... note depth 5 itself already brackets x2) is Java's own "wealth
 *   modifier", not a smooth curve. The port previously used a `1.1^(depth-1)` guess with
 *   invented base prices - both replaced here with the real formula and real values.
 * - Selling to the keeper (`WndTradeItem.sell`) pays flat `item.value()` for the stack (or
 *   one unit), and the sold item lands on the buyback shelf, rebought later at that same
 *   flat value - never at the x5 shelf price. The port previously paid 67% of its own
 *   guessed shelf price and restocked sold goods as full-price shelf items instead.
 *
 * The live shop trades shelf potions/identify, generated gear, and positively-valued
 * inventory items sold by the hero. Bombs and the remaining generated goods are included
 * where their distinct item implementations already exist.
 */

/** Per-unit `value()` bodies for the traded ids (quantity folds in at the call). */
import { MWL_EQUIPMENT_VALUE_RULES, MWL_ITEM_UNIT_VALUES, MWL_MISSILE_DEFINITIONS } from '../mwlContent';

const MISSILE_TIER = new Map(MWL_MISSILE_DEFINITIONS.map((definition) => [definition.id, definition.tier]));

// Java's class-specific value() facts are content metadata; the formulas below are executable
// shop behavior. Alchemize's 2.5 per-unit approximation is retained in the authored MWL value.
const UNIT_VALUES = MWL_ITEM_UNIT_VALUES;

/**
 * This port's analogue of `Item.value()`: per-unit value times quantity. Upgrade/
 * transmutation scrolls are worth 50 only identified (mirroring `isKnown() ? 50 :
 * super.value()`); unknown ids are worthless (`Item.value()` defaults to 0, which is
 * also what gates `Shopkeeper.canSell`).
 */
export interface ShopItemMeta { tier?: number; level?: number; affix?: string; cursed?: boolean; cursedKnown?: boolean; seal?: boolean }

export function itemValue(itemId: string, quantity = 1, identified = true, meta: ShopItemMeta = {}): number {
	if ((itemId === 'scrollUpgrade' || itemId === 'scrollTransmutation') && !identified) {
		return 30 * quantity;
	}
	if (meta.seal) return 0;
	if (itemId === 'weaponReward' || itemId === 'armorReward') {
		const rule = MWL_EQUIPMENT_VALUE_RULES.generatedGear;
		if (!rule) throw new Error('MWL equipment value rule is missing: generatedGear');
		let price = rule.basePerTier * Math.max(1, meta.tier ?? 1);
		if (meta.affix && !meta.affix.toLowerCase().includes('curse')) price *= rule.positiveAffixMultiplier;
		if (meta.cursedKnown && (meta.cursed || meta.affix?.toLowerCase().includes('curse'))) price *= rule.knownCurseMultiplier;
		if (identified && (meta.level ?? 0) > 0) price *= (rule.identifiedLevelBase + meta.level!);
		return Math.max(1, Math.floor(price)) * quantity;
	}
	//`MissileWeapon.value()` (tag `v3.3.8`): `5 * tier * quantity`, x1.5 with a good enchant, halved when known cursed,
	//x(level+1) when the level is known, never below 1. Missing here, every missile priced at 0 - a shop shelf sold a
	//throwing club for free, and a thrown weapon could not be sold for anything.
	const missileTier = MISSILE_TIER.get(itemId);
	if (missileTier !== undefined) {
		let price = 5 * missileTier * quantity;
		if (meta.affix && !meta.affix.toLowerCase().includes('curse')) price *= 1.5;
		if (meta.cursedKnown && (meta.cursed || meta.affix?.toLowerCase().includes('curse'))) price /= 2;
		if (identified && (meta.level ?? 0) > 0) price *= meta.level! + 1;
		return Math.max(1, Math.floor(price));
	}
	// Ring/Wand ids are runtime-specific, so their family value is the authored fallback.
	const unitValue = itemId.startsWith('ring_') ? UNIT_VALUES.ring : UNIT_VALUES[itemId];
	return (unitValue ?? 0) * quantity;
}

/**
 * `Shopkeeper.sellPrice()`: what the hero PAYS for shelf (and buyback-shelf) goods.
 * Java sells buyback rebuys at flat `value()` instead - use `buybackPrice` for those.
 */
export function getShopPrice(itemId: string, depth = 1, quantity = 1, identified = true, meta: ShopItemMeta = {}): number {
	return itemValue(itemId, quantity, identified, meta) * 5 * (Math.floor(depth / 5) + 1);
}

/** `WndTradeItem.sell`: what the keeper PAYS the hero - flat `value()`, no bracket. */
export function getSellPrice(itemId: string, _depth = 1, quantity = 1, identified = true, meta: ShopItemMeta = {}): number {
	return itemValue(itemId, quantity, identified, meta);
}

/** Buyback rebuys cost flat `value()` (`Dungeon.gold -= returned.value()`). */
export function buybackPrice(itemId: string, quantity = 1, identified = true, meta: ShopItemMeta = {}): number {
	return itemValue(itemId, quantity, identified, meta);
}
