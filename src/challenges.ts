import { t } from './i18n';

export interface ChallengeDefinition {
	id: string;
	nameKey: string;
	descKey: string;
	/** `Challenges.java`'s int-mask bit (`MASKS`), so a mask stays comparable with Java's. */
	bit: number;
}

/**
 * `Challenges.NAME_IDS` order (tag `v3.3.8`): champion, stronger, food, armor, healing, herbalism,
 * swarm, darkness, scrolls - the order `WndChallenges` lists them in. The ids and `MASKS` bits match
 * `Challenges.java` (`CHAMPION_ENEMIES` 128, `STRONGER_BOSSES` 256, `NO_FOOD` 1, `NO_ARMOR` 2,
 * `NO_HEALING` 4, `NO_HERBALISM` 8, `SWARM_INTELLIGENCE` 16, `DARKNESS` 32, `NO_SCROLLS` 64).
 */
const BITS: Record<string, number> = {
	champion_enemies: 128, stronger_bosses: 256, no_food: 1, no_armor: 2, no_healing: 4,
	no_herbalism: 8, swarm_intelligence: 16, darkness: 32, no_scrolls: 64,
};
export const CHALLENGES: ChallengeDefinition[] = [
	'champion_enemies', 'stronger_bosses', 'no_food', 'no_armor', 'no_healing',
	'no_herbalism', 'swarm_intelligence', 'darkness', 'no_scrolls',
].map(id => ({ id, nameKey: `challenges.${id}`, descKey: `challenges.${id}_desc`, bit: BITS[id]! }));

const STORAGE_KEY = 'spd-on-mwg.challenges.v1';

/** `SPDSettings.challenges()`: the selection edited on the hero-select screen, kept between runs. */
let selected = new Set<string>();
try {
	const raw = localStorage.getItem(STORAGE_KEY);
	if (raw) selected = new Set(JSON.parse(raw).filter((id: unknown): id is string => typeof id === 'string' && id in BITS));
} catch { /* blocked storage simply starts with no modifiers */ }

/**
 * `Dungeon.challenges`: the mask snapshotted into the run at start (`Dungeon.init`, `Dungeon.java:236`)
 * and saved/restored with it (`:742,861`). `null` while no run has begun in this session, in which case
 * the setup selection is what readers see (pure logic and tests that toggle a challenge directly).
 */
let active: Set<string> | null = null;

function persist(): void {
	try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...selected])); } catch { /* session-only fallback */ }
}

/** The challenges in force: the run's own snapshot, or the setup selection before a run has begun. */
export function challenges(): Set<string> { return new Set(active ?? selected); }
export function isChallengeEnabled(id: string): boolean { return (active ?? selected).has(id); }
/** Setup-screen toggle only: it never touches a run already begun (`WndChallenges(.., editable=true)`). */
export function toggleChallenge(id: string): boolean {
	if (selected.has(id)) selected.delete(id); else selected.add(id);
	persist();
	return selected.has(id);
}
/** The setup selection (what the hero-select button edits and counts). */
export function setupChallenges(): Set<string> { return new Set(selected); }

/**
 * `HeroSelectScene.java:237`: the mask is reset to 0 until the `VICTORY` badge is unlocked. Then
 * `Dungeon.init` snapshots it into the run. Returns the snapshot.
 */
export function beginChallengeRun(victoryUnlocked: boolean): Set<string> {
	if (!victoryUnlocked && selected.size > 0) { selected = new Set(); persist(); }
	active = new Set(selected);
	return new Set(active);
}
/** Restores the mask a saved run carried (`Dungeon.loadGame`); absent in older saves means none. */
export function restoreRunChallenges(ids: readonly string[] | undefined): void {
	active = new Set((ids ?? []).filter((id) => id in BITS));
}
/** Back on the setup screens the selection is editable again and readers see it, not the finished run's mask. */
export function endChallengeRun(): void { active = null; }
/** True while a run's snapshot is in force: the in-run challenges window is then read-only. */
export function isRunChallengeLocked(): boolean { return active !== null; }
/** `Challenges.isItemBlocked()` (`core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/Challenges.java`,
 * tag `v3.3.8`): NO_HERBALISM prevents Dewdrops from entering `Level` heaps; it does not block seeds themselves. */
export function isItemBlocked(itemId: string, activeChallenges: ReadonlySet<string> = challenges()): boolean {
	return activeChallenges.has('no_herbalism') && itemId === 'dewdrop';
}
/** `Level.plant()` (`levels/Level.java`, tag `v3.3.8`) returns before registering any plant when NO_HERBALISM is
 * active (after its terrain-side effects). */
export function isPlantBlocked(activeChallenges: ReadonlySet<string> = challenges()): boolean {
	return activeChallenges.has('no_herbalism');
}
/** The run's mask as a list, for the save. */
export function runChallengeIds(): string[] { return [...(active ?? selected)]; }
/** `Challenges.activeChallenges()`: how many are set. */
export function activeChallengeCount(): number { return (active ?? selected).size; }
/** The Java int mask of `ids` (or of the run's challenges). */
export function challengeMask(ids: Iterable<string> = active ?? selected): number {
	let mask = 0;
	for (const id of ids) mask |= BITS[id] ?? 0;
	return mask;
}

/** Inverse of `challengeMask`: the challenge definitions whose bit is set, in `NAME_IDS` order. */
export function challengesFromMask(mask: number): ChallengeDefinition[] {
	return CHALLENGES.filter((def) => (mask & def.bit) !== 0);
}

/**
 * `Rankings.java:225`: the score is multiplied by `1.25^activeChallenges`, rounded to the nearest
 * 0.05 (`Math.round(mult * 20) / 20f`), then the score is scaled by it.
 */
export function challengeScoreMultiplier(count: number): number {
	return Math.round(Math.pow(1.25, count) * 20) / 20;
}

export function challengeLabel(def: ChallengeDefinition): string { return t(def.nameKey); }
export function challengeDescription(def: ChallengeDefinition): string { return t(def.descKey); }
