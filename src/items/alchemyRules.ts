/**
 * Pure alchemy rules split out of `alchemy.ts` (R076-R081, 2026-09-29): the identified-ingredient
 * gate, the `MeatPie` class predicates, `SeedToPotion`'s weighted random branch with the
 * `COOKING_HP` limiter, and the scrap-energy quantity ratio. Nothing here touches the scene; the
 * flow in `alchemy.ts` and the headless tests both call these directly.
 */
import { Random } from 'mwg';
import { type Ingredient, type Inventory, type InventoryItem, type Recipe } from 'mwg/actors';
import { readTableMap, tableKey } from 'mwg/mwl';
import { MWL_TABLE_ROWS } from '../mwlContent';

/** A recipe as authored in `alchemy.mwl`: exact-id ingredients, one result. */
export interface RuleRecipe {
	readonly id: string;
	readonly ingredients: readonly { readonly id: string; readonly quantity: number }[];
	readonly result: Recipe['result'];
}

/**
 * `Recipe.SimpleRecipe.testIngredients` (tag `v3.3.8`, `Recipe.java`): `if
 * (!ingredient.isIdentified()) return false;` for every ingredient, and `Bomb.EnhanceBomb`
 * repeats the check. In Java only potions and scrolls can be unidentified (`Potion.isIdentified()`
 * / `Scroll.isIdentified()` are `isKnown()`; meat, seeds' recipes, goo, shards, embers and bombs
 * are always identified), so the port applies the gate to the `potion*`/`scroll*` ids only and
 * reads the bag stack's own `identified` flag - the port's per-stack model of "known"
 * (`StoneOfIntuition` derives class knowledge from the same flag).
 */
export function isGatedIngredientId(id: string): boolean {
	return id.startsWith('potion') || id.startsWith('scroll');
}

export function ingredientIdentified(item: { id: string; identified?: boolean }): boolean {
	return !isGatedIngredientId(item.id) || item.identified === true;
}

/** `MeatPie.Recipe.testIngredients` (`items/food/MeatPie.java`, tag `v3.3.8`): slot classes are
 * `Pasty`/`PhantomMeat`, exactly `Food` (the plain ration - not `SmallRation` or `Berry`, whose
 * `getClass()` differs) and any of `MysteryMeat`/`StewedMeat`/`ChargrilledMeat`/`FrozenCarpaccio`.
 * The authored MWL row keeps the catalogue-valid `pasty,food,meat` triple; the transaction widens
 * each slot here. */
export const MEAT_PIE_SLOTS: readonly (readonly string[])[] = [
	['pasty', 'phantomMeat'],
	['food'],
	['meat', 'stewedMeat', 'chargrilledMeat', 'frozenCarpaccio'],
];

/** Ingredients whose MWL row is a placeholder for a family the transaction resolves itself. */
const FAMILY_SLOTS: Readonly<Record<string, readonly (readonly string[])[]>> = { meatPie: MEAT_PIE_SLOTS };

/**
 * Builds the MWG `craft()` recipe for an authored row: each ingredient becomes a predicate
 * (`matches`) so `craft()` keeps its all-or-nothing, working-copy allocation while the identified
 * gate (R077) and the `MeatPie` families (R079) are applied to the candidate stacks.
 */
export function resolvableRecipe(recipe: RuleRecipe): Recipe {
	const slots = FAMILY_SLOTS[recipe.id];
	const ingredients: Ingredient[] = slots
		? slots.map((ids) => ({ matches: (item: InventoryItem) => ids.includes(item.id) && ingredientIdentified(item), quantity: 1 }))
		: recipe.ingredients.map((ingredient) => ({
			matches: (item: InventoryItem) => item.id === ingredient.id && ingredientIdentified(item),
			quantity: ingredient.quantity,
		}));
	return { ingredients, result: recipe.result };
}

/** Whether `craft()` would resolve the recipe right now, without touching the bag (the same
 * working-copy allocation `craft()` runs first, so two slots never count one stack twice). */
export function canResolveRecipe(inventory: Inventory, recipe: RuleRecipe): boolean {
	const resolved = resolvableRecipe(recipe);
	const available = new Map<InventoryItem, number>();
	for (const item of inventory.items) available.set(item, item.quantity);
	for (const ingredient of resolved.ingredients) {
		let needed = ingredient.quantity;
		for (const item of inventory.items) {
			if (needed <= 0) break;
			const held = available.get(item) ?? 0;
			if (held <= 0 || !ingredient.matches?.(item)) continue;
			const take = Math.min(held, needed);
			available.set(item, held - take);
			needed -= take;
		}
		if (needed > 0) return false;
	}
	return true;
}

/**
 * `Generator.Category.POTION.classes` / `defaultProbs` (tag `v3.3.8`, `items/Generator.java:329-342`):
 * `{0,3,2,1,2,1,1,1,1,1,1,1}` over Strength, Healing, MindVision, Frost, LiquidFlame, ToxicGas,
 * Haste, Invisibility, Levitation, ParalyticGas, Purity, Experience. Kept as its own table rather
 * than reading `generator.ts`'s `POTION_DECK`, which is level-generation stream state (and whose
 * authored weights differ from the Java array quoted above - reported, not touched here).
 */
export const POTION_DEFAULT_CLASSES = [
	'potionStrength', 'potionHealing', 'potionMindVision', 'potionFrost', 'potionFlame', 'potionToxicGas',
	'potionHaste', 'potionInvis', 'potionLevitation', 'potionParalyticGas', 'potionPurity', 'potionExperience',
] as const;
export const POTION_DEFAULT_PROBS: readonly number[] = [0, 3, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1];

/** `Generator.randomUsingDefaults(Category.POTION)`: one weighted draw over `defaultProbs`. Java's
 * `ExoticCrystals.consumableExoticChance()` swap to the exotic twin is exactly 0 without the
 * trinket, which this port does not have (`items/wealthDrops.ts` records the same), so it is
 * omitted. */
export function randomDefaultPotion(): string {
	return POTION_DEFAULT_CLASSES[Random.weighted(POTION_DEFAULT_PROBS) ?? 1]!;
}

/** `Dungeon.LimitedDrops.COOKING_HP`: a run-long count of Healing potions produced by
 * `SeedToPotion` (the scene persists it beside the alchemy energy pool). */
export interface CookingHpCounter {
	count: number;
}

/**
 * The result roll of `Potion.SeedToPotion.brew()` (tag `v3.3.8`): with two distinct seed kinds a
 * 1/4 chance and with three a 1/2 chance the result is `Generator.randomUsingDefaults(POTION)`,
 * otherwise the potion of one uniformly chosen ingredient; then, while the result is Healing and
 * `Random.Int(10) < COOKING_HP.count`, it is re-rolled with `randomUsingDefaults`, and a Healing
 * that survives increments the counter. `potionIds` are the three ingredients' potion ids.
 */
export function rollSeedToPotion(potionIds: readonly string[], cooking: CookingHpCounter): string {
	const distinct = new Set(potionIds).size;
	const randomBranch = (distinct === 2 && Random.int(0, 4) === 0) || (distinct === 3 && Random.int(0, 2) === 0);
	let result = randomBranch ? randomDefaultPotion() : potionIds[Random.int(0, potionIds.length)]!;
	while (result === 'potionHealing' && Random.int(0, 10) < cooking.count) result = randomDefaultPotion();
	if (result === 'potionHealing') cooking.count++;
	return result;
}

/**
 * Scrap value of `quantity` units of a spell whose Java `energyVal()` is
 * `(int)(base * (quantity / (float) Recipe.OUT_QUANTITY))` - evaluated on the quantity, like Java
 * (the truncation is on the stack, not per unit).
 */
const SCRAP_RATIO = readTableMap(MWL_TABLE_ROWS('alchemyScrapRatio', 'item'), {
	key: (row) => String(row.item),
	value: (row) => ({ base: Number(row.base), out: Number(row.outQuantity) }),
});

export function scrapRatioEnergy(itemId: string, quantity: number): number | undefined {
	const ratio = SCRAP_RATIO.get(tableKey(itemId));
	return ratio === undefined ? undefined : Math.trunc(ratio.base * (quantity / ratio.out));
}
