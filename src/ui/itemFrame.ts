import { SPECIALTY_BOMB_IDS } from '../items/itemKinds';
import { MWL_ITEM_FRAMES, MWL_ITEM_SPECIFIC_FRAMES } from '../mwlContent';

/**
 * The item-sheet frame for an item id: the same resolution `refreshInventoryPanel` applies to a bag row
 * (`ItemSprite`'s `image` per item class, tag `v3.3.8`) - a per-id frame, the shared bomb/stone/ring
 * families, and for potions and scrolls the dealt appearance (`appearance`) or else the family frame.
 * Shared so the item picker draws exactly the icon the bag draws.
 */
export function itemFrameFor(id: string, appearance?: number): number {
	let frame = MWL_ITEM_SPECIFIC_FRAMES[id] ?? 0;
	if (SPECIALTY_BOMB_IDS.has(id)) frame = MWL_ITEM_FRAMES.bomb ?? frame;
	if (id.startsWith('stoneOf')) frame = MWL_ITEM_FRAMES.stone ?? frame;
	if (id.startsWith('potion')) frame = appearance ?? MWL_ITEM_FRAMES.potion ?? frame;
	else if (id.startsWith('scroll')) frame = appearance ?? MWL_ITEM_FRAMES.scroll ?? frame;
	else if (id.startsWith('ring_')) frame = MWL_ITEM_FRAMES.ring ?? frame;
	return frame;
}
