import { delayMultiplier, drPenalty, encumbrance, meleeWeaponSTRReq, armorSTRReq } from '../../items/strReq';
import { isMastered } from '../../items/mastery';
import type { DungeonScene } from '../dungeonScene';

/**
 * The hero's worn gear against `Hero.STR()` (`Weapon.STRReq()` / `Armor.STRReq()`, tag `v3.3.8`), including the
 * `masteryPotionBonus` -2 (`items/mastery.ts`). `STRReq()` reads `level()`, not the buffed level, so degradation does not
 * lower it; the curse-infusion bonus is part of `level()` and does.
 */
export function heroWeaponStrReq(scene: DungeonScene): number {
	return meleeWeaponSTRReq(scene.weaponMeleeKey(), scene.weaponTier, scene.effectiveWeaponLevel(), isMastered(scene, scene.weaponInstanceId));
}

export function heroArmorStrReq(scene: DungeonScene): number {
	return armorSTRReq(scene.armorTier, scene.effectiveArmorLevel(), isMastered(scene, scene.armorInstanceId));
}

export const heroWeaponEncumbrance = (scene: DungeonScene): number => encumbrance(heroWeaponStrReq(scene), scene.hero.str ?? 0);
export const heroArmorEncumbrance = (scene: DungeonScene): number => encumbrance(heroArmorStrReq(scene), scene.hero.str ?? 0);

/** `Weapon.baseDelay()`: `delay *= 1.2^encumbrance` (1 when the weapon fits). */
export const weaponDelayFactor = (scene: DungeonScene): number => delayMultiplier(heroWeaponEncumbrance(scene));
/** `Armor.speedFactor()`'s `speed /= 1.2^encumbrance`, as the turn-cost multiplier it is the inverse of. */
export const armorSpeedCostFactor = (scene: DungeonScene): number => delayMultiplier(heroArmorEncumbrance(scene));
/** `Hero.drRoll()`'s `armDr -= 2 * (STRReq() - STR())`. */
export const armorDrPenalty = (scene: DungeonScene): number => drPenalty(heroArmorEncumbrance(scene));
