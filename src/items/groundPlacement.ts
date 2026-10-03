import { Random, Roguelike } from 'mwg';
import { Cat, type GenItem } from './generator';
import { groundKindForItem } from './itemKinds';
import type { GroundItem } from '../combat';

type ItemPayload = NonNullable<GroundItem['item']>;
type Room = Roguelike.Rect;

export interface GroundPlacementContext {
	depth: number;
	isBossDepth: boolean;
	largeFeeling: boolean;
	darknessChallenge: boolean;
	upgradeScrollDrops: number;
	noScrolls: boolean;
	randomSpawnRoom(): Room;
	generateItem(): GenItem;
	materialize(generated: GenItem): ItemPayload;
	canPlaceFloorItem(x: number, y: number): boolean;
	canPlaceTorch(x: number, y: number): boolean;
	placeTorch(x: number, y: number): void;
	/** R088: Java's torch candidates draw off the pushed level-seeded stream
	 * (`RegularLevel.java:470-491`), not gameplay RNG. The scene supplies a room pick
	 * over the same spawn-room list plus bounded draws, both riding one dedicated
	 * depth-seeded roller (`torchRoller`), so torch cells are stable per floor. */
	torchRoom(): Room;
	torchInt(bound: number): number;
	canPlaceKey(x: number, y: number): boolean;
	spawnMimic(x: number, y: number, item: ItemPayload): void;
	spawnGround(kind: string, x: number, y: number, item: ItemPayload, chest?: 'normal' | 'locked'): void;
	placeUpgradeScroll(): void;
}

/**
 * `RegularLevel.createItems()` and `Level.create()`'s guaranteed upgrade-scroll/key passes.
 * Generation policy lives with item code; the scene supplies only map and actor boundaries.
 */
export function placeGroundItems(context: GroundPlacementContext): number {
	if (context.isBossDepth) return context.upgradeScrollDrops;

	//`Random.chances({6,3,1})` is one draw with cumulative weights, not two independent calls.
	const itemCountRoll = Random.float();
	const count = 3 + (itemCountRoll < 0.6 ? 0 : itemCountRoll < 0.9 ? 1 : 2)
		+ (context.largeFeeling ? 2 : 0);
	let goldenKeysToSpawn = 0;
	for (let i = 0; i < count; i++) {
		const room = context.randomSpawnRoom();
		for (let attempt = 0; attempt < 10; attempt++) {
			const at = { x: Random.range(room.left, room.right), y: Random.range(room.top, room.bottom) };
			if (!context.canPlaceFloorItem(at.x, at.y)) continue;

			const generated = context.generateItem();
			const item = context.materialize(generated);
			const heapRoll = Random.int(20);
			//RegularLevel's ordinary Mimic branch falls through to a chest when it cannot spawn.
			if (heapRoll === 5 && context.depth > 1) {
				context.spawnMimic(at.x, at.y, item);
				break;
			}
			const upgradable = generated.cat === Cat.WEAPON
				|| (generated.cat >= Cat.WEP_T1 && generated.cat <= Cat.WEP_T5)
				|| generated.cat === Cat.ARMOR
				|| generated.cat === Cat.WAND
				|| generated.cat === Cat.RING;
			const lockedContainer = (generated.cat === Cat.ARTIFACT && Random.int(2) === 0)
				|| (upgradable && Random.int(Math.max(1, 4 - generated.level)) === 0);
			if (lockedContainer) {
				if (context.depth > 1 && Random.int(10) === 0) context.spawnMimic(at.x, at.y, item);
				else {
					context.spawnGround(groundKindForItem(item, 'food'), at.x, at.y, item, 'locked');
					goldenKeysToSpawn++;
				}
				break;
			}
			context.spawnGround(groundKindForItem(item, 'food'), at.x, at.y, item,
				heapRoll >= 1 && heapRoll <= 4 ? 'normal' : undefined);
			break;
		}
	}
	//`RegularLevel.createItems()` (`RegularLevel.java:474-489`, tag `v3.3.8`) drops one
	//Torch under DARKNESS and a second on LARGE floors, after ordinary generated heaps.
	//Generic floors now retain LARGE through `genericLargeFeeling` (a dedicated depth-seeded
	//Int(14) draw, `spdRng.ts`) - the torch loop above and the mob-count ceiling read it -
	//and the candidate cells below draw off their own dedicated depth-seeded stream too
	//(`torchRoom`/`torchInt`, one roller per floor): stable across revisits and rebuilds,
	//never touching or touched by gameplay RNG, like Java's pushed generator. The room
	//list stays this port's generic rooms rather than Java's `StandardRoom`s (stated
	//reduction, same as the ordinary-heap loop above); the 100-attempt cap and the
	//`canPlaceTorch` eligibility are Java's own (`randomDropCell`, `RegularLevel.java:736`).
	//The Java path uses its own pushed RNG seeded from the level stream; this adapter
	//uses the dedicated depth-seeded roller because the framework scene has no Java
	//Random generator stack. It preserves the item count and eligible-cell constraints.
	if (context.darknessChallenge) {
		for (let i = 0; i < (context.largeFeeling ? 2 : 1); i++) {
			for (let attempt = 0; attempt < 100; attempt++) {
				const room = context.torchRoom();
				//`Random.range` is inclusive at both ends, matching Java's `IntRange`
				//over the room rect: `torchInt(width)` draws `[0, width)`, so the cell
				//covers exactly the same `[left, right]` support as the old live draw.
				const x = room.left + context.torchInt(room.right - room.left + 1);
				const y = room.top + context.torchInt(room.bottom - room.top + 1);
				if (!context.canPlaceTorch(x, y)) continue;
				context.placeTorch(x, y);
				break;
			}
		}
	}

	//`Level.create()` distributes three guaranteed ScrollOfUpgrade allocations per five-floor
	//chapter. NO_SCROLLS suppresses every second allocated scroll but still advances the counter.
	const floorThisSet = context.depth % 5;
	const scrollsLeft = 3 - (context.upgradeScrollDrops - Math.floor(context.depth / 5) * 3);
	let upgradeScrollDrops = context.upgradeScrollDrops;
	if (scrollsLeft > 0 && Random.int(5 - floorThisSet) < scrollsLeft) {
		upgradeScrollDrops++;
		if (!context.noScrolls || upgradeScrollDrops % 2 !== 0) context.placeUpgradeScroll();
	}
	for (let i = 0; i < goldenKeysToSpawn; i++) {
		const room = context.randomSpawnRoom();
		for (let attempt = 0; attempt < 10; attempt++) {
			const at = { x: Random.range(room.left, room.right), y: Random.range(room.top, room.bottom) };
			if (!context.canPlaceKey(at.x, at.y)) continue;
			context.spawnGround('goldenKey', at.x, at.y, { id: 'goldenKey', quantity: 1, identified: true });
			break;
		}
	}
	return upgradeScrollDrops;
}
