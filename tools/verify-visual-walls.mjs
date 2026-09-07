import assert from 'node:assert/strict';
import { raisedWallFrame, upperWallFrame, foregroundGrassFrame } from '../src/spdLevelGen/visualWalls.ts';

const grid = (cells) => (x, y) => cells[y]?.[x] ?? -1;
// Java DungeonTileSheet: statues block movement, but are not wall-stitchable.
const statue = grid([[4, 4, 4], [4, 25, 4], [4, 1, 4]]);
assert.equal(raisedWallFrame(statue, 1, 0, 0), 96);
assert.equal(raisedWallFrame(statue, 1, 1, 0), undefined);
assert.equal(upperWallFrame(statue, 1, 0, 0), 240);
// Wooden interiors have their own family, including when only the row below is wood.
assert.equal(upperWallFrame(grid([[4, 4, 4], [27, 27, 27]]), 1, 0, 0), 192);
const door = grid([[4, 4, 4], [4, 31, 4], [4, 1, 4]]);
assert.equal(raisedWallFrame(door, 1, 1, 0), 132);
assert.equal(raisedWallFrame(grid([[1, 1, 1], [4, 31, 4], [4, 4, 4]]), 1, 1, 0), 131);
assert.equal(upperWallFrame(door, 1, 0, 0), 254);
assert.equal(raisedWallFrame(grid([[4, 12, 4], [4, 1, 4]]), 1, 0, 99), 116);
// Both upper pieces disappear after trampling; alternate selection uses the grass cell.
assert.equal(upperWallFrame(grid([[1], [15]]), 0, 0, 50), 246);
assert.equal(foregroundGrassFrame(15, 50), 155);
assert.equal(upperWallFrame(grid([[1], [2]]), 0, 0, 50), -1);
assert.equal(foregroundGrassFrame(2, 50), -1);
assert.equal(upperWallFrame(grid([[4]]), 0, 0, 0), 160);
assert.equal(raisedWallFrame(grid([[4]]), 0, 0, 0), -1);
console.log('Visual wall regression checks passed.');
