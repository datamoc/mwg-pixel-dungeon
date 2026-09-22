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
