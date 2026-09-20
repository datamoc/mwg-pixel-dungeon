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

/**
 * The hero's mirror image: the nearest visible, in-range hostile for the class
 * special's throw aim. Moved here verbatim from the scene as the file-size
 * refactor's thirty-fifth extraction, behavior-identical, following this module's
 * own `SimulationRoguelike` seam - the scene only binds its level, hero, field of
 * view and the real geometry. Callers keep the one-line scene adapter.
 */
export function nearestVisibleEnemy(
	level: Parameters<SimulationRoguelike['canTarget']>[0],
	hero: Creature,
	creatures: readonly Creature[],
	isVisible: (x: number, y: number) => boolean,
	range: number,
	roguelike: SimulationRoguelike,
): Creature | null {
	return (
		creatures
			.filter((c) => !c.isHero && !c.isNPC && isVisible(c.x, c.y))
			.filter((c) => roguelike.canTarget(level, hero, c, { range }))
			.sort((a, b) => roguelike.chebyshevDistance(hero, a) - roguelike.chebyshevDistance(hero, b))[0] ?? null
	);
}

/**
 * `Mob.chooseEnemy()`'s Aggression priority: the nearest in-range character
 * carrying the `aggression` buff, even another enemy. Moved here verbatim from
 * the scene as the file-size refactor's thirty-sixth extraction,
 * behavior-identical, following this module's own `SimulationRoguelike` seam -
 * the scene only binds its level and the real geometry. The caller keeps the
 * one-line scene adapter.
 */
export function aggressionTarget(
	level: Parameters<SimulationRoguelike['canTarget']>[0],
	monster: Creature,
	creatures: readonly Creature[],
	roguelike: SimulationRoguelike,
): Creature | null {
	return (
		creatures
			.filter((c) => c !== monster && !c.isNPC && c.hp > 0 && c.buffs['aggression']
				&& roguelike.canTarget(level, monster, c, { range: 8 }))
			.sort((a, b) => roguelike.chebyshevDistance(monster, a) - roguelike.chebyshevDistance(monster, b))[0] ?? null
	);
}

/**
 * `Amok.act()`'s target: the nearest living non-NPC creature within eight
 * cells, even another hostile or a player-side ally - no line-of-sight gate,
 * unlike the other two queries in this module. Moved here verbatim from the
 * scene as the file-size refactor's fortieth extraction, behavior-identical,
 * following this module's own `SimulationRoguelike` seam. The caller keeps the
 * one-line scene adapter.
 */
export function amokTarget(
	monster: Creature,
	creatures: readonly Creature[],
	roguelike: SimulationRoguelike,
): Creature | null {
	return (
		creatures
			.filter((c) => c !== monster && !c.isNPC && c.hp > 0
				&& roguelike.chebyshevDistance(monster, c) <= 8)
			.sort((a, b) => roguelike.chebyshevDistance(monster, a) - roguelike.chebyshevDistance(monster, b))[0] ?? null
	);
}
