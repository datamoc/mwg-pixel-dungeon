/**
 * Brew shatter areas (`items/potions/brews`, tag `v3.3.8`; live tree - the brew
 * family is unchanged there). Two shapes:
 *
 * - `ShockingBrew.shatter()` / `CausticBrew.shatter()`: `PathFinder.buildDistanceMap(cell,
 *   not solid, 3)` - every cell reachable within 3 steps through non-solid cells, center
 *   included. Shocking seeds `Electricity` 20 per cell; Caustic afflicts every char found
 *   with `Ooze` (`Ooze.DURATION` 20) and seeds nothing.
 * - `InfernalBrew.shatter()` / `BlizzardBrew.shatter()`: every non-solid NEIGHBOURS8 cell
 *   gets 120 of `Inferno`/`Blizzard`, and the center gets 120 plus 120 more per solid
 *   neighbour (the blocked share piles onto the middle). Both blobs are modeled, so all
 *   four shatters resolve - see `PORT_COVERAGE.md`.
 *
 * This module is the pure area/volume half; the throw/aim/shatter flow below hands the
 * scene the volumes to seed into its persisted blobs and the creatures to afflict, and
 * the existing blob evolution does the rest. The flood walks the port's `passable`
 * cells as its stand-in for Java's non-solid ones.
 *
 * The throw/aim/shatter flow itself lives here too, behind `BrewFlowContext` - the
 * file-size refactor's fifteenth extraction, behavior-identical.
 */

/** Cells within `radius` steps of (`cx`, `cy`) through non-solid cells, center first. */
export function brewShatterCells(
	width: number,
	height: number,
	isSolid: (x: number, y: number) => boolean,
	cx: number,
	cy: number,
	radius: number,
): { x: number; y: number }[] {
	const seen = new Set<number>([cy * width + cx]);
	let frontier = [{ x: cx, y: cy }];
	const out = [{ x: cx, y: cy }];
	for (let step = 0; step < radius; step++) {
		const next: { x: number; y: number }[] = [];
		for (const cell of frontier) {
			//`PathFinder.buildDistanceMap` walks `dirLR` - all eight neighbours, one
			//step each, with edge guards against wraparound (the bounds check here).
			for (let dy = -1; dy <= 1; dy++) {
				for (let dx = -1; dx <= 1; dx++) {
					if (dx === 0 && dy === 0) continue;
					const x = cell.x + dx, y = cell.y + dy;
					if (x < 0 || y < 0 || x >= width || y >= height || isSolid(x, y)) continue;
					const key = y * width + x;
					if (seen.has(key)) continue;
					seen.add(key);
					next.push({ x, y });
					out.push({ x, y });
				}
			}
		}
		frontier = next;
	}
	return out;
}

/** `ShockingBrew.shatter()`: electricity 20 per cell over a radius-3 map. */
export const SHOCKING_BREW_RADIUS = 3;
export const SHOCKING_BREW_VOLUME = 20;

/** `CausticBrew.shatter()`: the same radius-3 map, afflicting instead of seeding. */
export const CAUSTIC_BREW_RADIUS = 3;

/**
 * `InfernalBrew.shatter()` / `BlizzardBrew.shatter()`: 120 per open NEIGHBOURS8 cell;
 * the center takes 120 plus 120 per solid neighbour.
 */
export function brewNeighbourSeedPlan(
	isSolid: (x: number, y: number) => boolean,
	cx: number,
	cy: number,
	volume: number,
): { seeds: { x: number; y: number; volume: number }[]; centerVolume: number } {
	const seeds: { x: number; y: number; volume: number }[] = [];
	let centerVolume = volume;
	for (let dy = -1; dy <= 1; dy++) {
		for (let dx = -1; dx <= 1; dx++) {
			if (dx === 0 && dy === 0) continue;
			if (isSolid(cx + dx, cy + dy)) centerVolume += volume;
			else seeds.push({ x: cx + dx, y: cy + dy, volume });
		}
	}
	return { seeds, centerVolume };
}

/** `InfernalBrew` / `BlizzardBrew`: 120 per cell, center included. */
export const INFERNO_BREW_VOLUME = 120;
export const BLIZZARD_BREW_VOLUME = 120;

/** `PotionOfShroudingFog.shatter()`: 180 per open NEIGHBOURS8 cell; the center takes
 * 180 plus 180 per solid neighbour - the same `brewNeighbourSeedPlan` shape as the two
 * brews above, seeding `SmokeScreen` instead of Inferno/Blizzard. */
export const SHROUDING_FOG_VOLUME = 180;

/**
 * Brews are always known (`Brew.isKnown()` returns true) and throw-only
 * (`actions()` drops `AC_DRINK`, `defaultAction()` is `AC_THROW`). All four shatters
 * resolve: Shocking (electricity), Caustic (ooze), Infernal and Blizzard (their blobs).
 */
export const THROWABLE_BREW_IDS = new Set(['shockingBrew', 'causticBrew', 'infernalBrew', 'blizzardBrew']);

/** A creature where the brew flow needs one: Caustic spares NPCs, like every area effect. */
export interface BrewCreatureView {
	isNPC?: boolean | undefined;
}

/** Which persisted blob a shatter seeds. */
export type BrewBlobKind = 'inferno' | 'blizzard' | 'electricity';

/**
 * The brew throw/aim/shatter flow, moved out of the scene behind this context the way
 * the item flows moved into `items/` - behavior-identical, with the scene keeping one
 * builder plus the `useBrew` adapter the item-use router calls. Blob seeding, the ooze
 * affliction and the pending-aim cell stay scene-side; this flow only decides them.
 */
export interface BrewFlowContext {
	readonly levelSize: { width: number; height: number };
	hasBrew(brewId: string, instanceId?: string): boolean;
	consumeBrew(brewId: string, instanceId?: string): void;
	beginAim(opts: { range: number; validate: (cell: { x: number; y: number }) => boolean; onConfirm: (cell: { x: number; y: number }) => void }): void;
	canTargetCell(x: number, y: number): boolean;
	isSolid(x: number, y: number): boolean;
	get pendingTarget(): { x: number; y: number } | null;
	set pendingTarget(cell: { x: number; y: number } | null);
	creatureAt(x: number, y: number): BrewCreatureView | null;
	afflictOoze(creature: BrewCreatureView): void;
	seedBlob(kind: BrewBlobKind, x: number, y: number, volume: number): void;
	spendTurn(): void;
}

/** `Brew.doThrow()` + the default `AC_THROW`: brews cannot be drunk (`actions()` drops
 *  `AC_DRINK`) and are always known (`isKnown()` true). Only the brews whose shatter
 *  this port can resolve are offered (see `THROWABLE_BREW_IDS`). The aim gate and range
 *  are the bomb's (passable, non-chasm, six cells); Java flies the full PROJECTILE line.
 *  A confirmed aim re-enters here with the cell pending, so the throw resolves at once. */
export function useBrewFlow(ctx: BrewFlowContext, brewId: string, instanceId?: string): void {
	if (!THROWABLE_BREW_IDS.has(brewId) || !ctx.hasBrew(brewId, instanceId)) return;
	if (!ctx.pendingTarget) {
		ctx.beginAim({
			range: 6,
			validate: (cell) => ctx.canTargetCell(cell.x, cell.y),
			onConfirm: (cell) => {
				ctx.pendingTarget = cell;
				useBrewFlow(ctx, brewId, instanceId);
			},
		});
		return;
	}
	const target = ctx.pendingTarget;
	ctx.pendingTarget = null;
	shatterBrewFlow(ctx, brewId, target, instanceId);
}

/** `ShockingBrew.shatter()` / `CausticBrew.shatter()` / `InfernalBrew.shatter()` /
 *  `BlizzardBrew.shatter()`: one brew detaches and breaks at the aimed cell. Shocking
 *  seeds electricity 20 over the radius-3 flood; Caustic lays `Ooze` (duration 20, the
 *  table value matching `Ooze.DURATION`) on every non-NPC creature in the same flood -
 *  NPCs stay out of every area effect here, the way the fireblast cone already
 *  documents. Infernal/Blizzard seed 120 per open NEIGHBOURS8 cell with 120 plus 120
 *  per solid neighbour onto the center. Java's splash particles and shatter sounds
 *  have no seam here, and Java logs nothing either way. Spends the turn. */
export function shatterBrewFlow(ctx: BrewFlowContext, brewId: string, at: { x: number; y: number }, instanceId?: string): void {
	ctx.consumeBrew(brewId, instanceId);
	if (brewId === 'infernalBrew' || brewId === 'blizzardBrew') {
		const kind: BrewBlobKind = brewId === 'infernalBrew' ? 'inferno' : 'blizzard';
		const volume = brewId === 'infernalBrew' ? INFERNO_BREW_VOLUME : BLIZZARD_BREW_VOLUME;
		const plan = brewNeighbourSeedPlan((x, y) => ctx.isSolid(x, y), at.x, at.y, volume);
		for (const seed of plan.seeds) ctx.seedBlob(kind, seed.x, seed.y, seed.volume);
		ctx.seedBlob(kind, at.x, at.y, plan.centerVolume);
		ctx.spendTurn();
		return;
	}
	const radius = brewId === 'causticBrew' ? CAUSTIC_BREW_RADIUS : SHOCKING_BREW_RADIUS;
	const flood = brewShatterCells(ctx.levelSize.width, ctx.levelSize.height,
		(x, y) => ctx.isSolid(x, y), at.x, at.y, radius);
	if (brewId === 'causticBrew') {
		for (const cell of flood) {
			const target = ctx.creatureAt(cell.x, cell.y);
			if (target && !target.isNPC) ctx.afflictOoze(target);
		}
	} else {
		for (const cell of flood) ctx.seedBlob('electricity', cell.x, cell.y, SHOCKING_BREW_VOLUME);
	}
	ctx.spendTurn();
}
