/**
 * The HolyTome's charge economy and the three tier-1 Cleric spells
 * (`items/artifacts/HolyTome.java`, `actors/hero/spells/{GuidingLight,HolyWeapon,
 * HolyWard}.java`, tag `v3.3.8`).
 *
 * The tome opens with `charge = min(level+3, 10)` (3 at +0), recharges 0.25 per
 * tick, and spends whole charges off `partialCharge` - borrowing across the unit
 * boundary exactly the way `spendWildMagicShot` does in `simulation/spareWands.ts`.
 * Every spend feeds `exp`, which upgrades the tome (and its cap) at
 * `(level+1)*50`, scaled by how far the hero's level is past the tome's target
 * (`1 + 2*level`, minus one per level past 6).
 *
 * Simplifications, all stated: the carried tome recharges at the full equipped
 * rate (Java scales an unequipped tome by `0.75*LIGHT_READING/3`, and this port
 * has neither an artifact equip slot nor that talent - the same convention the
 * carried cloak already uses); the Priest free-cast cooldown, the Paladin
 * extends (ClericSpell.onSpellCast's `extend(10*chargeUse)`), the PowerOfMany/LifeLink shares, the metamorphosed-talent
 * halves (SearingLightCooldown zap arming, ShieldOfLight's target-side -1, the
 * non-Cleric delayed Satiated Barrier) and the quick-cast spell all need
 * subclasses/talents/systems that do not exist here yet.
 *
 * Buff durations live in authored data (`BUFF_DURATION`, compiled from
 * `src/content/buff-rules.mwl`) - this module keeps no second copy of them.
 */
import { BUFF_DURATION } from './buffs';
export interface TomeChargeState {
	charge: number;
	partialCharge: number;
	level: number;
	exp: number;
}

/** `chargeCap = min(level()+3, 10)` (`HolyTome`'s initializer and `upgrade()`). */
export function tomeChargeCap(level: number): number {
	return Math.min(Math.max(0, level) + 3, 10);
}

/** `levelCap = 10`. */
export const TOME_LEVEL_CAP = 10;

/** A fresh tome arrives full: `charge = min(0+3, 10)`. */
export const TOME_START_CHARGES = 3;

export type TomeSpellId = 'guidingLight' | 'holyWeapon' | 'holyWard';

/** Trinity's three item-form families (`BodyForm`, `MindForm`, `SpiritForm`, tag `v3.3.8`).
 * The scene/UI dispatcher uses a modeled BodyForm weapon/glyph subset; MindForm and SpiritForm
 * remain partial. These pure rules keep their authored numbers in one place for scene flows. */
export type TrinityForm = 'body' | 'mind' | 'spirit';

/** `BodyForm.duration()`: `round(13.33 + 6.67 * points)`, i.e. 20/27/33/40 turns. */
export function trinityBodyDuration(talentRank: number): number {
	return Math.round(13.33 + 6.67 * Math.max(0, Math.min(4, talentRank)));
}

/** `MindForm.itemLevel()`: the selected wand/thrown effect runs at +2 + talent points. */
export function trinityMindItemLevel(talentRank: number): number {
	return 2 + Math.max(0, Math.min(4, talentRank));
}

/** `SpiritForm.ringLevel()` and `artifactLevel()` (tag `v3.3.8`). */
export function trinitySpiritRingLevel(talentRank: number): number {
	return Math.max(0, Math.min(4, talentRank));
}
export function trinitySpiritArtifactLevel(talentRank: number): number {
	return 2 + 2 * Math.max(0, Math.min(4, talentRank));
}

/**
 * `Trinity.trinityChargeUsePerEffect()` (tag `v3.3.8`). The base is the live
 * `ArmorAbility.chargeUse(hero)` result (25 at rank 0); rare body effects,
 * multi-charge wands, and the three high-cost artifacts consume two base units,
 * while chains/talisman/hourglass consume 1.4. Item class names are used because
 * the port's item catalogue has no Java class objects at this pure seam.
 */
export function trinityChargeUsePerEffect(baseCharge: number, itemClass: string, form: TrinityForm): number {
	const rareBody = new Set(['Corrupting', 'Grim', 'Vampiric', 'Affection', 'AntiMagic', 'Thorns']);
	const multiWand = itemClass === 'WandOfFireblast' || itemClass === 'WandOfRegrowth';
	const doubleArtifact = itemClass === 'DriedRose' || itemClass === 'UnstableSpellbook' || itemClass === 'SkeletonKey';
	const fractionalArtifact = itemClass === 'EtherealChains' || itemClass === 'TalismanOfForesight' || itemClass === 'TimekeepersHourglass';
	if ((form === 'body' && rareBody.has(itemClass)) || (form === 'mind' && multiWand) || (form === 'spirit' && doubleArtifact)) return 2 * baseCharge;
	if (form === 'spirit' && fractionalArtifact) return 1.4 * baseCharge;
	return baseCharge;
}

/** `ClericSpell.chargeUse()`: default 1, overridden only by `HolyWeapon.chargeUse() = 2`.
 * `HolyWard.java` has no override at all, so it stays the default 1 - the port previously
 * had it at 2, matching HolyWeapon's cost with no Java basis (found live, ACP audit-01
 * finding K, 2026-09-22). */
export const TOME_SPELL_COST: Record<TomeSpellId, number> = {
	guidingLight: 1,
	holyWeapon: 2,
	holyWard: 1,
};

/** `Hero.heroDamageIntRange(2, 8)`: `Random.NormalIntRange` (clover is unported). */
export const GUIDING_LIGHT_DAMAGE: readonly [number, number] = [2, 8];

/** The non-Paladin holy damage/blocking (Paladin's 6/3 need the subclass). */
export const HOLY_WEAPON_BONUS = 2;
export const HOLY_WARD_BLOCK = 1;

/** Talent spells (`ClericSpell.getSpellList()` tiers 1-2, tag `v3.3.8`): the tier-1
 * pair (HolyIntuition, ShieldOfLight) then the tier-2 row (RecallInscription,
 * Sunray, DivineSense, BlessSpell), each gated on its talent and listed in
 * `getSpellList` order. */
export type TalentSpellId = 'holyIntuition' | 'shieldOfLight' | 'recallInscription' | 'sunray' | 'divineSense' | 'bless' | 'cleanse';
export type SubclassSpellId = 'radiance' | 'holyLance' | 'hallowedGround' | 'mnemonicPrayer' | 'smite' | 'layOnHands' | 'auraOfProtection' | 'wallOfLight' | 'divineIntervention' | 'judgement' | 'flash';

/** `HolyIntuition.chargeUse()`: `4 - points` (3 at rank 1, 2 at rank 2). */
export function holyIntuitionCost(talentRank: number): number {
	return 4 - Math.max(0, talentRank);
}

/** `ShieldOfLight.chargeUse()`: the `ClericSpell` default 1. */
export const SHIELD_OF_LIGHT_COST = 1;

/**
 * `Talent.onFoodEaten()`'s `ENLIGHTENING_MEAL` Cleric half (`Talent.java`, tag
 * `v3.3.8`): eating grants the carried tome `(1+points)/3` of a charge - 2/3 at
 * rank 1, a full charge at rank 2 (`HolyTome.directCharge`, no exp). The -2 eat
 * time and the non-Cleric `Recharging` halves ride systems this port models for
 * no meal talent (eating time is uniform here), so only the tome charge lands.
 */
export function enlighteningMealCharge(talentRank: number): number {
	return (1 + Math.max(0, talentRank)) / 3;
}

/** `RecallInscription.UsedItemTracker` arming (`Talent.java`, tag `v3.3.8`):
 * 10 turns at rank 1, 300 at rank 2. */
export function recallTrackerDuration(talentRank: number): number {
	return Math.max(0, talentRank) === 2 ? 300 : 10;
}

/**
 * `RecallInscription.chargeUse()` (tag `v3.3.8`): the tracked item's class sets
 * the price - exotic Metamorphosis/Enchantment 8, other exotics 4, Transmutation 6,
 * ordinary scrolls 3, Augmentation/Enchantment stones 4, other runestones 2, and 0
 * with no tracked item (which also fails `canCast`). The port generates no exotic
 * scrolls at all, so the named 8-branch is unreachable but kept for the table's
 * sake; every other `ScrollOf*` here costs 3 (Java's exotic-4 has no member).
 */
export function recallInscriptionCost(trackedClass: string | undefined): number {
	if (trackedClass === undefined) return 0;
	if (trackedClass === 'ScrollOfMetamorphosis' || trackedClass === 'ScrollOfEnchantment') return 8;
	if (trackedClass === 'ScrollOfTransmutation') return 6;
	if (trackedClass.startsWith('ScrollOf')) return 3;
	if (trackedClass === 'StoneOfAugmentation' || trackedClass === 'StoneOfEnchantment') return 4;
	if (trackedClass.startsWith('StoneOf')) return 2;
	return 0;
}

/**
 * `Sunray.onTargetSelected()` damage (tag `v3.3.8`): undead/demonic targets take a
 * flat 8 at rank 1 (12 at rank 2); everyone else takes `heroDamageIntRange(4, 8)`
 * (6-12 at rank 2). Returns the flat amount or the roll bounds.
 */
export function sunrayDamage(talentRank: number, undeadOrDemonic: boolean): { flat: number } | { min: number; max: number } {
	const rank2 = Math.max(0, talentRank) === 2;
	if (undeadOrDemonic) return { flat: rank2 ? 12 : 8 };
	return rank2 ? { min: 6, max: 12 } : { min: 4, max: 8 };
}

/**
 * `Sunray` blind/paralyze clock (tag `v3.3.8`): a first-time victim gains
 * `Blindness` for `2+2*points` (4/6) alongside the `RecentlyBlinded` marker; a
 * victim already blind *and* recently marked upgrades to `Paralysis` for the same
 * `2+2*points` instead, detaching the marker. A `UsedTracker` victim with neither
 * gets nothing - each victim blinds once ever.
 */
export function sunrayBlindDuration(talentRank: number): number {
	return 2 + 2 * Math.max(0, talentRank);
}

/** `DivineSense.chargeUse()`: 2. The tracker runs `DURATION` 50 turns
 * (`BUFF_DURATION['divineSense']`, same value, single-sourced). */
export const DIVINE_SENSE_COST = 2;

/**
 * `Level.updateVisibility()`'s DivineSense range (tag `v3.3.8`): `4+4*points`
 * (8/12) for the Cleric. The port's reveal channel is the existing all-mobs
 * `mindvision` (already range-unbounded, stated at its site), so the number only
 * pins the desc text, not a radius.
 */
export function divineSenseRange(talentRank: number): number {
	return 4 + 4 * Math.max(0, talentRank);
}

/** `Sunray`/`BlessSpell` fall back to the `ClericSpell` default cost 1. */
export const SUNRAY_COST = 1;
export const BLESS_COST = 1;
/** `Judgement.chargeUse()` and its base damage (`Judgement.java`, tag `v3.3.8`). */
export const JUDGEMENT_COST = 3;
export function judgementDamageBase(talentRank: number, priorSpellCasts: number): number {
	const base = 5 + 5 * Math.max(0, Math.min(4, talentRank));
	return base + Math.round(base * Math.max(0, priorSpellCasts) / 3);
}

/** `DivineIntervention.chargeUse()`, its `setShield(100 + 50*points)` target and its
 * `AscendBuff.extend(2 + points)` (`DivineIntervention.java`, tag `v3.3.8`). */
export const DIVINE_INTERVENTION_COST = 5;
export function divineInterventionShield(talentRank: number): number {
	return 100 + 50 * Math.max(0, talentRank);
}
export function divineInterventionExtension(talentRank: number): number {
	return 2 + Math.max(0, talentRank);
}

/** `Flash.chargeUse()` and its empty-cell range (`Flash.java`, tag `v3.3.8`). */
export function flashCost(priorFlashCasts: number): number {
	return 2 + Math.max(0, priorFlashCasts);
}
export function flashRange(talentRank: number): number {
	return 2 + Math.max(0, talentRank);
}

/**
 * `BlessSpell.affectChar()` numbers (tag `v3.3.8`): on the hero, `Bless` for
 * `2+4*points` (6/10) plus a max-semantics Barrier of `5+5*points` (10/15); on
 * anyone else, a full heal with the leftover past max HP as Barrier. The port has
 * no per-mob Barrier pool, so the leftover past full is dropped (stated) - the
 * heal itself and the self-cast halves are exact.
 */
export function blessSelfDurations(talentRank: number): { bless: number; shield: number } {
	const rank = Math.max(0, talentRank);
	return { bless: 2 + 4 * rank, shield: 5 + 5 * rank };
}
export function blessOtherDurations(talentRank: number): { bless: number; heal: number } {
	const rank = Math.max(0, talentRank);
	return { bless: 5 + 5 * rank, heal: 5 + 5 * rank };
}

/**
 * `ClericSpell.onSpellCast()`'s Satiated half (`ClericSpell.java`, tag `v3.3.8`):
 * with the talent and a live `SatiatedSpellsTracker`, the cast grants a Barrier
 * of `1 + 2*points` (3 at rank 1, 5 at rank 2 - the talent desc's own numbers)
 * and detaches the tracker. `Barrier.setShield()` keeps the higher of the
 * current shield and the fresh amount, never additive.
 */
export function satiatedShieldAmount(talentRank: number): number {
	return 1 + 2 * Math.max(0, talentRank);
}

/**
 * `Char.attack()`'s Searing Light half (`Char.java`, tag `v3.3.8`): the hero's
 * own hit on an illuminated enemy detaches the debuff and deals
 * `1 + 2*points` (3 at rank 1, 5 at rank 2 - the talent desc's own numbers).
 * Added after the damage multipliers (with `dmgBonus`), before Berserk/Fury.
 */
export function searingLightBonus(talentRank: number): number {
	return 1 + 2 * Math.max(0, talentRank);
}

/**
 * `Char.defenseProc()`'s ShieldOfLight half (`Char.java`, tag `v3.3.8`): a hit
 * from the tracked enemy loses `NormalIntRange(min, 2*min)` with
 * `min = 1 + points` (2-4 at rank 1, 3-6 at rank 2 - the talent desc's own
 * numbers), clamped at zero.
 */
export function shieldOfLightRange(talentRank: number): readonly [number, number] {
	const min = 1 + Math.max(0, talentRank);
	return [min, 2 * min];
}

/** `ShieldOfLightTracker` is prolonged 4f, "1 turn less as the casting is instant". */
export const SHIELD_OF_LIGHT_TURNS = 4;

/** `HolyTome.canCast()`: cursed and MagicImmune refuse before charges are read. */
export type TomeCastGate = 'ok' | 'cursed' | 'warded' | 'charges';
export function tomeCastGate(cursed: boolean, magicImmune: boolean, charge: number, cost: number): TomeCastGate {
	if (cursed) return 'cursed';
	if (magicImmune) return 'warded';
	if (charge < cost) return 'charges';
	return 'ok';
}

/**
 * `HolyTome.spendCharge()`: borrow whole charges off `partialCharge`, bank the
 * level-scaled `exp`, and upgrade at `(level+1)*50` below the cap - subtracting
 * the *new* level's `level*50`, which is what Java's post-`upgrade()` read does.
 * Returns whether the spend leveled the tome (the `levelup` line).
 */
/** `Cleanse.chargeUse()` (tag `v3.3.8`): the ClericSpell default 1 does not apply. */
export const CLEANSE_COST = 2;

/** `Cleanse.onCast()`'s immunity (`Cleanse.java`, tag `v3.3.8`): none at rank 1,
 * `2*(rank-1)` after - "0, 2, or 4. 1 less than displayed as spell is instant". */
export function cleanseImmunityTurns(talentRank: number): number {
	return talentRank > 1 ? 2 * (talentRank - 1) : 0;
}

/** `Cleanse.onCast()`'s Barrier (`Cleanse.java`, tag `v3.3.8`): max-semantics
 * `10*points` on the hero and every affected ally (the ally share has no per-mob
 * pool in this port and is dropped - stated at the resolve). */
export function cleanseShield(talentRank: number): number {
	return 10 * Math.max(0, talentRank);
}

/** `Radiance.chargeUse()` (tag `v3.3.8`): the Priest's subclass-granted burst costs 2. */
export const RADIANCE_COST = 2;
/** `Smite.chargeUse()` (tag `v3.3.8`): the Paladin's subclass-granted strike costs 2. */
export const SMITE_COST = 2;
/** `HolyLance.chargeUse()` (tag `v3.3.8`): the flat 4 ("very expensive"). */
export const HOLY_LANCE_COST = 4;
/** `HallowedGround.chargeUse()` (tag `v3.3.8`): the flat 2. */
export const HALLOWED_GROUND_COST = 2;
/** `AuraOfProtection.chargeUse()` (tag `v3.3.8`): the flat 2. */
export const AURA_COST = 2;
/** `WallOfLight.chargeUse()` (tag `v3.3.8`): 3, or 0 while a wall is already up
 * (the recast just ends it early, free). */
export const WALL_OF_LIGHT_COST = 3;
/** `MnemonicPrayer` and `LayOnHands` override nothing, so they pay `ClericSpell`'s
 * base `chargeUse()` of 1 (tag `v3.3.8`). */
export const PRAYER_COST = 1;
export const LAY_ON_HANDS_COST = 1;

/** `HolyLance`'s `desc()`/`onTargetSelected()` (tag `v3.3.8`): `15+15*points` to
 * `round(27.5+27.5*points)` (30-55/45-83/60-110); undead and demonic take the max. */
export function holyLanceDamage(talentRank: number): readonly [number, number] {
	const rank = Math.max(0, Math.min(3, talentRank));
	return [15 + 15 * rank, Math.round(27.5 + 27.5 * rank)];
}
/** `HolyLance.LanceCooldown` (tag `v3.3.8`): the 30-turn recast gate
 * (`BUFF_DURATION['lanceCooldown']`, same value, single-sourced). */
/** `MnemonicPrayer`'s extension (tag `v3.3.8`): `2+points` (3/4/5) turns. */
export function prayerExtension(talentRank: number): number {
	return 2 + Math.max(0, Math.min(3, talentRank));
}
/** `LayOnHands.affectChar()` (tag `v3.3.8`): `10+5*points` (15/20/25) healing,
 * spilling into shielding, capped at three casts' worth on one holder. */
export function layOnHandsHeal(talentRank: number): number {
	return 10 + 5 * Math.max(0, Math.min(3, talentRank));
}
/** `Smite.bonusDmg()` (tag `v3.3.8`): `5+lvl/2` to `10+lvl` (Java int division),
 * max against undead and demonic. */
export function smiteBonusDamage(heroLevel: number): readonly [number, number] {
	return [5 + Math.floor(heroLevel / 2), 10 + heroLevel];
}
/** `Smite`'s `+300%%` enchantment power (`Weapon.java`, tag `v3.3.8`): `multi += 3`. */
export const SMITE_ENCHANT_BONUS = 3;
/** `AuraOfProtection.AuraBuff.DURATION` (tag `v3.3.8`): the 20-turn window
 * (`BUFF_DURATION['auraProtection']`, same value, single-sourced). */
/** `Char.attack()`/`damage()`'s aura clause (tag `v3.3.8`): `0.9-0.1*points`
 * (10/20/30% off) for same-alignment victims near the aura. */
export function auraDamageFactor(talentRank: number): number {
	return 0.9 - 0.1 * Math.max(0, Math.min(3, talentRank));
}
/** Apply `AuraOfProtection.AuraBuff`'s incoming-damage multiplier to a same-alignment target. */
export function auraProtectedDamage(damage: number, talentRank: number, active: boolean, sameAlignment: boolean, withinAuraRange: boolean): number {
	if (!active || !sameAlignment || !withinAuraRange || damage <= 0) return damage;
	//Java keeps this as a float until Char.damage() receives the int; the port's damage seams
	//already carry integer damage, so truncating here is the equivalent cast.
	return Math.floor(damage * auraDamageFactor(talentRank));
}
/** `Armor.Glyph.genericProcChanceMultiplier()`'s aura term (`Armor.java` 821-831,
 * tag `v3.3.8`): defend-side procs add `0.25 + 0.25*points` for a same-alignment
 * defender near an active aura. Java also accepts a `LifeLinkSpellBuff` on the
 * defender in place of proximity; this port has no LifeLink buff at all, so that
 * alternative is vacuous rather than omitted. */
export function auraProcBonus(talentRank: number, active: boolean, sameAlignment: boolean, withinAuraRange: boolean): number {
	if (!active || !sameAlignment || !withinAuraRange) return 0;
	return 0.25 + 0.25 * Math.max(0, Math.min(3, talentRank));
}
/** `Radiance.onCast()` (tag `v3.3.8`): illuminated victims take `lvl+5`; the
 * Light lasts 100 turns, 20 under the DARKNESS challenge. */
export function radianceBonusDamage(heroLevel: number): number {
	return heroLevel + 5;
}
export const RADIANCE_LIGHT_TURNS = 100;
export const RADIANCE_LIGHT_DARKNESS_TURNS = 20;
/** `Radiance`'s stun for every visible non-ally (`Paralysis 3`, tag `v3.3.8`). */
export const RADIANCE_PARALYSIS_TURNS = 3;
/** The Paladin's `onSpellCast` imbue extension (`ClericSpell.java`, tag `v3.3.8`):
 * every other spell extends an armed HolyWeapon/HolyWard buff by `10*charge`. */
export function paladinImbueExtension(chargeSpent: number): number {
	return 10 * chargeSpent;
}

/**
 * `HolyWeapon.HolyWepBuff.extend()` / `HolyWard.HolyArmBuff.extend()` (tag
 * `v3.3.8`): the extension lands unless it would pass twice the 50-turn
 * `DURATION`, in which case the clock pins at 100 - `Math.min` either way.
 */
export function paladinImbueTotal(currentTurns: number, chargeSpent: number): number {
	return Math.min(currentTurns + paladinImbueExtension(chargeSpent), 2 * BUFF_DURATION['holyWeapon']);
}

/** `GuidingLight.GuidingLightPriestCooldown` (tag `v3.3.8`): the 50-turn
 * free-cast gate (`BUFF_DURATION['guidingPriestCooldown']`, same value,
 * single-sourced). */

/**
 * `GuidingLight.chargeUse()`'s Priest half (tag `v3.3.8`): free while the
 * cooldown is down, otherwise the base 1.
 */
export function guidingLightCost(subclass: string | null, cooldownArmed: boolean): number {
	return subclass === 'priest' && !cooldownArmed ? 0 : TOME_SPELL_COST.guidingLight;
}

/** `LayOnHands`'s shielding cap (tag `v3.3.8`): at most three casts' worth at once. */
export const LAY_ON_HANDS_SHIELD_CASTS = 3;

/** `PowerOfMany.PowerBuff` (`actors/hero/abilities/cleric/PowerOfMany.java`,
 * tag `v3.3.8`): a powered ally gets 100 turns of the buff before it expires. */
export const POWER_OF_MANY_TURNS = 100;

/** `Char.attack()` / `Char.damage()`'s PowerBuff factors (same Java source/tag). */
export const POWER_OF_MANY_ATTACK_FACTOR = 1.25;
export function powerOfManyDamageFactor(lifeLinkRank: number): number {
	return lifeLinkRank > 0 ? 0.70 - 0.05 * Math.min(4, lifeLinkRank) : 0.75;
}

/** `HallowedGround`'s radius (tag `v3.3.8`): the distance map runs `points` deep. */
export function hallowedGroundRadius(talentRank: number): number {
	return Math.max(0, Math.min(3, talentRank));
}

/** `HallowedGround.desc()`'s area (tag `v3.3.8`): `1+2*points` a side (3x3/5x5/7x7). */
export function hallowedGroundSide(talentRank: number): number {
	return 1 + 2 * hallowedGroundRadius(talentRank);
}

/** `HallowedGround`'s cast heal (15, shielding for the healthy) and terrain clock (20). */
export const HALLOWED_GROUND_HEAL = 15;
export const HALLOWED_GROUND_TURNS = 20;

/** `HallowedTerrain`'s per-turn ally tick (1 HP, or 1 shielding for the healthy). */
export const HALLOWED_GROUND_TICK = 1;

/** `HallowedGround`'s opening root on grounded enemies: `Roots` 2. */
export const HALLOWED_GROUND_ROOTS_TURNS = 2;

/**
 * `HallowedTerrain.evolve()`'s grass roll (tag `v3.3.8`): each grass cell upgrades
 * on `1-in-(10+10*points)` (tall grass, or furrowed past the tracker's 100).
 */
export function hallowedGrassChance(talentRank: number): number {
	return 10 + 10 * Math.max(0, Math.min(3, talentRank));
}

/** `HallowedGround.HallowedFurrowTracker`'s furrow threshold (tag `v3.3.8`): 100. */
export const HALLOWED_FURROW_COUNT = 100;

/** `WallOfLight`'s width (tag `v3.3.8`): `points` steps each way, `1+2*points` wide. */
export function wallOfLightWidth(talentRank: number): number {
	return 1 + 2 * Math.max(0, Math.min(3, talentRank));
}

/** `WallOfLight`'s terrain clock (tag `v3.3.8`): every panel seeds 20. */
export const WALL_OF_LIGHT_TURNS = 20;

/**
 * `WallOfLight.placeWall()`'s stun (tag `v3.3.8`): `Paralysis` for the victim's own
 * `cooldown()`, which is 1 for every ordinary char.
 */
export const WALL_OF_LIGHT_PARALYSIS_TURNS = 1;

/**
 * `WallOfLight.chargeUse()` (tag `v3.3.8`): 0 while a wall is already up (the
 * recast just ends it early), else 3. The flow re-checks the live wall.
 */
export function wallOfLightCost(wallActive: boolean): number {
	return wallActive ? 0 : WALL_OF_LIGHT_COST;
}

/**
 * `MnemonicPrayer.affectChar()`'s ally half (tag `v3.3.8`): the port buffs whose
 * Java classes carry `type = buffType.POSITIVE` with a real icon. Every other
 * Java positive (Healing/AquaHealing pools, Barkskin/AdrenalineSurge stacks,
 * `ArtifactRecharge`, the Barrier `ShieldBuff` clock, Sungrass's boost, the
 * LifeLink/PowerOfMany/Trinity/BeamingRay armor-ability buffs) has no port model,
 * so those exclusions are vacuous here - stated, not silent.
 */
export const MNEMONIC_POSITIVE_BUFFS: readonly string[] = [
	'adrenalineSurge', 'awareness', 'auraProtection', 'berserk', 'bless',
	'blobImmunity', 'cleanseImmunity', 'divineSense', 'fireImbue', 'frostImbue',
	'fury', 'haste', 'holyWard', 'holyWeapon', 'invisibility', 'levitation',
	'light', 'mindvision', 'prismaticGuard', 'recharging', 'shieldOfLight',
	'toxicImbue',
];

/** `HolyTome.TomeRecharge.act()`'s per-turn gain (tag `v3.3.8`): `1/turnsToCharge`
 * with `turnsToCharge = (45-missing)/energyMult` and `missing = cap-charge` plus
 * `5*(level-7)/3` past tome level 7. Gating (cap, cursed, `MagicImmune`, `regenOn` -
 * the `LockedFloor` boss-arena lock; no `Vault` floor exists here) is scene-side; the carried tome ticks
 * at this equipped rate by the carried-cloak convention (nothing is ever equipped).
 * `LIGHT_READING`'s `0.75*rank/3` scales only *un*equipped tomes, which cannot exist
 * here, so it has no half in this rate - stated, not silent. */
export function tomeTickRate(chargeCap: number, charge: number, tomeLevel: number, energyMult: number): number {
	let missing = chargeCap - charge;
	if (tomeLevel > 7) missing += 5 * (tomeLevel - 7) / 3;
	return 1 / ((45 - missing) / energyMult);
}

export function spendTomeCharge(state: TomeChargeState, spent: number, heroLevel: number): boolean {
	state.partialCharge -= spent;
	while (state.partialCharge < 0) {
		state.charge -= 1;
		state.partialCharge += 1;
	}
	let lvlDiff = heroLevel - (1 + state.level * 2);
	if (state.level >= 7) lvlDiff -= state.level - 6;
	state.exp += lvlDiff >= 0
		? Math.round(spent * 10 * Math.pow(1.1, lvlDiff))
		: Math.round(spent * 10 * Math.pow(0.75, -lvlDiff));
	if (state.exp >= (state.level + 1) * 50 && state.level < TOME_LEVEL_CAP) {
		state.level += 1;
		state.exp -= state.level * 50;
		return true;
	}
	return false;
}
