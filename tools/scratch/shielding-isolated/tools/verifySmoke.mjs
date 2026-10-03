import assert from 'node:assert/strict';

// Called by verifySimulation.mjs after compiling actual production modules into its temp tree.
export function verifySmoke(require, check) {
	check('the smoke bomb seeds 40 a cell over a distance-2 flood', () => {
		// `SmokeBomb.explode()` (tag `v3.3.8`): `Blob.seed(i, 40, SmokeScreen.class)` per
		// cell of `PathFinder.buildDistanceMap(cell, not solid, 2)`.
		const { smokeBombSeedPlan, SMOKEBOMB_RADIUS, SMOKEBOMB_VOLUME, SMOKEBOMB_CENTER_BUDGET } = require('./simulation/smoke');
		assert.equal(SMOKEBOMB_RADIUS, 2);
		assert.equal(SMOKEBOMB_VOLUME, 40);
		assert.equal(SMOKEBOMB_CENTER_BUDGET, 1000);
		const open = smokeBombSeedPlan(7, 7, () => false, 3, 3);
		assert.equal(open.seeds.length, 24, 'Chebyshev layers 0..2 hold 25 cells minus the center');
		assert.ok(open.seeds.every((seed) => seed.volume === 40));
		assert.ok(open.seeds.every((seed) => seed.x !== 3 || seed.y !== 3), 'the center rides in centerVolume, not seeds');
		assert.equal(open.centerVolume, 40, 'a full 25-cell flood leaves only the center\'s own 40');
	});
	check('a walled-in blast piles the unplaced share onto the center', () => {
		// `centerVolume = 1000; for (...) centerVolume -= 40;` - the loop only runs over
		// placed cells, so whatever the walls eat lands in the middle.
		const { smokeBombSeedPlan } = require('./simulation/smoke');
		const ringAt = new Set(['2,2', '3,2', '4,2', '2,3', '4,3', '2,4', '3,4', '4,4']);
		const boxed = smokeBombSeedPlan(7, 7, (x, y) => ringAt.has(`${x},${y}`), 3, 3);
		assert.equal(boxed.seeds.length, 0);
		assert.equal(boxed.centerVolume, 1000, 'the lone center seeds its own 40 plus the 960 remainder');
		const crossAt = new Set(['3,2', '3,4', '2,3', '4,3']);
		const partial = smokeBombSeedPlan(7, 7, (x, y) => crossAt.has(`${x},${y}`), 3, 3);
		assert.equal(partial.seeds.length, 20, 'the flood leaks diagonally, then spreads a second step');
		assert.equal(partial.centerVolume, 200, 'twenty-one flood keys cost 840; the center totals its own 40 plus the 160 remainder');
	});
}
