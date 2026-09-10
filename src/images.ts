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
// `DemonSpawnerRoom.CustomFloor`'s exact HALLS_SP custom atlas.
import hallsSpecialUrl from './assets/halls_special.png';
import wallBlockingUrl from './assets/wall_blocking.png';
import { Texture } from 'pixi.js';

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
import tenguUrl from './assets/tengu.png';
import ghostUrl from './assets/ghost.png';
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
import blacksmithUrl from './assets/blacksmith.png';
import impUrl from './assets/demon.png';
import bannersUrl from './assets/banners.png';
// `WandOfWarding.WardSprite`'s dedicated variable-width tier film.
import wardsUrl from './assets/wards.png';
//interface art, copied byte-for-byte from core/src/main/assets/interfaces/ and prefixed
//`ui_` here to keep it apart from the sprite sheets above
import uiToolbarUrl from './assets/ui_toolbar.png';
import uiChromeUrl from './assets/ui_chrome.png';
import uiStatusPaneUrl from './assets/ui_status_pane.png';
import uiBuffsUrl from './assets/ui_buffs.png';
import uiIconsUrl from './assets/ui_icons.png';
import uiBadgesUrl from './assets/ui_badges.png';
import uiBossHpUrl from './assets/ui_boss_hp.png';
//title screen background/flame art, byte-for-byte from interfaces/arcs1.png, arcs2.png
//and effects/fireball.png
import uiArcsBgUrl from './assets/ui_arcs_bg.png';
import uiArcsFgUrl from './assets/ui_arcs_fg.png';
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
	blacksmith: Texture;
	imp: Texture;
	demonSpawner: Texture;
	ripperDemon: Texture;
	items: Texture;
	banners: Texture;
	/** `WandOfWarding.WardSprite`'s six tier frames, from `sprites/wards.png`. */
	wards: Texture;
	/** `interfaces/chrome.png` - window frames, cut by `Chrome.Type` */
	uiToolbar: Texture;
	effects: Texture;
	terrainFeatures: Texture;
	cavesQuest: Texture;
	hallsSpecial: Texture;
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
 * `Fireball`'s glow/flare/flame quadrants) - see the comments there. `large_buffs.png` is not
 * copied: this port has no large interface size.
 *
 * `items.png` is `ItemSpriteSheet`'s real 256x512 sheet, one 16x16 cell per item id
 * (`ItemSpriteSheet.xy(x,y)`/`assignItemRect`). Java tightens each cell to a sub-rect smaller
 * than 16x16 (`assignItemRect`'s own `width`/`height` args, e.g. `DEWDROP` is drawn at 10x10
 * within its cell) for a snugger icon; this port draws the full 16x16 cell instead of
 * reproducing that per-item crop table, a real but minor simplification (a little more
 * transparent padding around each icon than SPD itself shows).
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
	const [
		warrior,
		mage,
		rogue,
		huntress,
		duelist,
		cleric,
		rat,
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
		wards,
		uiToolbar,
		effects,
		terrainFeatures,
		cavesQuest,
		hallsSpecial,
		wallBlocking,
		water0,
		water1,
		water2,
		water3,
		water4,
		uiChrome,
		uiStatusPane,
		uiBuffs,
		uiIcons,
		uiBadges,
		uiBossHp,
		uiArcsBg,
		uiArcsFg,
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
		loadImage(sentryUrl),
		loadImage(rotHeartUrl),
		loadImage(rotLasherUrl),
		loadImage(ratkingUrl),
		loadImage(blacksmithUrl),
		loadImage(impUrl),
		loadImage(spawnerUrl),
		loadImage(ripperUrl),
		loadImage(itemsUrl),
		loadImage(bannersUrl),
		loadImage(wardsUrl),
		loadImage(uiToolbarUrl),
		loadImage(effectsUrl),
		loadImage(terrainFeaturesUrl),
		loadImage(cavesQuestUrl),
		loadImage(hallsSpecialUrl),
		loadImage(wallBlockingUrl),
		loadImage(water0Url),
		loadImage(water1Url),
		loadImage(water2Url),
		loadImage(water3Url),
		loadImage(water4Url),
		loadImage(uiChromeUrl),
		loadImage(uiStatusPaneUrl),
		loadImage(uiBuffsUrl),
		loadImage(uiIconsUrl),
		loadImage(uiBadgesUrl),
		loadImage(uiBossHpUrl),
		loadImage(uiArcsBgUrl),
		loadImage(uiArcsFgUrl),
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
		wards: Texture.from(wards),
		uiToolbar: Texture.from(uiToolbar),
		effects: Texture.from(effects),
		terrainFeatures: Texture.from(terrainFeatures),
		cavesQuest: Texture.from(cavesQuest),
		hallsSpecial: Texture.from(hallsSpecial),
		wallBlocking: Texture.from(wallBlocking),
		water0: Texture.from(water0),
		water1: Texture.from(water1),
		water2: Texture.from(water2),
		water3: Texture.from(water3),
		water4: Texture.from(water4),
		uiChrome: Texture.from(uiChrome),
		uiStatusPane: Texture.from(uiStatusPane),
		uiBuffs: Texture.from(uiBuffs),
		uiIcons: Texture.from(uiIcons),
		uiBadges: Texture.from(uiBadges),
		uiBossHp: Texture.from(uiBossHp),
		uiArcsBg: Texture.from(uiArcsBg),
		uiArcsFg: Texture.from(uiArcsFg),
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
