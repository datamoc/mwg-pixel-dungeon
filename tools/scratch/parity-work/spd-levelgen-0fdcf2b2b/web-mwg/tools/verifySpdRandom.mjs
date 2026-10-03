// Regression check for the SPD-faithful RNG core (`SpdJavaRandom`/`spdScramble`/
// `spdSeedForDepth`/`SpdRandom`), now extracted to `src/spdRng.ts` (both `main.ts` and
// `src/spdLevelGen/` import it from there). Duplicated here rather than imported so this stays a
// dependency-free plain script; keep it in sync with `spdRng.ts` by hand.
//
// This only exercises the RNG primitives themselves. For the room-graph builder built on top of
// them, see `tools/verifyLevelGraph.ts` (PORT_COVERAGE.md's "RegularLevel... In progress" row).
// Run: node tools/verifySpdRandom.mjs

class SpdJavaRandom {
	state;
	constructor(seed) { this.state = (seed ^ 0x5deece66dn) & ((1n << 48n) - 1n); }
	next(bits) {
		this.state = (this.state * 0x5deece66dn + 0xbn) & ((1n << 48n) - 1n);
		return Number(this.state >> BigInt(48 - bits));
	}
	nextFloat() { return this.next(24) / 0x1000000; }
	nextLong() {
		const hi = BigInt(this.next(32));
		const lo = BigInt(this.next(32));
		const value = (hi << 32n) | lo;
		return value >= (1n << 63n) ? value - (1n << 64n) : value;
	}
	nextInt(bound) {
		if (bound <= 0) return 0;
		if ((bound & -bound) === bound) return Number((BigInt(bound) * BigInt(this.next(31))) >> 31n);
		let bits; let value;
		do { bits = this.next(31); value = bits % bound; } while (bits - value + bound - 1 < 0);
		return value;
	}
}

const U64 = (1n << 64n) - 1n;
const u64 = (v) => v & U64;

function spdScramble(seed) {
	let value = u64(seed);
	value = u64((value ^ (value >> 32n)) * 0xbea225f9eb34556dn);
	value = u64((value ^ (value >> 29n)) * 0xbea225f9eb34556dn);
	value = u64((value ^ (value >> 32n)) * 0xbea225f9eb34556dn);
	return u64(value ^ (value >> 29n));
}

function spdSeedForDepth(seed, depth, branch = 0) {
	const random = new SpdJavaRandom(spdScramble(seed));
	const lookAhead = depth + 30 * branch;
	for (let i = 0; i < lookAhead; i++) random.nextLong();
	return random.nextLong();
}

let failures = 0;
function check(name, actual, expected) {
	const ok = actual === expected;
	if (!ok) failures++;
	console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: got ${actual}, expected ${expected}`);
}

// Canonical, widely-verified java.util.Random(0) first raw nextInt() output.
{
	const r = new SpdJavaRandom(0n);
	let v = r.next(32);
	if (v >= 2 ** 31) v -= 2 ** 32;
	check('java.util.Random(0).nextInt()', v, -1155484576);
}

// Determinism + branch sensitivity smoke tests for spdSeedForDepth (no independent Java
// fixture yet - these just guard against accidental regressions once one exists).
{
	const seed = 123456789n;
	const a = spdSeedForDepth(seed, 1, 0);
	const b = spdSeedForDepth(seed, 1, 0);
	check('spdSeedForDepth is deterministic', a === b, true);

	const c = spdSeedForDepth(seed, 1, 1);
	check('spdSeedForDepth branch changes result', a !== c, true);

	const d1 = spdSeedForDepth(seed, 1, 0);
	const d2 = spdSeedForDepth(seed, 2, 0);
	check('spdSeedForDepth depth changes result', d1 !== d2, true);
}

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
