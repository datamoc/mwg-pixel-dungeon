import type { Combatant } from '../simulation/combatState';
import type { SimulationRandom } from '../simulation/random';
import { rollHit, rollDamage } from '../simulation/combat';
import { applyBuff, reigniteBuff, advanceBuffs, type BuffId, type BuffState } from '../simulation/buffs';

/** Explicit projection prevents a scene Creature's sprite/skeleton graph entering the core. */
function combatState(c: Combatant): Combatant {
	return {
		id: c.id, x: c.x, y: c.y, hp: c.hp, maxHp: c.maxHp,
		accuracy: c.accuracy, evasion: c.evasion,
		damage: [...c.damage], armor: [...c.armor], buffs: { ...c.buffs },
		isHero: c.isHero, isAlly: c.isAlly, boss: c.boss, miniboss: c.miniboss,
		kind: c.kind, sleeping: c.sleeping,
		champion: c.champion, str: c.str, strReq: c.strReq,
		raged: c.raged, championPower: c.championPower, berserkPower: c.berserkPower,
	};
}

/** Keep the existing buff-map identity and key order for scene callers holding a reference. */
function commitBuffs(target: BuffState, next: BuffState): void {
	for (const id of Object.keys(target) as BuffId[]) {
		if (!Object.hasOwn(next, id)) delete target[id];
	}
	Object.assign(target, next);
}

export function createCombatAdapter(random: SimulationRandom) {
	return {
		rollHit(attacker: Combatant, defender: Combatant, magic = false, surprise = false, accFactor = 1): boolean {
			return rollHit(combatState(attacker), combatState(defender), random, magic, surprise, accFactor);
		},
		rollDamage(attacker: Combatant, defender: Combatant): number {
			return rollDamage(combatState(attacker), combatState(defender), random);
		},
		addBuff(c: { buffs: BuffState }, id: BuffId, duration?: number) {
			const result = applyBuff(c.buffs, id, duration);
			commitBuffs(c.buffs, result.buffs);
			return result.event;
		},
		reigniteBuff(c: { buffs: BuffState }, id: BuffId, duration?: number) {
			const result = reigniteBuff(c.buffs, id, duration);
			commitBuffs(c.buffs, result.buffs);
			return result.event;
		},
		/** `scalingDepth` is Java's `Dungeon.scalingDepth()` for the depth-scaled DoT rolls. */
		tickBuffs(c: { buffs: BuffState; kind?: string }, scalingDepth = 0): number {
			const result = advanceBuffs(c.buffs, random, scalingDepth, c.kind === 'spinner');
			commitBuffs(c.buffs, result.buffs);
			return result.damage;
		},
	};
}
