/**
 * `CityBossLevel`'s two `CustomTilemap`s, transcribed from tag `v3.3.8`:
 * `CustomGroundVisuals` (the exit-hall stairs, pillar bases, skull piles, ground tiles,
 * throne carpets) and `CustomWallVisuals` (pillar tops, skull tops, the stairs' shadow,
 * throne archway). Both draw from `Assets.Environment.CITY_BOSS` (`city_boss.png`, an
 * 8-wide grid of 16px tiles) rather than the City tileset.
 *
 * Transcription notes, each load-bearing:
 * - Java's `data[++i]` cursor idiom is kept verbatim: the loop index advances inside the
 *   iteration (a pillar pair, the 7-wide stitching/stairs rows, the 3-wide throne rows),
 *   then the `for` step advances once more. Rewriting it as index arithmetic is where the
 *   off-by-ones hide.
 * - Adjacent-cell reads (`map[i-1]`, `map[i+1]`, `map[i±tileW]`) are raw flat-array reads
 *   with no row clamping, exactly like Java's `int[]` - at a row edge they see the
 *   neighbouring row's cell, which is what Java's ground-tile stitching reads too.
 * - `SIGN` is read wherever Java reads `CUSTOM_DECO`: it is this port's stand-in for that
 *   tile (the throne over the `fill(arena, 6, CUSTOM_DECO)` 1x1), the same alias the Caves
 *   gate uses.
 * - `stairsTop` is the first `EXIT` cell scanning `tileW..tileW*22`: on Java's map that is
 *   `(4,5)` (the `EXIT` block's top-left), so the 7x7 stairs run covers rows 5..11 and the
 *   shadow run rows 1..8. Both loops assume it exists - it always does on this floor, and
 *   the guard below is dead code on any real map (Java would crash there instead).
 * - `name`/`desc` belong to the ground map only (`CustomWallVisuals` overrides neither),
 *   and only where that map draws something: `WndInfoCell` consults a custom tilemap only
 *   where its `image()` is non-null, and `image()` is null on `NULL_TILE` cells. The three
 *   named branches are upper `STATUE` (Halls skull-pile strings), the throne
 *   (`throne_name`/`throne_desc`) and the summoning pedestals. Everything else falls
 *   through to the terrain path - including upper `EXIT` (whose fall-through answer,
 *   `exit_name` + the region exit desc, is text-identical to addressing it here) and upper
 *   `EMPTY_DECO`, whose `""` desc suppresses the description exactly like Java rather
 *   than showing the terrain's deco line.
 * - One substitution, stated: the upper-`EXIT` desc Java addresses is HallsLevel's
 *   `exit_desc`, whose key this port's generated catalogue predates (see the locale-set
 *   item) - the fall-through answers the City's own `exit_desc` ("A ramp leads down...")
 *   instead. Same screen position, region-appropriate wording.
 */
import { Terrain } from './paintLevel';
import { NULL_TILE } from './customTilemapLayer';

/** `CityBossLevel`'s floor size: the visuals' own `tileW`/`tileH` (15x48). */
export const CITY_BOSS_WIDTH = 15;
export const CITY_BOSS_HEIGHT = 48;
/** `CustomGroundVisuals.STAIR_ROWS`: the dressed exit-stair run is 7 rows of 7. */
const STAIR_ROWS = 7;

const GROUND_TILES: ReadonlySet<number> = new Set([
	Terrain.EMPTY, Terrain.EMPTY_DECO, Terrain.EMBERS, Terrain.GRASS,
	Terrain.HIGH_GRASS, Terrain.FURROWED_GRASS,
]);

/** `CustomGroundVisuals.create()`: the full-floor frame map, `NULL_TILE` where Java leaves `-1`. */
export function cityGroundFrames(terrain: ArrayLike<number>, w: number, h: number): number[] {
	const data = new Array<number>(w * h).fill(NULL_TILE);
	const map = terrain;
	let stairsTop = -1;
	//upper part of the level, mostly demon halls tiles
	for (let i = w; i < w * 22; i++) {
		if (map[i] === Terrain.EXIT && stairsTop === -1) {
			stairsTop = i;
		}
		//pillars
		if (map[i] === Terrain.WALL && map[i - w] === Terrain.CHASM) {
			data[i] = 13 * 8 + 6;
			data[++i] = 13 * 8 + 7;
		} else if (map[i] === Terrain.WALL && map[i - w] === Terrain.WALL) {
			data[i] = 14 * 8 + 6;
			data[++i] = 14 * 8 + 7;
		} else if (i > w && map[i] === Terrain.CHASM && map[i - w] === Terrain.WALL) {
			data[i] = 15 * 8 + 6;
			data[++i] = 15 * 8 + 7;
			//imp's pedestal
		} else if (map[i] === Terrain.PEDESTAL) {
			data[i] = 12 * 8 + 5;
			//skull piles
		} else if (map[i] === Terrain.STATUE) {
			data[i] = 15 * 8 + 5;
			//ground tiles
		} else if (GROUND_TILES.has(map[i]!)) {
			//final ground stitching with city tiles
			if (Math.floor(i / w) === 21) {
				data[i] = 11 * 8 + 0;
				data[++i] = 11 * 8 + 1;
				data[++i] = 11 * 8 + 2;
				data[++i] = 11 * 8 + 3;
				data[++i] = 11 * 8 + 4;
				data[++i] = 11 * 8 + 5;
				data[++i] = 11 * 8 + 6;
			} else {
				//regular ground tiles
				if (map[i - 1] === Terrain.CHASM) {
					data[i] = 12 * 8 + 1;
				} else if (map[i + 1] === Terrain.CHASM) {
					data[i] = 12 * 8 + 3;
				} else if (map[i] === Terrain.EMPTY_DECO) {
					data[i] = 12 * 8 + 4;
				} else {
					data[i] = 12 * 8 + 2;
				}
			}
			//otherwise no tile here
		} else {
			data[i] = NULL_TILE;
		}
	}
	//custom for stairs
	if (stairsTop >= 0) {
		for (let i = 0; i < STAIR_ROWS; i++) {
			for (let j = 0; j < 7; j++) {
				data[stairsTop + j] = (i + 4) * 8 + j;
			}
			stairsTop += w;
		}
	}
	//lower part: statues, pedestals, and carpets
	for (let i = w * 22; i < w * h; i++) {
		//pedestal spawners
		if (map[i] === Terrain.PEDESTAL) {
			data[i] = 13 * 8 + 4;
			//statues that should face left instead of right
		} else if (map[i] === Terrain.STATUE && i % w > 7) {
			data[i] = 15 * 8 + 4;
			//carpet tiles
		} else if (map[i] === Terrain.EMPTY_SP) {
			//top row of DK's throne
			if (map[i + 1] === Terrain.EMPTY_SP && map[i + w] === Terrain.EMPTY_SP) {
				data[i] = 13 * 8 + 1;
				data[++i] = 13 * 8 + 2;
				data[++i] = 13 * 8 + 3;
				//mid row of DK's throne
			} else if (map[i + 1] === Terrain.SIGN) {
				data[i] = 14 * 8 + 1;
				data[++i] = 14 * 8 + 2;
				data[++i] = 14 * 8 + 3;
				//bottom row of DK's throne
			} else if (map[i + 1] === Terrain.EMPTY_SP && map[i - w] === Terrain.EMPTY_SP) {
				data[i] = 15 * 8 + 1;
				data[++i] = 15 * 8 + 2;
				data[++i] = 15 * 8 + 3;
				//otherwise entrance carpet
			} else if (map[i - w] !== Terrain.EMPTY_SP) {
				data[i] = 13 * 8 + 0;
			} else if (map[i + w] !== Terrain.EMPTY_SP) {
				data[i] = 15 * 8 + 0;
			} else {
				data[i] = 14 * 8 + 0;
			}
			//otherwise no tile here
		} else {
			data[i] = NULL_TILE;
		}
	}
	return data;
}

/** `CustomWallVisuals.create()`: the wall-layer frame map over the same floor. */
export function cityWallFrames(terrain: ArrayLike<number>, w: number, h: number): number[] {
	const data = new Array<number>(w * h).fill(NULL_TILE);
	const map = terrain;
	let shadowTop = -1;
	//upper part of the level, mostly demon halls tiles
	for (let i = w; i < w * 21; i++) {
		if (map[i] === Terrain.EXIT && shadowTop === -1) {
			shadowTop = i - w * 4;
		}
		//pillars
		if (map[i] === Terrain.CHASM && map[i + w] === Terrain.WALL) {
			data[i] = 12 * 8 + 6;
			data[++i] = 12 * 8 + 7;
		} else if (map[i] === Terrain.WALL && map[i - w] === Terrain.CHASM) {
			data[i] = 13 * 8 + 6;
			data[++i] = 13 * 8 + 7;
			//skull tops
		} else if (map[i + w] === Terrain.STATUE) {
			data[i] = 14 * 8 + 5;
			//otherwise no tile here
		} else {
			data[i] = NULL_TILE;
		}
	}
	//custom shadow for stairs
	if (shadowTop >= 0) {
		for (let i = 0; i < 8; i++) {
			if (i < 4) {
				data[shadowTop] = i * 8 + 0;
				data[shadowTop + 1] = data[shadowTop + 2] = data[shadowTop + 3] = data[shadowTop + 4] =
					data[shadowTop + 5] = data[shadowTop + 6] = i * 8 + 1;
				data[shadowTop + 7] = i * 8 + 2;
			} else {
				const j = i - 4;
				data[shadowTop] = j * 8 + 3;
				data[shadowTop + 1] = data[shadowTop + 2] = data[shadowTop + 3] = data[shadowTop + 4] =
					data[shadowTop + 5] = data[shadowTop + 6] = j * 8 + 4;
				data[shadowTop + 7] = j * 8 + 5;
			}
			shadowTop += w;
		}
	}
	//lower part. Statues and DK's throne
	for (let i = w * 21; i < w * h; i++) {
		//Statues that need to face left instead of right
		if (map[i] === Terrain.STATUE && i % w > 7) {
			data[i - w] = 14 * 8 + 4;
		} else if (map[i] === Terrain.SIGN) {
			data[i - w] = 13 * 8 + 5;
		}
		//always no tile here (as the above statements are modifying previous tiles)
		data[i] = NULL_TILE;
	}
	return data;
}

/** The ground layer over a `w*h` floor: `cityGroundFrames` at Java's own `(0,0,w,h)` rect. */
export function cityGroundLayer(w: number, h: number, terrain: ArrayLike<number>): number[] {
	return cityGroundFrames(terrain, w, h);
}

/** The wall layer over a `w*h` floor. */
export function cityWallLayer(w: number, h: number, terrain: ArrayLike<number>): number[] {
	return cityWallFrames(terrain, w, h);
}

/**
 * `CustomGroundVisuals.name()`: upper `STATUE` answers the skull-pile name, lower
 * `CUSTOM_DECO` (this port's `SIGN`) the throne, lower `PEDESTAL` the summoning
 * pedestal - and only where the ground map draws (see the header). Everywhere else
 * (including upper `EXIT` and `EMPTY_DECO`, whose answers live in `desc` or nowhere)
 * this returns `undefined` so the terrain path speaks.
 */
export function cityGroundNameKey(terrain: ArrayLike<number>, frames: ArrayLike<number>, w: number, cell: number): string | undefined {
	if (frames[cell] === NULL_TILE) return undefined;
	if (cell < w * 22) {
		if (terrain[cell] === Terrain.STATUE) return 'levels.hallslevel.statue_name';
	} else {
		if (terrain[cell] === Terrain.SIGN) return 'levels.citybosslevel.throne_name';
		if (terrain[cell] === Terrain.PEDESTAL) return 'levels.citybosslevel.summoning_name';
	}
	return undefined;
}

/**
 * `CustomGroundVisuals.desc()`: upper `EXIT` answers the exit desc (the City's own key -
 * Java addresses HallsLevel's, whose key this catalogue predates, so the fall-through
 * would print the identical region text anyway; see the header), upper `STATUE` the
 * skull-pile desc, upper `EMPTY_DECO` suppresses the description (`""`, exactly like
 * Java), lower `CUSTOM_DECO` the throne desc, lower `PEDESTAL` the summoning desc.
 */
export function cityGroundDescKey(terrain: ArrayLike<number>, frames: ArrayLike<number>, w: number, cell: number): string | undefined {
	if (frames[cell] === NULL_TILE) return undefined;
	if (cell < w * 22) {
		if (terrain[cell] === Terrain.EXIT) return 'levels.citylevel.exit_desc';
		if (terrain[cell] === Terrain.STATUE) return 'levels.hallslevel.statue_desc';
		if (terrain[cell] === Terrain.EMPTY_DECO) return '';
	} else {
		if (terrain[cell] === Terrain.SIGN) return 'levels.citybosslevel.throne_desc';
		if (terrain[cell] === Terrain.PEDESTAL) return 'levels.citybosslevel.summoning_desc';
	}
	return undefined;
}
