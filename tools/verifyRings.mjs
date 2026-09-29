import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readSceneSource } from './sceneSource.mjs';

// Called by verifySimulation.mjs after compiling actual production modules into its temp tree.
export function verifyRings(require, check) {
	check('the Ring of Elements reader matches Java at every bonus level', () => {
		// `RingOfElements.resist()` is `pow(0.825, getBuffedBonus(...))` (tag `v3.3.8`); the
		// bonus level is `level + 1` uncursed, `min(0, level - 2)` cursed, and 0 outright under
		// the AntiMagic glyph - see `ringBonusLevel`'s own comment. These pins cover the exact
		// factor the scene's elemental-damage sites multiply by.
		const { ringElementsMultiplier } = require('./items/ringModifiers');
		assert.equal(ringElementsMultiplier(null), 1, 'no ring resists nothing');
		assert.equal(ringElementsMultiplier({ id: 'ring_haste', level: 5 }), 1, 'a non-Elements ring resists nothing');
		assert.equal(ringElementsMultiplier({ id: 'ring_elements', level: 0 }), 0.825, 'a plain +0 ring resists one bonus level');
		assert.equal(ringElementsMultiplier({ id: 'ring_elements', level: 3 }), Math.pow(0.825, 4), '+3 resists four bonus levels');
		assert.equal(ringElementsMultiplier({ id: 'ring_elements', level: 0, cursed: true }), Math.pow(0.825, -2),
			'a cursed +0 ring is an active penalty, not a weaker resist');
		assert.equal(ringElementsMultiplier({ id: 'ring_elements', level: 5 }, true), 1,
			'AntiMagic suppresses the ring entirely');
	});
	check('Ring of Elements scales represented resisted buff durations at the shared attach boundary', () => {
		const { ringElementsBuffDurationMultiplier } = require('./items/ringModifiers');
		const elements = { id: 'ring_elements', level: 0 };
		for (const effect of ['burning', 'chill', 'frost', 'ooze', 'paralysis', 'poison', 'corrosion',
			'magicalSleep', 'charm', 'weakness', 'vulnerable', 'hex', 'degrade']) {
			assert.equal(ringElementsBuffDurationMultiplier(effect, elements), 0.825, `${effect} duration uses RingOfElements.RESISTS`);
		}
		assert.equal(ringElementsBuffDurationMultiplier('roots', elements), 1, 'an unresisted status keeps its duration');

		const { addBuff, reigniteBuff, resistedBuffDuration, setBuffDurationModifier } = require('./combat');
		const hero = { buffs: {}, kind: 'warrior', isHero: true, isNPC: false };
		const mob = { buffs: {}, kind: 'rat', isHero: false, isNPC: false };
		setBuffDurationModifier((creature, effect, duration) => creature.isHero
			? duration * ringElementsBuffDurationMultiplier(effect, elements)
			: duration);
		addBuff(hero, 'paralysis', 10);
		assert.equal(hero.buffs.paralysis, 8.25, 'Buff.affect duration is scaled before the shared applier stores it');
		reigniteBuff(hero, 'chill', 10);
		assert.equal(hero.buffs.chill, 8.25, 'Buff.prolong duration is scaled before comparing/extending the active clock');
		assert.equal(resistedBuffDuration(hero, 'corrosion', 10), 8.25, 'bespoke Corrosion clocks use the same resistance boundary');
		addBuff(mob, 'poison', 10);
		assert.equal(mob.buffs.poison, 10, 'a monster without a worn ring is unchanged');
		setBuffDurationModifier(null);
		const { applyChillFreeze, BUFF_DURATION } = require('./simulation/buffs');
		const chill = applyChillFreeze({ chill: BUFF_DURATION.chill - 0.5 }, 1, 0.825);
		assert.equal(chill.frozen, true, 'resisted Chill accumulates by its scaled duration until the cap');
		assert.equal(chill.buffs.frost, BUFF_DURATION.frost * 0.825, 'the resulting Frost duration is resisted too');
		assert.equal(chill.buffs.paralysis, BUFF_DURATION.frost * 0.825, 'Frost’s Paralysis duration is resisted too');
	});
	check('the Java RingOfElements status set and buff duration scaling are connected to the scene', () => {
		const source = readFileSync(new URL('../src/combat.ts', import.meta.url), 'utf8');
		assert.match(source, /resistedBuffDuration\(c, id, duration \?\? BUFF_DURATION\[id\]\)/,
			'addBuff and reigniteBuff resolve default duration then apply the resistance hook');
		const panels = readFileSync(new URL('../src/scenes/dungeon/panelsSingleUse.ts', import.meta.url), 'utf8');
		assert.match(panels, /setBuffDurationModifier\(\(creature, effect, duration\) => creature\.isHero/,
			'the live scene applies equipped ring resistance to hero buff durations');
		const modifiers = readFileSync(new URL('../src/items/ringModifiers.ts', import.meta.url), 'utf8');
		assert.match(modifiers, /RingOfElements\.RESISTS/,
			'the authored status mapping documents Java’s resisted-effect set');
		const environmental = readFileSync(new URL('../src/scenes/dungeon/environmentFireTraps.ts', import.meta.url), 'utf8');
		assert.match(environmental, /applyChillFreeze\(target\.buffs, 3, resistedBuffDuration\(target, 'chill', 1\)\)/,
			'Freezing blobs pass RingOfElements resistance into their direct Chill/Frost clock');
		const darts = readFileSync(new URL('../src/scenes/dungeon/hero/tippedDartEffects.ts', import.meta.url), 'utf8');
		assert.match(darts, /resistedBuffDuration\(target, 'corrosion', 10\)/,
			'RotDart passes RingOfElements resistance into its bespoke Corrosion clock');
	});
	check('Monk unarmed abilities suppress RingOfForce armed damage bonus', () => {
		const monk = readFileSync(new URL('../src/scenes/dungeon/hero/monkAbilities.ts', import.meta.url), 'utf8');
		assert.match(monk, /this\.monk\.unarmedAttack = true;[\s\S]*?return this\.attack\(this\.hero, enemy, 1, multiplier\);[\s\S]*?this\.monk\.unarmedAttack = savedUnarmedAttack;/,
			'the Java-shaped unarmed tracker brackets the Monk attack and restores prior state');
		const combat = readFileSync(new URL('../src/scenes/dungeon/combatResolution.ts', import.meta.url), 'utf8');
		assert.match(combat, /attacker === this\.hero && !this\.monk\.unarmedAttack\) damage \+= ringForceBonus/,
			'the shared hero melee path omits armed bonus while the unarmed tracker is active');
	});
	check('the electricity and corrosion hero damage paths apply the Ring of Elements multiplier', () => {
		// Electricity and Corrosion are both in `RingOfElements`' RESISTS set (tag `v3.3.8`), so
		// the hero-side ticks must scale by `ringElementsMultiplier` the same way the
		// burning/poison/toxic-gas/ooze sites already do. dungeonScene.ts cannot load in this
		// harness (Pixi), so this pins the call sites at source level, the way verifyCombat's
		// champion-eligible spawn check does.
		const source = readSceneSource();
		const lines = source.split('\n');
		const electricStart = lines.findIndex((line) => line.includes('electricDamage:'));
		assert.ok(electricStart >= 0, 'the electricity blob adapter still defines electricDamage');
		assert.match(lines.slice(electricStart, electricStart + 10).join('\n'), /ringElementsMultiplier/,
			'the electricity hero tick must scale by the Elements ring');
		const corrosionStart = source.indexOf('tickCorrosion(this: DungeonScene, target: Creature)');
		assert.ok(corrosionStart >= 0, 'tickCorrosion still exists');
		const corrosionEnd = source.indexOf('\n\t}', corrosionStart);
		assert.ok(corrosionEnd > corrosionStart, 'tickCorrosion still ends at one-tab depth');
		assert.match(source.slice(corrosionStart, corrosionEnd), /ringElementsMultiplier/,
			'the corrosion hero tick must scale by the Elements ring');
	});

	check("SpiritForm's ring is a fallback, not a stack (`Ring.getBonus`, tag `v3.3.8`)", () => {
		//Java applies the spirit ring only when the equipped bonus is exactly 0 -
		//an equipped same-class ring contributing anything (even a cursed negative)
		//shuts it out for that formula, a kind mismatch falls through to it.
		const { ringElementsMultiplier, ringForceBonus, ringMightBonus, ringTenacityMultiplier,
			ringHasteMultiplier, ringEnergyMultiplier, ringArcanaMultiplier, ringWealthMultiplier,
			ringWealthBonus, ringFurorMultiplier, ringSharpshootingDurabilityMultiplier,
			combinedStatBonusLevel } = require('./items/ringModifiers');
		const elements0 = { id: 'ring_elements', level: 0 };
		const elements2 = { id: 'ring_elements', level: 2 };
		const haste = { id: 'ring_haste', level: 4 };
		//equipped same-class wins even when the spirit ring is bigger
		assert.equal(ringElementsMultiplier(elements0, false, elements2), Math.pow(0.825, 1));
		//kind mismatch falls through to the spirit ring
		assert.equal(ringElementsMultiplier(haste, false, elements2), Math.pow(0.825, 3));
		assert.equal(ringElementsMultiplier(null, false, elements2), Math.pow(0.825, 3));
		assert.equal(ringElementsMultiplier(null, false, null), 1);
		//the gate is == 0: a cursed-negative equipped bonus still shuts the spirit out,
		//a cursed-exactly-zero one falls through
		assert.equal(ringElementsMultiplier({ id: 'ring_elements', level: 0, cursed: true }, false, elements2),
			Math.pow(0.825, -2));
		assert.equal(ringElementsMultiplier({ id: 'ring_elements', level: 2, cursed: true }, false, elements2),
			Math.pow(0.825, 3));
		//AntiMagic zeroes both sides
		assert.equal(ringElementsMultiplier(elements0, true, elements2), 1);
		//additive helpers share the gate
		assert.equal(ringForceBonus({ id: 'ring_force', level: 1 }, false, { id: 'ring_force', level: 3 }), 2);
		assert.equal(ringForceBonus(haste, false, { id: 'ring_force', level: 0 }), 1);
		assert.equal(ringMightBonus(null, false, { id: 'ring_might', level: 2 }), 3);
		assert.equal(ringWealthBonus({ id: 'ring_wealth', level: 0 }, false, null), 1);
		//multiplicative identity holds with no ring on either side
		assert.equal(ringHasteMultiplier(null, false, null), 1);
		assert.equal(ringEnergyMultiplier(null, false, null), 1);
		assert.equal(ringArcanaMultiplier(null, false, null), 1);
		assert.equal(ringWealthMultiplier(null, false, null), 1);
		assert.equal(ringFurorMultiplier(null, false, null), 1);
		assert.equal(ringSharpshootingDurabilityMultiplier(null, false, null), 1);
		//tenacity reads the combined level against live HP
		assert.equal(ringTenacityMultiplier(haste, 50, 100, false, { id: 'ring_tenacity', level: 1 }),
			Math.pow(0.85, 2 * 0.5));
		//the combiner itself: match wins, mismatch falls, immune zeroes
		assert.equal(combinedStatBonusLevel(elements0, elements2, 'elements', false), 1);
		assert.equal(combinedStatBonusLevel(haste, elements2, 'elements', false), 3);
		assert.equal(combinedStatBonusLevel(elements0, elements2, 'elements', true), 0);
	});
}
