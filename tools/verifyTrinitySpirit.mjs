import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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
	check('Trinity SpiritForm offers Horn, Hourglass and DriedRose with Java-shaped effects', () => {
		const scene = readSceneSource();
		const horn = readFileSync(new URL('../src/items/horn.ts', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
		for (const label of ["label: 'Horn of Plenty'", 'label: "Timekeeper\'s Hourglass"', "label: 'Dried Rose'"]) {
			assert.ok(scene.includes(label), `picker offers ${label}`);
		}
		// Hourglass: Swiftthistle-style bubble of artifactLevel (+1 for the cast's own spend), never the hourglass freeze.
		assert.ok(scene.includes('this.timeBubbleTurns = this.trinityArtifactLevel() + 1;'), 'bubble is artifactLevel + 1');
		assert.ok(/trinitySpiritHourglass[\s\S]{0,120}this\.hourglassFreeze = false/.test(scene), 'no hourglass freeze bookkeeping');
		// Rose: HP = HT = 20 + 8*artifactLevel on a corrupted (ally) wraith beside the hero.
		assert.ok(scene.includes('wraith.hp = wraith.maxHp = 20 + 8 * this.trinityArtifactLevel();'), 'rose wraith HP');
		assert.ok(scene.includes("return 2 + 2 * this.talentRank('spirit_form');"), 'artifactLevel = 2 + 2*rank');
		// Horn: doEatEffect(hero, 1) - one charge of satiety (STARVING/5, a third under no_food), meal talents, TIME_TO_EAT.
		assert.ok(scene.includes('eatTrinityHornFlow(this.hornFlowContext())'), 'horn routes through the shared meal tail');
		assert.ok(/export function eatTrinityHornFlow[\s\S]{0,200}hornSatietyPerCharge\(\)/.test(horn), 'one charge of satiety');
		assert.ok(/export function eatTrinityHornFlow[\s\S]{0,500}ctx\.spendTurn\(ctx\.hasFastEating\(\) \? 1 : 3\)/.test(horn), 'the full meal turn');
		// Shared tail: MagicImmune refusal, armor-charge gate, invisibility dispel, and the turn only for spendAndNext cases.
		assert.ok(/commitTrinitySpiritArtifact[\s\S]{0,500}magicImmune[\s\S]{0,300}invisibility[\s\S]{0,120}if \(spendsTurn\) this\.spendHeroAction\(1\)/.test(scene), 'shared Spirit-button tail');
	});
}
