import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import ts from 'typescript';

// Called by verifySimulation.mjs after compiling actual production modules into its temp tree.
export function verifyCombat(require, check) {
	const { rollHit, rollDamage, liveStats } = require('./simulation/combat');
	const { applyBuff, advanceBuffs } = require('./simulation/buffs');
	const facade = require('./combat');
	const { Random } = require('mwg');
	const fixture = JSON.parse(readFileSync(new URL('./fixtures/combat-before-extraction.json', import.meta.url), 'utf8'));
	const base = (extra = {}) => ({ x: 0, y: 0, hp: 20, maxHp: 20, accuracy: 10,
		evasion: 5, damage: [2, 8], armor: [0, 3], buffs: {}, ...extra });
	const freeze = (value) => {
		if (value && typeof value === 'object') {
			Object.values(value).forEach(freeze);
			Object.freeze(value);
		}
		return value;
	};
	check('72 pre-extraction combat scenarios preserve results and random stream, core and adapter', () => {
		for (const item of fixture.cases) {
			freeze(item.attacker); freeze(item.defender);
			for (const api of ['core', 'adapter']) {
				const generator = Random.push(item.seed);
				try {
					const hit = api === 'core' ? rollHit(item.attacker, item.defender, Random, item.magic)
						: facade.rollHit(item.attacker, item.defender, item.magic);
					const damage = api === 'core' ? rollDamage(item.attacker, item.defender, Random)
						: facade.rollDamage(item.attacker, item.defender);
					assert.deepEqual({ hit, damage, rng: generator.getState() }, item.expected,
						`${api}: ${item.name}, seed ${item.seed}, magic ${item.magic}`);
				} finally { Random.pop(); }
			}
		}
	});
	check('five pre-extraction buff scenarios preserve timing, damage, and random stream', () => {
		for (const item of fixture.buffs) {
			const generator = Random.push(item.seed);
			try {
				const result = advanceBuffs(freeze(item.initial), Random);
				assert.deepEqual({ ...result, rng: generator.getState() }, item.expected);
			} finally { Random.pop(); }
			const creature = { buffs: { ...item.initial } }, ref = creature.buffs;
			const adapterGenerator = Random.push(item.seed);
			try {
				const damage = facade.tickBuffs(creature);
				assert.equal(creature.buffs, ref);
				assert.deepEqual({ buffs: creature.buffs, damage, rng: adapterGenerator.getState() }, item.expected);
			} finally { Random.pop(); }
		}
	});
	check('hit short circuits consume no random draws; defender invulnerability wins', () => {
		const random = { float: () => assert.fail('unexpected draw') };
		assert.equal(rollHit(base({ accuracy: 1000000 }), base({ evasion: 1000000 }), random), false);
		assert.equal(rollHit(base(), base({ sleeping: true }), random), true);
		// Mob.enemySeen is sampled before movement: a snake entering a doorway without seeing
		// the hero is surprised until its next turn, even though it is no longer sleeping.
		assert.equal(rollHit(base(), base(), random, false, true), true);
		assert.equal(rollHit(base(), base({ kind: 'greatCrab', x: 1 }), random), false);
	});
	check('random method order and bounds stay explicit', () => {
		const calls = [];
		const random = {
			float: (max) => { calls.push(['float', max]); return 0; },
			normalRange: (min, max) => { calls.push(['normalRange', min, max]); return min; },
			range: (min, max) => { calls.push(['range', min, max]); return min; },
			int: (min, max) => { calls.push(['int', min, max]); return min; },
		};
		const attacker = base({ str: 13, strReq: 10 }), defender = base();
		assert.equal(rollHit(attacker, defender, random), true); // ties land
		rollDamage(attacker, defender, random);
		advanceBuffs({ poison: 1, burning: 1 }, random);
		assert.deepEqual(calls, [['float', 10], ['float', 5], ['normalRange', 2, 8],
			['range', 0, 3], ['normalRange', 0, 3], ['int', 1, 2], ['int', 1, 3]]);
	});
	check('Goo tracks the half-HP boundary live; Brute keys off its one-time rage flag, not HP', () => {
		assert.deepEqual(liveStats(base({ kind: 'goo', hp: 11 })), { accuracy: 10, evasion: 8, damage: [1, 8] });
		assert.deepEqual(liveStats(base({ kind: 'goo', hp: 10 })), { accuracy: 15, evasion: 12, damage: [1, 12] });
		// Brute.damageRoll(): 15-40 only while BruteRage (post-revival) is active - not a half-HP
		// threshold. A Brute below half HP but not yet raged still hits at its base 5-25/2-8.
		assert.deepEqual(liveStats(base({ kind: 'brute', hp: 10, raged: true })).damage, [15, 40]);
		assert.deepEqual(liveStats(base({ kind: 'brute', hp: 10, raged: false })).damage, [2, 8]);
		assert.deepEqual(liveStats(base({ kind: 'brute', hp: 30, raged: true })).damage, [15, 40]);
	});
	check('buff application is immutable and distinguishes refresh from a fresh effect', () => {
		const original = freeze({ roots: 1, burning: 1 });
		const refreshed = applyBuff(original, 'burning');
		assert.equal(original.burning, 1);
		assert.equal(refreshed.buffs.burning, 3);
		assert.deepEqual(refreshed.event, { type: 'buff-applied', id: 'burning', fresh: false });
		assert.equal(applyBuff(original, 'poison').event.fresh, true);
		assert.equal(applyBuff({ poison: 0 }, 'poison').event.fresh, false);
		assert.equal(applyBuff({ poison: undefined }, 'poison').event.fresh, true);
	});
	check('undefined buffs neither tick nor draw; zero-duration buffs still damage then expire', () => {
		const original = freeze({ roots: undefined, burning: 0 });
		let draws = 0;
		const result = advanceBuffs(original, { int: () => { draws++; return 2; } });
		assert.equal(draws, 1);
		assert.deepEqual(result, { buffs: { roots: undefined }, damage: 2 });
	});
	check('legacy announcement fires after commit, once per fresh announced buff', () => {
		const creature = { buffs: {} }, ref = creature.buffs;
		const announcements = [];
		facade.setAnnounceBuff((c, id) => {
			assert.equal(c, creature);
			assert.equal(c.buffs[id], facade.BUFF_DURATION[id]);
			announcements.push(id);
		});
		try {
			facade.addBuff(creature, 'burning');
			facade.addBuff(creature, 'burning');
			facade.addBuff(creature, 'bless');
			delete creature.buffs.burning;
			facade.addBuff(creature, 'burning');
			assert.deepEqual(announcements, ['burning', 'burning']);
			assert.equal(creature.buffs, ref);
		} finally { facade.setAnnounceBuff(null); }
		facade.addBuff(creature, 'poison'); // no scene installed
	});
	check('adapter ignores sprite and skeleton graph and observes the current random stack', () => {
		const creature = base();
		Object.defineProperty(creature, 'sprite', { get: () => assert.fail('sprite read') });
		Object.defineProperty(creature, 'skeleton', { get: () => assert.fail('skeleton read') });
		const draw = () => [facade.rollHit(creature, base()), facade.rollDamage(creature, base())];
		const first = Random.withSeed(71, draw);
		Random.withSeed(99, draw);
		assert.deepEqual(Random.withSeed(71, draw), first);
	});
	check('simulation imports remain confined to the simulation directory', () => {
		const root = new URL('../src/simulation/', import.meta.url);
		for (const file of readdirSync(root).filter((name) => name.endsWith('.ts'))) {
			const ast = ts.createSourceFile(file, readFileSync(new URL(file, root), 'utf8'), ts.ScriptTarget.Latest);
			for (const statement of ast.statements) {
				if ((ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) && statement.moduleSpecifier) {
					//Type-only imports/exports (`import type`, `export type ... from`) erase to
					//nothing at compile time - `entityId.ts` re-exports MWG's own `EntityId` type
					//this way with zero runtime dependency (asserted on the compiled output below).
					const typeOnly = statement.importClause?.isTypeOnly || statement.isTypeOnly;
					if (typeOnly) continue;
					assert.match(statement.moduleSpecifier.text, /^\.\/[\w]+$/, `${file} imports outside simulation`);
				}
			}
		}
		const compiled = require('./simulation/entityId');
		assert.equal(typeof compiled.nextEntityId, 'function');
	});
}
