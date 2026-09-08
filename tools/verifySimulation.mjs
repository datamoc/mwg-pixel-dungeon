import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { verifyCombat } from './verifyCombat.mjs';
import { verifyMovement } from './verifyMovement.mjs';
import { verifyHeroTurn } from './verifyHeroTurn.mjs';
import { verifyHeroActions } from './verifyHeroActions.mjs';
import { verifySearch } from './verifySearch.mjs';

// Compile the actual implementation into a private temporary CommonJS tree. Type-only
// mwg imports disappear, so tests never load Pixi, a DOM, or the full framework barrel.
// Type checking remains npm run check's responsibility; no extra test dependency needed.
const output = mkdtempSync(join(tmpdir(), 'spd-simulation-'));
let passed = 0;
function check(name, run) {
	run();
	passed++;
	console.log(`PASS ${name}`);
}
function compile(source, destination) {
	const file = join(output, destination);
	mkdirSync(dirname(file), { recursive: true });
	writeFileSync(file, ts.transpileModule(readFileSync(source, 'utf8'), {
		compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, rewriteRelativeImportExtensions: true },
	}).outputText);
}

try {
	writeFileSync(join(output, 'package.json'), '{"type":"commonjs"}');
	for (const file of ['simulation/movement', 'simulation/heroTurn', 'simulation/hunger', 'simulation/turns', 'adapters/sceneSimulation',
		'adapters/hungerSimulation', 'simulation/random', 'simulation/combatState', 'simulation/buffs', 'simulation/combat', 'simulation/entityId', 'talentEffects',
		'adapters/combatSimulation', 'adapters/mwgRandom', 'combat', 'simulation/heroActions', 'adapters/heroActions',
		'simulation/search', 'adapters/searchSimulation']) {
		compile(new URL(`../src/${file}.ts`, import.meta.url), `${file}.js`);
	}
	// Exercise the installed local scheduler as well as the framework-free simulation.
	compile(new URL('../../MW_games/src/roguelike/Scheduler.ts', import.meta.url), 'scheduler.js');
	compile(new URL('../../MW_games/src/roguelike/Scheduler.ts', import.meta.url), 'node_modules/mwg/roguelike/Scheduler.js');
	compile(new URL('../../MW_games/src/core/Random.ts', import.meta.url), 'random.js');
	compile(new URL('../../MW_games/src/core/Random.ts', import.meta.url), 'node_modules/mwg/core/Random.js');
	// Only the real Random module is needed by the mwg adapter; no rendering runtime.
	mkdirSync(join(output, 'node_modules/mwg'), { recursive: true });
	writeFileSync(join(output, 'node_modules/mwg/index.js'),
		"const random = require('../../random.js'); exports.Random = random; exports.Generator = random.Generator;");
	for (const name of ['index', 'Turns', 'Scenario', 'Runtime']) {
		compile(new URL(`../../MW_games/src/simulation/${name}.ts`, import.meta.url), `node_modules/mwg/simulation/${name}.js`);
	}
	const require = createRequire(join(output, 'tests.cjs'));
	const { advanceHunger } = require('./simulation/hunger');
	const { runHungerStep } = require('./adapters/hungerSimulation');
	const { runUntilHeroInput } = require('./adapters/sceneSimulation');
	const { SceneSimulationAdapter } = require('./adapters/sceneSimulation');
	const { Scheduler } = require('./scheduler');
	const talents = require('./talentEffects');
	const initial = (extra = {}) => ({ hunger: 0, partialDamage: 0, hp: 20, maxHp: 20, ...extra });
	check('recent talent effects cover thresholds, class gates, and rank scaling', () => {
		assert.equal(talents.ironWillReduction(10, 20, 1), 1);
		assert.equal(talents.ironWillReduction(11, 20, 2), 0);
		assert.equal(talents.shieldBatteryGain(3, 2), 2);
		assert.equal(talents.shieldBatteryGain(0, 2), 0);
		assert.equal(talents.rejuvenatingStepHeal(4, 4, 19, 20, 2), 1);
		assert.equal(talents.rejuvenatingStepHeal(3, 4, 10, 20, 2), 0);
		assert.equal(talents.naturesBountyDewChance('huntress', 2), 0.25);
		assert.equal(talents.naturesBountyDewChance('warrior', 2), 1 / 6);
		assert.equal(talents.lethalHasteFreeTurn('duelist', 1), true);
		assert.equal(talents.lethalHasteFreeTurn('rogue', 1), false);
		assert.equal(talents.weaponRechargingGain('duelist', 2), 2);
		assert.equal(talents.weaponRechargingGain('mage', 2), 0);
		assert.equal(talents.farsightRange('sniper', 2), 10);
		assert.equal(talents.farsightRange('warden', 2), 6);
		assert.equal(talents.shieldingDewGain('warden', 2), 2);
		assert.equal(talents.shieldingDewGain('sniper', 2), 0);
		assert.equal(talents.preservationChance(1), 0.2);
		assert.equal(talents.preservationChance(2), 0.35);
		assert.equal(talents.preservationChance(0), 0);
		assert.equal(talents.ironStomachReduction('warrior', 2), 4);
		assert.equal(talents.ironStomachReduction('rogue', 2), 0);
		assert.equal(talents.cachedRationChance('rogue', 2), 0.4);
		assert.equal(talents.cachedRationChance('warrior', 2), 0);
		assert.equal(talents.canImproviseProjectile('warrior', 1, 1), true);
		assert.equal(talents.canImproviseProjectile('warrior', 1, 0), false);
		assert.equal(talents.evasiveArmorBonus('freerunner', 2, 3), 6);
		assert.equal(talents.evasiveArmorBonus('assassin', 2, 3), 0);
		assert.equal(talents.assassinReachBonus('assassin', 2), 2);
		assert.equal(talents.empoweredStrikeBonus('battlemage', 2), 2);
		assert.equal(talents.bountyGoldBonus('assassin', 2), 10);
		assert.equal(talents.unencumberedSpiritEvasion('monk_sub', 2), 2);
		assert.equal(talents.lethalDefenseShield('gladiator', 2), 2);
		assert.equal(talents.monasticVigorShield('monk_sub', 2), 2);
		assert.equal(talents.sharedUpgradeArmor('sniper', 1, 1), 1);
		assert.equal(talents.sharedUpgradeArmor('sniper', 1, 3), 0);
		assert.equal(talents.twinUpgradeArmor('champion', 1, 1), 1);
		assert.equal(talents.soulSiphonCharge('warlock', 2), 2);
		assert.equal(talents.projectileMomentumBonus('freerunner', 2, true), 2);
		assert.equal(talents.projectileMomentumBonus('sniper', 2, true), 0);
		assert.equal(talents.enragedCatalystBonus('berserker', 2, 10, 20), 2);
		assert.equal(talents.enragedCatalystBonus('berserker', 2, 11, 20), 0);
		assert.equal(talents.cleaveComboSeed('gladiator', 2), 2);
		assert.equal(talents.cleaveComboSeed('berserker', 2), 0);
		assert.equal(talents.deathlessFuryTriggers('berserker', 1, false, 20, 10), true);
		assert.equal(talents.deathlessFuryTriggers('berserker', 1, true, 20, 10), false);
		assert.equal(talents.enhancedLethalityThreshold('assassin', 2), 0.4);
		assert.equal(talents.enhancedLethalityThreshold('berserker', 2), 0);
		assert.equal(talents.endlessRageFreeTurn('berserker', 1), true);
		assert.equal(talents.endlessRageFreeTurn('gladiator', 1), false);
		assert.equal(talents.arcaneVisionRadius('mage', 2), 6);
		assert.equal(talents.arcaneVisionRadius('rogue', 2), 0);
		assert.equal(talents.necromancerMinionChance('warlock', 1), 0.13);
		assert.equal(talents.necromancerMinionChance('warlock', 3), 0.4);
		assert.equal(talents.necromancerMinionChance('battlemage', 3), 0);
	});

	check('hunger runtime dispatch matches the direct transition exactly', () => {
		for (const state of [initial({ hunger: 290 }), initial({ hunger: 440, hp: 20 }), initial({ hunger: 450, hp: 20, maxHp: 20 })]) {
			const direct = advanceHunger(state);
			const routed = runHungerStep(state);
			assert.deepEqual(routed.state, direct.state);
			assert.deepEqual(routed.events, direct.events);
		}
	});
	check('hunger transition is immutable and warns once at 300', () => {
		const input = Object.freeze(initial({ hunger: 290 }));
		const result = advanceHunger(input);
		assert.equal(input.hunger, 290);
		assert.equal(result.state.hunger, 300);
		assert.deepEqual(result.events, [{ type: 'hungry' }]);
		assert.deepEqual(advanceHunger(result.state).events, []);
	});
	check('crossing 450 fires starving + an immediate 1 damage, matching hero.damage(1,this)', () => {
		assert.deepEqual(advanceHunger(initial({ hunger: 280 })).events, []);
		const result = advanceHunger(initial({ hunger: 440, hp: 20 }));
		assert.deepEqual(result.events, [{ type: 'starving' }, { type: 'starvation-damage', damage: 1 }]);
		assert.equal(result.state.hp, 19);
		assert.equal(result.state.hunger, 450);
	});
	check('once starving, level freezes and partialDamage accrues STEP*HT/1000 per turn (Hunger.act isStarving branch)', () => {
		let state = initial({ hunger: 450, hp: 20, maxHp: 20 });
		for (let i = 0; i < 5; i++) {
			const result = advanceHunger(state);
			assert.deepEqual(result.events, []);
			state = result.state;
		}
		assert.equal(state.hunger, 450);
		assert.equal(state.hp, 20);
		assert.ok(Math.abs(state.partialDamage - 1) < 1e-9);
		const result = advanceHunger(state);
		assert.deepEqual(result.events, [{ type: 'starvation-damage', damage: 1 }]);
		assert.equal(result.state.hp, 19);
		assert.ok(Math.abs(result.state.partialDamage - 0.2) < 1e-9);
	});
	check('high max HP can deal multiple damage per turn, and death follows the damage event', () => {
		const result = advanceHunger(initial({ hunger: 450, hp: 2, maxHp: 250 }));
		assert.equal(result.state.hp, 0);
		assert.deepEqual(result.events, [{ type: 'starvation-damage', damage: 2 }, { type: 'starvation-death' }]);
	});
	check('feeding remains a caller decision; partialDamage is untouched while not starving', () => {
		const result = advanceHunger(initial({ hunger: 0, partialDamage: 0.7 }));
		assert.equal(result.state.partialDamage, 0.7);
		assert.equal(result.state.hunger, 10);
		assert.deepEqual(result.events, []);
	});
	check('no actor runs when empty or already game over', () => {
		const ports = { scheduler: new Scheduler(), isGameOver: () => false,
			takeMonsterTurn: () => assert.fail('unexpected actor') };
		assert.equal(runUntilHeroInput(ports), 'empty');
		assert.equal(runUntilHeroInput({ ...ports, isGameOver: () => true }), 'game-over');
	});
	check('real scheduler preserves speed and stops before spending the hero turn', () => {
		const scheduler = new Scheduler();
		const monster = { isHero: false, speed: 2 };
		const hero = { isHero: true };
		scheduler.add(monster, 0);
		scheduler.add(hero, 0.75);
		let actions = 0;
		assert.equal(runUntilHeroInput({ scheduler, isGameOver: () => false,
			takeMonsterTurn: (actor) => { assert.equal(actor, monster); actions++; } }), 'hero-input');
		assert.equal(actions, 2);
		assert.equal(scheduler.peek(), hero);
		assert.equal(scheduler.timeOf(hero), 0.75);
	});
	check('monster turn hooks run after each actor action', () => {
		const scheduler = new Scheduler();
		const monster = { isHero: false, speed: 2 };
		const hero = { isHero: true };
		scheduler.add(monster, 0);
		scheduler.add(hero, 0.75);
		let after = 0;
		assert.equal(runUntilHeroInput({ scheduler, isGameOver: () => false,
			takeMonsterTurn: () => {}, afterMonsterTurn: (actor) => { assert.equal(actor, monster); after++; },
		}), 'hero-input');
		assert.equal(after, 2);
	});
	check('game-over is checked on the next iteration, after the existing spend', () => {
		let over = false;
		const trace = [];
		assert.equal(runUntilHeroInput({
			scheduler: { peek: () => ({ isHero: false }), spend: (cost) => trace.push(cost) },
			isGameOver: () => over,
			takeMonsterTurn: () => { trace.push('act'); over = true; },
		}), 'game-over');
		assert.deepEqual(trace, ['act', 1]);
	});
	check('actor removal keeps the scheduler current-entry spending behaviour', () => {
		const scheduler = new Scheduler();
		const monster = { isHero: false };
		const hero = { isHero: true };
		scheduler.add(monster);
		scheduler.add(hero);
		runUntilHeroInput({ scheduler, isGameOver: () => false,
			takeMonsterTurn: (actor) => scheduler.remove(actor) });
		assert.equal(scheduler.timeOf(hero), 1);
	});
	check('iteration bound is explicit and does not manufacture a hero turn', () => {
		let actions = 0;
		assert.equal(runUntilHeroInput({
			scheduler: { peek: () => ({ isHero: false }), spend: () => {} },
			isGameOver: () => false, takeMonsterTurn: () => actions++,
		}), 'iteration-limit');
		assert.equal(actions, 1000);
	});
	check('adapter reads replacement state and writes it before presenting events', () => {
		let state = initial();
		let ready = 0;
		const scheduler = new Scheduler();
		const events = [];
		const adapter = new SceneSimulationAdapter({ scheduler, isGameOver: () => false,
			takeMonsterTurn: () => assert.fail('unexpected actor'), awaitHeroInput: () => ready++,
			readHunger: () => state, writeHunger: (next) => { state = next; },
			presentHungerEvent: (event) => { assert.equal(state.hp, 0); events.push(event.type); },
		});
		adapter.hungerStep();
		state = initial({ hunger: 440, hp: 1 }); // e.g. state after loading, one turn from crossing into starving
		adapter.hungerStep();
		assert.deepEqual(events, ['starving', 'starvation-damage', 'starvation-death']);
		assert.equal(adapter.runTurns(), 'empty');
		assert.equal(ready, 0);
		scheduler.add({ isHero: true });
		assert.equal(adapter.runTurns(), 'hero-input');
		assert.equal(ready, 1);
		scheduler.clear(); // entering a floor reuses the scheduler instance
		scheduler.add({ isHero: true });
		adapter.runTurns();
		assert.equal(ready, 2);
	});
	verifyMovement(require, check);
	verifyHeroTurn(require, check);
	verifyCombat(require, check);
	verifyHeroActions(require, check);
	verifySearch(require, check);
	console.log(`${passed} simulation checks passed.`);
} finally {
	// Only the fresh directory returned by mkdtempSync above is removed.
	rmSync(output, { recursive: true, force: true });
}
