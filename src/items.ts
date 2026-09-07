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
	stat: 'accuracy' | 'evasion' | 'strength' | 'tenacity';
}

// WEAPONS by tier (5 tiers × 5-7 weapons each)
export const WEAPONS: Record<number, WeaponDef[]> = {
	1: [
		{ id: 'wornshortsword', nameKey: 'port.name.wornshortsword', tier: 1 },
		{ id: 'magesstaff', nameKey: 'port.name.magesstaff', tier: 1 },
		{ id: 'dagger', nameKey: 'port.name.dagger', tier: 1 },
		{ id: 'gloves', nameKey: 'port.name.gloves', tier: 1, speed: 2 },
		{ id: 'rapier', nameKey: 'port.name.rapier', tier: 1 },
	],
	2: [
		{ id: 'shortsword', nameKey: 'items.weapon.melee.shortsword.name', tier: 2 },
		{ id: 'handaxe', nameKey: 'items.weapon.melee.handaxe.name', tier: 2 },
		{ id: 'spear', nameKey: 'items.weapon.melee.spear.name', tier: 2 },
		{ id: 'quarterstaff', nameKey: 'items.weapon.melee.quarterstaff.name', tier: 2 },
		{ id: 'dirk', nameKey: 'items.weapon.melee.dirk.name', tier: 2 },
		{ id: 'sickle', nameKey: 'items.weapon.melee.sickle.name', tier: 2 },
	],
	3: [
		{ id: 'sword', nameKey: 'items.weapon.melee.sword.name', tier: 3 },
		{ id: 'mace', nameKey: 'items.weapon.melee.mace.name', tier: 3 },
		{ id: 'scimitar', nameKey: 'items.weapon.melee.scimitar.name', tier: 3 },
		{ id: 'roundshield', nameKey: 'items.weapon.melee.roundshield.name', tier: 3 },
		{ id: 'sai', nameKey: 'items.weapon.melee.sai.name', tier: 3 },
		{ id: 'whip', nameKey: 'items.weapon.melee.whip.name', tier: 3 },
	],
	4: [
		{ id: 'longsword', nameKey: 'items.weapon.melee.longsword.name', tier: 4 },
		{ id: 'battleaxe', nameKey: 'items.weapon.melee.battleaxe.name', tier: 4 },
		{ id: 'flail', nameKey: 'items.weapon.melee.flail.name', tier: 4 },
		{ id: 'unicblade', nameKey: 'items.weapon.melee.runicblade.name', tier: 4 },
		{ id: 'assassinsblade', nameKey: 'items.weapon.melee.assassinsblade.name', tier: 4 },
		{ id: 'crossbow', nameKey: 'items.weapon.melee.crossbow.name', tier: 4 },
		{ id: 'katana', nameKey: 'items.weapon.melee.katana.name', tier: 4 },
	],
	5: [
		{ id: 'greatsword', nameKey: 'items.weapon.melee.greatsword.name', tier: 5 },
		{ id: 'warhammer', nameKey: 'items.weapon.melee.warhammer.name', tier: 5 },
		{ id: 'glaive', nameKey: 'items.weapon.melee.glaive.name', tier: 5 },
		{ id: 'greataxe', nameKey: 'items.weapon.melee.greataxe.name', tier: 5 },
		{ id: 'greatshield', nameKey: 'items.weapon.melee.greatshield.name', tier: 5 },
		{ id: 'gauntlet', nameKey: 'items.weapon.melee.gauntlet.name', tier: 5 },
		{ id: 'warscythe', nameKey: 'items.weapon.melee.warscythe.name', tier: 5 },
	],
};

// ARMOR by tier (cloth, leather, mail, scale, plate + class variants)
export const ARMOR: Record<number, ArmorDef[]> = {
	1: [{ id: 'clothArmor', nameKey: 'items.armor.clotharmor.name', tier: 1, type: 'cloth' }],
	2: [{ id: 'leatherArmor', nameKey: 'items.armor.leatherarmor.name', tier: 2, type: 'leather' }],
	3: [{ id: 'mailArmor', nameKey: 'items.armor.mailarmor.name', tier: 3, type: 'mail' }],
	4: [{ id: 'scaleArmor', nameKey: 'items.armor.scalearmor.name', tier: 4, type: 'scale' }],
	5: [{ id: 'plateArmor', nameKey: 'items.armor.platearmor.name', tier: 5, type: 'plate' }],
};

// WANDS (10 types, each available at tiers 1-5)
export const WANDS: Record<number, WandDef[]> = {
	1: [
		{ id: 'wandmagicmissile', nameKey: 'items.wands.wandofmagicmissile.name', tier: 1, minDamage: 2, maxDamage: 8 },
		{ id: 'wandfirebolt', nameKey: 'items.wands.wandoffirebolt.name', tier: 1, minDamage: 2, maxDamage: 8 },
		{ id: 'wandcorruption', nameKey: 'items.wands.wandofcorruption.name', tier: 1, minDamage: 1, maxDamage: 6 },
		{ id: 'wandfrost', nameKey: 'items.wands.wandoffrost.name', tier: 1, minDamage: 2, maxDamage: 8 },
		{ id: 'wandlightning', nameKey: 'items.wands.wandoflightning.name', tier: 1, minDamage: 2, maxDamage: 8 },
		{ id: 'wandblast', nameKey: 'items.wands.wandofblast.name', tier: 1, minDamage: 1, maxDamage: 6 },
		{ id: 'wandlivingearth', nameKey: 'items.wands.wandoflivingearth.name', tier: 1, minDamage: 1, maxDamage: 6 },
		{ id: 'wandregrowth', nameKey: 'items.wands.wandofregrowth.name', tier: 1, minDamage: 1, maxDamage: 1 },
		{ id: 'wandprismatic', nameKey: 'items.wands.wandofprismatic.name', tier: 1, minDamage: 2, maxDamage: 8 },
		{ id: 'wandwarding', nameKey: 'items.wands.wandofwarding.name', tier: 1, minDamage: 1, maxDamage: 1 },
	],
	2: [
		{ id: 'wandmagicmissile', nameKey: 'items.wands.wandofmagicmissile.name', tier: 2, minDamage: 2, maxDamage: 8 },
		{ id: 'wandfirebolt', nameKey: 'items.wands.wandoffirebolt.name', tier: 2, minDamage: 2, maxDamage: 8 },
		{ id: 'wandcorruption', nameKey: 'items.wands.wandofcorruption.name', tier: 2, minDamage: 1, maxDamage: 6 },
		{ id: 'wandfrost', nameKey: 'items.wands.wandoffrost.name', tier: 2, minDamage: 2, maxDamage: 8 },
		{ id: 'wandlightning', nameKey: 'items.wands.wandoflightning.name', tier: 2, minDamage: 2, maxDamage: 8 },
		{ id: 'wandblast', nameKey: 'items.wands.wandofblast.name', tier: 2, minDamage: 1, maxDamage: 6 },
		{ id: 'wandlivingearth', nameKey: 'items.wands.wandoflivingearth.name', tier: 2, minDamage: 1, maxDamage: 6 },
		{ id: 'wandregrowth', nameKey: 'items.wands.wandofregrowth.name', tier: 2, minDamage: 1, maxDamage: 1 },
		{ id: 'wandprismatic', nameKey: 'items.wands.wandofprismatic.name', tier: 2, minDamage: 2, maxDamage: 8 },
		{ id: 'wandwarding', nameKey: 'items.wands.wandofwarding.name', tier: 2, minDamage: 1, maxDamage: 1 },
	],
	3: [
		{ id: 'wandmagicmissile', nameKey: 'items.wands.wandofmagicmissile.name', tier: 3, minDamage: 2, maxDamage: 8 },
		{ id: 'wandfirebolt', nameKey: 'items.wands.wandoffirebolt.name', tier: 3, minDamage: 2, maxDamage: 8 },
		{ id: 'wandcorruption', nameKey: 'items.wands.wandofcorruption.name', tier: 3, minDamage: 1, maxDamage: 6 },
		{ id: 'wandfrost', nameKey: 'items.wands.wandoffrost.name', tier: 3, minDamage: 2, maxDamage: 8 },
		{ id: 'wandlightning', nameKey: 'items.wands.wandoflightning.name', tier: 3, minDamage: 2, maxDamage: 8 },
		{ id: 'wandblast', nameKey: 'items.wands.wandofblast.name', tier: 3, minDamage: 1, maxDamage: 6 },
		{ id: 'wandlivingearth', nameKey: 'items.wands.wandoflivingearth.name', tier: 3, minDamage: 1, maxDamage: 6 },
		{ id: 'wandregrowth', nameKey: 'items.wands.wandofregrowth.name', tier: 3, minDamage: 1, maxDamage: 1 },
		{ id: 'wandprismatic', nameKey: 'items.wands.wandofprismatic.name', tier: 3, minDamage: 2, maxDamage: 8 },
		{ id: 'wandwarding', nameKey: 'items.wands.wandofwarding.name', tier: 3, minDamage: 1, maxDamage: 1 },
	],
	4: [
		{ id: 'wandmagicmissile', nameKey: 'items.wands.wandofmagicmissile.name', tier: 4, minDamage: 2, maxDamage: 8 },
		{ id: 'wandfirebolt', nameKey: 'items.wands.wandoffirebolt.name', tier: 4, minDamage: 2, maxDamage: 8 },
		{ id: 'wandcorruption', nameKey: 'items.wands.wandofcorruption.name', tier: 4, minDamage: 1, maxDamage: 6 },
		{ id: 'wandfrost', nameKey: 'items.wands.wandoffrost.name', tier: 4, minDamage: 2, maxDamage: 8 },
		{ id: 'wandlightning', nameKey: 'items.wands.wandoflightning.name', tier: 4, minDamage: 2, maxDamage: 8 },
		{ id: 'wandblast', nameKey: 'items.wands.wandofblast.name', tier: 4, minDamage: 1, maxDamage: 6 },
		{ id: 'wandlivingearth', nameKey: 'items.wands.wandoflivingearth.name', tier: 4, minDamage: 1, maxDamage: 6 },
		{ id: 'wandregrowth', nameKey: 'items.wands.wandofregrowth.name', tier: 4, minDamage: 1, maxDamage: 1 },
		{ id: 'wandprismatic', nameKey: 'items.wands.wandofprismatic.name', tier: 4, minDamage: 2, maxDamage: 8 },
		{ id: 'wandwarding', nameKey: 'items.wands.wandofwarding.name', tier: 4, minDamage: 1, maxDamage: 1 },
	],
	5: [
		{ id: 'wandmagicmissile', nameKey: 'items.wands.wandofmagicmissile.name', tier: 5, minDamage: 2, maxDamage: 8 },
		{ id: 'wandfirebolt', nameKey: 'items.wands.wandoffirebolt.name', tier: 5, minDamage: 2, maxDamage: 8 },
		{ id: 'wandcorruption', nameKey: 'items.wands.wandofcorruption.name', tier: 5, minDamage: 1, maxDamage: 6 },
		{ id: 'wandfrost', nameKey: 'items.wands.wandoffrost.name', tier: 5, minDamage: 2, maxDamage: 8 },
		{ id: 'wandlightning', nameKey: 'items.wands.wandoflightning.name', tier: 5, minDamage: 2, maxDamage: 8 },
		{ id: 'wandblast', nameKey: 'items.wands.wandofblast.name', tier: 5, minDamage: 1, maxDamage: 6 },
		{ id: 'wandlivingearth', nameKey: 'items.wands.wandoflivingearth.name', tier: 5, minDamage: 1, maxDamage: 6 },
		{ id: 'wandregrowth', nameKey: 'items.wands.wandofregrowth.name', tier: 5, minDamage: 1, maxDamage: 1 },
		{ id: 'wandprismatic', nameKey: 'items.wands.wandofprismatic.name', tier: 5, minDamage: 2, maxDamage: 8 },
		{ id: 'wandwarding', nameKey: 'items.wands.wandofwarding.name', tier: 5, minDamage: 1, maxDamage: 1 },
	],
};

// RINGS (4 types per the port's current system)
export const RINGS: RingDef[] = [
	{ id: 'ringAccuracy', nameKey: 'items.rings.ringofaccuracy.name', tier: 1, stat: 'accuracy' },
	{ id: 'ringEvasion', nameKey: 'items.rings.ringofevasion.name', tier: 1, stat: 'evasion' },
	{ id: 'ringMight', nameKey: 'items.rings.ringofmight.name', tier: 1, stat: 'strength' },
	{ id: 'ringTenacity', nameKey: 'items.rings.ringoftenacity.name', tier: 1, stat: 'tenacity' },
];

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
