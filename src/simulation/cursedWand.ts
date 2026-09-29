/**
 * `CursedWand.cursedZap()` (`items/wands/CursedWand.java`, tags `v3.3.8`/`v4.0.0`):
 * rolls Java's weighted 60/30/9/1 tier and uniformly chooses from that tier's catalog.
 * Common, Uncommon, Rare and VeryRare keep their distinct weights and catalogs. The VeryRare
 * planner records Java's eight-effect order; the scene handles all eight. Its three newest
 * outcomes use the existing Mimic sprite for Golden Mimic, replace the exact firing Wand with a
 * generated cursed reward for RandomTransmogrify, and apply a temporary cosmetic class-sheet
 * disguise for HeroShapeShift. Those presentation/model limits are recorded at the dispatch and
 * in `coverage/rows-items-equipment-and-artifacts.md`. `WondrousResin`'s positiveOnly mode is
 * unreachable from Wild Magic and remains outside this path.
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
 * The runtime dispatches this one-percent tier to `castCursedWandVeryRareEffect`; keeping the
 * authoritative order here prevents catalog and scene dispatch from silently diverging. */
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
