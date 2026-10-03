import type { DungeonScene } from '../dungeonScene';

/**
 * `ScrollOfChallenge.ChallengeArena` (`items/scrolls/exotic/ScrollOfChallenge.java`, tag `v3.3.8`): the cells around the reader,
 * kept beside the scene (the buff itself is the hero's `challengeArena` timer, 100 turns). The buff ends when the hero steps out
 * of the arena, and on a floor change (`Level.restoreItemsFromBundle`'s arena detach - here the stored depth no longer matches).
 */
const arenas = new WeakMap<object, { depth: number; cells: Set<number> }>();

export const CHALLENGE_DAMAGE_FACTOR = 0.67;

/** `ChallengeArena.setup(pos)`: radius 1 on boss floors 5/10/20 (Java's own list) or when fewer than 30 cells are in view, 3 at 100+, else 2. */
export function setupChallengeArena(scene: DungeonScene): void {
	const { hero, level } = scene;
	let dist = 2;
	if (scene.depth === 5 || scene.depth === 10 || scene.depth === 20) dist = 1;
	else {
		//`ShadowCaster.castShadow(.., 8)` counts the cells the reader could see within 8; the hero's current field of view, cut to
		//that circle, is the same set (Java's caster is not re-run here).
		let count = 0;
		for (const key of scene.fov.visible) {
			const x = key % level.width, y = Math.floor(key / level.width);
			if (Math.hypot(x - hero.x, y - hero.y) <= 8) count++;
		}
		dist = count < 30 ? 1 : count >= 100 ? 3 : 2;
	}
	//`PathFinder.buildDistanceMap(pos, passable | avoid, dist)`: every cell within `dist` steps over passable ground.
	const cells = new Set<number>([hero.y * level.width + hero.x]);
	let frontier = [[hero.x, hero.y]] as Array<[number, number]>;
	for (let step = 0; step < dist; step++) {
		const next: Array<[number, number]> = [];
		for (const [x, y] of frontier) {
			for (let dy = -1; dy <= 1; dy++) {
				for (let dx = -1; dx <= 1; dx++) {
					const nx = x + dx, ny = y + dy;
					if (!level.inside(nx, ny) || !level.passable(nx, ny) || cells.has(ny * level.width + nx)) continue;
					cells.add(ny * level.width + nx);
					next.push([nx, ny]);
				}
			}
		}
		frontier = next;
	}
	arenas.set(scene, { depth: scene.depth, cells });
}

/** `ChallengeArena.act()`: detach once the hero stands outside the arena (the 100-turn countdown is the buff's own timer). */
export function tickChallengeArena(scene: DungeonScene): void {
	if (scene.hero.buffs['challengeArena'] === undefined) return;
	const arena = arenas.get(scene);
	const { hero, level } = scene;
	if (!arena || arena.depth !== scene.depth || !arena.cells.has(hero.y * level.width + hero.x)) {
		delete hero.buffs['challengeArena'];
		arenas.delete(scene);
	}
}
