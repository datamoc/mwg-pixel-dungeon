/** Port of `levels/rooms/secret/SecretMazeRoom.java`. `minWidth/minHeight/maxWidth/maxHeight`
 *  (14-18/14-18) live in `room.ts`'s `SECRET_ROOM_META`. The maze carve (`Maze.generate`) and the
 *  furthest-point search (`PathFinder.buildDistanceMap`) are fully real/portable - see `maze.ts`.
 *
 *  The prize roll is NOT fully reproducible: Java's `do { ... } while (prize.cursed ||
 *  Challenges.isItemBlocked(prize))` retries `Generator.randomWeapon`/`randomArmor` (both
 *  Generator-internal, unknown call count) until an uncursed, unblocked item comes up - how many
 *  times that loop actually spins depends on Generator internals this port doesn't have. This is a
 *  real, documented RNG-order gap, not a "burn one call" case like `SpecialRoom`'s HashMap picks:
 *  only ONE `Random.Int(2)` weapon-vs-armor roll is made here (the loop's first iteration), with no
 *  retry - later depths' seeded streams will very likely desync from Java at this exact point
 *  whenever Java's own loop would have retried. The `Random.Int(3)` upgrade-chance roll immediately
 *  after is real (it's a local, non-Generator check) and is kept. The accepted generated class id
 *  is carried into the live chest payload. */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, fillXY } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';
import { mazeGenerate, buildGridDistanceMap } from './maze';
import { floorSetForPrize, uncursedWeaponOrArmorPrize } from '../../../spdItems/generator';
import { Cat } from '../../../spdItems/generator';

export function paintMazeRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY);

	const w = room.width(), h = room.height();
	const doorLocalPoints = [...room.connected.values()]
		.filter((d): d is NonNullable<typeof d> => d !== null)
		.map(d => ({ x: d.x - room.left, y: d.y - room.top }));
	const maze = mazeGenerate(w, h, doorLocalPoints);

	fillRoomInset(level, room, 1, Terrain.EMPTY);
	const passable = new Array<boolean>(w * h).fill(false);
	for (let x = 0; x < w; x++) {
		for (let y = 0; y < h; y++) {
			if (maze[x][y]) fillXY(level, x + room.left, y + room.top, 1, 1, Terrain.WALL);
			passable[x + w * y] = !maze[x][y];
		}
	}

	const entrance = room.entranceDoor();
	const entrancePos = (entrance.x - room.left) + w * (entrance.y - room.top);
	const distance = buildGridDistanceMap(w, h, passable, entrancePos);

	let bestDist = 0;
	let bestX = room.left, bestY = room.top;
	for (let i = 0; i < distance.length; i++) {
		if (distance[i] !== Infinity && distance[i] > bestDist) {
			bestDist = distance[i];
			bestX = (i % w) + room.left;
			bestY = Math.floor(i / w) + room.top;
		}
	}

	// The never-cursed weapon/armor loop, one floor set higher, then the 33% extra-upgrade roll.
	// Note this room's quirk: only the WEAPON branch passes `useDefaults = true`
	// (`randomWeapon(floorSet, true)`), which moves the class pick onto the level stream, while
	// `randomArmor` keeps its substream. Previously unreproducible, since the retry count depends
	// on the `cursed` flag the real Generator rolls.
	const prize = uncursedWeaponOrArmorPrize(floorSetForPrize(1), true);
	const kind = prize.cat === Cat.ARMOR ? 'armor' : 'weapon';
	const upgraded = SpdRandom.int(3) === 0;
	level.drop(`${kind}${upgraded ? '+1' : ''}`, level.pointToCell({ x: bestX, y: bestY }), 'chest')!.sourceClass = prize.cls;

	entrance.set(DoorType.HIDDEN);
}
