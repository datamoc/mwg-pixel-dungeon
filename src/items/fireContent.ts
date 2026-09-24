import type { GroundItem } from '../combat';

export interface FireContentContext {
	cellIndex: (x: number, y: number) => number;
	groundItemAt: (x: number, y: number) => GroundItem | null;
	/** Every entry of the heap at the cell (`Heap.items`); without it only the top is burned. */
	groundItemsAt?: (x: number, y: number) => GroundItem[];
	removeGroundItem: (ground: GroundItem) => void;
	detonateBomb: (ground: GroundItem) => void;
	removePortedPlant: (cell: number) => void;
}

/** `Fire.burn()`/`Heap.burn()`/`Plant.wither()` item consequences. */
export function burnFireContents(context: FireContentContext, x: number, y: number): void {
	const cell = context.cellIndex(x, y);
	//`Heap.burn()` walks every item of the stack, top first, and burns each in turn.
	const top = context.groundItemAt(x, y);
	const entries = context.groundItemsAt ? [...context.groundItemsAt(x, y)].reverse() : top ? [top] : [];
	for (const ground of entries) {
		if (ground.kind === 'dewdrop' || ground.kind === 'scroll') {
			context.removeGroundItem(ground);
		} else if (ground.kind === 'bomb' && ground.item) {
			context.detonateBomb(ground);
		} else if (ground.kind === 'meat') {
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
	}
	context.removePortedPlant(cell);
}
