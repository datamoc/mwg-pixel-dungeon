import assert from 'node:assert/strict';

/**
 * `src/simulation/combat.ts` (rolls, damage, multipliers), `advanceBuffs`
 * status ticks (`src/simulation/buffs.ts`), and Preparation's best-of roll
 * (`src/simulation/preparation.ts`) - ROADMAP.md section 9's "verify combat
 * rolls, damage, status effects, and turn timing" item (the timing half lives
 * in `tools/verifyHeroActions.mjs`'s cost pins).
 *
 * Every pin is deterministic: the RNG stubs stand in for Java's draws -
 * `float(x)` returns a scripted unit fraction scaled by the stat (exactly
 * what `Random.Float(x)` distributes), `normalRange`/`range`/`int` sit on
 * endpoints - so the suite pins exact threshold behavior with no sampling
 * noise. A cycling fraction sequence through `rollHit` reproduces the
 * two-uniform-rolls comparison shape (`Char.hit()`, tag `v3.3.8`), not a
 * single percentage.
 */
export function verifyCombatRolls(require, check) {
	const { rollHit, rollDamage, accRollMulti, stoneGlyphReduction, grimTrapDamage, explosiveTrapBounds } = require('./simulation/combat');
	const { preparationDamageRoll, preparationLevelByNumber } = require('./simulation/preparation');
	const { advanceBuffs } = require('./simulation/buffs');

	const hero = { id: 'hero-1', x: 1, y: 1, hp: 20, maxHp: 20, accuracy: 10, evasion: 5, damage: [3, 7], armor: [0, 0], buffs: {}, isHero: true };
	const foe = { id: 'rat-1', x: 2, y: 1, hp: 10, maxHp: 10, accuracy: 5, evasion: 6, damage: [1, 2], armor: [1, 1], buffs: {}, isHero: false };
	const minStub = { float: () => 0, normalRange: (min) => min, range: (min) => min, int: (min) => min };
	const maxStub = { float: (x) => 0.999999 * x, normalRange: (min, max) => max, range: (min, max) => max, int: (min, max) => max };

	check('hit rolls compare two uniform draws, thresholded exactly', () => {
		const fracs = [0, 0.2, 0.4, 0.6, 0.8];
		let at = 0;
		const sweep = { ...minStub, float: (x) => fracs[at++ % fracs.length] * x };
		// acc 10 vs eva 6: draws pair as (0,1.2) (4,3.6) (8,0) (2,2.4) (6,4.8) (0,1.2).
		assert.deepEqual(
			[rollHit(hero, foe, sweep), rollHit(hero, foe, sweep), rollHit(hero, foe, sweep),
				rollHit(hero, foe, sweep), rollHit(hero, foe, sweep), rollHit(hero, foe, sweep)],
			[false, true, true, false, true, false],
		);
	});

	check('roll multipliers move both draws, boundaries landing inclusive', () => {
		const half = { ...minStub, float: (x) => 0.5 * x };
		const even = { ...hero, accuracy: 10 };
		const guard = { ...foe, evasion: 8 };
		assert.equal(rollHit(even, guard, half), true);
		assert.equal(rollHit({ ...even, buffs: { hex: 1 } }, guard, half), true);
		assert.equal(rollHit({ ...even, buffs: { daze: 1 } }, guard, half), false);
		assert.equal(rollHit({ ...even, buffs: { bless: 1 } }, guard, half), true);
		assert.equal(rollHit(even, { ...guard, buffs: { bless: 1 } }, half), true);
		assert.equal(accRollMulti({ buffs: { bless: 1 } }), 1.25);
		assert.equal(accRollMulti({ buffs: { hex: 1 } }), 0.8);
		assert.equal(accRollMulti({ buffs: { daze: 1 } }), 0.5);
		assert.equal(accRollMulti({ buffs: {}, champion: 'blessed' }), 4);
	});

	check('magic doubles, surprise and strength gate the extremes', () => {
		const half = { ...minStub, float: (x) => 0.5 * x };
		const weak = { ...hero, accuracy: 6 };
		const nimble = { ...foe, evasion: 10 };
		assert.equal(rollHit(weak, nimble, half), false);
		assert.equal(rollHit(weak, nimble, half, true), true);
		assert.equal(rollHit({ ...hero, accuracy: 1 }, { ...foe, evasion: 1000 }, half, false, true), true);
		assert.equal(rollHit(hero, { ...foe, evasion: 1000000 }, half), false);
		const encumbered = { ...hero, str: 10, strReq: 12 };
		const plain = { ...foe, evasion: 5 };
		assert.equal(rollHit(encumbered, plain, half), false);
		assert.equal(rollHit(hero, plain, half), true);
	});

	check('damage spans the rolled range against the armor roll, floored at scratch', () => {
		assert.equal(rollDamage(hero, foe, minStub), 2);
		assert.equal(rollDamage(hero, foe, maxStub), 6);
		assert.equal(rollDamage({ ...hero, damage: [1, 1] }, foe, minStub), 0);
		assert.equal(rollDamage(hero, { ...foe, armor: [9, 9] }, minStub), 0);
	});

	check('the attacker multiplier chain compounds in Java order', () => {
		assert.equal(rollDamage({ ...hero, hp: 10, buffs: { fury: 1 } }, foe, maxStub), 10);
		assert.equal(rollDamage({ ...hero, hp: 11, buffs: { fury: 1 } }, foe, maxStub), 6);
		assert.equal(rollDamage({ ...hero, buffs: { weakness: 1 } }, foe, maxStub), 4);
		assert.equal(rollDamage({ ...hero, hp: 5, buffs: { berserk: 1 } }, foe, maxStub), 9);
		assert.equal(rollDamage({ ...hero, champion: 'blazing' }, foe, maxStub), 8);
		assert.equal(rollDamage({ ...hero, champion: 'growing' }, foe, maxStub), 7);
		assert.equal(rollDamage({ ...hero, isHero: false }, { ...foe, boss: true, buffs: { aggression: 1 } }, maxStub), 3);
		assert.equal(rollDamage(hero, { ...foe, buffs: { vulnerable: 1 } }, minStub), 3);
		assert.equal(rollDamage(hero, { ...foe, champion: 'giant' }, minStub), 0);
		assert.equal(rollDamage(hero, { ...foe, champion: 'antimagic' }, minStub), 1);
		assert.equal(rollDamage(hero, { ...foe, champion: 'growing' }, minStub), 2);
		assert.equal(rollDamage({ ...hero, str: 14, strReq: 12 }, foe, maxStub), 8);
	});

	check('preparation replaces the roll with the best of its draws plus rank bonus', () => {
		const seq = (draws) => { let at = 0; return { ...maxStub, normalRange: (min, max) => draws[at++ % draws.length] ?? max }; };
		assert.equal(rollDamage({ ...hero, prepLevel: 3 }, foe, seq([4, 9, 1])), 11);
		assert.equal(rollDamage({ ...hero, prepLevel: 1 }, foe, seq([4, 1])), 3);
		assert.deepEqual(preparationLevelByNumber(3), { level: 3, turnsReq: 5, damageBonus: 0.35, damageRolls: 2 });
		assert.equal(preparationDamageRoll(preparationLevelByNumber(4), (() => { const draws = [4, 9, 2]; let at = 0; return () => draws[at++]; })()), 14);
	});

	check('status ticks deal, redraw, decrement, and expire exactly', () => {
		assert.deepEqual(advanceBuffs({ burning: 3 }, minStub, 0), { buffs: { burning: 2 }, damage: 1 });
		assert.deepEqual(advanceBuffs({ poison: 6 }, minStub, 0), { buffs: { poison: 5 }, damage: 3 });
		assert.deepEqual(advanceBuffs({ poison: 6 }, minStub, 0, true), { buffs: { poison: 5 }, damage: 2 });
		assert.deepEqual(advanceBuffs({ poison: 1 }, minStub, 0), { buffs: {}, damage: 1 });
		assert.deepEqual(advanceBuffs({ bleeding: 4 }, minStub, 0), { buffs: { bleeding: 2 }, damage: 2 });
		assert.deepEqual(advanceBuffs({ magicalSleep: 5 }, minStub, 0), { buffs: { magicalSleep: 5 }, damage: 0 });
		assert.deepEqual(advanceBuffs({ roots: 2 }, minStub, 0), { buffs: { roots: 1 }, damage: 0 });
		assert.deepEqual(advanceBuffs({ cripple: 1 }, minStub, 0), { buffs: {}, damage: 0 });
	});

	check('pure Java-number helpers round the documented way', () => {
		assert.equal(stoneGlyphReduction(10, 5, 1), 0.8125);
		assert.equal(grimTrapDamage(20, 20), 20);
		assert.deepEqual(explosiveTrapBounds(3), [7, 21]);
	});
}
