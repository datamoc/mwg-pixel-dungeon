import type { Roguelike } from 'mwg';
import type { GameKindCodes } from './spdLevelGen/gameBridge';
import type { WallTileKinds } from './spdLevelGen/wallTiles';
import { MWL_ITEM_FRAMES, MWL_ITEM_LIMITS } from './mwlContent';

export const TILE = 16;
export const VIEW_RADIUS = 8;

//SPD's own terrain ids: wall, floor, plus this port's own concealed-trap id, water, door,
//grass and high grass (DOOR_CLOSED is the same real door, shut: impassable and opaque)
export const WALL = 0;
export const FLOOR = 1;
export const TRAP = 2;
export const WATER = 3;
export const DOOR = 4;
export const GRASS = 5;
export const HIGH_GRASS = 6;
export const DOOR_CLOSED = 7;
export const EMBERS = 8;
/**
 * A cell Java forces unwalkable without changing what it looks like (`LastLevel.create()`'s
 * `passable[i] = avoid[i] = false; solid[i] = true`). No generator places it and no frame mapping
 * knows it: for a ported floor the tile still comes from the paint grid, so a cell in this kind
 * draws exactly as its Java terrain does and only `Level.passable()` changes. The vault is its
 * only user today (its pit cells and its sealed entrance chamber).
 */
export const SOLID = 9;

//the same nine ids by name, for spdLevelGen/gameBridge.ts - the ported generator speaks real
//Terrain.java constants and must not hardcode the ids above, so it maps to names and the codes
//are handed to it from here (see gameBridge's GameKindCodes)
export const GAME_KIND_CODES: GameKindCodes = {
	wall: WALL,
	floor: FLOOR,
	trap: TRAP,
	water: WATER,
	door: DOOR,
	grass: GRASS,
	highGrass: HIGH_GRASS,
	doorClosed: DOOR_CLOSED,
	embers: EMBERS,
};

//the kinds array every Level is built with, in id order - shared by the ported and generic
//paths so both agree on what each id means
//the subset of the ids above that `spdLevelGen/wallTiles.ts`'s rules test against, handed to
//it the same way `GAME_KIND_CODES` is handed to the generator - the numbers live here
export const WALL_TILE_KINDS: WallTileKinds = { wall: WALL, door: DOOR, doorClosed: DOOR_CLOSED, grass: GRASS, highGrass: HIGH_GRASS };

export const TERRAIN_KINDS: Roguelike.TerrainKind[] = [
	{ passable: false, transparent: false }, //WALL
	{ passable: true, transparent: true }, //FLOOR
	{ passable: true, transparent: true }, //TRAP: hidden until sprung
	{ passable: true, transparent: true }, //WATER
	{ passable: true, transparent: true }, //DOOR: open
	{ passable: true, transparent: true }, //GRASS
	{ passable: true, transparent: true }, //HIGH_GRASS
	{ passable: false, transparent: false }, //DOOR_CLOSED
	{ passable: true, transparent: true }, //EMBERS
	//SOLID: see the constant's own comment - Java's per-cell `solid` override, which changes
	//movement but not the tile, so it must stay see-through.
	{ passable: false, transparent: true }, //SOLID
];

//DungeonTileSheet.java: a 16-wide grid of 16x16 tiles, shared by every level's tileset.
//FLOOR = xy(1,1) = cell (0,0); ENTRANCE = GROUND+16 = cell (0,1); EXIT = GROUND+17 =
//cell (1,1); RAISED_WALL = xy(1,7) = cell (0,6); FLAT_DOOR = xy(1,5)+8 = cell (8,4);
//WATER = xy(1,3) = cell (0,2), its next 15 slots the stitched variants. Frame index into a
//SpriteSheet cut at 16px is row*16+col. `entrance`/`exit` are the up/down staircases
//themselves - real SPD art, not the door tile reused for both like this port used to.
//GRASS = GROUND+2 (same row as FLOOR = GROUND+0). HIGH_GRASS has no `directVisuals` entry of
//its own in Java at all - it is drawn as a separate, taller "flat" foliage sprite layered on
//top of a plain GRASS tile beneath it (`DungeonTileSheet.FLAT_HIGH_GRASS`), not a different
//terrain-sheet frame. Reproducing that second sprite layer (plus its own trampled/rustling
//animation) is more than this port's flat single-layer TileMap does; both GRASS and
//HIGH_GRASS render with the same plain grass frame here, so the two are only visually
//distinguished by trampled HIGH_GRASS dropping loot and durably turning into GRASS - see
//`trampleHighGrass`.
//DungeonTileSheet.java: WATER = xy(1, 3), followed by its 15 stitched variants.
//The old value (2*16) pointed into the grass/decorative row, which made water render
//as the wrong terrain family.
//
//The wall/door frames below carry SPD's pseudo-3D look, which is a two-layer trick rather
//than a tileset of stitched edges - see `terrainFrameAt`/`wallFrameAt` for the rules, and
//`DungeonTerrainTilemap`/`DungeonWallsTilemap` for the originals. Row indices are Java's own
//`xy(1,n)` (which is 1-based, so `xy(1,7)` is row 6):
//  RAISED_WALLS   = xy(1,7)  = 6*16   the lit south face of a wall, +1 open right, +2 open left,
//                                     +8 the variant that sits behind a doorway, +16 its ALT art
//  RAISED_DOORS   = xy(1,9)  = 8*16   a door standing in a wall: +0 shut, +1 open,
//                                     +4 the floor-like piece for a door with wall below it
//  WALLS_INTERNAL = xy(1,11) = 10*16  the dark top of a wall mass, +1/+2/+4/+8 per open side
//  WALLS_OVERHANG = xy(1,14) = 13*16  the lip a wall casts onto the cell above it, +1/+2,
//                                     +16/+20 the door-in-a-side-wall variants
//  OTHER_OVERHANG = xy(1,16) = 15*16  +9/+10 the lip above a shut/open door, +12 a door seen
//                                     side-on from the wall above it
//FLAT_WALL (xy(1,5) = 4*16) is deliberately absent: Java only ever draws it through
//`getTileVisual(.., flat=true)`, which is the still-image path for inventory icons -
//`updateMap()` always passes `flat=false`, so no wall on a real floor is ever drawn flat.
export const TERRAIN_FRAME = {
	floor: 0,
	wall: 6 * 16,
	wallAlt: 6 * 16 + 16,
	wallBehindDoor: 6 * 16 + 8,
	wallInternal: 10 * 16,
	wallOverhang: 13 * 16,
	doorSidewaysOverhangOpen: 13 * 16 + 16,
	doorSidewaysOverhangShut: 13 * 16 + 20,
	doorOverhangShut: 15 * 16 + 9,
	doorOverhangOpen: 15 * 16 + 10,
	doorSideways: 15 * 16 + 12,
	raisedDoorShut: 8 * 16,
	raisedDoorOpen: 8 * 16 + 1,
	raisedDoorSideways: 8 * 16 + 4,
	entrance: 1 * 16,
	exit: 1 * 16 + 1,
	door: 4 * 16 + 8,
	water: 2 * 16,
	grass: 2,
};

/** Levels.java trap kinds with Dungeon-referenced damage numbers (depth-scaled where Java scales) */
export type TrapKind = 'toxic' | 'burning' | 'poisonDart' | 'grim' | 'explosive' | 'confusionGas' | 'corrosionGas';
export const TRAP_KINDS: TrapKind[] = ['toxic', 'burning', 'poisonDart', 'grim', 'explosive', 'confusionGas', 'corrosionGas'];

export type GroundItemKind =
	| 'dewdrop'
	// `DriedRose.Petal`: dropped by the floor generator itself rather than by a bag item, so it is
	// a ground kind with no inventory counterpart (the same shape as `dewdrop`).
	| 'petal'
	| 'stone'
	| 'potion'
	| 'scroll'
	| 'meat'
	| 'gold'
	| 'armor'
	| 'wand'
	| 'food'
	| 'seed'
	| 'darkGold'
	| 'dwarfToken'
	| 'amulet'
	| 'ring'
	| 'crystalKey'
	| 'ironKey'
	| 'goldenKey'
	| 'bomb'
	| 'corpseDust'
	| 'candle'
	| 'embers'
	| 'ankh'
	| 'stylus'
	| 'brokenSeal'
	| 'honeypot'
	| 'alchemize'
	| 'bag'
	| 'sandBag';

export const GROUND_ITEM_KINDS: readonly GroundItemKind[] = [
	'dewdrop', 'petal', 'stone', 'potion', 'scroll', 'meat', 'gold', 'armor', 'wand', 'food', 'seed',
	'darkGold', 'dwarfToken', 'amulet', 'ring', 'crystalKey', 'ironKey', 'goldenKey', 'bomb',
	'corpseDust', 'candle', 'embers', 'ankh', 'stylus', 'brokenSeal', 'honeypot', 'alchemize', 'bag', 'sandBag',
];

/** `ItemSpriteSheet` frame metadata is authored in MWL; this adapter validates the closed
 * ground-kind union and leaves texture loading/rendering to the scene. */
export const ITEM_FRAME: Record<GroundItemKind, number> = (() => {
	const frames = {} as Record<GroundItemKind, number>;
	for (const kind of GROUND_ITEM_KINDS) {
		const frame = MWL_ITEM_FRAMES[kind];
		if (frame === undefined) throw new Error(`MWL itemFrames is missing ground kind: ${kind}`);
		frames[kind] = frame;
	}
	return frames;
})();
/** `Waterskin.MAX_VOLUME` is item metadata authored in MWL. */
export const WATERSKIN_MAX = MWL_ITEM_LIMITS.waterskin ?? (() => { throw new Error('MWL itemLimits is missing waterskin'); })();
