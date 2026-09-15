/**
 * `MissileWeapon.java`'s `UpgradedSetTracker` pickup rule (tag `v3.3.8`), translated.
 *
 * Java gives every missile stack a random `setID` (`setID = new SecureRandom().nextLong()`) and,
 * on every `upgrade()`, records `levelThresholds[setID] = trueLevel()+1` on the hero's
 * `UpgradedSetTracker` buff (which persists through death and saves). Picking a stack up runs
 * `pickupValid`: no tracker, or no entry for the stack's set, is valid; otherwise the stack's
 * `trueLevel()` must reach the recorded threshold, or the stack crumbles to dust (ITEM sound,
 * `pickupDelay` spent, the `dust` warning, quantity zeroed) instead of merging.
 *
 * This port's missiles are fungible class ammo (`main.ts`'s `ammo`/`missileLevel`), not distinct
 * stacks, so sets are small sequential ids minted by the scene (no RNG draw at all, unlike Java's
 * `SecureRandom`): the wielded pile's own set, fresh sets for scattered/missed heaps. The scene
 * owns the counter and the threshold map; these two functions are the pure rule it calls, so the
 * pickup branch and the upgrade hook stay testable headlessly (see `tools/verifyItemWorkflows.mjs`).
 *
 * Deliberately not reproduced: `extraThrownLeft` (reset on a valid pickup) has no expression in
 * this port's ammo model, and neither do the tracker's other three consumers - LiquidMetal
 * crafting's set-consumed bookkeeping (alchemy brews from fungible bag ids here), the
 * Shopkeeper's own `pickupValid` read (shop stock never carries missile sets), and the
 * reforge's set retirement (`WndBlacksmith`'s `levelThresholds.put(setID, MAX_VALUE)` on the
 * consumed missile - bag stacks carry no set id, and the reforge picker only offers
 * weapon/armor payloads, so no missile can be the consumed item; see `openBlacksmithReforge`).
 */
import { MWL_MISSILE_BY_CLASS, MWL_MISSILE_UPGRADE_RULES } from '../mwlContent';

/** Resolves `MissileWeapon.min()`/`max()` from the authored missile identity and live level. */
export function missileDamageRange(sourceClass: string, level: number, flatBonus = 0): [number, number] {
	const definition = MWL_MISSILE_BY_CLASS.get(sourceClass);
	if (!definition) throw new Error(`MWL missile definition is missing for ${sourceClass}`);
	const upgrade = MWL_MISSILE_UPGRADE_RULES[sourceClass];
	if (!upgrade) throw new Error(`MWL missile upgrade rule is missing for ${sourceClass}`);
	return [
		definition.minDamage + upgrade.minPerLevel * level + flatBonus,
		definition.maxDamage + upgrade.maxPerLevel * level + flatBonus,
	];
}

/**
 * `MissileWeapon`'s formulas are sourced from the real SPD classes (tag `v3.3.8`): base min/max
 * and per-level increments are content metadata; hit resolution and durability remain TS.
 */
export function missilePickupValid(
	thresholds: ReadonlyMap<number, number> | undefined,
	setId: number | undefined,
	level: number,
): boolean {
	if (thresholds === undefined || setId === undefined) return true;
	const threshold = thresholds.get(setId);
	if (threshold === undefined) return true;
	return level >= threshold;
}

/** Java's `upgrade()` recording: `levelThresholds[setID] = trueLevel()+1`, immutably. */
export function recordMissileUpgrade(
	thresholds: ReadonlyMap<number, number>,
	setId: number,
	level: number,
): Map<number, number> {
	const next = new Map(thresholds);
	next.set(setId, level);
	return next;
}
