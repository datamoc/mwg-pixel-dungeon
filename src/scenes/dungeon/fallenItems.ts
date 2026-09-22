import type { GroundItem } from '../../combat';
import type { GroundItemKind } from '../../dungeonConstants';

/**
 * `Dungeon.droppedItems` (`Dungeon.java`, tag v3.3.8): items that dropped onto a chasm cell
 * (`Level.drop()` -> `Dungeon.dropToChasm()`) wait here under the depth BELOW, and `GameScene`
 * lands them on a random free cell when the hero arrives there. Kept per scene in a WeakMap - a
 * new run builds a new scene, so the store resets with it - and saved with the run.
 */
export interface FallenItem {
	kind: GroundItemKind;
	item?: GroundItem['item'];
	chest?: GroundItem['chest'];
}

const stores = new WeakMap<object, Map<number, FallenItem[]>>();

export function fallenItemStore(owner: object): Map<number, FallenItem[]> {
	let store = stores.get(owner);
	if (!store) stores.set(owner, store = new Map());
	return store;
}
