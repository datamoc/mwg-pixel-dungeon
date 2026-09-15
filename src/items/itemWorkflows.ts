import { Actors } from 'mwg';

export type ItemLike = {
	id: string;
	quantity: number;
	instanceId?: string;
	level?: number;
	affix?: string;
	cursed?: boolean;
};

/** Applies an upgrade to one concrete item instance, including its affix policy. */
export function upgradeItem<T extends ItemLike>(item: T, delta: number, policy: Actors.AffixUpgradePolicy = 'keep'): number {
	return Actors.enchant(item, delta, policy);
}

/** Copies the complete enhancement state while deliberately retaining the target identity. */
export function transferEnhancement<T extends ItemLike>(from: T, to: T, move = false): void {
	to.level = from.level;
	Actors.copyAffix(from, to);
	if (move) Actors.removeAffix(from);
}

export type InfusableItem = ItemLike & { identified?: boolean; curseInfusionBonus?: boolean };

/**
 * The level a curse-infused item reports through Java's `level()`: `super.level()` with its own
 * `level += 1 + level/6` applied once, in Java's integer arithmetic. `Weapon.java` 254-258 and
 * `Armor.java` 383-387 (tag `v2.1.4`; unchanged in `v3.3.8`) - so a +0 item reads +1, a +6 reads +8
 * and a +12 reads +15. This is what every `level()` read in the game sees - damage, armor, STR
 * requirement, price, the affix-loss rolls, the wand scaling, the displayed "+N" - while the stored
 * `level` stays untouched, which is why upgrading an infused item grows the bonus and why a cleanse
 * has no level to give back.
 */
export function curseInfusionLevelBonus(level: number): number {
	return level + 1 + Math.floor(level / 6);
}

/**
 * Clears the curse-infusion marker - all a cleanse does to it.
 *
 * `Weapon.enchant()` (`Weapon.java` 316-321) and `Armor.inscribe()` (`Armor.java` 596-601) clear it
 * whenever the affix stops being a curse, and `Wand.level()` (`Wand.java` 288-298) clears a stale
 * one on read; the bonus they were applying lived in `level()`, never in the stored level (see
 * `curseInfusionLevelBonus`). The previous version of this helper also subtracted the invented
 * "+1 persistent level" back off, which corrupted the item's real level: an infused +3 weapon
 * became +2 after a cleanse, where Java leaves it at +3.
 */
export function reverseCurseInfusion<T extends InfusableItem>(item: T): boolean {
	if (!item.curseInfusionBonus) return false;
	item.curseInfusionBonus = false;
	return true;
}
