/**
 * Imp quest parity (BACKLOG B3, Imp quest domain): diffs what the real
 * `Imp.Quest.spawn()` sequence rolls - dumped per seed by
 * `tools/parity/java/ImpRewardHarness.java` - against this port's own composition:
 * fresh decks, the `Random.Int(20-depth)==0` gates over depths 17-19 (Int(1) at 19
 * always spawns, so every seed yields a row), the depth-switched `alternative`
 * flag (17 monks / 19 golems / `Int(2)==0` at 18) plus `impQuestReward()` in
 * `src/items/generator.ts`.
 *
 *   node parityImpTrace.mjs --java <imp_java_out.txt> [--known tools/parity/impReward-known.json] [--report <file>]
 *
 * Each side runs the same draws on the same seed: `Generator.fullReset()` (deck
 * state), the spawn gates, the alternative roll, then the reward loop (`RING`
 * class pick on the deck substream, `Int(3)` [+ `Int(5)`] level, `Float() < 0.3`
 * curse test, draw-free `upgrade(2)`, reroll while cursed). Stream-position parity
 * with mid-run creation is explicitly out of scope (the port places the Imp shop
 * at scene level while Java rolls inside `spawn()`); what is compared is the
 * decision logic draw-for-draw, the same shape as the ghost stage.
 *
 * A Java-side room placement is deliberately not walked: its draws depend on level
 * geometry the port places differently, so rooms can never agree draw-for-draw.
 *
 * Exit code 1 on any undocumented mismatch, any stale known entry or any Java-side error.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { SpdRandom } from '../src/spdRng';
import { generatorFullReset, impQuestReward } from '../src/items/generator';

interface JavaCase {
	seed: number;
	spawnDepth?: number;
	alternative?: boolean;
	ringCls?: string;
	ringLevel?: number;
	error?: string;
}

function readKnown(path: string | null): Record<string, string> {
	if (!path || !existsSync(path)) return {};
	return JSON.parse(readFileSync(path, 'utf8')) as Record<string, string>;
}

export function main(argv: string[]): number {
	const at = (flag: string): string | null => {
		const i = argv.indexOf(flag);
		return i >= 0 && i + 1 < argv.length ? argv[i + 1] : null;
	};
	const javaPath = at('--java');
	if (!javaPath) {
		console.error('usage: parityImpTrace.mjs --java <imp_java_out.txt> [--known <file>] [--report <file>]');
		return 2;
	}
	const known = readKnown(at('--known'));
	const reportPath = at('--report');

	const cases: JavaCase[] = readFileSync(javaPath, 'utf8')
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line) => JSON.parse(line) as JavaCase)
		.filter((line) => line.seed !== undefined);

	const rows: string[] = [];
	const knownUsed = new Set<string>();
	const mismatch: string[] = [];
	const javaErrors: string[] = [];
	let match = 0;

	const check = (key: string, field: string, javaValue: unknown, portValue: unknown, note: string): void => {
		const same = javaValue === portValue;
		const k = `${key}.${field}`;
		if (!same && k in known) {
			knownUsed.add(k);
			rows.push(`known\t${note}\tjava=${javaValue}\tport=${portValue}`);
			return;
		}
		if (!same) mismatch.push(`${note}: java ${javaValue} vs port ${portValue}`);
		rows.push(`${same ? 'match' : 'BEYOND'}\t${note}\tjava=${javaValue}\tport=${portValue}`);
		if (same) match++;
	};

	for (const c of cases) {
		const key = `${c.seed}`;
		if (c.error) {
			javaErrors.push(`${key} Java threw: ${c.error}`);
			continue;
		}
		//Same draws on the same seed as the harness: fresh decks, then the gates.
		SpdRandom.pushGenerator(BigInt(c.seed));
		try {
			generatorFullReset();
			let spawnDepth = 0;
			for (const depth of [17, 18, 19]) {
				if (SpdRandom.int(20 - depth) === 0) {
					spawnDepth = depth;
					break;
				}
			}
			check(key, 'spawnDepth', c.spawnDepth, spawnDepth, `${key} spawn depth`);
			const alternative = spawnDepth === 17 || (spawnDepth === 18 && SpdRandom.int(2) === 0);
			check(key, 'alternative', c.alternative, alternative, `${key} alternative monks/golems`);
			const reward = impQuestReward();
			check(key, 'ringCls', c.ringCls, reward.cls, `${key} reward ring class`);
			check(key, 'ringLevel', c.ringLevel, reward.level, `${key} reward ring level`);
		} finally {
			SpdRandom.popGenerator();
		}
	}

	const stale = Object.keys(known).filter((k) => !knownUsed.has(k));
	const summary = `imp reward parity: ${cases.length} cases - ${match} fields match, ${mismatch.length} undocumented mismatches, ${javaErrors.length} java errors, ${stale.length} stale known entries`;
	console.log(summary);
	for (const b of mismatch) console.log('BEYOND ' + b);
	for (const e of javaErrors) console.log('JAVA-ERROR ' + e);
	for (const s of stale) console.log('STALE-KNOWN ' + s);
	if (reportPath) writeFileSync(reportPath, `${summary}\n${rows.join('\n')}\n`);
	return mismatch.length === 0 && javaErrors.length === 0 && stale.length === 0 ? 0 : 1;
}

process.exit(main(process.argv.slice(2)));
