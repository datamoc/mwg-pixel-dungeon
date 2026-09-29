import { isPlantBlocked } from '../../challenges';
import { EMBERS, FLOOR, GRASS, HIGH_GRASS } from '../../dungeonConstants';
import type { DungeonScene } from '../dungeonScene';
import { Terrain } from '../../spdLevelGen/paintLevel';

/** Java Level.plant(seed,pos) converts eligible terrain before returning under NO_HERBALISM. */
export function applyPlantChallengeTerrain(scene: DungeonScene, x: number, y: number, activeChallenges?: ReadonlySet<string>): boolean {
	if (!isPlantBlocked(activeChallenges)) return false;
	const cell = scene.level.index(x, y);
	const raw = scene.portedPaint?.map[cell];
	const plantable = raw === undefined
		? new Set<number>([FLOOR, HIGH_GRASS, EMBERS]).has(scene.level.get(x, y)) || scene.furrowedGrass.has(cell)
		: new Set<number>([Terrain.HIGH_GRASS, Terrain.FURROWED_GRASS, Terrain.EMPTY, Terrain.EMBERS, Terrain.EMPTY_DECO]).has(raw);
	if (plantable) {
		scene.level.set(x, y, GRASS);
		if (scene.portedPaint && raw !== undefined) scene.portedPaint.map[cell] = Terrain.GRASS;
		scene.furrowedGrass.delete(cell);
		scene.restitchTilesAround(x, y);
	}
	return true;
}
