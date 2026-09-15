/**
 * Port of `ShopRoom.generateItems()`/`ChooseBag()` (`levels/rooms/special/ShopRoom.java`), **for
 * level-stream RNG fidelity and room sizing only** - same contract as `generator.ts`, which this
 * builds on. No real items exist; the returned kind strings are labels.
 *
 * ## Why this can be exact despite reading `Dungeon.hero.belongings`
 *
 * `generateItems()` was the sole reason depths 6/11/16 refused to generate: it touches hero state
 * this port has none of. Reading it closely, that dependency turns out to be almost entirely
 * inert as far as level generation is concerned:
 *
 * - **`ChooseBag(pack)` makes ZERO `Random.*` calls.** It builds a `HashMap` of the
 *   not-yet-dropped bag classes, counts how many backpack items each could hold, and returns the
 *   highest scorer. Pure logic. So the backpack's *contents* can only change **which** bag class
 *   is returned - never whether one is, and never a draw. Every bag is just "one more item" to
 *   `placeItems`, so picking a different one is invisible to the level.
 * - Which means the only thing level generation actually needs from `ChooseBag` is the **count**:
 *   +1 item when any bag remains, +0 when none do. And that is fully determinate without a hero,
 *   because a grep of the whole codebase shows the four `LimitedDrops` bag flags are dropped in
 *   exactly two places: `HeroClass.initHero()` (velvet pouch, unconditionally, for every class)
 *   and `ChooseBag()` itself. So: a run starts with the velvet pouch gone and three holders left,
 *   and each shop consumes exactly one. Shops at depths 6, 11 and 16 therefore each add a bag,
 *   and a hypothetical fourth would add none. That is `bagsRemaining`, below - no inventory model
 *   required.
 * - Hero creation cannot shift the level stream regardless: `Dungeon.init()` closes its seeded
 *   run-init block with `Random.resetGenerators()` (Dungeon.java:240) and only *then* builds the
 *   hero and calls `initHero()` (267-272), so those draws land on the base generator, and every
 *   floor re-seeds from `Dungeon.seedCurDepth()` anyway.
 *
 * ## The one real assumption, stated plainly
 *
 * `generateItems()` also reads `belongings.getItem(TimekeepersHourglass.class)` and, if the hero
 * holds one that is **identified and uncursed**, adds `ceil((5 - sandBags) * 0.20f)` sand bags at
 * depth 6 (0.25/0.50/0.80 at 11/16/20-21). Extra items can push `itemCount()` past a `sqrt`
 * boundary and so raise the shop's `minWidth()`, which changes the room's size and therefore
 * everything placed after it.
 *
 * The live bridge supplies the hero's identified/uncursed hourglass state before generation.
 * The generator advances the copied sand count as Java does, while the inventory owns the
 * persistent item state. A direct headless harness that supplies no hourglass still follows the
 * common no-hourglass path.
 */
import { SpdRandom } from '../spdRng';
import { Cat, randomCategory, randomUsingDefaults } from './generator';

/**
 * `Dungeon.LimitedDrops`' four bag flags, reduced to the only fact level generation can observe:
 * how many are still undropped. Starts at 3 because `HeroClass.initHero()` always drops the
 * velvet pouch. Run-level state, so `resetShopRunState()` belongs with the other
 * `initForRun`-style resets.
 */
let bagsRemaining = 3;
export interface HourglassShopState {
	identified: boolean;
	cursed: boolean;
	sandBags: number;
}
let hourglassState: HourglassShopState | null = null;

/** Mirrors `Dungeon.LimitedDrops.reset()` + `initHero()`'s velvet-pouch drop. */
export function resetShopRunState(): void {
	bagsRemaining = 3;
	hourglassState = null;
}

/** Supplies the hero-owned hourglass state before a floor is generated. */
export function setHourglassShopState(state: HourglassShopState | null): void {
	hourglassState = state ? { ...state } : null;
}

/**
 * Sand bags contributed by an identified, uncursed `TimekeepersHourglass`, using the real
 * depth-specific fraction of the remaining five bags.
 */
function hourglassSandBags(depth: number): number {
	if (!hourglassState || !hourglassState.identified || hourglassState.cursed) return 0;
	const remaining = Math.max(0, 5 - hourglassState.sandBags);
	const fraction = depth === 6 ? 0.20 : depth === 11 ? 0.25 : depth === 16 ? 0.50
		: depth === 20 || depth === 21 ? 0.80 : 0;
	const bags = Math.min(remaining, Math.ceil(remaining * fraction));
	hourglassState.sandBags += bags;
	return bags;
}

/** Per-depth `switch` in `generateItems()`: weapon tier, missile tier, body armor, extra torches. */
interface ShopDepthKit {
	wepTier: Cat;
	misTier: Cat;
	armor: string;
	torches: number;
}

/**
 * `Generator.wepTiers`/`misTiers` are indexed 0-4 for tiers 1-5, and the switch uses index
 * `[1]`/`[2]`/`[3]`/`[4]` - i.e. tier 2 at depth 6, not tier 1.
 */
function depthKit(depth: number): ShopDepthKit {
	switch (depth) {
		case 11: return { wepTier: Cat.WEP_T3, misTier: Cat.MIS_T3, armor: 'MailArmor', torches: 0 };
		case 16: return { wepTier: Cat.WEP_T4, misTier: Cat.MIS_T4, armor: 'ScaleArmor', torches: 0 };
		case 20:
		case 21: return { wepTier: Cat.WEP_T5, misTier: Cat.MIS_T5, armor: 'PlateArmor', torches: 3 };
		// `case 6: default:` - one arm in Java, so every other depth takes the tier-2 kit too.
		default: return { wepTier: Cat.WEP_T2, misTier: Cat.MIS_T2, armor: 'LeatherArmor', torches: 0 };
	}
}

/**
 * `ShopRoom.generateItems()`, draw for draw. Returns the stock as labels; only `.length` is
 * load-bearing (it drives `minWidth()`/`minHeight()` and how many cells `placeItems` fills).
 *
 * Called lazily from `Room.minWidth()` exactly once per `ShopRoom` instance, mirroring Java's
 * `if (itemsToSpawn == null)` cache - which matters for ordering: the instance is created in
 * `initRooms()` but `minWidth()` is not reached until the builder tries to place the shop, and
 * `RegularLevel.build()`'s retry loop reuses the same instance, so these draws happen once, part
 * way through the first placement attempt, and never again.
 */
export function generateShopItems(depth: number): string[] {
	const items: string[] = [];
	const kit = depthKit(depth);

	// The weapon is rolled FIRST but appended after the switch; the missile and armor go in here.
	// `w.enchant(null)`/`cursed = false`/`level(0)`/`identify(false)` are all draw-free
	// (`Weapon.enchant(Enchantment)` just assigns the field - Weapon.java:316).
	const w = randomCategory(kit.wepTier);
	const mis = randomCategory(kit.misTier);
	items.push(mis.cls);
	items.push(kit.armor);
	for (let i = 0; i < kit.torches; i++) items.push('Torch');
	items.push(w.cls);

	/**
	 * `TippedDart.randomTipped(2)`:
	 *     do { s = randomUsingDefaults(SEED); } while (!types.containsKey(s.getClass()));
	 * The loop **always exits on its first pass**, so this is exactly one draw batch, not a
	 * variable retry: `TippedDart.types` has an entry for all 12 `Plant.Seed` classes
	 * (TippedDart.java:198-209), and the only seed that could miss - none do - is moot anyway
	 * since `SEED.defaultProbs[0] = 0` makes Rotberry unreachable. Verified by comparing both
	 * lists class for class.
	 */
	items.push(`TippedDart:${randomUsingDefaults(Cat.SEED).cls}`);

	items.push(`Alchemize:${SpdRandom.intRange(2, 3)}`);

	// `ChooseBag(Dungeon.hero.belongings)` - no draws; see this module's header. Which bag it is
	// depends on backpack contents and `HashMap` iteration order, so the label is deliberately
	// generic: only the +1 is real.
	if (bagsRemaining > 0) {
		bagsRemaining--;
		items.push('Bag');
	}

	items.push('PotionOfHealing');
	items.push(randomUsingDefaults(Cat.POTION).cls);
	items.push(randomUsingDefaults(Cat.POTION).cls);

	items.push('ScrollOfIdentify');
	items.push('ScrollOfRemoveCurse');
	items.push('ScrollOfMagicMapping');

	for (let i = 0; i < 2; i++) {
		items.push(SpdRandom.int(2) === 0
			? randomUsingDefaults(Cat.POTION).cls
			: randomUsingDefaults(Cat.SCROLL).cls);
	}

	items.push('SmallRation');
	items.push('SmallRation');

	// Exactly one item either way, but the draw is real and its value picks the label.
	switch (SpdRandom.int(4)) {
		case 0: items.push('Bomb'); break;
		case 1:
		case 2: items.push('DoubleBomb'); break;
		default: items.push('Honeypot'); break;
	}

	items.push('Ankh');
	items.push('StoneOfAugmentation');

	for (let i = 0; i < hourglassSandBags(depth); i++) items.push('SandBag');

	// `rare.level(0)`/`cursed = false`/`cursedKnown = true` are draw-free.
	switch (SpdRandom.int(10)) {
		case 0: items.push(randomCategory(Cat.WAND).cls); break;
		case 1: items.push(randomCategory(Cat.RING).cls); break;
		case 2: items.push(randomCategory(Cat.ARTIFACT).cls); break;
		default: items.push('Stylus'); break;
	}

	if (items.length > 63) {
		// Java throws the same way ("Shop attempted to carry more than 63 items!"); a shop cannot
		// exceed 8x8 internally.
		throw new Error(`generateShopItems: ${items.length} items exceeds the 63-item shop limit`);
	}

	/**
	 * Java's final block:
	 *     Random.pushGenerator(Random.Long());
	 *         Random.shuffle(itemsToSpawn);
	 *     Random.popGenerator();
	 * The `Random.Long()` argument is evaluated on the LEVEL stream - one draw, and the only part
	 * of this that layout depends on. The shuffle itself runs on the pushed substream, so it is
	 * invisible to the level, exactly like `createItems()`'s bones/lore substream. It is
	 * reproduced anyway to keep the stock order as faithful as the labels allow; note the order
	 * cannot affect `placeItems`' draw count either way, because that only ever tests whether a
	 * cell is already occupied, never what occupies it.
	 */
	SpdRandom.pushGenerator(SpdRandom.long());
	SpdRandom.shuffle(items);
	SpdRandom.popGenerator();

	return items;
}
