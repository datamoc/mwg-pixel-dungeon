/**
 * Weapon and armor curse definitions - permanent negative enchantments.
 * Curses can be removed with cleanse scrolls and are distinguished by cursed flag on items.
 *
 * Assignment is wired: `main.ts`'s `generatedInventoryItem` rolls a concrete curse id from
 * the affix tables when the generator flags a roll cursed, and `equipWeapon`/`equipArmor`
 * apply the cursed-and-known equip lock - see `PORT_COVERAGE.md`'s "Enchant/glyph/curse
 * assignment" row. **Correction: the old `fragile` entry here never existed in real Java**
 * (checked tag `v3.3.8` back to `v3.3.1` - the real 8th armor curse is `Stench`); `getCurse`
 * keeps a legacy `fragile` -> `stench` shim so pre-correction saves still cleanse/lock
 * correctly even before the load migration rewrites the id itself.
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
 * 15 of the 16 have live proc or passive branches in `main.ts` (weapon: Wayward, Annoying,
 * Dazzling, Displacing, Explosive, Polarized, Sacrificial; armor: Stench, AntiEntropy, Bulk,
 * Corrosion, Displacement, Metabolism, Multiplicity, Overgrowth). `Friendly` (needs a
 * two-way Charm subsystem) is the only curse with no proc logic yet.
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
		id: 'stench',
		nameKey: 'items.armor.curses.stench.name',
		descriptionKey: 'items.armor.curses.stench.desc',
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
 * Look up a curse by ID. Pre-correction saves may still carry the never-real `fragile` id;
 * it resolves to the real `stench` entry so equip locks and cleanse keep working on those
 * items even before the load migration rewrites the id itself.
 */
export function getCurse(id: string): CurseDef | undefined {
	const lower = id.toLowerCase();
	return CURSES.find((c) => c.id === (lower === 'fragile' ? 'stench' : lower));
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
