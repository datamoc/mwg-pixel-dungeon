/**
 * Complete item definitions for weapons, armor, wands, and rings across all 5 tiers.
 * Stats are based on Java Shattered Pixel Dungeon's real item values.
 *
 * Damage/armor values at level 0 (tier determines the formula):
 * - Weapon: min = tier + lvl, max = 5*(tier+1) + lvl*(tier+1)
 * - Armor: min = lvl, max = tier*(2+lvl)
 *
 * This file provides item names, identifiers, and stat multipliers for looking up items
 * by tier and name. Actual damage calculation is in main.ts using syncHeroFromStats().
 */

import { MWL_ITEM_NODES, MWL_RING_ITEMS } from './mwlContent';

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



// MWL owns the ring catalogue and effect metadata; SPD-specific formulas remain in
// ringModifiers.ts/main.ts because MWL intentionally describes content, not Java combat code.
const RING_NAME_KEYS: Record<string, string> = {
	ringAccuracy: 'items.rings.ringofaccuracy.name',
	ringEvasion: 'items.rings.ringofevasion.name',
	ringMight: 'items.rings.ringofmight.name',
	ringTenacity: 'items.rings.ringoftenacity.name',
	ringHaste: 'items.rings.ringofhaste.name',
	ringEnergy: 'items.rings.ringofenergy.name',
	ringWealth: 'items.rings.ringofwealth.name',
	ringArcana: 'items.rings.ringofarcana.name',
	ringForce: 'items.rings.ringofforce.name',
	ringSharpshooting: 'items.rings.ringofsharpshooting.name',
	ringElements: 'items.rings.ringofelements.name',
	ringFuror: 'items.rings.ringoffuror.name',
};

export const RINGS: RingDef[] = MWL_RING_ITEMS.map((item) => ({
	id: item.id,
	nameKey: RING_NAME_KEYS[item.id] ?? item.name,
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
