import { Roguelike } from 'mwg';
import type { DungeonScene } from '../dungeonScene';
import { FLOOR, GRASS, HIGH_GRASS, EMBERS } from '../../dungeonConstants';
import { Cat, randomUsingDefaults } from '../../items/generator';
import { mwlItemEffectValue } from '../../mwlContent';
import { SpdRandom } from '../../spdRng';
import { Terrain } from '../../spdLevelGen/paintLevel';
import { applyPlantChallengeTerrain } from './plantChallenge';

/** `RegrowthBomb.explode()` (`items/bombs/RegrowthBomb.java:61-114`) uses PathFinder's eight-way solid map,
 * seeds Regrowth volume 10, then calls `Level.plant()` (`levels/Level.java:1021-1051`), tag `v3.3.8`. */
export function growRegrowthBomb(scene: DungeonScene, x: number, y: number, activeChallenges?: ReadonlySet<string>): void {
	const width = scene.level.width;
	const radius = mwlItemEffectValue('regrowthBomb', 'bloomRadius');
	const distances = new Int8Array(width * scene.level.height).fill(-1);
	const start = scene.level.index(x, y);
	const queue = [start];
	distances[start] = 0;
	for (let head = 0; head < queue.length; head++) {
		const cell = queue[head]!;
		const distance = distances[cell]!;
		if (distance >= radius) continue;
		const cx = cell % width, cy = Math.floor(cell / width);
		for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
			const nx = cx + dx, ny = cy + dy;
			if (!scene.level.inside(nx, ny) || !scene.level.passable(nx, ny)) continue;
			const next = nx + ny * width;
			if (distances[next] !== -1) continue;
			distances[next] = distance + 1;
			queue.push(next);
		}
	}

	const candidates: number[] = [];
	for (let cell = 0; cell < distances.length; cell++) {
		if (distances[cell]! < 0) continue;
		const cx = cell % width, cy = Math.floor(cell / width);
		scene.regrowth.seed(cx, cy, 10);
		if (scene.creatureAt(cx, cy) || scene.manualPlants.has(cell) || scene.portedFeatures.kindAt(cell)?.startsWith('plant:')) continue;
		const raw = scene.portedPaint?.map[cell];
		const terrain = scene.level.terrain[cell];
		const eligible = raw !== undefined
			? new Set<number>([Terrain.EMPTY, Terrain.EMPTY_DECO, Terrain.EMBERS, Terrain.GRASS, Terrain.FURROWED_GRASS, Terrain.HIGH_GRASS]).has(raw)
			: new Set<number>([FLOOR, GRASS, HIGH_GRASS, EMBERS]).has(terrain);
		if (eligible) candidates.push(cell);
	}

	const placeSeed = (cell: number, sourceClass: string): void => {
		const cx = cell % width, cy = Math.floor(cell / width);
		const blocked = applyPlantChallengeTerrain(scene, cx, cy, activeChallenges);
		const special = sourceClass === 'Dewcatcher' ? 'dewcatcher'
			: sourceClass === 'Seedpod' ? 'seedpod' : sourceClass === 'Starflower' ? 'starflower' : null;
		const plant = special ?? scene.seedPlantKind(sourceClass);
		if (blocked || !plant) return;
		scene.manualPlants.set(cell, plant);
		scene.placePortedFeature(cell, plant);
	};
	const count = SpdRandom.chances([0, 0, 2, 1]);
	for (let i = 0; i < count && candidates.length > 0; i++) {
		const cell = candidates.splice(SpdRandom.int(candidates.length), 1)[0]!;
		placeSeed(cell, randomUsingDefaults(Cat.SEED).cls);
	}
	if (candidates.length === 0) return;
	const cell = candidates.splice(SpdRandom.int(candidates.length), 1)[0]!;
	const kindRoll = SpdRandom.chances([0, 6, 3, 1]);
	const sourceClass = kindRoll === 2 ? 'Seedpod' : kindRoll === 3 ? 'Starflower' : 'Dewcatcher';
	placeSeed(cell, sourceClass);
}
