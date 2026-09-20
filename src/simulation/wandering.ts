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
	if (monster.kind === 'piranha') {
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
