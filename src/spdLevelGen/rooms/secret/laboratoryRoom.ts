/** Port of `levels/rooms/secret/SecretLaboratoryRoom.java`. `center()`'s parity roll is ported in
 *  `room.ts`. The two `EnergyCrystal` position-retry loops and the potion-count `Random.IntRange(2,3)`
 *  are real/portable; potion weights/no-repeat selection and concrete payloads are live too.
 *  Only JVM-dependent HashMap iteration order differs. `EnergyCrystal().random()`'s own tier
 *  roll is Generator/item-subsystem internal: the two calls each make their real
 *  `Random.IntRange(4, 6)` draw. */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, set } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';

// See SecretLibraryRoom: Java's HashMap iteration order is not portable, but this preserves the
// real potion classes, weights, and no-repeat pool while retaining one chances() draw per item.
const POTION_CLASSES = [
	'PotionOfHealing', 'PotionOfMindVision', 'PotionOfFrost', 'PotionOfLiquidFlame',
	'PotionOfToxicGas', 'PotionOfHaste', 'PotionOfInvisibility', 'PotionOfLevitation',
	'PotionOfParalyticGas', 'PotionOfPurity', 'PotionOfExperience',
];
const POTION_WEIGHTS = [1, 2, 3, 3, 3, 4, 4, 4, 4, 4, 6];

function emptySpPos(level: PaintLevel, room: Room): number {
	let pos: number;
	do { pos = level.pointToCell(room.random()); } while (level.map[pos] !== Terrain.EMPTY_SP || level.findHeap(pos));
	return pos;
}

export function paintLaboratoryRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY_SP);

	room.entranceDoor().set(DoorType.HIDDEN);

	const c = room.center();
	set(level, c.x, c.y, Terrain.ALCHEMY);
	// Blob.seed(Alchemy) - no blob system exists here to seed; no Random.* call in Java anyway.

	// Two `new EnergyCrystal().random()` drops. `EnergyCrystal.random()` is
	// `quantity = Random.IntRange(4, 6)` - one real level-stream draw each, evaluated after that
	// crystal's own position loop. Previously skipped as a "Generator-internal tier roll", which
	// it is not (EnergyCrystal isn't generated through a Generator deck at all).
	for (let i = 0; i < 2; i++) {
		const pos = emptySpPos(level, room);
		SpdRandom.intRange(4, 6);
		level.drop('energyCrystal', pos);
	}

	const n = SpdRandom.intRange(2, 3);
	const weights = POTION_WEIGHTS.slice();
	for (let i = 0; i < n; i++) {
		const pos = emptySpPos(level, room);
		const selected = SpdRandom.chances(weights);
		const potion = POTION_CLASSES[selected < 0 ? 0 : selected];
		level.drop('potion', pos)!.sourceClass = potion;
		if (selected >= 0) weights[selected] = 0;
	}
}
