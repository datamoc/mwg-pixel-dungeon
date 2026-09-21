import { DOOR, DOOR_CLOSED, FLOOR, GRASS, HIGH_GRASS, WALL, WATER, TERRAIN_FRAME } from '../dungeonConstants';
import { Terrain } from '../spdLevelGen/paintLevel';
import { foregroundGrassFrame, raisedWallFrame, upperWallFrame } from '../spdLevelGen/visualWalls';
import type { Step } from '../combat';

export interface DungeonTileFrameContext {
	width: number;
	height: number;
	tileVariance: ArrayLike<number>;
	terrainAt: (x: number, y: number) => number;
	visualTerrainAt: (x: number, y: number) => number;
	rawTerrainAt: (x: number, y: number) => number | undefined;
	inside: (x: number, y: number) => boolean;
}

export function terrainFrameAt(context: DungeonTileFrameContext, x: number, y: number): number {
	const kind = context.terrainAt(x, y);
	if (kind === WATER) return -1;
	const cell = x + y * context.width;
	const raw = context.visualTerrainAt(x, y);
	//`DungeonTileSheet` exit visuals (tag `v2.1.4`, which this sheet follows -
	//`FLAT_WALLS` is `xy(1, 5)` = 64 there, so UNLOCKED_EXIT is 64+12 = 76 and
	//LOCKED_EXIT is 64+13 = 77; v3.3.8 moved both rows, these numbers are not it).
	if (raw === 21) return 77;
	if (raw === 22) return 76;
	const variance = context.tileVariance[cell] ?? 0;
	//`commonAltVisuals`/`rareAltVisuals` (tag `v2.1.4`): FLOOR 0 -> 6 (rare 12),
	//FLOOR_DECO 1 -> 7, GRASS 2 -> 8, EMBERS 3 -> 9, FLOOR_SP 4 -> 10,
	//RAISED_HIGH_GRASS 149 -> 153, RAISED_FURROWED_GRASS 150 -> 154.
	const alternate = (frame: number): number => {
		if (frame === 0 && variance >= 95) return 12;
		const common: Record<number, number> = { 0: 6, 1: 7, 2: 8, 3: 9, 4: 10, 149: 153, 150: 154 };
		return variance >= 50 ? common[frame] ?? frame : frame;
	};
	const wall = raisedWallFrame(context.visualTerrainAt, x, y, variance);
	if (wall !== undefined) return wall;
	if (kind === HIGH_GRASS) return alternate(149);
	if (kind === GRASS) return alternate(2);
	const rawTerrain = context.rawTerrainAt(x, y);
	//Trampled grass keeps the coarse `highGrass` kind (see `gameBridge.ts`), so it
	//reaches here past the branch above: `DungeonTerrainTilemap` (tag `v2.1.4`)
	//draws it as RAISED_FURROWED_GRASS with alts, not as plain floor.
	if (rawTerrain === Terrain.FURROWED_GRASS) return alternate(150);
	if (rawTerrain !== undefined) {
		const direct: Record<number, number> = { 3: 19, 7: 16, 8: 17, 9: 3, 11: 20, 14: 4, 20: 1, 21: 77, 24: 18 };
		if (direct[rawTerrain] !== undefined) return alternate(direct[rawTerrain]);
		const raised: Record<number, number> = { 13: 148, 23: 144, 25: 145, 26: 146, 28: 147 };
		if (raised[rawTerrain] !== undefined) return raised[rawTerrain];
		if (rawTerrain === Terrain.CHASM) {
			const above = y > 0 ? context.rawTerrainAt(x, y - 1) ?? -1 : -1;
			if (above === Terrain.WATER) return 52;
			if ([Terrain.EMPTY_SP, Terrain.STATUE_SP].includes(above as 14 | 26)) return 50;
			if ([Terrain.WALL, Terrain.WALL_DECO, Terrain.DOOR, Terrain.LOCKED_DOOR, Terrain.SECRET_DOOR].includes(above as 4 | 12 | 5 | 10 | 16)) return 51;
			return above !== -1 && above !== Terrain.CHASM ? 49 : 48;
		}
	}
	return alternate(TERRAIN_FRAME.floor);
}

export function waterFrames(context: DungeonTileFrameContext): number[] {
	//`DungeonTileSheet.waterStitcheable` (tag `v2.1.4`, which this sheet follows):
	//EMPTY 1, GRASS 2, EMPTY_WELL 3, ENTRANCE 7, EXIT 8, EMBERS 9, BARRICADE 13,
	//HIGH_GRASS 15, FURROWED_GRASS 30, SECRET_TRAP 17, TRAP 18, INACTIVE_TRAP 19,
	//EMPTY_DECO 20, SIGN 23, WELL 24, STATUE 25, ALCHEMY 28, DOOR 5, OPEN_DOOR 6,
	//LOCKED_DOOR 10, CRYSTAL_DOOR 31. A water cell next to trampled grass missed
	//its shoreline bit before 30 joined this set.
	const dry = new Set<number>([1, 2, 3, 7, 8, 9, 13, 15, 17, 18, 19, 20, 23, 24, 25, 28, 30, 5, 6, 10, 31]);
	const frames: number[] = [];
	for (let y = 0; y < context.height; y++) for (let x = 0; x < context.width; x++) {
		if (context.terrainAt(x, y) !== WATER) { frames.push(-1); continue; }
		let mask = 0;
		[[0, -1], [1, 0], [0, 1], [-1, 0]].forEach(([dx, dy], i) => {
			if (!context.inside(x + dx, y + dy)) return;
			const raw = context.rawTerrainAt(x + dx, y + dy);
			const kind = context.terrainAt(x + dx, y + dy);
			if (raw === undefined ? kind !== WATER && kind !== WALL : dry.has(raw)) mask |= 1 << i;
		});
		frames.push(mask ? 32 + mask : -1);
	}
	return frames;
}

export function wallFrameAt(context: DungeonTileFrameContext, x: number, y: number): number {
	return upperWallFrame(context.visualTerrainAt, x, y, y + 1 < context.height ? context.tileVariance[x + (y + 1) * context.width] ?? 0 : 0);
}

export function foregroundGrassFrames(context: DungeonTileFrameContext): number[] {
	return Array.from(context.tileVariance, (variance, cell) => foregroundGrassFrame(
		context.visualTerrainAt(cell % context.width, Math.floor(cell / context.width)), variance));
}

export function terrainFrames(context: DungeonTileFrameContext): number[] {
	const frames: number[] = [];
	for (let y = 0; y < context.height; y++) for (let x = 0; x < context.width; x++) frames.push(terrainFrameAt(context, x, y));
	return frames;
}

export function wallFrames(context: DungeonTileFrameContext): number[] {
	const frames: number[] = [];
	for (let y = 0; y < context.height; y++) for (let x = 0; x < context.width; x++) frames.push(wallFrameAt(context, x, y));
	return frames;
}
