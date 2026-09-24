/**
 * `Regeneration` and `LockedFloor` (`actors/buffs/Regeneration.java`, `actors/buffs/LockedFloor.java`,
 * tag `v3.3.8`; the real `4.0.0-beta` drops `regenOn()`'s `VaultLevel` check, moot here - no
 * vault levels): the hero's natural HP
 * regeneration, and the boss-arena lock that switches it (and every other "passive while regen is
 * on" effect in the game) off once the hero stalls a boss fight.
 *
 * Renderer-free: the scene owns the state (`RegenerationState`) and calls these once per actor
 * tick. `regenOn()` itself is two gates in Java - a `LockedFloor` whose `left` ran out, and
 * `Dungeon.level instanceof VaultLevel`. The vault branch is a v3.3.8 developer test area this port
 * does not generate (see `PORT_COVERAGE.md`'s VaultSentry row), so only the lock gate is live here.
 * `MiningLevel` is *not* a gate in either tag, whatever older comments in this repo claimed.
 */

/** `Regeneration.REGENERATION_DELAY`: 1 HP every 10 turns. */
export const REGENERATION_DELAY = 10;

/** `LockedFloor.left`'s field initialiser: 50 turns, 20 under Stronger Bosses. */
export const LOCKED_FLOOR_START = 50;
export const LOCKED_FLOOR_START_STRONGER = 20;
/** `LockedFloor.addTime()`: "cannot build to more than 50" (even under Stronger Bosses). */
export const LOCKED_FLOOR_CAP = 50;

export interface RegenerationState {
	/** `Regeneration.partialRegen` (bundled as `partial_regen`). */
	partial: number;
	/** `LockedFloor.left`, or `null` while the hero has no `LockedFloor` buff. */
	lockLeft: number | null;
}

export function newRegenerationState(): RegenerationState {
	return { partial: 0, lockLeft: null };
}

/** `Regeneration.regenOn()` minus the unported `VaultLevel` gate. */
export function regenOn(lockLeft: number | null): boolean {
	return lockLeft === null || lockLeft >= 1;
}

export function lockedFloorStart(strongerBosses: boolean): number {
	return strongerBosses ? LOCKED_FLOOR_START_STRONGER : LOCKED_FLOOR_START;
}

/**
 * `LockedFloor.act()`: detach once `Dungeon.level.locked` clears, else `if (left >= 1) left--`.
 * `Level.seal()` attaches the buff (`Buff.affect`), so a locked floor with no buff yet gains a fresh
 * one here instead of being decremented on its first tick.
 */
export function tickLockedFloor(lockLeft: number | null, floorLocked: boolean, strongerBosses: boolean): number | null {
	if (!floorLocked) return null;
	if (lockLeft === null) return lockedFloorStart(strongerBosses);
	return lockLeft >= 1 ? lockLeft - 1 : lockLeft;
}

/** `LockedFloor.addTime()`: capped at 50. */
export function addLockedFloorTime(lockLeft: number | null, time: number): number | null {
	if (lockLeft === null) return null;
	return Math.min(lockLeft + time, LOCKED_FLOOR_CAP);
}

/** `LockedFloor.removeTime()`: "can go negative!". */
export function removeLockedFloorTime(lockLeft: number | null, time: number): number | null {
	return lockLeft === null ? null : lockLeft - time;
}

/**
 * Each boss's `damage()` override feeds the lock by a per-boss factor of either the incoming
 * `dmg` argument (`dealt`) or the HP it actually lost (`hpLost`, Java's `preHP - HP`/`dmgTaken`):
 * `Goo`, `Pylon`, `DwarfKing` read `dmg`; `DM300`, `Tengu`, `YogDzewa`, `YogFist` read the HP delta.
 */
export const LOCKED_FLOOR_BOSS_TIME: Readonly<Record<string, { normal: number; stronger: number; basis: 'dealt' | 'hpLost' }>> = {
	goo: { normal: 1.5, stronger: 1, basis: 'dealt' },
	pylon: { normal: 1, stronger: 1 / 2, basis: 'dealt' },
	king: { normal: 1 / 3, stronger: 1 / 5, basis: 'dealt' },
	dm300: { normal: 1, stronger: 1 / 2, basis: 'hpLost' },
	tengu: { normal: 1, stronger: 2 / 3, basis: 'hpLost' },
	yog: { normal: 1 / 2, stronger: 1 / 3, basis: 'hpLost' },
	yogFist: { normal: 1 / 2, stronger: 1 / 4, basis: 'hpLost' },
};

/** The lock time one boss hit buys back, or 0 for a non-boss kind. */
export function lockedFloorBossTime(kind: string | undefined, dealt: number, hpLost: number, strongerBosses: boolean): number {
	const rule = kind === undefined ? undefined : LOCKED_FLOOR_BOSS_TIME[kind];
	if (!rule) return 0;
	const amount = rule.basis === 'dealt' ? dealt : hpLost;
	//`YogFist`/`DM300` guard `dmgTaken > 0`; `LockedFloor.addTime` of a non-positive amount is a
	//no-op in effect for the others too, since no path here reports negative damage.
	if (amount <= 0) return 0;
	return amount * (strongerBosses ? rule.stronger : rule.normal);
}

export interface RegenerationDelayInput {
	/** A carried Chalice of Blood's level, or -1 without one (`chaliceRegen` absent). */
	chaliceLevel: number;
	chaliceCursed: boolean;
	magicImmune: boolean;
	/** `RingOfEnergy.artifactChargeMultiplier(target)`. */
	artifactChargeMultiplier: number;
}

/**
 * `Regeneration.act()`'s delay: a cursed chalice slows regen by half, an uncursed one takes
 * `1.33 + 0.667*level` off the 10-turn delay ("15% boost at +0, scaling to a 500% boost at +10")
 * and then divides by the energy multiplier. `MagicImmune` switches the chalice off entirely.
 * `SaltCube.healthRegenMultiplier()` is omitted: this port has no trinket system (it is 1 then).
 */
export function regenerationDelay(input: RegenerationDelayInput): number {
	let delay = REGENERATION_DELAY;
	if (input.chaliceLevel !== -1 && !input.magicImmune) {
		if (input.chaliceCursed) delay *= 1.5;
		else {
			delay -= 1.33 + input.chaliceLevel * 0.667;
			delay /= input.artifactChargeMultiplier;
		}
	}
	return delay;
}

export interface RegenerationTickResult {
	hp: number;
	partial: number;
	healed: number;
}

/**
 * One `Regeneration.act()`: while alive, regen is on, below `regencap()` (= `HT`) and not
 * starving, `partialRegen += 1/delay` and whole points move onto HP, capped at HT. `ticks`
 * scales the gain for a multi-turn or fractional action (Java acts once per 1.0 of actor time).
 */
export function tickRegeneration(hp: number, maxHp: number, partial: number, input: {
	regenOn: boolean; starving: boolean; delay: number; ticks: number;
}): RegenerationTickResult {
	if (hp <= 0 || !input.regenOn || hp >= maxHp || input.starving) return { hp, partial, healed: 0 };
	let next = partial + input.ticks / input.delay;
	let healed = 0;
	if (next >= 1) {
		healed = Math.floor(next);
		next -= healed;
		if (hp + healed >= maxHp) healed = maxHp - hp;
	}
	return { hp: hp + healed, partial: next, healed };
}
