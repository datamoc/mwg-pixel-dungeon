/** Port of `levels/rooms/standard/EntranceRoom.java`. */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';

/** Module-level stand-in for `Dungeon.depth`/`Document`/`SPDSettings` state this port doesn't
 *  have as real save-file state - callers set this before invoking `paintEntranceRoom`. Verify
 *  scripts/tests rely on the `false` defaults so the guidebook-placement roll still happens for
 *  their own verification purposes; the live game overrides both flags once at scene creation
 *  from `main.ts`'s `guideProgress` (a small cross-run `SaveSystem`, distinct from any one run's
 *  save) and updates them permanently the first time the corresponding door is actually found -
 *  the real completion signal for `SPDSettings.intro()`/the depth-2 searching page, since this
 *  port has no guidebook-reading interaction of its own. See `PORT_COVERAGE.md`'s "Depth-1/2
 *  entrance-room tutorial seal" row: before this was wired up, both flags stayed `false` forever
 *  in the live game too, resealing every single run instead of only a genuinely new player's
 *  first one. */
export const entranceRoomContext = { depth: 1, guideIntroRead: false, guideSearchingFound: false, branchSeed: 0n as bigint };

export function paintEntranceRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY);
	for (const door of room.connected.values()) door?.set(DoorType.REGULAR);

	let entrance: number;
	do {
		entrance = level.pointToCell(room.random(2));
	} while (level.findMob(entrance) !== undefined);
	level.map[entrance] = Terrain.ENTRANCE;

	level.transitions.push({ pos: entrance, type: entranceRoomContext.depth === 1 ? 'surface' : 'regularEntrance' });

	// Real Java: `Random.pushGenerator()` here is intentionally UNSEEDED ("use a separate
	// generator here so meta progression doesn't affect levelgen") - guidebook page placement is
	// genuinely non-deterministic even in the real game for a fixed dungeon seed, so this port
	// matches that with Math.random() rather than the seeded SpdRandom stream.
	//
	// CONFIRMED (by running this port with/without the branch below): this is NOT just cosmetic.
	// `level.drop(...)` here adds a heap at the guidebook's (unseeded-random) position, and
	// `RegularPainter.paintGrass()` - which runs later, after every room including this one is
	// painted - skips its `Random.Float()` roll on any cell already holding a heap
	// (`l.heaps.get(i) != null`, see `regularPainter.ts`'s `paintGrass`). So on depth 1 (while
	// the intro guidebook page is unread) and depth 2 (while the searching page is unfound), the
	// real game's own level generation is genuinely NOT perfectly seed-reproducible: whether the
	// guidebook happens to land on a grass-candidate cell changes the seeded stream's call count
	// for the rest of that floor (grass pattern, traps, decorate all shift). Verified against
	// this port directly: depths 3-4 (unaffected) are deterministic run-to-run; depth 1 (with
	// `guideIntroRead: false`, this module's default - a fresh save) is not. This is a real,
	// source-confirmed property of the original game, not a porting bug - see PORT_COVERAGE.md.
	SpdRandom.pushGenerator(); // unseeded - see comment above
	if (entranceRoomContext.depth === 1 && !entranceRoomContext.guideIntroRead) {
		let pos: number;
		do {
			pos = level.pointToCell({ x: Math.floor(room.left + 1 + Math.random() * (room.right - 1 - (room.left + 1))), y: Math.floor(room.top + 1 + Math.random() * (room.bottom - 2 - (room.top + 1))) });
		} while (pos === entrance || level.findMob(entrance) !== undefined);
		level.drop('guidebook', pos);
	}
	if (entranceRoomContext.depth === 2 && !entranceRoomContext.guideSearchingFound) {
		let pos: number;
		do {
			pos = level.pointToCell({ x: Math.floor(room.left + 1 + Math.random() * (room.right - 1 - (room.left + 1))), y: Math.floor(room.top + 1 + Math.random() * (room.bottom - 2 - (room.top + 1))) });
		} while (pos === entrance || level.findMob(entrance) !== undefined);
		level.drop('guidePageSearching', pos);
	}
	SpdRandom.popGenerator();
}
