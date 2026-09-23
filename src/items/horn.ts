/**
 * Horn of Plenty's meal flow, split out of the scene so it can be checked without a live
 * game - the same split `items/sandals.ts`, `items/talisman.ts` and `items/chains.ts` use.
 * Every rule here is `HornOfPlenty.java` (tag `v3.3.8`); the scene owns the hunger pool, the
 * pickers, the meal-talent reads and the turn cost.
 *
 * The flow itself (`useHorn`'s eat/snack/store rows, the meal, the food store) lives here too,
 * behind `HornFlowContext` - the file-size refactor's eleventh extraction, behavior-identical.
 */
import { isChallengeEnabled } from '../challenges';
import { MWL_CONSUMABLE_STATS, mwlItemEffectValue } from '../mwlContent';
import { HUNGRY, STARVING } from '../simulation/hunger';

export type HornItem = {
	level?: number;
	charge?: number;
	partialCharge?: number;
	cursed?: boolean;
	storedFoodEnergy?: number;
};

/** The foods the horn accepts, as `storeFoodInHorn` lists them. */
const HORN_FOOD_IDS = ['food', 'smallRation', 'berry', 'supplyRation', 'phantomMeat', 'meat', 'chargrilledMeat', 'stewedMeat', 'meatPie', 'pasty'];

/** `HornOfPlenty`'s charge cap: `chargeCapBase + floor(level/2)`. */
export function hornChargeCap(horn: { level?: number }): number {
	return mwlItemEffectValue('horn', 'chargeCapBase') + Math.floor((horn.level ?? 0) / 2);
}

/** The meal's satiety per charge: `STARVING/satietyDivisor`, third under `no_food`. */
export function hornSatietyPerCharge(): number {
	const base = STARVING / mwlItemEffectValue('horn', 'satietyDivisor');
	return isChallengeEnabled('no_food') ? base / 3 : base;
}

/**
 * The Horn of Plenty's window flow, moved out of the scene behind this context the way the
 * sandals, talisman and chains flows moved before it - behavior-identical, with the scene
 * keeping one builder plus the `useHorn` adapter the item-use router calls. The `t` field is
 * deliberately named `t` (bound to the real one) so the `t('...')` key audits keep matching
 * these call sites.
 */
export interface HornFlowContext {
	readonly magicImmune: boolean;
	hornOf(instanceId?: string): HornItem | undefined;
	openPicker(title: string, entries: { id: string; instanceId?: string; identified: boolean; quantity: number }[], onPick: (entry: { id: string; instanceId?: string }) => void): void;
	carriedFoods(): { id: string; instanceId?: string; quantity: number; identified: boolean }[];
	findFood(id: string, instanceId?: string): { quantity: number } | undefined;
	consumeFood(id: string, instanceId?: string): void;
	get hunger(): number;
	set hunger(value: number);
	applyMealEaten(): number;
	showHeal(amount: number): void;
	hasFastEating(): boolean;
	armEnhancedRings(): void;
	spendTurn(cost: number): void;
	say(line: string, level?: 'info' | 'positive' | 'negative' | 'warning'): void;
	t(key: string, params?: Record<string, string | number>): string;
}

/** `HornOfPlenty.actions()`'s eat/snack/store rows (`horn-eat`/`horn-snack`/`horn-store`
 *  synthetic instance ids, the same trick the beacon rows use). */
export function useHornFlow(ctx: HornFlowContext, instanceId?: string): void {
	const horn = ctx.hornOf(instanceId);
	if (!horn || ctx.magicImmune) return;
	const chargeCap = hornChargeCap(horn);
	const charge = Math.min(chargeCap, horn.charge ?? 0);
	const canStore = !horn.cursed && (horn.level ?? 0) < mwlItemEffectValue('horn', 'levelCap');
	const eatEntry = 'horn-eat', snackEntry = 'horn-snack', storeEntry = 'horn-store';
	const entries = [
		...(charge > 0 ? [{ id: 'horn', instanceId: eatEntry, identified: true, quantity: 1 }] : []),
		...(charge > 0 ? [{ id: 'horn', instanceId: snackEntry, identified: true, quantity: 1 }] : []),
		...(canStore ? [{ id: 'horn', instanceId: storeEntry, identified: true, quantity: 1 }] : []),
	];
	if (entries.length === 0) { ctx.say(ctx.t('items.artifacts.hornofplenty.no_food'), 'negative'); return; }
	ctx.openPicker(ctx.t('items.artifacts.hornofplenty.name'), entries, (entry) => {
		if (entry.instanceId === eatEntry) eatFromHornFlow(ctx, instanceId, true);
		else if (entry.instanceId === snackEntry) eatFromHornFlow(ctx, instanceId, false);
		else if (entry.instanceId === storeEntry) storeFoodInHornFlow(ctx, instanceId);
	});
}

/** `HornOfPlenty.doEat` plus `doEatEffect`: spend charges for satiety, fire the meal. */
export function eatFromHornFlow(ctx: HornFlowContext, instanceId: string | undefined, fillToFull: boolean): void {
	const horn = ctx.hornOf(instanceId);
	if (!horn) return;
	const charge = horn.charge ?? 0;
	if (charge <= 0) { ctx.say(ctx.t('items.artifacts.hornofplenty.no_food'), 'negative'); return; }
	const satietyPerCharge = hornSatietyPerCharge();
	const chargesToUse = fillToFull
		? Math.min(charge, Math.max(1, Math.floor(ctx.hunger / satietyPerCharge)))
		: 1;
	ctx.hunger = Math.max(0, ctx.hunger - satietyPerCharge * chargesToUse);
	horn.charge = charge - chargesToUse;
	ctx.say(ctx.t('items.artifacts.hornofplenty.eat'), 'positive');
	//`HornOfPlenty.doEatEffect` (tag `v3.3.8`): the meal fires `Talent.onFoodEaten`
	//(the shared `applyMealEatenEffects`, base heal 0 - the horn grants satiety, not
	//HP) and `Talent.onArtifactUsed`, then spends `Food.TIME_TO_EAT` (3, or 1 with a
	//fast-eating meal talent). The meal talents and the whole turn were missing here.
	const hornMealHeal = ctx.applyMealEaten();
	if (hornMealHeal > 0) ctx.showHeal(hornMealHeal);
	ctx.armEnhancedRings();
	ctx.spendTurn(ctx.hasFastEating() ? 1 : 3);
}

/**
 * `SpiritForm.applyActiveArtifactEffect(HornOfPlenty)` (tag `v3.3.8`): Trinity's synthetic horn
 * runs `doEatEffect(hero, 1)` directly - one charge's satiety (`STARVING/5`, a third under
 * `no_food`) with the meal talents and the full `TIME_TO_EAT` turn, but no horn behind it, so
 * there is no charge to spend or store (`charge -= 1` lands on a throwaway instance). The
 * armor's own charge cost is the caller's gate. Same tail as `eatFromHornFlow`.
 */
export function eatTrinityHornFlow(ctx: HornFlowContext): void {
	ctx.hunger = Math.max(0, ctx.hunger - hornSatietyPerCharge());
	ctx.say(ctx.t('items.artifacts.hornofplenty.eat'), 'positive');
	const mealHeal = ctx.applyMealEaten();
	if (mealHeal > 0) ctx.showHeal(mealHeal);
	ctx.armEnhancedRings();
	ctx.spendTurn(ctx.hasFastEating() ? 1 : 3);
}

/** The store picker: feed carried food into stored energy, leveling every full belly. */
export function storeFoodInHornFlow(ctx: HornFlowContext, instanceId?: string): void {
	const horn = ctx.hornOf(instanceId);
	if (!horn) return;
	const candidates = ctx.carriedFoods()
		.filter((item) => item.quantity > 0 && HORN_FOOD_IDS.includes(item.id));
	if (candidates.length === 0) { ctx.say(ctx.t('port.log.nothingtoeat'), 'negative'); return; }
	ctx.openPicker(ctx.t('items.artifacts.hornofplenty.prompt'), candidates, (pick) => {
		const horn = ctx.hornOf(instanceId);
		if (!horn) return;
		const food = ctx.findFood(pick.id, pick.instanceId);
		if (!food || food.quantity <= 0) return;
		const levelCap = mwlItemEffectValue('horn', 'levelCap');
		const level = horn.level ?? 0;
		if (level >= levelCap) return;
		let energy = MWL_CONSUMABLE_STATS[pick.id]?.hunger ?? 0;
		if (pick.id === 'pasty' || pick.id === 'phantomMeat') energy += HUNGRY * mwlItemEffectValue('horn', 'pastyBonusFraction');
		else if (pick.id === 'meatPie') energy += HUNGRY * mwlItemEffectValue('horn', 'meatPieBonusFraction');
		ctx.consumeFood(pick.id, pick.instanceId);
		let storedFoodEnergy = (horn.storedFoodEnergy ?? 0) + energy;
		const upgrades = Math.min(Math.floor(storedFoodEnergy / HUNGRY), levelCap - level);
		if (upgrades > 0) {
			horn.level = level + upgrades;
			storedFoodEnergy -= upgrades * HUNGRY;
			if (horn.level >= levelCap) {
				storedFoodEnergy = 0;
				ctx.say(ctx.t('items.artifacts.hornofplenty.maxlevel'), 'positive');
			} else {
				ctx.say(ctx.t('items.artifacts.hornofplenty.levelup'), 'positive');
			}
		} else {
			ctx.say(ctx.t('items.artifacts.hornofplenty.feed'), 'positive');
		}
		horn.storedFoodEnergy = storedFoodEnergy;
	});
}
