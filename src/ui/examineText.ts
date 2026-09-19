import { t } from '../i18n/index';
import type { Region } from '../genericDungeon';
import { Terrain } from '../spdLevelGen/paintLevel';
import { DOOR, DOOR_CLOSED, GRASS, HIGH_GRASS, WALL, WATER } from '../dungeonConstants';
import { RITUAL_MARKER_DESC_KEY, RITUAL_MARKER_NAME_KEY } from '../spdLevelGen/ritualMarkerVisuals';

/**
 * `examineTile`'s per-region `tileName`/`tileDesc` overrides, each checked directly against
 * its real `*Level.java` - every branch below is a literal `t('...')` call, deliberately
 * never a template string, because `tools/i18n-extract.mjs` only scrapes literal string
 * arguments (see its own doc comment) and a computed key would silently resolve to nothing
 * at runtime, printing the raw key text instead of a translation.
 */
export function examineWaterName(region: Region): string {
	//every region overrides water_name
	switch (region) {
		case 'sewers': return t('levels.sewerlevel.water_name');
		case 'prison': return t('levels.prisonlevel.water_name');
		case 'caves': return t('levels.caveslevel.water_name');
		case 'city': return t('levels.citylevel.water_name');
		case 'halls': return t('levels.hallslevel.water_name');
	}
}
/** `grass_name`: only CavesLevel/HallsLevel override it */
export function examineGrassName(region: Region): string {
	if (region === 'caves') return t('levels.caveslevel.grass_name');
	if (region === 'halls') return t('levels.hallslevel.grass_name');
	return t('levels.level.grass_name');
}
/** `high_grass_name`: every region but Sewers/Prison overrides it */
export function examineHighGrassName(region: Region): string {
	if (region === 'caves') return t('levels.caveslevel.high_grass_name');
	if (region === 'city') return t('levels.citylevel.high_grass_name');
	if (region === 'halls') return t('levels.hallslevel.high_grass_name');
	return t('levels.level.high_grass_name');
}
/** `entrance_desc`: only CavesLevel/CityLevel override it */
export function examineEntranceDesc(region: Region): string {
	if (region === 'caves') return t('levels.caveslevel.entrance_desc');
	if (region === 'city') return t('levels.citylevel.entrance_desc');
	return t('levels.level.entrance_desc');
}
/** `exit_desc`: only CavesLevel/CityLevel override it */
export function examineExitDesc(region: Region): string {
	if (region === 'caves') return t('levels.caveslevel.exit_desc');
	if (region === 'city') return t('levels.citylevel.exit_desc');
	return t('levels.level.exit_desc');
}
/** `bookshelf_desc`: Sewer/Prison/CavesLevel each override it; `Level`'s base `tileDesc()` has no
 *  BOOKSHELF case at all, so any other region falls through to no description - matching Java,
 *  not a gap in this port. */
export function examineBookshelfDesc(region: Region): string {
	switch (region) {
		case 'sewers': return t('levels.sewerlevel.bookshelf_desc');
		case 'prison': return t('levels.prisonlevel.bookshelf_desc');
		case 'caves': return t('levels.caveslevel.bookshelf_desc');
		case 'city': return t('levels.citylevel.bookshelf_desc');
		case 'halls': return t('levels.hallslevel.bookshelf_desc');
		default: return '';
	}
}
/** `empty_deco_desc`: only Sewer/PrisonLevel override it. `CavesLevel` generates EMPTY_DECO tiles
 *  too (see `cavesPainter.ts`'s `decorate()`) but does NOT override this case, so it falls
 *  through to `Level`'s base (no EMPTY_DECO case either) - genuinely no description in Java, not
 *  a "use Sewers' text as a generic fallback" case. `CityLevel` instead shares one `deco_desc`
 *  key between EMPTY_DECO and WALL_DECO (`examineWallDecoDesc` below), not `empty_deco_desc`. */
export function examineEmptyDecoDesc(region: Region): string {
	if (region === 'sewers') return t('levels.sewerlevel.empty_deco_desc');
	if (region === 'prison') return t('levels.prisonlevel.empty_deco_desc');
	if (region === 'city') return t('levels.citylevel.deco_desc');
	return '';
}
/** `deco_desc` on a WALL_DECO cell: only `CityLevel` overrides this case (shared with
 *  EMPTY_DECO above, per `CityLevel.tileDesc()`'s combined `case WALL_DECO: case EMPTY_DECO:`). */
export function examineWallDecoDesc(region: Region): string {
	return region === 'city' ? t('levels.citylevel.deco_desc') : '';
}
/** `statue_name`: `Level`'s own base has a STATUE/STATUE_SP case (`statue_name`); `HallsLevel` is
 *  the only region that overrides it (`City` does not, despite overriding the matching `_desc`
 *  below - checked directly against `CityLevel.tileName()`, which has no STATUE case at all). */
export function examineStatueName(region: Region): string {
	return region === 'halls' ? t('levels.hallslevel.statue_name') : t('levels.level.statue_name');
}
/** `statue_desc`: `Level`'s own base already has a STATUE/STATUE_SP case (unlike WALL_DECO/
 *  EMPTY_SP, which have no base case at all); `City`/`HallsLevel` each override it with their own
 *  flavored text, every other region falls through to the base key. */
export function examineStatueDesc(region: Region): string {
	if (region === 'city') return t('levels.citylevel.statue_desc');
	if (region === 'halls') return t('levels.hallslevel.statue_desc');
	return t('levels.level.statue_desc');
}
/** `sp_desc`: only `CityLevel` overrides EMPTY_SP. */
export function examineSpDesc(region: Region): string {
	return region === 'city' ? t('levels.citylevel.sp_desc') : '';
}

/** Everything `examineTile` needs that is not the say/alchemy side effect itself:
 * the scene precomputes the arena/city key answers (they need its visual contexts),
 * the raw ported `Terrain.java` value (`undefined` off a ported floor) and the
 * coarse kind, and this module owns the whole name/description decision. */
export interface TileExamineContext {
	region: Region;
	raw: number | undefined;
	inRitualMarker: boolean;
	arenaName: string | undefined;
	arenaDesc: string | undefined;
	cityName: string | undefined;
	cityDesc: string | undefined;
	atStairs: boolean;
	coarse: number;
	isCrystalDoor: boolean;
}

/** Either the line to say, or the alchemy pot's recipe window (examining the pot is
 * its direct action surface - see the ALCHEMY branch below). */
export type TileExamineOutcome = { kind: 'say'; text: string } | { kind: 'alchemy' };

/**
 * `Level.java`'s `tileName`/`tileDesc`, bound to a free "Look" action - Java shows this
 * through `GameScene`'s cell-examine long-press, which this port has no pointer/keyboard
 * equivalent of, so the action just reports the hero's own cell rather than an arbitrary
 * selected one. Every region's own `*Level.java` overrides a different subset of
 * `water_name`/`grass_name`/`high_grass_name`(+`_desc`)/`entrance_desc`/`exit_desc` - all
 * reachable from `regionForDepth` alone (see the exact per-key region lists below,
 * checked directly against each real `*Level.java`), so they work whether or not this
 * depth came from `spdLevelGen/`. This port's own eight coarse terrain kinds collapse
 * several real `Terrain.java` values together (see `gameBridge.ts`'s
 * `SPD_TERRAIN_TO_GAME_KIND`), so `EMPTY_DECO`/`BOOKSHELF`/`ENTRANCE` (and `Sewer`/
 * `Prison`'s own overrides for them) are only distinguishable on a ported floor, read
 * back from `portedPaint`'s raw grid; `EXIT` does not need that, since `this.stairs` is
 * tracked on every depth regardless of generator.
 */
export function examineTileOutcome(ctx: TileExamineContext): TileExamineOutcome {
	const region = ctx.region;
	const raw = ctx.raw;
	let name: string;
	let desc = '';

	//`RitualSiteRoom`'s marker answers its own name and description for every cell of its own
	//3x3 (unlike `ArenaVisuals`, with no terrain test at all), so those cells never reach the
	//terrain branches below.
	if (ctx.inRitualMarker) {
		return { kind: 'say', text: `${t(RITUAL_MARKER_NAME_KEY)}. ${t(RITUAL_MARKER_DESC_KEY)}` };
	}
	//`WndInfoCell.cellName` consults the level's `customTiles` *before* the terrain (and the
	//window's own description does the same in its constructor), and `ArenaVisuals` answers its
	//own `wires_*`/`gate_*` names for the cells it draws on. So the wiring and the gate answer as
	//themselves here instead of as the plain arena floor they are painted on - with Java's own
	//two exclusions modelled inside `cavesArenaNameKey`/`cavesArenaDescKey`: a `NULL_TILE` cell
	//(the layer draws nothing there) and a cell within one square of a pylon (`ArenaVisuals`'
	//`image()` returns null for those, so `WndInfoCell` never reaches the tilemap's name at all).
	if (ctx.arenaName !== undefined) {
		return {
			kind: 'say',
			text: ctx.arenaDesc ? `${t(ctx.arenaName)}. ${t(ctx.arenaDesc)}` : t(ctx.arenaName),
		};
	}
	//`CityBossLevel.CustomGroundVisuals.name()`/`desc()` answer the same way: only where
	//the ground map draws (see `cityBossVisuals.ts`), otherwise the terrain path below
	//speaks. A named cell composes name + desc; a `""` desc (upper `EMPTY_DECO`) says the
	//floor name with no description, exactly like Java's suppression.
	if (ctx.cityName !== undefined || ctx.cityDesc !== undefined) {
		if (ctx.cityName !== undefined) {
			return {
				kind: 'say',
				text: ctx.cityDesc ? `${t(ctx.cityName)}. ${t(ctx.cityDesc)}` : t(ctx.cityName),
			};
		}
		if (ctx.cityDesc === '') {
			return { kind: 'say', text: t('levels.level.floor_name') };
		}
	}

	if (ctx.atStairs) {
		name = t('levels.level.exit_name');
		desc = examineExitDesc(region);
	} else if (raw === Terrain.ENTRANCE) {
		name = t('levels.level.entrace_name');
		desc = examineEntranceDesc(region);
	} else if (raw === Terrain.BOOKSHELF) {
		name = t('levels.level.bookshelf_name');
		desc = examineBookshelfDesc(region);
	} else if (raw === Terrain.EMPTY_DECO) {
		name = t('levels.level.floor_name');
		desc = examineEmptyDecoDesc(region);
	} else if (raw === Terrain.WALL_DECO) {
		name = t('levels.level.wall_name');
		desc = examineWallDecoDesc(region);
	} else if (raw === Terrain.STATUE || raw === Terrain.STATUE_SP) {
		// `Level.tileName()`'s own STATUE/STATUE_SP case - `statue_name`, not `wall_name`;
		// `HallsLevel` overrides it (see `examineStatueName`).
		name = examineStatueName(region);
		desc = examineStatueDesc(region);
	} else if (raw === Terrain.EMPTY_SP) {
		name = t('levels.level.floor_name');
		desc = examineSpDesc(region);
	} else if (raw === Terrain.SIGN) {
		name = t('port.ui.signname');
		desc = t('port.ui.signdesc');
	} else if (raw === Terrain.ALCHEMY) {
		//`AlchemyPot.onOperate()` opens the recipe window in Java. This port has no
		//separate cell-targeting interaction, so examining the pot is its direct action
		//surface; the existing generic picker then presents recipes whose ingredients
		//are currently in the bag.
		return { kind: 'alchemy' };
	} else if (raw === Terrain.WELL) {
		name = t('levels.level.well_name');
	} else if (raw === Terrain.EMPTY_WELL) {
		name = t('levels.level.empty_well_name');
		desc = t('levels.level.empty_well_desc');
	} else {
		switch (ctx.coarse) {
			case WALL:
				name = t('levels.level.wall_name');
				break;
			case WATER:
				name = examineWaterName(region);
				desc = region === 'halls' ? t('levels.hallslevel.water_desc') : t('levels.level.water_desc');
				break;
			case DOOR:
				name = t('levels.level.open_door_name');
				break;
			case DOOR_CLOSED:
				if (ctx.isCrystalDoor) {
					name = t('levels.level.crystal_door_name');
					desc = t('levels.level.crystal_door_desc');
				} else {
					name = t('levels.level.locked_door_name');
					desc = t('levels.level.locked_door_desc');
				}
				break;
			case GRASS:
				name = examineGrassName(region);
				break;
			case HIGH_GRASS:
				name = examineHighGrassName(region);
				//high_grass_desc has only one override, CavesLevel's own
				desc = region === 'caves' ? t('levels.caveslevel.high_grass_desc') : t('levels.level.high_grass_desc');
				break;
			default:
				name = t('levels.level.floor_name');
		}
	}

	return { kind: 'say', text: desc ? `${name}. ${desc}` : name };
}
