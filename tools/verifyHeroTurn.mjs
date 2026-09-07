import assert from 'node:assert/strict';

export function verifyHeroTurn(require, check) {
	const { finishHeroTurn } = require('./simulation/heroTurn');
	const { advanceHunger } = require('./simulation/hunger');
	function fixture(hp = 20) {
		const calls = [];
		const state = { hp };
		const effects = { isAlive: () => state.hp > 0 };
		for (const name of ['advanceClock', 'advanceHunger', 'recoverWandCharge',
			'recoverTomeCharge', 'spreadFire', 'applyBuffDamage', 'spendScheduledTurn', 'runAutomaticTurns']) {
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
			'recoverTomeCharge', 'spreadFire', 'applyBuffDamage', 'spendScheduledTurn', 'runAutomaticTurns']);
	});
	check('fatal buff damage prevents scheduler spending and automatic actions', () => {
		const f = fixture();
		f.effects.applyBuffDamage = () => { f.state.hp = 0; return true; };
		assert.equal(finishHeroTurn(f.effects), 'buff-death');
		assert.deepEqual(f.calls, ['advanceClock', 'advanceHunger', 'recoverWandCharge', 'recoverTomeCharge', 'spreadFire']);
	});
	check('starvation death retains legacy continuation and next-turn dead guard', () => {
		const f = fixture(1);
		f.effects.advanceHunger = () => {
			f.state.hp = advanceHunger({ hp: f.state.hp, maxHp: 20, hunger: 450, partialDamage: 0.9 }).state.hp;
		};
		assert.equal(finishHeroTurn(f.effects), 'spent');
		assert.equal(f.state.hp, 0);
		assert.deepEqual(f.calls.slice(-3), ['applyBuffDamage', 'spendScheduledTurn', 'runAutomaticTurns']);
		f.calls.length = 0;
		assert.equal(finishHeroTurn(f.effects), 'already-dead');
		assert.deepEqual(f.calls, []);
	});
}
