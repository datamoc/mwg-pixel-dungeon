import type { SimulationRandom } from './random';
import { BUFF_DURATION_DATA, NEGATIVE_BUFF_DATA } from './mwlBuffDurations';

/**
 * Buffs this port models, with Char.java's own hit/damage multipliers (Bless/Hex/Daze scale
 * the *roll*, not the stat - `acuRoll *= 1.25` etc. - so they live here as roll multipliers
 * rather than StatBlock modifiers; Fury/Berserk/Weakness/Vulnerable scale damage the same
 * way). Durations are Java's own (Bless/Hex 30, Daze 5); implementation is a plain
 * turns-left map per creature ticked by the scene's TurnClock, not mwg's applyStatusEffect,
 * because these multipliers apply to transient dice rolls rather than to named stats a
 * StatBlock resolves.
 */
export type BuffId = 'bless' | 'hex' | 'daze' | 'chill' | 'frost' | 'drowsy' | 'magicalSleep' | 'fury' | 'berserk' | 'weakness' | 'vulnerable' | 'burning' | 'poison' | 'bleeding' | 'cripple' | 'paralysis' | 'roots' | 'levitation' | 'invisibility' | 'cloak' | 'focus' | 'recharging' | 'frostImbue' | 'adrenalineSurge' | 'mindvision' | 'terror' | 'amok' | 'aggression' | 'awareness' | 'haste' | 'degrade' | 'ooze' | 'charm' | 'lethalHasteCooldown';
/** The duration catalogue is authored in MWL and emitted as an isolated simulation module. */
export const BUFF_DURATION: Record<BuffId, number> = (() => {
	const values = { ...BUFF_DURATION_DATA } as Record<string, number>;
	return values as Record<BuffId, number>;
})();

/** `Buff.buffType.NEGATIVE` for every buff this port grants to a *monster* (checked against
 * each buff's own Java class at tag `v3.3.8`: `Poison`/`Burning`/`Cripple`/`Weakness`/
 * `Vulnerable`/`Paralysis`/`Roots`/`Terror`/`Ooze`/`Charm`/`Degrade`/`Daze`/`Hex` all set
 * `type = buffType.NEGATIVE`). Used by `Mob.Sleeping.act()`'s "debuffs cause mobs to wake as
 * well" unconditional wake check - a sleeping monster with any of these active wakes
 * immediately, no detection roll needed (e.g. standing in fire/gas already ignites/poisons a
 * sleeping monster elsewhere in this port; it just didn't wake it up before this check
 * existed). `focus`/`cloak`/`frostImbue`/`lethalHasteCooldown` are this port's own invented
 * stand-ins with no real monster-facing negative equivalent, so they're excluded. */
export const NEGATIVE_BUFFS: ReadonlySet<BuffId> = new Set<BuffId>(NEGATIVE_BUFF_DATA as unknown as BuffId[]);

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
		//Bleeding.act(): Java redraws the intensity from NormalFloat(level/2, level),
		//deals round(level), and keeps the new intensity until the next actor turn.
		if (id === 'magicalSleep') continue;
		if (id === 'bleeding') {
			const next = random.normalRange(left / 2, left);
			const tick = Math.round(next);
			if (tick > 0) { damage += tick; buffs[id] = next; }
			else delete buffs[id];
			continue;
		}
		if (left <= 1) delete buffs[id];
		else buffs[id] = left - 1;
	}
	return { buffs, damage };
}
