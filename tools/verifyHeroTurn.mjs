import assert from 'node:assert/strict';

export function verifyHeroTurn(require, check) {
	const { finishHeroTurn } = require('./simulation/heroTurn');
	const { runHeroTurn } = require('./adapters/gameSimulation');
	const { runMonsterTurn } = require('./adapters/gameSimulation');
	const { advanceHunger } = require('./simulation/hunger');
	function fixture(hp = 20) {
		const calls = [];
		const state = { hp };
		const effects = { isAlive: () => state.hp > 0 };
		for (const name of ['advanceClock', 'advanceHunger', 'recoverWandCharge',
			'recoverTomeCharge', 'recoverArmorCharge', 'recoverHolyTomeCharge', 'tickEndureTracker', 'tickDoubleJumpTracker', 'tickAscendedForm', 'tickWeaponAbility', 'tickNaturesPowerTracker', 'spreadFire', 'applyBuffDamage', 'updatePreparation', 'spendScheduledTurn', 'runAutomaticTurns']) {
			effects[name] = () => { calls.push(name); return false; };
		}
		return { calls, state, effects };
	}
	check('dead heroes cannot advance clocks, effects, or scheduling', () => {
		const f = fixture(0);
		assert.equal(finishHeroTurn(f.effects), 'already-dead');
		assert.deepEqual(f.calls, []);
	});
	check('a living hero completes effects before automatic actors run', () => {
		const f = fixture();
		assert.equal(finishHeroTurn(f.effects), 'spent');
		assert.deepEqual(f.calls, ['advanceClock', 'advanceHunger', 'recoverWandCharge',
			'recoverTomeCharge', 'recoverArmorCharge', 'recoverHolyTomeCharge', 'tickEndureTracker', 'tickDoubleJumpTracker', 'tickAscendedForm', 'tickWeaponAbility', 'tickNaturesPowerTracker', 'spreadFire', 'applyBuffDamage', 'updatePreparation', 'spendScheduledTurn', 'runAutomaticTurns']);
	});
	check('the shared SimulationRuntime routes hero-turn effects without changing their order', () => {
		const f = fixture();
		assert.equal(runHeroTurn(f.effects, 0.75), 'spent');
		assert.deepEqual(f.calls, ['advanceClock', 'advanceHunger', 'recoverWandCharge',
			'recoverTomeCharge', 'recoverArmorCharge', 'recoverHolyTomeCharge', 'tickEndureTracker', 'tickDoubleJumpTracker', 'tickAscendedForm', 'tickWeaponAbility', 'tickNaturesPowerTracker', 'spreadFire', 'applyBuffDamage', 'updatePreparation', 'spendScheduledTurn', 'runAutomaticTurns']);
	});
	check('the shared hero-turn seam forwards variable cost to cost-aware effects', () => {
		const f = fixture();
		const costs = {};
		for (const name of ['advanceHunger', 'recoverWandCharge', 'recoverTomeCharge', 'spreadFire', 'applyBuffDamage', 'spendScheduledTurn']) {
			f.effects[name] = (cost) => { costs[name] = cost; };
		}
		assert.equal(runHeroTurn(f.effects, 2), 'spent');
		assert.deepEqual(costs, {
			advanceHunger: 2, recoverWandCharge: 2, recoverTomeCharge: 2,
			spreadFire: 2, applyBuffDamage: 2, spendScheduledTurn: 2,
		});
	});
	check('the shared SimulationRuntime routes monster actions, hooks, and variable cost in order', () => {
		const calls = [];
		assert.equal(runMonsterTurn({
			act: () => calls.push('act'),
			afterAct: () => calls.push('after'),
			cost: () => { calls.push('cost'); return 2; },
		}), 2);
		assert.deepEqual(calls, ['act', 'after', 'cost']);
	});
	check('fatal buff damage prevents scheduler spending and automatic actions', () => {
		const f = fixture();
		f.effects.applyBuffDamage = () => { f.state.hp = 0; return true; };
		assert.equal(finishHeroTurn(f.effects), 'buff-death');
		assert.deepEqual(f.calls, ['advanceClock', 'advanceHunger', 'recoverWandCharge', 'recoverTomeCharge', 'recoverArmorCharge', 'recoverHolyTomeCharge', 'tickEndureTracker', 'tickDoubleJumpTracker', 'tickAscendedForm', 'tickWeaponAbility', 'tickNaturesPowerTracker', 'spreadFire']);
	});
	check('starvation death retains legacy continuation and next-turn dead guard', () => {
		const f = fixture(1);
		f.effects.advanceHunger = () => {
			//HT 20 accrues 0.02/turn: a seeded 0.99 crosses the strict `> 1` gate.
			f.state.hp = advanceHunger({ hp: f.state.hp, maxHp: 20, hunger: 450, partialDamage: 0.99 }).state.hp;
		};
		assert.equal(finishHeroTurn(f.effects), 'spent');
		assert.equal(f.state.hp, 0);
		assert.deepEqual(f.calls.slice(-4), ['applyBuffDamage', 'updatePreparation', 'spendScheduledTurn', 'runAutomaticTurns']);
		f.calls.length = 0;
		assert.equal(finishHeroTurn(f.effects), 'already-dead');
		assert.deepEqual(f.calls, []);
	});
}
