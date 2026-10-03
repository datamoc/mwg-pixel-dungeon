/**
 * SPD's real seeded RNG, extracted from `main.ts` so `spdLevelGen/` (and any future module) can
 * import it without pulling in `main.ts`'s game-bootstrap side effects. Behavior is unchanged
 * from the version that lived inline in `main.ts` - see `PORT_COVERAGE.md` for what's verified.
 */

import { JavaRandom, type JavaRandomDraw } from 'mwg/core';

const U64 = (1n << 64n) - 1n;
function u64(value: bigint): bigint { return value & U64; }

/** java.util.Random, plus SPD's MX3 seed scramble and Dungeon.seedForDepth(). */
// RNG-call-order parity facility for `tools/levelgenParity.ts` (Sec 9): while a log array
// is installed, every raw next() draw appends a `bits:value` line - the same shape Java's
// TracingRandom writes. Off (null) by default: one extra branch per draw, no allocation.
// The stack-window attribution below exists to bisect a divergence to its call sites.
let traceDrawLog: string[] | null = null;
export function setTraceDrawLog(v: string[] | null): void { traceDrawLog = v; traceDrawCount = 0; }
let traceDrawCount = 0;
export let traceStackWindow: [number, number] | null = null;
export function setTraceStackWindow(w: [number, number] | null): void { traceStackWindow = w; }
export const traceStacks: string[] = [];

/** Feeds the parity trace from the framework generator's own per-draw hook. A 32-bit
 * draw already arrives signed (Java's `int` cast form), so the logged text matches
 * `TracingRandom` with no adjustment. */
function traceDraw(draw: JavaRandomDraw): void {
	if (traceDrawLog === null) return;
	traceDrawLog.push(`${draw.bits}:${draw.value}`);
	if (traceStackWindow !== null && traceDrawCount >= traceStackWindow[0] && traceDrawCount <= traceStackWindow[1]) {
		traceStacks.push(`#${traceDrawCount} ${draw.bits}:${draw.value} :: ${(new Error().stack ?? '').split('\n').slice(2, 9).join(' <- ')}`);
	}
	traceDrawCount++;
}

/** The 48-bit LCG behind `java.util.Random`, bit for bit - now the framework's own
 * generator (proven identical draw-for-draw against this file's hand-rolled version
 * before the swap, and covered going forward by the levelgen parity fixtures).
 * `nextLong()`'s signed-halves handling (a real +2^32 Phase-2 find, see history) is
 * framework-owned now. What stays ours: the parity trace above, the MX3 scramble and
 * `seedForDepth()` below, and the `SpdRandom` generator stack. */
export class SpdJavaRandom extends JavaRandom {
	constructor(seed: bigint) {
		super(seed, { onDraw: traceDraw });
	}
	override nextInt(bound?: number): number {
		//Java throws on bound <= 0; every call site here passes a positive bound (the
		//`Math.max(1, ...)` guards say so explicitly), and `SpdRandom.int` treats 0 as
		//"no range", so the historical return-0 guard stays instead of adopting the throw.
		if (bound !== undefined && bound <= 0) return 0;
		return super.nextInt(bound);
	}
}

export function spdScramble(seed: bigint): bigint {
	let value = u64(seed);
	value = u64((value ^ (value >> 32n)) * 0xbea225f9eb34556dn);
	value = u64((value ^ (value >> 29n)) * 0xbea225f9eb34556dn);
	value = u64((value ^ (value >> 32n)) * 0xbea225f9eb34556dn);
	return u64(value ^ (value >> 29n));
}

/**
 * `Dungeon.seedForDepth()`: burns `depth + 30*branch` longs through a generator seeded (with
 * MX3 scramble) from the *run* seed, on a throwaway generator that is popped afterward - the
 * returned long is only a derived per-floor seed, not itself the level-gen generator's seed.
 */
export function spdSeedForDepth(seed: bigint, depth: number, branch: number = 0): bigint {
	const random = new SpdJavaRandom(spdScramble(seed));
	const lookAhead = depth + 30 * branch;
	for (let i = 0; i < lookAhead; i++) random.nextLong();
	return random.nextLong();
}

/**
 * Java `Level`'s feeling roll for floors this port generates itself: past depth 1,
 * `Random.Int(14)` picks one of the seven feelings at ~7.1% each, so LARGE (`case 4`,
 * `Level.java`, tag `v3.3.8`) lands on `=== 4`. Only LARGE is retained - the port
 * consumes no other feeling (DARK view distance, GRASS growth and the rest are separate
 * unmodeled systems) - drawn from a dedicated depth-seeded generator (branch 7, a fresh
 * object per call) so the levelgen parity streams never shift and revisits re-roll the
 * same value with no save field.
 */
export function genericLargeFeeling(runSeed: bigint, depth: number): boolean {
	if (depth <= 1) return false;
	return new SpdJavaRandom(spdSeedForDepth(runSeed, depth, 7)).nextInt(14) === 4;
}

/** Branch of `spdSeedForDepth` reserved for the torch-candidate stream below: branches
 * 0/1 carry the levelgen streams and 7 the LARGE-feeling one-shot, so torches take 8. */
export const TORCH_STREAM_BRANCH = 8;

/**
 * `RegularLevel.createItems()`' torch half (`RegularLevel.java:470-491`, tag `v3.3.8`):
 * the one (two on LARGE) Torch drops draw off their own pushed generator - `pushGenerator`
 * seeded by a `Random.Long()` off the level stream, popped right after - so held items,
 * meta progress and talents cannot shift torch cells. This port has no generator stack
 * at the placement seam, so the equivalent is a dedicated depth-seeded roller: one fresh
 * `SpdJavaRandom` per floor, drawn sequentially (room pick, then cell coords per attempt),
 * stable across revisits and rebuilds with no save field, exactly the `genericLargeFeeling`
 * precedent. It is deliberately not bit-identical to Java (the room list stays this port's
 * generic rooms rather than `StandardRoom`s, and the surrounding draw interleaving differs),
 * only stable and stream-separated: torch draws can never shift, nor be shifted by, gameplay RNG.
 */
export function torchRoller(runSeed: bigint, depth: number): (bound: number) => number {
	const rng = new SpdJavaRandom(spdSeedForDepth(runSeed, depth, TORCH_STREAM_BRANCH));
	return (bound: number) => rng.nextInt(Math.max(1, bound));
}

/**
 * `Random.java`'s stack of generators (`Level.create()` pushes a *second*, distinct generator
 * seeded from `seedForDepth()`'s result - scrambled again via `pushGenerator(long)` - on top of
 * whatever generator is already current; `createItems()` later pushes a third, substream
 * generator seeded by `Random.Long()` off the level-gen stream itself, for bones/lore drops).
 */
export class SpdRandom {
	private static stack: SpdJavaRandom[] = [new SpdJavaRandom(BigInt(Math.floor(Math.random() * 2 ** 48)))];
	private static top(): SpdJavaRandom { return this.stack[this.stack.length - 1]; }

	static pushGenerator(seed?: bigint): void {
		this.stack.push(seed === undefined
			? new SpdJavaRandom(BigInt(Math.floor(Math.random() * 2 ** 48)))
			: new SpdJavaRandom(spdScramble(seed)));
	}
	static popGenerator(): void {
		if (this.stack.length > 1) this.stack.pop();
	}

	/**
	 * `Random.Float()`: `nextFloat()`'s output (n/2^24 for n < 2^24) is always exactly
	 * representable in a JS double, so no `Math.fround` is needed here - but every arithmetic
	 * op Java performs ON that float (multiply by a range, add a min, sum into an accumulator)
	 * IS float-precision and must be frounded at each step, since Java narrows at every `float`
	 * assignment/operator, not just at a final cast. Missing this class of narrowing was the
	 * root cause of a real seed-42-depth-3 desync in `spdLevelGen`'s builder (see its own
	 * float-precision comments) - fixed at the root here so every caller benefits.
	 */
	static float(): number { return this.top().nextFloat(); }
	/** `Random.Float(float max)`: `Float() * max`, float*float=float. */
	static floatMax(max: number): number { return Math.fround(this.float() * max); }
	/** `Random.Float(float min, float max)`: `min + Float(max - min)`, each op float-precision. */
	static floatRange(min: number, max: number): number {
		return Math.fround(min + this.floatMax(Math.fround(max - min)));
	}
	/** `Random.NormalFloat`: two independent float draws, summed/halved/added at float precision. */
	static normalFloat(min: number, max: number): number {
		const range = Math.fround(max - min);
		const a = this.floatMax(range);
		const b = this.floatMax(range);
		return Math.fround(min + Math.fround(Math.fround(a + b) / 2));
	}
	static int(max: number): number { return max > 0 ? this.top().nextInt(max) : 0; }
	static intRange0(min: number, max: number): number { return min + this.int(max - min); }
	static intRange(min: number, max: number): number { return min + this.int(max - min + 1); }
	/**
	 * Random.NormalIntRange: min + (int)((Float() + Float()) * (max - min + 1) / 2f) -
	 * every op is float in Java, then a truncating (int) cast. The double-precision
	 * version this replaced could land on the other side of an integer boundary from
	 * Java’s float-rounded value, flipping a setSize() dimension by one.
	 */
	static normalIntRange(min: number, max: number): number {
		const sum = Math.fround(this.float() + this.float());
		const scaled = Math.fround(sum * (max - min + 1));
		return min + Math.trunc(scaled / 2);
	}
	static long(): bigint { return this.top().nextLong(); }

	/**
	 * `Random.chances(float[])`: cumulative-sum weighted pick, -1 (mapped to 0 by callers'
	 * clamp) if none. Java's `sum`/running `acc` are both `float` locals, so each `+=` narrows -
	 * fround per step, not just at the end, since the accumulated rounding error can differ.
	 */
	static chances(weights: number[]): number {
		let sum = 0;
		for (const w of weights) sum = Math.fround(sum + w);
		const value = this.floatRange(0, sum);
		let acc = 0;
		for (let i = 0; i < weights.length; i++) {
			acc = Math.fround(acc + weights[i]);
			if (value < acc) return i;
		}
		return -1;
	}
	static element<T>(arr: T[]): T { return arr[this.int(arr.length)]; }
	/** `Random.shuffle(List)` -> `Collections.shuffle`: back-to-front swap with `nextInt(i+1)`. */
	static shuffle<T>(list: T[]): void {
		for (let i = list.length - 1; i > 0; i--) {
			const j = this.int(i + 1);
			const tmp = list[i]; list[i] = list[j]; list[j] = tmp;
		}
	}
	/** `Random.shuffle(T[] array)`: SPD's own forward-swap variant, distinct from `Collections.shuffle`. */
	static shuffleArrayForward<T>(arr: T[]): void {
		for (let i = 0; i < arr.length - 1; i++) {
			const j = this.intRange0(i, arr.length);
			if (j !== i) { const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp; }
		}
	}
}

/**
 * `Dungeon.init()`'s real run-level generator: pushed from `seed+1` (Java's comment: "offset seed
 * slightly to avoid output patterns" - NOT the raw run seed used by `seedForDepth()`), then before
 * `SpecialRoom.initForRun()`/`SecretRoom.initForRun()` run on it, Java calls `Scroll.initLabels()`/
 * `Potion.initColors()`/`Ring.initGems()`, each constructing an `ItemStatusHandler` that burns one
 * `Random.Int(labelsLeft.size())` per item class with the pool shrinking by one each draw. Checked
 * against this checkout's `Generator.java`: `SCROLL`/`POTION`/`RING` each have exactly 12 classes,
 * and `Scroll`/`Potion`/`Ring`'s own label/color/gem maps each have exactly 12 entries too, so each
 * burns 12 calls with bounds 12,11,...,1, in that order (Scroll, then Potion, then Ring). Only
 * the RNG burn is reproduced here - the shuffled labels themselves are assigned by the
 * item-identification flow (`items/appearanceFrames.ts`), which does not affect anything
 * level-gen-side. Found via the Phase 2
 * Java-fixture comparison: earlier code pushed the raw `seed` with no burn at all, which desynced
 * `SpecialRoom`/`SecretRoom`'s run-level shuffle relative to real Java (the per-floor room graph
 * and painting streams are unaffected - they come from `seedForDepth()`'s independent generator).
 */
export function pushRunInitGenerator(seed: bigint): void {
	SpdRandom.pushGenerator(seed + 1n);
	for (let category = 0; category < 3; category++) {
		for (let poolSize = 12; poolSize >= 1; poolSize--) SpdRandom.int(poolSize);
	}
}
