import type { Step } from './combatState';
import type { SimulationRandom } from './random';

export interface YogDeathGazeAimContext {
	width: number;
	height: number;
	hero: Step;
	yog: Step;
	maxHp: number;
	hp: number;
	neighbours: ReadonlyArray<readonly [number, number]>;
	index(x: number, y: number): number;
	passable(x: number, y: number): boolean;
	trace(from: Step, to: Step): Step[];
	random: SimulationRandom;
}

/**
 * `YogDzewa.act()`'s aiming half. Returns painted target cells, not damage targets: the scene
 * owns persistence and the later firing effects. MWG's line tracer is injected so this remains
 * a renderer-free beam planner.
 */
export function aimYogDeathGaze(context: YogDeathGazeAimContext): number[] {
	const beams = 1 + Math.floor((context.maxHp - context.hp) / 400);
	const pathOf = (cell: number): number[] => {
		const to = { x: cell % context.width, y: Math.floor(cell / context.width) };
		return context.trace(context.yog, to).map((point) => context.index(point.x, point.y));
	};
	const targets = new Set<number>();
	const affected = new Set<number>();
	for (let i = 0; i < beams; i++) {
		let cell = context.index(context.hero.x, context.hero.y);
		if (i > 0) {
			const heroDistance = Math.hypot(context.hero.x - context.yog.x, context.hero.y - context.yog.y);
			for (let attempt = 0; attempt < 20; attempt++) {
				const [dx, dy] = context.neighbours[context.random.int(0, context.neighbours.length)]!;
				const x = context.hero.x + dx, y = context.hero.y + dy;
				if (x < 0 || y < 0 || x >= context.width || y >= context.height) continue;
				if (Math.hypot(x - context.yog.x, y - context.yog.y) > heroDistance) continue;
				cell = context.index(x, y);
				break;
			}
		}
		targets.add(cell);
		for (const pathCell of pathOf(cell)) affected.add(pathCell);
	}
	let allAdjacentTargeted = true;
	for (const [dx, dy] of context.neighbours) {
		const x = context.hero.x + dx, y = context.hero.y + dy;
		if (x < 0 || y < 0 || x >= context.width || y >= context.height || !context.passable(x, y)) continue;
		if (!affected.has(context.index(x, y))) { allAdjacentTargeted = false; break; }
	}
	if (allAdjacentTargeted) {
		const last = [...targets].pop();
		if (last !== undefined) targets.delete(last);
	}
	return [...targets];
}
