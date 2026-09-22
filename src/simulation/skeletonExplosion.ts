/** `Skeleton.die()`'s bone explosion damage tail (tag `v3.3.8`).
 * The scene supplies the two defender `drRoll()` results and owns HP, shields, and death.
 */
export function skeletonBoneExplosionDamage(raw: number, firstDefenseRoll: number, secondDefenseRoll: number): number {
	return Math.max(0, raw - firstDefenseRoll - secondDefenseRoll);
}
