/**
 * Port of `levels/rooms/standard/CellBlockRoom.java` (Prison-region `StandardRoom`, index 6 in
 * `StandardRoom.chances[6..10]`). Fully RNG-faithful - no `Generator`/mob dependency.
 *
 * Two RNG subtleties, both of the kind that has repeatedly desynced this port before:
 *
 * 1. `Rect internal = new EmptyRoom();` constructs a real `EmptyRoom`, purely to use as a
 *    scratch rectangle. `EmptyRoom extends StandardRoom`, whose `{ setSizeCat(); }` instance
 *    initializer burns one `Random.chances(sizeCatProbs())` float per construction - so this
 *    line makes a draw even though the rolled size is immediately overwritten by `set(...)`.
 *    Same pattern as `CrystalPathRoom`/`CrystalChoiceRoom`/`MagicalFireRoom`/`SentryRoom`
 *    (PORT_COVERAGE.md sub-pass 12, finding 9).
 * 2. `topBottomDoors` is a boxed `Boolean` with three states - true, false, and **null** (the
 *    `rows == 1 && cols == 1` case), and the null case takes a `Random.Int(4)` draw per cell
 *    of the loop, not one overall. The `Random.Int(2)` for the initial value is only drawn on
 *    the `rows == cols` tie.
 *
 * A third trap, and the one that actually bit this port first: `internal` is DECLARED as
 * `com.watabou.utils.Rect`, but it holds an `EmptyRoom`, and `width()`/`height()` are virtual -
 * so `internal.width()` dispatches to `Room.width()` (`super.width() + 1`, i.e. INCLUSIVE), not
 * `Rect.width()`. The declared type is a red herring. This is the exact mirror of the
 * `mergeRooms` bug in sub-pass 11, where a genuinely plain `Rect` local was wrongly given
 * `Room`'s `+1`; here a `Room` in a `Rect`-typed variable must keep it.
 */
import { Room, DoorType } from '../../room';
import { PaintLevel, Terrain, fillRoom, fillRoomInset, fillXY, set } from '../../paintLevel';
import { SpdRandom } from '../../../spdRng';

export function paintCellBlockRoom(level: PaintLevel, room: Room): void {
	fillRoom(level, room, Terrain.WALL);
	fillRoomInset(level, room, 1, Terrain.EMPTY);
	fillRoomInset(level, room, 3, Terrain.WALL);

	// `new EmptyRoom()` as a scratch Rect - burns one sizeCat chances() float (see header).
	new Room('standard', 'empty');
	const internal = { left: room.left + 3, top: room.top + 3, right: room.right - 3, bottom: room.bottom - 3 };
	// Inclusive, via Room.width()/height()'s virtual override - see the header.
	const iW = internal.right - internal.left + 1;
	const iH = internal.bottom - internal.top + 1;

	let rows = Math.floor((iW - 1) / 3);
	let cols = Math.floor((iH - 1) / 3);

	if (iH === 11) cols--;
	if (iW === 11) rows--;

	const w = Math.floor((iW - 2 - (rows - 1)) / rows);
	const h = Math.floor((iH - 2 - (cols - 1)) / cols);

	const wSpacing = (rows * w + (rows + 1)) === iW ? 1 : 2;
	const hSpacing = (cols * h + (cols + 1)) === iH ? 1 : 2;

	// Java's `Boolean` (nullable): true = doors on top/bottom, false = left/right, null = the
	// 1x1 case, which instead rolls a random side per cell.
	let topBottomDoors: boolean | null = rows > cols || (rows === cols && SpdRandom.int(2) === 0);

	if (rows === 1 || cols === 1) {
		topBottomDoors = !topBottomDoors;
	}

	if (rows === 1 && cols === 1) {
		topBottomDoors = null;
	}

	for (let x = 0; x < rows; x++) {
		for (let y = 0; y < cols; y++) {
			// no center room
			if (rows === 3 && cols === 3 && x === 1 && y === 1) continue;

			const cellLeft = internal.left + 1 + (x * (w + wSpacing));
			const cellTop = internal.top + 1 + (y * (h + hSpacing));

			fillXY(level, cellLeft, cellTop, w, h, Terrain.EMPTY_SP);

			if (topBottomDoors === null) {
				switch (SpdRandom.int(4)) {
					case 0: set(level, internal.left, internal.top + Math.floor(iH / 2), Terrain.DOOR); break;
					case 1: set(level, internal.left + Math.floor(iW / 2), internal.top, Terrain.DOOR); break;
					case 2: set(level, internal.right, internal.top + Math.floor(iH / 2), Terrain.DOOR); break;
					case 3: set(level, internal.left + Math.floor(iW / 2), internal.bottom, Terrain.DOOR); break;
				}
			} else if (topBottomDoors) {
				if (y === 0) {
					set(level, cellLeft + Math.floor(w / 2), cellTop - 1, Terrain.DOOR);
				} else if (y === cols - 1) {
					set(level, cellLeft + Math.floor(w / 2) - 1, cellTop + h, Terrain.DOOR);
				} else if (x === 0) {
					set(level, cellLeft - 1, cellTop + Math.floor(h / 2) - 1, Terrain.DOOR);
				} else if (x === rows - 1) {
					set(level, cellLeft + w, cellTop + Math.floor(h / 2), Terrain.DOOR);
				}
			} else {
				if (x === 0) {
					set(level, cellLeft - 1, cellTop + Math.floor(h / 2) - 1, Terrain.DOOR);
				} else if (x === rows - 1) {
					set(level, cellLeft + w, cellTop + Math.floor(h / 2), Terrain.DOOR);
				} else if (y === 0) {
					set(level, cellLeft + Math.floor(w / 2), cellTop - 1, Terrain.DOOR);
				} else if (y === cols - 1) {
					set(level, cellLeft + Math.floor(w / 2) - 1, cellTop + h, Terrain.DOOR);
				}
			}
		}
	}

	for (const door of room.connected.values()) door?.set(DoorType.REGULAR);
}
