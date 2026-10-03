import { isTrinketId, canUpgradeTrinket } from '../simulation/trinkets';
import { isPlainFruit } from './blandfruit';
import {
	ALCHEMY_RECIPES, MEAT_PIE_MEAT_IDS, MEAT_PIE_PASTY_IDS, SCROLL_TO_STONE, potionExoticResult, scrollExoticResult, seedPotionId,
	type AlchemyIngredientSelection, type AlchemyRecipe,
} from './alchemy';

/**
 * `Recipe.findRecipe(ArrayList<Item> ingredients)` (`items/Recipe.java`, tag `v3.3.8`): the alchemy window's live recipe lookup over the units
 * sitting in its (at most three) input slots. Java walks its `oneIngredientRecipes` / `twoIngredientRecipes` / `threeIngredientRecipes` arrays
 * for the slot count and returns the first whose `testIngredients()` passes; every Java test is order-independent, so a recipe here is a list
 * of slot predicates and a unit set matches when the units can be assigned to the predicates one-to-one (n <= 3, so plain backtracking).
 *
 * Exact-id recipes expand their authored `id:quantity` ingredients into one predicate per unit (and, where Java's `SimpleRecipe.testIngredients()`
 * demands it, an identified unit - `Recipe.java:99-104`). The category recipes carry the predicates `startAlchemyIngredientPick` already used,
 * so the window and the old one-picker-per-unit flow can never disagree about what a recipe accepts.
 *
 * `Recipe.findRecipes` returns EVERY recipe the units satisfy (a plain scroll satisfies both ScrollToStone and ScrollToExotic, and
 * `AlchemyScene.updateState()` gives each its own combine/output button pair), so this does too, in authored order.
 *
 * Simplified: the per-recipe Java classes are not modelled as objects, only their `testIngredients()` predicates; Java's `usableInRecipe()`
 * (no cursed items) is applied by the caller that lists which carried units the window may offer.
 */
export interface AlchemyUnit {
	readonly id: string;
	readonly instanceId?: string;
	readonly identified?: boolean;
	readonly level?: number;
	readonly potionAttrib?: string;
	readonly sourceClass?: string;
}

type SlotPredicate = (unit: AlchemyUnit) => boolean;

const isStone = (unit: AlchemyUnit): boolean => unit.id === 'stone' || unit.id.startsWith('stoneOf');

/** The slot predicates of one recipe: one per consumed unit. */
export function recipeSlots(recipe: AlchemyRecipe): readonly SlotPredicate[] {
	switch (recipe.id) {
		case 'potionSeed': return [1, 2, 3].map(() => (unit: AlchemyUnit) => seedPotionId(unit) !== undefined);
		case 'scrollToStone': return [(unit) => SCROLL_TO_STONE[unit.id] !== undefined];
		case 'scrollToExotic': return [(unit) => scrollExoticResult(unit.id) !== undefined];
		case 'potionToExotic': return [(unit) => potionExoticResult(unit.id) !== undefined];
		case 'meatPie': return [(unit) => MEAT_PIE_PASTY_IDS.has(unit.id), (unit) => unit.id === 'food', (unit) => MEAT_PIE_MEAT_IDS.has(unit.id)];
		case 'alchemize': return [(unit) => unit.id.startsWith('seed'), (unit) => unit.id.startsWith('stoneOf')];
		case 'blandfruit': return [(unit) => isPlainFruit({ id: unit.id, potionAttrib: unit.potionAttrib }), (unit) => seedPotionId(unit) !== undefined];
		case 'unstableSpell': return [(unit) => unit.id.startsWith('scroll'), isStone];
		case 'upgradeTrinket': return [(unit) => isTrinketId(unit.id) && canUpgradeTrinket(unit.level ?? 0)];
		default: break;
	}
	const slots: SlotPredicate[] = [];
	for (const ingredient of recipe.ingredients) {
		for (let n = 0; n < ingredient.quantity; n++) {
			slots.push((unit) => unit.id === ingredient.id && (!recipe.requiresIdentified || unit.identified !== false));
		}
	}
	return slots;
}

/** One-to-one assignment of `units` to `slots`; returns the unit chosen for each slot, in slot order. */
function assign(slots: readonly SlotPredicate[], units: readonly AlchemyUnit[]): AlchemyUnit[] | undefined {
	if (slots.length !== units.length) return undefined;
	const used = new Array<boolean>(units.length).fill(false);
	const chosen: AlchemyUnit[] = [];
	const place = (slot: number): boolean => {
		if (slot === slots.length) return true;
		for (let index = 0; index < units.length; index++) {
			if (used[index] || !slots[slot]!(units[index]!)) continue;
			used[index] = true;
			chosen[slot] = units[index]!;
			if (place(slot + 1)) return true;
			used[index] = false;
		}
		return false;
	};
	return place(0) ? chosen : undefined;
}

export interface FoundRecipe {
	readonly recipe: AlchemyRecipe;
	/** The slot units in the recipe's own slot order (`slots[i]` satisfies the i-th predicate). */
	readonly slots: readonly AlchemyUnit[];
}

/** `Recipe.findRecipes`: every authored recipe the given units (1-3 of them) satisfy exactly, in authored order. */
export function findAlchemyRecipes(units: readonly AlchemyUnit[]): FoundRecipe[] {
	if (units.length < 1 || units.length > 3) return [];
	const found: FoundRecipe[] = [];
	for (const recipe of ALCHEMY_RECIPES) {
		const slots = assign(recipeSlots(recipe), units);
		if (slots) found.push({ recipe, slots });
	}
	return found;
}

/** The selection `completeAlchemyRecipe` consumes for a found recipe; exact-id recipes name no unit (the bag transaction takes them by id). */
export function selectionFor(found: FoundRecipe): AlchemyIngredientSelection {
	const ref = (unit: AlchemyUnit) => ({ id: unit.id, instanceId: unit.instanceId });
	const [first, second, third] = found.slots;
	switch (found.recipe.id) {
		case 'potionSeed': return { kind: 'seeds', units: found.slots.map(ref) };
		case 'scrollToStone': case 'scrollToExotic': case 'potionToExotic': return { kind: 'scroll', unit: ref(first!) };
		case 'meatPie': return { kind: 'meatPie', ingredients: { pasty: ref(first!), ration: ref(second!), meat: ref(third!) } };
		case 'alchemize': return { kind: 'alchemize', seed: ref(first!), stone: ref(second!) };
		case 'blandfruit': return { kind: 'cookFruit', fruit: ref(first!), seed: ref(second!) };
		case 'unstableSpell': return { kind: 'unstableSpell', scroll: ref(first!), stone: ref(second!) };
		default: return { kind: 'exact' };
	}
}
