import { cellTrueDistance, neighbours4, neighbours8 } from './gnollGeomancer';

/**
 * Pure halves of the Blacksmith CRYSTAL mine quest's actors (`actors/mobs/CrystalSpire.java`,
 * `CrystalGuardian.java`, and `levels/Level.java`'s `openSpace`, tag `v3.3.8`). Cells are raw
 * level indices (`y * width + x`), as in Java. The scene group that applies them is
 * `scenes/dungeon/monsters/crystalMine.ts`; `tools/verifyCrystalMine.mjs` pins them.
 */

/** `CrystalSpire.spreadDiamondAOE()`: every `NEIGHBOURS4` cell of `current` that is `open`
 * (`!solid || map == MINE_CRYSTAL`) and in neither list yet, in Java's visiting order. */
export function spireSpread(current: readonly number[], width: number, open: (cell: number) => boolean): number[] {
	const inCurrent = new Set(current);
	const seen = new Set<number>();
	const spread: number[] = [];
	for (const i of current) {
		for (const j of neighbours4(width)) {
			const cell = i + j;
			if (open(cell) && !seen.has(cell) && !inCurrent.has(cell)) {
				seen.add(cell);
				spread.push(cell);
			}
		}
	}
	return spread;
}

/** The waves `diamondAOEAttack()`/`lineAttack()` queue: the first as given, a second once
 * `HP < 2*HT/3f`, a third once `HP < HT/3f` - each the previous wave plus one more spread.
 * Java's float comparisons are kept (`HP < 200` and `HP < 100` at `HT` 300). */
function spireWaves(first: readonly number[], hp: number, ht: number, width: number, open: (cell: number) => boolean): number[][] {
	const cells = [...first];
	const waves = [[...cells]];
	if (hp < (2 * ht) / 3) {
		cells.push(...spireSpread(cells, width, open));
		waves.push([...cells]);
		if (hp < ht / 3) {
			cells.push(...spireSpread(cells, width, open));
			waves.push([...cells]);
		}
	}
	return waves;
}

/** `CrystalSpire.diamondAOEAttack()`: the hero's cell plus one diamond spread, then the wounded waves. */
export function planSpireDiamond(heroCell: number, hp: number, ht: number, width: number, open: (cell: number) => boolean): number[][] {
	const first = [heroCell];
	first.push(...spireSpread(first, width, open));
	return spireWaves(first, hp, ht, width, open);
}

/** `CrystalSpire.lineAttack()`: `aim.subPath(1, 7)` of a `WONT_STOP` bolt at the hero, cut at the
 * first cell that is not `open`, then the wounded waves. `path` is that sub-path, already traced. */
export function planSpireLine(path: readonly number[], hp: number, ht: number, width: number, open: (cell: number) => boolean): number[][] {
	const first: number[] = [];
	for (const cell of path) {
		if (!open(cell)) break;
		first.push(cell);
	}
	return spireWaves(first, hp, ht, width, open);
}

/** A spike's damage: `NormalIntRange(6, 15)`, plus 12 on a `CrystalGuardian` ("18-27 damage"). */
export function spikeDamage(roll: number, guardian: boolean): number {
	return guardian ? roll + 12 : roll;
}

/**
 * Where a spike knocks the character at `cell`: `NEIGHBOURS8` in Java's order, each free cell
 * (`!solid` and unoccupied) that is strictly farther (`trueDistance`) from `awayFrom` than the
 * best so far replaces it - guardians are knocked away from the hero, everyone else away from
 * the spire. Returns `cell` itself when nothing is farther.
 */
export function spikeKnockCell(cell: number, width: number, awayFrom: number, free: (cell: number) => boolean): number {
	let best = cell;
	for (const j of neighbours8(width)) {
		const next = cell + j;
		if (free(next) && cellTrueDistance(width, next, awayFrom) > cellTrueDistance(width, best, awayFrom)) best = next;
	}
	return best;
}

/**
 * `Level.buildFlagMaps()`' `openSpace` ("large enough to fit large mobs"): a non-solid cell with
 * some open 2x2 corner - an orthogonal neighbour, the diagonal after it and the orthogonal after
 * that all non-solid, walking `PathFinder.CIRCLE8` from each of its four orthogonal slots.
 */
export function isOpenSpace(cell: number, width: number, solid: (cell: number) => boolean): boolean {
	if (solid(cell)) return false;
	const circle8 = [-width - 1, -width, -width + 1, 1, width + 1, width, width - 1, -1];
	for (let j = 1; j < 8; j += 2) {
		if (solid(cell + circle8[j]!)) continue;
		if (!solid(cell + circle8[(j + 1) % 8]!) && !solid(cell + circle8[(j + 2) % 8]!)) return true;
	}
	return false;
}

/** `CrystalGuardian.speed()`: at most four turns a step outside open space (`max(0.25, speed/4)`). */
export function guardianSpeed(baseSpeed: number, openSpace: boolean): number {
	return openSpace ? baseSpeed : Math.max(0.25, baseSpeed / 4);
}

/** `spend(GameMath.gate(TICK, (int)Math.ceil(hero.cooldown()), 3*TICK))` after a spire attack. */
export function spireAbilityDelay(heroCooldown: number): number {
	return Math.min(3, Math.max(1, Math.ceil(heroCooldown)));
}

/** `CrystalSpireSprite.updateIdle()`: the idle frame (before the colour offset) for the spire's HP. */
export function spireIdleFrame(hp: number, ht: number): number {
	const pct = hp / ht;
	if (pct > 0.9) return 0;
	if (pct > 0.67) return 1;
	if (pct > 0.33) return 2;
	return 3;
}
