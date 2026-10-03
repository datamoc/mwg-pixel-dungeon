/** Dungeon music selection (`SewerLevel`/`PrisonLevel`/`CavesLevel`/`CityLevel`/`HallsLevel`
 * `.playLevelMusic()` plus the three `*BossLevel` overrides, tag `v3.3.8`) - pure decision
 * tables with no playback, so the audio seam stays thin and the matrix pins headlessly. */

export type MusicRegion = 'sewers' | 'prison' | 'caves' | 'city' | 'halls';

/** Everything `enterDungeon` needs that the audio backend cannot see. */
export interface DungeonMusicConditions {
	/** Depth is a boss depth (`depth in BOSSES` at the call site). */
	boss: boolean;
	/** The boss arena is sealed (`floorLocked()`). */
	locked: boolean;
	/** The tracked boss bleeds (`bossBleeding || bossBleedLatched`). */
	bleeding: boolean;
	/** `quests.status('sadGhost') === 'active'` (SewerLevel's `Ghost.Quest.active()`). */
	ghostActive: boolean;
	/** `quests.status('wandmaker') === 'active'` (PrisonLevel's `Wandmaker.Quest.active()`). */
	wandmakerActive: boolean;
	amuletObtained: boolean;
	depth: number;
}

export type DungeonMusicSelection =
	| { kind: 'track'; file: string }
	| { kind: 'queue'; files: string[] };

/** Regions with a bleeding-boss finale track (`CavesBossLevel`/`CityBossLevel`/`HallsBossLevel`). */
export const FINALE_REGIONS: ReadonlySet<MusicRegion> = new Set(['caves', 'city', 'halls']);

/** The six queue slots every region repeats (`R_1, R_2, R_2, R_1, R_3, R_3`). */
export const REGION_QUEUE_SLOTS = [1, 2, 2, 1, 3, 3] as const;

/** The per-slot pass chances every region repeats (`1, 1, 0.5, 0.25, 1, 0.5`). */
export const REGION_QUEUE_CHANCES = [1, 1, 0.5, 0.25, 1, 0.5] as const;

/**
 * One Java `Music.playTracks` loop iteration's worth of coin flips: each entry passes on
 * its own flip (the R107 line records the flip-per-entry contract; the framework's own
 * `playTracks` is sequential-only, so the filtering happens here, game-side). Slots 1, 2
 * and 4 pass unconditionally (chance 1 with a `[0, 1)` roll), so the queue is never empty.
 */
export function filterMusicQueue(entries: readonly string[], chances: readonly number[], roll: () => number): string[] {
	const kept: string[] = [];
	for (let i = 0; i < entries.length; i++) {
		if (roll() < (chances[i] ?? 0)) kept.push(entries[i]!);
	}
	return kept;
}

/**
 * Which music a dungeon floor gets. Boss depths keep the boss track, switching to the
 * finale while a finale-region arena is sealed and bleeding; the regions play their tense
 * loop under their Java conditions (Sewers: Ghost quest or Amulet, with depth-1-plus-Amulet
 * on `THEME_FINALE`; Prison: Wandmaker quest or Amulet; Caves/City/Halls: Amulet), else
 * the chance-filtered rotation queue.
 */
export function selectDungeonMusic(region: MusicRegion, state: DungeonMusicConditions, roll: () => number): DungeonMusicSelection {
	if (state.boss) {
		if (FINALE_REGIONS.has(region) && state.locked && state.bleeding) return { kind: 'track', file: `${region}_boss_finale.ogg` };
		return { kind: 'track', file: `${region}_boss.ogg` };
	}
	if (region === 'sewers') {
		if (state.amuletObtained && state.depth === 1) return { kind: 'track', file: 'theme_finale.ogg' };
		if (state.ghostActive || state.amuletObtained) return { kind: 'track', file: 'sewers_tense.ogg' };
	} else if (region === 'prison') {
		if (state.wandmakerActive || state.amuletObtained) return { kind: 'track', file: 'prison_tense.ogg' };
	} else if (state.amuletObtained) {
		return { kind: 'track', file: `${region}_tense.ogg` };
	}
	const queue = REGION_QUEUE_SLOTS.map((slot) => `${region}_${slot}.ogg`);
	return { kind: 'queue', files: filterMusicQueue(queue, REGION_QUEUE_CHANCES, roll) };
}
