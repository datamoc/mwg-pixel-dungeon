/**
 * `HallsBossLevel`'s two `CustomTilemap`s - `CenterPieceVisuals` and `CenterPieceWalls` - the art
 * over Yog-Dzewa's own arena, transcribed from tag `v3.3.8`.
 *
 * Both draw from `Assets.Environment.HALLS_SP` (`halls_special.png`), the sheet this port already
 * loads for the vault and the Halls demon spawner, and both are *fixed* maps: the arena's centre
 * piece is one 9x8 block of frames placed at `(ROOM_LEFT, ROOM_TOP+1)` on the floor layer and one
 * 9x8 block at `(ROOM_LEFT, ROOM_TOP)` on the wall layer (Java declares `tileH = 9` for the walls
 * map, but its array holds eight rows - `Tilemap.map(data, tileW)` takes the height from the data,
 * so the ninth is never drawn and the two maps differ by one row, which is exactly how Java paints
 * them over each other).
 *
 * Each map carries one *state* variant, keyed on `Dungeon.level.map[exit()] == Terrain.EXIT`: at
 * `build()` the exit cell is left `EMPTY_SP` by the arena fill (the level's own trigger needs
 * `map[exit()] != EXIT`), so during the fight the plain maps are drawn, and `unseal()` - which
 * restores the exit tile and calls `updateState()` on both - swaps in a portal/archway variant.
 * This port never runs `unseal()` (it descends the instant Yog dies, see `PORT_COVERAGE.md`), so
 * `opened` is always false here and the variant frames are transcribed but unreachable until
 * `unseal()` lands.
 */
import { placeRectInto } from './customTilemapLayer';

/** `HallsBossLevel.ROOM_LEFT` (`WIDTH/2 - 4`, on a 32-wide floor). */
export const HALLS_ROOM_LEFT = 12;
/** `HallsBossLevel.ROOM_TOP`. */
export const HALLS_ROOM_TOP = 8;

/** `CenterPieceVisuals.map`, verbatim - 9 wide, 8 rows (72 entries). */
const CENTER_PIECE: readonly number[] = [
	8, 9, 10, 11, 11, 11, 12, 13, 14,
	16, 17, 18, 27, 19, 27, 20, 21, 22,
	24, 25, 26, 19, 19, 19, 28, 29, 30,
	24, 25, 26, 19, 19, 19, 28, 29, 30,
	24, 25, 26, 19, 19, 19, 28, 29, 30,
	24, 25, 34, 35, 35, 35, 34, 29, 30,
	40, 41, 36, 36, 36, 36, 36, 40, 41,
	48, 49, 36, 36, 36, 36, 36, 48, 49,
];

/** `CenterPieceWalls.map`, verbatim - 9 wide, 8 rows, blank except the two pillar rows. */
const CENTER_WALLS: readonly number[] = [
	-1, -1, -1, -1, -1, -1, -1, -1, -1,
	-1, -1, -1, -1, -1, -1, -1, -1, -1,
	-1, -1, -1, -1, -1, -1, -1, -1, -1,
	-1, -1, -1, -1, -1, -1, -1, -1, -1,
	-1, -1, -1, -1, -1, -1, -1, -1, -1,
	-1, -1, -1, -1, -1, -1, -1, -1, -1,
	32, 33, -1, -1, -1, -1, -1, 32, 33,
	40, 41, -1, -1, -1, -1, -1, 40, 41,
];

const CENTER_WIDTH = 9;
const CENTER_HEIGHT = 8;

/** `CenterPieceVisuals.updateState()`: the plain block, or - once `unseal()` has restored the exit
 *  tile - the portal (`19`) with its two flanking tiles (`31`) in place of the first row's centre. */
export function hallsCenterPieceFrames(opened: boolean): number[] {
	const data = [...CENTER_PIECE];
	if (opened) {
		data[4] = 19;
		data[12] = 31;
		data[14] = 31;
	}
	return data;
}

/** `CenterPieceWalls.updateState()`: the plain block, or - once the exit is open - the archway
 *  (`1`/`0`/`2`) over it, with `23` beneath at the door's own row. */
export function hallsCenterWallFrames(opened: boolean): number[] {
	const data = [...CENTER_WALLS];
	if (opened) {
		data[3] = 1;
		data[4] = 0;
		data[5] = 2;
		data[13] = 23;
	}
	return data;
}

/** `CenterPieceVisuals`' layer: `pos(ROOM_LEFT, ROOM_TOP+1)`, so rows `ROOM_TOP+1 .. ROOM_TOP+8`. */
export function hallsCenterPieceLayer(levelWidth: number, levelHeight: number, opened: boolean): number[] {
	return placeRectInto(hallsCenterPieceFrames(opened), CENTER_WIDTH, CENTER_HEIGHT,
		HALLS_ROOM_LEFT, HALLS_ROOM_TOP + 1, levelWidth, levelHeight);
}

/** `CenterPieceWalls`' layer: `pos(ROOM_LEFT, ROOM_TOP)`, one row higher - the pillars stand above
 *  the floor block, which is why Java draws them on the wall side. */
export function hallsCenterWallLayer(levelWidth: number, levelHeight: number, opened: boolean): number[] {
	return placeRectInto(hallsCenterWallFrames(opened), CENTER_WIDTH, CENTER_HEIGHT,
		HALLS_ROOM_LEFT, HALLS_ROOM_TOP, levelWidth, levelHeight);
}
