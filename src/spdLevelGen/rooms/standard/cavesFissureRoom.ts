/**
 * Port of `levels/rooms/standard/CavesFissureRoom.java`. The one pathability check in `paint()`
 * (`PathFinder.buildDistanceMap` after `PathFinder.setMapSize(width()-2, height()-2)`) is scoped
 * to this room's own interior alone, never the full level - so it's reimplemented here as a local
 * 8-directional BFS (`PathFinder.java`'s `dirLR` is the 8-neighbour set) rather than routed through
 * a level-wide pathfinder. The check itself makes no `Random.*` calls in Java, so its result only
 * needs to match, not its RNG-consuming call order (same reasoning `regularPainter.ts`'s
 * `mergeRooms` doc comment gives for its own geometry-only helpers).
 */
import { Room, Door, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, fillXY, setCell, drawInside } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';

const A = 180 / Math.PI;

function angleBetweenPoints(from: { x: number; y: number }, to: { x: number; y: number }): number {
	const m = (to.y - from.y) / (to.x - from.x);
	let angle = A * (Math.atan(m) + Math.PI / 2);
	if (from.x > to.x) angle -= 180;
	return angle;
}

function xyToRoomCoords(room: Room, x: number, y: number): number {
	return (x - room.left - 1) + (y - room.top - 1) * (room.width() - 2);
}

function buildBridge(level: PaintLevel, room: Room, fissureAngle: number, center: { x: number; y: number }, centerMargin: number): void {
	const dX = Math.cos(fissureAngle / A - Math.PI / 2);
	const dY = Math.sin(fissureAngle / A - Math.PI / 2);
	const edgeMargin = 2;

	if (Math.abs(dY) >= Math.abs(dX)) {
		const Y = dY > 0
			? SpdRandom.intRange(center.y + centerMargin, room.bottom - edgeMargin)
			: SpdRandom.intRange(room.top + edgeMargin, center.y - centerMargin);
		let foundChasm = false;
		if (dX <= 0) {
			for (let X = room.left + 1; X <= room.right - 1; X++) {
				const cell = X + Y * level.w;
				if (level.map[cell] === Terrain.CHASM) { foundChasm = true; setCell(level, cell, Terrain.EMPTY_SP); }
				else if (foundChasm) break;
			}
		} else {
			for (let X = room.right - 1; X >= room.left + 1; X--) {
				const cell = X + Y * level.w;
				if (level.map[cell] === Terrain.CHASM) { foundChasm = true; setCell(level, cell, Terrain.EMPTY_SP); }
				else if (foundChasm) break;
			}
		}
	} else {
		const X = dX > 0
			? SpdRandom.intRange(center.x + centerMargin, room.right - edgeMargin)
			: SpdRandom.intRange(room.left + edgeMargin, center.x - centerMargin);
		let foundChasm = false;
		if (dY <= 0) {
			for (let Y = room.top + 1; Y <= room.bottom - 1; Y++) {
				const cell = X + Y * level.w;
				if (level.map[cell] === Terrain.CHASM) { foundChasm = true; setCell(level, cell, Terrain.EMPTY_SP); }
				else if (foundChasm) break;
			}
		} else {
			for (let Y = room.bottom - 1; Y >= room.top + 1; Y--) {
				const cell = X + Y * level.w;
				if (level.map[cell] === Terrain.CHASM) { foundChasm = true; setCell(level, cell, Terrain.EMPTY_SP); }
				else if (foundChasm) break;
			}
		}
	}
}

/** Local stand-in for `PathFinder.buildDistanceMap(doorPoint, passable)` at this room's own
 *  `setMapSize(width()-2, height()-2)` - an 8-directional BFS from `fromIdx`, true iff every
 *  passable interior cell is reachable from it. */
function allInteriorReachable(passable: boolean[], pw: number, ph: number, fromIdx: number): boolean {
	const seen = new Array<boolean>(passable.length).fill(false);
	if (fromIdx < 0 || fromIdx >= passable.length || !passable[fromIdx]) {
		return passable.every(p => !p);
	}
	const queue = [fromIdx];
	seen[fromIdx] = true;
	let head = 0;
	while (head < queue.length) {
		const i = queue[head++];
		const x = i % pw, y = Math.floor(i / pw);
		for (let dy = -1; dy <= 1; dy++) {
			for (let dx = -1; dx <= 1; dx++) {
				if (dx === 0 && dy === 0) continue;
				const nx = x + dx, ny = y + dy;
				if (nx < 0 || ny < 0 || nx >= pw || ny >= ph) continue;
				const ni = nx + ny * pw;
				if (seen[ni] || !passable[ni]) continue;
				seen[ni] = true;
				queue.push(ni);
			}
		}
	}
	for (let i = 0; i < passable.length; i++) {
		if (passable[i] && !seen[i]) return false;
	}
	return true;
}

export function paintCavesFissureRoom(level: PaintLevel, room: Room): void {
	let pathable = true;
	do {
		fillRoom(level, room, Terrain.WALL);
		fillRoomInset(level, room, 1, Terrain.EMPTY);
		for (const door of room.connected.values()) door?.set(DoorType.REGULAR);

		// `PointF center = new PointF(center()); center.x += 0.5f; center.y += 0.5f;` - `center()`
		// itself re-rolls on every retry (it can burn `Random.Int(2)` on an odd axis), matching
		// Java's placement of the call inside this same do-while.
		const center = room.center();
		const centerF = { x: center.x + 0.5, y: center.y + 0.5 };

		const doors = [...room.connected.values()].filter((d): d is Door => !!d);
		const doorAngles = doors.map((d) => {
			let a = angleBetweenPoints(centerF, { x: d.x + 0.5, y: d.y + 0.5 });
			if (a < 0) a += 360;
			return a;
		});

		const sizeName = room.sizeCat!.name;
		const lineAngles: number[] = [];
		const numLines = 1 + room.sizeCat!.roomValue;
		for (let i = 0; i < numLines; i++) {
			let tries = 100;
			let valid: boolean;
			do {
				valid = true;
				const lineAngle = SpdRandom.floatRange(0, 360);
				for (const doorAngle of doorAngles) {
					let angleDiff = Math.abs(lineAngle - doorAngle);
					if (angleDiff > 180) angleDiff = 360 - angleDiff;
					if (angleDiff <= (sizeName === 'NORMAL' ? 30 : 15)) { valid = false; break; }
				}
				if (valid) {
					for (const existing of lineAngles) {
						let angleDiff = Math.abs(lineAngle - existing);
						if (angleDiff > 180) angleDiff = 360 - angleDiff;
						if (angleDiff <= (numLines === 2 ? 120 : 60)) { valid = false; break; }
					}
				}
				if (valid) lineAngles.push(lineAngle);
				tries--;
			} while (!valid && tries > 0);
		}

		// "just become an empty room if we can't make at least 2 lines"
		if (lineAngles.length < 2) return;

		for (const lineAngle of lineAngles) {
			let dX = Math.cos(lineAngle / A - Math.PI / 2);
			let dY = Math.sin(lineAngle / A - Math.PI / 2);
			let horizontal: boolean;
			if (Math.abs(dX) >= Math.abs(dY)) {
				horizontal = true;
				dY /= Math.abs(dX); dX /= Math.abs(dX);
			} else {
				horizontal = false;
				dX /= Math.abs(dY); dY /= Math.abs(dY);
			}

			const curr = { x: centerF.x, y: centerF.y };
			let cell = Math.trunc(curr.x) + Math.trunc(curr.y) * level.w;
			setCell(level, cell, Terrain.CHASM);
			do {
				if (!horizontal) {
					if (level.map[cell - 1] === Terrain.EMPTY && (curr.x % 1 <= 0.5 || sizeName === 'GIANT')) {
						setCell(level, cell - 1, Terrain.CHASM);
					}
					if (level.map[cell] === Terrain.EMPTY) setCell(level, cell, Terrain.CHASM);
					if (level.map[cell + 1] === Terrain.EMPTY && (curr.x % 1 > 0.5 || sizeName === 'GIANT')) {
						setCell(level, cell + 1, Terrain.CHASM);
					}
				} else {
					if (level.map[cell - level.w] === Terrain.EMPTY && (curr.y % 1 <= 0.5 || sizeName === 'GIANT')) {
						setCell(level, cell - level.w, Terrain.CHASM);
					}
					if (level.map[cell] === Terrain.EMPTY) setCell(level, cell, Terrain.CHASM);
					if (level.map[cell + level.w] === Terrain.EMPTY && (curr.y % 1 > 0.5 || sizeName === 'GIANT')) {
						setCell(level, cell + level.w, Terrain.CHASM);
					}
				}
				curr.x += dX; curr.y += dY;
				cell = Math.trunc(curr.x) + Math.trunc(curr.y) * level.w;
			} while (level.map[cell] === Terrain.EMPTY || level.map[cell] === Terrain.CHASM);
		}

		if (lineAngles.length >= 3) {
			if (sizeName === 'GIANT') {
				fillXY(level, center.x - 2, center.y - 2, 5, 5, Terrain.CHASM);
			} else {
				fillXY(level, center.x - 1, center.y - 1, 3, 3, Terrain.CHASM);
			}
		}

		if (lineAngles.length === 2) {
			buildBridge(level, room, SpdRandom.element(lineAngles), center, 1);
		} else {
			for (const angle of lineAngles) buildBridge(level, room, angle, center, room.sizeCat!.roomValue);
		}

		let doorPoint = 0;
		for (const door of doors) {
			drawInside(level, room, door, 1, Terrain.EMPTY);
			if (door.x === room.left) doorPoint = xyToRoomCoords(room, door.x + 1, door.y);
			else if (door.x === room.right) doorPoint = xyToRoomCoords(room, door.x - 1, door.y);
			else if (door.y === room.top) doorPoint = xyToRoomCoords(room, door.x, door.y + 1);
			else if (door.y === room.bottom) doorPoint = xyToRoomCoords(room, door.x, door.y - 1);
		}

		// "ensures that there is always a path to any non-chasm tile"
		const pw = room.width() - 2, ph = room.height() - 2;
		const passable: boolean[] = new Array(pw * ph);
		for (let y = room.top + 1; y < room.bottom; y++) {
			for (let x = room.left + 1; x < room.right; x++) {
				passable[xyToRoomCoords(room, x, y)] = level.map[x + y * level.w] !== Terrain.CHASM;
			}
		}
		pathable = allInteriorReachable(passable, pw, ph, doorPoint);
	} while (!pathable);
}
