/**
 * `PotionOfDivineInspiration.DivineInspirationTracker` and `Hero.bonusTalentPoints(tier)` (tag `v3.3.8`): a boosted tier is worth +2 talent
 * points once its window is open (`level >= tierLevelThresholds[tier] - 1`, tier 3 needs a subclass, tier 4 an armor ability).
 * Java reads it live inside `talentPointsAvailable`; this port banks points per tier, so a boosted tier is credited once
 * (`granted`) the first time its window is open, and `tickDivineInspiration` (`scenes/dungeon/divinePotion.ts`) re-checks it every turn.
 * Per-scene like `items/mastery.ts`; saved as `divineInspiration`.
 */
export interface DivineState { boosted: number[]; granted: number[] }

const stateByScene = new WeakMap<object, DivineState>();

export function divineStateFor(scene: object): DivineState {
	let state = stateByScene.get(scene);
	if (!state) {
		state = { boosted: [], granted: [] };
		stateByScene.set(scene, state);
	}
	return state;
}

export const DIVINE_BONUS_POINTS = 2;

/** `bonusTalentPoints(tier)`'s gate, for a tier 1-4. */
export function divineWindowOpen(tier: number, level: number, thresholds: readonly number[], hasSubclass: boolean, hasArmorAbility: boolean): boolean {
	if (level < (thresholds[tier] ?? Infinity) - 1) return false;
	if (tier === 3 && !hasSubclass) return false;
	if (tier === 4 && !hasArmorAbility) return false;
	return true;
}
