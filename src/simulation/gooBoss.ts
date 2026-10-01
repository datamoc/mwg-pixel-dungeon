import type { Creature } from '../combat';
import type { SimulationRandom } from './random';

export interface GooBossStats { accuracy: number; damage: [number, number] }

export interface GooBossContext {
	readonly hero: Creature;
	readonly inWater: (x: number, y: number) => boolean;
	readonly strongerBosses: boolean;
	readonly stats: (goo: Creature) => GooBossStats;
	readonly attack: (attacker: Creature, defender: Creature) => void;
	readonly showHeal: (target: Creature, amount: number) => void;
	readonly say: (message: string, level?: 'positive' | 'warning') => void;
	readonly random: SimulationRandom;
	readonly messages: {
		slam: string; pump: string; pumpMore: string;
	};
	/** Java clears the bosses-challenge flag when Goo heals in water or lands a
	 * pumped slam (`Goo.java`, tag `v3.3.8` - found by the 41st matrix). */
	readonly foulBossChallenge: () => void;
	/** `Goo.act()`'s water heal also calls `LockedFloor.removeTime` with the heal increment. */
	readonly onWaterHeal?: (healInc: number) => void;
	/** STRONGER_BOSSES pump-up spends `gate(attackDelay, ceil(hero.cooldown), 3*attackDelay)`.
	 * There is no actor cooldown field here; the scene maps the hero's attack cost through the
	 * same clamped one-to-three turn window used by other telegraphed actors. */
	readonly onChallengePump?: () => void;
}

/**
 * Goo pump-up decision predicates - the pure decision half of `Goo.doAttack()`'s pump
 * branches (actors/mobs/Goo.java 178-225, tag `v3.3.8`). Extracted from `takeGooTurn` so
 * the Java-vs-TS parity kit (BACKLOG B3, boss transitions) checks the *same* predicates the
 * game runs rather than a second copy of them. Behavior-identical: the same comparisons in
 * the same order.
 *
 * Java: `pumpedUp == 1` charges on; `pumpedUp >= 2` slams; otherwise
 * `Random.Int(HP*2 <= HT ? 2 : 5) == 0` starts the pump (`pumpedUp += 2` on STRONGER_BOSSES,
 * else `pumpedUp++`). The port drives the roll through its float-chance random (`chance(p)`),
 * so the seam pins the Int fractions as their exact chance equivalents (1/2 enraged, 1/5
 * healthy) rather than re-plumbing the draw.
 */

/** Enrage gate: `HP*2 <= HT` doubles the pump roll. */
export function gooEnraged(hp: number, maxHp: number): boolean {
	return hp * 2 <= maxHp;
}

/** Pump-roll chance: `Random.Int(bound) == 0` with bound 2 enraged, 5 healthy. */
export function gooPumpChance(enraged: boolean): number {
	return enraged ? 0.5 : 0.2;
}

/** Pump target on entry: straight to the second charge turn on the bosses challenge. */
export function gooPumpTarget(strongerBosses: boolean): number {
	return strongerBosses ? 2 : 1;
}

/** Slam entry: a fully-charged Goo discharges instead of acting. */
export function gooSlamReady(pumped: number): boolean {
	return pumped >= 2;
}

/** First charge turn steps to the second. */
export function gooChargeStep(pumped: number): boolean {
	return pumped === 1;
}

/** Goo's actor turn: healing, pump-up charge turns, and the final amplified slam. */
export function takeGooTurn(goo: Creature, context: GooBossContext): void {
	const inWater = context.inWater(goo.x, goo.y);
	if (inWater && goo.hp < goo.maxHp) {
		const healIncrement = goo.gooHealInc ?? 1;
		const healed = Math.min(goo.maxHp, goo.hp + healIncrement) - goo.hp;
		goo.hp += healed;
		if (healed > 0) context.showHeal(goo, healed);
		context.foulBossChallenge();
		context.onWaterHeal?.(healIncrement);
		if (goo.hp >= goo.maxHp) goo.gooHealInc = 1;
		else if (context.strongerBosses) goo.gooHealInc = Math.min(3, healIncrement + 1);
	} else goo.gooHealInc = 1;

	const pumped = goo.pumped ?? 0;
	if (gooSlamReady(pumped)) {
		goo.pumped = 0;
		const { accuracy, damage } = context.stats(goo);
		context.say(context.messages.slam, 'warning');
		context.foulBossChallenge();
		context.attack({ ...goo, kind: undefined, accuracy: accuracy * 2, damage: [damage[0] * 3, damage[1] * 3] }, context.hero);
		return;
	}
	if (gooChargeStep(pumped)) {
		goo.pumped = 2;
		context.say(context.messages.pumpMore, 'warning');
		return;
	}
	const enraged = gooEnraged(goo.hp, goo.maxHp);
	if (context.random.chance(gooPumpChance(enraged))) {
		//`doAttack()`'s else branch: on the bosses challenge the pump jumps straight to 2
		//(`pumpedUp += 2`), so the slam lands after one charge turn, not two. Its gated action
		//cost is applied by the scene at the same point as Java's `spend(...)`.
		goo.pumped = gooPumpTarget(context.strongerBosses);
		if (context.strongerBosses) context.onChallengePump?.();
		context.say(context.messages.pump, 'warning');
		return;
	}
	context.attack(goo, context.hero);
}

