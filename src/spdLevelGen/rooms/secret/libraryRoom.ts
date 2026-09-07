/** Port of `levels/rooms/secret/SecretLibraryRoom.java`. `minWidth()`/`minHeight()` overrides
 *  (7/7) live in `room.ts`'s `SECRET_ROOM_META`. Geometry, scroll weights, no-repeat selection,
 *  and concrete scroll payloads are live; only JVM-dependent HashMap iteration order differs. */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, fillEllipseRoom, drawInside } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';

// SecretLibraryRoom's HashMap order is JVM-dependent, but its weights and no-repeat rule are
// stable. Keep the real class pool and weights; `SpdRandom.chances` is the same one-float draw
// Java performs for each scroll.
const SCROLL_CLASSES = [
	'ScrollOfIdentify', 'ScrollOfRemoveCurse', 'ScrollOfMirrorImage', 'ScrollOfRecharging',
	'ScrollOfTeleportation', 'ScrollOfLullaby', 'ScrollOfMagicMapping', 'ScrollOfRage',
	'ScrollOfRetribution', 'ScrollOfTerror', 'ScrollOfTransmutation',
];
const SCROLL_WEIGHTS = [1, 2, 3, 3, 3, 4, 4, 4, 4, 4, 6];

export function paintLibraryRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.BOOKSHELF);
	fillEllipseRoom(level, room, 2, Terrain.EMPTY_SP);

	const entrance = room.entranceDoor();
	if (entrance.x === room.left || entrance.x === room.right) {
		drawInside(level, room, entrance, Math.floor((room.width() - 3) / 2), Terrain.EMPTY_SP);
	} else {
		drawInside(level, room, entrance, Math.floor((room.height() - 3) / 2), Terrain.EMPTY_SP);
	}
	entrance.set(DoorType.HIDDEN);

	const n = SpdRandom.intRange(2, 3);
	const weights = SCROLL_WEIGHTS.slice();
	for (let i = 0; i < n; i++) {
		let pos: number;
		do { pos = level.pointToCell(room.random()); } while (level.map[pos] !== Terrain.EMPTY_SP || level.findHeap(pos));
		const selected = SpdRandom.chances(weights);
		const scroll = SCROLL_CLASSES[selected < 0 ? 0 : selected];
		level.drop('scroll', pos)!.sourceClass = scroll;
		if (selected >= 0) weights[selected] = 0;
	}
}
