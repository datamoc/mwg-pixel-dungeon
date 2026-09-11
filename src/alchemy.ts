import { craft, type Recipe } from 'mwg/actors';
import type { Inventory } from 'mwg/actors';
import { MWL_ITEM_NODES, MWL_TABLE_ROWS } from './mwlContent';

export interface AlchemyRecipe extends Recipe {
	readonly id: string;
	readonly energyCost: number;
}

export interface AlchemyRecipeManifestEntry {
	readonly id: string;
	readonly group: 'variable' | 'one' | 'two' | 'three';
	readonly javaRecipe: string;
}

export const ALCHEMY_RECIPE_MANIFEST: readonly AlchemyRecipeManifestEntry[] = MWL_TABLE_ROWS('alchemyRecipeManifest', 'id').map((row) => {
	const group = String(row.group);
	if (!['variable', 'one', 'two', 'three'].includes(group)) throw new Error(`Invalid MWL alchemy manifest group: ${group}`);
	return { id: String(row.id), group: group as AlchemyRecipeManifestEntry['group'], javaRecipe: String(row.javaRecipe) };
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

/** Returns the authored crystal yield for one item kind, or zero for non-consumables. */
export function alchemyEnergyFor(itemId: string): number {
	return ALCHEMY_ENERGY[itemId] ?? 0;
}

/** Resolves an authored recipe through MWG's all-or-nothing inventory transaction. */
export function craftAlchemy(inventory: Inventory, id: string): boolean {
	const recipe = alchemyRecipe(id);
	return recipe ? craft(inventory, recipe) : false;
}
