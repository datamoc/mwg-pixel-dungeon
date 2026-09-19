import { Random } from 'mwg';
import { craft, type Recipe } from 'mwg/actors';
import type { Inventory } from 'mwg/actors';
import { t } from '../i18n';
import { MWL_ITEM_NODES, MWL_TABLE_ROWS } from '../mwlContent';
import { isChallengeEnabled } from '../challenges';

/** This port's authored recipes always name one exact item id, never MWG 0.7.7's category or
 * predicate forms, so the ingredient id is narrowed back to a plain `string` from `Ingredient`'s
 * `string | readonly string[] | undefined`. */
export interface AlchemyIngredient {
	readonly id: string;
	readonly quantity: number;
}

export interface AlchemyRecipe extends Recipe {
	readonly id: string;
	readonly energyCost: number;
	/** narrower than `Recipe`'s `Ingredient[]` so callers keep a plain `string` id */
	readonly ingredients: AlchemyIngredient[];
}

export interface AlchemyRecipeManifestEntry {
	readonly id: string;
	readonly group: 'variable' | 'one' | 'two' | 'three';
	readonly javaRecipe: string;
}

export const ALCHEMY_RECIPE_MANIFEST: readonly AlchemyRecipeManifestEntry[] = MWL_TABLE_ROWS('alchemyRecipeManifest', 'id').map((row) => {
	const group = String(row.group);
	if (!['variable', 'one', 'two', 'three'].includes(group)) throw new Error(`Invalid MWL alchemy manifest group: ${group}`);
	return { id: String(row.recipe), group: group as AlchemyRecipeManifestEntry['group'], javaRecipe: String(row.javaRecipe) };
});

export const ALCHEMY_ENERGY: Readonly<Record<string, number>> = Object.fromEntries(
	MWL_TABLE_ROWS('alchemyEnergy', 'kind').map((row) => [String(row.kind), Number(row.energy)]),
);

export const ALCHEMY_RECIPES: readonly AlchemyRecipe[] = MWL_TABLE_ROWS('alchemyRecipes', 'id').map((row) => {
	const ingredients = (Array.isArray(row.ingredients) ? row.ingredients : []).map((raw) => {
		const [ingredientId, quantity] = String(raw).split(':');
		return { id: ingredientId!, quantity: Number(quantity) };
	});
	return {
		id: String(row.id),
		ingredients,
		energyCost: Number(row.energyCost),
		result: { id: String(row.result), quantity: Number(row.resultQuantity), stackable: true },
	};
});
const MWL_ITEM_IDS = new Set(MWL_ITEM_NODES.map((node) => node.attributes.id));
for (const recipe of ALCHEMY_RECIPES) {
	for (const ingredient of recipe.ingredients) {
		if (!MWL_ITEM_IDS.has(ingredient.id)) {
			throw new Error(`MWL alchemy recipe ${recipe.id} references unknown ingredient item: ${ingredient.id}`);
		}
	}
	if (!MWL_ITEM_IDS.has(recipe.result.id)) {
		throw new Error(`MWL alchemy recipe ${recipe.id} references unknown result item: ${recipe.result.id}`);
	}
}
for (const recipe of ALCHEMY_RECIPES) {
	if (!ALCHEMY_RECIPE_MANIFEST.some((manifest) => manifest.id === recipe.id)) {
		throw new Error(`Executable MWL alchemy recipe is missing from the manifest: ${recipe.id}`);
	}
}

export function alchemyRecipe(id: string): AlchemyRecipe | undefined {
	return ALCHEMY_RECIPES.find((recipe) => recipe.id === id);
}

/** One explicitly chosen carried unit - Java's alchemy window adds specific items, while the
 * recipe picker only names the recipe, so category recipes resolve these after a follow-up pick. */
export interface AlchemyUnitRef {
	readonly id: string;
	readonly instanceId?: string;
}

/** A primary plus a secondary unit (catalysts, alchemize): two distinct carried units. */
export interface AlchemyPairSelection {
	readonly primary: AlchemyUnitRef;
	readonly secondary: AlchemyUnitRef;
}

function unitKey(ref: { id: string; instanceId?: string }): string {
	return `${ref.id}${ref.instanceId ?? ''}`;
}

/**
 * All-or-nothing resolution of explicitly chosen units: every ref must match a carried stack
 * with an uncovered unit that still passes `eligible` (the bag cannot have changed under a
 * synchronous picker chain, but the check keeps the transaction honest and headless-testable).
 * Failure resolves to `undefined` and consumes nothing - the same shape as MWG's `craft()`.
 */
function takeChosenUnits(
	inventory: Inventory,
	refs: readonly AlchemyUnitRef[],
	eligible: (item: { id: string; instanceId?: string; quantity: number }) => boolean,
): AlchemyUnitRef[] | undefined {
	const remaining = new Map<string, number>();
	for (const item of inventory.items) {
		if (item.quantity > 0 && eligible(item)) {
			const key = unitKey(item);
			remaining.set(key, (remaining.get(key) ?? 0) + item.quantity);
		}
	}
	const resolved: AlchemyUnitRef[] = [];
	for (const ref of refs) {
		const key = unitKey(ref);
		const left = remaining.get(key) ?? 0;
		if (left <= 0) return undefined;
		remaining.set(key, left - 1);
		resolved.push({ id: ref.id, instanceId: ref.instanceId });
	}
	return resolved;
}

/**
 * The authored energy table is keyed by SPD's *kind* (seed/stone/scroll/potion/food), but this
 * port carries concrete consumable ids in the bag (`potionHealing`, `seedRotberry`...) and only
 * sometimes the generic one, so a concrete id has to be reduced to its kind before lookup.
 */
function energyKindOf(itemId: string): string | undefined {
	const id = itemId.toLowerCase();
	if (id.startsWith('seed')) return 'seed';
	if (id === 'stone' || id.startsWith('stoneof')) return 'stone';
	if (id.startsWith('scroll')) return 'scroll';
	if (id.startsWith('potion')) return 'potion';
	if (id === 'food' || id === 'meat' || id === 'chargrilledmeat') return 'food';
	return undefined;
}

/**
 * `Item.energyVal()`'s `isKnown()` overrides: these four classes give 10 while identified and
 * their base 6 while not (`PotionOfStrength`/`PotionOfExperience`/`ScrollOfUpgrade`/
 * `ScrollOfTransmutation`, tag v3.3.8). Every other energy value is the class base, which the
 * authored table already carries.
 */
const KNOWN_ENERGY = new Map(
	MWL_TABLE_ROWS('alchemyKnownEnergy', 'item').map((row) => [String(row.item).toLowerCase(), Number(row.energy)]),
);

/** `Item.energyVal()` for one carried item: an exact authored row wins, then the item's own
 * consumable kind, else zero (Java's `Item.energyVal()` default). */
export function alchemyEnergyFor(itemId: string, identified: boolean): number {
	const exact = ALCHEMY_ENERGY[itemId];
	if (exact !== undefined) return exact;
	const kind = energyKindOf(itemId);
	const base = kind === undefined ? 0 : ALCHEMY_ENERGY[kind] ?? 0;
	const knownEnergy = KNOWN_ENERGY.get(itemId.toLowerCase());
	if (base > 0 && identified && knownEnergy !== undefined) return knownEnergy;
	return base;
}

/** Resolves an authored recipe through MWG's all-or-nothing inventory transaction. */
export function craftAlchemy(inventory: Inventory, id: string): boolean {
	const recipe = alchemyRecipe(id);
	return recipe ? craft(inventory, recipe) : false;
}

/** `Alchemize.Recipe` accepts category instances rather than one concrete seed/runestone.
 * Keep that wildcard transaction at the item boundary because MWG's generic `craft()`
 * intentionally matches exact ids. An explicit selection names the two units (the seed and
 * runestone predicates are disjoint, so the two resolutions can never collide); without one
 * the first carried units brew, as before. */
export function craftAlchemize(inventory: Inventory, selected?: { seed: AlchemyUnitRef; stone: AlchemyUnitRef }): boolean {
	const seed = selected
		? takeChosenUnits(inventory, [selected.seed], (item) => item.id.startsWith('seed'))?.[0]
		: inventory.items.find((item) => item.quantity > 0 && item.id.startsWith('seed'));
	const stone = selected
		? takeChosenUnits(inventory, [selected.stone], (item) => item.id.startsWith('stoneOf'))?.[0]
		: inventory.items.find((item) => item.quantity > 0 && item.id.startsWith('stoneOf'));
	if (!seed || !stone) return false;
	inventory.remove(seed.id, 1, seed.instanceId);
	inventory.remove(stone.id, 1, stone.instanceId);
	inventory.add({ id: 'alchemize', quantity: 8, stackable: true });
	return true;
}

/** `Scroll.ScrollToStone` maps one of the twelve eligible regular scroll classes to two
 * matching runestones. The authored recipe uses `scrollIdentify` only as a catalogue-valid
 * representative; this transaction selects the concrete scroll class at runtime. */
export const SCROLL_TO_STONE: Readonly<Record<string, string>> = {
	scrollIdentify: 'stoneOfIntuition', scrollLullaby: 'stoneOfDeepSleep', scrollMapping: 'stoneOfClairvoyance',
	scrollMirror: 'stoneOfFlock', scrollRetribution: 'stoneOfBlast', scrollRage: 'stoneOfAggression',
	scrollRecharging: 'stoneOfShock', scrollCleanse: 'stoneOfDetectMagic', scrollTeleportation: 'stoneOfBlink',
	scrollTerror: 'stoneOfFear', scrollTransmutation: 'stoneOfAugmentation', scrollUpgrade: 'stoneOfEnchantment',
};

export function craftScrollToStone(inventory: Inventory, selected?: AlchemyUnitRef): boolean {
	const scroll = selected
		? takeChosenUnits(inventory, [selected], (item) => SCROLL_TO_STONE[item.id] !== undefined)?.[0]
		: inventory.items.find((item) => item.quantity > 0 && SCROLL_TO_STONE[item.id]);
	if (!scroll) return false;
	inventory.remove(scroll.id, 1, scroll.instanceId);
	inventory.add({ id: SCROLL_TO_STONE[scroll.id]!, quantity: 2, stackable: true });
	return true;
}

export function canCraftScrollToStone(inventory: Inventory): boolean {
	return inventory.items.some((item) => item.quantity > 0 && SCROLL_TO_STONE[item.id]);
}

/**
 * `ExoticScroll.regToExo` (tag `v3.3.8`): all twelve regular scroll classes map
 * to an exotic, brewed one scroll at a time for 6 energy (`ScrollToExotic`).
 * Only the MirrorImage -> PrismaticImage pair exists as a port item; the other
 * eleven values name Java classes with no port id, so they stay out of this
 * table until their exotics are ported (each addition lights up automatically
 * below, since eligibility is "mapped value is a real MWL item"). The full
 * Java table for the record: Upgrade->Enchantment, Identify->Divination,
 * RemoveCurse->AntiMagic, MirrorImage->PrismaticImage, Recharging->
 * MysticalEnergy, Teleportation->Passage, Lullaby->SirensSong, MagicMapping->
 * Foresight, Rage->Challenge, Retribution->PsionicBlast, Terror->Dread,
 * Transmutation->Metamorphosis.
 */
export const SCROLL_TO_EXOTIC: Readonly<Record<string, string>> = {
	scrollMirror: 'scrollPrismatic',
};

export function scrollExoticResult(scrollId: string): string | undefined {
	return SCROLL_TO_EXOTIC[scrollId];
}

export function craftScrollToExotic(inventory: Inventory, selected?: AlchemyUnitRef): boolean {
	const unit = selected
		? takeChosenUnits(inventory, [selected], (item) => SCROLL_TO_EXOTIC[item.id] !== undefined)?.[0]
		: inventory.items.find((item) => item.quantity > 0 && SCROLL_TO_EXOTIC[item.id]);
	if (!unit) return false;
	const stack = inventory.items.find((item) => item.id === unit.id && (item.instanceId ?? undefined) === (unit.instanceId ?? undefined));
	//`ExoticScroll.isKnown()`: an exotic is known exactly when its regular counterpart
	//is, so the brewed scroll inherits the consumed scroll's identified state. Later
	//identification does not propagate between the two families, which the
	//per-instance identified model cannot express (stated in PORT_COVERAGE.md).
	const identified = stack?.identified ?? false;
	inventory.remove(unit.id, 1, unit.instanceId);
	inventory.add({ id: SCROLL_TO_EXOTIC[unit.id]!, quantity: 1, stackable: true, identified });
	return true;
}

export function canCraftScrollToExotic(inventory: Inventory): boolean {
	return inventory.items.some((item) => item.quantity > 0 && SCROLL_TO_EXOTIC[item.id]);
}

/**
 * `ExoticPotion.regToExo` (tag `v3.3.8`): all twelve regular potion classes map
 * to an exotic, brewed one potion at a time for 4 energy (`PotionToExotic`).
 * Only the Invisibility -> ShroudingFog pair exists as a port item; the other
 * eleven values name Java classes with no port id, so they stay out of this
 * table until their exotics are ported (each addition lights up automatically
 * below, since eligibility is "mapped value is a real MWL item"). The full
 * Java table for the record: Strength->Mastery, Healing->Shielding,
 * MindVision->MagicalSight, Frost->SnapFreeze, LiquidFlame->DragonsBreath,
 * ToxicGas->CorrosiveGas, Haste->Stamina, Invisibility->ShroudingFog,
 * Levitation->StormClouds, ParalyticGas->EarthenArmor, Purity->Cleansing,
 * Experience->DivineInspiration.
 */
export const POTION_TO_EXOTIC: Readonly<Record<string, string>> = {
	potionInvis: 'potionShrouding',
};

export function potionExoticResult(potionId: string): string | undefined {
	return POTION_TO_EXOTIC[potionId];
}

export function craftPotionToExotic(inventory: Inventory, selected?: AlchemyUnitRef): boolean {
	const unit = selected
		? takeChosenUnits(inventory, [selected], (item) => POTION_TO_EXOTIC[item.id] !== undefined)?.[0]
		: inventory.items.find((item) => item.quantity > 0 && POTION_TO_EXOTIC[item.id]);
	if (!unit) return false;
	const stack = inventory.items.find((item) => item.id === unit.id && (item.instanceId ?? undefined) === (unit.instanceId ?? undefined));
	//`ExoticPotion.isKnown()`: an exotic is known exactly when its regular counterpart
	//is, so the brewed potion inherits the consumed potion's identified state - the
	//same inheritance the scroll half documents in `PORT_COVERAGE.md`.
	const identified = stack?.identified ?? false;
	inventory.remove(unit.id, 1, unit.instanceId);
	inventory.add({ id: POTION_TO_EXOTIC[unit.id]!, quantity: 1, stackable: true, identified });
	return true;
}

export function canCraftPotionToExotic(inventory: Inventory): boolean {
	return inventory.items.some((item) => item.quantity > 0 && POTION_TO_EXOTIC[item.id]);
}

const POTION_CATALYST_POOL = [
	'potionHealing', 'potionHealing', 'potionHealing', 'potionMindVision', 'potionMindVision', 'potionFrost',
	'potionFrost', 'potionFlame', 'potionFlame', 'potionToxicGas', 'potionToxicGas', 'potionHaste',
	'potionHaste', 'potionInvis', 'potionInvis', 'potionLevitation', 'potionLevitation', 'potionParalyticGas',
	'potionParalyticGas', 'potionPurity', 'potionPurity', 'potionExperience',
];
const SCROLL_CATALYST_POOL = [
	'scrollIdentify', 'scrollIdentify', 'scrollIdentify', 'scrollCleanse', 'scrollCleanse', 'scrollMapping',
	'scrollMapping', 'scrollMirror', 'scrollMirror', 'scrollRecharging', 'scrollRecharging', 'scrollLullaby',
	'scrollLullaby', 'scrollRetribution', 'scrollRetribution', 'scrollRage', 'scrollRage', 'scrollTeleportation',
	'scrollTeleportation', 'scrollTerror', 'scrollTerror', 'scrollTransmutation',
];

export function isSeedOrRunestone(item: { id: string; quantity: number }): boolean {
	return item.quantity > 0 && (item.id === 'seed' || item.id.startsWith('stoneOf'));
}

/** The secondary must be a different carried unit than the primary (Java adds two distinct
 * items; the legacy first-eligible path below keys that on the id, this one on the unit). */
function catalystIngredients(
	inventory: Inventory,
	kind: 'potion' | 'scroll',
	selected?: AlchemyPairSelection,
): [{ id: string; instanceId?: string }, { id: string; instanceId?: string }] | undefined {
	if (!selected) {
		const source = inventory.items.find((item) => item.quantity > 0 && item.id.startsWith(kind));
		const secondary = inventory.items.find((item) => isSeedOrRunestone(item) && item.id !== source?.id);
		if (!source || !secondary) return undefined;
		return [{ id: source.id, instanceId: source.instanceId }, { id: secondary.id, instanceId: secondary.instanceId }];
	}
	const primary = takeChosenUnits(inventory, [selected.primary], (item) => item.id.startsWith(kind))?.[0];
	const secondary = takeChosenUnits(
		inventory,
		[selected.secondary],
		(item) => isSeedOrRunestone(item) && `${item.id}${item.instanceId ?? ''}` !== `${primary?.id ?? ''}${primary?.instanceId ?? ''}`,
	)?.[0];
	if (!primary || !secondary) return undefined;
	return [{ id: primary.id, instanceId: primary.instanceId }, { id: secondary.id, instanceId: secondary.instanceId }];
}

export function alchemicalCatalystCost(inventory: Inventory, selected?: AlchemyPairSelection): number | undefined {
	const ingredients = catalystIngredients(inventory, 'potion', selected);
	if (!ingredients) return undefined;
	return ingredients[1].id.startsWith('stoneOf') ? 1 : 0;
}

export function canCraftAlchemicalCatalyst(inventory: Inventory): boolean {
	return alchemicalCatalystCost(inventory) !== undefined;
}

export function craftAlchemicalCatalyst(inventory: Inventory, selected?: AlchemyPairSelection): boolean {
	const ingredients = catalystIngredients(inventory, 'potion', selected);
	if (!ingredients) return false;
	for (const ingredient of ingredients) inventory.remove(ingredient.id, 1, ingredient.instanceId);
	inventory.add({ id: 'alchemicalCatalyst', quantity: 1, stackable: true, identified: true });
	return true;
}

export function arcaneCatalystCost(inventory: Inventory, selected?: AlchemyPairSelection): number | undefined {
	const ingredients = catalystIngredients(inventory, 'scroll', selected);
	if (!ingredients) return undefined;
	return ingredients[1].id === 'seed' ? 1 : 0;
}

export function canCraftArcaneCatalyst(inventory: Inventory): boolean {
	return arcaneCatalystCost(inventory) !== undefined;
}

export function craftArcaneCatalyst(inventory: Inventory, selected?: AlchemyPairSelection): boolean {
	const ingredients = catalystIngredients(inventory, 'scroll', selected);
	if (!ingredients) return false;
	for (const ingredient of ingredients) inventory.remove(ingredient.id, 1, ingredient.instanceId);
	inventory.add({ id: 'arcaneCatalyst', quantity: 1, stackable: true, identified: true });
	return true;
}

/** `AlchemicalCatalyst.apply()` and `ArcaneCatalyst.onCast()` use weighted random regular
 * potion/scroll classes. Exotic families (`ExoticPotion`/`ExoticScroll` subclasses) are outside
 * the current item catalogue, so both pools only ever produce the regular classes; the weighted
 * regular pools themselves match the Java classes' `potionChances`/`scrollChances` maps. */
export function randomAlchemicalPotion(): string {
	let result = Random.element(POTION_CATALYST_POOL) ?? 'potionHealing';
	/* `AlchemicalCatalyst.apply()` (master, since v0.7.2): rerolls away `PotionOfHealing` while
	 * `Dungeon.isChallenged(Challenges.NO_HEALING)`, so the "no healing" challenge can't be routed
	 * around by drinking a catalyst. `Challenges.NO_HEALING` is this port's `'no_healing'` id
	 * (`challenges.ts`'s `CHALLENGES` list, matched to `Challenges.java` for save portability).
	 * `ArcaneCatalyst.onCast()` has no equivalent check, so `randomArcaneScroll()` below never
	 * rerolls — that asymmetry is real Java behavior, not an omission here. */
	while (result === 'potionHealing' && isChallengeEnabled('no_healing')) {
		result = Random.element(POTION_CATALYST_POOL) ?? 'potionHealing';
	}
	return result;
}

export function randomArcaneScroll(): string {
	return Random.element(SCROLL_CATALYST_POOL) ?? 'scrollIdentify';
}

/** Java's `Potion.SeedToPotion` mapping. The recipe takes three seed units and normally
 * returns the potion represented by one randomly selected seed. */
const SEED_TO_POTION: Readonly<Record<string, string>> = {
	seedBlindweed: 'potionInvis', seedMageroyal: 'potionPurity', seedEarthroot: 'potionParalyticGas',
	seedFadeleaf: 'potionMindVision', seedFirebloom: 'potionFlame', seedIcecap: 'potionFrost',
	seedRotberry: 'potionStrength', seedSorrowmoss: 'potionToxicGas', seedStarflower: 'potionExperience',
	seedStormvine: 'potionLevitation', seedSungrass: 'potionHealing', seedSwiftthistle: 'potionHaste',
};

export function seedPotionId(item: { id: string; sourceClass?: string }): string | undefined {
	if (SEED_TO_POTION[item.id]) return SEED_TO_POTION[item.id];
	if (item.id !== 'seed') return undefined;
	const source = (item.sourceClass ?? '').replace(/\$seed$/i, '').replace(/\.seed$/i, '').split('.').pop() ?? '';
	return SEED_TO_POTION[`seed${source.charAt(0).toUpperCase()}${source.slice(1).toLowerCase()}`];
}

function selectedSeedUnits(inventory: Inventory, selected: readonly AlchemyUnitRef[]): { id: string; instanceId?: string; potionId: string }[] {
	if (selected.length !== 3) return [];
	const refs = takeChosenUnits(inventory, selected, (item) => seedPotionId(item as typeof item & { sourceClass?: string }) !== undefined);
	if (!refs) return [];
	const units: { id: string; instanceId?: string; potionId: string }[] = [];
	for (const ref of refs) {
		const stack = inventory.items.find((item) => `${item.id}${item.instanceId ?? ''}` === `${ref.id}${ref.instanceId ?? ''}`);
		const potionId = seedPotionId({ id: ref.id, sourceClass: (stack as { sourceClass?: string } | undefined)?.sourceClass });
		if (!potionId) return [];
		units.push({ id: ref.id, instanceId: ref.instanceId, potionId });
	}
	return units;
}

function seedUnits(inventory: Inventory): { id: string; instanceId?: string; potionId: string }[] {
	const units: { id: string; instanceId?: string; potionId: string }[] = [];
	for (const item of inventory.items) {
		const potionId = seedPotionId(item as typeof item & { sourceClass?: string });
		if (!potionId) continue;
		for (let n = 0; n < item.quantity && units.length < 3; n++) units.push({ id: item.id, instanceId: item.instanceId, potionId });
	}
	return units;
}

export function canCraftPotionSeed(inventory: Inventory): boolean {
	return seedUnits(inventory).length >= 3;
}

/** `Potion.SeedToPotion.brew()` consumes three seed units. Two distinct seeds have a 1/4
 * chance and three distinct seeds a 1/2 chance to produce a random regular potion; otherwise
 * the result follows one of the selected seeds. The Java cooking-HP limited-drop counter and
 * placeholder preview are not part of this inventory transaction. */
export interface CraftedPotionSeed {
	readonly id: string;
	readonly identified: boolean;
}

/** Exactly three seed units, explicitly chosen: Java's window adds any three units, so the
 * selection is validated whole (wrong count, a non-seed, or an uncovered unit all fail with
 * nothing consumed) and anything else falls back to the first three eligible units. */
export function craftPotionSeed(inventory: Inventory, selection?: readonly AlchemyUnitRef[]): CraftedPotionSeed | undefined {
	const units = selection ? selectedSeedUnits(inventory, selection) : seedUnits(inventory);
	if (units.length < 3) return undefined;
	for (const unit of units) inventory.remove(unit.id, 1, unit.instanceId);
	const distinct = new Set(units.map((unit) => unit.potionId)).size;
	const random = (distinct === 2 && Random.int(0, 4) === 0) || (distinct === 3 && Random.int(0, 2) === 0);
	const selected = Random.element(units);
	if (!selected) return undefined;
	const result = random ? Random.element(Object.values(SEED_TO_POTION)) : selected.potionId;
	return result ? { id: result, identified: distinct === 1 } : undefined;
}

/**
 * The alchemy-pot window flow, moved out of `scenes/dungeonScene.ts` (file-size refactor:
 * one domain per commit, no behavior change). The scene keeps only a thin adapter that
 * builds the context; everything below reads the bag and the energy pool through it,
 * the same vehicle as the potion/bomb effect contexts.
 */
export interface AlchemyFlowContext {
	readonly bag: Inventory;
	alchemyEnergy: number;
	readonly say: (line: string, level?: 'info' | 'positive' | 'negative' | 'warning') => void;
	readonly openItemPicker: (
		title: string,
		entries: { id: string; instanceId?: string; identified?: boolean; quantity: number; note?: string }[],
		onPick: (entry: { id: string; instanceId?: string }) => void,
	) => void;
	readonly itemDisplayName: (id: string, identified: boolean) => string;
	readonly refreshInventoryPanel: () => void;
}

/** One explicitly picked carried unit (potionSeed: three seeds; scroll/stone/exotic: one
 *  unit; alchemize/catalysts: a pair) - Java's alchemy window adds specific items, while
 *  the recipe picker only names the recipe, so category recipes resolve these after a
 *  follow-up pick. */
export type AlchemyIngredientSelection =
	| { kind: 'seeds'; units: AlchemyUnitRef[] }
	| { kind: 'scroll'; unit: AlchemyUnitRef }
	| { kind: 'alchemize'; seed: AlchemyUnitRef; stone: AlchemyUnitRef }
	| { kind: 'pair'; primary: AlchemyUnitRef; secondary: AlchemyUnitRef };

// Java's alchemy window adds specific carried units; the recipe row only names the
// recipe, so these five category recipes pause here for one ingredient picker per unit
// and finish through completeAlchemyRecipe below. Closing any picker aborts the brew
// with nothing consumed, the way walking away from the pot does. Returns true when it
// takes over, false for exact-id recipes (which fall through to the plain picker path).
export function startAlchemyIngredientPick(scene: AlchemyFlowContext, recipe: AlchemyRecipe): boolean {
	const chooseTitle = t('port.ui.alchemy.choose');
	if (recipe.id === 'potionSeed') {
		pickAlchemyUnits(scene, chooseTitle, (item) => seedPotionId(item) !== undefined, 3, [], (selected) => completeAlchemyRecipe(scene, recipe, { kind: 'seeds', units: selected }));
		return true;
	}
	if (recipe.id === 'scrollToStone') {
		pickAlchemyUnits(scene, chooseTitle, (item) => SCROLL_TO_STONE[item.id] !== undefined, 1, [], (selected) => completeAlchemyRecipe(scene, recipe, { kind: 'scroll', unit: selected[0]! }));
		return true;
	}
	if (recipe.id === 'scrollToExotic') {
		pickAlchemyUnits(scene, chooseTitle, (item) => scrollExoticResult(item.id) !== undefined, 1, [], (selected) => completeAlchemyRecipe(scene, recipe, { kind: 'scroll', unit: selected[0]! }));
		return true;
	}
	if (recipe.id === 'potionToExotic') {
		pickAlchemyUnits(scene, chooseTitle, (item) => potionExoticResult(item.id) !== undefined, 1, [], (selected) => completeAlchemyRecipe(scene, recipe, { kind: 'scroll', unit: selected[0]! }));
		return true;
	}
	if (recipe.id === 'alchemize') {
		pickAlchemyUnits(scene, chooseTitle, (item) => item.id.startsWith('seed'), 1, [], (seeds) => {
			pickAlchemyUnits(scene, chooseTitle, (item) => item.id.startsWith('stoneOf'), 1, [], (stones) => completeAlchemyRecipe(scene, recipe, { kind: 'alchemize', seed: seeds[0]!, stone: stones[0]! }));
		});
		return true;
	}
	if (recipe.id === 'alchemicalCatalyst' || recipe.id === 'arcaneCatalyst') {
		const primaryKind = recipe.id === 'alchemicalCatalyst' ? 'potion' : 'scroll';
		pickAlchemyUnits(scene, chooseTitle, (item) => item.id.startsWith(primaryKind), 1, [], (primaries) => {
			const primary = primaries[0]!;
			pickAlchemyUnits(scene, chooseTitle, (item) => isSeedOrRunestone(item) && item.id + (item.instanceId ?? '') !== primary.id + (primary.instanceId ?? ''), 1, [], (secondaries) => completeAlchemyRecipe(scene, recipe, { kind: 'pair', primary, secondary: secondaries[0]! }));
		});
		return true;
	}
	return false;
}

// One ingredient picker per unit: rows are the eligible carried stacks with an uncovered
// unit left, and each pick chains the next until count units are chosen.
export function pickAlchemyUnits(
	scene: AlchemyFlowContext,
	title: string,
	eligible: (item: { id: string; instanceId?: string; quantity: number }) => boolean,
	count: number,
	chosen: AlchemyUnitRef[],
	done: (chosen: AlchemyUnitRef[]) => void,
): void {
	const uncovered = (item: { id: string; instanceId?: string }) => chosen.filter((unit) => unit.id === item.id && (unit.instanceId ?? undefined) === (item.instanceId ?? undefined)).length;
	const rows = scene.bag.items.filter((item) => item.quantity > 0 && eligible(item) && uncovered(item) < item.quantity);
	if (rows.length === 0) {
		scene.say(t('port.log.alchemy.unavailable'), 'negative');
		return;
	}
	scene.openItemPicker(title, rows.map((item) => ({ id: item.id, instanceId: item.instanceId, identified: item.identified, quantity: item.quantity })), (pick) => {
		const target = scene.bag.items.find((item) => item.quantity > 0 && item.id === pick.id && (item.instanceId ?? undefined) === (pick.instanceId ?? undefined) && eligible(item) && uncovered(item) < item.quantity);
		if (!target) {
			scene.say(t('port.log.alchemy.unavailable'), 'negative');
			return;
		}
		const next = [...chosen, { id: target.id, instanceId: target.instanceId }];
		if (next.length >= count) done(next);
		else pickAlchemyUnits(scene, title, eligible, count, next, done);
	});
}

// The shared craft tail for recipes whose ingredients were just picked (and, through the
// plain picker path above, only those - exact-id recipes never reach here). Energy is
// re-checked against the picked units, the selection-aware transaction brews, and the
// result is announced exactly like the plain path.
export function completeAlchemyRecipe(scene: AlchemyFlowContext, recipe: AlchemyRecipe, selected: AlchemyIngredientSelection): void {
	const dynamicCost = recipe.id === 'alchemicalCatalyst' ? alchemicalCatalystCost(scene.bag, selected.kind === 'pair' ? selected : undefined) : recipe.id === 'arcaneCatalyst' ? arcaneCatalystCost(scene.bag, selected.kind === 'pair' ? selected : undefined) : undefined;
	const recipeCost = dynamicCost ?? recipe.energyCost;
	if (recipeCost > scene.alchemyEnergy) {
		scene.say(t('port.log.alchemy.unavailable'), 'negative');
		return;
	}
	let craftedResult: ReturnType<typeof craftPotionSeed>;
	let crafted: boolean;
	if (recipe.id === 'potionSeed') {
		craftedResult = craftPotionSeed(scene.bag, selected.kind === 'seeds' ? selected.units : undefined);
		crafted = craftedResult !== undefined;
		if (craftedResult) scene.bag.add({ id: craftedResult.id, quantity: 1, stackable: true, identified: craftedResult.identified });
	} else if (recipe.id === 'scrollToStone') crafted = craftScrollToStone(scene.bag, selected.kind === 'scroll' ? selected.unit : undefined);
	else if (recipe.id === 'scrollToExotic') crafted = craftScrollToExotic(scene.bag, selected.kind === 'scroll' ? selected.unit : undefined);
	else if (recipe.id === 'potionToExotic') crafted = craftPotionToExotic(scene.bag, selected.kind === 'scroll' ? selected.unit : undefined);
	else if (recipe.id === 'alchemicalCatalyst') crafted = craftAlchemicalCatalyst(scene.bag, selected.kind === 'pair' ? selected : undefined);
	else if (recipe.id === 'arcaneCatalyst') crafted = craftArcaneCatalyst(scene.bag, selected.kind === 'pair' ? selected : undefined);
	else if (recipe.id === 'alchemize') crafted = craftAlchemize(scene.bag, selected.kind === 'alchemize' ? { seed: selected.seed, stone: selected.stone } : undefined);
	else crafted = craftAlchemy(scene.bag, recipe.id);
	if (!crafted) {
		scene.say(t('port.log.alchemy.unavailable'), 'negative');
		return;
	}
	scene.alchemyEnergy -= recipeCost;
	const resultId = craftedResult?.id ?? recipe.result.id;
	const resultIdentified = craftedResult?.identified ?? true;
	scene.say(t('port.log.alchemy.crafted', { item: scene.itemDisplayName(resultId, resultIdentified) }), 'positive');
	scene.refreshInventoryPanel();
}

export function openAlchemyRecipes(scene: AlchemyFlowContext): void {
	const recipes = ALCHEMY_RECIPES.filter((recipe) => recipe.energyCost <= scene.alchemyEnergy && (
		recipe.id === 'potionSeed' ? canCraftPotionSeed(scene.bag) : recipe.id === 'scrollToStone' ? canCraftScrollToStone(scene.bag) : recipe.id === 'scrollToExotic' ? canCraftScrollToExotic(scene.bag) : recipe.id === 'potionToExotic' ? canCraftPotionToExotic(scene.bag) : recipe.id === 'alchemize'
			? scene.bag.items.some((item) => item.quantity > 0 && item.id.startsWith('seed'))
				&& scene.bag.items.some((item) => item.quantity > 0 && item.id.startsWith('stoneOf'))
			: recipe.id === 'alchemicalCatalyst' ? (alchemicalCatalystCost(scene.bag) ?? Infinity) <= scene.alchemyEnergy
			: recipe.id === 'arcaneCatalyst' ? (arcaneCatalystCost(scene.bag) ?? Infinity) <= scene.alchemyEnergy
			: recipe.ingredients.every((ingredient) => {
				const item = scene.bag.find(ingredient.id);
				return (item?.quantity ?? 0) >= ingredient.quantity;
			})
	));
	if (recipes.length === 0) {
		scene.say(t('port.log.alchemy.noingredients'), 'negative');
		return;
	}
	scene.openItemPicker(
		`${t('port.ui.alchemy.title')} [${scene.alchemyEnergy}]`,
		recipes.map((recipe) => ({ id: recipe.result.id, instanceId: recipe.id, identified: true, quantity: recipe.result.quantity })),
		(entry) => {
			const recipe = ALCHEMY_RECIPES.find((candidate) => candidate.id === entry.instanceId);
		if (recipe && startAlchemyIngredientPick(scene, recipe)) return;
			const dynamicCost = recipe?.id === 'alchemicalCatalyst' ? alchemicalCatalystCost(scene.bag) : recipe?.id === 'arcaneCatalyst' ? arcaneCatalystCost(scene.bag) : undefined;
			const recipeCost = dynamicCost ?? recipe?.energyCost ?? Infinity;
			if (!recipe || recipeCost > scene.alchemyEnergy) {
				scene.say(t('port.log.alchemy.unavailable'), 'negative');
				return;
			}
			const potionSeed = recipe?.id === 'potionSeed' ? craftPotionSeed(scene.bag) : undefined;
			const craftedResult = recipe?.id === 'potionSeed' ? potionSeed : undefined;
			if (craftedResult) scene.bag.add({ id: craftedResult.id, quantity: 1, stackable: true, identified: craftedResult.identified });
			const crafted = recipe?.id === 'potionSeed' ? craftedResult !== undefined : recipe?.id === 'scrollToStone' ? craftScrollToStone(scene.bag)
				: recipe?.id === 'scrollToExotic' ? craftScrollToExotic(scene.bag)
				: recipe?.id === 'potionToExotic' ? craftPotionToExotic(scene.bag)
				: recipe?.id === 'alchemicalCatalyst' ? craftAlchemicalCatalyst(scene.bag) : recipe?.id === 'arcaneCatalyst' ? craftArcaneCatalyst(scene.bag)
				: recipe?.id === 'alchemize' ? craftAlchemize(scene.bag) : recipe ? craftAlchemy(scene.bag, recipe.id) : false;
			if (!crafted) {
				scene.say(t('port.log.alchemy.unavailable'), 'negative');
				return;
			}
			scene.alchemyEnergy -= recipeCost;
			const resultId = craftedResult?.id ?? recipe.result.id;
			const resultIdentified = craftedResult?.identified ?? true;
			scene.say(t('port.log.alchemy.crafted', { item: scene.itemDisplayName(resultId, resultIdentified) }), 'positive');
			scene.refreshInventoryPanel();
		},
	);
}
