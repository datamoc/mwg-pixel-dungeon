/**
 * Port of `actors/mobs/npcs/Wandmaker.Quest`'s two level-generation entry points:
 * `spawnRoom()` (called from `PrisonLevel.initRooms()`) and `spawnWandmaker()` (called from
 * `PrisonPainter.decorate()`). Everything else about the quest - dialogue, turn-in, the wands
 * the player receives - is gameplay, not level generation, and is out of scope.
 *
 * This is **run-level state**, like `SpecialRoom`/`SecretRoom`'s queues and `Generator`'s decks:
 * `spawned`/`type` persist across floors, so a run that rolls the quest at depth 7 must not roll
 * again at 8 or 9. `resetWandmakerRunState()` mirrors `Quest.reset()` and must be called once per
 * run, before generating its floors in depth order. Unlike `SpecialRoom.initForRun()`, this
 * reset consumes NO RNG, so where exactly it sits in the run-init sequence doesn't matter.
 *
 * `questRoomSpawned` is the one piece of *per-floor* state: `spawnRoom()` sets it, and
 * `spawnWandmaker()` (much later, during painting) consumes and clears it. That handoff is why
 * the quest room and the NPC always land on the same floor.
 */
import { SpdRandom } from '../spdRng';
import { Room } from './room';
import { PaintLevel } from './paintLevel';
import { randomUsingDefaults, Cat } from '../spdItems/generator';
import { ritualSiteState } from './rooms/standard/ritualSiteRoom';

interface WandmakerState {
	/** 0 = undecided, 1 = corpse dust (MassGraveRoom), 2 = elemental embers (RitualSiteRoom),
	 *  3 = rotberry (RotGardenRoom). */
	type: number;
	spawned: boolean;
	questRoomSpawned: boolean;
}

const state: WandmakerState = { type: 0, spawned: false, questRoomSpawned: false };

/** `Wandmaker.Quest.reset()` - plus `questRoomSpawned`, which Java leaves alone in `reset()`
 *  but which is always false at run start anyway. Consumes no RNG. */
export function resetWandmakerRunState(): void {
	state.type = 0;
	state.spawned = false;
	state.questRoomSpawned = false;
	ritualSiteState.ritualPos = -1;
}

/**
 * `Wandmaker.Quest.spawnRoom(rooms)`. Appends one quest room to the list `initRooms()` built,
 * and returns it (Java mutates and returns the same list).
 *
 * The spawn gate is `!spawned && (type != 0 || (Dungeon.depth > 6 && Random.Int(10 - depth) == 0))`.
 * Two things about it matter for RNG fidelity:
 * - `depth > 6` means **depth 6 never rolls**, so Prison's shop floor is also its only floor
 *   that cannot host the quest.
 * - the `||` short-circuits: once `type` is nonzero (set on a previous floor whose room was
 *   added but whose NPC somehow never spawned) the `Random.Int` is skipped entirely.
 * - `Random.Int(10 - depth)` is `Int(3)`/`Int(2)`/`Int(1)` at depths 7/8/9. `Int(1)` is always
 *   0, so an un-spawned quest is **guaranteed** to appear at depth 9.
 */
export function wandmakerSpawnRoom(rooms: Room[], depth: number): Room[] {
	state.questRoomSpawned = false;
	if (!state.spawned && (state.type !== 0 || (depth > 6 && SpdRandom.int(10 - depth) === 0))) {
		// decide between 1, 2, or 3 for quest type
		if (state.type === 0) state.type = SpdRandom.int(3) + 1;

		switch (state.type) {
			case 2:
				rooms.push(new Room('standard', 'ritualSite'));
				break;
			case 3:
				rooms.push(new Room('special', undefined, 'rotGarden'));
				break;
			case 1:
			default:
				rooms.push(new Room('special', undefined, 'massGrave'));
				break;
		}

		state.questRoomSpawned = true;
	}
	return rooms;
}

/**
 * `Wandmaker.Quest.spawnWandmaker(level, room)`, called from `PrisonPainter.decorate()` for the
 * first `EntranceRoom` in the (already shuffled) room list.
 *
 * Draw order:
 * 1. A `do { level.pointToCell(room.random()) } while (!validPos)` loop - two `Random.IntRange`
 *    draws per attempt. Rejected positions: the level entrance, any cell within distance 1 of
 *    one of the room's doors, and any cell holding a trap. Note Java computes all three checks
 *    every iteration (no short-circuit `break`), but they consume no RNG themselves.
 * 2. `Generator.randomUsingDefaults(WAND)` for the first offered wand.
 * 3. A `do { randomUsingDefaults(WAND) } while (same class as wand1)` loop for the second -
 *    a genuinely variable number of draws, and one this port CAN reproduce, because
 *    `randomUsingDefaults` runs on the level stream (no pushed substream) and the class it
 *    yields is therefore known.
 * 4. One `Random.Int(3)` per wand, from `Wand.upgrade()`'s 1-in-3 uncurse roll - see
 *    `wandUpgrade()`. `cursed = false` is free; `upgrade()` is not.
 */
export function spawnWandmaker(level: PaintLevel, room: Room): void {
	if (!state.questRoomSpawned) return;

	state.questRoomSpawned = false;

	let pos: number;
	for (;;) {
		let validPos = true;
		pos = level.pointToCell(room.random());
		// `level.entrance()` - the ENTRANCE/surface transition cell recorded by
		// `paintEntranceRoom()`.
		const entranceCell = level.transitions.find(t => t.type === 'surface' || t.type === 'regularEntrance')?.pos;
		if (entranceCell !== undefined && pos === entranceCell) validPos = false;
		for (const door of room.connected.values()) {
			if (!door) continue;
			if (level.trueDistance(pos, level.pointToCell({ x: door.x, y: door.y })) <= 1) validPos = false;
		}
		if (level.traps.get(pos) !== undefined) validPos = false;
		if (validPos) break;
	}
	level.mobs.push({ pos, kind: 'wandmaker' });

	state.spawned = true;

	const wand1 = randomUsingDefaults(Cat.WAND);
	// `wand1.cursed = false; wand1.upgrade();` - `Wand.upgrade()` is NOT free: it rolls
	// `Random.Int(3)` for its own 1-in-3 uncurse (`Wand.java:305`) before `updateLevel()`.
	// Missing these two draws (one per wand) was the entire cause of Prison's quest floors
	// diverging inside `decorate()`, with everything upstream already byte-perfect - and it
	// invalidated this port's earlier "upgrade() costs no RNG" assumption.
	wandUpgrade();
	let wand2 = randomUsingDefaults(Cat.WAND);
	while (wand2.cls === wand1.cls) {
		wand2 = randomUsingDefaults(Cat.WAND);
	}
	wandUpgrade();
}

/** `Wand.upgrade()`'s one RNG draw. `super.upgrade()` (`Item.upgrade()`) is a plain `level++`,
 *  and `updateLevel()`/`curCharges` arithmetic is deterministic - the `Random.Int(3)` uncurse
 *  roll is the whole of it. */
function wandUpgrade(): void {
	SpdRandom.int(3);
}
