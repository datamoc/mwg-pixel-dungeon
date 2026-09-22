import assert from 'node:assert/strict';

export function verifyHeroActions(require, check) {
	const { planHeroAction, MOVES } = require('./simulation/heroActions');
	const { dispatchHeroAction } = require('./adapters/heroActions');
	const { advanceHunger, exertHunger } = require('./simulation/hunger');
	const { runScenario } = require('mwg/simulation');
	const attempts = ['special', 'eat', 'quaff', 'read', 'upgrade'];
	const free = ['examine', 'talents', 'buyHeal', 'buyId', 'sellFood', 'buyback', 'save', 'load', 'preparation'];
	function harness({ paralysed = false, succeeds = true, descended = false } = {}) {
		const events = [];
		return { events, ports: {
			isParalysed: () => paralysed,
			getTurnCostMod: () => 1,
			hasMealTalent: () => false,
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
	check('action plans carry Java turn costs, scaled by the cost modifier', () => {
		//`Hero.TIME_TO_SEARCH = 2f`: a search spends two turns; `Food.TIME_TO_EAT
		//= 3f` for eating (1 with any meal talent); everything else here one.
		assert.deepEqual(planHeroAction('search', false), { kind: 'search', turnCost: 2 });
		assert.deepEqual(planHeroAction('right', false), { kind: 'move', step: { x: 1, y: 0 }, turnCost: 1 });
		assert.deepEqual(planHeroAction('eat', false), { kind: 'attempt', action: 'eat', turnCost: 3 });
		assert.deepEqual(planHeroAction('eat', false, 1, true), { kind: 'attempt', action: 'eat', turnCost: 1 });
		assert.deepEqual(planHeroAction('examine', false), { kind: 'free', action: 'examine' });
		assert.deepEqual(planHeroAction('right', true), { kind: 'paralysed', turnCost: 1 });
		assert.deepEqual(planHeroAction('search', false, 0.5), { kind: 'search', turnCost: 1 });
		assert.deepEqual(planHeroAction('eat', false, 0.5), { kind: 'attempt', action: 'eat', turnCost: 1.5 });
		assert.deepEqual(planHeroAction('eat', false, 0.5, true), { kind: 'attempt', action: 'eat', turnCost: 0.5 });
	});
	check('the meal-talent fast-eat list matches the six Java names', () => {
		//`Food.eatingTime()` (`Food.java`, tag `v3.3.8`): any of IRON_STOMACH,
		//ENERGIZING_MEAL, MYSTICAL_MEAL, INVIGORATING_MEAL, FOCUSED_MEAL or
		//ENLIGHTENING_MEAL cuts the 3-turn eat to 1. The scene resolves ranks
		//against this list when it threads the planner flag.
		const { MEAL_TALENTS } = require('./simulation/heroActions');
		assert.deepEqual([...MEAL_TALENTS].sort(), ['energizing_meal', 'enlightening_meal', 'focused_meal', 'invigorating_meal', 'iron_stomach', 'mystical_meal']);
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
		//`examine` is free, the failed `special` spends nothing, `wait` ticks
		//once and `search` ticks twice plus the +4 exertion: 298 -> 299 -> 301
		//-> 305, crossing the 300 warning on the search ticks.
		const initial = { hunger: 298, starveTicks: 0, hungryWarned: false,
			starvingWarned: false, hp: 20, maxHp: 20 };
		const step = (before, command) => {
			let state = before;
			const { events, ports } = harness({ succeeds: false });
			//Java ticks `Hunger.act()` once per hero turn, so a 2-turn search hungers
			//twice: loop the single-step transition `turnCost` times rather than one
			//bulk step, which would skip the second tick's partial-damage accrual.
			ports.spendTurn = (turnCost = 1) => {
				for (let tick = 0; tick < turnCost; tick++) {
					const result = advanceHunger(state);
					state = result.state;
					events.push(...result.events);
				}
			};
		//Java intentional search also exerts hunger directly: TIME_TO_SEARCH
		//minus HUNGER_FOR_SEARCH, i.e. +4 over the two ticks. The +10 cursed
		//variant and the locked-floor gate are scene state the harness cannot
		//see, so the base exertion is pinned here.
		const baseSearch = ports.search;
		ports.search = () => {
			baseSearch();
			const exerted = exertHunger(state, 4);
			state = exerted.state;
			events.push(...exerted.events);
		};
		dispatchHeroAction(command, ports);
			return { state, events, status: state.hp <= 0 ? 'finished' : 'ready' };
		};
		// These are real dispatch/timing rules with fake scene effects, not a full dungeon replay.
		const result = runScenario({ state: initial, commands: ['examine', 'special', 'wait', 'search'], random: null, step });
		assert.equal(result.state.hunger, 305);
		assert.equal(initial.hunger, 298);
		assert.equal(result.processedCommands, 4);
		assert.deepEqual(result.events.filter(e => e?.type === 'hungry'), [{ type: 'hungry' }]);
		//A lone search from 296: two ticks (297, 298) plus the +4 exertion lands
		//on 302, and the exertion itself crosses 300 so the warning fires there -
		//exactly Java's `affectHunger` crossing lines, which the bare ticks skip.
		const solo = runScenario({ state: { ...initial, hunger: 296 }, commands: ['search'], random: null, step });
		assert.equal(solo.state.hunger, 302);
		assert.deepEqual(solo.events.filter(e => e?.type === 'hungry'), [{ type: 'hungry' }]);
	});
}
