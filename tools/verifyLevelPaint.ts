// Sub-pass 3 verification: runs the graph builder, then `paintSewerLevel()` (the full
// RegularPainter/SewerPainter pipeline - room painting, doors, water/grass, traps, decorate),
// for the same fixed seeds/depths as verifyLevelGraph.ts, and dumps a tile-character map plus
// door/trap/room summaries so paint output is eyeballable. Not yet compared against a Java
// fixture (Phase 2 still needs that, per the plan).
//
// NOTE: depth-1 output (and depth-2, if `guideSearchingFound` were false) is expected to vary
// run-to-run - this is a real, source-confirmed property of the original game, not a bug in
// this port. See entranceRoom.ts's module comment and PORT_COVERAGE.md for why. Depths 3-4 are
// fully deterministic.
//
// Bundle first (same as verifyLevelGraph.ts):
//   npx esbuild tools/verifyLevelPaint.ts --bundle --platform=node --format=esm --outfile=/tmp/verifyLevelPaint.mjs
//   node /tmp/verifyLevelPaint.mjs

import { SpdRandom, spdSeedForDepth, pushRunInitGenerator } from '../src/spdRng.ts';
import { buildRoomGraph } from '../src/spdLevelGen/regularLevel.ts';
import { resetSpecialRoomRunState } from '../src/spdLevelGen/rooms/special/registry.ts';
import { resetSecretRoomRunState } from '../src/spdLevelGen/rooms/secret/registry.ts';
import { paintSewerLevel, paintSewerBossLevel } from '../src/spdLevelGen/sewerPainter.ts';
import { paintPrisonLevel } from '../src/spdLevelGen/prisonPainter.ts';
import { paintCavesLevel } from '../src/spdLevelGen/cavesPainter.ts';
import { paintCityLevel } from '../src/spdLevelGen/cityPainter.ts';
import { paintHallsLevel } from '../src/spdLevelGen/hallsPainter.ts';
import { resetWandmakerRunState } from '../src/spdLevelGen/wandmaker.ts';
import { resetBlacksmithRunState } from '../src/spdLevelGen/blacksmith.ts';
import { Terrain } from '../src/spdLevelGen/paintLevel.ts';
import { DoorType } from '../src/spdLevelGen/room.ts';
import { entranceRoomContext } from '../src/spdLevelGen/rooms/standard/entranceRoom.ts';
import { generatorFullReset } from '../src/spdItems/generator.ts';
import { resetShopRunState } from '../src/spdItems/shopItems.ts';

const CHAR: Record<number, string> = {
	[Terrain.CHASM]: ' ', [Terrain.EMPTY]: '.', [Terrain.GRASS]: '"', [Terrain.EMPTY_WELL]: 'w',
	[Terrain.WALL]: '#', [Terrain.DOOR]: '+', [Terrain.ENTRANCE]: '<', [Terrain.EXIT]: '>', [Terrain.EMBERS]: '~',
	[Terrain.LOCKED_DOOR]: 'L', [Terrain.PEDESTAL]: 'P', [Terrain.WALL_DECO]: '%',
	[Terrain.BARRICADE]: 'X', [Terrain.EMPTY_SP]: ',', [Terrain.HIGH_GRASS]: '"',
	[Terrain.SECRET_DOOR]: '+', [Terrain.SECRET_TRAP]: '^', [Terrain.TRAP]: '^',
	[Terrain.INACTIVE_TRAP]: '^', [Terrain.EMPTY_DECO]: ',', [Terrain.SIGN]: 's', [Terrain.WELL]: 'W',
	[Terrain.STATUE]: '@', [Terrain.STATUE_SP]: '@', [Terrain.BOOKSHELF]: 'B', [Terrain.ALCHEMY]: 'A',
	[Terrain.CRYSTAL_DOOR]: 'C', [Terrain.WATER]: '~', [Terrain.LOCKED_EXIT]: 'V',
};

function dump(seed: bigint, depth: number): string {
	entranceRoomContext.depth = depth;
	const floorSeed = spdSeedForDepth(seed, depth, 0);
	SpdRandom.pushGenerator(floorSeed);

	const { rooms, attempts, feeling } = buildRoomGraph(depth, seed);

	let error: string | null = null;
	let level;
	try {
		level = depth === 5 ? paintSewerBossLevel(rooms, depth)
			: depth <= 5 ? paintSewerLevel(rooms, depth, feeling)
			: depth <= 10 ? paintPrisonLevel(rooms, depth, feeling)
			: depth <= 14 ? paintCavesLevel(rooms, depth, feeling)
			: depth <= 19 ? paintCityLevel(rooms, depth, feeling)
			: paintHallsLevel(rooms, depth, feeling);
	} catch (e) {
		error = (e as Error).message;
	}

	SpdRandom.popGenerator();

	const doorCounts: Record<string, number> = {};
	for (const r of rooms) {
		for (const d of r.connected.values()) {
			if (!d) continue;
			doorCounts[DoorType[d.type]] = (doorCounts[DoorType[d.type]] ?? 0) + 1;
		}
	}

	const lines: string[] = [];
	lines.push(`seed=${seed} depth=${depth} attempts=${attempts} rooms=${rooms.length} feeling=${feeling} traps=${level?.traps.size ?? '?'}${error ? ` PAINT FAILED: ${error}` : ''}`);
	lines.push(`  door types (counted from both ends, so /2): ${JSON.stringify(doorCounts)}`);
	const kinds = rooms.map(r =>
		r.kind === 'standard' ? `standard:${r.standardKind}` :
		r.kind === 'special' ? `special:${r.specialKind}` :
		r.kind === 'secret' ? `secret:${r.secretKind}` :
		r.kind
	).sort();
	lines.push(`  room kinds: ${kinds.join(', ')}`);
	// Room rectangles, sorted, to separate graph-stage fidelity from paint-stage fidelity.
	const rects = rooms.map(r => `${r.left},${r.top},${r.right},${r.bottom}`).sort();
	lines.push(`  room rects: ${rects.join(' ')}`);
	if (!error && level) {
		for (let y = 0; y < level.h; y++) {
			let row = '';
			for (let x = 0; x < level.w; x++) row += CHAR[level.map[x + y * level.w]] ?? '?';
			lines.push('  ' + row);
		}
	}
	return lines.join('\n');
}

const seeds = [123456789n, 1n, 42n, 999999999999n, 2n, 7n, 55555n];
// 1,2,3,4,6,7,8,9,11,12,13,14 - matching LevelGenHarness.java exactly. Depth 6 is now included,
// since ShopRoom is ported (see spdItems/shopItems.ts). Depths 5/10/15 are still skipped:
// SewerBossLevel/PrisonBossLevel/CavesBossLevel all extend Level, not RegularLevel, so this port
// does not generate any of them - and none consumes the run-level state the later floors read
// (secretsForFloor/initForFloor are called only from RegularLevel.initRooms(), and the harness
// skips createItems() on every floor anyway), so omitting them on BOTH sides leaves every later
// depth consistent between them.
const depths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 16, 17, 18, 19, 21, 22, 23, 24];

// SpecialRoom.initForRun()/SecretRoom.initForRun() run on Dungeon.init()'s real run-level
// generator - see verifyLevelGraph.ts's identical helper and spdRng.ts's pushRunInitGenerator().
function resetRunStateForSeed(seed: bigint): void {
	pushRunInitGenerator(seed);
	resetSpecialRoomRunState();
	resetSecretRoomRunState();
	// Dungeon.init() also resets the Wandmaker quest run-state. Consumes no RNG.
	resetWandmakerRunState();
	resetBlacksmithRunState();
	// `Generator.fullReset()` is the last thing Dungeon.init() runs on this generator. Its
	// `Random.Int(2)` picks which of the two category decks the whole run uses, and those
	// weights are then rolled on every floor's own stream - so it steers level content.
	generatorFullReset();
	// Dungeon.LimitedDrops.reset() + initHero()'s velvet-pouch drop, as ShopRoom.ChooseBag()
	// observes them. Consumes no RNG (Dungeon.init() does this after resetGenerators()).
	resetShopRunState();
	SpdRandom.popGenerator();
}

const out: string[] = [];
for (const seed of seeds) {
	resetRunStateForSeed(seed);
	for (const depth of depths) {
		try {
			out.push(dump(seed, depth));
		} catch (e) {
			out.push(`seed=${seed} depth=${depth} FAILED: ${(e as Error).message}`);
		}
		out.push('');
	}
}
console.log(out.join('\n'));
