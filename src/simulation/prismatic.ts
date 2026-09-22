/**
 * The exotic Scroll of Prismatic Image's guard/image chain
 * (`ScrollOfPrismaticImage.java`, `PrismaticGuard.java`,
 * `actors/mobs/npcs/PrismaticImage.java`, all tag `v3.3.8`).
 *
 * What Java does, in full:
 * - Reading the scroll heals every live `PrismaticImage` to its HT (with a
 *   floating heal readout); if a stasis ally is an image it is healed instead;
 *   otherwise the reader gains `PrismaticGuard` set to `maxHP` (Stasis has no
 *   system here, so that middle branch is skipped - stated in PORT_COVERAGE).
 * - `PrismaticGuard.maxHP(hero)` is `10 + floor(lvl * 2.5)` ("half of hero's
 *   HP"). The guard is NOT a shield: it absorbs nothing. Each turn it looks
 *   for the closest live visible enemy that is not invulnerable to the image,
 *   not PASSIVE/WANDERING/SLEEPING and not mind-vision-only; if one is within
 *   Chebyshev distance 5 it spawns a `PrismaticImage` duplicated with
 *   `floor(guard HP)` at the free passable neighbouring cell closest (Euclidean)
 *   to that enemy, and detaches. Otherwise it spends the tick, and regains
 *   0.1 HP per turn while hurt and regeneration is on. `PowerOfMany` turns ride
 *   along (no Cleric spell system here, so always zero - stated).
 * - The image (`HP = HT = 10` base, `defenseSkill` 1, ALLY, intelligent,
 *   HUNTING, `actPriority = MOB_PRIO + 1`): `duplicate(hero, HP)` keeps the
 *   given HP and sets `HT = maxHP(hero)`. `damageRoll()` is
 *   `NormalIntRange(2 + lvl/4, 4 + lvl/2)`; `attackSkill()` is
 *   `(9 + lvl) * accuracyMultiplier`; `defenseSkill()` is
 *   `super.defenseSkill(enemy) * (baseEvasion + heroEvasion) / 2` with
 *   `baseEvasion = 4 + lvl` and `heroEvasion = (4 + lvl) * evasionMultiplier`
 *   through the armor's `evasionFactor` (plus the armor-proc branch at
 *   lines 175-177, unmodeled - flat-DR model); `drRoll()` adds the hero's
 *   own; `defenseProc()` runs the
 *   hero armor's proc and `glyphLevel()` takes the max; `attackProc()` aggros
 *   the mob onto the image. Non-chasm death starts a 5-turn fade (healable,
 *   then destroyed); wandering with no enemy in sight converts back into the
 *   guard at the image's current HP. Immune to ToxicGas, CorrosiveGas, Burning
 *   and AllyBuff.
 *
 * What this module holds is the arithmetic that needs no scene: the guard cap,
 * the image's hero-derived combat stats, and the spawn-cell pick. Turn
 * plumbing (guard hatch, fade, wander-return) lives in the scene next to the
 * other ally turns; the scroll read lives in `items/scrollEffects.ts`; brewing
 * (`ScrollToExotic`: one regular scroll, cost 6) lives in `items/alchemy.ts`.
 */
export interface PrismaticImageStats {
	readonly accuracy: number;
	readonly evasion: number;
	readonly damageMin: number;
	readonly damageMax: number;
	readonly maxHp: number;
}

/** `PrismaticGuard.maxHP(hero)`: `10 + floor(lvl * 2.5)`. */
export function prismaticGuardMaxHp(heroLevel: number): number {
	return 10 + Math.floor(heroLevel * 2.5);
}

/**
 * The image's hero-derived combat stats. `accuracyMult`/`evasionMult` are the
 * ring multipliers (`RingOfAccuracy.accuracyMultiplier()` = `1.3^bonus`,
 * `RingOfEvasion.evasionMultiplier()` = `1.125^bonus`); the armor's own
 * `evasionFactor` hook has no expression in this port's armor model, so the
 * evasion term reads the ring-scaled value directly (stated in PORT_COVERAGE).
 * All three truncations are Java's `(int)` casts: `lvl/4` and `lvl/2` divide
 * before the range is built, and the final evasion halves with integer math.
 * `superDefense` is `Mob.defenseSkill(enemy)`'s 0/1 multiplier
 * (`imageSuperDefenseSkill` in `simulation/mirrorImage`, shared - both
 * images multiply the same `super` by the same blend): 0 when the image is
 * surprised, paralysed, illuminated under a Cleric hero, or facing the hero
 * itself. It defaults to 1, so existing spawn/sync call sites are unchanged
 * until the scene threads per-attacker state through.
 */
export function prismaticImageStats(heroLevel: number, accuracyMult: number, evasionMult: number, superDefense: 0 | 1 = 1): PrismaticImageStats {
	const baseEvasion = 4 + heroLevel;
	const heroEvasion = Math.trunc(baseEvasion * evasionMult);
	return {
		accuracy: Math.trunc((9 + heroLevel) * accuracyMult),
		evasion: Math.trunc(superDefense * (baseEvasion + heroEvasion) / 2),
		damageMin: 2 + Math.trunc(heroLevel / 4),
		damageMax: 4 + Math.trunc(heroLevel / 2),
		maxHp: prismaticGuardMaxHp(heroLevel),
	};
}

/** Non-chasm death starts a 5-turn healable fade (`deathTimer = 5`). */
export const PRISMATIC_FADE_TURNS = 5;

/** The guard hatches once a live alerted enemy is within this Chebyshev range. */
export const PRISMATIC_HATCH_RANGE = 5;

/**
 * `PrismaticGuard.act()`'s spawn-cell pick over the hero's neighbouring cells
 * in `PathFinder.NEIGHBOURS8` order: the free one closest (Euclidean, Java's
 * `trueDistance`) to the enemy. `candidates` must already be the free passable
 * unoccupied neighbours in that order with their Euclidean distances; ties
 * keep the earliest, exactly like Java's strict `<` comparison.
 */
export function prismaticSpawnCell(candidates: readonly { x: number; y: number; distance: number }[]): { x: number; y: number } | undefined {
	let best: { x: number; y: number; distance: number } | undefined;
	for (const candidate of candidates) {
		if (best === undefined || candidate.distance < best.distance) best = candidate;
	}
	return best === undefined ? undefined : { x: best.x, y: best.y };
}
