/**
 * Passive identification by use (`Weapon`/`Armor`/`Ring`/`Wand.readyToIdentify`, `Talent.itemIDSpeedFactor`, tag `v3.3.8`) as pure rules.
 *
 * An unidentified worn weapon, armor, ring, wielded wand or thrown-missile class slowly learns its own level: a weapon counts landed hits
 * (`usesToID()` 20), armor counts hits taken (`USES_TO_ID` 10), a wand counts zaps (`Wand.USES_TO_ID` 10, `wandUsed()`), a missile class counts landed
 * throws (`MissileWeapon.usesToID()` 10, "half of a melee weapon", `Weapon.proc` on the hit), and a ring counts experience (one hero level). A count
 * may only be spent from `availableUsesToID`, a pool that starts at half the total and refills with experience, so item-ID cannot be farmed on a rat;
 * the intuition talents multiply every spend. The scene (`scenes/dungeon/passiveId.ts`) owns where the counters live and what identifying does.
 */
export type PassiveIdKind = 'weapon' | 'armor' | 'ring' | 'wand' | 'missile';

export interface IdProgress {
	/** `usesLeftToID` / `levelsToID`: identified when it reaches 0 (or marked ready under the Shard of Oblivion). */
	left: number;
	/** `availableUsesToID`: how many uses may still be counted before more experience is earned (rings have none). */
	available: number;
}

export const USES_TO_ID: Readonly<Record<'weapon' | 'armor' | 'wand' | 'missile', number>> = { weapon: 20, armor: 10, wand: 10, missile: 10 };

export function freshProgress(kind: PassiveIdKind): IdProgress {
	if (kind === 'ring') return { left: 1, available: 0 };
	return { left: USES_TO_ID[kind], available: USES_TO_ID[kind] / 2 };
}

export interface IntuitionRanks { adventurers: number; veterans: number; thiefs: number; scholars: number; survivalists: number }

/** `Talent.itemIDSpeedFactor(hero, item)` for the five kinds this port tracks (the melee weapon, armor, wand, missile and ring columns). */
export function itemIdSpeedFactor(kind: PassiveIdKind, ranks: IntuitionRanks): number {
	if (kind === 'weapon') return (1 + 1.5 * ranks.adventurers) * (1 + 0.75 * ranks.veterans);
	if (kind === 'armor') return (1 + 0.75 * ranks.adventurers) * (1 + ranks.veterans);
	if (kind === 'wand') return 1 + 2 * ranks.scholars;
	if (kind === 'missile') return 1 + 2 * ranks.survivalists;
	return 1 + ranks.thiefs;
}

/**
 * One counted use (a landed weapon hit, a hit taken in armor): `uses = min(available, factor)` is spent from both counters. Returns true when
 * the counter has run out, i.e. the item is ready to identify.
 */
export function spendUse(progress: IdProgress, factor: number): boolean {
	const uses = Math.min(progress.available, factor);
	progress.available -= uses;
	progress.left -= uses;
	return progress.left <= 0;
}

/**
 * `onHeroGainExp(levelPercent)` for a weapon, armor, wand or missile: the pool refills over half a level (weapon, armor, missile: `levelPercent * usesToID`, capped at
 * half the total; wand: `Wand.onHeroGainExp` refills at half that rate, `levelPercent * USES_TO_ID / 2`). For a ring the experience is the counter
 * itself (`levelsToID -= levelPercent`) and the return value says whether it ran out.
 */
export function gainExperience(kind: PassiveIdKind, progress: IdProgress, levelPercent: number, factor: number): boolean {
	const percent = levelPercent * factor;
	if (kind === 'ring') {
		progress.left -= percent;
		return progress.left <= 0;
	}
	const total = USES_TO_ID[kind];
	const refill = kind === 'wand' ? percent * total / 2 : percent * total;
	if (progress.available <= total / 2) progress.available = Math.min(total / 2, progress.available + refill);
	return false;
}

/** `setIDReady()`: under the Shard of Oblivion the counter is forced to its ready state without identifying. */
export function markReady(progress: IdProgress): void {
	progress.left = -1;
}

export const isReady = (progress: IdProgress): boolean => progress.left <= 0;
