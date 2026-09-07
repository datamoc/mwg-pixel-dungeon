/** Port of `levels/rooms/special/CrystalPathRoom.java`. The `center()` do-while, the door
 *  clockwise/counterclockwise geometry, and the loot loop (slot 0's Gold quantity is portable and ported; slots 1-2 are Generator-substream
 *  Gold/Potion/Scroll draws are real (the Gold quantity `IntRange`, and a `randomCategory()`
 *  call per potion/scroll slot for deck bookkeeping); slot 3's `Random.Int(4)` pick among
 *  four concrete, non-Generator items IS fully local/portable and ported as-is) are all
 *  faithfully reproduced. */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, drawLine, set } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';
import { Cat, randomCategory } from '../../../spdItems/generator';

interface Rect { left: number; top: number; right: number; bottom: number; }
function rCenter(r: Rect): { x: number; y: number } {
	const oddW = (r.right - r.left) % 2 === 1, oddH = (r.bottom - r.top) % 2 === 1;
	return {
		x: Math.floor((r.left + r.right) / 2) + (oddW ? SpdRandom.int(2) : 0),
		y: Math.floor((r.top + r.bottom) / 2) + (oddH ? SpdRandom.int(2) : 0),
	};
}
function grow(r: Rect, n: number): Rect { return { left: r.left - n, top: r.top - n, right: r.right + n, bottom: r.bottom + n }; }
function inside(r: Rect, p: { x: number; y: number }): boolean { return p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom; }

const SLOT3_ITEMS = ['stoneOfAugmentation', 'scrollOfTransmutation', 'starflowerSeed', 'potionOfExperience'];

/**
 * `new EmptyRoom()` followed by `.set(l,t,r,b)` - the construction is what burns the
 * `setSizeCat()` draw, so it must happen even though only the rect is used afterwards.
 */
function newEmptyRoomRect(left: number, top: number, right: number, bottom: number): Rect {
	const r = new Room('standard', 'empty');
	r.left = left; r.top = top; r.right = right; r.bottom = bottom;
	return r;
}

export function paintCrystalPathRoom(level: PaintLevel, room: Room, depth: number): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY_SP);

	const entrance = room.entranceDoor();

	let center: { x: number; y: number };
	do { center = room.center(); } while (center.x === entrance.x || center.y === entrance.y);

	drawLine(level, { x: center.x, y: room.top + 1 }, { x: center.x, y: room.bottom - 1 }, Terrain.WALL);
	drawLine(level, { x: room.left + 1, y: center.y }, { x: room.right - 1, y: center.y }, Terrain.WALL);

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

	// Java builds these four quadrant rects as real `new EmptyRoom()` instances. That matters for
	// the RNG stream, not just the geometry: `EmptyRoom` extends `StandardRoom`, whose instance
	// initializer `{ setSizeCat(); }` burns one `Random.chances(sizeCatProbs())` float PER
	// CONSTRUCTION - four draws here, before anything else in this method. An earlier version of
	// this port built them as plain literals and silently skipped all four, desyncing the rest of
	// the floor. Found via the Phase 2 call-by-call RNG trace diff (Java's 4x next(24) right after
	// the center() do-while against TS's absence of them). The rolled sizeCat itself is unused -
	// the rooms are immediately given explicit bounds - but the draws are real.
	const rooms: Rect[] = [
		newEmptyRoomRect(room.left + 1, room.top + 1, center.x - 1, center.y - 1),
		newEmptyRoomRect(center.x + 1, room.top + 1, room.right - 1, center.y - 1),
		newEmptyRoomRect(center.x + 1, center.y + 1, room.right - 1, room.bottom - 1),
		newEmptyRoomRect(room.left + 1, center.y + 1, center.x - 1, room.bottom - 1),
	];

	for (let i = 0; i < 3; i++) {
		if (door.x === center.x) {
			door.y = door.y < center.y ? rCenter(rooms[0]).y : rCenter(rooms[2]).y;
		} else {
			door.x = door.x < center.x ? rCenter(rooms[0]).x : rCenter(rooms[1]).x;
		}
		set(level, door.x, door.y, Terrain.CRYSTAL_DOOR);
		door.x -= center.x; door.y -= center.y;
		const tmp = door.x; door.x = door.y; door.y = tmp;
		if (clockwise) door.x = -door.x; else door.y = -door.y;
		door.x += center.x; door.y += center.y;
	}

	let idx = 0;
	for (let i = 0; i < rooms.length; i++) {
		const grown = grow(rooms[i], 2);
		if (inside(grown, { x: entrance.x, y: entrance.y })) idx = i;
	}

	for (let i = 0; i < 4; i++) {
		const pos = level.pointToCell(rCenter(rooms[idx]));
		if (i === 3) {
			const item = SLOT3_ITEMS[SpdRandom.int(4)];
			level.drop(item === 'stoneOfAugmentation' ? 'stone' : item === 'scrollOfTransmutation' ? 'scroll' : item === 'potionOfExperience' ? 'potion' : 'food', pos)!.sourceClass = item;
		} else if (i === 0) {
			// `new Gold().random()`: `Random.IntRange(30 + depth*10, 60 + depth*20)` - a real,
			// fully portable draw (no Generator deck), so it MUST be made. Skipping it was a real
			// RNG-order bug found via the Phase 2 trace diff.
			const quantity = SpdRandom.intRange(30 + depth * 10, 60 + depth * 20);
			level.drop('gold', pos, `qty:${quantity}`)!.sourceClass = 'Gold';
		} else {
			// slots 1-2: Generator.random(POTION|SCROLL) picks its class on Generator's OWN pushed
			// substream (`pushGenerator(cat.seed)` in Generator.java), so it consumes NOTHING from
			// the level-gen stream - verified against the Java harness. The trailing `.random()`
			// on the produced Potion/Scroll adds no draws either, so this contributes zero draws -
			// but the call is made anyway so the category deck/substream bookkeeping advances.
			const generated = randomCategory(i === 1 ? Cat.POTION : Cat.SCROLL);
			level.drop(['gold', 'potion', 'scroll'][i], pos)!.sourceClass = generated.cls;
		}
		idx = clockwise ? (idx + 1) % 4 : (idx + 3) % 4;
	}

	level.drop('crystalKey', 0, 'itemToSpawn');
	level.drop('crystalKey', 0, 'itemToSpawn');
	level.drop('crystalKey', 0, 'itemToSpawn');

	entrance.set(DoorType.LOCKED);
	level.drop('ironKey', level.pointToCell(entrance), 'itemToSpawn');
}
