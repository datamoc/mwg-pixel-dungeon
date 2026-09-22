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

/** `Blacksmith.Quest.CRYSTAL`/`GNOLL`/`FUNGI` (tag `v3.3.8`); 0 = no quest rolled this run. */
export const BLACKSMITH_QUEST = { NONE: 0, CRYSTAL: 1, GNOLL: 2, FUNGI: 3 } as const;
export type BlacksmithQuestType = typeof BLACKSMITH_QUEST[keyof typeof BLACKSMITH_QUEST];

let spawned = false;
let questType: BlacksmithQuestType = BLACKSMITH_QUEST.NONE;

/** `Blacksmith.Quest.reset()`. Consumes no RNG. */
export function resetBlacksmithRunState(): void {
	spawned = false;
	questType = BLACKSMITH_QUEST.NONE;
}

/** `Blacksmith.Quest.Type()`: which mine this run's Blacksmith sends the hero into. */
export function blacksmithQuestType(): BlacksmithQuestType {
	return questType;
}

/** Restores the run-level type from a save before the mining branch is generated (the same role
 * `setWandmakerQuestType` plays): the branch is painted from this module state. */
export function setBlacksmithQuestType(type: BlacksmithQuestType): void {
	questType = type;
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
		// `type = Random.IntRange(1, 2)` (tag `v3.3.8`: "Currently cannot roll the fungi quest,
		// as it is not fully implemented"). `IntRange(1, 2)` is `1 + Int(2)`, the same single
		// draw the pre-v2.2 `alternative = Random.Int(2) == 0` bat-blood roll made, so moving to
		// the real quest types leaves every later levelgen draw where it was.
		questType = SpdRandom.intRange(1, 2) as BlacksmithQuestType;
	}
	return rooms;
}
