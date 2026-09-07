/**
 * Port of `levels/rooms/standard/BlacksmithRoom.java`'s room-content painting only. `minWidth()`/
 * `minHeight()` floor at 6 is modeled via `room.ts`'s `STANDARD_ROOM_META`, not here.
 *
 * The real Blacksmith NPC is now emitted into `PaintLevel.mobs` at the room-local position below,
 * so the live bridge preserves Java's placement. The QuestEntrance custom tile and branch
 * transition are carried through the live bridge; main.ts renders the Java custom tile atlas
 * at the branch-exit cell.
 */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, drawInside, set } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';
import { entranceRoomContext } from './entranceRoom';
import { Cat, oneOfCategories, randomCategory } from '../../../spdItems/generator';

const CATEGORY_NAMES: Record<number, string> = { [Cat.ARMOR]: 'armor', [Cat.WEAPON]: 'weapon', [Cat.MISSILE]: 'missile' };

export function paintBlacksmithRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.TRAP);
	fillRoomInset(level, room, 2, Terrain.EMPTY_SP);

	for (let i = 0; i < 2; i++) {
		let pos: number;
		do {
			pos = level.pointToCell(room.random());
		} while (level.map[pos] !== Terrain.EMPTY_SP);
		const cat = oneOfCategories([Cat.ARMOR, Cat.WEAPON, Cat.MISSILE]);
		const generated = randomCategory(cat);
		level.drop(CATEGORY_NAMES[cat], pos)!.sourceClass = generated.cls;
	}

	// BlacksmithRoom.java: the NPC is placed with room.random(2), independently of the two
	// prize positions, and is kept away from any generated heap.
	let blacksmithPos: number;
	do {
		blacksmithPos = level.pointToCell(room.random(2));
	} while (level.mobs.some((mob) => mob.pos === blacksmithPos) || level.groundItems.some((item) => item.pos === blacksmithPos));
	level.mobs.push({ pos: blacksmithPos, kind: 'blacksmith' });

	// BlacksmithRoom.java's second branch-specific random position uses the separate
	// seedCurDepth()+1 generator; the caller records the branch transition without treating
	// it as the main dungeon staircase.
	let branchPos: number;
	SpdRandom.pushGenerator(entranceRoomContext.branchSeed + 1n);
	do { branchPos = level.pointToCell(room.random(2)); } while (branchPos === blacksmithPos || level.groundItems.some((item) => item.pos === branchPos));
	SpdRandom.popGenerator();
	set(level, branchPos % level.w, Math.floor(branchPos / level.w), Terrain.EXIT);
	level.transitions.push({ pos: branchPos, type: 'branchExit', branch: 1 });

	for (const door of room.connected.values()) {
		if (!door) continue;
		door.set(DoorType.REGULAR);
		drawInside(level, room, door, 1, Terrain.EMPTY);
	}

	// `for (Point p : getPoints()) if (map[cell]==TRAP) setTrap(new BurningTrap().reveal(), cell)` -
	// every cell still TRAP after the EMPTY_SP interior and door carve-outs above (i.e. the ring
	// between the WALL border and the interior, minus door gaps) becomes a real, REVEALED
	// (not hidden) burning trap - `burning` is one of this port's five actually-implemented trap
	// behaviours (see `gameBridge.ts`'s `TRAP_BEHAVIOUR`), so this ring is a genuine hazard, not a
	// name-only stand-in.
	for (let y = room.top; y <= room.bottom; y++) {
		for (let x = room.left; x <= room.right; x++) {
			const cell = level.pointToCell({ x, y });
			if (level.map[cell] === Terrain.TRAP) level.setTrap('burning', false, true, cell);
		}
	}
}
