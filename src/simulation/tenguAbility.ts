// Tengu's phase-2 ability cadence, extracted from the scene so it can be verified on its own.
// It is pure arithmetic plus at most one random draw, the same split `simulation/combat.ts`
// uses: no DOM, Pixi, or scheduler dependency, so `tools/verifySimulation.mjs` can drive it
// directly. The scene keeps everything that actually throws an ability (bombs, fire, shocker).
//
// Mirrors `Tengu.targetAbilityUses()` / `Tengu.canUseAbility()` (SPD tag v3.3.8):
//   targetAbilityUses = 1 + 2*arenaJumps + max(0, arenaJumps-2)   // 1 + 2/jump, +2 for jumps 3&4
//   canUseAbility():
//     if (HP > HT/2) return false;                 // phase 2 only
//     if (abilitiesUsed >= target) return false;   // bounded until another jump raises the budget
//     abilityCooldown--;
//     if (target - used >= 4 && !STRONGER) abilityCooldown = 0;
//     else if (target - used >= 3) { if (cooldown == -1 || cooldown > 1) cooldown = 1; }
//     else if (cooldown == -1) cooldown = Random.IntRange(1, 4);
//     return cooldown == 0;

export interface TenguAbilityState {
	hp: number;
	maxHp: number;
	/** Java's `abilityCooldown`, persisting across turns. Starts at 2. */
	cooldown: number;
	/** Java's `abilitiesUsed`: casts already made this fight. */
	used: number;
	arenaJumps: number;
	strongerBosses: boolean;
}

/** `Tengu.targetAbilityUses()`: one base use, two more per arena jump, plus an extra pair for
 * each of jumps 3 and 4 (a full four-jump fight therefore allows 11 casts). */
export function tenguTargetAbilityUses(arenaJumps: number): number {
	return 1 + 2 * arenaJumps + Math.max(0, arenaJumps - 2);
}

/**
 * `Tengu.useAbility()`'s trailing `spend()` (tag v3.3.8). `Actor.TICK = 1`, so a normal-mode cast
 * costs **2 ticks**, or 1 when 4+ behind on the cast budget; the bosses challenge costs 1 tick, or
 * **none at all** when 4+ behind. `behind` is `targetAbilityUses() - abilitiesUsed` read *before*
 * the cast is counted, exactly like Java. Returns the turn cost in scheduler units.
 */
export function tenguAbilityCost(strongerBosses: boolean, behind: number): number {
	if (strongerBosses) return behind >= 4 ? 0 : 1;
	return behind >= 4 ? 1 : 2;
}

/**
 * Advances the cadence by one Tengu turn. `rollCooldown` supplies `Random.IntRange(1, 4)` and
 * is only called when Java itself would draw - this keeps the random stream identical to Java's
 * (a call at the wrong point would desync every later roll in the run).
 */
export function stepTenguAbility(
	state: TenguAbilityState,
	rollCooldown: () => number,
): { cooldown: number; ready: boolean; target: number; behind: number } {
	const target = tenguTargetAbilityUses(state.arenaJumps);
	if (state.hp <= 0 || state.hp * 2 > state.maxHp) return { cooldown: state.cooldown, ready: false, target, behind: target - state.used };
	if (state.used >= target) return { cooldown: state.cooldown, ready: false, target, behind: 0 };
	let cooldown = state.cooldown - 1;
	const behind = target - state.used;
	if (behind >= 4 && !state.strongerBosses) {
		cooldown = 0;
	} else if (behind >= 3) {
		if (cooldown === -1 || cooldown > 1) cooldown = 1;
	} else if (cooldown === -1) {
		cooldown = rollCooldown();
	}
	return { cooldown, ready: cooldown === 0, target, behind };
}
