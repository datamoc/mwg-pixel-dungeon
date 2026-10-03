import assert from 'node:assert/strict';
import { fogHalves } from '../src/spdLevelGen/fog.ts';
import { wallBlockingFrame } from '../src/spdLevelGen/wallBlocking.ts';

const terrain = rows => (x, y) => rows[y]?.[x] ?? -1;
const visibility = rows => (x, y) => rows[y]?.[x] ?? 3;
// Wall interiors can show one side without revealing the opposite room.
assert.deepEqual(fogHalves(1, 0, 3, 2, terrain([[1, 4, 1], [1, 4, 1]]), visibility([[0, 0, 3], [0, 0, 3]])), [0, 3]);
// Wall faces use the darkest of their cell and the floor immediately below.
assert.deepEqual(fogHalves(1, 0, 3, 2, terrain([[4, 4, 4], [1, 1, 1]]), visibility([[0, 0, 0], [0, 1, 0]])), [1, 1]);
// Undiscoverable solid rock stays black even if a full-map reveal marks it visited.
assert.deepEqual(fogHalves(1, 1, 3, 3, terrain([[4, 4, 4], [4, 4, 4], [4, 4, 4]]), () => 1), [3, 3]);
assert.deepEqual(fogHalves(0, 0, 1, 1, terrain([[1]]), () => 2), [2, 2]);
assert.deepEqual(fogHalves(0, 0, 1, 1, terrain([[4]]), () => 0), [3, 3]);
console.log('Fog wall-half regression checks passed.');

const roomWall = terrain([[4, 1, 4], [4, 4, 4], [1, 1, 1]]);
assert.equal(wallBlockingFrame(1, 1, 3, 3, roomWall, (x, y) => y === 0), 2);
assert.equal(wallBlockingFrame(1, 1, 3, 3, roomWall, () => true), -1);
const internal = terrain([[1, 4, 4], [1, 4, 4], [1, 4, 4], [1, 1, 1]]);
assert.equal(wallBlockingFrame(1, 1, 3, 4, internal, (x, y) => x <= 1), 0);
assert.equal(wallBlockingFrame(1, 0, 3, 4, internal, () => true), -1);
console.log('Wall occlusion mask regression checks passed.');
