import type { SimulationRandom } from './random';
import { BUFF_DURATION_DATA, NEGATIVE_BUFF_DATA } from './mwlBuffDurations';
import { MONSTER_IMMUNITY_DATA } from './mwlMonsterImmunities';

/**
 * Buffs this port models, with Char.java's own hit/damage multipliers (Bless/Hex/Daze scale
 * the *roll*, not the stat - `acuRoll *= 1.25` etc. - so they live here as roll multipliers
 * rather than StatBlock modifiers; Fury/Berserk/Weakness/Vulnerable scale damage the same
 * way). Durations are Java's own (Bless/Hex 30, Daze 5); implementation is a plain
 * turns-left map per creature ticked by the scene's TurnClock, not mwg's applyStatusEffect,
 * because these multipliers apply to transient dice rolls rather than to named stats a
 * StatBlock resolves.
 *
 * `blindness` is the one entry with no roll multiplier of its own: `Level.updateFieldOfView`'s
 * `sighted` test makes a blinded char's field of view empty, so its whole effect is that a blinded
 * creature cannot see - or hunt - the hero (see `dungeonScene`'s monster-perception line), and a
 * blinded hero would see nothing. Duration 10 is `Blindness.DURATION`.
 */
export type BuffId = 'bless' | 'hex' | 'daze' | 'chill' | 'frost' | 'drowsy' | 'magicalSleep' | 'fury' | 'berserk' | 'weakness' | 'vulnerable' | 'burning' | 'poison' | 'bleeding' | 'cripple' | 'paralysis' | 'roots' | 'levitation' | 'featherFall' | 'invisibility' | 'cloak' | 'focus' | 'recharging' | 'frostImbue' | 'fireImbue' | 'adrenalineSurge' | 'mindvision' | 'terror' | 'amok' | 'aggression' | 'awareness' | 'haste' | 'degrade' | 'ooze' | 'charm' | 'lethalHasteCooldown' | 'wayward' | 'blindness' | 'feintConfusion' | 'counterAbility' | 'light' | 'invulnerability' | 'hazardAssist' | 'spectatorFreeze' | 'duelParticipant' | 'eliminationMatch' | 'luckyTracker' | 'soulmark' | 'prismaticGuard';
/** The duration catalogue is authored in MWL and emitted as an isolated simulation module. */
export const BUFF_DURATION: Record<BuffId, number> = (() => {
	const values = { ...BUFF_DURATION_DATA } as Record<string, number>;
	return values as Record<BuffId, number>;
})();

/** `Char.isImmune()`'s mob half, authored in `resistance-rules.mwl`'s `monsterStatusImmunities`
 * table: whether Java refuses to attach a buff to a monster kind (plus one yogFistType). Pure
 * data lookup so the item-suite harness can pin it without a scene; `combat.ts`'s `buffBlocked`
 * is the live gate that calls it. */
export function monsterBuffImmune(kind: string | undefined, subtype: string | undefined, id: BuffId): boolean {
	if (kind === undefined) return false;
	for (const row of MONSTER_IMMUNITY_DATA) {
		if (row.monster !== kind) continue;
		if (row.subtype !== '' && row.subtype !== subtype) continue;
		if ((row.immunities as readonly string[]).includes(id)) return true;
	}
	return false;
}

/** `Buff.buffType.NEGATIVE` for every buff this port grants to a *monster* (checked against
 * each buff's own Java class at tag `v3.3.8`: `Poison`/`Burning`/`Cripple`/`Weakness`/
 * `Vulnerable`/`Paralysis`/`Roots`/`Terror`/`Ooze`/`Charm`/`Degrade`/`Daze`/`Hex` all set
 * `type = buffType.NEGATIVE`). Used by `Mob.Sleeping.act()`'s "debuffs cause mobs to wake as
 * well" unconditional wake check - a sleeping monster with any of these active wakes
 * immediately, no detection roll needed (e.g. standing in fire/gas already ignites/poisons a
 * sleeping monster elsewhere in this port; it just didn't wake it up before this check
 * existed). `focus`/`cloak`/`lethalHasteCooldown` are this port's own invented
 * stand-ins with no real monster-facing negative equivalent, so they're excluded;
 * `frostImbue`/`fireImbue` are real Java buffs (`FrostImbue.java`/`FireImbue.java`) but
 * hero-side-only positives, excluded for the same reason. */
export const NEGATIVE_BUFFS: ReadonlySet<BuffId> = new Set<BuffId>(NEGATIVE_BUFF_DATA as unknown as BuffId[]);

export type BuffState = Partial<Record<BuffId, number>>;

export interface BuffAppliedEvent {
	type: 'buff-applied';
	id: BuffId;
	fresh: boolean;
}

/** Buff.java-style application: refresh the duration; presentation decides what to announce.
 * `duration` is the per-site override - Java's `Buff.affect(target, class, duration)` - and
 * defaults to the class's own `DURATION` from the authored table, which is what most sites use. */
export function applyBuff(previous: Readonly<BuffState>, id: BuffId, duration = BUFF_DURATION[id]): { buffs: BuffState; event: BuffAppliedEvent } {
	return {
		buffs: { ...previous, [id]: duration },
		event: { type: 'buff-applied', id, fresh: previous[id] === undefined },
	};
}

/**
 * `Burning.reignite(ch, duration)`'s *prolong* semantics, which the shared applier above cannot
 * express: Java raises the remaining time only when the new duration is longer (`if (left <
 * duration) left = duration`), so standing in fire re-arms a full burn without ever shortening one
 * that is already longer. Presentation decides what to announce, as with `applyBuff`.
 */
export function reigniteBuff(previous: Readonly<BuffState>, id: BuffId, duration = BUFF_DURATION[id]): { buffs: BuffState; event: BuffAppliedEvent } {
	const left = previous[id];
	if (left !== undefined && left >= duration) {
		return { buffs: previous, event: { type: 'buff-applied', id, fresh: false } };
	}
	return applyBuff(previous, id, duration);
}

/**
 * Applies one Java `Freezing` impact to a target.  `Freezing.freeze()` adds Chill until
 * the chill cap is reached; an already-capped Chill instead becomes the explicit Frost
 * immobilization.  Keeping this transition pure prevents potion, wand, and elemental
 * callers from disagreeing about whether the impact freezes immediately or on the next hit.
 */
export function applyChillFreeze(previous: Readonly<BuffState>): { buffs: BuffState; frozen: boolean } {
	const existing = previous.chill ?? 0;
	if (existing >= BUFF_DURATION.chill) {
		const buffs = { ...previous };
		delete buffs.chill;
		buffs.frost = BUFF_DURATION.frost;
		buffs.paralysis = Math.max(buffs.paralysis ?? 0, BUFF_DURATION.frost);
		return { buffs, frozen: true };
	}
	return { buffs: { ...previous, chill: BUFF_DURATION.chill }, frozen: false };
}

/**
 * Preserves the old tickBuffs order: damage is rolled before decrement/expiry, including
 * duration 0, and keys with undefined values are skipped. These are per-creature timers;
 * area-fire propagation remains a separate scene system. Existing mwg int calls have
 * exclusive upper bounds.
 *
 * `Burning.act()` rolls `NormalIntRange(1, 3 + scalingDepth/4)`, an inclusive range, so the
 * depth-scaled bound is `int(1, 4 + floor(scalingDepth/4))` here. The old fixed `int(1, 3)` was
 * this port's own invention and made fire strictly weaker than Java's at every depth.
 * Damage is returned for the caller to apply, without mutating HP or the input buff map.
 */
/**
 * `ShieldBuff.processDamage()` pool half (tag v3.3.8), shared by every `Char.damage()`
 * seam: the pool absorbs first, HP takes the rest. Pure so the suite pins it once
 * instead of once per seam. Added as the maintained collateral for the DKBarrier multi-seam
 * fix (13th matrix residual).
 */
export function absorbShield(shield: number, damage: number): { shield: number; damage: number } {
	const blocked = Math.min(shield, damage);
	return { shield: shield - blocked, damage: damage - blocked };
}

export function advanceBuffs(previous: Readonly<BuffState>, random: SimulationRandom, scalingDepth = 0): { buffs: BuffState; damage: number } {
	const buffs = { ...previous };
	let damage = 0;
	for (const id of Object.keys(buffs) as BuffId[]) {
		const left = buffs[id];
		if (left === undefined) continue;
		if (id === 'burning') damage += random.int(1, 4 + Math.floor(scalingDepth / 4));
		//`Poison.act()` (tag v3.3.8): `(int)(left/3)+1` deals off the *remaining*
		//duration, not a flat roll - a fresh 6-turn poison hits for 3, decaying as the clock
		//runs down. The old flat `int(1, 2) (exclusive upper bound: always 1) had no Java
		//behind it and made every poison roughly a third as strong as Java's. Found by the
		//14th monster-analysis matrix (DoT buffs).
		if (id === 'poison') damage += Math.floor(left / 3) + 1;
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


/** A monster where the turn-end tick needs one: kind, sight, cooldowns and speeds. */
export interface TurnEndMonsterView {
	kind?: string | undefined;
	buffs: { focus?: number | undefined };
	seesHero?: boolean | undefined;
	focusCooldown?: number | undefined;
	ratmogrifiedTurns?: number | undefined;
	ratmogrifiedPermanent?: boolean | undefined;
	hasteTurns?: number | undefined;
	hasteBaseSpeed?: number | undefined;
	speed?: number | undefined;
}

/**
 * Java's Buff.act() boundary for temporary monster speed effects, moved here verbatim
 * from the scene's `afterMonsterTurn` as the file-size refactor's thirty-fourth
 * extraction, behavior-identical (the death-mark tick and the time-bubble spend stay
 * scene-side; the focus attach arrives as a callback since `addBuff` lives outside
 * this directory). The scene keeps the one-line tail.
 */
export function tickMonsterTurnEnd(monster: TurnEndMonsterView, attachFocus: (monster: TurnEndMonsterView) => void): void {
	if (monster.ratmogrifiedTurns !== undefined && !monster.ratmogrifiedPermanent) {
		monster.ratmogrifiedTurns--;
		if (monster.ratmogrifiedTurns <= 0) delete monster.ratmogrifiedTurns;
	}
	if (monster.kind === 'monk' || monster.kind === 'senior') {
		//Monk.spend(): Focus cooldown loses the action time after every own turn.
		//Focus is attached by Monk.act() after that action when the mob is hunting.
		monster.focusCooldown = (monster.focusCooldown ?? 0) - 1;
		if (!monster.buffs['focus'] && monster.seesHero && (monster.focusCooldown ?? 0) <= 0) {
			attachFocus(monster);
		}
	}
	if (monster.hasteTurns) {
		monster.hasteTurns--;
		if (monster.hasteTurns <= 0) {
			monster.speed = monster.hasteBaseSpeed ?? 1;
			delete monster.hasteTurns;
			delete monster.hasteBaseSpeed;
		}
	}
}
