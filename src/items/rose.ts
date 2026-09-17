/**
 * DriedRose's own rules, split out of the scene so they can be checked without a live game - the
 * same split `items/sandals.ts`, `items/talisman.ts` and `items/shopPricing.ts` use. Every formula
 * here is `DriedRose.java` (tag `v3.3.8`) plus the one `RegularLevel.java` petal rule that feeds
 * the artifact; the scene owns the summon, the ally, the aiming and the floor drops.
 *
 * The artifact is a two-part one: a charge clock that raises a `GhostHero` ally (its `AC_SUMMON`),
 * and a petal economy that levels the rose itself (`upgrade()`). While the ghost lives the clock heals
 * it instead of charging, which is why the two halves share one `partialCharge`.
 */
import { mwlItemEffectValue } from '../mwlContent';

export type RoseItem = {
	level?: number;
	/** Java's `charge` (an int) and `partialCharge` (the float build-up toward the next one), the
	 *  same pair `Artifact.java` gives every artifact. */
	charge?: number;
	partialCharge?: number;
	cursed?: boolean;
	/** Java's `droppedPetals`: how many petals this run has already dropped, capped at 11, and the
	 *  input the per-floor drop count is computed from. */
	droppedPetals?: number;
};

/** `DriedRose`'s constructor block: `levelCap = 10` and `charge = chargeCap = 100` (unlike every
 *  other artifact here, the rose starts *full*). */
export function roseLevelCap(): number {
	return mwlItemEffectValue('rose', 'levelCap');
}

export function roseChargeCap(): number {
	return mwlItemEffectValue('rose', 'chargeCap');
}

/** `GhostHero.updateRose()`: `HT = 20 + 8*rose.level()` - the whole of the ghost's durability
 *  curve, which is what the petals buy (8 HP each, per the 0.7.x changelog's own wording). */
export function roseGhostMaxHp(level: number): number {
	return mwlItemEffectValue('rose', 'ghostHpBase') + mwlItemEffectValue('rose', 'ghostHpPerLevel') * level;
}

/** `GhostHero.attackSkill()`: "same accuracy as the hero" - `Dungeon.hero.lvl + 9`. */
export function roseGhostAttackSkill(heroLevel: number): number {
	return heroLevel + mwlItemEffectValue('rose', 'ghostAttackSkillOffset');
}

/** `GhostHero.updateRose()`: "same dodge as the hero" - `Dungeon.hero.lvl + 4`. */
export function roseGhostDefenseSkill(heroLevel: number): number {
	return heroLevel + mwlItemEffectValue('rose', 'ghostDefenseSkillOffset');
}

/** `GhostHero.damageRoll()` with no weapon equipped: `Random.NormalIntRange(0, 5)`. Java's
 *  weapon branch is Not ported - this port has no ally-equipment model (see `PORT_COVERAGE.md`),
 *  so a rose here always fights bare-handed. */
export function roseGhostDamageRange(): readonly [number, number] {
	return [mwlItemEffectValue('rose', 'ghostDamageMin'), mwlItemEffectValue('rose', 'ghostDamageMax')];
}

/** `DriedRose.ghostStrength()`: `13 + level()/2`, Java's integer division - the strength the
 *  ghost is treated as having when it wears equipment, so with no equipment model here it is
 *  reported rather than applied. */
export function roseGhostStrength(level: number): number {
	return mwlItemEffectValue('rose', 'ghostStrengthBase') + Math.floor(level / mwlItemEffectValue('rose', 'ghostStrengthLevelDivisor'));
}

export interface RoseRechargeInput {
	/** Whether a live `GhostHero` exists. Java tracks it as a field/actor id; the scene passes
	 *  whether its own ghost ally is still alive. */
	ghostAlive: boolean;
	/** The ghost's current and maximum HP, when one is alive - the heal half's inputs. */
	ghostHp?: number;
	ghostMaxHp?: number;
	ringMultiplier: number;
	magicImmune: boolean;
	/** Java's `Regeneration.regenOn()`. This port has no regeneration system and no boss-arena
	 *  lock, so the caller passes `true` - the same simplification the Beacon/Chains/Spellbook
	 *  regen blocks already state. */
	regenOn: boolean;
}

/** What one `roseRecharge.act()` tick did, for the caller's logging and for its own ghost HP. */
export interface RoseRechargeResult {
	ghostHealed: number;
	/** True when the trickle completed the charge (`charged` is logged once). */
	charged: boolean;
}

/**
 * `DriedRose.roseRecharge.act()` (tag `v3.3.8`). Two mutually exclusive halves:
 *
 * - **With a live ghost**, the rose does not charge at all. It heals the ghost
 *   `(ghost.HT / 500f) * ringMultiplier` per turn - "heals to full over 500 turns" - and the
 *   healing loop is `while (partialCharge > 1)`, *strictly* greater, so a partial sits at
 *   exactly 1.0 without ever paying out. A ghost already at full HP zeroes `partialCharge`
 *   outright instead.
 * - **With no ghost**, the trickle is `(1/5f) * ringMultiplier` per turn, i.e. 500 turns for the
 *   full 100 points, with the same strict `> 1` boundary and the same "reaching the cap zeroes
 *   the partial" ending.
 *
 * The cursed/`MagicImmune` guards wrap both halves. Java's cursed branch (a 1%-per-turn
 * `Wraith` spawn beside the hero) runs scene-side, next to this call - it needs the live
 * level and scheduler, which this pure function never sees.
 */
export function applyRoseRecharge(item: RoseItem, input: RoseRechargeInput): RoseRechargeResult {
	const result: RoseRechargeResult = { ghostHealed: 0, charged: false };
	if (item.cursed || input.magicImmune) return result;

	if (input.ghostAlive) {
		const maxHp = input.ghostMaxHp ?? 0;
		let hp = input.ghostHp ?? 0;
		if (hp < maxHp && input.regenOn) {
			let partial = (item.partialCharge ?? 0)
				+ (maxHp / mwlItemEffectValue('rose', 'ghostHealTurns')) * input.ringMultiplier;
			while (partial > 1) {
				partial -= 1;
				hp++;
				result.ghostHealed++;
				if (hp >= maxHp) {
					partial = 0;
					break;
				}
			}
			item.partialCharge = partial;
		} else {
			item.partialCharge = 0;
		}
		return result;
	}

	const chargeCap = roseChargeCap();
	let charge = item.charge ?? 0;
	if (charge >= chargeCap || !input.regenOn) return result;
	let partial = (item.partialCharge ?? 0)
		+ mwlItemEffectValue('rose', 'rechargePerTurn') * input.ringMultiplier;
	while (partial > 1) {
		partial -= 1;
		charge++;
		if (charge >= chargeCap) {
			charge = chargeCap;
			partial = 0;
			result.charged = true;
			break;
		}
	}
	item.charge = charge;
	item.partialCharge = partial;
	return result;
}

/** Why `AC_SUMMON` cannot run right now, in Java's own check order (`execute()`'s ladder):
 *  `quest` is the `Ghost.Quest.completed()` gate (which shows the item window instead of an
 *  error), then an already-live ghost, then the charge, then the curse. `no_space` is the scene's
 *  own outcome, not a gate: Java has the same line when no neighbour is free. */
export type RoseSummonGate = 'ok' | 'quest' | 'spawned' | 'no_charge' | 'cursed' | 'missing';

export function roseSummonGate(item: RoseItem | undefined, questComplete: boolean, ghostAlive: boolean, magicImmune: boolean): RoseSummonGate {
	if (!item) return 'missing';
	//`execute()` returns before anything else on `MagicImmune`, silently.
	if (magicImmune) return 'missing';
	if (!questComplete) return 'quest';
	if (ghostAlive) return 'spawned';
	if ((item.charge ?? 0) !== roseChargeCap()) return 'no_charge';
	if (item.cursed) return 'cursed';
	return 'ok';
}

/**
 * `RegularLevel.java`'s petal drop (tag `v3.3.8`): "aim to drop 1 petal every 2 floors",
 * `ceil((depth/2 - rose.droppedPetals) / 3)` petals per floor - with **integer** division inside
 * the `ceil`, exactly as Java writes it, and a hard stop at 11 petals dropped per run ("the
 * player may miss a single petal and still max their rose"). The gate is a carried, identified,
 * uncursed rose plus a completed Sad Ghost quest.
 */
export function rosePetalsNeeded(depth: number, droppedPetals: number): number {
	const behind = Math.floor(depth / 2) - droppedPetals;
	return Math.ceil(behind / 3);
}

/** Java's `rose.droppedPetals < 11` guard, as a count the caller can clamp to. */
export function rosePetalDropCap(): number {
	return mwlItemEffectValue('rose', 'petalDropCap');
}

/** `DriedRose.Petal.doPickUp()`'s two refusals and its success path: no rose at all is a warning
 *  that *blocks* the pickup; a rose already at `levelCap` spends the turn and keeps the petal on
 *  the floor; otherwise the petal levels the rose (`upgrade()`, which also heals a live ghost by
 *  8 and re-derives its HT). */
export type RosePetalPickup = 'no_rose' | 'no_room' | 'levelup' | 'maxlevel';

export function rosePetalPickup(item: RoseItem | undefined): RosePetalPickup {
	if (!item) return 'no_rose';
	if ((item.level ?? 0) >= roseLevelCap()) return 'no_room';
	return (item.level ?? 0) + 1 >= roseLevelCap() ? 'maxlevel' : 'levelup';
}
