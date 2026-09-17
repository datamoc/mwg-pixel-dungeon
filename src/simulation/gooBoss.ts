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
}

/** Goo's actor turn: healing, pump-up charge turns, and the final amplified slam. */
export function takeGooTurn(goo: Creature, context: GooBossContext): void {
	const inWater = context.inWater(goo.x, goo.y);
	if (inWater && goo.hp < goo.maxHp) {
		const healIncrement = goo.gooHealInc ?? 1;
		const healed = Math.min(goo.maxHp, goo.hp + healIncrement) - goo.hp;
		goo.hp += healed;
		if (healed > 0) context.showHeal(goo, healed);
		if (goo.hp >= goo.maxHp) goo.gooHealInc = 1;
		else if (context.strongerBosses) goo.gooHealInc = Math.min(3, healIncrement + 1);
	} else goo.gooHealInc = 1;

	const pumped = goo.pumped ?? 0;
	if (pumped >= 2) {
		goo.pumped = 0;
		const { accuracy, damage } = context.stats(goo);
		context.say(context.messages.slam, 'warning');
		context.attack({ ...goo, kind: undefined, accuracy: accuracy * 2, damage: [damage[0] * 3, damage[1] * 3] }, context.hero);
		return;
	}
	if (pumped === 1) {
		goo.pumped = 2;
		context.say(context.messages.pumpMore, 'warning');
		return;
	}
	const enraged = goo.hp * 2 <= goo.maxHp;
	if (context.random.chance(enraged ? 0.5 : 0.2)) {
		//`doAttack()`'s else branch: on the bosses challenge the pump jumps straight to 2
		//(`pumpedUp += 2`), so the slam lands after one charge turn, not two. Java also
		//spends a gated turn cost here (`gate(attackDelay, ceil(enemy.cooldown), 3x)`) that
		//this port's uniform 1-turn boss turns do not reproduce - stated timing simplification.
		goo.pumped = context.strongerBosses ? 2 : 1;
		context.say(context.messages.pump, 'warning');
		return;
	}
	context.attack(goo, context.hero);
}

