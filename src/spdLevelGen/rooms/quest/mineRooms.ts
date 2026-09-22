/**
 * `MiningLevel`'s rooms (`levels/rooms/quest/Mine*.java`, tag `v3.3.8`): `MineEntrance`,
 * `MineGiantRoom`, `MineLargeRoom`, `MineSmallRoom` (all `CaveRoom` subclasses) and
 * `MineSecretRoom`. Each paints the shared cave shape, then a per-quest-type overlay
 * (`Blacksmith.Quest.Type()`): crystal fields and the Crystal quest's actors, or the Gnoll
 * quest's walled-off doors, boulder drifts, barricades, traps and actors.
 *
 * The actors are recorded as `PlacedMob` kinds (`crystalSpire`, `crystalGuardian`,
 * `gnollGeomancer`, `gnollSapper`, `gnollGuard`) with their room payloads; the live scene stands up
 * only the kinds it has monster rows for (see `PORT_COVERAGE.md`'s MiningLevel row). The FUNGI
 * branches are not ported: Java's own `Quest.spawn()` never rolls that type ("not fully
 * implemented"), so they are unreachable there too.
 */
import { DoorType, type Door, type Room } from '../../room';
import { PaintLevel, Terrain, fillEllipseRect, fillEllipseRoom, fillRoom, fillRoomInset, fillXY, roomPoints, set } from '../../paintLevel';
import { paintCaveRoom } from '../standard/caveRoom';
import { BLACKSMITH_QUEST, blacksmithQuestType } from '../../blacksmith';
import { SpdRandom } from '../../../spdRng';

/** The quest actors the mine rooms place (tag `v3.3.8` classes `CrystalSpire`, `CrystalGuardian`,
 *  `GnollGeomancer`, `GnollSapper`, `GnollGuard`), by the kind ids the live scene will adopt. */
export const MINE_QUEST_ACTOR_KINDS: ReadonlySet<string> = new Set(['crystalSpire', 'crystalGuardian', 'gnollGeomancer', 'gnollSapper', 'gnollGuard', 'crystalWisp']);

/** `PathFinder.NEIGHBOURS4`/`NEIGHBOURS8`/`NEIGHBOURS9`/`CIRCLE8`, in Java's own order. */
function neighbours4(w: number): number[] { return [-w, -1, 1, w]; }
function neighbours8(w: number): number[] { return [-w - 1, -w, -w + 1, -1, 1, w - 1, w, w + 1]; }
function neighbours9(w: number): number[] { return [-w - 1, -w, -w + 1, -1, 0, 1, w - 1, w, w + 1]; }
function circle8(w: number): number[] { return [-w - 1, -w, -w + 1, 1, w + 1, w, w - 1, -1]; }

/** `Level.distance()`: Chebyshev. */
function cellDistance(level: PaintLevel, a: number, b: number): number {
	const pa = level.cellToPoint(a), pb = level.cellToPoint(b);
	return Math.max(Math.abs(pa.x - pb.x), Math.abs(pa.y - pb.y));
}

/** `Point.distance(Point, Point)`: float Euclidean. */
function pointDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
	const dx = Math.fround(a.x - b.x), dy = Math.fround(a.y - b.y);
	return Math.fround(Math.sqrt(Math.fround(Math.fround(dx * dx) + Math.fround(dy * dy))));
}

/** `GameMath.gate(min, value, max)`. */
function gate(min: number, value: number, max: number): number {
	return value < min ? min : value > max ? max : value;
}

/**
 * The Gnoll quest's shared door pass: every door to a non-secret neighbour still at `REGULAR`
 * rolls `Random.Int(10) == 0 ? set(EMPTY) : set(WALL)`, then locks its type. `Door.set()` only
 * ever raises the type, so the `set(EMPTY)` branch is a no-op that leaves the door `REGULAR`
 * (the source comment calls it "9/10 empty, otherwise wall", the code is 1/10 kept, 9/10 wall);
 * this port keeps the code's behaviour, which `MiningLevelPainter.paintDoors()` then resolves.
 * Returns the doors that ended as `WALL`, in `connected.values()` order.
 */
function gnollWallDoors(room: Room): Door[] {
	for (const [n, d] of room.connected) {
		if (!d || n.kind === 'secret' || d.type !== DoorType.REGULAR) continue;
		if (SpdRandom.int(10) === 0) d.set(DoorType.EMPTY);
		else d.set(DoorType.WALL);
		d.lockTypeChanges(true);
	}
	const walls: Door[] = [];
	for (const d of room.connected.values()) if (d && d.type === DoorType.WALL) walls.push(d);
	return walls;
}

/**
 * The Gnoll quest's boulder drift: every `EMPTY` cell rolls `Random.Float(dist^2)` against its
 * nearest walled-off door, `dist` gated to `[1, maxDist]` after `offset`. At most 0.75 (or within
 * a cell of the door) becomes `MINE_BOULDER`; otherwise at most 5 within `decoDist` becomes
 * `EMPTY_DECO`. `skip` excludes the entrance clearing and the sapper/guard cells.
 */
function paintBoulderDrift(level: PaintLevel, room: Room, doors: Door[], offset: number, maxDist: number, decoDist: number, skip: (cell: number) => boolean): void {
	for (const p of roomPoints(room)) {
		const cell = level.pointToCell(p);
		if (skip(cell) || level.map[cell] !== Terrain.EMPTY) continue;
		let dist = 1000;
		for (const d of doors) dist = Math.min(dist, pointDistance(p, d));
		dist = gate(1, Math.fround(dist - offset), maxDist);
		const val = SpdRandom.floatMax(Math.fround(dist * dist));
		if (val <= 0.75 || dist <= 1) set(level, p.x, p.y, Terrain.MINE_BOULDER);
		else if (val <= 5 && dist <= decoDist) set(level, p.x, p.y, Terrain.EMPTY_DECO);
	}
}

/** `for (i < width*height/n) { r = random(1); if (map[r] != WALL) set(r, MINE_CRYSTAL) }`. */
function scatterCrystals(level: PaintLevel, room: Room, divisor: number, keep?: (cell: number) => boolean): void {
	const count = Math.trunc(room.width() * room.height() / divisor);
	for (let i = 0; i < count; i++) {
		const r = room.random(1);
		const cell = level.pointToCell(r);
		if ((keep === undefined || keep(cell)) && level.map[cell] !== Terrain.WALL) set(level, r.x, r.y, Terrain.MINE_CRYSTAL);
	}
}

/** `MineEntrance.paint()`. */
export function paintMineEntrance(level: PaintLevel, room: Room): void {
	paintCaveRoom(level, room);
	const w = level.w;
	let entrance: number;
	let valid: boolean;
	do {
		valid = false;
		entrance = level.pointToCell(room.random(3));
		for (const i of neighbours9(w)) if (level.map[entrance + i] !== Terrain.WALL) valid = true;
		if (room.height() === 7 && room.width() === 7) valid = true;
	} while (level.findMob(entrance) !== undefined || !valid);
	level.map[entrance] = Terrain.ENTRANCE;
	for (const i of neighbours8(w)) level.map[entrance + i] = Terrain.EMPTY;

	const type = blacksmithQuestType();
	if (type === BLACKSMITH_QUEST.CRYSTAL) {
		scatterCrystals(level, room, 2, (cell) => cellDistance(level, cell, entrance) > 1);
	} else if (type === BLACKSMITH_QUEST.GNOLL) {
		const doors = gnollWallDoors(room);
		paintBoulderDrift(level, room, doors, 0.5, 5, 3, (cell) => cellDistance(level, cell, entrance) <= 1);
	}
}

/** `MineGiantRoom.paint()` - the quest boss's room. */
export function paintMineGiantRoom(level: PaintLevel, room: Room): void {
	paintCaveRoom(level, room, Math.fround(0.70));
	const type = blacksmithQuestType();
	if (type === BLACKSMITH_QUEST.CRYSTAL) {
		fillEllipseRoom(level, room, 3, Terrain.EMPTY);
		scatterCrystals(level, room, 2);
		const p = room.center();
		level.mobs.push({ pos: level.pointToCell(p), kind: 'crystalSpire' });
		set(level, p.x, p.y, Terrain.EMPTY);
	} else if (type === BLACKSMITH_QUEST.GNOLL) {
		fillEllipseRoom(level, room, 3, Terrain.EMPTY);
		const doors = gnollWallDoors(room);
		paintBoulderDrift(level, room, doors, 0.5, Math.fround(3.1), 3, () => false);
		const center = room.center();
		//`new Rect(center.x-2, center.y-2, center.x+3, center.y+3)`: a plain Rect, exclusive edges.
		fillEllipseRect(level, center.x - 2, center.y - 2, center.x + 3, center.y + 3, 0, Terrain.MINE_BOULDER);
		//`Painter.fill(level, centerArea, 2, EMPTY_DECO)`: width 5 minus 2*2 is the centre cell alone.
		fillXY(level, center.x, center.y, 1, 1, Terrain.EMPTY_DECO);
		level.mobs.push({ pos: level.pointToCell(center), kind: 'gnollGeomancer', shield: 50 });
	} else {
		fillEllipseRoom(level, room, 3, Terrain.EMPTY);
	}
}

/** `MineLargeRoom.findInternalCells()`: recursive NEIGHBOURS4 flood, Java's insertion order. */
function findInternalCells(level: PaintLevel, cell: number, internal: number[], seen: Set<number>): void {
	for (const i of neighbours4(level.w)) {
		const next = cell + i;
		if (!seen.has(next) && level.map[next] !== Terrain.MINE_CRYSTAL) {
			seen.add(next);
			internal.push(next);
			findInternalCells(level, next, internal, seen);
		}
	}
}

/** `MineLargeRoom.paint()` - a guardian in a crystal ring, or a sapper camp. */
export function paintMineLargeRoom(level: PaintLevel, room: Room): void {
	paintCaveRoom(level, room, Math.fround(0.55));
	const type = blacksmithQuestType();
	const w = level.w;
	if (type === BLACKSMITH_QUEST.CRYSTAL) {
		fillEllipseRoom(level, room, 3, Terrain.MINE_CRYSTAL);
		fillEllipseRoom(level, room, 4, Terrain.EMPTY);
		const p = room.random(5);
		const internal: number[] = [];
		const seen = new Set<number>();
		findInternalCells(level, level.pointToCell(p), internal, seen);
		//"ensure that every internal cell has no way out, even diagonally" - the map is written
		//while iterating, so later cells see earlier closures, exactly as Java's loop does.
		for (const i of internal) {
			for (const j of circle8(w)) {
				if (!seen.has(i + j) && level.map[i + j] !== Terrain.MINE_CRYSTAL) {
					level.map[i] = Terrain.MINE_CRYSTAL;
					break;
				}
			}
		}
		scatterCrystals(level, room, 4);
		level.mobs.push({ pos: level.pointToCell(p), kind: 'crystalGuardian' });
		set(level, p.x, p.y, Terrain.EMPTY);
	} else if (type === BLACKSMITH_QUEST.GNOLL) {
		fillEllipseRoom(level, room, 3, Terrain.EMPTY);
		const doors = gnollWallDoors(room);
		const n8 = neighbours8(w);
		const sapperPos = level.pointToCell(room.random(5));
		let guardPos: number;
		do {
			guardPos = sapperPos + n8[SpdRandom.int(8)]!;
		} while (level.map[guardPos] !== Terrain.EMPTY);
		level.mobs.push({ pos: sapperPos, kind: 'gnollSapper', spawnPos: sapperPos, partnerPos: guardPos });
		level.mobs.push({ pos: guardPos, kind: 'gnollGuard', partnerPos: sapperPos });
		const barricades = SpdRandom.int(2) === 0 ? 2 : 1;
		for (let i = 0; i < barricades; i++) {
			const barricadePos = sapperPos + n8[SpdRandom.int(8)]!;
			if (level.map[barricadePos] === Terrain.EMPTY && barricadePos !== guardPos) level.map[barricadePos] = Terrain.BARRICADE;
			else i--;
		}
		const traps = room.square() > 150 ? 3 : 2;
		for (let i = 0; i < traps; i++) {
			let r: { x: number; y: number };
			let cell: number;
			do {
				r = room.random(2);
				cell = level.pointToCell(r);
			} while (level.map[cell] !== Terrain.EMPTY || cell === sapperPos || cell === guardPos);
			level.map[cell] = Terrain.TRAP;
			level.setTrap('gnollRockfall', false, true, cell);
		}
		paintBoulderDrift(level, room, doors, 0.5, 4, 3, (cell) => cell === sapperPos || cell === guardPos);
	} else {
		fillEllipseRoom(level, room, 3, Terrain.EMPTY);
	}
}

/** `MineSmallRoom.paint()`. */
export function paintMineSmallRoom(level: PaintLevel, room: Room): void {
	paintCaveRoom(level, room, Math.fround(0.40));
	const type = blacksmithQuestType();
	if (type === BLACKSMITH_QUEST.CRYSTAL) {
		scatterCrystals(level, room, 3);
	} else if (type === BLACKSMITH_QUEST.GNOLL) {
		const doors = gnollWallDoors(room);
		//`GameMath.gate(1f, dist, 5f)` here - the small room alone skips the `-0.5f`.
		paintBoulderDrift(level, room, doors, 0, 5, 2, () => false);
	}
}

/**
 * `MineSecretRoom.paint()`. **Divergence (deliberate):** Java's gold loop rolls a cell until it is
 * not already `WALL_DECO`, then paints a *second*, fresh `random(1)` point instead of the checked
 * one - so a vein can land on an existing vein and the room comes up short of its 4-5. This port
 * paints the checked cell (one draw per vein instead of two), which is what the loop is for.
 */
export function paintMineSecretRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	room.entranceDoor().set(DoorType.HIDDEN);
	const type = blacksmithQuestType();
	if (type === BLACKSMITH_QUEST.CRYSTAL) {
		fillRoomInset(level, room, 1, Terrain.MINE_CRYSTAL);
	} else if (type === BLACKSMITH_QUEST.GNOLL) {
		fillRoomInset(level, room, 1, Terrain.EMPTY_SP);
		const quantity = SpdRandom.normalIntRange(4, 5);
		level.drop('darkGold', level.pointToCell(room.center()), `chest,qty:${quantity}`)!.quantity = quantity;
		return;
	} else {
		fillRoomInset(level, room, 1, Terrain.EMPTY);
	}
	const goldAmount = SpdRandom.normalIntRange(4, 5);
	for (let i = 0; i < goldAmount; i++) {
		let cell: number;
		do {
			cell = level.pointToCell(room.random(1));
		} while (level.map[cell] === Terrain.WALL_DECO);
		level.map[cell] = Terrain.WALL_DECO;
	}
}
