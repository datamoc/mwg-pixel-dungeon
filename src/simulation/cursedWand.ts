/**
 * `CursedWand.cursedZap()` (`items/wands/CursedWand.java`, tag `v3.3.8`): a cursed wand zap
 * rolls a weighted tier (`EFFECT_CAT_CHANCES = {60, 30, 9, 1}` for common/uncommon/rare/very
 * rare) then a uniform pick within that tier's `CursedEffect` list.
 *
 * **Scoped port, documented honestly rather than left as a total exclusion:** Common,
 * Uncommon and Rare are modeled at Java's own real 60/30/9/1 weights (`pickCursedTier`, over a
 * `pick(100)` draw - VeryRare's remaining 1% is folded into Rare, preserving Java's Common and
 * Uncommon rates while making the modeled Rare bucket 10%), and a subset of
 * each tier's real effect list. Common: 8 of 8 - `SpawnRegrowth` has a floor-persisted
 * Regrowth blob with Java's spreading, terrain growth and rooting; `RandomAreaEffect` is now modeled with the
 * existing Fire/Freezing/Electricity fields, but its pre-effect `Level.pressCell` on an empty
 * collision cell and `tryForWandProc` callback remain absent. Uncommon: all 8 are modeled - `Explosion`
 * reuses the newly-exported `applyBlastDamage` (`items/bombEffects.ts`, which already had a
 * hero branch) and `LightningBolt` turned out to be almost entirely presentation (every
 * `Lightning()` visual and `ScrollOfRecharging.charge()` are pure particle bursts with zero
 * mechanical effect in `v3.3.8`, both skippable) once read past the sprite calls. Rare: 6 of 8
 * so far - `MassInvuln` (every character gets Invulnerability+Bless, both already-modeled
 * buffs, no new infra needed), `ConeOfColors` (8-radius/90-degree `STOP_SOLID` cone via
 * `mechanics/cone.ts`'s `coneCells`, five already-modeled status/damage primitives - Burning,
 * Frost, Poison, Ooze, Electricity+Paralysis - uniformly picked per affected character, each
 * independently damage-rolled), `SheepPolymorph` (a live, non-hero, non-boss/miniboss,
 * non-NPC target at the bolt's collision cell is silently destroyed - the same no-death/no-loot
 * teardown `destroyAlly` already uses - and replaced with a fresh 10-turn `spawnSheep` at its
 * cell, reusing `SummonSheep`'s own factory), `SummonMonsters` (reuses the existing summoning
 * utility trap; its roster selection and spawn timing are simplified as documented at the call
 * site), and `CurseEquipment` (uses the existing equipped-curse state and affix pools; item
 * selection prefers gear without an affix, while the port uses a uniform choice within that
 * preferred pool), and `InterFloorTeleport` uses the existing floor travel path plus Java's
 * weighted depth selection. The other two need infrastructure this port doesn't have:
 * `Petrify` and `FireBall` are now modeled below; the whole VeryRare tier (folded into Rare's odds above, see the roll
 * note) has its authoritative eight-id catalog represented below, but its scene effects remain
 * **Not ported** until their individual mechanics are implemented. `WondrousResin`'s
 * `positiveOnly` mode is also not ported (no such artifact exists here).
 */
export type CursedCommonEffectId =
	| 'burnAndFreeze'
	| 'randomTeleport'
	| 'randomGas'
	| 'bubbles'
	| 'randomWand'
	| 'selfOoze'
	| 'randomAreaEffect'
	| 'spawnRegrowth';

export const CURSED_COMMON_EFFECT_IDS: readonly CursedCommonEffectId[] = [
	//Keep Java's COMMON_EFFECTS insertion order (`CursedWand.java`, tag `v3.3.8`):
	//Random.element draws an index, so a different order changes which effect each roll selects.
	'burnAndFreeze', 'spawnRegrowth', 'randomTeleport', 'randomGas', 'randomAreaEffect', 'bubbles', 'randomWand', 'selfOoze',
];

export type CursedRandomAreaEffect = 'burningTrap' | 'chillingTrap' | 'shockingTrap';
export const CURSED_RANDOM_AREA_EFFECTS: readonly CursedRandomAreaEffect[] = [
	'burningTrap', 'chillingTrap', 'shockingTrap',
];

/** `RandomAreaEffect.effect()`'s `Random.Int(3)` (`CursedWand.java`, tag `v3.3.8`). */
export function pickCursedRandomAreaEffect(pick: (bound: number) => number): CursedRandomAreaEffect {
	return CURSED_RANDOM_AREA_EFFECTS[pick(CURSED_RANDOM_AREA_EFFECTS.length)]!;
}

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

export type CursedRareEffectId = 'sheepPolymorph' | 'curseEquipment' | 'interFloorTeleport' | 'summonMonsters' | 'fireBall' | 'coneOfColors' | 'massInvuln' | 'petrify';
export const CURSED_RARE_EFFECT_IDS: readonly CursedRareEffectId[] = ['sheepPolymorph', 'curseEquipment', 'interFloorTeleport', 'summonMonsters', 'fireBall', 'coneOfColors', 'massInvuln', 'petrify'];

/** Java's distinct `VERY_RARE_EFFECTS` catalog (`CursedWand.java`, tag `v4.0.0`; `v3.3.8` had only four).
 * The runtime's one-percent tier dispatches to `castCursedWandVeryRareEffect`, which implements five of
 * these eight (`forestFire`, `abortRetryFail`, `superNova`, `sinkHole`, `gravityChaos`); the remaining
 * three (`spawnGoldenMimic`, `randomTransmogrify`, `heroShapeShift`) are picked and then do nothing.
 * Keeping the authoritative order here prevents the catalog itself from being silently lost. */
export type CursedVeryRareEffectId = 'forestFire' | 'spawnGoldenMimic' | 'abortRetryFail' | 'randomTransmogrify' | 'heroShapeShift' | 'superNova' | 'sinkHole' | 'gravityChaos';
export const CURSED_VERY_RARE_EFFECT_IDS: readonly CursedVeryRareEffectId[] = [
	'forestFire', 'spawnGoldenMimic', 'abortRetryFail', 'randomTransmogrify', 'heroShapeShift', 'superNova', 'sinkHole', 'gravityChaos',
];

export function pickCursedVeryRareEffect(pick: (bound: number) => number): CursedVeryRareEffectId {
	return CURSED_VERY_RARE_EFFECT_IDS[pick(CURSED_VERY_RARE_EFFECT_IDS.length)]!;
}

/** `ForestFire.effect()` (`CursedWand.java`, tag `v3.3.8`): every level cell receives
 * Regrowth volume 15. The scene owns the actual blob writes; this planner keeps the payload
 * exact and makes the all-cells rule independently testable. */
export function cursedForestFireSeeds(width: number, height: number): { x: number; y: number; volume: number }[] {
	const seeds: { x: number; y: number; volume: number }[] = [];
	for (let y = 0; y < Math.max(0, Math.floor(height)); y++) {
		for (let x = 0; x < Math.max(0, Math.floor(width)); x++) seeds.push({ x, y, volume: 15 });
	}
	return seeds;
}

/** `SpawnGoldenMimic.effect()`'s occupied-cell fallback (`CursedWand.java`, tag `v3.3.8`):
 * choose a free passable neighbour in PathFinder.NEIGHBOURS8 order. A collision cell that is
 * already empty is returned unchanged; no candidate means a genuine failed effect. */
export function cursedGoldenMimicSpawnCell(
	cell: { x: number; y: number },
	occupied: boolean,
	passable: (x: number, y: number) => boolean,
	occupiedAt: (x: number, y: number) => boolean,
	pick: (bound: number) => number,
): { x: number; y: number } | undefined {
	if (!occupied) return { ...cell };
	const candidates: { x: number; y: number }[] = [];
	for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0], [1, -1], [1, 1], [-1, 1], [-1, -1]] as const) {
		const x = cell.x + dx, y = cell.y + dy;
		if (passable(x, y) && !occupiedAt(x, y)) candidates.push({ x, y });
	}
	return candidates.length === 0 ? undefined : candidates[pick(candidates.length)];
}

/** `InterFloorTeleport.effect()` (`CursedWand.java`, tag `v3.3.8`): for depths below
 * the current floor, weights are 1..10 on the most recent ten eligible floors. */
export function cursedInterfloorDepthWeights(depth: number): number[] {
	const weights = Array.from({ length: Math.max(0, Math.floor(depth) - 1) }, () => 0);
	const start = Math.max(1, Math.floor(depth) - 10);
	for (let floor = start; floor < depth; floor++) weights[floor - 1] = floor - start + 1;
	return weights;
}

/** `CursingTrap.curse(Hero)` prefers equipped weapon/armor without an affix, then falls back
 * to any supported weapon/armor. Java shuffles each pool and takes its first item; a uniform
 * index draw preserves that distribution without reproducing the shuffle's RNG call sequence.
 * The hero's ring is not in Java's candidate pools. */
export function pickCursedEquipmentSlot(
	weaponEligible: boolean,
	weaponHasAffix: boolean,
	armorEligible: boolean,
	armorHasAffix: boolean,
	pick: (bound: number) => number,
): 'weapon' | 'armor' | undefined {
	const preferred: ('weapon' | 'armor')[] = [];
	const fallback: ('weapon' | 'armor')[] = [];
	if (weaponEligible) (weaponHasAffix ? fallback : preferred).push('weapon');
	if (armorEligible) (armorHasAffix ? fallback : preferred).push('armor');
	const pool = preferred.length > 0 ? preferred : fallback;
	if (pool.length === 0) return undefined;
	return pool[pick(pool.length)];
}

/** `ConeOfColors.effect()`'s per-character `Random.Int(5)` branch. */
export type ConeOfColorsStatus = 'burning' | 'frost' | 'poison' | 'ooze' | 'electricity';
export const CONE_OF_COLORS_STATUSES: readonly ConeOfColorsStatus[] = [
	'burning', 'frost', 'poison', 'ooze', 'electricity',
];
export function pickConeOfColorsStatus(pick: (bound: number) => number): ConeOfColorsStatus {
	return CONE_OF_COLORS_STATUSES[pick(CONE_OF_COLORS_STATUSES.length)]!;
}

/** `EFFECT_CAT_CHANCES` (`CursedWand.java`, tag `v3.3.8`): Java rolls
 * `Random.chances({60,30,9,1})`. Keep all four buckets distinct even though this port has no
 * VeryRare handlers yet; mapping that 1% onto Rare would silently change effect odds. */
export function pickCursedTier(pick: (bound: number) => number): 'common' | 'uncommon' | 'rare' | 'veryRare' {
	const roll = pick(100);
	return roll < 60 ? 'common' : roll < 90 ? 'uncommon' : roll < 99 ? 'rare' : 'veryRare';
}

/** `Random.element(RARE_EFFECTS)`, restricted to the six implemented ids, uniform pick. */
export function pickCursedRareEffect(pick: (bound: number) => number): CursedRareEffectId {
	return CURSED_RARE_EFFECT_IDS[pick(CURSED_RARE_EFFECT_IDS.length)]!;
}

/** `Random.element(COMMON_EFFECTS)`: a uniform pick among this port's implemented Common effects. */
export function pickCursedCommonEffect(pick: (bound: number) => number): CursedCommonEffectId {
	return CURSED_COMMON_EFFECT_IDS[pick(CURSED_COMMON_EFFECT_IDS.length)]!;
}

/** `Random.element(UNCOMMON_EFFECTS)` with the same `valid()` filter as Java. When
 * `NO_HERBALISM` is active, `RandomPlant.valid()` is false (`CursedWand.java`, tag `v3.3.8`).
 * This port filters before its single pick instead of replaying Java's do/while retries, so
 * the eligible distribution matches while the RNG call count remains simplified. */
export function pickCursedUncommonEffect(
	pick: (bound: number) => number,
	randomPlantAllowed = true,
): CursedUncommonEffectId {
	const effects = randomPlantAllowed
		? CURSED_UNCOMMON_EFFECT_IDS
		: CURSED_UNCOMMON_EFFECT_IDS.filter((effect) => effect !== 'randomPlant');
	return effects[pick(effects.length)]!;
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
