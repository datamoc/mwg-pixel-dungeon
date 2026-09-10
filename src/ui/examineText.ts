import { t } from '../i18n/index';
import type { Region } from '../genericDungeon';

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
