import { Actors } from 'mwg';
import { craft, type Recipe } from 'mwg/actors';
import type { Inventory } from 'mwg/actors';
import { readTableMap, tableKey } from 'mwg/mwl';
import { t } from '../i18n';
import { MWL_CONSUMABLE_CLASS_TO_ID, MWL_ITEM_NODES, MWL_SPECIAL_ITEM_INVENTORY_RULES, MWL_TABLE_ROWS, mwlItemEffectValue } from '../mwlContent';
import { SpdRandom } from '../spdRng';
import { consumeToolkitEnergy, energizeToolkit, toolkitAvailableEnergy } from './artifactActions';
import { Cat, randomUsingDefaults } from './generator';
import { scrapRatioEnergy } from './alchemyRules';

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
	readonly requiresIdentified?: boolean;
	/** narrower than `Recipe`'s `Ingredient[]` so callers keep a plain `string` id */
	readonly ingredients: AlchemyIngredient[];
}

export interface AlchemyRecipeManifestEntry {
	readonly id: string;
	readonly group: 'variable' | 'one' | 'two' | 'three';
	readonly javaRecipe: string;
}

/** Recipe.java's v3.3.8 registration arrays. Bomb subtype rows intentionally alias Java's
 * single `Bomb.EnhanceBomb` class; every other registered Java recipe appears once. */
const JAVA_ALCHEMY_RECIPE_GROUPS: Readonly<Record<string, AlchemyRecipeManifestEntry['group']>> = {
	'Scroll.ScrollToStone': 'one', 'ExoticPotion.PotionToExotic': 'one', 'ExoticScroll.ScrollToExotic': 'one',
	'ArcaneResin.Recipe': 'one', 'LiquidMetal.Recipe': 'one', 'BlizzardBrew.Recipe': 'one',
	'InfernalBrew.Recipe': 'one', 'AquaBrew.Recipe': 'one', 'ShockingBrew.Recipe': 'one',
	'ElixirOfDragonsBlood.Recipe': 'one', 'ElixirOfIcyTouch.Recipe': 'one', 'ElixirOfToxicEssence.Recipe': 'one',
	'ElixirOfMight.Recipe': 'one', 'ElixirOfFeatherFall.Recipe': 'one', 'MagicalInfusion.Recipe': 'one',
	'BeaconOfReturning.Recipe': 'one', 'PhaseShift.Recipe': 'one', 'Recycle.Recipe': 'one',
	'TelekineticGrab.Recipe': 'one', 'SummonElemental.Recipe': 'one', 'StewedMeat.oneMeat': 'one',
	'TrinketCatalyst.Recipe': 'one', 'Trinket.UpgradeTrinket': 'one',
	'Blandfruit.CookFruit': 'two', 'Bomb.EnhanceBomb': 'two', 'UnstableBrew.Recipe': 'two',
	'CausticBrew.Recipe': 'two', 'ElixirOfArcaneArmor.Recipe': 'two', 'ElixirOfAquaticRejuvenation.Recipe': 'two',
	'ElixirOfHoneyedHealing.Recipe': 'two', 'UnstableSpell.Recipe': 'two', 'Alchemize.Recipe': 'two',
	'CurseInfusion.Recipe': 'two', 'ReclaimTrap.Recipe': 'two', 'WildEnergy.Recipe': 'two',
	'StewedMeat.twoMeat': 'two', 'Potion.SeedToPotion': 'three', 'StewedMeat.threeMeat': 'three',
	'MeatPie.Recipe': 'three',
};

export const ALCHEMY_RECIPE_MANIFEST: readonly AlchemyRecipeManifestEntry[] = MWL_TABLE_ROWS('alchemyRecipeManifest', 'id').map((row) => {
	const group = String(row.group);
	if (!['variable', 'one', 'two', 'three'].includes(group)) throw new Error(`Invalid MWL alchemy manifest group: ${group}`);
	return { id: String(row.recipe), group: group as AlchemyRecipeManifestEntry['group'], javaRecipe: String(row.javaRecipe) };
});

const manifestCounts = new Map<string, number>();
for (const manifest of ALCHEMY_RECIPE_MANIFEST) {
	const javaRecipe = manifest.javaRecipe.replace(/\(.+\)$/, '');
	const expectedGroup = JAVA_ALCHEMY_RECIPE_GROUPS[javaRecipe];
	if (!expectedGroup) throw new Error(`Unexpected Java alchemy recipe manifest entry: ${manifest.javaRecipe}`);
	if (manifest.group !== expectedGroup) throw new Error(`Wrong alchemy recipe group for ${manifest.id}: expected ${expectedGroup}, got ${manifest.group}`);
	manifestCounts.set(javaRecipe, (manifestCounts.get(javaRecipe) ?? 0) + 1);
}
for (const javaRecipe of Object.keys(JAVA_ALCHEMY_RECIPE_GROUPS)) {
	const count = manifestCounts.get(javaRecipe) ?? 0;
	if (count === 0) throw new Error(`Java alchemy recipe is missing from the manifest: ${javaRecipe}`);
	if (javaRecipe !== 'Bomb.EnhanceBomb' && count !== 1) throw new Error(`Java alchemy recipe must appear once in the manifest: ${javaRecipe}`);
}

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
		requiresIdentified: row.requiresIdentified === true,
		result: { id: String(row.result), quantity: Number(row.resultQuantity), stackable: true },
	};
});
const MWL_ITEM_IDS = new Set([
	...MWL_ITEM_NODES.map((node) => node.attributes.id),
	//Generated quest props such as Java's `Embers` are mapped to bag ids in item-rules.mwl,
	//not declared as ordinary item nodes; recipes may still consume those real port items.
	...MWL_CONSUMABLE_CLASS_TO_ID.values(),
	...MWL_SPECIAL_ITEM_INVENTORY_RULES.map((rule) => rule.itemId),
]);
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
const KNOWN_ENERGY = readTableMap(MWL_TABLE_ROWS('alchemyKnownEnergy', 'item'), {
	key: (row) => String(row.item).toLowerCase(),
	value: (row) => Number(row.energy),
	duplicate: 'last',
});
const SCALED_ENERGY = readTableMap(MWL_TABLE_ROWS('alchemyScaledEnergy', 'item'), {
	key: (row) => String(row.item).toLowerCase(),
	value: (row) => ({ total: Number(row.total), outputQuantity: Number(row.outputQuantity) }),
	duplicate: 'last',
});

/** `Item.energyVal()` for one carried item: an exact authored row wins, then the item's own
 * consumable kind, else zero (Java's `Item.energyVal()` default). */
export function alchemyEnergyFor(itemId: string, identified: boolean, quantity = 1): number {
	const exact = ALCHEMY_ENERGY[itemId];
	if (exact !== undefined) return exact;
	if (quantity !== 1) {
		// Java evaluates (int)(base * quantity / OUT_QUANTITY) on the scrapped stack.
		const ratio = scrapRatioEnergy(itemId, quantity);
		if (ratio !== undefined) return ratio;
	}
	const scaled = SCALED_ENERGY.get(tableKey(itemId.toLowerCase()));
	// Java's spell energyVal() methods scale total energy by Recipe.OUT_QUANTITY and
	// truncate (`PhaseShift.java:75`, `TelekineticGrab.java:146`, etc.); a picker consumes one.
	if (scaled) return Math.trunc(scaled.total / scaled.outputQuantity);
	const kind = energyKindOf(itemId);
	const base = kind === undefined ? 0 : ALCHEMY_ENERGY[kind] ?? 0;
	const knownEnergy = KNOWN_ENERGY.get(tableKey(itemId.toLowerCase()));
	if (base > 0 && identified && knownEnergy !== undefined) return knownEnergy;
	return base;
}

/** `Recipe.SimpleRecipe.testIngredients()` rejects unidentified ingredients (Recipe.java:99-104). */
export function canCraftAlchemy(inventory: Inventory, id: string): boolean {
	const recipe = alchemyRecipe(id);
	return recipe !== undefined && recipe.ingredients.every((ingredient) => {
		const item = inventory.find(ingredient.id);
		return (item?.quantity ?? 0) >= ingredient.quantity
			&& (!recipe.requiresIdentified || item?.identified !== false);
	});
}

/** Resolves an authored recipe through MWG's all-or-nothing inventory transaction. */
export function craftAlchemy(inventory: Inventory, id: string): boolean {
	const recipe = alchemyRecipe(id);
	if (id === 'meatPie') return craftMeatPie(inventory); // Category slots (R079).
	return recipe && canCraftAlchemy(inventory, id) ? craft(inventory, recipe) : false;
}

export const MEAT_PIE_PASTY_IDS = new Set(['pasty', 'phantomMeat']);
export const MEAT_PIE_MEAT_IDS = new Set(['meat', 'stewedMeat', 'chargrilledMeat', 'frozenCarpaccio']);
export interface MeatPieIngredientSelection {
	readonly pasty: AlchemyUnitRef;
	readonly ration: AlchemyUnitRef;
	readonly meat: AlchemyUnitRef;
}

/** `MeatPie.Recipe.testIngredients()` accepts three item categories, not exact ids
 * (`MeatPie.java:55-78`). Resolve one chosen carried unit from each category atomically. */
export function canCraftMeatPie(inventory: Inventory): boolean {
	return inventory.items.some((item) => item.quantity > 0 && MEAT_PIE_PASTY_IDS.has(item.id))
		&& inventory.items.some((item) => item.quantity > 0 && item.id === 'food')
		&& inventory.items.some((item) => item.quantity > 0 && MEAT_PIE_MEAT_IDS.has(item.id));
}

export function craftMeatPie(inventory: Inventory, selected?: MeatPieIngredientSelection): boolean {
	const choose = (eligible: (item: { id: string }) => boolean, selection?: AlchemyUnitRef): AlchemyUnitRef | undefined => {
		if (selection) return takeChosenUnits(inventory, [selection], eligible)?.[0];
		const item = inventory.items.find((candidate) => candidate.quantity > 0 && eligible(candidate));
		return item ? { id: item.id, instanceId: item.instanceId } : undefined;
	};
	const pasty = choose((item) => MEAT_PIE_PASTY_IDS.has(item.id), selected?.pasty);
	const ration = choose((item) => item.id === 'food', selected?.ration);
	const meat = choose((item) => MEAT_PIE_MEAT_IDS.has(item.id), selected?.meat);
	if (!pasty || !ration || !meat) return false;
	for (const unit of [pasty, ration, meat]) inventory.remove(unit.id, 1, unit.instanceId);
	inventory.add({ id: 'meatPie', quantity: 1, stackable: true });
	return true;
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
	// Java's `Scroll.ScrollToStone.brew()` calls `showIdentify(s)` after consuming an unknown
	// scroll (`Scroll.java:336-342`). Identification is class-level in this port, so update
	// every remaining carried instance of that scroll kind before the selected unit is removed.
	for (const item of inventory.items) if (item.id === scroll.id) Actors.identify(item);
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
 * MirrorImage -> PrismaticImage and Teleportation -> Passage are port items;
 * the other ten values name Java classes with no port id, so they stay out of this
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
	scrollTeleportation: 'scrollPassage',
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
 * Invisibility -> ShroudingFog and Healing -> Shielding exist as port items; the other
 * ten values name Java classes with no port id, so they stay out of this
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
	potionHealing: 'potionShielding',
};

/**
 * The other exotics in the same family as `id` (empty for a regular item or a family of one):
 * `Recycle.onItemSelected()` re-rolls an exotic into a DIFFERENT exotic of its own kind
 * (`ExoticPotion.regToExo`/`ExoticScroll.regToExo`, tag `v3.3.8`), restricted here to the
 * exotics this port has as items.
 */
export function isExoticItemId(id: string): boolean {
	return Object.values(POTION_TO_EXOTIC).includes(id) || Object.values(SCROLL_TO_EXOTIC).includes(id);
}

export function exoticRecycleAlternatives(id: string): string[] {
	for (const table of [POTION_TO_EXOTIC, SCROLL_TO_EXOTIC]) {
		const family = Object.values(table);
		if (family.includes(id)) return family.filter((other) => other !== id);
	}
	return [];
}

export function potionExoticResult(potionId: string): string | undefined {
	return POTION_TO_EXOTIC[potionId];
}

/** `ExoticPotion.regToExo` / `exoToReg` (v3.3.8): an exotic shares its regular class's shuffled appearance. */
export function potionRegularCounterpart(potionId: string): string | undefined {
	return Object.entries(POTION_TO_EXOTIC).find(([, exotic]) => exotic === potionId)?.[0];
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

/** Removed 2026-09-21: `AlchemicalCatalyst`, `ArcaneCatalyst` and `AquaBlast` have no
 * v3.3.8 classes at all (zero Java references, no `Recipe.java` entries, no message keys -
 * v3.3.8 ships `AquaBrew` and `TrinketCatalyst` instead, which are different systems). The
 * potion+seed / scroll+stone catalyst brew paths, their weighted random-effect pools and
 * their drink/cast actions lived here and are deleted, not re-homed. See PORT_COVERAGE.md. */

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
 * chance and three distinct seeds a 1/2 chance to produce a weighted default-deck potion;
 * otherwise the result follows one selected seed. The run's `COOKING_HP` tracker applies
 * Java's Healing reroll and accepted-result count here. Java's placeholder preview remains
 * simplified. */
export interface CraftedPotionSeed {
	readonly id: string;
	readonly identified: boolean;
}

/** Exactly three seed units, explicitly chosen: Java's window adds any three units, so the
 * selection is validated whole (wrong count, a non-seed, or an uncovered unit all fail with
 * nothing consumed) and anything else falls back to the first three eligible units. */
export function craftPotionSeed(
	inventory: Inventory,
	selection: readonly AlchemyUnitRef[] | undefined,
	counter: { cookingHpCount: number },
): CraftedPotionSeed | undefined {
	const units = selection ? selectedSeedUnits(inventory, selection) : seedUnits(inventory);
	if (units.length < 3) return undefined;
	for (const unit of units) inventory.remove(unit.id, 1, unit.instanceId);
	const distinct = new Set(units.map((unit) => unit.potionId)).size;
	const random = (distinct === 2 && SpdRandom.int(4) === 0) || (distinct === 3 && SpdRandom.int(2) === 0);
	let result: string;
	if (random) {
		// Java calls Generator.randomUsingDefaults(POTION): its weighted defaultProbs exclude
		// Strength and give Healing weight 3/15 (`Generator.java:342`). The concrete generated
		// class is resolved through the authored Java-class-to-item table.
		const generated = randomUsingDefaults(Cat.POTION);
		result = MWL_CONSUMABLE_CLASS_TO_ID.get(generated.cls) ?? (() => {
			throw new Error(`No consumable item id for generated potion class ${generated.cls}`);
		})();
	} else {
		const selected = units[SpdRandom.int(units.length)];
		if (!selected) return undefined;
		result = selected.potionId;
	}
	//`Potion.SeedToPotion.brew()` re-rolls generated Healing while Random.Int(10) is less
	//than Dungeon.LimitedDrops.COOKING_HP.count, then counts the accepted Healing result.
	while (result === 'potionHealing' && SpdRandom.int(10) < counter.cookingHpCount) {
		const generated = randomUsingDefaults(Cat.POTION);
		result = MWL_CONSUMABLE_CLASS_TO_ID.get(generated.cls) ?? (() => {
			throw new Error(`No consumable item id for generated potion class ${generated.cls}`);
		})();
	}
	if (result === 'potionHealing') counter.cookingHpCount++;
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
	/** Run-scoped `Dungeon.LimitedDrops.COOKING_HP.count`, persisted with the run. */
	cookingHpCount: number;
	/** Toolkit-brew session: `AlchemistsToolkit.execute(AC_BREW)` assigns the toolkit
	 * (`AlchemyScene.assignToolkit`, tag `v3.3.8`) before opening the scene, while a
	 * physical `AlchemyPot` never does - so only then do the carried toolkit's banked
	 * charge count toward costs and pay. Set post-construction by the `AC_BREW` adapter. */
	viaToolkit: boolean;
	/** `Talent.onArtifactUsed(hero)` (tag `v3.3.8`): fired when a toolkit session spends
	 * banked charge (this port arms its EnhancedRings leg there). */
	readonly onArtifactUsed: () => void;
	readonly say: (line: string, level?: 'info' | 'positive' | 'negative' | 'warning') => void;
	readonly openItemPicker: (
		title: string,
		entries: { id: string; instanceId?: string; identified?: boolean; quantity: number; note?: string }[],
		onPick: (entry: { id: string; instanceId?: string }) => void,
	) => void;
	readonly itemDisplayName: (id: string, identified: boolean) => string;
	readonly refreshInventoryPanel: () => void;
	readonly magicImmune?: boolean;
	/** The slot window (`items/alchemySlots.ts`, R012): when the scene supplies it, `openAlchemyRecipes` opens it instead of the recipe picker. */
	readonly openAlchemySlots?: () => void;
}

export function alchemyEnergyAvailable(scene: AlchemyFlowContext): number {
	return scene.alchemyEnergy + (scene.viaToolkit ? toolkitAvailableEnergy({ bag: scene.bag }) : 0);
}

function spendAlchemyEnergy(scene: AlchemyFlowContext, cost: number): boolean {
	if (cost > alchemyEnergyAvailable(scene)) return false;
	const remainder = scene.viaToolkit ? consumeToolkitEnergy({ bag: scene.bag }, cost) : cost;
	if (scene.viaToolkit && scene.bag.find('toolkit')) scene.onArtifactUsed();
	scene.alchemyEnergy -= remainder;
	return true;
}

/** One explicitly picked carried unit (potionSeed: three seeds; scroll/stone/exotic: one
 *  unit; alchemize: a seed/stone pair) - Java's alchemy window adds specific items, while
 *  the recipe picker only names the recipe, so category recipes resolve these after a
 *  follow-up pick. */
export type AlchemyIngredientSelection =
	| { kind: 'seeds'; units: AlchemyUnitRef[] }
	| { kind: 'scroll'; unit: AlchemyUnitRef }
	| { kind: 'meatPie'; ingredients: MeatPieIngredientSelection }
	| { kind: 'alchemize'; seed: AlchemyUnitRef; stone: AlchemyUnitRef }
	/** exact-id recipes: the bag transaction takes the authored ingredients by id */
	| { kind: 'exact' };

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
	if (recipe.id === 'meatPie') {
		pickAlchemyUnits(scene, chooseTitle, (item) => MEAT_PIE_PASTY_IDS.has(item.id), 1, [], (pasty) => {
			pickAlchemyUnits(scene, chooseTitle, (item) => item.id === 'food', 1, [], (ration) => {
				pickAlchemyUnits(scene, chooseTitle, (item) => MEAT_PIE_MEAT_IDS.has(item.id), 1, [], (meat) => completeAlchemyRecipe(scene, recipe, {
					kind: 'meatPie', ingredients: { pasty: pasty[0]!, ration: ration[0]!, meat: meat[0]! },
				}));
			});
		});
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
	const recipeCost = recipe.energyCost;
	if (recipeCost > alchemyEnergyAvailable(scene)) {
		scene.say(t('port.log.alchemy.unavailable'), 'negative');
		return;
	}
	let craftedResult: ReturnType<typeof craftPotionSeed>;
	let crafted: boolean;
	if (recipe.id === 'potionSeed') {
		craftedResult = craftPotionSeed(scene.bag, selected.kind === 'seeds' ? selected.units : undefined, scene);
		crafted = craftedResult !== undefined;
		if (craftedResult) scene.bag.add({ id: craftedResult.id, quantity: 1, stackable: true, identified: craftedResult.identified });
	} else if (recipe.id === 'scrollToStone') crafted = craftScrollToStone(scene.bag, selected.kind === 'scroll' ? selected.unit : undefined);
	else if (recipe.id === 'meatPie') crafted = craftMeatPie(scene.bag, selected.kind === 'meatPie' ? selected.ingredients : undefined);
	else if (recipe.id === 'scrollToExotic') crafted = craftScrollToExotic(scene.bag, selected.kind === 'scroll' ? selected.unit : undefined);
	else if (recipe.id === 'potionToExotic') crafted = craftPotionToExotic(scene.bag, selected.kind === 'scroll' ? selected.unit : undefined);
	else if (recipe.id === 'alchemize') crafted = craftAlchemize(scene.bag, selected.kind === 'alchemize' ? { seed: selected.seed, stone: selected.stone } : undefined);
	else crafted = craftAlchemy(scene.bag, recipe.id);
	if (!crafted) {
		scene.say(t('port.log.alchemy.unavailable'), 'negative');
		return;
	}
	if (!spendAlchemyEnergy(scene, recipeCost)) return;
	//The authored scrollToStone/scrollToExotic/potionToExotic rows carry one representative result; the brewed class depends on the chosen unit,
	//so the log names the real product (the slot window made this visible: a Mirror Image scroll announced a Stone of Intuition).
	const chosenScroll = selected.kind === 'scroll' ? selected.unit.id : undefined;
	const mappedResult = chosenScroll === undefined ? undefined
		: recipe.id === 'scrollToStone' ? SCROLL_TO_STONE[chosenScroll]
		: recipe.id === 'scrollToExotic' ? scrollExoticResult(chosenScroll)
		: recipe.id === 'potionToExotic' ? potionExoticResult(chosenScroll) : undefined;
	const resultId = craftedResult?.id ?? mappedResult ?? recipe.result.id;
	const resultIdentified = craftedResult?.identified ?? true;
	scene.say(t('port.log.alchemy.crafted', { item: scene.itemDisplayName(resultId, resultIdentified) }), 'positive');
	scene.refreshInventoryPanel();
}

/** Whether the carried Alchemist's Toolkit can take `energizeCost` from the pool right now (`AlchemistsToolkit.AC_ENERGIZE`). */
export function toolkitCanEnergize(scene: AlchemyFlowContext): boolean {
	const toolkit = scene.bag.find('toolkit');
	return toolkit !== undefined && !toolkit.cursed && scene.magicImmune !== true
		&& (toolkit.level ?? 0) < mwlItemEffectValue('toolkit', 'levelCap')
		&& scene.alchemyEnergy >= mwlItemEffectValue('toolkit', 'energizeCost');
}

/** The energize action itself: moves pool energy into the toolkit's own charge. */
export function energizeCarriedToolkit(scene: AlchemyFlowContext): void {
	const cost = energizeToolkit({ bag: scene.bag }, scene.alchemyEnergy, scene.magicImmune === true);
	if (cost <= 0) { scene.say(t('port.log.alchemy.unavailable'), 'negative'); return; }
	scene.alchemyEnergy -= cost;
	scene.say(t('items.artifacts.alchemiststoolkit.ac_energize'), 'positive');
	scene.refreshInventoryPanel();
}

export function openAlchemyRecipes(scene: AlchemyFlowContext): void {
	if (scene.openAlchemySlots) { scene.openAlchemySlots(); return; }
	const availableEnergy = alchemyEnergyAvailable(scene);
	const recipes = ALCHEMY_RECIPES.filter((recipe) => recipe.energyCost <= availableEnergy && (
		recipe.id === 'potionSeed' ? canCraftPotionSeed(scene.bag) : recipe.id === 'meatPie' ? canCraftMeatPie(scene.bag) : recipe.id === 'scrollToStone' ? canCraftScrollToStone(scene.bag) : recipe.id === 'scrollToExotic' ? canCraftScrollToExotic(scene.bag) : recipe.id === 'potionToExotic' ? canCraftPotionToExotic(scene.bag) : recipe.id === 'alchemize'
			? scene.bag.items.some((item) => item.quantity > 0 && item.id.startsWith('seed'))
				&& scene.bag.items.some((item) => item.quantity > 0 && item.id.startsWith('stoneOf'))
			: canCraftAlchemy(scene.bag, recipe.id)
	));
	const canEnergize = toolkitCanEnergize(scene);
	if (recipes.length === 0 && !canEnergize) {
		scene.say(t('port.log.alchemy.noingredients'), 'negative');
		return;
	}
	// Java's `SeedToPotion.sampleOutput()` shows a nonfunctional potion placeholder
	// (`Potion.java:549+`); this port displays the authored result row in its recipe picker.
	scene.openItemPicker(
		`${t('port.ui.alchemy.title')} [${availableEnergy}]`,
		[...recipes.map((recipe) => ({ id: recipe.result.id, instanceId: recipe.id, identified: true, quantity: recipe.result.quantity })),
			...(canEnergize ? [{ id: 'toolkit', instanceId: 'toolkit-energize', identified: true, quantity: 1 }] : [])],
		(entry) => {
			if (entry.instanceId === 'toolkit-energize') {
				energizeCarriedToolkit(scene);
				return;
			}
			const recipe = ALCHEMY_RECIPES.find((candidate) => candidate.id === entry.instanceId);
		if (recipe && startAlchemyIngredientPick(scene, recipe)) return;
			const recipeCost = recipe?.energyCost ?? Infinity;
			if (!recipe || recipeCost > alchemyEnergyAvailable(scene)) {
				scene.say(t('port.log.alchemy.unavailable'), 'negative');
				return;
			}
			const potionSeed = recipe?.id === 'potionSeed' ? craftPotionSeed(scene.bag, undefined, scene) : undefined;
			const craftedResult = recipe?.id === 'potionSeed' ? potionSeed : undefined;
			if (craftedResult) scene.bag.add({ id: craftedResult.id, quantity: 1, stackable: true, identified: craftedResult.identified });
			const crafted = recipe?.id === 'potionSeed' ? craftedResult !== undefined : recipe?.id === 'scrollToStone' ? craftScrollToStone(scene.bag)
				: recipe?.id === 'scrollToExotic' ? craftScrollToExotic(scene.bag)
				: recipe?.id === 'potionToExotic' ? craftPotionToExotic(scene.bag)
				: recipe?.id === 'alchemize' ? craftAlchemize(scene.bag) : recipe ? craftAlchemy(scene.bag, recipe.id) : false;
			if (!crafted) {
				scene.say(t('port.log.alchemy.unavailable'), 'negative');
				return;
			}
			if (!spendAlchemyEnergy(scene, recipeCost)) return;
			const resultId = craftedResult?.id ?? recipe.result.id;
			const resultIdentified = craftedResult?.identified ?? true;
			scene.say(t('port.log.alchemy.crafted', { item: scene.itemDisplayName(resultId, resultIdentified) }), 'positive');
			scene.refreshInventoryPanel();
		},
	);
}
