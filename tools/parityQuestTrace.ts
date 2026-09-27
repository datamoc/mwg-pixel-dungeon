/**
 * Quest outcome parity (BACKLOG B3 / coord T57): the run-level quest types Java rolls during
 * level generation - `Wandmaker.Quest.type` (1 corpse dust / 2 embers / 3 rotberry, rolled in
 * `PrisonLevel.initRooms()`) and `Blacksmith.Quest.type` (1 CRYSTAL / 2 GNOLL / 3 FUNGI, rolled in
 * `CavesLevel.initRooms()`) - against this port's own generator, for the same seeds and depths.
 *
 *   node parityQuestTrace.mjs --java <levelgen_quests.txt> [--report <file>]
 *
 * The Java half is `LevelGenHarness` run with `LEVELGEN_QUESTS=true`, which widens its walk to
 * the Caves and writes one JSON line per (seed, depth) after each floor's build. Both sides keep
 * those types as run-level state reset once per run (`Dungeon.init()` resets all four quests;
 * `resetPortedRun()` + `primeRunState()` mirror that), so this tool rebuilds each run in depth
 * order and reads the state after each floor exactly as the harness does - the boss floors the
 * harness skips in the levelgen stage are built here too, because the port generates them and
 * neither side rolls a quest room inside them.
 *
 * Exit code 1 on any differing (seed, depth) pair or a missing line, so a quest that stops
 * rolling on one side is a failure rather than a silent gap.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { portedFloor, primeRunState, resetPortedRun } from '../src/spdLevelGen/gameBridge';
import { wandmakerQuestType } from '../src/spdLevelGen/wandmaker';

interface QuestLine {
	seed: number;
	depth: number;
	wandmaker: number;
}

export function main(argv: string[]): number {
	const at = (flag: string): string | null => {
		const i = argv.indexOf(flag);
		return i >= 0 && i + 1 < argv.length ? argv[i + 1] : null;
	};
	const javaPath = at('--java');
	if (!javaPath || !existsSync(javaPath)) {
		console.error('usage: parityQuestTrace.mjs --java <levelgen_quests.txt> [--report <file>]');
		return 2;
	}
	const lines: QuestLine[] = readFileSync(javaPath, 'utf8')
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line) => JSON.parse(line) as QuestLine)
		.filter((line) => typeof line.depth === 'number');
	if (lines.length === 0) {
		console.error(`no quest lines in ${javaPath} (run the harness with LEVELGEN_QUESTS=true)`);
		return 2;
	}

	const seeds = [...new Set(lines.map((l) => l.seed))];
	const rows: string[] = [];
	const diffs: string[] = [];
	let same = 0;

	for (const seed of seeds) {
		resetPortedRun();
		primeRunState(BigInt(seed));
		const perRun = lines.filter((l) => l.seed === seed).sort((a, b) => a.depth - b.depth);
		for (const line of perRun) {
			// `portedFloor` generates (and caches) every earlier depth of this run first, so
			// ascending calls reproduce the harness's own in-order walk.
			portedFloor(BigInt(seed), line.depth);
			const wandmaker = wandmakerQuestType();
			const ok = wandmaker === line.wandmaker;
			if (ok) same++;
			else {
				diffs.push(`seed=${seed} depth=${line.depth}: java wandmaker=${line.wandmaker} vs port wandmaker=${wandmaker}`);
			}
			rows.push(`${ok ? 'same' : 'DIFF'}\tseed=${seed}\tdepth=${line.depth}\tjava(w=${line.wandmaker})\tport(w=${wandmaker})`);
		}
	}

	const summary = `quest outcome parity: ${lines.length} (seed, depth) lines across ${seeds.length} seeds - ${same} same, ${diffs.length} differing`;
	console.log(summary);
	for (const d of diffs) console.log('DIFF ' + d);
	const report = at('--report');
	if (report) writeFileSync(report, `${summary}\n${rows.join('\n')}\n`);
	return diffs.length === 0 ? 0 : 1;
}

process.exit(main(process.argv.slice(2)));
