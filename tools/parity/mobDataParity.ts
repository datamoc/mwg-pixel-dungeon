/**
 * Mob data parity (BACKLOG B3 / coord T57): diffs the port's authored monster and loot tables (`monsters.mwl`,
 * `loot-rules.mwl`, read through `src/monsters.ts`) against what Java's own mob classes report, dumped by
 * `tools/parity/java/MobDataHarness.java`.
 *
 *   node mobDataParity.mjs --java <mobdata_java_out.txt> [--known tools/parity/mobdata-known.json] [--report <file>]
 *
 * Every Java mob is mapped to a port monster id by lower-cased class name (`Rat` -> `rat`, `GreatCrab` -> `greatCrab`);
 * a Java mob with no port monster is reported as `not-ported` (informational, not a failure). For the rest each field is
 * compared and every difference is a mismatch unless `mobdata-known.json` documents it (`"<Mob>.<field>": "<reason>"`,
 * the reason naming the coverage row). Exit code 1 on an undocumented mismatch OR a stale known entry that no longer
 * differs, so the allowlist cannot rot. Sampled damage/armor ranges are compared as the *observed* Java range against
 * the port's authored range (the sample is 3000 rolls per mob, enough to hit the extremes of every dice range used).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { DEPTH_SCALED_STATS, MONSTERS, MOB_LOOT } from '../../src/monsters';
import { wraithCombatStats } from '../../src/simulation/wraith';

interface JavaMob {
	mob: string; error?: string;
	hp: number; exp: number; maxLvl: number; attack: number; defense: number;
	dmg: [number, number]; dr: [number, number]; lootChance: number; loot: string; flying: boolean;
	properties: string[]; immunities: string[]; resistances: string[];
}
const arg = (name: string) => { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : undefined; };
const javaPath = arg('--java');
if (!javaPath) { console.error('usage: mobDataParity --java <file> [--known <json>] [--report <file>]'); process.exit(2); }
const knownPath = arg('--known');
const known: Record<string, string> = knownPath && existsSync(knownPath) ? JSON.parse(readFileSync(knownPath, 'utf8')) : {};
const javaMobs: JavaMob[] = readFileSync(javaPath, 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));

const kindByLower = new Map(Object.keys(MONSTERS).map((k) => [k.toLowerCase(), k]));
const mismatches: { key: string; detail: string }[] = [];
const notPorted: string[] = [];
const errors: string[] = [];
let compared = 0, fieldChecks = 0;

for (const j of javaMobs) {
	if (j.error) { errors.push(`${j.mob}: ${j.error}`); continue; }
	const kind = kindByLower.get(j.mob.toLowerCase());
	if (!kind) { notPorted.push(j.mob); continue; }
	//The harness scales every mob to depth 1 (Java's `adjustStats(1)`/`spawn(1)`), so the port's depth-scaled row is evaluated at depth 1 too.
	type Stats = { hp: number; accuracy: number; evasion: number; damage: [number, number]; armor: [number, number]; exp: number; maxLvl: number };
	const ts = { ...(MONSTERS as Record<string, Stats>)[kind]!, ...((DEPTH_SCALED_STATS as Record<string, ((depth: number) => Partial<Stats>) | undefined>)[kind]?.(1) ?? {}) };
	//Wraiths take their combat numbers from `wraithCombatStats(level)` at spawn (`spawnWraithAt`), not from the base row.
	if (kind === 'wraith' || kind === 'dustWraith') {
		const w = wraithCombatStats(1);
		ts.accuracy = w.accuracy; ts.evasion = w.evasion; ts.damage = [w.damageMin, w.damageMax];
	}
	compared++;
	const check = (field: string, javaValue: unknown, tsValue: unknown) => {
		fieldChecks++;
		if (JSON.stringify(javaValue) !== JSON.stringify(tsValue)) mismatches.push({ key: `${j.mob}.${field}`, detail: `java ${JSON.stringify(javaValue)} vs port ${JSON.stringify(tsValue)}` });
	};
	check('hp', j.hp, ts.hp);
	check('exp', j.exp, ts.exp);
	check('maxLvl', j.maxLvl, ts.maxLvl);
	check('attack', j.attack, ts.accuracy);
	check('defense', j.defense, ts.evasion);
	check('damage', j.dmg, ts.damage);
	check('armor', j.dr, ts.armor);
	const loot = (MOB_LOOT as Record<string, { chance: number; kind: string }[]>)[kind] ?? [];
	const tsChance = loot.length ? loot[0]!.chance : 0;
	check('lootChance', Math.round(j.lootChance * 1e6) / 1e6, Math.round(tsChance * 1e6) / 1e6);
}

const seen = new Set(mismatches.map((m) => m.key));
const undocumented = mismatches.filter((m) => !(m.key in known));
const stale = Object.keys(known).filter((k) => !seen.has(k));
const lines: string[] = [];
lines.push(`mob data parity: ${compared} Java mobs compared against the port (${fieldChecks} field checks), ${notPorted.length} Java mobs have no port monster, ${errors.length} could not be instantiated`);
lines.push(`mismatches: ${mismatches.length} (${mismatches.length - undocumented.length} documented in mobdata-known.json, ${undocumented.length} undocumented); stale known entries: ${stale.length}`);
for (const m of mismatches) lines.push(`${m.key in known ? 'KNOWN ' : 'DIFF  '} ${m.key}: ${m.detail}${m.key in known ? `  [${known[m.key]}]` : ''}`);
for (const k of stale) lines.push(`STALE  ${k}: documented but no longer differs - remove it from mobdata-known.json`);
lines.push(`not ported (Java mobs with no port monster): ${notPorted.join(', ') || 'none'}`);
if (errors.length) lines.push(`not instantiable headlessly: ${errors.join(' | ')}`);
const text = lines.join('\n');
console.log(text);
const report = arg('--report');
if (report) writeFileSync(report, text + '\n');
process.exit(undocumented.length || stale.length ? 1 : 0);
