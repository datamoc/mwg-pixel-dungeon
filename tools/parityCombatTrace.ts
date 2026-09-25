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
 * Modes (`npm run parity:combat` runs `check`):
 * - `emit --seed <n> --out <file>`: run the versioned script, write the JSONL trace.
 * - `check`: determinism gate (same seed twice is byte-identical) plus the comparator's
 *   positive control (a trace compares clean against itself) and negative control (one
 *   mutated round is reported at exactly that round). No Java checkout needed.
 * - `compare --a <file> --b <file>`: diff two traces (TS-vs-TS today, TS-vs-Java once the
 *   Java driver exists); reports the first divergent round, exit 1 on any difference.
 */
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveAttack } from '../src/simulation/attackResolution';
import type { Combatant } from '../src/simulation/combatState';
import type { SimulationRandom } from '../src/simulation/random';
import { SpdJavaRandom, setTraceDrawLog } from '../src/spdRng';

/** Bump when the fixture script below changes; the comparator refuses cross-version diffs. */
const SCRIPT_VERSION = 1;

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
	attacker: 'hero' | 'rat';
	defender: 'hero' | 'rat';
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

/** `Random.java` formulas over one seeded `SpdJavaRandom`, so the draw stream - not just the
 * outcome distribution - matches what the Java build would burn for the same script. */
function seededRandom(seed: bigint): { random: SimulationRandom } {
	const rng = new SpdJavaRandom(seed);
	return {
		random: {
			float: (max) => rng.nextFloat() * max,
			normalRange: (min, max) => min + Math.floor(((rng.nextFloat() + rng.nextFloat()) * (max - min + 1)) / 2),
			range: (min, max) => min + rng.nextInt(max - min + 1),
			int: (min, max) => min + rng.nextInt(max - min),
			chance: (probability) => rng.nextFloat() < probability,
		},
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
}

function runScript(seed: bigint): { header: object; rounds: TraceRound[] } {
	const { random } = seededRandom(seed);
	const header = { tool: 'parityCombatTrace', scriptVersion: SCRIPT_VERSION, seed: seed.toString() };
	const rounds: TraceRound[] = SCRIPT.map((step, i) => {
		const attacker: Combatant = {
			...(step.attacker === 'rat' ? rat : hero),
			...(step.attackerPatch ?? {}),
			buffs: { ...((step.attacker === 'rat' ? rat : hero).buffs), ...((step.attackerPatch?.buffs ?? {}) as Combatant['buffs']) },
		};
		const defenderBase = step.defender ?? (step.attacker === 'rat' ? 'hero' : 'rat');
		const defender: Combatant = {
			...(defenderBase === 'hero' ? hero : rat),
			...(step.defenderPatch ?? {}),
			buffs: { ...((defenderBase === 'hero' ? hero : rat).buffs), ...((step.defenderPatch?.buffs ?? {}) as Combatant['buffs']) },
		};
		const log: string[] = [];
		setTraceDrawLog(log);
		let result;
		try {
			result = resolveAttack(attacker, defender, random, step.magic ?? false, step.surprise ?? false);
		} finally {
			setTraceDrawLog(null);
		}
		return {
			round: i, attacker: attacker.id as string, defender: defender.id as string,
			magic: step.magic ?? false, surprise: step.surprise ?? false,
			hit: result.hit, damage: result.damage, draws: log,
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
if (mode === 'emit') {
	const seedText = arg('--seed') ?? '123456789';
	const out = arg('--out');
	if (!out) fail('usage: parityCombatTrace emit --seed <n> --out <file>');
	const text = toJsonl(runScript(BigInt(seedText)));
	writeFileSync(out!, text);
	const rounds = text.trim().split('\n').length - 2;
	console.log(`emitted ${rounds} rounds to ${out}`);
} else if (mode === 'check') {
	const seed = BigInt(arg('--seed') ?? '123456789');
	const first = toJsonl(runScript(seed));
	const second = toJsonl(runScript(seed));
	if (first !== second) fail('determinism gate FAILED: same seed produced different traces');
	console.log(`determinism gate passed: ${SCRIPT.length} rounds byte-identical across two runs`);
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
