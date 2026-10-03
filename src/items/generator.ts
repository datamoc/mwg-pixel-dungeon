/**
 * Port of `items/Generator.java`, **for RNG-stream fidelity only**.
 *
 * ## What this is, and what it very deliberately is not
 *
 * This is not the complete item system, but its generated class/level/curse payloads are now
 * consumed by live room drops as well as by the generator verification path. Its first duty is
 * still to consume **exactly** the `Random.*` draws that real Java's `Generator` consumes *on
 * the level-generation stream*, so room painting stays byte-synchronised with Java. Prior
 * passes skipped these draws entirely (with comments claiming they were "Generator-internal,
 * ZERO Random calls"), which was wrong and was the single largest source of level-gen divergence.
 *
 * ## Which draws land on the level stream, and which do not
 *
 * The distinction is the whole reason this file can be small:
 *
 * - `random(Category)`'s **class pick** for a deck category (`defaultProbs != null && seed !=
 *   null`) runs inside `Random.pushGenerator(cat.seed)`, i.e. on a *substream*. Those draws are
 *   invisible to the level stream. We reproduce them anyway (we have the real `cat.seed`, since
 *   `fullReset()` draws it on the run-init generator) so the chosen classes are genuinely
 *   faithful, but nothing about level layout depends on them.
 * - The `.random()` call on the **produced item** runs *after* `popGenerator()`, so it is on the
 *   level stream. This is where most of the draw volume lives (weapon/armor level + curse +
 *   enchantment rolls).
 * - `randomUsingDefaults(Category)` does **not** push a substream - its `chances(defaultProbs)`
 *   is on the level stream.
 * - `randomWeapon`/`randomArmor`/`randomMissile`'s tier roll
 *   (`chances(floorSetTierProbs[floorSet])`) is on the level stream.
 * - `random()` (no-arg)'s category roll (`chances(categoryProbs)`) is on the level stream, and
 *   it *mutates* `categoryProbs`, so that deck is run-level state carried across floors in
 *   generation order - exactly like `SpecialRoom`/`SecretRoom`'s run queues.
 *
 * ## The key simplification, and why it is sound rather than a shortcut
 *
 * The **number and kind** of level-stream draws made by an item's `.random()` depends only on
 * its `Category.superClass`, never on the concrete class: every class in `POTION` is a `Potion`
 * (`Item.random()`, zero draws), every class in `WEP_T3` is a `MeleeWeapon` (`Weapon.random()`),
 * and so on. So we need the *category*, which the level stream tells us, but not the concrete
 * class. Verified by reading each `random()` override: `Item`, `Weapon`, `Armor`, `Ring`,
 * `Wand`, `Artifact`, `Gold` are the only ones that exist.
 */
import { SpdRandom } from '../spdRng';
import { MWL_TABLE_ROWS, MWL_TRAIT_NODES } from '../mwlContent';

/** `Generator.Category`'s declaration order - load-bearing, since `categoryProbs` is a
 *  `LinkedHashMap` populated by iterating `Category.values()`, so `Random.chances()` sees the
 *  weights in exactly this order. */
export const enum Cat {
	TRINKET,
	WEAPON, WEP_T1, WEP_T2, WEP_T3, WEP_T4, WEP_T5,
	ARMOR,
	MISSILE, MIS_T1, MIS_T2, MIS_T3, MIS_T4, MIS_T5,
	WAND, RING, ARTIFACT,
	FOOD,
	POTION, SEED,
	SCROLL, STONE,
	GOLD,
}

/** The `.random()` implementation an item of this category inherits - the only thing that
 *  determines its level-stream draw pattern. */
type SuperKind = 'item' | 'weapon' | 'missile' | 'armor' | 'ring' | 'wand' | 'artifact' | 'gold';

interface CatDef {
	name: string;
	firstProb: number;
	secondProb: number;
	superKind: SuperKind;
	/** `null` where Java leaves `defaultProbs` unassigned (WEAPON/ARMOR/MISSILE/GOLD) - which is
	 *  what decides whether a substream is pushed at all. */
	defaultProbs: number[] | null;
	/** Java's `probs`, which for non-deck categories is set directly in the static initializer. */
	initialProbs: number[];
	/** Java's `defaultProbs2` (the potion/scroll second deck variant); absent everywhere else. */
	secondProbs?: number[] | null;
	/** Concrete class names, for faithful (if cosmetic) reporting of what got picked. */
	classes: string[];
}

function mwlDeck(id: string): { classes: string[]; probabilities: number[]; secondProbs: number[] | null } {
	const deck = MWL_TRAIT_NODES.find((node) => node.attributes.id === id)
		?? (() => { throw new Error(`MWL generator deck is missing ${id}`); })();
	const value = (key: string): string => {
		const effect = deck.children.find((child) => child.tag === 'effect' && child.attributes.apply_to === key);
		if (effect?.attributes.set === undefined) throw new Error(`MWL generator deck ${id} is missing ${key}`);
		return effect.attributes.set;
	};
	const classes = value('classes').split(',').map((entry) => entry.trim()).filter(Boolean);
	const probabilities = value('default_probs').split(',').map(Number);
	if (classes.length !== probabilities.length || probabilities.some((entry) => !Number.isFinite(entry))) {
		throw new Error(`MWL generator deck ${id} has invalid class/probability data`);
	}
	const second = deck.children.find((child) => child.tag === 'effect' && child.attributes.apply_to === 'second_probs');
	let secondProbs: number[] | null = null;
	if (second?.attributes.set !== undefined) {
		secondProbs = second.attributes.set.split(',').map((entry) => entry.trim()).filter(Boolean).map(Number);
		if (secondProbs.length !== classes.length || secondProbs.some((entry) => !Number.isFinite(entry))) {
			throw new Error(`MWL generator deck ${id} has invalid second-probability data`);
		}
	}
	return { classes, probabilities, secondProbs };
}

const TRINKET_DECK = mwlDeck('trinketDeck');
const POTION_DECK = mwlDeck('potionDeck');
const SCROLL_DECK = mwlDeck('scrollDeck');
const RUNESTONE_DECK = mwlDeck('runestoneDeck');
const MISSILE_DECKS = [1, 2, 3, 4, 5].map((tier) => mwlDeck(`missileDeckT${tier}`));
const WEAPON_DECKS = [1, 2, 3, 4, 5].map((tier) => mwlDeck(`weaponDeckT${tier}`));
const WAND_DECK = mwlDeck('wandGeneratorDeck');
const RING_DECK = mwlDeck('ringGeneratorDeck');
const ARTIFACT_DECK = mwlDeck('artifactGeneratorDeck');
const FOOD_DECK = mwlDeck('foodGeneratorDeck');
const SEED_DECK = mwlDeck('seedDeck');
const ARMOR_DECK = mwlDeck('armorGeneratorDeck');

function mwlMatrix(id: string): number[][] {
	return MWL_TABLE_ROWS(id).map((row) => (Array.isArray(row.chances) ? row.chances.map(Number) : []));
}

function mwlList(id: string, key: string): string[] {
	const node = MWL_TRAIT_NODES.find((candidate) => candidate.attributes.id === id)
		?? (() => { throw new Error(`MWL generator rule is missing ${id}`); })();
	const effect = node.children.find((child) => child.tag === 'effect' && child.attributes.apply_to === key);
	const value = effect?.attributes.set;
	if (value === undefined) throw new Error(`MWL generator rule ${id} is missing ${key}`);
	return value.split(',').map((entry) => entry.trim()).filter(Boolean);
}

function mwlNumbers(id: string, key: string): number[] {
	const values = mwlList(id, key).map(Number);
	if (values.some((value) => !Number.isFinite(value))) throw new Error(`MWL generator rule ${id} has invalid ${key}`);
	return values;
}

const FLOOR_SET_TIER_PROBS = mwlMatrix('floorSetTierProbs');

/** Exactly `Generator.java`'s static initializer. Weights and class order both matter: the
 *  weights drive `Random.chances`, and the order decides which class an index maps to. */
const CATS: CatDef[] = [
	{
		name: 'TRINKET', firstProb: 0, secondProb: 0, superKind: 'item',
		defaultProbs: TRINKET_DECK.probabilities,
		initialProbs: [...TRINKET_DECK.probabilities],
		classes: TRINKET_DECK.classes,
	},
	{ name: 'WEAPON', firstProb: 2, secondProb: 2, superKind: 'weapon', defaultProbs: null, initialProbs: [], classes: [] },
	{
		name: 'WEP_T1', firstProb: 0, secondProb: 0, superKind: 'weapon',
		defaultProbs: WEAPON_DECKS[0]!.probabilities, initialProbs: [...WEAPON_DECKS[0]!.probabilities],
		classes: WEAPON_DECKS[0]!.classes,
	},
	{
		name: 'WEP_T2', firstProb: 0, secondProb: 0, superKind: 'weapon',
		defaultProbs: WEAPON_DECKS[1]!.probabilities, initialProbs: [...WEAPON_DECKS[1]!.probabilities],
		classes: WEAPON_DECKS[1]!.classes,
	},
	{
		// `Generator.java`'s static init had a real copy-paste bug here - `WEP_T3.probs =
		// WEP_T1.defaultProbs.clone()` - copying tier 1's `{2,0,2,2,2,2}` onto tier 3 instead of
		// tier 3's own `{2,2,2,2,2,2}`. That zeroed `Mace`'s weight (tier-1 index 1,
		// `MagesStaff`, is a real 0). An older Java snapshot had only five tier-1 weights, which
		// also made the final `Whip` entry unreachable. This port intentionally corrects the Java
		// source's still-present typo locally:
		// `initialProbs` starts equal to `defaultProbs`, rather than copying tier 1. `chances()`
		// always burns exactly one `Random.Float` regardless of array length/values, so this fix
		// does not change the level-generation RNG call count or order - only which weapon class
		// index a given draw resolves to.
		name: 'WEP_T3', firstProb: 0, secondProb: 0, superKind: 'weapon',
		defaultProbs: WEAPON_DECKS[2]!.probabilities, initialProbs: [...WEAPON_DECKS[2]!.probabilities],
		classes: WEAPON_DECKS[2]!.classes,
	},
	{
		name: 'WEP_T4', firstProb: 0, secondProb: 0, superKind: 'weapon',
		defaultProbs: WEAPON_DECKS[3]!.probabilities, initialProbs: [...WEAPON_DECKS[3]!.probabilities],
		classes: WEAPON_DECKS[3]!.classes,
	},
	{
		name: 'WEP_T5', firstProb: 0, secondProb: 0, superKind: 'weapon',
		defaultProbs: WEAPON_DECKS[4]!.probabilities, initialProbs: [...WEAPON_DECKS[4]!.probabilities],
		classes: WEAPON_DECKS[4]!.classes,
	},
	{
		// No `defaultProbs`: `randomArmor()` handles tier selection itself, so `random(ARMOR)`
		// never reaches the deck branch.
		name: 'ARMOR', firstProb: 2, secondProb: 1, superKind: 'armor',
		defaultProbs: null, initialProbs: ARMOR_DECK.probabilities,
		classes: ARMOR_DECK.classes,
	},
	{ name: 'MISSILE', firstProb: 1, secondProb: 2, superKind: 'missile', defaultProbs: null, initialProbs: [], classes: [] },
	{
		name: 'MIS_T1', firstProb: 0, secondProb: 0, superKind: 'missile',
		defaultProbs: MISSILE_DECKS[0]!.probabilities, initialProbs: [...MISSILE_DECKS[0]!.probabilities],
		classes: MISSILE_DECKS[0]!.classes,
	},
	{
		name: 'MIS_T2', firstProb: 0, secondProb: 0, superKind: 'missile',
		defaultProbs: MISSILE_DECKS[1]!.probabilities, initialProbs: [...MISSILE_DECKS[1]!.probabilities],
		classes: MISSILE_DECKS[1]!.classes,
	},
	{
		name: 'MIS_T3', firstProb: 0, secondProb: 0, superKind: 'missile',
		defaultProbs: MISSILE_DECKS[2]!.probabilities, initialProbs: [...MISSILE_DECKS[2]!.probabilities],
		classes: MISSILE_DECKS[2]!.classes,
	},
	{
		name: 'MIS_T4', firstProb: 0, secondProb: 0, superKind: 'missile',
		defaultProbs: MISSILE_DECKS[3]!.probabilities, initialProbs: [...MISSILE_DECKS[3]!.probabilities],
		classes: MISSILE_DECKS[3]!.classes,
	},
	{
		name: 'MIS_T5', firstProb: 0, secondProb: 0, superKind: 'missile',
		defaultProbs: MISSILE_DECKS[4]!.probabilities, initialProbs: [...MISSILE_DECKS[4]!.probabilities],
		classes: MISSILE_DECKS[4]!.classes,
	},
	{
		name: 'WAND', firstProb: 1, secondProb: 1, superKind: 'wand',
		defaultProbs: WAND_DECK.probabilities, initialProbs: [...WAND_DECK.probabilities],
		classes: WAND_DECK.classes,
	},
	{
		name: 'RING', firstProb: 1, secondProb: 0, superKind: 'ring',
		defaultProbs: RING_DECK.probabilities, initialProbs: [...RING_DECK.probabilities],
		classes: RING_DECK.classes,
	},
	{
		// Artifacts never reset their deck (uniqueness across a run), hence the exhaustion path
		// in `randomArtifact()`.
		name: 'ARTIFACT', firstProb: 0, secondProb: 1, superKind: 'artifact',
		defaultProbs: ARTIFACT_DECK.probabilities, initialProbs: [...ARTIFACT_DECK.probabilities],
		classes: ARTIFACT_DECK.classes,
	},
	{
		name: 'FOOD', firstProb: 0, secondProb: 0, superKind: 'item',
		defaultProbs: FOOD_DECK.probabilities, initialProbs: [...FOOD_DECK.probabilities],
		classes: FOOD_DECK.classes,
	},
	{
		name: 'POTION', firstProb: 8, secondProb: 8, superKind: 'item',
		defaultProbs: POTION_DECK.probabilities,
		initialProbs: [...POTION_DECK.probabilities],
		secondProbs: POTION_DECK.secondProbs,
		classes: POTION_DECK.classes,
	},
	{
		name: 'SEED', firstProb: 1, secondProb: 1, superKind: 'item',
		defaultProbs: SEED_DECK.probabilities, initialProbs: [...SEED_DECK.probabilities],
		classes: SEED_DECK.classes,
	},
	{
		name: 'SCROLL', firstProb: 8, secondProb: 8, superKind: 'item',
		defaultProbs: SCROLL_DECK.probabilities,
		initialProbs: [...SCROLL_DECK.probabilities],
		secondProbs: SCROLL_DECK.secondProbs,
		classes: SCROLL_DECK.classes,
	},
	{
		name: 'STONE', firstProb: 1, secondProb: 1, superKind: 'item',
		defaultProbs: RUNESTONE_DECK.probabilities,
		initialProbs: [...RUNESTONE_DECK.probabilities],
		// Generator.java (4.0.0-beta) uses StoneOfDetectMagic here; StoneOfDisarming is not
		// an SPD runestone and would silently make the implemented detect-magic item unreachable
		// through ordinary floor generation.
		classes: RUNESTONE_DECK.classes,
	},
	{
		// `defaultProbs == null`, so `random(GOLD)`'s `chances(probs)` runs on the LEVEL stream
		// (one float for a single-entry array) rather than a substream.
		name: 'GOLD', firstProb: 10, secondProb: 10, superKind: 'gold',
		defaultProbs: null, initialProbs: [1], classes: ['Gold'],
	},
];

/** `Generator.floorSetTierProbs` - indexed by `floorSet`, i.e. `Dungeon.depth / 5` (plus 1 in
 *  the rooms that ask for a better-than-usual prize). */
const WEP_TIERS = [Cat.WEP_T1, Cat.WEP_T2, Cat.WEP_T3, Cat.WEP_T4, Cat.WEP_T5];
const MIS_TIERS = [Cat.MIS_T1, Cat.MIS_T2, Cat.MIS_T3, Cat.MIS_T4, Cat.MIS_T5];

/** `Weapon.Enchantment`/`Armor.Glyph` share identical shapes: 4 common, 6 uncommon, 3 rare,
 *  8 curses, and the same `{50,40,10}` rarity split. Only the array *lengths* matter here, since
 *  the draw is `Random.element(list)` = `Random.Int(list.length)`. */
const ENCH_TYPE_CHANCES = mwlNumbers('affixPools', 'type_chances');
const ENCH_POOL_SIZES = mwlNumbers('affixPools', 'pool_sizes');
const CURSE_POOL_SIZE = mwlNumbers('affixPools', 'curse_pool_size')[0] ?? 0;

/** What a generated item was, for callers that need to report or branch on it. `cursed` is the
 *  load-bearing field: several rooms re-roll `while (prize.cursed)`, so the retry count - and
 *  therefore the level stream - depends on it. */
export interface GenItem {
	cat: Cat;
	/** Concrete class name where known, else the category name. Cosmetic. */
	cls: string;
	cursed: boolean;
	level: number;
	/** Gold only. */
	quantity: number;
	/**
	 * `Weapon.hasGoodEnchant()`/`Armor.hasGoodGlyph()` - true when `.random()` took its
	 * enchantment branch. `CryptRoom`/`SacrificeRoom` only roll a curse
	 * (`Enchantment.randomCurse()`, one more draw) when this is false, so it is stream-relevant,
	 * not decorative.
	 */
	hasGoodEnchant: boolean;
}

/** Reduce a generated Java item to a playable ground-item family without changing its RNG.
 * The concrete class is carried after `|` so room painters can preserve it through the
 * PaintLevel bridge without changing the compact family used for collision/render routing. */
export function generatedGroundKind(item: GenItem): string {
	let family: string;
	if (item.cat <= Cat.WEP_T5) family = 'weapon';
	else if (item.cat === Cat.ARMOR) family = 'armor';
	else if (item.cat >= Cat.MISSILE && item.cat <= Cat.MIS_T5) family = 'stone';
	else if (item.cat === Cat.WAND) family = 'wand';
	else if (item.cat === Cat.RING || item.cat === Cat.ARTIFACT) family = 'ring';
	else if (item.cat === Cat.FOOD || item.cat === Cat.SEED) family = 'food';
	else if (item.cat === Cat.POTION) family = 'potion';
	else if (item.cat === Cat.SCROLL) family = 'scroll';
	else if (item.cat === Cat.GOLD) family = 'gold';
	else family = 'stone';
	return `${family}|${item.cls}`;
}

/**
 * Port of `Generator.Category.order(Item)` (`Generator.java`, tag `4.0.0-beta`) for the
 * inventory-facing item payloads. Java checks the concrete class against every category and
 * keeps the latest matching category; the special sub-orderings are then applied to
 * `MissileWeapon`, `Potion`, and `Scroll` families. `fallbackFrame` is the equivalent of Java's
 * `Short.MAX_VALUE + item.image()` for an item class this compact port does not know.
 */
export function generatorItemOrder(sourceClass?: string, id?: string, fallbackFrame = 0): number {
	const raw = sourceClass ?? id ?? '';
	const cls = raw.split('.').pop()!.toLowerCase();
	let category = -1;
	for (let i = 0; i < CATS.length; i++) {
		if (CATS[i]!.classes.some(name => name.toLowerCase() === cls)) category = i;
	}

	// The live bag also contains compact ids for starting items and quest objects whose Java
	// concrete classes are not part of the generated category tables.
	if (category < 0) {
		if (cls === 'bomb' || cls === 'doublebomb' || id === 'bomb' || id === 'doubleBomb') category = Cat.MISSILE;
		else if (cls.includes('missile')) category = Cat.MISSILE;
		else if (cls.includes('stone') || id === 'stone' || id?.startsWith('stoneOf')) category = Cat.STONE;
		else if (cls.includes('potion') || id?.startsWith('potion')) category = Cat.POTION;
		else if (id === 'waterskin') category = Cat.POTION;
		else if (cls.includes('scroll') || id?.startsWith('scroll')) category = Cat.SCROLL;
		else if (cls.includes('ring') || id?.startsWith('ring_')) category = Cat.RING;
		else if (cls.includes('wand') || id === 'wand') category = Cat.WAND;
		else if (id === 'cloak' || id === 'hourglass' || id === 'holyTome') category = Cat.ARTIFACT;
		else if (cls.includes('armor') || id === 'armor' || id === 'armorReward' || id === 'clothArmor') category = Cat.ARMOR;
		else if (cls.includes('weapon') || id === 'weaponReward' || id === 'equippedWeapon') category = Cat.WEAPON;
		else if (cls.includes('food') || id === 'food' || id === 'meat') category = Cat.FOOD;
		else if (cls.includes('seed') || id === 'seed') category = Cat.SEED;
		else if (cls.includes('gold') || id === 'gold' || id === 'darkGold') category = Cat.GOLD;
	}

	if (category < 0) return 0x7fff + fallbackFrame;
	let sub = 0;
	if (category === Cat.MISSILE && (cls === 'bomb' || cls === 'doublebomb' || id === 'bomb' || id === 'doubleBomb')) sub = 1;
	else if (category === Cat.POTION) sub = 1; // Potion, after Waterskin and before exotic/brew families.
	else if (category === Cat.SCROLL) sub = 0; // Regular Scroll, before exotic/spell families.
	return category * 100 + sub;
}

// ---------------------------------------------------------------------------------------------
// Run-level state. Mirrors Java's static fields on `Generator`/`Category`, and like them it
// persists across floors of a run and must be reset per run (see `fullReset`).
// ---------------------------------------------------------------------------------------------

let usingFirstDeck = false;
/** Per-category second-deck flag (`Category.using2ndProbs`), potion/scroll only. */
let usingSecondDeck: boolean[] = [];
/** `Generator.categoryProbs`, indexed by `Cat`. Decremented by `random()` on the level stream. */
let categoryProbs: number[] = [];
/** `Generator.defaultCatProbs`, indexed by `Cat`. */
let defaultCatProbs: number[] = [];
/** Per-category live deck (`Category.probs`). */
let probs: number[][] = [];
/** Per-category substream seed (`Category.seed`), drawn in `fullReset()`. */
let catSeeds: (bigint | null)[] = [];
/** Per-category count of items already drawn from its substream (`Category.dropped`), used to
 *  fast-forward the substream so a drop is identical whenever it happens. */
let dropped: number[] = [];

/** `Dungeon.depth`, needed by `randomArmor`/`randomWeapon`'s `floorSet` and `Gold.random()`. */
let currentDepth = 1;
export function setGeneratorDepth(depth: number): void { currentDepth = depth; }

/**
 * The carried trinkets the generator reads, as their own multipliers (`ParchmentScrap.enchantChanceMultiplier()` /
 * `curseChanceMultiplier()`, `ExoticCrystals.consumableExoticChance()`; identity values with none). The generator is a
 * module-level service like `setGeneratorDepth`, so the scene pushes the current values in (`refreshTrinketState`).
 */
export interface GeneratorTrinkets { enchantMultiplier: number; curseMultiplier: number; exoticChance: number }
let generatorTrinkets: GeneratorTrinkets = { enchantMultiplier: 1, curseMultiplier: 1, exoticChance: 0 };
export function setGeneratorTrinkets(next: GeneratorTrinkets): void { generatorTrinkets = next; }

/** `Dungeon.depth / 5`, plus the `+ 1` several rooms add to get a better-than-usual prize.
 *  Exposed so room paint code doesn't need to thread `Dungeon.depth` itself. */
export function floorSetForPrize(offset = 0): number {
	return Math.floor(currentDepth / 5) + offset;
}

/** `Generator.generalReset()`. No RNG. */
function generalReset(): void {
	categoryProbs = CATS.map(c => (usingFirstDeck ? c.firstProb : c.secondProb));
	defaultCatProbs = CATS.map(c => c.firstProb + c.secondProb);
}

/** `Generator.reset(cat)`. No RNG - but a refill toggles the second deck when the
 *  category has one (`using2ndProbs = !using2ndProbs`), including inside `fullReset()`, which
 *  sets the flag from its own Int(2) immediately before calling reset, so the just-rolled
 *  sense is inverted there by design. */
function resetCat(cat: Cat): void {
	const def = CATS[cat];
	if (def.defaultProbs === null) return;
	if (def.secondProbs != null) {
		usingSecondDeck[cat] = !usingSecondDeck[cat];
		probs[cat] = (usingSecondDeck[cat] ? def.secondProbs : def.defaultProbs).slice();
	} else {
		probs[cat] = def.defaultProbs.slice();
	}
}

/**
 * `Generator.fullReset()`, called from `Dungeon.init()` on the run-init generator (seed+1), i.e.
 * AFTER `Scroll.initLabels()`/`Potion.initColors()`/`Ring.initGems()` and
 * `SpecialRoom.initForRun()`/`SecretRoom.initForRun()`.
 *
 * Two things here matter to level generation, for quite different reasons:
 * - `usingFirstDeck`'s value decides every `categoryProbs` weight, and those weights are rolled
 *   on the *level* stream by `random()`. So this one `Random.Int(2)` on the run-init stream
 *   silently steers level content on every floor of the run.
 * - The 18 `Random.Long()` draws (one per category with `defaultProbs`) seed each category's
 *   substream. Their values never reach the level stream, but reproducing them lets the
 *   concrete class picks be faithful too, and their *count* keeps this function's position in
 *   the run-init stream correct for anything added after it later.
 * - Potion and scroll also carry Java's `defaultProbs2` second deck: one `Random.Int(2)`
 *   each decides the starting deck, and every deck refill toggles it. Those two draws sit
 *   between the `usingFirstDeck` roll and the substream seeds, so omitting them shifts
 *   every seed after them.
 */
export function generatorFullReset(): void {
	probs = CATS.map(c => c.initialProbs.slice());
	catSeeds = CATS.map(() => null);
	dropped = CATS.map(() => 0);

	usingFirstDeck = SpdRandom.int(2) === 0;
	generalReset();
	usingSecondDeck = CATS.map(() => false);
	for (let cat = 0; cat < CATS.length; cat++) {
		if (CATS[cat].secondProbs != null) usingSecondDeck[cat] = SpdRandom.int(2) === 0;
		resetCat(cat);
		if (CATS[cat].defaultProbs !== null) {
			catSeeds[cat] = SpdRandom.long();
			dropped[cat] = 0;
		}
	}
}

// ---------------------------------------------------------------------------------------------
// `.random()` per superclass. These run on the LEVEL stream and are the bulk of the draws.
// ---------------------------------------------------------------------------------------------

/**
 * `UnstableSpellbook()` constructor (UnstableSpellbook.java, tag `v3.3.8`): clones the scroll
 * deck-1 table and keeps picking stored scrolls, zeroing each pick, until the table runs dry
 * (`scrolls.remove(ScrollOfTransmutation.class)` afterwards is draw-free). Only the DRAWS are
 * modelled here: this port picks the book's scroll at READ time (`randomSpellbookScroll`)
 * instead of dealing from a stored list, so the picked identities are intentionally dropped -
 * but the loop must still burn, draw for draw, terminal `-1` pick included (both this port
 * and the oracle-era tree roll once more on the drained table there; v3.3.8 returns draw-free
 * instead, but no v3.3.8 stage drains a table).
 * Found by `--stage levelgen` (seed 1, depth 6): a vault-prize book desynced the whole floor
 * past its construction once the missile-draw fix let that seed reach the artifact pick.
 */
function burnSpellbookConstruction(): void {
	const weights = [...CATS[Cat.SCROLL].defaultProbs!];
	let i = SpdRandom.chances(weights);
	while (i !== -1) {
		weights[i] = 0;
		i = SpdRandom.chances(weights);
	}
}

/**
 * `Generator.random(Category)` / `randomUsingDefaults(Category)` (`Generator.java:728-765`, tag `v3.3.8`): a rolled
 * regular potion or scroll class becomes its exotic counterpart with `ExoticCrystals.consumableExoticChance()`. Java
 * draws that `Float()` on every such roll even at chance 0; here only while crystals are carried, so the existing
 * streams are untouched without them. Only the exotics this port has as items are produced - the rest keep the
 * regular class (the draw is still made), a stated reduction until their items land.
 */
const EXOTIC_OF: Readonly<Record<string, string>> = {
	PotionOfHealing: 'PotionOfShielding', PotionOfInvisibility: 'PotionOfShroudingFog', PotionOfParalyticGas: 'PotionOfEarthenArmor',
	PotionOfPurity: 'PotionOfCleansing', PotionOfHaste: 'PotionOfStamina', PotionOfMindVision: 'PotionOfMagicalSight',
	PotionOfLevitation: 'PotionOfStormClouds', PotionOfToxicGas: 'PotionOfCorrosiveGas', PotionOfFrost: 'PotionOfSnapFreeze', PotionOfStrength: 'PotionOfMastery', PotionOfLiquidFlame: 'PotionOfDragonsBreath', PotionOfExperience: 'PotionOfDivineInspiration',
	ScrollOfMirrorImage: 'ScrollOfPrismaticImage',
	ScrollOfUpgrade: 'ScrollOfEnchantment',
	ScrollOfIdentify: 'ScrollOfDivination',
	ScrollOfRemoveCurse: 'ScrollOfAntiMagic',
	ScrollOfRecharging: 'ScrollOfMysticalEnergy',
	ScrollOfLullaby: 'ScrollOfSirensSong',
	ScrollOfMagicMapping: 'ScrollOfForesight',
	ScrollOfRage: 'ScrollOfChallenge',
	ScrollOfRetribution: 'ScrollOfPsionicBlast',
	ScrollOfTerror: 'ScrollOfDread',
	ScrollOfTransmutation: 'ScrollOfMetamorphosis',
 ScrollOfTeleportation: 'ScrollOfPassage',
};
function exoticSwap(cat: Cat, cls: string): string {
	if (generatorTrinkets.exoticChance <= 0 || (cat !== Cat.POTION && cat !== Cat.SCROLL)) return cls;
	return SpdRandom.float() < generatorTrinkets.exoticChance ? (EXOTIC_OF[cls] ?? cls) : cls;
}

/** `Weapon.random()` / `Armor.random()` - identical except the enchant threshold (0.9 vs 0.85)
 *  and which pool the enchantment comes from (same sizes either way). */
function weaponOrArmorRandom(cat: Cat, cls: string, enchantThreshold: number): GenItem {
	let n = 0;
	if (SpdRandom.int(4) === 0) {
		n++;
		if (SpdRandom.int(5) === 0) n++;
	}
	let cursed = false;
	let hasGoodEnchant = false;
	//Both `Weapon.random()` and `Armor.random()` roll curse/enchant on a private
	//Long-seeded substream (so parchment-scrap variance never touches the calling stream);
	//the level rolls above stay on the caller stream. Ghost quest code then discards the
	//rolled level/curse/enchant, but the draws must still burn in Java order.
	SpdRandom.pushGenerator(SpdRandom.long());
	try {
		const effectRoll = SpdRandom.float();
		//`Weapon.java:439-442` / `Armor.java:674-677`: `effectRoll < 0.3 * ParchmentScrap.curseChanceMultiplier()` curses and
		//`effectRoll >= 1 - base * ParchmentScrap.enchantChanceMultiplier()` enchants (`base` is `1 - enchantThreshold`).
		if (effectRoll < 0.3 * generatorTrinkets.curseMultiplier) {
			// `enchant(Enchantment.randomCurse())` -> `Random.element(curses)`.
			SpdRandom.int(CURSE_POOL_SIZE);
			cursed = true;
		} else if (effectRoll >= 1 - (1 - enchantThreshold) * generatorTrinkets.enchantMultiplier) {
			// `enchant()` -> `Enchantment.random()` -> `chances(typeChances)` then
			// `Random.element(common|uncommon|rare)`.
			const type = SpdRandom.chances(ENCH_TYPE_CHANCES);
			SpdRandom.int(ENCH_POOL_SIZES[type < 0 ? 0 : type]);
			hasGoodEnchant = true;
		}
	} finally {
		SpdRandom.popGenerator();
	}
	return { cat, cls, cursed, level: n, quantity: 1, hasGoodEnchant };
}

/** `Ring.random()` / `Wand.random()` - same body, and neither can be enchanted. */
function ringOrWandRandom(cat: Cat, cls: string): GenItem {
	let n = 0;
	if (SpdRandom.int(3) === 0) {
		n++;
		if (SpdRandom.int(5) === 0) n++;
	}
	const cursed = SpdRandom.float() < 0.3;
	return { cat, cls, cursed, level: n, quantity: 1, hasGoodEnchant: false };
}

/** Dispatches to the `.random()` an item of this category inherits. */
function itemRandom(cat: Cat, cls: string): GenItem {
	switch (CATS[cat].superKind) {
		case 'weapon': return weaponOrArmorRandom(cat, cls, 0.9);
		/**
		 * `MissileWeapon.random()` (MissileWeapon.java, tag `v3.3.8`) has the SAME level roll
		 * plus Long-seeded effect substream as `Weapon.random()` (30% cursed, 10% enchanted) -
		 * an earlier revision mirrored the pre-v3.3.8 stack-size roll instead (`Int(3)`/`Int(5)`
		 * for quantity 2-4, zero level/effect draws), which burned the wrong draws on the wrong
		 * streams and desynced everything downstream of a missile generation (found by the
		 * Blacksmith parity stage: armor class, item levels and the enchant keep all diverged
		 * past the missile draw). Fresh quantity is `defaultQuantity()` (3 - `Dart`'s 2 is not
		 * modelled, the port has no Dart class hierarchy), set draw-free in the constructor.
		 */
		case 'missile': {
			const rolled = weaponOrArmorRandom(cat, cls, 0.9);
			return { ...rolled, quantity: 3 };
		}
		case 'armor': return weaponOrArmorRandom(cat, cls, 0.85);
		case 'ring':
		case 'wand': return ringOrWandRandom(cat, cls);
		case 'artifact': {
			//Construction draws come before `.random()` (`Reflection.newInstance` runs the
			//constructor first) - for most artifacts that is nothing, for the spellbook below.
			if (cls === 'UnstableSpellbook') burnSpellbookConstruction();
			// `Artifact.random()`: always +0, 30% cursed.
			return {
				cat, cls, cursed: SpdRandom.float() < 0.3, level: 0, quantity: 1,
				hasGoodEnchant: false,
			};
		}
		case 'gold':
			// `Gold.random()`: `Random.IntRange(30 + depth*10, 60 + depth*20)`.
			return {
				cat, cls, cursed: false, level: 0, hasGoodEnchant: false,
				quantity: SpdRandom.intRange(30 + currentDepth * 10, 60 + currentDepth * 20),
			};
		case 'item':
		default:
			// `Item.random()` returns `this` - zero draws.
			return { cat, cls, cursed: false, level: 0, quantity: 1, hasGoodEnchant: false };
	}
}

/** `new Gold().random()` used directly (not via a category roll) - `GrassyGraveRoom`,
 *  `CryptRoom`/`SacrificeRoom`'s challenge-blocked fallback. One `IntRange` draw. */
export function randomGold(): GenItem {
	return itemRandom(Cat.GOLD, 'Gold');
}

/** `new Bomb().random()` (`ArmoryRoom`'s prize slot 0): one `Random.Int(4)`, upgrading to a
 *  `DoubleBomb` on a 0. */
/**
 * `Mimic.generatePrize()` (Mimic.java:301) - the "extra reward for killing the mimic" that
 * `Mimic.spawnAt()` ALWAYS generates, on the level stream. An earlier revision of this port
 * modelled a spawned mimic as a bare `level.mobs.push(...)` with no draws at all, which is why
 * every TreasuryRoom floor whose chest roll produced a mimic desynced from that point on
 * (found by trace-diffing 999999999999:9).
 *
 * Java's `do { switch (Random.Int(5)) {...} } while (reward == null || isItemBlocked(reward))`
 * always terminates on its first pass here: all five cases assign a non-null reward, and
 * `Challenges.isItemBlocked` is false with no challenges active (this port has no challenge
 * mode - see PORT_COVERAGE.md), so the retry is not reachable and the switch runs exactly once.
 */
// Return the generated item as well as consuming its RNG rolls so the live bridge can
// attach the bonus reward to the spawned mimic instead of silently discarding it.
export function mimicGeneratePrize(): GenItem {
	switch (SpdRandom.int(5)) {
		case 0: return randomGold();
		case 1: return randomMissile(undefined, true);
		case 2: return randomArmor();
		case 3: return randomWeapon(undefined, true);
		default: return randomUsingDefaults(Cat.RING);
	}
}

export function randomBomb(): GenItem {
	const doubled = SpdRandom.int(4) === 0;
	return {
		cat: Cat.GOLD, cls: doubled ? 'DoubleBomb' : 'Bomb',
		cursed: false, level: 0, quantity: 1, hasGoodEnchant: false,
	};
}

const GHOST_TIER_WEIGHTS = mwlNumbers('ghostQuestReward', 'tier_weights');
const GHOST_ARMOR_CLASSES = mwlList('ghostQuestReward', 'armor_classes');

/**
 * `Ghost.Quest.spawn()`'s reward roll (Ghost.java) - NOT the generic depth-scaled
 * `randomWeapon`/`randomArmor`: a fixed 50/30/15/5% tier distribution (tier 2-5) regardless of
 * depth, a single upgrade level shared by both items, and a single shared 20% enchant/glyph
 * chance (not rolled per item), in this exact order. Both items are always uncursed - Java
 * explicitly clears the weapon's own rolled `cursed`/level after generating it, and never calls
 * `.random()` on armor at all (`new LeatherArmor()` etc., a bare constructor). The weapon's
 * class-pick still goes through a real `Generator.random()`-shaped roll
 * (`Generator.wepTiers[wepTier-1].random()` in Java) - its level/cursed/enchant outcome is
 * discarded, but the draws it consumed are real and must still be burned in order, the same
 * "burn the roll, drop the unreproducible content" convention used throughout this module.
 * Armor gets no matching burn, since Java never rolls one for it here.
 */
export function ghostQuestReward(): { weapon: GenItem; armor: GenItem } {
	const armorTier = SpdRandom.chances(GHOST_TIER_WEIGHTS);
	const armorCls = GHOST_ARMOR_CLASSES[(armorTier < 2 ? 2 : armorTier) - 1] ?? 'LeatherArmor';
	const wepTier = SpdRandom.chances(GHOST_TIER_WEIGHTS);
	const rolledWeapon = randomCategory(WEP_TIERS[(wepTier < 2 ? 2 : wepTier) - 1] ?? Cat.WEP_T2);
	//itemLevelRoll: 50%:+0, 30%:+1, 15%:+2, 5%:+3 - shared by both items
	const itemLevelRoll = SpdRandom.float();
	const itemLevel = itemLevelRoll < 0.5 ? 0 : itemLevelRoll < 0.8 ? 1 : itemLevelRoll < 0.95 ? 2 : 3;
	//Java always generates a real enchant AND a real glyph here ("so the outcome doesn't affect
	//the number of RNG rolls"), then keeps or discards both together via one final roll below -
	//this port's `GenItem.hasGoodEnchant` only needs whether it was kept, not the concrete type.
	const weaponEnchantType = SpdRandom.chances(ENCH_TYPE_CHANCES);
	SpdRandom.int(ENCH_POOL_SIZES[weaponEnchantType < 0 ? 0 : weaponEnchantType]);
	const armorGlyphType = SpdRandom.chances(ENCH_TYPE_CHANCES);
	SpdRandom.int(ENCH_POOL_SIZES[armorGlyphType < 0 ? 0 : armorGlyphType]);
	//`Ghost.java:359`: the threshold is `0.2 * ParchmentScrap.enchantChanceMultiplier()`.
	const hasGoodEnchant = SpdRandom.float() <= 0.2 * generatorTrinkets.enchantMultiplier;
	return {
		weapon: { cat: rolledWeapon.cat, cls: rolledWeapon.cls, cursed: false, level: itemLevel, quantity: 1, hasGoodEnchant },
		armor: { cat: Cat.ARMOR, cls: armorCls, cursed: false, level: itemLevel, quantity: 1, hasGoodEnchant },
	};
}

// ---------------------------------------------------------------------------------------------
/**
 * `Imp.Quest.spawn()` reward roll (Imp.java, tag `v3.3.8`) - `do { reward =
 * Generator.random(RING) } while (reward.cursed); reward.upgrade(2)`. Each
 * iteration is a full ring generation: the class pick on the RING deck
 * substream, then `Ring.random()` level/curse rolls on the caller stream
 * (`Int(3)` [+ `Int(5)`] for +0/+1/+2, one `Float() < 0.3` curse test, both
 * in `ringOrWandRandom` above), and `upgrade(2)` is draw-free. The reroll
 * loop always terminates in practice (70% pass per pass); the returned ring
 * is always uncursed at +2..+4. Spawn gate (`Random.Int(20-depth)==0` over
 * depths 17-19) and the depth-switched `alternative` flag live in the trace
 * driver, same split as the Ghost slice - no NPC-dialog consumer yet.
 */
export function impQuestReward(): GenItem {
	let reward = randomCategory(Cat.RING);
	while (reward.cursed) reward = randomCategory(Cat.RING);
	return { ...reward, level: reward.level + 2, cursed: false };
}

// The `Generator` entry points.
// ---------------------------------------------------------------------------------------------

/** `GameMath.gate(0, floorSet, len-1)`. */
function gateFloorSet(floorSet: number): number {
	return Math.max(0, Math.min(floorSet, FLOOR_SET_TIER_PROBS.length - 1));
}

/** `Generator.randomArmor(floorSet)`. Tier roll is on the level stream, then `a.random()`. */
export function randomArmor(floorSet: number = Math.floor(currentDepth / 5)): GenItem {
	const fs = gateFloorSet(floorSet);
	const i = SpdRandom.chances(FLOOR_SET_TIER_PROBS[fs]);
	const cls = CATS[Cat.ARMOR].classes[i < 0 ? 0 : i] ?? 'ClothArmor';
	return itemRandom(Cat.ARMOR, cls);
}

/** Gameplay-stream draws for kill-time loot rolls (which must never burn the levelgen stream above). */
export interface KillLootRandom {
	int(bound: number): number;
	float(): number;
	weighted(weights: readonly number[]): number | null;
}

/** `ArmoredBrute.createLoot()` (`actors/mobs/ArmoredBrute.java`, tag `v3.3.8`):
 * 1-in-4 `PlateArmor`, else `ScaleArmor`, each `.random()`ed (+0 at 3/4, +1 at
 * 4/20, +2 at 1/20; 30% cursed; 15% inscribed) - the same body as
 * `weaponOrArmorRandom` above, but every draw goes through the injected kill-time
 * RNG. Curse/glyph identities burn their draws and are dropped, like everywhere
 * else here (only kept/discarded survives); Java runs that half on a pushed
 * separate generator, which is why no levelgen-stream draw is owed for it. */
export function bruteLootArmor(random: KillLootRandom): GenItem {
	const cls = random.int(4) === 0 ? 'PlateArmor' : 'ScaleArmor';
	let level = 0;
	if (random.int(4) === 0) level = random.int(5) === 0 ? 2 : 1;
	let cursed = false;
	let hasGoodEnchant = false;
	const effectRoll = random.float();
	if (effectRoll < 0.3) {
		random.int(CURSE_POOL_SIZE);
		cursed = true;
	} else if (effectRoll >= 0.85) {
		const type = random.weighted(ENCH_TYPE_CHANCES) ?? 0;
		random.int(ENCH_POOL_SIZES[type] ?? 0);
		hasGoodEnchant = true;
	}
	return { cat: Cat.ARMOR, cls, cursed, level, quantity: 1, hasGoodEnchant };
}

/** `Generator.randomWeapon(floorSet, useDefaults)`. */
export function randomWeapon(
	floorSet: number = Math.floor(currentDepth / 5),
	useDefaults = false,
): GenItem {
	const fs = gateFloorSet(floorSet);
	const i = SpdRandom.chances(FLOOR_SET_TIER_PROBS[fs]);
	const tier = WEP_TIERS[i < 0 ? 0 : i];
	return useDefaults ? randomUsingDefaults(tier) : randomCategory(tier);
}

/** `Generator.randomMissile(floorSet, useDefaults)`. */
export function randomMissile(
	floorSet: number = Math.floor(currentDepth / 5),
	useDefaults = false,
): GenItem {
	const fs = gateFloorSet(floorSet);
	const i = SpdRandom.chances(FLOOR_SET_TIER_PROBS[fs]);
	const tier = MIS_TIERS[i < 0 ? 0 : i];
	return useDefaults ? randomUsingDefaults(tier) : randomCategory(tier);
}

/**
 * `Generator.randomArtifact()`. The class pick happens on the pushed substream; only the
 * subsequent `.random()` is on the level stream. Returns `null` once the deck is exhausted
 * (artifacts never reset), which makes `random(ARTIFACT)` fall back to a RING - a fallback that
 * changes the level-stream draw count, so it is modelled rather than assumed away. In practice
 * 10 artifacts must drop in one run before it can fire.
 */
export function randomArtifact(): GenItem | null {
	const cat = Cat.ARTIFACT;
	const seed = catSeeds[cat];
	const usesSubstream = CATS[cat].defaultProbs !== null && seed !== null;
	if (usesSubstream) {
		SpdRandom.pushGenerator(seed!);
		for (let k = 0; k < dropped[cat]; k++) SpdRandom.long();
	}

	const i = SpdRandom.chances(probs[cat]);

	if (usesSubstream) {
		SpdRandom.popGenerator();
		dropped[cat]++;
	}

	if (i === -1) return null;
	probs[cat][i]--;
	return itemRandom(cat, CATS[cat].classes[i] ?? 'Artifact');
}

/** Java `Generator.removeArtifact(Class)`: consume a still-available artifact class from
 * the current run's uniqueness deck. Bones uses the boolean to decide whether a carried
 * artifact can return or must collapse to gold. */
export function removeArtifactClass(cls: string): boolean {
	const cat = Cat.ARTIFACT;
	const index = CATS[cat].classes.indexOf(cls);
	if (index < 0 || (probs[cat][index] ?? 0) <= 0) return false;
	probs[cat][index] = 0;
	return true;
}

/** `Generator.random(Category)`. */
export function randomCategory(cat: Cat): GenItem {
	switch (cat) {
		case Cat.ARMOR: return randomArmor();
		case Cat.WEAPON: return randomWeapon();
		case Cat.MISSILE: return randomMissile();
		case Cat.ARTIFACT: {
			const item = randomArtifact();
			return item !== null ? item : randomCategory(Cat.RING);
		}
		default: {
			const def = CATS[cat];
			const seed = catSeeds[cat];
			const usesSubstream = def.defaultProbs !== null && seed !== null;
			if (usesSubstream) {
				SpdRandom.pushGenerator(seed!);
				for (let k = 0; k < dropped[cat]; k++) SpdRandom.long();
			}

			let i = SpdRandom.chances(probs[cat]);
			if (i === -1) {
				resetCat(cat);
				i = SpdRandom.chances(probs[cat]);
			}
			if (def.defaultProbs !== null && i >= 0) probs[cat][i]--;

			if (usesSubstream) {
				SpdRandom.popGenerator();
				dropped[cat]++;
			}

			return itemRandom(cat, exoticSwap(cat, def.classes[i < 0 ? 0 : i] ?? def.name));
		}
	}
}

/**
 * `Generator.randomUsingDefaults(Category)` - overrides the deck system and rolls
 * `defaultProbs` directly on the CURRENT (level) stream, with no substream push. This is why
 * `PlantsRoom`'s seed rolls were already visible on the level stream before this module existed.
 */
export function randomUsingDefaults(cat: Cat): GenItem {
	if (cat === Cat.WEAPON) return randomWeapon(Math.floor(currentDepth / 5), true);
	if (cat === Cat.MISSILE) return randomMissile(Math.floor(currentDepth / 5), true);
	const def = CATS[cat];
	if (def.defaultProbs === null || cat === Cat.ARTIFACT) return randomCategory(cat);
	if (def.secondProbs != null) {
		//Java's `defaultProbsTotal` (element-wise deck sum): picked directly, with no
		//exotic-swap check - Java returns from that branch before reaching regToExo.
		const second: number[] = def.secondProbs;
	const total = def.defaultProbs.map((p, idx) => p + (second[idx] ?? 0));
		const pick = SpdRandom.chances(total);
		return itemRandom(cat, def.classes[pick < 0 ? 0 : pick] ?? def.name);
	}
	const i = SpdRandom.chances(def.defaultProbs);
	if (cat === Cat.POTION) {
		//`Generator.randomUsingDefaults(Category)` (`items/Generator.java:758-759`) checks the
		//selected regular class against `ExoticPotion.regToExo` and consumes `Random.Float()`
		//for ExoticCrystals even at chance 0 (`ExoticCrystals.java:48-55` returns 0 with no trinket).
		//The port has no ExoticCrystals or exotic-potion model, so retain the draw and regular result.
		SpdRandom.float();
	}
	return itemRandom(cat, exoticSwap(cat, def.classes[i < 0 ? 0 : i] ?? def.name));
}

/** `Generator.randomUsingDefaults()` (no-arg): category picked from `defaultCatProbs`. */
export function randomUsingDefaultsAnyCategory(): GenItem {
	const i = SpdRandom.chances(defaultCatProbs);
	return randomUsingDefaults(i < 0 ? Cat.GOLD : i);
}

/**
 * `Generator.random()` (no-arg). The category roll and the `categoryProbs` decrement are both
 * on the level stream, and the decrement persists for the rest of the run - so calling this the
 * right number of times, in the right order, across floors is part of level-gen fidelity.
 *
 * The `SEED` special case is Java's own (its comment: seeds mostly drop from grass, so the few
 * that come from levelgen should be deck-independent).
 */
export function generatorRandom(): GenItem {
	let cat = SpdRandom.chances(categoryProbs);
	if (cat === -1) {
		usingFirstDeck = !usingFirstDeck;
		generalReset();
		cat = SpdRandom.chances(categoryProbs);
	}
	if (cat === -1) cat = Cat.GOLD;
	categoryProbs[cat] -= 1;

	return cat === Cat.SEED ? randomUsingDefaults(Cat.SEED) : randomCategory(cat);
}

/** `Generator.random(Class)` - `Reflection.newInstance(cl).random()`, no category roll. Used by
 *  rooms that name a specific item class. */
export function randomOfCategorySuperclass(cat: Cat, cls: string): GenItem {
	return itemRandom(cat, cls);
}

/**
 * `Enchantment.random()` / `Glyph.random()` used directly (not via an item's own `.random()`):
 * one `chances(typeChances)` float plus one `Random.element(common|uncommon|rare)` pick.
 */
export function randomEnchantment(): void {
	const type = SpdRandom.chances(ENCH_TYPE_CHANCES);
	SpdRandom.int(ENCH_POOL_SIZES[type < 0 ? 0 : type]);
}

/**
 * `Statue.random()` plus the constructor it picks, which is where nearly all the draws live:
 *
 * ```java
 * public static Statue random(){ return Random.Int(10) == 0 ? new ArmoredStatue() : new Statue(); }
 * // Statue():        do { weapon = Generator.random(WEAPON); } while (weapon.cursed);
 * //                  weapon.enchant( Enchantment.random() );
 * // ArmoredStatue(): super(); then do { armor = Generator.randomArmor(); } while (armor.cursed);
 * //                  armor.inscribe( Armor.Glyph.random() );
 * ```
 *
 * `StatueRoom` was previously documented as having "no local RNG at all", which is true of its
 * own `paint()` body but badly misleading: `Statue.random()` generates a full enchanted weapon
 * (and an armor too, for the 1-in-10 armored variant) on the level stream.
 */
export interface StatueLoot {
	armored: boolean;
	weapon: GenItem;
	armor?: GenItem;
	/** The weapon's enchantment class, rolled when the statue spawns (see `statueWeapons.ts`). */
	enchant?: string;
}

export function randomStatue(): StatueLoot {
	const armored = SpdRandom.int(10) === 0;
	// Statue()'s own constructor runs for both variants (ArmoredStatue calls super()).
	let weapon: GenItem;
	do { weapon = randomCategory(Cat.WEAPON); } while (weapon.cursed);
	randomEnchantment();
	let armor: GenItem | undefined;
	if (armored) {
		do { armor = randomArmor(); } while (armor.cursed);
		randomEnchantment();
	}
	return { armored, weapon, armor };
}

/** `Random.oneOf(a, b, ...)` - one `Random.Int(n)` over the argument list. Several rooms pick a
 *  prize category this way, and that draw is on the level stream. */
export function oneOfCategories(cats: Cat[]): Cat {
	return cats[SpdRandom.int(cats.length)];
}

/**
 * The "never cursed" prize loop shared verbatim by `PoolRoom`, `SentryRoom`, `TrapsRoom` and
 * `SecretMazeRoom`:
 *
 * ```java
 * do {
 *     if (Random.Int(2) == 0) prize = Generator.randomWeapon(floorSet);
 *     else                    prize = Generator.randomArmor(floorSet);
 * } while (prize.cursed || Challenges.isItemBlocked(prize));
 * ```
 *
 * The retry count is genuinely variable and driven by the `cursed` flag that `.random()` rolls,
 * which is exactly why this could not be reproduced before this module existed. With no
 * challenges enabled, `Challenges.isItemBlocked` is always false, so `cursed` alone decides.
 *
 * `weaponUsesDefaults` is `SecretMazeRoom`'s quirk: it passes `true` for the weapon branch only
 * (`randomWeapon(floorSet, true)`), which moves the class pick onto the level stream.
 */
export function uncursedWeaponOrArmorPrize(floorSet: number, weaponUsesDefaults = false): GenItem {
	let prize: GenItem;
	do {
		prize = SpdRandom.int(2) === 0
			? randomWeapon(floorSet, weaponUsesDefaults)
			: randomArmor(floorSet);
	} while (prize.cursed);
	return prize;
}

/**
 * `CryptRoom`/`SacrificeRoom`'s prize: one armor/weapon at one floor set higher, then - only if
 * it came out uncursed AND without a good enchantment - a `randomCurse()` draw. The `upgrade()`
 * calls in between consume no RNG.
 */
export function cursedGiftPrize(floorSet: number, kind: 'armor' | 'weapon'): GenItem {
	const prize = kind === 'armor' ? randomArmor(floorSet) : randomWeapon(floorSet);
	if (!prize.cursed) {
		if (!prize.hasGoodEnchant) SpdRandom.int(CURSE_POOL_SIZE);
	}
	return prize;
}

/**
 * `Blacksmith.Quest.generateRewards(useDecks)` (`Blacksmith.java`, tag `v3.3.8`): two weapons
 * of *different* classes, one missile, one armor - all sharing one upgrade level (30/45/20/5%
 * for +0/+1/+2/+3) and one enchant roll. The tiers are NOT fixed: `randomWeapon(3, ...)`,
 * `randomMissile(3, ...)` and `randomArmor(3)` roll them on `floorSetTierProbs[3]`
 * (`{0, 0, 20, 40, 40}`, `Generator.java`, tag `v3.3.8`), so rewards land on tiers 3-5
 * (armor: Mail/Scale/Plate, one class per tier). Despite the parameter name, the spawn call
 * `generateRewards(true)` forwards it to `randomWeapon/randomMissile(floorSet, useDefaults)`,
 * so spawn-time rewards use DEFAULT probs, never the run's decks; only `WndBlacksmith`'s lazy
 * fallback (`generateRewards(false)`) draws from real decks. This port models the spawn branch
 * (it still generates lazily on first open, but with the spawn branch's defaults-based rolls -
 * the deck fallback is not modelled). Java's clash loop `undoDrop`s discarded doubles back
 * into the WEP decks, burning no RNG; the port skips that bookkeeping, which only affects
 * later in-run deck weights after a clash, never the rewards themselves. The spawn gate
 * (`Random.Int(15-depth)==0` on depths 12+, `CavesLevel.initRooms()`) and the quest type
 * (`Random.IntRange(1, 2)`, CRYSTAL/GNOLL) live in the parity trace driver, same split as the
 * Ghost slice - no scene consumer yet.
 */
export function blacksmithSmithRewards(): GenItem[] {
	const first = randomWeapon(3, true);
	let second = randomWeapon(3, true);
	while (second.cls === first.cls) second = randomWeapon(3, true);
	const missile = randomMissile(3, true);
	const armor = randomArmor(3);
	//30%:+0, 45%:+1, 20%:+2, 5%:+3 - one roll shared by all four items
	const itemLevelRoll = SpdRandom.float();
	const itemLevel = itemLevelRoll < 0.3 ? 0 : itemLevelRoll < 0.75 ? 1 : itemLevelRoll < 0.95 ? 2 : 3;
	//Java generates a real enchant AND a real glyph before the 30% roll "so the outcome doesn't
	//affect the number of RNG rolls"; the port's GenItem carries only whether the enchant was
	//kept, and its concrete affix is rolled when the item itself is created.
	const weaponEnchantType = SpdRandom.chances(ENCH_TYPE_CHANCES);
	SpdRandom.int(ENCH_POOL_SIZES[weaponEnchantType < 0 ? 0 : weaponEnchantType]);
	const armorGlyphType = SpdRandom.chances(ENCH_TYPE_CHANCES);
	SpdRandom.int(ENCH_POOL_SIZES[armorGlyphType < 0 ? 0 : armorGlyphType]);
	//`Blacksmith.java:415`: the threshold is `0.3 * ParchmentScrap.enchantChanceMultiplier()`.
	const keepEnchant = SpdRandom.float() <= 0.3 * generatorTrinkets.enchantMultiplier;
	return [
		{ ...first, level: itemLevel, cursed: false, hasGoodEnchant: keepEnchant },
		{ ...second, level: itemLevel, cursed: false, hasGoodEnchant: keepEnchant },
		{ ...missile, level: itemLevel, cursed: false, hasGoodEnchant: keepEnchant },
		{ ...armor, level: itemLevel, cursed: false, hasGoodEnchant: keepEnchant },
	];
}
