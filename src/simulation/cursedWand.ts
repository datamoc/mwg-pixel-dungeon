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
 * mechanical effect in `v3.3.8`, both skippable) once read past the sprite calls. Rare: 4 of 8 so far - `MassInvuln` (every character gets Invulnerability+Bless), `ConeOfColors` (an 8-radius/90-degree `STOP_SOLID` cone with five existing status/damage effects), `SheepPolymorph` (silently replaces an eligible target with a 10-turn Sheep), and `SummonMonsters` (uses the existing summoning utility trap). That utility chooses a random depth-roster mob instead of Java's level mob rotation, spawns immediately instead of after two turns, and omits avoid-cell and chained-trap handling; the call site documents these simplifications. The other four need new infrastructure: `CurseEquipment` needs a CursingTrap; `Petrify` needs a TimeStasis buff; `InterFloorTeleport` needs weighted-depth floor travel; `FireBall` needs arbitrary-point FOV and knockback. The whole VeryRare tier (folded into Rare's odds above, see the roll
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

export type CursedRareEffectId = 'massInvuln' | 'coneOfColors' | 'sheepPolymorph' | 'summonMonsters';
export const CURSED_RARE_EFFECT_IDS: readonly CursedRareEffectId[] = ['massInvuln', 'coneOfColors', 'sheepPolymorph', 'summonMonsters'];

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

/** `Random.element(RARE_EFFECTS)`, restricted to the four ported ids, uniform pick. */
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
