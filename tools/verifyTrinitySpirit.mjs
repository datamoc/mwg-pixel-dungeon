import assert from 'node:assert/strict';
import { readSceneSource } from './sceneSource.mjs';

/**
 * Trinity SpiritForm's UnstableSpellbook case (`chooseTrinitySpiritEffect`/
 * `commitTrinitySpiritSpellbook` in `armorAbilityUse.ts`), against `SpiritForm.java`/
 * `Trinity.java` (tag `v3.3.8`). Source-level: the scene owns `armorCharge`/`hero.buffs` state
 * this harness cannot construct without Pixi. Live-verified 2026-09-23
 * (`tools/scratch/trinity-spirit-spellbook-livecheck.mjs`): 25-base cost doubled to 50 spent,
 * invisibility dispelled, magicImmune and low-charge both refuse without spending.
 */
export function verifyTrinitySpirit(require, check) {
	check('Trinity SpiritForm offers UnstableSpellbook and reads it correctly', () => {
		const scene = readSceneSource();
		assert.ok(scene.includes("{ label: 'Spirit Form', onPick: () => this.chooseTrinitySpiritEffect(cost) }"),
			'the top-level Trinity picker routes Spirit Form to its own chooser, not a bare commit');
		assert.ok(scene.includes("{ label: 'Unstable Spellbook', onPick: () => this.commitTrinitySpiritSpellbook(cost) }"),
			'the spirit-effect picker offers Unstable Spellbook');
		//`SpiritForm.applyActiveArtifactEffect(UnstableSpellbook)` calls `effect.doReadEffect(hero)`
		//directly - skipping `execute()`'s isEquipped/charge/cursed gates - so this port's commit
		//must likewise skip any bag/charge lookup and go straight to the scroll draw + apply.
		assert.ok(scene.includes("trinityChargeUsePerEffect(baseCost, 'UnstableSpellbook', 'spirit')"),
			"costs the doubled UnstableSpellbook rate, not the base charge");
		assert.ok(scene.includes('applyScrollEffect(randomSpellbookScroll(), this.scrollEffectsContext())'),
			'draws and applies a scroll through the same seam the Arcane Catalyst and the real artifact use');
		assert.ok(!/commitTrinitySpiritSpellbook[\s\S]{0,400}bag\.find\(['"]spellbook['"]/.test(scene),
			"never looks up a persisted bag spellbook instance - Trinity's own doesn't exist as an owned item");
		assert.ok(/commitTrinitySpiritSpellbook[\s\S]{0,600}magicImmune/.test(scene),
			'refuses under MagicImmune, matching every other tome-spell gate');
		assert.ok(/commitTrinitySpiritSpellbook[\s\S]{0,300}armorCharge < cost/.test(scene),
			'refuses on insufficient armor charge before spending anything');
	});
}
