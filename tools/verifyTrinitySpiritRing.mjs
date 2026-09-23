import assert from 'node:assert/strict';
import { readSceneSource } from './sceneSource.mjs';

/**
 * Trinity SpiritForm's Ring branch (`trinitySpiritRing()`/`commitTrinitySpiritRing()` in
 * `panelsSingleUse.ts`/`armorAbilityUse.ts`, and every ring-formula call site across the scene),
 * against `Ring.getBuffedBonus()`/`SpiritForm.java`/`Trinity.java` (tag `v3.3.8`). Source-level:
 * the scene owns `armorCharge`/`equippedRing`/`hero` state this harness cannot construct without
 * Pixi. Live-verified 2026-09-23 (`tools/scratch/trinity-spirit-ring-formula-livecheck.mjs`):
 * spirit-only Might applies its full bonus, an equipped Might ring masks it (fallback, not a
 * stack), an equipped ring of a *different* stat lets spirit Might apply in full alongside it,
 * and spirit Evasion reaches the hero through the StatBlock path with no equipped ring at all.
 */
export function verifyTrinitySpiritRing(require, check) {
	check('Trinity SpiritForm Ring branch: state, fallback combine, and every formula call site', () => {
		const scene = readSceneSource();
		assert.ok(scene.includes('label: `Ring: ${key}`,'), 'the spirit-effect picker offers every RING_DEFS kind');
		assert.ok(scene.includes("onPick: () => this.commitTrinitySpiritRing(`ring_${key}`, cost),"),
			'ring options commit through commitTrinitySpiritRing with the ring_ id prefix');
		assert.ok(scene.includes('trinitySpiritRing(this: DungeonScene): EquippedRing | null'),
			'the scene exposes a trinitySpiritRing() getter');
		assert.ok(scene.includes("if (this.trinityForm !== 'spirit' || this.trinityTurns <= 0 || !this.trinitySpiritEffect) return null;"),
			'the getter gates on an active spirit form with a stored effect');
		assert.ok(scene.includes('level: this.talentRank(\'spirit_form\')'), "the ring's level is the SPIRIT_FORM talent rank, not a stored value");
		assert.ok(scene.includes('this.trinityTurns = 20;'), "committing a ring arms Java's real 20-turn SpiritFormBuff duration");
		assert.ok(scene.includes('if (this.equippedRing?.id === ringId)'), 'refuses duplicating the exact equipped ring kind');
		// Every real ring-formula function this port has must be called with the spirit ring too -
		// a regression that adds a new ring-formula call site (or drops the argument from an
		// existing one) without wiring the fallback would otherwise pass unnoticed.
		const ringCalls = [...scene.matchAll(/\bring[A-Z]\w*\(\s*(?:this|scene)\.effectiveRing\(\)[^)]*\)/g)]
			.map((m) => m[0]);
		assert.ok(ringCalls.length >= 20, `expected at least 20 ring-formula call sites, found ${ringCalls.length}`);
		const unwired = ringCalls.filter((call) => !call.includes('trinitySpiritRing()'));
		assert.deepEqual(unwired, [], 'every ring-formula call site alongside effectiveRing() also passes trinitySpiritRing()');
		// The two StatBlock-routed stats (Accuracy/Evasion) go through combinedStatBonusLevel
		// directly instead (a different call shape - independent per-stat fallback, not a single
		// blended EquippedRing), covered by the mirror/prismatic-image and syncHeroFromStats sites.
		const combinedCalls = [...scene.matchAll(/combinedStatBonusLevel\(this\.effectiveRing\(\), spiritRing,/g)];
		assert.ok(combinedCalls.length >= 5, `expected at least 5 combinedStatBonusLevel sites (StatBlock + mirror + prismatic), found ${combinedCalls.length}`);
	});
}
