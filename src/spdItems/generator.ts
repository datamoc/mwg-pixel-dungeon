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

/** `Generator.Category`'s declaration order - load-bearing, since `categoryProbs` is a
 *  `LinkedHashMap` populated by iterating `Category.values()`, so `Random.chances()` sees the
 *  weights in exactly this order. */
export const enum Cat {
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
	/** Concrete class names, for faithful (if cosmetic) reporting of what got picked. */
	classes: string[];
}

/** Exactly `Generator.java`'s static initializer. Weights and class order both matter: the
 *  weights drive `Random.chances`, and the order decides which class an index maps to. */
const CATS: CatDef[] = [
	{ name: 'WEAPON', firstProb: 2, secondProb: 2, superKind: 'weapon', defaultProbs: null, initialProbs: [], classes: [] },
	{
		name: 'WEP_T1', firstProb: 0, secondProb: 0, superKind: 'weapon',
		defaultProbs: [2, 0, 2, 2, 2], initialProbs: [2, 0, 2, 2, 2],
		classes: ['WornShortsword', 'MagesStaff', 'Dagger', 'Gloves', 'Rapier'],
	},
	{
		name: 'WEP_T2', firstProb: 0, secondProb: 0, superKind: 'weapon',
		defaultProbs: [2, 2, 2, 2, 2, 2], initialProbs: [2, 2, 2, 2, 2, 2],
		classes: ['Shortsword', 'HandAxe', 'Spear', 'Quarterstaff', 'Dirk', 'Sickle'],
	},
	{
		// `Generator.java`'s static init had a real copy-paste bug here - `WEP_T3.probs =
		// WEP_T1.defaultProbs.clone()` - cloning tier 1's 5-entry `{2,0,2,2,2}` onto tier 3's
		// 6-entry deck instead of tier 3's own `defaultProbs`. That zeroed `Mace`'s weight (tier
		// 1 index 1, `MagesStaff`, is a real 0) and made `Sai`/`Whip` unreachable until the deck
		// reset. Fixed upstream in this checkout's `Generator.java` (logged in
		// `UPSTREAM_CANDIDATES.md`) and mirrored here to match: `initialProbs` now starts equal
		// to `defaultProbs`, same as every other correctly-initialized category. `chances()`
		// always burns exactly one `Random.Float` regardless of array length/values, so this fix
		// does not change the level-generation RNG call count or order - only which weapon class
		// index a given draw resolves to.
		name: 'WEP_T3', firstProb: 0, secondProb: 0, superKind: 'weapon',
		defaultProbs: [2, 2, 2, 2, 2, 2], initialProbs: [2, 2, 2, 2, 2, 2],
		classes: ['Sword', 'Mace', 'Scimitar', 'RoundShield', 'Sai', 'Whip'],
	},
	{
		name: 'WEP_T4', firstProb: 0, secondProb: 0, superKind: 'weapon',
		defaultProbs: [2, 2, 2, 2, 2, 2, 2], initialProbs: [2, 2, 2, 2, 2, 2, 2],
		classes: ['Longsword', 'BattleAxe', 'Flail', 'RunicBlade', 'AssassinsBlade', 'Crossbow', 'Katana'],
	},
	{
		name: 'WEP_T5', firstProb: 0, secondProb: 0, superKind: 'weapon',
		defaultProbs: [2, 2, 2, 2, 2, 2, 2], initialProbs: [2, 2, 2, 2, 2, 2, 2],
		classes: ['Greatsword', 'WarHammer', 'Glaive', 'Greataxe', 'Greatshield', 'Gauntlet', 'WarScythe'],
	},
	{
		// No `defaultProbs`: `randomArmor()` handles tier selection itself, so `random(ARMOR)`
		// never reaches the deck branch.
		name: 'ARMOR', firstProb: 2, secondProb: 1, superKind: 'armor',
		defaultProbs: null, initialProbs: [1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
		classes: ['ClothArmor', 'LeatherArmor', 'MailArmor', 'ScaleArmor', 'PlateArmor',
			'WarriorArmor', 'MageArmor', 'RogueArmor', 'HuntressArmor', 'DuelistArmor'],
	},
	{ name: 'MISSILE', firstProb: 1, secondProb: 2, superKind: 'missile', defaultProbs: null, initialProbs: [], classes: [] },
	{
		name: 'MIS_T1', firstProb: 0, secondProb: 0, superKind: 'missile',
		defaultProbs: [3, 3, 3], initialProbs: [3, 3, 3],
		classes: ['ThrowingStone', 'ThrowingKnife', 'ThrowingSpike'],
	},
	{
		name: 'MIS_T2', firstProb: 0, secondProb: 0, superKind: 'missile',
		defaultProbs: [3, 3, 3], initialProbs: [3, 3, 3],
		classes: ['FishingSpear', 'ThrowingClub', 'Shuriken'],
	},
	{
		name: 'MIS_T3', firstProb: 0, secondProb: 0, superKind: 'missile',
		defaultProbs: [3, 3, 3], initialProbs: [3, 3, 3],
		classes: ['ThrowingSpear', 'Kunai', 'Bolas'],
	},
	{
		name: 'MIS_T4', firstProb: 0, secondProb: 0, superKind: 'missile',
		defaultProbs: [3, 3, 3], initialProbs: [3, 3, 3],
		classes: ['Javelin', 'Tomahawk', 'HeavyBoomerang'],
	},
	{
		name: 'MIS_T5', firstProb: 0, secondProb: 0, superKind: 'missile',
		defaultProbs: [3, 3, 3], initialProbs: [3, 3, 3],
		classes: ['Trident', 'ThrowingHammer', 'ForceCube'],
	},
	{
		name: 'WAND', firstProb: 1, secondProb: 1, superKind: 'wand',
		defaultProbs: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
		initialProbs: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
		classes: ['WandOfMagicMissile', 'WandOfLightning', 'WandOfDisintegration', 'WandOfFireblast',
			'WandOfCorrosion', 'WandOfBlastWave', 'WandOfLivingEarth', 'WandOfFrost',
			'WandOfPrismaticLight', 'WandOfWarding', 'WandOfTransfusion', 'WandOfCorruption',
			'WandOfRegrowth'],
	},
	{
		name: 'RING', firstProb: 1, secondProb: 0, superKind: 'ring',
		defaultProbs: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
		initialProbs: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
		classes: ['RingOfAccuracy', 'RingOfArcana', 'RingOfElements', 'RingOfEnergy', 'RingOfEvasion',
			'RingOfForce', 'RingOfFuror', 'RingOfHaste', 'RingOfMight', 'RingOfSharpshooting',
			'RingOfTenacity', 'RingOfWealth'],
	},
	{
		// Artifacts never reset their deck (uniqueness across a run), hence the exhaustion path
		// in `randomArtifact()`.
		name: 'ARTIFACT', firstProb: 0, secondProb: 1, superKind: 'artifact',
		defaultProbs: [1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1],
		initialProbs: [1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1],
		classes: ['AlchemistsToolkit', 'ChaliceOfBlood', 'CloakOfShadows', 'DriedRose',
			'EtherealChains', 'HornOfPlenty', 'MasterThievesArmband', 'SandalsOfNature',
			'TalismanOfForesight', 'TimekeepersHourglass', 'UnstableSpellbook'],
	},
	{
		name: 'FOOD', firstProb: 0, secondProb: 0, superKind: 'item',
		defaultProbs: [4, 1, 0], initialProbs: [4, 1, 0],
		classes: ['Food', 'Pasty', 'MysteryMeat'],
	},
	{
		name: 'POTION', firstProb: 8, secondProb: 8, superKind: 'item',
		defaultProbs: [0, 6, 4, 3, 3, 3, 2, 2, 2, 2, 2, 1],
		initialProbs: [0, 6, 4, 3, 3, 3, 2, 2, 2, 2, 2, 1],
		classes: ['PotionOfStrength', 'PotionOfHealing', 'PotionOfMindVision', 'PotionOfFrost',
			'PotionOfLiquidFlame', 'PotionOfToxicGas', 'PotionOfHaste', 'PotionOfInvisibility',
			'PotionOfLevitation', 'PotionOfParalyticGas', 'PotionOfPurity', 'PotionOfExperience'],
	},
	{
		name: 'SEED', firstProb: 1, secondProb: 1, superKind: 'item',
		defaultProbs: [0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 2],
		initialProbs: [0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 2],
		classes: ['Rotberry', 'Sungrass', 'Fadeleaf', 'Icecap', 'Firebloom', 'Sorrowmoss',
			'Swiftthistle', 'Blindweed', 'Stormvine', 'Earthroot', 'Mageroyal', 'Starflower'],
	},
	{
		name: 'SCROLL', firstProb: 8, secondProb: 8, superKind: 'item',
		defaultProbs: [0, 6, 4, 3, 3, 3, 2, 2, 2, 2, 2, 1],
		initialProbs: [0, 6, 4, 3, 3, 3, 2, 2, 2, 2, 2, 1],
		classes: ['ScrollOfUpgrade', 'ScrollOfIdentify', 'ScrollOfRemoveCurse', 'ScrollOfMirrorImage',
			'ScrollOfRecharging', 'ScrollOfTeleportation', 'ScrollOfLullaby', 'ScrollOfMagicMapping',
			'ScrollOfRage', 'ScrollOfRetribution', 'ScrollOfTerror', 'ScrollOfTransmutation'],
	},
	{
		name: 'STONE', firstProb: 1, secondProb: 1, superKind: 'item',
		defaultProbs: [0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 0],
		initialProbs: [0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 0],
		// Generator.java (4.0.0-beta) uses StoneOfDetectMagic here; StoneOfDisarming is not
		// an SPD runestone and would silently make the implemented detect-magic item unreachable
		// through ordinary floor generation.
		classes: ['StoneOfEnchantment', 'StoneOfIntuition', 'StoneOfDetectMagic', 'StoneOfFlock',
			'StoneOfShock', 'StoneOfBlink', 'StoneOfDeepSleep', 'StoneOfClairvoyance',
			'StoneOfAggression', 'StoneOfBlast', 'StoneOfFear', 'StoneOfAugmentation'],
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
const FLOOR_SET_TIER_PROBS: number[][] = [
	[0, 75, 20, 4, 1],
	[0, 25, 50, 20, 5],
	[0, 0, 40, 50, 10],
	[0, 0, 20, 40, 40],
	[0, 0, 0, 20, 80],
];

const WEP_TIERS = [Cat.WEP_T1, Cat.WEP_T2, Cat.WEP_T3, Cat.WEP_T4, Cat.WEP_T5];
const MIS_TIERS = [Cat.MIS_T1, Cat.MIS_T2, Cat.MIS_T3, Cat.MIS_T4, Cat.MIS_T5];

/** `Weapon.Enchantment`/`Armor.Glyph` share identical shapes: 4 common, 6 uncommon, 3 rare,
 *  8 curses, and the same `{50,40,10}` rarity split. Only the array *lengths* matter here, since
 *  the draw is `Random.element(list)` = `Random.Int(list.length)`. */
const ENCH_TYPE_CHANCES = [50, 40, 10];
const ENCH_POOL_SIZES = [4, 6, 3];
const CURSE_POOL_SIZE = 8;

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

// ---------------------------------------------------------------------------------------------
// Run-level state. Mirrors Java's static fields on `Generator`/`Category`, and like them it
// persists across floors of a run and must be reset per run (see `fullReset`).
// ---------------------------------------------------------------------------------------------

let usingFirstDeck = false;
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

/** `Generator.reset(cat)`. No RNG. */
function resetCat(cat: Cat): void {
	const def = CATS[cat];
	if (def.defaultProbs !== null) probs[cat] = def.defaultProbs.slice();
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
 */
export function generatorFullReset(): void {
	probs = CATS.map(c => c.initialProbs.slice());
	catSeeds = CATS.map(() => null);
	dropped = CATS.map(() => 0);

	usingFirstDeck = SpdRandom.int(2) === 0;
	generalReset();
	for (let cat = 0; cat < CATS.length; cat++) {
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
	const effectRoll = SpdRandom.float();
	if (effectRoll < 0.3) {
		// `enchant(Enchantment.randomCurse())` -> `Random.element(curses)`.
		SpdRandom.int(CURSE_POOL_SIZE);
		cursed = true;
	} else if (effectRoll >= enchantThreshold) {
		// `enchant()` -> `Enchantment.random()` -> `chances(typeChances)` then
		// `Random.element(common|uncommon|rare)`.
		const type = SpdRandom.chances(ENCH_TYPE_CHANCES);
		SpdRandom.int(ENCH_POOL_SIZES[type < 0 ? 0 : type]);
		hasGoodEnchant = true;
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
		 * `MissileWeapon.random()` (MissileWeapon.java:252) fully OVERRIDES `Weapon.random()` -
		 * it rolls a STACK SIZE and never touches level/enchant/curse:
		 *     if (!stackable) return this;                       // zero draws
		 *     quantity = 2;
		 *     if (Random.Int(3) == 0) { quantity++;
		 *         if (Random.Int(5) == 0) quantity++; }
		 * So 1-2 draws, versus `Weapon.random()`'s 2-4 (Int(4) [+Int(5)] + a curse/enchant
		 * Float()). An earlier revision filed MISSILE/MIS_T1..T5 under `superKind: 'weapon'`,
		 * which made every generated missile burn ~2 extra level-stream draws and desynced any
		 * floor with a missile prize - found by trace-diffing 1:9's ArmoryRoom. Every class in
		 * MIS_T1..MIS_T5 is stackable (MissileWeapon's constructor sets `stackable = true` and
		 * none of the 15 tier classes override it - verified by grep), so the early return is
		 * unreachable from level generation and is not modelled here.
		 */
		case 'missile': {
			let quantity = 2;
			if (SpdRandom.int(3) === 0) {
				quantity++;
				if (SpdRandom.int(5) === 0) quantity++;
			}
			return { cat, cls, cursed: false, level: 0, quantity, hasGoodEnchant: false };
		}
		case 'armor': return weaponOrArmorRandom(cat, cls, 0.85);
		case 'ring':
		case 'wand': return ringOrWandRandom(cat, cls);
		case 'artifact':
			// `Artifact.random()`: always +0, 30% cursed.
			return {
				cat, cls, cursed: SpdRandom.float() < 0.3, level: 0, quantity: 1,
				hasGoodEnchant: false,
			};
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

const GHOST_TIER_WEIGHTS = [0, 0, 10, 6, 3, 1];
const GHOST_ARMOR_CLASSES = ['ClothArmor', 'LeatherArmor', 'MailArmor', 'ScaleArmor', 'PlateArmor'];

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
	//real threshold is `0.2 * ParchmentScrap.enchantChanceMultiplier()`; this port has no
	//ParchmentScrap trinket, so the multiplier is always its default of 1.
	const hasGoodEnchant = SpdRandom.float() <= 0.2;
	return {
		weapon: { cat: rolledWeapon.cat, cls: rolledWeapon.cls, cursed: false, level: itemLevel, quantity: 1, hasGoodEnchant },
		armor: { cat: Cat.ARMOR, cls: armorCls, cursed: false, level: itemLevel, quantity: 1, hasGoodEnchant },
	};
}

// ---------------------------------------------------------------------------------------------
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

			return itemRandom(cat, def.classes[i < 0 ? 0 : i] ?? def.name);
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
	const i = SpdRandom.chances(def.defaultProbs);
	return itemRandom(cat, def.classes[i < 0 ? 0 : i] ?? def.name);
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
