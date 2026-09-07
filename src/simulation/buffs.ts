import type { SimulationRandom } from './random';

/**
 * Buffs this port models, with Char.java's own hit/damage multipliers (Bless/Hex/Daze scale
 * the *roll*, not the stat - `acuRoll *= 1.25` etc. - so they live here as roll multipliers
 * rather than StatBlock modifiers; Fury/Berserk/Weakness/Vulnerable scale damage the same
 * way). Durations are Java's own (Bless/Hex 30, Daze 5); implementation is a plain
 * turns-left map per creature ticked by the scene's TurnClock, not mwg's applyStatusEffect,
 * because these multipliers apply to transient dice rolls rather than to named stats a
 * StatBlock resolves.
 */
export type BuffId = 'bless' | 'hex' | 'daze' | 'fury' | 'berserk' | 'weakness' | 'vulnerable' | 'burning' | 'poison' | 'cripple' | 'paralysis' | 'roots' | 'levitation' | 'invisibility' | 'cloak' | 'focus' | 'recharging' | 'frostImbue' | 'adrenalineSurge' | 'mindvision' | 'terror';
export const BUFF_DURATION: Record<BuffId, number> = {
	bless: 30,
	hex: 30,
	daze: 5,
	fury: 9999,
	berserk: 9999,
	weakness: 10,
	vulnerable: 10,
	burning: 3,
	poison: 6,
	cripple: 4,
	// FlavourBuff durations used by the corresponding Java effects. They are creature
	// state, not UI-only markers, because Char.act()/Char.move() gate turns on them.
	paralysis: 3,
	roots: 3,
	levitation: 20,
	invisibility: 20,
	cloak: 9999,
	//Monk Focus: one guaranteed dodge, re-earned over ~6 of its own turns (combo doubles
	//as the cooldown counter - no other system uses a monk's combo)
	focus: 9999,
	recharging: 30,
	frostImbue: 15,
	adrenalineSurge: 200,
	//MindVision.DURATION
	mindvision: 20,
	//Terror.DURATION (ScrollOfTerror)
	terror: 20,
};


export type BuffState = Partial<Record<BuffId, number>>;

export interface BuffAppliedEvent {
	type: 'buff-applied';
	id: BuffId;
	fresh: boolean;
}

/** Buff.java-style application: refresh the duration; presentation decides what to announce. */
export function applyBuff(previous: Readonly<BuffState>, id: BuffId): { buffs: BuffState; event: BuffAppliedEvent } {
	return {
		buffs: { ...previous, [id]: BUFF_DURATION[id] },
		event: { type: 'buff-applied', id, fresh: previous[id] === undefined },
	};
}

/**
 * Preserves the old tickBuffs order: damage is rolled before decrement/expiry, including
 * duration 0, and keys with undefined values are skipped. These are per-creature timers;
 * area-fire propagation remains a separate scene system. Existing mwg int calls have
 * exclusive upper bounds: burning is 1-2, poison is 1 (not the previously documented 1-3/1-2).
 * Damage is returned for the caller to apply, without mutating HP or the input buff map.
 */
export function advanceBuffs(previous: Readonly<BuffState>, random: SimulationRandom): { buffs: BuffState; damage: number } {
	const buffs = { ...previous };
	let damage = 0;
	for (const id of Object.keys(buffs) as BuffId[]) {
		const left = buffs[id];
		if (left === undefined) continue;
		if (id === 'burning') damage += random.int(1, 3);
		if (id === 'poison') damage += random.int(1, 2);
		if (left <= 1) delete buffs[id];
		else buffs[id] = left - 1;
	}
	return { buffs, damage };
}
