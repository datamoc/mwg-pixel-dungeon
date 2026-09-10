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
export type BuffId = 'bless' | 'hex' | 'daze' | 'drowsy' | 'fury' | 'berserk' | 'weakness' | 'vulnerable' | 'burning' | 'poison' | 'cripple' | 'paralysis' | 'roots' | 'levitation' | 'invisibility' | 'cloak' | 'focus' | 'recharging' | 'frostImbue' | 'adrenalineSurge' | 'mindvision' | 'terror' | 'amok' | 'aggression' | 'awareness' | 'haste' | 'degrade' | 'ooze' | 'charm' | 'lethalHasteCooldown';
export const BUFF_DURATION: Record<BuffId, number> = {
	bless: 30,
	hex: 30,
	daze: 5,
	//Drowsy.DURATION (ScrollOfLullaby/Drowsy.java)
	drowsy: 5,
	fury: 9999,
	berserk: 9999,
	//Weakness.DURATION/Vulnerable.DURATION are both really 20, not 10 - neither buff had any
	//real source applying it before ScrollOfRetribution, so the earlier 10 was an unconfirmed
	//placeholder guess, not a deliberate match to some other formula.
	weakness: 20,
	vulnerable: 20,
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
	//Amok.DURATION (ScrollOfRage): a visible hostile mob attacks any nearby creature.
	amok: 5,
	//StoneOfAggression.Aggression.DURATION for ordinary targets (bosses are shortened scene-side).
	aggression: 20,
	//Awareness.DURATION (WaterOfAwareness). Real Java re-runs Belongings.observe() on detach,
	//but this port already treats equipped gear as identified/curse-known the instant it's
	//equipped (a pre-existing simplification - see `equipWeapon`/`equipArmor`), so that second
	//observe pass would have nothing left to reveal here; the buff exists as a real status (it
	//shows and expires correctly) without a distinct on-expiry action to wire.
	awareness: 2,
	//Haste.DURATION (PotionOfHaste) - Char.speed()'s real x3 multiplier lives in
	//`getActionTurnCostMod` (main.ts), not here; this is only the turns-left duration.
	haste: 20,
	//Degrade.DURATION (Warlock's DarkBolt) - the sqrt level-reduction itself lives in
	//`degradedLevel` (main.ts), mirroring `Item.buffedLevel()`; this is only the duration.
	degrade: 30,
	//Ooze.DURATION - the depth-scaled tick itself lives scene-side (main.ts, mirroring
	//`Ooze.act()`); this is only the turns-left duration. Ticks in the shared map like
	//every other buff, so duration countdown/save/load need no special casing.
	ooze: 20,
	//Charm.DURATION (Friendly enchantment): the scene stores Java's object/ignore-next-hit
	//payload separately because the generic buff map intentionally contains only durations.
	charm: 10,
	//`Talent.LethalHasteCooldown` (100 turns gating Lethal Haste's next GreaterHaste grant).
	//Display only: `statusPane.ts` skips buff ids with no icon entry, so no art is needed.
	lethalHasteCooldown: 100,
};

/** `Buff.buffType.NEGATIVE` for every buff this port grants to a *monster* (checked against
 * each buff's own Java class at tag `v3.3.8`: `Poison`/`Burning`/`Cripple`/`Weakness`/
 * `Vulnerable`/`Paralysis`/`Roots`/`Terror`/`Ooze`/`Charm`/`Degrade`/`Daze`/`Hex` all set
 * `type = buffType.NEGATIVE`). Used by `Mob.Sleeping.act()`'s "debuffs cause mobs to wake as
 * well" unconditional wake check - a sleeping monster with any of these active wakes
 * immediately, no detection roll needed (e.g. standing in fire/gas already ignites/poisons a
 * sleeping monster elsewhere in this port; it just didn't wake it up before this check
 * existed). `focus`/`cloak`/`frostImbue`/`lethalHasteCooldown` are this port's own invented
 * stand-ins with no real monster-facing negative equivalent, so they're excluded. */
export const NEGATIVE_BUFFS: ReadonlySet<BuffId> = new Set<BuffId>([
	'poison', 'burning', 'cripple', 'weakness', 'vulnerable', 'paralysis', 'roots', 'terror', 'amok', 'aggression', 'ooze', 'charm', 'degrade', 'daze', 'hex',
]);

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
