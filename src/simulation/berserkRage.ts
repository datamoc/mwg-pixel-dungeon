import {
	BERSERK_LEVEL_RECOVERY_START, BERSERK_TURN_RECOVERY_START, berserkAccruePower, berserkDecayPower, berserkMaxPower,
	berserkShieldBoost, berserkShieldDrain,
} from './subclassPassives';

/**
 * The Berserker's `Berserk` state machine (`actors/buffs/Berserk.java`, tag `v3.3.8`) as pure transitions over a
 * small state record; `subclassPassives.ts` holds the individual formulas. The scene owns the shield pool, the hero
 * and the deathless-fury "HP 0" bookkeeping (`scenes/dungeon/hero/berserkRage.ts`).
 */

export type RageMode = 'normal' | 'berserk' | 'recovering';

export interface Rage {
	mode: RageMode;
	power: number;
	/** `powerLossBuffer`: turns of grace after a hit before the rage starts to fade. */
	powerLossBuffer: number;
	/** `levelRecovery`: hero levels (fractions of one, fed by XP) still needed after a death-berserk. */
	levelRecovery: number;
	/** `turnRecovery`: turns still needed after an ordinary berserk. */
	turnRecovery: number;
}

export const NEW_RAGE: Rage = { mode: 'normal', power: 0, powerLossBuffer: 0, levelRecovery: 0, turnRecovery: 0 };

/** `Berserk.damage(damage)`: only while NORMAL, `power + (damage/HT)/4` capped by Endless Rage; the fade grace resets to 3. */
export function rageTakeDamage(rage: Rage, damage: number, maxHp: number, endlessRageRank: number): Rage {
	if (rage.mode !== 'normal') return rage;
	return { ...rage, power: berserkAccruePower(rage.power, damage, maxHp, berserkMaxPower(endlessRageRank)), powerLossBuffer: 3 };
}

/**
 * `Berserk.act()` for one turn. NORMAL: the grace counts down, then the power fades (`detach` once it is gone).
 * RECOVERING with no level debt and regeneration on: the turn debt counts down to NORMAL. BERSERK: the shield loses
 * `ceil(2.5%)` of itself (the fractional part of the drain is rolled, `roll` in [0,1)), and an empty shield ends the
 * berserk into RECOVERING with the power lost (`ended`).
 */
export function rageTick(rage: Rage, args: { hp: number; maxHp: number; shielding: number; regenOn: boolean; roll: number; decayFactor?: number }): { rage: Rage; drain: number; detach: boolean; ended: boolean } {
	const factor = args.decayFactor ?? 1;
	if (rage.mode === 'berserk') {
		if (args.shielding > 0) {
			let dmg = berserkShieldDrain(args.shielding) * factor;
			if (args.roll < dmg % 1) dmg++;
			const drain = Math.trunc(dmg);
			const ended = args.shielding - drain <= 0;
			return { rage: ended ? { ...rage, mode: 'recovering', power: 0 } : rage, drain, detach: false, ended };
		}
		return { rage: { ...rage, mode: 'recovering', power: 0 }, drain: 0, detach: false, ended: true };
	}
	if (rage.mode === 'normal') {
		if (rage.powerLossBuffer > 0) return { rage: { ...rage, powerLossBuffer: rage.powerLossBuffer - 1 }, drain: 0, detach: false, ended: false };
		const power = berserkDecayPower(rage.power, args.hp, args.maxHp);
		return { rage: { ...rage, power }, drain: 0, detach: power <= 0, ended: false };
	}
	if (rage.levelRecovery === 0 && args.regenOn) {
		const turnRecovery = rage.turnRecovery - 1;
		return turnRecovery <= 0
			? { rage: { ...rage, turnRecovery: 0, mode: 'normal' }, drain: 0, detach: false, ended: false }
			: { rage: { ...rage, turnRecovery }, drain: 0, detach: false, ended: false };
	}
	return { rage, drain: 0, detach: false, ended: false };
}

/**
 * `startBerserking()`: the shield is `berserkShieldBoost` (missing-HP scaled, x power over 100%). The recovery debt
 * depends on whether HP was still up: 100 turns, or `4 - Deathless Fury` levels when it happened at 0 HP; an
 * over-cap (Endless Rage) power shortens either by `2 - power`.
 */
export function rageStart(rage: Rage, args: { hp: number; maxHp: number; armorBuffedLevel: number; deathlessFuryRank: number }): { rage: Rage; shield: number } {
	let levelRecovery: number;
	let turnRecovery: number;
	if (args.hp > 0) { turnRecovery = BERSERK_TURN_RECOVERY_START; levelRecovery = 0; }
	else { levelRecovery = BERSERK_LEVEL_RECOVERY_START - args.deathlessFuryRank; turnRecovery = 0; }
	if (rage.power > 1) { levelRecovery *= 2 - rage.power; turnRecovery *= 2 - rage.power; }
	const shield = berserkShieldBoost(args.hp, args.maxHp, args.armorBuffedLevel, rage.power);
	return { rage: { ...rage, mode: 'berserk', levelRecovery, turnRecovery }, shield };
}

/** `recover(percent)` on every XP gain: pays the level debt while RECOVERING; finished levels + turns -> NORMAL. */
export function rageRecover(rage: Rage, percent: number): Rage {
	if (rage.mode !== 'recovering' || rage.levelRecovery <= 0) return rage;
	const levelRecovery = rage.levelRecovery - percent;
	if (levelRecovery > 0) return { ...rage, levelRecovery };
	return { ...rage, levelRecovery: 0, mode: rage.turnRecovery === 0 ? 'normal' : rage.mode };
}

/** `enchantFactor(chance)`: Enraged Catalyst adds `min(1, power) x 15% x rank` to an enchantment's proc multiplier. */
export function rageEnchantFactor(chance: number, power: number, enragedCatalystRank: number): number {
	return chance + Math.min(1, power) * 0.15 * enragedCatalystRank;
}

/** Whether a fatal hit is turned into a death-berserk: NORMAL, power >= 100% and the Deathless Fury talent. */
export function rageDeathless(rage: Rage, deathlessFuryRank: number): boolean {
	return rage.mode === 'normal' && rage.power >= 1 && deathlessFuryRank > 0;
}
