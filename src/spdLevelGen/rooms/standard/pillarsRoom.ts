/**
 * Port of `levels/rooms/standard/PillarsRoom.java` (Prison-region `StandardRoom`, index 5 in
 * `StandardRoom.chances[6..10]`). Fully RNG-faithful - no `Generator`/mob dependency.
 *
 * Draw counts, which are shape-dependent:
 * - 2-pillar branch: one `Random.Int(2)` for the branch test itself (only when
 *   `minDim != 7` AND `sizeCat == NORMAL`; short-circuited away when `minDim == 7`), then one
 *   `Random.Int(2)` for the axis and one `Random.IntRange` for the position.
 * - 4-pillar branch: one `Random.Float()` for the skew.
 *
 * The skew arithmetic is all 32-bit `float` in Java (`xSpaces`/`ySpaces`/`minSpaces`/
 * `percentSkew` are declared `float`), and `Math.round(float)` is the float overload, so this
 * uses `Math.fround`/`javaRoundFloat` at each of Java's narrowing points. Unlike the builder's
 * angle math (where the same treatment turned out to be a no-op for the tested seeds), here a
 * one-off in `percentSkew` moves a pillar by a whole tile, so it is directly observable.
 */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, fillXY } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';
import { javaRoundFloat } from '../../builder';

export function paintPillarsRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY);

	for (const door of room.connected.values()) door?.set(DoorType.REGULAR);

	const minDim = Math.min(room.width(), room.height());
	const isNormal = room.sizeCat?.name === 'NORMAL';

	// 2 pillars
	if (minDim === 7 || (isNormal && SpdRandom.int(2) === 0)) {
		const pillarInset = minDim >= 11 ? 2 : 1;
		const pillarSize = Math.floor((minDim - 3) / 2) - pillarInset;

		let pillarX: number;
		let pillarY: number;
		if (SpdRandom.int(2) === 0) {
			pillarX = SpdRandom.intRange(room.left + 1 + pillarInset, room.right - pillarSize - pillarInset);
			pillarY = room.top + 1 + pillarInset;
		} else {
			pillarX = room.left + 1 + pillarInset;
			pillarY = SpdRandom.intRange(room.top + 1 + pillarInset, room.bottom - pillarSize - pillarInset);
		}

		// first pillar
		fillXY(level, pillarX, pillarY, pillarSize, pillarSize, Terrain.WALL);

		// invert for second pillar
		pillarX = room.right - (pillarX - room.left + pillarSize - 1);
		pillarY = room.bottom - (pillarY - room.top + pillarSize - 1);
		fillXY(level, pillarX, pillarY, pillarSize, pillarSize, Terrain.WALL);

	// 4 pillars
	} else {
		const pillarInset = minDim >= 12 ? 2 : 1;
		const pillarSize = Math.floor((minDim - 6) / (pillarInset + 1));

		const xSpaces = Math.fround(room.width() - 2 * pillarInset - pillarSize - 2);
		const ySpaces = Math.fround(room.height() - 2 * pillarInset - pillarSize - 2);
		const minSpaces = Math.min(xSpaces, ySpaces);

		const percentSkew = Math.fround(javaRoundFloat(Math.fround(SpdRandom.float() * minSpaces)) / minSpaces);

		// top-left, skews right
		fillXY(level, room.left + 1 + pillarInset + javaRoundFloat(Math.fround(percentSkew * xSpaces)), room.top + 1 + pillarInset, pillarSize, pillarSize, Terrain.WALL);

		// top-right, skews down
		fillXY(level, room.right - pillarSize - pillarInset, room.top + 1 + pillarInset + javaRoundFloat(Math.fround(percentSkew * ySpaces)), pillarSize, pillarSize, Terrain.WALL);

		// bottom-right, skews left
		fillXY(level, room.right - pillarSize - pillarInset - javaRoundFloat(Math.fround(percentSkew * xSpaces)), room.bottom - pillarSize - pillarInset, pillarSize, pillarSize, Terrain.WALL);

		// bottom-left, skews up
		fillXY(level, room.left + 1 + pillarInset, room.bottom - pillarSize - pillarInset - javaRoundFloat(Math.fround(percentSkew * ySpaces)), pillarSize, pillarSize, Terrain.WALL);
	}
}
