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
	const { chooseYogSpawnCell } = require('./simulation/yogBoss');

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
		//Java's second sweep: no free *passable* neighbour, but a free *non-solid*
		//one - the leap lands there instead of aborting; both sweeps empty aborts.
		const nonSolid = new Set(['5,6']);
		assert.deepEqual(chooseRipperBounceEnd(from, leap, () => false,
			(cell) => nonSolid.has(`${cell.x},${cell.y}`)), { x: 5, y: 6 });
		assert.equal(chooseRipperBounceEnd(from, leap, () => false, () => false), null);
	});

	check('Yog summons land on the free neighbour nearest the hero, sheep fallback last', () => {
		// `YogDzewa.act()`'s summon placement (`actors/mobs/YogDzewa.java`, tag
		// `v3.3.8`): Euclidean `trueDistance` to the hero over `NEIGHBOURS8`, strict
		// `>` so the first cell wins ties, then the same sweep over sheep-occupied
		// cells (killed to make room), else no spawn. Yog (5,5), hero (5,8).
		const yog = { x: 5, y: 5 };
		const hero = { x: 5, y: 8 };
		const board = (free, sheep = []) => {
			const freeSet = new Set(free);
			const sheepSet = new Set(sheep);
			return {
				yog, hero,
				occupantAt: (x, y) => sheepSet.has(`${x},${y}`) ? 'sheep'
					: freeSet.has(`${x},${y}`) ? null : 'blocked',
			};
		};
		const all = ['4,4', '5,4', '6,4', '4,5', '6,5', '4,6', '5,6', '6,6'];
		// all free: (5,6) is Euclidean-nearest (squared 4); Chebyshev ties it with
		// (4,6)/(6,6) at 2, so this also pins the metric, not just the anchor.
		assert.deepEqual(chooseYogSpawnCell(board(all)), { x: 5, y: 6, killSheep: false });
		// tie on distance ((4,6) and (6,6) both squared 5): row-major W wins.
		assert.deepEqual(chooseYogSpawnCell(board(['4,6', '6,6'])), { x: 4, y: 6, killSheep: false });
		// a free cell beats a nearer sheep: free (4,4) wins over sheep (5,6).
		assert.deepEqual(chooseYogSpawnCell(board(['4,4'], ['5,6'])), { x: 4, y: 4, killSheep: false });
		// no free cell: the nearest sheep cell is taken and flagged for the kill.
		assert.deepEqual(chooseYogSpawnCell(board([], ['4,4', '5,6'])), { x: 5, y: 6, killSheep: true });
		// nothing free, no sheep: no spawn.
		assert.equal(chooseYogSpawnCell(board([])), null);
	});
}
