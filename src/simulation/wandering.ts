import type { Creature, Step } from '../combat';

export interface WanderingContext {
	width: number;
	height: number;
	cellCount: number;
	passable: (x: number, y: number) => boolean;
	inside: (x: number, y: number) => boolean;
	terrainAt: (x: number, y: number) => number;
	terrainAtCell: (cell: number) => number;
	/** The WATER terrain id, passed as a value - no runtime imports cross the
	 * simulation boundary. */
	waterTerrain: number;
	cellIndex: (x: number, y: number) => number;
	isChasm: (x: number, y: number) => boolean;
	creatureAt: (x: number, y: number) => Creature | null;
	creatures: readonly Creature[];
	hero: Creature;
	/** Eternal-fire cells folded into the blocked set by the scene. */
	blockExtraInto: (blocked: Set<number>) => void;
	/** Uniform pick preserving the caller's RNG stream (`Random.element`). */
	pickElement: (candidates: Step[]) => Step | undefined;
}

/**
 * Blocked cells for unscripted monster steps: every other creature plus
 * eternal-fire cells, with piranhas additionally confined to water. Patrol
 * destinations keep the hero steppable (their validity already excluded
 * occupied cells); last-known pursuit blocks every creature including the hero
 * (a mob cannot step onto its target's cell, matching Java's `getCloser`
 * failing on occupation). Moved here verbatim from the scene as the file-size
 * refactor's thirty-eighth extraction, behavior-identical - the scene only
 * binds its creatures, hero, level and eternal-fire set.
 */
export function wanderBlocked(monster: Creature, blockHeroCell: boolean, ctx: WanderingContext): Set<number> {
	const blocked = new Set(
		ctx.creatures.filter((c) => c !== monster && (blockHeroCell || c !== ctx.hero))
			.map((c) => ctx.cellIndex(c.x, c.y)),
	);
	ctx.blockExtraInto(blocked);
	if (monster.kind === 'piranha' || monster.kind === 'phantomPiranha') {
		const heroCell = ctx.cellIndex(ctx.hero.x, ctx.hero.y);
		for (let cell = 0; cell < ctx.cellCount; cell++) {
			if (ctx.terrainAtCell(cell) !== ctx.waterTerrain && (blockHeroCell || cell !== heroCell)) blocked.add(cell);
		}
	}
	return blocked;
}

/**
 * A retained patrol target stays valid while it is inside, passable,
 * non-chasm and unoccupied - piranhas additionally require water. Moved with
 * the same extraction; the caller re-rolls through `randomPatrolDestination`
 * when this refuses.
 */
export function isPatrolTargetValid(target: Step, isPiranha: boolean, ctx: WanderingContext): boolean {
	return ctx.inside(target.x, target.y)
		&& ctx.passable(target.x, target.y)
		&& !ctx.isChasm(target.x, target.y)
		&& !ctx.creatureAt(target.x, target.y)
		&& (!isPiranha || ctx.terrainAt(target.x, target.y) === ctx.waterTerrain);
}

/**
 * `Level.randomDestination(Mob)`: Java samples any passable cell, while the
 * port also excludes occupied cells so a saved target cannot immediately
 * become an impossible destination. Piranhas use their Java water-only
 * movement restriction. Moved with the same extraction; the pick runs through
 * the context so headless drives script the draw.
 */
export function randomPatrolDestination(isPiranha: boolean, ctx: WanderingContext): Step | undefined {
	const candidates: Step[] = [];
	for (let y = 1; y < ctx.height - 1; y++) for (let x = 1; x < ctx.width - 1; x++) {
		if (ctx.passable(x, y) && !ctx.isChasm(x, y) && !ctx.creatureAt(x, y)
			&& (!isPiranha || ctx.terrainAt(x, y) === ctx.waterTerrain)) {
			candidates.push({ x, y });
		}
	}
	return ctx.pickElement(candidates);
}

export interface FleeStepContext {
	passable: (x: number, y: number) => boolean;
	creatureAt: (x: number, y: number) => Creature | null;
	/** `Roguelike.neighbourOffsets(8)`, passed as data - no runtime imports
	 * cross the simulation boundary. */
	neighbourOffsets: readonly (readonly [number, number])[];
	chebyshev: (a: Step, b: Step) => number;
	hero: Step;
	isChasm: (x: number, y: number) => boolean;
}

/**
 * The farthest open neighbouring cell from the hero (`Hunting.getFurther`
 * shape): the shared core of `stepAway` (GnollTrickster/Thief/Spinner/Scorpio
 * retreats) and `fleeCrystalMimic`, which were line-for-line duplicates apart
 * from their tails. Moved here as the file-size refactor's forty-second
 * extraction, behavior-identical - the scene only binds its level, occupants,
 * geometry and hero. Returns null when no neighbour improves, which is also
 * the callers' stay-put signal. **2026-09-21:** candidates now exclude chasm
 * cells too, matching `Dungeon.flee`'s own `findPassable` map (`nearestFreeCell`/
 * `isPatrolTargetValid` already had this gate; a retreating monster could
 * target a chasm cell here that `moveTo` then silently refused, wasting the
 * turn instead of actually retreating).
 */
export function fleeStep(from: Step, ctx: FleeStepContext): Step | null {
	let best: Step | null = null;
	let bestD = ctx.chebyshev(from, ctx.hero);
	for (const [dx, dy] of ctx.neighbourOffsets) {
		const at = { x: from.x + dx, y: from.y + dy };
		if (!ctx.passable(at.x, at.y) || ctx.creatureAt(at.x, at.y) || ctx.isChasm(at.x, at.y)) continue;
		const d = ctx.chebyshev(at, ctx.hero);
		if (d > bestD) {
			bestD = d;
			best = at;
		}
	}
	return best;
}

/** The flee-step reads plus the `inside` gate the summon search needs. */
export interface SummonCellContext extends FleeStepContext {
	inside: (x: number, y: number) => boolean;
}

/**
 * Closest free cell to the hero among a center plus its neighbours: the shared
 * core of the EarthGuardian summon placement (which admits the zap target's
 * own cell) and the Yog-minion summon placement (neighbours only). Moved here
 * as the file-size refactor's forty-fourth extraction, behavior-identical -
 * the scene only binds its level, occupants, geometry and hero. Returns
 * undefined when nothing is free, which is also the callers' refuse signal.
 */
export function nearestFreeCell(center: Step, includeCenter: boolean, ctx: SummonCellContext): Step | undefined {
	const cells = (includeCenter ? [center] : []).concat(
		ctx.neighbourOffsets.map(([dx, dy]) => ({ x: center.x + dx, y: center.y + dy })),
	);
	return cells
		.filter((at) => ctx.inside(at.x, at.y) && ctx.passable(at.x, at.y) && !ctx.isChasm(at.x, at.y) && !ctx.creatureAt(at.x, at.y))
		.sort((a, b) => ctx.chebyshev(ctx.hero, a) - ctx.chebyshev(ctx.hero, b))[0];
}
