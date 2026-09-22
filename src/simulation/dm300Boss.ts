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

export interface DM300KnockbackContext {
	/** Solid cells stop the `MAGIC_BOLT` throw trajectory (`Ballistica.MAGIC_BOLT`). */
	readonly blocked: (x: number, y: number) => boolean;
	/** Cells holding another character: `throwChar` lands in front of them (its
	 * `Actor.findChar` step-back), they do not absorb the throw. */
	readonly occupied: (x: number, y: number) => boolean;
	/** Rooted or IMMOVABLE targets do not move at all (`WandOfBlastWave.throwChar`). */
	readonly immovable: boolean;
}

/** `DM300.dropRocks()`'s opening knockback (`DM300.java`, tag `v3.3.8`), planned pure.
 * Power 2 when the target is adjacent, 1 when it is 2 cells away in view, 0 (no
 * knockback) otherwise - the caller owns that adjacency/view gate and passes the power.
 * `throwChar` is pure displacement here (`collideDmg = false`, so no collision damage;
 * the BOSS power-halving cannot trigger on the hero, the only target this port throws),
 * and the returned landing cell is Java's `rockCenter`: the 7x7 below must be centered
 * on it, not on the target's pre-throw cell. The ray uses the same greedy Chebyshev
 * stepping as `dm300VentPath` (no ballistics primitive exists); stopping before the
 * first blocked or occupied cell reproduces `throwChar`'s landing in every case -
 * Java computes the full trajectory first and then steps back one cell when the
 * landing itself is occupied, which lands on the same last-free cell. */
export function planDM300Knockback(
	dm300: Step,
	target: Step,
	power: 0 | 1 | 2,
	context: DM300KnockbackContext,
): Step {
	if (power === 0 || context.immovable) return { ...target };
	let at = { ...target };
	for (let i = 0; i < power; i++) {
		const nx = at.x + Math.sign(at.x - dm300.x), ny = at.y + Math.sign(at.y - dm300.y);
		if (nx === at.x && ny === at.y) break;
		if (context.blocked(nx, ny) || context.occupied(nx, ny)) break;
		at = { x: nx, y: ny };
	}
	return at;
}

/** `DM300.java`'s 7x7 rockfall selection, including its one randomly safe neighbour and
 * 1/distance inclusion roll. The delayed landing and damage remain scene-owned.
 * Java centers the 7x7 on the post-knockback `rockCenter` (see `planDM300Knockback`) -
 * pass that landing cell as `center`, not the target's pre-throw cell. Java's safe-cell
 * search retries uncapped (`do/while`); this port tries 20 offsets and then fires with
 * no safe cell rather than hanging a turn on a fully walled-in center. */
export function planDM300Rockfall(
	center: Step,
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
		const at = { x: center.x + dx, y: center.y + dy };
		if (!inside(at.x, at.y) || (at.x === dm300.x && at.y === dm300.y)) continue;
		if (!passable(at.x, at.y) && random.int(0, 2) === 0) continue;
		safe = at;
		break;
	}
	const cells: Step[] = [];
	for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
		const at = { x: center.x + dx, y: center.y + dy };
		if (!inside(at.x, at.y) || !passable(at.x, at.y)) continue;
		if (safe && at.x === safe.x && at.y === safe.y) continue;
		const distance = Math.max(Math.abs(dx), Math.abs(dy));
		if (distance <= 1 || random.int(0, distance) === 0) cells.push(at);
	}
	return { cells, safe };
}
