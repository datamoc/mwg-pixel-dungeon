/** Port of `levels/rooms/special/CrystalPathRoom.java` at the checkout HEAD (the quadrant
 * rewrite - cross walls around a jittered center, four `EmptyRoom` quadrants, three
 * `CRYSTAL_DOOR`s placed by snapping the door point onto quadrant centers and rotating it 90
 * degrees about the room center per door, four loot drops, three `CrystalKey`s plus an
 * `IronKey` to spawn, entrance `LOCKED`). Tags `v3.3.8`/`4.0.0-beta` still have the older
 * six-room/pedestal design, which an earlier version of this file ported; the probe compares
 * against HEAD, so this follows HEAD.
 *
 * Draw census (order matters, every one is on the level stream): the `center()` retry loop
 * (two `Int(2)`s per attempt until the center shares neither axis with the entrance), four
 * `EmptyRoom` constructions (one `chances` roll each, burned by `newEmptyRoomRect()`), one
 * `rooms[i].center()` per crystal door (three), one per loot drop (four), then the loot draws:
 * `Gold().random()` is `IntRange(30+depth*10, 60+depth*20)`, potion/scroll go through the
 * standard `randomCategory` path like every other room, and the `Int(4)` pick constructs its
 * item directly (no draws). The key spawns and the final `LOCKED` burn nothing.
 */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, drawLine, set } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';
import { randomCategory, Cat } from '../../../items/generator';

interface Rect {
	left: number;
	top: number;
	right: number;
	bottom: number;
}

/**
 * `new EmptyRoom()` - the construction is what burns the `setSizeCat()` draw, so it must happen
 * even though only the rect is used afterwards (Java constructs then assigns each quadrant).
 */
function newEmptyRoomRect(): Rect {
	new Room('standard', 'empty');
	return { left: 0, top: 0, right: 0, bottom: 0 };
}

function rectCenter(r: Rect): { x: number; y: number } {
	return {
		x: Math.floor((r.left + r.right) / 2) + ((r.right - r.left) % 2 === 1 ? SpdRandom.int(2) : 0),
		y: Math.floor((r.top + r.bottom) / 2) + ((r.bottom - r.top) % 2 === 1 ? SpdRandom.int(2) : 0),
	};
}

/** Java `Room.inside()`: strictly inside, borders excluded. */
function strictlyInside(r: Rect, x: number, y: number): boolean {
	return r.left < x && x < r.right && r.top < y && y < r.bottom;
}

export function paintCrystalPathRoom(level: PaintLevel, room: Room, depth: number): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY_SP);

	const entrance = room.entranceDoor();

	// Divergence (deliberate): Java retries `center()` unboundedly until it shares neither
	// axis with the entrance. When the room's x-span is even the x-center is FIXED (no
	// `Int(2)`), so an entrance on that exact column loops forever - a latent Java hang this
	// port tripped on seed 1 depth 1 (room 6,21,12,28, entrance 9,21: center.x is always 9).
	// Java has no finite behavior there to preserve, so this caps attempts and keeps the last
	// center; every terminating Java run exits in a handful of tries, far below the cap.
	let center = room.center();
	for (let guard = 0; (center.x === entrance.x || center.y === entrance.y) && guard < 1000; guard++) {
		center = room.center();
	}

	drawLine(level, { x: center.x, y: room.top + 1 }, { x: center.x, y: room.bottom - 1 }, Terrain.WALL);
	drawLine(level, { x: room.left + 1, y: center.y }, { x: room.right - 1, y: center.y }, Terrain.WALL);

	// The door starts at the entrance snapped onto the nearer center axis; the side it
	// snapped from decides the rotation direction. Pure geometry, no draws.
	const door = { x: entrance.x, y: entrance.y };
	let clockwise: boolean;
	if (entrance.x === room.left || entrance.x === room.right) {
		door.x = center.x;
		clockwise = entrance.y < center.y;
		if (entrance.x === room.right) clockwise = !clockwise;
	} else {
		door.y = center.y;
		clockwise = entrance.x > center.x;
		if (entrance.y === room.bottom) clockwise = !clockwise;
	}

	const quads: Rect[] = [newEmptyRoomRect(), newEmptyRoomRect(), newEmptyRoomRect(), newEmptyRoomRect()];
	quads[0]!.left = room.left + 1;
	quads[0]!.top = room.top + 1;
	quads[0]!.right = center.x - 1;
	quads[0]!.bottom = center.y - 1;
	quads[1]!.left = center.x + 1;
	quads[1]!.top = room.top + 1;
	quads[1]!.right = room.right - 1;
	quads[1]!.bottom = center.y - 1;
	quads[2]!.left = center.x + 1;
	quads[2]!.top = center.y + 1;
	quads[2]!.right = room.right - 1;
	quads[2]!.bottom = room.bottom - 1;
	quads[3]!.left = room.left + 1;
	quads[3]!.top = center.y + 1;
	quads[3]!.right = center.x - 1;
	quads[3]!.bottom = room.bottom - 1;

	// Three crystal doors: snap the free axis onto the matching quadrant center, paint,
	// then rotate the door point 90 degrees about the room center (mirrored when
	// counterclockwise). Each `rooms[i].center()` burns both axes' `Int(2)`s whether read or
	// not, so the full `rectCenter` call is the draw-faithful unit, not the component used.
	for (let i = 0; i < 3; i++) {
		if (door.x === center.x) {
			if (door.y < center.y) door.y = rectCenter(quads[0]!).y;
			else door.y = rectCenter(quads[2]!).y;
		} else {
			if (door.x < center.x) door.x = rectCenter(quads[0]!).x;
			else door.x = rectCenter(quads[1]!).x;
		}
		set(level, door.x, door.y, Terrain.CRYSTAL_DOOR);
		door.x -= center.x;
		door.y -= center.y;
		const tmp = door.x;
		door.x = door.y;
		door.y = tmp;
		if (clockwise) door.x = -door.x;
		else door.y = -door.y;
		door.x += center.x;
		door.y += center.y;
	}

	let idx = 0;
	for (let i = 0; i < 4; i++) {
		const q = quads[i]!;
		if (strictlyInside({ left: q.left - 2, top: q.top - 2, right: q.right + 2, bottom: q.bottom + 2 }, entrance.x, entrance.y)) idx = i;
	}

	// The loot kind is the loop counter, NOT a roll - Java's `switch (i)` deals gold,
	// potion, scroll, then one `Int(4)` pick in fixed order. (An earlier revision rolled
	// `Int(4)` per iteration; the trace-diff caught the 4 spurious draws via 999d9.)
	for (let i = 0; i < 4; i++) {
		const c = rectCenter(quads[idx]!);
		const cell = level.pointToCell(c);
		if (i === 0) {
			level.drop('gold', cell, `qty:${SpdRandom.intRange(30 + depth * 10, 60 + depth * 20)}`);
		} else if (i === 1) {
			const potion = randomCategory(Cat.POTION);
			level.drop('potion', cell, `src:${potion.cls}`);
		} else if (i === 2) {
			const scroll = randomCategory(Cat.SCROLL);
			level.drop('scroll', cell, `src:${scroll.cls}`);
		} else {
			const pick = SpdRandom.int(4);
			if (pick === 0) level.drop('stone', cell, 'src:stoneOfAugmentation');
			else if (pick === 1) level.drop('scroll', cell, 'src:scrollOfTransmutation');
			else if (pick === 2) level.drop('seed', cell, 'src:starflowerSeed');
			else level.drop('potion', cell, 'src:potionOfExperience');
		}
		idx = (idx + 1) % 4;
	}

	level.drop('crystalKey', 0, 'itemToSpawn');
	level.drop('crystalKey', 0, 'itemToSpawn');
	level.drop('crystalKey', 0, 'itemToSpawn');
	level.drop('ironKey', 0, 'itemToSpawn');
	entrance.set(DoorType.LOCKED);
}
