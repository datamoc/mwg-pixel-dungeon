import water4Url from './assets/water4.png';
import water3Url from './assets/water3.png';
import water2Url from './assets/water2.png';
import water1Url from './assets/water1.png';
import water0Url from './assets/water0.png';
import effectsUrl from './assets/effects.png';
// Byte-for-byte environment/terrain_features.png from this Java checkout.
import terrainFeaturesUrl from './assets/terrain_features.png';
// `levels/MiningLevel.BorderDarken`'s exact 4-tile custom atlas.
import cavesQuestUrl from './assets/caves_quest.png';
// `Assets.Environment.TILES_CAVES_CRYSTAL`/`TILES_CAVES_GNOLL` (`MiningLevel.tilesTex()`), byte-for-byte
// from tag `v3.3.8`. They follow v3.3.8's sheet layout, not the v2.1.4 one `tiles_caves.png` does, so
// only their mine tiles are drawn (see `mineTileFrame`), on their own layers.
import cavesCrystalUrl from './assets/tiles_caves_crystal.png';
import cavesGnollUrl from './assets/tiles_caves_gnoll.png';
// `DemonSpawnerRoom.CustomFloor`'s exact HALLS_SP custom atlas.
import hallsSpecialUrl from './assets/halls_special.png';
import cavesBossUrl from './assets/caves_boss.png';
import cityBossUrl from './assets/city_boss.png';
import prisonQuestUrl from './assets/prison_quest.png';
import wallBlockingUrl from './assets/wall_blocking.png';
import { Texture } from 'mwg/two-d/pixi-interop';

//vite inlines every one of these as a base64 data: URI (assetsInlineLimit is set to
//Infinity in vite.config.ts) - so loading one is a local decode, never a network fetch,
//which is what running from file:// requires
import warriorUrl from './assets/warrior.png';
import mageUrl from './assets/mage.png';
import rogueUrl from './assets/rogue.png';
import huntressUrl from './assets/huntress.png';
import duelistUrl from './assets/duelist.png';
import clericUrl from './assets/cleric.png';
import ratUrl from './assets/rat.png';
// `SheepSprite`'s dedicated 16x15 film, copied byte-for-byte from the Java assets.
import sheepUrl from './assets/sheep.png';
import piranhaUrl from './assets/piranha.png';
import beeUrl from './assets/bee.png';
import statueUrl from './assets/statue.png';
import mimicUrl from './assets/mimic.png';
import pylonUrl from './assets/pylon.png';
import snakeUrl from './assets/snake.png';
import gnollUrl from './assets/gnoll.png';
import swarmUrl from './assets/swarm.png';
import crabUrl from './assets/crab.png';
import slimeUrl from './assets/slime.png';
import gooUrl from './assets/goo.png';
import skeletonUrl from './assets/skeleton.png';
import thiefUrl from './assets/thief.png';
import dm100Url from './assets/dm100.png';
import guardUrl from './assets/guard.png';
import necromancerUrl from './assets/necromancer.png';
import ninjaLogUrl from './assets/ninja_log.png';
import spiritHawkUrl from './assets/spirit_hawk.png';
import tenguUrl from './assets/tengu.png';
import ghostUrl from './assets/ghost.png';
import wraithUrl from './assets/wraith.png';
import batUrl from './assets/bat.png';
import bruteUrl from './assets/brute.png';
import shamanUrl from './assets/shaman.png';
import spinnerUrl from './assets/spinner.png';
import dm200Url from './assets/dm200.png';
import dm300Url from './assets/dm300.png';
import wandmakerUrl from './assets/wandmaker.png';
import shopkeeperUrl from './assets/shopkeeper.png';
import sewersUrl from './assets/tiles_sewers.png';
import prisonUrl from './assets/tiles_prison.png';
import cavesUrl from './assets/tiles_caves.png';
import cityUrl from './assets/tiles_city.png';
import hallsUrl from './assets/tiles_halls.png';
import itemsUrl from './assets/items.png';
import ghoulUrl from './assets/ghoul.png';
import elementalUrl from './assets/elemental.png';
import warlockUrl from './assets/warlock.png';
import monkUrl from './assets/monk.png';
import golemUrl from './assets/golem.png';
import succubusUrl from './assets/succubus.png';
import eyeUrl from './assets/eye.png';
import scorpioUrl from './assets/scorpio.png';
import kingUrl from './assets/king.png';
import yogUrl from './assets/yog.png';
import fistsUrl from './assets/yog_fists.png';
import sentryUrl from './assets/red_sentry.png';
import rotHeartUrl from './assets/rot_heart.png';
import rotLasherUrl from './assets/rot_lasher.png';
import ratkingUrl from './assets/ratking.png';
// spawner.png/ripper.png: DemonSpawner/RipperDemon (levels/rooms/special/DemonSpawnerRoom.java),
// byte-for-byte from this Java checkout's core/src/main/assets/sprites/.
import spawnerUrl from './assets/spawner.png';
import ripperUrl from './assets/ripper.png';
// larva.png: YogDzewa$Larva (12x8 film) - the standalone minion kind the summon deck now uses.
import larvaUrl from './assets/larva.png';
import blacksmithUrl from './assets/blacksmith.png';
import impUrl from './assets/demon.png';
import bannersUrl from './assets/banners.png';
// `BOSS_SLAIN`/`GAME_OVER` cut out of Java's own `interfaces/banners.png` (tag `v3.3.8`) at
// `BannerSprites`' exact rects - `uvRect(0,157,127,225)` (127x68) and `uvRect(128,157,256,192)`
// (128x35) - unlike `banners.png` above, which is this port's own custom redraw.
import bannerBossSlainUrl from './assets/banner_boss_slain.png';
import bannerGameOverUrl from './assets/banner_game_over.png';
// `WandOfWarding.WardSprite`'s dedicated variable-width tier film.
import wardsUrl from './assets/wards.png';
// `WandOfLivingEarth.EarthGuardianSprite`'s dedicated 12x15 film.
import guardianUrl from './assets/guardian.png';
//interface art, copied byte-for-byte from core/src/main/assets/interfaces/ and prefixed
//`ui_` here to keep it apart from the sprite sheets above
import uiToolbarUrl from './assets/ui_toolbar.png';
import uiChromeUrl from './assets/ui_chrome.png';
import uiStatusPaneUrl from './assets/ui_status_pane.png';
import uiBuffsUrl from './assets/ui_buffs.png';
//`SPDSettings.interfaceSize()`'s large variant: `BuffIcon`'s own `Assets.Interfaces.BUFFS_LARGE`,
//a separate 256x128 16x16-cell sheet (not a scaled-up copy of ui_buffs.png's 7x7 cells)
import uiLargeBuffsUrl from './assets/ui_large_buffs.png';
import uiIconsUrl from './assets/ui_icons.png';
import uiBadgesUrl from './assets/ui_badges.png';
import uiBossHpUrl from './assets/ui_boss_hp.png';
//title screen background/flame art, byte-for-byte from interfaces/arcs1.png, arcs2.png
//and effects/fireball.png
import uiArcsBgUrl from './assets/ui_arcs_bg.png';
import uiArcsFgUrl from './assets/ui_arcs_fg.png';
//v3.3.8's title-screen background layers, byte-for-byte from splashes/title/ (`TitleBackground`)
import titleArchsUrl from './assets/title_archs.png';
import titleBackClustersUrl from './assets/title_back_clusters.png';
import titleMidMixedUrl from './assets/title_mid_mixed.png';
import titleFrontSmallUrl from './assets/title_front_small.png';
import effectFireballUrl from './assets/effect_fireball.png';
//InterlevelScene's regional loading textures, byte-for-byte from interfaces/.
import loadingSewersUrl from './assets/loading_sewers.png';
import loadingPrisonUrl from './assets/loading_prison.png';
import loadingCavesUrl from './assets/loading_caves.png';
import loadingCityUrl from './assets/loading_city.png';
import loadingHallsUrl from './assets/loading_halls.png';
//`Assets.Splashes`: full-screen class-select background art, byte-for-byte from
//interfaces/splashes/*.jpg. `splash_cleric.jpg` is pulled from tag `v3.3.8` (same reasoning
//as `cleric.png` above - this checkout's `HeroClass` predates the Cleric).
import splashWarriorUrl from './assets/splash_warrior.jpg';
import splashMageUrl from './assets/splash_mage.jpg';
import splashRogueUrl from './assets/splash_rogue.jpg';
import splashHuntressUrl from './assets/splash_huntress.jpg';
import splashDuelistUrl from './assets/splash_duelist.jpg';
import splashClericUrl from './assets/splash_cleric.jpg';
import { MWL_ASSET_MANIFEST } from './generated/mwlAssets';
import { MWL_ITEM_ASSET_SOURCES } from './mwlContent';

/**
 * Renderer registration is intentionally kept in TypeScript, but the list of assets that
 * game data is allowed to reference comes from MWL. This registry is the bundler-facing
 * adapter for those references: adding an `image=` value to a `.mwl` resource requires a
 * matching imported URL here, and the manifest check below makes omissions fail loudly.
 */
const MWL_ASSET_URLS: Readonly<Record<string, string>> = {
	'assets/banner_boss_slain.png': bannerBossSlainUrl,
	'assets/banner_game_over.png': bannerGameOverUrl,
	'assets/banners.png': bannersUrl,
	'assets/caves_quest.png': cavesQuestUrl,
	'assets/cleric.png': clericUrl,
	'assets/duelist.png': duelistUrl,
	'assets/effect_fireball.png': effectFireballUrl,
	'assets/effects.png': effectsUrl,
	'assets/huntress.png': huntressUrl,
	'assets/halls_special.png': hallsSpecialUrl,
	'assets/caves_boss.png': cavesBossUrl,
	'assets/city_boss.png': cityBossUrl,
	'assets/prison_quest.png': prisonQuestUrl,
	'assets/items.png': itemsUrl,
	'assets/loading_caves.png': loadingCavesUrl,
	'assets/loading_city.png': loadingCityUrl,
	'assets/loading_halls.png': loadingHallsUrl,
	'assets/loading_prison.png': loadingPrisonUrl,
	'assets/loading_sewers.png': loadingSewersUrl,
	'assets/mage.png': mageUrl,
	'assets/rogue.png': rogueUrl,
	'assets/splash_cleric.jpg': splashClericUrl,
	'assets/splash_duelist.jpg': splashDuelistUrl,
	'assets/splash_huntress.jpg': splashHuntressUrl,
	'assets/splash_mage.jpg': splashMageUrl,
	'assets/splash_rogue.jpg': splashRogueUrl,
	'assets/splash_warrior.jpg': splashWarriorUrl,
	'assets/terrain_features.png': terrainFeaturesUrl,
	'assets/tiles_caves.png': cavesUrl,
	'assets/tiles_city.png': cityUrl,
	'assets/tiles_halls.png': hallsUrl,
	'assets/tiles_prison.png': prisonUrl,
	'assets/tiles_sewers.png': sewersUrl,
	'assets/ui_arcs_bg.png': uiArcsBgUrl,
	'assets/ui_arcs_fg.png': uiArcsFgUrl,
	'assets/title_archs.png': titleArchsUrl,
	'assets/title_back_clusters.png': titleBackClustersUrl,
	'assets/title_mid_mixed.png': titleMidMixedUrl,
	'assets/title_front_small.png': titleFrontSmallUrl,
	'assets/ui_badges.png': uiBadgesUrl,
	'assets/ui_boss_hp.png': uiBossHpUrl,
	'assets/ui_buffs.png': uiBuffsUrl,
	'assets/ui_chrome.png': uiChromeUrl,
	'assets/ui_icons.png': uiIconsUrl,
	'assets/ui_large_buffs.png': uiLargeBuffsUrl,
	'assets/ui_status_pane.png': uiStatusPaneUrl,
	'assets/ui_toolbar.png': uiToolbarUrl,
	'assets/wall_blocking.png': wallBlockingUrl,
	'assets/water0.png': water0Url,
	'assets/water1.png': water1Url,
	'assets/water2.png': water2Url,
	'assets/water3.png': water3Url,
	'assets/water4.png': water4Url,
	'assets/bat.png': batUrl,
	'assets/bee.png': beeUrl,
	'assets/blacksmith.png': blacksmithUrl,
	'assets/brute.png': bruteUrl,
	'assets/crab.png': crabUrl,
	'assets/demon.png': impUrl,
	'assets/dm100.png': dm100Url,
	'assets/dm200.png': dm200Url,
	'assets/dm300.png': dm300Url,
	'assets/elemental.png': elementalUrl,
	'assets/eye.png': eyeUrl,
	'assets/ghost.png': ghostUrl,
	'assets/wraith.png': wraithUrl,
	'assets/ghoul.png': ghoulUrl,
	'assets/gnoll.png': gnollUrl,
	'assets/golem.png': golemUrl,
	'assets/goo.png': gooUrl,
	'assets/guard.png': guardUrl,
	'assets/guardian.png': guardianUrl,
	'assets/king.png': kingUrl,
	'assets/larva.png': larvaUrl,
	'assets/mimic.png': mimicUrl,
	'assets/monk.png': monkUrl,
	'assets/necromancer.png': necromancerUrl,
	'assets/ninja_log.png': ninjaLogUrl,
	'assets/spirit_hawk.png': spiritHawkUrl,
	'assets/piranha.png': piranhaUrl,
	'assets/pylon.png': pylonUrl,
	'assets/rat.png': ratUrl,
	'assets/ratking.png': ratkingUrl,
	'assets/red_sentry.png': sentryUrl,
	'assets/ripper.png': ripperUrl,
	'assets/rot_heart.png': rotHeartUrl,
	'assets/rot_lasher.png': rotLasherUrl,
	'assets/scorpio.png': scorpioUrl,
	'assets/shaman.png': shamanUrl,
	'assets/sheep.png': sheepUrl,
	'assets/shopkeeper.png': shopkeeperUrl,
	'assets/skeleton.png': skeletonUrl,
	'assets/slime.png': slimeUrl,
	'assets/snake.png': snakeUrl,
	'assets/spawner.png': spawnerUrl,
	'assets/spinner.png': spinnerUrl,
	'assets/statue.png': statueUrl,
	'assets/succubus.png': succubusUrl,
	'assets/swarm.png': swarmUrl,
	'assets/tengu.png': tenguUrl,
	'assets/thief.png': thiefUrl,
	'assets/wandmaker.png': wandmakerUrl,
	'assets/wards.png': wardsUrl,
	'assets/warlock.png': warlockUrl,
	'assets/warrior.png': warriorUrl,
	'assets/yog.png': yogUrl,
	'assets/yog_fists.png': fistsUrl,
};

function validateMwlAssetBindings(): void {
	for (const asset of MWL_ITEM_ASSET_SOURCES.values()) {
		if (!MWL_ASSET_MANIFEST.includes(asset as typeof MWL_ASSET_MANIFEST[number])) throw new Error(`MWL item asset is absent from manifest: ${asset}`);
	}
	const missing = MWL_ASSET_MANIFEST.filter((asset) => !MWL_ASSET_URLS[asset]);
	if (missing.length > 0) {
		throw new Error(`MWL assets are not registered with the sprite loader: ${missing.join(', ')}`);
	}
}

/** decodes a data: URI into an HTMLImageElement - Pixi's own loader expects a real URL, not a bare data: string */
function loadImage(url: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.onload = () => resolve(image);
		image.onerror = reject;
		image.src = url;
	});
}

export interface SpdSprites {
	warrior: Texture;
	mage: Texture;
	rogue: Texture;
	huntress: Texture;
	duelist: Texture;
	cleric: Texture;
	rat: Texture;
	sheep: Texture;
	/** `SmokeBomb.NinjaLog`'s decoy, from `sprites/ninja_log.png`. */
	ninjaLog: Texture;
	/** `SpiritHawk.HawkAlly`'s familiar, from `sprites/spirit_hawk.png`. */
	spiritHawk: Texture;
	piranha: Texture;
	bee: Texture;
	statue: Texture;
	mimic: Texture;
	pylon: Texture;
	snake: Texture;
	gnoll: Texture;
	swarm: Texture;
	crab: Texture;
	slime: Texture;
	goo: Texture;
	skeleton: Texture;
	thief: Texture;
	dm100: Texture;
	guard: Texture;
	necromancer: Texture;
	tengu: Texture;
	ghost: Texture;
	wraith: Texture;
	bat: Texture;
	brute: Texture;
	shaman: Texture;
	spinner: Texture;
	dm200: Texture;
	dm300: Texture;
	wandmaker: Texture;
	shopkeeper: Texture;
	sewers: Texture;
	prison: Texture;
	caves: Texture;
	city: Texture;
	halls: Texture;
	ghoul: Texture;
	elemental: Texture;
	warlock: Texture;
	monk: Texture;
	golem: Texture;
	succubus: Texture;
	eye: Texture;
	scorpio: Texture;
	king: Texture;
	yog: Texture;
	fists: Texture;
	/** `SentryRoom$Sentry`'s own sheet (`Assets.Sprites.RED_SENTRY`, 8x15 film). */
	sentry: Texture;
	/** `RotHeartSprite`/`RotLasherSprite`'s own sheets (16x16 / 12x16 films). */
	rotHeart: Texture;
	rotLasher: Texture;
	/** `RatKingSprite`'s own sheet (16x17 film). */
	ratking: Texture;
	/** Alias used by the MonsterId key for Yog's summoned fists. */
	yogFist: Texture;
	/** `YogDzewa$Larva`'s own sheet, keyed by the standalone `larva` MonsterId. */
	larva: Texture;
	blacksmith: Texture;
	imp: Texture;
	demonSpawner: Texture;
	ripperDemon: Texture;
	items: Texture;
	banners: Texture;
	/** Java's `BOSS_SLAIN` banner sprite, cut from its own sheet (see the import comment). */
	bannerBossSlain: Texture;
	/** Java's `GAME_OVER` banner sprite, cut from its own sheet (see the import comment). */
	bannerGameOver: Texture;
	/** `WandOfWarding.WardSprite`'s six tier frames, from `sprites/wards.png`. */
	wards: Texture;
	/** `WandOfLivingEarth.EarthGuardianSprite`'s 12x15 film. */
	guardian: Texture;
	/** `interfaces/chrome.png` - window frames, cut by `Chrome.Type` */
	uiToolbar: Texture;
	effects: Texture;
	terrainFeatures: Texture;
	cavesQuest: Texture;
	cavesCrystal: Texture;
	cavesGnoll: Texture;
	hallsSpecial: Texture;
	cavesBoss: Texture;
	/** `Assets.Environment.CITY_BOSS` - `CityBossLevel`'s `CustomGroundVisuals`/`CustomWallVisuals` atlas. */
	cityBoss: Texture;
	prisonQuest: Texture;
	wallBlocking: Texture;
	water0: Texture;
	water1: Texture;
	water2: Texture;
	water3: Texture;
	water4: Texture;
	uiChrome: Texture;
	/** `interfaces/status_pane.png` - the hero pane frame and its HP/EXP bar fills */
	uiStatusPane: Texture;
	/** `interfaces/buffs.png` - 7x7 buff icons, indexed by `BuffIndicator`'s constants */
	uiBuffs: Texture;
	/** `interfaces/large_buffs.png` - the same icons at 16x16, used when `interfaceSize` is large */
	uiLargeBuffs: Texture;
	/** `interfaces/icons.png` - assorted UI icons, incl. `Icons.COMPASS` at (16,72,7,5) */
	uiIcons: Texture;
	/** `interfaces/badges.png` - `Badges.Badge.image`-indexed 16x16 grid, 8 cols x 16 rows */
	uiBadges: Texture;
	/** `interfaces/boss_hp.png` - BossHealthBar's 64x16 chrome */
	uiBossHp: Texture;
	/** `interfaces/arcs1.png` - `Archs`' scrolling background tile */
	uiArcsBg: Texture;
	/** `interfaces/arcs2.png` - `Archs`' scrolling foreground tile, twice the background's scroll speed */
	uiArcsFg: Texture;
	/** `splashes/title/archs.png` - `TitleBackground`'s arch back layer, 333x100 frames in a 3x2 grid (6 used) */
	titleArchs: Texture;
	/** `splashes/title/back_clusters.png` - the two cluster layers, 450x250 frames (2) */
	titleBackClusters: Texture;
	/** `splashes/title/mid_mixed.png` - the two middle layers, 273x242 frames (first 24 of the 7x4 grid used) */
	titleMidMixed: Texture;
	/** `splashes/title/front_small.png` - the far/front small layers, 112x116 frames (first 20 of the 9x4 grid used) */
	titleFrontSmall: Texture;
	/** `effects/fireball.png` - `Fireball`'s glow/flare/flame frames, 4 equal 32x32 quadrants */
	effectFireball: Texture;
	loadingSewers: Texture;
	loadingPrison: Texture;
	loadingCaves: Texture;
	loadingCity: Texture;
	loadingHalls: Texture;
	/** `Assets.Splashes.*` - full-screen class-select background art, one per class */
	splashWarrior: Texture;
	splashMage: Texture;
	splashRogue: Texture;
	splashHuntress: Texture;
	splashDuelist: Texture;
	splashCleric: Texture;
}

/**
 * Loads SPD's actual sprite sheets and tilesets - real art, not a placeholder square. Every
 * one of these except `cleric.png` comes from `core/src/main/assets` in this checkout, whose
 * `HeroClass` enum stops at `DUELIST` - an older point in SPD's history than the 6-class
 * roster the game ships today. `cleric.png` is pulled from tag `v3.3.8` instead
 * (`git show v3.3.8:core/src/main/assets/sprites/cleric.png`) - the first version with a
 * Cleric - rather than inventing art or skipping the 6th class. Frame rectangles cut from
 * all of these are computed in `main.ts` from the same numbers SPD's own sprite classes use
 * (`HeroSprite.FRAME_WIDTH/HEIGHT`, each mob's own `TextureFilm` call in its `*Sprite.java`,
 * `DungeonTileSheet`'s 16px grid) - see the comments there.
 *
 * The six `ui_*.png`/`effect_*.png` are `core/src/main/assets/interfaces/`'s `chrome.png`,
 * `status_pane.png`, `buffs.png`, `icons.png`, `arcs1.png` and `arcs2.png`, plus
 * `effects/fireball.png`, copied byte-for-byte from this same checkout and renamed with a
 * `ui_`/`effect_` prefix so interface art sorts apart from the sprite sheets. Regions are cut
 * from them in `src/ui/` using the numbers SPD's own UI classes use (`Chrome.Type.WINDOW`'s
 * `NinePatch(0,0,20,20,6)`, `StatusPane`'s small-layout bar rects, `BuffIcon`'s 7x7
 * `TextureFilm`, `Icons.COMPASS`'s `uvRectBySize(16,72,7,5)`, `Archs`' scrolling tiles,
 * `Fireball`'s glow/flare/flame quadrants) - see the comments there. `large_buffs.png` (renamed
 * `ui_large_buffs.png` here) is copied too and wired into `StatusPane`'s large-interface-size
 * buff row (`BuffIcon`'s real `Assets.Interfaces.BUFFS_LARGE`, a 16x16-cell sheet distinct from
 * the small one, not a scaled copy of it). Both buff sheets are the tag-`v3.3.8` files
 * byte-for-byte, not this checkout's: the old sheets leave `BuffIndicator` cells 72+
 * blank, which is where the Cleric buff icons live (`HOLY_WEAPON` 73, `HOLY_ARMOR`
 * 74, `ILLUMINATED` 81). Every previously-used cell was verified pixel-identical
 * between the two versions first, so no existing icon moved.
 *
 * `items.png` is `ItemSpriteSheet`'s real 256x512 sheet, one 16x16 cell per item id
 * (`ItemSpriteSheet.xy(x,y)`/`assignItemRect`). Java tightens each cell to a sub-rect smaller
 * than 16x16 (`assignItemRect`'s own `width`/`height` args, e.g. `DEWDROP` is drawn at 10x10
 * within its cell) for a snugger icon; this port draws the full 16x16 cell instead of
 * reproducing that per-item crop table, a real but minor simplification (a little more
 * transparent padding around each icon than SPD itself shows).
 *
 * One cell is not this checkout's: the sheet predates the Cleric, so Java's
 * `ARTIFACT_TOME` (cell 263 at tag `v3.3.8`; 246 there is `ARTIFACT_SPELLBOOK`)
 * has no cell here. v3.3.8's 16x16 tome pixels were copied into transparent,
 * unreferenced cell 26 instead (verified empty and unreferenced in `src/` first),
 * which is the `holyTome` frame in `item-rules.mwl`. The surrounding cells are
 * untouched, so every other icon still reads the old sheet.
 *
 * `red_sentry.png` is likewise pulled from tag `v3.3.8`
 * (`git show v3.3.8:core/src/main/assets/sprites/red_sentry.png`) - the SentryRoom turret
 * postdates this checkout's own sprite set, and its 8x15 film is cut in `main.ts` from
 * `SentrySprite`'s own `uvRect(0, 0, 8, 15)` numbers, like every other mob sheet here.
 * `rot_heart.png`/`rot_lasher.png` come from the same tag for the same reason (the
 * RotGarden pair postdates the set too), cut at their sprites' own 16x16 / 12x16 films.
 * `ratking.png` likewise (`RatKingSprite`'s own 16x17 film) for the RatKingRoom denizen.
 */
export async function loadSpdSprites(): Promise<SpdSprites> {
	validateMwlAssetBindings();
	const itemAtlasPath = MWL_ITEM_ASSET_SOURCES.get('items');
	const itemAtlasUrl = itemAtlasPath === undefined
		? itemsUrl
		: MWL_ASSET_URLS[itemAtlasPath as keyof typeof MWL_ASSET_URLS];
	if (!itemAtlasUrl) throw new Error(`MWL item asset is not registered: ${itemAtlasPath}`);
	const [
		warrior,
		mage,
		rogue,
		huntress,
		duelist,
		cleric,
		//This list is positional: it must stay in step with the `loadImage(...)` array below,
		//entry for entry. It did not (sheep/ninjaLog were transposed) and the shipped Smoke Bomb
		//decoy rendered the sheep sprite for a whole release; `tools/verifyItemWorkflows.mjs`
		//now pins the two orders together.
		rat,
		ninjaLog,
		spiritHawk,
		sheep,
		piranha,
		bee,
		statue,
		mimic,
		pylon,
		snake,
		gnoll,
		swarm,
		crab,
		slime,
		goo,
		skeleton,
		thief,
		dm100,
		guard,
		necromancer,
		tengu,
		ghost,
		wraith,
		bat,
		brute,
		shaman,
		spinner,
		dm200,
		dm300,
		wandmaker,
		shopkeeper,
		sewers,
		prison,
		caves,
		city,
		halls,
		ghoul,
		elemental,
		warlock,
		monk,
		golem,
		succubus,
		eye,
		scorpio,
		king,
		yog,
		fists,
		larva,
		sentry,
		rotHeart,
		rotLasher,
		ratking,
		blacksmith,
		imp,
		demonSpawner,
		ripperDemon,
		items,
		banners,
		bannerBossSlain,
		bannerGameOver,
		wards,
		guardian,
		uiToolbar,
		effects,
		terrainFeatures,
		cavesQuest,
		cavesCrystal,
		cavesGnoll,
		hallsSpecial,
		cavesBoss,
		cityBoss,
		prisonQuest,
		wallBlocking,
		water0,
		water1,
		water2,
		water3,
		water4,
		uiChrome,
		uiStatusPane,
		uiBuffs,
		uiLargeBuffs,
		uiIcons,
		uiBadges,
		uiBossHp,
		uiArcsBg,
		uiArcsFg,
		titleArchs,
		titleBackClusters,
		titleMidMixed,
		titleFrontSmall,
		effectFireball,
		loadingSewers,
		loadingPrison,
		loadingCaves,
		loadingCity,
		loadingHalls,
		splashWarrior,
		splashMage,
		splashRogue,
		splashHuntress,
		splashDuelist,
		splashCleric,
	] = await Promise.all([
		loadImage(warriorUrl),
		loadImage(mageUrl),
		loadImage(rogueUrl),
		loadImage(huntressUrl),
		loadImage(duelistUrl),
		loadImage(clericUrl),
		loadImage(ratUrl),
		loadImage(ninjaLogUrl),
		loadImage(spiritHawkUrl),
		loadImage(sheepUrl),
		loadImage(piranhaUrl),
		loadImage(beeUrl),
		loadImage(statueUrl),
		loadImage(mimicUrl),
		loadImage(pylonUrl),
		loadImage(snakeUrl),
		loadImage(gnollUrl),
		loadImage(swarmUrl),
		loadImage(crabUrl),
		loadImage(slimeUrl),
		loadImage(gooUrl),
		loadImage(skeletonUrl),
		loadImage(thiefUrl),
		loadImage(dm100Url),
		loadImage(guardUrl),
		loadImage(necromancerUrl),
		loadImage(tenguUrl),
		loadImage(ghostUrl),
		loadImage(wraithUrl),
		loadImage(batUrl),
		loadImage(bruteUrl),
		loadImage(shamanUrl),
		loadImage(spinnerUrl),
		loadImage(dm200Url),
		loadImage(dm300Url),
		loadImage(wandmakerUrl),
		loadImage(shopkeeperUrl),
		loadImage(sewersUrl),
		loadImage(prisonUrl),
		loadImage(cavesUrl),
		loadImage(cityUrl),
		loadImage(hallsUrl),
		loadImage(ghoulUrl),
		loadImage(elementalUrl),
		loadImage(warlockUrl),
		loadImage(monkUrl),
		loadImage(golemUrl),
		loadImage(succubusUrl),
		loadImage(eyeUrl),
		loadImage(scorpioUrl),
		loadImage(kingUrl),
		loadImage(yogUrl),
		loadImage(fistsUrl),
		loadImage(larvaUrl),
		loadImage(sentryUrl),
		loadImage(rotHeartUrl),
		loadImage(rotLasherUrl),
		loadImage(ratkingUrl),
		loadImage(blacksmithUrl),
		loadImage(impUrl),
		loadImage(spawnerUrl),
		loadImage(ripperUrl),
		loadImage(itemAtlasUrl),
		loadImage(bannersUrl),
		loadImage(bannerBossSlainUrl),
		loadImage(bannerGameOverUrl),
		loadImage(wardsUrl),
		loadImage(guardianUrl),
		loadImage(uiToolbarUrl),
		loadImage(effectsUrl),
		loadImage(terrainFeaturesUrl),
		loadImage(cavesQuestUrl),
		loadImage(cavesCrystalUrl),
		loadImage(cavesGnollUrl),
		loadImage(hallsSpecialUrl),
		loadImage(cavesBossUrl),
		loadImage(cityBossUrl),
		loadImage(prisonQuestUrl),
		loadImage(wallBlockingUrl),
		loadImage(water0Url),
		loadImage(water1Url),
		loadImage(water2Url),
		loadImage(water3Url),
		loadImage(water4Url),
		loadImage(uiChromeUrl),
		loadImage(uiStatusPaneUrl),
		loadImage(uiBuffsUrl),
		loadImage(uiLargeBuffsUrl),
		loadImage(uiIconsUrl),
		loadImage(uiBadgesUrl),
		loadImage(uiBossHpUrl),
		loadImage(uiArcsBgUrl),
		loadImage(uiArcsFgUrl),
		loadImage(titleArchsUrl),
		loadImage(titleBackClustersUrl),
		loadImage(titleMidMixedUrl),
		loadImage(titleFrontSmallUrl),
		loadImage(effectFireballUrl),
		loadImage(loadingSewersUrl),
		loadImage(loadingPrisonUrl),
		loadImage(loadingCavesUrl),
		loadImage(loadingCityUrl),
		loadImage(loadingHallsUrl),
		loadImage(splashWarriorUrl),
		loadImage(splashMageUrl),
		loadImage(splashRogueUrl),
		loadImage(splashHuntressUrl),
		loadImage(splashDuelistUrl),
		loadImage(splashClericUrl),
	]);

	return {
		warrior: Texture.from(warrior),
		mage: Texture.from(mage),
		rogue: Texture.from(rogue),
		huntress: Texture.from(huntress),
		duelist: Texture.from(duelist),
		cleric: Texture.from(cleric),
		rat: Texture.from(rat),
		sheep: Texture.from(sheep),
		ninjaLog: Texture.from(ninjaLog),
		spiritHawk: Texture.from(spiritHawk),
		piranha: Texture.from(piranha),
		bee: Texture.from(bee),
		statue: Texture.from(statue),
		mimic: Texture.from(mimic),
		pylon: Texture.from(pylon),
		snake: Texture.from(snake),
		gnoll: Texture.from(gnoll),
		swarm: Texture.from(swarm),
		crab: Texture.from(crab),
		slime: Texture.from(slime),
		goo: Texture.from(goo),
		skeleton: Texture.from(skeleton),
		thief: Texture.from(thief),
		dm100: Texture.from(dm100),
		guard: Texture.from(guard),
		necromancer: Texture.from(necromancer),
		tengu: Texture.from(tengu),
		ghost: Texture.from(ghost),
		wraith: Texture.from(wraith),
		bat: Texture.from(bat),
		brute: Texture.from(brute),
		shaman: Texture.from(shaman),
		spinner: Texture.from(spinner),
		dm200: Texture.from(dm200),
		dm300: Texture.from(dm300),
		wandmaker: Texture.from(wandmaker),
		shopkeeper: Texture.from(shopkeeper),
		sewers: Texture.from(sewers),
		prison: Texture.from(prison),
		caves: Texture.from(caves),
		city: Texture.from(city),
		halls: Texture.from(halls),
		ghoul: Texture.from(ghoul),
		elemental: Texture.from(elemental),
		warlock: Texture.from(warlock),
		monk: Texture.from(monk),
		golem: Texture.from(golem),
		succubus: Texture.from(succubus),
		eye: Texture.from(eye),
		scorpio: Texture.from(scorpio),
		king: Texture.from(king),
		yog: Texture.from(yog),
		fists: Texture.from(fists),
		larva: Texture.from(larva),
		sentry: Texture.from(sentry),
		rotHeart: Texture.from(rotHeart),
		rotLasher: Texture.from(rotLasher),
		ratking: Texture.from(ratking),
		yogFist: Texture.from(fists),
		blacksmith: Texture.from(blacksmith),
		imp: Texture.from(imp),
		demonSpawner: Texture.from(demonSpawner),
		ripperDemon: Texture.from(ripperDemon),
		items: Texture.from(items),
		banners: Texture.from(banners),
		bannerBossSlain: Texture.from(bannerBossSlain),
		bannerGameOver: Texture.from(bannerGameOver),
		wards: Texture.from(wards),
		guardian: Texture.from(guardian),
		uiToolbar: Texture.from(uiToolbar),
		effects: Texture.from(effects),
		terrainFeatures: Texture.from(terrainFeatures),
		cavesQuest: Texture.from(cavesQuest),
		cavesCrystal: Texture.from(cavesCrystal),
		cavesGnoll: Texture.from(cavesGnoll),
		hallsSpecial: Texture.from(hallsSpecial),
		cavesBoss: Texture.from(cavesBoss),
		cityBoss: Texture.from(cityBoss),
		prisonQuest: Texture.from(prisonQuest),
		wallBlocking: Texture.from(wallBlocking),
		water0: Texture.from(water0),
		water1: Texture.from(water1),
		water2: Texture.from(water2),
		water3: Texture.from(water3),
		water4: Texture.from(water4),
		uiChrome: Texture.from(uiChrome),
		uiStatusPane: Texture.from(uiStatusPane),
		uiBuffs: Texture.from(uiBuffs),
		uiLargeBuffs: Texture.from(uiLargeBuffs),
		uiIcons: Texture.from(uiIcons),
		uiBadges: Texture.from(uiBadges),
		uiBossHp: Texture.from(uiBossHp),
		uiArcsBg: Texture.from(uiArcsBg),
		uiArcsFg: Texture.from(uiArcsFg),
		titleArchs: Texture.from(titleArchs),
		titleBackClusters: Texture.from(titleBackClusters),
		titleMidMixed: Texture.from(titleMidMixed),
		titleFrontSmall: Texture.from(titleFrontSmall),
		effectFireball: Texture.from(effectFireball),
		loadingSewers: Texture.from(loadingSewers),
		loadingPrison: Texture.from(loadingPrison),
		loadingCaves: Texture.from(loadingCaves),
		loadingCity: Texture.from(loadingCity),
		loadingHalls: Texture.from(loadingHalls),
		splashWarrior: Texture.from(splashWarrior),
		splashMage: Texture.from(splashMage),
		splashRogue: Texture.from(splashRogue),
		splashHuntress: Texture.from(splashHuntress),
		splashDuelist: Texture.from(splashDuelist),
		splashCleric: Texture.from(splashCleric),
	};
}
