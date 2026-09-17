import type { Creature } from '../combat';
import type { SimulationRoguelike } from './roguelike';

/**
 * `Mob.chooseEnemy()`'s ranged target priority: the nearest of the hero and the
 * living allies by distance. Java only ever considers candidates its own FOV sees with `invisible
 * <= 0` (`Mob.act()`'s enemy collection); the LOS half is `canTarget`'s job, and
 * the invisibility half is this filter - an invisible hero or ally cannot be
 * picked at all, matching the melee AI's own target loss.
 */
export function selectRangedTarget(
	level: Parameters<SimulationRoguelike['canTarget']>[0],
	monster: Creature,
	hero: Creature,
	allies: readonly Creature[],
	range: number,
	roguelike: SimulationRoguelike,
): Creature | null {
	return [hero, ...allies.filter((creature) => creature.isAlly && creature.hp > 0)]
		.filter((target) => target !== monster
			&& target.buffs['invisibility'] === undefined
			&& roguelike.canTarget(level, monster, target, { range }))
		.sort((a, b) => roguelike.chebyshevDistance(monster, a) - roguelike.chebyshevDistance(monster, b))[0] ?? null;
}
