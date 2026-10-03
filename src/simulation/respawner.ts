/**
 * `Level.respawner` / `MobSpawner` (`levels/Level.java` 690-790, `actors/mobs/MobSpawner.java`, tag `v3.3.8`) as pure rules: how many mobs a
 * floor counts, how long until the next wandering mob, and how many it tolerates. The scene (`scenes/dungeon/respawner.ts`) owns the clock,
 * the creature list and the placement.
 */
export const TIME_TO_RESPAWN = 50;

/** `Mob.spawningWeight()`: 1 unless overridden - 0 for the rows below, 0.5 for the Ghoul (`actors/mobs/*.java`). */
const ZERO_WEIGHT_KINDS: ReadonlySet<string> = new Set([
	'crystalGuardian', 'crystalSpire', 'fungalCore', 'fungalSentry', 'gnollGeomancer', 'gnollSapper', 'mimic', 'goldenMimic', 'crystalMimic',
	'ebonyMimic', 'necroSkeleton', 'piranha', 'phantomPiranha', 'ripperDemon', 'statue', 'armoredStatue', 'wraith',
]);

export function spawningWeight(kind: string | undefined): number {
	if (kind === undefined) return 1;
	if (kind === 'ghoul') return 0.5;
	return ZERO_WEIGHT_KINDS.has(kind) ? 0 : 1;
}

/** `Level.mobCount()`: the summed weight of the hostile, non-miniboss mobs, rounded. */
export function mobCount(mobs: ReadonlyArray<{ kind?: string; isHero?: boolean; isAlly?: boolean; isNPC?: boolean; miniboss?: boolean; hp: number }>): number {
	let count = 0;
	for (const mob of mobs) {
		if (mob.isHero || mob.isAlly || mob.isNPC || mob.miniboss === true || mob.hp <= 0) continue;
		count += spawningWeight(mob.kind);
	}
	return Math.round(count);
}

/** `GameMath.gate(min, value, max)`. */
const gate = (min: number, value: number, max: number): number => Math.max(min, Math.min(value, max));

/** `Level.respawnCooldown()`, before the Dimensional Sundial's divisor. */
export function baseRespawnCooldown(opts: { amuletObtained: boolean; depth: number; mobCount: number; dark: boolean }): number {
	if (opts.amuletObtained) {
		//floor 1: "very fast spawns! 0/2/4/6/8/10/12"; below: "5/5/10/15/20/25/25"
		if (opts.depth === 1) return opts.mobCount * (TIME_TO_RESPAWN / 25);
		return Math.round(gate(TIME_TO_RESPAWN / 10, opts.mobCount * (TIME_TO_RESPAWN / 10), TIME_TO_RESPAWN / 2));
	}
	return opts.dark ? 2 * TIME_TO_RESPAWN / 3 : TIME_TO_RESPAWN;
}

/** `RegularLevel.mobLimit()` for a floor the respawner may run on (boss floors return 0 from `Level.mobLimit()`). */
export function respawnMobLimit(opts: { depth: number; amuletObtained: boolean; large: boolean; roll: number }): number {
	if (opts.depth <= 1) return opts.amuletObtained ? 10 : 0;
	const mobs = 3 + (opts.depth % 5) + opts.roll;
	return opts.large ? Math.ceil(mobs * 1.33) : mobs;
}

/** What `MobSpawner.act()` does with the clock: spawn when under the limit (a failed placement retries in 1 turn). */
export function respawnStep(count: number, limit: number, cooldown: number, spawned: () => boolean): number {
	if (count < limit) return spawned() ? cooldown : 1;
	return cooldown;
}
