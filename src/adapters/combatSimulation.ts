import type { Combatant } from '../simulation/combatState';
import type { SimulationRandom } from '../simulation/random';
import { rollHit, rollDamage } from '../simulation/combat';
import { applyBuff, advanceBuffs, type BuffId, type BuffState } from '../simulation/buffs';

/** Explicit projection prevents a scene Creature's sprite/skeleton graph entering the core. */
function combatState(c: Combatant): Combatant {
	return {
		id: c.id, x: c.x, y: c.y, hp: c.hp, maxHp: c.maxHp,
		accuracy: c.accuracy, evasion: c.evasion,
		damage: [...c.damage], armor: [...c.armor], buffs: { ...c.buffs },
		isHero: c.isHero, kind: c.kind, sleeping: c.sleeping,
		champion: c.champion, str: c.str, strReq: c.strReq,
		raged: c.raged, championPower: c.championPower,
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
		rollHit(attacker: Combatant, defender: Combatant, magic = false, surprise = false): boolean {
			return rollHit(combatState(attacker), combatState(defender), random, magic, surprise);
		},
		rollDamage(attacker: Combatant, defender: Combatant): number {
			return rollDamage(combatState(attacker), combatState(defender), random);
		},
		addBuff(c: { buffs: BuffState }, id: BuffId) {
			const result = applyBuff(c.buffs, id);
			commitBuffs(c.buffs, result.buffs);
			return result.event;
		},
		tickBuffs(c: { buffs: BuffState }): number {
			const result = advanceBuffs(c.buffs, random);
			commitBuffs(c.buffs, result.buffs);
			return result.damage;
		},
	};
}
