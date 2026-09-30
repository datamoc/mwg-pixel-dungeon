import type { SimulationRandom } from './random';
import { empoweredStrikeBonus } from '../talentEffects';

export interface AttackTalentState {
	isHero: boolean;
	isLiveHero: boolean;
	surprise: boolean;
	subclass: string | null;
	empoweredStrikeRank: number;
	suckerPunchRank: number;
	suckerPunchAlreadyUsed: boolean;
	physicalBonusAttacks: number;
	physicalBonusDamage: number;
	patientStrikeReady: boolean;
	patientStrikeRank: number;
	followupReady: boolean;
	followupDamage: number;
	deadlyFollowupReady: boolean;
	deadlyFollowupRank: number;
}

export interface AttackTalentResolution {
	damage: number;
	usedSuckerPunch: boolean;
	usedPhysicalBonusAttack: boolean;
	usedPatientStrike: boolean;
	usedFollowup: boolean;
	usedDeadlyFollowup: boolean;
}

/** Resolves the ordered numeric talent bonuses from `Hero.attackProc()` (tag `v3.3.8`). */
export function resolveAttackTalentBonuses(
	damage: number,
	state: AttackTalentState,
	random: SimulationRandom,
): AttackTalentResolution {
	let usedSuckerPunch = false;
	let usedPhysicalBonusAttack = false;
	let usedPatientStrike = false;
	let usedFollowup = false;
	let usedDeadlyFollowup = false;
	if (state.isLiveHero) damage += empoweredStrikeBonus(state.subclass, state.empoweredStrikeRank);
	if (state.isHero && state.surprise && state.suckerPunchRank > 0 && !state.suckerPunchAlreadyUsed) {
		// `Talent.java`: `Random.IntRange(points, 2)`; consume the target tracker only on proc eligibility.
		damage += random.range(state.suckerPunchRank, 2);
		usedSuckerPunch = true;
	}
	if (state.isLiveHero && state.physicalBonusAttacks > 0) {
		damage += state.physicalBonusDamage;
		usedPhysicalBonusAttack = true;
	}
	if (state.isLiveHero && state.patientStrikeReady) {
		damage += state.patientStrikeRank;
		usedPatientStrike = true;
	}
	if (state.isLiveHero && state.followupReady) {
		damage += state.followupDamage;
		usedFollowup = true;
	}
	if (state.isLiveHero && state.deadlyFollowupReady) {
		// `Talent.DEADLY_FOLLOWUP` is last in Java's `onAttackProc` chain and scales all accumulated damage.
		damage = Math.round(damage * (1 + 0.08 * state.deadlyFollowupRank));
		usedDeadlyFollowup = true;
	}
	return { damage, usedSuckerPunch, usedPhysicalBonusAttack, usedPatientStrike, usedFollowup, usedDeadlyFollowup };
}
