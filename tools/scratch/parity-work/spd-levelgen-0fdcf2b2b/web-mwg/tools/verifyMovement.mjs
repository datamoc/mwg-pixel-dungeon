import assert from 'node:assert/strict';

export function verifyMovement(require, check) {
	const { planMovement } = require('./simulation/movement');
	const position = Object.freeze({ x: 4, y: 8 });
	check('waiting never queries the world', () => {
		assert.deepEqual(planMovement(position, { x: 0, y: 0 }, {}), { kind: 'wait' });
	});
	check('movement precedence matches the former scene for all world combinations', () => {
		for (const occupant of [null, 'npc', 'enemy']) {
			for (const door of [false, true]) for (const roots of [false, true]) for (const passable of [false, true]) {
				const calls = [];
				const result = planMovement(position, Object.freeze({ x: -1, y: 1 }), {
					occupantAt: target => { assert.deepEqual(target, { x: 3, y: 9 }); calls.push('actor'); return occupant; },
					closedDoorAt: () => { calls.push('door'); return door; },
					isRooted: () => { calls.push('roots'); return roots; },
					passable: () => { calls.push('terrain'); return passable; },
				});
				const kind = occupant ? (occupant === 'npc' ? 'interact' : 'attack') : door ? 'door' : roots ? 'rooted' : passable ? 'move' : 'wall';
				assert.deepEqual(result, { kind, target: { x: 3, y: 9 } });
				assert.deepEqual(calls, ['actor', 'door', 'roots', 'terrain'].slice(0, occupant ? 1 : door ? 2 : roots ? 3 : 4));
			}
		}
	});
	check('all eight directions produce independent target coordinates', () => {
		for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) {
			if (!x && !y) continue;
			const result = planMovement(position, { x, y }, {
				occupantAt: () => null, closedDoorAt: () => false, isRooted: () => false, passable: () => true,
			});
			assert.deepEqual(result, { kind: 'move', target: { x: 4 + x, y: 8 + y } });
			result.target.x = 99;
			assert.equal(position.x, 4);
		}
	});
}
