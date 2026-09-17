import assert from 'node:assert/strict';

/**
 * `src/simulation/ripperLeap.ts` - the `RipperDemon.Hunting.act()` leap math. These pin
 * the trigger gate, the opposite-side landing prediction, the cooldown range and the
 * bounce search, all against fixed synthetic boards; the scene presentation around them
 * (warning line, sprite travel, damage application) has no DOM-free harness and is
 * covered by the type-check plus browser verification instead.
 */
export function verifyRipperLeap(require, check) {
	const { canRipperLeap, predictRipperLeapTarget, chooseRipperBounceEnd, ripperLeapCooldown } = require('./simulation/ripperLeap');

	check('leap triggers only off cooldown, seen, unrooted and at distance 3+', () => {
		const base = { cooldown: 0, seesHero: true, rooted: false, distance: 3 };
		assert.equal(canRipperLeap(base), true);
		assert.equal(canRipperLeap({ ...base, cooldown: 1 }), false);
		assert.equal(canRipperLeap({ ...base, seesHero: false }), false);
		assert.equal(canRipperLeap({ ...base, rooted: true }), false);
		assert.equal(canRipperLeap({ ...base, distance: 2 }), false);
	});

	check('an unmoved or first-seen enemy is aimed at directly', () => {
		assert.deepEqual(predictRipperLeapTarget({ x: 5, y: 5 }, null), { x: 5, y: 5 });
		assert.deepEqual(predictRipperLeapTarget({ x: 5, y: 5 }, undefined), { x: 5, y: 5 });
		assert.deepEqual(predictRipperLeapTarget({ x: 5, y: 5 }, { x: 5, y: 5 }), { x: 5, y: 5 });
	});

	check('a moved enemy is cut off on the far side of its new cell', () => {
		// hero stepped east (4,5 -> 5,5): the neighbour nearest the old cell is west (4,5),
		// mirrored across the hero to the east cell (6,5).
		assert.deepEqual(predictRipperLeapTarget({ x: 5, y: 5 }, { x: 4, y: 5 }), { x: 6, y: 5 });
		// hero stepped south (5,4 -> 5,5): nearest is north (5,4), mirrored to south (5,6).
		assert.deepEqual(predictRipperLeapTarget({ x: 5, y: 5 }, { x: 5, y: 4 }), { x: 5, y: 6 });
		// hero stepped diagonally south-east: nearest ring cell mirrors to north-west.
		assert.deepEqual(predictRipperLeapTarget({ x: 5, y: 5 }, { x: 4, y: 4 }), { x: 6, y: 6 });
	});

	check('the executed leap resets to a 2-4 turn cooldown', () => {
		const seen = new Set();
		for (let i = 0; i < 200; i++) {
			const cooldown = ripperLeapCooldown({ normalRange: (min, max) => min + Math.floor(Math.random() * (max - min + 1)) });
			assert.ok(cooldown >= 2 && cooldown <= 4, `cooldown ${cooldown} outside 2-4`);
			seen.add(cooldown);
		}
		assert.deepEqual([...seen].sort(), [2, 3, 4]);
	});

	check('the bounce lands on the free neighbour nearest the ripper, or aborts', () => {
		const from = { x: 1, y: 5 };
		const leap = { x: 5, y: 5 };
		const free = new Set(['6,5', '5,6', '4,5']);
		const end = chooseRipperBounceEnd(from, leap, (cell) => free.has(`${cell.x},${cell.y}`));
		// (4,5) is distance 3 from the ripper; (6,5) and (5,6) are farther.
		assert.deepEqual(end, { x: 4, y: 5 });
		assert.equal(chooseRipperBounceEnd(from, leap, () => false), null);
	});
}
