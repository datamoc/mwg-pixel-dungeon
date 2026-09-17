/**
 * Section 9 triage probe: differential level-gen parity for depths 1-9.
 *
 * Runs this port's own generator (`portedFloor`) over the exact seeds the Java
 * `LevelGenHarness` dumps (see its javadoc for the mirrored RNG setup) and diffs room
 * rects, feelings and painted maps block by block. This is a probe, not a gate: it
 * exits 0 with a report even when blocks differ, so a first run can record the gap
 * shape before anything is fixed. Promoting any subset to a hard gate is a later step.
 *
 * Run with `npm run parity:levelgen -- --java-dump <path>` (defaults to the harness
 * task's output next to the Java checkout when `--spd-root` points at it). Regenerate
 * the Java side with `:desktop:runHarness` in the SPD checkout first.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { portedFloor, resetPortedRun } from '../src/spdLevelGen/gameBridge';

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
		const lines = raw.split('\n');
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
	const tsOut: string[] = [];
	const seeds = [...new Set(java.map((b) => b.seed))];
	let matched = 0;
	for (const seed of seeds) {
		resetPortedRun();
		for (let depth = 1; depth <= 9; depth++) {
			const block = java.find((b) => b.seed === seed && b.depth === depth);
			if (!block) { console.log(`seed=${seed} depth=${depth}: NO JAVA BLOCK`); continue; }
			const floor = portedFloor(BigInt(seed), depth);
			if (writeTs) {
				tsOut.push(`seed=${seed} depth=${depth} rooms=${floor.rooms.length} feeling=${floor.feeling ?? 'NONE'} size=${floor.width}x${floor.height}`);
				tsOut.push(`  room rects: ${floor.rooms.map((r) => `${r.left},${r.top},${r.right},${r.bottom}`).sort().join(' ')}`);
				for (let y = 0; y < floor.height; y++) {
					let row = '  ';
					for (let x = 0; x < floor.width; x++) {
						row += CHAR_BY_TERRAIN[floor.paint.map[x + y * floor.width]!] ?? '?';
					}
					tsOut.push(row);
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
				rows.push(row);
			}
			let cells = 0;
			const samples: string[] = [];
			for (let y = 0; y < Math.max(rows.length, block.map.length); y++) {
				const a = rows[y] ?? '';
				const b = block.map[y] ?? '';
				for (let x = 0; x < Math.max(a.length, b.length); x++) {
					if ((a[x] ?? '') !== (b[x] ?? '')) {
						cells++;
						if (samples.length < 5) samples.push(`(${x},${y}) ts=${a[x] ?? '∅'}(${floor.paint.map[x + y * floor.width] ?? '∅'}) java=${b[x] ?? '∅'}`);
					}
				}
			}
			if (cells > 0) diffs.push(`map ${cells} cells differ, e.g. ${samples.join(' ')}`);
			if (rows.some((r) => r.includes('?'))) diffs.push('ts map contains unmapped (?) terrain ids');
			if (diffs.length === 0) {
				matched++;
				console.log(`seed=${seed} depth=${depth}: PARITY`);
			} else {
				console.log(`seed=${seed} depth=${depth}: DIFF ${diffs.join(' | ')}`);
			}
		}
	}
	console.log(`levelgen parity: ${matched}/${java.length} blocks identical`);
	if (writeTs) {
		writeFileSync(writeTs, tsOut.join('\n') + '\n');
		console.log(`wrote ${writeTs}`);
	}
}

main();
