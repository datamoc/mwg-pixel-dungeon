// Pins `scenes/dungeonGridFrames.ts` (`GridTileMap.getTileVisual`, tag `v3.3.8`): checkerboard of floor cells at frame `setting`,
// doors at 4+setting (12+setting under a stitched wall), nothing for walls or when the grid is off (-1).
import { gridFrames } from '../src/scenes/dungeonGridFrames';
import { Terrain } from '../src/spdLevelGen/paintLevel';

let failed = 0;
const check = (name: string, ok: boolean): void => { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed++; };

// 4x3 map: row 0 wall; row 1 floor, door(under wall), grass, water; row 2 wall deco below, high grass, empty, wall
const W = 4, H = 3;
const map = [
	Terrain.WALL, Terrain.WALL, Terrain.WALL, Terrain.WALL,
	Terrain.EMPTY, Terrain.DOOR, Terrain.GRASS, Terrain.WATER,
	Terrain.WALL_DECO, Terrain.HIGH_GRASS, Terrain.EMPTY, Terrain.WALL,
];
const context = {
	width: W, height: H, tileVariance: new Array(W * H).fill(0),
	terrainAt: () => 0, visualTerrainAt: (x: number, y: number) => map[x + y * W]!,
	rawTerrainAt: (x: number, y: number) => (x >= 0 && y >= 0 && x < W && y < H ? map[x + y * W] : undefined),
	inside: (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H,
};
const at = (frames: number[], x: number, y: number): number => frames[x + y * W]!;

const off = gridFrames(context, -1);
check('grid off draws nothing', off.every((f) => f === -1));
const on = gridFrames(context, 2);
check('walls never get a grid frame', [0, 1, 2, 3].every((x) => at(on, x, 0) === -1));
check('checkerboard: (0,1) is off-parity', at(on, 0, 1) === -1);
check('checkerboard: (1,1) floor-like door takes 12+setting under a wall', at(on, 1, 1) === 14);
check('checkerboard: (3,1) water shows the setting', at(on, 3, 1) === 2);
check('checkerboard: (2,1) grass is off-parity', at(on, 2, 1) === -1);
check('high grass on-parity (1,2)? parity 1 vs 2 is off', at(on, 1, 2) === -1);
check('empty floor on-parity (2,2) shows the setting', at(on, 2, 2) === 2);
check('setting 0 uses frame 0 and door 12', at(gridFrames(context, 0), 3, 1) === 0 && at(gridFrames(context, 0), 1, 1) === 12);

// a door with floor above takes the plain door frame 4+setting
const map2 = [Terrain.EMPTY, Terrain.EMPTY, Terrain.EMPTY, Terrain.DOOR];
const ctx2 = { ...context, width: 2, height: 2, tileVariance: [0, 0, 0, 0], rawTerrainAt: (x: number, y: number) => (x >= 0 && y >= 0 && x < 2 && y < 2 ? map2[x + y * 2] : undefined) };
check('door under floor takes 4+setting', gridFrames(ctx2 as never, 1)[3] === 5);

if (failed > 0) { console.error(`${failed} grid check(s) failed`); process.exit(1); }
console.log('verifyGridFrames: OK');
