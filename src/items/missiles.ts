/**
 * `MissileWeapon.java`'s `UpgradedSetTracker` pickup rule (tag `v3.3.8`), translated.
 *
 * Java gives every missile stack a random `setID` (`setID = new SecureRandom().nextLong()`) and,
 * on every `upgrade()`, records `levelThresholds[setID] = trueLevel()+1` on the hero's
 * `UpgradedSetTracker` buff (which persists through death and saves). Picking a stack up runs
 * `pickupValid`: no tracker, or no entry for the stack's set, is valid; otherwise the stack's
 * `trueLevel()` must reach the recorded threshold, or the stack crumbles to dust (ITEM sound,
 * `pickupDelay` spent, the `dust` warning, quantity zeroed) instead of merging.
 *
 * This port's missiles are fungible class ammo (`main.ts`'s `ammo`/`missileLevel`), not distinct
 * stacks, so sets are small sequential ids minted by the scene (no RNG draw at all, unlike Java's
 * `SecureRandom`): the wielded pile's own set, fresh sets for scattered/missed heaps. The scene
 * owns the counter and the threshold map; these two functions are the pure rule it calls, so the
 * pickup branch and the upgrade hook stay testable headlessly (see `tools/verifyItemWorkflows.mjs`).
 *
 * Deliberately not reproduced: `extraThrownLeft` (reset on a valid pickup) has no expression in
 * this port's ammo model, and neither do the tracker's other three consumers - LiquidMetal
 * crafting's set-consumed bookkeeping (alchemy brews from fungible bag ids here), the
 * Shopkeeper's own `pickupValid` read (shop stock never carries missile sets), and the
 * reforge's set retirement (`WndBlacksmith`'s `levelThresholds.put(setID, MAX_VALUE)` on the
 * consumed missile - bag stacks carry no set id, and the reforge picker only offers
 * weapon/armor payloads, so no missile can be the consumed item; see `openBlacksmithReforge`).
 */
import { MWL_MISSILE_BY_CLASS, MWL_MISSILE_UPGRADE_RULES } from '../mwlContent';

/** Resolves `MissileWeapon.min()`/`max()` from the authored missile identity and live level. */
export function missileDamageRange(sourceClass: string, level: number, flatBonus = 0): [number, number] {
	const definition = MWL_MISSILE_BY_CLASS.get(sourceClass);
	if (!definition) throw new Error(`MWL missile definition is missing for ${sourceClass}`);
	const upgrade = MWL_MISSILE_UPGRADE_RULES[sourceClass];
	if (!upgrade) throw new Error(`MWL missile upgrade rule is missing for ${sourceClass}`);
	return [
		definition.minDamage + upgrade.minPerLevel * level + flatBonus,
		definition.maxDamage + upgrade.maxPerLevel * level + flatBonus,
	];
}

/** `MissileWeapon.baseUses` (tag `v3.3.8`): durability uses before Java's `1.5^level` scaling.
 * Sourced from the authored table (`missiles.mwl`), where Java's own field defaults to 8 and each
 * class overrides it - so the wielded class, not the hero class, is what decides this. */
export function missileBaseUses(sourceClass: string): number {
	const definition = MWL_MISSILE_BY_CLASS.get(sourceClass);
	if (!definition) throw new Error(`MWL missile definition is missing for ${sourceClass}`);
	return definition.baseUses;
}

/** `Bolas.proc()` (tag `v3.3.8`): `Buff.prolong(defender, Cripple.class, Cripple.DURATION/2)`,
 * with `Cripple.DURATION = 10f` - five turns of half movement. */
export function bolasCrippleTurns(): number {
	return 5;
}

/** `Tomahawk.proc()` (tag `v3.3.8`): the bleed is `Random.NormalFloat(minBleed(lvl), maxBleed(lvl))`
 * with `minBleed = 3 + lvl/2f` and `maxBleed = 6 + lvl`, `lvl` being the missile's buffed level plus
 * `RingOfSharpshooting`'s damage bonus. Java multiplies by `augment.damageFactor`; missiles are not
 * individually augmentable in this port (see the `MissileWeapon` row in `PORT_COVERAGE.md`), so that
 * factor is 1 and is not represented. */
export function tomahawkBleedRange(level: number): [number, number] {
	return [3 + level / 2, 6 + level];
}

/**
 * `HeavyBoomerang.CircleBack.setup()` (tag `v3.3.8`): `left = 5` - the boomerang flies home five
 * hero turns after it was thrown. Shared with the scene's `tickBoomerangReturn`, which is also
 * where the rest of the return's rules live (see `boomerangReturn`'s own comment).
 */
export const BOOMERANG_RETURN_TURNS = 5;

/** Java's `HeavyBoomerang.adjacentAccFactor` override: while `circlingBack` is up - i.e. for the
 * return flight's own attack - the factor is a flat `1.5f`, adjacency or not. */
export const BOOMERANG_RETURN_ACC_FACTOR = 1.5;

/**
 * `MissileWeapon.adjacentAccFactor(owner, target)` (tag `v3.3.8`): the ranged accuracy factor every
 * thrown weapon and the spirit bow carry, and the *only* thing `Talent.POINT_BLANK` does in Java.
 *
 * - **Adjacent** (Chebyshev 1): `0.5f` - a thrown weapon at melee range is -50% accurate - except
 *   for a hero, where it is `0.5f + 0.25f * pointsInTalent(POINT_BLANK)`, i.e. 0.75/1.0/1.25 at
 *   ranks 1/2/3. SPD's own description states this as "-30%/-10%/+10% accuracy at melee range,
 *   instead of -50%".
 * - **Not adjacent**: `1.5f` unconditionally - "+50% accuracy when used at a distance".
 *
 * `ownerIsHero` is Java's `owner instanceof Hero` test, which decides whether Point Blank applies
 * (monsters throwing missiles always take the flat `0.5f`). `HeavyBoomerang.adjacentAccFactor`
 * overrides this to a flat `1.5f` while `circlingBack`, which its returning attack passes in.
 *
 * This port modelled Point Blank as a **damage** multiplier (`1 + 0.2*rank` at `distance <= 2`)
 * before 2026-09-15, in the spirit-bow path only. Java never applies the talent to damage: it
 * appears exactly once in the whole codebase, in this method, and its range test is `adjacent`
 * (Chebyshev 1), not `distance <= 2`. See `PORT_COVERAGE.md` for the correction.
 */
export function missileAdjacentAccFactor(adjacent: boolean, ownerIsHero: boolean, pointBlankRank: number): number {
	if (!adjacent) return 1.5;
	return ownerIsHero ? 0.5 + 0.25 * pointBlankRank : 0.5;
}

/**
 * `MissileWeapon`'s formulas are sourced from the real SPD classes (tag `v3.3.8`): base min/max
 * and per-level increments are content metadata; hit resolution and durability remain TS.
 */
export function missilePickupValid(
	thresholds: ReadonlyMap<number, number> | undefined,
	setId: number | undefined,
	level: number,
): boolean {
	if (thresholds === undefined || setId === undefined) return true;
	const threshold = thresholds.get(setId);
	if (threshold === undefined) return true;
	return level >= threshold;
}

/** Java's `upgrade()` recording: `levelThresholds[setID] = trueLevel()+1`, immutably. */
export function recordMissileUpgrade(
	thresholds: ReadonlyMap<number, number>,
	setId: number,
	level: number,
): Map<number, number> {
	const next = new Map(thresholds);
	next.set(setId, level);
	return next;
}
