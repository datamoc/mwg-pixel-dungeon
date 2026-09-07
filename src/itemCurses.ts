/**
 * Weapon and armor curse definitions - permanent negative enchantments.
 * Curses can be removed with cleanse scrolls and are distinguished by cursed flag on items.
 *
 * NOT CURRENTLY WIRED INTO GAMEPLAY: nothing in `main.ts` imports this file (confirmed by a
 * whole-repo search), and no generated/dropped item is ever given one of these concrete curse
 * ids - `main.ts`'s own proc branches (`weaponAffix === 'wayward'`, `armorGlyph === 'fragile'`,
 * etc.) are real but unreachable until item generation/equip actually rolls and assigns an id
 * from here (or an equivalent). See `PORT_COVERAGE.md`'s "Enchant/glyph/curse assignment is
 * unwired" row for the full finding.
 */

export interface CurseDef {
	id: string;
	nameKey: string;
	descriptionKey: string;
	type: 'weapon' | 'armor';
	/** Whether this curse prevents unequipping the item */
	locks: boolean;
}

/**
 * The 16 curses in SPD (8 weapon + 8 armor).
 * Ten are currently implemented (Wayward, Fragile, Metabolism, Bulk, Anti-Entropy,
 * Dazzling, Corrosion, Multiplicity, Overgrowth, Annoying).
 * This defines all of them for reference.
 */
export const CURSES: CurseDef[] = [
	// Weapon Curses (8)
	{
		id: 'wayward',
		nameKey: 'items.weapon.curses.wayward.name',
		descriptionKey: 'items.weapon.curses.wayward.desc',
		type: 'weapon',
		locks: true,
	},
	{
		id: 'annoying',
		nameKey: 'items.weapon.curses.annoying.name',
		descriptionKey: 'items.weapon.curses.annoying.desc',
		type: 'weapon',
		locks: true,
	},
	{
		id: 'dazzling',
		nameKey: 'items.weapon.curses.dazzling.name',
		descriptionKey: 'items.weapon.curses.dazzling.desc',
		type: 'weapon',
		locks: true,
	},
	{
		id: 'displacing',
		nameKey: 'items.weapon.curses.displacing.name',
		descriptionKey: 'items.weapon.curses.displacing.desc',
		type: 'weapon',
		locks: true,
	},
	{
		id: 'explosive',
		nameKey: 'items.weapon.curses.explosive.name',
		descriptionKey: 'items.weapon.curses.explosive.desc',
		type: 'weapon',
		locks: true,
	},
	{
		id: 'friendly',
		nameKey: 'items.weapon.curses.friendly.name',
		descriptionKey: 'items.weapon.curses.friendly.desc',
		type: 'weapon',
		locks: true,
	},
	{
		id: 'polarized',
		nameKey: 'items.weapon.curses.polarized.name',
		descriptionKey: 'items.weapon.curses.polarized.desc',
		type: 'weapon',
		locks: true,
	},
	{
		id: 'sacrificial',
		nameKey: 'items.weapon.curses.sacrificial.name',
		descriptionKey: 'items.weapon.curses.sacrificial.desc',
		type: 'weapon',
		locks: true,
	},

	// Armor Curses (8)
	{
		id: 'fragile',
		nameKey: 'items.armor.curses.fragile.name',
		descriptionKey: 'items.armor.curses.fragile.desc',
		type: 'armor',
		locks: true,
	},
	{
		id: 'antientropy',
		nameKey: 'items.armor.curses.antientropy.name',
		descriptionKey: 'items.armor.curses.antientropy.desc',
		type: 'armor',
		locks: true,
	},
	{
		id: 'bulk',
		nameKey: 'items.armor.curses.bulk.name',
		descriptionKey: 'items.armor.curses.bulk.desc',
		type: 'armor',
		locks: true,
	},
	{
		id: 'corrosion',
		nameKey: 'items.armor.curses.corrosion.name',
		descriptionKey: 'items.armor.curses.corrosion.desc',
		type: 'armor',
		locks: true,
	},
	{
		id: 'displacement',
		nameKey: 'items.armor.curses.displacement.name',
		descriptionKey: 'items.armor.curses.displacement.desc',
		type: 'armor',
		locks: true,
	},
	{
		id: 'metabolism',
		nameKey: 'items.armor.curses.metabolism.name',
		descriptionKey: 'items.armor.curses.metabolism.desc',
		type: 'armor',
		locks: true,
	},
	{
		id: 'multiplicity',
		nameKey: 'items.armor.curses.multiplicity.name',
		descriptionKey: 'items.armor.curses.multiplicity.desc',
		type: 'armor',
		locks: true,
	},
	{
		id: 'overgrowth',
		nameKey: 'items.armor.curses.overgrowth.name',
		descriptionKey: 'items.armor.curses.overgrowth.desc',
		type: 'armor',
		locks: true,
	},
];

/**
 * Look up a curse by ID.
 */
export function getCurse(id: string): CurseDef | undefined {
	return CURSES.find((c) => c.id === id.toLowerCase());
}

/**
 * Get all weapon curses.
 */
export function getWeaponCurses(): CurseDef[] {
	return CURSES.filter((c) => c.type === 'weapon');
}

/**
 * Get all armor curses.
 */
export function getArmorCurses(): CurseDef[] {
	return CURSES.filter((c) => c.type === 'armor');
}
