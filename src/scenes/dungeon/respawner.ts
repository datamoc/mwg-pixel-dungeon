import { Roguelike, Random } from 'mwg';
import { simulationRandom } from '../../adapters/mwgRandom';
import { simulationRoguelike } from '../../adapters/mwgRoguelike';
import { BOSSES, FLYING_KINDS, mobRosterForDepth, type AnyMonsterId } from '../../monsters';
import { planMonsterPopulation } from '../../simulation/levelPopulation';
import { baseRespawnCooldown, mobCount, respawnMobLimit, respawnStep } from '../../simulation/respawner';
import { ratSkullMultiplier, sundialSpawnMultiplier } from '../../simulation/trinkets';
import { Feeling } from '../../spdLevelGen/regularPainter';
import { genericLargeFeeling } from '../../spdRng';
import type { DungeonScene } from '../dungeonScene';
import { trinketLevelOf } from './trinkets';

/**
 * `Level.respawner` (`levels/Level.java` 690-790, `MobSpawner.java`, tag `v3.3.8`): every `respawnCooldown()` turns (50; 2/3 on a DARK floor; shorter after
 * the Amulet; divided by the Dimensional Sundial's time-of-day multiplier) a new wandering mob appears out of the hero's sight, 12+ steps away, if the floor
 * holds fewer than `mobLimit()` weighted mobs. Boss floors, the last level, the mining branches and floor 1 before the Amulet never respawn
 * (`mobLimit()` is 0 there). Stated differences: Java's actor keeps its remaining time across visits to a floor while this clock restarts on every
 * arrival, the mob comes from a rotation re-rolled when it runs dry (as `createMob()` re-asks `MobSpawner.getMobRotation`) over this port's roster, and the
 * 12-step distance is a breadth-first walk over passable cells rather than `PathFinder.buildDistanceMap(passable | avoid)`.
 */
interface RespawnState { level: object; cooldown: number; rotation: AnyMonsterId[] }
const states = new WeakMap<object, RespawnState>();

function respawnAllowed(scene: DungeonScene): boolean {
	return !(scene.depth in BOSSES) && scene.depth !== 26 && !scene.miningBranchActive && scene.hero.hp > 0;
}

function currentCooldown(scene: DungeonScene): number {
	const base = baseRespawnCooldown({
		amuletObtained: scene.gameState.switch('amuletObtained'), depth: scene.depth, mobCount: mobCount(scene.creatures),
		dark: scene.portedFloorActive && scene.portedPaint?.feeling === Feeling.DARK,
	});
	//`DimensionalSundial.spawnMultiplierAtCurrentTime()`
	return base / sundialSpawnMultiplier(trinketLevelOf(scene, 'trinketDimensionalSundial'), new Date().getHours());
}

/** Advance the respawn clock by one hero action and spawn when it runs out (`MobSpawner.act()`). */
export function tickRespawner(scene: DungeonScene, turnCost: number): void {
	if (!respawnAllowed(scene)) return;
	let state = states.get(scene);
	if (!state || state.level !== scene.level) {
		state = { level: scene.level, cooldown: currentCooldown(scene), rotation: [] };
		states.set(scene, state);
	}
	state.cooldown -= turnCost;
	let guard = 0;
	while (state.cooldown <= 0 && guard++ < 8) {
		const large = (scene.portedFloorActive && scene.portedPaint?.feeling === Feeling.LARGE) || genericLargeFeeling(scene.runSeedLong, scene.depth);
		const limit = respawnMobLimit({ depth: scene.depth, amuletObtained: scene.gameState.switch('amuletObtained'), large, roll: Random.int(0, 3) });
		state.cooldown += respawnStep(mobCount(scene.creatures), limit, currentCooldown(scene), () => spawnMob(scene, state!, 12));
	}
}

/** `Level.spawnMob(disLimit)`: a wandering champion-eligible mob on a free cell out of view and at least `disLimit` steps from the hero. */
function spawnMob(scene: DungeonScene, state: RespawnState, disLimit: number): boolean {
	if (state.rotation.length === 0) {
		state.rotation = planMonsterPopulation(
			scene.depth, mobRosterForDepth(scene.depth),
			(scene.portedFloorActive && scene.portedPaint?.feeling === Feeling.LARGE) || genericLargeFeeling(scene.runSeedLong, scene.depth),
			simulationRandom, simulationRoguelike, ratSkullMultiplier(trinketLevelOf(scene, 'trinketRatSkull')),
		).roster.slice();
	}
	const kind = state.rotation[0]!;
	const { level } = scene;
	const distance = stepDistances(scene);
	for (let tries = 0; tries < 30; tries++) {
		const cell = Random.int(0, level.width * level.height);
		const x = cell % level.width, y = Math.floor(cell / level.width);
		if (!level.passable(x, y) || scene.fov.isVisible(x, y) || scene.creatureAt(x, y)) continue;
		if (scene.isChasmCell(x, y) && !FLYING_KINDS.has(kind)) continue;
		if (scene.portedMobCells.has(cell)) continue;
		if ((distance.get(cell) ?? Infinity) < disLimit) continue;
		state.rotation.shift();
		const mob = scene.spawnMonster(kind, { x, y }, false, undefined, false, undefined, true);
		mob.sleeping = false; //`mob.state = WANDERING`
		return true;
	}
	return false;
}

/** Walking distance (8-neighbour steps over passable ground) from the hero to every reachable cell. */
function stepDistances(scene: DungeonScene): Map<number, number> {
	const { level, hero } = scene;
	const distance = new Map<number, number>([[hero.y * level.width + hero.x, 0]]);
	let frontier = [hero.y * level.width + hero.x];
	while (frontier.length > 0) {
		const next: number[] = [];
		for (const cell of frontier) {
			const x = cell % level.width, y = Math.floor(cell / level.width);
			const d = distance.get(cell)!;
			for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
				const nx = x + dx, ny = y + dy;
				if (!level.inside(nx, ny) || !level.passable(nx, ny)) continue;
				const key = ny * level.width + nx;
				if (distance.has(key)) continue;
				distance.set(key, d + 1);
				next.push(key);
			}
		}
		frontier = next;
	}
	return distance;
}
