/**
 * `ShopRoom.generateItems()` (`levels/rooms/special/ShopRoom.java`, tag `v3.3.8`) - the per-depth
 * shelf every shop opens with.
 *
 * The port shipped a hand-authored *subset* of this list (`scenario-rules.mwl`'s `shopShelfStock`:
 * a healing potion, two potions, three scrolls, two foods, two alchemize spells and a bomb) and
 * priced those as live goods. That subset was never the shop. Java also stocks a tier-matched
 * weapon and missile stack, a concrete armor of the same tier, an alchemize stack of 2-3, two
 * *randomly drawn* potions, two more random potion-or-scroll draws, an ankh, an augmentation stone,
 * three torches on the deepest shops, sandbags for a carried hourglass, and - on `Random.Int(10)` -
 * a wand, a ring or an artifact with a stylus on the other seven rolls.
 *
 * The generator draws are *injected* rather than imported, for two reasons: `items/generator.ts`
 * pulls in the whole MWL catalogue and the SPD stream, which would make this module untestable
 * headlessly, and the caller is the only place that knows what a category id *is*. This module owns
 * Java's *decisions* - which category, how many, in what order - and the caller owns the draws.
 * That is the same split `items/wealthDrops.ts` uses.
 */
import type { GenItem } from './generator';

/** One plain draw Java takes off the level stream. */
export interface ShopStockRng {
	/** `Random.Int(n)`. */
	int(n: number): number;
	/** `Random.IntRange(min, max)`, inclusive. */
	intRange(min: number, max: number): number;
	/** `Random.Long()` - Java seeds the stock-shuffle substream with one. */
	long(): number;
	/** `Random.pushGenerator`/`Random.popGenerator`: the substream the shuffle runs in. */
	pushGenerator(seed: number): void;
	popGenerator(): void;
}

/** What the caller must supply: the category decks, the generator entry points, and the draws. */
export interface ShopStockSources {
	readonly rng: ShopStockRng;
	/** `Generator.wepTiers[tier]` - Java's own array, so tier 1 is its *second* entry. */
	weaponTier(tier: number): unknown;
	/** `Generator.misTiers[tier]`. */
	missileTier(tier: number): unknown;
	readonly potion: unknown;
	readonly scroll: unknown;
	readonly wand: unknown;
	readonly ring: unknown;
	/** `Generator.random(cat)`. */
	randomCategory(cat: unknown): GenItem;
	/** `Generator.randomUsingDefaults(cat)`. */
	randomUsingDefaults(cat: unknown): GenItem;
	/** `Generator.random(Category.ARTIFACT)`, which is `null` once the deck is exhausted. */
	randomArtifact(): GenItem | null;
}

/** One thing on the shelf, before the caller turns it into a bag payload. */
export type ShopStockPlan =
	/** A `Generator.random*` product, materialised through the port's generated-item path. */
	| { kind: 'generated'; generated: GenItem; identify: boolean }
	/** A fixed item by runtime id. */
	| { kind: 'item'; id: string; quantity: number; identify: boolean; tier?: number; level?: number }
	/** A `TimekeepersHourglass.sandBag` - the caller owns the hourglass it belongs to. */
	| { kind: 'sandBag' };

/** Java's four shopkeeper depths and the `Armor` tier each stocks (Leather 2 .. Plate 5). */
const ARMOR_TIER: Readonly<Record<number, number>> = { 6: 2, 11: 3, 16: 4, 20: 5, 21: 5 };

/** Java's `switch (Dungeon.depth)` falls through to its depth-6 case, so an unexpected depth
 *  stocks tier 2 rather than nothing. */
function armorTierFor(depth: number): number {
	return ARMOR_TIER[depth] ?? 2;
}

/** Java's `wepTiers`/`misTiers` index for a shop depth: 1 at depth 6 through 4 at the deepest. */
function weaponTierFor(depth: number): number {
	return Math.min(4, Math.max(1, armorTierFor(depth) - 1));
}

/**
 * The sandbag count Java adds for a carried, identified, uncursed hourglass: a per-depth fraction
 * of the bags it is still missing, so a late hourglass can still be filled. Java also *increments*
 * `hourglass.sandBags` as it adds each one; the caller does that when it materialises the plan.
 */
export function shopSandBags(depth: number, missing: number): number {
	switch (depth) {
		case 11: return Math.ceil(missing * 0.25);
		case 16: return Math.ceil(missing * 0.50);
		case 20:
		case 21: return Math.ceil(missing * 0.80);
		default: return Math.ceil(missing * 0.20);
	}
}

/**
 * `ShopRoom.generateItems()`, in Java's own order and with Java's own draws.
 *
 * `hourglassMissingBags` is the carried hourglass's remaining bag slots, or `null` when there is no
 * identified uncursed one to stock for - Java's own `hourglass != null && hourglass.isIdentified()
 * && !hourglass.cursed` gate.
 *
 * **Four of Java's entries have no item to name here and are absent rather than substituted**: the
 * three `Torch`es on the two deepest shops (this port has no torch item), the `TippedDart` stack
 * (no dart class and no tip system - the port's missiles are the thrown-weapon classes only), the
 * `Ankh` (a resurrection consumable tied to the death path), and the `ChooseBag` pick (no bag
 * system exists at all). Each is recorded in `PORT_COVERAGE.md` rather than filled with something
 * that is not what the shelf sells.
 */
export function planShopStock(
	depth: number,
	hourglassMissingBags: number | null,
	sources: ShopStockSources,
): ShopStockPlan[] {
	const { rng } = sources;
	const plans: ShopStockPlan[] = [];
	const tier = weaponTierFor(depth);

	//`w.enchant(null); w.cursed = false; w.level(0); w.identify(false);` - the weapon and missile are
	//stock, not loot: unenchanted, uncursed and unlevelled. `identify(false)` is Java's
	//`Item.identify(byHero)`, which sets `levelKnown`/`cursedKnown`/`identified` either way and only
	//skips the Catalog/statistics bookkeeping when `byHero` is false - so a shop item is fully
	//identified, which is why its real name and price are on the label, and every plan below is
	//`identify: true` for exactly that reason.
	const weapon = sources.randomCategory(sources.weaponTier(tier));
	plans.push({ kind: 'generated', generated: { ...weapon, cursed: false, level: 0 }, identify: true });
	const missile = sources.randomCategory(sources.missileTier(tier));
	plans.push({ kind: 'generated', generated: { ...missile, cursed: false, level: 0 }, identify: true });

	//`new LeatherArmor().identify(false)` and its three siblings: one concrete armor of the depth's
	//own tier.
	plans.push({ kind: 'item', id: 'armorReward', quantity: 1, identify: true, tier: armorTierFor(depth) });

	plans.push({ kind: 'item', id: 'alchemize', quantity: rng.intRange(2, 3), identify: true });

	plans.push({ kind: 'item', id: 'potionHealing', quantity: 1, identify: true });
	plans.push({ kind: 'generated', generated: sources.randomUsingDefaults(sources.potion), identify: true });
	plans.push({ kind: 'generated', generated: sources.randomUsingDefaults(sources.potion), identify: true });

	plans.push({ kind: 'item', id: 'scrollIdentify', quantity: 1, identify: true });
	plans.push({ kind: 'item', id: 'scrollCleanse', quantity: 1, identify: true });
	plans.push({ kind: 'item', id: 'scrollMapping', quantity: 1, identify: true });

	for (let i = 0; i < 2; i++) {
		plans.push({ kind: 'generated', generated: sources.randomUsingDefaults(rng.int(2) === 0 ? sources.potion : sources.scroll), identify: true });
	}

	//`new SmallRation()` x2: this port's one generic `food` kind is the Ration stand-in its own
	//`Food` rows document, with one unit per SmallRation.
	plans.push({ kind: 'item', id: 'food', quantity: 2, identify: true });

	switch (rng.int(4)) {
		case 0: plans.push({ kind: 'item', id: 'bomb', quantity: 1, identify: true }); break;
		case 1:
		case 2: plans.push({ kind: 'item', id: 'doubleBomb', quantity: 1, identify: true }); break;
		default: plans.push({ kind: 'item', id: 'honeypot', quantity: 1, identify: true }); break;
	}

	plans.push({ kind: 'item', id: 'stoneOfAugmentation', quantity: 1, identify: true });

	if (hourglassMissingBags !== null && hourglassMissingBags > 0) {
		for (let i = 0; i < shopSandBags(depth, hourglassMissingBags); i++) plans.push({ kind: 'sandBag' });
	}

	//The rare slot: `Random.Int(10)` - one wand, one ring, one artifact, seven styluses.
	const rareRoll = rng.int(10);
	if (rareRoll === 0) {
		plans.push({ kind: 'generated', generated: { ...sources.randomCategory(sources.wand), level: 0, cursed: false }, identify: true });
	} else if (rareRoll === 1) {
		plans.push({ kind: 'generated', generated: { ...sources.randomCategory(sources.ring), level: 0, cursed: false }, identify: true });
	} else if (rareRoll === 2) {
		//`Generator.random(ARTIFACT)` falls back to a RING once the deck is exhausted - modelled
		//through `null` rather than assumed away, the same way `wealthDrops`' own caller does.
		const artifact = sources.randomArtifact();
		plans.push({ kind: 'generated', generated: artifact
			? { ...artifact, cursed: false }
			: { ...sources.randomCategory(sources.ring), level: 0, cursed: false }, identify: true });
	} else {
		plans.push({ kind: 'item', id: 'stylus', quantity: 1, identify: true });
	}

	//`Random.pushGenerator(Random.Long()); Random.shuffle(itemsToSpawn); Random.popGenerator();` -
	//the shuffle runs in its own substream specifically so the shop's stock cannot shift levelgen,
	//which is also why Java pushes a *new* generator rather than shuffling in place.
	const seed = rng.long();
	rng.pushGenerator(seed);
	try {
		for (let i = plans.length - 1; i > 0; i--) {
			const j = rng.int(i + 1);
			const swap = plans[i]!;
			plans[i] = plans[j]!;
			plans[j] = swap;
		}
	} finally {
		rng.popGenerator();
	}

	return plans;
}
