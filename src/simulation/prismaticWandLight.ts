/**
 * `WandOfPrismaticLight.onZap()` (tag `v3.3.8`, `WandOfPrismaticLight.java:72-78`): every zap
 * that finds `Dungeon.level.viewDistance < 6` prolongs the caster's Light buff, by `2 + lvl`
 * under `Challenges.DARKNESS` (Into darkness) and `10 + 5*lvl` otherwise. The buff is granted
 * whether or not the bolt hits a character (it sits before the `findChar` branch).
 * Stat text `upgradeStat3` (`:147`) prints the same two numbers; this port shows no per-upgrade
 * wand stat lines at all (see the PORT_COVERAGE row), so only the buff is reproduced.
 */
export function prismaticWandLightDuration(levelViewDistance: number, darkness: boolean, buffedLevel: number): number {
	if (levelViewDistance >= 6) return 0;
	return darkness ? 2 + buffedLevel : 10 + 5 * buffedLevel;
}

/**
 * `Level.viewDistance` as this port models it, before any Light buff and before the hero's own
 * Farsight/Eye-of-Newt multipliers (those scale `Char.viewDistance`, not the level field):
 * `Level.java:157` gives 2 under Into darkness and 8 otherwise, the depth-26 floor is the
 * port's base-4 one (`viewRadius()` in `combatResolution.ts`), and a live Yog shrinks it through
 * `YogDzewa.updateVisibility()` (`min(.., 2)` under the challenge). The Dark floor feeling's
 * `round(5*8/8)` is not modeled by the port's sight radius, so it is not modeled here either.
 */
export function levelViewDistance(depth: number, darkness: boolean, yogPhase: number | undefined): number {
	if (yogPhase !== undefined) {
		const yog = Math.max(4 - (yogPhase - 1), 1);
		return darkness ? Math.min(yog, 2) : yog;
	}
	const base = depth === 26 ? 4 : 8;
	return darkness ? Math.min(base, 2) : base;
}

/** `Buff.prolong(curUser, Light.class, ...)`: raise the hero's Light to at least the new duration. */
export function prolongPrismaticWandLight(buffs: Record<string, number>, depth: number, darkness: boolean, yogPhase: number | undefined, buffedLevel: number): void {
	const duration = prismaticWandLightDuration(levelViewDistance(depth, darkness, yogPhase), darkness, buffedLevel);
	if (duration > 0) buffs['light'] = Math.max(buffs['light'] ?? 0, duration);
}
