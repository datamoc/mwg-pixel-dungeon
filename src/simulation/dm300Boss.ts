import type { Step } from './combatState';
import type { SimulationRandom } from './random';
import { chebyshevDistance } from './combatState';

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
		const distance = chebyshevDistance(at, center);
		if (distance <= 1 || random.int(0, distance) === 0) cells.push(at);
	}
	return { cells, safe };
}

/**
 * DM300 supercharge-entry decision - the pure predicate half of `DM300.damage()`'s
 * threshold branch (actors/mobs/DM300.java 496-506, tag `v3.3.8`). Two damage call sites
 * (`runBossDamageHooks` in attackSeams.ts and the dispatch tail in combatResolution.ts)
 * carried the same inline threshold; both now run this seam, the way `mobLootChance()` did
 * for the loot decision. Behavior-identical: the same expression, same order.
 *
 * Java combines the threshold from HT with *integer* division (`HT/4*(3-pylons)` on the
 * challenge, `HT/3*(2-pylons)` otherwise) and enters at `HP <= threshold && threshold > 0`,
 * clamping HP back up to the threshold; the supercharge itself (`supercharged = true`,
 * `pylonsActivated++`, pylon activation, yells) stays scene-side in `dm300Supercharge`.
 * The port carries the division in float (existing shape, preserved here): with integer HP
 * the entry fires on the same hits, but the clamp can leave a fractional HP where Java
 * leaves the integer threshold.
 */
export function dm300SuperchargeThreshold(maxHp: number, pylonsActivated: number, strongerBosses: boolean): number {
	return strongerBosses ? maxHp / 4 * (3 - pylonsActivated) : maxHp / 3 * (2 - pylonsActivated);
}

/** Supercharge entry: not currently charged, a live threshold, HP at or under it. */
export function dm300SuperchargeEntry(supercharged: boolean | undefined, hp: number, threshold: number): boolean {
	return !supercharged && threshold > 0 && hp <= threshold;
}
/**
 * DM300's ability-cycle floor (`DM300.java`, tag `v3.3.8`): `MIN_COOLDOWN` is 5.
 */
export const DM300_MIN_COOLDOWN = 5;

/** `DM300.loseSupercharge()`'s counter clamp: the boss cannot fire the very turn the
 * charge ends (`Math.min(turnsSinceLastAbility, MIN_COOLDOWN-3)`). */
export function dm300ChargeEndTurns(turnsSinceLastAbility: number): number {
	return Math.min(turnsSinceLastAbility, DM300_MIN_COOLDOWN - 3);
}

/** `DM300.totalPylonsToActivate()` and the `loseSupercharge()` finale gate (tag `v3.3.8`). */
export function dm300PylonsFinished(pylonsActivated: number, strongerBosses: boolean): boolean {
	return pylonsActivated >= (strongerBosses ? 3 : 2);
}

export type DM300PylonEnergyTerrain = 'water' | 'inactiveTrap' | 'sign' | 'other';

/** `CavesBossLevel.activatePylon()` (`CavesBossLevel.java`, tag `v3.3.8`) seeds
 * PylonEnergy from `(mainArena.top - 1) * width`; mainArena.top is 14, so direct
 * seeds start at row 13. Water above that row is not seeded by this method. */
export function dm300PylonEnergySeeds(
	width: number,
	height: number,
	terrainAt: (cell: number) => DM300PylonEnergyTerrain,
): number[] {
	const cells: number[] = [];
	const start = 13 * width;
	for (let cell = start; cell < width * height; cell++) {
		const terrain = terrainAt(cell);
		if (terrain === 'water' || terrain === 'inactiveTrap' || terrain === 'sign') cells.push(cell);
	}
	return cells;
}

/** `CavesBossLevel.diggableArea` (`Rect(2, 11, 31, 40)`) and `gate` (`Rect(14, 13, 19, 14)`),
 * `levels/CavesBossLevel.java:109,111`, tag `v3.3.8`, in `Rect`'s exclusive right/bottom form. */
export const CAVES_DIGGABLE_AREA = { left: 2, top: 11, right: 31, bottom: 40 } as const;
export const CAVES_BOSS_GATE = { left: 14, top: 13, right: 19, bottom: 14 } as const;

/** `PathFinder.NEIGHBOURS8` / `NEIGHBOURS9` in Java's row-major order: ties in the strict
 * "closer than best" scans below resolve to the first entry, so the order is observable. */
const NEIGHBOURS8: readonly Step[] = [
	{ x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 }, { x: -1, y: 0 }, { x: 1, y: 0 }, { x: -1, y: 1 }, { x: 0, y: 1 }, { x: 1, y: 1 },
];
const NEIGHBOURS9: readonly Step[] = [...NEIGHBOURS8.slice(0, 4), { x: 0, y: 0 }, ...NEIGHBOURS8.slice(4)];

const trueDistance = (a: Step, b: Step): number => Math.hypot(a.x - b.x, a.y - b.y);

/** Strictly-closest-to-`target` neighbour passing `accept`, starting from the origin itself. */
function closestNeighbour(from: Step, target: Step, accept: (x: number, y: number) => boolean): Step {
	let best = from;
	for (const d of NEIGHBOURS8) {
		const at = { x: from.x + d.x, y: from.y + d.y };
		if (accept(at.x, at.y) && trueDistance(best, target) > trueDistance(at, target)) best = at;
	}
	return best;
}

export interface DM300TunnelContext {
	/** `Actor.findChar(cell) != null`. */
	readonly occupied: (x: number, y: number) => boolean;
	/** `map[cell] == WALL || WALL_DECO` on the paint grid. */
	readonly isWall: (x: number, y: number) => boolean;
	/** `Dungeon.level.openSpace[cell]` once the walls are dug (DM-300 is LARGE). */
	readonly isOpenSpace: (x: number, y: number) => boolean;
}

/**
 * `DM300.getCloser()`'s supercharged tunnelling branch (`DM300.java:603-651`, tag `v3.3.8`), planned
 * pure. The caller owns Java's gate (`super.getCloser` failed, supercharged, HUNTING, not rooted,
 * target neither the origin nor adjacent) and the post-plan effects (`spend(2/3)`, sound, shake).
 * Returns null when no neighbouring cell is strictly closer to the target (Java returns false).
 * Walls inside the arena's gate band (`p.y < gate.bottom`, `gate.left-2 <= p.x < gate.right+2`)
 * or outside `diggableArea` are skipped. Java digs and then reads `openSpace` for the step, so
 * the caller applies `dig` first and only then asks `dm300TunnelMove`.
 */
export function planDM300Tunnel(from: Step, target: Step, ctx: Pick<DM300TunnelContext, 'occupied' | 'isWall'>): { dig: Step[] } | null {
	const best = closestNeighbour(from, target, (x, y) => !ctx.occupied(x, y));
	if (best.x === from.x && best.y === from.y) return null;
	const dig: Step[] = [];
	for (const d of NEIGHBOURS9) {
		const p = { x: from.x + d.x, y: from.y + d.y };
		if (!ctx.isWall(p.x, p.y)) continue;
		const gate = CAVES_BOSS_GATE;
		if (p.y < gate.bottom && p.x >= gate.left - 2 && p.x < gate.right + 2) continue;
		const area = CAVES_DIGGABLE_AREA;
		if (!(p.x >= area.left && p.x < area.right && p.y >= area.top && p.y < area.bottom)) continue;
		dig.push(p);
	}
	return { dig };
}

/** The post-dig `move(bestpos)` cell: closest unoccupied open-space neighbour, or null. */
export function dm300TunnelMove(from: Step, target: Step, ctx: Pick<DM300TunnelContext, 'occupied' | 'isOpenSpace'>): Step | null {
	const best = closestNeighbour(from, target, (x, y) => !ctx.occupied(x, y) && ctx.isOpenSpace(x, y));
	return best.x === from.x && best.y === from.y ? null : best;
}
