import type { Step } from './combatState';
import type { SimulationRandom } from './random';

/** DM-300's two ability choices, kept separate from the scene's effect application. */
export type DM300Ability = 'vent' | 'rockfall';

/** `DM300.java`'s weighted repeat rule: a fresh cycle is even, then repeats its last choice
 * at 1/4 only, while switching is the usual outcome. */
export function chooseDM300Ability(last: 0 | 1 | 2, random: SimulationRandom): DM300Ability {
	if (last === 0) return random.int(0, 2) === 0 ? 'vent' : 'rockfall';
	if (last === 1) return random.int(0, 4) === 0 ? 'vent' : 'rockfall';
	return random.int(0, 4) !== 0 ? 'vent' : 'rockfall';
}

/** `DM300.java`'s greedy STOP_SOLID gas trajectory. The scene supplies the map predicate so
 * this planner has no dependency on Pixi or scene state. */
export function dm300VentPath(source: Step, target: Step, canEnter: (x: number, y: number) => boolean): Step[] {
	const path: Step[] = [];
	let at = { ...source };
	for (let i = 0; i < 64; i++) {
		const dx = Math.sign(target.x - at.x), dy = Math.sign(target.y - at.y);
		if (dx === 0 && dy === 0) break;
		const nx = at.x + dx, ny = at.y + dy;
		if (!canEnter(nx, ny)) break;
		at = { x: nx, y: ny };
		path.push(at);
		if (nx === target.x && ny === target.y) break;
	}
	return path;
}

export interface DM300RockfallPlan {
	cells: Step[];
	safe: Step | null;
}

/** `DM300.java`'s 7x7 rockfall selection, including its one randomly safe neighbour and
 * 1/distance inclusion roll. The delayed landing and damage remain scene-owned. */
export function planDM300Rockfall(
	hero: Step,
	dm300: Step,
	width: number,
	height: number,
	passable: (x: number, y: number) => boolean,
	random: SimulationRandom,
): DM300RockfallPlan {
	const offsets: ReadonlyArray<readonly [number, number]> = [
		[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1],
	];
	const inside = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < width && y < height;
	let safe: Step | null = null;
	for (let attempt = 0; attempt < 20; attempt++) {
		const [dx, dy] = offsets[random.int(0, 8)]!;
		const at = { x: hero.x + dx, y: hero.y + dy };
		if (!inside(at.x, at.y) || (at.x === dm300.x && at.y === dm300.y)) continue;
		if (!passable(at.x, at.y) && random.int(0, 2) === 0) continue;
		safe = at;
		break;
	}
	const cells: Step[] = [];
	for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
		const at = { x: hero.x + dx, y: hero.y + dy };
		if (!inside(at.x, at.y) || !passable(at.x, at.y)) continue;
		if (safe && at.x === safe.x && at.y === safe.y) continue;
		const distance = Math.max(Math.abs(dx), Math.abs(dy));
		if (distance <= 1 || random.int(0, distance) === 0) cells.push(at);
	}
	return { cells, safe };
}
