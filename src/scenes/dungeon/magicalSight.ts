import { MAGICAL_SIGHT_DISTANCE, magicalSightCells } from '../../simulation/magicalSight';
import type { DungeonScene } from '../dungeonScene';

/**
 * `Level.updateFieldOfView()`'s MagicalSight `sense` circle (`levels/Level.java:1349-1405`, tag `v3.3.8`):
 * while the buff is up every discoverable cell within 12 of the hero is added to the field of view,
 * through walls and remembered like any seen cell. Run right after `fov.update()`. `discoverable`
 * is `Level.buildFlagMaps()`' "not solid rock cut off from open floor": here a passable cell or one
 * with a passable 8-neighbour.
 */
export function applyMagicalSight(scene: DungeonScene): void {
	if (scene.hero.buffs['magicalSight'] === undefined) return;
	const { level, fov, hero } = scene;
	const open = (x: number, y: number) => level.inside(x, y) && level.passable(x, y);
	const discoverable = (x: number, y: number) => {
		for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (open(x + dx, y + dy)) return true;
		return false;
	};
	for (const cell of magicalSightCells(level.width, level.height, hero.x, hero.y, MAGICAL_SIGHT_DISTANCE, discoverable)) {
		fov.visible.add(cell);
		fov.explored.add(cell);
	}
}
