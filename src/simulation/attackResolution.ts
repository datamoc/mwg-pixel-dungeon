import type { Combatant } from './combatState';
import type { SimulationRandom } from './random';
import { rollDamage, rollHit } from './combat';

export interface AttackResolution {
	hit: boolean;
	damage: number;
}

/**
 * Resolves the pure hit/damage portion of `Char.attack()`. Scene concerns such as sprites,
 * audio, enchantment hooks, shields, death, and log messages remain outside this boundary.
 * Keeping the two rolls together preserves Java's short-circuit: a miss consumes no damage
 * roll, while a hit consumes exactly the same random sequence as the former scene call site.
 */
export function resolveAttack(
	attacker: Combatant,
	defender: Combatant,
	random: SimulationRandom,
	magic = false,
	surprise = false,
): AttackResolution {
	const hit = rollHit(attacker, defender, random, magic, surprise);
	return hit ? { hit: true, damage: rollDamage(attacker, defender, random) } : { hit: false, damage: 0 };
}
