/**
 * `RitualSiteRoom.RitualMarker` - the 3x3 marker stamped over the elemental-embers quest site,
 * transcribed from tag `v3.3.8`.
 *
 * It draws from `Assets.Environment.PRISON_QUEST` (`prison_quest.png`), a **4-column** atlas of
 * 16px tiles, through `CustomTilemap.mapSimpleImage(0, 0, 64)`: that helper walks `x` from 0 and
 * wraps at `tileW`, incrementing `y`, and indexes `x + (texW/SIZE) * y` - so a 3x3 block over a
 * 4-wide sheet takes frames `0,1,2 / 4,5,6 / 8,9,10`, skipping the atlas's fourth column, *not*
 * the contiguous `0..8` a naive reading would pick.
 *
 * `pos(center().x - 1, center().y - 1)`, and the room paints those same nine cells
 * `Terrain.CUSTOM_DECO_EMPTY` (`EMPTY_DECO` here, see `paintRitualSiteRoom`). The marker answers
 * its own name/desc for *every* one of its cells, unconditionally - unlike `ArenaVisuals`, it does
 * not key on the terrain.
 */
import { placeRectInto } from './customTilemapLayer';

/** `mapSimpleImage(0, 0, 64)` over a 3x3 block on a 4-column sheet: the atlas's fourth column of
 *  each row is skipped, so the frames are these nine rather than `0..8`. */
export const RITUAL_MARKER_FRAMES: readonly number[] = [0, 1, 2, 4, 5, 6, 8, 9, 10];

/** `RitualMarker.name()`/`desc()` - one pair for the whole marker, taken for every cell of it. */
export const RITUAL_MARKER_NAME_KEY = 'levels.rooms.standard.ritualsiteroom$ritualmarker.name';
export const RITUAL_MARKER_DESC_KEY = 'levels.rooms.standard.ritualsiteroom$ritualmarker.desc';

/** The marker's own rect: 3x3, its top-left one cell up and left of the ritual cell. */
export function ritualMarkerRect(ritualPos: number, width: number): { left: number; top: number } {
	return { left: (ritualPos % width) - 1, top: Math.floor(ritualPos / width) - 1 };
}

/** The marker's layer, which is blank everywhere but its own 3x3. `ritualPos` is a raw cell index
 *  on the floor the candles were placed on; `-1` (no site on this floor) draws nothing. */
export function ritualMarkerLayer(levelWidth: number, levelHeight: number, ritualPos: number): number[] {
	if (ritualPos < 0) return new Array<number>(levelWidth * levelHeight).fill(-1);
	const { left, top } = ritualMarkerRect(ritualPos, levelWidth);
	return placeRectInto(RITUAL_MARKER_FRAMES, 3, 3, left, top, levelWidth, levelHeight);
}

/** Whether a cell falls inside the marker's own rect - the boundary `WndInfoCell` would consult the
 *  tilemap across. */
export function insideRitualMarker(ritualPos: number, width: number, x: number, y: number): boolean {
	if (ritualPos < 0) return false;
	const { left, top } = ritualMarkerRect(ritualPos, width);
	return x >= left && x < left + 3 && y >= top && y < top + 3;
}
