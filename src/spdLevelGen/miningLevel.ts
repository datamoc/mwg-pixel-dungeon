/**
 * `levels/MiningLevel.java` + `levels/painters/MiningLevelPainter.java` (tag `v3.3.8`): the
 * Blacksmith quest branch. One `MineEntrance`, one `MineGiantRoom` (the quest boss), three
 * `MineLargeRoom`s, `NormalIntRange(6, 8)` `MineSmallRoom`s and two `MineSecretRoom`s on a
 * `FigureEightBuilder`, painted with 45-47 dark-gold veins, water 0.35 and grass 0.10, no traps
 * from the painter, no chasms. The room overlays per quest type live in `rooms/quest/mineRooms.ts`.
 *
 * The caller pushes the branch's own `Dungeon.seedCurDepth()` generator (branch 1) around this,
 * like every other floor. A branch level skips `Level.create()`'s whole item-queue/feeling
 * prologue (`!bossLevel() && branch == 0`), so the first draws here are the builder's.
 */
import { Room, DoorType } from './room';
import { PaintLevel, Terrain, isPassableTerrain, roomPoints } from './paintLevel';
import { FigureEightBuilder } from './figureEightBuilder';
import { layoutAndCreateLevel, placeDoors, paintWater, paintGrass, mergeRooms, buildDistanceMap, isSolidTerrain } from './regularPainter';
import { paintStandardRoom } from './rooms/standard/registry';
import { setBlacksmithQuestType, type BlacksmithQuestType } from './blacksmith';
import { SpdRandom } from '../spdRng';

/** `MiningLevel.initRooms()`. `setSizeCat()` runs twice for every room but the entrance: once in
 *  `StandardRoom`'s instance initializer (the `Room` constructor here) and once explicitly. */
function initRooms(): Room[] {
	const rooms: Room[] = [new Room('standard', 'mineEntrance')];
	const giant = new Room('standard', 'mineGiant');
	giant.setSizeCat();
	rooms.push(giant);
	for (let i = 0; i < 3; i++) {
		const large = new Room('standard', 'mineLarge');
		large.setSizeCat();
		rooms.push(large);
	}
	const smalls = SpdRandom.normalIntRange(6, 8);
	for (let i = 0; i < smalls; i++) {
		const small = new Room('standard', 'mineSmall');
		small.setSizeCat();
		rooms.push(small);
	}
	for (let i = 0; i < 2; i++) rooms.push(new Room('secret', undefined, undefined, 'mine'));
	return rooms;
}

/** `MiningLevel.builder()`: `setPathLength(0.8f, {1})`, `setTunnelLength({1}, {1})`, no loop shape. */
function miningBuilder(): FigureEightBuilder {
	const builder = new FigureEightBuilder();
	builder.pathLength = Math.fround(0.8);
	builder.pathLenJitterChances = [1];
	builder.pathTunnelChances = [1];
	builder.branchTunnelChances = [1];
	return builder;
}

/** `MiningLevelPainter.paintDoors()`: walled and hidden doors become plain `WALL` (the pickaxe is
 *  the way through), every other door is hidden 90% of the time unless that would cut the room
 *  off, and a door left open merges its two rooms. Java revisits each door from both sides, and
 *  a door already opened to `EMPTY` rolls again on the second visit - kept as written. */
function paintMiningDoors(level: PaintLevel, rooms: Room[]): void {
	const roomMerges = new Map<Room, Room>();
	const hiddenDoorChance = Math.fround(0.90);
	for (const r of rooms) {
		for (const n of r.connected.keys()) {
			const d = r.connected.get(n)!;
			const door = level.pointToCell(d);
			if (d.type === DoorType.WALL || d.type === DoorType.HIDDEN) {
				level.map[door] = Terrain.WALL;
			} else if (SpdRandom.float() < hiddenDoorChance) {
				d.type = DoorType.HIDDEN;
				buildDistanceMap(rooms, r);
				if (n.distance === Infinity) {
					level.map[door] = Terrain.EMPTY;
					d.type = DoorType.EMPTY;
				} else {
					level.map[door] = Terrain.WALL;
				}
			} else {
				level.map[door] = Terrain.EMPTY;
				d.type = DoorType.EMPTY;
			}
			if (level.map[door] === Terrain.EMPTY) {
				if (roomMerges.get(r) === n || roomMerges.get(n) === r) continue;
				if (mergeRooms(level, r, n, d, Terrain.EMPTY)) {
					roomMerges.set(r, n);
					roomMerges.set(n, r);
				}
			}
		}
	}
}

/** `room.connected.containsValue(point)`: `Door extends Point`, compared by position. */
function hasDoorAt(room: Room, level: PaintLevel, cell: number): boolean {
	const p = level.cellToPoint(cell);
	for (const d of room.connected.values()) if (d && d.x === p.x && d.y === p.y) return true;
	return false;
}

/** `Level.insideMap()`: not on the outermost ring. */
function insideMap(level: PaintLevel, cell: number): boolean {
	const x = cell % level.w;
	return cell >= level.w && cell < level.map.length - level.w && x !== 0 && x !== level.w - 1;
}

/** `MiningLevelPainter.generateGold()`: top the rooms' own veins (and the gnoll secret's chest)
 *  up to `goldToAdd`, a room at a time in shuffled order, as clusters of 1-3 wall veins that
 *  touch open ground. Secret rooms are skipped. */
function generateMiningGold(level: PaintLevel, rooms: Room[], goldAmount: number): void {
	const map = level.map;
	let goldToAdd = goldAmount;
	for (let i = 0; i < map.length; i++) if (map[i] === Terrain.WALL_DECO) goldToAdd--;
	for (const item of level.groundItems) if (item.kind === 'darkGold') goldToAdd -= item.quantity ?? 1;
	const n4 = [-level.w, -1, 1, level.w];
	//Java's `do ... while (goldToAdd > 0)` has no exit if no room can take a vein; a floor with no
	//wall touching open ground cannot come out of this builder, but a runaway loop would hang the
	//game rather than fail a check, so the pass count is bounded.
	for (let pass = 0; goldToAdd > 0 && pass < 1000; pass++) {
		SpdRandom.shuffle(rooms);
		for (const r of rooms) {
			if (r.kind === 'secret') continue;
			const candidates: number[] = [];
			for (const p of roomPoints(r)) {
				const i = level.pointToCell(p);
				if (insideMap(level, i) && goldToAdd > 0 && map[i] === Terrain.WALL) {
					for (const j of n4) {
						if (insideMap(level, i + j) && map[i + j] !== Terrain.WALL) {
							candidates.push(i);
							break;
						}
					}
				}
			}
			if (goldToAdd > 0 && candidates.length > 0) {
				const pos = SpdRandom.element(candidates);
				map[pos] = Terrain.WALL_DECO;
				goldToAdd--;
				if (goldToAdd > 0) {
					let i = n4[SpdRandom.int(4)]!;
					if (insideMap(level, pos + i) && map[pos + i] === Terrain.WALL) {
						map[pos + i] = Terrain.WALL_DECO;
						goldToAdd--;
					}
					if (SpdRandom.int(2) === 0) {
						i = n4[SpdRandom.int(4)]!;
						if (insideMap(level, pos + i) && map[pos + i] === Terrain.WALL) {
							map[pos + i] = Terrain.WALL_DECO;
							goldToAdd--;
						}
					}
				}
			}
		}
	}
}

/** `CavesPainter.decorate()` as of tag `v3.3.8`, then `MiningLevelPainter.decorate()`'s chasm
 *  removal. The regular Caves floors still run the older shape (`cavesPainter.ts`); this one is
 *  v3.3.8's own: a 1-in-3 `REGION_DECO` unconnected-neighbour merge, and corner fills that refuse
 *  solid tiles, door cells and trap neighbours. `generateGold` is the mining override. */
function decorateMiningLevel(level: PaintLevel, rooms: Room[], goldAmount: number): void {
	const map = level.map;
	const w = level.w;
	const l = map.length;
	for (const r of rooms) {
		for (const n of r.neigbours) {
			if (!r.connected.has(n)) mergeRooms(level, r, n, null, SpdRandom.int(3) === 0 ? Terrain.REGION_DECO : Terrain.CHASM);
		}
	}
	for (const room of rooms) {
		if (room.kind !== 'standard' && room.kind !== 'entrance' && room.kind !== 'exit') continue;
		if (room.width() <= 4 || room.height() <= 4) continue;
		const s = room.square();
		const tryCorner = (corner: number, side: number, vertical: number, oppositeSide: number, oppositeVertical: number) => {
			if (!isSolidTerrain(map[corner]!)
				&& map[corner + side] === Terrain.WALL && !hasDoorAt(room, level, corner + side)
				&& map[corner + vertical] === Terrain.WALL && !hasDoorAt(room, level, corner + vertical)
				&& map[corner + oppositeSide] !== Terrain.TRAP && map[corner + oppositeVertical] !== Terrain.TRAP) {
				map[corner] = Terrain.WALL;
				level.traps.delete(corner);
			}
		};
		if (SpdRandom.int(s) > 8) tryCorner((room.left + 1) + (room.top + 1) * w, -1, -w, 1, w);
		if (SpdRandom.int(s) > 8) tryCorner((room.right - 1) + (room.top + 1) * w, 1, -w, -1, w);
		if (SpdRandom.int(s) > 8) tryCorner((room.left + 1) + (room.bottom - 1) * w, -1, w, 1, -w);
		if (SpdRandom.int(s) > 8) tryCorner((room.right - 1) + (room.bottom - 1) * w, 1, w, -1, -w);
	}
	for (let i = w + 1; i < l - w; i++) {
		if (map[i] !== Terrain.EMPTY) continue;
		let n = 0;
		if (map[i + 1] === Terrain.WALL) n++;
		if (map[i - 1] === Terrain.WALL) n++;
		if (map[i + w] === Terrain.WALL) n++;
		if (map[i - w] === Terrain.WALL) n++;
		if (SpdRandom.int(6) <= n) map[i] = Terrain.EMPTY_DECO;
	}
	generateMiningGold(level, rooms, goldAmount);
	for (let i = 0; i < l; i++) if (map[i] === Terrain.CHASM) map[i] = Terrain.EMPTY;
}

/** `RegularLevel.randomDropCell(MineSmallRoom.class)`: up to 100 tries, each reshuffling the room
 *  list (`randomRoom()`) to take the first small mine room, then one `random()` point that is open,
 *  unoccupied and trap-free. The port places no exit, so Java's `!= exit()` test has nothing to do. */
function randomSmallRoomDropCell(level: PaintLevel, rooms: Room[]): number {
	for (let tries = 0; tries < 100; tries++) {
		SpdRandom.shuffle(rooms);
		const room = rooms.find((r) => r.standardKind === 'mineSmall');
		if (!room) return -1;
		const pos = level.pointToCell(room.random());
		const terrain = level.map[pos]!;
		if (isPassableTerrain(terrain) && !isSolidTerrain(terrain) && !level.findHeap(pos) && !level.findMob(pos) && !level.traps.has(pos)) return pos;
	}
	return -1;
}

/** `Generator.randomUsingDefaults(FOOD)`: the FOOD category's default weights, Food 4 / Pasty 1 /
 *  MysteryMeat 0 (`Generator.Category.FOOD.defaultProbs`, tag `v3.3.8`). */
function randomDefaultFood(): string {
	return SpdRandom.chances([4, 1, 0]) === 1 ? 'food|Pasty' : 'food|Food';
}

/**
 * `MiningLevel.createItems()` (tag `v3.3.8`): one food in a small mine room, a second on the Gnoll
 * quest ("more mining required!"), and a Torch under the Darkness challenge; a drop on high or
 * furrowed grass flattens it to `GRASS` first. **Simplified:** Java runs `createMobs()` just before
 * this on the same stream; the mine's ambient roster (`CrystalWisp`/`GnollGuard`) is not ported,
 * so those draws are absent, and `Bones.get()`'s remains heap (its own pushed generator) is not
 * ported either.
 */
function createMiningItems(level: PaintLevel, rooms: Room[], questType: BlacksmithQuestType, darkness: boolean): void {
	const drop = (kind: string) => {
		const cell = randomSmallRoomDropCell(level, rooms);
		if (cell < 0) return;
		if (level.map[cell] === Terrain.HIGH_GRASS || level.map[cell] === Terrain.FURROWED_GRASS) level.map[cell] = Terrain.GRASS;
		level.drop(kind, cell);
	};
	drop(randomDefaultFood());
	if (questType === 2) drop(randomDefaultFood());
	if (darkness) drop('torch');
}

export interface MiningLevelResult {
	paint: PaintLevel;
	rooms: Room[];
	attempts: number;
}

/** `MiningLevel.create()` from `build()` onward, for a run whose Blacksmith rolled `questType`. */
export function generateMiningLevel(questType: BlacksmithQuestType, depth: number, darkness = false): MiningLevelResult {
	setBlacksmithQuestType(questType);
	const builder = miningBuilder();
	const initial = initRooms();
	SpdRandom.shuffle(initial);
	let rooms: Room[] | null = null;
	let attempts = 0;
	const MAX_ATTEMPTS = 200;
	while (rooms === null && attempts < MAX_ATTEMPTS) {
		attempts++;
		for (const r of initial) { r.neigbours = []; r.connected.clear(); }
		rooms = builder.build(initial.slice(), depth);
	}
	if (!rooms) throw new Error(`generateMiningLevel: failed to converge after ${MAX_ATTEMPTS} attempts (depth ${depth})`);

	//`painter()` is evaluated after the builder succeeds: `setGold(Random.NormalIntRange(45, 47))`.
	const goldAmount = SpdRandom.normalIntRange(45, 47);
	const level = layoutAndCreateLevel(rooms, null, 3);
	SpdRandom.shuffle(rooms);
	for (const r of rooms) {
		placeDoors(r);
		paintStandardRoom(level, r, depth);
	}
	paintMiningDoors(level, rooms);
	//"use a separate RNG here so that extra painting variance doesn't affect the rest of levelgen"
	SpdRandom.pushGenerator(SpdRandom.long());
	try {
		paintWater(level, rooms, Math.fround(0.35), 6);
		paintGrass(level, rooms, Math.fround(0.10), 3);
		decorateMiningLevel(level, rooms, goldAmount);
	} finally {
		SpdRandom.popGenerator();
	}
	createMiningItems(level, rooms, questType, darkness);
	return { paint: level, rooms, attempts };
}
