/**
 * Thief's Intuition rank rule, straight from `Talent.onTalentUpgraded()` (tag
 * `v3.3.8`): rank 1 calls `setKnown()` on the worn ring(s) only, rank 2
 * identifies the worn ring(s) and calls `setKnown()` on every carried ring.
 * `setKnown()` marks the ring *type* known handler-wide (level/curse stay
 * hidden) - hence ids, not instances, in and out. Pure so the suite can pin
 * the rule without the scene.
 */
export function thiefsIntuitionKnownIds(
	wornIds: (string | null)[],
	carriedIds: string[],
	rank: 1 | 2,
): string[] {
	const ids = wornIds.filter((id): id is string => id !== null);
	if (rank === 2) ids.push(...carriedIds);
	return [...new Set(ids)];
}

/**
 * Per-run ring-type-known sets (`RingHandler`'s known classes, one entry per
 * ring id whose type - but not level/curse - stands revealed). Keyed by scene
 * object because the file-size budget leaves `dungeonScene.ts` no room for
 * even a field; saved/loaded through the run envelope like everything else.
 */
const knownByScene = new WeakMap<object, Set<string>>();

/** The live type-known set for `scene`, created on first touch. */
export function ringTypesKnownFor(scene: object): Set<string> {
	let known = knownByScene.get(scene);
	if (!known) {
		known = new Set();
		knownByScene.set(scene, known);
	}
	return known;
}

/** Mark ring `ids` type-known for `scene` (Thief's Intuition or a full identify). */
export function markRingTypesKnown(scene: object, ids: string[]): void {
	const known = ringTypesKnownFor(scene);
	for (const id of ids) known.add(id);
}
