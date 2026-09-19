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
 *   neighbour (the blocked share piles onto the middle). Neither blob exists in this
 *   port, so those two shatters stay unwired - see `PORT_COVERAGE.md`.
 *
 * This module is the pure area/volume half; the scene seeds the volumes into its
 * persisted blobs and afflicts the creatures, and the existing blob evolution does
 * the rest. The flood walks the port's `passable` cells as its stand-in for Java's
 * non-solid ones.
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
