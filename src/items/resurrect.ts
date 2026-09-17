/**
 * `WndResurrect` keep rules (`WndResurrect.java`, tag `v3.3.8`), dependency-free so the
 * maintained suite can pin them without compiling the scene.
 *
 * Java offers two keep slots defaulting to the equipped weapon and armor; its item selector
 * admits everything but ankhs and bags, and picking the item already kept in the other slot
 * clears the other slot (so the same instance is never kept twice). Confirmed resurrects flag
 * both keeps `keptThoughLostInvent` and drop everything else into the `LostBackpack` - this
 * port has no bag system to carry one, so the rest vanishes outright (see PORT_COVERAGE.md).
 */
import { isBagId } from './bags';

export interface ResurrectKeep {
	readonly id: string;
	readonly instanceId?: string;
}

/** Items the resurrect selector admits: anything carried except ankhs and bags. */
export function isResurrectKeepCandidate(item: { readonly id: string; readonly quantity?: number }): boolean {
	return (item.quantity ?? 0) > 0 && item.id !== 'ankh' && !isBagId(item.id);
}

/** Split a bag into what survives the resurrect and what is lost. Matching is by id plus
 * instance id (either side may lack one); two same-id stacks without instance ids both survive,
 * since the port cannot tell instances apart that Java tracks by reference. */
export function partitionResurrectKeeps<T extends { readonly id: string; readonly instanceId?: string }>(
	items: readonly T[],
	keep1: ResurrectKeep,
	keep2: ResurrectKeep,
): { readonly kept: T[]; readonly lost: T[] } {
	const kept: T[] = [];
	const lost: T[] = [];
	const wanted = (item: T): boolean =>
		(item.id === keep1.id && (item.instanceId ?? null) === (keep1.instanceId ?? null))
		|| (item.id === keep2.id && (item.instanceId ?? null) === (keep2.instanceId ?? null));
	for (const item of items) {
		if (wanted(item)) kept.push(item);
		else lost.push(item);
	}
	return { kept, lost };
}
