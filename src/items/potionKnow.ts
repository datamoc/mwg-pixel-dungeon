/**
 * Run-wide potion-class knowledge - `Potion`'s static `ItemStatusHandler` known set (tag
 * `v3.3.8`), the same shape `simulation/ringKnow.ts` gives rings. `Potion.isKnown()`
 * answers from the handler's known-class set, one entry per REGULAR potion id; every
 * quaffing `apply()` calls `identify()` before its effect (`PotionOfHealing.java:53`,
 * `PotionOfShielding.java:42`, ... - quaff routes through `Potion.apply() -> shatter()`
 * for the four malevolent potions, which identify in `heroFOV`), `ScrollOfIdentify`
 * reaches it through `item.identify()`, and `WndEnergizeItem.energize()`'s
 * `item.identify()` (WndEnergizeItem.java:168) reaches it when the Alchemize spell
 * consumes a potion.
 *
 * `ExoticPotion.isKnown()` routes to its regular counterpart (`exoToReg`), so exotic and
 * regular knowledge are one store: exotic ids normalise to the regular id on write and
 * read alike. This port has two exotic potion pairs (`potionHealing -> potionShielding`,
 * `potionInvis -> potionShrouding`), but the rule is the map's, not the pair count's.
 *
 * Keyed by scene object (like `ringKnow`): the scenes own their bag through the run, and
 * the save/load envelope carries the set as `potionKindsKnown`.
 */
import { potionRegularCounterpart } from './alchemy';

const knownByScene = new WeakMap<object, Set<string>>();

/** The live potion-class-known set for `scene`, created on first touch. */
export function potionKindsKnownFor(scene: object): Set<string> {
	let known = knownByScene.get(scene);
	if (!known) {
		known = new Set();
		knownByScene.set(scene, known);
	}
	return known;
}

/** Quaffed ids whose Java `apply()` never calls `identify()`, so the quaff marks
 * nothing (`Potion.setKnown()`'s `!anonymous` gate generalizes: the UnstableBrew's
 * `anonymize()` suppresses the rolled potion's mark the same way, and
 * `ElixirOfAquaticRejuvenation.apply()` simply has no `identify()` call, unlike
 * `PotionOfHealing.java:53` / `PotionOfShielding.java:42`). The scene threads
 * these through its effect dispatch as anonymous. */
export const POTION_QUAFF_ANONYMOUS: ReadonlySet<string> = new Set([
	'elixirAquaticRejuvenation',
]);

/** `Potion.setKnown()` / `ExoticPotion.setKnown()`: mark potion `ids` class-known for `scene`. */
export function markPotionKindsKnown(scene: object, ids: string[]): void {
	const known = potionKindsKnownFor(scene);
	for (const id of ids) known.add(potionRegularCounterpart(id) ?? id);
}

/** `Potion.isKnown()` / `ExoticPotion.isKnown()`: an id is known exactly when its regular class is. */
export function potionKindKnown(known: ReadonlySet<string>, id: string): boolean {
	return known.has(potionRegularCounterpart(id) ?? id);
}
