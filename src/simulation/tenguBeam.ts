import type { Step } from './combatState';

export interface TenguConeFrontContext {
	direction: number;
	previous: readonly Step[];
	turn: number;
	width: number;
	height: number;
	passable: (x: number, y: number) => boolean;
	hasFire: (x: number, y: number) => boolean;
}

/** `FireAbility.act()`'s advancing cone front, consumed by MWG's MultiTurnBeam adapter.
 * Java spreads into every `!solid` cell (`Tengu.FireAbility.spreadFromCell`, tag
 * `v3.3.8`); this port tests `passable` instead, so the cone treats chasms the way
 * the rest of the port's movement layer does rather than the way Java's solid map
 * does. Stated simplification, not a silent gap. */
export function planTenguConeFront(context: TenguConeFrontContext): Step[] {
	const spreadFrom = context.turn === 0 ? context.previous : context.previous.filter((cell) => context.hasFire(cell.x, cell.y));
	const previousSet = new Set(context.previous.map((cell) => cell.y * context.width + cell.x));
	const seen = new Set<number>();
	const next: Step[] = [];
	const circle: ReadonlyArray<readonly [number, number]> = [
		[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0],
	];
	for (const cell of spreadFrom) {
		for (const step of [context.direction - 1, context.direction, context.direction + 1]) {
			const [dx, dy] = circle[(step + circle.length) % circle.length]!;
			const at = { x: cell.x + dx, y: cell.y + dy };
			if (at.x < 0 || at.y < 0 || at.x >= context.width || at.y >= context.height || !context.passable(at.x, at.y)) continue;
			const index = at.y * context.width + at.x;
			if (previousSet.has(index) || seen.has(index)) continue;
			seen.add(index);
			next.push(at);
		}
	}
	return next;
}
/**
 * Tengu HP-bracket decisions - the pure decision half of `Tengu.damage()`'s bracket clamp,
 * phase-1 end and bracket-change jump (actors/mobs/Tengu.java 132-200, tag `v3.3.8`). Extracted
 * from `clampTenguBracket` and `tenguBracketJump` so the parity kit (BACKLOG B3, boss
 * transitions) checks the *same* predicates the game runs rather than a second copy of them.
 * Behavior-identical: the same comparisons in the same order.
 *
 * Java works on `hpBracket = HT/8` with integer division throughout: the pre-hit bracket
 * `curbracket = HP/hpBracket`, the single-bracket clamp `HP = (curbracket-1)*hpBracket + 1`,
 * the FIGHT_START end at `HP <= HT/2`, and the jump when the post-hit bracket differs. The
 * port derives the bracket from pre-hit HP instead of tracking it persistently (equivalent:
 * brackets only move down) and gates phase 1 on its own `tenguPhase` cell state instead of
 * the level fight state; the bracket floor of 1 guards only hypothetical sub-8 maxima.
 */

/** HP bracket: `HT/8` (floored, never below 1). */
export function tenguHpBracket(maxHp: number): number {
	return Math.max(1, Math.floor(maxHp / 8));
}

/** Bracket index of an HP value under the bracket. */
export function tenguBracketOf(hp: number, bracket: number): number {
	return Math.floor(hp / bracket);
}

/** Single-bracket clamp: a blow crossing more than one bracket floors at the next bracket +1. */
export function tenguBracketClamp(preHp: number, hp: number, bracket: number): number {
	const line = (tenguBracketOf(preHp, bracket) - 1) * bracket;
	return hp <= line ? line + 1 : hp;
}

/** Bracket change across the hit (drives the deferred jump). */
export function tenguBracketChanged(preHp: number, hp: number, bracket: number): boolean {
	return tenguBracketOf(preHp, bracket) !== tenguBracketOf(hp, bracket);
}

/** Phase-1 end: first time at or under half HP while still in the cell. */
export function tenguPhase1Edge(phase: string, hp: number, maxHp: number): boolean {
	return phase === 'cell' && hp <= Math.floor(maxHp / 2);
}
