/**
 * Talisman of Foresight's own rules, split out of the scene so they can be checked without a live
 * game - the same split `items/sandals.ts` and `items/shopPricing.ts` use. Every formula here is
 * `TalismanOfForesight.java` (tag `v3.3.8`); the scene owns the aiming, the level mutation, the
 * awareness marks and the turn cost.
 *
 * The artifact has one active action (`AC_SCRY`: a cone-shaped scry that maps ground, uncovers
 * secrets and flags what it finds) and one passive (`Foresight`: a per-turn charge trickle plus a
 * proximity warning when a hidden trap sits in the hero's own sight).
 */
import { mwlItemEffectValue } from '../mwlContent';

export type TalismanItem = {
	level?: number;
	/** Java's `charge` (an int) and `partialCharge` (the float build-up toward the next one). */
	charge?: number;
	partialCharge?: number;
	/** Java's `exp`: progress toward the next artifact level, awarded per cell the scry reveals. */
	exp?: number;
	cursed?: boolean;
	/** Java's `warn`: whether the "uneasy" line is already showing, so it fires once per run of
	 *  hidden traps rather than every turn. Persisted in Java's own bundle. */
	warn?: boolean;
};

/** `TalismanOfForesight`'s constructor block: `chargeCap = 100`, `levelCap = 10`, `charge = 0`. */
export function talismanChargeCap(): number {
	return mwlItemEffectValue('talisman', 'chargeCap');
}

export function talismanLevelCap(): number {
	return mwlItemEffectValue('talisman', 'levelCap');
}

/** The `AC_SCRY` gate's floor: `execute()` refuses with `low_charge` below 5. */
export function talismanScryMinCharge(): number {
	return mwlItemEffectValue('talisman', 'scryMinCharge');
}

/**
 * `TalismanOfForesight.maxDist()`: `min(5 + 2*level(), (charge-3)/1.08f)`. Note the two bounds
 * pull in opposite directions - the level raises the ceiling while a nearly-empty charge lowers
 * it, so a +10 talisman on 5 charge still only reaches 1.85 tiles.
 */
export function talismanMaxDist(level: number, charge: number): number {
	const fromLevel = mwlItemEffectValue('talisman', 'maxDistBase') + mwlItemEffectValue('talisman', 'maxDistPerLevel') * level;
	const fromCharge = (charge - mwlItemEffectValue('talisman', 'maxDistChargeOffset'))
		/ mwlItemEffectValue('talisman', 'maxDistChargeDivisor');
	return Math.min(fromLevel, fromCharge);
}

/** `FloatMath.round(200 * pow(0.92, dist))`: the cone's arc in degrees, narrowing with distance -
 *  "starts at 200 degrees, loses 8% per tile" in Java's own comment. */
export function talismanScryAngle(distance: number): number {
	const base = mwlItemEffectValue('talisman', 'angleBase');
	return Math.round(Math.fround(base * Math.pow(mwlItemEffectValue('talisman', 'angleDecay'), distance)));
}

/** `charge -= 3 + dist*1.08f`, the scry's cost in points (so 5 at 2 tiles, ~30 at 25 tiles). */
export function talismanScryCost(distance: number): number {
	return Math.fround(mwlItemEffectValue('talisman', 'scryCostBase')
		+ Math.fround(distance * mwlItemEffectValue('talisman', 'scryCostPerTile')));
}

/**
 * The scry's charge arithmetic, in Java's own order, on Java's own types: `charge` is an int
 * field, so `charge -= 3 + dist*1.08f` *truncates toward zero* rather than keeping the fraction,
 * which is why `partialCharge` is then adjusted by `(dist*1.08f) % 1` to keep the books even -
 * and why the two follow-up branches (a negative partial paid out of a positive charge, then a
 * negative charge paid out of the partial) exist at all. Reproducing the order matters: the
 * branches only behave as Java's do when the truncation has already happened.
 */
export function talismanApplyScryCost(item: TalismanItem, distance: number): void {
	const cost = talismanScryCost(distance);
	//Java's `int charge -= float` truncates toward zero, which `Math.trunc` reproduces.
	let charge = Math.trunc((item.charge ?? 0) - cost);
	let partialCharge = Math.fround((item.partialCharge ?? 0) - Math.fround(cost % 1));
	if (partialCharge < 0 && charge > 0) {
		partialCharge = Math.fround(partialCharge + 1);
		charge--;
	}
	while (charge < 0) {
		charge++;
		partialCharge = Math.fround(partialCharge - 1);
	}
	item.charge = charge;
	item.partialCharge = partialCharge;
}

/** `Foresight.act()`'s per-turn trickle: `chargeGain = 0.05f + level()*0.005f`, scaled by
 *  `RingOfEnergy.artifactChargeMultiplier` - "fully charges in 2000 turns at +0, scaling to 1000
 *  turns at +10". Gated exactly as Java gates it: below the cap, not cursed, no `MagicImmune`,
 *  and `Regeneration.regenOn()` (the port's `regenOn` argument, since it has no regeneration
 *  system of its own to consult - see the caller). Reaching the cap zeroes `partialCharge`
 *  outright. */
export function applyTalismanPerTurnCharge(
	item: TalismanItem,
	ringMultiplier: number,
	magicImmune: boolean,
	regenOn: boolean,
): void {
	if (item.cursed || magicImmune || !regenOn) return;
	const chargeCap = talismanChargeCap();
	let charge = item.charge ?? 0;
	if (charge >= chargeCap) return;
	const level = item.level ?? 0;
	const gain = (mwlItemEffectValue('talisman', 'chargeGainBase')
		+ mwlItemEffectValue('talisman', 'chargeGainPerLevel') * level) * ringMultiplier;
	let partialCharge = Math.fround((item.partialCharge ?? 0) + gain);
	while (partialCharge >= 1) {
		partialCharge = Math.fround(partialCharge - 1);
		charge++;
		if (charge >= chargeCap) {
			partialCharge = 0;
			break;
		}
	}
	item.charge = charge;
	item.partialCharge = partialCharge;
}

/** `Foresight`'s awareness durations - both the scry's marks and the trap warning use
 *  `5 + 2*level()`. */
export function talismanAwarenessDuration(level: number): number {
	return mwlItemEffectValue('talisman', 'awarenessBase') + mwlItemEffectValue('talisman', 'awarenessPerLevel') * level;
}

/** The figure Java's scry hands to `Artifact.artifactProc`, `(int)(3 + dist*1.08f)`. That method
 *  reads neither of its two numeric arguments at `v3.3.8`: it only runs the three talent procs
 *  (Priest's GuidingLight detonation, Cleric's SearingLight, Huntress's Sunray), so this number is
 *  cited for completeness rather than applied - see `item-rules.mwl`'s own note. */
export function talismanProcFigure(distance: number): number {
	return Math.trunc(mwlItemEffectValue('talisman', 'procBase')
		+ Math.fround(distance * mwlItemEffectValue('talisman', 'procPerTile')));
}

/**
 * The scry's exp accounting: `exp += earned`, and `exp >= 100 + 50*level()` levels the artifact
 * (subtracting that threshold) while below `levelCap`. Java's own `expToLevel` scales with the
 * level, so each level costs 50 more than the last. Returns whether a level was gained, which is
 * what the caller logs (`levelup`).
 */
export function talismanApplyExp(item: TalismanItem, earned: number): boolean {
	const levelCap = talismanLevelCap();
	const level = item.level ?? 0;
	let exp = (item.exp ?? 0) + earned;
	const toLevel = mwlItemEffectValue('talisman', 'expToLevelBase')
		+ mwlItemEffectValue('talisman', 'expToLevelPerLevel') * level;
	if (exp >= toLevel && level < levelCap) {
		exp -= toLevel;
		item.level = level + 1;
		item.exp = exp;
		return true;
	}
	item.exp = exp;
	return false;
}

/** Whether `execute(AC_SCRY)` would open the cell selector at all: Java checks `MagicImmune` first
 *  (silently), then equipped-ness and the `charge >= 5` floor. `'low'` is Java's `low_charge`
 *  line; `'cursed'` is `actions()` having hidden the row entirely, which this port reports rather
 *  than silently ignoring (it has no per-item action menu to hide rows in). */
export function talismanScryGate(item: TalismanItem | undefined, magicImmune: boolean): 'ok' | 'cursed' | 'low' | 'missing' {
	if (!item) return 'missing';
	if (magicImmune) return 'missing';
	if (item.cursed) return 'cursed';
	if ((item.charge ?? 0) < talismanScryMinCharge()) return 'low';
	return 'ok';
}
