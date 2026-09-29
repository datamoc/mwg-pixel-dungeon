import { RunHistory } from 'mwg';
import { activeChallengeCount, challengeMask, challengeScoreMultiplier } from './challenges';

/**
 * Small persistent run history behind `RankingsScene`. This deliberately stores completed runs
 * separately from the resumable `SaveSystem` slot: a death or victory must survive starting the
 * next run, and rankings must never resurrect a finished game.
 *
 * `mwg/core`'s `RunHistory` owns the storage, the id/`endedAt` stamping and the ranking sort;
 * only the summary shape below is SPD-specific, which is exactly the split `RunHistory` documents
 * (it stays agnostic about what a run's own report contains). Adopting it replaced this module's
 * hand-rolled read/validate/sort/write, and changed two behaviours it used to have by hand - both
 * recorded in `PORT_COVERAGE.md`:
 *
 *  - the retained 20 runs are now the most RECENT ones (`RunHistory`'s own "oldest runs are
 *    dropped once this many are stored" rule) rather than the highest-scoring 20;
 *  - the storage key is now `mwg-runs:spd-on-mwg.rankings.v1`, not the old
 *    `spd-on-mwg.rankings.v1`, so runs recorded before this change are not carried over.
 */
export interface RunRecord {
	result: 'won' | 'lost';
	depth: number;
	level: number;
	gold: number;
	score: number;
	/** the run's `Dungeon.challenges` int mask (`Rankings.java:308,344`), 0 when none. */
	challenges?: number;
}

/** `RankingsScene`'s score: depth dominates, then level, then gold. */
export function runScore(depth: number, level: number, gold: number): number {
	return depth * 1_000 + level * 100 + gold;
}

const history = new RunHistory<RunRecord>({ namespace: 'spd-on-mwg.rankings.v1', limit: 20 });

/**
 * Every recorded run, best score first. `RunHistory`'s store throws on corrupt JSON rather than
 * inventing a value (deliberately, so a real bug is not hidden), but a broken store must not stop
 * the title screen drawing, so that case still degrades to an empty list here.
 */
export function rankings(): RunRecord[] {
	try {
		return history.ranked((summary) => summary.score, 'desc').map((entry) => entry.summary);
	} catch {
		return [];
	}
}

export function recordRun(record: Omit<RunRecord, 'score'>): void {
	try {
		//`Rankings.calculateScore()` (`Rankings.java:225-231`): the score is scaled by `1.25^active`, rounded to 0.05.
		const mask = challengeMask();
		history.record({
			...record,
			score: Math.round(runScore(record.depth, record.level, record.gold) * challengeScoreMultiplier(activeChallengeCount())),
			...(mask !== 0 ? { challenges: mask } : {}),
		});
	} catch {
		//Private browsing/storage denial should not prevent a run ending normally.
	}
}
