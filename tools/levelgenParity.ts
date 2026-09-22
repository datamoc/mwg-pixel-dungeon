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
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { portedFloor, resetPortedRun } from '../src/spdLevelGen/gameBridge';
import { setTraceDrawLog, setTraceStackWindow, traceStacks } from '../src/spdRng';

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

function main(): void {
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
