import type { SimulationRandom } from './random';

/**
 * Renderer-free halves of the Blacksmith GNOLL mine quest's shared abilities
 * (`GnollGeomancer.java`, tag `v3.3.8` - its `public static` helpers, which `GnollSapper.java`
 * calls too). Everything is in raw cell indices on the painted level's own grid, as Java's
 * are; the scene supplies terrain and actor lookups and applies the results.
 */

/** `PathFinder.NEIGHBOURS4`/`NEIGHBOURS8`/`NEIGHBOURS9` for a level `width` cells wide, Java's order. */
export function neighbours4(width: number): number[] { return [-width, -1, 1, width]; }
export function neighbours8(width: number): number[] { return [-width - 1, -width, -width + 1, -1, 1, width - 1, width, width + 1]; }
export function neighbours9(width: number): number[] { return [-width - 1, -width, -width + 1, -1, 0, 1, width - 1, width, width + 1]; }

/** `Level.distance()` (Chebyshev) and `Level.trueDistance()` (Euclidean) over cell indices. */
export function cellDistance(width: number, a: number, b: number): number {
	return Math.max(Math.abs((a % width) - (b % width)), Math.abs(Math.floor(a / width) - Math.floor(b / width)));
}
export function cellTrueDistance(width: number, a: number, b: number): number {
	const dx = (a % width) - (b % width), dy = Math.floor(a / width) - Math.floor(b / width);
	return Math.sqrt(dx * dx + dy * dy);
}

/**
 * `GnollGeomancer.damage()`'s HP bracket: `HP / (HT/3)`, with full HP folded into the top
 * bracket ("full HP isn't its own bracket").
 */
export function geomancerBracket(hp: number, ht: number): number {
	const bracket = Math.floor(hp / Math.floor(ht / 3));
	return bracket === 3 ? 2 : bracket;
}

export interface GeomancerDamageResult {
	/** HP after the hit, clamped so one hit cannot cross two brackets. */
	hp: number;
	/** The hit moved it into a lower bracket: dash and re-armour (bleeding is `bleed`'s call). */
	crossed: boolean;
	/** `BossHealthBar.bleed(newBracket <= 0)`: only the crossing into the final bracket bleeds. */
	bleed: boolean;
}

/**
 * `GnollGeomancer.damage()` + `isAlive()`: a hit never carries it through more than one
 * bracket (`HP = (curbracket-1)*hpBracket + 1`), and it cannot die until it started the hit in
 * the final bracket (`inFinalBracket`). `preHp` is the HP before the hit, `hp` after it.
 */
export function resolveGeomancerDamage(preHp: number, hp: number, ht: number): GeomancerDamageResult {
	const hpBracket = Math.floor(ht / 3);
	const current = geomancerBracket(preHp, ht);
	const inFinalBracket = current === 0;
	//Java's `newBracket` is read before the clamp (and a negative HP truncates towards 0), so
	//`bleed()` sees the unclamped bracket: a hit from 120 to 20 bleeds the bar at HP 51.
	const next = geomancerBracket(Math.max(0, hp), ht);
	if (next === current) return { hp: inFinalBracket ? hp : Math.max(1, hp), crossed: false, bleed: false };
	if (hp <= (current - 1) * hpBracket) hp = (current - 1) * hpBracket + 1;
	return { hp, crossed: true, bleed: next <= 0 };
}

export interface RockFallContext {
	readonly width: number;
	readonly length: number;
	/** `Level.insideMap()`: not on the outer ring. */
	readonly insideMap: (cell: number) => boolean;
	readonly solid: (cell: number) => boolean;
	readonly trap: (cell: number) => boolean;
	/** The cell's raw terrain is `BARRICADE` or `ENTRANCE`. */
	readonly barricadeOrEntrance: (cell: number) => boolean;
	readonly geomancerAt: (cell: number) => boolean;
	readonly sapperAt: (cell: number) => boolean;
}

/**
 * `GnollGeomancer.prepRockFallAttack()`: a `(2*range+1)` square centred on the target, minus one
 * randomly-chosen safe neighbour (a solid or trapped pick is kept only 1 in 5 times), where each
 * open cell joins with chance `1/(1 + distance/2)`. `avoidBarricades` skips every cell touching
 * a barricade or the entrance (both callers pass `true`). The geomancer's own cell never drops a
 * rock, nor - when the geomancer is the caster - a sapper's. Java's safe-cell search retries
 * uncapped; this one gives up after 64 draws and fires with no safe cell (a walled-in centre
 * still accepts a solid pick 1 time in 5, so running out is only ~0.8^64 likely) - the same
 * capped-retry shape as `planDM300Rockfall`'s 20.
 */
export function planGnollRockFall(
	center: number,
	source: number,
	sourceIsGeomancer: boolean,
	range: number,
	avoidBarricades: boolean,
	context: RockFallContext,
	random: SimulationRandom,
): number[] {
	const { width } = context;
	const n8 = neighbours8(width);
	let safeCell = -1;
	for (let attempt = 0; attempt < 64; attempt++) {
		const candidate = center + n8[random.int(0, 8)]!;
		if (candidate === source) continue;
		if (context.solid(candidate) && random.int(0, 5) !== 0) continue;
		if (context.trap(candidate) && random.int(0, 5) !== 0) continue;
		safeCell = candidate;
		break;
	}
	const n9 = neighbours9(width);
	const cells: number[] = [];
	const start = center - width * range - range;
	for (let y = 0; y < 1 + 2 * range; y++) {
		let pos = start + width * y;
		for (let x = 0; x < 1 + 2 * range; x++, pos++) {
			if (pos < 0 || pos >= context.length || !context.insideMap(pos)) continue;
			if (avoidBarricades && n9.some((j) => context.barricadeOrEntrance(pos + j))) continue;
			if (context.solid(pos) || pos === safeCell || context.geomancerAt(pos)) continue;
			if (sourceIsGeomancer && context.sapperAt(pos)) continue;
			if (random.int(0, 1 + Math.floor(cellDistance(width, center, pos) / 2)) === 0) cells.push(pos);
		}
	}
	return cells;
}

/**
 * `GnollGeomancer.prepRockThrowAttack()`'s choice among the boulders already filtered to those
 * the source can see with a clear `PROJECTILE` line to the target and not already being thrown:
 * the one closest to the target by `trueDistance`, first-found winning ties (Java's strict `<`).
 */
export function chooseThrownBoulder(width: number, target: number, candidates: readonly number[]): number | null {
	let best: number | null = null;
	for (const cell of candidates) {
		if (best === null || cellTrueDistance(width, cell, target) < cellTrueDistance(width, best, target)) best = cell;
	}
	return best;
}

/** `GnollGeomancer.spreadDiamondAOE()`: every in-map NEIGHBOURS4 cell of `current` not already in it. */
export function spreadDiamond(current: readonly number[], width: number, insideMap: (cell: number) => boolean): number[] {
	const inCurrent = new Set(current);
	const spread: number[] = [];
	const seen = new Set<number>();
	for (const i of current) {
		for (const j of neighbours4(width)) {
			const cell = i + j;
			if (insideMap(cell) && !seen.has(cell) && !inCurrent.has(cell)) {
				seen.add(cell);
				spread.push(cell);
			}
		}
	}
	return spread;
}

/**
 * `GnollGeomancer.carveRockAndDash()`'s target choice over `sapperSpawns` (-1 = already used):
 * the closest remaining spawn by `trueDistance`, except that a spawn whose sapper still lives
 * (within Chebyshev 16) wins over a dead one. Java's loop reads as written here, including its
 * `||` (a nearer spawn replaces the pick whatever its sapper's state).
 */
export function chooseDashSpawn(
	width: number,
	pos: number,
	sapperSpawns: readonly number[],
	sapperAliveAt: (spawn: number) => boolean,
): { spawn: number; alive: boolean } | null {
	let closest = -1;
	let closestAlive = false;
	for (const spawn of sapperSpawns) {
		if (spawn === -1) continue;
		if (closest === -1) {
			closest = spawn;
			closestAlive = sapperAliveAt(spawn);
			continue;
		}
		const alive = sapperAliveAt(spawn);
		if ((alive && !closestAlive && cellDistance(width, pos, spawn) <= 16)
			|| cellTrueDistance(width, pos, spawn) < cellTrueDistance(width, pos, closest)) {
			closest = spawn;
			closestAlive = alive;
		}
	}
	return closest === -1 ? null : { spawn: closest, alive: closestAlive };
}

/** `GameMath.gate(TICK, (int)Math.ceil(enemy.cooldown()), 3*TICK)`: every gnoll ability's own delay. */
export function gnollAbilityDelay(enemyCooldown: number): number {
	return Math.min(3, Math.max(1, Math.ceil(enemyCooldown)));
}
