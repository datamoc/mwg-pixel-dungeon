/**
 * Port of `levels/rooms/special/ShopRoom.java`'s `paint()`/`placeShopkeeper()`/`placeItems()`.
 * The stock itself is rolled much earlier, lazily from `Room.minWidth()` - see
 * `spdItems/shopItems.ts` for why that ordering matters and what it assumes.
 *
 * Two things here draw on the level stream and were both easy to miss:
 *
 * 1. `placeShopkeeper()` is `level.pointToCell(center())`, and `Room.center()` rolls a
 *    `Random.Int(2)` per axis whose span is odd (Room.java:159-162). So a shop costs up to two
 *    draws just to seat its keeper.
 * 2. `placeItems()` walks the inner perimeter ring one cell per item, but **falls back to a
 *    random-cell retry loop whenever the walk lands on a cell that already holds a heap**. With
 *    more stock than ring cells the walk wraps onto its own earlier drops, so that loop is not a
 *    rare edge case - it is reached on every shop whose stock exceeds its ring. A 7x7 shop has a
 *    16-cell ring against ~20 items at depth 6, so roughly four items take the random path, each
 *    burning two `IntRange` draws per attempt (`Room.random()`) until it finds a free cell.
 */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset } from '../../paintLevel';

export function paintShopRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY_SP);

	placeShopkeeper(level, room);
	placeItems(level, room);

	// `for (Door door : connected.values()) door.set(Door.Type.REGULAR);` - a shop's doors are
	// always plain, never hidden or barricaded.
	for (const door of room.connected.values()) {
		if (door) door.set(DoorType.REGULAR);
	}
}

/** `placeShopkeeper()`. `center()`'s per-axis `Random.Int(2)` is the whole RNG cost. */
function placeShopkeeper(level: PaintLevel, room: Room): void {
	const pos = level.pointToCell(room.center());
	level.mobs.push({ pos, kind: 'shopkeeper' });
}

/**
 * `placeItems()`. The walk starts from the entrance door, steps one cell inward, then circles the
 * inner ring counter-clockwise, dropping one item per step.
 */
function placeItems(level: PaintLevel, room: Room): void {
	const stock = room.shopStock();

	// Step inward off the door, whichever wall it sits on.
	const at = { x: room.entranceDoor().x, y: room.entranceDoor().y };
	if (at.y === room.top) at.y++;
	else if (at.y === room.bottom) at.y--;
	else if (at.x === room.left) at.x++;
	else at.x--;

	for (const item of stock) {
		// One step around the ring. The chained conditions encode "go up the left edge, right
		// along the top, down the right edge, else left along the bottom".
		if (at.x === room.left + 1 && at.y !== room.top + 1) at.y--;
		else if (at.y === room.top + 1 && at.x !== room.right - 1) at.x++;
		else if (at.x === room.right - 1 && at.y !== room.bottom - 1) at.y++;
		else at.x--;

		let cell = level.pointToCell(at);
		if (level.findHeap(cell) !== undefined) {
			// The ring has wrapped onto an occupied cell: fall back to random placement, retrying
			// until the cell is both heap-free and mob-free (the keeper's own cell counts).
			do {
				cell = level.pointToCell(room.random());
			} while (level.findHeap(cell) !== undefined || level.findMob(cell) !== undefined);
		}

		// `level.drop(item, cell).type = Heap.Type.FOR_SALE` - the FOR_SALE flag is what makes it
		// shop stock rather than loot; this port has no heap types, so the note records it.
		level.drop(item, cell, 'forSale');
	}
}
