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
}
