import { isChallengeEnabled } from '../../challenges';
import type { Creature } from '../../combat';
import { swarmBeckon } from '../../simulation/swarmIntelligence';
import type { DungeonScene } from '../dungeonScene';

/**
 * Java's `Mob.Sleeping.act()` and `Mob.Wandering.noticeEnemy()` both beckon
 * nearby mobs (`Mob.java:1151,1194`). The mob selection (paralysis, sleeping
 * CrystalGuardian refusal, Chebyshev 8, "not already hunting") is the pure
 * `swarmBeckon`; this wrapper adds the scene side: `lastSeen` retains the Java
 * beckon target between turns.
 */
export function beckonSwarmIntelligence(
	scene: Pick<DungeonScene, 'creatures' | 'hero'>,
	noticing: Creature,
): void {
	if (!isChallengeEnabled('swarm_intelligence')) return;
	for (const other of swarmBeckon(noticing, scene.creatures)) other.lastSeen = { x: scene.hero.x, y: scene.hero.y };
}
