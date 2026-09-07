/**
 * Small persistent run history behind `RankingsScene`. This deliberately stores completed runs
 * separately from the resumable `SaveSystem` slot: a death or victory must survive starting the
 * next run, and rankings must never resurrect a finished game.
 */
export interface RunRecord {
	result: 'won' | 'lost';
	depth: number;
	level: number;
	gold: number;
	score: number;
	finishedAt: number;
}

const KEY = 'spd-on-mwg.rankings.v1';
const LIMIT = 20;

export function rankings(): RunRecord[] {
	try {
		const raw = localStorage.getItem(KEY);
		const value: unknown = raw ? JSON.parse(raw) : [];
		if (!Array.isArray(value)) return [];
		return value.filter((record): record is RunRecord =>
			typeof record === 'object' && record !== null &&
			(record as RunRecord).result !== undefined && Number.isFinite((record as RunRecord).score)
		).sort((a, b) => b.score - a.score || b.finishedAt - a.finishedAt);
	} catch {
		return [];
	}
}

export function recordRun(record: Omit<RunRecord, 'score' | 'finishedAt'>): void {
	const score = record.depth * 1_000 + record.level * 100 + record.gold;
	try {
		const all = [...rankings(), { ...record, score, finishedAt: Date.now() }]
			.sort((a, b) => b.score - a.score || b.finishedAt - a.finishedAt)
			.slice(0, LIMIT);
		localStorage.setItem(KEY, JSON.stringify(all));
	} catch {
		//Private browsing/storage denial should not prevent a run ending normally.
	}
}
