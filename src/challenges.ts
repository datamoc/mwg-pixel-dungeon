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
let selected = new Set<string>();
try {
	const raw = localStorage.getItem(STORAGE_KEY);
	if (raw) selected = new Set(JSON.parse(raw).filter((id: unknown): id is string => typeof id === 'string'));
} catch { /* blocked storage simply starts with no modifiers */ }

function persist(): void {
	try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...selected])); } catch { /* session-only fallback */ }
}

export function challenges(): Set<string> { return new Set(selected); }
export function isChallengeEnabled(id: string): boolean { return selected.has(id); }
export function toggleChallenge(id: string): boolean {
	if (selected.has(id)) selected.delete(id); else selected.add(id);
	persist();
	return selected.has(id);
}
export function challengeLabel(def: ChallengeDefinition): string { return t(def.nameKey); }
export function challengeDescription(def: ChallengeDefinition): string { return t(def.descKey); }
