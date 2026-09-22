/** Plain data at the hunger boundary; independent of sprites, saves, and framework state. */
export interface HungerState {
	hunger: number;
	partialDamage: number;
	hp: number;
	maxHp: number;
}

export type HungerEvent =
	| { type: 'hungry' }
	| { type: 'starving' }
	| { type: 'starvation-damage'; damage: number }
	| { type: 'starvation-death' };

export interface HungerResult {
	state: HungerState;
	events: HungerEvent[];
}

/** `Hunger.act()`'s real `1f/hungerDelay` per turn (hungerDelay defaults to 1) - **not** 10.
 * Found as a real, player-reported bug (2026-09-19): this was authored as 10 in
 * `rings.mwl`'s `spdAdventureClock`, making a hero hungry/starving in 30/45 turns instead
 * of Java's real 300/450 (HUNGRY/STARVING below are Java's own unscaled thresholds, so the
 * increment has to be unscaled too, or the two drift apart exactly like this). */
const STEP = 1;
export const HUNGRY = 300;
export const STARVING = 450;

/**
 * `WellFed.act()` (actors/buffs/WellFed.java, tag `v3.3.8`) decrements its own clock before
 * healing every 18 turns, and detaches once that decrement passes zero. Keeping this small
 * transition beside the hunger model lets the scene apply the Java heal presentation while
 * still making the clock boundary and the NO_FOOD duration easy to test without a scene.
 */
export function advanceWellFed(previous: number, hp: number, maxHp: number): { remaining: number | null; heal: number } {
	const remaining = previous - 1;
	if (remaining < 0) return { remaining: null, heal: 0 };
	return { remaining, heal: remaining % 18 === 0 && hp < maxHp ? 1 : 0 };
}

/**
 * Ported from `Hunger.act()` (`actors/buffs/Hunger.java`): `level` climbs by `STEP` (1)
 * per hero turn, divided by `hungerDelay` (Java's `1f/hungerDelay`: 1.5 while the `Shadows` cloak-stealth buff holds, passed by the caller; the salt-cube divisor has no expression here - no trinkets). Below STARVING, the `onhungry`/`onstarving` log lines fire exactly once -
 * on the turn `newLevel` first crosses each threshold, matching Java's `newLevel >= X &&
 * level < X` guard rather than a persisted "warned" flag (crossing itself is self-gating).
 * Crossing into STARVING also deals Java's immediate `hero.damage(1, this)`. Once starving,
 * `level` stops climbing entirely - Java's `isStarving()` branch never assigns `level` - and
 * instead `partialDamage` accumulates `STEP * HT/1000` every turn, applying `(int)
 * partialDamage` whenever it exceeds 1 and carrying the fractional remainder forward. This
 * replaces the port's older "flat max(1,round(maxHp/100)) damage every 10 ticks" guess with
 * Java's real continuous curve (e.g. HT=20 deals 1 damage roughly every 5 turns, not 10).
 * Recorded, not modeled: Java skips the whole tick on locked floors, under `WellFed`,
 * during the intro, in the challenge arena and on the Vault level - all scene state this
 * boundary never sees, so the caller must gate before calling.
 */
export function advanceHunger(previous: Readonly<HungerState>, step = STEP, hungerDelay = 1): HungerResult {
	const state = { ...previous };
	const events: HungerEvent[] = [];
	if (state.hunger >= STARVING) {
		state.partialDamage += (step * state.maxHp) / 1000;
		if (state.partialDamage > 1) {
			const damage = Math.trunc(state.partialDamage);
			state.partialDamage -= damage;
			state.hp -= damage;
			events.push({ type: 'starvation-damage', damage });
			if (state.hp <= 0) events.push({ type: 'starvation-death' });
		}
	} else {
		const newLevel = state.hunger + step / hungerDelay;
		if (newLevel >= STARVING) {
			events.push({ type: 'starving' });
			state.hp -= 1;
			events.push({ type: 'starvation-damage', damage: 1 });
			if (state.hp <= 0) events.push({ type: 'starvation-death' });
		} else if (newLevel >= HUNGRY && state.hunger < HUNGRY) {
			events.push({ type: 'hungry' });
		}
		//Java clamps the level itself at STARVING on the crossing tick
		//(`newLevel = STARVING`), so a bulk step cannot bank 451+ for
		//subtractive food to eat against later.
		state.hunger = newLevel >= STARVING ? STARVING : newLevel;
	}
	return { state, events };
}

/** Search exertion: Java's `Hero.search()` calls `affectHunger(TIME_TO_SEARCH -
 * HUNGER_FOR_SEARCH)` = `affectHunger(-4)` on every intentional search (plus the 2
 * ticks from `spendAndNext(TIME_TO_SEARCH)`), i.e. +4 hunger over the turns alone.
 * This mirrors the negative-energy half of `affectHunger`: a direct level bump that
 * still fires the crossing lines, clamps at STARVING, and converts the excess into
 * `partialDamage` instead of banking it. The cursed-search variant (+10) and the
 * locked-floor gate live in the scene, which owns cursed/lock state - the caller
 * passes the final amount. */
export function exertHunger(previous: Readonly<HungerState>, amount: number): HungerResult {
	const state = { ...previous };
	const events: HungerEvent[] = [];
	const newLevel = state.hunger + amount;
	if (newLevel > STARVING) {
		const excess = newLevel - STARVING;
		state.hunger = STARVING;
		state.partialDamage += (excess * state.maxHp) / 1000;
		if (state.partialDamage > 1) {
			const damage = Math.trunc(state.partialDamage);
			state.partialDamage -= damage;
			state.hp -= damage;
			events.push({ type: 'starvation-damage', damage });
			if (state.hp <= 0) events.push({ type: 'starvation-death' });
		}
	} else {
		//Java's `affectHunger` clamps at zero when the level would go negative.
		state.hunger = Math.max(0, newLevel);
	}
	if (state.hunger >= HUNGRY && previous.hunger < HUNGRY) {
		events.push({ type: 'hungry' });
	} else if (state.hunger >= STARVING && previous.hunger < STARVING) {
		events.push({ type: 'starving' });
		state.hp -= 1;
		events.push({ type: 'starvation-damage', damage: 1 });
		if (state.hp <= 0) events.push({ type: 'starvation-death' });
	}
	return { state, events };
}
