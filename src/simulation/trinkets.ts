/**
 * The trinket system's pure rules (`items/trinkets/*.java`, tag `v3.3.8`): the seventeen trinkets, their
 * upgrade energy costs and every level-indexed number the game reads from them. A trinket is a
 * carried unique item with a level 0..3; `trinketLevel` is `-1` when none is carried
 * (`Trinket.trinketLevel`), which is the "no trinket" identity every consumer falls back to.
 * Scene wiring lives in `scenes/dungeon/trinkets.ts` and the consumer sites it names.
 */

export const TRINKET_MAX_LEVEL = 3;

/** Bag id <-> Java class for the seventeen trinkets, in `Generator.java:581-597`'s deck order. */
export const TRINKETS = [
	{ id: 'trinketRatSkull', cls: 'RatSkull', key: 'ratskull' },
	{ id: 'trinketParchmentScrap', cls: 'ParchmentScrap', key: 'parchmentscrap' },
	{ id: 'trinketPetrifiedSeed', cls: 'PetrifiedSeed', key: 'petrifiedseed' },
	{ id: 'trinketExoticCrystals', cls: 'ExoticCrystals', key: 'exoticcrystals' },
	{ id: 'trinketMossyClump', cls: 'MossyClump', key: 'mossyclump' },
	{ id: 'trinketDimensionalSundial', cls: 'DimensionalSundial', key: 'dimensionalsundial' },
	{ id: 'trinketThirteenLeafClover', cls: 'ThirteenLeafClover', key: 'thirteenleafclover' },
	{ id: 'trinketTrapMechanism', cls: 'TrapMechanism', key: 'trapmechanism' },
	{ id: 'trinketMimicTooth', cls: 'MimicTooth', key: 'mimictooth' },
	{ id: 'trinketWondrousResin', cls: 'WondrousResin', key: 'wondrousresin' },
	{ id: 'trinketEyeOfNewt', cls: 'EyeOfNewt', key: 'eyeofnewt' },
	{ id: 'trinketSaltCube', cls: 'SaltCube', key: 'saltcube' },
	{ id: 'trinketVialOfBlood', cls: 'VialOfBlood', key: 'vialofblood' },
	{ id: 'trinketShardOfOblivion', cls: 'ShardOfOblivion', key: 'shardofoblivion' },
	{ id: 'trinketChaoticCenser', cls: 'ChaoticCenser', key: 'chaoticcenser' },
	{ id: 'trinketFerretTuft', cls: 'FerretTuft', key: 'ferrettuft' },
	{ id: 'trinketCrackedSpyglass', cls: 'CrackedSpyglass', key: 'crackedspyglass' },
] as const;

export type TrinketId = typeof TRINKETS[number]['id'];

const BY_ID: ReadonlyMap<string, typeof TRINKETS[number]> = new Map(TRINKETS.map((trinket) => [trinket.id as string, trinket]));
const BY_CLASS: ReadonlyMap<string, typeof TRINKETS[number]> = new Map(TRINKETS.map((trinket) => [trinket.cls as string, trinket]));

export function isTrinketId(id: string): id is TrinketId { return BY_ID.has(id); }
export function trinketForClass(cls: string): typeof TRINKETS[number] | undefined { return BY_CLASS.get(cls); }
export function trinketClassOf(id: string): string | undefined { return BY_ID.get(id)?.cls; }
/** The `items.trinkets.<key>.name/desc/stats_desc` message prefix. */
export function trinketMessageKey(id: string): string | undefined {
	const trinket = BY_ID.get(id);
	return trinket ? `items.trinkets.${trinket.key}` : undefined;
}

/** `upgradeEnergyCost()`: the Alchemy-pot price of `+1`. 6 / 8 / 10 for most, 10 / 15 / 20 for the three costly ones. */
export function trinketUpgradeEnergyCost(id: string, level: number): number {
	switch (id) {
		case 'trinketParchmentScrap': case 'trinketMossyClump': case 'trinketWondrousResin': return 10 + 5 * level;
		default: return 6 + 2 * level;
	}
}

/** `Trinket.UpgradeTrinket.testIngredients()`: a single trinket below +3. */
export function canUpgradeTrinket(level: number): boolean { return level < TRINKET_MAX_LEVEL; }

/** Trinket `energyVal()`: what scrapping one at the Alchemize/Energize window yields. */
export const TRINKET_ENERGY_VALUE = 5;
/** `TrinketCatalyst.Recipe.cost()`. */
export const TRINKET_CATALYST_COST = 6;
/** `WndTrinket.NUM_TRINKETS`: how many trinkets a catalyst offers. */
export const TRINKET_CATALYST_OFFERS = 4;

/** `Dungeon.trinketCataNeeded()` (`Dungeon.java:584-587`): one catalyst on floors 1-3, `1/(4-depth)` per floor. */
export function trinketCatalystRollNeeded(depth: number, alreadyDropped: boolean, roll: (bound: number) => number): boolean {
	return depth < 5 && !alreadyDropped && roll(4 - depth) === 0;
}

// --- RatSkull ---------------------------------------------------------------------------------------
/** `RatSkull.exoticChanceMultiplier(level)`: the alt-mob chance multiplier (`1` with none, `2 + level`). */
export function ratSkullMultiplier(level: number): number { return level === -1 ? 1 : 2 + level; }

// --- ParchmentScrap ---------------------------------------------------------------------------------
export function parchmentEnchantMultiplier(level: number): number {
	switch (level) { case 0: return 2; case 1: return 4; case 2: return 7; case 3: return 10; default: return 1; }
}
export function parchmentCurseMultiplier(level: number): number {
	switch (level) { case 0: return 1.5; case 1: return 2; case 2: return 1; case 3: return 0; default: return 1; }
}

// --- PetrifiedSeed ----------------------------------------------------------------------------------
export function petrifiedGrassLootMultiplier(level: number): number { return level <= 0 ? 1 : 1 + 0.25 * level / 3; }
export function petrifiedStoneInsteadOfSeedChance(level: number): number {
	switch (level) { case 0: return 0.25; case 1: return 0.46; case 2: return 0.65; case 3: return 0.8; default: return 0; }
}

// --- ExoticCrystals ---------------------------------------------------------------------------------
export function exoticConsumableChance(level: number): number { return level === -1 ? 0 : 0.125 + 0.125 * level; }

// --- MossyClump / TrapMechanism ---------------------------------------------------------------------
export function mossyOverrideLevelChance(level: number): number { return level === -1 ? 0 : 0.25 + 0.25 * level; }
export function trapMechanismOverrideLevelChance(level: number): number { return level === -1 ? 0 : 0.25 + 0.25 * level; }
export function trapMechanismRevealChance(level: number): number { return level === -1 ? 0 : 0.1 + 0.1 * level; }

// --- DimensionalSundial -----------------------------------------------------------------------------
export function sundialDaytimeMultiplier(level: number): number { return level === -1 ? 1 : 0.95 - 0.05 * level; }
export function sundialNighttimeMultiplier(level: number): number { return level === -1 ? 1 : 1.25 + 0.25 * level; }
/** `spawnMultiplierAtCurrentTime()`: night is hour >= 20 or <= 7 on the local clock. */
export function sundialIsNight(hourOfDay: number): boolean { return hourOfDay >= 20 || hourOfDay <= 7; }
export function sundialSpawnMultiplier(level: number, hourOfDay: number): number {
	if (level === -1) return 1;
	return sundialIsNight(hourOfDay) ? sundialNighttimeMultiplier(level) : sundialDaytimeMultiplier(level);
}

// --- ThirteenLeafClover -----------------------------------------------------------------------------
export const CLOVER_MAX_CHANCE = 0.6;
export function cloverAlterChance(level: number): number { return level <= -1 ? 0 : 0.25 + 0.25 * level; }
/** `alterDamageRoll(min, max)`: max with 60%, else min. `roll` is a `Random.Float()` draw. */
export function cloverDamageRoll(min: number, max: number, roll: number): number { return roll < CLOVER_MAX_CHANCE ? max : min; }

// --- MimicTooth -------------------------------------------------------------------------------------
export function mimicChanceMultiplier(level: number): number { return level === -1 ? 1 : 1.5 + 0.5 * level; }
export function mimicTeethStealthy(level: number): boolean { return level >= 0; }
export function ebonyMimicChance(level: number): number { return level >= 0 ? 0.125 + 0.125 * level : 0; }

// --- WondrousResin ----------------------------------------------------------------------------------
/** `WondrousResin.positiveCurseEffectChance()` (`items/trinkets/WondrousResin.java`, tag
 * `v3.3.8`): `forcePositive` is scoped around bonus cursed zaps and makes the result certain,
 * even when no Resin is carried. */
export function resinPositiveCurseChance(level: number, forcePositive = false): number {
	return forcePositive ? 1 : level >= 0 ? 0.25 + 0.25 * level : 0;
}
export function resinExtraCurseChance(level: number): number { return level >= 0 ? 0.125 + 0.125 * level : 0; }

// --- EyeOfNewt --------------------------------------------------------------------------------------
export function newtVisionMultiplier(level: number): number { return level < 0 ? 1 : 0.875 - 0.125 * level; }
export function newtMindVisionRange(level: number): number { return level < 0 ? 0 : 2 + level; }

// --- SaltCube ---------------------------------------------------------------------------------------
export function saltHungerGainMultiplier(level: number): number { return level === -1 ? 1 : 1 / (1 + 0.25 * (level + 1)); }
export function saltHealthRegenMultiplier(level: number): number {
	switch (level) { case 0: return 0.84; case 1: return 0.73; case 2: return 0.66; case 3: return 0.6; default: return 1; }
}

// --- VialOfBlood ------------------------------------------------------------------------------------
export function vialDelaysBurstHealing(level: number): boolean { return level !== -1; }
export function vialTotalHealMultiplier(level: number): number { return level === -1 ? 1 : 1 + 0.125 * (level + 1); }
/** `maxHealPerTurn(level)`; `maxHp` is `hero.HT` (20 with no hero). */
export function vialMaxHealPerTurn(level: number, maxHp: number): number {
	if (level === -1) return maxHp;
	switch (level) {
		case 1: return 3 + Math.round(0.10 * maxHp);
		case 2: return 2 + Math.round(0.07 * maxHp);
		case 3: return 1 + Math.round(0.05 * maxHp);
		default: return 4 + Math.round(0.15 * maxHp);
	}
}

// --- ShardOfOblivion --------------------------------------------------------------------------------
export function shardDisablesPassiveId(level: number): boolean { return level >= 0; }
/** `lootChanceMultiplier`: `1 + 0.2 x min(unidentified worn/used things, level + 1)`. */
export function shardLootMultiplier(level: number, unidentifiedInUse: number): number {
	if (level < 0) return 1;
	return 1 + 0.2 * Math.min(unidentifiedInUse, level + 1);
}

// --- ChaoticCenser ----------------------------------------------------------------------------------
export function censerAverageTurnsUntilGas(level: number): number { return level <= -1 ? -1 : Math.trunc(300 / (level + 1)); }

// --- FerretTuft -------------------------------------------------------------------------------------
export function ferretEvasionMultiplier(level: number): number { return level <= -1 ? 1 : 1 + 0.125 * (level + 1); }

// --- CrackedSpyglass --------------------------------------------------------------------------------
export function spyglassExtraLootChance(level: number): number { return level <= -1 ? 0 : 0.375 * (level + 1); }
