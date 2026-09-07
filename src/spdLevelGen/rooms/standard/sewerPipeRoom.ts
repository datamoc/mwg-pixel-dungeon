/** Port of `levels/rooms/standard/SewerPipeRoom.java`. Java's own header calls this class "a
 *  total mess, lots of copy-pasta" - ported as-is, no RNG of its own (pure geometry). */
import { SpdRandom } from '../../../spdRng';
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, drawLine, set, neighbours8 } from '../../paintLevel';

interface Pt { x: number; y: number; }

function getConnectionSpace(room: Room): { left: number; top: number; right: number; bottom: number } {
	const c = room.connected.size <= 1 ? room.center() : getDoorCenter(room);
	return { left: c.x, top: c.y, right: c.x, bottom: c.y };
}

function getDoorCenter(room: Room): Pt {
	let sx = 0, sy = 0;
	for (const door of room.connected.values()) { if (door) { sx += door.x; sy += door.y; } }
	const n = room.connected.size;
	let x = Math.trunc(sx / n), y = Math.trunc(sy / n);
	// `if (Random.Float() < doorCenter.x % 1) c.x++;` (and the same for y). Both draws ALWAYS
	// happen. As in TunnelRoom.getDoorCenter() (see rooms/connection/paint.ts), `doorCenter` sums
	// raw integer door coords, so `% 1` is always exactly 0 and the increment can never fire -
	// but the two draws are real and must be consumed. An earlier revision skipped them, which
	// desynced every subsequent draw on any floor containing a SewerPipeRoom with >=2 connections
	// (the `<= 1` case uses center() and is unaffected). Found via the Phase 2 RNG trace diff.
	if (SpdRandom.float() < sx % 1) x++;
	if (SpdRandom.float() < sy % 1) y++;
	x = Math.max(room.left + 2, Math.min(x, room.right - 2));
	y = Math.max(room.top + 2, Math.min(y, room.bottom - 2));
	return { x, y };
}

function spaceBetween(a: number, b: number): number { return Math.abs(a - b) - 1; }

function distanceBetweenPoints(room: Room, a: Pt, b: Pt): number {
	if (((a.x === room.left + 2 || a.x === room.right - 2) && a.y === b.y) ||
		((a.y === room.top + 2 || a.y === room.bottom - 2) && a.x === b.x)) {
		return Math.max(spaceBetween(a.x, b.x), spaceBetween(a.y, b.y));
	}
	return Math.min(spaceBetween(room.left, a.x) + spaceBetween(room.left, b.x),
		spaceBetween(room.right, a.x) + spaceBetween(room.right, b.x))
		+ Math.min(spaceBetween(room.top, a.y) + spaceBetween(room.top, b.y),
			spaceBetween(room.bottom, a.y) + spaceBetween(room.bottom, b.y))
		- 1;
}

function fillBetweenPoints(level: PaintLevel, room: Room, from: Pt, to: Pt, floor: number): void {
	if (((from.x === room.left + 2 || from.x === room.right - 2) && from.x === to.x) ||
		((from.y === room.top + 2 || from.y === room.bottom - 2) && from.y === to.y)) {
		const x = Math.min(from.x, to.x), y = Math.min(from.y, to.y);
		const w = spaceBetween(from.x, to.x) + 2, h = spaceBetween(from.y, to.y) + 2;
		for (let row = y; row < y + h; row++) for (let col = x; col < x + w; col++) set(level, col, row, floor);
		return;
	}

	const corners: Pt[] = [
		{ x: room.left + 2, y: room.top + 2 }, { x: room.right - 2, y: room.top + 2 },
		{ x: room.right - 2, y: room.bottom - 2 }, { x: room.left + 2, y: room.bottom - 2 },
	];
	for (const c of corners) {
		if ((c.x === from.x || c.y === from.y) && (c.x === to.x || c.y === to.y)) {
			drawLine(level, from, c, floor);
			drawLine(level, c, to, floor);
			return;
		}
	}

	let side: Pt;
	if (from.y === room.top + 2 || from.y === room.bottom - 2) {
		side = (spaceBetween(room.left, from.x) + spaceBetween(room.left, to.x) <=
			spaceBetween(room.right, from.x) + spaceBetween(room.right, to.x))
			? { x: room.left + 2, y: room.top + Math.floor(room.height() / 2) }
			: { x: room.right - 2, y: room.top + Math.floor(room.height() / 2) };
	} else {
		side = (spaceBetween(room.top, from.y) + spaceBetween(room.top, to.y) <=
			spaceBetween(room.bottom, from.y) + spaceBetween(room.bottom, to.y))
			? { x: room.left + Math.floor(room.width() / 2), y: room.top + 2 }
			: { x: room.left + Math.floor(room.width() / 2), y: room.bottom - 2 };
	}
	fillBetweenPoints(level, room, from, side, floor);
	fillBetweenPoints(level, room, side, to, floor);
}

export function paintSewerPipeRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	const c = getConnectionSpace(room);

	if (room.connected.size <= 2) {
		for (const door of room.connected.values()) {
			if (!door) continue;
			const start: Pt = { x: door.x, y: door.y };
			if (start.x === room.left) start.x += 2;
			else if (start.y === room.top) start.y += 2;
			else if (start.x === room.right) start.x -= 2;
			else if (start.y === room.bottom) start.y -= 2;

			const rightShift = start.x < c.left ? c.left - start.x : start.x > c.right ? c.right - start.x : 0;
			const downShift = start.y < c.top ? c.top - start.y : start.y > c.bottom ? c.bottom - start.y : 0;

			let mid: Pt, end: Pt;
			if (door.x === room.left || door.x === room.right) {
				mid = { x: start.x + rightShift, y: start.y };
				end = { x: mid.x, y: mid.y + downShift };
			} else {
				mid = { x: start.x, y: start.y + downShift };
				end = { x: mid.x + rightShift, y: mid.y };
			}
			drawLine(level, start, mid, Terrain.WATER);
			drawLine(level, mid, end, Terrain.WATER);
		}
	} else {
		const pointsToFill: Pt[] = [];
		for (const door of room.connected.values()) {
			if (!door) continue;
			const p: Pt = { x: door.x, y: door.y };
			if (p.y === room.top) p.y += 2;
			else if (p.y === room.bottom) p.y -= 2;
			else if (p.x === room.left) p.x += 2;
			else p.x -= 2;
			pointsToFill.push(p);
		}

		const pointsFilled: Pt[] = [pointsToFill.shift()!];
		while (pointsToFill.length > 0) {
			let from!: Pt, to!: Pt, shortest = Number.MAX_SAFE_INTEGER;
			for (const f of pointsFilled) {
				for (const t of pointsToFill) {
					const dist = distanceBetweenPoints(room, f, t);
					if (dist < shortest) { from = f; to = t; shortest = dist; }
				}
			}
			fillBetweenPoints(level, room, from, to, Terrain.WATER);
			pointsFilled.push(to);
			pointsToFill.splice(pointsToFill.indexOf(to), 1);
		}
	}

	const n8 = neighbours8(level);
	for (let y = room.top; y <= room.bottom; y++) {
		for (let x = room.left; x <= room.right; x++) {
			const cell = x + y * level.w;
			if (level.map[cell] === Terrain.WATER) {
				for (const off of n8) {
					if (level.map[cell + off] === Terrain.WALL) level.map[cell + off] = Terrain.EMPTY;
				}
			}
		}
	}

	for (const [r, door] of room.connected as Map<Room, { x: number; y: number; set(t: DoorType): void } | null>) {
		if (!door) continue;
		if (r.standardKind === 'sewerPipe') {
			for (let row = door.y - 1; row < door.y + 2; row++) {
				for (let col = door.x - 1; col < door.x + 2; col++) set(level, col, row, Terrain.EMPTY);
			}
			if (door.x === room.left || door.x === room.right) {
				for (let col = door.x - 1; col < door.x + 2; col++) set(level, col, door.y, Terrain.WATER);
			} else {
				for (let row = door.y - 1; row < door.y + 2; row++) set(level, door.x, row, Terrain.WATER);
			}
			door.set(DoorType.WATER);
		} else {
			door.set(DoorType.REGULAR);
		}
	}
}
