import type { SimulationRandom } from './random';

export interface WeaponAffixState {
	affix: string | null;
	isLiveHero: boolean;
	enchantProcMultiplier: number;
	attackerHp: number;
	attackerMaxHp: number;
	defenderIsNpc: boolean;
	defenderImmovable: boolean;
}

export interface WeaponAffixResolution {
	damage: number;
	applySacrificialBleeding: boolean;
	sacrificialBleedAmount: number;
	displaceDefender: boolean;
}

/** Resolves attack-time weapon-affix rolls from `Weapon.proc()` (tag `v3.3.8`). */
export function resolveAttackWeaponAffixes(
	damage: number,
	state: WeaponAffixState,
	random: SimulationRandom,
): WeaponAffixResolution {
	let applySacrificialBleeding = false;
	let sacrificialBleedAmount = 0;
	let displaceDefender = false;
	if (state.isLiveHero && state.affix === 'polarized') {
		damage = random.chance(0.5) ? Math.round(damage * 1.5) : 0;
	}
	if (state.isLiveHero && state.affix === 'sacrificial'
		&& random.chance((1 / 10) * state.enchantProcMultiplier)) {
		sacrificialBleedAmount = (state.attackerHp / state.attackerMaxHp) ** 2 * state.attackerMaxHp / 8;
		applySacrificialBleeding = random.chance(sacrificialBleedAmount);
	}
	if (state.isLiveHero && state.affix === 'displacing' && !state.defenderIsNpc && !state.defenderImmovable) {
		displaceDefender = random.chance((1 / 12) * state.enchantProcMultiplier);
	}
	return { damage, applySacrificialBleeding, sacrificialBleedAmount, displaceDefender };
}
