/**
 * Sandals of Nature's own rules, split out of the scene so they can be checked without a live
 * game - the same reason `items/shopPricing.ts` and `items/missiles.ts` exist. Every formula
 * here is `SandalsOfNature.java` (tag `v3.3.8`) plus the two coefficients `HighGrass.trample`
 * reads off the same artifact; the scene owns the aiming, the pickers and the turn cost.
 *
 * The artifact's own state is the Java pair `charge` (an int) and `partialCharge` (the float
 * build-up toward the next whole charge), plus the fed-seed list and the currently attuned seed.
 */
import { mwlItemEffectValue, MWL_TABLE_ROWS } from '../mwlContent';

export type SandalsItem = {
	level?: number;
	/** Java's `charge`/`partialCharge`: `charge` is an *int* in `Artifact.java`; the fractional
	 *  build-up is kept separately in a float. */
	charge?: number;
	partialCharge?: number;
	cursed?: boolean;
	/** Java's `seeds`: a list of `Plant.Seed` *classes*, newest first (`seeds.add(0, ...)`). The
	 *  port's seeds are one generic `'seed'` id carrying a `sourceClass`, so this holds normalized
	 *  plant-kind names (`'rotberry'`) - the same spelling `item-rules.mwl`'s `sandalsSeedReqs`
	 *  table and the scene's `seedPlantKind()` use. */
	seeds?: string[];
	/** Java's `curSeedEffect`: the seed class whose effect `AC_ROOT` would produce. */
	curSeedEffect?: string | null;
};

/** `SandalsOfNature.seedChargeReqs.get(seedClass)` (tag `v3.3.8`), looked up by plant kind.
 *  Returns `null` for a seed this port has no plant for - the safe equivalent of Java's map
 *  lookup returning nothing for a class it does not know. */
export function sandalsSeedChargeReq(kind: string | null | undefined): number | null {
	if (!kind) return null;
	const row = MWL_TABLE_ROWS('sandalsSeedReqs', 'seed').find((entry) => entry.seed === kind);
	return row ? Number(row.charge) : null;
}

/** `SandalsOfNature`'s constructor `chargeCap = 100`. */
export function sandalsChargeCap(): number {
	return mwlItemEffectValue('sandals', 'chargeCap');
}

/** `SandalsOfNature.levelCap = 3`: three growth stages, and the level `AC_FEED` stops growing the
 *  fed-seed list at. */
export function sandalsLevelCap(): number {
	return mwlItemEffectValue('sandals', 'levelCap');
}

/**
 * Java's `naturalismLevel`, as `HighGrass.trample` computes it (tag `v3.3.8`): `0` with no
 * sandals carried, `itemLevel()+1` for a wearer in good standing, and `-1` only when the pair is
 * cursed - which is what suppresses grass loot entirely.
 *
 * `MagicImmune` threads through here because Java's branch tests `naturalism.isCursed()`, *not*
 * `item.cursed`: `Artifact.ArtifactBuff.isCursed()` is `target.buff(MagicImmune.class) == null &&
 * item.cursed`, so an **AntiMagic hero wearing a cursed pair is not "cursed" as far as this check
 * is concerned** and keeps the full `itemLevel()+1` loot scaling (`charge()` is still called, and
 * still refuses the charge gain on its own `MagicImmune` guard, so the loot rolls and the charge
 * gain genuinely disagree in that one case). Reading `cursed` alone here - which this function did
 * until a review caught it - suppressed the drops for a cursed pair under AntiMagic, where Java
 * keeps them.
 */
export function sandalsNaturalismLevel(sandals: SandalsItem | undefined, magicImmune = false): number {
	if (!sandals) return 0;
	if (sandals.cursed && !magicImmune) return -1;
	return (sandals.level ?? 0) + 1;
}

/**
 * `SandalsOfNature.Naturalism.charge()` (tag `v3.3.8`), called from `HighGrass.trample` on every
 * trampled high grass: `chargeGain = (3f + level())/6f`, scaled by
 * `RingOfEnergy.artifactChargeMultiplier`, banked in whole units onto the integer `charge` and
 * clamped to `chargeCap`. Reuses the `ringEnergyMultiplier` stand-in for the real
 * `artifactChargeMultiplier` that toolkit/armband/horn already document (missing the Light Cloak
 * talent's extra multiplier - Not ported, that existing gap). Guarded exactly as Java's is -
 * `cursed || MagicImmune` skips the gain entirely (note this guard tests `cursed` itself, where
 * `sandalsNaturalismLevel` deliberately tests Java's `isCursed()`, which `MagicImmune` clears -
 * the two genuinely disagree for a cursed pair under AntiMagic, as they do in Java), and a charge
 * already at the cap skips the arithmetic rather than merely clamping the result.
 */
export function applySandalsNaturalismCharge(sandals: SandalsItem | undefined, ringMultiplier: number, magicImmune: boolean): void {
	if (!sandals || sandals.cursed || magicImmune) return;
	const chargeCap = sandalsChargeCap();
	let charge = sandals.charge ?? 0;
	if (charge >= chargeCap) return;
	const level = sandals.level ?? 0;
	const gain = (mwlItemEffectValue('sandals', 'chargeGainBase') + level)
		/ mwlItemEffectValue('sandals', 'chargeGainDivisor') * ringMultiplier;
	let partialCharge = (sandals.partialCharge ?? 0) + gain;
	while (partialCharge >= 1) {
		charge++;
		partialCharge--;
	}
	sandals.charge = Math.min(charge, chargeCap);
	sandals.partialCharge = partialCharge;
}

/**
 * `SandalsOfNature.canUseSeed()` (tag `v3.3.8`): a seed is feedable when the footwear does not
 * already hold that kind, and - once the artifact is at `levelCap = 3` - when it is not the
 * currently attuned kind either. (`level() < 3` in Java, i.e. the same cap.)
 */
export function sandalsCanUseSeed(sandals: SandalsItem, kind: string | null | undefined): boolean {
	if (!kind || sandalsSeedChargeReq(kind) === null) return false;
	const seeds = sandals.seeds ?? [];
	if (seeds.includes(kind)) return false;
	return (sandals.level ?? 0) < sandalsLevelCap() || sandals.curSeedEffect !== kind;
}

/**
 * `SandalsOfNature.itemSelector.onSelect()` (tag `v3.3.8`): feeding a seed sets it as the
 * footwear's current effect and - while below `levelCap` - prepends it to the carried list.
 * Reaching `3 + level()*3` seeds clears the list and upgrades the artifact by one level, which is
 * the only way it levels at all. Java's `hero.spend(Actor.TICK)` half is the caller's (the
 * scene's) job, as is consuming the fed seed. Returns whether that threshold was crossed, so the
 * caller can pick Java's `levelup`/`absorb_seed` line.
 */
export function feedSandalsSeed(sandals: SandalsItem, kind: string): boolean {
	const levelCap = sandalsLevelCap();
	const level = sandals.level ?? 0;
	const seeds = sandals.seeds ?? [];
	if (level < levelCap) seeds.unshift(kind);
	sandals.curSeedEffect = kind;
	const threshold = mwlItemEffectValue('sandals', 'feedThresholdBase')
		+ level * mwlItemEffectValue('sandals', 'feedThresholdPerLevel');
	if (seeds.length >= threshold) {
		sandals.seeds = [];
		sandals.level = Math.min(level + 1, levelCap);
		return true;
	}
	sandals.seeds = seeds;
	return false;
}

/** `SandalsOfNature.actions()`'s `AC_ROOT` gate (tag `v3.3.8`): the footwear must have a seed
 *  attuned and enough charge for *that* seed's own requirement. `null` means "no effect" (no seed
 *  fed yet), which Java reports with its own `no_effect` line rather than `low_charge`. */
export function sandalsRootChargeReq(sandals: SandalsItem): number | null {
	if (!sandals.curSeedEffect) return null;
	return sandalsSeedChargeReq(sandals.curSeedEffect);
}
