import type { DungeonScene } from '../dungeonScene';
import { WALL } from '../../dungeonConstants';
import { Terrain } from '../../spdLevelGen/paintLevel';
import { HERO_LOCK_ID } from './hero/skeletonKeyScene';
import { explorePercentOf, type ExploreHeap, type ExploreRoom } from '../../explorePercent';

/**
 * `RegularLevel.levelExplorePercent(depth)` (tag `v3.3.8`): gather this floor's
 * exploration evidence and run Java's missed-rooms algebra (`explorePercentOf`),
 * reached through the `DungeonScene.levelExplorePercent` handle that
 * `snapshotFloorExplored` uses.
 *
 * Java-only machinery stated as reductions: `Heap.seen` stands in for the cell's
 * explored state, and Java flags every runtime `GameScene.add()` heap `autoExplored`
 * (`GameScene.java:1131-1136`) while only levelgen's own notes carry over here (the
 * crystal-choice chest, parsed at placement). Secret doors read as their concealed
 * game terrain plus `secretDoorCells` (the port has no `Terrain.SECRET_DOOR` id) and
 * stop counting once searched; locked doors read the live `doors` registry, skipping
 * crystal and hero locks (Java scans `LOCKED_DOOR` only - `CRYSTAL_DOOR` and
 * `HERO_LKD_DR` are separate terrains there too); barricades read `portedPaint`,
 * which the burn paths mutate as they destroy them. The vanilla fallback generator
 * places none of these and its rooms carry no labels, so those lookups no-op there.
 *
 * A free function over the scene (`plantChallenge.ts`'s shape) rather than a
 * `coreSpawnTiles` mixin method, to keep that file inside its 2,000-line budget.
 */
export function levelExplorePercent(scene: DungeonScene, depth: number): number {
	const rooms: ExploreRoom[] = scene.level.rooms.map((room) => ({
		left: room.left,
		top: room.top,
		right: room.right,
		bottom: room.bottom,
		//Only the ported generator's rooms carry a `gameBridge` label.
		label: (room as { label?: string }).label ?? '',
	}));
	const heaps: ExploreHeap[] = scene.groundItems.map((ground) => ({
		x: ground.x,
		y: ground.y,
		seen: scene.fov.explored.has(scene.level.index(ground.x, ground.y)),
		autoExplored: ground.autoExplored ?? false,
		openable: ground.chest === 'normal' || ground.chest === 'locked',
		itemKind: ground.item?.id,
	}));
	const blockedCells: { x: number; y: number }[] = [];
	for (let y = 0; y < scene.level.height; y++) {
		for (let x = 0; x < scene.level.width; x++) {
			const cell = scene.level.index(x, y);
			const game = scene.level.get(x, y);
			const paint = scene.portedPaint?.map[cell];
			const locked = scene.doors.isLocked(x, y)
				&& scene.doors.requiredKey(x, y) !== HERO_LOCK_ID
				&& !scene.crystalDoorCells.has(cell);
			if (locked || paint === Terrain.BARRICADE || (game === WALL && scene.secretDoorCells.has(cell))) {
				blockedCells.push({ x, y });
			}
		}
	}
	let liveLevelGenStatue = false;
	const liveMimics: { x: number; y: number }[] = [];
	for (const creature of scene.creatures) {
		if (creature.isHero || creature.isAlly || creature.hp <= 0) continue;
		if (creature.kind === 'statue' || creature.kind === 'armoredStatue') liveLevelGenStatue = true;
		else if (creature.kind === 'mimic') liveMimics.push({ x: creature.x, y: creature.y });
	}
	return explorePercentOf({
		rooms,
		heaps,
		eternalFireBurning: scene.eternalFire.total() > 0,
		sacrificialFireBurning: scene.sacrificialFire.total() > 0,
		liveLevelGenStatue,
		liveMimics,
		blockedCells,
		unusedCrystalKey: scene.bag.items.some((entry) => entry.id === 'crystalKey'
			&& (entry as { depth?: number }).depth === depth),
	});
}
