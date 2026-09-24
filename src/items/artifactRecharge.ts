/**
 * `ArtifactRecharge` (`actors/buffs/ArtifactRecharge.java`, tag `v3.3.8`) - the one thing in the game
 * that calls `Artifact.charge(Hero, amount)`, the per-artifact passive-recharge hook every
 * `items/artifacts/*.java` overrides.
 *
 * That matters here for a documentation reason as much as a gameplay one: this port has been
 * carrying "the external `Artifact.charge(Hero, amount)` boost has no caller here" in several
 * artifact rows (Talisman, Sandals, Rose), because nothing in the port ever called it. This module
 * *is* the caller, so those hooks can be real.
 *
 * Java's `Artifact.charge()` is a **no-op by default** ("do nothing by default"), so only the
 * artifacts that override it are affected at all; each override has its own rate and its own edge
 * behaviour, which is what the table below records. The caller-supplied `amount` is Java's
 * `chargeAmount = min(1, buff.left)`, so one tick of the buff is worth at most 1.0.
 */
import { mwlItemEffectValue } from '../mwlContent';

/** Which gates an override opens with. Java's overrides are not uniform here, and the two
 *  exceptions are load-bearing: the **Alchemists Toolkit banks charge even while cursed** (its
 *  `charge()` guards only on `MagicImmune`), and the **Cape of Thorns has no guard at all**. */
export type RechargeGuards = 'cursedAndImmune' | 'immuneOnly' | 'none';

/** What one artifact's `charge(Hero, amount)` override does, as data the scene can apply. Every
 *  variant carries its own {@link RechargeGuards} in the table below, not in this union. */
export type ArtifactRechargeEffect =
	/** `partialCharge += rate*amount`, banked in whole units onto the integer `charge`. The Cloak's
	 *  own extra clause (`amount *= 0.75*pointsInTalent(LIGHT_CLOAK)/3` while unequipped) is what
	 *  `talentScale` marks - it is not applied here, since this port has no artifact equip slot. */
	| { kind: 'charge'; rate: number; capZeroesPartial: boolean; fullLineKey?: string; talentScale?: true }
	/** Cape of Thorns: `charge += round(4*amount)` while `cooldown == 0`, then procs at the cap. */
	| { kind: 'addCharge'; rate: number; procAtCap: true }
	/** Chalice of Blood: heals instead of charging (its own formula, applied by the scene). */
	| { kind: 'chaliceHeal' }
	/** Dried Rose: charges with no ghost up, heals a live one otherwise. */
	| { kind: 'rose'; rate: number }
	/** The default `Artifact.charge()`, which does nothing at all. */
	| { kind: 'none' };

/**
 * Every override at tag `v3.3.8`, in the artifact's own terms. Artifacts *absent* from this table
 * (Timekeeper's Hourglass among them) never override `charge()`, so they inherit Java's no-op and
 * are unaffected by a recharge. Present: Cloak of Shadows (0.25, with the Light Cloak talent scale
 * when unequipped), Horn of Plenty (0.25, `full` line), Lloyds Beacon (0.25), Alchemists Toolkit
 * (0.25, and notably with **no** cursed guard - only `MagicImmune`), Master Thieves Armband (0.1,
 * `full`), Unstable Spellbook (0.1), Ethereal Chains (0.5, and capped at **twice** its soft
 * `chargeTarget`), Talisman of Foresight (2, `full_charge`), Sandals of Nature (2), Dried Rose (4,
 * or a heal), Cape of Thorns (a flat `round(4*amount)` of charge), Chalice of Blood (a heal),
 * HolyTome (0.25).
 *
 * Talisman/Sandals/DriedRose override `charge()` *directly*; the first seven reach it through the
 * base class's forwarding `ArtifactBuff.charge()` (`Artifact.java` 275), which is why Java's own
 * call site walks the hero's *buffs* rather than his items - a distinction this port does not need,
 * since it has no artifact buffs and applies the same table to the carried items.
 */
export const ARTIFACT_RECHARGE_EFFECTS: Readonly<Record<string, ArtifactRechargeEffect & { guards: RechargeGuards }>> = {
	cloak: { kind: 'charge', rate: 0.25, capZeroesPartial: true, talentScale: true, guards: 'cursedAndImmune' },
	horn: { kind: 'charge', rate: 0.25, capZeroesPartial: true, fullLineKey: 'items.artifacts.hornofplenty.full', guards: 'cursedAndImmune' },
	beacon: { kind: 'charge', rate: 0.25, capZeroesPartial: false, guards: 'cursedAndImmune' },
	toolkit: { kind: 'charge', rate: 0.25, capZeroesPartial: false, guards: 'immuneOnly' },
	armband: { kind: 'charge', rate: 0.1, capZeroesPartial: true, fullLineKey: 'items.artifacts.masterthievesarmband.full', guards: 'cursedAndImmune' },
	spellbook: { kind: 'charge', rate: 0.1, capZeroesPartial: true, guards: 'cursedAndImmune' },
	chains: { kind: 'charge', rate: 0.5, capZeroesPartial: false, guards: 'cursedAndImmune' },
	talisman: { kind: 'charge', rate: 2, capZeroesPartial: true, fullLineKey: 'items.artifacts.talismanofforesight.full_charge', guards: 'cursedAndImmune' },
	sandals: { kind: 'charge', rate: 2, capZeroesPartial: true, guards: 'cursedAndImmune' },
	rose: { kind: 'rose', rate: 4, guards: 'cursedAndImmune' },
	cape: { kind: 'addCharge', rate: 4, procAtCap: true, guards: 'none' },
	chalice: { kind: 'chaliceHeal', guards: 'cursedAndImmune' },
	//`HolyTome.charge()`: 0.25, zeroing partial at the cap. The LIGHT_READING
	//scale for an unequipped tome is not modeled: this port has no artifact
	//equip slot and no such talent, so a carried tome recharges at the full
	//equipped rate (the carried-cloak convention).
	holyTome: { kind: 'charge', rate: 0.25, capZeroesPartial: true, guards: 'cursedAndImmune' },
	//`SkeletonKey.charge()`: `partialCharge += 0.133f*amount`, zeroed at the cap (`skeletonkeyPartialPerAmount`).
	skeletonkey: { kind: 'charge', rate: 0.133, capZeroesPartial: true, guards: 'cursedAndImmune' },
};

type RechargeEffect = ArtifactRechargeEffect & { guards: RechargeGuards };

/** The table entry for an artifact id, defaulting to Java's own no-op. */
export function artifactRechargeEffect(id: string): RechargeEffect {
	return ARTIFACT_RECHARGE_EFFECTS[id] ?? { kind: 'none', guards: 'cursedAndImmune' };
}

/** `ArtifactRecharge.DURATION` (30) and the amount WildEnergy extends it by (8). */
export function artifactRechargeDuration(): number {
	return mwlItemEffectValue('artifactRecharge', 'duration');
}

export function wildEnergyRechargeTurns(): number {
	return mwlItemEffectValue('artifactRecharge', 'wildEnergyTurns');
}

/**
 * The generic `partialCharge += rate*amount` bank, which every `'charge'` entry above shares:
 * whole units onto the integer `charge`, and at the cap either zeroing `partialCharge` (the
 * artifacts that do) or leaving it (the ones that do not - Beacon/Chains/Toolkit keep the fraction
 * they had banked). Returns whether the cap was reached, which is what decides the `full` line.
 *
 * `chargeCap` is passed in because every artifact computes its own (Horn's `5 + level/2`, the
 * Spellbook's `(int)(level*0.6)+2`, the rest a flat 100).
 */
export function bankArtifactCharge(
	item: { charge?: number; partialCharge?: number },
	chargeCap: number,
	rate: number,
	amount: number,
	capZeroesPartial: boolean,
): boolean {
	let charge = item.charge ?? 0;
	if (charge >= chargeCap) return false;
	let partialCharge = (item.partialCharge ?? 0) + rate * amount;
	while (partialCharge >= 1) {
		partialCharge--;
		charge++;
		if (charge >= chargeCap) {
			charge = chargeCap;
			if (capZeroesPartial) partialCharge = 0;
			break;
		}
	}
	item.charge = charge;
	item.partialCharge = partialCharge;
	return charge >= chargeCap;
}

/** `ChaliceOfBlood.charge()`'s heal: `healDelay = (10 - (1.33 + level*0.667)) / amount`, then
 *  `heal = 5/healDelay` with Java's own `Random.Float() < heal % 1` rounding up. Returns the whole
 *  HP to heal (0 when the hero is starving or already full), leaving the roll to the caller. */
export function chaliceRechargeHeal(level: number, amount: number, roll: number): number {
	const healDelay = (mwlItemEffectValue('chalice', 'rechargeBase') - (mwlItemEffectValue('chalice', 'rechargeLevelBase') + level * mwlItemEffectValue('chalice', 'rechargeLevelScale'))) / amount;
	const heal = mwlItemEffectValue('chalice', 'rechargeHealTurns') / healDelay;
	const whole = Math.floor(heal);
	return roll < (heal % 1) ? whole + 1 : whole;
}

/** `DriedRose.charge()`'s ghost half: `heal = round((1 + level()/3f)*amount)`, capped at the
 *  ghost's HT by the caller. */
export function roseRechargeGhostHeal(level: number, amount: number): number {
	return Math.round((1 + level / 3) * amount);
}
