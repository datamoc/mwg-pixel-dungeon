import assert from 'node:assert/strict';

export function verifyHeroActions(require, check) {
	const { planHeroAction, MOVES } = require('./simulation/heroActions');
	const { dispatchHeroAction } = require('./adapters/heroActions');
	const { advanceHunger } = require('./simulation/hunger');
	const { runScenario } = require('mwg/simulation');
	const attempts = ['special', 'eat', 'quaff', 'read', 'upgrade'];
	const free = ['examine', 'talents', 'buyHeal', 'buyId', 'sellFood', 'save', 'load'];
	function harness({ paralysed = false, succeeds = true, descended = false } = {}) {
		const events = [];
		return { events, ports: {
			isParalysed: () => paralysed,
			getTurnCostMod: () => 1,
			beginTurn: () => events.push('begin'), spendTurn: () => events.push('spend'),
			announceParalysis: () => events.push('paralysed'), search: () => events.push('search'),
			attempts: Object.fromEntries(attempts.map(action => [action, () => { events.push(action); return succeeds; }])),
			free: Object.fromEntries(free.map(action => [action, () => events.push(action)])),
			move: step => { events.push(['move', step]); return descended; },
		} };
	}
	check('free actions never spend a turn; failed consumable/ranged actions preserve input', () => {
		for (const action of free) {
			const { events, ports } = harness();
			assert.equal(dispatchHeroAction(action, ports), true);
			assert.deepEqual(events, [action]);
		}
		for (const action of attempts) {
			const { events, ports } = harness({ succeeds: false });
			assert.equal(dispatchHeroAction(action, ports), false);
			assert.deepEqual(events, [action]);
		}
	});
	check('successful attempts run before input is cleared, then spend exactly once', () => {
		for (const action of attempts) {
			const { events, ports } = harness();
			assert.equal(dispatchHeroAction(action, ports), true);
			assert.deepEqual(events, [action, 'begin', 'spend']);
		}
		const { events, ports } = harness();
		dispatchHeroAction('search', ports);
		assert.deepEqual(events, ['begin', 'search', 'spend']);
	});
	check('paralysis preserves save/load/talents exceptions and blocks even unknown input', () => {
		for (const action of ['save', 'load', 'talents']) {
			const { events, ports } = harness({ paralysed: true });
			dispatchHeroAction(action, ports);
			assert.deepEqual(events, [action]);
		}
		for (const action of ['right', 'wait', 'examine', 'buyHeal', 'special', 'unknown']) {
			const { events, ports } = harness({ paralysed: true });
			dispatchHeroAction(action, ports);
			assert.deepEqual(events, ['begin', 'paralysed', 'spend']);
		}
	});
	check('moves spend once; entering a floor preserves its initial hero turn', () => {
		for (const [action, step] of Object.entries(MOVES)) {
			const { events, ports } = harness();
			dispatchHeroAction(action, ports);
			assert.deepEqual(events, ['begin', ['move', step], 'spend']);
		}
		const { events, ports } = harness({ descended: true });
		dispatchHeroAction('down', ports);
		assert.deepEqual(events, ['begin', ['move', { x: 0, y: 1 }]]);
	});
	check('unknown inputs are rejected and move plans cannot mutate the shared mapping', () => {
		for (const action of ['unknown', 'constructor', 'toString']) {
			const { events, ports } = harness();
			assert.equal(dispatchHeroAction(action, ports), false);
			assert.deepEqual(events, []);
		}
		planHeroAction('right', false).step.x = 99;
		assert.equal(MOVES.right.x, 1);
	});
	check('MWG headless runner drives the real action adapter and hunger transition', () => {
		const initial = { hunger: 280, starveTicks: 0, hungryWarned: false,
			starvingWarned: false, hp: 20, maxHp: 20 };
		const step = (before, command) => {
			let state = before;
			const { events, ports } = harness({ succeeds: false });
			ports.spendTurn = () => {
				const result = advanceHunger(state);
				state = result.state;
				events.push(...result.events);
			};
			dispatchHeroAction(command, ports);
			return { state, events, status: state.hp <= 0 ? 'finished' : 'ready' };
		};
		// These are real dispatch/timing rules with fake scene effects, not a full dungeon replay.
		const result = runScenario({ state: initial, commands: ['examine', 'special', 'wait', 'search'], random: null, step });
		assert.equal(result.state.hunger, 300);
		assert.equal(initial.hunger, 280);
		assert.equal(result.processedCommands, 4);
		assert.deepEqual(result.events.filter(e => e?.type === 'hungry'), [{ type: 'hungry' }]);
	});
}
