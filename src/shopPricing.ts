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
const UNIT_VALUES: Record<string, number> = {
	//`Potion.value() = 30 x quantity`, all 12 classes alike.
	potion: 30, potionHealing: 30, potionStrength: 30, potionFlame: 30, potionMindVision: 30,
	potionInvis: 30, potionPurity: 30, potionLevitation: 30, potionExperience: 30,
	potionToxicGas: 30, potionParalyticGas: 30, potionHaste: 30, potionFrost: 30,
	//`Scroll.value() = 30 x quantity`; upgrade/transmutation are 50 once known.
	scroll: 30, scrollIdentify: 30, scrollRage: 30, scrollLullaby: 30, scrollMapping: 30,
	scrollMirror: 30, scrollCleanse: 30, scrollRecharging: 30, scrollTeleportation: 30,
	scrollTerror: 30, scrollRetribution: 30,
	scrollUpgrade: 50, scrollTransmutation: 50,
	//`Food.value() = 10 x quantity`, `MysteryMeat.value() = 5 x quantity`,
	//`Bomb.value() = 15 x quantity`.
	food: 10, meat: 5, bomb: 15, doubleBomb: 15,
	frostBomb: 15, woollyBomb: 15, fireBomb: 15, noisemaker: 15, flashbang: 15,
	shockBomb: 15, regrowthBomb: 15, holyBomb: 15, arcaneBomb: 15, shrapnelBomb: 15,
	gooBlob: 30, metalShard: 50,
	//`Runestone.value() = 15 x quantity`, `Plant.Seed.value() = 10 x quantity`,
	//`TimekeepersHourglass.sandBag.value() = 30` flat.
	stone: 15, stoneOfAugmentation: 15, stoneOfFear: 15, stoneOfDeepSleep: 15,
	stoneOfShock: 15, stoneOfBlast: 15, stoneOfBlink: 15, stoneOfClairvoyance: 15,
	seed: 10, sandBag: 30,
	//`Ankh.value()`/`Stylus.value()`/`Honeypot.value()` are 50/30/30; Alchemize
	//uses `(40 * quantity / 8)` in Java's spell implementation, so one shop use is 5.
	ankh: 50, stylus: 30, honeypot: 30, alchemize: 5, bag: 30,
};

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
		let price = 20 * Math.max(1, meta.tier ?? 1);
		if (meta.affix && !meta.affix.toLowerCase().includes('curse')) price *= 1.5;
		if (meta.cursedKnown && (meta.cursed || meta.affix?.toLowerCase().includes('curse'))) price /= 2;
		if (identified && (meta.level ?? 0) > 0) price *= (meta.level! + 1);
		return Math.max(1, Math.floor(price)) * quantity;
	}
	//`Ring.value()`/`Wand.value()` are 75 base (generated shop variants are level-0).
	if (itemId.startsWith('ring_') || itemId === 'wand') return 75 * quantity;
	return (UNIT_VALUES[itemId] ?? 0) * quantity;
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
