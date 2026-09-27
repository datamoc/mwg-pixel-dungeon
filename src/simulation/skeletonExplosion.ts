/** `PathFinder.NEIGHBOURS8` order from `PathFinder.setMapSize()` (tag `v3.3.8`).
 * Damage uses RNG per occupied cell, so this order determines which target receives each roll.
 */
export const SKELETON_BONE_NEIGHBOURS = [
	[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1],
] as const;

/** `Skeleton.die()`'s bone explosion damage tail (tag `v3.3.8`).
 * The scene supplies the two defender `drRoll()` results and owns HP, shields, and death.
 */
export function skeletonBoneExplosionDamage(raw: number, firstDefenseRoll: number, secondDefenseRoll: number): number {
	return Math.max(0, raw - firstDefenseRoll - secondDefenseRoll);
}

/** `Skeleton.die()` applies Earthroot's flat block twice but spends the pool once. */
export function skeletonBoneEarthrootDamage(damage: number, blocked: number): number {
	return damage - 2 * blocked;
}

/** `Skeleton.die()`'s ShieldOfLightTracker applies two independent talent-scaled rolls. */
export function skeletonBoneShieldOfLightDamage(damage: number, first: number, second: number): number {
	return Math.max(0, damage - first - second);
}
