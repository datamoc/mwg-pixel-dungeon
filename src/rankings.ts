import { RunHistory } from 'mwg';
import { activeChallengeCount, challengeMask, challengeScoreMultiplier } from './challenges';
import { itemValue } from './items/shopPricing';

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
	/** `Statistics.highestAscent`: shallowest depth reached after starting the Amulet ascent (0 = never started). */
	highestAscent?: number;
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

export function recordRun(record: Omit<RunRecord, 'score'>, score: RunEndScore): void {
	try {
		const mask = challengeMask();
		//`Rankings.Record` stores highestAscent as the ranked depth once the climb has begun (Rankings.java:105-113, v3.3.8).
		const rankedDepth = record.highestAscent && record.highestAscent > 0 ? record.highestAscent : record.depth;
		//`Rankings.calculateScore()` (tag `v3.3.8`): the component total below, scaled by
		//`1.25^active` rounded to 0.05 (`challengeScoreMultiplier`, ported separately).
		const breakdown = calculateScore({ ...score, chalMultiplier: challengeScoreMultiplier(activeChallengeCount()) });
		history.record({
			...record,
			depth: rankedDepth,
			score: breakdown.total,
			...(mask !== 0 ? { challenges: mask } : {}),
		});
	} catch {
		//Private browsing/storage denial should not prevent a run ending normally.
	}
}

/**
 * R015: Java `Statistics`' score half (`Statistics.java`/`Rankings.java`, tag `v3.3.8`),
 * one per run. `questScores[0..4]`/`bossScores[0..4]` collect the quest/boss writes (only
 * positive entries count); `goldCollected` is lifetime gold picked up; `floorsExplored`
 * maps each left floor to its explored fraction. The boss writes belong to the boss kits
 * and the mine `[2]` writes to R055/R056, so both halves arrive as zeros until those land -
 * the formula already sums them the way Java does.
 */
export interface ScoreState {
	questScores: number[];
	bossScores: number[];
	goldCollected: number;
	floorsExplored: Record<number, number>;
}

export function newScoreState(): ScoreState {
	return { questScores: [0, 0, 0, 0, 0], bossScores: [0, 0, 0, 0, 0], goldCollected: 0, floorsExplored: {} };
}

//Run state lives behind the scene key - the same shape as the staff-imbue map in
//`items/wands.ts` - so no field lands on the line-budgeted `dungeonScene.ts`.
const scoreByScene = new WeakMap<object, ScoreState>();

export function scoreStateFor(scene: object): ScoreState {
	let state = scoreByScene.get(scene);
	if (!state) { state = newScoreState(); scoreByScene.set(scene, state); }
	return state;
}

/** Overwrite one quest score outright (`Imp.Quest.complete()` assigns `[3] = 4000`). */
export function setQuestScore(scene: object, index: number, value: number): void {
	if (index < 0 || index > 4) return;
	scoreStateFor(scene).questScores[index] = value;
}

/** Every other quest/boss write adds (`Statistics.questScores[i] += n`). */
export function addQuestScore(scene: object, index: number, delta: number): void {
	if (index < 0 || index > 4) return;
	scoreStateFor(scene).questScores[index]! += delta;
}

/** Seam for the boss kits' `bossScores` writes; no callers yet (see the `ScoreState` note). */
export function addBossScore(scene: object, index: number, delta: number): void {
	if (index < 0 || index > 4) return;
	scoreStateFor(scene).bossScores[index]! += delta;
}

export function noteGoldCollected(scene: object, amount: number): void {
	if (amount > 0) scoreStateFor(scene).goldCollected += amount;
}

/** `Dungeon.updateLevelExplored()`: remember a left floor's explored fraction (0..1). */
export function noteFloorExplored(scene: object, depth: number, fraction: number): void {
	scoreStateFor(scene).floorsExplored[depth] = Math.min(1, Math.max(0, fraction));
}

/** The component inputs `recordRun` scores (everything `calculateScore` reads). */
export interface ScoreInput {
	heroLevel: number;
	deepestFloor: number;
	goldCollected: number;
	heldItemValue: number;
	/** belongings hold CorpseDust while `deepestFloor >= 10` (the necromancer override). */
	corpseDustKept: boolean;
	floorsExplored: Readonly<Record<number, number>>;
	questScores: readonly number[];
	bossScores: readonly number[];
	gameWon: boolean;
	ascended: boolean;
	chalMultiplier: number;
}

export type RunEndScore = Omit<ScoreInput, 'chalMultiplier'>;

export interface ScoreBreakdown {
	total: number;
	progress: number;
	treasure: number;
	explore: number;
	boss: number;
	quest: number;
}

/**
 * `Rankings.calculateScore()` (tag `v3.3.8`, the post-1.2.3 branch - the only one a new
 * port records): progress (`lvl x deepest x 65`, cap 50,000), treasure (gold collected plus
 * held-item value, cap 20,000), exploration (each floor's fraction times `floors x 50`,
 * rounded per floor), the positive boss/quest sums, times the win multiplier (1, 2 on a win,
 * 2.5 ascended) and the challenge multiplier. The CorpseDust override (`questScores[1] =
 * 2000`, ignoring penalties) applies to a copy, never the run state. The final truncation is
 * Java's: `Statistics.totalScore` is an `int`, so the float product truncates - `Math.floor`
 * on non-negative inputs, not `Math.round`.
 */
export function calculateScore(input: ScoreInput): ScoreBreakdown {
	const quest = input.questScores.slice();
	if (input.corpseDustKept && input.deepestFloor >= 10) quest[1] = 2000;
	const progress = Math.min(input.heroLevel * input.deepestFloor * 65, 50_000);
	const treasure = Math.min(input.goldCollected + input.heldItemValue, 20_000);
	const depths = Object.keys(input.floorsExplored);
	const perFloor = depths.length * 50;
	let explore = 0;
	for (const key of depths) explore += Math.round((input.floorsExplored[Number(key)] ?? 0) * perFloor);
	let boss = 0;
	for (const score of input.bossScores) if (score > 0) boss += score;
	let questTotal = 0;
	for (const score of quest) if (score > 0) questTotal += score;
	const win = 1 + (input.gameWon ? 1 : 0) + (input.ascended ? 0.5 : 0);
	const total = Math.floor((progress + treasure + explore + boss + questTotal) * win * input.chalMultiplier);
	return { total, progress, treasure, explore, boss, quest: questTotal };
}

/** A belonging as the held-value loop sees it (bag entries plus the worn descriptors). */
export interface ScoredBelonging {
	id: string;
	quantity?: number;
	identified?: boolean;
	tier?: number;
	level?: number;
	affix?: string | null;
	cursed?: boolean;
	cursedKnown?: boolean;
	seal?: boolean;
	sourceClass?: string;
}

/**
 * The `heldItemValue` loop inside `Rankings.calculateScore()` (tag `v3.3.8`): every
 * belonging's `value()`, through this port's `itemValue` analogue (which mirrors each
 * class's `value()` - consumables included). `MagesStaff.value()` is 0, so a staff-shaped
 * `weaponReward` contributes nothing, wielded or carried.
 */
export function heldItemValue(belongings: readonly ScoredBelonging[]): number {
	let total = 0;
	for (const item of belongings) {
		if (item.id === 'weaponReward' && item.sourceClass === 'MagesStaff') continue;
		total += itemValue(item.id, item.quantity ?? 1, item.identified ?? true, {
			tier: item.tier,
			level: item.level,
			affix: item.affix ?? undefined,
			cursed: item.cursed,
			cursedKnown: item.cursedKnown,
			seal: item.seal,
		});
	}
	return total;
}
