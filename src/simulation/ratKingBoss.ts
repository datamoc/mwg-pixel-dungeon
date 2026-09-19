import type { SimulationRandom } from './random';

export type RatKingAddKind = 'ghoul' | 'monk' | 'warlock' | 'golem';

/**
 * Rat King summon decisions. The scene owns map placement and actor creation; this module
 * owns the encounter's rotation and wave schedule.
 */
export function ratKingP1Summon(made: number, challenge: boolean, random: SimulationRandom): RatKingAddKind {
	if (challenge) {
		if (made % 3 === 2) return made % 9 === 8 ? 'golem' : random.int(0, 2) === 0 ? 'monk' : 'warlock';
		return 'ghoul';
	}
	if (made % 4 === 3) return random.int(0, 2) === 0 ? 'monk' : 'warlock';
	return 'ghoul';
}

export interface RatKingWavePlan {
	adds: RatKingAddKind[];
	nextSummonsMade: number;
	announcement?: 'wave_1' | 'wave_2' | 'wave_3';
	/** Turns until the King's next wave turn: Java `spend(3*TICK)` batches pace at 3,
	 * `spend(TICK)` batches at 1 (see `takeKingTurn`). */
	cadence: number;
}

/** Returns the next phase-2 wave, or null once the shield schedule is exhausted. */
export function planRatKingWave(made: number, shield: number, challenge: boolean, random: SimulationRandom): RatKingWavePlan | null {
	const batch: RatKingAddKind[] = [];
	let announcement: RatKingWavePlan['announcement'];
	if (!challenge) {
		if (made >= 4 && (shield > 200 || made >= 8) && (shield > 100 || made >= 12)) return null;
		if (made < 4) {
			if (made === 0) announcement = 'wave_1';
			batch.push('ghoul');
			//`NormalWave1`: one ghoul per turn at `spend(3*TICK)`.
			return { adds: batch, nextSummonsMade: made + 1, announcement, cadence: 3 };
		} else if (shield <= 200 && made < 8) {
			if (made === 4) announcement = 'wave_2';
			if (made === 7) batch.push(random.int(0, 2) === 0 ? 'monk' : 'warlock');
			else batch.push('ghoul');
			//`NormalWave2`: one add per turn at `spend(TICK)`.
			return { adds: batch, nextSummonsMade: made + 1, announcement, cadence: 1 };
		} else if (shield <= 100 && made < 12) {
			//`NormalWave3` always yells (no made==12 gate on the yell in Java) and
			//jumps straight to 12 - the old code only announced at exactly 12, which
			//the counter never sits on, so the yell was dead. One turn at `spend(TICK)`.
			announcement = 'wave_3';
			batch.push('warlock', 'monk', 'ghoul', 'ghoul');
			return { adds: batch, nextSummonsMade: 12, announcement, cadence: 1 };
		} else return null;
	}
	if (made >= 6 && (shield > 300 || made >= 12) && (shield > 150 || made >= 18)) return null;
	if (made < 6) {
		if (made === 0) announcement = 'wave_1';
		batch.push('ghoul', 'ghoul');
		//`ChallengeWave1`: two ghouls per turn at `spend(3*TICK)`.
		return { adds: batch, nextSummonsMade: made + 2, announcement, cadence: 3 };
	} else if (shield <= 300 && made < 12) {
		if (made === 6) announcement = 'wave_2';
		batch.push('ghoul', 'ghoul', made === 6 ? 'monk' : 'warlock');
		//`ChallengeWave2`: three adds per turn at `spend(3*TICK)`.
		return { adds: batch, nextSummonsMade: made + 3, announcement, cadence: 3 };
	} else if (shield <= 150 && made < 18) {
		if (made === 12) {
			announcement = 'wave_3';
			batch.push('warlock', 'monk', 'ghoul', 'ghoul');
			//`ChallengeWave3a`: the mixed batch at `spend(3*TICK)`.
			return { adds: batch, nextSummonsMade: made + 4, announcement, cadence: 3 };
		} else batch.push('golem', 'golem');
		//`ChallengeWave3b`: two golems per turn at `spend(TICK)`.
		return { adds: batch, nextSummonsMade: made + 2, announcement, cadence: 1 };
	} else return null;
}
