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
 *
 * `accFactor` is `MissileWeapon.accuracyFactor`'s `adjacentAccFactor`: the ranged paths pass it
 * (a thrown weapon or the spirit bow is -50%/+10%/-50%/+50% accurate by range and Point Blank -
 * see `missiles.ts`), everything else leaves it at 1.
 */
export function resolveAttack(
	attacker: Combatant,
	defender: Combatant,
	random: SimulationRandom,
	magic = false,
	surprise = false,
	accFactor = 1,
): AttackResolution {
	const hit = rollHit(attacker, defender, random, magic, surprise, accFactor);
	return hit ? { hit: true, damage: rollDamage(attacker, defender, random) } : { hit: false, damage: 0 };
}
