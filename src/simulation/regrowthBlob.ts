import type { Creature } from '../combat';
import { evolveJavaBlob } from './javaBlob';

export interface RegrowthContext {
	width: number;
	height: number;
	before: readonly number[];
	isSolid: (x: number, y: number) => boolean;
	terrainAt: (cell: number) => number;
	setTerrain: (cell: number, terrain: number) => void;
	hasPlant: (cell: number) => boolean;
	creatureAt: (x: number, y: number) => Creature | null;
	isBlobImmune: (creature: Creature) => boolean;
	addRoots: (creature: Creature, turns: number) => void;
	grass: number;
	highGrass: number;
	embers: number;
	floor: number;
}

/** `Regrowth.evolve()` after `Blob.evolve()` (`actors/blobs/Regrowth.java` + `Blob.java`,
 * tag `v3.3.8`). Returns Java's next volume field and applies the cell terrain/root effects.
 * Terrain is a coarse game-kind grid here: Java distinguishes EMPTY, EMPTY_DECO and
 * FURROWED_GRASS, while this port stores those as FLOOR or HIGH_GRASS respectively. */
export function advanceRegrowth(context: RegrowthContext): number[] {
	const { width, height, before } = context;
	const next = evolveJavaBlob(width, height, before, context.isSolid);
	for (let cell = 0; cell < next.length; cell++) {
		if (next[cell]! <= 0) continue;
		const x = cell % width, y = Math.floor(cell / width);
		const terrain = context.terrainAt(cell);
		let replacement = terrain;
		const creature = context.creatureAt(x, y);
		if (terrain === context.floor || terrain === context.embers) {
			replacement = before[cell]! > 9 && creature === null ? context.highGrass : context.grass;
		} else if ((terrain === context.grass || terrain === context.highGrass)
			&& before[cell]! > 9 && !context.hasPlant(cell) && creature === null) {
			replacement = context.highGrass;
		}
		if (replacement !== terrain) {
			context.setTerrain(cell, replacement);
		}
		if (next[cell]! > 1 && creature && !context.isBlobImmune(creature)) context.addRoots(creature, 1);
	}
	return next;
}
