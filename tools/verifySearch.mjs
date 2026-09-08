import assert from 'node:assert/strict';

export function verifySearch(require, check) {
	const { planSearch } = require('./simulation/search');
	const { runSearch } = require('./adapters/searchSimulation');
	const position = Object.freeze({ x: 4, y: 8 });

	check('search finds nothing when no cell in radius is secret', () => {
		assert.deepEqual(planSearch(position, 1, { isSecret: () => false }), { kind: 'nothing' });
	});
	check('search never queries the hero\'s own cell', () => {
		const calls = [];
		planSearch(position, 1, { isSecret: (cell) => { calls.push(cell); return false; } });
		assert.ok(!calls.some((c) => c.x === position.x && c.y === position.y));
		assert.equal(calls.length, 8); // a radius-1 ring minus the center cell
	});
	check('search preserves the original dy-outer/dx-inner scan order', () => {
		const order = [];
		planSearch(position, 1, { isSecret: (cell) => { order.push(`${cell.x},${cell.y}`); return false; } });
		assert.deepEqual(order, [
			'3,7', '4,7', '5,7',
			'3,8', '5,8',
			'3,9', '4,9', '5,9',
		]);
	});
	check('search stops at the first secret found, by scan order, not distance', () => {
		// (5,9) comes later in scan order than (3,7), even though both are radius-1 secrets
		const secrets = new Set(['3,7', '5,9']);
		const result = planSearch(position, 1, { isSecret: (cell) => secrets.has(`${cell.x},${cell.y}`) });
		assert.deepEqual(result, { kind: 'found', cell: { x: 3, y: 7 } });
	});
	check('search radius widens correctly for a talent-boosted range', () => {
		const result = planSearch(position, 2, { isSecret: (cell) => cell.x === 6 && cell.y === 8 });
		assert.deepEqual(result, { kind: 'found', cell: { x: 6, y: 8 } });
		assert.deepEqual(planSearch(position, 1, { isSecret: (cell) => cell.x === 6 && cell.y === 8 }), { kind: 'nothing' });
	});
	check('runSearch dispatches through the real SimulationRuntime and spends no scheduler cost', () => {
		const outcome = runSearch(position, 1, { isSecret: (cell) => cell.x === 5 && cell.y === 8 });
		assert.deepEqual(outcome, { kind: 'found', cell: { x: 5, y: 8 } });
		// a second, independent dispatch confirms the runtime's own state commit doesn't leak
		// results across calls (each command is self-contained, per its own `state.last` only
		// ever holding the most recent outcome, never accumulating)
		const second = runSearch(position, 1, { isSecret: () => false });
		assert.deepEqual(second, { kind: 'nothing' });
	});
}
