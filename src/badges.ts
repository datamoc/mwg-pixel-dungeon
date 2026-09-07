import { Achievements, SaveSystem } from 'mwg';
import { CLASS_BADGE, type ClassId } from './classes';

/**
 * Badges (`Badges.java`) as `mwg/core` Achievements: one boss badge per chapter, victory,
 * four class unlocks, four death causes. Unlock badges follow Java's own triggers where
 * this port can observe them (upgrade scroll used, surprise hit landed, special thrown,
 * weapon at +2); the Cleric has no Java unlock (predates it), so first victory opens it -
 * a stated port rule, not a Java one.
 */
export const BADGE_DEFS: { id: string; counter: string; target: number; description: string }[] = [
	{ id: 'boss1', counter: 'boss_goo', target: 1, description: 'Slew Goo' },
	{ id: 'boss2', counter: 'boss_tengu', target: 1, description: 'Slew Tengu' },
	{ id: 'boss3', counter: 'boss_dm300', target: 1, description: 'Slew DM-300' },
	{ id: 'boss4', counter: 'boss_king', target: 1, description: 'Slew the Dwarf King' },
	{ id: 'victory', counter: 'amulet', target: 1, description: 'Escaped with the Amulet' },
	{ id: 'unlock_mage', counter: 'upgrades_used', target: 1, description: 'Used an upgrade scroll' },
	{ id: 'unlock_rogue', counter: 'surprises', target: 10, description: '10 surprise attacks' },
	{ id: 'unlock_huntress', counter: 'throws', target: 10, description: '10 thrown attacks' },
	{ id: 'unlock_duelist', counter: 'weapon_plus2', target: 1, description: 'Raised a weapon to +2' },
	{ id: 'death_trap', counter: 'death_trap', target: 1, description: 'Died to a trap' },
	{ id: 'death_fire', counter: 'death_fire', target: 1, description: 'Died to fire' },
	{ id: 'death_poison', counter: 'death_poison', target: 1, description: 'Died to poison' },
	{ id: 'death_hunger', counter: 'death_hunger', target: 1, description: 'Starved to death' },
	{ id: 'death_foe', counter: 'death_foe', target: 1, description: 'Slain by a foe' },
];

/**
 * `Badges.Badge.image` - the real 16x16-cell index each of `BADGE_DEFS`' entries cuts from
 * `badges.png`. Not a 1:1 mapping: `BADGE_DEFS` is its own smaller, invented set of
 * achievements (see its own comment), so several entries approximate the closest real Java
 * badge rather than reproducing an exact match - `death_trap` borrows `DEATH_FROM_GRIM_TRAP`
 * (Java has no single generic "died to a trap" badge, only per-cause ones), and `death_foe`
 * borrows `DEATH_FROM_ALL`'s icon (a generic skull) since Java has no "killed by a monster"
 * badge at all - every other entry below is an exact match.
 */
export const BADGE_ICON: Record<string, number> = {
	boss1: 15, // BOSS_SLAIN_1
	boss2: 47, // BOSS_SLAIN_2
	boss3: 48, // BOSS_SLAIN_3
	boss4: 78, // BOSS_SLAIN_4
	victory: 82, // VICTORY
	unlock_mage: 1, // UNLOCK_MAGE
	unlock_rogue: 2, // UNLOCK_ROGUE
	unlock_huntress: 3, // UNLOCK_HUNTRESS
	unlock_duelist: 4, // UNLOCK_DUELIST
	death_trap: 81, // DEATH_FROM_GRIM_TRAP (closest available)
	death_fire: 16, // DEATH_FROM_FIRE
	death_poison: 17, // DEATH_FROM_POISON
	death_hunger: 19, // DEATH_FROM_HUNGER
	death_foe: 104, // DEATH_FROM_ALL (closest available - generic)
};

/** badges earned across runs, shared by the title, select and game scenes */
export function loadBadges(): Achievements {
	const badges = new Achievements();
	for (const badge of BADGE_DEFS) badges.define(badge);
	const meta = new SaveSystem<{ counts: [string, number][] }>({ namespace: 'spd-meta', version: 1 });
	const stored = meta.load('meta');
	return stored ? Achievements.fromJSON(BADGE_DEFS, stored.state) : badges;
}

export function classUnlocked(id: ClassId, badges: Achievements): boolean {
	const badge = CLASS_BADGE[id];
	return badge === null || badges.unlocked(badge);
}
