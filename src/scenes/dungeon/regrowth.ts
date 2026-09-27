import type { DungeonScene } from '../dungeonScene';
import { Blob } from 'mwg';
import { addBuff } from '../../combat';
import { EMBERS, FLOOR, GRASS, HIGH_GRASS } from '../../dungeonConstants';
import { BLOB_IMMUNE_KINDS, type AnyMonsterId } from '../../monsters';
import { advanceRegrowth } from '../../simulation/regrowthBlob';

declare module '../dungeonScene' {
	interface DungeonScene { regrowth: Blob; }
}

export const regrowthMethods = {
	/** Advances SPD's persistent Regrowth field (`Regrowth.evolve()`, tag `v3.3.8`). */
	advanceRegrowth(this: DungeonScene): void {
		const before = this.regrowth.toJSON().volume;
		const next = advanceRegrowth({
			width: this.level.width,
			height: this.level.height,
			before,
			isSolid: (x, y) => !this.level.passable(x, y),
			terrainAt: (cell) => this.level.terrain[cell]!,
			setTerrain: (cell, terrain) => {
				const x = cell % this.level.width, y = Math.floor(cell / this.level.width);
				this.level.set(x, y, terrain);
				this.restitchTilesAround(x, y);
			},
			hasPlant: (cell) => this.manualPlants.has(cell) || this.portedFeatures.kindAt(cell)?.startsWith('plant:') === true,
			creatureAt: (x, y) => this.creatureAt(x, y),
			isBlobImmune: (creature) => creature.buffs.blobImmunity !== undefined
				|| creature.buffs.spectatorFreeze !== undefined
				|| (creature.kind !== undefined && BLOB_IMMUNE_KINDS.has(creature.kind as AnyMonsterId)),
			addRoots: (creature, turns) => addBuff(creature, 'roots', turns),
			grass: GRASS,
			highGrass: HIGH_GRASS,
			embers: EMBERS,
			floor: FLOOR,
		});
		this.regrowth = Blob.fromJSON({ width: this.level.width, height: this.level.height, volume: next });
	},
};
