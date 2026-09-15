import type { Creature, Step } from '../combat';

export type EnvironmentalBlob = 'plantGas' | 'plantFreeze' | 'toxicGas' | 'paralyticGas' | 'stenchGas' | 'corrosiveGas' | 'confusionGas';

// `StenchGas.evolve()` uses `Paralysis.DURATION / 5`; this port's authored Java duration is 10.
const STENCH_PARALYSIS_DURATION = 2;

export interface EnvironmentalBlobsContext {
	creatures: readonly Creature[];
	passable: (x: number, y: number) => boolean;
	advance: (blob: EnvironmentalBlob, isSolid: (x: number, y: number) => boolean) => void;
	cellsAbove: (blob: EnvironmentalBlob, threshold: number) => readonly Step[];
	creatureAt: (x: number, y: number) => Creature | null;
	addBuff: (target: Creature, id: 'poison' | 'paralysis' | 'ooze' | 'daze', duration?: number) => void;
	applyCorrosion: (target: Creature, strength: number) => void;
	corrosiveStrength: () => number;
	toxicDamage: (target: Creature) => number;
	isToxicImmune: (target: Creature) => boolean;
	/** Java's IMMOVABLE immunity to Vertigo: the confusion-gas daze here IS Vertigo's
	 *  stand-in, so immovable kinds refuse it - while daze from every other source (prismatic
	 *  light, fists, plants) still lands, since those are not Vertigo. Optional so headless
	 *  callers keep working. */
	isVertigoImmune?: (target: Creature) => boolean;
	applyDamage: (target: Creature, damage: number) => boolean;
}

/** Advances environmental blobs and applies their distinct SPD effects. */
export function applyEnvironmentalBlobs(context: EnvironmentalBlobsContext): void {
	const isSolid = (x: number, y: number): boolean => !context.passable(x, y);
	context.advance('plantGas', isSolid);
	context.advance('plantFreeze', isSolid);
	context.advance('toxicGas', isSolid);
	context.advance('paralyticGas', isSolid);
	context.advance('stenchGas', isSolid);
	context.advance('corrosiveGas', isSolid);
	context.advance('confusionGas', isSolid);
	for (const cell of context.cellsAbove('plantGas', 1)) {
		const target = context.creatureAt(cell.x, cell.y);
		if (target) context.addBuff(target, 'poison');
	}
	for (const cell of context.cellsAbove('plantFreeze', 0.5)) {
		const target = context.creatureAt(cell.x, cell.y);
		if (target) context.addBuff(target, 'paralysis');
	}
	for (const cell of context.cellsAbove('toxicGas', 0.0001)) {
		const target = context.creatureAt(cell.x, cell.y);
		if (!target || target.hp <= 0 || context.isToxicImmune(target)) continue;
		if (!context.applyDamage(target, context.toxicDamage(target))) return;
	}
	for (const cell of context.cellsAbove('paralyticGas', 0.0001)) {
		const target = context.creatureAt(cell.x, cell.y);
		if (target) context.addBuff(target, 'paralysis');
	}
	for (const cell of context.cellsAbove('stenchGas', 0.0001)) {
		const target = context.creatureAt(cell.x, cell.y);
		if (target) context.addBuff(target, 'paralysis', STENCH_PARALYSIS_DURATION);
	}
	for (const cell of context.cellsAbove('corrosiveGas', 0.0001)) {
		const target = context.creatureAt(cell.x, cell.y);
		if (target) context.applyCorrosion(target, context.corrosiveStrength());
	}
	for (const cell of context.cellsAbove('confusionGas', 0.0001)) {
		const target = context.creatureAt(cell.x, cell.y);
		// ConfusionGas.prolongs Vertigo for 2 turns; daze is this port's movement-confusion stand-in.
		if (!target || context.isVertigoImmune?.(target)) continue;
		context.addBuff(target, 'daze', 2);
	}
}
