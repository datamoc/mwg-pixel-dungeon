/**
 * `CursedWand.cursedZap()` (`items/wands/CursedWand.java`, tag `v3.3.8`): a cursed wand zap
 * rolls a weighted tier (`EFFECT_CAT_CHANCES = {60, 30, 9, 1}` for common/uncommon/rare/very
 * rare) then a uniform pick within that tier's `CursedEffect` list.
 *
 * **Scoped port, documented honestly rather than left as a total exclusion:** Common,
 * Uncommon and Rare are modeled at Java's own real 60/30/9 weights (`pickCursedTier`, over a
 * `pick(99)` draw - VeryRare's remaining 1% is folded into Rare rather than dropped, since a
 * 99-of-100 vs 100-of-100 split has no observable difference at this scale), and a subset of
 * each tier's real effect list. Common: 6 of 8 - the two left out (`SpawnRegrowth`, and
 * `RandomAreaEffect`'s `ChillingTrap` sub-case) need a generic `Regrowth`/`Freezing` blob type
 * this port has no infrastructure for at all (every blob here is a named scene field with its
 * own bespoke evolve hook, not a pluggable class). Uncommon: all 8 are modeled - `Explosion`
 * reuses the newly-exported `applyBlastDamage` (`items/bombEffects.ts`, which already had a
 * hero branch) and `LightningBolt` turned out to be almost entirely presentation (every
 * `Lightning()` visual and `ScrollOfRecharging.charge()` are pure particle bursts with zero
 * mechanical effect in `v3.3.8`, both skippable) once read past the sprite calls. Rare: 1 of 8
 * so far - `MassInvuln` (every character gets Invulnerability+Bless, both already-modeled
 * buffs, no new infra needed), `ConeOfColors` (8-radius/90-degree `STOP_SOLID` cone via
 * `mechanics/cone.ts`'s `coneCells`, five already-modeled status/damage primitives - Burning,
 * Frost, Poison, Ooze, Electricity+Paralysis - uniformly picked per affected character, each
 * independently damage-rolled), and `SheepPolymorph` (a live, non-hero, non-boss/miniboss,
 * non-NPC target at the bolt's collision cell is silently destroyed - the same no-death/no-loot
 * teardown `destroyAlly` already uses - and replaced with a fresh 10-turn `spawnSheep` at its
 * cell, reusing `SummonSheep`'s own factory). The other five each need real new infrastructure
 * this port doesn't have: `SummonMonsters`/`CurseEquipment` need `SummoningTrap`/`CursingTrap`
 * kinds that are declared in `TrapKind`'s union but never actually implemented (dead type
 * entries, a separate, pre-existing gap - see `environmentFireTraps.ts`'s `UTILITY_TRAPS`);
 * `Petrify` needs a `TimeStasis` buff that doesn't exist; `InterFloorTeleport` needs real
 * weighted-depth floor-travel wiring; `FireBall` needs an arbitrary-point FOV cast plus a
 * knockback primitive. The whole VeryRare tier (folded into Rare's odds above, see the roll
 * note) is **Not ported**, along with `WondrousResin`'s `positiveOnly` mode (no such artifact
 * here).
 */
export type CursedCommonEffectId =
	| 'burnAndFreeze'
	| 'randomTeleport'
	| 'randomGas'
	| 'bubbles'
	| 'randomWand'
	| 'selfOoze';

export const CURSED_COMMON_EFFECT_IDS: readonly CursedCommonEffectId[] = [
	'burnAndFreeze', 'randomTeleport', 'randomGas', 'bubbles', 'randomWand', 'selfOoze',
];

export type CursedUncommonEffectId =
	| 'healthTransfer'
	| 'geyser'
	| 'summonSheep'
	| 'levitate'
	| 'alarm'
	| 'randomPlant'
	| 'explosion'
	| 'lightningBolt';

export const CURSED_UNCOMMON_EFFECT_IDS: readonly CursedUncommonEffectId[] = [
	'healthTransfer', 'geyser', 'summonSheep', 'levitate', 'alarm', 'randomPlant', 'explosion', 'lightningBolt',
];

/** `RandomPlant.effect()`'s `Generator.randomUsingDefaults(Generator.Category.SEED)`: this
 * port has no weighted seed-generator draw exposed at this seam, so a uniform pick over the
 * 12 real supported plant kinds stands in, matching `RandomWand`'s own uniform `WAND_TYPES`
 * pick precedent. Kept in this module (not the scene) so both the pick and its test stay
 * next to the other pure tables. */
export const CURSED_PLANT_KINDS: readonly string[] = [
	'blindweed', 'earthroot', 'fadeleaf', 'firebloom', 'icecap', 'mageroyal',
	'rotberry', 'sorrowmoss', 'starflower', 'stormvine', 'sungrass', 'swiftthistle',
];

export type CursedRareEffectId = 'massInvuln' | 'coneOfColors' | 'sheepPolymorph';
export const CURSED_RARE_EFFECT_IDS: readonly CursedRareEffectId[] = ['massInvuln', 'coneOfColors', 'sheepPolymorph'];

/** `ConeOfColors.effect()`'s per-character `Random.Int(5)` branch. */
export type ConeOfColorsStatus = 'burning' | 'frost' | 'poison' | 'ooze' | 'electricity';
export const CONE_OF_COLORS_STATUSES: readonly ConeOfColorsStatus[] = [
	'burning', 'frost', 'poison', 'ooze', 'electricity',
];
export function pickConeOfColorsStatus(pick: (bound: number) => number): ConeOfColorsStatus {
	return CONE_OF_COLORS_STATUSES[pick(CONE_OF_COLORS_STATUSES.length)]!;
}

/** `EFFECT_CAT_CHANCES`'s real common/uncommon/rare weights (60/30/9, VeryRare's 1% folded
 * into Rare - see the module doc comment). `pick(99)` supplies a uniform `Random.Int(99)`:
 * 0-59 common, 60-89 uncommon, 90-98 rare. */
export function pickCursedTier(pick: (bound: number) => number): 'common' | 'uncommon' | 'rare' {
	const roll = pick(99);
	return roll < 60 ? 'common' : roll < 90 ? 'uncommon' : 'rare';
}

/** `Random.element(RARE_EFFECTS)`, restricted to the 1 ported id, uniform pick. */
export function pickCursedRareEffect(pick: (bound: number) => number): CursedRareEffectId {
	return CURSED_RARE_EFFECT_IDS[pick(CURSED_RARE_EFFECT_IDS.length)]!;
}

/** `Random.element(COMMON_EFFECTS)`: a uniform pick, `pick` supplying `Random.Int(n)`. */
export function pickCursedCommonEffect(pick: (bound: number) => number): CursedCommonEffectId {
	return CURSED_COMMON_EFFECT_IDS[pick(CURSED_COMMON_EFFECT_IDS.length)]!;
}

/** `Random.element(UNCOMMON_EFFECTS)`: all 8 real ids are modeled, uniform pick. */
export function pickCursedUncommonEffect(pick: (bound: number) => number): CursedUncommonEffectId {
	return CURSED_UNCOMMON_EFFECT_IDS[pick(CURSED_UNCOMMON_EFFECT_IDS.length)]!;
}

/** `RandomGas.effect()`'s `Random.Int(3)` branch: id plus Java's exact seed volume. */
export const CURSED_RANDOM_GAS: readonly { id: 'confusionGas' | 'toxicGas' | 'paralyticGas'; volume: number }[] = [
	{ id: 'confusionGas', volume: 800 },
	{ id: 'toxicGas', volume: 500 },
	{ id: 'paralyticGas', volume: 200 },
];

/** `BurnAndFreeze.effect()`'s `Random.Int(2)` branch: which side (user/target) gets which status. */
export function pickBurnAndFreeze(coinFlip: boolean): { userStatus: 'burning' | 'frost'; targetStatus: 'burning' | 'frost' } {
	return coinFlip
		? { userStatus: 'frost', targetStatus: 'burning' }
		: { userStatus: 'burning', targetStatus: 'frost' };
}
