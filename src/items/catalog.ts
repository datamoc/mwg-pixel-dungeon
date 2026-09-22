/**
 * Complete item definitions for weapons, armor, wands, and rings across all 5 tiers.
 * Stats are based on Java Shattered Pixel Dungeon's real item values.
 *
 * Damage/armor values at level 0 (tier determines the formula):
 * - Weapon: min = tier + lvl, max = 5*(tier+1) + lvl*(tier+1)
 * - Armor: min = lvl, max = tier*(2+lvl)
 *
 * This file provides item names, identifiers, and stat multipliers for looking up items
 * by tier and name. Actual damage calculation is in DungeonScene's syncHeroFromStats()
 * (`src/scenes/dungeonScene.ts`).
 */

import { MWL_DEFAULT_MELEE_COMBAT, MWL_EQUIPMENT_STAT_RULES, MWL_ITEM_NODES, MWL_RING_ITEMS, MWL_WEAPON_COMBAT_RULES } from '../mwlContent';
import { evaluateFormula } from './formula';

export interface ItemDef {
	id: string;
	nameKey: string;
	tier: number;
}

export interface WeaponDef extends ItemDef {}

export interface ArmorDef extends ItemDef {
	type: 'cloth' | 'leather' | 'mail' | 'scale' | 'plate';
}

export interface WandDef extends ItemDef {
	minDamage: number;
	maxDamage: number;
}

export interface RingDef extends ItemDef {
	stat: string;
}

/** Equipment catalogue authored in `src/content/items.mwl`, compiled before TypeScript. */
function requiredItemAttribute(attributes: Readonly<Record<string, string | undefined>>, key: string): string {
	const value = attributes[key];
	if (value === undefined) throw new Error(`MWL item definition is missing ${key}`);
	return value;
}

function itemNumber(attributes: Readonly<Record<string, string | undefined>>, key: string): number {
	const value = Number(requiredItemAttribute(attributes, key));
	if (!Number.isFinite(value)) throw new Error(`MWL item definition has invalid ${key}`);
	return value;
}

function itemIdParts(id: string): { baseId: string; tier: number; armorType?: ArmorDef['type'] } {
	const armor = /^armor_(.+)_t(\d+)_(cloth|leather|mail|scale|plate)$/.exec(id);
	if (armor) return { baseId: armor[1], tier: Number(armor[2]), armorType: armor[3] as ArmorDef['type'] };
	const equipment = /^(?:weapon|wand)_(.+)_t(\d+)$/.exec(id);
	if (equipment) return { baseId: equipment[1], tier: Number(equipment[2]) };
	throw new Error(`MWL equipment id has invalid shape: ${id}`);
}

function effectNumber(node: (typeof MWL_ITEM_NODES)[number], key: string): number | undefined {
	const effect = node.children.find((child) => child.tag === 'effect' && child.attributes.apply_to === key);
	return effect?.attributes.set === undefined ? undefined : itemNumber(effect.attributes, 'set');
}

function requiredEffectNumber(node: (typeof MWL_ITEM_NODES)[number], key: string): number {
	const value = effectNumber(node, key);
	if (value === undefined) throw new Error(`MWL item definition is missing effect ${key}`);
	return value;
}

function byTier<T extends ItemDef>(items: readonly T[]): Record<number, T[]> {
	return items.reduce<Record<number, T[]>>((groups, item) => {
		(groups[item.tier] ??= []).push(item);
		return groups;
	}, {});
}

const authoredEquipment = MWL_ITEM_NODES.filter((node) => {
	const slot = node.attributes.slot;
	return slot === 'weapon' || slot === 'armor' || slot === 'wand';
});

const authoredWeapons = authoredEquipment
	.filter((node) => node.attributes.slot === 'weapon')
	.map((node): WeaponDef => {
		const parts = itemIdParts(requiredItemAttribute(node.attributes, 'id'));
		return {
		id: parts.baseId,
		nameKey: requiredItemAttribute(node.attributes, 'name'),
		tier: parts.tier,
	};
	});

export const WEAPONS: Record<number, WeaponDef[]> = byTier(authoredWeapons);

function tierByClass<T extends ItemDef>(byTierMap: Record<number, T[]>): Record<string, number> {
	return Object.fromEntries(Object.entries(byTierMap).flatMap(([tier, defs]) => defs.map((def) => [def.id, Number(tier)])));
}

/**
 * Reverse index from a Java class name, lowercased, to its tier - every weapon/armor id in
 * `items.mwl` is its Java class name lowercased (`WornShortsword` -> `wornshortsword`), so a
 * caller holding the original-case class name should look it up as `.toLowerCase()`.
 */
export const WEAPON_TIER_BY_CLASS: Record<string, number> = tierByClass(WEAPONS);

/** The same reverse index, to each class's own `name` key. A *minted* payload id cannot name itself
 *  - `weaponReward`/`armorReward` are one id for every class, and their own node's name key is the
 *  generic "quest weapon"/"quest armor" (see `item-rules.mwl`) - so `itemDisplayName` resolves the
 *  class name from `sourceClass` through these instead. */
function nameByClass<T extends ItemDef>(byTierMap: Record<number, T[]>): Record<string, string> {
	return Object.fromEntries(Object.entries(byTierMap).flatMap(([tier, defs]) => defs.map((def) => [def.id, def.nameKey])));
}
export const WEAPON_NAME_BY_CLASS: Record<string, string> = nameByClass(WEAPONS);

const authoredArmor = authoredEquipment
	.filter((node) => node.attributes.slot === 'armor')
	.map((node): ArmorDef => {
		const parts = itemIdParts(requiredItemAttribute(node.attributes, 'id'));
		if (!parts.armorType) throw new Error(`MWL armor id is missing its armor type: ${node.attributes.id}`);
		return {
		id: parts.baseId,
		nameKey: requiredItemAttribute(node.attributes, 'name'),
		tier: parts.tier,
		type: parts.armorType,
	};
	});

export const ARMOR: Record<number, ArmorDef[]> = byTier(authoredArmor);
export const ARMOR_TIER_BY_CLASS: Record<string, number> = tierByClass(ARMOR);
export const ARMOR_NAME_BY_CLASS: Record<string, string> = nameByClass(ARMOR);

/**
 * `ClassArmor`'s per-class subclasses as this port's worn-armor ids: Java mints a real item
 * per hero class (`WarriorArmor`, `MageArmor`, `RogueArmor`, `HuntressArmor`, `DuelistArmor`,
 * plus `ClericArmor` in tag `v3.3.8` - `ClassArmor.java`, and the bones list already excludes
 * the first five by these same lowercased names), so the crown transform swaps the worn id to
 * the hero's own rather than keeping the pre-crown class. Every id is `${heroClass}armor`.
 */
export const CLASS_ARMOR_ID_BY_CLASS: Record<string, string> = {
	warrior: 'warriorarmor',
	mage: 'magearmor',
	rogue: 'roguearmor',
	huntress: 'huntressarmor',
	duelist: 'duelistarmor',
	cleric: 'clericarmor',
};

/** Whether a worn/bag armor id is one of the six class armors (never the tiered loot classes). */
export function isClassArmorId(id: string): boolean {
	return Object.values(CLASS_ARMOR_ID_BY_CLASS).includes(id);
}

const authoredWands = authoredEquipment
	.filter((node) => node.attributes.slot === 'wand')
	.map((node): WandDef => {
		const parts = itemIdParts(requiredItemAttribute(node.attributes, 'id'));
		return {
		id: parts.baseId,
		nameKey: requiredItemAttribute(node.attributes, 'name'),
		tier: parts.tier,
		minDamage: requiredEffectNumber(node, 'min_damage'),
		maxDamage: requiredEffectNumber(node, 'max_damage'),
	};
	});

export const WANDS: Record<number, WandDef[]> = byTier(authoredWands);

/** Authored equipment formulas run through the closed evaluator in `formula.ts` (numbers, `tier`, `level`,
 * `+ - * /`, parentheses, `round`): the formulas are content, the evaluator is game logic. */
function evaluateEquipmentFormula(formula: string, tier: number, level: number): number {
	return evaluateFormula(formula, { tier, level });
}

function equipmentStatRange(kind: string, tier: number, level: number): [number, number] {
	const rule = MWL_EQUIPMENT_STAT_RULES[kind];
	if (!rule) throw new Error(`MWL equipment stat rule is missing: ${kind}`);
	return [evaluateEquipmentFormula(rule.minFormula, tier, level), evaluateEquipmentFormula(rule.maxFormula, tier, level)];
}

/**
 * The melee class each hero class starts with (`HeroClass.initHero()`, tag `v3.3.8`): the port keeps the
 * run-start weapon under the one id `startingWeapon`, so its real class is a function of the hero class.
 * The cleric's cudgel has no `weaponCombatRules` row (it is not one of the thirty-one authored classes),
 * so it, like any unknown key, gets the default `MeleeWeapon` numbers.
 */
export const STARTING_WEAPON_CLASS: Readonly<Record<string, string>> = {
	warrior: 'wornshortsword', mage: 'magesstaff', rogue: 'dagger', huntress: 'gloves', duelist: 'rapier',
};

/** The default `MeleeWeapon` range for a tier and level. Prefer `weaponCombat` when the class is known: about
 * twenty-six of the thirty-one melee classes override the maximum. */
export function weaponDamageRange(tier: number, level: number): [number, number] {
	return equipmentStatRange('weaponDamage', tier, level);
}

/** A melee weapon's combat numbers at a tier and level (`Weapon`/`MeleeWeapon`, tag `v3.3.8`). */
export interface WeaponCombat {
	min: number;
	max: number;
	/** `Weapon.ACC`, the multiplier on the wielder's accuracy. */
	accuracy: number;
	/** `Weapon.DLY`, the multiplier on the attack delay (0.5 = two swings a turn). */
	delay: number;
	/** `Weapon.RCH`: 1 is plain adjacency. */
	reach: number;
	/** `defenseFactor(owner)`: extra defence the weapon adds to its wielder's DR ceiling. */
	defense: number;
}

/**
 * The combat numbers of the melee weapon whose lower-cased Java class name is `weaponClass` (`sword`,
 * `wornshortsword`, ...), from `weaponCombatRules` in `item-rules.mwl`. A class with no row (a modded id,
 * a thrown weapon) gets Java's own `MeleeWeapon` defaults (`defaultMeleeCombat` in the same file),
 * so a lookup never fails.
 */
export function weaponCombat(weaponClass: string, tier: number, level: number): WeaponCombat {
	const rule = MWL_WEAPON_COMBAT_RULES[weaponClass.toLowerCase()];
	const [min, defaultMax] = weaponDamageRange(tier, level);
	if (!rule) return { min, max: defaultMax, ...MWL_DEFAULT_MELEE_COMBAT };
	return {
		min,
		max: evaluateEquipmentFormula(rule.maxFormula, tier, level),
		accuracy: rule.accuracy,
		delay: rule.delay,
		reach: rule.reach,
		defense: evaluateEquipmentFormula(rule.defenseFormula, tier, level),
	};
}

export function armorReductionRange(tier: number, level: number): [number, number] {
	return equipmentStatRange('armorReduction', tier, level);
}



// MWL owns the ring catalogue and effect metadata; SPD-specific formulas remain in
// ringModifiers.ts/main.ts because MWL intentionally describes content, not Java combat code.
export const RINGS: RingDef[] = MWL_RING_ITEMS.map((item) => ({
	id: item.id,
	nameKey: item.name,
	tier: 1,
	stat: item.effects[0]?.applyTo ?? 'unknown',
}));

/**
 * Look up a weapon by tier and name (simplified search).
 * Used to ensure consistent weapon stats across the game.
 */
export function getWeapon(tier: number, nameOrId: string): WeaponDef | undefined {
	const weapons = WEAPONS[tier];
	if (!weapons) return undefined;
	const lower = nameOrId.toLowerCase();
	return weapons.find((w) => w.id === lower || w.id.includes(lower));
}

/**
 * Look up armor by tier and type.
 */
export function getArmor(tier: number): ArmorDef | undefined {
	return ARMOR[tier]?.[0];
}

/**
 * Look up a wand by tier and name.
 */
export function getWand(tier: number, nameOrId: string): WandDef | undefined {
	const wands = WANDS[tier];
	if (!wands) return undefined;
	const lower = nameOrId.toLowerCase();
	return wands.find((w) => w.id === lower || w.id.includes(lower));
}

/**
 * Look up a ring by name (rings are not tiered in the current port).
 */
export function getRing(nameOrId: string): RingDef | undefined {
	const lower = nameOrId.toLowerCase();
	return RINGS.find((r) => r.id === lower || r.id.includes(lower));
}
