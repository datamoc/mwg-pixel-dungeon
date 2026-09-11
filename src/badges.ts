import { Achievements, SaveSystem } from 'mwg';
import { CLASS_BADGE, type ClassId } from './classes';
import { MWL_TABLE_ROWS } from './mwlContent';

/**
 * Badges (`Badges.java`) as `mwg/core` Achievements: one boss badge per chapter, victory,
 * four class unlocks, four death causes. Unlock badges follow Java's own triggers where
 * this port can observe them (upgrade scroll used, surprise hit landed, special thrown,
 * weapon at +2); the Cleric has no Java unlock (predates it), so first victory opens it -
 * a stated port rule, not a Java one.
 */
const BADGE_ROWS = MWL_TABLE_ROWS('badgeCatalogue', 'id');
export const BADGE_DEFS: { id: string; counter: string; target: number; description: string }[] = BADGE_ROWS.map((row) => ({
	id: String(row.id),
	counter: String(row.counter),
	target: Number(row.target),
	description: String(row.description),
}));

/**
 * `Badges.Badge.image` - the real 16x16-cell index each of `BADGE_DEFS`' entries cuts from
 * `badges.png`. Not a 1:1 mapping: `BADGE_DEFS` is its own smaller, invented set of
 * achievements (see its own comment), so several entries approximate the closest real Java
 * badge rather than reproducing an exact match - `death_trap` borrows `DEATH_FROM_GRIM_TRAP`
 * (Java has no single generic "died to a trap" badge, only per-cause ones), and `death_foe`
 * borrows `DEATH_FROM_ALL`'s icon (a generic skull) since Java has no "killed by a monster"
 * badge at all - every other entry below is an exact match.
 */
export const BADGE_ICON: Record<string, number> = Object.fromEntries(BADGE_ROWS.map((row) => [String(row.id), Number(row.icon)]));

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
