/**
 * Blacksmith quest parity (BACKLOG B3, Blacksmith quest domain): diffs what the real
 * `Blacksmith.Quest.spawn()` reward sequence rolls - dumped per (seed, depth) by
 * `tools/parity/java/BlacksmithRewardHarness.java`, which calls Java's own
 * `Blacksmith.Quest.generateRewards(true)` - against this port's own composition:
 * the spawn gate (`Random.Int(15-depth)==0`, depths 12-14), the quest type
 * (`Random.IntRange(1, 2)`, CRYSTAL/GNOLL) plus `blacksmithSmithRewards()` in
 * `src/items/generator.ts`.
 *
 *   node parityBlacksmithTrace.mjs --java <blacksmith_java_out.txt> [--known tools/parity/blacksmith-known.json] [--report <file>]
 *
 * Each side runs the same draws on the same seed: `Generator.fullReset()` (deck state),
 * the spawn gate, the type roll, the floor-set-3 tier rolls (`{0, 0, 20, 40, 40}`),
 * the defaults-based tier class draws, the shared `itemLevelRoll` thresholds, the
 * always-rolled enchant/glyph picks and the 0.3 keep test. Stream-position parity with
 * mid-run creation is explicitly out of scope (the port generates the rewards lazily on
 * first open while Java rolls at spawn inside `CavesLevel.initRooms`); what is compared
 * is the decision logic draw-for-draw, the same shape as the loot stage's value
 * comparison. The room placement is not walked on either side: its draws depend on
 * level geometry the port places differently.
 *
 * Armor tier needs no separate port-side derivation: each armor tier has exactly one
 * class on both sides (Mail/Scale/Plate for the tiers that can roll), so matching
 * armor classes imply matching armor tier rolls.
 *
 * Exit code 1 on any undocumented mismatch, any stale known entry or any Java-side error.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { SpdRandom } from '../src/spdRng';
import { Cat, blacksmithSmithRewards, generatorFullReset } from '../src/items/generator';

interface JavaCase {
	seed: number;
	depth: number;
	spawned: boolean;
	type?: number;
	w1tier?: number;
	w1cls?: string;
	w2tier?: number;
	w2cls?: string;
	mistier?: number;
	miscls?: string;
	armortier?: number;
	armorcls?: string;
	itemLevel?: number;
	keptEnchant?: boolean;
	keptGlyph?: boolean;
	error?: string;
}

function readKnown(path: string | null): Record<string, string> {
	if (!path || !existsSync(path)) return {};
	return JSON.parse(readFileSync(path, 'utf8')) as Record<string, string>;
}

const tierOfCat = (cat: Cat, base: Cat): number => cat - base + 1;

export function main(argv: string[]): number {
	const at = (flag: string): string | null => {
		const i = argv.indexOf(flag);
		return i >= 0 && i + 1 < argv.length ? argv[i + 1] : null;
	};
	const javaPath = at('--java');
	if (!javaPath) {
		console.error('usage: parityBlacksmithTrace.mjs --java <blacksmith_java_out.txt> [--known <file>] [--report <file>]');
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
			const spawned = SpdRandom.int(15 - c.depth) === 0;
			check(key, 'spawned', c.spawned, spawned, `${key} spawn gate`);
			if (!c.spawned && !spawned) continue;
			if (!c.spawned || !spawned) continue;
			//`Random.IntRange(1, 2)`: min + Int(max-min+1).
			const type = SpdRandom.int(2) + 1;
			check(key, 'type', c.type, type, `${key} quest type`);
			const rewards = blacksmithSmithRewards();
			const [w1, w2, mis, armor] = [rewards[0]!, rewards[1]!, rewards[2]!, rewards[3]!];
			check(key, 'w1tier', c.w1tier, tierOfCat(w1.cat, Cat.WEP_T1), `${key} weapon 1 tier`);
			check(key, 'w1cls', c.w1cls, w1.cls, `${key} weapon 1 class`);
			check(key, 'w2tier', c.w2tier, tierOfCat(w2.cat, Cat.WEP_T1), `${key} weapon 2 tier`);
			check(key, 'w2cls', c.w2cls, w2.cls, `${key} weapon 2 class`);
			check(key, 'w2diff', true, w2.cls !== w1.cls, `${key} weapons differ`);
			check(key, 'mistier', c.mistier, tierOfCat(mis.cat, Cat.MIS_T1), `${key} missile tier`);
			check(key, 'miscls', c.miscls, mis.cls, `${key} missile class`);
			check(key, 'armorcls', c.armorcls, armor.cls, `${key} armor class`);
			check(key, 'w1level', c.itemLevel, w1.level, `${key} weapon 1 level`);
			check(key, 'w2level', c.itemLevel, w2.level, `${key} weapon 2 level`);
			check(key, 'mislevel', c.itemLevel, mis.level, `${key} missile level`);
			check(key, 'armorlevel', c.itemLevel, armor.level, `${key} armor level`);
			const kept = w1.hasGoodEnchant;
			check(key, 'kept', c.keptEnchant, kept, `${key} enchant keep`);
			check(key, 'keptGlyph', c.keptGlyph, kept, `${key} glyph keep`);
		} finally {
			SpdRandom.popGenerator();
		}
	}

	const stale = Object.keys(known).filter((k) => !knownUsed.has(k));
	const summary = `blacksmith reward parity: ${cases.length} cases - ${match} fields match, ${mismatch.length} undocumented mismatches, ${javaErrors.length} java errors, ${stale.length} stale known entries`;
	console.log(summary);
	for (const b of mismatch) console.log('BEYOND ' + b);
	for (const e of javaErrors) console.log('JAVA-ERROR ' + e);
	for (const s of stale) console.log('STALE-KNOWN ' + s);
	if (reportPath) writeFileSync(reportPath, `${summary}\n${rows.join('\n')}\n`);
	return mismatch.length === 0 && javaErrors.length === 0 && stale.length === 0 ? 0 : 1;
}

process.exit(main(process.argv.slice(2)));
