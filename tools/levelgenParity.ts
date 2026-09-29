/**
 * Section 9 triage probe: differential level-gen parity for depths 1-9.
 *
 * Runs this port's own generator (`portedFloor`) over the exact seeds the Java
 * `LevelGenHarness` dumps (see its javadoc for the mirrored RNG setup) and diffs room
 * rects, feelings and painted maps block by block. This is a probe, not a gate: it
 * exits 0 with a report even when blocks differ, so a first run can record the gap
 * shape before anything is fixed. Promoting any subset to a hard gate is a later step.
 *
 * With `--write-ts-traces <dir>`, each floor's raw RNG draws are also captured (via
 * `spdRng`'s trace facility, armed around `portedFloor` exactly the way the harness
 * arms its own around the floor push/pop) into `levelgen_trace_<seed>_<depth>.txt`.
 * With `--java-traces <dir>`, those are sequence-diffed against the harness's own
 * per-floor traces (regenerated with `:desktop:runHarness -Dlevelgen.trace=true`),
 * which verifies RNG *call order*, not just identical outputs: the first divergence
 * pinpoints the exact draw where the two implementations part ways. Depths 1-2 are
 * skipped in the trace diff by design (Java's unseeded guidebook generator makes
 * even Java-vs-Java irreproducible there).
 * Add `--trace-stack-window <first>:<last>` with `--write-ts-traces` to emit
 * `levelgen_stacks_<seed>_<depth>.txt`, attributing each selected TypeScript draw to
 * its call stack. This turns a first-difference index into an actionable source location
 * without enabling stack capture for the whole run.
 *
 * Run with `npm run parity:levelgen -- --java-dump <path>` (defaults to the harness
 * task's output next to the Java checkout when `--spd-root` points at it). Regenerate
 * the Java side with `:desktop:runHarness` in the SPD checkout first.
 *
 * `checkConnectionRooms()` below runs on every invocation, with or without a dump:
 * R095 regression pins for the depths-11+ connection-room bands the walk never covers.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { portedFloor, primeRunState, resetPortedRun } from '../src/spdLevelGen/gameBridge';
import { setTraceDrawLog, setTraceStackWindow, traceStacks, SpdRandom } from '../src/spdRng';
import { MWL_TABLE_ROWS } from '../src/mwlContent';
import { createConnectionRoom } from '../src/spdLevelGen/connectionRoom';

interface JavaBlock {
	seed: string;
	depth: number;
	attempts: number;
	feelingRoll: number;
	feeling: string;
	rooms: number;
	traps: number;
	kinds: string[];
	rects: string[];
	map: string[];
}

function parseJavaDump(text: string): JavaBlock[] {
	const blocks: JavaBlock[] = [];
	const rawBlocks = text.split(/(?=^seed=\d+ depth=\d+ )/m).filter((b) => b.startsWith('seed='));
	for (const [bi, raw] of rawBlocks.entries()) {
		const rawLines = raw.split('\n');
		while (rawLines.length > 0 && rawLines[rawLines.length - 1]!.trim() === '') rawLines.pop();
		rawBlocks[bi] = rawLines.join('\n');
	}
	for (const raw of rawBlocks) {
		// `DIAG ` lines are Java-harness graph triage detail (builder class, placement-order
		// room list) - stripped before the head/kinds/rects/map parse below; used for manual
		// same-kinds/different-layout diffs, never for automated comparison.
		const lines = raw.split('\n').filter((l) => !l.startsWith('DIAG '));
		const head = lines[0]!.match(/seed=(\S+) depth=(\d+) attempts=(\d+) feelingRoll=(-?\d+) feeling=(\S+) rooms=(\d+) traps=(\d+)/);
		if (!head) throw new Error(`unparseable block head: ${lines[0]}`);
		const kinds = lines[1]!.replace(/^room kinds:\s*/, '').split(/,\s*/);
		const rects = lines[2]!.replace(/^.*room rects:\s*/, '').split(/\s+/).filter(Boolean).sort();
		blocks.push({
			seed: head[1]!, depth: Number(head[2]), attempts: Number(head[3]),
			feelingRoll: Number(head[4]), feeling: head[5]!, rooms: Number(head[6]), traps: Number(head[7]),
			kinds, rects, map: lines.slice(3).map((row) => row.replace(/^  /, '')),
		});
	}
	return blocks;
}

/** Mirrors `LevelGenHarness.buildCharMap()` 1:1 - TS Terrain ids equal Java's. */
const CHAR_BY_TERRAIN: Record<number, string> = {
	0: ' ', 1: '.', 2: '"', 3: 'w', 4: '#', 5: '+', 6: '+', 7: '<', 8: '>',
	9: '~', 10: 'L', 11: 'P', 12: '%', 13: 'X', 14: ',', 15: '"', 16: '+',
	17: '^', 18: '^', 19: '^', 20: ',', 21: 'V', 23: 's', 24: 'W', 25: '@',
	26: '@', 27: 'B', 28: 'A', 29: '~', 30: '"', 31: 'C',
};

const FEELING_NAMES = ['CHASM', 'WATER', 'GRASS', 'DARK', 'LARGE', 'TRAPS', 'SECRETS'];

/**
 * R095 regression pins for `ConnectionRoom.createRoom()`'s class-selection table
 * (`ConnectionRoom.chances[]`, tag `v3.3.8`). The MWL table once stopped at depth 10,
 * so Caves/City/Halls rolled Sewers odds; the differential walk above covers depths 1-9
 * only, leaving the deeper bands with no check at all. These invariants need no Java
 * side and run on every invocation below: exact anchor data, plus zero-weight absence
 * over 300 seeded rolls per depth. A zero-weight class can never be picked by the
 * cumulative-sum roll, so every absence is deterministic, not statistical - and the
 * single-class rows (depths 5, 21) must yield tunnel every time. Band literals are
 * Java's own rows, checked against `ConnectionRoom.java`, not derived from this port's
 * lookup: 1-4 forbid perimeter, 6-10 allow only perimeter/walkway, 11-15 forbid bridge
 * and perimeter, 16-20 forbid tunnel and bridge, 22-26 forbid perimeter.
 */
const CONNECTION_ANCHORS: Record<number, number[]> = {
	1: [20, 1, 0, 2, 2, 1], 2: [20, 1, 0, 2, 2, 1], 3: [20, 1, 0, 2, 2, 1],
	4: [20, 1, 0, 2, 2, 1], 5: [20, 0, 0, 0, 0, 0],
	6: [0, 0, 22, 3, 0, 0], 7: [0, 0, 22, 3, 0, 0], 8: [0, 0, 22, 3, 0, 0],
	9: [0, 0, 22, 3, 0, 0], 10: [0, 0, 22, 3, 0, 0],
	11: [12, 0, 0, 5, 5, 3], 16: [0, 0, 18, 3, 3, 1],
	21: [20, 0, 0, 0, 0, 0], 22: [15, 4, 0, 2, 3, 2],
};
// Depths with only one possible class: every roll must yield it.
const SINGLE_CLASS_DEPTHS: Record<number, string> = { 5: 'tunnel', 21: 'tunnel' };
// Depths with forbidden classes: no roll may yield one. Literals, see above.
const FORBIDDEN_BY_DEPTH: Record<number, string[]> = {
	1: ['perimeter'], 2: ['perimeter'], 3: ['perimeter'], 4: ['perimeter'],
	6: ['tunnel', 'bridge', 'ringTunnel', 'ringBridge'],
	7: ['tunnel', 'bridge', 'ringTunnel', 'ringBridge'],
	8: ['tunnel', 'bridge', 'ringTunnel', 'ringBridge'],
	9: ['tunnel', 'bridge', 'ringTunnel', 'ringBridge'],
	10: ['tunnel', 'bridge', 'ringTunnel', 'ringBridge'],
	11: ['bridge', 'perimeter'], 12: ['bridge', 'perimeter'], 13: ['bridge', 'perimeter'],
	14: ['bridge', 'perimeter'], 15: ['bridge', 'perimeter'],
	16: ['tunnel', 'bridge'], 17: ['tunnel', 'bridge'], 18: ['tunnel', 'bridge'],
	19: ['tunnel', 'bridge'], 20: ['tunnel', 'bridge'],
	22: ['perimeter'], 23: ['perimeter'], 24: ['perimeter'],
	25: ['perimeter'], 26: ['perimeter'],
};
const ROLLS_PER_DEPTH = 300;

function checkConnectionRooms(): string[] {
	const failures: string[] = [];
	const toNums = (v: unknown): number[] => Array.isArray(v) ? v.map(Number) : String(v).split(',').map(Number);
	const rows = MWL_TABLE_ROWS('connectionRoomChanceRows', 'depth');
	if (rows.length !== Object.keys(CONNECTION_ANCHORS).length) {
		failures.push(`connectionRoomChanceRows has ${rows.length} rows, expected ${Object.keys(CONNECTION_ANCHORS).length}`);
	}
	for (const row of rows) {
		const depth = Number(row.depth);
		const want = CONNECTION_ANCHORS[depth];
		const got = toNums(row.chances);
		if (!want || got.length !== want.length || !got.every((w, i) => w === want[i])) {
			failures.push(`depth ${depth}: chances ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
		}
	}
	SpdRandom.pushGenerator(0xc011ec7n);
	try {
		for (let depth = 1; depth <= 26; depth++) {
			const seen = new Set<string>();
			for (let i = 0; i < ROLLS_PER_DEPTH; i++) {
				seen.add(createConnectionRoom(depth, false).connectionKind ?? 'none');
			}
			const only = SINGLE_CLASS_DEPTHS[depth];
			if (only && (seen.size !== 1 || !seen.has(only))) {
				failures.push(`depth ${depth}: rolled ${[...seen].join(',')}, want only ${only}`);
			}
			for (const kind of FORBIDDEN_BY_DEPTH[depth] ?? []) {
				if (seen.has(kind)) failures.push(`depth ${depth}: rolled forbidden ${kind}`);
			}
		}
	} finally {
		SpdRandom.popGenerator();
	}
	return failures;
}

function main(): void {
	const roomFailures = checkConnectionRooms();
	if (roomFailures.length > 0) {
		for (const failure of roomFailures) console.error(`connectionRooms: ${failure}`);
		process.exit(1);
	}
	console.log(`connectionRooms: ${Object.keys(CONNECTION_ANCHORS).length + 26} checks passed`);
	const dumpArg = process.argv.indexOf('--java-dump');
	if (dumpArg < 0 || !process.argv[dumpArg + 1] || process.argv[dumpArg + 1]!.startsWith('--')) {
		console.error('usage: levelgenParity --java-dump <levelgen_java_dump.txt>');
		process.exit(2);
	}
	const java = parseJavaDump(readFileSync(process.argv[dumpArg + 1]!, 'utf8'));
	const writeArg = process.argv.indexOf('--write-ts');
	const writeTs = writeArg >= 0 && process.argv[writeArg + 1] && !process.argv[writeArg + 1]!.startsWith('--')
		? process.argv[writeArg + 1]!
		: null;
	const tsTraceArg = process.argv.indexOf('--write-ts-traces');
	const tsTraceDir = tsTraceArg >= 0 && process.argv[tsTraceArg + 1] && !process.argv[tsTraceArg + 1]!.startsWith('--')
		? process.argv[tsTraceArg + 1]!
		: null;
	const stackArg = process.argv.indexOf('--trace-stack-window');
	const stackWindowText = stackArg >= 0 && process.argv[stackArg + 1] && !process.argv[stackArg + 1]!.startsWith('--')
		? process.argv[stackArg + 1]!
		: null;
	let stackWindow: [number, number] | null = null;
	if (stackWindowText !== null) {
		const values = stackWindowText.split(':').map(Number);
		if (values.length !== 2 || values.some((value) => !Number.isInteger(value) || value < 0 || value > 10_000_000)) {
			console.error('usage: --trace-stack-window <first-draw>:<last-draw>');
			process.exit(2);
		}
		stackWindow = [values[0]!, values[1]!];
	}
	if (stackWindow !== null && tsTraceDir === null) {
		console.error('--trace-stack-window requires --write-ts-traces <dir>');
		process.exit(2);
	}
	const javaTraceArg = process.argv.indexOf('--java-traces');
	const javaTraceDir = javaTraceArg >= 0 && process.argv[javaTraceArg + 1] && !process.argv[javaTraceArg + 1]!.startsWith('--')
		? process.argv[javaTraceArg + 1]!
		: null;
	if (tsTraceDir) mkdirSync(tsTraceDir, { recursive: true });
	const tsOut: string[] = [];
	const seeds = [...new Set(java.map((b) => b.seed))];
	let matched = 0;
	// Depths 1-2 are excluded from the parity count by design: Java drops the
	// guidebook pages with an intentionally UNSEEDED generator (`pushGenerator()` with
	// no seed - "so meta progression doesn't affect levelgen"), and the heap then
	// shifts `paintGrass`'s seeded draws, so even Java-vs-Java is not reproducible
	// there (see `rooms/standard/entranceRoom.ts`). They still print for eyeballing.
	let stableMatched = 0;
	let stableTotal = 0;
	for (const seed of seeds) {
		resetPortedRun();
		// Run-init draws (deck pick, category seeds, ...) happen here, OUTSIDE the per-floor
		// trace window below - matching the harness, which arms its window after run setup.
		primeRunState(BigInt(seed));
		for (let depth = 1; depth <= 9; depth++) {
			const block = java.find((b) => b.seed === seed && b.depth === depth);
			if (!block) { console.log(`seed=${seed} depth=${depth}: NO JAVA BLOCK`); continue; }
			// The trace window mirrors the harness's own arming exactly: everything the
			// floor push/pop rides on, and nothing of the run-level setup before it.
			const traceLog: string[] = [];
			if (tsTraceDir) {
				traceStacks.length = 0;
				setTraceStackWindow(stackWindow);
				setTraceDrawLog(traceLog);
			}
			const floor = portedFloor(BigInt(seed), depth);
			if (tsTraceDir) {
				setTraceDrawLog(null);
				setTraceStackWindow(null);
				writeFileSync(join(tsTraceDir, `levelgen_trace_${seed}_${depth}.txt`), traceLog.join('\n') + '\n');
				if (stackWindow !== null) {
					writeFileSync(join(tsTraceDir, `levelgen_stacks_${seed}_${depth}.txt`), traceStacks.join('\n') + '\n');
				}
			}
			if (javaTraceDir) {
				const traceName = `levelgen_trace_${seed}_${depth}.txt`;
				if (depth < 3) {
					console.log(`seed=${seed} depth=${depth}: TRACE-SKIP (depths 1-2 carry Java's unseeded guidebook draws)`);
				} else if (!existsSync(join(javaTraceDir, traceName))) {
					console.log(`seed=${seed} depth=${depth}: TRACE-MISSING (no ${traceName}; regen with -Dlevelgen.trace=true)`);
				} else {
					const javaTrace = readFileSync(join(javaTraceDir, traceName), 'utf8').split('\n').filter((l) => l.trim() !== '');
					let firstDiff = -1;
					const common = Math.min(javaTrace.length, traceLog.length);
					for (let i = 0; i < common; i++) {
						if (javaTrace[i] !== traceLog[i]) { firstDiff = i; break; }
					}
					if (firstDiff < 0 && javaTrace.length !== traceLog.length) firstDiff = common;
					if (firstDiff < 0) {
						console.log(`seed=${seed} depth=${depth}: TRACE-IDENTICAL (${traceLog.length} draws)`);
					} else {
						console.log(`seed=${seed} depth=${depth}: TRACE-DIFF at draw ${firstDiff} (java ${javaTrace.length} draws, ts ${traceLog.length}) java=${javaTrace[firstDiff] ?? '∅'} ts=${traceLog[firstDiff] ?? '∅'}`);
					}
				}
			}
			if (writeTs) {
				tsOut.push(`seed=${seed} depth=${depth} rooms=${floor.rooms.length} feeling=${floor.feeling ?? 'NONE'} size=${floor.width}x${floor.height} attempts=${floor.attempts ?? '?'}`);
				tsOut.push(`  room rects: ${floor.rooms.map((r) => `${r.left},${r.top},${r.right},${r.bottom}`).sort().join(' ')}`);
				tsOut.push(`  room labels: ${floor.rooms.map((r) => r.label).sort().join(',')}`);
				for (let y = 0; y < floor.height; y++) {
					let row = '  ';
					for (let x = 0; x < floor.width; x++) {
						row += CHAR_BY_TERRAIN[floor.paint.map[x + y * floor.width]!] ?? '?';
					}
					tsOut.push(row.replace(/\s+$/, ''));
				}
				tsOut.push('');
			}
			const diffs: string[] = [];
			const feelingName = floor.feeling === null || floor.feeling === undefined
				? 'NONE'
				: (FEELING_NAMES[floor.feeling] ?? 'NONE');
			if (feelingName !== block.feeling || (depth === 1 ? block.feelingRoll !== -1 : false)) {
				diffs.push(`feeling ts=${feelingName} java=${block.feeling}/${block.feelingRoll}`);
			}
			if (floor.traps.length !== block.traps) {
				diffs.push(`traps ts=${floor.traps.length} java=${block.traps}`);
			}
			const rects = floor.rooms
				.map((r) => `${r.left},${r.top},${r.right},${r.bottom}`)
				.sort();
			if (rects.length !== block.rects.length || rects.some((r, i) => r !== block.rects[i])) {
				diffs.push(`rects ts=${rects.length} java=${block.rects.length}`);
			}
			const rows: string[] = [];
			for (let y = 0; y < floor.height; y++) {
				let row = '';
				for (let x = 0; x < floor.width; x++) {
					const t = floor.paint.map[x + y * floor.width]!;
					row += CHAR_BY_TERRAIN[t] ?? '?';
				}
				// The Java dump rtrims every row (`trimLineEndings`), so the
				// comparison trims too - trailing chasm is not a difference.
				rows.push(row.replace(/\s+$/, ''));
			}
			let cells = 0;
			const samples: string[] = [];
			for (let y = 0; y < Math.max(rows.length, block.map.length); y++) {
				const a = rows[y] ?? '';
				const b = block.map[y] ?? '';
				for (let x = 0; x < Math.max(a.length, b.length); x++) {
				// Either side rtrims trailing chasm, so a missing cell is chasm, not a diff.
				if ((a[x] ?? ' ') !== (b[x] ?? ' ')) {
					cells++;
					if (samples.length < 5) samples.push(`(${x},${y}) ts=${a[x] ?? '∅'}(${floor.paint.map[x + y * floor.width] ?? '∅'}) java=${b[x] ?? '∅'}`);
				}
			}
			}
			if (cells > 0) diffs.push(`map ${cells} cells differ, e.g. ${samples.join(' ')}`);
			if (rows.some((r) => r.includes('?'))) diffs.push('ts map contains unmapped (?) terrain ids');
			if (diffs.length === 0) {
				matched++;
				if (depth >= 3) stableMatched++;
				console.log(`seed=${seed} depth=${depth}: PARITY`);
			} else {
				console.log(`seed=${seed} depth=${depth}: ${depth < 3 ? 'UNSTABLE' : 'DIFF'} ${diffs.join(' | ')}`);
			}
			if (depth >= 3) stableTotal++;
		}
	}
	console.log(`levelgen parity: ${matched}/${java.length} blocks identical (${stableMatched}/${stableTotal} on depths 3+, the deterministic set)`);
	if (writeTs) {
		writeFileSync(writeTs, tsOut.join('\n') + '\n');
		console.log(`wrote ${writeTs}`);
	}
}

main();
