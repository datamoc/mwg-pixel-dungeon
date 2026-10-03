import {
	ALCHEMY_RECIPES, alchemyEnergyAvailable, completeAlchemyRecipe, energizeCarriedToolkit, toolkitCanEnergize,
	type AlchemyFlowContext, type AlchemyUnitRef,
} from './alchemy';
import { findAlchemyRecipes, recipeSlots, selectionFor, type AlchemyUnit, type FoundRecipe } from './alchemyFind';
import { t } from '../i18n';
import type { AlchemyWindowView } from '../ui/alchemyWindow';

/**
 * The slot-window flow (`scenes/AlchemyScene.java`, tag `v3.3.8`): up to three carried units sit in input slots, `findAlchemyRecipes` lists
 * every recipe they satisfy as its own result row (Java's combine/output pairs), and crafting a row brews it through the same
 * `completeAlchemyRecipe` tail the old per-recipe pickers used, so energy, identification gates and result announcements are identical.
 *
 * State is just the slot refs; units stay in the bag until the craft consumes them (see `ui/alchemyWindow.ts` for the stated reductions).
 * Java's `Recipe.usableInRecipe()` keeps cursed items out of the window; here a unit is also offered only when some recipe slot could take it.
 */
export interface AlchemySlotsContext extends AlchemyFlowContext {
	/** Draws (replacing any previous draw of) the window for this view. */
	readonly showAlchemyWindow: (view: AlchemyWindowView) => void;
	readonly closeAlchemyWindow: () => void;
	/** The item-sheet frame for a bag id (appearance-aware), as the picker rows use. */
	readonly itemFrame: (id: string) => number | undefined;
}

const MAX_SLOTS = 3;

type BagUnit = AlchemyUnit & { quantity: number; cursed?: boolean };

export function openAlchemySlots(scene: AlchemySlotsContext): void {
	let slots: AlchemyUnitRef[] = [];
	const sameStack = (a: AlchemyUnitRef, b: AlchemyUnitRef): boolean => a.id === b.id && (a.instanceId ?? undefined) === (b.instanceId ?? undefined);
	const bagUnit = (ref: AlchemyUnitRef): BagUnit | undefined => scene.bag.items.find((item) => item.quantity > 0 && sameStack(item, ref)) as BagUnit | undefined;
	const units = (): AlchemyUnit[] => slots.map((ref) => bagUnit(ref)).filter((unit): unit is BagUnit => unit !== undefined);
	const usedOf = (item: AlchemyUnitRef): number => slots.filter((slot) => sameStack(slot, item)).length;
	const acceptable = (unit: AlchemyUnit): boolean => ALCHEMY_RECIPES.some((recipe) => recipeSlots(recipe).some((accepts) => accepts(unit)));

	const found = (): FoundRecipe[] => {
		const current = units();
		//A slot whose stack vanished (a craft consumed it) drops out, like Java's emptied InputButton.
		if (current.length !== slots.length) slots = slots.filter((ref) => bagUnit(ref) !== undefined);
		return findAlchemyRecipes(current);
	};

	const costOf = (match: FoundRecipe): number => match.recipe.energyCost;

	const render = (): void => {
		const matches = found();
		const energyRows = toolkitCanEnergize(scene);
		scene.showAlchemyWindow({
			energy: alchemyEnergyAvailable(scene),
			slots: Array.from({ length: MAX_SLOTS }, (_, index) => {
				const ref = slots[index];
				const unit = ref ? bagUnit(ref) : undefined;
				return unit ? { label: scene.itemDisplayName(unit.id, unit.identified ?? false), frame: scene.itemFrame(unit.id) } : {};
			}),
			results: [
				...matches.map((match) => ({
					label: scene.itemDisplayName(match.recipe.result.id, true) + (match.recipe.result.quantity > 1 ? ` x${match.recipe.result.quantity}` : ''),
					frame: scene.itemFrame(match.recipe.result.id),
					cost: costOf(match),
					affordable: costOf(match) <= alchemyEnergyAvailable(scene),
				})),
				...(energyRows && slots.length === 0 ? [{ label: t('scenes.alchemyscene.energize'), frame: scene.itemFrame('toolkit'), cost: 0, affordable: true }] : []),
			],
			onSlot: (index) => {
				if (slots[index]) { slots.splice(index, 1); render(); return; }
				const rows = scene.bag.items.filter((item) => item.quantity > 0 && !(item as BagUnit).cursed && usedOf(item) < item.quantity && acceptable(item as BagUnit));
				if (rows.length === 0) { scene.say(t('port.log.alchemy.noingredients'), 'negative'); return; }
				scene.openItemPicker(t('scenes.alchemyscene.select'), rows.map((item) => ({ id: item.id, instanceId: item.instanceId, identified: item.identified, quantity: item.quantity - usedOf(item) })), (pick) => {
					if (slots.length < MAX_SLOTS && bagUnit(pick)) slots.push({ id: pick.id, instanceId: pick.instanceId });
					render();
				});
			},
			onCraft: (index) => {
				const match = matches[index];
				if (!match) {
					if (energyRows) { energizeCarriedToolkit(scene); render(); }
					return;
				}
				completeAlchemyRecipe(scene, match.recipe, selectionFor(match));
				slots = [];
				render();
			},
			onClose: () => scene.closeAlchemyWindow(),
		});
	};
	render();
}
