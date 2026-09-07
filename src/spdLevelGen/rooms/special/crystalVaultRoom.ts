/** Port of `levels/rooms/special/CrystalVaultRoom.java`. Fixed 7x7 (see room.ts's
 *  SPECIAL_ROOM_META). `Random.shuffle(prizeClasses)`, the position retry loop's `Random.Int(8)`
 *  rolls, and the 10% mimic-vs-chest roll are all local/portable. `Generator.random(category)`'s
 *  internal item rolls (inside `prize()`, called twice) are Generator-subsystem-internal -
 *  now made via `randomCategory()`: the prize's `.random()` runs on the level stream (Wand/Ring
 *  roll level+curse, Artifact rolls curse), even though its class pick is on a substream. */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, set } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';
import { Cat, randomCategory } from '../../../spdItems/generator';

/** `PathFinder.CIRCLE8` order; only its length (8) and the `+4 % 8` opposite-pairing matter for
 *  RNG-order fidelity, not the exact compass order. */
const OFFSETS8: [number, number][] = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]];

export function paintCrystalVaultRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY_SP);
	fillRoomInset(level, room, 2, Terrain.EMPTY);

	const c = level.pointToCell(room.center());
	const prizeClasses = ['wand', 'ring', 'artifact'];
	SpdRandom.shuffle(prizeClasses);

	// prize() twice: Java rotates the (already shuffled) list - `remove(0)` then `add(cat)` -
	// so the two prizes are the first two entries, and each runs `Generator.random(cat)` whose
	// `.random()` IS on the level stream (Wand/Ring roll level+curse, Artifact rolls curse).
	// Java's `while (prize == null || blocked)` can't loop: `random(cat)` never returns null
	// here (ARTIFACT falls back to a RING).
	const i1 = prizeClasses[0], i2 = prizeClasses[1];
	const CAT_BY_NAME: Record<string, Cat> = { wand: Cat.WAND, ring: Cat.RING, artifact: Cat.ARTIFACT };
	const reward1 = randomCategory(CAT_BY_NAME[i1]);
	const reward2 = randomCategory(CAT_BY_NAME[i2]);

	const doorPos = level.pointToCell(room.entranceDoor());
	let i1Pos = 0, i2Pos = 0;
	do {
		const idx = SpdRandom.int(OFFSETS8.length);
		const [dx1, dy1] = OFFSETS8[idx];
		const [dx2, dy2] = OFFSETS8[(idx + 4) % 8];
		i1Pos = c + dx1 + dy1 * level.w;
		i2Pos = c + dx2 + dy2 * level.w;
	} while (level.adjacent(i1Pos, doorPos) || level.adjacent(i2Pos, doorPos));

	const rewardKind = (cat: Cat): string => cat === Cat.WAND ? 'wand' : cat === Cat.ARTIFACT ? 'artifact' : 'ring';
	level.drop(rewardKind(reward1.cat), i1Pos, 'crystalChest')!.sourceClass = reward1.cls;
	if (SpdRandom.int(10) === 0) {
		const family = rewardKind(reward2.cat);
		level.mobs.push({ pos: i2Pos, kind: 'crystalMimic', loot: `${family}|${reward2.cls}` });
	} else {
		level.drop(rewardKind(reward2.cat), i2Pos, 'crystalChest')!.sourceClass = reward2.cls;
	}
	set(level, i1Pos % level.w, Math.floor(i1Pos / level.w), Terrain.PEDESTAL);
	set(level, i2Pos % level.w, Math.floor(i2Pos / level.w), Terrain.PEDESTAL);

	level.drop('crystalKey', c, 'itemToSpawn');

	room.entranceDoor().set(DoorType.LOCKED);
	level.drop('ironKey', c, 'itemToSpawn');
}
