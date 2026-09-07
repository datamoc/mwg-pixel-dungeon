/**
 * Port of `actors/mobs/npcs/Blacksmith.Quest.spawn()`'s level-generation entry point - the
 * `BlacksmithRoom` roll gate and its append onto `CavesLevel.initRooms()`. Everything else about
 * the quest - the real `Blacksmith` NPC's spawn/dialogue/reforge, and the separate `MiningLevel`
 * branch its `QuestEntrance` tile would lead to - is gameplay, not level generation, and is
 * already covered by the live scene: `main.ts` drives the Blacksmith NPC, preserves the Java
 * room-local NPC position, and enters the generated 32x32 MiningLevel branch. The branch uses
 * the Java CAVES_QUEST atlas for both BorderDarken and QuestEntrance, plus persistent remains.
 *
 * This is **run-level state**: `spawned` persists across floors, so a run that rolls the room at
 * depth 12 must not roll again at 13 or 14. `resetBlacksmithRunState()` mirrors `Quest.reset()`
 * and must be called once per run, before generating its floors in depth order - consumes no RNG,
 * so its exact position in the run-init sequence doesn't matter (same shape as
 * `resetWandmakerRunState()`).
 */
import { SpdRandom } from '../spdRng';
import { Room } from './room';

let spawned = false;
let alternative = false;

/** `Blacksmith.Quest.reset()`. Consumes no RNG. */
export function resetBlacksmithRunState(): void {
	spawned = false;
	alternative = false;
}

/** Whether this run's Blacksmith quest asks for a blood-stained pickaxe. */
export function blacksmithQuestUsesBlood(): boolean {
	return alternative;
}

/**
 * `Blacksmith.Quest.spawn(rooms)`. Appends one `BlacksmithRoom` to the list `initRooms()` built,
 * and returns it (Java mutates and returns the same list) - called for Caves exactly the way
 * `wandmakerSpawnRoom` wraps Prison's `initRooms()` result.
 *
 * Gate: `!spawned && Dungeon.depth > 11 && Random.Int(15 - Dungeon.depth) == 0`. `depth > 11`
 * means Caves' own shop floor (11) never rolls, matching `wandmakerSpawnRoom`'s `depth > 6`
 * excluding Prison's shop floor for the same reason. `Random.Int(15-depth)` is `Int(3)`/`Int(2)`/
 * `Int(1)` at depths 12/13/14 - `Int(1)` is always 0, so an un-spawned quest is **guaranteed** to
 * appear at depth 14, exactly mirroring Wandmaker's own depth-9 guarantee.
 */
export function blacksmithSpawnRooms(rooms: Room[], depth: number): Room[] {
	if (!spawned && depth > 11 && SpdRandom.int(15 - depth) === 0) {
		rooms.push(new Room('standard', 'blacksmith'));
		spawned = true;
		// `alternative = Random.Int(2) == 0` - Java chooses this immediately after appending
		// the room, and the result is part of the run-level quest state.
		alternative = SpdRandom.int(2) === 0;
	}
	return rooms;
}
