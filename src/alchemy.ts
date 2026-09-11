import { craft, type Recipe } from 'mwg/actors';
import type { Inventory } from 'mwg/actors';
import { MWL_TRAIT_NODES } from './mwlContent';

export interface AlchemyRecipe extends Recipe {
	readonly id: string;
	readonly energyCost: number;
}

export interface AlchemyRecipeManifestEntry {
	readonly id: string;
	readonly group: 'variable' | 'one' | 'two' | 'three';
	readonly javaRecipe: string;
}

function entriesFor(traitId: string): string[] {
	const trait = MWL_TRAIT_NODES.find((node) => node.attributes.id === traitId);
	if (!trait) throw new Error(`MWL alchemy trait is missing ${traitId}`);
	const effect = trait.children.find((child) => child.tag === 'effect' && child.attributes.apply_to === 'entries');
	if (!effect?.attributes.set) throw new Error(`MWL alchemy trait ${traitId} is missing entries`);
	return effect.attributes.set.split(';').filter(Boolean);
}

export const ALCHEMY_RECIPE_MANIFEST: readonly AlchemyRecipeManifestEntry[] = entriesFor('alchemyRecipeManifest').map((entry) => {
	const [id, group, javaRecipe] = entry.split('|');
	if (!id || !javaRecipe || !['variable', 'one', 'two', 'three'].includes(group ?? '')) throw new Error(`Invalid MWL alchemy manifest entry: ${entry}`);
	return { id, group: group as AlchemyRecipeManifestEntry['group'], javaRecipe };
});
if (new Set(ALCHEMY_RECIPE_MANIFEST.map((recipe) => recipe.id)).size !== ALCHEMY_RECIPE_MANIFEST.length) {
	throw new Error('MWL alchemy recipe manifest contains duplicate ids');
}

export const ALCHEMY_ENERGY: Readonly<Record<string, number>> = Object.fromEntries(
	entriesFor('alchemyEnergy').map((entry) => {
		const [id, energy] = entry.split('|');
		if (!id || !Number.isInteger(Number(energy)) || Number(energy) < 0) throw new Error(`Invalid MWL alchemy energy: ${entry}`);
		return [id, Number(energy)];
	}),
);

export const ALCHEMY_RECIPES: readonly AlchemyRecipe[] = entriesFor('alchemyRecipes').map((entry) => {
	const [id, rawIngredients, resultId, resultQuantity, energyCost] = entry.split('|');
	if (!id || !rawIngredients || !resultId || !Number.isInteger(Number(resultQuantity)) || !Number.isInteger(Number(energyCost))) {
		throw new Error(`Invalid MWL alchemy recipe: ${entry}`);
	}
	const ingredients = rawIngredients.split(',').map((raw) => {
		const [ingredientId, quantity] = raw.split(':');
		if (!ingredientId || !Number.isInteger(Number(quantity)) || Number(quantity) <= 0) throw new Error(`Invalid MWL recipe ingredient: ${raw}`);
		return { id: ingredientId, quantity: Number(quantity) };
	});
	return {
		id,
		ingredients,
		energyCost: Number(energyCost),
		result: { id: resultId, quantity: Number(resultQuantity), stackable: true },
	};
});
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
