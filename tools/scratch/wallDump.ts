/**
 * SCRATCH. Dumps what `spdLevelGen/wallTiles.ts` decides for a real ported floor, and checks
 * the invariants that define SPD's wall look, so the rules can be inspected without a
 * browser. It imports the same module `main.ts` renders from, so this tests the shipped
 * rules rather than a copy of them.
 *
 * Build and run (extensionless imports need bundling first, as the other scratch tools do):
 *   npx esbuild tools/scratch/wallDump.ts --bundle --platform=node --format=esm \
 *     --outfile=tools/scratch/wallDump.mjs && node tools/scratch/wallDump.mjs
 */
import { portedFloor, toGameTerrain, resetPortedRun } from '../../src/spdLevelGen/gameBridge';
import { terrainFrameAt, wallFrameAt, stitchesAsWall, NO_TILE, type WallTileKinds } from '../../src/spdLevelGen/wallTiles';
import { SpdJavaRandom, spdScramble, spdSeedForDepth } from '../../src/spdRng';

const WALL = 0, FLOOR = 1, TRAP = 2, WATER = 3, DOOR = 4, GRASS = 5, HIGH_GRASS = 6, DOOR_CLOSED = 7;
const codes = { wall: WALL, floor: FLOOR, trap: TRAP, water: WATER, door: DOOR, grass: GRASS, highGrass: HIGH_GRASS, doorClosed: DOOR_CLOSED };
const kinds: WallTileKinds = { wall: WALL, door: DOOR, doorClosed: DOOR_CLOSED, grass: GRASS, highGrass: HIGH_GRASS };

//must match main.ts's TERRAIN_FRAME
const F = {
	floor: 0, grass: 2,
	wall: 6 * 16, wallAlt: 6 * 16 + 16, wallBehindDoor: 6 * 16 + 8,
	wallInternal: 10 * 16, wallOverhang: 13 * 16,
	doorSidewaysOverhangOpen: 13 * 16 + 16, doorSidewaysOverhangShut: 13 * 16 + 20,
	doorOverhangShut: 15 * 16 + 9, doorOverhangOpen: 15 * 16 + 10, doorSideways: 15 * 16 + 12,
	raisedDoorShut: 8 * 16, raisedDoorOpen: 8 * 16 + 1, raisedDoorSideways: 8 * 16 + 4,
};

const SEED = 603415654n;
const DEPTHS = [1, 2, 3, 4, 6, 7, 8, 9];

resetPortedRun();
let failures = 0;

for (const depth of DEPTHS) {
	const floor = portedFloor(SEED, depth);
	const t = toGameTerrain(floor, codes);
	const grid = {
		width: floor.width,
		height: floor.height,
		inside: (x: number, y: number) => x >= 0 && y >= 0 && x < floor.width && y < floor.height,
		get: (x: number, y: number) => t[y * floor.width + x],
		index: (x: number, y: number) => y * floor.width + x,
	};

	const rng = new SpdJavaRandom(spdScramble(spdSeedForDepth(SEED, depth)));
	const variance = new Uint8Array(floor.width * floor.height);
	for (let i = 0; i < variance.length; i++) variance[i] = rng.nextInt(100);

	//the invariant that is the whole point: a wall shows a face on the lower layer exactly
	//when the cell below it is not wall, and shows a dark top on the upper layer otherwise -
	//never both, never neither
	let faces = 0, tops = 0, overhangs = 0, both = 0, neither = 0, altFaces = 0;
	for (let y = 0; y < floor.height; y++) {
		for (let x = 0; x < floor.width; x++) {
			const lower = terrainFrameAt(grid, kinds, F, variance, x, y);
			const upper = wallFrameAt(grid, kinds, F, x, y);
			if (!stitchesAsWall(grid, kinds, x, y)) {
				if (upper >= F.wallOverhang && upper < F.wallOverhang + 32) overhangs++;
				continue;
			}
			const hasFace = lower !== NO_TILE;
			const hasTop = upper >= F.wallInternal && upper < F.wallInternal + 48;
			if (hasFace) { faces++; if (lower >= F.wallAlt && lower < F.wallAlt + 4) altFaces++; }
			if (hasTop) tops++;
			if (hasFace && hasTop) both++;
			if (!hasFace && !hasTop) neither++;
			//a face must mean open (non-wall) below, and a top must mean wall below
			const openBelow = !stitchesAsWall(grid, kinds, x, y + 1);
			if (hasFace !== openBelow || hasTop === openBelow) failures++;
		}
	}

	const pct = faces + tops > 0 ? Math.round((100 * faces) / (faces + tops)) : 0;
	console.log(
		`depth ${depth}: ${floor.width}x${floor.height}  wall faces=${faces} dark tops=${tops} ` +
		`(faces are ${pct}% of wall cells)  overhangs=${overhangs}  altFaces=${altFaces}  ` +
		`both=${both} neither=${neither}`
	);
}

console.log(failures === 0 ? '\nOK: every wall cell has a face XOR a dark top, matching open-below.' : `\nFAILED: ${failures} cells`);

//and one floor drawn out, so the shape can be read by eye
const floor = (resetPortedRun(), portedFloor(SEED, 1));
const t = toGameTerrain(floor, codes);
const grid = {
	width: floor.width, height: floor.height,
	inside: (x: number, y: number) => x >= 0 && y >= 0 && x < floor.width && y < floor.height,
	get: (x: number, y: number) => t[y * floor.width + x],
	index: (x: number, y: number) => y * floor.width + x,
};
const rng = new SpdJavaRandom(spdScramble(spdSeedForDepth(SEED, 1)));
const variance = new Uint8Array(floor.width * floor.height);
for (let i = 0; i < variance.length; i++) variance[i] = rng.nextInt(100);

console.log('\ndepth 1 - F/A lit wall face (A = alt art), T dark wall top, o overhang lip,');
console.log("           D door, . floor, ~ water, \" grass, space nothing\n");
for (let y = 0; y < floor.height; y++) {
	let row = '';
	for (let x = 0; x < floor.width; x++) {
		const lower = terrainFrameAt(grid, kinds, F, variance, x, y);
		const upper = wallFrameAt(grid, kinds, F, x, y);
		const kind = grid.get(x, y);
		if (stitchesAsWall(grid, kinds, x, y)) {
			if (lower >= F.wallAlt && lower < F.wallAlt + 4) row += 'A';
			else if (lower !== NO_TILE) row += 'F';
			else row += 'T';
		} else if (kind === DOOR || kind === DOOR_CLOSED) row += 'D';
		else if (upper >= F.wallOverhang && upper < F.wallOverhang + 32) row += 'o';
		else if (kind === WATER) row += '~';
		else if (kind === GRASS || kind === HIGH_GRASS) row += '"';
		else row += '.';
	}
	console.log(row);
}
