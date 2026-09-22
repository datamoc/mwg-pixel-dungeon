import type { GroundItem } from '../combat';

export interface FireContentContext {
	cellIndex: (x: number, y: number) => number;
	groundItemAt: (x: number, y: number) => GroundItem | null;
	removeGroundItem: (ground: GroundItem) => void;
	detonateBomb: (ground: GroundItem) => void;
	removePortedPlant: (cell: number) => void;
}

/** `Fire.burn()`/`Heap.burn()`/`Plant.wither()` item consequences. */
export function burnFireContents(context: FireContentContext, x: number, y: number): void {
	const cell = context.cellIndex(x, y);
	const ground = context.groundItemAt(x, y);
	if (ground?.kind === 'dewdrop' || ground?.kind === 'scroll') {
		context.removeGroundItem(ground);
	} else if (ground?.kind === 'bomb' && ground.item) {
		context.detonateBomb(ground);
	} else if (ground?.kind === 'meat') {
		// Java replaces MysteryMeat/FrozenCarpaccio with ChargrilledMeat.cook(item.quantity).
		// The port's compact `meat` heap is its MysteryMeat stand-in, so preserve the whole
		// stack while replacing its payload; cooking one item used to silently delete extras.
		ground.item = {
			id: 'chargrilledMeat',
			quantity: Math.max(1, ground.item?.quantity ?? 1),
			identified: true,
			sourceClass: 'ChargrilledMeat',
		};
	}
	context.removePortedPlant(cell);
}
