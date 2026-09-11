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

import { MWL_CURSE_DEFINITIONS } from './mwlContent';

/** The 16 SPD curses are authored in `src/content/curse-rules.mwl`; runtime proc behavior
 * remains in `main.ts`, where it needs access to the live scene and combat state. */
export const CURSES: CurseDef[] = MWL_CURSE_DEFINITIONS.map((definition) => ({ ...definition }));

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
