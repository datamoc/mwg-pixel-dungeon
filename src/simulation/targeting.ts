import type { Creature } from '../combat';
import type { SimulationRoguelike } from './roguelike';

/** `Mob.chooseEnemy()`'s ranged target priority: hero first, then living allies by distance. */
export function selectRangedTarget(
	level: Parameters<SimulationRoguelike['canTarget']>[0],
	monster: Creature,
	hero: Creature,
	allies: readonly Creature[],
	range: number,
	roguelike: SimulationRoguelike,
): Creature | null {
	return [hero, ...allies.filter((creature) => creature.isAlly && creature.hp > 0)]
		.filter((target) => target !== monster && roguelike.canTarget(level, monster, target, { range }))
		.sort((a, b) => roguelike.chebyshevDistance(monster, a) - roguelike.chebyshevDistance(monster, b))[0] ?? null;
}
