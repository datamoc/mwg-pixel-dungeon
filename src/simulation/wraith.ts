/** Plain wraith data at the spawn boundary; independent of sprites, saves, and framework state. */

export interface WraithCombatStats {
	accuracy: number;
	evasion: number;
	damageMin: number;
	damageMax: number;
}

/**
 * `Wraith.adjustStats(level)` (`actors/mobs/Wraith.java`, tag `v3.3.8`): the spawn
 * level becomes `10 + level` accuracy and five times that in evasion
 * (`defenseSkill = attackSkill(null) * 5`), and marks the wraith as having seen its
 * enemy. `damageRoll()` is `Random.NormalIntRange(1 + level/2, 2 + level)` - the
 * division is Java integer division on `level`, applied BEFORE the +1, so level 2
 * already rolls 2-4, not the 1-4 a `floor((1 + level)/2)` reading would give. That
 * ordering is also why this lives here rather than in the closed depth-stat table,
 * whose shapes divide after adding.
 */
export function wraithCombatStats(level: number): WraithCombatStats {
	return {
		accuracy: 10 + level,
		evasion: (10 + level) * 5,
		damageMin: 1 + Math.floor(level / 2),
		damageMax: 2 + level,
	};
}

export interface DustSpawnerStep {
	power: number;
	spawn: boolean;
	cost: number;
}

/**
 * `CorpseDust.DustGhostSpawner.act()`'s power economy (tag `v3.3.8`), minus the cell
 * search, which needs the live level. Each tick banks one power; `wraiths` counts the
 * wraith being summoned (1 + the live `DustWraith` count), and a new wraith costs
 * `min(49, wraiths*wraiths)` power - 1/4/9/16/25/36/49, then capped. Spending deducts
 * the cost; a tick that cannot afford one only banks.
 */
export function dustSpawnerStep(power: number, dustWraiths: number): DustSpawnerStep {
	const cost = Math.min(49, (1 + dustWraiths) * (1 + dustWraiths));
	const next = power + 1;
	if (next < cost) return { power: next, spawn: false, cost };
	return { power: next - cost, spawn: true, cost };
}

/**
 * The same buff's no-candidate brake: when no cell qualifies, power is capped at
 * `2*wraiths` rather than building without bound.
 */
export function dustSpawnerCap(power: number, dustWraiths: number): number {
	return Math.min(power, 2 * (1 + dustWraiths));
}
