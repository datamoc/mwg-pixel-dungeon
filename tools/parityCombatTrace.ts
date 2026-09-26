/**
 * T55 (BACKLOG B1) slice 1: deterministic scripted combat-trace emitter over the pure
 * `resolveAttack` seam (`src/simulation/attackResolution.ts`, the hit/damage half of
 * `Char.attack()` extracted under B7), driven by a seeded `SpdJavaRandom`
 * (`src/spdRng.ts`'s faithful `java.util.Random` port) through a `SimulationRandom`
 * adapter that mirrors `Random.java`'s own formulas (tag `v3.3.8`: `Float(max)` is one
 * `nextFloat()*max`; `NormalIntRange` is two floats averaged over the inclusive range;
 * `IntRange`/`Int` are `nextInt(bound)` offsets; `chance` is `nextFloat() < p`).
 *
 * This is the TypeScript half of B1's "fixed seeds and identical action traces": every raw
 * RNG draw is captured with `spdRng`'s trace facility (the same `bits:value` line shape
 * Java's `TracingRandom` writes and `tools/levelgenParity.ts` diffs), so a trace file is a
 * canonical record of both the *outcomes* and the exact *draw sequence* that produced them.
 *
 * Fidelity caveat, stated not hidden: the draws are bit-exact against Java, but the
 * arithmetic around them runs in float64 while Java computes in float32, so a razor-edge
 * `acuRoll >= defRoll` comparison could flip in the last ulp on the real Java build. That
 * is exactly the class of difference this harness exists to surface once the Java-side
 * combat driver (still open: `Char.attack()` needs `Dungeon.level.heroFOV`, sprites and
 * `Sample`/`Messages`, so it is a headless-boot task of its own, not a flag on the
 * levelgen harness) can emit the same protocol.
 *
 * Slice 2 adds script 2 (`--script 2`): the java-natural bout mirroring the Java
 * `CombatHarness` round list (unarmed L1 Warrior vs Rat, plain/magic/surprise), seeded
 * through the same MX3 scramble `pushGenerator(seed)` applies, so same-seed TS and Java
 * traces start from the identical generator state. `compare` diffs them.
 *
 * Modes (`npm run parity:combat` runs `check`):
 * - `emit --seed <n> --script <1|2|3|4> --out <file>`: run one script, write the JSONL trace.
 * - `check`: determinism gates for both scripts (same seed twice is byte-identical) plus
 *   the comparator's positive control (a trace compares clean against itself) and negative
 *   control (one mutated round is reported at exactly that round). No Java checkout needed.
 * - `compare --a <file> --b <file>`: diff two traces (TS-vs-TS or TS-vs-Java); reports the
 *   first divergent round, exit 1 on any difference.
 */
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveAttack } from '../src/simulation/attackResolution';
import type { Combatant } from '../src/simulation/combatState';
import type { SimulationRandom } from '../src/simulation/random';
import { SpdJavaRandom, setTraceDrawLog, spdScramble } from '../src/spdRng';

/** Script 1: branch-coverage bout (TS-only shapes: buffs, Preparation, champions). */
const SCRIPT_VERSION_1 = 1;
/** Script 2: java-natural bout mirroring the Java `CombatHarness` round list exactly, with
 * Java's own base stats (unarmed L1 Warrior acc 10 / eva 5, Rat acc 8 / eva 2, unarmed
 * damage `NormalIntRange(1, max(STR-8, 1))` = [1, 2] at STR 10, Rat `NormalIntRange(1, 4)`).
 * Known structural draw deltas vs Java, documented not hidden: the Java side burns one
 * extra clover-check float per unarmed damage roll and a `NormalIntRange(0, 0)` armor pair
 * on the Rat that this seam skips (same outcome distributions, shifted positions). */
const SCRIPT_VERSION_2 = 2;
/** Script 4: script 2's bout against a Crab instead of the Rat - the first bout
 * with real defender armor (Crab drRoll is NormalIntRange(0, 4) where the Rat's is
 * NormalIntRange(0, 1)), covering the armor-before-damage order slice 2 established
 * under non-degenerate armor, plus Crab damage NormalIntRange(1, 7) and acc/eva 12/5.
 * Mirrored by the Java CombatHarness (same round list, Crab woken to HUNTING). */
const SCRIPT_VERSION_4 = 4;
/** Script 3: script 2's bout plus Bless/Hex/Daze rounds, mirrored by the Java
 * `CombatHarness` (real `Buff.append` on both chars, durations frozen, reset each round).
 * Buff rounds are the least-verified combat path, hence their own version. */
const SCRIPT_VERSION_3 = 3;

const hero: Combatant = {
	id: 'hero-1', x: 1, y: 1, hp: 20, maxHp: 20,
	accuracy: 12, evasion: 6, damage: [2, 8], armor: [1, 3],
	buffs: {}, isHero: true,
};
const rat: Combatant = {
	id: 'rat-1', x: 2, y: 1, hp: 10, maxHp: 10,
	accuracy: 6, evasion: 5, damage: [1, 3], armor: [0, 1],
	buffs: {}, isHero: false,
};

interface ScriptRound {
	attacker: 'hero' | 'rat' | 'crab';
	defender: 'hero' | 'rat' | 'crab';
	magic?: boolean;
	surprise?: boolean;
	attackerPatch?: Partial<Combatant>;
	defenderPatch?: Partial<Combatant>;
}

/** Fixed bout exercising every draw-shape branch: plain, buffs, surprise (no hit draws),
 * magic (doubled acc), Preparation best-of-3, excess/deficit STR, champions, maladictions. */
const SCRIPT: ScriptRound[] = [
	{},
	{ attacker: 'rat' },
	{ attackerPatch: { buffs: { bless: 1 } } },
	{ defenderPatch: { buffs: { hex: 1 } } },
	{ attackerPatch: { buffs: { daze: 1 } }, defenderPatch: { buffs: { bless: 1 } } },
	{ surprise: true },
	{ magic: true },
	{ attackerPatch: { prepLevel: 4 } },
	{ attackerPatch: { str: 14, strReq: 10 } },
	{ attackerPatch: { str: 8, strReq: 12 } },
	{ attackerPatch: { buffs: { fury: 1 } }, defenderPatch: { buffs: { vulnerable: 1 } } },
	{ attackerPatch: { buffs: { weakness: 1 }, champion: 'blazing' } },
	{ defenderPatch: { champion: 'giant' } },
	{ defenderPatch: { champion: 'growing', championPower: 1.25 } },
	{ attackerPatch: { buffs: { berserk: 1 } }, defenderPatch: { barkskinLevel: 3 } },
	{ attacker: 'rat', attackerPatch: { champion: 'blessed' } },
	{ defenderPatch: { buffs: { aggression: 1 }, boss: true, kind: 'goo' } },
	{ attackerPatch: { damage: [4, 4], armor: [2, 2] }, defenderPatch: { damage: [2, 2], armor: [2, 2] } },
	{ attackerPatch: { accuracy: 1 }, defenderPatch: { evasion: 30 } },
	{ attackerPatch: { accuracy: 30 }, defenderPatch: { evasion: 1 } },
];

const heroNatural: Combatant = {
	id: 'hero-1', x: 1, y: 1, hp: 20, maxHp: 20,
	accuracy: 10, evasion: 5, damage: [1, 2], armor: [0, 0],
	buffs: {}, isHero: true,
};
const ratNatural: Combatant = {
	id: 'rat-1', x: 2, y: 1, hp: 8, maxHp: 8,
	accuracy: 8, evasion: 2, damage: [1, 4], armor: [0, 1],
	buffs: {}, isHero: false,
};
const crabNatural: Combatant = {
	id: 'crab-1', x: 2, y: 1, hp: 15, maxHp: 15,
	accuracy: 12, evasion: 5, damage: [1, 7], armor: [0, 4],
	buffs: {}, isHero: false,
};

/** The Java `CombatHarness` round list, in order: plain exchanges, one magic (accMulti 2),
 * one surprise (no hit draws), plain exchanges. */
const SCRIPT_V2: ScriptRound[] = [
	{},
	{ attacker: 'rat' },
	{},
	{ attacker: 'rat' },
	{ magic: true },
	{ attacker: 'rat' },
	{ surprise: true },
	{ attacker: 'rat' },
	{},
	{ attacker: 'rat' },
];

/** Buff bout: plain exchanges plus Bless (attacker acc x1.25), Hex (defender eva x0.8)
 * and Daze (attacker acc x0.5) rounds, combined on round 6, magic and surprise kept.
 * Bases are the java-natural fixtures; buffs ride the same patch mechanism as script 1. */
const SCRIPT_V3: ScriptRound[] = [
	{},
	{ attacker: 'rat' },
	{ attackerPatch: { buffs: { bless: 1 } } },
	{ defenderPatch: { buffs: { hex: 1 } } },
	{ attacker: 'rat', attackerPatch: { buffs: { daze: 1 } } },
	{ attacker: 'rat', defenderPatch: { buffs: { hex: 1 } } },
	{ attackerPatch: { buffs: { bless: 1 } }, defenderPatch: { buffs: { hex: 1 } } },
	{ attacker: 'rat' },
	{ magic: true, attackerPatch: { buffs: { bless: 1 } } },
	{ attacker: 'rat' },
];

/** Crab bout: script 2's round list (plain exchanges, one magic, one surprise) with the
 * Rat replaced by the Crab. Same unarmed hero, same clover-burn rule (hero attacker rounds
 * only); the crab attacker rounds burn nothing extra, exactly like the rat's. */
const SCRIPT_V4: ScriptRound[] = [
	{},
	{ attacker: 'crab' },
	{},
	{ attacker: 'crab' },
	{ magic: true },
	{ attacker: 'crab' },
	{ surprise: true },
	{ attacker: 'crab' },
	{},
	{ attacker: 'crab' },
];

/** `Random.java` formulas over one seeded `SpdJavaRandom`, so the draw stream - not just the
 * outcome distribution - matches what the Java build would burn for the same script. The
 * seed goes through the same MX3 scramble `pushGenerator(seed)` applies, so a TS trace and
 * a Java trace with the same seed start from the identical generator state. */
function seededRandom(seed: bigint): { random: SimulationRandom; nextRound: (burnClover: boolean) => void } {
	const rng = new SpdJavaRandom(spdScramble(seed));
	// Java's unarmed-hero damage path burns one clover-check float before its NormalIntRange
	// (`Hero.heroDamageIntRange`, tag `v3.3.8`; chance 0 with no clover, but the draw is still
	// consumed). The game seam has no unarmed flag on Combatant, so the harness burns it here,
	// armed per round where the script guarantees an unarmed hero attacker: post-fix call order
	// per round is bark/armor/damage normals, so the burn goes before the 3rd normalRange call
	// (a miss makes no damage call and burns nothing, exactly like Java). Game code is
	// untouched; the delta stays documented in the script-2 header above.
	let normalsThisRound = 0;
	let cloverPending = false;
	const normalRange = (min: number, max: number): number => {
		if (cloverPending && normalsThisRound === 2) { rng.nextFloat(); cloverPending = false; }
		normalsThisRound++;
		return min + Math.floor(((rng.nextFloat() + rng.nextFloat()) * (max - min + 1)) / 2);
	};
	return {
		random: {
			float: (max) => rng.nextFloat() * max,
			normalRange,
			range: (min, max) => min + rng.nextInt(max - min + 1),
			int: (min, max) => min + rng.nextInt(max - min),
			chance: (probability) => rng.nextFloat() < probability,
		},
		nextRound: (burnClover: boolean) => { normalsThisRound = 0; cloverPending = burnClover; },
	};
}

interface TraceRound {
	round: number;
	attacker: string;
	defender: string;
	magic: boolean;
	surprise: boolean;
	hit: boolean;
	damage: number;
	draws: string[];
	attackerBuffs?: string[];
	defenderBuffs?: string[];
}

function runScript(seed: bigint, scriptVersion: number): { header: object; rounds: TraceRound[] } {
	const { random, nextRound } = seededRandom(seed);
	const header = { tool: 'parityCombatTrace', scriptVersion, seed: seed.toString() };
	const script = scriptVersion === SCRIPT_VERSION_4 ? SCRIPT_V4
		: scriptVersion === SCRIPT_VERSION_3 ? SCRIPT_V3
		: scriptVersion === SCRIPT_VERSION_2 ? SCRIPT_V2 : SCRIPT;
	const foe = scriptVersion === SCRIPT_VERSION_4 ? 'crab' : 'rat';
	const fighter = (side: 'hero' | 'rat' | 'crab'): Combatant => scriptVersion === SCRIPT_VERSION_1
		? (side === 'rat' ? rat : hero)
		: (side === 'crab' ? crabNatural : side === 'rat' ? ratNatural : heroNatural);
	const rounds: TraceRound[] = script.map((step, i) => {
		// Script 2's hero is always unarmed (Java `CombatHarness` uses a bare Warrior), so its
		// damage rolls burn the clover-check float; every other shape burns nothing extra.
		nextRound(scriptVersion !== SCRIPT_VERSION_1 && (step.attacker ?? 'hero') === 'hero');
		const attacker: Combatant = {
			...fighter(step.attacker ?? 'hero'),
			...(step.attackerPatch ?? {}),
			buffs: { ...(fighter(step.attacker ?? 'hero').buffs), ...((step.attackerPatch?.buffs ?? {}) as Combatant['buffs']) },
		};
		const attackerBase = step.attacker ?? 'hero';
		const defenderBase = step.defender ?? (attackerBase === 'hero' ? foe : 'hero');
		const defender: Combatant = {
			...fighter(defenderBase),
			...(step.defenderPatch ?? {}),
			buffs: { ...(fighter(defenderBase).buffs), ...((step.defenderPatch?.buffs ?? {}) as Combatant['buffs']) },
		};
		const log: string[] = [];
		setTraceDrawLog(log);
		let result;
		try {
			result = resolveAttack(attacker, defender, random, step.magic ?? false, step.surprise ?? false);
		} finally {
			setTraceDrawLog(null);
		}
		const buffNames = (b: Combatant['buffs']): string[] | undefined => {
			const names = Object.keys(b ?? {});
			return names.length > 0 ? names : undefined;
		};
		return {
			round: i, attacker: attacker.id as string, defender: defender.id as string,
			magic: step.magic ?? false, surprise: step.surprise ?? false,
			hit: result.hit, damage: result.damage, draws: log,
			attackerBuffs: buffNames(attacker.buffs), defenderBuffs: buffNames(defender.buffs),
		};
	});
	return { header, rounds };
}

function toJsonl(trace: { header: object; rounds: TraceRound[] }): string {
	const lines = [JSON.stringify(trace.header)];
	for (const round of trace.rounds) lines.push(JSON.stringify(round));
	const totalDraws = trace.rounds.reduce((n, r) => n + r.draws.length, 0);
	lines.push(JSON.stringify({ rounds: trace.rounds.length, totalDraws }));
	return lines.join('\n') + '\n';
}

type CompareResult = { identical: true } | { identical: false; message: string };

function compareJsonl(aText: string, bText: string): CompareResult {
	const aLines = aText.trim().split('\n');
	const bLines = bText.trim().split('\n');
	if (aLines.length !== bLines.length) {
		return { identical: false, message: `line count differs: ${aLines.length} vs ${bLines.length}` };
	}
	const aHead = JSON.parse(aLines[0]!) as { seed: string; scriptVersion: number };
	const bHead = JSON.parse(bLines[0]!) as { seed: string; scriptVersion: number };
	if (aHead.scriptVersion !== bHead.scriptVersion) {
		return { identical: false, message: `script version differs: ${aHead.scriptVersion} vs ${bHead.scriptVersion}` };
	}
	if (aHead.seed !== bHead.seed) {
		return { identical: false, message: `seed differs: ${aHead.seed} vs ${bHead.seed}` };
	}
	for (let i = 1; i < aLines.length - 1; i++) {
		const a = JSON.parse(aLines[i]!) as TraceRound;
		const b = JSON.parse(bLines[i]!) as TraceRound;
		if (a.hit !== b.hit || a.damage !== b.damage) {
			return { identical: false, message: `round ${a.round}: outcome differs (hit ${a.hit}/${b.hit}, damage ${a.damage}/${b.damage})` };
		}
		const aBuffs = a.attackerBuffs ?? [];
		const bBuffs = b.attackerBuffs ?? [];
		const aDebuffs = a.defenderBuffs ?? [];
		const bDebuffs = b.defenderBuffs ?? [];
		if (aBuffs.join(',') !== bBuffs.join(',') || aDebuffs.join(',') !== bDebuffs.join(',')) {
			return { identical: false, message: `round ${a.round}: buffs differ (attackers ${aBuffs}/${bBuffs}, defenders ${aDebuffs}/${bDebuffs})` };
		}
		if (a.draws.length !== b.draws.length || a.draws.some((d, k) => d !== b.draws[k])) {
			const first = a.draws.findIndex((d, k) => d !== b.draws[k]);
			return { identical: false, message: `round ${a.round}: draw ${first} differs (${a.draws[first] ?? 'missing'} vs ${b.draws[first] ?? 'missing'})` };
		}
	}
	const aFoot = JSON.parse(aLines[aLines.length - 1]!) as { totalDraws: number };
	const bFoot = JSON.parse(bLines[bLines.length - 1]!) as { totalDraws: number };
	if (aFoot.totalDraws !== bFoot.totalDraws) {
		return { identical: false, message: `total draw count differs: ${aFoot.totalDraws} vs ${bFoot.totalDraws}` };
	}
	return { identical: true };
}

function fail(message: string): never {
	console.error(message);
	process.exit(1);
}

function arg(name: string): string | null {
	const i = process.argv.indexOf(name);
	return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1]! : null;
}

const mode = process.argv[2];
function scriptArg(): number {
	const raw = arg('--script') ?? '1';
	const version = parseInt(raw, 10);
	if (version !== SCRIPT_VERSION_1 && version !== SCRIPT_VERSION_2 && version !== SCRIPT_VERSION_3 && version !== SCRIPT_VERSION_4) fail(`unknown script version: ${raw}`);
	return version;
}

if (mode === 'emit') {
	const seedText = arg('--seed') ?? '123456789';
	const version = scriptArg();
	const out = arg('--out');
	if (!out) fail('usage: parityCombatTrace emit --seed <n> --script <1|2|3|4> --out <file>');
	const text = toJsonl(runScript(BigInt(seedText), version));
	writeFileSync(out!, text);
	const rounds = text.trim().split('\n').length - 2;
	console.log(`emitted ${rounds} rounds (script ${version}) to ${out}`);
} else if (mode === 'check') {
	const seed = BigInt(arg('--seed') ?? '123456789');
	for (const version of [SCRIPT_VERSION_1, SCRIPT_VERSION_2, SCRIPT_VERSION_3, SCRIPT_VERSION_4]) {
		const first = toJsonl(runScript(seed, version));
		const second = toJsonl(runScript(seed, version));
		if (first !== second) fail(`determinism gate FAILED (script ${version}): same seed produced different traces`);
		console.log(`determinism gate passed (script ${version}): byte-identical across two runs`);
	}
	const first = toJsonl(runScript(seed, SCRIPT_VERSION_1));
	const self = compareJsonl(first, first);
	if (!self.identical) fail('positive control FAILED: trace differs from itself');
	console.log('positive control passed: trace compares clean against itself');
	// Negative control: mutate round 5's damage in a file copy; the comparator must name round 5.
	const dir = mkdtempSync(join(tmpdir(), 'spd-parity-'));
	const mutatedLines = first.trim().split('\n');
	const victim = JSON.parse(mutatedLines[6]!) as TraceRound;
	victim.damage += 1;
	mutatedLines[6] = JSON.stringify(victim);
	const neg = compareJsonl(first, mutatedLines.join('\n') + '\n');
	if (neg.identical || !neg.message.includes('round 5')) {
		fail(`negative control FAILED: expected a round-5 report, got ${neg.identical ? 'identical' : neg.message}`);
	}
	console.log(`negative control passed: ${neg.message}`);
} else if (mode === 'compare') {
	const aPath = arg('--a');
	const bPath = arg('--b');
	if (!aPath || !bPath) fail('usage: parityCombatTrace compare --a <file> --b <file>');
	const result = compareJsonl(readFileSync(aPath!, 'utf8'), readFileSync(bPath!, 'utf8'));
	if (result.identical) {
		console.log('traces identical');
	} else {
		fail(`traces differ: ${result.message}`);
	}
} else {
	fail('usage: parityCombatTrace <emit|check|compare> [...]');
}
