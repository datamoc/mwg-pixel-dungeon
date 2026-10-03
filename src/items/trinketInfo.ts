import { has, t } from '../i18n';
import {
	censerAverageTurnsUntilGas, cloverAlterChance, CLOVER_MAX_CHANCE, ebonyMimicChance, exoticConsumableChance, ferretEvasionMultiplier,
	mimicChanceMultiplier, mossyOverrideLevelChance, newtMindVisionRange, newtVisionMultiplier, parchmentCurseMultiplier,
	parchmentEnchantMultiplier, petrifiedGrassLootMultiplier, petrifiedStoneInsteadOfSeedChance, ratSkullMultiplier, resinExtraCurseChance,
	resinPositiveCurseChance, saltHealthRegenMultiplier, saltHungerGainMultiplier, spyglassExtraLootChance, sundialDaytimeMultiplier,
	sundialNighttimeMultiplier, trapMechanismOverrideLevelChance, trapMechanismRevealChance, trinketMessageKey, vialMaxHealPerTurn,
	vialTotalHealMultiplier,
} from '../simulation/trinkets';

/** `Messages.decimalFormat("#.##", x)`: at most two decimals, no trailing zeros. */
function fmt(value: number): string { return String(Number(value.toFixed(2))); }

/**
 * `Trinket.statsDesc()` (`items/trinkets/*.java`, tag `v3.3.8`): the level-dependent paragraph under a
 * trinket's flavour text. Each trinket passes its own formulas to its own `stats_desc` message, so the
 * argument order below is each class' `Messages.get(this, "stats_desc", ...)` call. `maxHp` is `hero.HT`
 * (the Vial of Blood's heal cap). Trinkets here are always identified (`levelKnown`), so the
 * `typical_stats_desc` (level 0) variant Java shows for an unidentified one is not used.
 */
export function trinketStatsDescription(id: string, level: number, maxHp: number): string | undefined {
	const prefix = trinketMessageKey(id);
	if (!prefix) return undefined;
	const lvl = Math.max(0, level);
	let args: Record<string, string | number> = {};
	let key = `${prefix}.stats_desc`;
	switch (id) {
		case 'trinketRatSkull': args = { 0: Math.trunc(ratSkullMultiplier(lvl)) }; break;
		case 'trinketParchmentScrap': args = { 0: Math.trunc(parchmentEnchantMultiplier(lvl)), 1: fmt(parchmentCurseMultiplier(lvl)) }; break;
		case 'trinketPetrifiedSeed': args = { 0: fmt(100 * petrifiedStoneInsteadOfSeedChance(lvl)), 1: fmt(100 * (petrifiedGrassLootMultiplier(lvl) - 1)) }; break;
		case 'trinketExoticCrystals': args = { 0: fmt(100 * exoticConsumableChance(lvl)) }; break;
		case 'trinketMossyClump': args = { 0: Math.trunc(100 * mossyOverrideLevelChance(lvl)) }; break;
		case 'trinketDimensionalSundial': args = { 0: Math.trunc(100 * (1 - sundialDaytimeMultiplier(lvl))), 1: Math.trunc(100 * (sundialNighttimeMultiplier(lvl) - 1)) }; break;
		case 'trinketThirteenLeafClover': args = { 0: Math.round(CLOVER_MAX_CHANCE * 100 * cloverAlterChance(lvl)), 1: Math.round((1 - CLOVER_MAX_CHANCE) * 100 * cloverAlterChance(lvl)) }; break;
		case 'trinketTrapMechanism': args = { 0: Math.trunc(100 * trapMechanismOverrideLevelChance(lvl)), 1: Math.trunc(100 * trapMechanismRevealChance(lvl)) }; break;
		case 'trinketMimicTooth': args = { 0: fmt(mimicChanceMultiplier(lvl)), 1: fmt(100 * ebonyMimicChance(lvl)) }; break;
		case 'trinketWondrousResin': args = { 0: fmt(100 * resinPositiveCurseChance(lvl)), 1: fmt(100 * resinExtraCurseChance(lvl)) }; break;
		case 'trinketEyeOfNewt': args = { 0: fmt(100 * (1 - newtVisionMultiplier(lvl))), 1: newtMindVisionRange(lvl) }; break;
		case 'trinketSaltCube': args = { 0: fmt(100 * (1 / saltHungerGainMultiplier(lvl) - 1)), 1: fmt(100 * (1 - saltHealthRegenMultiplier(lvl))) }; break;
		case 'trinketVialOfBlood': args = { 0: fmt(100 * (vialTotalHealMultiplier(lvl) - 1)), 1: String(vialMaxHealPerTurn(lvl, maxHp)) }; break;
		case 'trinketShardOfOblivion': args = { 0: lvl + 1 }; break;
		case 'trinketChaoticCenser': args = { 0: censerAverageTurnsUntilGas(lvl) }; break;
		case 'trinketFerretTuft': args = { 0: fmt(100 * (ferretEvasionMultiplier(lvl) - 1)) }; break;
		case 'trinketCrackedSpyglass':
			if (lvl >= 2) { key = `${prefix}.stats_desc_upgraded`; args = { 0: fmt(100 * (spyglassExtraLootChance(lvl) - 1)) }; }
			else args = { 0: fmt(100 * spyglassExtraLootChance(lvl)) };
			break;
		default: return undefined;
	}
	return has(key) ? t(key, args) : undefined;
}

/** `Trinket.info()`: `desc()` plus the stats paragraph. */
export function trinketInfoText(id: string, level: number, maxHp: number, desc: string | undefined): string | undefined {
	const stats = trinketStatsDescription(id, level, maxHp);
	if (desc === undefined) return stats;
	return stats === undefined ? desc : `${desc}\n\n${stats}`;
}
