import assert from 'node:assert/strict';
import { readSceneSource } from './sceneSource.mjs';

/**
 * `src/simulation/succubusBlink.ts` - `Succubus.getCloser()`/`blink()` math. These pin
 * the attempt gate, the cooldown range, the occupied-landing backup and the boxed-in
 * abort against fixed synthetic rays; the scene presentation around them (teleport
 * arrivals, turn costs) has no DOM-free harness and is covered by the type-check plus
 * browser verification instead.
 */
export function verifySuccubusBlink(require, check) {
	const { shouldSuccubusBlink, chooseSuccubusBlinkCell, succubusBlinkCooldown } = require('./simulation/succubusBlink');

	check('blink attempts only off cooldown, seen, unrooted, hunting and at distance 3+', () => {
		const base = { cooldown: 0, seesHero: true, rooted: false, fleeing: false, distance: 3 };
		assert.equal(shouldSuccubusBlink(base), true);
		assert.equal(shouldSuccubusBlink({ ...base, cooldown: 1 }), false);
		assert.equal(shouldSuccubusBlink({ ...base, seesHero: false }), false);
		assert.equal(shouldSuccubusBlink({ ...base, rooted: true }), false);
		assert.equal(shouldSuccubusBlink({ ...base, fleeing: true }), false);
		assert.equal(shouldSuccubusBlink({ ...base, distance: 2 }), false);
	});

	check('every blink attempt resets to a 4-6 turn cooldown', () => {
		const seen = new Set();
		for (let i = 0; i < 200; i++) {
			const cooldown = succubusBlinkCooldown({ range: (min, max) => min + Math.floor(Math.random() * (max - min + 1)) });
			assert.ok(cooldown >= 4 && cooldown <= 6, `cooldown ${cooldown} outside 4-6`);
			seen.add(cooldown);
		}
		assert.deepEqual([...seen].sort(), [4, 5, 6]);
	});

	check('a clear ray lands on its collision cell', () => {
		const cells = [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }];
		const free = new Set(['1,0', '2,0', '3,0']);
		const landing = chooseSuccubusBlinkCell(cells, (cell) => free.has(`${cell.x},${cell.y}`), { range: () => 0 });
		assert.deepEqual(landing, { x: 3, y: 0 });
	});

	check('an occupied landing backs up one cell along the ray', () => {
		const cells = [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }];
		const free = new Set(['1,0', '2,0']);
		const occupied = new Set(['3,0']);
		const key = (cell) => `${cell.x},${cell.y}`;
		// Occupancy-threaded (Java's `findChar != null` branch): backup.
		assert.deepEqual(
			chooseSuccubusBlinkCell(cells, (cell) => free.has(key(cell)), { range: () => 0 }, (cell) => occupied.has(key(cell)), { x: 0, y: 0 }),
			{ x: 2, y: 0 });
		// Legacy default (no occupancy threaded): the same backup via the not-free path.
		assert.deepEqual(
			chooseSuccubusBlinkCell(cells, (cell) => free.has(key(cell)), { range: () => 0 }),
			{ x: 2, y: 0 });
	});

	check('an adjacent occupied collision stays put once the source is threaded', () => {
		// Java backs up to `route.path.get(route.dist - 1)` with `dist == 1` - the
		// succubus's own cell - and `appear` there is a no-op success
		// (`Succubus.java` 134-136, `Ballistica` path[0] is the source). The port's
		// ray helper keeps the stopping cell (`traceRayToTarget`), so a one-cell
		// occupied ray is exactly that case - verified live against the scene's ray
		// shape during the 2026-09-21 browser pass.
		const cells = [{ x: 1, y: 0 }];
		const key = (cell) => `${cell.x},${cell.y}`;
		const occupied = new Set(['1,0']);
		assert.deepEqual(
			chooseSuccubusBlinkCell(cells, () => false, { range: () => 0 }, (cell) => occupied.has(key(cell)), { x: 0, y: 0 }),
			{ x: 0, y: 0 });
		// Without the source cell the legacy neighbour draw still runs (stated):
		// the only free neighbour of (1,0) is (2,0) here.
		const free = new Set(['2,0']);
		assert.deepEqual(
			chooseSuccubusBlinkCell(cells, (cell) => free.has(key(cell)), { range: () => 0 }, (cell) => occupied.has(key(cell))),
			{ x: 2, y: 0 });
	});

	check('a blocked landing falls back to a free neighbour of the collision, or aborts', () => {
		const cells = [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }];
		// collision and backup both taken: the only free neighbour of (3,0) is (4,0).
		const free = new Set(['1,0', '4,0', '0,0']);
		const landing = chooseSuccubusBlinkCell(cells, (cell) => free.has(`${cell.x},${cell.y}`), { range: () => 0 });
		assert.deepEqual(landing, { x: 4, y: 0 });
		// nothing free anywhere near the collision: the blink fails.
		const boxed = new Set(['1,0']);
		assert.equal(chooseSuccubusBlinkCell(cells, (cell) => boxed.has(`${cell.x},${cell.y}`), { range: () => 0 }), null);
		assert.equal(chooseSuccubusBlinkCell([], () => true, { range: () => 0 }), null);
	});

	check('the live caller threads occupancy and the succubus source into the pure planner', () => {
		const source = readSceneSource();
		assert.ok(source.includes("(cell) => this.creatureAt(cell.x, cell.y) !== null"),
			'trySuccubusBlink must pass live occupancy to chooseSuccubusBlinkCell');
		assert.ok(source.includes('simulationRandom,\n\t\t\t(cell) => this.creatureAt(cell.x, cell.y) !== null, monster'),
			'trySuccubusBlink must pass the monster source for the adjacent occupied case');
	});
}
