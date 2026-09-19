/**
 * Smoke bomb + shrouding fog (`items/bombs/SmokeBomb.java`,
 * `actors/blobs/SmokeScreen.java`, `levels/Level.java#updateFieldOfView`, tag `v3.3.8`).
 *
 * `SmokeBomb.explode()` runs the ordinary blast (`super.explode()`, handled by the
 * existing specialty-bomb rule) and then seeds `SmokeScreen` 40 on every cell of a
 * distance-2 flood but the center; every flood key (center included) costs 40 from a
 * 1000-volume budget, and the unplaced share piles onto the center. `SmokeScreen`
 * itself has no `evolve()` override, so it spreads
 * like a base `Blob` and applies no per-turn effect - its whole game effect is vision:
 * `updateFieldOfView` treats every cell with smoke on it as sight-blocking for
 * everyone except allies and the gnoll geomancer.
 *
 * This module is the pure seed-plan half; the scene owns the persisted blob, the
 * per-turn advance and the sight pruning.
 */
import { brewShatterCells } from './brews';

/** `SmokeBomb.explosionRange()`: the smoke flood reaches two steps. */
export const SMOKEBOMB_RADIUS = 2;
/** Per-cell `SmokeScreen` seed volume. */
export const SMOKEBOMB_VOLUME = 40;
/** The flood budget Java tops the center up from (`centerVolume = 1000`, minus 40 per cell). */
export const SMOKEBOMB_CENTER_BUDGET = 1000;

/** `SmokeBomb.explode()`'s smoke half as data: per-cell seeds plus the center top-up. */
export function smokeBombSeedPlan(
	width: number,
	height: number,
	isSolid: (x: number, y: number) => boolean,
	cx: number,
	cy: number,
): { seeds: { x: number; y: number; volume: number }[]; centerVolume: number } {
	const flood = brewShatterCells(width, height, isSolid, cx, cy, SMOKEBOMB_RADIUS);
	//Java's loop seeds every reached cell but the center (`if (i == cell ...) centerVolume
	//-= 40; else Blob.seed(i, 40, ...)`); the center still counts toward the budget.
	const seeds = flood
		.filter((cell) => cell.x !== cx || cell.y !== cy)
		.map((cell) => ({ ...cell, volume: SMOKEBOMB_VOLUME }));
	const centerVolume = Math.max(0, SMOKEBOMB_CENTER_BUDGET - SMOKEBOMB_VOLUME * flood.length);
	return { seeds, centerVolume };
}
