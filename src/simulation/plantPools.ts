/**
 * `Sungrass.Health` and `Earthroot.Armor` (`plants/Sungrass.java`, `plants/Earthroot.java`,
 * tag `v3.3.8`) as they apply to a non-Warden char - the mob half of each `Plant.activate`.
 * Both buffs are keep-state pools anchored to the cell they were granted on: Sungrass heals
 * gradually (`boost(HT)` adds max HP to `level`, each own turn accrues `(40+HT)/150` of
 * fractional healing and pays out whole points while decrementing `level`), Earthroot blocks
 * `min(damage, (scalingDepth+5)/2)` of every hit out of a max-HP pool. Either ends when its
 * owner leaves the grant cell or its pool runs out.
 *
 * Pure functions of their inputs so the suite can pin them without a scene; the scene owns
 * the per-creature fields, the grant-cell checks, and the HP bookkeeping, the same split
 * `simulation/defenderDamageCurves.ts` uses.
 */

export interface SungrassPool {
	/** `Health.level`: total healing still owed. `boost()` is additive, never keep-max. */
	level: number;
	/** `Health.partialHeal`: the fractional carry toward the next whole point. */
	partial: number;
}

/** `Sungrass.Health.boost(HT)`: adds max HP to the owed pool, keeps the fractional carry
 * (`boost()` never touches `partialHeal`), and the caller re-anchors the grant cell. */
export function grantSungrassHealth(current: SungrassPool | undefined, maxHp: number): SungrassPool {
	return { level: (current?.level ?? 0) + maxHp, partial: current?.partial ?? 0 };
}

export interface SungrassTick {
	/** `null` when the buff ends this turn (moved or exhausted). */
	pool: SungrassPool | null;
	/** Whole HP the owner regains, already capped at what it is missing. */
	healed: number;
}

/**
 * One own-turn `Sungrass.Health.act()` for a pool whose owner is missing `missingHp`.
 * `moved` is the `target.pos != pos` test. Java detaches there but still runs the tick
 * below (`detach()` mid-`act()` does not stop it); the port clears without the parting
 * tick instead - the same shape its hero-side `Health` model already uses, so moving off
 * the plant never grants a free heal.
 */
export function tickSungrassHealth(
	pool: SungrassPool | undefined, maxHp: number, missingHp: number, moved: boolean,
): SungrassTick {
	if (pool === undefined || pool.level <= 0 || moved) return { pool: null, healed: 0 };
	const partial = pool.partial + (40 + maxHp) / 150;
	//Strict `> 1`, as Java's own `if (partialHeal > 1)`: a carry landing exactly on 1.0
	//heals nothing this turn (`(int)1.0` is never paid out), it just sits until the next
	//turn's accrual pushes it over.
	if (partial <= 1) return { pool: { level: pool.level, partial }, healed: 0 };
	const healThisTurn = Math.floor(partial);
	const level = pool.level - healThisTurn;
	//`level` drains by the whole tick even at full HP (the spend sits outside Java's
	//`HP < HT` guard); only the HP gain itself is capped at what is missing.
	return { pool: level <= 0 ? null : { level, partial: partial - healThisTurn }, healed: Math.min(missingHp, healThisTurn) };
}

/** `Earthroot.Armor.level(HT)`: keep-max (`if (level < value) level = value`), unlike
 * Sungrass's additive boost - and the caller always re-anchors the grant cell either way. */
export function grantEarthrootArmor(currentLevel: number | undefined, maxHp: number): number {
	return Math.max(currentLevel ?? 0, maxHp);
}

export interface ArmorAbsorb {
	/** `null` when the pool detaches (moved or exhausted). */
	level: number | null;
	damage: number;
}

/**
 * `Earthroot.Armor.absorb()` for one landed attack hit with Java's per-hit cap
 * (`blocking()`, computed by the caller). A moved owner detaches and takes the hit whole;
 * otherwise the pool covers `min(damage, blocking)` - and the detaching hit still blocks
 * the full cap, not just what remains (`level <= block` detaches *after* subtracting the
 * whole block).
 */
export function absorbEarthrootArmor(
	level: number, damage: number, blocking: number, moved: boolean,
): ArmorAbsorb {
	if (moved) return { level: null, damage };
	const block = Math.min(damage, blocking);
	if (level <= block) return { level: null, damage: damage - block };
	return { level: level - block, damage: damage - block };
}
