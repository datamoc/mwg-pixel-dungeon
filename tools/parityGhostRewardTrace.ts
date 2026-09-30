/**
 * Ghost quest parity (BACKLOG B3, Ghost quest domain): diffs what the real
 * `Ghost.Quest.spawn()` reward sequence rolls - dumped per (seed, depth) by
 * `tools/parity/java/GhostRewardHarness.java` - against this port's own composition:
 * the `maybeSpawnGhost` gate (`Random.Int(5-depth)==0`, depths 2-4, `type = depth-1`)
 * plus `ghostQuestReward()` in `src/items/generator.ts`.
 *
 *   node parityGhostRewardTrace.mjs --java <ghost_java_out.txt> [--known tools/parity/ghostreward-known.json] [--report <file>]
 *
 * Each side runs the same draws on the same seed: `Generator.fullReset()` (deck state),
 * the spawn gate, tier chances (`{0, 0, 10, 6, 3, 1}`), the tier deck draw, the shared
 * `itemLevelRoll` thresholds, the always-rolled enchant/glyph picks and the 0.2 keep test.
 * Stream-position parity with mid-run creation is explicitly out of scope (the port spawns
 * the Ghost at scene level while Java rolls inside `createMobs`); what is compared is the
 * decision logic draw-for-draw, the same shape as the loot stage's value comparison.
 *
 * A Java-side room/position loop is deliberately not walked: its draws depend on level
 * geometry the port places differently (`standableCellIn` fallback chain), so positions
 * can never agree draw-for-draw.
 *
 * Exit code 1 on any undocumented mismatch, any stale known entry or any Java-side error.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { SpdRandom } from '../src/spdRng';
import { generatorFullReset, ghostQuestReward } from '../src/items/generator';

interface JavaCase {
	seed: number;
	depth: number;
	spawned: boolean;
	type?: number;
	armorTier?: number;
	armorCls?: string;
	wepTier?: number;
	weaponCls?: string;
	itemLevel?: number;
	itemLevelBits?: number;
	kept?: boolean;
	enchantCls?: string;
	glyphCls?: string;
	enchantBits?: number;
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
		console.error('usage: parityGhostRewardTrace.mjs --java <ghost_java_out.txt> [--known <file>] [--report <file>]');
		return 2;
	}
	const known = readKnown(at('--known'));
	const reportPath = at('--report');

	const cases: JavaCase[] = readFileSync(javaPath, 'utf8')
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line) => JSON.parse(line) as JavaCase)
		.filter((line) => line.seed !== undefined && line.depth !== undefined);

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
		const key = `${c.seed}:${c.depth}`;
		if (c.error) {
			javaErrors.push(`${key} Java threw: ${c.error}`);
			continue;
		}
		//Same draws on the same seed as the harness: fresh decks, then the gate.
		SpdRandom.pushGenerator(BigInt(c.seed));
		try {
			generatorFullReset();
			const spawned = SpdRandom.int(5 - c.depth) === 0;
			check(key, 'spawned', c.spawned, spawned, `${key} spawn gate`);
			if (!c.spawned && !spawned) continue;
			if (!c.spawned || !spawned) continue;
			check(key, 'type', c.type, c.depth - 1, `${key} quest type`);
			const reward = ghostQuestReward();
			check(key, 'armorCls', c.armorCls, reward.armor.cls, `${key} armor class`);
			check(key, 'weaponCls', c.weaponCls, reward.weapon.cls, `${key} weapon class`);
			check(key, 'itemLevel', c.itemLevel, reward.weapon.level, `${key} shared item level`);
			check(key, 'armorLevel', c.itemLevel, reward.armor.level, `${key} armor item level`);
			check(key, 'kept', c.kept, reward.weapon.hasGoodEnchant && reward.armor.hasGoodEnchant, `${key} enchant keep`);
		} finally {
			SpdRandom.popGenerator();
		}
	}

	const stale = Object.keys(known).filter((k) => !knownUsed.has(k));
	const summary = `ghost reward parity: ${cases.length} cases - ${match} fields match, ${mismatch.length} undocumented mismatches, ${javaErrors.length} java errors, ${stale.length} stale known entries`;
	console.log(summary);
	for (const b of mismatch) console.log('BEYOND ' + b);
	for (const e of javaErrors) console.log('JAVA-ERROR ' + e);
	for (const s of stale) console.log('STALE-KNOWN ' + s);
	if (reportPath) writeFileSync(reportPath, `${summary}\n${rows.join('\n')}\n`);
	return mismatch.length === 0 && javaErrors.length === 0 && stale.length === 0 ? 0 : 1;
}

process.exit(main(process.argv.slice(2)));
