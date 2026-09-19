import { SPECIALTY_BOMB_IDS, isMissileStack, type CarriedItem } from './itemKinds';
import type { InventoryFilter } from '../ui/inventoryWindow';

/**
 * The four `items/bags/*` classes (`Bag.java` + subclasses, tag `v3.3.8`) as ownable
 * shop goods - the shelf side of `ShopRoom.ChooseBag()`, not the container side.
 *
 * What Java does, per class (all verified against the tag):
 * - `Bag`: `unique = true`, `isUpgradable()` false, `isIdentified()` always true,
 *   `capacity()` 20. `collect()` pulls every holdable item out of the hero's backpack
 *   (`grabItems`), and `resurrect()` drops every non-unique from a kept bag.
 * - `VelvetPouch`/`ScrollHolder`/`PotionBandolier`/`MagicalHolster`: `capacity()` 19,
 *   `value()` 30/40/40/60, and a `canHold()` class gate (seeds + runestones + goo/metal
 *   shards; scrolls + spells + resin + stylus; potions + liquid metal + waterskin;
 *   wands + missiles + bombs).
 * - `ShopRoom.ChooseBag()`: builds a `HashMap` of the not-yet-dropped bags (velvet base
 *   weight 1, the other three 0), adds one per backpack item each candidate could hold,
 *   and returns the highest scorer - pure logic, zero `Random.*` calls. The velvet flag
 *   is dropped unconditionally by `HeroClass.initHero()`, and `ChooseBag()` itself drops
 *   the returned bag's flag, so each shop consumes exactly one (`shopItems.ts`'s
 *   `bagsRemaining` is the level-generation half of that same fact).
 *
 * What this module ports is the shelf half: the pick (`chooseShopBag`), the values, and
 * the `canHold` gates as a bag-id predicate over the port's own ids (used for scoring,
 * and later for anything that needs to know what goes where). Of the container half,
 * three pieces are now live too (2026-09-18): the Magical Holster's stat effects (wand
 * recharge and missile durability, read off holster *ownership* - the flat bag keeps no
 * per-item location, and every owned wand/missile would sit in the one holster anyway),
 * the `Shopkeeper.canSell` resale refusal (`unique && !stackable`), and the
 * `validateAllBagsBought` badge set, and - since this pass - the open action: using a
 * bag opens the bag window on its own filtered tab (`bagTab`), the flat bag's stand-in
 * for per-bag contents views. What stays open: contents arrays, `grabItems` on
 * pickup, capacity enforcement (see PORT_COVERAGE.md's bag row and
 * ROADMAP.md's inventory-windows line). A bought bag is therefore a named, priced,
 * unsellable item, exactly as far as the flat model reaches.
 */
export type BagId = 'velvetPouch' | 'scrollHolder' | 'potionBandolier' | 'magicalHolster';

/** The four shop bags, in the port's fixed tie-break order (see `chooseShopBag`). */
export const BAG_IDS: readonly BagId[] = ['velvetPouch', 'scrollHolder', 'potionBandolier', 'magicalHolster'];

/** `VelvetPouch.value()` 30, `ScrollHolder`/`PotionBandolier.value()` 40, `MagicalHolster.value()` 60. */
export const BAG_VALUES: Readonly<Record<BagId, number>> = {
	velvetPouch: 30,
	scrollHolder: 40,
	potionBandolier: 40,
	magicalHolster: 60,
};

/** `ChooseBag()`'s opening weights: velvet 1, every other bag 0. */
const BAG_BASE_WEIGHT: Readonly<Record<BagId, number>> = {
	velvetPouch: 1,
	scrollHolder: 0,
	potionBandolier: 0,
	magicalHolster: 0,
};

/** `Bag.capacity()` 20 is the backpack's own size and has no port expression (the flat bag
 * has no capacity at all); the four shop bags hold 19 each. Kept for the scoring comment
 * below and for the day a container model needs it. */
export const BAG_CAPACITY = 19;

export function isBagId(id: string): id is BagId {
	return (BAG_IDS as readonly string[]).includes(id);
}

/** `Bag.ownsBag` over the flat inventory: a bag is owned while its item sits in the bag. */
export function ownsBag(items: readonly { readonly id: string }[], id: BagId): boolean {
	return items.some((item) => item.id === id);
}

/**
 * `MagicalHolster.HOLSTER_SCALE_FACTOR` (`0.85f`) against the normal wand factor (`0.875f`,
 * `Wand.java:804`), and `HOLSTER_DURABILITY_FACTOR` (`1.2f`, applied to the use count inside
 * `MissileWeapon.durabilityPerUse`). Both fire while the item sits *inside* the holster in
 * Java; here they fire while the holster is owned (see the module note).
 */
export const HOLSTER_RECHARGE_BASE = 0.85;
export const NORMAL_RECHARGE_BASE = 0.875;
export const HOLSTER_DURABILITY_FACTOR = 1.2;

/**
 * `Badges.java`'s bag set (`validateAllBagsBought`): one badge per bag plus the meta badge.
 * Counter names follow this port's lowercase badge convention; the meta badge keeps Java's
 * own `badges.png` cell 67.
 */
export const BAG_BADGE: Readonly<Record<BagId, string>> = {
	velvetPouch: 'bag_velvet',
	scrollHolder: 'bag_holder',
	potionBandolier: 'bag_bandolier',
	magicalHolster: 'bag_holster',
};
export const ALL_BAGS_BADGE = 'bags_all';

/**
 * The `canHold()` gates of the four bag classes, stated over the port's bag ids.
 *
 * - Velvet (`Plant.Seed`, `Runestone`, `GooBlob`, `MetalShard`): the port's `seed`, its
 *   `stoneOf*` runestones, a bare `stone` that is *not* a missile stack (the id is shared -
 *   `isMissileStack` reads the payload's class, the same test `wieldMissile` validates
 *   with), and the `gooBlob`/`metalShard` quest ids (`itemKinds.ts` maps both onto Java's
 *   `quest/*` classes).
 * - Scroll holder (`Scroll`, `Spell`, `ArcaneResin`, `Stylus`): every `scroll*` id, the
 *   `alchemize` spell (`Alchemize extends Spell`), the `arcaneResin` consumable, the stylus.
 * - Bandolier (`Potion`, `LiquidMetal`, `Waterskin`): every `potion*` id, liquid metal,
 *   the waterskin.
 * - Holster (`Wand`, `MissileWeapon`, `Bomb`): the `wand` id, missile stacks (class-read,
 *   plus the bare `knife`/`spike` ammo ids), the `bomb`/`doubleBomb` pair and every
 *   specialty bomb. The honeypot is deliberately excluded: Java's `Honeypot` is an `Item`,
 *   not a `Bomb`.
 */
export function bagCanHold(bag: BagId, item: CarriedItem): boolean {
	switch (bag) {
		case 'velvetPouch':
			return item.id === 'seed' || item.id === 'gooBlob' || item.id === 'metalShard'
				|| item.id.startsWith('stoneOf') || (item.id === 'stone' && !isMissileStack(item));
		case 'scrollHolder':
			return item.id.startsWith('scroll') || item.id === 'stylus'
				|| item.id === 'alchemize' || item.id === 'arcaneResin';
		case 'potionBandolier':
			return item.id.startsWith('potion') || item.id === 'liquidMetal' || item.id === 'waterskin';
		case 'magicalHolster':
			return item.id === 'wand' || item.id === 'knife' || item.id === 'spike'
				|| isMissileStack(item) || item.id === 'bomb' || item.id === 'doubleBomb'
				|| SPECIALTY_BOMB_IDS.has(item.id);
	}
}

/**
 * The open half of the container behavior: using a bag shows its contents. The flat bag
 * keeps no per-bag contents arrays, but the bag window's filtered pouch tabs already ARE
 * the per-bag contents views (`subBagFor` routes every item into exactly one of them),
 * so opening a bag selects its tab. Three mappings are exact; the velvet pouch opens the
 * runestone tab because that tab carries the velvet name (`SUB_BAG_LABEL.pouch_stone`),
 * while seeds live one tap away on the port-invented seed tab - a stated consequence of
 * the already-documented tab split, not a new gap.
 */
export function bagTab(bag: BagId): InventoryFilter {
	switch (bag) {
		case 'velvetPouch': return 'pouch_stone';
		case 'scrollHolder': return 'holder_scroll';
		case 'potionBandolier': return 'bag_potion';
		case 'magicalHolster': return 'holster_wand';
	}
}

/**
 * `ShopRoom.ChooseBag()`: the highest scorer among the not-yet-dropped bags, each scored
 * at its base weight plus one per backpack entry it could hold. `dropped` is the run's
 * `Dungeon.LimitedDrops` bag flags (velvet is already in there - `initHero()` drops it
 * unconditionally); the caller drops the returned bag's flag, the way `ChooseBag()` itself
 * does. `null` when every flag is dropped, exactly like Java returning null.
 *
 * Deliberate simplification, stated where it matters: Java breaks ties by `HashMap`
 * iteration order, which is JVM-dependent and not reproducible even in principle (see
 * `shopItems.ts`'s header), so ties here go to the earlier `BAG_IDS` entry instead.
 */
export function chooseShopBag(
	dropped: ReadonlySet<string> | readonly string[],
	backpack: readonly CarriedItem[],
): BagId | null {
	const gone = new Set<string>(dropped);
	let best: BagId | null = null;
	let bestScore = -1;
	for (const bag of BAG_IDS) {
		if (gone.has(bag)) continue;
		let score = BAG_BASE_WEIGHT[bag]!;
		for (const item of backpack) {
			if (bagCanHold(bag, item)) score++;
		}
		if (score > bestScore) {
			best = bag;
			bestScore = score;
		}
	}
	return best;
}
