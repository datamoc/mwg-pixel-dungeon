import { Roguelike } from 'mwg';
import { isChallengeEnabled } from '../../challenges';
import type { Creature } from '../../combat';
import { ignoresCrystalGuardianBeckon } from '../../simulation/crystalSpire';
import type { DungeonScene } from '../dungeonScene';

/**
 * Java's `Mob.Sleeping.act()` and `Mob.Wandering.noticeEnemy()` both beckon
 * nearby mobs (`Mob.java:1151,1194`). The port has no explicit HUNTING or
 * WANDERING state, so already hunting is approximated as awake and already
 * seeing the hero; `lastSeen` retains the Java beckon target between turns.
 */
export function beckonSwarmIntelligence(
	scene: Pick<DungeonScene, 'creatures' | 'hero'>,
	noticing: Creature,
): void {
	if (!isChallengeEnabled('swarm_intelligence')) return;
	for (const other of scene.creatures) {
		if (other === noticing || other.isHero || other.isNPC || other.buffs['paralysis']) continue;
		//`Mob.beckon()` is overridden by a sleeping CrystalGuardian to refuse the call.
		if (ignoresCrystalGuardianBeckon(other.kind, other.sleeping === true)) continue;
		if (other.sleeping === false && other.seesHero) continue;
		if (Roguelike.chebyshevDistance(noticing, other) > 8) continue;
		other.sleeping = false;
		other.seesHero = true;
		other.lastSeen = { x: scene.hero.x, y: scene.hero.y };
	}
}
