import type { ClassId } from './classes';

/** Pure, scene-independent rules for the small talent procs implemented by the port. */
export function ironWillReduction(hp: number, maxHp: number, rank: number): number {
	return rank > 0 && hp <= maxHp * 0.5 ? rank : 0;
}

export function shieldBatteryGain(blocked: number, rank: number): number {
	return blocked > 0 && rank > 0 ? rank : 0;
}

export function rejuvenatingStepHeal(terrain: number, grass: number, hp: number, maxHp: number, rank: number): number {
	return terrain === grass && rank > 0 ? Math.min(Math.max(0, maxHp - hp), rank) : 0;
}

export function lethalHasteFreeTurn(classId: ClassId, rank: number): boolean {
	return classId === 'duelist' && rank > 0;
}

export function weaponRechargingGain(classId: ClassId, rank: number): number {
	return classId === 'duelist' && rank > 0 ? rank : 0;
}

export function farsightRange(subclass: string | null, rank: number): number {
	return 6 + (subclass === 'sniper' ? 2 * rank : 0);
}

export function shieldingDewGain(subclass: string | null, rank: number): number {
	return subclass === 'warden' && rank > 0 ? rank : 0;
}

export function preservationChance(rank: number): number {
	return rank === 1 ? 0.2 : rank >= 2 ? 0.35 : 0;
}

export function ironStomachReduction(classId: ClassId, rank: number): number {
	return classId === 'warrior' ? 2 * rank : 0;
}

export function cachedRationChance(classId: ClassId, rank: number): number {
	return classId === 'rogue' ? 0.2 * rank : 0;
}

export function canImproviseProjectile(classId: ClassId, rank: number, stones: number): boolean {
	return classId === 'warrior' && rank > 0 && stones > 0;
}

export function evasiveArmorBonus(subclass: string | null, rank: number, armorLevel: number): number {
	return subclass === 'freerunner' ? rank * armorLevel : 0;
}

export function assassinReachBonus(subclass: string | null, rank: number): number {
	return subclass === 'assassin' ? rank : 0;
}

export function empoweredStrikeBonus(subclass: string | null, rank: number): number {
	return subclass === 'battlemage' ? rank : 0;
}

export function bountyGoldBonus(subclass: string | null, rank: number): number {
	return subclass === 'assassin' ? 5 * rank : 0;
}

export function unencumberedSpiritEvasion(subclass: string | null, rank: number): number {
	return subclass === 'monk_sub' ? rank : 0;
}

export function lethalDefenseShield(subclass: string | null, rank: number): number {
	return subclass === 'gladiator' ? rank : 0;
}

export function monasticVigorShield(subclass: string | null, rank: number): number {
	return subclass === 'monk_sub' ? rank : 0;
}

export function sharedUpgradeArmor(subclass: string | null, rank: number, armorLevel: number): number {
	return subclass === 'sniper' && rank > 0 && armorLevel < 3 ? 1 : 0;
}

export function twinUpgradeArmor(subclass: string | null, rank: number, armorLevel: number): number {
	return subclass === 'champion' && rank > 0 && armorLevel < 3 ? 1 : 0;
}

export function soulSiphonCharge(subclass: string | null, rank: number): number {
	return subclass === 'warlock' ? rank : 0;
}

export function projectileMomentumBonus(subclass: string | null, rank: number, ready: boolean): number {
	return subclass === 'freerunner' && ready ? rank : 0;
}

export function enragedCatalystBonus(subclass: string | null, rank: number, hp: number, maxHp: number): number {
	return subclass === 'berserker' && hp <= maxHp * 0.5 ? rank : 0;
}

export function cleaveComboSeed(subclass: string | null, rank: number): number {
	return subclass === 'gladiator' && rank > 0 ? 2 : 0;
}

export function deathlessFuryTriggers(subclass: string | null, rank: number, used: boolean, damage: number, hp: number): boolean {
	return !used && subclass === 'berserker' && rank > 0 && damage >= hp;
}

export function enhancedLethalityThreshold(subclass: string | null, rank: number): number {
	return subclass === 'assassin' ? 0.2 * rank : 0;
}

export function endlessRageFreeTurn(subclass: string | null, rank: number): boolean {
	return subclass === 'berserker' && rank > 0;
}

export function arcaneVisionRadius(classId: ClassId, rank: number): number {
	return (classId === 'mage' || classId === 'cleric') ? 2 + rank * 2 : 0;
}

export function necromancerMinionChance(subclass: string | null, rank: number): number {
	return subclass === 'warlock' ? [0, 0.13, 0.27, 0.4][Math.min(3, rank)] : 0;
}
