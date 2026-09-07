/**
 * Port of `levels/rooms/special/CrystalChoiceRoom.java`. The two internal `EmptyRoom` sub-rects
 * (`room1`/`room2`) are represented as plain rects here (not full graph `Room`s, matching what
 * Java itself does structurally) with local `random()`/`center()`/`square()` helpers mirroring
 * `Room.java`'s real formulas (see room.ts for the canonical versions these mirror). The
 * `Random.Int(2)` room-swap, the `Random.NormalIntRange(3,4)` reward count, and each reward
 * position's retry loop are all local/portable, and `Generator.random(category)`'s own rolls now
 * go through `spdItems/generator.ts`.
 */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillXY, set, drawLine } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';
import { Cat, oneOfCategories, randomCategory } from '../../../spdItems/generator';

interface Rect { left: number; top: number; right: number; bottom: number; }
function rw(r: Rect): number { return r.right - r.left + 1; }
function rh(r: Rect): number { return r.bottom - r.top + 1; }
function rSquare(r: Rect): number { return rw(r) * rh(r); }
function rRandom(r: Rect, m: number): { x: number; y: number } {
	return { x: SpdRandom.intRange(r.left + m, r.right - m), y: SpdRandom.intRange(r.top + m, r.bottom - m) };
}
function rCenter(r: Rect): { x: number; y: number } {
	const oddW = (r.right - r.left) % 2 === 1, oddH = (r.bottom - r.top) % 2 === 1;
	const x = Math.floor((r.left + r.right) / 2) + (oddW ? SpdRandom.int(2) : 0);
	const y = Math.floor((r.top + r.bottom) / 2) + (oddH ? SpdRandom.int(2) : 0);
	return { x, y };
}

export function paintCrystalChoiceRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);

	const entrance = room.entranceDoor();

	// Java constructs `entry`/`room1`/`room2` as three real `new EmptyRoom()` instances up
	// front, BEFORE the branch that calls `center()`. `EmptyRoom` extends `StandardRoom`, whose
	// instance initializer `{ setSizeCat(); }` burns one `Random.chances(sizeCatProbs())` float
	// per construction - three draws that this port previously skipped, mis-ordering everything
	// after them. Only the rects are used below, but the draws are not optional.
	new Room('standard', 'empty');
	new Room('standard', 'empty');
	new Room('standard', 'empty');

	const rc = room.center(); // Room.center() call inside each branch below, matching Java's `center()` calls

	let entry: Rect, room1: Rect, room2: Rect;

	if (entrance.x === room.left) {
		entry = { left: room.left + 1, top: room.top + 1, right: room.left + 2, bottom: room.bottom - 1 };
		room1 = { left: entry.right + 2, top: room.top + 1, right: room.right - 1, bottom: rc.y - 1 };
		room2 = { left: entry.right + 2, top: room1.bottom + 2, right: room.right - 1, bottom: room.bottom - 1 };
		set(level, entry.right + 1, Math.floor((room1.top + room1.bottom + 1) / 2), Terrain.CRYSTAL_DOOR);
		set(level, entry.right + 1, Math.floor((room2.top + room2.bottom) / 2), Terrain.CRYSTAL_DOOR);
	} else if (entrance.y === room.top) {
		entry = { left: room.left + 1, top: room.top + 1, right: room.right - 1, bottom: room.top + 2 };
		room1 = { left: room.left + 1, top: entry.bottom + 2, right: rc.x - 1, bottom: room.bottom - 1 };
		room2 = { left: room1.right + 2, top: entry.bottom + 2, right: room.right - 1, bottom: room.bottom - 1 };
		set(level, Math.floor((room1.left + room1.right + 1) / 2), entry.bottom + 1, Terrain.CRYSTAL_DOOR);
		set(level, Math.floor((room2.left + room2.right) / 2), entry.bottom + 1, Terrain.CRYSTAL_DOOR);
	} else if (entrance.x === room.right) {
		entry = { left: room.right - 2, top: room.top + 1, right: room.right - 1, bottom: room.bottom - 1 };
		drawLine(level, { x: room.right - 1, y: room.top + 1 }, { x: room.right - 1, y: room.bottom - 1 }, Terrain.EMPTY);
		room1 = { left: room.left + 1, top: room.top + 1, right: entry.left - 2, bottom: rc.y - 1 };
		room2 = { left: room.left + 1, top: room1.bottom + 2, right: entry.left - 2, bottom: room.bottom - 1 };
		set(level, entry.left - 1, Math.floor((room1.top + room1.bottom + 1) / 2), Terrain.CRYSTAL_DOOR);
		set(level, entry.left - 1, Math.floor((room2.top + room2.bottom) / 2), Terrain.CRYSTAL_DOOR);
	} else {
		entry = { left: room.left + 1, top: room.bottom - 2, right: room.right - 1, bottom: room.bottom - 1 };
		room1 = { left: room.left + 1, top: room.top + 1, right: rc.x - 1, bottom: entry.top - 2 };
		room2 = { left: room1.right + 2, top: room.top + 1, right: room.right - 1, bottom: entry.top - 2 };
		set(level, Math.floor((room1.left + room1.right + 1) / 2), entry.top - 1, Terrain.CRYSTAL_DOOR);
		set(level, Math.floor((room2.left + room2.right) / 2), entry.top - 1, Terrain.CRYSTAL_DOOR);
	}

	fillXY(level, entry.left, entry.top, rw(entry), rh(entry), Terrain.EMPTY);
	fillXY(level, room1.left, room1.top, rw(room1), rh(room1), Terrain.EMPTY_SP);
	fillXY(level, room2.left, room2.top, rw(room2), rh(room2), Terrain.EMPTY_SP);

	if (SpdRandom.int(2) === 0) { const tmp = room1; room1 = room2; room2 = tmp; }

	const n = SpdRandom.normalIntRange(3, 4);
	for (let i = 0; i < n; i++) {
		// `Generator.random(Random.oneOf(POTION, SCROLL))`: the oneOf is one real level-stream
		// draw (previously skipped); the category's class pick is on its own substream and both
		// inherit `Item.random()`, so nothing further.
		const category = oneOfCategories([Cat.POTION, Cat.SCROLL]);
		const generated = randomCategory(category);
		let pos: number;
		do {
			pos = level.pointToCell(rSquare(room1) >= 16 ? rRandom(room1, 1) : rRandom(room1, 0));
		} while (level.findHeap(pos) !== undefined);
		level.drop(category === Cat.POTION ? 'potion' : 'scroll', pos)!.sourceClass = generated.cls;
	}

	// `Generator.random(Random.oneOf(WAND, RING, ARTIFACT))`: the oneOf Int(3), plus the
	// category's own `.random()` on the level stream (Wand/Ring roll level+curse, Artifact rolls
	// curse only). All previously skipped.
	const rewardCategory = oneOfCategories([Cat.WAND, Cat.RING, Cat.ARTIFACT]);
	const reward = randomCategory(rewardCategory);
	//The concrete class is Generator-internal, but its playable family is not.
	level.drop(reward.cat === Cat.WAND ? 'wand' : reward.cat === Cat.ARTIFACT ? 'artifact' : 'ring', level.pointToCell(rCenter(room2)), 'chest,autoExplored')!.sourceClass = reward.cls;

	level.drop('crystalKey', level.pointToCell(rc), 'itemToSpawn');

	room.entranceDoor().set(DoorType.LOCKED);
	level.drop('ironKey', level.pointToCell(rc), 'itemToSpawn');
}
