/**
 * What a `Statue`'s generated melee weapon does to its fights (`actors/mobs/Statue.java` and
 * `items/weapon/melee/*.java`, tag `v3.3.8`). Java gives every Statue a real `MeleeWeapon` and reads
 * five things from it:
 *
 * - `damageRoll()`   -> `NormalIntRange(min(lvl), max(lvl))` with the weapon's own `max` formula,
 * - `accuracyFactor` -> the weapon's `ACC` multiplier on the statue's `(9 + depth)` attack skill,
 * - `delayFactor`    -> the weapon's `DLY` multiplier on the attack delay,
 * - `canReach`       -> the weapon's `RCH` (spear/glaive 2, whip 3),
 * - `defenseFactor`  -> extra defence added to the statue's `NormalIntRange(0, depth + ...)` DR
 *                       (the shields, katana, quarterstaff and rapier).
 *
 * The scene supplies the tier (from `catalog.ts`) and the level; the per-class numbers come from the MWL.
 * This module stays scene-free so the item suite can pin it. The weapon's enchantment (its class, roll and proc chances) is at the
 * bottom of the file; what each proc does lives in `monsters/monsterAi.ts` (`statueEnchantProc`).
 */

import { weaponCombat } from './catalog';

export interface StatueWeaponStats {
	min: number;
	max: number;
	/** `Weapon.ACC`, multiplied into `(9 + depth)`. */
	accuracyFactor: number;
	/** `Weapon.DLY`, multiplied into the attack delay (0.5 = two swings a turn). */
	delayFactor: number;
	/** `Weapon.RCH`: 1 is plain adjacency. */
	reach: number;
	/** `weapon.defenseFactor(statue)`, added to the depth-scaled DR ceiling. */
	defense: number;
}

/** The stats a statue drawing `cls` (a Java class name, any case) at `tier`/`level` fights with. The numbers
 * are the weapon's own, authored per class in `item-rules.mwl` (`weaponCombatRules`) and read through
 * `catalog.ts`'s `weaponCombat`, the same source the hero's weapon uses. */
export function statueWeaponStats(cls: string, tier: number, level: number): StatueWeaponStats {
	const combat = weaponCombat(cls, tier, level);
	return {
		min: Math.max(0, combat.min),
		max: combat.max,
		accuracyFactor: combat.accuracy,
		delayFactor: combat.delay,
		reach: combat.reach,
		defense: combat.defense,
	};
}

/**
 * A statue's weapon enchantment (`Statue()`: `weapon.enchant(Enchantment.random())`, tag `v3.3.8`).
 * `Weapon.Enchantment.random()` picks a rarity with weights 50/40/10 and then one class of that
 * rarity uniformly. The class is rolled on the scene's own random stream when the statue spawns and
 * kept in the statue's payload: the painter's generator draws the same enchantment for RNG parity
 * but discards it, so it is not recoverable from the level stream.
 */
export type StatueEnchant =
	| 'blazing' | 'chilling' | 'kinetic' | 'shocking'
	| 'blocking' | 'blooming' | 'elastic' | 'lucky' | 'projecting' | 'unstable'
	| 'corrupting' | 'grim' | 'vampiric';

const COMMON: readonly StatueEnchant[] = ['blazing', 'chilling', 'kinetic', 'shocking'];
const UNCOMMON: readonly StatueEnchant[] = ['blocking', 'blooming', 'elastic', 'lucky', 'projecting', 'unstable'];
const RARE: readonly StatueEnchant[] = ['corrupting', 'grim', 'vampiric'];

/** `Unstable.randomEnchants`: what an unstable weapon draws from on each hit (no projecting: no on-hit effect). */
export const UNSTABLE_DELEGATES: readonly StatueEnchant[] = [
	'blazing', 'blocking', 'blooming', 'chilling', 'kinetic', 'corrupting', 'elastic', 'grim', 'lucky', 'shocking', 'vampiric',
];

/** `Enchantment.random()`: `float()` in [0,1) picks the rarity, `pick(n)` an index in [0,n). */
export function rollStatueEnchant(float: () => number, pick: (n: number) => number): StatueEnchant {
	const roll = float() * 100;
	const group = roll < 50 ? COMMON : roll < 90 ? UNCOMMON : RARE;
	return group[pick(group.length)]!;
}

/**
 * The proc chance of each enchantment at a proc multiplier of 1 (a statue has no Ring of Arcana, no
 * Berserk and no trackers, so `genericProcChanceMultiplier` is 1). `level` is the weapon's level,
 * floored at 0 like Java's `Math.max(0, weapon.buffedLvl())`.
 */
export function statueEnchantChance(enchant: StatueEnchant, level: number): number {
	const l = Math.max(0, level);
	switch (enchant) {
		case 'blazing': case 'blooming': return (l + 1) / (l + 3);
		case 'chilling': return (l + 1) / (l + 4);
		case 'elastic': return (l + 1) / (l + 5);
		case 'shocking': return 1 / 3;
		case 'blocking': case 'lucky': return (l + 4) / (l + 40);
		case 'corrupting': return (l + 5) / (l + 25);
		case 'grim': return 0.5 + 0.05 * l; //the *maximum* chance, scaled by missing HP squared
		default: return 0;
	}
}
