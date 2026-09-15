/** Port of `levels/rooms/special/CrystalPathRoom.java`'s `paint()` (rewritten 2026-09-15 - the
 *  previous version here didn't match the real method in either `v3.3.8` or `4.0.0-beta`, which
 *  are identical: it invented a "walls meeting at a re-rolled `center()`, walked clockwise" design
 *  that doesn't exist in Java and, worse, could hang forever - see room.ts's `canConnect(Point)`
 *  comment and this project's git history for the live repro. The real algorithm builds six
 *  `EmptyRoom`s in a fixed sequence branching off whichever wall the entrance sits on (four
 *  sub-cases: left/right for an x-axis entrance, top/bottom for a y-axis one), each pair linked
 *  by a `CRYSTAL_DOOR`, with two of the six ("rooms 4/5") holding the run's two best prizes on
 *  pedestals. The six `new EmptyRoom()` constructions are burned up front, matching Java's own
 *  array-literal-then-fill order (each is a real `Random.chances(sizeCatProbs())` draw via this
 *  port's existing `StandardRoom`-construction convention - the previous version only burned 4).
 *
 *  **Documented simplification**: Java's loot picks go through `addRewardItem()` (a
 *  duplicate-avoiding retry loop over `Generator.random(cat)`) plus an entire exotic-potion/
 *  exotic-scroll substitution system (`ExoticCrystals.consumableExoticChance()`) and a
 *  value-based sort (`Generator.Category.POTION.defaultProbsTotal`) that decides which of the
 *  3 potions/3 scrolls collected go to the nearer-vs-prize rooms. This port has no exotic-item
 *  system and no per-class drop-weight table, so each of the 3 potion/3 scroll slots is a single
 *  `randomCategory()` draw (this file's established "burn the leading roll, skip the
 *  Generator-internal retry/exotic-substitution remainder" convention, same as the rest of this
 *  room and its neighbours) with no value ordering - the real `Random.Int(2)` shuffle that
 *  decides WHICH physical rooms get which slot is still made and honoured. The entrance is real
 *  Java's `Door.Type.REGULAR` (previously wrongly locked with an iron key here - a second bug
 *  this rewrite fixes; the room's own internal `CRYSTAL_DOOR`s are what actually gate it, via
 *  the 3 `CrystalKey`s already seeded as items to spawn). */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, fillXY, drawInside, set } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';
import { Cat, randomCategory } from '../../../items/generator';

interface Rect { left: number; top: number; right: number; bottom: number; }
/** `Rect.setPos(x,y).resize(w,h)`: `resize` sets `right=left+w`, `bottom=top+h` off whatever
 * `setPos` just placed at `(x,y)` - see `com.watabou.utils.Rect`. */
function place(x: number, y: number, w: number, h: number): Rect {
	return { left: x, top: y, right: x + w, bottom: y + h };
}
/** `Room.center()` applied to a plain `EmptyRoom` rect (see room.ts's own `center()` - same
 * `Random.Int(2)` odd-`(right-left)`/`(bottom-top)` offset formula). */
function rectCenter(r: Rect): { x: number; y: number } {
	const oddW = (r.right - r.left) % 2 === 1, oddH = (r.bottom - r.top) % 2 === 1;
	return {
		x: Math.floor((r.left + r.right) / 2) + (oddW ? SpdRandom.int(2) : 0),
		y: Math.floor((r.top + r.bottom) / 2) + (oddH ? SpdRandom.int(2) : 0),
	};
}

/**
 * `new EmptyRoom()` - the construction is what burns the `setSizeCat()` draw, so it must happen
 * even though only the rect is used afterwards (see this file's header comment).
 */
function newEmptyRoomRect(): void {
	new Room('standard', 'empty');
}

export function paintCrystalPathRoom(level: PaintLevel, room: Room, depth: number): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY_SP);

	const entrance = room.entranceDoor();
	const entry = { x: entrance.x, y: entrance.y };

	// Six `new EmptyRoom()` constructions, burned up front in Java's own array order.
	for (let i = 0; i < 6; i++) newEmptyRoomRect();

	const rooms: Rect[] = [];
	const doors: { x: number; y: number }[] = [];
	let prize1: { x: number; y: number };
	let prize2: { x: number; y: number };

	if (entry.x === room.left || entry.x === room.right) {
		drawInside(level, room, entry, room.width() > 8 ? 5 : 3, Terrain.EMPTY);

		const roomW1 = room.width() >= 9 ? 2 : 1;
		const roomW2 = room.width() % 2 === 0 ? 2 : 1;
		const roomH = room.height() >= 9 ? 2 : 1;

		if (entry.x === room.left) {
			rooms.push(place(room.left + 1, entry.y - roomH - 1, roomW1 - 1, roomH - 1));
			doors.push({ x: rooms[0].left, y: rooms[0].bottom + 1 });
			rooms.push(place(room.left + 1, entry.y + 2, roomW1 - 1, roomH - 1));
			doors.push({ x: rooms[1].left, y: rooms[1].top - 1 });

			rooms.push(place(rooms[1].right + 2, entry.y - roomH - 1, roomW1 - 1, roomH - 1));
			doors.push({ x: rooms[2].left, y: rooms[2].bottom + 1 });
			rooms.push(place(rooms[1].right + 2, entry.y + 2, roomW1 - 1, roomH - 1));
			doors.push({ x: rooms[3].left, y: rooms[3].top - 1 });

			rooms.push(place(rooms[3].right + 2, entry.y - roomH - 1, roomW2 - 1, roomH));
			doors.push({ x: rooms[4].left - 1, y: rooms[4].bottom - 1 });
			rooms.push(place(rooms[3].right + 2, entry.y + 1, roomW2 - 1, roomH));
			doors.push({ x: rooms[5].left - 1, y: rooms[5].top + 1 });

			prize1 = { x: rooms[4].left, y: rooms[4].bottom };
			prize2 = { x: rooms[5].left, y: rooms[5].top };
		} else {
			rooms.push(place(room.right - roomW1, entry.y - roomH - 1, roomW1 - 1, roomH - 1));
			doors.push({ x: rooms[0].right, y: rooms[0].bottom + 1 });
			rooms.push(place(room.right - roomW1, entry.y + 2, roomW1 - 1, roomH - 1));
			doors.push({ x: rooms[1].right, y: rooms[1].top - 1 });

			rooms.push(place(rooms[1].left - roomW1 - 1, entry.y - roomH - 1, roomW1 - 1, roomH - 1));
			doors.push({ x: rooms[2].right, y: rooms[2].bottom + 1 });
			rooms.push(place(rooms[1].left - roomW1 - 1, entry.y + 2, roomW1 - 1, roomH - 1));
			doors.push({ x: rooms[3].right, y: rooms[3].top - 1 });

			rooms.push(place(rooms[3].left - roomW2 - 1, entry.y - roomH - 1, roomW2 - 1, roomH));
			doors.push({ x: rooms[4].right + 1, y: rooms[4].bottom - 1 });
			rooms.push(place(rooms[3].left - roomW2 - 1, entry.y + 1, roomW2 - 1, roomH));
			doors.push({ x: rooms[5].right + 1, y: rooms[5].top + 1 });

			prize1 = { x: rooms[4].right, y: rooms[4].bottom };
			prize2 = { x: rooms[5].right, y: rooms[5].top };
		}
	} else {
		drawInside(level, room, entry, room.height() > 8 ? 5 : 3, Terrain.EMPTY);

		const roomW = room.width() >= 9 ? 2 : 1;
		const roomH1 = room.height() >= 9 ? 2 : 1;
		const roomH2 = room.height() % 2 === 0 ? 2 : 1;

		if (entry.y === room.top) {
			rooms.push(place(entry.x - roomW - 1, room.top + 1, roomW - 1, roomH1 - 1));
			doors.push({ x: rooms[0].right + 1, y: rooms[0].top });
			rooms.push(place(entry.x + 2, room.top + 1, roomW - 1, roomH1 - 1));
			doors.push({ x: rooms[1].left - 1, y: rooms[1].top });

			rooms.push(place(entry.x - roomW - 1, rooms[1].bottom + 2, roomW - 1, roomH1 - 1));
			doors.push({ x: rooms[2].right + 1, y: rooms[2].top });
			rooms.push(place(entry.x + 2, rooms[1].bottom + 2, roomW - 1, roomH1 - 1));
			doors.push({ x: rooms[3].left - 1, y: rooms[3].top });

			rooms.push(place(entry.x - roomW - 1, rooms[3].bottom + 2, roomW, roomH2 - 1));
			doors.push({ x: rooms[4].right - 1, y: rooms[4].top - 1 });
			rooms.push(place(entry.x + 1, rooms[3].bottom + 2, roomW, roomH2 - 1));
			doors.push({ x: rooms[5].left + 1, y: rooms[5].top - 1 });

			prize1 = { x: rooms[4].right, y: rooms[4].top };
			prize2 = { x: rooms[5].left, y: rooms[5].top };
		} else {
			rooms.push(place(entry.x - roomW - 1, room.bottom - roomH1, roomW - 1, roomH1 - 1));
			doors.push({ x: rooms[0].right + 1, y: rooms[0].bottom });
			rooms.push(place(entry.x + 2, room.bottom - roomH1, roomW - 1, roomH1 - 1));
			doors.push({ x: rooms[1].left - 1, y: rooms[1].bottom });

			rooms.push(place(entry.x - roomW - 1, rooms[1].top - roomH1 - 1, roomW - 1, roomH1 - 1));
			doors.push({ x: rooms[2].right + 1, y: rooms[2].bottom });
			rooms.push(place(entry.x + 2, rooms[1].top - roomH1 - 1, roomW - 1, roomH1 - 1));
			doors.push({ x: rooms[3].left - 1, y: rooms[3].bottom });

			rooms.push(place(entry.x - roomW - 1, rooms[3].top - roomH2 - 1, roomW, roomH2 - 1));
			doors.push({ x: rooms[4].right - 1, y: rooms[4].bottom + 1 });
			rooms.push(place(entry.x + 1, rooms[3].top - roomH2 - 1, roomW, roomH2 - 1));
			doors.push({ x: rooms[5].left + 1, y: rooms[5].bottom + 1 });

			prize1 = { x: rooms[4].right, y: rooms[4].bottom };
			prize2 = { x: rooms[5].left, y: rooms[5].bottom };
		}
	}

	// `Room.width()`/`height()` are `right-left+1`/`bottom-top+1` (see room.ts); these plain
	// `Rect`s have no such methods, so fill them directly with the same formula.
	for (const r of rooms) fillXY(level, r.left, r.top, r.right - r.left + 1, r.bottom - r.top + 1, Terrain.EMPTY_SP);
	for (const d of doors) set(level, d.x, d.y, Terrain.CRYSTAL_DOOR);
	set(level, prize1.x, prize1.y, Terrain.PEDESTAL);
	set(level, prize2.x, prize2.y, Terrain.PEDESTAL);

	// Real `Random.Int(2)` branch pick; Java's own exotic-chance `Random.Float()` roll on the
	// direct (non-`addRewardItem`) slot is skipped along with the exotic system it feeds (see
	// header comment) - the three remaining slots on each side are single `randomCategory()`
	// draws, this file's existing "burn the leading roll" convention.
	const branch = SpdRandom.int(2);
	const potionKinds: string[] = [];
	const scrollKinds: string[] = [];
	if (branch === 0) {
		potionKinds.push(randomCategory(Cat.POTION).cls);
		scrollKinds.push('scrollOfTransmutation');
	} else {
		potionKinds.push('potionOfExperience');
		scrollKinds.push(randomCategory(Cat.SCROLL).cls);
	}
	potionKinds.push(randomCategory(Cat.POTION).cls);
	scrollKinds.push(randomCategory(Cat.SCROLL).cls);
	potionKinds.push(randomCategory(Cat.POTION).cls);
	scrollKinds.push(randomCategory(Cat.SCROLL).cls);

	// Real final `Random.Int(2)` shuffle deciding which physical rooms hold which slot.
	const shuffle = SpdRandom.int(2);
	const dropAt = (cell: { x: number; y: number }, kind: 'potion' | 'scroll', sourceClass: string) => {
		level.drop(kind, level.pointToCell(cell))!.sourceClass = sourceClass;
	};
	dropAt(rectCenter(rooms[shuffle === 1 ? 2 : 3]), 'potion', potionKinds[0]);
	dropAt(rectCenter(rooms[shuffle === 1 ? 3 : 2]), 'scroll', scrollKinds[0]);
	dropAt(rectCenter(rooms[shuffle === 1 ? 0 : 1]), 'potion', potionKinds[1]);
	dropAt(rectCenter(rooms[shuffle === 1 ? 1 : 0]), 'scroll', scrollKinds[1]);
	dropAt(shuffle === 1 ? prize1 : prize2, 'potion', potionKinds[2]);
	dropAt(shuffle === 1 ? prize2 : prize1, 'scroll', scrollKinds[2]);

	level.drop('crystalKey', 0, 'itemToSpawn');
	level.drop('crystalKey', 0, 'itemToSpawn');
	level.drop('crystalKey', 0, 'itemToSpawn');

	entrance.set(DoorType.REGULAR);
}
