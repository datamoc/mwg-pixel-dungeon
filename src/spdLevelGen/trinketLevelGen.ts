import { SpdRandom } from '../spdRng';

/**
 * The carried Mossy Clump / Trap Mechanism as the level generator sees them (`items/trinkets/MossyClump.java`,
 * `TrapMechanism.java`, tag `v3.3.8`). Level generation is scene-free, so the scene hands the values in before
 * it asks for a floor (`setLevelGenTrinkets`) and clears them afterwards; with none carried every getter is the
 * identity and no extra RNG is drawn, so a run without these trinkets generates exactly the floors it did before.
 */
export interface LevelGenTrinkets {
	/** `MossyClump.overrideNormalLevelChance()` (0 with none). */
	readonly mossyChance: number;
	/** `TrapMechanism.overrideNormalLevelChance()` (0 with none). */
	readonly trapChance: number;
	/** `MossyClump.getNextFeeling()` as this port's feeling number (`GRASS` 2 / `WATER` 1). */
	nextMossyFeeling(): number;
	/** `TrapMechanism.getNextFeeling()` (`TRAPS` 5 / `CHASM` 0). */
	nextTrapFeeling(): number;
	/** `TrapMechanism.revealHiddenTrapChance()` (0 with none). */
	readonly trapRevealChance: number;
}

let current: LevelGenTrinkets | null = null;
export function setLevelGenTrinkets(next: LevelGenTrinkets | null): void { current = next; }
export function levelGenTrinkets(): LevelGenTrinkets | null { return current; }
/** `TrapMechanism.revealHiddenTrapChance()` for the floor being generated. */
export function trapRevealChance(): number { return current?.trapRevealChance ?? 0; }

/** The persisted per-trinket queue (`levelFeels` / `shuffles` on `MossyClump` and `TrapMechanism`). */
export interface FeelingQueue { feels: boolean[]; shuffles: number }

/**
 * `MossyClump.getNextFeeling()` / `TrapMechanism.getNextFeeling()` (tag `v3.3.8`): "ensures a little consistency of
 * RNG" - six entries (`trues` of `true`, the rest `false`) are shuffled `shuffles + 1` times on a generator seeded
 * `Dungeon.seed + 1` whenever the queue runs dry, then one is removed per overridden floor. Returns the removed value.
 */
export function nextQueuedFeeling(queue: FeelingQueue, trues: number, runSeed: bigint): boolean {
	if (queue.feels.length === 0) {
		SpdRandom.pushGenerator(runSeed + 1n);
		try {
			for (let i = 0; i < 6; i++) queue.feels.push(i < trues);
			for (let i = 0; i <= queue.shuffles; i++) SpdRandom.shuffle(queue.feels);
			queue.shuffles++;
		} finally {
			SpdRandom.popGenerator();
		}
	}
	return queue.feels.shift()!;
}
