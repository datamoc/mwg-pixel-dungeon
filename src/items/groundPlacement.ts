import { Random, Roguelike } from 'mwg';
import { Cat, type GenItem } from './generator';
import { groundKindForItem } from './itemKinds';
import type { GroundItem } from '../combat';
import { trinketCatalystRollNeeded } from '../simulation/trinkets';

type ItemPayload = NonNullable<GroundItem['item']>;
type Room = Roguelike.Rect;

export interface GroundPlacementContext {
	depth: number;
	isBossDepth: boolean;
	largeFeeling: boolean;
	darknessChallenge: boolean;
	upgradeScrollDrops: number;
	/** `Dungeon.LimitedDrops.TRINKET_CATA.dropped()`: one catalyst per run. */
	trinketCatalystDropped: boolean;
	/** Queue the floor's catalyst like `Level.addItemToSpawn(new TrinketCatalyst())`. */
	placeTrinketCatalyst(): void;
	/** `MimicTooth.mimicChanceMultiplier()` (1 with none): scales the chest and golden mimic chances. */
	mimicMultiplier?: number;
	/** `CrackedSpyglass.extraLootChance()` (0 with none) and the placement it needs. */
	spyglassExtraLootChance?: number;
	generateDefaultItem?(): GenItem;
	spawnHiddenGround?(kind: string, x: number, y: number, item: ItemPayload): void;
	noScrolls: boolean;
	randomSpawnRoom(): Room;
	generateItem(): GenItem;
	materialize(generated: GenItem): ItemPayload;
	canPlaceFloorItem(x: number, y: number): boolean;
	canPlaceTorch(x: number, y: number): boolean;
	placeTorch(x: number, y: number): void;
	canPlaceKey(x: number, y: number): boolean;
	spawnMimic(x: number, y: number, item: ItemPayload): void;
	spawnGround(kind: string, x: number, y: number, item: ItemPayload, chest?: 'normal' | 'locked'): void;
	placeUpgradeScroll(): void;
}

/**
 * `RegularLevel.createItems()` and `Level.create()`'s guaranteed upgrade-scroll/key passes.
 * Generation policy lives with item code; the scene supplies only map and actor boundaries.
 */
export function placeGroundItems(context: GroundPlacementContext): { upgradeScrollDrops: number; trinketCatalystDropped: boolean } {
	let catalystDropped = context.trinketCatalystDropped;
	//`Level.create()` (`Level.java:250-253`): `Dungeon.trinketCataNeeded()` - one catalyst on floors 1-3, `1/(4-depth)` per floor.
	//Java rolls it before the floor's rooms are painted so a prize room can claim it; the port places it after the ordinary
	//heaps (a stated reduction, see the trinket row in `PORT_COVERAGE.md`).
	if (trinketCatalystRollNeeded(context.depth, catalystDropped, (bound) => Random.int(bound))) {
		catalystDropped = true;
		context.placeTrinketCatalyst();
	}
	if (context.isBossDepth) return { upgradeScrollDrops: context.upgradeScrollDrops, trinketCatalystDropped: catalystDropped };

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
			//`RegularLevel.createItems()` case 1-4 (`RegularLevel.java:408`): each +1x of `MimicTooth.mimicChanceMultiplier()` converts 25%
			//of the chest rolls into a mimic. Java draws that `Float()` always; here only with a tooth carried, so ordinary streams are unchanged.
			const toothMimic = (context.mimicMultiplier ?? 1) > 1 && heapRoll >= 1 && heapRoll <= 4
				&& Random.float() < ((context.mimicMultiplier ?? 1) - 1) / 4;
			if ((heapRoll === 5 && context.depth > 1) || toothMimic) {
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
				//`mimicChance = 1/10f * MimicTooth.mimicChanceMultiplier()` (`RegularLevel.java:430`).
				const goldenMimic = (context.mimicMultiplier ?? 1) > 1 ? Random.float() < 0.1 * (context.mimicMultiplier ?? 1) : Random.int(10) === 0;
				if (context.depth > 1 && goldenMimic) context.spawnMimic(at.x, at.y, item);
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
	//while candidate-cell selection stays on the live RNG with the room-list filter below,
	//and the separate pushed seed stream is still not reproduced.
//The Java path uses its own pushed RNG seeded from the level stream; this adapter
	//uses the live RNG for candidate selection because the framework scene has no Java
	//Random generator stack. It preserves the item count and eligible-cell constraints.
	if (context.darknessChallenge) {
		for (let i = 0; i < (context.largeFeeling ? 2 : 1); i++) {
			for (let attempt = 0; attempt < 100; attempt++) {
				const room = context.randomSpawnRoom();
				const x = Random.range(room.left, room.right);
				const y = Random.range(room.top, room.bottom);
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
	//`RegularLevel.createItems()` (`RegularLevel.java:680-690`): the Cracked Spyglass adds `(int)(Float() + extraLootChance)` hidden heaps of
	//`Generator.randomUsingDefaults()` items. Java draws them on a pushed generator; the port uses the live stream.
	if ((context.spyglassExtraLootChance ?? 0) > 0 && context.generateDefaultItem && context.spawnHiddenGround) {
		const extra = Math.trunc(Random.float() + (context.spyglassExtraLootChance ?? 0));
		for (let i = 0; i < extra; i++) {
			const room = context.randomSpawnRoom();
			for (let attempt = 0; attempt < 10; attempt++) {
				const at = { x: Random.range(room.left, room.right), y: Random.range(room.top, room.bottom) };
				if (!context.canPlaceFloorItem(at.x, at.y)) continue;
				const item = context.materialize(context.generateDefaultItem());
				context.spawnHiddenGround(groundKindForItem(item, 'food'), at.x, at.y, item);
				break;
			}
		}
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
	return { upgradeScrollDrops, trinketCatalystDropped: catalystDropped };
}
