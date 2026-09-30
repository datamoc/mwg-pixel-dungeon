import { chebyshevDistance } from './combatState';
import { ignoresCrystalGuardianBeckon } from './crystalSpire';

/** The slice of a creature the swarm-intelligence beckon reads. */
export interface SwarmCreature {
	x: number;
	y: number;
	kind?: string;
	isHero?: boolean;
	isNPC?: boolean;
	sleeping?: boolean;
	seesHero?: boolean;
	buffs: Record<string, unknown>;
}

/**
 * `Challenges.SWARM_INTELLIGENCE`, shared by both Java call sites (tag `v3.3.8`):
 * `Mob.Sleeping.awaken` (`Mob.java:1151`) and `Mob.Wandering.noticeEnemy` (`Mob.java:1194`).
 * Both loop `Dungeon.level.mobs` and `beckon(target)` every mob with `paralysed <= 0`,
 * `Level.distance(pos, mob.pos) <= 8` (Chebyshev) and `state != HUNTING`.
 * This port has no HUNTING/WANDERING state machine, so "not yet HUNTING" is approximated as
 * "not already awake-and-seesHero", and beckoning reuses the `sleeping = false` /
 * `seesHero = true` stand-in ScrollOfRage's beckon uses. A sleeping CrystalGuardian refuses
 * beckoning (its `beckon` override), through the shared `ignoresCrystalGuardianBeckon` gate.
 * The caller checks the `swarm_intelligence` challenge and the noticing mob's ENEMY alignment.
 * Returns the mobs that were beckoned.
 */
export function swarmBeckon<T extends SwarmCreature>(source: T, creatures: readonly T[]): T[] {
	const beckoned: T[] = [];
	for (const other of creatures) {
		if (other === source || other.isHero || other.isNPC || other.buffs['paralysis']) continue;
		if (ignoresCrystalGuardianBeckon(other.kind, other.sleeping === true)) continue;
		if (other.sleeping === false && other.seesHero) continue;
		if (chebyshevDistance(source, other) > 8) continue;
		other.sleeping = false;
		other.seesHero = true;
		beckoned.push(other);
	}
	return beckoned;
}
