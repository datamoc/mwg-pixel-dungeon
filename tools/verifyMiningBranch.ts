import assert from 'node:assert/strict';
import { miningBranchFloor } from '../src/spdLevelGen/gameBridge';
import { Terrain } from '../src/spdLevelGen/paintLevel';

const seeds = [1n, 42n, 123456789n, 999999999999n];

for (const seed of seeds) {
	const first = miningBranchFloor(seed, 14);
	const second = miningBranchFloor(seed, 14);
	assert.equal(first.width, 32);
	assert.equal(first.height, 32);
	assert.deepEqual(first.entrance, { x: 16, y: 16 });
	assert.equal(first.branchExits.length, 0);
	assert.equal(first.mobs.length, 0);
	assert.equal(first.paint.map[16 + 16 * 32], Terrain.ENTRANCE);
	for (let y = 15; y <= 17; y++) for (let x = 15; x <= 17; x++) {
		if (x === 16 && y === 16) continue;
		assert.ok(first.paint.map[x + y * 32] !== Terrain.WALL, `seed ${seed} closed the entrance clearing`);
	}
	assert.ok([...first.paint.map].some((tile) => tile === Terrain.WATER), `seed ${seed} has no cave water pass`);
	assert.ok([...first.paint.map].some((tile) => tile === Terrain.GRASS), `seed ${seed} has no cave grass pass`);
	assert.ok([...first.paint.map].some((tile) => tile === Terrain.WALL_DECO), `seed ${seed} has no ore vein pass`);
	assert.deepEqual([...first.paint.map], [...second.paint.map]);
}

console.log(`Mining branch checks passed (${seeds.length} seeds).`);
