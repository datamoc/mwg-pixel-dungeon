/**
 * SPD's real seeded RNG, extracted from `main.ts` so `spdLevelGen/` (and any future module) can
 * import it without pulling in `main.ts`'s game-bootstrap side effects. Behavior is unchanged
 * from the version that lived inline in `main.ts` - see `PORT_COVERAGE.md` for what's verified.
 */

const U64 = (1n << 64n) - 1n;
function u64(value: bigint): bigint { return value & U64; }

/** java.util.Random, plus SPD's MX3 seed scramble and Dungeon.seedForDepth(). */
export class SpdJavaRandom {
	private state: bigint;
	constructor(seed: bigint) { this.state = (seed ^ 0x5deece66dn) & ((1n << 48n) - 1n); }
	private next(bits: number): number {
		this.state = (this.state * 0x5deece66dn + 0xbn) & ((1n << 48n) - 1n);
		return Number(this.state >> BigInt(48 - bits));
	}
	nextFloat(): number { return this.next(24) / 0x1000000; }
	/**
	 * `java.util.Random.nextLong()`: `((long)(next(32)) << 32) + next(32)` - both `next(32)` calls
	 * are cast to a SIGNED 32-bit int before the shift/add, not treated as unsigned magnitudes. A
	 * naive `(hi << 32n) | lo` (treating both as unsigned 0..2^32-1) is only correct when the
	 * second (low) draw's top bit is clear; when it's set, Java's signed addition effectively
	 * borrows 2^32 from the high half, so the naive version is off by exactly +2^32 in that case.
	 * Found via the Phase 2 Java-fixture comparison: `spdSeedForDepth()` (which burns/returns
	 * `nextLong()` calls) matched Java for some depths and was off by exactly 2^32 for others,
	 * which pinpointed this exact sign-handling gap rather than a higher-level ordering bug.
	 */
	nextLong(): bigint {
		const hi = BigInt(this.next(32));
		const lo = BigInt(this.next(32));
		const hiSigned = hi >= (1n << 31n) ? hi - (1n << 32n) : hi;
		const loSigned = lo >= (1n << 31n) ? lo - (1n << 32n) : lo;
		const value = u64((hiSigned << 32n) + loSigned);
		return value >= (1n << 63n) ? value - (1n << 64n) : value;
	}
	nextInt(bound: number): number {
		if (bound <= 0) return 0;
		if ((bound & -bound) === bound) return Number((BigInt(bound) * BigInt(this.next(31))) >> 31n);
		let bits: number; let value: number;
		do { bits = this.next(31); value = bits % bound; } while (bits - value + bound - 1 < 0);
		return value;
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
	static normalIntRange(min: number, max: number): number {
		return min + Math.floor((this.float() + this.float()) * (max - min + 1) / 2);
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
 * burns 12 calls with bounds 12,11,...,1, in that order (Scroll, then Potion, then Ring). This port
 * has no item-identification system, so only the RNG call count/bounds are reproduced here - not
 * the label assignment itself, which does not affect anything level-gen-side. Found via the Phase 2
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
