import assert from 'node:assert/strict';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import ts from 'typescript';

// Called by verifySimulation.mjs after compiling actual production modules into its temp tree.
export function verifyCombat(require, check) {
	const { rollHit, rollDamage, liveStats } = require('./simulation/combat');
	const { applyBuff, advanceBuffs, reigniteBuff, absorbShield, BUFF_DURATION } = require('./simulation/buffs');
	const record = process.env.RECORD_FIXTURES === '1';
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
			let core;
			try {
				core = { ...advanceBuffs(freeze(item.initial), Random), rng: generator.getState() };
			} finally { Random.pop(); }
			const creature = { buffs: { ...item.initial } }, ref = creature.buffs;
			const adapterGenerator = Random.push(item.seed);
			let adapted;
			try {
				const damage = facade.tickBuffs(creature);
				assert.equal(creature.buffs, ref);
				adapted = { buffs: creature.buffs, damage, rng: adapterGenerator.getState() };
			} finally { Random.pop(); }
			// `RECORD_FIXTURES=1` re-records the snapshot instead of comparing against it, for the
			// cases where a rule is deliberately corrected and the old numbers are what changed -
			// it prints every difference it finds, so the edit is visible in the diff rather than
			// silent, and the default path stays an exact comparison.
			if (record) {
				if (JSON.stringify(core) !== JSON.stringify(item.expected) || JSON.stringify(adapted) !== JSON.stringify(item.expected)) {
					console.log(`RECORD ${JSON.stringify(item.initial)}: ${JSON.stringify(item.expected)} -> ${JSON.stringify(core)}`);
				}
				item.expected = core;
				continue;
			}
			assert.deepEqual(core, item.expected);
			assert.deepEqual(adapted, item.expected);
		}
		if (record) {
			writeFileSync(new URL('./fixtures/combat-before-extraction.json', import.meta.url),
				`${JSON.stringify(fixture, null, 2)}\n`);
		}
	});
	check('Burning rolls Java\'s depth-scaled range and reignites rather than resetting', () => {
		// `Burning.act()` is `Random.NormalIntRange(1, 3 + Dungeon.scalingDepth()/4)` - an
		// inclusive range, so the exclusive bound this port's `int` takes is `4 + depth/4`
		const bounds = [];
		const spy = { int: (low, high) => { bounds.push([low, high]); return low; }, normalRange: () => 0, float: () => 0 };
		advanceBuffs({ burning: 5 }, spy, 0);
		advanceBuffs({ burning: 5 }, spy, 12);
		advanceBuffs({ burning: 5 }, spy);
		assert.deepEqual(bounds, [[1, 4], [1, 7], [1, 4]]);
		// `Burning.reignite(ch, duration)` raises the clock only when it is shorter
		assert.deepEqual(reigniteBuff({ burning: 2 }, 'burning', 8).buffs, { burning: 8 });
		assert.deepEqual(reigniteBuff({ burning: 9 }, 'burning', 4).buffs, { burning: 9 });
		assert.deepEqual(reigniteBuff({ burning: 8 }, 'burning').buffs, { burning: BUFF_DURATION.burning });
		assert.deepEqual(reigniteBuff({}, 'burning', 4).buffs, { burning: 4 });
		// and the table now carries Java's own default, not this port's invented 3
		assert.equal(BUFF_DURATION.burning, 8);
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
		advanceBuffs({ poison: 1, burning: 1 }, random, 0);
		// poison draws no RNG - `(int)(left/3)+1`, hence 1 at duration 1 - and Burning's
		// depth-scaled `NormalIntRange(1, 3 + scalingDepth/4)` is `int(1, 4)` at depth 0
		assert.deepEqual(calls, [['float', 10], ['float', 5], ['normalRange', 2, 8],
			['range', 0, 3], ['normalRange', 0, 3], ['int', 1, 4]]);
		calls.length = 0;
		advanceBuffs({ burning: 1 }, random, 16);
		assert.deepEqual(calls, [['int', 1, 8]], 'and the bound grows with depth');
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
		assert.equal(refreshed.buffs.burning, BUFF_DURATION.burning);
		assert.equal(applyBuff(original, 'burning', 3).buffs.burning, 3, 'a call site may pass its own duration');
		assert.deepEqual(refreshed.event, { type: 'buff-applied', id: 'burning', fresh: false });
		assert.equal(applyBuff(original, 'poison').event.fresh, true);
		assert.equal(applyBuff({ poison: 0 }, 'poison').event.fresh, false);
		assert.equal(applyBuff({ poison: undefined }, 'poison').event.fresh, true);
	});
	check('shield pools absorb before HP on every damage seam', () => {
		//`ShieldBuff.processDamage()`: the pool takes first, HP takes the rest. One
		//pure helper serves the attack tail, the blast seam, traps, blobs and DoT
		//alike (DKBarrier multi-seam fix, 13th matrix residual).
		assert.deepEqual(absorbShield(300, 20), { shield: 280, damage: 0 });
		assert.deepEqual(absorbShield(10, 25), { shield: 0, damage: 15 });
		assert.deepEqual(absorbShield(0, 25), { shield: 0, damage: 25 });
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
	check('MWL status immunities gate fire, magic, and chill buffs and only those', () => {
		const fireproof = base({ fireImmune: true });
		facade.addBuff(fireproof, 'burning');
		assert.equal(fireproof.buffs.burning, undefined, 'fire immunity must block burning');
		const plain = base();
		facade.addBuff(plain, 'burning');
		assert.equal(plain.buffs.burning, facade.BUFF_DURATION.burning);

		const magic = base({ magicImmune: true });
		for (const id of ['charm', 'weakness', 'vulnerable', 'hex', 'degrade', 'magicalSleep']) {
			facade.addBuff(magic, id);
			assert.equal(magic.buffs[id], undefined, `magic immunity must block ${id}`);
		}
		facade.addBuff(magic, 'poison'); // not in AntiMagic.RESISTS
		assert.equal(magic.buffs.poison, facade.BUFF_DURATION.poison, 'magic immunity must not block a non-magical buff');

		const frozen = base({ buffs: { frost: 10 } });
		facade.addBuff(frozen, 'chill');
		assert.equal(frozen.buffs.chill, undefined, 'active Frost must block Chill');
		const thawed = base();
		facade.addBuff(thawed, 'chill');
		assert.equal(thawed.buffs.chill, facade.BUFF_DURATION.chill);
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
	check('damageMultiplier is `Char.attack`\'s dmgMulti: it scales the roll, before armor', () => {
		const { rollDamage } = require('./simulation/combat');
		const zero = { float: () => 0, normalRange: (min) => min, range: (min) => min, int: (min) => min };
		const attacker = base({ damage: [10, 10] });
		const defender = base({ armor: [4, 4] });
		// `Char.attack`: `dmg = damageRoll() * dmgMulti` sits immediately after the roll and ahead of
		// the armor subtraction, so at half damage a 10-against-4 hit is `round(5) - 4 = 1`, not
		// `round(10 - 4) * 0.5 = 3`. Spectral Blades is what needs this (its secondary targets take
		// half damage); every other caller leaves it at 1.
		assert.equal(rollDamage(attacker, defender, zero), 6);
		assert.equal(rollDamage(attacker, defender, zero, 0.5), 1);
		assert.equal(rollDamage(attacker, defender, zero, 1), 6);
	});
	check('ascension modifiers stay inert in-game, match Java\'s table, and follow the alias table', () => {
		const { accRollMulti, rollDamage, setAscensionActive, ASCENSION_MOD } = require('./simulation/combat');
		const zero = { float: () => 0, normalRange: (min) => min, range: (min) => min, int: (min) => min };
		const rat = base({ kind: 'rat', accuracy: 8, evasion: 4, damage: [1, 4], armor: [0, 0] });
		// `AscensionChallenge.statModifier` returns 1 unless the hero carries the ascension buff
		// (`AscensionChallenge.java` at v3.3.8), and this port has no ascent - so an ordinary mob
		// must never be scaled in-game. Pinned because that gate used to be the *Stronger Bosses*
		// challenge: selecting it multiplied every ordinary mob's accuracy AND damage by up to
		// x10 (a rat), while Java's Stronger Bosses only ever touches bosses.
		assert.equal(accRollMulti(rat), 1);
		assert.equal(rollDamage(rat, base(), zero), 1);
		// the gate itself is real and correct for when the ascent does get ported
		setAscensionActive(true);
		try {
			assert.equal(accRollMulti(rat), ASCENSION_MOD.rat);
			assert.equal(rollDamage(rat, base(), zero), 1 * ASCENSION_MOD.rat);
		} finally {
			setAscensionActive(false);
		}
		assert.equal(accRollMulti(rat), 1);
		// Java's own class->value table (`AscensionChallenge.java`, v3.3.8), flattened onto this
		// port's ids. Pinned in full rather than derived: Java resolves by `isAssignableFrom`, so
		// a subclass inherits its parent's value, and this port models subclasses two different
		// ways - some as `BASE_KIND_ALIASES` variants (albino, causticSlime, ...), others as
		// first-class `MonsterId`s with no alias row (fetidRat, greatCrab, gnollTrickster,
		// necroSkeleton, newbornElemental). Nothing in the port's data says which port id maps to
		// which Java class, so the flattened table is the only place that mapping exists.
		assert.deepEqual(ASCENSION_MOD, {
			rat: 10, albino: 10, fetidRat: 10,
			snake: 9,
			gnoll: 9, gnollTrickster: 9,
			swarm: 8.5,
			crab: 8, greatCrab: 8,
			slime: 8, causticSlime: 8,
			skeleton: 5, necroSkeleton: 5,
			thief: 5, bandit: 5,
			dm100: 4.5,
			guard: 4,
			necromancer: 4, spectralNecromancer: 4,
			bat: 2.5,
			brute: 2.25, armoredBrute: 2.25,
			shaman: 2.25,
			spinner: 2,
			dm200: 2, dm201: 2,
			ghoul: 1.67,
			elemental: 1.67, newbornElemental: 1.67,
			warlock: 1.5,
			monk: 1.5, senior: 1.5,
			golem: 1.33,
			ripperDemon: 1.2,
			succubus: 1.2,
			eye: 1.1,
			scorpio: 1.1, acidic: 1.1,
		});
		// and every variant the authored alias table knows shares its base kind's value, so the
		// two representations above cannot drift apart for the variants the port does model
		const mwl = readFileSync(new URL('../src/content/actor-rules.mwl', import.meta.url), 'utf8');
		const rows = [...mwl.matchAll(/tag:\s*"row"\s*,?\s*variant:\s*"(\w+)"\s*,?\s*base:\s*"(\w+)"/g)];
		assert.ok(rows.length >= 11, `alias table not parsed (${rows.length} rows)`);
		for (const [, variant, kind] of rows) {
			assert.equal(ASCENSION_MOD[variant] ?? 1, ASCENSION_MOD[kind] ?? 1, `${variant} vs base ${kind}`);
		}
	});
	check('defender damage() curves reproduce Java\'s published value tables exactly', () => {
		const { applyDefenderDamageCurves, heavyDamageCurve } = require('./simulation/defenderDamageCurves');
		// Java's own comments state each table, so assert them as written rather than re-deriving.
		// Pylon.java: "takes 15/16/17/18/19/20 dmg at 15/17/20/24/29/36 incoming dmg"
		assert.deepEqual([15, 17, 20, 24, 29, 36].map((d) => applyDefenderDamageCurves('pylon', d)), [15, 16, 17, 18, 19, 20]);
		// below its threshold a pylon takes the hit uncurved (14 is the curve's own base)
		assert.equal(applyDefenderDamageCurves('pylon', 14), 14);
		// DemonSpawner.java: "takes 20/21/22/.../30 dmg at 20/22/25/29/34/40/47/55/64/74/85"
		assert.deepEqual([20, 22, 25, 29, 34, 40, 47, 55, 64, 74, 85].map((d) => applyDefenderDamageCurves('demonSpawner', d)),
			[20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]);
		assert.equal(applyDefenderDamageCurves('demonSpawner', 19), 19);
		// Slime.java: "takes 5/6/7/8/9/10 dmg at 5/7/10/14/19/25 incoming dmg", and CausticSlime
		// extends Slime, so it shares the curve unchanged
		assert.deepEqual([5, 7, 10, 14, 19, 25].map((d) => applyDefenderDamageCurves('slime', d)), [5, 6, 7, 8, 9, 10]);
		assert.deepEqual([5, 7, 10, 14, 19, 25].map((d) => applyDefenderDamageCurves('causticSlime', d)), [5, 6, 7, 8, 9, 10]);
		assert.equal(applyDefenderDamageCurves('slime', 4), 4);
		// Eye.java: `if (beamCharged) dmg /= 4` - integer division, and only while charging
		assert.equal(applyDefenderDamageCurves('eye', 10, { beamCharged: true }), 2);
		assert.equal(applyDefenderDamageCurves('eye', 10), 10);
		assert.equal(applyDefenderDamageCurves('eye', 3, { beamCharged: true }), 0);
		// everything else passes through untouched, including an unknown or absent kind
		for (const kind of ['rat', 'golem', undefined]) assert.equal(applyDefenderDamageCurves(kind, 40), 40);
		// and the shared helper is Java's exact expression, its inner truncation included
		assert.equal(heavyDamageCurve(36, 14, 15), 20);
		assert.equal(heavyDamageCurve(14, 14, 15), 14);
	});
	check('a marked boss/miniboss is halved by its own side, before the armor subtraction', () => {
		const { rollDamage } = require('./simulation/combat');
		// one deterministic draw for both the damage roll and the armor roll
		const zero = { float: () => 0, normalRange: (min, max) => min, range: (min) => min, int: (min) => min };
		const marked = (extra = {}) => base({ armor: [3, 3], hp: 50, maxHp: 50, buffs: { aggression: 5 }, ...extra });
		const mob = base({ damage: [10, 10], kind: 'rat' });
		const hero = base({ damage: [10, 10], isHero: true });
		const ally = base({ damage: [10, 10], isAlly: true, kind: 'rat' });
		// Char.attack 480-488: round(10 * 0.5) - 3 = 2. The `- 3` coming *after* the halving is the
		// part that pins the position: applying it post-armor would give (10-3) * 0.5 = 3.5 -> 4.
		assert.equal(rollDamage(mob, marked({ miniboss: true }), zero), 2);
		assert.equal(rollDamage(mob, marked({ boss: true }), zero), 2);
		// Yog-Dzewa takes a quarter: 10 * 0.25 = 2.5 -> round -> 3, against 0 armor
		assert.equal(rollDamage(mob, marked({ kind: 'yog', boss: true, armor: [0, 0] }), zero), 3);
		// the hero and a converted ally share the boss's own alignment in Java terms? No - they are
		// ALLY, the boss is ENEMY, so `enemy.alignment == alignment` is false and nothing is halved
		assert.equal(rollDamage(hero, marked({ miniboss: true }), zero), 7);
		assert.equal(rollDamage(ally, marked({ miniboss: true }), zero), 7);
		// an unmarked boss, and a marked *ordinary* mob, are both untouched: the damage rule keys
		// on the BOSS/MINIBOSS property, not on the mark alone
		assert.equal(rollDamage(mob, base({ armor: [3, 3], hp: 50, maxHp: 50, miniboss: true }), zero), 7);
		assert.equal(rollDamage(mob, marked(), zero), 7);
	});
	check('the authored MINIBOSS/BOSS flag sets match Java and stay disjoint', () => {
		// Source-level rather than through `monsters.ts`, which needs Pixi's `SpriteSheet` and so
		// cannot load in this harness. Java's own `properties().add(Property.MINIBOSS)` sites at
		// tag v3.3.8, minus the three classes this port does not spawn (CrystalGuardian,
		// FungalSentry, GnollSapper).
		const mwl = readFileSync(new URL('../src/content/actor-rules.mwl', import.meta.url), 'utf8');
		const flagSet = (flag) => {
			const match = new RegExp(`apply_to:\\s*"${flag}"[^}]*?set:\\s*"([^"\\r\\n]+)"`).exec(mwl);
			assert.ok(match, `no ${flag} flag effect in actor-rules.mwl`);
			return match[1].split(',').map((k) => k.trim()).sort();
		};
		assert.deepEqual(flagSet('miniboss'),
			['demonSpawner', 'fetidRat', 'gnollTrickster', 'greatCrab', 'newbornElemental', 'pylon', 'rotHeart', 'rotLasher']);
		// Java checks the two properties separately (`BOSS || MINIBOSS` in the stone's duration
		// rule, `!BOSS && !MINIBOSS` in CombinedLethality), so a kind in both would double-apply
		for (const kind of flagSet('miniboss')) assert.ok(!flagSet('boss').includes(kind), `${kind} is both BOSS and MINIBOSS`);
	});
	check('only the floor-roster spawn is champion-eligible, matching Java\'s createMob path', () => {
		// Java calls ChampionEnemy.rollForChampion from Level.createMob() alone - the path drawing
		// from the floor's mob rotation - so every other mob (a quest miniboss, a mimic, a pylon, a
		// summon, an ally) is never championed. This port carries that as the `championEligible`
		// argument, true at exactly one call site.
		const source = readFileSync(new URL('../src/scenes/dungeonScene.ts', import.meta.url), 'utf8');
		const calls = [...source.matchAll(/this\.spawnMonster\([^;]*?\);/g)].map((match) => match[0]);
		const rosterCall = calls.filter((call) => call.includes('roster['));
		assert.equal(rosterCall.length, 1, `expected one rotated-roster spawn, found ${rosterCall.length}`);
		assert.match(rosterCall[0], /undefined,\s*true\);\s*$/, 'the roster spawn must pass championEligible');
	});
	check('the authored UNDEAD/DEMONIC flag sets match Java, and RipperDemon carries both', () => {
		const mwl = readFileSync(new URL('../src/content/actor-rules.mwl', import.meta.url), 'utf8');
		const flagSet = (flag) => {
			const match = new RegExp(`apply_to:\\s*"${flag}"[^}]*?set:\\s*"([^"\\r\\n]+)"`).exec(mwl);
			assert.ok(match, `no ${flag} flag effect in actor-rules.mwl`);
			return match[1].split(',').map((k) => k.trim()).sort();
		};
		// Java's `Property.UNDEAD` declarations at tag v3.3.8 (DwarfKing/Ghoul/Guard/Monk/
		// Necromancer/RipperDemon/Skeleton/Thief/Warlock/Wraith), subclasses folded onto this
		// port's own ids, `DustWraith` inheriting the base wraith's membership the way Java's
		// `extends` does.
		assert.deepEqual(flagSet('undead'),
			['bandit', 'dustWraith', 'ghoul', 'guard', 'king', 'monk', 'necroSkeleton', 'necromancer', 'ripperDemon', 'senior', 'skeleton', 'spectralNecromancer', 'thief', 'warlock', 'wraith']);
		// Java's `Property.DEMONIC` declarations (DemonSpawner/Eye/FetidRat/Goo/Mimic/RipperDemon/
		// Scorpio/Succubus/YogDzewa/YogFist), with CrystalMimic and Acidic inheriting
		//11th matrix: larva joined the MWL set.
		assert.deepEqual(flagSet('demonic'),
			['acidic', 'crystalMimic', 'demonSpawner', 'eye', 'fetidRat', 'goo', 'larva', 'mimic', 'ripperDemon', 'scorpio', 'succubus', 'yog', 'yogFist']);
		// the ripper demon is the one mob Java marks with both, and the union's consumers rely on it
		assert.ok(flagSet('undead').includes('ripperDemon') && flagSet('demonic').includes('ripperDemon'));
	});
	check('Preparation\'s levels, KO table, blink ranges and damage roll match Java exactly', () => {
		const prep = require('./simulation/preparation');
		// AttackLevel's own declarations: turnsReq / baseDmgBonus / damageRolls
		assert.deepEqual(prep.PREPARATION_LEVELS.map((l) => [l.level, l.turnsReq, l.damageBonus, l.damageRolls]),
			[[1, 1, 0.1, 1], [2, 3, 0.2, 1], [3, 5, 0.35, 2], [4, 9, 0.5, 3]]);
		// getLvl walks the levels in reverse, so the boundary turns matter more than the middle
		assert.deepEqual([0, 1, 2, 3, 4, 5, 8, 9, 40].map((t) => prep.preparationLevel(t).level), [1, 1, 1, 2, 2, 3, 3, 4, 4]);
		// KOThresholds[prepLevel][enhanced_lethality rank], verbatim
		assert.deepEqual([1, 2, 3, 4].map((l) => [0, 1, 2, 3].map((r) => prep.preparationKoThreshold(l, r))), [
			[0.03, 0.04, 0.05, 0.06],
			[0.10, 0.13, 0.17, 0.20],
			[0.20, 0.27, 0.33, 0.40],
			[0.50, 0.67, 0.83, 1.0],
		]);
		// canKO is a strict `<` on the HP *fraction*, and a boss/miniboss only dies at a fifth
		const cases = [
			[2, 100, 1, 0, false, 0.03],   // 0.02 < 0.03
			[3, 100, 1, 0, false, 0.03],   // 0.03 is not < 0.03
			[99, 100, 4, 3, false, 1.0],   // 0.99 < 1.0
			[100, 100, 4, 3, false, 1.0],  // exactly at full HP is not <
		];
		for (const [hp, maxHp, level, rank, boss, threshold] of cases) {
			assert.equal(prep.preparationCanKo(hp, maxHp, level, rank, boss), hp / maxHp < threshold, `${hp}/${maxHp} at threshold ${threshold}`);
		}
		// the fifth for bosses: level 4 rank 3 on a boss needs under 0.2 of maximum
		assert.equal(prep.preparationCanKo(19, 100, 4, 3, true), true);
		assert.equal(prep.preparationCanKo(20, 100, 4, 3, true), false);
		// blinkRanges[prepLevel][assassins_reach rank], verbatim
		assert.deepEqual([1, 2, 3, 4].map((l) => [0, 1, 2, 3].map((r) => prep.preparationBlinkDistance(l, r))), [
			[1, 1, 2, 2], [2, 3, 4, 5], [3, 4, 6, 7], [4, 6, 8, 10],
		]);
		// damageRoll: the best of `damageRolls` rolls, plus the level's own percentage, rounded
		const level1 = prep.preparationLevel(1);
		const level4 = prep.preparationLevel(10);
		assert.equal(prep.preparationDamageRoll(level1, () => 10), 11);          // 10 * 1.10
		assert.equal(prep.preparationDamageRoll(level4, () => 10), 15);          // 10 * 1.50, one roll
		let rolls = 0;
		const sequence = [4, 9, 5];
		assert.equal(prep.preparationDamageRoll(level4, () => { rolls++; return sequence[rolls - 1]; }), 14); // max(4,9,5) = 9 -> 13.5 -> 14
		assert.equal(rolls, 3, 'level 4 must roll three times');
		// and reading a level *number* must not be confused with reading turns of invisibility -
		// `rollDamage` holds the number, and passing it to `preparationLevel` shifts every level
		// by one (a real bug caught by the live probe: level 2 rolled level 1's +10%)
		assert.deepEqual([1, 2, 3, 4, 7].map((n) => prep.preparationLevelByNumber(n).level), [1, 2, 3, 4, 4]);
		assert.deepEqual([1, 2, 3, 4].map((n) => prep.preparationLevelByNumber(n).damageBonus), [0.1, 0.2, 0.35, 0.5]);
		assert.deepEqual([1, 3, 5, 9].map((t) => prep.preparationLevel(t).level), [1, 2, 3, 4]);
	});
	// `MissileWeapon.accuracyFactor` = `Weapon.accuracyFactor * adjacentAccFactor`, and
	// `Hero.attackSkill()` folds it into the *stat*: `max(1, round(attackSkill * accuracy * factor))`.
	// `Random.Float(max)` is `Float() * max` (verified against mwg's own `float(min, max)`), so a
	// 1.5 factor on a 10-accuracy attacker must be indistinguishable - draw for draw, and bit for
	// bit in the stream - from an accuracy-15 attacker with no factor. That equivalence is the
	// whole point of `rollHit`'s sixth parameter; a roll-side multiply would not reproduce it.
	check('the ranged accuracy factor scales the accuracy stat exactly as Hero.attackSkill does', () => {
		const defender = base({ buffs: {} });
		const attacker = base({ accuracy: 10 });
		const run = (seed, a, factor) => {
			const generator = Random.push(seed);
			try {
				return { hit: rollHit(a, defender, Random, false, false, factor), rng: generator.getState() };
			} finally { Random.pop(); }
		};
		let flips = 0;
		for (const seed of [1, 2, 3, 7, 42, 99, 1234, 31337]) {
			assert.deepEqual(run(seed, attacker, 1.5), run(seed, base({ accuracy: 15 }), 1),
				`seed ${seed}: +50% accuracy is the 1.5x stat, consuming the same stream`);
			assert.deepEqual(run(seed, attacker, 0.5), run(seed, base({ accuracy: 5 }), 1),
				`seed ${seed}: -50% accuracy is the 0.5x stat, consuming the same stream`);
			// and the factor genuinely changes outcomes, not just the stat object
			if (run(seed, attacker, 1).hit !== run(seed, attacker, 1.5).hit) flips++;
		}
		assert.ok(flips > 0, 'the +50% ranged factor must flip at least one of these rolls to a hit');
		// `Math.max(1, round(...))`: the factor can never drive a live attacker below 1 accuracy
		assert.deepEqual(run(5, base({ accuracy: 1 }), 0.5), run(5, base({ accuracy: 1 }), 1),
			'a factor that would round accuracy below 1 is floored back to 1, as Hero.attackSkill does');
	});
}
