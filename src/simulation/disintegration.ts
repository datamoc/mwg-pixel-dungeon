/**
 * Renderer-free part of `WandOfDisintegration.onZap()` (`WandOfDisintegration.java`,
 * tag `v3.3.8`). A solid cell contributes to the terrain counter; every third counted
 * terrain unit contributes one effective wand level, with the initial counter of two
 * matching Java's integer-rounding setup.
 */
export interface DisintegrationBeamCell {
	solid: boolean;
	flammable: boolean;
	victim: boolean;
	eligibleVictim: boolean;
}

export interface DisintegrationPlan {
	maxDistance: number;
	victimCells: number[];
	terrainBonus: number;
	effectiveLevel: number;
	flammableCells: number[];
}

export function planDisintegration(level: number, cells: readonly DisintegrationBeamCell[]): DisintegrationPlan {
	const safeLevel = Math.max(0, level);
	const maxDistance = 6 + 2 * safeLevel;
	const victimCells: number[] = [];
	const flammableCells: number[] = [];
	let terrainPassed = 2;
	let terrainBonus = 0;
	for (let index = 0; index < Math.min(maxDistance, cells.length); index++) {
		const cell = cells[index]!;
		if (cell.victim && cell.eligibleVictim) {
			terrainBonus += Math.floor(terrainPassed / 3);
			terrainPassed %= 3;
			victimCells.push(index);
		}
		if (cell.solid) terrainPassed++;
		if (cell.flammable) flammableCells.push(index);
	}
	return {
		maxDistance,
		victimCells,
		terrainBonus,
		effectiveLevel: safeLevel + Math.max(0, victimCells.length - 1) + terrainBonus,
		flammableCells,
	};
}
