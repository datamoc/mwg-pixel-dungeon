import { t } from './i18n';

export interface ChallengeDefinition {
	id: string;
	nameKey: string;
	descKey: string;
}

/** The challenge ids match Challenges.java so save data remains portable. */
export const CHALLENGES: ChallengeDefinition[] = [
	'darkness', 'no_armor', 'no_food', 'no_healing', 'no_herbalism', 'no_scrolls',
	'stronger_bosses', 'champion_enemies', 'swarm_intelligence',
	].map(id => ({ id, nameKey: `challenges.${id}`, descKey: `challenges.${id}_desc` }));

const STORAGE_KEY = 'spd-on-mwg.challenges.v1';
/** `SPDSettings.challenges()`: the selection the hero-select screen edits. */
let setup = new Set<string>();
/** `Dungeon.challenges`: the mask a run snapshots at start and saves with itself (null outside a run). */
let run: Set<string> | null = null;
try {
	const raw = localStorage.getItem(STORAGE_KEY);
	if (raw) setup = new Set(JSON.parse(raw).filter((id: unknown): id is string => typeof id === 'string'));
} catch { /* blocked storage simply starts with no modifiers */ }

function persist(): void {
	try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...setup])); } catch { /* session-only fallback */ }
}

/** The challenges in force: the running game's snapshot, or the setup selection outside a run. */
export function challenges(): Set<string> { return new Set(run ?? setup); }
export function isChallengeEnabled(id: string): boolean { return (run ?? setup).has(id); }
/** The hero-select selection, regardless of any run in progress. */
export function setupChallenges(): Set<string> { return new Set(setup); }
export function isRunChallengeLocked(): boolean { return run !== null; }
/** `Dungeon.init()`'s `challenges = SPDSettings.challenges()`. */
export function beginRunChallenges(): void { run = new Set(setup); }
/** `Dungeon.loadGame`'s `challenges = bundle.getInt(CHALLENGES)`: only real ids survive. */
export function restoreRunChallenges(ids: readonly string[]): void {
	run = new Set(ids.filter((id) => CHALLENGES.some((def) => def.id === id)));
}
/** Back on the setup screens, the selection is editable again. */
export function endRunChallenges(): void { run = null; }
/** `Challenges.isItemBlocked()` (`core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/Challenges.java`,
 * tag `v3.3.8`): NO_HERBALISM
 * prevents Dewdrops from entering `Level` heaps; it does not block seeds themselves. */
export function isItemBlocked(itemId: string, activeChallenges: ReadonlySet<string> = challenges()): boolean {
	return activeChallenges.has('no_herbalism') && itemId === 'dewdrop';
}
/** `Level.plant()` (`levels/Level.java`, tag `v3.3.8`) returns before registering any
 * plant when NO_HERBALISM is active (after its terrain-side effects). */
export function isPlantBlocked(activeChallenges: ReadonlySet<string> = challenges()): boolean {
	return activeChallenges.has('no_herbalism');
}
export function toggleChallenge(id: string): boolean {
	if (run) return run.has(id);
	if (setup.has(id)) setup.delete(id); else setup.add(id);
	persist();
	return setup.has(id);
}
export function challengeLabel(def: ChallengeDefinition): string { return t(def.nameKey); }
export function challengeDescription(def: ChallengeDefinition): string { return t(def.descKey); }
