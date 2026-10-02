import { MOMENTUM_MAX_STACKS, freerunCooldown, freerunTurns, momentumDecay } from './subclassPassives';

/**
 * The Freerunner's `Momentum` buff (`actors/buffs/Momentum.java`, tag `v3.3.8`): every
 * completed step banks a stack (max 10), spending the action's own scheduling window
 * (`postpone`) rather than costing time; the stacks are spent on a freerun whose speed and
 * length scale with them, then a cooldown runs down before the next bank. The pure
 * transitions live here (one function per Java method, same branch order); the scene half
 * - the icon/action button, the two credit seams, the speed/evasion consumers and save/load
 * - is `scenes/dungeon/hero/momentum.ts`.
 *
 * State fields mirror Java's own (`Momentum.java` 51-55):
 *  - `attached`: the buff itself. Java attaches on the first `Buff.affect(Momentum.class)`
 *    at a credit seam and never detaches; the port sets it inside `momentumGainStack`.
 *  - `stacks`: `momentumStacks`, 0-10.
 *  - `freerunTurns`/`freerunCooldown`: the run's remaining turns and the cooldown, which
 *    starts at activation and ticks down *during* the run (Java sets both in `doAction`).
 *  - `movedLastTurn`: Java's same-named field - initialized true, set true by any credit
 *    (and by the speedy-stealth bank in `act`), read by the idle decay, reset false at the
 *    end of every `act`. **Not saved**: Java's `restoreFromBundle` (Momentum.java 199-208)
 *    restores only stacks/turns/cooldown and sets this false, so a loaded run never
 *    decays on its first tick.
 */
export interface Momentum {
	attached: boolean;
	stacks: number;
	freerunTurns: number;
	freerunCooldown: number;
	movedLastTurn: boolean;
}

/** Fresh buff: detached, empty, and `movedLastTurn = true` exactly like the field init. */
export const NEW_MOMENTUM: Momentum = { attached: false, stacks: 0, freerunTurns: 0, freerunCooldown: 0, movedLastTurn: true };

/** `Momentum.freerunning()` (Momentum.java 105-107): the run is live. Gated on the buff
 * itself so a detached state can never read as freerunning. */
export function momentumFreerunning(m: Momentum): boolean {
	return m.attached && m.freerunTurns > 0;
}

/** Java's `ActionIndicator.setAction` conditions: the action exists while stacks remain and
 * the buff is neither running nor cooling (the two income paths are both gated on
 * `freerunCooldown == 0`, and `doAction` zeroes the stacks when it starts a run - so stacks
 * > 0 already implies an idle buff; the full Java predicate is spelled out anyway). */
export function momentumActionAvailable(m: Momentum): boolean {
	return m.attached && m.stacks > 0 && !momentumFreerunning(m) && m.freerunCooldown <= 0;
}

/**
 * `Momentum.gainStack()` (Momentum.java 95-103): a credit always marks the turn moved, but
 * only banks a stack while the cooldown is clear and no run is live (then Java also
 * `postpone`s the hero's own action window - that scheduling side effect has no counterpart
 * in this port's fixed turn-cost model, stated in the R115 coverage row). Attaching the buff
 * on any call mirrors `Buff.affect(Momentum.class).gainStack()`, whose `affect` half attaches
 * before the method body runs; the call sites gate on the Freerunner subclass like Java does.
 */
export function momentumGainStack(m: Momentum): Momentum {
	const bank = m.freerunCooldown <= 0 && !momentumFreerunning(m);
	return {
		attached: true,
		stacks: bank ? Math.min(m.stacks + 1, MOMENTUM_MAX_STACKS) : m.stacks,
		freerunTurns: m.freerunTurns,
		freerunCooldown: m.freerunCooldown,
		movedLastTurn: true,
	};
}

export interface MomentumActInput {
	/** `target.invisible > 0` - the hero's live invisibility (potion, Shadows, cloak). */
	invisible: boolean;
	/** `Dungeon.hero.pointsInTalent(Talent.SPEEDY_STEALTH)`. */
	speedyStealthRank: number;
}

/**
 * `Momentum.act()` (Momentum.java 63-93), same branch order: tick the cooldown; while it
 * has just cleared, bank the speedy-stealth invisible bonus (+2, cap 10, marks the turn
 * moved); count a running freerun down - frozen at SPEEDY_STEALTH 2+ while invisible -
 * and, only while *not* running, decay the stacks once for a turn with no credit
 * (`gate(0, stacks-1, round(0.667 x stacks))`); finally reset `movedLastTurn`.
 *
 * Cadence: Java runs this as its own pre-hero actor (`actPriority = HERO_PRIO+1`), so each
 * tick sees the *previous* hero action's credit. The scene ticks it at the end of the hero's
 * own buff phase instead, where it sees the same turn's credit first - which reproduces
 * Java's decay count for any move/wait sequence (a move never decays; each idle turn
 * contributes exactly one decay, just positioned a turn earlier), traced in the R115 row.
 */
export function momentumAct(m: Momentum, input: MomentumActInput): Momentum {
	const s: Momentum = { ...m };
	if (s.freerunCooldown > 0) s.freerunCooldown--;
	if (s.freerunCooldown === 0 && !momentumFreerunning(s) && input.invisible && input.speedyStealthRank >= 1) {
		s.stacks = Math.min(s.stacks + 2, MOMENTUM_MAX_STACKS);
		s.movedLastTurn = true;
	}
	if (s.freerunTurns > 0) {
		if (!input.invisible || input.speedyStealthRank < 2) s.freerunTurns--;
	} else if (!s.movedLastTurn) {
		s.stacks = momentumDecay(s.stacks);
	}
	s.movedLastTurn = false;
	return s;
}

/** `Momentum.doAction()` (Momentum.java 234-245): the run starts at 2 turns per stack with
 * a `10 + 4 x stacks` cooldown set alongside it (it ticks during the run, leaving
 * `10 + 2 x stacks` afterwards), and the stacks are spent to zero. The sounds/FX Java plays
 * here are not part of the pure transition (the scene plays the audio cue). */
export function momentumDoAction(m: Momentum): Momentum {
	return {
		attached: m.attached,
		stacks: 0,
		freerunTurns: freerunTurns(m.stacks),
		freerunCooldown: freerunCooldown(m.stacks),
		movedLastTurn: m.movedLastTurn,
	};
}

/**
 * `Momentum.speedMultiplier()` (Momentum.java 109-117): x2 while freerunning, x2 at
 * SPEEDY_STEALTH rank *exactly* 3 while invisible, otherwise 1. A detached state never
 * matches Java's `buff(Momentum.class) != null` caller.
 */
export function momentumSpeedFactor(m: Momentum, invisible: boolean, speedyStealthRank: number): number {
	if (!m.attached) return 1;
	if (m.freerunTurns > 0) return 2;
	return invisible && speedyStealthRank === 3 ? 2 : 1;
}

/**
 * `Momentum.evasionBonus(heroLvl, excessArmorStr)` (Momentum.java 119-125, called from
 * `Armor.evasionFactor`): `heroLvl/2 + excessArmorStr x EVASIVE_ARMOR` while freerunning,
 * else 0 - `heroLvl/2` is Java int division, `excessArmorStr` arrives floored at 0 by the
 * caller (`Math.max(0, STR() - STRReq())`). The freerun gate here is the buff's own
 * `freerunTurns > 0`; the subclass gate lives at the credit seams like Java's.
 */
export function momentumEvasion(m: Momentum, heroLevel: number, excessStr: number, evasiveArmorRank: number): number {
	if (!m.attached || m.freerunTurns <= 0) return 0;
	return Math.floor(Math.max(0, heroLevel) / 2) + Math.max(0, excessStr) * Math.max(0, evasiveArmorRank);
}
