/**
 * Port of `levels/rooms/special/MassGraveRoom.java` - the `Wandmaker` quest type-1 room.
 * Never selected via `SpecialRoom.createRoom()`'s queue; appended directly by
 * `Wandmaker.Quest.spawnRoom()` (see `wandmaker.ts`).
 *
 * Draw order, exactly as Java evaluates it:
 * 1. `Random.Int(2)` - the skeleton count (`for i = 0; i <= Int(2)`, so 1 or 2 skeletons).
 *    Java evaluates the bound ONCE, in the `i <= Random.Int(2)` condition... except it does
 *    not: that condition re-evaluates every iteration, so the draw happens once per loop test
 *    (2 or 3 times, depending on the values rolled). Ported literally as a re-evaluated
 *    condition rather than a hoisted bound, since the difference is observable.
 * 2. Per skeleton: a `do { random() } while (map != EMPTY_SP || findMob != null)` placement
 *    loop, two `Random.IntRange` draws per attempt. `new Skeleton()` itself costs no RNG
 *    (verified: its instance initializer only sets stats).
 * 3. Four `Random.Float()` gate draws for the loot list, then `Generator.random()` and
 *    `Generator.randomArmor()` behind the last two. Note `new Gold()` with no `.random()` call
 *    costs nothing - only the `Random.Float()` gating it does.
 * 4. Per item: another `do { random() } while (map != EMPTY_SP || heap != null)` loop.
 *
 * `Bones` is a `CustomTilemap` (visual only, no RNG) and `setHauntedIfCursed()` is RNG-free
 * (verified against `Heap.java`) - neither is modeled beyond the tiles.
 */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';
import { generatedGroundKind, generatorRandom, randomArmor } from '../../../spdItems/generator';

export function paintMassGraveRoom(level: PaintLevel, room: Room): void {
	const entrance = room.entranceDoor();
	entrance.set(DoorType.BARRICADE);
	level.addItemToSpawn('potionOfLiquidFlame');

	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY_SP);

	// 50% 1 skeleton, 50% 2 skeletons. The bound is re-drawn on every loop test, matching
	// Java's `i <= Random.Int(2)` condition (NOT a hoisted single roll).
	for (let i = 0; i <= SpdRandom.int(2); i++) {
		let pos: number;
		do {
			pos = level.pointToCell(room.random());
		} while (level.map[pos] !== Terrain.EMPTY_SP || level.findMob(pos) !== undefined);
		level.mobs.push({ pos, kind: 'skeleton' });
	}

	// 100% corpse dust, 2x100% 1 coin, 2x30% coins, 1x60% random item, 1x30% armor
	const items: string[] = ['corpseDust', 'gold', 'gold'];
	const generated: { slot: 'item' | 'armor'; family: string; sourceClass: string }[] = [];
	if (SpdRandom.float() <= 0.3) items.push('gold');
	if (SpdRandom.float() <= 0.3) items.push('gold');
	if (SpdRandom.float() <= 0.6) {
		const item = generatorRandom();
		items.push('item');
		generated.push({ slot: 'item', family: generatedGroundKind(item), sourceClass: item.cls });
	}
	if (SpdRandom.float() <= 0.3) {
		const armor = randomArmor();
		items.push('armor');
		generated.push({ slot: 'armor', family: generatedGroundKind(armor), sourceClass: armor.cls });
	}

	for (const item of items) {
		let pos: number;
		do {
			pos = level.pointToCell(room.random());
		} while (level.map[pos] !== Terrain.EMPTY_SP || level.findHeap(pos) !== undefined);
		const generatedItem = generated.find((candidate) => candidate.slot === item);
		const dropKind = generatedItem?.family ?? item;
		level.drop(dropKind, pos, 'skeleton')!.sourceClass = generatedItem?.sourceClass;
		if (generatedItem) generated.splice(generated.indexOf(generatedItem), 1);
	}
}
