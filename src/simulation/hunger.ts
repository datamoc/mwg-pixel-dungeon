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

const STEP = 10;
export const HUNGRY = 300;
export const STARVING = 450;

/**
 * Ported from `Hunger.act()` (`actors/buffs/Hunger.java`): `level` climbs by `STEP` (10)
 * per hero turn. Below STARVING, the `onhungry`/`onstarving` log lines fire exactly once -
 * on the turn `newLevel` first crosses each threshold, matching Java's `newLevel >= X &&
 * level < X` guard rather than a persisted "warned" flag (crossing itself is self-gating).
 * Crossing into STARVING also deals Java's immediate `hero.damage(1, this)`. Once starving,
 * `level` stops climbing entirely - Java's `isStarving()` branch never assigns `level` - and
 * instead `partialDamage` accumulates `STEP * HT/1000` every turn, applying `(int)
 * partialDamage` whenever it exceeds 1 and carrying the fractional remainder forward. This
 * replaces the port's older "flat max(1,round(maxHp/100)) damage every 10 ticks" guess with
 * Java's real continuous curve (e.g. HT=20 deals 1 damage roughly every 5 turns, not 10).
 */
export function advanceHunger(previous: Readonly<HungerState>, step = STEP): HungerResult {
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
		const newLevel = state.hunger + step;
		if (newLevel >= STARVING) {
			events.push({ type: 'starving' });
			state.hp -= 1;
			events.push({ type: 'starvation-damage', damage: 1 });
			if (state.hp <= 0) events.push({ type: 'starvation-death' });
		} else if (newLevel >= HUNGRY && state.hunger < HUNGRY) {
			events.push({ type: 'hungry' });
		}
		state.hunger = newLevel;
	}
	return { state, events };
}
