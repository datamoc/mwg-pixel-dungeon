/**
 * Loot chance parity (BACKLOG B3 / coord T57): diffs what Java's own `Mob.lootChance()` returns -
 * the value `Mob.rollToDropLoot()` compares its `Random.Float()` against, dumped by
 * `tools/parity/java/LootHarness.java` - against the port's own composition of the same number:
 * the authored `monsterLoot` chance, its `limitedDropDecay` factor, the generation divisor and
 * the drop bonus, all through the one shared `mobLootChance()` the scene's kill() funnel runs.
 *
 *   node parityLootTrace.mjs --java <loot_java_out.txt> [--known tools/parity/loot-known.json] [--report <file>]
 *
 * One JSON line per case on each side carries the same inputs (`mob`, `counter`, `count`,
 * `generation`) plus the value as raw float32 `bits`. A kind with no `monsterLoot` row composes
 * to 0, which is correct exactly when Java's own value is 0 (a mob that drops nothing, `Rat`),
 * so a missing row for a kind Java *does* roll for fails through the value comparison rather
 * than through a separate rule.
 *
 * Java computes in float32, the port in float64, so the comparison is two-tier and both tiers
 * are reported:
 *   - `exact`: identical float32 bits;
 *   - `within`: relative error <= 1e-6, i.e. only the last-ulp difference this kit's README
 *     calls out as expected between the two precisions;
 *   - `beyond`: a real formula/table difference (a wrong decay mode or value, a missing
 *     generation divisor, a wrong base) - a failure unless `loot-known.json` documents it under
 *     `<Mob>.lootChance`, and a documented entry that no longer differs fails as stale, so the
 *     allowlist cannot rot by omission either.
 * Exit code 1 on any undocumented `beyond` case, any stale known entry or any Java-side error.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { LIMITED_DROP_DECAY, MOB_LOOT } from '../src/monsters';
import { mobLootChance } from '../src/simulation/mobLoot';

interface JavaCase {
	mob: string;
	counter: string;
	count: number;
	generation: number;
	bits?: number;
	value?: number;
	error?: string;
}

const REL_TOL = 1e-6;

/** `Rat` -> `rat`, `GreatCrab` -> `greatCrab`, `DM200` -> `dm200`: lowercase the leading
 *  uppercase run, then keep the rest of the port's lowerCamel id untouched. */
function portId(javaMob: string): string {
	return javaMob.replace(/^[A-Z]+/, (run) => run.toLowerCase());
}

function float32Bits(x: number): number {
	const buf = new ArrayBuffer(4);
	new Float32Array(buf)[0] = x;
	return new Uint32Array(buf)[0];
}

function bitsToFloat32(bits: number): number {
	const buf = new ArrayBuffer(4);
	new Uint32Array(buf)[0] = bits;
	return new Float32Array(buf)[0];
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
		console.error('usage: parityLootTrace.mjs --java <loot_java_out.txt> [--known <file>] [--report <file>]');
		return 2;
	}
	const known = readKnown(at('--known'));
	const reportPath = at('--report');

	const cases: JavaCase[] = readFileSync(javaPath, 'utf8')
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line) => JSON.parse(line) as JavaCase)
		.filter((line) => line.mob !== undefined);

	const rows: string[] = [];
	const knownUsed = new Set<string>();
	let exact = 0;
	let within = 0;
	let knownHits = 0;
	let noRow = 0;
	const beyond: string[] = [];
	const javaErrors: string[] = [];

	for (const c of cases) {
		if (c.error) {
			javaErrors.push(`${c.mob}[${c.counter}=${c.count}/${c.generation}] Java threw: ${c.error}`);
			continue;
		}
		if (c.bits === undefined) {
			javaErrors.push(`${c.mob}[${c.counter}=${c.count}/${c.generation}] Java reported no value`);
			continue;
		}
		const id = portId(c.mob);
		const entries = MOB_LOOT[id];
		const baseChance = entries && entries.length > 0 ? entries[0]!.chance : 0;
		if (!entries || entries.length === 0) noRow++;
		const decay = (LIMITED_DROP_DECAY as Record<string, ((n: number) => number) | undefined>)[id];
		//`Swarm.lootChance()` divides by `generation + 1`; every other kind is untouched.
		const generationDivisor = id === 'swarm' ? c.generation + 1 : 1;
		const chance = mobLootChance({
			baseChance,
			decay,
			decayCount: c.count,
			generationDivisor,
			//No ring, no bounty tracker and no shard on either side of this matrix.
			dropBonus: 1,
		});
		const ourBits = float32Bits(chance);
		const javaValue = bitsToFloat32(c.bits);
		const rel = javaValue === 0
			? (chance === 0 ? 0 : Infinity)
			: Math.abs(chance - javaValue) / Math.abs(javaValue);
		let tier = ourBits === c.bits ? 'exact' : rel <= REL_TOL ? 'within' : 'beyond';
		const key = `${c.mob}.lootChance`;
		if (tier === 'beyond' && key in known) {
			tier = 'known';
			knownHits++;
			knownUsed.add(key);
		}
		if (tier === 'exact') exact++;
		else if (tier === 'within') within++;
		else if (tier === 'beyond') {
			beyond.push(`${c.mob}[${c.counter}=${c.count},gen=${c.generation}]: java ${javaValue} (${c.bits}) vs port ${chance} (${ourBits}), rel ${rel.toExponential(2)}`);
		}
		rows.push(`${tier}\t${c.mob}[${c.counter}=${c.count},gen=${c.generation}]\tjava=${javaValue}\tport=${chance}`);
	}

	const stale = Object.keys(known).filter((k) => !knownUsed.has(k));
	const summary = `loot chance parity: ${cases.length} cases - ${exact} exact, ${within} within ${REL_TOL} (float32/float64 rounding), ${knownHits} documented, ${beyond.length} undocumented, ${javaErrors.length} java errors, ${noRow} with no monsterLoot row (composed as 0)`;
	console.log(summary);
	for (const b of beyond) console.log('BEYOND ' + b);
	for (const e of javaErrors) console.log('JAVA-ERROR ' + e);
	for (const s of stale) console.log('STALE-KNOWN ' + s);
	if (reportPath) writeFileSync(reportPath, `${summary}\n${rows.join('\n')}\n`);
	return beyond.length === 0 && javaErrors.length === 0 && stale.length === 0 ? 0 : 1;
}

process.exit(main(process.argv.slice(2)));
