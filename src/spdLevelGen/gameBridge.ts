/**
 * The seam between the verified level generator in this directory and `main.ts`'s live game.
 *
 * Everything else under `spdLevelGen/` exists to reproduce Java's RNG stream and tile output
 * byte for byte (see PORT_COVERAGE.md). None of it knows anything about how this port renders
 * or pathfinds. This module is the one place that translates: it drives generation in the exact
 * order the Java harness does, then reduces a `PaintLevel` (real `Terrain.java` int constants,
 * 0-31) down to the nine coarse terrain kinds `main.ts` actually implements.
 *
 * Two properties of the translation are worth stating up front, because both are lossy and
 * neither is a bug in the generator:
 *
 * 1. **The generated grid is the source of truth.** For a ported depth, `main.ts` must NOT run
 *    its own `placeWaterPool`/`placeGrass`/`placeDoors`/`placeHiddenTraps` afterwards - those
 *    are the generic generator's terrain passes, and the ported floor already contains real
 *    water, grass, doors and traps in their real Java positions. Running them would overwrite
 *    exactly the output that was verified.
 * 2. **This port implements fewer terrain kinds than SPD has.** The mapping below is therefore
 *    many-to-one, and several SPD tiles collapse onto the nearest kind whose *passability* is
 *    right, losing their behaviour (not their position). Each is listed in
 *    `SPD_TERRAIN_TO_GAME_KIND`'s table with what is lost.
 */
import { PaintLevel, Terrain, set } from './paintLevel';
import { Room } from './room';
import { buildRoomGraph } from './regularLevel';
import { paintSewerLevel, paintSewerBossLevel } from './sewerPainter';
import { paintPrisonLevel } from './prisonPainter';
import { paintCavesLevel, decorateStandaloneCaves } from './cavesPainter';
import { paintCityLevel } from './cityPainter';
import { paintHallsLevel } from './hallsPainter';
import { SpdRandom, spdSeedForDepth, pushRunInitGenerator } from '../spdRng';
import { resetSpecialRoomRunState } from './rooms/special/registry';
import { resetSecretRoomRunState } from './rooms/secret/registry';
import { resetWandmakerRunState } from './wandmaker';
import { blacksmithQuestUsesBlood, resetBlacksmithRunState } from './blacksmith';
import { entranceRoomContext } from './rooms/standard/entranceRoom';
import { generatorFullReset } from '../spdItems/generator';
import { resetShopRunState } from '../spdItems/shopItems';
import { generateBossFloor } from './bossLevels';
import { paintCaveRoom } from './rooms/standard/caveRoom';
import { paintStandaloneTerrain } from './regularPainter';

/**
 * `main.ts`'s nine terrain kinds, by name. `main.ts` owns the numeric codes (its `WALL`/
 * `FLOOR`/... consts index its own `Roguelike.TerrainKind[]`); this module deliberately does not
 * hardcode them, so the two can't drift silently - the caller passes its own code table to
 * `toGameTerrain`.
 */
export type GameKindName =
	| 'wall'
	| 'floor'
	| 'trap'
	| 'water'
	| 'door'
	| 'grass'
	| 'highGrass'
	| 'doorClosed'
	| 'embers';

export type GameKindCodes = Record<GameKindName, number>;

/**
 * Every `Terrain.java` value the ported painters can emit, mapped to the nearest kind this port
 * renders. Passability is preserved in every case; behaviour is not always, and the losses are:
 *
 * - `CHASM` -> `floor`. The raw grid remains CHASM for the pit atlas frame, while the coarse
 *   collision kind stays open so FOV and hero movement match Java; `main.ts` consumes entry
 *   through `fallThroughChasm()`. Monster pathing still excludes raw chasm cells at its
 *   movement boundary because Java mobs cannot deliberately walk into pits.
 * - `BARRICADE` -> `wall`. Java's is flammable and can be burned through; here it is permanent.
 * - `LOCKED_EXIT` -> `wall`. Boss-floor gating; unreachable on the ported regular floors.
 * - `STATUE`/`STATUE_SP` -> `wall`. Java's statue mob is restored by `main.ts` from the
 *   room's mob payload; its occupied cell is opened back to a floor at adoption time so the
 *   live actor can participate in collision/combat.
 * - `BOOKSHELF` -> `wall`, `ALCHEMY` -> `wall`. Searchable/craftable in Java; scenery here.
 * - `WELL`/`EMPTY_WELL` -> `floor`. Java's wells hold a `WellWater` effect; here plain floor.
 * - `SIGN` -> `floor`. Java shows text on contact.
 * - `PEDESTAL` -> `floor`. Java's holds the Amulet on the last floor.
 * - `EMBERS` -> `embers`, a distinct passable live kind so fire burnout can preserve Java's
 *   terrain state. `EMPTY_SP`, `EMPTY_DECO`, `INACTIVE_TRAP` -> `floor`; those are cosmetic in
 *   Java too (an `INACTIVE_TRAP` is a sprung one), so they lose only their distinct sprite.
 * - `FURROWED_GRASS` -> `highGrass`; the raw grid preserves the exact Java value while the
 *   coarse kind retains passability and the existing tall-grass presentation.
 * - `CRYSTAL_DOOR` -> `doorClosed`, and it is registered as locked by the queued
 *   `crystalKey` that `RegularLevel` places after room painting.
 * - `SECRET_DOOR`/`SECRET_TRAP` are NOT in this table: they are concealed via `Secrets`
 *   instead, so they must render as their disguise (`wall`/`floor`) until discovered. See
 *   `PortedFloor.secretDoors`/`traps`.
 */
export const SPD_TERRAIN_TO_GAME_KIND: Record<number, GameKindName> = {
	[Terrain.CHASM]: 'floor',
	[Terrain.EMPTY]: 'floor',
	[Terrain.GRASS]: 'grass',
	[Terrain.EMPTY_WELL]: 'floor',
	[Terrain.WALL]: 'wall',
	[Terrain.DOOR]: 'door',
	[Terrain.ENTRANCE]: 'floor',
	[Terrain.EXIT]: 'floor',
	[Terrain.EMBERS]: 'embers',
	[Terrain.LOCKED_DOOR]: 'doorClosed',
	[Terrain.PEDESTAL]: 'floor',
	[Terrain.WALL_DECO]: 'wall',
	[Terrain.BARRICADE]: 'wall',
	[Terrain.EMPTY_SP]: 'floor',
	[Terrain.HIGH_GRASS]: 'highGrass',
	[Terrain.FURROWED_GRASS]: 'highGrass',
	// SECRET_DOOR / SECRET_TRAP handled via Secrets, see the doc comment above.
	[Terrain.SECRET_DOOR]: 'wall',
	[Terrain.SECRET_TRAP]: 'floor',
	[Terrain.TRAP]: 'trap',
	[Terrain.INACTIVE_TRAP]: 'floor',
	[Terrain.EMPTY_DECO]: 'floor',
	[Terrain.LOCKED_EXIT]: 'wall',
	[Terrain.SIGN]: 'floor',
	[Terrain.WELL]: 'floor',
	[Terrain.STATUE]: 'wall',
	[Terrain.STATUE_SP]: 'wall',
	[Terrain.BOOKSHELF]: 'wall',
	[Terrain.ALCHEMY]: 'wall',
	[Terrain.WATER]: 'water',
	[Terrain.CRYSTAL_DOOR]: 'doorClosed',
};

/**
 * SPD trap class name -> the five trap behaviours `main.ts` implements (`TRAP_KINDS`).
 *
 * The ported painters place traps by their real Java class names and weights, because that is
 * what `Random.chances`/`avoidsHallways` need; trap *behaviour* was never ported. So each real
 * class is routed here to the nearest implemented effect, and the many that have no analogue
 * fall back to `poisonDart` (the most generic "it hurts you" trap) rather than being dropped -
 * a trap that exists in the verified grid should still do something when stepped on.
 *
 * Only `toxic`, `burning`, `poisonDart` and `wornDart` are genuine matches. `chilling`,
 * `shocking`, `alarm`, `ooze`, `gripping`, `confusion`, `flock`, `summoning`, `teleportation`,
 * `gateway`, `geyser`, `frost`, `storm`, `corrosion`, `rockfall`, `guardian`, `warping` and
 * `pitfall` are all stand-ins: their real effects (freezing, chaining lightning, waking the
 * floor, corroding, rooting, confusing, summoning mobs, teleporting, opening a gateway, launching
 * the hero, dropping the hero a floor) need systems this port has none of.
 */
const TRAP_BEHAVIOUR: Record<string, string> = {
	toxic: 'toxic',
	burning: 'burning',
	poisonDart: 'poisonDart',
	wornDart: 'poisonDart',
	chilling: 'toxic',
	shocking: 'explosive',
	alarm: 'poisonDart',
	ooze: 'toxic',
	gripping: 'poisonDart',
	confusion: 'toxic',
	flock: 'poisonDart',
	summoning: 'poisonDart',
	teleportation: 'poisonDart',
	gateway: 'poisonDart',
	geyser: 'explosive',
	grim: 'grim',
	explosive: 'explosive',
	// Caves' trap table (`CavesLevel.trapClasses()`), the four not already covered above.
	frost: 'toxic',
	storm: 'explosive',
	corrosion: 'toxic',
	rockfall: 'poisonDart',
	guardian: 'poisonDart',
	warping: 'poisonDart',
	pitfall: 'poisonDart',
};

/**
 * The depths this port generates, in the order they must be generated.
 *
 * Identical to `LevelGenHarness.java`'s and both verify scripts' sequence, and that identity is
 * the whole point: `SecretRoom`'s budget, the `SpecialRoom` queue, `Generator`'s decks and the
 * shop's bag counter are all run-level state consumed floor by floor in ascending depth order,
 * so generating out of order (or twice) produces a different - unverified - floor.
 *
 * Depth 5 (`SewerBossLevel`) IS included, unlike the other four boss depths: it extends
 * `SewerLevel` -> `RegularLevel` (confirmed by reading the real Java source directly - a room-
 * and-corridor floor with a `FigureEightBuilder` and a grafted-in `GooBossRoom`/`RatKingRoom`,
 * not a hand-built arena), so this port's existing room-graph/paint machinery reaches it with a
 * few boss-specific overrides (`sewerBossPickBuilder()`/`sewerBossInitRooms()` in
 * `regularLevel.ts`, `paintSewerBossLevel()` in `sewerPainter.ts`). It touches none of the
 * cross-floor run-level state (`SpecialRoom`/`SecretRoom`'s queues, `Generator`'s decks,
 * Wandmaker/shop) - `SewerBossLevel.initRooms()` bypasses all of that machinery, constructing its
 * rooms directly - so inserting it here doesn't perturb depths 6+.
 *
 * `PrisonBossLevel`/`CavesBossLevel`/`CityBossLevel`/`HallsBossLevel` (depths 10, 15, 20, 25)
 * and `LastLevel` (depth 26) are now represented by fixed layouts in `bossLevels.ts`. Their
 * bespoke boss-fight state machines are still scene-owned and remain simplified, but these
 * floors no longer fall back to the generic dungeon generator.
 */
export const PORTED_DEPTHS: readonly number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26];

export function isPortedDepth(depth: number): boolean {
	return PORTED_DEPTHS.includes(depth);
}

export interface PortedDoor {
	x: number;
	y: number;
	/** a `LOCKED_DOOR`/`CRYSTAL_DOOR` cell; `main.ts` registers it as needing a key */
	locked: boolean;
	/** a `CRYSTAL_DOOR`, unlocked by the queued `crystalKey` item */
	crystal: boolean;
}

export interface PortedTrap {
	x: number;
	y: number;
	/** one of `main.ts`'s `TRAP_KINDS`, routed from the real class - see `TRAP_BEHAVIOUR` */
	behaviour: string;
	/** the real SPD trap class, kept for display/debugging */
	spdClass: string;
	hidden: boolean;
}

/** What `main.ts` needs to stand a ported floor up, extracted from the verified `PaintLevel`. */
export interface PortedFloor {
	width: number;
	height: number;
	/** cell -> `main.ts` terrain code, already mapped */
	terrain: Uint8Array;
	rooms: { left: number; top: number; right: number; bottom: number }[];
	/** the real `ENTRANCE` tile - where the hero arrives */
	entrance: { x: number; y: number } | null;
	/** the real `EXIT` tile, or null on a floor that has none */
	exit: { x: number; y: number } | null;
	/** branch exits such as Blacksmith's MiningLevel entrance; never treated as the main stairs */
	branchExits: { x: number; y: number; branch: number }[];
	doors: PortedDoor[];
	/** `SECRET_DOOR` cells, to conceal as wall until searched out */
	secretDoors: { x: number; y: number }[];
	traps: PortedTrap[];
	/** NPCs and special mobs placed by a Java room painter (shopkeeper, Wandmaker, etc.). */
	mobs: { x: number; y: number; kind: string; loot?: string }[];
	/** Room drops emitted by the real Painter, reduced to positions and source item ids. */
	groundItems: { x: number; y: number; kind: string; note?: string; sourceClass?: string; quantity?: number }[];
	/** Items queued through Java's Level.addItemToSpawn(), placed after room painting. */
	queuedItems: string[];
	/** Run-level Blacksmith.Quest.alternative, carried out of the generator for gameplay. */
	blacksmithAlternative: boolean;
	feeling: number | null;
	/** the untranslated grid, so callers can inspect what the mapping dropped */
	paint: PaintLevel;
}

// **** run-level state and per-run floor cache ****

interface RunCache {
	seed: bigint;
	/** `CavesBossLevel`'s arena water/trap scatter depends on the Stronger Bosses challenge. */
	strongerBosses: boolean;
	floors: Map<number, { paint: PaintLevel; rooms: Room[]; feeling: number | null }>;
}

let run: RunCache | null = null;

/**
 * `Dungeon.init()`'s run-level resets, on the run-init generator - identical to both verify
 * scripts' `resetRunStateForSeed`. Must happen once per run, before any floor is generated.
 */
function resetRunState(seed: bigint): void {
	pushRunInitGenerator(seed);
	resetSpecialRoomRunState();
	resetSecretRoomRunState();
	resetWandmakerRunState();
	resetBlacksmithRunState();
	generatorFullReset();
	resetShopRunState();
	SpdRandom.popGenerator();
}

/** One floor, generated exactly as the harness does: push the floor seed, build, paint, pop. */
function generateFloor(seed: bigint, depth: number, strongerBosses: boolean) {
	if (depth === 10 || depth === 15 || depth === 20 || depth === 25 || depth === 26) {
		// Boss floors also run inside Java's per-floor `Random` stream now, so the Caves arena's
		// `Patch.generate` water/trap scatter is deterministic. Push/pop keeps the shared stream
		// restored for the next floor in `portedFloor`'s loop (no draws are consumed otherwise).
		SpdRandom.pushGenerator(spdSeedForDepth(seed, depth, 0));
		try {
			return generateBossFloor(depth, strongerBosses);
		} finally {
			SpdRandom.popGenerator();
		}
	}
	entranceRoomContext.depth = depth;
	entranceRoomContext.branchSeed = spdSeedForDepth(seed, depth, 0);
	SpdRandom.pushGenerator(spdSeedForDepth(seed, depth, 0));
	try {
		const { rooms, feeling } = buildRoomGraph(depth, seed);
		const paint = depth === 5 ? paintSewerBossLevel(rooms, depth)
			: depth <= 5 ? paintSewerLevel(rooms, depth, feeling)
			: depth <= 10 ? paintPrisonLevel(rooms, depth, feeling)
			: depth <= 14 ? paintCavesLevel(rooms, depth, feeling)
			: depth <= 19 ? paintCityLevel(rooms, depth, feeling)
			: paintHallsLevel(rooms, depth, feeling);
		return { paint, rooms, feeling };
	} finally {
		SpdRandom.popGenerator();
	}
}

/** Java MiningLevel: a branch-only 32x32 CaveRoom with a 3x3 entrance clearing. */
function generateMiningBranch(seed: bigint, depth: number): PortedFloor {
	const floorSeed = spdSeedForDepth(seed, depth, 1);
	SpdRandom.pushGenerator(floorSeed);
	try {
		const paint = new PaintLevel(32, 32);
		const room = new Room('standard', 'cave');
		room.left = 1; room.top = 1; room.right = 31; room.bottom = 31;
		paintCaveRoom(paint, room);
		for (let y = 15; y <= 17; y++) for (let x = 15; x <= 17; x++) set(paint, x, y, Terrain.EMPTY);
		set(paint, 16, 16, Terrain.ENTRANCE);
		// MiningLevel invokes CavesPainter.setWater(0.35f, 6).setGrass(0.10f, 3)
		// with a null room list, which applies the patches globally to existing EMPTY cells.
		paintStandaloneTerrain(paint, { fill: Math.fround(0.35), smoothness: 6 }, { fill: Math.fround(0.10), smoothness: 3 });
		// CavesPainter.decorate() then performs its two global scans in null-room mode:
		// floor decoration followed by mineable WALL_DECO ore veins.
		decorateStandaloneCaves(paint);
		return extract(paint, [room], null);
	} finally {
		SpdRandom.popGenerator();
	}
}

/**
 * The ported floor for `depth`, generating (and caching) every earlier ported depth of this run
 * first.
 *
 * The catch-up loop is what keeps the live game's floors identical to the verified ones: the
 * hero normally descends in order, so it usually generates just the one new floor - but a run
 * that starts deeper (a debug jump), or one that revisits a floor after going back up, would
 * otherwise either skip run-level state or consume it twice. Caching makes a revisit free and
 * byte-identical instead of re-rolling it, which is also a behaviour change from the generic
 * generator: on a ported depth the floor you climb back down to is the one you left.
 *
 * `main.ts` owns the mutable gameplay layer (mobs, items, opened doors and traps) separately
 * from this immutable generated baseline. It snapshots that layer when leaving a depth, so this
 * cache only needs to guarantee that revisits receive the same generated layout.
 */
export function portedFloor(seed: bigint, depth: number, strongerBosses = false): PortedFloor {
	if (!isPortedDepth(depth)) {
		throw new Error(`portedFloor: depth ${depth} is not one of the ported depths (${PORTED_DEPTHS.join(', ')})`);
	}
	if (!run || run.seed !== seed || run.strongerBosses !== strongerBosses) {
		resetRunState(seed);
		run = { seed, strongerBosses, floors: new Map() };
	}
	for (const d of PORTED_DEPTHS) {
		if (d > depth) break;
		if (!run.floors.has(d)) run.floors.set(d, generateFloor(seed, d, strongerBosses));
	}
	const floor = run.floors.get(depth)!;
	return extract(floor.paint, floor.rooms, floor.feeling);
}

/** Generates the Blacksmith branch without perturbing the main run-level floor cache. */
export function miningBranchFloor(seed: bigint, depth: number): PortedFloor {
	return generateMiningBranch(seed, depth);
}

/** Discards the cached run, so the next `portedFloor` call re-runs `Dungeon.init()`'s resets. */
export function resetPortedRun(): void {
	run = null;
}

// **** PaintLevel -> PortedFloor ****

function extract(paint: PaintLevel, rooms: Room[], feeling: number | null): PortedFloor {
	const { w, h, map } = paint;
	const terrain = new Uint8Array(w * h);
	let entrance: { x: number; y: number } | null = null;
	let exit: { x: number; y: number } | null = null;
	const doors: PortedDoor[] = [];
	const secretDoors: { x: number; y: number }[] = [];
	const branchExits: { x: number; y: number; branch: number }[] = [];
	const branchCells = new Map(paint.transitions.filter((transition) => transition.type === 'branchExit')
		.map((transition) => [transition.pos, 1] as const));

	for (let cell = 0; cell < map.length; cell++) {
		const t = map[cell];
		const x = cell % w;
		const y = Math.floor(cell / w);

		if (t === Terrain.ENTRANCE) entrance = { x, y };
		else if (t === Terrain.EXIT) {
			if (branchCells.has(cell)) branchExits.push({ x, y, branch: branchCells.get(cell)! });
			else exit = { x, y };
		}
		else if (t === Terrain.DOOR) doors.push({ x, y, locked: false, crystal: false });
		else if (t === Terrain.LOCKED_DOOR) doors.push({ x, y, locked: true, crystal: false });
		else if (t === Terrain.CRYSTAL_DOOR) doors.push({ x, y, locked: true, crystal: true });
		else if (t === Terrain.SECRET_DOOR) secretDoors.push({ x, y });
	}

	const traps: PortedTrap[] = [];
	for (const [cell, trap] of paint.traps) {
		traps.push({
			x: cell % w,
			y: Math.floor(cell / w),
			behaviour: TRAP_BEHAVIOUR[trap.kind] ?? 'poisonDart',
			spdClass: trap.kind,
			hidden: trap.hidden,
		});
	}
	const groundItems = paint.groundItems.map((item) => ({
		x: item.pos % w,
		y: Math.floor(item.pos / w),
		kind: item.kind.split('|', 1)[0],
		note: item.note,
		sourceClass: item.sourceClass ?? item.kind.split('|')[1],
		quantity: item.quantity,
	}));
	const mobs = paint.mobs.map((mob) => ({
		x: mob.pos % w,
		y: Math.floor(mob.pos / w),
		kind: mob.kind,
		loot: mob.loot,
	}));

	// `main.ts`'s `populate()` finds a boss floor's boss room as `this.level.rooms[rooms.length-1]`
	// (the same convention the generic fallback generator already uses) - real Java doesn't order
	// rooms this way at all (it walks the room *list* to find one, since `SewerBossLevel` keeps
	// its own `roomEntrance`/`roomExit`/etc references), so this reorder exists purely to satisfy
	// that existing `main.ts` contract without changing it. Harmless for RNG fidelity: by this
	// point generation is complete, this only reorders the flattened output array.
	const orderedRooms = rooms.slice();
	const gooBossIndex = orderedRooms.findIndex(r => r.kind === 'standard' && r.standardKind?.startsWith('goo'));
	if (gooBossIndex !== -1) {
		const [gooBoss] = orderedRooms.splice(gooBossIndex, 1);
		orderedRooms.push(gooBoss);
	}

	return {
		width: w,
		height: h,
		terrain,
		rooms: orderedRooms.map(r => ({ left: r.left, top: r.top, right: r.right, bottom: r.bottom })),
		entrance,
		exit,
		branchExits,
		doors,
		secretDoors,
		traps,
		mobs,
		groundItems,
		queuedItems: [...paint.itemsToSpawn],
		blacksmithAlternative: blacksmithQuestUsesBlood(),
		feeling,
		paint,
	};
}

/**
 * Fills `floor.terrain` using the caller's own kind codes.
 *
 * Separate from `extract` so this module never has to know `main.ts`'s numeric terrain ids -
 * the caller passes them in, and a missing kind is a hard error rather than a silently wrong
 * tile.
 */
export function toGameTerrain(floor: PortedFloor, codes: GameKindCodes): Uint8Array {
	const map = floor.paint.map;
	const out = floor.terrain;
	for (let cell = 0; cell < map.length; cell++) {
		const name = SPD_TERRAIN_TO_GAME_KIND[map[cell]];
		if (name === undefined) {
			throw new Error(`toGameTerrain: no mapping for Terrain value ${map[cell]} at cell ${cell}`);
		}
		out[cell] = codes[name];
	}
	return out;
}
