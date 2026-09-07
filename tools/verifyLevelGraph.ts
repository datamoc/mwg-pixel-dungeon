// Dumps the ported room-graph builder's output (positions, sizes, connections) for a handful of
// fixed seeds/depths, so the RNG call ordering and graph shape are inspectable and reproducible
// run-to-run. This is NOT yet compared against a Java fixture (see PORT_COVERAGE.md /
// frolicking-drifting-squirrel.md's Phase 2) - it only proves the TS side is internally
// deterministic and self-consistent for a given seed.
//
// `src/` uses extensionless relative imports (this project's normal Vite/tsc convention), which
// Node's ESM loader can't resolve directly even with native TS type-stripping - so this can't be
// run as plain `node tools/verifyLevelGraph.ts`. Bundle it first, then run the bundle:
//   npx esbuild tools/verifyLevelGraph.ts --bundle --platform=node --format=esm --outfile=/tmp/verifyLevelGraph.mjs
//   node /tmp/verifyLevelGraph.mjs

import { SpdRandom, spdSeedForDepth, pushRunInitGenerator } from '../src/spdRng.ts';
import { buildRoomGraph } from '../src/spdLevelGen/regularLevel.ts';
import { resetSpecialRoomRunState } from '../src/spdLevelGen/rooms/special/registry.ts';
import { resetSecretRoomRunState } from '../src/spdLevelGen/rooms/secret/registry.ts';
import { resetWandmakerRunState } from '../src/spdLevelGen/wandmaker.ts';
import type { Room } from '../src/spdLevelGen/room.ts';
import { generatorFullReset } from '../src/spdItems/generator.ts';
import { resetShopRunState } from '../src/spdItems/shopItems.ts';

function dumpGraph(seed: bigint, depth: number): string {
	const floorSeed = spdSeedForDepth(seed, depth, 0);
	// Level.create() pushes a second generator seeded from the derived per-floor seed.
	SpdRandom.pushGenerator(floorSeed);

	const { rooms, attempts, feeling } = buildRoomGraph(depth, seed);

	const lines: string[] = [];
	lines.push(`seed=${seed} depth=${depth} attempts=${attempts} rooms=${rooms.length} feeling=${feeling}`);
	const sorted = rooms.slice().sort((a, b) => (a.left - b.left) || (a.top - b.top));
	for (const r of sorted) {
		const conns = Array.from(r.connected.keys())
			.map((other: Room) => `(${other.left},${other.top})`)
			.sort()
			.join(' ');
		const label = r.kind === 'standard' ? `standard:${r.standardKind}` : r.kind === 'special' ? `special:${r.specialKind}` : r.kind === 'secret' ? `secret:${r.secretKind}` : r.kind;
		lines.push(`  ${label.padEnd(24)} [${r.left},${r.top} - ${r.right},${r.bottom}] w=${r.width()} h=${r.height()} -> ${conns}`);
	}

	SpdRandom.popGenerator();
	return lines.join('\n');
}

const seeds = [123456789n, 1n, 42n, 999999999999n];
// 1,2,3,4,7,8,9 - matching LevelGenHarness.java and verifyLevelPaint.ts. Depth 5 is
// SewerBossLevel (not a RegularLevel) and depth 6 needs the unported ShopRoom, so both are
// skipped on BOTH sides; see the harness header for why that makes this an artificial sequence.
const depths = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// SpecialRoom.initForRun()/SecretRoom.initForRun() run on Dungeon.init()'s real run-level
// generator (seed+1, after the label/color/gem shuffle burns - see spdRng.ts's
// pushRunInitGenerator() doc for why), not the raw floor-generation seed.
function resetRunStateForSeed(seed: bigint): void {
	pushRunInitGenerator(seed);
	resetSpecialRoomRunState();
	resetSecretRoomRunState();
	// Was missing until a Prison-graph investigation caught it: without this, `Wandmaker.Quest`'s
	// `type`/`spawned` fields leaked across seeds (this function runs once per seed, in sequence),
	// causing a stray quest room on Prison depth 6 (where `depth > 6` should forbid it) for every
	// seed after the first one that rolled the quest. Note this tool still can't fully match Java
	// for Prison depths 8-9 in isolation: `state.spawned` only becomes `true` inside
	// `spawnWandmaker()`, called from the PAINT stage this graph-only tool never runs - so a floor
	// that rolls the quest room in its graph will roll it AGAIN on a later floor here, where the
	// real game (and `verifyLevelPaint.ts`, which does paint) would not. Trust
	// `verifyLevelPaint.ts` over this tool for any depth-6-9 Prison comparison.
	resetWandmakerRunState();
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
			out.push(dumpGraph(seed, depth));
		} catch (e) {
			out.push(`seed=${seed} depth=${depth} FAILED: ${(e as Error).message}`);
		}
		out.push('');
	}
}

// Determinism check: same seed+depth run twice must produce an identical dump.
resetRunStateForSeed(123456789n);
const first = dumpGraph(123456789n, 1);
resetRunStateForSeed(123456789n);
const second = dumpGraph(123456789n, 1);
out.push(`determinism check: ${first === second ? 'PASS (identical dump on repeat run)' : 'FAIL (dumps differ!)'}`);

console.log(out.join('\n'));
