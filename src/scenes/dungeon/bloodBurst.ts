import type { Creature } from '../../combat';
import { bleedsOnHit, bloodBurstCount, bloodColor } from '../../simulation/bloodSplash';
import { spawnSplash } from '../../ui/effectBursts';
import type { DungeonScene } from '../dungeonScene';

/**
 * `Char.attack()`'s `enemy.sprite.bloodBurstA(sprite.center(), effectiveDamage)` (`Char.java:565`, tag
 * `v3.3.8`): a landed hit splashes the defender's blood away from the attacker. Pure rules are in
 * `simulation/bloodSplash.ts`. Java's `if (visible)` is the field of view here; the other
 * `bloodBurstA` callers (Combo's AoE, DeathMark, WarpBeacon, the two dart traps, CrystalSpire,
 * GnollGeomancer) are not routed through this yet - see the coverage row.
 */
export function spawnBloodBurst(scene: DungeonScene, attacker: Creature, defender: Creature, damage: number): void {
	if (!bleedsOnHit(defender) || !scene.fov.isVisible(defender.x, defender.y)) return;
	const n = bloodBurstCount(damage, defender.maxHp);
	if (n <= 0) return;
	//`PointF.angle(from, c)`: the direction from the attacker's centre to the defender's.
	const dir = Math.atan2(defender.y - attacker.y, defender.x - attacker.x);
	spawnSplash(scene.effectLayer, scene.effectBursts, defender.x + 0.5, defender.y + 0.5, dir, Math.PI / 2, bloodColor(defender.kind, defender.elementalType), n);
}
