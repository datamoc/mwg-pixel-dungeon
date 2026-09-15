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
		} else if (shield <= 200 && made < 8) {
			if (made === 4) announcement = 'wave_2';
			if (made === 7) batch.push(random.int(0, 2) === 0 ? 'monk' : 'warlock');
			else batch.push('ghoul');
		} else if (shield <= 100 && made < 12) {
			batch.push('warlock', 'monk', 'ghoul', 'ghoul');
		} else return null;
		return { adds: batch, nextSummonsMade: shield <= 100 && made < 12 && made >= 8 ? 12 : made + batch.length, announcement };
	}
	if (made >= 6 && (shield > 300 || made >= 12) && (shield > 150 || made >= 18)) return null;
	if (made < 6) {
		if (made === 0) announcement = 'wave_1';
		batch.push('ghoul', 'ghoul');
	} else if (shield <= 300 && made < 12) {
		if (made === 6) announcement = 'wave_2';
		batch.push('ghoul', 'ghoul', made === 6 ? 'monk' : 'warlock');
	} else if (shield <= 150 && made < 18) {
		if (made === 12) {
			announcement = 'wave_3';
			batch.push('warlock', 'monk', 'ghoul', 'ghoul');
		} else batch.push('golem', 'golem');
	} else return null;
	return { adds: batch, nextSummonsMade: made + batch.length, announcement };
}
