import assert from 'node:assert/strict';

/**
 * `src/simulation/actorCollision.ts` plus the occupancy gates it records: no
 * two live actors may share a cell (Java: `Mob.getCloser`/`canPassTo` and
 * `Hero.getCloser` refuse `Actor.findChar(cell) != null`). All pins run
 * against fixed synthetic boards; the scene presentation around the moves
 * (tweens, appear effects) has no DOM-free harness and is covered by the
 * type-check plus browser verification instead.
 */
export function verifyActorCollision(require, check) {
	const { findSharedCell } = require('./simulation/actorCollision');
	const { wanderBlocked, fleeStep, nearestFreeCell } = require('./simulation/wandering');
	const { blinkDestination } = require('./simulation/preparation');

	check('findSharedCell clears a clean roster and names the doubled cell', () => {
		assert.equal(findSharedCell([]), undefined);
		assert.equal(findSharedCell([{ x: 1, y: 2 }, { x: 3, y: 4 }]), undefined);
		assert.deepEqual(
			findSharedCell([{ x: 1, y: 2 }, { x: 3, y: 4 }, { x: 1, y: 2 }]),
			{ x: 1, y: 2 },
		);
	});

	const neighbours8 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
	const chebyshev = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

	check('wanderBlocked holds every other creature, hero gated by the pursuit flag', () => {
		const monster = { x: 5, y: 5 };
		const hero = { x: 9, y: 9 };
		const other = { x: 6, y: 5 };
		const occupants = new Map([['5,5', monster], ['9,9', hero], ['6,5', other]]);
		const ctx = {
			width: 20, height: 20, cellCount: 400,
			passable: () => true, inside: () => true,
			terrainAt: () => 0, terrainAtCell: () => 0, waterTerrain: -1,
			cellIndex: (x, y) => y * 20 + x,
			isChasm: () => false,
			creatureAt: (x, y) => occupants.get(`${x},${y}`) ?? null,
			creatures: [monster, hero, other],
			hero,
			blockExtraInto: () => {},
			pickElement: (candidates) => candidates[0],
		};
		const pursuit = wanderBlocked(monster, true, ctx);
		assert.equal(pursuit.has(9 * 20 + 9), true);
		assert.equal(pursuit.has(5 * 20 + 6), true);
		assert.equal(pursuit.has(5 * 20 + 5), false);
		const patrol = wanderBlocked(monster, false, ctx);
		assert.equal(patrol.has(9 * 20 + 9), false);
		assert.equal(patrol.has(5 * 20 + 6), true);
	});

	check('fleeStep never returns an occupied neighbour', () => {
		const hero = { x: 8, y: 5 };
		const occupied = new Set(['4,4', '5,4', '6,4', '6,5', '4,5', '6,6', '5,6']);
		const ctx = {
			passable: () => true,
			creatureAt: (x, y) => (occupied.has(`${x},${y}`) ? { x, y } : null),
			neighbourOffsets: neighbours8,
			chebyshev,
			hero,
			isChasm: () => false,
		};
		// Seven of eight neighbours taken: the only improving free cell is (4,6).
		assert.deepEqual(fleeStep({ x: 5, y: 5 }, ctx), { x: 4, y: 6 });
		occupied.add('4,6');
		assert.equal(fleeStep({ x: 5, y: 5 }, ctx), null);
	});

	check('blinkDestination skips occupied neighbours', () => {
		const hero = { x: 5, y: 5 };
		const enemy = { x: 7, y: 5 };
		const blocked = new Set(['6,4', '6,5', '6,6', '7,4', '7,6', '8,4', '8,5']);
		const context = {
			hero,
			creatureAt: (x, y) => (blocked.has(`${x},${y}`) ? { x, y } : null),
			level: { inside: () => true, passable: () => true, index: (x, y) => y * 20 + x },
			distanceMap: () => new Array(400).fill(1),
		};
		// Every neighbour but (8,6) is taken: the blink must land there.
		assert.deepEqual(blinkDestination(context, enemy, 4), { x: 8, y: 6 });
		blocked.add('8,6');
		assert.equal(blinkDestination(context, enemy, 4), null);
	});

	check('nearestFreeCell skips occupied cells', () => {
		const hero = { x: 5, y: 5 };
		const occupied = new Set(['7,5']);
		const ctx = {
			inside: () => true, passable: () => true, isChasm: () => false,
			creatureAt: (x, y) => (occupied.has(`${x},${y}`) ? { x, y } : null),
			neighbourOffsets: neighbours8,
			chebyshev,
			hero,
		};
		// The occupied center loses; the nearest free neighbour (6,4) wins.
		assert.deepEqual(nearestFreeCell({ x: 7, y: 5 }, true, ctx), { x: 6, y: 4 });
	});
}
