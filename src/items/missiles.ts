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
 * **Carried stacks carry their own identity (2026-09-16), reversing this port's earlier fungible
 * model.** A bag entry for a missile is `{ id: 'missile_<class>' (tipped darts: `tippedSeed`
 * naming the seed), sourceClass, level, durability, maxDurability, missileSet, instanceId }`,
 * and the wielded pile (`ammo`/`missileLevel`/`ammoSetId`/`ammoDurability` in the scene) is simply the stack the hero is currently holding -
 * Java's `Hero.belongings.weapon`. Wielding moves the *whole* stack into the pile and stashes
 * whatever was in the pile back into the bag under its own identity, which is Java's swap
 * (`belongings.weapon = w` with the old weapon returned to the backpack).
 *
 * The identity has to do double duty, because that is the only way to reproduce
 * `MissileWeapon.isSimilar` (`trueLevel() == item.trueLevel() && getClass() == item.getClass() &&
 * setID == item.setID`) through a framework whose merge key is `(id, instanceId)`:
 * `missileStackId(setId, level)` is `"<setId>:<level>"`, so two stacks merge only when both
 * their set and their level agree. Tipped darts additionally carry `tippedSeed`, which joins
 * the merge key the same way Java's dart class + seed does. Two separately-minted stacks
 * always differ, since a set id is drawn from the scene's own per-instance counter
 * (`newItemInstanceId('missile')`, run-seed + serial - the same source every other instance id in
 * this port comes from, and stable across save/load). Java draws a random `SecureRandom().nextLong()`
 * instead; the port draws no RNG at all, which is the same deliberate divergence the seed stacks
 * already make (see `generatedInventoryItem`'s `seed:<class>` key).
 *
 * The scene owns the counter and the threshold map; the functions below are the pure rules it
 * calls, so the pickup branch and the upgrade hook stay testable headlessly (see
 * `tools/verifyItemWorkflows.mjs`).
 *
 * Deliberately not reproduced: LiquidMetal crafting's set-consumed bookkeeping (alchemy
 * brews from fungible bag ids here) and the Shopkeeper's own `pickupValid` read (shop stock
 * never carries missile sets). `extraThrownLeft` IS modelled: a carried stack records whether
 * it holds more than Java's `defaultQuantity()` refill, reset on a valid pickup and on every
 * upgrade, and the shop's sell window warns on it (`WndTradeItem.thrown_dust`).
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
 * `TippedDart.types` (`items/weapon/missiles/darts/TippedDart.java:198-209`, tag `v3.3.8`):
 * all 12 `Plant.Seed` classes tip a dart, each with its own dart class. The seed side is the
 * carried `seed:<class>` payload's class (lower-cased); the dart side is the catalogue key
 * suffix under `items.weapon.missiles.darts.*` (each desc names its own seed compound, which
 * is what pins this mapping). `Dart` itself (the plain untipped dart) has no entry here:
 * this port stocks and throws only tipped darts, matching what the shop sells.
 */
export const TIPPED_DART_BY_SEED: Readonly<Record<string, string>> = {
	blindweed: 'blindingdart',
	firebloom: 'incendiarydart',
	icecap: 'chillingdart',
	sorrowmoss: 'poisondart',
	earthroot: 'paralyticdart',
	fadeleaf: 'displacingdart',
	rotberry: 'rotdart',
	starflower: 'holydart',
	stormvine: 'shockingdart',
	sungrass: 'healingdart',
	mageroyal: 'cleansingdart',
	swiftthistle: 'adrenalinedart',
};

/** Catalogue key suffix for a tipped stack's own name (`items.weapon.missiles.darts.*`). */
export function tippedDartNameKey(seedClass: string | undefined): string {
	const dart = (seedClass ?? '').toLowerCase();
	const tip = TIPPED_DART_BY_SEED[dart];
	return `items.weapon.missiles.darts.${tip ?? 'dart'}.name`;
}

/**
 * `MissileSprite` flies the thrown item's own art (`view(item)` over `ItemSpriteSheet`,
 * tag `v3.3.8`) - which is what makes the yellow-dot stand-in wrong, not just ugly.
 * `MISSILE_WEP` is `xy(1, 10)`, slot 161 on this port's byte-identical `items.png`,
 * with each class at its own offset (`SPIRIT_BOW = +0` through `FORCE_CUBE = +15`), and
 * the twelve tipped darts sit at `DARTS = xy(1, 11)` = 177 plus their own offsets
 * (`ROT_DART = +1` through `BLINDING_DART = +12`). Spin is `ANGULAR_SPEEDS`: 0 for
 * darts/knives/spears (and the spirit arrow), 1440 for boomerang/bolas, 2160 for
 * shuriken - degrees per second, applied to the sprite's own angle while it flies.
 */
export const MISSILE_ITEM_FRAMES: Readonly<Record<string, number>> = {
	SpiritArrow: 161,
	ThrowingSpike: 162,
	ThrowingKnife: 163,
	ThrowingStone: 164,
	FishingSpear: 165,
	Shuriken: 166,
	ThrowingClub: 167,
	ThrowingSpear: 168,
	Bolas: 169,
	Kunai: 170,
	Javelin: 171,
	Tomahawk: 172,
	HeavyBoomerang: 173,
	Trident: 174,
	ThrowingHammer: 175,
	ForceCube: 176,
};

/** Tipped-dart flight art by seed class (lower-cased), via `TippedDart.types`'s own
 * seed-to-dart-class order read against the `DARTS` offsets above. */
export const TIPPED_DART_FRAMES: Readonly<Record<string, number>> = {
	rotberry: 178,
	sungrass: 181,
	fadeleaf: 188,
	icecap: 182,
	firebloom: 179,
	sorrowmoss: 184,
	swiftthistle: 180,
	blindweed: 189,
	stormvine: 183,
	earthroot: 186,
	mageroyal: 185,
	starflower: 187,
};

const MISSILE_SPIN: Readonly<Record<string, number>> = {
	HeavyBoomerang: 1440,
	Bolas: 1440,
	Shuriken: 2160,
};

export interface MissileFlightArt {
	frame: number;
	spin: number;
}

/**
 * The flight art for a wielded pile: its item frame plus its spin, or `null` when the
 * class is unknown (the caller keeps the dot fallback rather than crashing on a
 * missing sprite - an unknown class here is a content bug, not a render one).
 */
export function missileFlightArt(sourceClass: string, tippedSeed?: string): MissileFlightArt | null {
	if (sourceClass === 'TippedDart') {
		const frame = TIPPED_DART_FRAMES[(tippedSeed ?? '').toLowerCase()];
		return frame === undefined ? null : { frame, spin: 0 };
	}
	const frame = MISSILE_ITEM_FRAMES[sourceClass];
	if (frame === undefined) return null;
	return { frame, spin: MISSILE_SPIN[sourceClass] ?? 0 };
}

/**
 * `TippedDart.durabilityPerUse()` with `Talent.DURABLE_TIPS`: the use cost is divided by
 * `1 + points` (2x/3x/4x total durability at ranks 1-3) while a Warden throws tipped darts.
 * `Rotberry`'s rot dart is exempt - its desc states its durability cannot be boosted - and
 * it lasts longer than other darts outright (double uses here, a stated simplification of
 * whatever Java's own longer life is).
 */
export function tippedDartUseDivisor(seedClass: string | undefined, wardenTipsRank: number, isWarden: boolean): number {
	if ((seedClass ?? '').toLowerCase() === 'rotberry') return 1;
	return isWarden ? 1 + Math.max(0, wardenTipsRank) : 1;
}

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
	thresholds: ReadonlyMap<string, number> | undefined,
	setId: string | undefined,
	level: number,
): boolean {
	if (thresholds === undefined || setId === undefined) return true;
	const threshold = thresholds.get(setId);
	if (threshold === undefined) return true;
	return level >= threshold;
}

/** Java's `upgrade()` recording: `levelThresholds[setID] = trueLevel()+1`, immutably. */
export function recordMissileUpgrade(
	thresholds: ReadonlyMap<string, number>,
	setId: string,
	level: number,
): Map<string, number> {
	const next = new Map(thresholds);
	next.set(setId, level);
	return next;
}

/** `MissileWeapon.MAX_DURABILITY` (tag `v3.3.8`): the 100-point wear scale `ammoDurability` and
 * every carried stack's `durability` are measured on. */
export const MISSILE_MAX_DURABILITY = 100;

/**
 * `MissileWeapon.defaultQuantity()` (tag `v3.3.8`): the stack size `upgrade()` refills the stack
 * to - **3**, for every authored missile. The only other overrides in the tree are the spirit bow's
 * arrows and the `Dart` family; darts now exist here (`TippedDart`) and share the default 3,
 * which is Java's own value for them unless its override says otherwise (stated simplification -
 * see the `missiles.mwl` row).
 *
 * Java *assigns* it (`quantity = defaultQuantity()`), which also **shrinks** a bigger stack: a
 * stack of twelve upgraded becomes three. That is a straight loss to the player for no modelled
 * reason, so this port raises the stack to three instead of resetting it - a deliberate divergence,
 * recorded in `PORT_COVERAGE.md`'s `MissileWeapon` row.
 */
export const MISSILE_DEFAULT_QUANTITY = 3;

/**
 * The identity of a carried missile stack: `"<setId>:<level>"`, used as the bag entry's
 * `instanceId`. Both halves are needed - the set alone would let an upgraded stack merge back
 * into the un-upgraded one it came from, and the level alone would let two different sets merge
 * (see the module header for why the framework's `(id, instanceId)` merge key needs both).
 * Tipped darts append their seed (`"<setId>:<level>:<seed>"`): two tips of one set and level
 * must not merge, the same way Java's dart class keeps them apart.
 */
export function missileStackId(setId: string, level: number, tippedSeed?: string): string {
	return tippedSeed === undefined ? `${setId}:${level}` : `${setId}:${level}:${tippedSeed.toLowerCase()}`;
}

/** A freshly minted carried missile stack's own fields, ready to spread into a payload: the set
 * and identity above, its own level, and full durability. `setId` comes from the scene's instance
 * counter (`newItemInstanceId('missile')`) so it is unique per stack and survives a save. */
export function missileStackFields(setId: string, level: number, tippedSeed?: string): {
	missileSet: string; instanceId: string; level: number; durability: number; maxDurability: number;
} {
	return {
		missileSet: setId,
		instanceId: missileStackId(setId, level, tippedSeed),
		level,
		durability: MISSILE_MAX_DURABILITY,
		maxDurability: MISSILE_MAX_DURABILITY,
	};
}

/**
 * `MissileWeapon.extraThrownLeft` (`WndTradeItem`'s `thrown_dust` warning, tag `v3.3.8`).
 * Java sets it when an upgraded stack holds more than `defaultQuantity()` refills leave behind;
 * this port recomputes it as `quantity > MISSILE_DEFAULT_QUANTITY` on a stack whose level is
 * above 0. Reset on every valid pickup and every upgrade (see `missileStackFields` callers).
 */
export function missileExtraThrownLeft(quantity: number, level: number): boolean {
	return level > 0 && quantity > MISSILE_DEFAULT_QUANTITY;
}
