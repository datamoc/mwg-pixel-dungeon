/**
 * Port of `levels/RegularLevel.java`'s `build()`/`initRooms()`/`builder()` control flow, and
 * `SewerLevel`/`PrisonLevel`/`CavesLevel`'s `standardRooms()`/`specialRooms()` counts (the three
 * regions wired up so far - see PORT_COVERAGE.md). `StandardRoom`/`SpecialRoom`/`SecretRoom` type selection are all
 * real (see `rooms/standard/registry.ts`/`rooms/special/registry.ts`/`rooms/secret/registry.ts`).
	 * `SecretRoom.initForRun()` and `SpecialRoom.initForRun()` are reset by `gameBridge` at live
	 * run start; direct verifier entry points reset them explicitly before walking floors in order.
 */
import { Room } from './room';
import { LoopBuilder } from './loopBuilder';
import { FigureEightBuilder } from './figureEightBuilder';
import { SpdRandom } from '../spdRng';
import { MWL_TRAIT_NODES } from '../mwlContent';
import { STANDARD_ROOM_CLASS_ORDER } from './rooms/standard/registry';
import { createSpecialRoom, initSpecialRoomFloor } from './rooms/special/registry';
import { createSecretRoom, secretsForFloor } from './rooms/secret/registry';
import { wandmakerSpawnRoom } from './wandmaker';
import { blacksmithSpawnRooms } from './blacksmith';
import { randomGooBossKind } from './rooms/sewerBoss/gooBossRoom';

/**
 * `SewerLevel`/`PrisonLevel`'s `standardRooms()`/`specialRooms()`. The two regions ported so
 * far; every other `RegularLevel` subclass inherits the base `return 0`, which would generate
 * a degenerate floor, so `regionRoomCounts()` throws rather than silently doing that.
 */
const REGION_ROOM_COUNTS = (() => {
	const node = MWL_TRAIT_NODES.find((candidate) => candidate.attributes.id === 'regionRoomCounts');
	if (!node) throw new Error('MWL room rule is missing regionRoomCounts');
	const effect = node.children.find((child) => child.tag === 'effect' && child.attributes.apply_to === 'entries');
	const raw = effect?.attributes.set;
	if (raw === undefined) throw new Error('MWL room rule is missing region counts');
	return new Map(raw.split(';').map((entry) => {
		const [region, standardMaxText, standardBaseText, standardWeightsText, specialMaxText, specialBaseText, specialWeightsText] = entry.split('|');
		const standardMax = Number(standardMaxText), standardBase = Number(standardBaseText), specialMax = Number(specialMaxText), specialBase = Number(specialBaseText);
		const standardWeights = standardWeightsText?.split(',').map(Number) ?? [];
		const specialWeights = specialWeightsText?.split(',').map(Number) ?? [];
		if (!region || !Number.isInteger(standardMax) || !Number.isInteger(standardBase) || !Number.isInteger(specialMax) || !Number.isInteger(specialBase)
			|| standardWeights.length === 0 || specialWeights.length === 0
			|| standardWeights.some((weight) => !Number.isFinite(weight) || weight < 0)
			|| specialWeights.some((weight) => !Number.isFinite(weight) || weight < 0)) {
			throw new Error(`MWL room rule has invalid region counts ${entry}`);
		}
		return [region, { standardMax, standardBase, standardWeights, specialMax, specialBase, specialWeights }];
	}));
})();

function regionRoomCount(region: string, kind: 'standard' | 'special', forceMax: boolean): number {
	const counts = REGION_ROOM_COUNTS.get(region);
	if (!counts) throw new Error(`MWL room rule has no counts for ${region}`);
	const max = kind === 'standard' ? counts.standardMax : counts.specialMax;
	const base = kind === 'standard' ? counts.standardBase : counts.specialBase;
	const weights = kind === 'standard' ? counts.standardWeights : counts.specialWeights;
	return forceMax ? max : base + SpdRandom.chances(weights);
}

/** `Dungeon.shopOnLevel()`: the first floor of each region past the Sewers gets a shop. */
export function shopOnLevel(depth: number): boolean {
	return depth === 6 || depth === 11 || depth === 16;
}

/** `Dungeon.java`'s depth switch, for the five regions this port generates. */
function regionForDepth(depth: number): 'sewers' | 'prison' | 'caves' | 'city' | 'halls' {
	if (depth <= 5) return 'sewers';
	if (depth <= 10) return 'prison';
	if (depth <= 14) return 'caves';
	if (depth <= 19) return 'city';
	if (depth <= 24) return 'halls';
	throw new Error(`regularLevel: depth ${depth} is outside the ported regions (Sewers 1-5, Prison 6-10, Caves 11-14, City 16-19, Halls 21-24)`);
}

/** `StandardRoom.chances[]`, depths 1-14 (Sewers + Prison + Caves). Prison's table zeroes the
 *  three Sewers-flavour classes (indices 1-3) and enables `SegmentedRoom`/`PillarsRoom`/
 *  `CellBlockRoom` (4-6) instead; Caves' zeroes those in turn and enables `CaveRoom`/
 *  `CavesFissureRoom`/`CirclePitRoom` (7-9). The 10 shared "misc" classes (16-25) keep weight 1
 *  in all three regions. */
const STANDARD_ROOM_CHANCE_ROWS = (() => {
	const node = MWL_TRAIT_NODES.find((candidate) => candidate.attributes.id === 'standardRoomChances');
	if (!node) throw new Error('MWL room rule is missing standardRoomChances');
	const effect = node.children.find((child) => child.tag === 'effect' && child.attributes.apply_to === 'entries');
	const raw = effect?.attributes.set;
	if (raw === undefined) throw new Error('MWL room rule is missing entries');
	return raw.split(';').map((entry) => {
		const [depthText, values] = entry.split('|');
		const depth = Number(depthText);
		const chances = values?.split(',').map(Number) ?? [];
		if (!Number.isInteger(depth) || chances.length !== 26 || chances.some((chance) => !Number.isFinite(chance) || chance < 0)) {
			throw new Error(`MWL room rule has invalid entry ${entry}`);
		}
		return [depth, chances] as const;
	});
})();

function standardRoomChances(depth: number): number[] {
	let selected = STANDARD_ROOM_CHANCE_ROWS[0]?.[1];
	for (const [rowDepth, chances] of STANDARD_ROOM_CHANCE_ROWS) {
		if (rowDepth <= depth) selected = chances;
	}
	if (!selected) throw new Error(`MWL room rule has no row for depth ${depth}`);
	return selected;
}

/**
 * `RegularLevel.initRooms()`. `EntranceRoom`/`ExitRoom` both extend `StandardRoom` in Java, so
 * `new EntranceRoom()`/`new ExitRoom()` each burn one auto sizeCat roll via the same instance
 * initializer `StandardRoom.createRoom()`'s constructions do - and Java constructs them (the very
 * first two lines of `initRooms()`) *before* `standardRooms()`'s own `Random.chances()` count
 * roll. An earlier version of this function took `standards`/`specials` as pre-computed
 * parameters, which meant the caller had already rolled those counts before entrance/exit were
 * ever constructed - a real ordering bug found via the Phase 2 Java-fixture comparison, alongside
 * the builder-before-counts bug this function's caller (`buildRoomGraph`) already documents.
 */
function initRooms(depth: number, feelingLarge: boolean, feelingSecrets: boolean, runSeedForFloor: bigint): Room[] {
	const rooms: Room[] = [];
	const entrance = new Room('entrance');
	const exit = new Room('exit');
	rooms.push(entrance, exit);

	const region = regionForDepth(depth);
	const standards0 = regionRoomCount(region, 'standard', feelingLarge);
	const standards = feelingLarge ? Math.ceil(standards0 * 1.5) : standards0;

	for (let i = 0; i < standards; i++) {
		let s: Room;
		do {
			// StandardRoom.createRoom(): Random.chances(chances[depth]) picks the concrete
			// class via Reflection.newInstance - now wired to the real 14-class registry (see
			// rooms/standard/registry.ts) instead of discarding the roll.
			const table = standardRoomChances(depth);
			const idx = SpdRandom.chances(table);
			const standardKind = STANDARD_ROOM_CLASS_ORDER[idx];
			if (!standardKind) {
				throw new Error(`initRooms: StandardRoom index ${idx} is not one of the 14 classes reachable in Sewers - table/registry mismatch`);
			}
			s = new Room('standard', standardKind);
		} while (!s.setSizeCat(0, standards - i - 1));
		i += s.sizeCat!.roomValue - 1;
		rooms.push(s);
	}

	// `if (Dungeon.shopOnLevel()) initRooms.add(new ShopRoom());` - `shopOnLevel()` is
	// `depth == 6 || 11 || 16`, so this fires on Prison's first floor. Unlike `EntranceRoom`/
	// `ExitRoom`, `ShopRoom` extends `SpecialRoom`, NOT `StandardRoom`, so it does NOT inherit
	// the `{ setSizeCat(); }` instance initializer: construction here burns zero RNG. Its stock
	// (and hence its size) is rolled lazily, on the builder's first `minWidth()` call - see
	// `Room.shopStock()` and `spdItems/shopItems.ts`.
	if (shopOnLevel(depth)) {
		const shop = new Room('shop');
		shop.shopDepth = depth;
		rooms.push(shop);
	}

	const specials0 = regionRoomCount(region, 'special', feelingLarge);
	const specials = feelingLarge ? specials0 + 1 : specials0;

	// SpecialRoom.initForFloor(): must run before the specials loop rolls any SpecialRoom class,
	// but burns no RNG itself (a deterministic Dungeon.seed%3 check) - its exact position relative
	// to other rolls doesn't affect the RNG stream, only that it runs before first use.
	initSpecialRoomFloor(depth, runSeedForFloor);

	// `Dungeon.bossLevel(depth+1)` - the floor before each region's boss level (5/10/15/20/25),
	// so depth 4 in Sewers, depth 9 in Prison, depth 14 in Caves, depth 19 in City, depth 24 in
	// Halls.
	const bossNext = depth === 4 || depth === 9 || depth === 14 || depth === 19 || depth === 24;
	// `if (s instanceof PitRoom) specials++;` (RegularLevel.java:141) - a PitRoom pick grows the
	// loop bound by one more iteration, since a pit room "replaces" what would otherwise be a
	// normal special room slot. `specials` is reassigned (not const) to model this - found missing
	// via the Phase 2 Java-fixture comparison (a real, if rare, room-count-off-by-one source).
	let specialsRemaining = specials;
	for (let i = 0; i < specialsRemaining; i++) {
		const kind = createSpecialRoom(depth, bossNext);
		if (kind === 'pit') specialsRemaining++;
		rooms.push(new Room('special', undefined, kind));
	}

	// `if (feeling == Feeling.SECRETS) secrets++;` (RegularLevel.java:147) - one additional secret
	// room on a SECRETS-feeling floor. Missing until the Phase 2 Java-fixture comparison caught it
	// (seed 999999999999 depth 3, feeling SECRETS, was short exactly one SecretLaboratoryRoom).
	const secrets = secretsForFloor(depth) + (feelingSecrets ? 1 : 0);
	for (let i = 0; i < secrets; i++) {
		const kind = createSecretRoom();
		rooms.push(new Room('secret', undefined, undefined, kind));
	}

	// `PrisonLevel.initRooms()` is `return Wandmaker.Quest.spawnRoom(super.initRooms())` - the
	// quest room is appended AFTER everything above, so its own draws come last in initRooms().
	if (region === 'prison') return wandmakerSpawnRoom(rooms, depth);

	// `CavesLevel.initRooms()` is `return Blacksmith.Quest.spawn(super.initRooms())` - the quest
	// room is appended AFTER everything above, same as Wandmaker's Prison-side hook. Unlike
	// Wandmaker (which just appends an existing `SpecialRoom` subclass), `BlacksmithRoom`'s own
	// paint() also builds a `QuestEntrance`/`LevelTransition` to a separate `MiningLevel` branch;
	// both are carried through the live bridge after the room-graph roll and room painting.
	if (region === 'caves') return blacksmithSpawnRooms(rooms, depth);

	// `HallsLevel.initRooms()` is `rooms.add(new DemonSpawnerRoom()); return rooms;` -
	// unconditional, unlike Blacksmith's roll-gated forge above: every Halls floor gets one, no
	// RNG consumed. `DemonSpawnerRoom`'s own custom floor tilemap (keyed off
	// `Statistics.amuletObtained`) isn't ported - see `demonSpawnerRoom.ts`'s own doc comment for
	// why the room/mob itself now is (a real `demonSpawner`/`ripperDemon` pair now live in
	// `main.ts`, independent of this room-graph placement).
	if (region === 'halls') rooms.push(new Room('special', undefined, 'demonSpawner'));

	return rooms;
}

/** `RegularLevel.builder()`. */
function pickBuilder(): LoopBuilder | FigureEightBuilder {
	if (SpdRandom.int(2) === 0) {
		return new LoopBuilder().setLoopShape(2, SpdRandom.floatRange(0, 0.65), SpdRandom.floatRange(0, 0.50));
	}
	return new FigureEightBuilder().setLoopShape(2, SpdRandom.floatRange(0.3, 0.8), 0);
}

/**
 * `SewerBossLevel.builder()`: unlike every other `RegularLevel`, this is NOT a 50/50 Loop/
 * FigureEight roll - it always returns a `FigureEightBuilder`, with its own shape/path/tunnel
 * parameters. `setPathLength`/`setTunnelLength` consume no RNG (plain field assignment); the
 * single `Random.Float(0.3f, 0.8f)` from `setLoopShape` is the only draw `builder()` makes here.
 */
function sewerBossPickBuilder(): FigureEightBuilder {
	const builder = new FigureEightBuilder().setLoopShape(2, SpdRandom.floatRange(0.3, 0.8), 0);
	builder.pathLength = 1;
	builder.pathLenJitterChances = [1];
	builder.pathTunnelChances = [1, 2];
	builder.branchTunnelChances = [1];
	return builder;
}

/**
 * `SewerBossLevel.initRooms()`. Entirely replaces `RegularLevel.initRooms()` - no special/secret
 * rooms via the run-level queues, no shop, no Wandmaker hook. `standardRooms(true)` is hardcoded
 * (the `forceMax` parameter is always `true` here, unconditionally - not gated on `Feeling.LARGE`
 * like the base class), returning a flat 3. Each of those 3 filler rooms gets a second, explicit
 * `setSizeCat(0, 0)` after its own construction-time auto-roll, forcing NORMAL size only (its
 * return value is unchecked in Java - every reachable Sewers `StandardRoomKind` has a nonzero
 * ordinal-0 weight, so it never fails). The `GooBossRoom`/`RatKingRoom` additions are ported in
 * `rooms/sewerBoss/gooBossRoom.ts`/`ratKingRoom.ts` - see `room.ts`'s `SecretRoomKind`/
 * `StandardRoomKind` doc comments for what's RNG-faithful vs content-skipped in each.
 */
function sewerBossInitRooms(depth: number): Room[] {
	const rooms: Room[] = [];
	const entrance = new Room('entrance');
	entrance.sewerBossVariant = 'entrance';
	const exit = new Room('exit');
	exit.sewerBossVariant = 'exit';
	rooms.push(entrance, exit);

	for (let i = 0; i < 3; i++) {
		const table = standardRoomChances(depth);
		const idx = SpdRandom.chances(table);
		const standardKind = STANDARD_ROOM_CLASS_ORDER[idx];
		if (!standardKind) {
			throw new Error(`sewerBossInitRooms: StandardRoom index ${idx} is not one of the reachable classes at depth ${depth}`);
		}
		const s = new Room('standard', standardKind);
		s.setSizeCat(0, 0);
		rooms.push(s);
	}

	const gooRoom = new Room('standard', randomGooBossKind());
	rooms.push(gooRoom);

	rooms.push(new Room('secret', undefined, undefined, 'ratKing'));

	return rooms;
}

export interface GraphResult {
	rooms: Room[];
	attempts: number;
	feeling: number | null;
}

/**
 * `Level.create()`'s level-feeling roll: for any non-boss depth-0-branch floor past depth 1,
 * `Random.Int(14)` picks one of 7 `Feeling` values (cases 0-6) or none (7-13, ~50% chance overall).
 * Only case 4 (LARGE, +50% standard rooms rounded up, +1 special room) affects room-graph shape;
 * the other six (CHASM/WATER/GRASS/DARK/TRAPS/SECRETS) only change item spawns, torch/view-distance
 * tweaks, or painter fill variants (the 85%/90% "WATER" fill, PORT_COVERAGE.md) - none of which
 * this port models yet, so the roll's *value* only matters here for LARGE; every other outcome is
 * captured (for future use) but has no further effect in this port. This must run on the level's
 * own generator, before the room-graph build - a real bug this Phase 2 comparison caught: earlier
 * code skipped this call for depths 2-4 entirely, desyncing every downstream RNG draw on those
 * floors (not just the already-documented depth-1/2 guidebook nondeterminism).
 */
export function rollLevelFeeling(depth: number): number | null {
	if (depth <= 1) return null;
	return SpdRandom.int(14);
}

/**
 * `RegularLevel.build()`'s room-graph portion (painting isn't ported this pass). Caller is
 * responsible for the RNG generator push/pop around this call (see `Level.create()`'s sequence
 * in PORT_COVERAGE.md) - this function only consumes calls from whatever generator is current.
 * Rolls the level feeling itself (see `rollLevelFeeling()`) before building, matching Java's order.
 *
 * Java's outer `do { ... } while (rooms == null)` retry loop is technically uncapped; capped
 * here at 200 attempts as a defensive measure (documented deviation, matching this repo's
 * existing pattern for `Patch.generate`'s fill-correction loop) - not expected to matter for
 * Sewers depths 1-4 in practice.
 */
export function buildRoomGraph(depth: number, runSeed: bigint): GraphResult {
	const feeling = rollLevelFeeling(depth);
	const feelingLarge = feeling === 4;
	const feelingSecrets = feeling === 6;

	// RegularLevel.build() picks the builder FIRST (Random.Int(2) + 2 Random.Float calls), then
	// calls initRooms() - which is where standardRooms()/specialRooms()'s own Random.chances()
	// count rolls happen (SewerLevel.standardRooms()/specialRooms()). An earlier version of this
	// function called sewerStandardRooms()/sewerSpecialRooms() before pickBuilder(), which put
	// those two Random.chances() draws ahead of the builder's Int(2)+2Float draws - a real
	// ordering bug found via the Phase 2 Java-fixture comparison (same RNG-call-count downstream,
	// but every subsequent room-content roll reads different values once the stream is shifted).
	//
	// Depth 5 (`SewerBossLevel`) overrides both `builder()` and `initRooms()` completely - see
	// `sewerBossPickBuilder()`/`sewerBossInitRooms()` above. `setLandmarkRoom()` costs no RNG, so
	// calling it after the room list is fully built (rather than inline, as Java's own
	// `initRooms()` does between constructing the goo room and the RatKingRoom) doesn't affect
	// stream order.
	let builder: LoopBuilder | FigureEightBuilder;
	let initial: Room[];
	if (depth === 5) {
		const fig = sewerBossPickBuilder();
		initial = sewerBossInitRooms(depth);
		const gooRoom = initial.find(r => r.kind === 'standard' && r.standardKind?.startsWith('goo'));
		if (!gooRoom) throw new Error('buildRoomGraph: sewerBossInitRooms produced no goo boss room');
		fig.setLandmarkRoom(gooRoom);
		builder = fig;
	} else {
		builder = pickBuilder();
		// standardRooms()/specialRooms()'s own Random.chances() count rolls happen inside
		// initRooms() itself now, in their real Java position (after entrance/exit construction,
		// interleaved with the standard/special room loops) - see initRooms()'s own doc comment.
		initial = initRooms(depth, feelingLarge, feelingSecrets, runSeed);
	}
	SpdRandom.shuffle(initial);

	let attempts = 0;
	let rooms: Room[] | null = null;
	const MAX_ATTEMPTS = 200;
	while (rooms === null && attempts < MAX_ATTEMPTS) {
		attempts++;
		for (const r of initial) { r.neigbours = []; r.connected.clear(); }
		const clone = initial.slice();
		rooms = builder.build(clone, depth);
	}

	if (!rooms) {
		throw new Error(`buildRoomGraph: failed to converge after ${MAX_ATTEMPTS} attempts (depth ${depth})`);
	}

	return { rooms, attempts, feeling };
}
