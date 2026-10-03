/**
 * `Weapon.masteryPotionBonus` / `Armor.masteryPotionBonus` (tag `v3.3.8`): the per-item flag `PotionOfMastery` sets, worth -2 on that
 * item's `STRReq()` (`items/strReq.ts`). Carried here as a set of item instance ids per scene (a gear instance id is unique and
 * survives equip/unequip), saved in the run envelope as `masteryItems`, rather than as a field threaded through every
 * equip/unequip/transmute path.
 */
const masteredByScene = new WeakMap<object, Set<string>>();

export function masteredItemsFor(scene: object): Set<string> {
	let set = masteredByScene.get(scene);
	if (!set) {
		set = new Set();
		masteredByScene.set(scene, set);
	}
	return set;
}

export function isMastered(scene: object, instanceId: string | undefined): boolean {
	return instanceId !== undefined && masteredItemsFor(scene).has(instanceId);
}
