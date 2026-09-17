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

import { MWL_EQUIPMENT_STAT_RULES, MWL_ITEM_NODES, MWL_RING_ITEMS } from '../mwlContent';

export interface ItemDef {
	id: string;
	nameKey: string;
	tier: number;
}

export interface WeaponDef extends ItemDef {
	accuracy?: number;
	speed?: number;
}

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
		const speed = effectNumber(node, 'speed');
		return {
		id: parts.baseId,
		nameKey: requiredItemAttribute(node.attributes, 'name'),
		tier: parts.tier,
		...(speed === undefined ? {} : { speed }),
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

/** Evaluates only the two authored equipment formula shapes; arbitrary MWL expressions are not
 * executed. The formulas themselves are content, while this closed evaluator is game logic. */
function evaluateEquipmentFormula(formula: string, tier: number, level: number): number {
	if (formula === 'tier+level') return tier + level;
	if (formula === 'level') return level;
	if (formula === '5*(tier+1)+level*(tier+1)') return 5 * (tier + 1) + level * (tier + 1);
	if (formula === 'tier*(2+level)') return tier * (2 + level);
	throw new Error(`Unknown MWL equipment formula: ${formula}`);
}

function equipmentStatRange(kind: string, tier: number, level: number): [number, number] {
	const rule = MWL_EQUIPMENT_STAT_RULES[kind];
	if (!rule) throw new Error(`MWL equipment stat rule is missing: ${kind}`);
	return [evaluateEquipmentFormula(rule.minFormula, tier, level), evaluateEquipmentFormula(rule.maxFormula, tier, level)];
}

export function weaponDamageRange(tier: number, level: number): [number, number] {
	return equipmentStatRange('weaponDamage', tier, level);
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
