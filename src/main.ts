import { HeroAnimation } from './ui/heroAnimation';
import { placeCharacterArt, faceCharacter } from './ui/characterPlacement';
import { CharacterEffects } from './ui/characterEffects';
import { FogOfWar } from './ui/fogOfWar';
import { wallBlockingFrame } from './spdLevelGen/wallBlocking';
import { InfoWindow } from './ui/infoWindow';
import { WaterSurface } from './ui/waterSurface';
import { InventoryWindow, type InventoryEntry } from './ui/inventoryWindow';
import { createJournalWindow, type JournalPage } from './ui/journalWindow';
import { Container, extensions, FillGradient, Graphics, NineSliceSpritePipe, Rectangle, Sprite, Texture, TilingSprite, TilingSpritePipe } from 'pixi.js';
import { Game, Scene2D, Input, Random, SaveSystem, Achievements, ReactionTable, type ReactionRule } from 'mwg';
import { SceneSimulationAdapter } from './adapters/sceneSimulation';
import { dispatchHeroAction, type HeroActionPorts } from './adapters/heroActions';
import { runSearch } from './adapters/searchSimulation';
import { runMovement } from './adapters/movementSimulation';
import { resolveAttack } from './simulation/attackResolution';
import { simulationRandom } from './adapters/mwgRandom';
import { MOVES } from './simulation/heroActions';
import { finishHeroTurn } from './simulation/heroTurn';
import {
	TintedSprite,
	AnimatedSprite,
	Tweener,
	SpriteSheet,
	TileMap,
	Camera,
	Projectile,
	autotileFrames,
	registerColorTransform,
} from 'mwg';
import { Label, theme, Button, Window } from 'mwg';
import { Roguelike, Actors, Rpg, World } from 'mwg';
import { loadSpdSprites } from './images';
import { rollGeneratedAffix, groundKindForItem, portItemKind, sourceInventoryItem } from './itemKinds';
import {
	POTION_CLASS_BY_PORT_ID,
	stonePortId,
	isTransmutableForScroll,
	transmuteItem,
} from './transmutation';
import {
	examineWaterName,
	examineGrassName,
	examineHighGrassName,
	examineEntranceDesc,
	examineExitDesc,
	examineBookshelfDesc,
	examineEmptyDecoDesc,
	examineWallDecoDesc,
	examineStatueName,
	examineStatueDesc,
	examineSpDesc,
} from './ui/examineText';
import {
	type EquippedRing,
	RING_DEFS,
	ringDef,
	ringTenacityMultiplier,
	ringHasteMultiplier,
	ringEnergyMultiplier,
	ringArcanaMultiplier,
	ringForceBonus,
	ringSharpshootingBonus,
	ringSharpshootingDurabilityMultiplier,
	ringWealthMultiplier,
	ringElementsMultiplier,
	ringFurorMultiplier,
} from './ringModifiers';
import {
	t,
	capitalize,
	initI18n,
	setLanguage,
	language,
	nextLanguage,
	MOB_KEYS,
	CLASS_KEYS,
	REGION_KEYS,
	GROUND_ITEM_KEYS,
	ITEM_KEYS,
	RING_KEYS,
	POTION_APPEARANCE_KEYS,
	SCROLL_APPEARANCE_KEYS,
} from './i18n/index';
import { applySpdTheme, SPD_STATUS_COLOR } from './ui/spdTheme';
import { GameLog, type LogLevel } from './ui/gameLog';
import { FloatingTextLayer } from './ui/floatingText';
import { Bar } from './ui/bar';
import { Compass } from './ui/compass';
import { BadgeBannerLayer } from './ui/badgeBanner';
import { SpdToolbar } from './ui/toolbar';
import { StatusPane } from './ui/statusPane';
import { SpdAudio } from './audio';
import { arcaneVisionDuration, assassinReachBonus, bountyGoldBonus, cachedRationChance, canImproviseProjectile, cleaveComboSeed, deathlessFuryTriggers, enhancedLethalityThreshold, enragedCatalystBonus, evasiveArmorBonus, empoweredStrikeBonus, farsightMultiplier, ironStomachReduction, ironWillReduction, lethalDefenseShield, lethalHasteDuration, LETHAL_HASTE_COOLDOWN, monasticVigorShield, preservationChance, projectileMomentumBonus, rejuvenatingStepHeal, shieldBatteryGain, shieldingDewGain, sharedUpgradeArmor, soulSiphonCharge, twinUpgradeArmor, unencumberedSpiritEvasion, weaponRechargingDamage } from './talentEffects';
import pixelFontUrl from './assets/pixel_font.ttf';
import { SpdJavaRandom, spdScramble, spdSeedForDepth, SpdRandom } from './spdRng';
import {
	isPortedDepth,
	portedFloor,
	miningBranchFloor,
	resetPortedRun,
	toGameTerrain,
	type PortedFloor,
} from './spdLevelGen/gameBridge';
import { entranceRoomContext } from './spdLevelGen/rooms/standard/entranceRoom';
import { setHourglassShopState } from './spdItems/shopItems';
import { buybackPrice, getSellPrice, getShopPrice } from './shopPricing';
import { raisedWallFrame, upperWallFrame, foregroundGrassFrame } from './spdLevelGen/visualWalls';
import { TRAP_VISUALS, PLANT_VISUALS } from './generated/terrainVisuals';
import { SPRITE_ANIMATIONS } from './generated/spriteAnimations';
import { Terrain, type PaintLevel } from './spdLevelGen/paintLevel';
import { WallDecorationLayer, WaterEmberLayer } from './ui/wallDecorations';
import { runState, LANGUAGE_KEY } from './runState';
import { recordRun } from './rankings';
import { isChallengeEnabled } from './challenges';
import { CLASS_TALENTS, subclassTalentDefinitions, type TalentDefinition } from './talents';
import { CLASSES, CLASS_AMMO, HERO_IDLE_FRAME, type ClassId } from './classes';
import { BADGE_DEFS, BADGE_ICON, loadBadges } from './badges';
import { TitleScene } from './scenes/titleScene';
import { transferEnhancement } from './itemWorkflows';
import { getCurse } from './itemCurses';
import { Cat, generatorRandom, ghostQuestReward, randomUsingDefaults, removeArtifactClass, setGeneratorDepth, type GenItem, type StatueLoot } from './spdItems/generator';
import { setWandmakerQuestType, wandmakerQuestType } from './spdLevelGen/wandmaker';

/** Concrete wand families retained by the equipped-wand save state. */
type WandType = 'magicMissile' | 'frost' | 'fireblast' | 'lightning' | 'corrosion' | 'corruption' | 'disintegration' | 'livingEarth' | 'prismaticLight' | 'regrowth' | 'transfusion' | 'warding';

function wandTypeFromSource(sourceClass?: string): WandType {
	const source = (sourceClass ?? '').toLowerCase();
	if (source.includes('fireblast')) return 'fireblast';
	if (source.includes('lightning')) return 'lightning';
	if (source.includes('corrosion')) return 'corrosion';
	if (source.includes('corruption')) return 'corruption';
	if (source.includes('disintegration')) return 'disintegration';
	if (source.includes('livingearth')) return 'livingEarth';
	if (source.includes('prismaticlight')) return 'prismaticLight';
	if (source.includes('regrowth')) return 'regrowth';
	if (source.includes('transfusion')) return 'transfusion';
	if (source.includes('warding')) return 'warding';
	if (source.includes('frost')) return 'frost';
	return 'magicMissile';
}
import { ritualSiteState } from './spdLevelGen/rooms/standard/ritualSiteRoom';
import {
	TILE,
	VIEW_RADIUS,
	WALL,
	FLOOR,
	TRAP,
	WATER,
	DOOR,
	GRASS,
	HIGH_GRASS,
	DOOR_CLOSED,
	GAME_KIND_CODES,
	TERRAIN_KINDS,
	TERRAIN_FRAME,
	WATER_FRAMES,
	TRAP_KINDS,
	ITEM_FRAME,
	WATERSKIN_MAX,
	type TrapKind,
	type GroundItemKind,
} from './dungeonConstants';
import {
	COLOR,
	spdSeedValue,
	regionForDepth,
	REGION_WATER,
	REGION_GRASS,
	generateSpdDungeon,
	patchGenerate,
	type Region,
} from './genericDungeon';
import {
	TALENT_TIERS,
	baseCreature,
	rollHit,
	rollDamage,
	setStrongerBossesEnabled,
	setAnnounceBuff,
	addBuff,
	tickBuffs,
	NEGATIVE_BUFFS,
	BUFF_DURATION,
	type Step,
	type Creature,
	type GroundItem,
	type BuffId,
} from './combat';
import { nextEntityId } from './simulation/entityId';
import { heroSheet, MONSTERS, mobRosterForDepth, liveStats, BOSSES, MOB_LOOT, LIMITED_DROP_DECAY, BASE_KIND_ALIASES, NPC_KINDS, BOSS_KINDS, IMMOVABLE_KINDS, NEVER_SLEEPS_KINDS, DEPTH_SCALED_STATS, SPRITE_KIND_OVERRIDE, type AnyMonsterId, type MonsterId } from './monsters';

/**
 * Shattered Pixel Dungeon, on top of mwg: a title screen, hero-class selection, the Sewers
 * (depths 1-4, boss Goo), the Prison (depths 6-9, boss Tengu) and the Caves (depths 11-14,
 * boss DM-300), plus each hero class's own real starting special action, not just a different
 * melee weapon.
 *
 * This is a *port*, not a from-scratch design: the hero's stats, each class's starting
 * weapon and its damage range, every monster's stats, the per-depth monster rotation, the
 * hit-chance/damage formulas, and each class's own special action below are taken directly
 * from SPD's own source (`actors/Char.java`, `actors/hero/{Hero,HeroClass}.java`,
 * `actors/mobs/*.java`, `actors/mobs/Bestiary.java`, `Dungeon.java`'s depth-to-level-class
 * switch, `items/weapon/{melee,missiles}/*.java`, `items/wands/WandOfMagicMissile.java`,
 * `items/weapon/SpiritBow.java`), reimplemented in TypeScript rather than copied - no Java
 * source is included here. Everything *around* those numbers (the turn loop, field of view,
 * pathfinding, targeting, monster AI, hidden tiles) is `mwg/roguelike`, completely
 * unmodified: this file only supplies content, not framework.
 *
 * Depths 1-4 and 6-9 are `Bestiary.getMobRotation`'s real per-depth rotations,
 * `Random.element`-picked per spawn the same way a repeated entry in Java's
 * `Arrays.asList(...)` means "picked more often" (`Rat, Rat, Rat, Snake` at depth 1 is Rat 3
 * times out of 4, not "the same rat four times"). Depth 5 (`SewerBossLevel`) is Goo alone,
 * with its real pump-up mechanic (a two-turn charge, telegraphed in the log, then a
 * 3x-damage/2x-accuracy slam) and its real below-half-health enrage (`Goo.java`: accuracy 10
 * to 15, evasion x1.5, max damage 8 to 12) - the one simplification is that Goo's pumped
 * attack is a ranged lunge up to 2 tiles in Java; this engine only has bump-to-adjacent
 * combat, so the slam only fires when Goo is already next to the hero. Depth 10
 * (`PrisonBossLevel`) is Tengu alone, at his real HP/evasion/damage/armor - his own real
 * mechanic is a whole shifting-floor arena with ranged ambush darts (his accuracy is
 * actually *higher* at range than in melee in Java, `attackSkill()`: 20 vs 10), which this
 * port does not attempt; he fights here as the strong melee bruiser his adjacent-combat
 * numbers already describe, not a weaker stand-in for what he really does.
 *
 * The City, Halls and the Amulet vault are also represented: the Dwarf King and Yog-Dzewa
 * use deliberately reduced boss scripts because the full arena mechanics need generic
 * combat lifecycle hooks that are now recorded on MWG's roadmap.
 *
 * Each class's real day-one special action, bound to `T`: SPD's talent trees and subclass
 * abilities are *still* not built (see below on what levelling now covers, and what it does
 * not), so giving a level-1 hero one of those would still be less faithful, not more - what a
 * level-1 hero actually has beyond its melee weapon is whatever is already in its starting
 * kit. Warrior throws its 3 `ThrowingStone`s (2-5 dmg); Rogue its 3 `ThrowingKnife`s (2-6
 * dmg); Duelist its 2 `ThrowingSpike`s (2-5 dmg) - all three roll to hit exactly like a melee
 * swing, just at range, and use persistent MissileWeapon durability. Mage's
 * `WandOfMagicMissile` (2-8 dmg) never rolls to hit
 * at all - `onZap` calls `ch.damage()` directly in Java - and fires through real Charges (3
 * plus the staff's +1, recharging over turns at a flat rate standing in for
 * `turnsToCharge`). Huntress's `SpiritBow` (1-6 dmg base) is not a
 * quickslot item but her actual weapon in Java, and it hits *harder* from farther away
 * (`min(3, 1.2 * 1.125^(distance-1))`, capped at 3x) - reproduced exactly, capped range 6. Cleric's
 * `HolyTome` needs an SP economy this port does not have, so `T` invokes it through slow
 * charges instead - a stated stand-in, not the real spell system.
 *
 * Levelling is real, not invented: `mwg/actors`'s `Progression` tracks it against SPD's own
 * curve (`Hero.maxExp(lvl) = 5 + lvl*5`, turned into the cumulative total `Progression`
 * wants), monsters grant their own real `EXP` on death gated by their own real `maxLvl` (a
 * mob past its `maxLvl` relative to the hero's level gives nothing - `Bestiary`'s way of
 * saying "you have outgrown this floor"), and `HT = 20 + 5*(lvl-1)` grows max HP exactly as
 * Java does. Talent points follow the real tier windows (`Talent.tierLevelThresholds`:
 * tier 1 levels 2-6, tier 2 levels 7-12, one flat point per level each - tiers 3+ need a
 * subclass this port has none of) and auto-spend into accuracy/evasion for want of a
 * choice UI - except three real tier-1 talents with no UI needs: Rogue's SUCKER_PUNCH
 * (+2 surprise damage), TEST_SUBJECT (identifying heals), and Warrior's HEARTY_MEAL
 * (eating while hurt heals).
 *
 * The Sewers' real "Sad Ghost" side quest is in, in all three `type` forms (`Ghost.java`'s
 * `Quest.type == depth-1`: Fetid Rat on 2, Gnoll Trickster on 3, Great Crab on 4, at the
 * real per-depth odds). The
 * Ghost NPC has Java's own spawn roll (`Random.Int(5 - depth) == 0` on depths 2-4,
 * `type = depth-1`), is
 * undamageable and never fights, and running the actual three-stage quest (offer, kill the
 * miniboss, return) is `mwg/rpg`'s `QuestLog` against a `GameState` switch the miniboss's
 * death sets - not a scene-local flag reimplementing what `QuestLog` already does. The one
 * real simplification: Java's reward is a randomly generated weapon and armor set (this port
 * has no item system to receive one), so the turn-in instead grants a flat permanent +2 max
 * HP, stated here as a stand-in rather than a claim about what the real reward is.
 *
 * The hero, monster and floor art are SPD's real sprite sheets and tilesets
 * (`core/src/main/assets/{sprites,environment}`), copied byte-for-byte into `src/assets/` -
 * this is a GPL-3 port of a GPL-3 game reusing its own art, not a redistribution of someone
 * else's. The frame rectangles cut from them below are computed from the same numbers SPD's
 * own sprite classes use (`HeroSprite.FRAME_WIDTH/HEIGHT` and its tier rows, each mob's own
 * `TextureFilm` call, `DungeonTileSheet`'s 16px grid and its `FLOOR`/`RAISED_WALL`/
 * `FLAT_DOOR` indices) - not reverse-engineered by eye.
 *
 * Walls and floor are one fixed tile each, still - SPD's own wall art
 * (`DungeonTileSheet.RAISED_WALLS`) turns out to hold no neighbour-dependent pieces at all;
 * its "raised" 3D look comes from the renderer overdrawing each wall cell into the row above
 * it in code, not from stitched sprite variants, so there is nothing there for an autotiler
 * to select between. Water is the terrain SPD actually stitches
 * (`DungeonTileSheet.stitchWaterTile`: a 4-bit top/right/bottom/left mask into 16 tiles), and
 * that's what uses `mwg/render`'s new `autotileFrames` below - its 47 shapes are an 8-neighbour
 * blob convention, one level more detailed than SPD's own 4-neighbour water mask, so the
 * mapping keeps only the orthogonal bits and several of the 47 shapes land on the same one of
 * SPD's 16 real water tiles. That's `mwg`'s generic autotiler driving SPD's real water art,
 * not a reproduction of `stitchWaterTile` itself.
 *
 * Water's *shape* is real too, not hand-placed: `levels/Patch.java`'s cellular-automaton
 * generator (`patchGenerate` here, translated block for block - random fill, then repeated
 * "become whatever most of your 8 neighbours already are" passes, with a fill-rate
 * correction so heavy clustering doesn't silently push the true coverage toward 0% or 100%)
 * at Sewers' own real numbers (`SewerLevel.painter()`: 30% fill, 5 smoothing passes) is what
 * actually produces SPD's organic, level-spanning lakes - this port used to draw one small
 * fixed rectangle per floor, which is a different shape as well as a different scale.
 *
 * The down staircase is SPD's real `EXIT` tile and the up staircase (absent on floor 1, which
 * has nothing above it) is its real `ENTRANCE` tile - this port used to reuse the door tile
 * for the exit and had no entrance at all. Real doors (`FLAT_DOOR`) are placed too, at every
 * point `placeDoors` finds the room-and-corridor generator already punched a passable cell
 * through a room's wall ring - exactly where SPD's own generator places one - rather than the
 * dungeon having no doors at all. Doors start closed and block sight until opened, through
 * `mwg/roguelike`'s live `Doors` terrain state; bumping one open consumes the hero's turn.
 *
 * Grass is real too, both regions (`{Sewer,Prison}Level.painter().setGrass(...)`), the same
 * `Patch`-based generator as water at its own fill/smoothing (`REGION_GRASS`) and its own real
 * chance of rolling `HIGH_GRASS` instead of plain `GRASS` per cell (`placeGrass`). Stepping
 * onto high grass tramples it to plain grass and rolls its real loot odds
 * (`HighGrass.trample`, `trampleHighGrass`): 1-in-6 for a dew drop, 1-in-25 for a stone -
 * this port has no seed item, so that second roll always yields a stone rather than Java's own
 * stone-or-seed split. Dew drops (and a scattered few stones/potions/scrolls placed at floor
 * generation, standing in for SPD's own `Generator`/`Room` loot system this port does not
 * reproduce) sit on the ground as real `items.png` sprites and are picked up by walking onto
 * them - not through any inventory screen, since this port still has none. A collected dew
 * drop tops up a real `Waterskin` (`collectDewdrop`, `WATERSKIN_MAX = 20`, matching
 * `Waterskin.MAX_VOLUME`) shown in the status bar, and once that's full, further drops heal a
 * flat 5% of max HP directly (`Dewdrop.consumeDew`'s per-drop amount) rather than reproducing
 * its talent/shielding-aware version.
 *
 * GPL-3.0-or-later, the same as the game this ports and the same as the art it reuses. mwg
 * itself (MPL-2.0) is used as a library, unmodified by this file - see this project's README.
 */

/**
 * `Hero.maxExp(lvl) = 5 + lvl*5` is the cost of *one more* level; `mwg/actors`'s
 * `Progression` wants the cumulative total to *reach* a level instead, so this is that same
 * formula summed: `experienceFor(L) = sum of maxExp(l) for l = 1..L-1`, which has the closed
 * form below (checked against L=2 -> 10 and L=3 -> 25, both matching `maxExp(1)` and
 * `maxExp(1)+maxExp(2)` directly). `maxLevel: 30` is `Hero.MAX_LEVEL`.
 */
const SPD_LEVEL_CURVE: Actors.GrowthCurve = {
	maxLevel: 30,
	experienceFor: (level) => (level <= 1 ? 0 : Math.round((5 * (level - 1) * (level + 2)) / 2)),
};

/**
 * The real Sewers "Sad Ghost" quest (`Ghost.java`'s inner `Quest` class), all three types -
 * the Fetid Rat (depth 2), Gnoll Trickster (depth 3), Great Crab (depth 4). Stage 0 is a
 * milestone that completes the instant `SewersScene` calls `advance()` right after `start()`
 * (the "you were given this quest" moment); stage 1 is the real objective, gated on the
 * `ghostTargetSlain` `GameState` switch whichever miniboss's death sets; stage 2 is another
 * milestone, completing (and so finishing the quest) the next time the hero talks to the
 * Ghost after stage 1 is done. Reward (flat +2 max HP) is the documented stand-in for
 * Java's generated weapon+armor set - this port has no generated loot to give.
 */
const SAD_GHOST_QUEST: Rpg.QuestDefinition = {
	id: 'sadGhost',
	stages: [{}, { condition: { switch: 'ghostTargetSlain', equals: true }, description: 'Slay the ghost\'s tormentor.' }, {}],
};

/**
 * The Wandmaker quest, simplified: Java's three fetch sites (MassGrave/CorpseDust,
 * RitualSite/Embers, RotGarden/Rotberry seed) need level features this port does not model,
 * so the ask here is any one scroll from the bag - the shape (offer, fetch, turn-in for a
 * choice of two wands) is real, the fetch target is the stand-in.
 */
const WANDMAKER_QUEST: Rpg.QuestDefinition = {
	id: 'wandmaker',
	stages: [{}, { condition: { switch: 'wandQuestDone', equals: true }, description: 'Bring the wandmaker a scroll.' }, {}],
};

/**
 * The Troll Blacksmith quest, simplified: Java's two variants (15 DarkGold mined with the
 * given Pickaxe, or staining it on a Bat) now carries the generator's selected variant into
 * gameplay. The gold path asks for 15 dark-gold chunks; the alternative stains the pickaxe
 * on a Bat kill. The reforge reward (combine two same-class items) collapses to +1 weapon
 * and +1 armor level - this port has no second weapon/armor instances to absorb.
 */
const BLACKSMITH_QUEST: Rpg.QuestDefinition = {
	id: 'blacksmith',
	stages: [{}, { condition: { switch: 'blacksmithDone', equals: true }, description: 'Complete the Blacksmith quest.' }, {}],
};

/**
 * The Imp quest, simplified: Java wants 5 DwarfTokens from Monks (or 4 from Golems) for a
 * pre-rolled +2 cursed ring. The ask and the cursed-+2-ring reward are real; the token
 * drop is simplified to a flat 50% per Monk/Golem kill on any City depth (no depth-20
 * exclusion matters here - depth 20 is the King arena, which drops nothing).
 */
const IMP_QUEST: Rpg.QuestDefinition = {
	id: 'imp',
	stages: [{}, { condition: { switch: 'impDone', equals: true }, description: 'Bring 5 dwarf tokens.' }, {}],
};

/**
 * Talent tiers 3+ as an `mwg/actors` Advancement track: tier 3 (level 13) is the subclass
 * branch - both of each class's real HeroSubClass names (the Cleric postdates this checkout's
 * subclasses, so it takes no branch). Tier 4 (level 21) is a two-option armor-ability
 * capstone, with deliberately small MWG-native effects rather than a silent point conversion.
 */
const SUBCLASS_TRACK: Actors.AdvancementTrack = {
	tiers: [
		{
			threshold: 13,
			kind: 'branch',
			options: [
				{ id: 'berserker' },
				{ id: 'gladiator' },
				{ id: 'battlemage' },
				{ id: 'warlock' },
				{ id: 'assassin' },
				{ id: 'freerunner' },
				{ id: 'sniper' },
				{ id: 'warden' },
				{ id: 'champion' },
				{ id: 'monk_sub' },
			],
		},
		{ threshold: 21, kind: 'capstone', options: [{ id: 'warding' }, { id: 'arcane' }] },
	],
};
const SUBCLASS_OPTIONS: Record<ClassId, readonly string[] | undefined> = {
	warrior: ['berserker', 'gladiator'], mage: ['battlemage', 'warlock'],
	rogue: ['assassin', 'freerunner'], huntress: ['sniper', 'warden'],
	duelist: ['champion', 'monk_sub'], cleric: undefined,
};
const ARMOR_OPTIONS = ['warding', 'arcane'] as const;
//Weapon.Augment: SPEED/DAMAGE/NONE, chosen when using StoneOfAugmentation on the equipped weapon.
const AUGMENT_OPTIONS = ['speed', 'damage', 'none'] as const;

/**
 * Weapon enchantments and armor glyphs as `mwg/actors` affix tables, actually rolled through
 * `Actors.rollAffix` (see `generatedInventoryItem`) rather than sitting unused - a real wiring
 * gap this file had until this pass: `generatedInventoryItem` set `cursed` from the generator's
 * RNG-faithful `cursed`/`hasGoodEnchant` flags but never picked or attached a concrete id, so no
 * weapon/armor obtained through normal play could ever carry one, and every proc branch below
 * keyed on `weaponAffix`/`armorGlyph` was dead code in an actual playthrough. See
 * `PORT_COVERAGE.md`'s "Enchant/glyph/curse assignment is unwired" row for the full history.
 *
 * Real Java has 13 weapon enchantments + 8 weapon curses, and 13 armor glyphs + 8 armor curses
 * (`items/weapon/enchantments/`, `items/weapon/curses/`, `items/armor/glyphs/`,
 * `items/armor/curses/`). This port models nine enchants (Blazing/Chilling/Shocking/Vampiric/
 * Grim/Lucky/Blocking/Kinetic/Blooming), seven glyphs (Stone/Thorns/
 * Flow/Entanglement/Swiftness/Potential/Camouflage), all 7 remaining weapon curses with a real effect
 * (Wayward/Annoying/Dazzling/Explosive/Polarized/Sacrificial/Displacing), and all 8 armor curses
 * (Stench/AntiEntropy/Bulk/Corrosion/Displacement/Metabolism/Multiplicity/Overgrowth) - each
 * chosen because its real effect fits a system this port already has (a buff, a flat stat, a
 * ground-item drop, the shared `heroBarrier`, the shared poison DoT, a free-cell teleport
 * search) rather than needing a new one. Blocking's real proc chance and shield-amount formulas
 * are both reproduced (`(lvl+4)/(lvl+40)`, `round(max(1,procChance) * (2+lvl))`); the shared
 * `heroBarrier` pool now decays every hero turn via `Barrier.act()`'s real proportional curve
 * (`min(1, shielding/20)` per turn, accumulated fractionally), and Blocking's own `BlockBuff`
 * gets its own `blockingBarrier` pool with the real max-not-additive `setShield()` semantics,
 * the always-reset 5-turn cliff-edge expiry, priority-first drain order, and exemption from the
 * proportional decay (HoldFast scaling of both clocks and the ProvokedAnger break tracker are
 * still not modeled - this port has neither system). Every other real enchant/glyph/curse needs a
 * subsystem this port does not model - Kinetic's old "store half of every hit" shorthand is
 * replaced this pass by the real `Char.damage()` kill-overkill rule below; Corrupting needs
 * a "convert enemy" mechanic; Elastic/Projecting need AoE/thrown-range geometry; Unstable is
 * now ported (delegates per swing, see `attack()`); Friendly needs a two-way Charm subsystem this port lacks (confirmed against
 * `Friendly.java`: mutual Charm + zeroing damage to the charmed target); the remaining armor
 * glyphs (Affection/AntiMagic/Brimstone/Obfuscation/Repulsion/Viscosity) need
 * charm/wand-drain/blink/durability systems likewise absent (Obfuscation's stealth boost has
 * no roll seam - this port's `seesHero` is FOV-binary, not a distance roll). The armor-glyph
 * Swiftness itself is real but Simplified (flat 0.8x cost with no enemy within 3, instead of
 * the real level-scaled `(1.2+0.04*lvl)` speed boost). See PORT_COVERAGE.md
 * for the itemized list. The trigger routing (strike vs defend vs passive) is the real shape
 * either way. **Correction, found auditing the curse list against tag `v3.3.8` (and back to
 * `v3.3.1`) this pass: no `Fragile` armor curse exists in real Java at all** - the closest
 * match is a `v1.x`-era changelog mention; the real 8th curse is `Stench` (1/8 chance on being
 * hit to seed 250-volume `ToxicGas` at the wearer's own feet, gassing the wearer too). The
 * old `fragile` entry (flat -2 armor, a guess with no Java basis whose `items.armor.curses.
 * fragile.*` name keys don't even exist in the generated catalog) is replaced by a real
 * `stench` proc; old saves carrying `fragile` migrate it to `stench` on load (see the load
 * path) with a `getCurse` legacy shim so surviving bag items still cleanse correctly.
 * Every curse entry locks gear via the equipment lock until a cleanse scroll lifts
 * it (`Actors.applyAffix`/`removeAffix`'s own curse-flag contract, not something this file has
 * to reimplement per curse).
 */
const ENCHANT_TABLE: Actors.AffixTable = {
	entries: [
		{ id: 'blazing', trigger: 'strike', weight: 3, description: 'Ignites the victim' },
		{ id: 'chilling', trigger: 'strike', weight: 3, description: 'Chills the victim' },
		{ id: 'shocking', trigger: 'strike', weight: 3, description: '+2 damage' },
		{ id: 'vampiric', trigger: 'strike', weight: 2, description: 'Heals 1 on a hit' },
		{ id: 'grim', trigger: 'strike', weight: 2, description: 'Chance of bonus damage against a weakened foe' },
		{ id: 'lucky', trigger: 'strike', weight: 2, description: 'Chance of bonus loot on a kill' },
		{ id: 'blocking', trigger: 'strike', weight: 2, description: 'Chance to grant a shield on a landed hit' },
		{ id: 'kinetic', trigger: 'strike', weight: 2, description: 'Stores part of damage for the next hit' },
		{ id: 'blooming', trigger: 'strike', weight: 2, description: 'Chance to plant grass where you strike' },
		{ id: 'unstable', trigger: 'strike', weight: 2, description: 'A random enchantment effect on every hit' },
		{ id: 'wayward', trigger: 'strike', weight: 1, curse: true, description: 'Cursed: -3 accuracy' },
		{ id: 'annoying', trigger: 'strike', weight: 1, curse: true, description: 'Cursed: chance to alert every monster on the floor' },
		{ id: 'dazzling', trigger: 'strike', weight: 1, curse: true, description: 'Cursed: chance to blind everyone nearby, including you' },
		{ id: 'explosive', trigger: 'strike', weight: 1, curse: true, description: 'Cursed: eventually detonates on its wielder' },
		{ id: 'polarized', trigger: 'strike', weight: 1, curse: true, description: 'Cursed: every other hit is amplified, the rest whiff entirely' },
		{ id: 'sacrificial', trigger: 'strike', weight: 1, curse: true, description: 'Cursed: chance to wound its wielder' },
		{ id: 'displacing', trigger: 'strike', weight: 1, curse: true, description: 'Cursed: chance to teleport the struck target away' },
	],
};
/** `Unstable.randomEnchants` minus Projecting (Java's own exclusion - no on-hit effect) and
 * minus Corrupting/Elastic (no ported proc exists to delegate into; drawing them would make
 * Unstable randomly fizzle with no feedback, so they stay out openly until their own
 * systems land). Uncommon, like the real `Unstable` in `Weapon.java`'s rarity lists. */
const UNSTABLE_DELEGATES = ['blazing', 'blocking', 'blooming', 'chilling', 'kinetic', 'grim', 'lucky', 'shocking', 'vampiric'] as const;
const GLYPH_TABLE: Actors.AffixTable = {
	entries: [
		{ id: 'stone', trigger: 'defend', weight: 3, description: '+2 armor' },
		{ id: 'thorns', trigger: 'defend', weight: 3, description: 'Reflects 2' },
		{ id: 'flow', trigger: 'passive', weight: 3, description: '+2 evasion' },
		{ id: 'entanglement', trigger: 'defend', weight: 2, description: 'Chance to root an attacker' },
		{ id: 'swiftness', trigger: 'passive', weight: 3, description: 'Faster movement when safe (20% speed increase)' },
		{ id: 'potential', trigger: 'defend', weight: 3, description: 'Chance to recharge wands when hit' },
		{ id: 'camouflage', trigger: 'passive', weight: 2, description: 'Trampling grass turns you invisible' },
		{ id: 'stench', trigger: 'defend', weight: 1, curse: true, description: 'Cursed: chance to release toxic gas when hit' },
		{ id: 'antientropy', trigger: 'defend', weight: 1, curse: true, description: 'Cursed: chance to drain a wand charge' },
		{ id: 'bulk', trigger: 'passive', weight: 1, curse: true, description: 'Cursed: slower through doorways' },
		{ id: 'corrosion', trigger: 'defend', weight: 1, curse: true, description: 'Cursed: chance to corrode a weapon or armor level' },
		{ id: 'displacement', trigger: 'defend', weight: 1, curse: true, description: 'Cursed: chance to teleport its wearer away' },
		{ id: 'metabolism', trigger: 'defend', weight: 1, curse: true, description: 'Cursed: consumes extra hunger' },
		{ id: 'multiplicity', trigger: 'defend', weight: 1, curse: true, description: 'Cursed: chance to summon a spectral copy of the attacker' },
		{ id: 'overgrowth', trigger: 'defend', weight: 1, curse: true, description: 'Cursed: chance to root its wearer in grass' },
	],
};

/**
 * Rings (`items/rings/`) as level-scaled modifiers, all 12 real types
 * (`RingOfAccuracy`/`RingOfEvasion`/`RingOfMight`/`RingOfTenacity`/`RingOfHaste`/
 * `RingOfEnergy`/`RingOfWealth`/`RingOfArcana`/`RingOfForce`/`RingOfSharpshooting`/
 * `RingOfElements`/`RingOfFuror`). `RING_DEFS`/`ringDef` and the individual
 * `ring*Multiplier`/`ring*Bonus` pure functions live in `ringModifiers.ts` (see that
 * file for per-ring Java citations) - `might`'s `HTMultiplier()` = x1.035^lvl max HP is
 * applied separately in `equipRing` as `ringHtBonus`, since it changes max HP rather
 * than a StatBlock stat and `syncHeroFromStats` runs far more often than the ring
 * actually changes.
 */

/** Ring stats resolved outside the StatBlock loop (see `syncHeroFromStats`). */
const NON_STATBLOCK_RING_STATS = new Set([
	'strength', 'tenacity', 'speed', 'energy', 'wealth', 'arcana', 'force', 'sharpshooting',
	'elements', 'furor',
]);

/**
 * Unidentified appearances (`ItemSpriteSheet`'s shuffled variants) as `mwg/actors`
 * Appearances: nine potion looks, thirteen scroll looks (12 real Java scroll classes plus
 * this port's own synthetic pre-resolution 'scroll' placeholder), dealt per run. This
 * replaces the old "always the first variant" simplification with the real shuffle.
 */
const APPEARANCE_TABLES: Record<string, Actors.AppearanceTable> = {
	potion: {
		kinds: ['potion', 'potionHealing', 'potionStrength', 'potionFlame', 'potionMindVision', 'potionInvis', 'potionPurity', 'potionExperience', 'potionLevitation'],
		labels: POTION_APPEARANCE_KEYS.slice(0, 9) as string[],
	},
	scroll: {
		//13 kinds for real Java's 12 (`ScrollOfTransmutation` plus this port's own synthetic
		//pre-resolution 'scroll' placeholder, which has no real Java counterpart at all - the
		//ground kind that becomes a concrete scrollUpgrade/scrollIdentify only at pickup).
		//`scrollTransmutation` was missing here entirely until found this pass - a real,
		//pre-existing crash (`appearanceOf` throws on an unmapped kind) reachable through
		//ordinary floor generation (`sourceInventoryItem`'s `ScrollOf* -> 'scroll'+Name` rename
		//already produces this exact id), not something newly introduced. `labels` duplicates
		//its first rune name onto the synthetic 'scroll' placeholder rather than inventing a
		//13th fake SPD rune name Java doesn't have.
		kinds: ['scroll', 'scrollIdentify', 'scrollUpgrade', 'scrollRage', 'scrollLullaby', 'scrollMapping', 'scrollMirror', 'scrollCleanse', 'scrollRecharging', 'scrollTeleportation', 'scrollTerror', 'scrollRetribution', 'scrollTransmutation'],
		labels: [...SCROLL_APPEARANCE_KEYS.slice(0, 12), SCROLL_APPEARANCE_KEYS[0]] as string[],
	},
};

/** flattened run state for mwg/core's SaveSystem (plain JSON, not the live object graph) */
interface SaveShape {
	runSeed: number;
	runSeedLong?: string;
	seededRun?: boolean;
	depth: number;
	deepestDepth?: number;
	miningBranchActive?: boolean;
	hp: number;
	maxHp: number;
	level: number;
	experience: number;
	progressionState?: { level: number; experience: number };
	attackSkill: number;
	defenseSkill: number;
	gold: number;
	str: number;
	heroStatsState?: { base: Record<string, number> };
	weaponLevel: number;
	weaponTier: number;
	armorLevel: number;
	armorTier: number;
	weaponId?: string;
	weaponInstanceId?: string;
	armorId?: string;
	armorInstanceId?: string;
	waterskin: number;
	hunger: number;
	hungerPartialDamage?: number;
	ammo: number;
	ammoDurability?: number;
	missileLevel?: number;
	frostWand: boolean;
	wandType?: WandType;
	ghostSpawned: boolean;
	ghostType: number;
	wandmakerSpawned: boolean;
	wandmakerQuestType?: number;
	shopkeeperSpawned: boolean;
	shopkeeperWarned?: boolean;
	/** Per-shop shelf state, replacing the single run-global stock. `shopkeeperSpawned`
	 * stays (read-only) so pre-migration saves seed their depth-6 shop from it. */
	shopSpawnedDepths?: number[];
	shops?: [number, { potions: number; identifies: number; buyback: { id: string; quantity: number; identified?: boolean }[] }][];
	blacksmithSpawned?: boolean;
	impSpawned?: boolean;
	blacksmithAlternative?: boolean;
	limitedDrops?: [MonsterId, number][];
	bag: { id: string; quantity: number; instanceId?: string; identified?: boolean; level?: number; sandBags?: number; affix?: string; cursed?: boolean; cursedKnown?: boolean;
		usesLeftToIdentify?: number; availableUsesToIdentify?: number; durability?: number; maxDurability?: number; seal?: boolean }[];
	/** MWG actor inventory save; `bag` remains for loading pre-migration slots. */
	bagState?: Actors.SavedInventory;
	bagDefinitions?: [string, Actors.ItemDefinition][];
		bagSources?: { id: string; instanceId?: string; sandBags?: number; charges?: number; sourceClass?: string; cursedKnown?: boolean;
		usesLeftToIdentify?: number; availableUsesToIdentify?: number; durability?: number; maxDurability?: number; seal?: boolean }[];
	itemSerial?: number;
	appearances?: { assigned: [string, [string, string][]][] };
	switches: [string, boolean][];
	questStages: [string, number][];
	equippedRing?: EquippedRing | null;
	ringHtBonus?: number;
	advancement?: { grantedTiers: number; balance: number; choices: [number, string][] };
	/** Per-tier talent points (T1/T2/T3) - see `talentPoints`'s own comment. */
	talentPoints?: [number, number, number];
	/** Pre-migration single-pool save fields, read only as a one-time fallback in `loadRun`. */
	skillPoints?: number;
	skillPointsState?: { points: number };
	charges?: {
		wand: { current: number; progress: number };
		tome: { current: number; progress: number };
		fire: { current: number; progress: number };
		bolt: { current: number; progress: number };
	};
	talentAccuracy?: number;
	talentEvasion?: number;
	talents?: [string, number][];
	weaponAffix?: string | null;
	weaponCurseDurability?: number;
	weaponAugment?: 'speed' | 'damage' | 'none' | null;
	charmTargets?: [string, string][];
	charmIgnoreNextHit?: string[];
	armorGlyph?: string | null;
	kineticStored?: number;
	timeBubbleTurns?: number;
	timeBubblePresses?: number[];
	hourglassFreeze?: boolean;
	hourglassTurnsToCost?: number;
	heroShield?: number;
	heroBarrierState?: { layers: { amount: number; decayPerTick?: number }[] };
	livingEarthArmor?: number;
	livingEarthWandLevel?: number;
	regrowthTotalChargesUsed?: number;
	regrowthChargesOverLimit?: number;
	barrierPartialLoss?: number;
	blockingBarrierState?: { layers: { amount: number; decayPerTick?: number }[] };
	/** Legacy (pre-two-pool saves): Blocking's share used to live inside `heroBarrier`. */
	blockingShieldLeft?: number;
	blockingTurnsLeft?: number;
	stealthTalentTicks?: number;
	natureBerriesDropped?: number;
	intuitionTracker?: boolean;
	wandBonusDamage?: number;
	physicalBonusDamage?: number;
	physicalBonusAttacks?: number;
	patientStrikeReady?: boolean;
	healingEvasionTurns?: number;
	sungrassHealing?: number;
	sungrassPartial?: number;
	healingLeft?: number;
	sungrassPos?: number;
	deathlessFuryUsed?: boolean;
	/** Timed Char buffs survive a save instead of silently clearing on reload. */
	buffs?: [BuffId, number][];
	/** Mutable state for every floor already entered this run. */
	floors?: [number, FloorState][];
}

interface BonesShape {
	depth: number;
	branch: 0 | 1;
	kind: GroundItemKind;
	item?: GroundItem['item'];
}

type DoorState = { doors: { cell: number; open: number; closed: number; locked?: string; isOpen: boolean }[] };
type SecretState = { revealed: [number, number][]; discovered: number[] };
type FireState = { width: number; height: number; volume: number[] };

/** JSON-only state which survives leaving a depth or saving the run. Render objects are rebuilt. */
interface FloorState {
	terrain: number[];
	doors: DoorState;
	secrets: SecretState;
	trapKinds: [number, TrapKind][];
	secretDoorCells: number[];
	crystalDoorCells: number[];
	fire: FireState;
	plantGas?: FireState;
	ritualPos?: number;
	ritualCandles?: boolean[];
	plantFreeze?: FireState;
	toxicGas?: FireState;
	paralyticGas?: FireState;
	eternalFire?: FireState;
	sacrificialFire?: FireState;
	sacrificialFireCharge?: number;
	sacrificialFireCell?: number;
	sacrificialFirePrize?: GroundItem['item'];
	portedFeatures?: { cells: [number, string][] };
	groundItems: { kind: GroundItemKind; x: number; y: number; item?: GroundItem['item']; chest?: 'normal' | 'locked' | 'crystal'; forSale?: boolean }[];
	fallingRocks?: { cells: { x: number; y: number }[]; turns: number }[];
	manualPlants?: [number, string][];
	creatures: SavedCreature[];
	schedulerNow: number;
}

interface SavedCreature {
	kind: AnyMonsterId;
	x: number;
	y: number;
	hp: number;
	maxHp: number;
	accuracy: number;
	evasion: number;
	damage: [number, number];
	armor: [number, number];
	buffs: [BuffId, number][];
	sleeping?: boolean;
	champion?: 'blessed' | 'blazing' | 'giant' | 'growing' | 'antimagic' | 'projecting' | null;
	championPower?: number;
	pumped?: number;
	combo?: number;
	moving?: number;
	arenaJumps?: number;
	tenguAbilityCd?: number;
	yogPhase?: number;
	kingPhase?: number;
	kingSummonsMade?: number;
	kingSummonCd?: number;
	kingAbilityCd?: number;
	kingLastAbility?: number;
	kingShield?: number;
	/** `ReactionTable.toJSON()`'s round-trip shape for `Creature.kingReactions` (phase
	 * transitions + the one-time losing yell) - reconstructed via `ReactionTable.fromJSON`
	 * in `restoreFloor`. */
	kingReactionsState?: { active: string[]; spent: string[] };
	weaponLevel?: number;
	stolen?: string | null;
	mimicLoot?: string;
	generation?: number;
	spawnCooldown?: number;
	seesHero?: boolean;
	mimicRevealed?: boolean;
	hasteTurns?: number;
	hasteBaseSpeed?: number;
	/** Index into this floor's saved non-hero creatures, for Necromancer.mySkeleton. */
	skeletonIndex?: number;
	firstSummon?: boolean;
	nextTurn: number | null;
	isAlly?: boolean;
	allyKind?: 'mirror' | 'sheep';
	sheepTurns?: number;
	hasRaged?: boolean;
	raged?: boolean;
	chainUsed?: boolean;
	ventCooldown?: number;
	webCooldown?: number;
	golemTeleCooldown?: number;
	beamCharged?: boolean;
	beamCooldown?: number;
	rangedCooldown?: number;
	newbornTarget?: { x: number; y: number } | null;
	armoredRageTicks?: number;
	stuckAmmo?: number;
	sentryWarmup?: number;
	dmAbilityTurns?: number;
	dmAbilityCd?: number;
	dmLastAbility?: number;
}

// -------------------------------------------------------------------- sewers

export class SewersScene extends Scene2D {
	private terrainSheet!: SpriteSheet;
	private heroClass!: ClassId;
	private camera!: Camera;
	private map!: TileMap;
	//SPD's second wall layer. It is a separate TileMap rather than another layer of `map`
	//because Java draws it *above* the actors (`DungeonWallsTilemap` sits over the mob
	//sprites), so a wall top and its overhanging lip hide whoever is behind them - and layers
	//within one mwg TileMap all draw under whatever is added to the world after it.
	private waterSurface?: WaterSurface;
	private wallsMap!: TileMap;
	private featuresMap?: TileMap;
	private monsterMotion = new Map<TintedSprite, Tweener>();
	private dyingMonsters = new Map<AnimatedSprite, { x: number; y: number; fade: number }>();
	private characterEffects!: CharacterEffects;
	private fog?: FogOfWar;
	private wallBlocking?: TileMap;
	private level!: Roguelike.Level;
	private fov!: Roguelike.FieldOfView;
	private pathfinder!: Roguelike.Pathfinder;
	private secrets!: Roguelike.Secrets;
	private scheduler = new Roguelike.Scheduler<Creature>();
	/** Set by a monster-turn action that costs more than the default 1 (only
	 * `Necromancer.firstSummon`'s summon so far), read once via `monsterTurnCost` right after
	 * `takeMonsterTurn` returns, then cleared at the start of the next monster's turn. */
	private pendingMonsterTurnCost: number | null = null;
	private simulation = new SceneSimulationAdapter<Creature>({
		scheduler: this.scheduler,
		isGameOver: () => this.gameOver,
		takeMonsterTurn: (actor) => this.takeMonsterTurn(actor),
		afterMonsterTurn: (actor) => this.afterMonsterTurn(actor),
		monsterTurnCost: () => this.pendingMonsterTurnCost ?? 1,
		awaitHeroInput: () => {
			this.awaitingInput = true;
			this.refresh();
			if (this.travelTarget) this.stepTravel();
		},
		readHunger: () => ({
			hunger: this.hunger,
			partialDamage: this.hungerPartialDamage,
			hp: this.hero.hp,
			maxHp: this.hero.maxHp,
		}),
		writeHunger: (state) => {
			this.hunger = state.hunger;
			this.hungerPartialDamage = state.partialDamage;
			this.hero.hp = state.hp;
		},
		presentHungerEvent: (event) => {
			switch (event.type) {
				case 'hungry': this.say(t('port.log.hungry'), 'warning'); break;
				case 'starving': this.say(t('port.log.starving'), 'warning'); break;
				case 'starvation-damage':
					this.showDamage(this.hero, event.damage);
					this.say(t('port.log.starvation', { damage: event.damage }), 'negative');
					break;
				case 'starvation-death': this.kill(this.hero, 'hunger'); break;
			}
		},
	});
	private readonly heroActions: HeroActionPorts = {
		isParalysed: () => !!this.hero.buffs['paralysis'],
		beginTurn: () => { this.awaitingInput = false; },
		spendTurn: (turnCost?: number) => { if (this.freeTurnNext) this.freeTurnNext = false; else this.spendHeroTurn(turnCost); },
		announceParalysis: () => this.say(t('actors.buffs.paralysis.heromsg'), 'negative'),
		search: () => this.searchForSecrets(),
		attempts: {
			special: () => this.useSpecial(), eat: () => this.eatFood(),
			quaff: () => this.quaffPotion(), read: () => this.readScroll(), upgrade: () => this.upgradeGear(),
		},
		free: {
			examine: () => this.examineTile(this.hero.x, this.hero.y),
			talents: () => {
				this.talentOpen = this.subclassChoiceOpen || this.armorChoiceOpen || this.augmentChoiceOpen || this.itemPickerOpen || !this.talentOpen;
				this.refreshTalentPanel();
			},
			buyHeal: () => this.shopBuy('potion'), buyId: () => this.shopBuy('scrollIdentify'),
			sellFood: () => this.shopSellFood(), buyback: () => this.shopBuyback(),
			save: () => this.saveRun(), load: () => this.loadRun(),
		},
		move: (step) => {
			this.justDescended = false;
			this.actionSpentTurn = false;
			//Furor's attack-only cost (`Hero.attackDelay()` vs `Char.speed()`): when the
			//step leads into a hostile creature, `takeHeroTurn` resolves a bump-attack, so
			//spend that turn here at the attack rate and report it spent - the adapter must
			//not also spend the blanket cost. Movement/door/NPC steps fall through to the
			//adapter's own blanket-cost spend, matching Java's split where Furor never
			//speeds non-attacks. The occupant test mirrors `takeHeroTurn`'s own
			//`occupantAt` query (same `creatureAt`, same NPC exclusion).
			const target = { x: this.hero.x + step.x, y: this.hero.y + step.y };
			const occupant = this.creatureAt(target.x, target.y);
			if (occupant && !occupant.isNPC) {
				this.takeHeroTurn(step);
				if (!this.justDescended && !this.actionSpentTurn) {
					this.actionSpentTurn = true;
					this.spendHeroTurn(this.getAttackTurnCostMod());
				}
				return true;
			}
			this.takeHeroTurn(step);
			// enterLevel already establishes the new floor's first input turn.
			return this.justDescended || this.actionSpentTurn;
		},
		getTurnCostMod: () => this.getActionTurnCostMod(),
	};
	private actionSpentTurn = false;
	private creatureLayer = new Container();
	private itemLayer = new Container();
	private itemsSheet!: SpriteSheet;

	private creatures: Creature[] = [];
	private groundItems: GroundItem[] = [];
	/** Sprite ownership keyed by `EntityId`, kept outside `Creature`/`GroundItem` themselves -
	 * see `SIMULATION_ARCHITECTURE.md`'s "Step 6". Every id that reaches this map is registered
	 * once at spawn and never re-registered, so a plain `Map` (not a WeakMap) is fine; entries
	 * are removed explicitly wherever the sprite is destroyed. */
	private spriteFor = new Map<string, TintedSprite>();
	private sprite(entity: { id: string }): TintedSprite {
		const sprite = this.spriteFor.get(entity.id);
		if (!sprite) throw new Error(`no sprite registered for entity ${entity.id}`);
		return sprite;
	}
	/** Seeds planted during play on floors whose original PaintLevel has no plant array. */
	private manualPlants = new Map<number, string>();
	/** Java room painters place quest NPCs/special mobs at fixed cells. */
	private portedMobSpawns: { x: number; y: number; kind: string; loot?: string }[] = [];
	private portedMobCells = new Set<number>();
	private portedBranchExitCells = new Set<number>();
	private portedWellWater = new Map<number, 'awareness' | 'health' | 'waterOfAwareness' | 'waterOfHealth'>();
	/** Java's generated wells and plants are mutable level features, not terrain. */
	private portedFeatures = new Roguelike.FeatureLayer<SewersScene>();
	/** The Blacksmith MiningLevel branch keeps the parent depth while replacing its map. */
	private miningBranchActive = false;
	private miningBranchEntrance: Step | null = null;
	/** Runtime state for visited depths; the generated layout remains the immutable baseline. */
	private floorStates = new Map<number, FloorState>();
	/** The depth currently represented by `level`; distinct from `depth` during a transition. */
	private activeFloorDepth: number | null = null;
	/**
	 * `Hero.belongings`: a real `mwg/actors` Inventory (stacking, identified flags, upgrade
	 * levels) instead of the old three-counter stand-in. Ground pickups go here (`stone`,
	 * `potion`, `scroll`, `food`, `meat`, `armor`, `wand`, `gold` as kinds); consumables are
	 * spent through the E/Q/I/U/B/N/V actions below.
	 */
	private bag = new Actors.Inventory();
	private itemSerial = 0;
	/** weapon/armor slots: ClothArmor starts equipped (identified), upgrades raise `level` */
	private gear!: Actors.EquipmentSlots<'weapon' | 'armor', Actors.EquippableItem>;
	/** `Waterskin.volume` - dew collected on the hero's behalf (see `collectDewdrop`) */
	private waterskin = 0;
	/** Hunger.HUNGRY=300, STARVING=450, STEP=10 per move */
	private hunger = 0;
	/** Java's `Hunger.partialDamage` - fractional starvation damage carried between turns. */
	private hungerPartialDamage = 0;
	/** the slower TurnClock hunger and wand recharge run on (distinct from the Scheduler) */
	private clock = new World.TurnClock();
	/** Wand.Charger: progress is normalized because Java's delay depends on missing charges. */
	private wandCharges = new Actors.Charges({ max: 4, regenRate: 1 });
	/** Cleric HolyTome: slow charges standing in for the SP economy this port has none of */
	private tomeCharges = new Actors.Charges({ max: 3, regenRate: 20 });
	/** open/closed/locked door state (mwg/roguelike Doors over two terrain kinds) */
	private doors!: Roguelike.Doors;
	private trapKinds = new Map<number, TrapKind>();
	private hero!: Creature;
	private depth = 1;
	/** Java Statistics.deepestFloor, used to cap Bones remains five floors above the run's low point. */
	private deepestDepth = 1;
	private stairs: Step = { x: 0, y: 0 };
	private stairsSprite?: TintedSprite;
	private hasStairs = false;
	/** set by takeHeroTurn when a step lands on the stairs and triggers enterLevel() */
	private justDescended = false;
	/** thrown-weapon charges left for classes whose special is finite (Warrior/Rogue/Duelist); ignored for the rest */
	private ammo = 0;
	/** Shared missile upgrade level (all class missiles are tier-1; rogue knives scale max twice as fast - see useSpecial). No cap, like Java. */
	private missileLevel = 0;
	/** MissileWeapon durability is shared by the active stack; a projectile breaks only at 0. */
	private ammoDurability = 100;
	private projectiles: Array<{ flight: Projectile; sprite: TintedSprite }> = [];
	/** a plain dot for a thrown item or a bolt in flight - there is no real projectile sprite to port for these, just the numbers */
	private dotTexture!: Texture;

	/** `Hero.exp`/`lvl` against SPD's real curve - see `SPD_LEVEL_CURVE` */
	private progression!: Actors.Progression;
	/** base `accuracy`/`evasion`/`gold` a skill point can raise */
	private heroStats!: Actors.StatBlock;
	/** Talent points banked per tier - `Talent.tierLevelThresholds` (tag `v3.3.8`) grants each
	 * tier its own separate pool over its own level window (T1 [2,7), T2 [7,13), T3 [13,21)),
	 * and a tier's points can only ever buy that tier's own talents in real Java; unspent
	 * points never carry across tiers. Indexed 0/1/2 for T1/T2/T3. **Replaces a single shared
	 * `Actors.SkillPoints` pool that let every tier freely cross-spend the same points (found
	 * in the 2026-09-09 hero-progression audit) - `Actors.SkillPoints` was also a StatBlock-
	 * spending primitive being defeated by immediately reverting the `accuracy` bump it caused
	 * as a side effect, just to reuse it as a bare counter; a plain per-tier array needs no
	 * such workaround.** T4's own [21,31) window (10 points) is deliberately never granted -
	 * this port has no T4 talents to spend them on (ROADMAP.md section 6), so granting them
	 * would silently let players over-invest T1-T3 with points real Java only ever lets them
	 * spend on T4. */
	private talentPoints: [number, number, number] = [0, 0, 0];
	/** Hero STR (STARTING_STR=10, +1 per Potion of Strength - no per-level gain in Java either) */
	private heroStr = 10;
	/** Hero.java's independent attackSkill/defenseSkill counters. */
	private heroAttackSkill = 10;
	private heroDefenseSkill = 5;
	private talentAccuracy = 0;
	private talentEvasion = 0;
	/** Java Hero.talents, keyed by the stable Talent enum id. */
	private talentRanks: Record<string, number> = {};
	private talentTier = 1 as 1 | 2 | 3;
	/** MeleeWeapon tier (1-5) and upgrade level; tier affects damage formula: min = tier+lvl, max = 5*(tier+1)+lvl*(tier+1) */
	private weaponTier = 1;
	private weaponLevel = 0;
	/** Armor tier (1-5) and upgrade level; tier affects armor formula similarly */
	private armorTier = 1;
	private armorLevel = 0;
	private weaponId = 'startingWeapon';
	private weaponInstanceId: string | undefined;
	private armorId = 'clothArmor';
	private armorInstanceId: string | undefined;
	/** whether the Wandmaker's frost wand was chosen (zap also dazes) */
	private frostWand = false;
	/** Concrete equipped wand family; old saves fall back to the Wandmaker's boolean. */
	private wandType: WandType = 'magicMissile';
	/** `Charm.object` and `Charm.ignoreNextHit`, keyed by stable creature id. */
	private charmTargets = new Map<string, string>();
	private charmIgnoreNextHit = new Set<string>();

	/** switches/variables the quest stage conditions read */
	private gameState = new Rpg.GameState();
	private quests = new Rpg.QuestLog();
	/** `Ghost.Quest.spawned` / Wandmaker `spawned` - each NPC appears once per run */
	private ghostSpawned = false;
	private wandmakerSpawned = false;
	/** The run's Wandmaker quest type (0 undecided, 1 dust, 2 embers, 3 rotberry) - synced
	 * from levelgen whenever known, persisted so dialogue/turn-in survive save/load. */
	private wandmakerType = 0;
	/** Depths whose keeper has been spawned this run (Java shops sit on 6/11/16/21). Kept
	 * after `shops` replaced the single `shopkeeperSpawned` flag - old saves migrate it
	 * into a depth-6 entry on load. */
	private shopSpawnedDepths = new Set<number>();
	/** Live shelf stock per shop depth (two potions + two identifies each, depleting as
	 * bought - Java's full generated stock needs unported items plus a shop-browse UI,
	 * so the 2-item stand-in stays, now per keeper instead of run-global). */
	private shopStocks = new Map<number, Actors.Inventory>();
	/** `Shopkeeper.buybackItems` per shop depth: what the hero sold here, newest last
	 * (Java appends), capped at `MAX_BUYBACK_HISTORY = 3`, rebought at flat value. */
	private shopBuybackShelves = new Map<number, { id: string; quantity: number; identified?: boolean }[]>();
	/** `Shopkeeper.processHarm()`'s one-warning buffer before fleeing for good. */
	private shopkeeperWarned = false;
	private blacksmithSpawned = false;
	/** Java Blacksmith.Quest.alternative: blood-stained pickaxe instead of 15 DarkGold. */
	private blacksmithAlternative = false;
	private impSpawned = false;
	/** Imp token ask for this run (5 monk tokens on odd depths, 4 golem tokens on even) */
	private impNeed = 5;
	/** `Dungeon.LimitedDrops`: how many times each of these mobs has already dropped its special
	 * loot this run - real Java scales `lootChance()` down further with every successful drop
	 * (`Bat`/`Necromancer`/`Guard` below), reset only on a new game, not per floor. */
	private limitedDrops: Partial<Record<MonsterId, number>> = {};
	/** Ghost Quest.type for this run (1 Fetid Rat, 2 Gnoll Trickster, 3 Great Crab) */
	private ghostType = 1;
	/** Version 3 adds MWG actor serializers (Barrier/Inventory/progression state). Legacy fields
	 * remain accepted by loadRun, so the version bump is an explicit schema marker, not a reset. */
	private saves = new SaveSystem<SaveShape>({ namespace: 'spd-mwg', version: 3 });
	/** Java Bones.dat equivalent: one remains payload survives a run and is consumed once. */
	private bones = new SaveSystem<BonesShape>({ namespace: 'spd-bones', version: 1 });
	/** meta badges across runs (`Badges.java`, persisted separately from any one run) */
	private meta = new SaveSystem<{ counts: [string, number][] }>({ namespace: 'spd-meta', version: 1 });
	private badges = new Achievements();
	/**
	 * `SPDSettings.intro()`/`Document.ADVENTURERS_GUIDE`'s persisted, cross-run state - real
	 * Java only seals the depth-1/2 entrance room behind a hidden-door "tutorial" once, ever,
	 * for a genuinely new install; it un-seals permanently the moment the player reads the
	 * relevant guidebook page, typically within their very first run. This port has no
	 * guidebook-reading interaction (see `entranceRoomContext`'s own comment), so the closest
	 * faithful equivalent is treating the tutorial as satisfied by its real completion signal -
	 * successfully searching out the sealed door - and persisting that permanently, exactly
	 * like a badge. Without this, `entranceRoomContext.guideIntroRead`/`guideSearchingFound`
	 * would default `false` forever, resealing depth 1/2 on every single run rather than only
	 * a new player's first one.
	 */
	private guideProgress = new SaveSystem<{ introRead: boolean; searchingFound: boolean }>({ namespace: 'spd-guide', version: 1 });
	/** talent tiers 3+ (subclass branch at 13, armor-ability capstone at 21) */
	private advancement = new Actors.Advancement(SUBCLASS_TRACK);
	/** per-run shuffled potion/scroll looks, seeded at run start */
	private appearances = new Actors.Appearances(APPEARANCE_TABLES);
	private runSeed = 1;
	private runSeedLong = 1n;
	private runSeedLabel = '';
	/** Java Bones uses gold on custom-seed runs, but may copy eligible loot on normal runs. */
	private seededRun = false;

	private newItemInstanceId(kind: string): string {
		return `${kind}-${this.runSeedLong.toString(36)}-${this.itemSerial++}`;
	}
	/** weapon enchant / armor glyph ids (from the affix tables, or null) */
	private weaponAffix: string | null = null;
	/** Explosive curse's separate 100-point fuse, persisted with the equipped weapon. */
	private weaponCurseDurability = 100;
	private armorGlyph: string | null = null;
	/** Weapon augment choice: SPEED/DAMAGE/NONE. Applied once per weapon at upgrade time. */
	private weaponAugment: 'speed' | 'damage' | 'none' | null = null;
	/** Kinetic's conserved damage (`ConservedDamage.preservedDamage`) - a float: it decays
	 * 2.5%/turn (min 0.1) and reads back with `ceil`, so no integer rounding here. */
	private kineticStored = 0;
	/** `Kinetic.KineticTracker`: attached by every Kinetic (or Unstable-delegated-to-Kinetic)
	 * proc, even at zero conserved - drives the kill-overkill store, then clears per swing. */
	private kineticTrackerHit = false;
	/** The conserved bonus added by this swing's proc (the tracker's `conservedDamage`),
	 * subtracted back out of the overkill so only the true excess is stored. */
	private kineticConservedAdded = 0;
	/** This swing's Unstable delegation for `heroOnHit`'s post-damage branches (null unless
	 * the hero's weapon is Unstable) - both halves of a swing resolve the same enchant. */
	private unstableDelegated: string | null = null;
	/** Swiftthistle's TimeBubble: hero actions advance while automatic actors are frozen. */
	private timeBubbleTurns = 0;
	private timeBubblePresses = new Set<number>();
	/** Timekeeper's Hourglass freeze state; unlike Swiftthistle's bubble it consumes charges. */
	private hourglassFreeze = false;
	private hourglassTurnsToCost = 2;
	/** Java Barrier/BrokenSeal-style shielding, consumed before HP and saved with the run. */
	private heroBarrier = new Actors.Barrier();
	/** `WandOfLivingEarth.RockArmor`: stored rock armor and the wand level that set its cap. */
	private livingEarthArmor = 0;
	private livingEarthWandLevel = 0;
	/** `WandOfRegrowth`'s persistent degradation counters, saved with the wand's run state. */
	private regrowthTotalChargesUsed = 0;
	private regrowthChargesOverLimit = 0;
	/** Barrier.partialLostShield (`actors/buffs/Barrier.java`): fractional decay accumulator. */
	private barrierPartialLoss = 0;
	/** Blocking.BlockBuff's own real shield (`items/weapon/enchantments/Blocking.java`): a separate
	 * Java `ShieldBuff` from Barrier, so it gets its own pool here too (`shieldUsePriority = 2`
	 * drains before Barrier's priority-0 pool on incoming damage - `absorbHeroDamage` honors that
	 * order, which the old single-pool model could not). `setShield()` keeps the higher of the
	 * old/new value (never additive) and always resets the fixed 5-turn cliff-edge expiry
	 * (`BlockBuff.act()`: `left -= 1; left<=0 -> detach()`); the timer here is `blockingTurnsLeft`.
	 * Deliberate simplifications: the `left` decrement is a flat 1/turn - real Java scales both
	 * this and Barrier's proportional decay by `HoldFast.buffDecayFactor()`, but this port has no
	 * HoldFast buff (a Sec 6 talent gap); and a broken shield grants no ProvokedAngerTracker
	 * (same talent gap). */
	private blockingBarrier = new Actors.Barrier();
	private blockingTurnsLeft = 0;
	private stealthTalentTicks = 0;
	/** `Talent.NatureBerriesDropped`: a whole-run counter capping Nature's Bounty's real berry
	 * drops at `2+2*rank` total, never reset mid-run (`revivePersists = true` in Java). */
	private natureBerriesDropped = 0;
	/** `StoneOfIntuition.IntuitionUseTracker`: alternating free/paid intuition uses (first
	 * guess only arms the tracker and keeps the stone, the next guess consumes a stone and
	 * clears it). A plain run flag rather than a buff-map entry, since numeric buffs tick
	 * down and this one must persist until spent (`revivePersists` in Java). */
	private intuitionTracker = false;
	private wandBonusDamage = 0;
	private physicalBonusDamage = 0;
	private physicalBonusAttacks = 0;
	private patientStrikeReady = false;
	private healingEvasionTurns = 0;
	/** Sungrass' Java Health buff: healing is gradual and ends when the hero moves. */
	private sungrassHealing = 0;
	private sungrassPartial = 0;
	/** `Healing` buff's `healingLeft` (`PotionOfHealing.heal()`): HP still owed by a HoT heal. */
	private healingLeft = 0;
	private sungrassPos = -1;
	private deathlessFuryUsed = false;
	private freeTurnNext = false;
	private followupTarget: Creature | null = null;
	private followupDamage = 0;
	private projectileMomentumReady = false;
	/** worn ring {id, level} or null; ring modifiers live on heroStats under source 'ring' */
	private equippedRing: EquippedRing | null = null;
	/**
	 * The extra max HP currently granted by `RingOfMight.HTMultiplier()` (real Java:
	 * x1.035^lvl on max HP, alongside the already-ported flat +lvl STR). `equipRing` is the
	 * only place this changes, so it's tracked as an absolute HP delta rather than folded
	 * into `syncHeroFromStats` (which runs many times per turn from unrelated buff/evasion
	 * paths) - recomputing there on every call would either double-apply or need its own
	 * change-detection, so the delta lives here instead, applied once per actual ring swap.
	 */
	private ringHtBonus = 0;
	/** fire on the ground this floor (`mwg/roguelike` Blob; floor-scoped, not saved) */
	private fire!: Roguelike.Blob;
	/** Java Rotberry ToxicGas and Icecap Freezing blobs, persisted with the floor. */
	private plantGas!: Roguelike.Blob;
	private plantFreeze!: Roguelike.Blob;
	/** ToxicGas.java: both `PotionOfToxicGas.shatter()` and `ToxicTrap.activate()` seed this
	 * same blob class in real Java - `1 + scalingDepth()/5` direct damage/turn, no buff involved. */
	private toxicGas!: Roguelike.Blob;
	/** ParalyticGas.java: `PotionOfParalyticGas.shatter()` seeds this - prolongs `paralysis` each turn. */
	private paralyticGas!: Roguelike.Blob;
	/** MagicalFireRoom.EternalFire (`levels/rooms/special/MagicalFireRoom.java`): a permanent,
	 * non-spreading, non-decaying fire wall. Unlike every other blob here it is never
	 * `spread()`ed - seeded once at 1 per wall cell (Java's own `Blob.seed(cell, 1,
	 * EternalFire.class)` amount), it simply stays until something clears it. Ignites chars
	 * standing on it (`Burning.reignite(4)`); blocks passage for hero and monsters alike
	 * (`onUpdateCellFlags`: `passable = false` while volume > 0); any partial clear
	 * (frost/blizzard/water touching any part) clears the whole floor's wall (`clear()` ->
	 * `fullyClear()`). Deliberate gaps, all narrower than the old "no primitive" claim: no
	 * spread of regular Fire onto flammable terrain (no flammable map exists - same gap as
	 * StoneOfBlast's unported terrain half), no heap burning (no heap-burn primitive), no
	 * water/blizzard clearing (no water-on-fire-cell or Blizzard systems touch blobs), and no
	 * visuals (consistent with every other logic-only blob here). */
	private eternalFire!: Roguelike.Blob;
	/** SacrificialFire blob and its generated prize, adopted from SacrificeRoom. */
	private sacrificialFire!: Roguelike.Blob;
	/** Wandmaker type-2 `RitualSiteRoom` state (`CeremonialCandle.ritualPos` + which of its 4
	 * cardinal neighbours holds a placed candle, N/E/S/W order). Captured from levelgen at
	 * the live bridge and persisted per floor, since the module-level paint state goes stale
	 * on revisits (floors come from the run cache then) and across mining-branch floors. */
	private ritualPos = -1;
	private ritualCandles: boolean[] = [false, false, false, false];
	private sacrificialFireCharge = 0;
	private sacrificialFireCell = -1;
	private sacrificialFirePrize: GroundItem['item'] | undefined;
	/** loot wands: fireblast (cone) and lightning (chain), no recharge (found wands only) */
	private fireCharges = new Actors.Charges({ max: 3, current: 0, regenRate: 9999 });
	private boltCharges = new Actors.Charges({ max: 3, current: 0, regenRate: 9999 });
	/** Ghoul lifelink: downs this floor (first down revives, later ones stick) */
	private ghoulsDowned = 0;
	/** the King's live summoned servants, for LifeLink subjects and death cleanup */
	private kingAdds = new Set<Creature>();
	/** Live LifeLink subjects of the King (damage to them splits onto him - see `attack()`). */
	private kingLinkedAdds = new Set<Creature>();
	/** CavesBossLevel's pylon gate/energy stand-in; the fixed floor supplies these cells. */
	private cavesBossSealed = false;
	private cavesBossEnergyTurns = 0;
	/** In-flight DM300 rockfall volleys on this floor (cells + turns to impact). */
	private fallingRocks: { cells: { x: number; y: number }[]; turns: number }[] = [];
	private readonly cavesBossPylons = [
		{ x: 4, y: 13 }, { x: 28, y: 13 }, { x: 4, y: 37 }, { x: 28, y: 37 },
	] as const;

	private gameLog!: GameLog;
	private statusPane!: StatusPane;
	private infoPanel!: InfoWindow;
	private heroAnimation!: HeroAnimation;
	private compass!: Compass;
	private hintLabel!: Label;
	private actionBar!: SpdToolbar;
	private inventoryPanel!: InventoryWindow;
	private inventoryOpen = false;
	private journalWindow?: Window;
	private journalOpen = false;
	private talentPanel!: Container;
	private talentOpen = false;
	private subclassChoiceOpen = false;
	private armorChoiceOpen = false;
	/** StoneOfAugmentation.onItemSelected(): reuses the same choice-panel mechanism as the
	 * level-up armor-ability/subclass windows, but item-use-triggered instead of level-triggered. */
	private augmentChoiceOpen = false;
	/** Generic item-picker panel (`windows/WndBag.ItemSelector`): a title, one row per eligible
	 * bag entry, and a cancel row. First consumer is ScrollOfTransmutation (its real
	 * `InventoryScroll.itemSelector`); built generic so the other picker-blocked uses
	 * (Stones of Enchantment/Intuition/DetectMagic, shop buy/sell, alchemy) can reuse the same
	 * panel instead of growing their own. Transient UI state, never saved - like every other
	 * choice flag here. */
	private itemPickerOpen = false;
	private itemPickerTitle = '';
	private itemPickerEntries: { id: string; instanceId?: string; identified?: boolean; quantity: number }[] = [];
	private itemPickerOnPick: ((entry: { id: string; instanceId?: string }) => void) | null = null;
	private victoryPanel!: Container;
	private bossChrome!: Container;
	private bossHealthBar!: Bar;
	private bossNameLabel!: Label;
	/** the boss `bossHealthBar` currently tracks, read by its click-to-inspect handler */
	private currentBoss: Creature | null = null;
	/** `BossHealthBar.bleed`: true once the tracked boss drops under 25% HP */
	private bossBleeding = false;
	private badgeBanner!: BadgeBannerLayer;
	/** Item selected from the inventory panel; consumed by the next matching action. */
	private requestedItemId: string | null = null;
	private requestedItemInstanceId: string | undefined;
	/**
	 * Floating damage/heal/status text. It lives in world space under the camera so it tracks
	 * the map, and counter-scales by the camera's zoom so the text itself draws at screen
	 * resolution - `FloatingText`'s own `zoom(1/PixelScene.defaultZoom)`.
	 */
	private floaters = new FloatingTextLayer(1 / 3, 7);
	/** one health bar per damaged creature, `ui/CharHealthIndicator.java` */
	private healthBars = new Map<Creature, Bar>();

	private awaitingInput = false;
	private gameOver = false;
	/** `Hero.travel()`-equivalent: a queued click-to-move destination, walked one step per turn
	 *  via the real pathfinder rather than the single-step move a click used to produce. */
	private travelTarget: Step | null = null;
	/** HP at the moment travel began, so taking any damage along the way interrupts it. */
	private travelStartHp = 0;
	/** whether the current floor came from spdLevelGen/ rather than generateSpdDungeon - changes
	 *  what may be assumed about room order and about how much of a room rect is walkable */
	private portedFloorActive = false;
	/** cells concealing a real SECRET_DOOR, so a search can name what it found */
	private secretDoorCells = new Set<number>();
	private crystalDoorCells = new Set<number>();
	/** the current ported floor's raw, untranslated `Terrain.java` grid (null off a ported
	 * depth) - kept around only so `examineTile` can tell an `EMPTY_DECO`/`BOOKSHELF` cell
	 * apart from plain floor/wall, a distinction `toGameTerrain`'s coarse mapping deliberately
	 * throws away for rendering (see `gameBridge.ts`'s own doc comment) */
	private portedPaint: PaintLevel | null = null;
	/** `SewerLevel`/`PrisonLevel`'s `Sink`/`Torch` decorations at this floor's real `WALL_DECO`
	 * cells - null off a ported depth, or on any other region (neither exists there) */
	private wallDecorations: WallDecorationLayer | null = null;
	/** MiningLevel.BorderDarken equivalent: the custom caves quest border overlay. */
	private miningBorder: TileMap | null = null;
	private branchQuestEntrance: TileMap | null = null;
	/** Halls' DemonSpawnerRoom.CustomFloor overlay, rebuilt from the live spawner state. */
	private demonSpawnerFloor: TileMap | null = null;
	/** `HallsLevel.Stream`/`FireParticle` embers over this floor's real `WATER` cells - null off a
	 * ported Halls depth, or on any other region (no other region has this effect) */
	private waterEmbers: WaterEmberLayer | null = null;
	/** `InterlevelScene` overlay, held above the world/HUD while a floor transition fades. */
	private interlevel: { root: Container; backdrop: TilingSprite; elapsed: number; duration: number; curtain: Graphics; message: Label } | null = null;

	override create(): void {
		setStrongerBossesEnabled(isChallengeEnabled('stronger_bosses'));
		this.heroClass = runState.pendingClass;

		const canvas = document.createElement('canvas');
		canvas.width = 4;
		canvas.height = 4;
		const dotCtx = canvas.getContext('2d')!;
		dotCtx.fillStyle = '#ffffff';
		dotCtx.fillRect(0, 0, 4, 4);
		this.dotTexture = Texture.from(canvas);

		this.camera = new Camera({ zoom: 3, deadzone: 0.25 });
		this.stage.addChild(this.camera.world);
		this.itemsSheet = SpriteSheet.fromTexture(runState.sprites.items, 16, 16);

		this.buildInterface();
		this.quests.define(SAD_GHOST_QUEST);
		this.quests.define(WANDMAKER_QUEST);
		this.quests.define(BLACKSMITH_QUEST);
		this.quests.define(IMP_QUEST);
		this.badges = loadBadges();
		const guide = this.guideProgress.load('guide');
		entranceRoomContext.guideIntroRead = guide?.state.introRead ?? false;
		entranceRoomContext.guideSearchingFound = guide?.state.searchingFound ?? false;
		//per-run appearance shuffle, seeded so the seed fully determines the mapping -
		//every kind is drawn now, inside the seed, so later lookups never touch the RNG
		const seedText = new URLSearchParams(window.location.search).get('seed');
		const requestedSeed = spdSeedValue(seedText);
		this.seededRun = Boolean(seedText?.trim());
		this.runSeedLong = requestedSeed ?? BigInt(Random.int(1, 1 << 30));
		this.runSeed = Number(this.runSeedLong % 4294967296n) >>> 0;
		this.runSeedLabel = seedText?.trim() || String(this.runSeed);
		//a new run: drop any cached ported floors so Dungeon.init()'s run-level resets
		//(SecretRoom's budget, the SpecialRoom queue, Generator's decks) run again from scratch
		resetPortedRun();
		Random.withSeed(this.runSeed, () => {
			this.appearances = new Actors.Appearances(APPEARANCE_TABLES);
			for (const [category, table] of Object.entries(APPEARANCE_TABLES)) {
				for (const kind of table.kinds) this.appearances.appearanceOf(category, kind);
			}
		});
		//Shelf stock is per-shop state now (see `shopStockFor`), seeded on first touch -
		//nothing to pre-fill at run start.
		this.hero = this.makeHero();
		this.heroAnimation = new HeroAnimation(this.sprite(this.hero), runState.sprites[this.heroClass]);
		this.characterEffects = new CharacterEffects(runState.sprites.uiIcons);
		this.ammo = CLASSES[this.heroClass].special.ammo ?? 0;
		this.missileLevel = 0;
		this.ammoDurability = 100;
		this.enterLevel();

		const def = CLASSES[this.heroClass];
		this.say(
			t('port.log.welcome', {
				region: t(REGION_KEYS[regionForDepth(this.depth)]),
				depth: this.depth,
				hero: t(def.nameKey),
				weapon: t(def.weaponKey),
			}),
			'highlight'
		);
		//A keyboard action means the player has taken manual control - cancel any queued
		//click-to-travel rather than let it silently resume after an unrelated keypress.
		const listener = (action: string) => { this.travelTarget = null; this.onAction(action); };
		Input.onAction.add(listener);
		this.onDestroy.add(() => Input.onAction.remove(listener));
	}

	/**
	 * Hero.java: HP=HT=20, attackSkill=10, defenseSkill=5 for every class; weapon (and, for the
	 * Cleric, its own accuracy multiplier) differs by CLASSES[id]. Plus HeroClass.initHero's
	 * real starting kit - ClothArmor (equipped, identified), Food, VelvetPouch, Waterskin and
	 * ScrollOfIdentify knowledge - and each init{Warrior,...} method's own extras: Warrior's
	 * stones + Healing/Rage knowledge, Mage's staff + Upgrade/LiquidFlame knowledge, Rogue's
	 * cloak + knives + Mapping/Invisibility knowledge, Huntress's bow + MindVision/Lullaby,
	 * Duelist's spikes + Strength/MirrorImage, Cleric's tome + Purity/RemoveCurse. Knowledge
	 * items grant one real scroll/potion of that kind (this port has no separate knowledge
	 * layer); the cloak is +3 evasion while worn, simplified from its charge-based stealth.
	 */
	private makeHero(): Creature {
		const def = CLASSES[this.heroClass];
		const sheet = heroSheet(runState.sprites[this.heroClass]);
		const sprite = new TintedSprite(sheet.get(HERO_IDLE_FRAME));
		placeCharacterArt(sprite);
		this.creatureLayer.addChild(sprite);

		this.heroStats = new Actors.StatBlock({ base: { accuracy: def.accuracy, evasion: 5, gold: 0 } });
		this.talentRanks = {};
		this.talentTier = 1;
		this.heroBarrier.clear();
		this.barrierPartialLoss = 0;
		this.blockingBarrier.clear();
		this.blockingTurnsLeft = 0;
		this.itemPickerOpen = false;
		this.itemPickerEntries = [];
		this.itemPickerOnPick = null;
		this.deathlessFuryUsed = false;
		this.stealthTalentTicks = 0;
		this.natureBerriesDropped = 0;
		this.intuitionTracker = false;
		this.wandBonusDamage = 0;
		this.physicalBonusDamage = 0;
		this.physicalBonusAttacks = 0;
		this.patientStrikeReady = false;
		this.healingEvasionTurns = 0;
		this.talentPoints = [0, 0, 0];
		this.progression = new Actors.Progression(SPD_LEVEL_CURVE, { level: 1, experience: 0 });
		this.gear = new Actors.EquipmentSlots(['weapon', 'armor'], null);
		this.gear.equip('armor', { modifiers: [] });
		this.armorInstanceId = this.newItemInstanceId('armor');
		this.bag.add({ id: 'clothArmor', quantity: 1, instanceId: this.armorInstanceId, identified: true, level: 0 });
		this.bag.add({ id: 'food', quantity: 1, stackable: true, identified: true });
		this.bag.add({ id: 'velvetPouch', quantity: 1, identified: true });
		this.bag.add({ id: 'scrollIdentify', quantity: 1, stackable: true, identified: true });
		this.bag.add({ id: 'waterskin', quantity: 1, identified: true });
		if (this.heroClass === 'warrior') {
			this.bag.add({ id: 'potionHealing', quantity: 1, stackable: true, identified: true });
			this.bag.add({ id: 'scrollRage', quantity: 1, stackable: true, identified: true });
		} else if (this.heroClass === 'mage') {
			this.bag.add({ id: 'scrollUpgrade', quantity: 1, stackable: true, identified: true });
			this.bag.add({ id: 'potionFlame', quantity: 1, stackable: true, identified: true });
		} else if (this.heroClass === 'rogue') {
			this.bag.add({ id: 'cloak', quantity: 1, identified: true });
			this.bag.add({ id: 'scrollMapping', quantity: 1, stackable: true, identified: true });
			this.bag.add({ id: 'potionInvis', quantity: 1, stackable: true, identified: true });
		} else if (this.heroClass === 'huntress') {
			this.bag.add({ id: 'spiritBow', quantity: 1, identified: true });
			this.bag.add({ id: 'potionMindVision', quantity: 1, stackable: true, identified: true });
			this.bag.add({ id: 'scrollLullaby', quantity: 1, stackable: true, identified: true });
		} else if (this.heroClass === 'duelist') {
			this.bag.add({ id: 'potionStrength', quantity: 1, stackable: true, identified: true });
			this.bag.add({ id: 'scrollMirror', quantity: 1, stackable: true, identified: true });
		} else {
			this.bag.add({ id: 'holyTome', quantity: 1, identified: true });
			this.bag.add({ id: 'potionPurity', quantity: 1, stackable: true, identified: true });
			this.bag.add({ id: 'scrollCleanse', quantity: 1, stackable: true, identified: true });
		}

		const hero = baseCreature({
			name: t('port.name.you'),
			x: 0,
			y: 0,
			hp: 20,
			maxHp: 20,
			accuracy: this.heroStats.get('accuracy'),
			evasion: this.heroStats.get('evasion') + (this.heroClass === 'rogue' ? 3 : 0),
			damage: def.damage,
			armor: [0, 2],
			isHero: true,
			speed: def.speed,
			sleeping: false,
			str: this.heroStr,
			strReq: 10,
			weaponLevel: 0,
		});
		this.spriteFor.set(hero.id, sprite);
		this.creatures.push(hero);
		return hero;
	}

	/** copies the StatBlock's resolved values into the flat fields combat actually reads - the same pattern mwg's own dungeon example uses for equipment */
	private syncHeroFromStats(): void {
		//Hero.java increments the raw skills, then applies weapon/armor factors when
		//attackSkill()/defenseSkill() is queried. Keep those counters separate from
		//talent points so every level has the real +1/+1 combat-skill growth.
		this.heroStats.setBase('accuracy', Math.floor(this.heroAttackSkill * (this.heroClass === 'cleric' ? 1.4 : 1)) + this.talentAccuracy);
		this.heroStats.setBase('evasion', this.heroDefenseSkill + this.talentEvasion);
		this.hero.accuracy = this.heroStats.get('accuracy');
		//CloakOfShadows is +3 evasion while carried here (its charge-based stealth is not modelled)
		this.hero.evasion = this.heroStats.get('evasion') + (this.heroClass === 'rogue' ? 3 : 0) + evasiveArmorBonus(this.subclass(), this.talentRank('evasive_armor'), this.armorLevel) + unencumberedSpiritEvasion(this.subclass(), this.talentRank('unencumbered_spirit'));
		if (this.healingEvasionTurns > 0) this.hero.evasion = this.talentRank('restored_agility') >= 2 ? 1000000 : this.hero.evasion * 4;
		this.hero.str = this.heroStr + (this.equippedRing && ringDef(this.equippedRing.id)?.stat === 'strength' ? this.equippedRing.level : 0);
		if (this.hero.buffs['adrenalineSurge']) this.hero.str += 1;
		//Strongman is the one always-on T1/T2 talent that changes Hero.STR directly.
		this.hero.str += Math.floor(this.heroStr * (0.03 + 0.05 * this.talentRank('strongman')));
		//MeleeWeapon: min = tier+lvl, max = 5*(tier+1)+lvl*(tier+1). Tier affects scaling:
		//tier 1: [1+lvl, 10+2*lvl], tier 2: [2+lvl, 15+3*lvl], etc.
		//Starting values (from CLASSES) are ignored; tier determines base damage.
		//`Item.buffedLevel()`: under Degrade both read through `degradedLevel` - the only
		//two formulas Java routes through buffed levels (damage rolls and armor DR); proc
		//chances and upgrade-loss rolls below deliberately keep the TRUE level (`level()`).
		const effWeapon = this.degradedLevel(this.weaponLevel);
		const effArmor = this.degradedLevel(this.armorLevel);
		this.hero.damage = [this.weaponTier + effWeapon, 5 * (this.weaponTier + 1) + effWeapon * (this.weaponTier + 1)];
		const bark = this.talentRank('barkskin');
		//Armor: min = lvl, max = tier*(2+lvl). Tier 1 (cloth): [lvl, 2+lvl],
		//tier 2 (leather): [lvl, 4+2*lvl], tier 3 (mail): [lvl, 6+3*lvl], etc.
		//Armor.DRMin/DRMax under the real NO_ARMOR challenge: min drops to a flat 0, max drops to
		//1+tier+lvl(+augment, not modeled here) instead of the normal tier*(2+lvl) scaling -
		//found dead alongside champion_enemies/darkness while auditing every challenge toggle.
		//`bark` (Barkskin talent rank) is this port's own additive layer on top of either
		//formula, not part of Java's DRMin/DRMax bodies themselves, so it stays unconditional.
		this.hero.armor = isChallengeEnabled('no_armor')
			? [bark > 0 ? 1 : 0, 1 + this.armorTier + effArmor + bark]
			: [effArmor + (bark > 0 ? 1 : 0), this.armorTier * (2 + effArmor) + bark];
		const subclass = this.subclass();
		if (subclass === 'champion') this.hero.damage = [this.hero.damage[0] + 1, this.hero.damage[1] + 1];
		if (subclass === 'warden' && this.level && this.level.get(this.hero.x, this.hero.y) === HIGH_GRASS) {
			this.hero.armor = [this.hero.armor[0] + 2, this.hero.armor[1] + 2];
		}
		//passive affix math lives here, next to every other flat stat: Wayward -3 accuracy,
		//Stone +2 armor, Fragile -2 armor (floored at 0), Flow +2 evasion
		if (this.weaponAffix === 'wayward') this.hero.accuracy = Math.max(0, this.hero.accuracy - 3);
		if (this.armorGlyph === 'stone') this.hero.armor = [this.hero.armor[0] + 2, this.hero.armor[1] + 2];
		if (this.armorGlyph === 'flow') this.hero.evasion += 2;
		//ring effects: Might already widened hero.str above; Tenacity's real
		//`RingOfTenacity.damageMultiplier()` is applied directly to incoming damage in
		//`absorbHeroDamage` (it scales with current missing HP, so it can't be baked into a
		//static StatBlock modifier here) - skipped in this loop the same way 'strength' is;
		//Accuracy/Evasion ride the StatBlock as source-'ring' modifiers, re-applied whole
		//through scaledModifiers with the ring's own curve evaluated at its level
		this.heroStats.removeModifiersFrom('ring');
		if (this.equippedRing) {
			const def = ringDef(this.equippedRing.id);
			const level = this.equippedRing.level;
			//Stats applied outside the StatBlock loop (direct damage/turn-cost reads) are
			//marker-only here: Might (str), Tenacity (incoming-damage curve), Haste/Energy
			//(turn-cost/wand-rate divisors), Wealth/Arcana/Force/Sharpshooting (kill-loot,
			//proc-chance, flat damage bonuses), Elements (elemental-damage multiplier) and
			//Furor (attack-only turn-cost divisor). A Set, not an OR-chain (see ROADMAP §11).
			if (def && !NON_STATBLOCK_RING_STATS.has(def.stat)) {
				for (const modifier of Actors.scaledModifiers(level, [{ stat: def.stat, op: def.op, base: def.at(level), perLevel: 0 }])) {
					this.heroStats.addModifier({ ...modifier, source: 'ring' });
				}
				this.hero.accuracy = this.heroStats.get('accuracy') + (this.weaponAffix === 'wayward' ? -3 : 0);
				this.hero.evasion = this.heroStats.get('evasion') + (this.heroClass === 'rogue' ? 3 : 0) + (this.armorGlyph === 'flow' ? 2 : 0);
			}
		}
		if (subclass === 'freerunner' && !this.creatures.some((c) => !c.isHero && !c.isNPC && Roguelike.chebyshevDistance(this.hero, c) <= 1)) {
			this.hero.evasion += 2;
		}
	}

	/**
	 * `Hero.java`'s level-up block: `HT = 20 + 5*(lvl-1)`, `attackSkill++`, `defenseSkill++`
	 * every level. Talent points follow `Talent.tierLevelThresholds`'
	 * real windows: tier 1 spans levels 2-6, tier 2 levels 7-12, and subclass talent points
	 * continue through the later tiers. The panel exposes the Java Tier 1/2 nodes and the
	 * selected subclass's Tier 3 nodes; Advancement still owns the level-13 branch and the
	 * level-21 armor-ability choice.
	 */
	private grantExperience(amount: number): void {
		const gained = this.progression.addExperience(amount);
		if (gained <= 0) return;

		for (let i = 0; i < gained; i++) {
			const level = this.progression.level - gained + i + 1;
			const oldMax = this.hero.maxHp;
			this.hero.maxHp = 20 + 5 * (level - 1);
			this.hero.hp += this.hero.maxHp - oldMax;
			this.heroAttackSkill++;
			this.heroDefenseSkill++;
			this.syncHeroFromStats();

			//Talent points are intentionally separate from the combat-skill counters. Each
			//tier's own window (see `talentPoints`'s own comment) grants into that tier's own
			//bucket only - T4's [21,31) window is not granted at all (no T4 talents exist here).
			if (level >= TALENT_TIERS[1] && level < TALENT_TIERS[2]) this.talentPoints[0]++;
			else if (level >= TALENT_TIERS[2] && level < TALENT_TIERS[3]) this.talentPoints[1]++;
			else if (level >= TALENT_TIERS[3] && level < TALENT_TIERS[4]) this.talentPoints[2]++;
			//Advancement tiers 3-4 live on the real thresholds (13/21)
			this.advancement.grant(level);
			if (SUBCLASS_OPTIONS[this.heroClass] && this.advancement.openTiers(level).includes(0) && !this.subclass()) {
				this.subclassChoiceOpen = true;
				this.talentOpen = true;
			}
			if (this.advancement.openTiers(level).includes(1) && !this.advancement.choice(1)) {
				this.armorChoiceOpen = true;
				this.talentOpen = true;
			}
		}

		this.say(t('port.log.levelup', { level: this.progression.level }), 'positive');
		runState.audio.cue('levelup', 0.75);

		//The point ledger remains available in the panel; the subclass branch is also presented
		//there instead of silently choosing the first option.
	}

	/** any monster in MONSTERS, cut from its own real sprite sheet at its own real frame size */
	private spawnMonster(kind: AnyMonsterId, at: Step, restoring = false, mimicLoot?: string, isAlly = false, allyKind?: 'mirror' | 'sheep'): Creature {
		const baseDef = MONSTERS[kind];
		//Data-driven: was two long ternary chains (a 7-kind stat-override chain and a 10-kind
		//base-alias chain) - see `DEPTH_SCALED_STATS`/`BASE_KIND_ALIASES` in monsters.ts.
		const statOverride = DEPTH_SCALED_STATS[kind]?.(this.depth);
		const def = statOverride ? { ...baseDef, ...statOverride } : baseDef;
		const baseKind: MonsterId = BASE_KIND_ALIASES[kind] ?? (kind as MonsterId);
		//Data-driven: was a 12-case cascade checking both `kind` and `baseKind` - see
		//`SPRITE_KIND_OVERRIDE`'s own doc comment in monsters.ts for why `baseKind` alone
		//covers every case the original also checked `kind` for.
		const texture = runState.sprites[SPRITE_KIND_OVERRIDE[baseKind] ?? (baseKind as keyof typeof runState.sprites)];
		const sheet = SpriteSheet.fromTexture(texture, def.frame[0], def.frame[1]);
		const sprite = new AnimatedSprite(sheet.get(def.idle));
		placeCharacterArt(sprite);
		// Java's base variants use MWG's player. Shaman/elemental/fist variants and
		// DM300 supercharge effects still follow the port's reduced gameplay roster.
		//SPRITE_ANIMATIONS keys off each Java sprite class's own name (SpawnerSprite -> "spawner",
		//RipperSprite -> "ripper"), not the MonsterId - same reason necroSkeleton/yogFist alias.
		const clips = SPRITE_ANIMATIONS[
			kind === 'necroSkeleton' ? 'skeleton'
				: kind === 'yogFist' ? 'fist'
				: kind === 'demonSpawner' ? 'spawner'
				: kind === 'ripperDemon' ? 'ripper'
				: baseKind.toLowerCase()
		];
		if (clips) {
			for (const [name, clip] of Object.entries(clips)) sprite.add(name, clip.frames.map(frame => sheet.get(frame)), clip);
			sprite.play('idle');
		}
		sprite.x = at.x * TILE;
		sprite.y = at.y * TILE;
		this.creatureLayer.addChild(sprite);

		const isNPC = NPC_KINDS.has(kind);
		const isBoss = BOSS_KINDS.has(kind);
		const monster = baseCreature({
			name: t(MOB_KEYS[kind] ?? MOB_KEYS.statue),
			x: at.x,
			y: at.y,
			hp: def.hp,
			maxHp: def.hp,
			accuracy: def.accuracy,
			evasion: def.evasion,
			damage: def.damage,
			armor: def.armor,
			kind,
			pumped: kind === 'goo' ? 0 : undefined,
			isNPC,
			isAlly,
			allyKind,
			npcKind: isNPC ? (kind as 'ghost' | 'wandmaker' | 'shopkeeper' | 'blacksmith' | 'imp' | 'ratKing') : undefined,
			//Mob.java: everything spawns SLEEPING (bosses and NPCs excepted); champions are a
			//flat 10% roll here (real `rollForChampion` instead scales the roster-wide budget
			//by depth via `Dungeon.mobsToChampion`, not modeled). All 6 real ChampionEnemy types
			//are now represented (`Random.Int(6)` in Java, `Random.element` on all 6 here) -
			//Projecting's `canAttackWithExtraReach()` (2/4-cell melee reach via pathfinding) is
			//still not modeled, so it only gets its damage-factor half; see `PORT_COVERAGE.md`.
			//**`rollForChampion` only ever assigns a champion at all when the real
			//`Challenges.CHAMPION_ENEMIES` challenge is active** - found this pass auditing why
			//this port's own selectable "Champion Enemies" challenge toggle (`isChallengeEnabled`,
			//already wired for `stronger_bosses`) did nothing either way: champions spawned at the
			//same flat 10% whether the challenge was on or off. Gated behind that toggle now, so
			//toggling it actually changes anything - the flat-10%-vs-real-depth-scaled-budget
			//simplification itself is unchanged and still tracked above.
			//NEVER_SLEEPS_KINDS: spawn already awake (real Java state=PASSIVE/WANDERING, never
			//SLEEPING) - DemonSpawner/Sentry/RotHeart/RotLasher/the newborn elemental, plus the
			//Ghost-quest mobs spawned mid-quest with the hero already nearby.
			sleeping: isAlly ? false : restoring || !(isNPC || isBoss || NEVER_SLEEPS_KINDS.has(kind)),
			//rollForChampion() also blocks certain standout enemies from becoming champions on
			//shallow floors (`instanceof` checks, so Java's own GreatCrab/Bandit subclasses are
			//covered by the Crab/Thief checks too) - `this.depth` substitutes for `scalingDepth()`
			//the same way every other depth-scaled formula in this file already does.
			champion: isAlly ? null : restoring || !isChallengeEnabled('champion_enemies')
				|| ((kind === 'crab' || kind === 'greatCrab') && this.depth <= 3)
				|| (baseKind === 'thief' && this.depth <= 4)
				|| (kind === 'guard' && this.depth <= 7)
				|| (kind === 'bat' && this.depth <= 9)
				? null : (!isNPC && !isBoss && kind !== 'necroSkeleton' && kind !== 'demonSpawner' && kind !== 'sentry' && kind !== 'rotHeart' && kind !== 'rotLasher' && kind !== 'newbornElemental' && Random.chance(0.1) ? Random.element(['blessed', 'blazing', 'giant', 'growing', 'antimagic', 'projecting'] as const)! : null),
			championPower: 1.19,
			combo: 0,
			moving: 0,
			skeleton: null,
			firstSummon: true,
			arenaJumps: 0,
			//DM300's opening `abilityCooldown = NormalIntRange(5, 9)` rolls in its Java
			//constructor (levelgen time); here it rolls once at spawn on the gameplay
			//stream instead (restored floors overwrite it from the save right after).
			dmAbilityTurns: -1,
			dmAbilityCd: Random.normalRange(5, 9),
			dmLastAbility: 0,
			generation: 0,
			mimicLoot,
			mimicRevealed: kind === 'crystalMimic' ? false : undefined,
		});
		this.spriteFor.set(monster.id, sprite);
		if (isAlly) {
			sprite.alpha = 0.72;
			sprite.colorAdd = allyKind === 'sheep' ? 0xdddddd : 0x5577aa;
		}
		//Monk.java: enters HUNTING with Focus (one guaranteed dodge, re-earned over ~6 turns)
		if (kind === 'monk' || kind === 'senior') addBuff(monster, 'focus');
		this.creatures.push(monster);
		// A restored creature receives its saved scheduler time below. Rolling a fresh stagger
		// here would both lose turn order and perturb the run's random stream.
		if (!restoring) this.scheduler.add(monster, Random.float(0.1, 0.9));
		return monster;
	}

	/** ScrollOfMirrorImage's two one-hit-point allied copies use the hero's current combat
	 * values.  A rat sprite is only the available actor-sheet carrier; the ally flag keeps it
	 * out of hostile loot/champion logic and the blue tint makes the visual distinction clear. */
	private spawnMirrorImage(at: Step): Creature {
		const image = this.spawnMonster('rat', at, false, undefined, true);
		image.name = `${this.hero.name} (image)`;
		image.hp = 1;
		image.maxHp = 1;
		image.accuracy = this.hero.accuracy;
		image.evasion = this.hero.evasion;
		image.damage = [...this.hero.damage] as [number, number];
		image.armor = [...this.hero.armor] as [number, number];
		image.sleeping = false;
		image.seesHero = true;
		image.allyKind = 'mirror';
		const sprite = this.sprite(image);
		sprite.alpha = 0.72;
		sprite.colorAdd = 0x5577aa;
		return image;
	}

	/** `Sheep.initialize(8)` gives a neutral, invulnerable NPC a lifespan of roughly eight
	 * actor turns. The compact actor model uses the shared ally scheduler and a tinted carrier
	 * sprite, but preserves the important gameplay result: sheep do not attack and disappear
	 * after their lifespan. */
	private spawnSheep(at: Step): Creature {
		const sheep = this.spawnMonster('rat', at, false, undefined, true, 'sheep');
		sheep.name = 'Sheep';
		sheep.hp = sheep.maxHp = 1;
		sheep.sheepTurns = Math.max(1, Math.round(Random.float(6, 10)));
		sheep.sleeping = false;
		const sprite = this.sprite(sheep);
		sprite.alpha = 0.62;
		sprite.colorAdd = 0xdddddd;
		return sheep;
	}

	private captureActiveFloor(): void {
		if (this.activeFloorDepth === null) return;
		const creatures: SavedCreature[] = [];
		const savedIndex = new Map<Creature, number>();
		for (const creature of this.creatures) {
			if (!creature.isHero && creature.kind) savedIndex.set(creature, savedIndex.size);
		}
		for (const creature of this.creatures) {
			if (creature.isHero || !creature.kind) continue;
			creatures.push({
				kind: creature.kind,
				x: creature.x, y: creature.y, hp: creature.hp, maxHp: creature.maxHp,
				accuracy: creature.accuracy, evasion: creature.evasion,
				damage: [...creature.damage] as [number, number], armor: [...creature.armor] as [number, number],
				buffs: Object.entries(creature.buffs) as [BuffId, number][],
				sleeping: creature.sleeping, champion: creature.champion, championPower: creature.championPower, pumped: creature.pumped,
				combo: creature.combo, moving: creature.moving, arenaJumps: creature.arenaJumps, tenguAbilityCd: creature.tenguAbilityCd,
				yogPhase: creature.yogPhase,
				kingPhase: creature.kingPhase, kingSummonsMade: creature.kingSummonsMade, kingSummonCd: creature.kingSummonCd,
				kingAbilityCd: creature.kingAbilityCd, kingLastAbility: creature.kingLastAbility, kingShield: creature.kingShield,
				kingReactionsState: creature.kingReactions?.toJSON(),
				weaponLevel: creature.weaponLevel, stolen: creature.stolen, mimicLoot: creature.mimicLoot, generation: creature.generation,
				spawnCooldown: creature.spawnCooldown, seesHero: creature.seesHero, mimicRevealed: creature.mimicRevealed,
				hasteTurns: creature.hasteTurns, hasteBaseSpeed: creature.hasteBaseSpeed,
				hasRaged: creature.hasRaged, raged: creature.raged, chainUsed: creature.chainUsed,
				ventCooldown: creature.ventCooldown, webCooldown: creature.webCooldown, golemTeleCooldown: creature.golemTeleCooldown,
				beamCharged: creature.beamCharged, beamCooldown: creature.beamCooldown, armoredRageTicks: creature.armoredRageTicks,
				rangedCooldown: creature.rangedCooldown, newbornTarget: creature.newbornTarget ? { ...creature.newbornTarget } : undefined,
				stuckAmmo: creature.stuckAmmo, sentryWarmup: creature.sentryWarmup,
				dmAbilityTurns: creature.dmAbilityTurns, dmAbilityCd: creature.dmAbilityCd, dmLastAbility: creature.dmLastAbility,
				skeletonIndex: creature.skeleton ? savedIndex.get(creature.skeleton) : undefined,
				firstSummon: creature.firstSummon,
				isAlly: creature.isAlly,
				allyKind: creature.allyKind,
				sheepTurns: creature.sheepTurns,
				nextTurn: this.scheduler.timeOf(creature),
			});
		}
		this.floorStates.set(this.activeFloorDepth, {
			terrain: Array.from(this.level.terrain),
			doors: this.doors.toJSON(),
			secrets: this.secrets.toJSON(),
			trapKinds: [...this.trapKinds],
			secretDoorCells: [...this.secretDoorCells],
			crystalDoorCells: [...this.crystalDoorCells],
			fire: this.fire.toJSON(),
			plantGas: this.plantGas.toJSON(),
			plantFreeze: this.plantFreeze.toJSON(),
			toxicGas: this.toxicGas.toJSON(),
			paralyticGas: this.paralyticGas.toJSON(),
			portedFeatures: this.portedFeatures.toJSON(),
			ritualPos: this.ritualPos,
			ritualCandles: [...this.ritualCandles],
			eternalFire: this.eternalFire.toJSON(),
			sacrificialFire: this.sacrificialFire.toJSON(),
			sacrificialFireCharge: this.sacrificialFireCharge,
			sacrificialFireCell: this.sacrificialFireCell,
			sacrificialFirePrize: this.sacrificialFirePrize,
			groundItems: this.groundItems.map(({ kind, x, y, item, chest, forSale }) => ({ kind, x, y, item, chest, forSale })),
			fallingRocks: this.fallingRocks.map((v) => ({ cells: v.cells.map((c) => ({ ...c })), turns: v.turns })),
			manualPlants: [...this.manualPlants.entries()],
			creatures,
			schedulerNow: this.scheduler.now,
		});
	}

	private restoreFloor(state: FloorState): void {
		if (state.terrain.length !== this.level.cellCount) return;
		this.level.terrain.set(state.terrain);
		this.secrets = Roguelike.Secrets.fromJSON(this.level, state.secrets);
		this.doors = Roguelike.Doors.fromJSON(this.level, state.doors);
		this.trapKinds = new Map(state.trapKinds);
		this.secretDoorCells = new Set(state.secretDoorCells);
		this.crystalDoorCells = new Set(state.crystalDoorCells);
		this.fire = Roguelike.Blob.fromJSON(state.fire);
		this.plantGas = state.plantGas ? Roguelike.Blob.fromJSON(state.plantGas) : new Roguelike.Blob(this.level.width, this.level.height);
		this.plantFreeze = state.plantFreeze ? Roguelike.Blob.fromJSON(state.plantFreeze) : new Roguelike.Blob(this.level.width, this.level.height);
		this.toxicGas = state.toxicGas ? Roguelike.Blob.fromJSON(state.toxicGas) : new Roguelike.Blob(this.level.width, this.level.height);
		this.paralyticGas = state.paralyticGas ? Roguelike.Blob.fromJSON(state.paralyticGas) : new Roguelike.Blob(this.level.width, this.level.height);
		this.manualPlants = new Map(state.manualPlants ?? []);
		this.fallingRocks = (state.fallingRocks ?? []).map((v) => ({ cells: v.cells.map((c) => ({ ...c })), turns: v.turns }));
		this.restorePortedFeatures(state.portedFeatures);
		for (const [cell, kind] of this.manualPlants) this.placePortedFeature(cell, kind);
		this.eternalFire = state.eternalFire ? Roguelike.Blob.fromJSON(state.eternalFire) : new Roguelike.Blob(this.level.width, this.level.height);
		this.ritualPos = state.ritualPos ?? -1;
		this.ritualCandles = [...(state.ritualCandles ?? [false, false, false, false])];
		this.sacrificialFire = state.sacrificialFire ? Roguelike.Blob.fromJSON(state.sacrificialFire) : new Roguelike.Blob(this.level.width, this.level.height);
		this.sacrificialFireCharge = state.sacrificialFireCharge ?? 0;
		this.sacrificialFireCell = state.sacrificialFireCell ?? -1;
		this.sacrificialFirePrize = state.sacrificialFirePrize;
		for (const item of state.groundItems) this.spawnGroundItem(item.kind, item.x, item.y, item.item, item.chest, item.forSale);

		this.scheduler.clear();
		this.scheduler.now = state.schedulerNow;
		const restored: Creature[] = [];
		for (const saved of state.creatures) {
			const creature = this.spawnMonster(saved.kind, saved, true, saved.mimicLoot, saved.isAlly, saved.allyKind);
			Object.assign(creature, {
				hp: saved.hp, maxHp: saved.maxHp, accuracy: saved.accuracy, evasion: saved.evasion,
				damage: [...saved.damage] as [number, number], armor: [...saved.armor] as [number, number],
				buffs: Object.fromEntries(saved.buffs), sleeping: saved.sleeping, champion: saved.champion,
				championPower: saved.championPower, pumped: saved.pumped, combo: saved.combo, moving: saved.moving, arenaJumps: saved.arenaJumps, tenguAbilityCd: saved.tenguAbilityCd,
				yogPhase: saved.yogPhase,
				kingPhase: saved.kingPhase, kingSummonsMade: saved.kingSummonsMade, kingSummonCd: saved.kingSummonCd,
				kingAbilityCd: saved.kingAbilityCd, kingLastAbility: saved.kingLastAbility, kingShield: saved.kingShield,
				kingReactions: saved.kingReactionsState
					? ReactionTable.fromJSON(this.kingPhaseRules(creature), saved.kingReactionsState)
					: undefined,
				weaponLevel: saved.weaponLevel, stolen: saved.stolen, mimicLoot: saved.mimicLoot, generation: saved.generation,
				spawnCooldown: saved.spawnCooldown, seesHero: saved.seesHero,
				mimicRevealed: saved.mimicRevealed ?? Boolean(saved.stolen),
				hasteTurns: saved.hasteTurns, hasteBaseSpeed: saved.hasteBaseSpeed,
				hasRaged: saved.hasRaged, raged: saved.raged, chainUsed: saved.chainUsed,
				ventCooldown: saved.ventCooldown, webCooldown: saved.webCooldown, golemTeleCooldown: saved.golemTeleCooldown,
				beamCharged: saved.beamCharged, beamCooldown: saved.beamCooldown, armoredRageTicks: saved.armoredRageTicks,
				rangedCooldown: saved.rangedCooldown, newbornTarget: saved.newbornTarget ? { ...saved.newbornTarget } : undefined,
				stuckAmmo: saved.stuckAmmo, sentryWarmup: saved.sentryWarmup,
				dmAbilityTurns: saved.dmAbilityTurns, dmAbilityCd: saved.dmAbilityCd, dmLastAbility: saved.dmLastAbility,
				firstSummon: saved.firstSummon ?? true,
				isAlly: saved.isAlly,
				allyKind: saved.allyKind,
				sheepTurns: saved.sheepTurns,
				speed: saved.hasteTurns ? (saved.hasteBaseSpeed ?? 1) * 2 : undefined,
			});
			this.scheduler.add(creature, Math.max(0, (saved.nextTurn ?? state.schedulerNow) - state.schedulerNow));
			restored.push(creature);
		}
		for (let i = 0; i < state.creatures.length; i++) {
			const skeletonIndex = state.creatures[i].skeletonIndex;
			if (skeletonIndex !== undefined) restored[i].skeleton = restored[skeletonIndex] ?? null;
		}
	}

	private enterLevel(): void {
		this.captureActiveFloor();
		//Pixi keeps a per-render-group list of renderables still awaiting a transform update.
		//A container dropped from the tree without being destroyed can stay on that list, and
		//updating it then reads `parentRenderGroup` off nothing - "Cannot read properties of
		//undefined (reading 'updateRenderable')".  The outgoing floor's tilemap holds a sprite
		//per cell per layer, so it is destroyed rather than merely orphaned; the same goes for
		//the stair and entrance sprites, which are rebuilt per floor further down.
		//
		//The hero's sprite is the one exception - it outlives the floor and is re-added below -
		//so it is detached before the layer is emptied, keeping it clear of the destroy.
		if (this.hero) this.creatureLayer.removeChild(this.sprite(this.hero));
		this.map?.destroy({ children: true });
		this.wallsMap?.destroy({ children: true });
		this.featuresMap?.destroy({ children: true });
		this.fog?.destroy();
		this.wallBlocking?.destroy({ children: true });
		this.waterSurface?.destroy({ children: true });
		this.miningBorder?.destroy();
		this.miningBorder = null;
		this.branchQuestEntrance?.destroy();
		this.branchQuestEntrance = null;
		this.demonSpawnerFloor?.destroy();
		this.demonSpawnerFloor = null;
		this.stairsSprite = undefined;
		//the floater layer itself survives the floor (it is re-added below), but its live
		//texts must not: a damage number from the last floor would hang in mid-air on this one
		this.floaters.clear();
		this.camera.world.removeChild(this.floaters);
		//health bars are per-creature and every non-hero creature is about to be dropped
		for (const bar of this.healthBars.values()) bar.destroy();
		this.healthBars.clear();
		this.compass?.reset();
		this.camera.world.removeChildren();
		for (const sprite of this.creatureLayer.removeChildren()) sprite.destroy();
		for (const motion of this.monsterMotion.values()) motion.clear();
		this.monsterMotion.clear();
		this.dyingMonsters.clear();
		this.characterEffects?.clear();
		for (const sprite of this.itemLayer.removeChildren()) sprite.destroy();
		this.creatures = this.creatures.filter((c) => c.isHero);
		this.groundItems = [];
		this.manualPlants.clear();
		this.portedMobSpawns = [];
		this.portedMobCells.clear();
		this.portedBranchExitCells.clear();
		this.portedWellWater.clear();
		this.scheduler.clear();

		const region = regionForDepth(this.depth);
		const savedFloor = this.miningBranchActive ? null : this.floorStates.get(this.depth);
		if (this.depth === 26) runState.audio.endDungeon();
		else runState.audio.enterDungeon(region, this.depth in BOSSES);
		this.terrainSheet = SpriteSheet.fromTexture(runState.sprites[region], TILE);

		//One run seed owns every floor.  The previous depth-only seed made floor 1 identical
		//in every run, so a screenshot could never be compared against a selected seed.
		//
		//Sewers 1-4 and Prison 6-9 come from spdLevelGen/, the port verified byte-identical to
		//the real Java game (PORT_COVERAGE.md); every other depth still uses the generic
		//generateSpdDungeon below, since this port does not generate boss arenas or the three
		//regions past the Prison.  The ported floor arrives complete - real rooms, doors, water,
		//grass and traps in their real positions - so the terrain passes that follow are all
		//skipped for it rather than overwriting exactly what was verified.
		const hourglass = this.bag.find('hourglass');
		setHourglassShopState(hourglass ? {
			identified: hourglass.identified ?? false,
			cursed: hourglass.cursed ?? false,
			sandBags: (hourglass as typeof hourglass & { sandBags?: number }).sandBags ?? hourglass.level ?? 0,
		} : null);
		//`ritualSiteState` is levelgen-module state: reset before generating so a stale
		//value from another floor (or a cache-hit revisit that generates nothing) can never
		//leak into this floor's adoption below - `restoreFloor` supplies the persisted value
		//on revisits instead.
		ritualSiteState.ritualPos = -1;
		const ported = this.miningBranchActive
			? miningBranchFloor(this.runSeedLong, this.depth)
			: isPortedDepth(this.depth) ? portedFloor(this.runSeedLong, this.depth) : null;
		this.portedFloorActive = ported !== null;
		this.portedPaint = ported?.paint ?? null;
		this.restorePortedFeatures();
		if (ported) {
			this.level = new Roguelike.Level(ported.width, ported.height, TERRAIN_KINDS, WALL);
			this.level.terrain.set(toGameTerrain(ported, GAME_KIND_CODES));
			this.level.rooms = ported.rooms;
		} else {
			const floorSeed = spdSeedForDepth(this.runSeedLong, this.depth);
			this.level = generateSpdDungeon(48, 32, TERRAIN_KINDS.slice(2), floorSeed);
		}
		this.secrets = new Roguelike.Secrets(this.level);
		this.doors = new Roguelike.Doors(this.level);
		this.trapKinds = new Map();
		this.secretDoorCells = new Set();
		this.crystalDoorCells = new Set();
		this.fire = new Roguelike.Blob(this.level.width, this.level.height);
		this.plantGas = new Roguelike.Blob(this.level.width, this.level.height);
		this.plantFreeze = new Roguelike.Blob(this.level.width, this.level.height);
		this.toxicGas = new Roguelike.Blob(this.level.width, this.level.height);
		this.paralyticGas = new Roguelike.Blob(this.level.width, this.level.height);
		this.eternalFire = new Roguelike.Blob(this.level.width, this.level.height);
		this.ritualPos = -1;
		this.ritualCandles = [false, false, false, false];
		this.sacrificialFire = new Roguelike.Blob(this.level.width, this.level.height);
		this.sacrificialFireCharge = 0;
		this.fallingRocks = [];
		this.yogFistWarned = false;
		this.sacrificialFireCell = -1;
		this.sacrificialFirePrize = undefined;
		this.ghoulsDowned = 0;
		this.kingAdds = new Set();
		this.kingLinkedAdds = new Set();
		this.cavesBossSealed = false;
		this.cavesBossEnergyTurns = 0;

		//positions decided before any terrain layer is built, so water generation (and the
		//door pass) can treat them as dry land from the start rather than patching sprites
		//in after the fact.  A ported floor already carries SPD's own ENTRANCE/EXIT tiles, put
		//there by EntranceRoom/ExitRoom's real paint(), so those are used verbatim instead of
		//"first room's centre"/"furthest room's centre" - the stairs land where Java puts them.
		const start = ported?.entrance ?? Roguelike.rectCenter(this.level.rooms[0]);
		this.miningBranchEntrance = this.miningBranchActive ? start : null;
		//depth 26 (LastLevel) has no down staircase - the Amulet is the only way out
		this.hasStairs = !this.miningBranchActive && !(this.depth in BOSSES) && this.depth < 26;
		if (this.hasStairs) {
			if (ported?.exit) {
				this.stairs = ported.exit;
			} else {
				const room = Roguelike.furthestRoom(this.level, start) ?? this.level.rooms[0];
				this.stairs = Roguelike.rectCenter(room);
			}
		}

		//all regular regions get real water and real grass in Java, each at its own fill/smoothing -
		//see REGION_WATER/REGION_GRASS's own comment.  A ported floor has all three already, at
		//Java's own fill numbers and in Java's own positions, so these generic passes would
		//only overwrite verified output; its doors and traps are registered from the generated
		//grid instead (adoptPortedFeatures).
		if (ported) {
			this.adoptPortedFeatures(ported);
		} else {
			this.placeWaterPool(start, region);
			this.placeGrass(region, start);
			this.placeDoors();
		}
		// The generated layout above is the baseline for a first visit. On a revisit or a load,
		// replace its mutable layer before drawing anything, so doors/traps and terrain frames
		// agree with the state the player left behind.
		if (savedFloor) this.restoreFloor(savedFloor);
		const foresight = this.talentRank('rogues_foresight');
		if (this.heroClass === 'rogue' && foresight > 0 && Random.chance(foresight === 1 ? 0.5 : 0.75)) {
			let hasSecret = false;
			for (let y = 0; y < this.level.height && !hasSecret; y++) for (let x = 0; x < this.level.width; x++) {
				if (this.secrets.isSecret(x, y)) { hasSecret = true; break; }
			}
			if (hasSecret) this.say(t('actors.hero.hero.noticed_smth'), 'positive');
		}

		//before any frame is picked: the wall art variant is a per-cell roll off the floor's
		//own seed (GameScene.java does the same, `setupVariance(.., seedCurDepth())`)
		this.setupTileVariance(spdSeedForDepth(this.runSeedLong, this.depth));

		this.map = new TileMap({ width: this.level.width, height: this.level.height, sheet: this.terrainSheet });
		this.map.addLayer('terrain', this.terrainFrames());
		this.map.addLayer('water', this.waterFrames());
		this.wallsMap = new TileMap({ width: this.level.width, height: this.level.height, sheet: this.terrainSheet });
		this.wallsMap.addLayer('grass', this.foregroundGrassFrames());
		this.wallsMap.addLayer('walls', this.wallFrames());

		const waterKey = ({ sewers: 'water0', prison: 'water1', caves: 'water2', city: 'water3', halls: 'water4' } as const)[region];
		this.waterSurface = new WaterSurface(runState.sprites[waterKey], runState.sprites.effects, this.level.width, this.level.height, (x, y) => this.level.get(x, y) === WATER);
		this.camera.world.addChild(this.waterSurface, this.map);
		if (this.miningBranchActive) {
			//MiningLevel.BorderDarken maps the 64x16 CAVES_QUEST atlas as [top=2,
			//sides=1,bottom-two=3,interior=-1]. TileMap is the direct equivalent of Java's
			//CustomTilemap and keeps the custom art pixel-exact.
			const border = new Array(this.level.cellCount).fill(-1);
			for (let y = 0; y < this.level.height; y++) for (let x = 0; x < this.level.width; x++) {
				const cell = x + y * this.level.width;
				if (y === 0) border[cell] = 2;
				else if (x === 0 || x === this.level.width - 1) border[cell] = 1;
				else if (y >= this.level.height - 2) border[cell] = 3;
			}
			this.miningBorder = new TileMap({ width: this.level.width, height: this.level.height, sheet: SpriteSheet.fromTexture(runState.sprites.cavesQuest, TILE) });
			this.miningBorder.addLayer('border', border);
			this.camera.world.addChild(this.miningBorder);
		}
		if (!this.miningBranchActive && this.portedBranchExitCells.size > 0) {
			// BlacksmithRoom.QuestEntrance is a one-cell CustomTilemap using atlas tile 0.
			const quest = new Array(this.level.cellCount).fill(-1);
			for (const cell of this.portedBranchExitCells) quest[cell] = 0;
			this.branchQuestEntrance = new TileMap({ width: this.level.width, height: this.level.height, sheet: SpriteSheet.fromTexture(runState.sprites.cavesQuest, TILE) });
			this.branchQuestEntrance.addLayer('questEntrance', quest);
			this.camera.world.addChild(this.branchQuestEntrance);
		}
		this.featuresMap = new TileMap({ width: this.level.width, height: this.level.height,
			sheet: SpriteSheet.fromTexture(runState.sprites.terrainFeatures, TILE) });
		this.featuresMap.addLayer('features', this.featureFrames());
		this.camera.world.addChild(this.featuresMap);
		if (region === 'halls' && this.portedPaint) {
			this.demonSpawnerFloor = new TileMap({ width: this.level.width, height: this.level.height,
				sheet: SpriteSheet.fromTexture(runState.sprites.hallsSpecial, TILE) });
			this.demonSpawnerFloor.addLayer('demonSpawnerFloor', this.demonSpawnerFloorFrames(true));
			this.camera.world.addChild(this.demonSpawnerFloor);
		}
		//A pointer/touch target on the map is the browser equivalent of tapping a neighbouring
		//cell in SPD's CellSelector. Only one step is issued per click: this preserves the
		//turn-based rhythm and prevents a held pointer from accidentally sprinting through a
		//room. Targeting and item selection remain explicit toolbar actions.
		this.map.eventMode = 'static';
		this.map.cursor = 'pointer';
		this.map.on('pointerdown', (event) => this.handleMapPointer(event.global.x, event.global.y));
		this.onDestroy.add(() => {
			this.map?.removeAllListeners('pointerdown');
		});
		//`SewerLevel`/`PrisonLevel`/`CityLevel`'s `Sink`/`Torch`/`Smoke` decorations, real `WALL_DECO`
		//cells the ported painter already placed (see `wallDecorations.ts`'s own doc comment).
		//`CavesLevel`'s own `WALL_DECO` is a Vein/Sparkle effect rather than a Sink, Torch or
		//Smoke puff; WallDecorationLayer's `ore` kind reproduces its FOV-gated amber sparkle.
		this.wallDecorations = null;
		if (this.portedPaint && (region === 'sewers' || region === 'prison' || region === 'city' || region === 'caves')) {
			const paint = this.portedPaint;
			const cells: { x: number; y: number }[] = [];
			for (let cell = 0; cell < paint.map.length; cell++) {
				if (paint.map[cell] === Terrain.WALL_DECO) cells.push({ x: cell % paint.w, y: Math.floor(cell / paint.w) });
			}
			if (cells.length > 0) {
				const kind = region === 'sewers' ? 'sink' : region === 'prison' ? 'torch' : region === 'city' ? 'smoke' : 'ore';
				this.wallDecorations = new WallDecorationLayer(kind, cells);
				this.camera.world.addChild(this.wallDecorations);
			}
		}
		//`HallsLevel.Stream`/`FireParticle`: one ember emitter per real WATER cell, unconditional
		//(not decoration-gated like the WALL_DECO effects above) - see `wallDecorations.ts`'s
		//`WaterEmberLayer` doc comment.
		this.waterEmbers = null;
		if (this.portedPaint && region === 'halls') {
			const paint = this.portedPaint;
			const cells: { x: number; y: number }[] = [];
			for (let cell = 0; cell < paint.map.length; cell++) {
				if (paint.map[cell] === Terrain.WATER) cells.push({ x: cell % paint.w, y: Math.floor(cell / paint.w) });
			}
			if (cells.length > 0) {
				this.waterEmbers = new WaterEmberLayer(cells);
				this.camera.world.addChild(this.waterEmbers);
			}
		}
		this.camera.world.addChild(this.itemLayer);
		this.camera.world.addChild(this.characterEffects.shadows);
		this.camera.world.addChild(this.creatureLayer);
		//wall tops and overhangs draw over the actors, as they do in Java
		this.camera.world.addChild(this.wallsMap);
		this.wallBlocking = new TileMap({ width: this.level.width, height: this.level.height,
			sheet: SpriteSheet.fromTexture(runState.sprites.wallBlocking, TILE) });
		this.wallBlocking.addLayer('blocking', new Array(this.level.cellCount).fill(-1));
		this.camera.world.addChild(this.wallBlocking);
		this.fog = new FogOfWar(this.level.width, this.level.height);
		this.camera.world.addChild(this.fog);
		this.camera.world.addChild(this.characterEffects.icons);
		//floating text last of all: a damage number must stay readable over a wall top
		this.camera.world.addChild(this.floaters);

		this.fov = new Roguelike.FieldOfView(this.level);
		this.pathfinder = new Roguelike.Pathfinder(this.level);

		this.heroAnimation?.reset();
		this.hero.x = start.x;
		this.hero.y = start.y;
		this.sprite(this.hero).x = start.x * TILE;
		this.sprite(this.hero).y = start.y * TILE;
		//removeChildren() above cleared every sprite, including the hero's - it survives
		//floor transitions, so it goes back in rather than being rebuilt
		this.creatureLayer.addChild(this.sprite(this.hero));
		this.scheduler.add(this.hero, 0);
		this.placeEntrance(start);

		if (this.hasStairs) this.drawStairsSprite();
		if (!savedFloor) {
			this.populate();
			this.spawnPortedMobs();
			//a ported floor's traps came from the real paintTraps() and are already registered
			if (!ported) this.placeHiddenTraps();
			this.maybeSpawnGhost();
			if (!ported) {
				this.maybeSpawnWandmaker();
				this.maybeSpawnShopkeeper();
				this.maybeSpawnBlacksmith();
			}
			this.maybeSpawnImp();
			if (!ported) this.maybeSpawnDemonSpawner();
			if (!this.miningBranchActive) this.placeGroundItems();
		}
		// The Java custom floor changes when the spawner dies.  The first frame above uses
		// the painter's mob list so it exists before actors are populated; this refresh uses
		// the actual live/restored creature list and therefore removes it on a revisit after
		// the spawner was killed.
		if (this.demonSpawnerFloor) this.demonSpawnerFloor.setLayerData('demonSpawnerFloor', this.demonSpawnerFloorFrames(!savedFloor));

		// GameScene.java pans to hero.center() without clamping to map bounds.
		// Clamping pushed the hero to the screen edge on wide windows.
		this.camera.setBounds(null);
		this.camera.snapTo(...this.worldOf(this.hero));
		this.camera.follow(this.heroPoint());

		this.refresh();
		//SPD seals the starting room behind hidden doors as its search tutorial - see
		//`stairsNeedSearching` for why that is correct and why this hint exists
		if (this.stairsNeedSearching(start)) {
			this.say(t('port.hint.sealedroom'), 'warning');
		}
		this.activeFloorDepth = this.depth;
		this.runTurns();
		this.showInterlevel(region);
	}

	/**
	 * `InterlevelScene`: the real 16px regional loading texture scrolls at 5 px/s (at the
	 * Java scene's 4x pixel scale) behind a fade-in/static/fade-out curtain and centred mode
	 * text. Generation is synchronous in this browser port, so this is presentation-only;
	 * input stays blocked until the equivalent normal/slow timing has finished.
	 */
	private showInterlevel(region: Region): void {
		this.interlevel?.root.destroy({ children: true });
		const key = ({ sewers: 'loadingSewers', prison: 'loadingPrison', caves: 'loadingCaves', city: 'loadingCity', halls: 'loadingHalls' } as const)[region];
		const root = new Container();
		const backdrop = new TilingSprite({ texture: runState.sprites[key], width: Game.current.width, height: Game.current.height });
		backdrop.tileScale.set(4);
		//InterlevelScene's rotated five-stop black gradient, whose opacity is separately
		//animated below. A flat black veil loses the original scene's subtle depth.
		const curtain = new Graphics().rect(0, 0, Game.current.width, Game.current.height).fill(new FillGradient({
			type: 'linear', start: { x: 0, y: 0 }, end: { x: 0, y: 1 }, textureSpace: 'local',
			colorStops: [
				{ offset: 0, color: 'rgba(0,0,0,0.67)' }, { offset: 0.25, color: 'rgba(0,0,0,0.73)' },
				{ offset: 0.5, color: 'rgba(0,0,0,0.80)' }, { offset: 0.75, color: 'rgba(0,0,0,0.87)' },
				{ offset: 1, color: 'rgba(0,0,0,1)' },
			],
		}));
		const message = new Label({ text: t('scenes.interlevelscene$mode.descend'), size: 9, color: theme().color.text });
		message.anchor.set(0.5);
		message.position.set(Game.current.width / 2, Game.current.height / 2);
		root.addChild(backdrop, curtain, message);
		this.stage.addChild(root);
		//Java's SLOW_FADE applies to a fresh run and to the first floor of a new region;
		//the 0.33s in/out fades are added either side of its central dwell time.
		const slow = this.depth === 1 || this.depth % 5 === 1;
		this.interlevel = { root, backdrop, elapsed: 0, duration: slow ? 1.66 : 1.33, curtain, message };
		this.awaitingInput = false;
	}

	/**
	 * `DungeonTileSheet.tileVariance`, which decides per cell whether a wall uses its second
	 * brick art, so a long wall does not read as one repeated tile.
	 *
	 * Java rolls `Random.Int(100)` per cell inside its own `pushGenerator(seedCurDepth())`
	 * (`GameScene.java`), so this consumes no part of the level-generation stream and is
	 * reproducible exactly from the per-depth seed this port already computes.
	 */
	private tileVariance: Uint8Array = new Uint8Array(0);

	private setupTileVariance(floorSeed: bigint): void {
		const random = new SpdJavaRandom(spdScramble(floorSeed));
		this.tileVariance = new Uint8Array(this.level.cellCount);
		for (let i = 0; i < this.tileVariance.length; i++) this.tileVariance[i] = random.nextInt(100);
	}

	/** Preserve Java's visual terrain while applying the live door/grass state.
	 * Collision categories cannot distinguish bookshelves, statues or chasms.
	 */
	private visualTerrainAt = (x: number, y: number): number => {
		if (!this.level.inside(x, y)) return -1;
		const kind = this.level.get(x, y);
		const raw = this.portedPaint?.map[this.level.index(x, y)];
		if (kind === DOOR) return 6;
		if (kind === DOOR_CLOSED) return this.doors.isLocked(x, y) ? (this.crystalDoorCells.has(this.level.index(x, y)) ? 31 : 10) : 5;
		if (kind === HIGH_GRASS) return 15;
		if (kind === GRASS) return 2;
		if (kind === WATER) return 29;
		return raw ?? (kind === WALL ? 4 : 1);
	};

	/** DungeonTerrainTilemap direct visuals and DungeonTileSheet alternates. */
	private terrainFrameAt(x: number, y: number): number {
		const kind = this.level.get(x, y);
		if (kind === WATER) return -1; // the animated surface is below the shore layer
		const cell = this.level.index(x, y);
		const raw = this.visualTerrainAt(x, y);
		if (raw === 21) return 77;
		if (raw === 22) return 78;
		const variance = this.tileVariance[cell] ?? 0;
		const alternate = (frame: number): number => {
			if (frame === 0 && variance >= 95) return 12;
			const common: Record<number, number> = { 0: 6, 1: 7, 2: 8, 3: 9, 4: 10, 149: 153 };
			return variance >= 50 ? common[frame] ?? frame : frame;
		};
		const wall = raisedWallFrame(this.visualTerrainAt, x, y, variance);
		if (wall !== undefined) return wall;
		const frame = TERRAIN_FRAME.floor;
		if (kind === HIGH_GRASS) return alternate(149);
		if (kind === GRASS) return alternate(2);
		if (raw !== undefined) {
			const direct: Record<number, number> = { 3: 19, 7: 16, 8: 17, 9: 3, 11: 20, 14: 4, 20: 1, 21: 77, 24: 18 };
			if (direct[raw] !== undefined) return alternate(direct[raw]);
			const raised: Record<number, number> = { 13: 148, 23: 144, 25: 145, 26: 146, 28: 147 };
			if (raised[raw] !== undefined) return raised[raw];
			if (raw === Terrain.CHASM) {
				const above = y > 0 ? this.portedPaint!.map[cell - this.level.width] : -1;
				if (above === Terrain.WATER) return 52;
				if ([Terrain.EMPTY_SP, Terrain.STATUE_SP].includes(above as 14 | 26)) return 50;
				if ([Terrain.WALL, Terrain.WALL_DECO, Terrain.DOOR, Terrain.LOCKED_DOOR, Terrain.SECRET_DOOR].includes(above as 4 | 12 | 5 | 10 | 16)) return 51;
				return above !== -1 && above !== Terrain.CHASM ? 49 : 48;
			}
		}
		return alternate(frame);
	}

	/** Water starts at tile 32; only Java's dry floor/door neighbours add shoreline. */
	private waterFrames(): number[] {
		const dry = new Set<number>([1, 2, 3, 7, 8, 9, 13, 15, 17, 18, 19, 20, 23, 24, 25, 28, 5, 6, 10, 31]);
		const frames: number[] = [];
		for (let y = 0; y < this.level.height; y++) for (let x = 0; x < this.level.width; x++) {
			if (this.level.get(x, y) !== WATER) { frames.push(-1); continue; }
			let mask = 0;
			[[0, -1], [1, 0], [0, 1], [-1, 0]].forEach(([dx, dy], i) => {
				if (!this.level.inside(x + dx, y + dy)) return;
				const raw = this.portedPaint?.map[this.level.index(x + dx, y + dy)];
				const kind = this.level.get(x + dx, y + dy);
				if (raw === undefined ? kind !== WATER && kind !== WALL : dry.has(raw)) mask |= 1 << i;
			});
			frames.push(mask ? 32 + mask : -1);
		}
		return frames;
	}

	private wallFrameAt(x: number, y: number): number {
		return upperWallFrame(this.visualTerrainAt, x, y, this.tileVariance[this.level.index(x, y + 1)] ?? 0);
	}

	private foregroundGrassFrames(): number[] {
		return Array.from(this.tileVariance, (variance, cell) => foregroundGrassFrame(
			this.visualTerrainAt(cell % this.level.width, Math.floor(cell / this.level.width)), variance));
	}

	/** TerrainFeaturesTilemap: visible trap art, plants and regional grass details.
	 * Unknown newer plant classes remain blank rather than borrowing another plant's art.
	 * Trap effects are still the port's reduced set; visuals retain the actual Java class.
	 */
	private featureFrames(): number[] {
		return Array.from(this.tileVariance, (variance, cell) => {
			const x = cell % this.level.width, y = Math.floor(cell / this.level.width);
			const trap = this.portedPaint?.traps.get(cell);
			if (trap || this.trapKinds.has(cell)) {
				if (this.secrets.isSecret(x, y)) return -1;
				const fallback = ({ toxic: 35, burning: 1, poisonDart: 83, grim: 103, explosive: 65 } as const)[this.trapKinds.get(cell) ?? 'poisonDart'];
				const frame = trap ? TRAP_VISUALS[trap.kind[0].toUpperCase() + trap.kind.slice(1)] ?? fallback : fallback;
				return trap?.active === false ? Math.floor(frame / 16) * 16 + 8 : frame;
			}
			const feature = this.portedFeatures.kindAt(cell);
			const plant = feature?.startsWith('plant:') ? feature.slice('plant:'.length).replace(/Seed$/, '') : undefined;
			if (plant) return PLANT_VISUALS[plant[0].toUpperCase() + plant.slice(1)] ?? -1;
			const raw = this.visualTerrainAt(x, y);
			const stage = Math.min(4, Math.floor((this.depth - 1) / 5));
			return raw === 15 ? 9 + stage * 16 + (variance >= 50 ? 1 : 0)
				: raw === 30 ? 11 + stage * 16 + (variance >= 50 ? 1 : 0)
				: raw === 2 ? 13 + stage * 16 + (variance >= 50 ? 1 : 0) : -1;
		});
	}

	/** Plant.execute(AC_PLANT): consume one seed and register a persistent plant marker. */
	private plantSeed(): void {
		const seed = this.requestedItemId ? this.bag.find(this.requestedItemId, this.requestedItemInstanceId) : undefined;
		if (!seed || seed.id !== 'seed') return;
		//Plant.Seed.onThrow(): the real NO_HERBALISM challenge falls through to a plain thrown-
		//item drop instead of ever planting - this port has no throw-to-cell targeting, so the
		//closest equivalent is simply refusing the plant action without consuming the seed.
		if (isChallengeEnabled('no_herbalism')) {
			this.say(t('port.log.noherbalism'), 'negative');
			return;
		}
		const x = this.hero.x, y = this.hero.y;
		const cell = this.level.index(x, y);
		if (!this.level.passable(x, y) || this.isChasmCell(x, y) || this.portedFeatures.kindAt(cell) !== undefined) {
			this.say(t('port.log.noplantcell'), 'negative');
			return;
		}
		const sourceClass = (seed as typeof seed & { sourceClass?: string }).sourceClass;
		const kind = this.seedPlantKind(sourceClass);
		if (!kind) {
			this.say(t('port.log.noseedeffect'), 'negative');
			return;
		}
		this.bag.remove('seed', 1, seed.instanceId);
		this.manualPlants.set(cell, kind);
		this.placePortedFeature(cell, kind);
		this.say(t('port.log.plantseed', { kind }), 'positive');
		this.actionSpentTurn = true;
		this.spendHeroTurn(1);
	}

	private seedPlantKind(sourceClass?: string): string | null {
		const name = (sourceClass ?? '').toLowerCase().replace(/\$seed$|\.seed$/, '').split('.').pop() ?? '';
		const supported = new Set(['blindweed', 'earthroot', 'fadeleaf', 'firebloom', 'icecap', 'mageroyal',
			'rotberry', 'sorrowmoss', 'starflower', 'stormvine', 'sungrass', 'swiftthistle']);
		return supported.has(name) ? name : null;
	}
	/**
	 * HallsLevel's DemonSpawnerRoom.CustomFloor.  Java uses the room's custom atlas rather
	 * than terrain art: frame 19 for ordinary cells, 27/31 for decorative floor cells, and
	 * frames 37-39 for the three-cell spawner sprite.  `baseline` is only true while the
	 * first-visit actors have not been spawned yet; revisits use the live creature list so a
	 * killed spawner does not reappear from the immutable painted mob list.
	 */
	private demonSpawnerFloorFrames(baseline: boolean): number[] {
		const frames = new Array(this.level.cellCount).fill(-1);
		const paint = this.portedPaint;
		if (!paint) return frames;
		const live = this.creatures.find(c => c.kind === 'demonSpawner');
		const painted = baseline ? paint.mobs.find(m => m.kind.toLowerCase().includes('demonspawner')) : undefined;
		const pos = live ? { x: live.x, y: live.y } : painted ? { x: painted.pos % paint.w, y: Math.floor(painted.pos / paint.w) } : null;
		if (!pos) return frames;
		const room = this.level.rooms.find(r => pos.x >= r.left && pos.x <= r.right && pos.y >= r.top && pos.y <= r.bottom);
		if (!room) return frames;
		for (let y = room.top + 1; y < room.bottom; y++) for (let x = room.left + 1; x < room.right; x++) {
			const cell = this.level.index(x, y);
			frames[cell] = paint.map[cell] === Terrain.EMPTY_DECO
				? (this.gameState.switch('amuletObtained') ? 31 : 27) : 19;
		}
		if (live || baseline) {
			const center = this.level.index(pos.x, pos.y);
			frames[center] = 38;
			if (pos.x > room.left + 1) frames[center - 1] = 37;
			if (pos.x < room.right - 1) frames[center + 1] = 39;
		}
		return frames;
	}

	private terrainFrames(): number[] {
		const frames: number[] = [];
		for (let y = 0; y < this.level.height; y++) {
			for (let x = 0; x < this.level.width; x++) frames.push(this.terrainFrameAt(x, y));
		}
		return frames;
	}

	private wallFrames(): number[] {
		const frames: number[] = [];
		for (let y = 0; y < this.level.height; y++) {
			for (let x = 0; x < this.level.width; x++) frames.push(this.wallFrameAt(x, y));
		}
		return frames;
	}

	/**
	 * Re-picks both layers' frames for a cell and the ring around it, which is Java's
	 * `DungeonTilemap.updateMapCell` (it too rewrites a 3x3). Every wall and door frame reads
	 * its neighbours, so opening a door or uncovering a secret one restitches its
	 * surroundings - without this a revealed secret door keeps the wall face it was hiding
	 * behind, and an opened door keeps its shut art.
	 */
	private restitchTilesAround(x: number, y: number): void {
		for (let dy = -1; dy <= 1; dy++) {
			for (let dx = -1; dx <= 1; dx++) {
				const cx = x + dx;
				const cy = y + dy;
				if (!this.level.inside(cx, cy)) continue;
				this.map.setTile('terrain', cx, cy, this.terrainFrameAt(cx, cy));
				this.wallsMap.setTile('walls', cx, cy, this.wallFrameAt(cx, cy));
				this.wallsMap.setTile('grass', cx, cy, foregroundGrassFrame(this.visualTerrainAt(cx, cy), this.tileVariance[this.level.index(cx, cy)]));
			}
		}
	}

	/** both layers at once, for the floor-wide reveals where restitching each cell's ring would redo most of the map anyway */
	private restitchAllTiles(): void {
		this.map.setLayerData('terrain', this.terrainFrames());
		this.wallsMap.setLayerData('walls', this.wallFrames());
		this.wallsMap.setLayerData('grass', this.foregroundGrassFrames());
		this.featuresMap?.setLayerData('features', this.featureFrames());
	}

	/**
	 * Whether the stairs cannot be reached without first searching out a hidden door.
	 *
	 * `RegularPainter.paintDoors` turns every entrance-room door into `Door.Type.HIDDEN` on
	 * depth 1 while `SPDSettings.intro()` is set, and again on depth 2 until the guidebook's
	 * searching page has been found - its own comment calls this the tutorial. So the hero
	 * genuinely does start sealed into the entrance room, and that is **faithful generation,
	 * not a bug**: the doors are on the room's perimeter and `searchForSecrets` checks all
	 * eight neighbours, so they are findable. Do not "fix" it by opening them.
	 *
	 * What real SPD also ships, and this port does not, is the scaffolding that makes the
	 * seal fair - the Adventurer's Guide page lying in the starting room, a search button on
	 * the toolbar, and the prompts pointing at it. Without those, a correct seal reads as a
	 * broken floor, so `enterLevel` prints a one-line hint instead.
	 *
	 * Keyed off actual reachability rather than off `depth === 1`, so it stays right for the
	 * depth-2 case and anything else that ever seals a floor. A shut door counts as a way
	 * through, since bumping one opens it; a hidden door does not, being stored as plain wall
	 * until it is found.
	 */
	private stairsNeedSearching(start: Step): boolean {
		if (!this.hasStairs || this.secretDoorCells.size === 0) return false;

		const seen = new Uint8Array(this.level.cellCount);
		const queue: Step[] = [start];
		seen[this.level.index(start.x, start.y)] = 1;

		for (let head = 0; head < queue.length; head++) {
			const { x, y } = queue[head];
			if (x === this.stairs.x && y === this.stairs.y) return false;

			for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
				const nx = x + dx;
				const ny = y + dy;
				if (!this.level.inside(nx, ny)) continue;
				const cell = this.level.index(nx, ny);
				if (seen[cell]) continue;
				if (!this.level.passable(nx, ny) && this.level.get(nx, ny) !== DOOR_CLOSED) continue;
				seen[cell] = 1;
				queue.push({ x: nx, y: ny });
			}
		}
		return true;
	}

	/** the down staircase sprite - SPD's real `EXIT` tile, not the door tile this port used to reuse for it. `this.stairs` is already decided by `enterLevel`, before water/doors are painted */
	private drawStairsSprite(): void {
		this.stairsSprite = new TintedSprite(this.terrainSheet.get(TERRAIN_FRAME.exit));
		this.stairsSprite.x = this.stairs.x * TILE;
		this.stairsSprite.y = this.stairs.y * TILE;
		this.creatureLayer.addChild(this.stairsSprite);
	}

	/** the up staircase the hero arrived by - SPD's real `ENTRANCE` tile. Every floor has one except the first, which has nothing above it to lead back to */
	private placeEntrance(at: Step): void {
		if (this.depth <= 1) return;

		const sprite = new TintedSprite(this.terrainSheet.get(TERRAIN_FRAME.entrance));
		sprite.x = at.x * TILE;
		sprite.y = at.y * TILE;
		this.creatureLayer.addChild(sprite);
	}

	/**
	 * Regular floors: `Bestiary.getMobRotation`'s real per-depth pool, more monsters the
	 * deeper down (SPD scales this by level connectivity, not a flat count - this port keeps
	 * a flat count, now drawing from the real roster for whichever region `this.depth` is in).
	 * Boss floors (`BOSSES`): that boss, alone, and nothing else.
	 */
	private enterMiningBranch(): void {
		if (this.miningBranchActive) return;
		this.captureActiveFloor();
		this.miningBranchActive = true;
		this.activeFloorDepth = null;
		this.enterLevel();
	}

	private leaveMiningBranch(): void {
		if (!this.miningBranchActive) return;
		this.miningBranchActive = false;
		this.activeFloorDepth = null;
		this.enterLevel();
	}

	private populate(): void {
		if (this.miningBranchActive) {
			this.say(t('port.log.mineabandonedquiet'), 'warning');
			return;
		}
		const boss = BOSSES[this.depth];
		if (boss) {
			const room = this.level.rooms[this.level.rooms.length - 1] ?? this.level.rooms[1];
			this.spawnMonster(boss.kind, Roguelike.rectCenter(room));
			this.say(
				boss.kind === 'goo'
					? 'You feel a pulse of ooze - Goo is here.'
					: boss.kind === 'tengu'
						? 'A dark shape watches from the shadows - Tengu is here.'
						: boss.kind === 'dm300'
							? 'The ground trembles - DM-300 is here.'
							: boss.kind === 'king'
								? 'A crowned figure rises from the throne - the Dwarf King is here.'
								: 'The dark stirs - Yog-Dzewa is here.'
			);
			return;
		}

		//LastLevel: no roster, no monsters - just the way out (Java's 26 is the amulet vault)
		if (this.depth === 26) {
			this.say(t('port.hint.vault'), 'warning');
			return;
		}

		const baseRoster: MonsterId[] = mobRosterForDepth(this.depth);
		// Bestiary.addRareMobs()/swapMobAlts()/getMobRotation() is the exact shape of MWG's
		// ContentRoll primitive: add rare entries, swap regular entries, then shuffle once. Keeping
		// this in the framework primitive also exposes a trace for the parity harness instead of
		// hiding the three stages in scene code.
		const rareMob: MonsterId | undefined = ({
			4: 'thief',
			9: 'bat',
			14: 'ghoul',
			19: 'succubus',
		} as Partial<Record<number, MonsterId>>)[this.depth];
		const altByBase: Partial<Record<MonsterId, AnyMonsterId>> = {
			rat: 'albino',
			slime: 'causticSlime',
			thief: 'bandit',
			necromancer: 'spectralNecromancer',
			brute: 'armoredBrute',
			dm200: 'dm201',
			monk: 'senior',
			scorpio: 'acidic',
		};
		const roster = Roguelike.rollRoster(
			baseRoster.map((value) => ({
				value,
				alternative: altByBase[value] ? { value: altByBase[value]!, chance: 1 / 50 } : undefined,
			})),
			rareMob ? [{ value: rareMob, chance: 0.025 }] : [],
		).roster;
		let rotationIndex = 0;
		// RegularLevel.mobLimit(): floor 1 is the tutorial's fixed eight mobs; later floors
		// use 3 + (depth % 5) + Int(3), with the LARGE feeling increasing the cap by 1.33x.
		// The room-placement loop below remains a scene-level approximation, but its budget now
		// follows Java instead of growing monotonically to a hard cap of ten.
		let count = this.depth === 1 ? 8 : 3 + (this.depth % 5) + Random.int(3);
		if (this.portedFloorActive && this.portedPaint?.feeling === 4) count = Math.ceil(count * 1.33);
		for (let i = 0; i < count; i++) {
			//A room rect includes its own wall ring in both generators, and a ported floor puts
			//far more solid terrain *inside* the ring than the generic one ever did - chasms,
			//statues, bookshelves and maze walls all map to WALL - so a cell has to be tested
			//for passability rather than assumed open. Retried like placeGroundItems does.
			//
			//RegularLevel.createMobs() explicitly excludes `roomEntrance` from mob placement
			//(`room instanceof StandardRoom && room != roomEntrance`) - not an index-based rule,
			//an identity one, true on every floor including ported ones. This port previously
			//only skipped index 0 on a *generic* floor (reasoning that a ported floor's shuffled
			//room order made index 0 meaningless) and treated every room as fair game there -
			//which meant mobs, including the roster's less-common entries, could spawn right in
			//the entrance room on a ported floor, something real Java never does. Fixed by
			//excluding whichever room actually contains the hero's spawn cell, on both kinds of
			//floor alike - the hero is still standing there at populate() time.
			const entranceRoomIdx = this.level.rooms.findIndex((room) =>
				this.hero.x >= room.left && this.hero.x <= room.right && this.hero.y >= room.top && this.hero.y <= room.bottom);
			for (let attempt = 0; attempt < 10; attempt++) {
				let index = Random.int(0, this.level.rooms.length);
				if (this.level.rooms.length > 1 && index === entranceRoomIdx) index = (index + 1) % this.level.rooms.length;
				const room = this.level.rooms[index];
				const at = { x: Random.range(room.left, room.right), y: Random.range(room.top, room.bottom) };
				if (!this.level.passable(at.x, at.y)) continue;
				if (at.x === this.hero.x && at.y === this.hero.y) continue;
				if (this.portedMobCells.has(this.level.index(at.x, at.y))) continue;
				if (this.creatureAt(at.x, at.y)) continue;
				this.spawnMonster(roster[rotationIndex++ % roster.length]!, at);
				break;
			}
		}
	}

	/**
	 * `Ghost.Quest.spawn()`: depth 2-4, `Random.Int(5-depth)==0` each (1-in-3, 1-in-2, always),
	 * once per run, `type = depth-1` - all three types now, not just the Fetid Rat.
	 */
	/**
	 * A cell an NPC can actually stand on inside `room`, preferring its centre.
	 *
	 * Every NPC spawn used to take `rectCenter(room)` unconditionally, which is safe on a
	 * generic floor (a generated room's interior is all floor, so its centre always is). It is
	 * not safe on a ported floor: a `SecretMazeRoom`'s centre is maze wall, a `CircleBasinRoom`'s
	 * is water, and anything the terrain mapping folds onto WALL - chasm, statue, bookshelf -
	 * can sit dead centre. An NPC placed there would be sealed inside solid rock.
	 *
	 * Water counts as standable, matching the rest of this port (WATER is a passable kind).
	 * Returns null only for a room with no passable cell at all, which a caller must handle
	 * rather than spawning into a wall.
	 */
	private standableCellIn(room: Roguelike.Rect): Step | null {
		const centre = Roguelike.rectCenter(room);
		if (this.level.passable(centre.x, centre.y) && !this.creatureAt(centre.x, centre.y)) return centre;
		for (let attempt = 0; attempt < 20; attempt++) {
			const at = { x: Random.range(room.left, room.right), y: Random.range(room.top, room.bottom) };
			if (this.level.passable(at.x, at.y) && !this.creatureAt(at.x, at.y)) return at;
		}
		for (let y = room.top; y <= room.bottom; y++) {
			for (let x = room.left; x <= room.right; x++) {
				if (this.level.passable(x, y) && !this.creatureAt(x, y)) return { x, y };
			}
		}
		return null;
	}

	/** a room to spawn something in - see populate()'s note on why index 0 is only skipped
	 *  on a generic floor */
	private randomSpawnRoom(): Roguelike.Rect {
		const first = this.portedFloorActive ? 0 : 1;
		return this.level.rooms[Random.int(first, this.level.rooms.length)] ?? this.level.rooms[0];
	}

	private maybeSpawnGhost(): void {
		if (this.ghostSpawned || this.depth < 2 || this.depth > 4) return;
		if (Random.int(0, 5 - this.depth) !== 0) return;

		const at = this.standableCellIn(this.randomSpawnRoom());
		if (!at) return;
		this.spawnMonster('ghost', at);
		this.ghostSpawned = true;
		this.ghostType = this.depth - 1;
	}

	/**
	 * Wandmaker.Quest spawn, simplified: Java picks one of three site quests by room shape
	 * (MassGrave/RitualSite/RotGarden) with `depth > 6 && Random.Int(10-depth)==0` odds when
	 * no type is fixed - the odds and the once-per-run flag are real, and all three fetch
	 * targets (dust, embers, rotberry) are now real items with real turn-ins.
	 */
	private maybeSpawnWandmaker(): void {
		if (this.wandmakerSpawned || this.depth < 7 || this.depth > 9) return;
		if (Random.int(0, 10 - this.depth) !== 0) return;

		const at = this.standableCellIn(this.randomSpawnRoom());
		if (!at) return;
		this.spawnMonster('wandmaker', at);
		this.wandmakerSpawned = true;
	}

	/**
	 * Shopkeeper: Java's shops sit on depths 6/11/16/21. This port still has no shop
	 * ROOMS (a level-gen gap - the keeper stands in a random room instead), but the
	 * depth rule itself is now exact rather than depth-6-only. Prices are the real
	 * `sellPrice()` formula (`shopPricing.ts`); each depth keeps its own shelf stock
	 * and buyback shelf.
	 */
	private maybeSpawnShopkeeper(): void {
		if (![6, 11, 16, 21].includes(this.depth) || this.shopSpawnedDepths.has(this.depth)) return;
		const at = this.standableCellIn(this.randomSpawnRoom());
		if (!at) return;
		this.spawnMonster('shopkeeper', at);
		this.shopSpawnedDepths.add(this.depth);
	}

	/**
	 * Blacksmith.Quest spawn: `depth > 11 && Random.Int(15-depth)==0` (depths 12-14),
	 * once per run. Ported floors carry the generator's normal/Bat-blood variant; this
	 * fallback is retained only for non-ported floors and therefore uses the normal path.
	 */
	private maybeSpawnBlacksmith(): void {
		if (this.blacksmithSpawned || this.depth < 12 || this.depth > 14) return;
		if (Random.int(0, 15 - this.depth) !== 0) return;

		const at = this.standableCellIn(this.randomSpawnRoom());
		if (!at) return;
		this.spawnMonster('blacksmith', at);
		this.blacksmithSpawned = true;
	}

	/**
	 * Imp.Quest spawn: `depth > 16 && Random.Int(20-depth)==0` (depths 17-19), once per
	 * run. The monks-vs-golems variant is fixed by depth parity here (odd: monks, even:
	 * golems need one fewer token) instead of Java's coin flip - the 5/4 token counts
	 * are real either way.
	 */
	private maybeSpawnImp(): void {
		if (this.impSpawned || this.depth < 17 || this.depth > 19) return;
		if (Random.int(0, 20 - this.depth) !== 0) return;

		const at = this.standableCellIn(this.randomSpawnRoom());
		if (!at) return;
		this.spawnMonster('imp', at);
		this.impSpawned = true;
		//odd depths want 5 monk tokens, even depths 4 golem tokens (Java flips a coin)
		this.impNeed = this.depth % 2 === 1 ? 5 : 4;
	}

	/**
	 * `HallsLevel.initRooms()`'s `rooms.add(new DemonSpawnerRoom())` - unconditional, unlike the
	 * roll-gated quest spawns above, and once per FLOOR rather than once per run: every Halls
	 * floor (21-24) gets its own. Room placement itself isn't tracked (see
	 * `spdLevelGen/regularLevel.ts`'s own doc comment) - like every other monster on a ported or
	 * generic floor, it simply respawns fresh on re-entry, since this port doesn't persist
	 * per-floor mob state at all (see PORT_COVERAGE.md).
	 */
	private maybeSpawnDemonSpawner(): void {
		if (this.depth < 21 || this.depth > 24) return;
		const at = this.standableCellIn(this.randomSpawnRoom());
		if (!at) return;
		this.spawnMonster('demonSpawner', at);
	}

	/**
	 * `DemonSpawner.act()`'s spawn-cooldown countdown. `spawnCooldown--` every turn, clamped at
	 * -20 (`if (spawnCooldown < -20) spawnCooldown = -20`) so a long-uncontested spawner doesn't
	 * drift arbitrarily negative; once `<= 0`, an empty+passable 8-neighbour cell gets a fresh
	 * `RipperDemon`, already `HUNTING` (`sleeping = false`), and the cooldown resets to 60 turns
	 * minus up to 20 at Halls depths 22-24 (`Math.min(20, (depth-21)*6.67)` - 60/53.33/46.67/40
	 * turns to spawn on floor 21/22/23/24). No candidates: the cooldown stays `<= 0` and the next
	 * turn retries, same as Java.
	 */
	private tickDemonSpawner(spawner: Creature): void {
		spawner.spawnCooldown = Math.max((spawner.spawnCooldown ?? 60) - 1, -20);
		if (spawner.spawnCooldown > 0) return;

		const candidates: Step[] = [];
		for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
			const at = { x: spawner.x + dx, y: spawner.y + dy };
			if (this.level.passable(at.x, at.y) && !this.creatureAt(at.x, at.y)) candidates.push(at);
		}
		if (candidates.length === 0) return;

		const demon = this.spawnMonster('ripperDemon', Random.element(candidates)!);
		demon.sleeping = false;

		let cooldown = 60;
		if (this.depth > 21) cooldown -= Math.min(20, (this.depth - 21) * 6.67);
		spawner.spawnCooldown = cooldown;
	}

	private interactWithNPC(npc: Creature): void {
		if (npc.npcKind === 'wandmaker') this.interactWithWandmaker();
		else if (npc.npcKind === 'shopkeeper') this.interactWithShopkeeper();
		else if (npc.npcKind === 'blacksmith') this.interactWithBlacksmith();
		else if (npc.npcKind === 'imp') this.interactWithImp(npc);
		else if (npc.npcKind === 'ratKing') this.interactWithRatKing(npc);
		else this.interactWithGhost();
	}

	/**
	 * `RatKing.interact()`: sleeping kings wake with the real `not_sleeping` yell; awake
	 * kings without a King's Crown get `what_is_it`. The crown exchange (King's Crown +
	 * Ratmogrify armor ability) needs two systems this port has neither of, so it stays a
	 * documented block - the king keeps his exposition lines regardless.
	 */
	private interactWithRatKing(npc: Creature): void {
		if (npc.sleeping) {
			npc.sleeping = false;
			this.say(t('actors.mobs.npcs.ratking.not_sleeping'), 'positive');
		} else {
			this.say(t('actors.mobs.npcs.ratking.what_is_it'));
		}
	}

	/**
	 * `Ghost.interact()`: offers the quest the first time (spawning the type's miniboss,
	 * `Quest.given = true`), reminds the hero while it is still alive, and completes the quest
	 * (once, via `QuestLog.advance`) the first time the hero returns after it is dead.
	 */
	private interactWithGhost(): void {
		const status = this.quests.status('sadGhost');
		const target: MonsterId = this.ghostType === 2 ? 'gnollTrickster' : this.ghostType === 3 ? 'greatCrab' : 'fetidRat';

		if (status === 'available') {
			this.quests.start('sadGhost');
			this.quests.advanceStage('sadGhost', this.gameState); //past the "given" milestone, stage 0
			const at = this.standableCellIn(this.randomSpawnRoom());
			if (at) this.spawnMonster(target, at);
			this.say(t('port.npc.ghost.offer'));
			return;
		}

		if (status === 'complete') {
			this.say(t('port.npc.ghost.done'));
			return;
		}

		const stage = this.quests.currentStage('sadGhost');
		if (stage?.condition) {
			this.say(t('port.npc.ghost.remind'));
			return;
		}

		//the condition stage is done (the miniboss is dead) - this is the turn-in
		this.quests.advanceStage('sadGhost', this.gameState);
		const oldMax = this.hero.maxHp;
		this.hero.maxHp += 2;
		this.hero.hp += this.hero.maxHp - oldMax;
		//Ghost.Quest.spawn(): a fixed 50/30/15/5% tier roll (not the generic depth-scaled
		//randomWeapon/randomArmor this used to call), a shared upgrade level, and a shared 20%
		//enchant/glyph chance for both items - see `ghostQuestReward()` for the exact formula.
		setGeneratorDepth(this.depth);
		const reward = ghostQuestReward();
		const weaponReward = this.generatedInventoryItem(reward.weapon);
		const armorReward = this.generatedInventoryItem(reward.armor);
		Actors.identify(weaponReward);
		Actors.identify(armorReward);
		//The generator has already rolled the real curse/enchantment/glyph outcome; the compact
		//inventory payload carries that state through the same equipment workflow as floor drops.
		this.bag.add(weaponReward);
		this.bag.add(armorReward);
		this.say(t('port.npc.ghost.reward'), 'positive');
	}

	/** Troll Blacksmith quest: pickaxe + 15 dark gold in, a reforge (+1 weapon and armor) out */
	private interactWithBlacksmith(): void {
		const status = this.quests.status('blacksmith');
		if (status === 'available') {
			this.quests.start('blacksmith');
			this.quests.advanceStage('blacksmith', this.gameState);
			this.bag.add({ id: 'pickaxe', quantity: 1, identified: true });
			this.say(t(this.blacksmithAlternative ? 'port.npc.blacksmith.bloodOffer' : 'port.npc.blacksmith.offer'));
			return;
		}
		if (status === 'complete') {
			this.say(t('port.npc.blacksmith.done'));
			return;
		}
		const pick = this.bag.find('pickaxe');
		if (this.blacksmithAlternative) {
			if (!pick || pick.affix !== 'bloodStained') {
				this.say(t('port.npc.blacksmith.bloodRemind'));
				return;
			}
			this.bag.remove('pickaxe', 1);
		} else {
		const gold = this.bag.find('darkGold');
		if (!pick || !gold || gold.quantity < 15) {
			this.say(t('port.npc.blacksmith.remind', { gold: gold?.quantity ?? 0 }));
			return;
		}
		this.bag.remove('pickaxe', 1);
		this.bag.remove('darkGold', 15);
		}
		//WndBlacksmith reforge, collapsed: +1 weapon and +1 armor past the scroll cap of 3
		//(Java's reforge genuinely pushes past normal upgrade limits), one use ever
		this.weaponLevel = Math.min(5, this.weaponLevel + 1);
		this.armorLevel = Math.min(5, this.armorLevel + 1);
		this.syncHeroFromStats();
		this.gameState.setSwitch('blacksmithDone', true);
		this.quests.advanceStage('blacksmith', this.gameState);
		this.say(t('port.npc.blacksmith.reward', { weapon: this.weaponLevel, armor: this.armorLevel }), 'positive');
	}

	/** Imp quest: dwarf tokens in, a +2 cursed ring out (Java's exact reward shape) */
	private interactWithImp(npc: Creature): void {
		const status = this.quests.status('imp');
		if (status === 'available') {
			this.quests.start('imp');
			this.quests.advanceStage('imp', this.gameState);
			this.say(
				t('port.npc.imp.offer', {
					count: this.impNeed,
					enemy: t(this.impNeed === 5 ? 'port.npc.imp.enemy.monks' : 'port.npc.imp.enemy.golems'),
				})
			);
			return;
		}
		if (status === 'complete') {
			this.say(t('port.npc.imp.done'));
			return;
		}
		const tokens = this.bag.find('dwarfToken');
		if (!tokens || tokens.quantity < this.impNeed) {
			this.say(t('port.npc.imp.remind', { count: this.impNeed, held: tokens?.quantity ?? 0 }));
			return;
		}
		this.bag.remove('dwarfToken', this.impNeed);
		const ringId = Random.element(Object.keys(RING_DEFS))!;
		this.bag.add({ id: `ring_${ringId}`, quantity: 1, instanceId: this.newItemInstanceId('ring'), identified: true, level: 2 });
		const item = this.bag.find(`ring_${ringId}`)!;
		Actors.applyAffix(item, { id: 'cursed', trigger: 'passive', weight: 1, curse: true });
		this.gameState.setSwitch('impDone', true);
		this.quests.advanceStage('imp', this.gameState);
		//Imp.flee(): the quest giver leaves once paid
		this.scheduler.remove(npc);
		this.creatures.splice(this.creatures.indexOf(npc), 1);
		this.sprite(npc).destroy();
		this.spriteFor.delete(npc.id);
		this.say(t('port.npc.imp.reward', { ring: t(RING_KEYS[ringId]) }));
	}

	/** Wandmaker turn-in: the run's real quest fetch (corpse dust, embers, rotberry seed)
	 * for a choice of two wands (Magic Missile's clean damage, or Frost's
	 * damage-plus-chill simplified to damage-plus-daze). All three types are live with the
	 * real intro/reminder lines; type 2's candle ritual, newborn harvest, and embers
	 * turn-in are ported below (`useCandle`/`fireRitual`/`newbornElementalTurn`). */
	private interactWithWandmaker(): void {
		const status = this.quests.status('wandmaker');
		const genType = wandmakerQuestType();
		if (genType !== 0) this.wandmakerType = genType;
		const type = this.wandmakerType;
		if (status === 'available') {
			this.quests.start('wandmaker');
			this.quests.advanceStage('wandmaker', this.gameState);
			if (type === 1 || type === 2 || type === 3) {
				this.say(t('actors.mobs.npcs.wandmaker.intro_1'));
				this.say(t(type === 1 ? 'actors.mobs.npcs.wandmaker.intro_dust' : type === 2 ? 'actors.mobs.npcs.wandmaker.intro_ember' : 'actors.mobs.npcs.wandmaker.intro_berry'));
				this.say(t('actors.mobs.npcs.wandmaker.intro_2'));
			} else this.say(t('port.npc.wandmaker.offer'));
			return;
		}
		if (status === 'complete') {
			this.say(t('port.npc.wandmaker.done'));
			return;
		}
		if (type === 1) {
			const dust = this.bag.find('corpseDust');
			if (!dust) {
				this.say(t('actors.mobs.npcs.wandmaker.reminder_dust', { '0': t(CLASS_KEYS[this.heroClass]) }));
				return;
			}
			this.bag.remove('corpseDust', 1);
		} else if (type === 3) {
			const seed = this.bag.items.find((i) => i.id === 'seed'
				&& (i as typeof i & { sourceClass?: string }).sourceClass === 'Rotberry');
			if (!seed) {
				this.say(t('actors.mobs.npcs.wandmaker.reminder_berry', { '0': t(CLASS_KEYS[this.heroClass]) }));
				return;
			}
			this.bag.remove('seed', 1, seed.instanceId);
		} else if (type === 2) {
			const embers = this.bag.find('embers');
			if (!embers) {
				this.say(t('actors.mobs.npcs.wandmaker.reminder_ember', { '0': t(CLASS_KEYS[this.heroClass]) }));
				return;
			}
			this.bag.remove('embers', 1);
		} else {
			const scroll = this.bag.find('scroll') ?? this.bag.find('scrollIdentify') ?? this.bag.find('scrollUpgrade');
			if (!scroll) {
				this.say(t('port.npc.wandmaker.remind'));
				return;
			}
			this.bag.remove(scroll.id, 1);
		}
		//WndWandmaker's choice, simplified to "frost or not" - missile stays clean damage,
		//frost trades nothing here but adds a 5-turn chill (daze) to every zap
		this.frostWand = this.heroClass !== 'mage';
		this.wandType = this.frostWand ? 'frost' : 'magicMissile';
		this.bag.add({ id: 'wand', quantity: 1, stackable: true, identified: true });
		this.gameState.setSwitch('wandQuestDone', true);
		this.quests.advanceStage('wandmaker', this.gameState);
		this.say(
			this.frostWand
				? 'The wandmaker hands you a frost wand: your zaps now chill their target as well.'
				: 'The wandmaker tunes your staff: its zaps strike cleaner than before.'
		);
	}

	/** Shelf stock for one shop depth, seeded on first touch (two potions + two identifies -
	 * Java's full generated stock needs unported items plus a shop-browse UI, so the
	 * 2-item stand-in stays, now tracked per keeper instead of run-global). */
	private shopStockFor(depth: number): Actors.Inventory {
		let stock = this.shopStocks.get(depth);
		if (!stock) {
			stock = new Actors.Inventory();
			stock.add({ id: 'potion', quantity: 2, stackable: true, identified: true });
			stock.add({ id: 'scrollIdentify', quantity: 2, stackable: true, identified: true });
			this.shopStocks.set(depth, stock);
		}
		return stock;
	}

	private buybackFor(depth: number): { id: string; quantity: number; identified?: boolean }[] {
		let shelf = this.shopBuybackShelves.get(depth);
		if (!shelf) {
			shelf = [];
			this.shopBuybackShelves.set(depth, shelf);
		}
		return shelf;
	}

	/** Shopkeeper: bump to hear prices, B/N to buy, V to sell food, G to buy back the latest sale */
	private interactWithShopkeeper(): void {
		const potionPrice = this.shopPrice('potion');
		const identifyPrice = this.shopPrice('scrollIdentify');
		const foodPrice = this.shopSellPrice('food');
		let text = t('port.log.shopgreet', {
			potion: potionPrice, identify: identifyPrice, food: foodPrice, gold: this.heroStats.base('gold'),
		});
		const shelf = this.buybackFor(this.depth);
		if (shelf.length > 0) {
			const items = shelf.map((e) =>
				`${this.itemDisplayName(e.id, e.identified ?? true)} (${buybackPrice(e.id, e.quantity, e.identified ?? true)})`).join(', ');
			text += t('port.log.shopbuyback', { items });
		}
		this.say(text);
	}

	private shopPrice(id: 'potion' | 'scrollIdentify'): number {
		return getShopPrice(id === 'potion' ? 'potionHealing' : id, this.depth);
	}

	private shopSellPrice(id: 'food' | 'meat'): number {
		return getSellPrice(id, this.depth);
	}

	private shopBuy(id: 'potion' | 'scrollIdentify'): void {
		const price = this.shopPrice(id);
		const prices = new Map([[id, { buy: price, sell: 0 }]]);
		const potionName = id === 'potion' ? 'a healing draught' : 'a scroll of identify';
		if (Actors.buy(this.heroStats, this.shopStockFor(this.depth), this.bag, id, 1, { currency: 'gold', prices })) {
			this.say(t('port.log.buy', { item: potionName, price }), 'positive');
		} else {
			this.say(t('port.log.cannotafford', { item: potionName, price }), 'negative');
		}
	}

	private shopSellFood(): void {
		const food = this.bag.find('food') ?? this.bag.find('meat');
		if (!food) {
			this.say(t('port.log.nofoodtosell'));
			return;
		}
		//`WndTradeItem.sell`: flat `value()` for one unit, no time spent (a free action
		//here too), and the sale lands on the buyback shelf capped at 3 (oldest dropped).
		//Selling anything but food needs the same item-picker UI Transmutation is waiting
		//on, so the sell side stays food-only.
		const price = getSellPrice(food.id, this.depth);
		this.bag.remove(food.id, 1);
		this.heroStats.setBase('gold', this.heroStats.base('gold') + price);
		const shelf = this.buybackFor(this.depth);
		shelf.push({ id: food.id, quantity: 1, identified: food.identified ?? true });
		while (shelf.length > 3) shelf.shift();
		this.say(t('port.log.soldfood', { price }), 'positive');
	}

	/** Rebuy the most recent sale at flat `value()` (`Dungeon.gold -= returned.value()`).
	 * No picker UI exists to choose among up to 3 shelf entries, so the key always takes
	 * the latest sale (Java appends new sales at the list end) - documented, not silent. */
	private shopBuyback(): void {
		const shelf = this.buybackFor(this.depth);
		const entry = shelf[shelf.length - 1];
		if (!entry) {
			this.say(t('port.log.nobuyback'), 'negative');
			return;
		}
		const name = this.itemDisplayName(entry.id, entry.identified ?? true);
		const price = buybackPrice(entry.id, entry.quantity, entry.identified ?? true);
		if (this.heroStats.base('gold') < price) {
			this.say(t('port.log.cannotafford', { item: name, price }), 'negative');
			return;
		}
		this.heroStats.setBase('gold', this.heroStats.base('gold') - price);
		shelf.pop();
		this.bag.add({ ...entry, stackable: true });
		//Real Java logs only its own reluctance line here (the price was already on the
		//shelf label in the greeting above).
		this.say(t('actors.mobs.npcs.shopkeeper.buyback'), 'positive');
	}

	/**
	 * `{Sewer,Prison}Level.painter()`: `.setWater(feeling == WATER ? 0.85/0.90f : 0.30f, 5/4)`
	 * (the non-"feeling" branch, since this port does not model `Level.Feeling`) - real water
	 * in both regions is a level-wide organic patch, not a small hand-placed rectangle the way
	 * this port used to draw it. `RegularPainter.paintWater`'s own restriction - only
	 * `Terrain.EMPTY` (plain floor) cells the patch mask covers become water - is reproduced
	 * by checking `FLOOR` here; nothing has been placed as `DOOR`/`GRASS` yet at this point in
	 * `enterLevel`, so there is nothing else to accidentally flood.
	 */
	private placeWaterPool(start: Step, region: Region): void {
		const w = this.level.width;
		const h = this.level.height;
		const { fill, smoothing } = REGION_WATER[region];
		const lake = patchGenerate(w, h, fill, smoothing, true);

		for (const room of this.level.rooms) {
			for (let y = room.top; y <= room.bottom; y++) {
				for (let x = room.left; x <= room.right; x++) {
					if (lake[x + y * w] && this.level.get(x, y) === FLOOR) this.level.set(x, y, WATER);
				}
			}
		}

		//SPD's own room-shape exclusions (waterPlaceablePoints) keep entrances/exits dry as a
		//side effect of room geometry; this just clears the two specific points directly
		this.level.set(start.x, start.y, FLOOR);
		if (this.hasStairs) this.level.set(this.stairs.x, this.stairs.y, FLOOR);
	}

	/**
	 * `RegularPainter.paintGrass`: another `Patch.generate` pass, same shape of algorithm as
	 * `placeWaterPool` but its own fill/smoothing (`REGION_GRASS`) and reading `Terrain.EMPTY`
	 * cells the same way. Java then rolls each covered cell into `GRASS` or `HIGH_GRASS`
	 * (`Random.Float() < count/12f`, `count` starting at 1 for the cell itself plus one per
	 * grass-patch neighbour among its 8) - reproduced verbatim below, since it's what actually
	 * produces the real ~60%-high-grass mix at these fill/smoothing numbers the header comment
	 * on `TERRAIN_FRAME` mentions, not an invented ratio.
	 */
	private placeGrass(region: Region, start: Step): void {
		const w = this.level.width;
		const h = this.level.height;
		const { fill, smoothing } = REGION_GRASS[region];
		const patch = patchGenerate(w, h, fill, smoothing, true);

		for (const room of this.level.rooms) {
			for (let y = room.top; y <= room.bottom; y++) {
				for (let x = room.left; x <= room.right; x++) {
				const i = x + y * w;
				if (!patch[i] || this.level.get(x, y) !== FLOOR) continue;

				let count = 1;
				for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
					const nx = x + dx;
					const ny = y + dy;
					if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
					if (patch[nx + ny * w]) count++;
				}
				this.level.set(x, y, Random.float() < count / 12 ? HIGH_GRASS : GRASS);
				}
			}
		}

		this.level.set(start.x, start.y, FLOOR);
		if (this.hasStairs) this.level.set(this.stairs.x, this.stairs.y, FLOOR);
	}

	/**
	 * `RegularLevel.createItems()`: 3/4/5 generated items at 60%/30%/10%, plus two on a
	 * LARGE-feeling floor. Room painters have already emitted their own special-room drops;
	 * this is the separate regular-level item pass. The payload keeps the Generator-selected
	 * class, while the supported heap outcomes are represented by the live ground-item/chest
	 * boundary. The 1-in-20 ordinary Mimic branch and Java's artifact/upgradable locked-chest
	 * branch are real actors/chests rather than silently leaving the generated item on the floor.
	 */
	private placeGroundItems(): void {
		if (this.depth in BOSSES) return;
		setGeneratorDepth(this.depth);

		//`Random.chances({6,3,1})` is one draw with cumulative weights, not two independent
		//chance calls. Keep that draw shape so later Generator rolls stay in order.
		const itemCountRoll = Random.float();
		const count = 3 + (itemCountRoll < 0.6 ? 0 : itemCountRoll < 0.9 ? 1 : 2)
			+ (this.portedPaint?.feeling === 4 ? 2 : 0);
		let goldenKeysToSpawn = 0;
		for (let i = 0; i < count; i++) {
			const room = this.randomSpawnRoom();
			for (let attempt = 0; attempt < 10; attempt++) {
				const at = { x: Random.range(room.left, room.right), y: Random.range(room.top, room.bottom) };
				const kind = this.level.get(at.x, at.y);
				if (kind !== FLOOR && kind !== GRASS && kind !== HIGH_GRASS) continue;
				if (this.creatureAt(at.x, at.y)) continue;
				if (at.x === this.hero.x && at.y === this.hero.y) continue;
				if (this.hasStairs && at.x === this.stairs.x && at.y === this.stairs.y) continue;
				if (this.groundItemAt(at.x, at.y)) continue;

				const generated = generatorRandom();
				const item = this.generatedInventoryItem(generated);
				const heapRoll = Random.int(20);
				//RegularLevel's case 5 tries an ordinary Mimic on depths after the tutorial;
				//when it cannot spawn, Java falls through to an ordinary chest.
				if (heapRoll === 5 && this.depth > 1 && !this.creatureAt(at.x, at.y)) {
					const held = `${item.id}|${item.sourceClass ?? ''}`;
					this.spawnMonster('mimic', at, false, held);
					break;
				}
				// RegularLevel.createItems(): artifacts have a 1/2 locked-container roll;
				// ordinary upgradable items have Random.Int(4 - level) == 0. The Java
				// short-circuit matters: an artifact only reaches the second test when
				// its artifact roll failed.
				const upgradable = generated.cat === Cat.WEAPON
					|| (generated.cat >= Cat.WEP_T1 && generated.cat <= Cat.WEP_T5)
					|| generated.cat === Cat.ARMOR
					|| generated.cat === Cat.WAND
					|| generated.cat === Cat.RING;
				const lockedContainer = (generated.cat === Cat.ARTIFACT && Random.int(2) === 0)
					|| (upgradable && Random.int(Math.max(1, 4 - generated.level)) === 0);
				if (lockedContainer) {
					if (this.depth > 1 && Random.int(10) === 0 && !this.creatureAt(at.x, at.y)) {
						const held = `${item.id}|${item.sourceClass ?? ''}`;
						this.spawnMonster('mimic', at, false, held);
					} else {
						this.spawnGroundItem(groundKindForItem(item, 'food'), at.x, at.y, item, 'locked');
						goldenKeysToSpawn++;
					}
					break;
				}
				//The compact ground-item model has no separate skeleton heap sprite; a normal
				//chest preserves the item and pickup boundary for the remaining heap outcomes.
				this.spawnGroundItem(groundKindForItem(item, 'food'), at.x, at.y, item,
					heapRoll >= 1 && heapRoll <= 4 ? 'normal' : undefined);
				break;
			}
		}
		// RegularLevel.addItemToSpawn(new GoldenKey(depth)) is placed after generated
		// items. The compact inventory model uses one identified golden-key id per key.
		for (let i = 0; i < goldenKeysToSpawn; i++) {
			const keyRoom = this.randomSpawnRoom();
			for (let attempt = 0; attempt < 10; attempt++) {
				const at = { x: Random.range(keyRoom.left, keyRoom.right), y: Random.range(keyRoom.top, keyRoom.bottom) };
				if (!this.level.passable(at.x, at.y) || this.creatureAt(at.x, at.y)
					|| this.groundItemAt(at.x, at.y) || (at.x === this.hero.x && at.y === this.hero.y)) continue;
				this.spawnGroundItem('goldenKey', at.x, at.y, { id: 'goldenKey', quantity: 1, identified: true });
				break;
			}
		}
	}

	private groundItemAt(x: number, y: number): GroundItem | null {
		return this.groundItems.find((i) => i.x === x && i.y === y) ?? null;
	}

	private generatedInventoryItem(generated: GenItem): NonNullable<GroundItem['item']> {
		const cls = generated.cls;
		let id = 'food';
		//`Cat.WEAPON`/`Cat.MISSILE` are never the concrete `.cat` a generated weapon/missile
		//actually carries - `randomWeapon()`/`randomMissile()` always resolve to one of the
		//WEP_T1..T5/MIS_T1..T5 sub-tier cats (see `generatedGroundKind`'s own range check, which
		//already got this right). This strict-equality check never matched either range, so every
		//procedurally-generated weapon or missile silently fell through to the `'food'` default
		//with no affix ever rolled - found live while testing the Ghost-quest reward fix above,
		//not something that fix introduced. Fixed to the same range shape `generatedGroundKind` uses.
		if (generated.cat === Cat.GOLD) id = 'gold';
		else if (generated.cat <= Cat.WEP_T5 || (generated.cat >= Cat.MISSILE && generated.cat <= Cat.MIS_T5)) id = 'weaponReward';
		//Same class of rename `Cat.POTION`/`Cat.SCROLL` need above: every other generated
		//`Cat.STONE` runestone (StoneOfEnchantment/Intuition/DetectMagic/Flock/Aggression) used to
		//collapse into the generic 'stone' id with no distinct effect at all - a real, wider
		//"not ported" gap this rename didn't close, tracked in `PORT_COVERAGE.md` (a previous
		//revision of that gap list wrongly named a "StoneOfDisarming" that does not exist in real
		//SPD at all - the real 12th type is `StoneOfDetectMagic`, corrected here).
		//Every runestone now gets its own id here via the same `stonePortId` mapping that
		//`sourceInventoryItem`/transmutation share.
		else if (generated.cat === Cat.STONE) id = stonePortId(cls);
		else if (generated.cat === Cat.SEED) id = 'seed';
		else if (generated.cat === Cat.ARMOR) id = 'armorReward';
		else if (generated.cat === Cat.ARTIFACT) id = generated.cls.toLowerCase().includes('timekeepershourglass') ? 'hourglass' : 'cloak';
		else if (generated.cat === Cat.RING) id = `ring_${cls.replace(/^RingOf/, '').replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`).replace(/^_/, '')}`;
		else if (generated.cat === Cat.WAND) id = 'wand';
		else if (generated.cat === Cat.POTION) {
			//`quaffPotion()` and the rest of this file use the shorter `potionFlame`/`potionInvis`
			//ids (matching the starting-kit items makeHero() adds directly and every other
			//lookup table keyed on them) rather than the literal `PotionOfLiquidFlame`/
			//`PotionOfInvisibility` class-name mapping every other potion uses - previously
			//unrenamed here, so a genuinely-generated Liquid Flame or Invisibility potion got an
			//id nothing recognized and silently fell through `quaffPotion()`'s default (Purity)
			//branch instead of its real effect when quaffed.
			const name = cls === 'PotionOfLiquidFlame' ? 'Flame' : cls === 'PotionOfInvisibility' ? 'Invis' : cls.replace(/^PotionOf/, '');
			id = `potion${name}`;
		} else if (generated.cat === Cat.SCROLL) {
			//Same class of rename `Cat.POTION` needs above: `readScroll()` and the identification-
			//appearance table use the shorter `scrollMirror`/`scrollMapping`/`scrollCleanse` ids
			//(matching this port's own naming, not the literal Java class name), so a genuinely-
			//generated Mirror Image, Magic Mapping, or Remove Curse scroll previously got an id
			//nothing recognized and silently fell through to the default (Remove Curse) branch
			//instead of its own real effect - Remove Curse was accidentally correct for itself,
			//but Mirror Image and Magic Mapping (both of which have real, working ported effects)
			//were unreachable through actual play.
			const name = cls === 'ScrollOfMirrorImage' ? 'Mirror' : cls === 'ScrollOfMagicMapping' ? 'Mapping' : cls === 'ScrollOfRemoveCurse' ? 'Cleanse' : cls.replace(/^ScrollOf/, '');
			id = `scroll${name}`;
		} else if (generated.cat === Cat.FOOD) id = 'food';
		let affix: string | undefined;
		//Same range fix as the id mapping above - `<= Cat.WEP_T5` also correctly excludes actual
		//missiles (MIS_T1..T5 are all > WEP_T5), matching real `MissileWeapon.random()` never
		//rolling an enchant/curse at all (`itemRandom`'s `missile` case always returns
		//`hasGoodEnchant: false`), so this exclusion needs no separate missile check.
		if (generated.cat <= Cat.WEP_T5) affix = rollGeneratedAffix(ENCHANT_TABLE, generated.cursed, generated.hasGoodEnchant);
		else if (generated.cat === Cat.ARMOR) affix = rollGeneratedAffix(GLYPH_TABLE, generated.cursed, generated.hasGoodEnchant);
		return {
			id,
			quantity: generated.quantity,
			level: generated.level,
			cursed: generated.cursed,
			affix,
			identified: false,
			sourceClass: generated.cls,
			instanceId: ['weaponReward', 'armorReward', 'wand'].includes(id) || id.startsWith('ring_') ? this.newItemInstanceId(id) : undefined,
		};
	}

	/**
	 * Assigns a concrete enchant/glyph/curse id to a freshly generated weapon or armor - closes
	 * the "`rollAffix` is defined but never called" gap documented in `PORT_COVERAGE.md`. Mirrors
	 * Java's real split (`Weapon.random()`/`Armor.random()`): a cursed roll picks uniformly from
	 * the real curse pool (`enchant(Enchantment.randomCurse())` -> `Random.element(curses)`), a
	 * good-enchant roll picks by relative weight from the real enchant/glyph pool
	 * (`Enchantment.random()`'s `chances(typeChances)`). This is a fresh, gameplay-only roll
	 * (this port's shared `Random`, not the level-generation-seeded `SpdRandom`) - `generator.ts`'s
	 * own RNG-faithful `cursed`/`hasGoodEnchant` flags deliberately stop short of the concrete
	 * Generator-internal identity, the same "burn the real call, substitute a fresh roll for the
	 * unreproducible content" convention already used throughout `spdLevelGen/`'s room-content rolls.
	 */
	/** Drops a generated statue object as a real inventory payload, using a neighbouring cell for
	 * the second object because this port's floor model permits one heap entry per cell. */
	private dropGeneratedStatueItem(generated: GenItem, x: number, y: number): void {
		const item = this.generatedInventoryItem(generated);
		const candidates = [{ x, y }, ...Roguelike.neighbourOffsets(8).map(([dx, dy]) => ({ x: x + dx, y: y + dy }))];
		const at = candidates.find((cell) => this.level.passable(cell.x, cell.y)
			&& !this.groundItemAt(cell.x, cell.y) && !this.creatureAt(cell.x, cell.y));
		if (!at) return;
		this.spawnGroundItem(groundKindForItem(item, 'armor'), at.x, at.y, item);
	}

	private spawnGroundItem(kind: GroundItemKind, x: number, y: number, item?: GroundItem['item'], chest?: 'normal' | 'locked' | 'crystal', forSale?: boolean): void {
		if (this.groundItemAt(x, y)) return; //one item per cell - this port's simplification of Java's stacking heaps

		const sprite = new TintedSprite(this.itemsSheet.get(kind === 'bomb' && item?.id === 'doubleBomb' ? ITEM_FRAME[kind] + 1 : ITEM_FRAME[kind]));
		//`Bomb.glowing()`: a lit fuse glows red - reapplied here (rather than only at
		//throw time) so lit bombs reloaded from a save glow too.
		if (kind === 'bomb' && item?.fuseTurns !== undefined) sprite.tint = 0xff4444;
		sprite.x = x * TILE;
		sprite.y = y * TILE;
		this.itemLayer.addChild(sprite);
		const groundItem = { id: nextEntityId('item'), kind, x, y, item, chest, forSale };
		this.spriteFor.set(groundItem.id, sprite);
		this.groundItems.push(groundItem);
	}

	/** stepping onto a ground item's cell picks it up - `GameScene.pickUp` without a "leave it" choice, since there is no inventory UI to offer one through */
	private pickupGroundItemAt(x: number, y: number): void {
		const item = this.groundItemAt(x, y);
		if (!item) return;
		if (item.chest === 'crystal') {
			if (!this.bag.find('crystalKey')) {
				this.say(t('port.log.crystalchestlocked'), 'negative');
				return;
			}
			this.bag.remove('crystalKey', 1);
			this.say(t('port.log.unlockcrystalchest'), 'positive');
		}
		if (item.chest === 'locked') {
			if (!this.bag.find('goldenKey')) {
				this.say(t('port.log.lockedchestneedsgoldenkey'), 'negative');
				return;
			}
			this.bag.remove('goldenKey', 1);
			this.say(t('port.log.unlockchest'), 'positive');
		}
		if (item.chest) item.chest = undefined;
		if (item.forSale && item.item) {
			//Heap.Type.FOR_SALE: a shop stand is bought, never picked up free - previously
			//these spawned as ordinary loot, so whole generated shop stocks were stealable.
			//Priced with the real `sellPrice()` formula and the `for_sale` line; buying from
			//a stand still needs the shop-browse UI (see PORT_COVERAGE.md), so the heap stays
			//put. Stands with no priced payload behind them (cosmetic-only mappings) fall
			//through to the ordinary pickup below, exactly as before this gate existed.
			const price = getShopPrice(item.item.id, this.depth, item.item.quantity, item.item.identified ?? false);
			if (price > 0) {
				this.say(t('items.heap.for_sale', { '0': price, '1': this.itemDisplayName(item.item.id, item.item.identified ?? false, item.item.instanceId) }), 'info');
				return;
			}
		}
		runState.audio.cue(item.kind === 'gold' ? 'gold' : item.kind === 'dewdrop' ? 'dewdrop' : 'item', 0.6);

		this.groundItems.splice(this.groundItems.indexOf(item), 1);
		this.sprite(item).destroy();
		this.spriteFor.delete(item.id);

		if (item.kind === 'dewdrop') {
			this.collectDewdrop();
			return;
		}
		if (item.item?.id === 'sandBag') {
			const hourglass = this.bag.find('hourglass') as (typeof item.item & { sandBags?: number }) | undefined;
			if (!hourglass || hourglass.cursed) {
				this.say(t('port.log.nohourglasssand'), 'negative');
				return;
			}
			hourglass.sandBags = Math.min(5, (hourglass.sandBags ?? hourglass.level ?? 0) + 1);
			hourglass.level = hourglass.sandBags;
			this.say(hourglass.sandBags >= 5 ? 'Your hourglass is filled with magical sand.' : 'You add the sand to your hourglass.', 'positive');
			return;
		}
		if (item.item) {
			//`Bomb.doPickUp()`: stepping onto your own lit bomb snuffs its fuse instead of
			//detonating it - the bomb returns to the bag unlit, with the real snuff message.
			if (item.item.id === 'bomb' && item.item.fuseTurns !== undefined) {
				const { fuseTurns: _snuffed, ...unlit } = item.item;
				this.bag.add({ ...unlit, stackable: true });
				this.say(t('items.bombs.bomb.snuff_fuse'), 'positive');
				return;
			}
			//`DoubleBomb.doPickUp()`: a double heap is picked up as two ordinary bombs.
			//The "1+1 free!" status is English-only in real Java (`SPDSettings.language()`
			//gated), reproduced exactly rather than translated.
			if (item.item.id === 'doubleBomb') {
				const converted: NonNullable<GroundItem['item']> = { id: 'bomb', quantity: 2, identified: true, sourceClass: 'Bomb' };
				this.bag.add({ ...converted, stackable: true });
				if (language().code === 'en') this.showStatus(this.hero, '1+1 free!', SPD_STATUS_COLOR.neutral);
				this.say(t('port.log.pickup', { item: this.itemDisplayName('bomb', true) }), 'positive');
				return;
			}
			const payload = { ...item.item, stackable: true };
			if (payload.id === 'gold') {
				this.heroStats.setBase('gold', this.heroStats.base('gold') + payload.quantity);
				this.say(t('port.log.pickupgold', { amount: payload.quantity }), 'positive');
				return;
			}
			if (payload.id === 'ironKey' || payload.id === 'goldenKey' || payload.id === 'crystalKey') Actors.identify(payload);
			this.bag.add(payload);
			this.say(t('port.log.pickup', { item: this.itemDisplayName(payload.id, payload.identified ?? false, payload.instanceId) }), 'positive');
			return;
		}
		if (item.kind === 'gold') {
			//Gold.random(): Int(30+depth*10, 60+depth*20)
			const amount = Random.range(30 + this.depth * 10, 60 + this.depth * 20);
			this.heroStats.setBase('gold', this.heroStats.base('gold') + amount);
			this.say(t('port.log.pickupgold', { amount }), 'positive');
			return;
		}
		if (item.kind === 'stone' && (this.heroClass === 'warrior' || this.heroClass === 'rogue' || this.heroClass === 'duelist')) {
			//thrown ammo and ground stones are the same objects in Java (MissileWeapon) - a
			//recovered stone is ammunition again, whatever the class threw
			this.ammo++;
			if (this.ammoDurability <= 0) this.ammoDurability = 100;
			this.say(t('port.log.recoverstone'), 'positive');
			return;
		}
		if (item.kind === 'armor') {
			//no tier/glyph tables here: sturdier armor is +1 armor level, capped like an
			//enchant at +3 (see upgradeGear for the same cap)
			if (this.armorLevel < 3) {
				this.armorLevel++;
				this.syncHeroFromStats();
				this.say(t('port.log.weararmor', { level: this.armorLevel }), 'positive');
			} else {
				this.bag.add({ id: 'armor', quantity: 1, instanceId: this.newItemInstanceId('armor'), identified: true });
				this.say(t('port.log.stasharmor'));
			}
			return;
		}
		if (item.kind === 'wand') {
			this.wandCharges = new Actors.Charges({ max: 4, current: 4, regenRate: 1 });
			this.bag.add({ id: 'wand', quantity: 1, stackable: true, identified: true });
			this.say(t('port.log.wandabsorbed'), 'positive');
			return;
		}
		if (item.kind === 'amulet') {
			this.gameState.setSwitch('amuletObtained', true);
			if (this.demonSpawnerFloor) this.demonSpawnerFloor.setLayerData('demonSpawnerFloor', this.demonSpawnerFloorFrames(false));
			this.awardBadge('amulet');
			this.say(t('port.log.victory'), 'positive');
			this.awaitingInput = false;
			this.gameOver = true;
			recordRun({ result: 'won', depth: this.depth, level: this.progression.level, gold: this.heroStats.base('gold') });
			this.showVictoryPanel();
			return;
		}
		if (item.kind === 'ring') {
			//ground rings resolve to a random kind at +0/+1 (the Imp's fixed +2 cursed
			//reward is the only scripted one); unidentified, like every found item
			const ringId = `ring_${Random.element(Object.keys(RING_DEFS))!}`;
			this.bag.add({ id: ringId, quantity: 1, instanceId: this.newItemInstanceId('ring'), identified: false, level: Random.chance(0.5) ? 1 : 0 });
			this.say(t('port.log.pickupring', { item: this.itemDisplayName(ringId, false) }), 'positive');
			return;
		}
		if (item.kind === 'crystalKey') {
			this.bag.add({ id: 'crystalKey', quantity: 1, stackable: true, identified: true });
			this.say(t('port.log.pickup', { item: t('items.keys.crystalkey.name') }), 'positive');
			return;
		}
		const id =
			item.kind === 'potion'
				? 'potion'
				: item.kind === 'scroll'
					? Random.chance(0.25)
						? 'scrollUpgrade'
						: 'scrollIdentify'
					: item.kind;
		//Item.java identification: found items start unidentified (shuffled appearance
		//label, generic name) until a ScrollOfIdentify says otherwise
		this.bag.add({ id, quantity: 1, stackable: true, identified: false });
		this.say(t('port.log.pickup', { item: this.itemDisplayName(id, false) }), 'positive');
	}

	/**
	 * Food.TIME_TO_EAT/energy: eating resets hunger (HUNGRY=300 worth of energy) - meat works
	 * too (raw MysteryMeat with a flat +5 heal, a stand-in for the whole cook/carpaccio
	 * system). Warrior's HEARTY_MEAL talent is real: 1+2pts at <=25% HP, 1+1pts at <=50%.
	 */
	private eatFood(): boolean {
		const food = this.requestedItemId
			? this.bag.find(this.requestedItemId, this.requestedItemInstanceId)
			: this.bag.find('food') ?? this.bag.find('meat');
		if (!food) {
			this.say(t('port.log.nothingtoeat'), 'negative');
			return false;
		}
		this.bag.remove(food.id, 1);
		const cached = cachedRationChance(this.heroClass, this.talentRank('cached_rations'));
		if (cached > 0 && Random.chance(cached)) this.bag.add({ id: food.id, quantity: 1, stackable: true, identified: food.identified });
		this.hunger = 0;
		let heal = food.id === 'meat' ? 5 : 0;
		//Talent.onFoodEaten()'s Hearty Meal: single threshold at HP/HT < 33.4%, flat `2 + 2*pts`
		//healing - found using two invented thresholds (25%/50%) with different, non-Java shapes
		//in the 2026-09-09 hero-progression audit.
		if (this.heroClass === 'warrior') {
			const pts = this.talentRank('hearty_meal');
			if (this.hero.hp / this.hero.maxHp < 0.334) heal += 2 + 2 * pts;
		}
		if (this.heroClass === 'mage') this.wandBonusDamage = Math.max(this.wandBonusDamage, 2 * this.talentRank('empowering_meal'));
		if (this.heroClass === 'mage' && this.talentRank('energizing_meal') > 0) this.wandCharges.refund(this.talentRank('energizing_meal') === 1 ? 5 : 8);
		if (this.heroClass === 'duelist' && this.talentRank('focused_meal') > 0) this.ammo += this.talentRank('focused_meal') === 1 ? 1 : 2;
		if (this.heroClass === 'rogue' && this.talentRank('mystical_meal') > 0) this.hero.buffs['cloak'] = 9999;
		if (this.heroClass === 'huntress' && this.talentRank('invigorating_meal') > 0) this.freeTurnNext = true;
		if (this.heroClass === 'duelist' && this.talentRank('strengthening_meal') > 0) {
			this.physicalBonusDamage = 3;
			this.physicalBonusAttacks = this.talentRank('strengthening_meal') + 1;
		}
		this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + heal);
		this.showHeal(this.hero, heal);
		this.say(food.id === 'meat'
			? t(heal > 5 ? 'port.log.eatmeathearty' : 'port.log.eatmeat', { heal })
			: t(heal > 0 ? 'port.log.eathearty' : 'port.log.eat', { heal }), 'positive');
		return true;
	}

	/**
	 * Quaffs the best potion for the moment (healing when hurt - a full-heal stand-in for
	 * Healing's Shielding-aware HoT - else strength/flame/mindvision/invis/purity in bag
	 * order). PotionOfHealing's cure list (poison/burning/weakness among them) is real.
	 */
	private quaffPotion(): boolean {
		const hurt = this.hero.hp < this.hero.maxHp;
		const ids = this.bag.items.filter((i) => i.id.startsWith('potion') && i.quantity > 0).map((i) => i.id);
		if (ids.length === 0) {
			//no potion: drink from the waterskin instead (Dewdrop.consumeDew's per-drop rule)
			if (this.waterskin <= 0) {
				this.say(t('port.log.nothingtodrink'), 'negative');
				return false;
			}
			const heal = Math.min(this.hero.maxHp - this.hero.hp, Math.round(this.hero.maxHp * 0.05 * this.waterskin));
			this.hero.hp += heal;
			this.waterskin = 0;
			this.say(t('port.log.drinkwaterskin', { heal }), 'positive');
			return true;
		}
		let id = this.requestedItemId && ids.includes(this.requestedItemId) ? this.requestedItemId : ids[0];
		if (!this.requestedItemId && hurt && ids.includes('potion')) id = 'potion';
		else if (!this.requestedItemId && hurt && ids.includes('potionHealing')) id = 'potionHealing';
		else if (!this.requestedItemId && ids.includes('potionStrength')) id = 'potionStrength';
		else if (!this.requestedItemId && !hurt && (id === 'potion' || id === 'potionHealing') && ids.length === 1) {
			this.say(t('port.log.savedraught'));
			return false;
		}
		this.bag.remove(id, 1, this.requestedItemInstanceId);
		const effect = this.potionEffects[id];
		if (effect) effect();
		else {
			//This exact silent-fallthrough shape has bitten this file twice before (Frost,
			//then Toxic/Paralytic Gas each briefly quaffed as Purity before getting their
			//own registry entry) - a dev-only warning beats relying on registry-completeness
			//discipline alone to catch the next one.
			console.warn(`quaffPotion: unrecognized potion id "${id}", treating as Purity`);
			this.applyPotionPurity();
		}
		return true;
	}

	/**
	 * Data-driven potion-effect dispatch: was a 39-branch `if (id === ...) else if (...)`
	 * chain (one `else if` per real Java `Potion` subclass), now a `Record` lookup keyed by
	 * generated item id. Same behavior per id, same comments citing the real Java source per
	 * effect - restructured for O(1) dispatch and to read as a table of "id -> effect" rather
	 * than a cascade, not a behavior change. `potionPurity` (real Java's actual fallback for
	 * any potion with no more specific effect) and any genuinely unrecognized id both still
	 * route through `applyPotionPurity` from `quaffPotion`'s own `else` above - kept out of
	 * this map since "the id wasn't found" is exactly the case this map can't dispatch itself.
	 */
	private readonly potionEffects: Record<string, () => void> = {
		potion: () => this.applyPotionHealing(),
		potionHealing: () => this.applyPotionHealing(),
		potionStrength: () => {
			this.heroStr++;
			this.syncHeroFromStats();
			this.say(t('port.log.stronger', { str: this.heroStr }), 'positive');
		},
		//PotionOfLiquidFlame.shatter(): real Java seeds a Fire blob in a 9-cell neighborhood
		//around the shatter point (`GameScene.add(new Fire())` sized `Ballistica`-splash), not
		//a single instant hit - this port has no thrown-item blob-seeding path from a quaff
		//action, so it substitutes an instant 4 damage + `burning` on the nearest visible
		//enemy instead (the same "one target, one number" shape every other auto-targeted
		//consumable in this file already uses). The `4` is an arbitrary stand-in with no
		//direct Java derivation (real `Burning`'s own tick damage is
		//`NormalIntRange(1, 3+scalingDepth/4)` per turn, not a single flat hit) - `potionFrost`
		//below deliberately reuses this same `4` as "Liquid Flame's own damage", so the number
		//is now anchored here for both. Comment added in the 2026-09-09 item-system audit;
		//this was the only one of the 12 potion branches with no explaining comment at all.
		potionFlame: () => {
			const target = this.nearestVisibleEnemy(6);
			if (target) {
				target.hp -= 4;
				this.showDamage(target, 4);
				addBuff(target, 'burning');
				this.say(t('port.log.hurlflame', { target: target.name }));
				if (target.hp <= 0) this.kill(target);
			} else this.say(t('port.log.flaskwasted'), 'negative');
		},
		//PotionOfMindVision.apply(): a 20-turn MindVision buff that reveals every monster's
		//position through walls/fog, not a trap/secret reveal - this port previously
		//confused it with something closer to Scroll of Magic Mapping (which really does
		//reveal traps). See `this.sprite(creature).visible`'s gate for the actual reveal.
		potionMindVision: () => {
			addBuff(this.hero, 'mindvision');
			this.say(t(this.creatures.some((c) => !c.isHero && !c.isNPC) ? 'port.log.mindvisionmobs' : 'port.log.mindvisionnone'), 'positive');
		},
		//PotionOfInvisibility.apply()/Invisibility.attachTo(): grants the buff and nothing
		//else - it does not put monsters to sleep. This port previously force-slept every
		//monster on the floor here, a much stronger and incorrect effect layered on top of
		//the actually-correct, already-ported invisibility AI gating elsewhere
		//(`monster.seesHero`'s `!hero.buffs['invisibility']` check and `takeMonsterTurn`'s
		//`distance > 1` skip already reproduce Java's real "distant monsters lose track,
		//adjacent ones keep fighting" behavior on their own).
		potionInvis: () => {
			addBuff(this.hero, 'invisibility');
			if (this.subclass() === 'freerunner' && this.talentRank('speedy_stealth') > 0) this.hero.buffs['invisibility'] = 20 + 5 * this.talentRank('speedy_stealth');
			this.say(t('port.log.invisible'), 'positive');
		},
		//PotionOfExperience.apply(): `hero.earnExp(hero.maxExp())` - grants exactly the XP
		//needed to complete the current level, evaluated before the level-up itself raises
		//the requirement (so always exactly one level's worth, never a partial one).
		potionExperience: () => {
			const maxExp = SPD_LEVEL_CURVE.experienceFor(this.progression.level + 1) - SPD_LEVEL_CURVE.experienceFor(this.progression.level);
			this.grantExperience(maxExp);
			this.say(t('port.log.quaffexperience'), 'positive');
		},
		//PotionOfLevitation.apply(): grants Levitation.DURATION (20 turns, already this
		//port's BUFF_DURATION.levitation) and nothing else - no blast, no identification
		//side effect beyond the buff itself. Levitation.attachTo() also clears Roots the
		//instant it lands (flight lifts you clear of whatever rooted you); this port's
		//`cripple`/`roots` are separate buffs, so only `roots` needs clearing here.
		potionLevitation: () => {
			addBuff(this.hero, 'levitation');
			delete this.hero.buffs['roots'];
			this.say(t('port.log.levitate'), 'positive');
		},
		//Potion.apply(hero) is just `shatter(hero.pos)` for every gas potion in real Java -
		//there is no separate "drink" effect, drinking one gases your own feet exactly like
		//throwing it at yourself. `PotionOfToxicGas.shatter()` seeds the same 1000-volume
		//`ToxicGas` blob as `ToxicTrap` (see `triggerTrapAt`'s `toxic` branch above).
		potionToxicGas: () => {
			this.toxicGas.seed(this.hero.x, this.hero.y, 1000);
			this.say(t('port.log.quafftoxicgas'), 'negative');
		},
		//PotionOfParalyticGas.shatter(): same shape, seeds a 1000-volume `ParalyticGas` blob
		//at the hero's own feet.
		potionParalyticGas: () => {
			this.paralyticGas.seed(this.hero.x, this.hero.y, 1000);
			this.say(t('port.log.quaffparalyticgas'), 'negative');
		},
		//PotionOfHaste.apply(): grants the Haste buff (Haste.DURATION=20). Char.speed()'s real
		//`speed *= 3f` for Haste is a genuine turn-cost multiplier this port can now express -
		//the earlier "needs a hero speed buff system this port doesn't have" premise was stale
		//once `getActionTurnCostMod` existed (see RingOfHaste's own multiplier there already).
		potionHaste: () => {
			addBuff(this.hero, 'haste');
			this.say(t('port.log.quaffhaste'), 'positive');
		},
		//PotionOfFrost.shatter(): seeds a `Freezing` blob at the shatter cell, which
		//extinguishes fire, chills (`Chill`) and eventually freezes (`Frost`, an
		//immobilize) everything caught in it. This port has no blob-freezing terrain and
		//no freeze/immobilize status distinct from paralysis (see PORT_COVERAGE.md), so
		//this is Simplified to the shape the neighboring gas-potion branches already use:
		//extinguish the hero's own `burning`, deal Liquid Flame's own 4 damage to the
		//nearest visible enemy, and apply `daze` as the chill stand-in (the same
		//"Frost's damage-plus-chill simplified to damage-plus-daze" substitution the
		//WandOfFrost branch already documents).
		potionFrost: () => {
			delete this.hero.buffs['burning'];
			//EternalFire vs Freezing: any frost touching any part of the wall clears the whole
			//thing (`clear()` -> `fullyClear()` - the room's own dropped PotionOfFrost is the
			//intended key past its wall). This port has no Freezing blob (see the branch comment
			//above), so quaffing frost checks a Chebyshev-2 circle around the hero - the same
			//radius approximation StoneOfShock already uses - and quenches the entire wall when
			//any burning cell falls inside it. Water/blizzard clearing is not modeled (neither
			//system touches blobs here).
			let touchesFire = false;
			for (let dy = -2; dy <= 2 && !touchesFire; dy++)
				for (let dx = -2; dx <= 2 && !touchesFire; dx++)
					if (this.eternalFire.volumeAt(this.hero.x + dx, this.hero.y + dy) >= 1) touchesFire = true;
			if (touchesFire) {
				this.eternalFire = new Roguelike.Blob(this.level.width, this.level.height);
				this.say(t('port.log.frostfire'), 'positive');
			}
			const target = this.nearestVisibleEnemy(6);
			if (target) {
				//Elemental.add(): Frost/Chill are `harmfulBuffs` - gaining either deals
				//`NormalIntRange(HT/2, HT*3/5)` instead of applying (fire elementals included;
				//the newborn shares it via `FireElemental`). This port has no Frost/Chill buffs
				//at all, so the stand-in daze branch below would tickle a 60-HP elemental for 4
				//- the one place the frost stand-in is not just imprecise but wrong-shaped, and
				//exactly the counter the ritual room's own dropped Frost potion implies. Chill
				//itself stays unmodeled (no chill buff exists to trigger on).
				if (target.kind === 'elemental' || target.kind === 'newbornElemental') {
					const scald = Random.normalRange(Math.floor(target.maxHp / 2), Math.floor((target.maxHp * 3) / 5));
					target.hp -= scald;
					this.showDamage(target, scald);
					if (target.hp <= 0) this.kill(target);
				} else {
					target.hp -= 4;
					this.showDamage(target, 4);
					addBuff(target, 'daze');
					if (target.hp <= 0) this.kill(target);
				}
			}
			this.say(t('port.log.quafffrost'), 'positive');
		},
		potionPurity: () => this.applyPotionPurity(),
	};

	private applyPotionHealing(): void {
		//PotionOfHealing.apply(): cure() always runs first regardless of the challenge below.
		//Real cure() also detaches Bleeding/Blindness/Drowsy/Slow/Vertigo - none exist as buffs
		//in this port, so there's nothing to clear for them. It does NOT touch Burning; that was
		//a real, unwarranted addition here (2026-09-09 item-system audit) - a healing potion
		//does not extinguish fire in real Java, removed.
		for (const b of ['poison', 'weakness', 'vulnerable', 'cripple'] as BuffId[]) delete this.hero.buffs[b];
		if (isChallengeEnabled('no_healing')) {
			//PotionOfHealing.heal()'s real NO_HEALING branch: no Healing buff at all (so none
			//of the restored_*-talent triggers below fire either, since they key off the heal
			//actually happening), instead pharmacophobiaProc() sets a fresh Poison(4+lvl/2) -
			//found dead alongside the other challenge audits this session.
			this.hero.buffs['poison'] = 4 + Math.floor(this.progression.level / 2);
			this.say(t('port.log.pharmacophobia'), 'negative');
		} else {
			//PotionOfHealing.heal(): `Buff.affect(ch, Healing.class).setHeal((int)(0.8*HT+14), 0.25, 0)`
			//- a gradual heal-over-time, not an instant full heal (see the applyBuffDamage tick
			//in spendHeroTurn). `setHeal` only replaces `healingLeft` if the new amount is bigger,
			//so quaffing a second potion mid-heal doesn't stack additively on top of the first.
			const amount = Math.round(0.8 * this.hero.maxHp + 14);
			if (amount > this.healingLeft) this.healingLeft = amount;
			const willpower = this.talentRank('restored_willpower');
			if (willpower > 0) this.grantHeroShield(Math.round(this.hero.maxHp * (willpower === 1 ? 0.67 : 1)), this.hero.maxHp);
			if (this.talentRank('restored_agility') > 0) { this.healingEvasionTurns = 1; this.syncHeroFromStats(); }
			const nature = this.talentRank('restored_nature');
			if (nature > 0) for (const enemy of this.creatures.filter(c => !c.isHero && !c.isNPC && Roguelike.chebyshevDistance(this.hero, c) <= 1)) addBuff(enemy, 'roots');
			this.say(t('port.log.quaffhealing'), 'positive');
		}
	}

	private applyPotionPurity(): void {
		//PotionOfPurity.apply() itself only clears poison/burning ('potionPurity' - Java's
		//`GasCloud`/`Fire` extinguish). Every generated potion id now has its own registry
		//entry above (PotionOfFrost was the last one missing one), so this is genuinely just
		//Purity's effect. See `PORT_COVERAGE.md`.
		for (const b of ['poison', 'burning'] as BuffId[]) delete this.hero.buffs[b];
		this.say(t('port.log.purity'), 'positive');
	}

	/**
	 * Reads the best scroll for the moment (identify first while anything is unidentified,
	 * then rage/lullaby/mapping/mirror/cleanse/upgrade in bag order). ScrollOfRage beckons
	 * (wakes) everything, Lullaby puts visible mobs to sleep (Drowsy->MagicalSleep in one
	 * step, stated), Mapping reveals traps (mob-reveal needs the mob layer UI), MirrorImage
	 * is a 10-turn bless ("your reflections guard you" - no image-actor AI exists to move
	 * real duplicates), RemoveCurse clears weakness/vulnerability, Upgrade is U's action.
	 */
	private readScroll(): boolean {
		const ids = this.bag.items.filter((i) => i.id.startsWith('scroll') && i.quantity > 0).map((i) => i.id);
		if (ids.length === 0) {
			this.say(t('port.log.noscroll'), 'negative');
			return false;
		}
		const unidentified = this.bag.items.find((i) => !i.identified && i.quantity > 0);
		let id = this.requestedItemId && ids.includes(this.requestedItemId) ? this.requestedItemId : ids[0];
		if (!this.requestedItemId && unidentified && ids.includes('scrollIdentify')) id = 'scrollIdentify';
		else if (!this.requestedItemId && ids.includes('scrollRage')) id = 'scrollRage';
		else if (!this.requestedItemId && ids.includes('scrollLullaby')) id = 'scrollLullaby';
		else if (!this.requestedItemId && ids.includes('scrollMapping')) id = 'scrollMapping';
		else if (!this.requestedItemId && ids.includes('scrollMirror')) id = 'scrollMirror';
		else if (!this.requestedItemId && ids.includes('scrollRecharging')) id = 'scrollRecharging';
		else if (!this.requestedItemId && ids.includes('scrollCleanse')) id = 'scrollCleanse';
		if (id === 'scrollUpgrade') {
			this.say(t('port.log.scrollisforgear'));
			return false;
		}
		if (id === 'scrollTransmutation') {
			//ScrollOfTransmutation.doRead()/onItemSelected()/changeItem() (checked against
			//tag `v3.3.8`): rerolls one eligible item into a different item of the same
			//category, preserving upgrades/enchantments/curse state, and consumes the scroll.
			//The target comes from the real picker now (`InventoryScroll.itemSelector` via
			//`openItemPicker`, titled with the real `inv_title` key) - the old first-eligible
			//auto-target is gone, along with its upgrade/identify-scroll deprioritization
			//hack (unneeded once the player chooses). Reading spends the turn either way;
			//a cancel or an empty eligible list consumes nothing (Java's `result == null`
			//path collects `curItem` back), logging the real `nothing` key. The
			//identifiedByUse/already-detached cancel nuance has no expression here - this
			//port only ever consumes the scroll inside `completeTransmutation`. See
			//`transmuteCandidates`/`transmuteItem` for the per-category rules and
			//`PORT_COVERAGE.md`.
			const candidates = this.transmuteCandidates();
			if (candidates.length === 0) {
				this.say(t('items.scrolls.scrolloftransmutation.nothing'), 'negative');
				return false;
			}
			this.openItemPicker(t('items.scrolls.scrolloftransmutation.inv_title'), candidates, (entry) =>
				this.completeTransmutation(entry)
			);
			return true;
		}
		this.bag.remove(id, 1, this.requestedItemInstanceId);
		if (id === 'scrollIdentify') {
			if (unidentified) {
				Actors.identify(unidentified);
				//**Correction, 2026-09-09 roadmap pass**: a prior audit pass (checking only
				//Java tags `v3.3.8`/`4.0.0-beta`) wrongly called `test_subject`/`tested_hypothesis`
				//invented substitutes for the unrelated `PROVOKED_ANGER`/`LINGERING_MAGIC` talents.
				//They are real, named talents in the version of SPD this checkout's generated
				//message catalog was actually built from (`actors.hero.talent.test_subject`/
				//`tested_hypothesis`, real English text still in `src/generated/spdMessages.ts`),
				//simply absent from the two older tags checked. Real `test_subject`: "+1: heals
				//2 HP on identify, +2: heals 3 HP" - exactly what `heal + 1` below already does
				//(rank 1 -> 2, rank 2 -> 3), no fix needed. Real `tested_hypothesis`: "+1: gains
				//2 turns of wand recharging on identify, +2: gains 3 turns" - two bugs were here.
				//First, `Charges.refund(N)` grants N whole charges outright, drastically stronger
				//than "N turns of recharging" (`recoverWandCharge`'s own `turnsToCharge` runs
				//10-50 real turns per charge). Second, simply switching to `Charges.advance(N)`
				//is not right either: `Charges.advance`'s argument is progress *units* toward one
				//charge, not real game turns, and this port's `wandCharges` uses `regenRate: 1`
				//(one progress unit fills a charge) while `recoverWandCharge` banks only a small
				//fraction of a unit per real turn (`ringEnergyMultiplier / turnsToCharge`, ~0.02-
				//0.1) - so `advance(N)` still grants ~N whole charges, the same overshoot as
				//`refund`. The correct amount is what N real turns of the *current* passive
				//regen rate would have produced: that same per-turn fraction, scaled by N.
				const heal = this.heroClass === 'warrior' ? this.talentRank('test_subject') : 0;
				const charge = this.heroClass === 'mage' ? this.talentRank('tested_hypothesis') : 0;
				if (heal > 0) { this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + heal + 1); this.showHeal(this.hero, heal + 1); }
				if (charge > 0) {
					const missing = this.wandCharges.max - this.wandCharges.current;
					const turnsToCharge = 10 + 40 * Math.pow(0.875, Math.max(0, missing));
					const perTurnRate = ringEnergyMultiplier(this.equippedRing) / turnsToCharge;
					this.wandCharges.advance(perTurnRate * (charge + 1));
				}
				//The old secret-revealing radius here invoked `arcaneVisionRadius()` - removed
				//outright: real Arcane Vision (Mage T2, `Wand.wandProc()`) marks the ZAPPED
				//target with `CharAwareness` for `5+5*points` turns, and has no identify/read
				//interaction at all. Revealing secrets on identify had no Java basis (the same
				//fabricated-stand-in class as the old Nature's Bounty dew odds). The real
				//zap-half lives in `useSpecial`'s zap branch now.
				this.say(t('port.log.identify', { item: this.itemDisplayName(unidentified.id, true) }), 'positive');
			} else this.say(t('port.log.nothingunidentified'), 'negative');
		} else if (id === 'scrollRage') {
			//ScrollOfRage.doRead(): every mob on the level (not just visible ones) is beckoned
			//toward the reader's position - reusing the same `seesHero` target-acquisition stand-in
			//the Annoying weapon curse already uses for its own beckon effect, previously missing
			//here (mobs only woke in place instead of actually turning to approach). Visible,
			//non-ally mobs additionally get 5 turns of `Amok` (attack anything nearby, allies
			//included) in real Java; the shared creature-target turn now models that behavior.
			for (const c of this.creatures) {
				if (c.isHero || c.isNPC) continue;
				c.sleeping = false;
				c.seesHero = true;
				if (!c.isAlly && this.fov.isVisible(c.x, c.y)) addBuff(c, 'amok');
			}
			this.say(t('port.log.rage'));
		} else if (id === 'scrollLullaby') {
			//ScrollOfLullaby.doRead(): visible mobs get `Drowsy` (a gradual debuff that puts them
			//to sleep after several turns, not instantly), and the *reader* also becomes Drowsy -
			//a real downside to using it while enemies are near. This port has no Drowsy buff, so
			//visible mobs are put to sleep immediately instead (stronger and more certain than
			//the real effect), and the hero-side drawback isn't modeled at all.
			for (const c of this.creatures) if (!c.isHero && !c.isNPC && this.fov.isVisible(c.x, c.y)) c.sleeping = true;
			this.say(t('port.log.lullaby'));
		} else if (id === 'scrollMapping') {
			//ScrollOfMagicMapping.doRead(): marks every discoverable cell on the floor `mapped`
			//(the whole layout becomes visible, not just secrets) *and* reveals secret terrain.
			//This port's fog-of-war doubles as its map display (no separate minimap), so the
			//equivalent is `FieldOfView.revealAll()` - a real `mwg/roguelike` capability built
			//specifically "for a magic mapping effect" per its own doc comment, but, like
			//`rollAffix` earlier this session, never actually called anywhere. The scroll
			//previously only revealed secrets, leaving the rest of the floor as unexplored as
			//before reading it - a real, meaningful gap, not just an aesthetic one.
			this.fov.revealAll();
			for (let y = 0; y < this.level.height; y++)
				for (let x = 0; x < this.level.width; x++) {
					if (this.secrets.isSecret(x, y)) this.secrets.discover(x, y);
				}
			this.restitchAllTiles();
			this.say(t('port.log.mapping'), 'positive');
		} else if (id === 'scrollMirror') {
			//ScrollOfMirrorImage.doRead(): spawns 2 allied MirrorImage NPCs (1 HP each, mirroring
			//the hero's own weapon/accuracy/evasion) that fight alongside the hero until killed.
			//The ally turn/target seam is now live; the remaining visual reduction is documented
			//in PORT_COVERAGE.md (no dedicated MirrorImage sheet exists in this port).
			const cells = Roguelike.neighbourOffsets(8)
				.map(([dx, dy]) => ({ x: this.hero.x + dx, y: this.hero.y + dy }))
				.filter((at) => this.level.passable(at.x, at.y) && !this.creatureAt(at.x, at.y));
			for (const at of cells.slice(0, 2)) this.spawnMirrorImage(at);
			this.say(t('port.log.mirror'), 'positive');
		} else if (id === 'scrollRecharging') {
			//ScrollOfRecharging.doRead(): grants the same 30-turn `Recharging` flavour buff this
			//port already models (`BUFF_DURATION.recharging`, already read by `recoverWandCharge`
			//for its 1.25x rate bonus) - no new system needed, this scroll was just never wired
			//to the buff it already fully supports.
			addBuff(this.hero, 'recharging');
			this.say(t('port.log.recharging'), 'positive');
		} else if (id === 'scrollTeleportation') {
			//ScrollOfTeleportation.doRead()/teleportToLocation(): moves the reader to a free cell
			//and clears Roots. Real Java's `teleportPreferringUnseen` biases toward an unvisited
			//room with a reachability check via `PathFinder`; this port has no room-visited
			//tracking or reachability search to draw on, so it reuses `randomFreeCell` - the same
			//uniformly-random, unchecked placement already used for the Displacing/Displacement
			//curse teleports elsewhere in this file, extended to a third caller rather than
			//inventing a second placement strategy.
			delete this.hero.buffs['roots'];
			const destination = this.randomFreeCell(this.hero);
			if (destination) {
				this.moveTo(this.hero, destination);
				//real Java message keys, already in the generated catalog for every locale -
				//no new port.log.* entry needed for this one.
				this.say(t('items.scrolls.scrollofteleportation.tele'), 'positive');
			} else this.say(t('items.scrolls.scrollofteleportation.no_tele'), 'negative');
		} else if (id === 'scrollTerror') {
			//ScrollOfTerror.doRead(): affects every visible non-ally mob with a `Terror` buff
			//that stops it attacking the reader specifically and makes it flee - modeled here as
			//`takeMonsterTurn`'s always-flee override (see that check's own comment for why a
			//per-object avoidance isn't feasible in this port's model). Real Java also tracks
			//which specific mob(s) got affected for its none/one/many log variants; this port
			//has no ally mobs to exclude, so "every visible, non-NPC monster" is the full target
			//set (`isNPC` mobs here are quest givers/shopkeepers, not Java's ally alignment, but
			//they're non-hostile the same way allies would be excluded).
			const affected: Creature[] = [];
			for (const c of this.creatures) {
				if (!c.isHero && !c.isNPC && this.fov.isVisible(c.x, c.y)) {
					addBuff(c, 'terror');
					affected.push(c);
				}
			}
			if (affected.length === 0) this.say(t('items.scrolls.scrollofterror.none'), 'negative');
			else if (affected.length === 1) this.say(t('items.scrolls.scrollofterror.one', { '0': affected[0]!.name }), 'positive');
			else this.say(t('items.scrolls.scrollofterror.many'), 'positive');
		} else if (id === 'scrollRetribution') {
			//ScrollOfRetribution.doRead(): damages every visible mob for
			//`round(mob.HT/10 + mob.HP*power*0.225)` where `power = min(4, 4.45*missingHpFraction)`
			//- the weaker the reader, the harder the blast hits (can one-shot most enemies at very
			//low HP) - then applies `Weakness` and `Blindness` to the reader as the cost. This
			//port has no `Blindness` status (a `FlavourBuff` whose real mechanical effect lives
			//in vision-radius/targeting code this port doesn't have an equivalent seam for), so
			//only `Weakness` is applied; `Weakness` and `Vulnerable` were both dead code before
			//this (defined, correctly wired into `rollDamage`, but never actually granted by
			//anything) - this scroll is their first real source. `Vulnerable` is Java's own
			//separate mob-side debuff and is not part of Retribution; unaffected here.
			const missingHpFraction = (this.hero.maxHp - this.hero.hp) / this.hero.maxHp;
			const power = Math.min(4, 4.45 * missingHpFraction);
			for (const c of [...this.creatures]) {
				if (c.isHero || c.isNPC || !this.fov.isVisible(c.x, c.y)) continue;
				const damage = Math.round(c.maxHp / 10 + c.hp * power * 0.225);
				c.hp -= damage;
				this.showDamage(c, damage);
				if (c.hp <= 0) this.kill(c);
			}
			addBuff(this.hero, 'weakness');
			this.say(t('items.scrolls.scrollofretribution.blast'), 'warning');
		} else {
			//ScrollOfRemoveCurse.doRead() is genuinely this branch's effect ('scrollCleanse' hits
			//it correctly). `ScrollOfTransmutation` has its own transmute branch above, so
			//this default is only reached by genuinely unknown scroll ids - still Remove
			//Curse's effect, a deliberate fallback rather than a silent misbehavior.
			//See `PORT_COVERAGE.md`.
			for (const b of ['weakness', 'vulnerable', 'hex', 'daze'] as BuffId[]) delete this.hero.buffs[b];
			for (const item of this.bag.items) if (item.cursed || getCurse(item.affix ?? '')) Actors.removeAffix(item);
			if (getCurse(this.weaponAffix ?? '')) this.weaponAffix = null;
			if (getCurse(this.armorGlyph ?? '')) this.armorGlyph = null;
			if (this.equippedRing?.cursed) this.equippedRing.cursed = false;
			this.syncHeroFromStats();
			this.say(t('port.log.cleanse'), 'positive');
		}
		return true;
	}

	/**
	 * Picker-eligible entries for the transmutation scroll, in bag order. Self-targeting
	 * the read scroll itself follows real Java (`usableOnItem`: `item != this ||
	 * quantity > 1`): a `scrollTransmutation` stack of 2+ is eligible, since reading
	 * consumes one and leaves one to transmute.
	 */
	private transmuteCandidates(): { id: string; quantity: number; instanceId?: string; identified?: boolean; level?: number; affix?: string; cursed?: boolean; sourceClass?: string }[] {
		const items = this.bag.items as { id: string; quantity: number; instanceId?: string; identified?: boolean; level?: number; affix?: string; cursed?: boolean; sourceClass?: string }[];
		return items.filter(
			(i) =>
				i.quantity > 0 &&
				(isTransmutableForScroll(i) || (i.id === 'scrollTransmutation' && i.quantity > 1))
		);
	}

	/**
	 * `ScrollOfTransmutation.onItemSelected()`: reroll the picked entry, consuming the read
	 * scroll only on a real result (Java's `result == null` path collects `curItem` back).
	 * The picked snapshot is re-validated against the live bag first (Java's own FIXME
	 * safety check on `curItem`); a stale pick consumes nothing. A self-pick (the read
	 * scroll's own stack, eligible only at quantity 2+) consumes two units total - one for
	 * the read, one as the transmuted target - matching Java's detach-then-detach order.
	 */
	private completeTransmutation(pick: { id: string; instanceId?: string }): void {
		const live = (this.bag.items as { id: string; quantity: number; instanceId?: string; identified?: boolean; level?: number; affix?: string; cursed?: boolean; sourceClass?: string }[]).find(
			(i) =>
				i.quantity > 0 &&
				i.id === pick.id &&
				(i.instanceId ?? undefined) === (pick.instanceId ?? undefined) &&
				(isTransmutableForScroll(i) || (i.id === 'scrollTransmutation' && i.quantity > 1))
		);
		if (!live) {
			this.say(t('items.scrolls.scrolloftransmutation.nothing'), 'negative');
			return;
		}
		const result = transmuteItem(live, (kind) => this.newItemInstanceId(kind));
		if (!result) {
			this.say(t('items.scrolls.scrolloftransmutation.nothing'), 'negative');
			return;
		}
		this.bag.remove('scrollTransmutation', 1, this.requestedItemInstanceId);
		this.bag.remove(live.id, 1, live.instanceId);
		this.bag.add(result);
		this.say(t('items.scrolls.scrolloftransmutation.morph'), 'positive');
	}

	/**
	 * `Weapon.upgrade(false)`/`Armor.upgrade(false)` (the scroll path - `upgradeItem()` calls
	 * the no-enchant form, so no new enchant/glyph is ever granted here): affix/curse
	 * transitions roll BEFORE the level changes, then the tier/level advance below stands in
	 * for `super.upgrade()`'s +1. Real rules, in order: a curse affix/glyph is removed on a
	 * static 1-in-3 (with the real `remove_curse` line - the port treats an equipped curse as
	 * known immediately, so the `cursedKnown` gate Java logs behind is already satisfied);
	 * otherwise a good affix/glyph is lost at 10/20/40/80/100% when upgrading from
	 * +4/5/6/7/8 (`Random.Float(10) < 2^(level-4)`, real `incompatible` warning). Not
	 * modeled: `enchantHardened`/`glyphHardened` loss (hardening is granted by
	 * StoneOfEnchantment, unported, so nothing can hold it); the seal upgrade
	 * (`Armor.upgrade` feeds a level-0 BrokenSeal - no seal exists here); RunicTransference
	 * shifting the armor loss floor for non-warriors (the talent itself has no mechanics
	 * yet, so the floor stays 4); `Degrade.detach` (no Degrade buff exists - Warlock decay
	 * is applied directly, see below). The tier jumps themselves remain this port's own
	 * progression simplification (Java has fixed per-class tiers and plain +1 levels -
	 * replacing that state machine is tracked in PORT_COVERAGE.md, not attempted here).
	 */
	private upgradeGear(): boolean {
		const scroll = this.bag.find('scrollUpgrade');
		if (!scroll) {
			this.say(t('port.log.noupgrade'), 'negative');
			return false;
		}
		if (this.weaponTier < 5) {
			//Upgrade weapon tier (1→2→3→4→5)
			this.bag.remove('scrollUpgrade', 1);
			this.rollUpgradeAffixLoss('weapon');
			const item = this.bag.find('clothArmor');
			if (item) Actors.enchant(item, 1);
			this.weaponTier++;
			this.weaponLevel = 0;
			const sharedArmor = sharedUpgradeArmor(this.subclass(), this.talentRank('shared_upgrades'), this.armorLevel);
			const twinArmor = twinUpgradeArmor(this.subclass(), this.talentRank('twin_upgrades'), this.armorLevel);
			if (this.armorTier < 5) {
				this.armorTier += Math.max(sharedArmor, twinArmor);
			} else {
				this.armorLevel += Math.max(sharedArmor, twinArmor);
			}
			if (this.heroClass === 'mage' && this.talentRank('energizing_upgrade') > 0) this.wandCharges.refund(this.talentRank('energizing_upgrade') === 1 ? 4 : 6);
			if (this.heroClass === 'rogue' && this.talentRank('mystical_upgrade') > 0) this.hero.buffs['cloak'] = 9999;
			this.syncHeroFromStats();
			this.say(
				t('port.log.weaponupgraded', { tier: this.weaponTier, min: this.hero.damage[0], max: this.hero.damage[1] }),
				'positive'
			);
		} else if (this.armorTier < 5) {
			//Upgrade armor tier (after weapon is maxed)
			this.bag.remove('scrollUpgrade', 1);
			this.rollUpgradeAffixLoss('armor');
			this.armorTier++;
			this.armorLevel = 0;
			this.syncHeroFromStats();
			this.say(t('port.log.armorupgraded', { tier: this.armorTier }), 'positive');
		} else if (CLASS_AMMO.has(this.heroClass)) {
			//Missiles upgrade like any upgradable (`MissileWeapon.upgrade()` also resets
			//durability and restocks quantity - the restock has no meaning for a bare count,
			//but the durability reset does). No level cap in Java either. Ordered last: with
			//no item picker the scroll auto-targets weapon, then armor, then missiles.
			//The break-upgraded confirmation dialog needs a modal UI this port has nowhere
			//(same gap as Chasm-jump confirms), so a last upgraded missile still throws
			//without asking - stated, not silent.
			this.bag.remove('scrollUpgrade', 1);
			this.missileLevel++;
			this.ammoDurability = 100;
			this.syncHeroFromStats();
			this.say(t('port.log.missileupgraded', { level: this.missileLevel }), 'positive');
		} else {
			this.say(t('port.log.cannotupgrade'), 'negative');
			return false;
		}
		return true;
	}

	/** Shared `Weapon.upgrade()`/`Armor.upgrade()` affix-loss roll, keyed on the CURRENT
	 * upgrade level (before the tier reset zeroes it). `getCurse` distinguishes curse from
	 * good affixes exactly the way `hasCurseEnchant()`/`hasCurseGlyph()` do. */
	private rollUpgradeAffixLoss(slot: 'weapon' | 'armor'): void {
		const affix = slot === 'weapon' ? this.weaponAffix : this.armorGlyph;
		const level = slot === 'weapon' ? this.weaponLevel : this.armorLevel;
		if (!affix) return;
		if (getCurse(affix)) {
			if (Random.int(0, 3) === 0) {
				if (slot === 'weapon') this.weaponAffix = null;
				else this.armorGlyph = null;
				this.say(t('items.scrolls.scrollofupgrade.remove_curse'), 'positive');
			}
		} else if (level >= 4 && Random.float(10) < Math.pow(2, level - 4)) {
			if (slot === 'weapon') {
				this.weaponAffix = null;
				this.say(t('items.weapon.weapon.incompatible'), 'warning');
			} else {
				this.armorGlyph = null;
				this.say(t('items.armor.armor.incompatible'), 'warning');
			}
		}
	}

	private nearestVisibleEnemy(range: number): Creature | null {
		return (
			this.creatures
				.filter((c) => !c.isHero && !c.isNPC && this.fov.isVisible(c.x, c.y))
				.filter((c) => Roguelike.canTarget(this.level, this.hero, c, { range }))
				.sort((a, b) => Roguelike.chebyshevDistance(this.hero, a) - Roguelike.chebyshevDistance(this.hero, b))[0] ?? null
		);
	}

	/**
	 * `Dewdrop.doPickUp`/`Waterskin.collectDew`: goes into the waterskin first, while it isn't
	 * already full; only once it is full does drinking a dewdrop heal HP directly instead
	 * (`Dewdrop.consumeDew`). Java's heal amount there is talent/shield-aware
	 * (`Talent.SHIELDING_DEW`, `VialOfBlood`); this port has neither, so the full-waterskin
	 * case is simplified to a flat "one drop's worth" heal - 5% of max HP, `consumeDew`'s own
	 * per-drop constant, with no shielding overflow.
	 */
	private collectDewdrop(): void {
		if (this.waterskin < WATERSKIN_MAX) {
			this.waterskin++;
			this.say(t('port.log.collectdew'), 'positive');
			return;
		}

		const before = this.hero.hp;
		this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + Math.round(this.hero.maxHp * 0.05));
		this.showHeal(this.hero, this.hero.hp - before);
		this.grantHeroShield(shieldingDewGain(this.subclass(), this.talentRank('shielding_dew')), this.hero.maxHp);
		this.say(t('port.log.dewheals', { heal: this.hero.hp - before }), 'positive');
	}

	/**
	 * `HighGrass.trample()`: stepping onto high grass tramples it down to plain `GRASS`
	 * (Java also has a Huntress-only `FURROWED_GRASS` mid-state and a `freezeTrample` guard
	 * against re-triggering on an item's own drop cell, neither reproduced here), then rolls
	 * Java's naturalism-level-0 seed chance (1/25) followed by an independent dew chance
	 * (1/6, modified by the port's Nature's Bounty talent). The seed category selection uses
	 * the real Generator defaults/substream and its concrete class is retained in the payload,
	 * and `plantSeed()` now consumes it the same way real `Seed.execute(AC_PLANT)` does -
	 * instant activation with no growth delay, matching `Plant.Seed`'s own `onThrow()`-on-plant
	 * shape (real Java has no "wait and it grows" timer for a planted seed at all). What
	 * remains unported is `WandOfRegrowth`'s `Lotus` ally, whose `seedPreservation()` chance
	 * lets a nearby plant drop its own seed back when consumed instead of vanishing outright -
	 * this port has no Wand of Regrowth or ally-summon system to hang that off yet.
	 */
	private trampleHighGrass(x: number, y: number): void {
		if (this.level.get(x, y) !== HIGH_GRASS) return;

		this.level.set(x, y, GRASS);
		//Camouflage.activate(): trampling high grass while wearing the glyph prolongs
		//Invisibility for round((3 + lvl/2) x arcana) - keep-max, matching Buff.prolong().
		//Java also plays its MELD sound when the cell is in FOV; there is no per-effect
		//audio seam here, so the log line below stands in for that feedback.
		if (this.armorGlyph === 'camouflage') {
			const duration = Math.round((3 + this.armorLevel / 2) * ringArcanaMultiplier(this.equippedRing));
			this.hero.buffs['invisibility'] = Math.max(this.hero.buffs['invisibility'] ?? 0, duration);
			this.say(t('port.log.camouflage'), 'positive');
		}
		if (this.heroClass === 'huntress' && this.talentRank('natures_aid') > 0) this.grantHeroShield(Random.int(0, 3), 2);
		this.restitchTilesAround(x, y);
		this.featuresMap?.setLayerData('features', this.featureFrames());

		const seedDropped = Random.chance(1 / 25);
		if (seedDropped) {
			const seed = randomUsingDefaults(Cat.SEED);
				this.spawnGroundItem('seed', x, y, sourceInventoryItem('seed', seed.cls, (kind) => this.newItemInstanceId(kind)));
		}
		//HighGrass.trample()'s real base dew chance: 1/6, independent of Nature's Bounty
		//entirely (it scales instead with Sandals of Nature's naturalismLevel, an artifact this
		//port doesn't model, so the naturalismLevel=0 case applies uniformly here).
		if (Random.chance(1 / 6)) this.spawnGroundItem('dewdrop', x, y);
		//HighGrass.trample()'s real Nature's Bounty: NOT a dew-chance boost (that guess was
		//simply wrong, found auditing it against the real source) - it drops a depth-paced
		//Berry food item, capped at 2+2*rank total for the whole run (Talent.NatureBerriesDropped,
		//a CounterBuff that never resets mid-run). `targetFloor` is the depth the schedule wants
		//the next berry to land on; behind it the odds are generous (1/10), on it modest (1/30),
		//ahead of it stingy (1/90). This port has no distinct Berry item (a real Ration-strength
		//pickup, not modeled separately), so it drops the shared generic `'food'` kind instead -
		//a real, narrower simplification, not the wrong-mechanic bug this replaces.
		const bountyRank = this.talentRank('natures_bounty');
		if (this.heroClass === 'huntress' && bountyRank > 0) {
			const berriesAvailable = 2 + 2 * bountyRank - this.natureBerriesDropped;
			if (berriesAvailable > 0) {
				let targetFloor = 2 + 2 * bountyRank - berriesAvailable;
				targetFloor += targetFloor >= 5 ? 3 : 2;
				const chance = this.depth > targetFloor ? 1 / 10 : this.depth === targetFloor ? 1 / 30 : 1 / 90;
				if (Random.chance(chance)) {
					this.natureBerriesDropped++;
					this.spawnGroundItem('food', x, y);
				}
			}
		}
	}

	/**
	 * `Blooming.plantGrass()`: converts one plantable cell to `HIGH_GRASS` (see the Blooming
	 * branch in `heroOnHit` for the terrain substitution) unless a grown plant already holds
	 * it, then restitches exactly like `trampleHighGrass` does. Returns whether anything
	 * was planted, so the caller can spend its plant budget.
	 */
	private plantBloomingGrass(x: number, y: number): boolean {
		if (x < 0 || y < 0 || x >= this.level.width || y >= this.level.height) return false;
		const kind = this.level.get(x, y);
		if (kind !== FLOOR && kind !== GRASS) return false;
		const cell = this.level.index(x, y);
		if ((this.portedPaint?.plants.some((plant) => plant.pos === cell) ?? false) || this.manualPlants.has(cell)) return false;
		this.level.set(x, y, HIGH_GRASS);
		this.restitchTilesAround(x, y);
		this.featuresMap?.setLayerData('features', this.featureFrames());
		return true;
	}

	/**
	 * `WandOfRegrowth.onZap()` (checked against the local SPD checkout's
	 * `WandOfRegrowth.java`). The charge cost, grass budget, root duration, and seed chances
	 * follow Java. The real effect uses `ConeAOE` from the aimed Ballistica path; this port has
	 * no cell picker and its ranged action already selects a creature, so the same target is
	 * used as the centre of a Chebyshev circle. That preserves the affected-area shape and
	 * distance scaling while explicitly omitting the exact cone orientation.
	 */
	private useRegrowthWand(target: Creature, charges: number): void {
		const level = Math.max(0, this.degradedLevel(this.weaponLevel));
		const furrowedChance = this.regrowthTotalChargesUsed >= this.regrowthChargeLimit()
			? (this.regrowthChargesOverLimit + 1) / 5
			: 0;
		const radius = 2 + 2 * charges;
		const cells: { x: number; y: number; distance: number }[] = [];
		for (let y = Math.max(0, target.y - radius); y <= Math.min(this.level.height - 1, target.y + radius); y++) {
			for (let x = Math.max(0, target.x - radius); x <= Math.min(this.level.width - 1, target.x + radius); x++) {
				const distance = Math.max(Math.abs(x - target.x), Math.abs(y - target.y));
				if (distance <= radius) cells.push({ x, y, distance });
			}
		}
		cells.sort((a, b) => a.distance - b.distance);
		const eligible = cells.filter(({ x, y }) => {
			const cell = this.level.index(x, y);
			return (this.level.get(x, y) === FLOOR || this.level.get(x, y) === GRASS || this.level.get(x, y) === HIGH_GRASS)
				&& !this.isChasmCell(x, y)
				&& !this.portedFeatures.kindAt(cell)
				&& !this.manualPlants.has(cell);
		});
		for (const { x, y } of eligible) {
			const creature = this.creatureAt(x, y);
			if (this.level.get(x, y) !== HIGH_GRASS) {
				this.level.set(x, y, GRASS);
				this.restitchTilesAround(x, y);
			}
			if (creature) creature.buffs['roots'] = Math.max(creature.buffs['roots'] ?? 0, 4 * charges);
		}

		const grassToPlace = Math.round((3.67 + level / 3) * charges);
		const line = eligible
			.filter(({ x, y }) => Math.abs((x - this.hero.x) * (target.y - this.hero.y) - (y - this.hero.y) * (target.x - this.hero.x)) <= Math.max(1, radius))
			.slice(0, grassToPlace);
		for (const { x, y } of line) {
			if (Random.float() > furrowedChance) this.level.set(x, y, HIGH_GRASS);
		}
		const remaining = eligible.filter(({ x, y }) => !line.some((cell) => cell.x === x && cell.y === y));
		for (const { x, y } of remaining.slice(0, Math.max(0, grassToPlace - line.length))) {
			if (this.level.get(x, y) !== HIGH_GRASS && Random.float() > furrowedChance) this.level.set(x, y, HIGH_GRASS);
		}

		const plant = (cell: { x: number; y: number }, kind: string): void => {
			const index = this.level.index(cell.x, cell.y);
			if (this.portedFeatures.kindAt(index) || this.manualPlants.has(index)) return;
			this.manualPlants.set(index, kind);
			this.placePortedFeature(index, kind);
		};
		if (remaining.length > 0 && Random.float() > furrowedChance && Random.int(0, 6) < charges) {
			const cell = remaining[0]!;
			plant(cell, Random.int(0, 2) === 0 ? 'seedpod' : 'dewcatcher');
		}
		if (remaining.length > 1 && Random.float() > furrowedChance && Random.int(0, 3) < charges) {
			const cell = remaining[1]!;
			const seed = randomUsingDefaults(Cat.SEED);
			plant(cell, this.seedPlantKind(seed.cls) ?? 'sungrass');
		}
		this.restitchTilesAround(target.x, target.y);
		this.featuresMap?.setLayerData('features', this.featureFrames());

		const limit = this.regrowthChargeLimit();
		if (this.regrowthTotalChargesUsed < limit) {
			this.regrowthChargesOverLimit = 0;
			this.regrowthTotalChargesUsed += charges;
			if (this.regrowthTotalChargesUsed > limit) {
				this.regrowthChargesOverLimit = this.regrowthTotalChargesUsed - limit;
				this.regrowthTotalChargesUsed = limit;
			}
		} else this.regrowthChargesOverLimit += charges;
		this.say(t('port.log.wandregrowth'), 'positive');
	}

	/** `WandOfRegrowth.chargeLimit()`: Java's level/hero-level degradation threshold. */
	private regrowthChargeLimit(): number {
		if (this.weaponLevel >= 10) return Number.MAX_SAFE_INTEGER;
		const level = this.weaponLevel;
		return Math.round(20 + this.progression.level * (2 + level) * (1 + level / (50 - 5 * level)));
	}

	/**
	 * A real door (`DungeonTileSheet.FLAT_DOOR`) at every point a room's own generator carved
	 * a corridor straight through its wall ring - `mwg/roguelike`'s generic room-and-corridor
	 * generator already punches exactly one passable cell through the wall at each such
	 * junction, which is precisely where SPD's own generator places a door; this only has to
	 * find those cells and mark them, not carve anything itself.
	 *
	 * The cell marked is the *wall-ring* cell the corridor breached (`nx, ny` below) - one
	 * step outside the room's own floor - not the room's own perimeter floor cell next to it.
	 * A door sitting on the room side of that gap would float in open floor with the actual
	 * wall breach one tile further out still passable and undecorated; sitting in the breach
	 * itself, the door *is* the wall at that point, same as SPD's own doors are.
	 *
	 * Doors start shut (impassable, opaque - bump to open for a turn, like Java) through
	 * `mwg/roguelike`'s Doors, not as bare tiles. From the Prison on, one random door per
	 * floor is locked for an `ironKey` (a stated stand-in: Java's keys come from its own
	 * locked-room/key-drop placement, which needs room types this generator has none of -
	 * here a guard drops the key instead).
	 */
	private placeDoors(): void {
		const rooms = this.level.rooms;
		const inAnyRoom = (x: number, y: number): boolean =>
			rooms.some((r) => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom);

		const candidates: Step[] = [];
		const candidateKeys = new Set<string>();
		for (const room of rooms) {
			for (let x = room.left; x <= room.right; x++) {
				for (let y = room.top; y <= room.bottom; y++) {
					const onEdge = x === room.left || x === room.right || y === room.top || y === room.bottom;
					if (!onEdge || !this.level.passable(x, y)) continue;

					for (const [dx, dy] of Roguelike.neighbourOffsets(4)) {
						const nx = x + dx;
						const ny = y + dy;
						if (this.level.passable(nx, ny) && !inAnyRoom(nx, ny)) {
							const key = `${nx},${ny}`;
							if (!candidateKeys.has(key)) {
								candidateKeys.add(key);
								candidates.push({ x: nx, y: ny });
							}
						}
					}
				}
			}
		}

		//The generic corridor can expose several consecutive cells at one room edge. SPD
		//stores one Door per room connection, never a two-door-wide opening; collapse those
		//runs before creating the actual door entities.
		const found: Step[] = [];
		for (const candidate of candidates) {
			if (!found.some((door) => Math.abs(door.x - candidate.x) + Math.abs(door.y - candidate.y) <= 1)) {
				found.push(candidate);
				this.doors.place(candidate.x, candidate.y, { open: DOOR, closed: DOOR_CLOSED, startOpen: false });
			}
		}

		if (this.depth >= 6 && found.length > 0) {
			const at = Random.element(found)!;
			this.doors.place(at.x, at.y, { open: DOOR, closed: DOOR_CLOSED, locked: 'ironKey', startOpen: false });
		}
	}

	/**
	 * Registers a ported floor's doors, secret doors and traps with `Doors`/`Secrets`.
	 *
	 * The generic `placeDoors`/`placeHiddenTraps` *find* somewhere plausible to put these; this
	 * only adopts what the verified generator already decided, so no `Random` call is made here
	 * and nothing about the floor's layout is re-rolled.
	 *
	 * Three deliberate gaps, all inherited from the terrain mapping (see gameBridge.ts):
	 * - A `LOCKED_DOOR` needs `ironKey`, the same stand-in key the generic path uses.  Java
	 *   places its keys via room/key-drop logic this port has none of, so the key still comes
	 *   from a guard drop rather than from where Java put it.
	 * - A `CRYSTAL_DOOR` is locked by `crystalKey`; queued room keys are placed after the
	 *   generated floor is adopted, so the crystal rooms are reachable in live play.
	 * - Trap *behaviour* is routed to the five effects this port implements; the real class name
	 *   is kept on the trap for display.  See gameBridge's TRAP_BEHAVIOUR.
	 */
	private adoptPortedFeatures(floor: PortedFloor): void {
		//The run-level flag becomes known when the Blacksmith room is generated. Never clear a
		//true value when a later floor is extracted before the quest is consumed.
		this.blacksmithAlternative ||= floor.blacksmithAlternative;
		this.portedWellWater.clear();
		for (const plant of floor.paint.plants) {
			if (plant.kind.startsWith('wellWater:')) {
				const kind = plant.kind.slice('wellWater:'.length) as 'awareness' | 'health' | 'waterOfAwareness' | 'waterOfHealth';
				this.portedWellWater.set(plant.pos, kind);
				this.placePortedFeature(plant.pos, `well:${kind}`);
			} else {
				this.placePortedFeature(plant.pos, plant.kind);
			}
		}
		//`CeremonialCandle.ritualPos` arrives as a raw cell index on the painted level's own
		//grid, which matches this floor's live grid exactly (same dimensions by construction).
		if (ritualSiteState.ritualPos >= 0 && ritualSiteState.ritualPos < this.level.cellCount) {
			this.ritualPos = ritualSiteState.ritualPos;
		}
		this.portedMobSpawns = floor.mobs.filter((mob) => {
			if (mob.kind === 'sacrificialFire') {
				this.sacrificialFireCell = this.level.index(mob.x, mob.y);
				this.sacrificialFireCharge = 6 + this.depth * 4;
				this.sacrificialFire.seed(mob.x, mob.y, this.sacrificialFireCharge);
				const [family, sourceClass] = (mob.loot ?? 'weapon').split('|', 2);
				this.sacrificialFirePrize = sourceInventoryItem(family, sourceClass, (kind) => this.newItemInstanceId(kind));
				return false;
			}
		//LaboratoryRoom's pot marker is `Blob.seed(pot, 1, Alchemy.class)` - a blob, not a
		//mob (this port has no Alchemy blob to seed, and the pot cell itself arrives as
		//inert ALCHEMY->wall scenery). MagicalFireRoom's wall markers are
		//`Blob.seed(cell, 1, EternalFire.class)` the same way - seeded into the static
		//`eternalFire` blob below (amount 1, never spread or decayed, matching Java's own
		//seed amount and non-diffusing `evolve()`). Neither may reach `spawnMonster`
		//(which would crash on the unknown kind - see `spawnPortedMobs`' guard below).
		if (mob.kind === 'alchemyBlob') return false;
		if (mob.kind === 'eternalFire') {
			this.eternalFire.seed(mob.x, mob.y, 1);
			return false;
		}
			if (!mob.kind.startsWith('wellWater:')) return true;
			const kind = mob.kind.slice('wellWater:'.length) as 'awareness' | 'health' | 'waterOfAwareness' | 'waterOfHealth';
			this.portedWellWater.set(this.level.index(mob.x, mob.y), kind);
			this.placePortedFeature(this.level.index(mob.x, mob.y), `well:${kind}`);
			return false;
		});
		// Statue terrain is solid in Java while the statue itself is a live Mob occupying that
		// cell. Expose its occupied cell as floor to the gameplay collision grid; the actor sprite
		// remains the visible statue and preserves the locked-room encounter.
		for (const mob of this.portedMobSpawns) {
			if (mob.kind === 'statue' || mob.kind === 'armoredStatue') this.level.set(mob.x, mob.y, FLOOR);
		}
		this.portedMobCells = new Set(this.portedMobSpawns.map((mob) => this.level.index(mob.x, mob.y)));
		this.portedBranchExitCells = new Set(floor.branchExits.map((exit) => this.level.index(exit.x, exit.y)));
		for (const door of floor.doors) {
			this.doors.place(door.x, door.y, {
				open: DOOR,
				closed: DOOR_CLOSED,
				locked: door.locked ? (door.crystal ? 'crystalKey' : 'ironKey') : undefined,
				startOpen: false,
			});
			if (door.crystal) this.crystalDoorCells.add(this.level.index(door.x, door.y));
		}
		//a secret door reads as solid wall until searched out, exactly like the generic path's
		//concealed traps - Secrets writes the disguise into the level itself.  It still has to
		//exist in Doors before being concealed: discovery only restores DOOR_CLOSED in the
		//terrain, and bumpDoor consults the Doors registry before opening it.
		for (const at of floor.secretDoors) {
			this.doors.place(at.x, at.y, { open: DOOR, closed: DOOR_CLOSED, startOpen: false });
			this.secrets.conceal(at.x, at.y, WALL, DOOR_CLOSED);
			this.secretDoorCells.add(this.level.index(at.x, at.y));
		}

		for (const trap of floor.traps) {
			this.trapKinds.set(this.level.index(trap.x, trap.y), trap.behaviour as TrapKind);
			if (trap.hidden) this.secrets.conceal(trap.x, trap.y, FLOOR, TRAP);
		}
		for (const item of floor.groundItems) {
			const kind = portItemKind(item.kind);
			const remainsGold = item.note?.match(/^remains:gold:(\d+)$/);
			const fixedGold = item.note?.match(/(?:^|,)qty:(\d+)/);
			const chest = item.note?.includes('crystalChest') ? 'crystal' : item.note?.includes('chest') ? 'normal' : undefined;
			const payload = remainsGold || fixedGold
				? { id: 'gold', quantity: Number((remainsGold ?? fixedGold)![1]), stackable: true, identified: true }
				: sourceInventoryItem(item.kind, item.sourceClass, (kind) => this.newItemInstanceId(kind));
			if (kind && !this.groundItemAt(item.x, item.y)) this.spawnGroundItem(kind, item.x, item.y, payload, chest, item.note?.includes('forSale'));
		}
		// Java's RegularLevel places Level.itemsToSpawn after ordinary room drops using a valid
		// StandardRoom cell. The generator bridge preserves the queue; consume it here so crystal
		// keys and room keys are playable instead of silently disappearing.
		for (const queued of floor.queuedItems) this.placeQueuedPortedItem(queued, floor.rooms);
		this.placePendingBones(floor.rooms);
	}

	private placeQueuedPortedItem(sourceId: string, rooms: { left: number; top: number; right: number; bottom: number }[], payload?: GroundItem['item']): boolean {
		const kind = portItemKind(sourceId);
		if (!kind) return false;
		const candidates: Step[] = [];
		for (const room of rooms) {
			if (room.left <= 1 || room.top <= 1) continue;
			for (let y = room.top + 1; y < room.bottom; y++) for (let x = room.left + 1; x < room.right; x++) {
				if (!this.level.passable(x, y) || this.creatureAt(x, y) || this.groundItemAt(x, y)) continue;
				if (this.hero.x === x && this.hero.y === y) continue;
				if (this.hasStairs && this.stairs.x === x && this.stairs.y === y) continue;
				candidates.push({ x, y });
			}
		}
		if (candidates.length === 0) return false;
		const at = Random.element(candidates)!;
		this.spawnGroundItem(kind, at.x, at.y, payload ?? sourceInventoryItem(sourceId, undefined, (kind) => this.newItemInstanceId(kind)));
		return true;
	}

	private placePendingBones(rooms: { left: number; top: number; right: number; bottom: number }[]): void {
		const saved = this.bones.load('pending')?.state;
		if (!saved) return;
		const matches = saved.branch === 1
			? this.miningBranchActive && Math.floor(saved.depth / 5) === Math.floor(this.depth / 5)
			: !this.miningBranchActive && saved.depth === this.depth;
		if (!matches) return;
		if (this.miningBranchActive && this.miningBranchEntrance) {
			// MiningLevel.createItems() uses the fixed cell directly above its entrance for Bones.get().
			const at = { x: this.miningBranchEntrance.x, y: this.miningBranchEntrance.y - 1 };
			const item = this.bonesItemForPickup(saved);
			const kind = portItemKind(item.id);
			if (kind) this.spawnGroundItem(kind, at.x, at.y, item);
			this.bones.delete('pending');
			return;
		}
		const item = this.bonesItemForPickup(saved);
		if (this.placeQueuedPortedItem(item.id, rooms, item)) {
			this.bones.delete('pending');
		}
	}

	/** `Bones.get()` post-processing: seeded runs collapse remains to Gold(10); normal Java
	 * upgradable loot is cursed-known and capped at +3 while preserving ordinary identification.
	 * Missile weapons keep their level/identity state. */
	private bonesItemForPickup(saved: BonesShape): NonNullable<GroundItem['item']> {
		if (this.seededRun) return { id: 'gold', quantity: 10, identified: true };
		const item = { ...(saved.item ?? { id: saved.kind, quantity: 1, identified: true }) };
		const lower = `${item.id}|${item.sourceClass ?? ''}`.toLowerCase();
		if (lower.includes('artifact') || item.id === 'cloak') {
			const artifactClass = item.sourceClass;
			if (!artifactClass || !removeArtifactClass(artifactClass)) {
				// Artifact.value() is 100 by default, halves for a known curse, and has
				// class-specific overrides (CloakOfShadows is worth 0; DriedRose is
				// 100 here because this compact port has no attached ghost/gear state).
				const value = artifactClass?.toLowerCase().includes('cloakofshadows')
					? 0
					: item.cursed && item.cursedKnown ? 50 : 100;
				return { id: 'gold', quantity: value, identified: true };
			}
			item.cursed = true;
			item.cursedKnown = true;
			// Bones creates a fresh instance of the same artifact class; Java's constructor
			// does not reveal its appearance merely because the old instance was known.
			item.identified = false;
			return item;
		}
		const missile = lower.includes('missile') || lower.includes('dart') || lower.includes('boomerang');
		const upgradable = item.id === 'weaponReward' || item.id === 'armorReward'
			|| item.id.startsWith('ring_') || item.id === 'wand' || item.id === 'cloak';
		if (upgradable && !missile) {
			item.cursed = true;
			item.cursedKnown = true;
			if (item.level !== undefined && item.level > 3) Actors.enchant(item, 3 - item.level);
		} else if (missile) {
			// Java keeps missile remains uncursed and marks only their level known; the
			// item's ordinary identification state remains whatever the carried item had.
		}
		this.resetBonesItemState(item, lower, missile);
		return item;
	}

	/** Java Item.reset() state that matters when a carried item crosses a run boundary. */
	private resetBonesItemState(item: NonNullable<GroundItem['item']>, lower: string, missile: boolean): void {
		// Weapon/Armor/Wand identification progress is runtime state, not a property of the
		// generated class. Bones.reset() starts each family at its normal half/full budget.
		if (lower.includes('armor')) {
			item.usesLeftToIdentify = 10;
			item.availableUsesToIdentify = 5;
			// Armor.reset() deliberately drops a carried BrokenSeal; this payload uses the
			// boolean equivalent until the full seal item is implemented.
			item.seal = false;
		} else if (lower.includes('weapon')) {
			item.usesLeftToIdentify = 20;
			item.availableUsesToIdentify = 10;
		} else if (lower.includes('wand')) {
			item.usesLeftToIdentify = 10;
			item.availableUsesToIdentify = 5;
		}
		if (missile) {
			// MissileWeapon.reset() restores a fresh stack's durability.
			item.maxDurability = 100;
			item.durability = 100;
		}
	}

	/**
	 * Room painters already placed these actors using Java's room-local RNG. Keep those
	 * positions instead of replacing them with the old scene-level random quest spawns.
	 * Generic population runs first, so an ordinary monster cannot overwrite a Java room
	 * placement; the target cells are reserved while `populate()` chooses its candidates.
	 */
	private spawnPortedMobs(): void {
		for (const mob of this.portedMobSpawns) {
			if (!this.level.passable(mob.x, mob.y) || this.creatureAt(mob.x, mob.y)) continue;
			//Painter markers (`alchemyBlob`, `eternalFire`) are filtered upstream, but any
			//future unknown kind must refuse cleanly here instead of crashing inside
			//`spawnMonster` reading `.frame` off an undefined catalogue entry - that exact
			//TypeError was this project's open section-10 item, root-caused to these markers
			//rather than the suspected asset-load race.
			if (!MONSTERS[mob.kind as AnyMonsterId]) {
				this.say(t('port.log.unknownmob', { kind: mob.kind }), 'negative');
				continue;
			}
			this.spawnMonster(mob.kind as AnyMonsterId, { x: mob.x, y: mob.y }, false, mob.loot);
		}
		this.portedMobSpawns = [];
		this.portedMobCells.clear();
	}

	/** bumping a shut door: locked needs the key, otherwise it swings open (costing the turn) */
	private bumpDoor(x: number, y: number): boolean {
		if (!this.doors.isDoor(x, y) || this.doors.isOpen(x, y)) return false;
		if (this.doors.isLocked(x, y)) {
			const keyId = this.crystalDoorCells.has(this.level.index(x, y)) ? 'crystalKey' : 'ironKey';
			const key = this.bag.find(keyId);
			if (!key) {
				this.say(t('port.log.locked'), 'negative');
				return true;
			}
			this.bag.remove(keyId, 1);
			this.doors.unlock(x, y);
			this.say(t('port.log.unlock'), 'positive');
		}
		this.doors.open(x, y);
		runState.audio.cue('door_open', 0.55);
		//shut and open doors are different frames now, and the wall above a doorway carries a
		//matching lip, so the ring has to be restitched rather than left on its shut art
		this.restitchTilesAround(x, y);
		this.say(t('port.log.opendoor'));
		return true;
	}

	/**
	 * Hidden traps (Toxic/Burning/PoisonDart/Grim/Explosive), concealed with mwg's Secrets
	 * the same way the old single trap was - two per regular floor, each a random kind.
	 * Numbers are Java's own (Toxic seeds gas - here a 3-turn poison, since gas cells don't
	 * exist; Burning 2-5 + burning; PoisonDart 4-8 + poison scaled by depth; Grim half of
	 * current HP capped at 90% of max; Explosive 5+depth to 10+2*depth). Explosive blasts now
	 * damage all nearby characters with Java's 0.67 off-center multiplier; fire and toxic traps
	 * seed the live area blobs, though exact gas/fire volume cadence remains simplified.
	 */
	private placeHiddenTraps(): void {
		if (this.depth in BOSSES) return;
		for (let t = 0; t < 2; t++) {
			for (let attempt = 0; attempt < 20; attempt++) {
				const room = this.level.rooms[Random.int(1, this.level.rooms.length)];
				const at = { x: Random.range(room.left, room.right), y: Random.range(room.top, room.bottom) };
				if (at.x === this.hero.x && at.y === this.hero.y) continue;
				if (this.creatureAt(at.x, at.y)) continue;
				if (this.level.get(at.x, at.y) !== FLOOR) continue;

				this.secrets.conceal(at.x, at.y, FLOOR, TRAP);
				this.trapKinds.set(this.level.index(at.x, at.y), Random.element(TRAP_KINDS)!);
				break;
			}
		}
	}

	/**
	 * Ground fire as an `mwg/roguelike` Blob: explosive and burning traps seed it (and the
	 * fireblast wand below), it diffuses one step per hero turn, and standing in volume ≥1
	 * ignites. Monster-side ignition is not modelled (monster turns never read the blob) -
	 * stated, not silent.
	 */
	private spreadFire(): void {
		this.fire.spread((x, y) => this.level.passable(x, y));
		if (this.fire.volumeAt(this.hero.x, this.hero.y) >= 1 && !this.hero.buffs['burning']) {
			addBuff(this.hero, 'burning');
			this.say(t('port.log.firecatches'), 'negative');
		}
		for (const creature of this.creatures) {
			if (creature.isHero || creature.isNPC || creature.hp <= 0) continue;
			//`Property.FIERY` (every `Elemental`, newborn included): immune to Burning - real
			//Java refuses the buff in `add()` rather than skipping the grant, same outcome.
			if (creature.kind === 'elemental' || creature.kind === 'newbornElemental') continue;
			if (this.fire.volumeAt(creature.x, creature.y) >= 1 && !creature.buffs['burning']) addBuff(creature, 'burning');
		}
		//EternalFire.evolve()'s ignition half: any char on a burning wall cell catches fire
		//(`Burning.reignite(ch, 4)` - re-applied while standing in it, the same buff the
		//regular-fire branch above grants, since this port's `burning` has no separate
		//reignite-duration dimension). The wall itself is never spread or decayed here -
		//Java's `evolve()` is non-diffusing by construction, and the audit's suggested
		//`spread(passable, 0, 1)` is exactly "never call spread at all". Not reproduced:
		//spreading regular Fire onto flammable terrain (no flammable map) and burning heaps
		//(no heap-burn primitive) - the same stated gap as StoneOfBlast's unported half.
		if (this.eternalFire.total() > 0) {
			if (this.eternalFire.volumeAt(this.hero.x, this.hero.y) >= 1 && !this.hero.buffs['burning']) {
				addBuff(this.hero, 'burning');
				this.say(t('port.log.firecatches'), 'negative');
			}
			for (const creature of this.creatures) {
				if (creature.isHero || creature.isNPC || creature.hp <= 0) continue;
				if (creature.kind === 'elemental' || creature.kind === 'newbornElemental') continue;
				if (this.eternalFire.volumeAt(creature.x, creature.y) >= 1 && !creature.buffs['burning']) addBuff(creature, 'burning');
			}
		}
		//Shopkeeper.processHarm()/flee(): every other NPC is flatly immune to environmental
		//damage in this port (the `isNPC` skip just above), but real Java's Shopkeeper is a
		//real exception - catching them in fire (or any harmful buff) warns once, then makes
		//them flee for good on the next hit, closing the shop. Only the fire path is wired here
		//(the far more common real-play way to accidentally harm them); Java's other harmful-buff
		//triggers and its per-heap shop-stock item removal on flee (this port's shop is a shared
		//bag, not floor heaps) are not reproduced - a narrower, honestly-flagged gap.
		const shopkeeper = this.creatures.find((c) => c.kind === 'shopkeeper');
		if (shopkeeper && this.fire.volumeAt(shopkeeper.x, shopkeeper.y) >= 1) {
			if (!this.shopkeeperWarned) {
				this.shopkeeperWarned = true;
				this.say(t('port.log.shopkeeperwarn'), 'warning');
			} else {
				this.scheduler.remove(shopkeeper);
				this.creatures.splice(this.creatures.indexOf(shopkeeper), 1);
				this.sprite(shopkeeper).destroy();
				this.spriteFor.delete(shopkeeper.id);
				this.say(t('port.log.shopkeeperflee'), 'negative');
			}
		}
		this.spreadSacrificialFire();
		this.spreadPlantBlobs();
	}

	/** MagicalFireRoom.EternalFire.onUpdateCellFlags(): burning wall cells read impassable
	 * while the wall stands. Boss-turn pathing (Tengu/DM-300/King) skips this - their fixed
	 * arenas never contain a MagicalFireRoom, so only the shared hero/monster/travel paths
	 * below need it. */
	private eternalFireBlockedInto(into: Set<number>): void {
		if (this.eternalFire.total() <= 0) return;
		for (const cell of this.eternalFire.cellsAbove(1)) into.add(this.level.index(cell.x, cell.y));
	}

	/** SacrificialFire spreads like a floor blob. Java marks actors for two turns; this
	 * compact scene checks the active volume at death, which preserves the meaningful
	 * room rule without adding another persistent combat buff solely for this feature. */
	private spreadSacrificialFire(): void {
		if (!this.sacrificialFirePrize || this.sacrificialFireCharge <= 0) return;
		this.sacrificialFire.spread((x, y) => this.level.passable(x, y), 0.25, 0.9);
	}

	private sacrificeCost(creature: Creature): number {
		const kind = creature.kind;
		let exp = kind ? MONSTERS[kind].exp : 1;
		if (kind === 'statue' || kind === 'mimic') exp = 1 + this.depth;
		else if (kind === 'piranha') exp = 1 + Math.floor(this.depth / 2);
		else if (kind === 'swarm' && (creature.generation ?? 0) > 0) exp = 1;
		return exp * Random.range(2, 3);
	}

	private processSacrifice(creature: Creature): void {
		if (!this.sacrificialFirePrize || this.sacrificialFireCharge <= 0) return;
		if (this.sacrificialFire.volumeAt(creature.x, creature.y) <= 0) return;
		this.sacrificialFireCharge -= this.sacrificeCost(creature);
		if (this.sacrificialFireCharge > 0) return;
		const cell = this.sacrificialFireCell >= 0
			? { x: this.sacrificialFireCell % this.level.width, y: Math.floor(this.sacrificialFireCell / this.level.width) }
			: { x: creature.x, y: creature.y };
		const kind = groundKindForItem(this.sacrificialFirePrize, 'armor');
		this.spawnGroundItem(kind, cell.x, cell.y, this.sacrificialFirePrize);
		this.say(t('port.log.sacrificialfirereward'), 'positive');
		this.sacrificialFirePrize = undefined;
		this.sacrificialFireCharge = 0;
		this.sacrificialFire = new Roguelike.Blob(this.level.width, this.level.height);
	}

	/** Applies the Java plant blobs to every actor standing in an active cell. */
	private spreadPlantBlobs(): void {
		this.plantGas.spread((x, y) => this.level.passable(x, y), 0.25, 0.9);
		this.plantFreeze.spread((x, y) => this.level.passable(x, y), 0.25, 0.9);
		this.toxicGas.spread((x, y) => this.level.passable(x, y), 0.25, 0.9);
		this.paralyticGas.spread((x, y) => this.level.passable(x, y), 0.25, 0.9);
		for (const cell of this.plantGas.cellsAbove(1)) {
			const target = this.creatureAt(cell.x, cell.y);
			if (target) addBuff(target, 'poison');
		}
		for (const cell of this.plantFreeze.cellsAbove(0.5)) {
			const target = this.creatureAt(cell.x, cell.y);
			if (target) addBuff(target, 'paralysis');
		}
		//ToxicGas.evolve(): `1 + Dungeon.scalingDepth()/5` direct damage/turn, no buff at all -
		//distinct from the plantGas/Rotberry stand-in above, which reuses the `poison` buff.
		for (const cell of this.toxicGas.cellsAbove(0.0001)) {
			const target = this.creatureAt(cell.x, cell.y);
			if (!target || target.hp <= 0) continue;
			//RotHeart/RotLasher immunities add ToxicGas (both kinds).
			if (target.kind === 'rotHeart' || target.kind === 'rotLasher') continue;
			if (target.kind === 'yog' && this.yogShielded(target)) continue;
			if (target.kind === 'yogFist' && this.guardFist(target)) continue;
			//RingOfElements.resist(): ToxicGas is in `RESISTS` - scale the hero's share.
			//Monsters never benefit (only the hero equips rings in this port).
			const dmg = target.isHero
				? Math.floor((1 + Math.floor(this.depth / 5)) * ringElementsMultiplier(this.equippedRing))
				: 1 + Math.floor(this.depth / 5);
			if (target.isHero) {
				const blocked = this.absorbHeroDamage(dmg);
				this.hero.hp -= blocked;
				this.showDamage(this.hero, dmg);
				if (this.hero.hp <= 0) { this.kill(this.hero, 'poison'); return; }
			} else {
				const preHp = target.hp;
				target.hp -= dmg;
				if (target.kind === 'yog' && target.hp > 0) this.yogDamageHook(target, preHp);
				this.showDamage(target, dmg);
				if (target.hp <= 0) this.kill(target);
			}
		}
		//ParalyticGas.evolve(): `Buff.prolong(ch, Paralysis.class, Paralysis.DURATION)` each turn.
		for (const cell of this.paralyticGas.cellsAbove(0.0001)) {
			const target = this.creatureAt(cell.x, cell.y);
			if (target) addBuff(target, 'paralysis');
		}
	}

	/** `Hero.search()`: the pure "which cell, if any" decision now runs through
	 * `runSearch`/`SimulationRuntime` (see `SIMULATION_ARCHITECTURE.md`'s "Step 7"); this method
	 * keeps every scene-owned effect the decision used to inline - discovering the cell,
	 * restitching tiles, redrawing the feature map, logging, and guide-progress persistence -
	 * unchanged, the same "scene executes the selected effect" split `movement.ts`'s
	 * `planMovement` already established. */
	private searchForSecrets(): void {
		const radius = 1 + this.talentRank('wide_search');
		const outcome = runSearch(this.hero, radius, { isSecret: (cell) => this.secrets.isSecret(cell.x, cell.y) });
		if (outcome.kind === 'nothing') {
			this.say(t('port.log.foundnothing'), 'negative');
			return;
		}
		const { x, y } = outcome.cell;
		this.secrets.discover(x, y);
		//a secret door was stored as WALL to hide it, so it was drawn with the wall's own
		//face; now that it is a door it needs its door frames, and the rock it was
		//blending into needs restitching around the hole it just left
		this.restitchTilesAround(x, y);
		this.featuresMap?.setLayerData('features', this.featureFrames());
		//a ported floor conceals real SECRET_DOOR cells too, not only traps - and on depths
		//1-2 finding one is mandatory, not optional: Java's SPDSettings.intro() makes every
		//entrance-room door secret as its search tutorial, so the hero starts sealed in
		if (this.secretDoorCells.has(this.level.index(x, y))) {
			this.say(t('port.log.founddoor'), 'positive');
			//Real completion signal for SPDSettings.intro()/the depth-2 searching page - see
			//`guideProgress`'s own comment. Persisted once, permanently, the same as a badge.
			if (this.depth === 1 && !entranceRoomContext.guideIntroRead) {
				entranceRoomContext.guideIntroRead = true;
				this.guideProgress.save('guide', { introRead: true, searchingFound: entranceRoomContext.guideSearchingFound });
			} else if (this.depth === 2 && !entranceRoomContext.guideSearchingFound) {
				entranceRoomContext.guideSearchingFound = true;
				this.guideProgress.save('guide', { introRead: entranceRoomContext.guideIntroRead, searchingFound: true });
			}
		} else {
			this.say(t('port.log.foundtrap'), 'positive');
		}
	}

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
	private examineTile(x: number, y: number): void {
		const region = regionForDepth(this.depth);
		const raw = this.portedPaint?.map[this.portedPaint.w * y + x];
		let name: string;
		let desc = '';

		if (this.hasStairs && this.stairs && this.stairs.x === x && this.stairs.y === y) {
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
			name = t('levels.level.sign_name');
			desc = t('levels.level.sign_desc');
		} else if (raw === Terrain.WELL) {
			name = t('levels.level.well_name');
		} else if (raw === Terrain.EMPTY_WELL) {
			name = t('levels.level.empty_well_name');
			desc = t('levels.level.empty_well_desc');
		} else {
			switch (this.level.get(x, y)) {
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
					if (this.crystalDoorCells.has(this.level.index(x, y))) {
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

		this.say(desc ? `${name}. ${desc}` : name);
	}

	private triggerTrapAt(x: number, y: number): void {
		// Char.flying is Levitation in SPD. It prevents pressure/ground traps from
		// activating; none of the small set of traps modelled by this port are magical
		// airborne effects, so they are all safely bypassed here.
		if (this.hero.buffs['levitation']) return;
		if (!this.secrets.isSecret(x, y)) return;
		this.secrets.discover(x, y);
		const kind = this.trapKinds.get(this.level.index(x, y)) ?? 'poisonDart';
		this.featuresMap?.setLayerData('features', this.featureFrames());

		if (kind === 'toxic') {
			//ToxicTrap.activate(): seeds the real ToxicGas blob (`300 + 20*scalingDepth()`) and
			//nothing else - no instant poison. The gas itself deals direct per-turn damage next
			//turn via `spreadPlantBlobs`; the previous instant `poison` buff here was never real
			//Java behavior, and reusing `plantGas` conflated this with Rotberry's own gas blob.
			this.toxicGas.seed(x, y, 300 + 20 * this.depth);
			this.say(t('port.log.trap.toxic'), 'negative');
		} else if (kind === 'burning') {
			//RingOfElements.resist(): Burning is in `RESISTS` - the trap's fire damage is
			//scaled before Barrier absorption (matching `Hero.damage()`'s ordering where
			//the multiplier applies to the raw hit).
			let damage = Math.floor(Random.int(2, 5) * ringElementsMultiplier(this.equippedRing));
			damage = this.absorbHeroDamage(damage);
			this.hero.hp -= damage;
			this.showDamage(this.hero, damage);
			addBuff(this.hero, 'burning');
			this.fire.seed(x, y, 4);
			this.say(t('port.log.trap.burning', { damage }), 'negative');
		} else if (kind === 'poisonDart') {
			let damage = Math.max(0, Random.normalRange(4, 8));
			damage = this.absorbHeroDamage(damage);
			this.hero.hp -= damage;
			this.showDamage(this.hero, damage);
			this.say(t('port.log.trap.poisondart', { damage }), 'negative');
			addBuff(this.hero, 'poison');
			this.hero.buffs['poison'] = 8 + Math.round((2 * this.depth) / 3);
		} else if (kind === 'grim') {
			//GrimTrap: half of current HP plus a quarter of max, capped at 90% of max - the cap
			//is Java's own (never quite lethal on its own), the mix is this port's
			let damage = Math.min(Math.round(this.hero.maxHp * 0.9), Math.round(this.hero.hp / 2 + this.hero.maxHp / 4));
			damage = this.absorbHeroDamage(damage);
			this.hero.hp -= damage;
			this.showDamage(this.hero, damage);
			this.say(t('port.log.trap.grim', { damage }), 'negative');
		} else {
			let damage = Math.max(0, Random.normalRange(5 + this.depth, 10 + 2 * this.depth));
			damage = this.absorbHeroDamage(damage);
			this.hero.hp -= damage;
			this.showDamage(this.hero, damage);
			this.fire.seed(x, y, 3);
			this.applyTrapBlast(x, y);
			this.say(t('port.log.trap.explosive', { damage }), 'negative');
		}
		this.sprite(this.hero).setColorAdd(1, 0.2, 0.2);
		if (this.hero.hp <= 0) this.kill(this.hero, kind === 'burning' || kind === 'explosive' ? 'fire' : 'trap');
	}

	/** `Bomb.explode`: the blast reaches all characters in the 3x3 NEIGHBOURS9 area. */
	private applyTrapBlast(x: number, y: number): void {
		for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
			const target = this.creatureAt(x + dx, y + dy);
			if (!target || target.isHero || target.hp <= 0) continue;
			if (target.kind === 'yog' && this.yogShielded(target)) continue;
			if (target.kind === 'yogFist' && this.guardFist(target)) continue;
			let damage = Math.max(0, Random.normalRange(5 + this.depth, 10 + 2 * this.depth));
			if (dx !== 0 || dy !== 0) damage = Math.round(damage * 0.67);
			damage = Math.max(0, damage - Random.normalRange(target.armor[0], target.armor[1]));
			const preHp = target.hp;
			target.hp -= damage;
			if (target.kind === 'yog' && target.hp > 0) this.yogDamageHook(target, preHp);
			this.showDamage(target, damage);
			target.sleeping = false;
			if (target.hp <= 0) this.kill(target, 'fire');
		}
	}

	/**
	 * The class's real day-one ranged action (see the file header) against the nearest
	 * visible, in-range, in-sight target - `mwg/roguelike`'s `canTarget`/`chebyshevDistance`
	 * doing exactly the targeting work they were built for.
	 *
	 * Mage zaps through `mwg/actors` Charges (max 4 = 3 + the staff's +1, starting full,
	 * recharging over turns using Java's missing-charge-dependent delay); Cleric invokes the
	 * HolyTome through its own slow charges (the SP economy has no other model here). Thrown
	 * stacks use persistent durability and decrease only when a projectile breaks.
	 *
	 * @returns false for "nothing happened, no turn spent" (no target, no ammo/charge) - true
	 * once the shot is actually taken
	 */
	private useSpecial(): boolean {
		this.cancelHourglassFreeze();
		const special = CLASSES[this.heroClass].special;

		if (special.kind === 'none') {
			//HolyTome: heal 5+2*lvl through slow charges, standing in for the SP economy
			if (!this.tomeCharges.spend(1)) {
				this.say(t('port.log.tomecharging'));
				return false;
			}
			const heal = Math.min(this.hero.maxHp - this.hero.hp, 5 + 2 * this.progression.level);
			this.hero.hp += heal;
			this.grantHeroShield(monasticVigorShield(this.subclass(), this.talentRank('monastic_vigor')), this.hero.maxHp);
			this.say(t('port.log.tomeheal', { heal }), 'positive');
			return true;
		}
		const improvised = special.kind === 'throw' && canImproviseProjectile(this.heroClass, this.talentRank('improvised_projectiles'), this.bag.find('stone')?.quantity ?? 0);
		if (special.kind === 'throw' && this.ammo <= 0 && !improvised) {
			this.say(t('port.log.noammo', { item: t(special.labelKey) }), 'negative');
			return false;
		}
		const regrowthCharges = this.wandType === 'regrowth'
			? Math.min(3, Math.max(1, Math.ceil(this.wandCharges.current * 0.3)))
			: 1;
		if (special.kind === 'zap' && !this.wandCharges.canAfford(regrowthCharges)) {
			this.say(t('port.log.staffempty'), 'negative');
			return false;
		}

		//Ranged targeting range is a flat 6 for every class (the old `farsightRange` helper
		//returned exactly this 6 for non-snipers and wrongly spent Farsight here - see
		//`viewRadius()`, where the talent really lives).
		const range = 6;
		const target = this.creatures
			.filter((c) => !c.isHero && !c.isNPC && this.fov.isVisible(c.x, c.y))
			.filter((c) => Roguelike.canTarget(this.level, this.hero, c, { range }))
			.sort((a, b) => Roguelike.chebyshevDistance(this.hero, a) - Roguelike.chebyshevDistance(this.hero, b))[0];

		if (!target) {
			this.say(t('port.log.notarget'), 'negative');
			return false;
		}

		if (special.kind === 'throw') {
			const carried = this.ammo > 0;
			if (!carried) this.bag.remove('stone', 1);
			//MissileWeapon.min()/max(): min = 2*tier + lvl, max = 5*tier + tier*lvl - except
			//rogue knives, whose max is 6*tier + 2*lvl at tier 1. All three class missiles
			//are tier-1 (Stone/Knife/Spike are all MIS_T1), so the old per-class ranges are
			//exactly the tier formula at level 0 plus the new missileLevel; both bounds still
			//take the flat Sharpshooting bonus, as before.
			const sharpshooting = ringSharpshootingBonus(this.equippedRing);
			const thrownDamage: [number, number] = this.heroClass === 'rogue'
				? [2 + this.missileLevel + sharpshooting, 6 + 2 * this.missileLevel + sharpshooting]
				: [2 + this.missileLevel + sharpshooting, 5 + this.missileLevel + sharpshooting];
			//rolls to hit exactly like a melee swing (SPD's MissileWeapon shares Weapon's
			//accuracy machinery) - only the damage range and the range itself differ.
			const hit = this.attack({ ...this.hero, kind: undefined, damage: thrownDamage }, target);
			//rangedHit(): durability decreases only on a HIT (a miss just drops the missile
			//via rangedMiss -> onThrow) - hence resolving after attack()'s hit boolean rather
			//than up front, which also wrongly wore missiles down on every miss.
			let missileSurvived = true;
			if (hit && carried) {
				//durabilityPerUse(): baseUses (stones/knives 5, spikes 12 - the duelist's old
				//flat 10 had no Java basis) x 1.5^missileLevel x durable-talent
				//(1.25+0.25/point - the old (1+0.25xrank) undercounted every rank) x
				//sharpshooting, rounded, plus the +0.001 rounding epsilon. Break and
				//about-to-break use the real log lines.
				const baseUses = this.heroClass === 'duelist' ? 12 : 5;
				const uses = Math.round(baseUses * Math.pow(1.5, this.missileLevel)
					* (1.25 + 0.25 * this.talentRank('durable_projectiles')) * ringSharpshootingDurabilityMultiplier(this.equippedRing));
				const cost = 100 / Math.max(1, uses) + 0.001;
				this.ammoDurability -= cost;
				if (this.ammoDurability <= 0) {
					this.ammo--;
					this.ammoDurability = this.ammo > 0 ? 100 : 0;
					missileSurvived = false;
					this.say(t('port.log.missilebroken'), 'negative');
				} else if (this.ammoDurability <= cost) {
					this.say(t('items.weapon.missiles.missileweapon.about_to_break'), 'warning');
				}
			}
			if (missileSurvived) {
				//PinCushion: a surviving missile sticks in a living target and scatters back
				//out when it dies (see kill()). Throwing stones are sticky=false and always
				//drop instead; misses drop at the cell through the same path.
				if (hit && target.hp > 0 && this.heroClass !== 'warrior') {
					target.stuckAmmo = (target.stuckAmmo ?? 0) + 1;
				} else this.spawnGroundItem('stone', target.x, target.y);
			}
			if (this.heroClass === 'huntress' && this.talentRank('followup_strike') > 0) { this.followupTarget = target; this.followupDamage = this.talentRank('followup_strike') === 1 ? 2 : 3; }
		} else if (special.kind === 'zap') {
			const fullyCharged = this.wandCharges.current === this.wandCharges.max;
			const lastCharge = this.wandCharges.current === 1;
			this.wandCharges.spend(regrowthCharges);
			const preservation = preservationChance(this.talentRank('wand_preservation'));
			if (preservation > 0 && Random.chance(preservation)) this.wandCharges.refund(1);
			if (lastCharge && this.talentRank('backup_barrier') > 0) this.grantHeroShield(this.talentRank('backup_barrier') === 1 ? 3 : 5, this.hero.maxHp);
			//GreatCrab.damage negates wand bolts from a seen hero - kept verbatim
			if (target.kind === 'greatCrab' && !target.sleeping) {
				this.say(t('port.log.crabparries'), 'negative');
			} else {
				//WandOfMagicMissile.onZap calls ch.damage() directly in Java - never a hit
				//roll. Fireblast and Lightning use their real level-0/level-scaling rolls too.
				//This port has no Ballistica cone/chain graph, so Fireblast targets the selected
				//cell and Lightning arcs to visible adjacent foes; the damage formulas and
				//Lightning's per-target multiplier are retained, while the geometry reduction is
				//explicitly documented in PORT_COVERAGE.md.
				if (this.wandType === 'regrowth') {
					this.useRegrowthWand(target, regrowthCharges);
				} else {
				const zapTargets = this.wandType === 'lightning'
					? [target, ...this.creatures.filter((c) => c !== target && !c.isHero && !c.isNPC && c.hp > 0
						&& Roguelike.chebyshevDistance(target, c) <= 1)]
					: this.wandType === 'corrosion'
						? [target, ...this.creatures.filter((c) => c !== target && !c.isHero && !c.isNPC && c.hp > 0
							&& Roguelike.chebyshevDistance(target, c) <= 1 && this.fov.isVisible(c.x, c.y))]
					: [target];
				const lightningMultiplier = this.wandType === 'lightning' ? 0.4 + 0.6 / zapTargets.length : 1;
				for (const victim of zapTargets) {
					const raw = this.wandType === 'corrosion' || this.wandType === 'corruption'
						? 0
						: this.wandType === 'livingEarth'
							? Random.normalRange(4, 6 + 2 * this.weaponLevel)
						: this.wandType === 'fireblast'
						? Random.normalRange(1 + this.weaponLevel, 2 + 2 * this.weaponLevel)
						: this.wandType === 'lightning'
							? Random.normalRange(5 + this.weaponLevel, 10 + 5 * this.weaponLevel)
								: this.wandType === 'prismaticLight'
									? Random.normalRange(1 + this.weaponLevel, 5 + 3 * this.weaponLevel)
									: this.wandType === 'disintegration'
										? Random.normalRange(2 + this.weaponLevel, 8 + 4 * this.weaponLevel)
							: Random.normalRange(2 + this.weaponLevel, 8 + 2 * this.weaponLevel);
					let damage = Math.round(raw * lightningMultiplier)
						+ (this.wandType === 'magicMissile' || this.wandType === 'frost' ? (this.subclass() === 'warlock' ? 2 : 0) : 0)
						+ (victim === target ? enragedCatalystBonus(this.subclass(), this.talentRank('enraged_catalyst'), this.hero.hp, this.hero.maxHp) + this.wandBonusDamage : 0);
					this.wandBonusDamage = victim === target ? 0 : this.wandBonusDamage;
					victim.hp -= damage;
					this.showDamage(victim, damage);
					victim.sleeping = false;
					if (this.wandType === 'livingEarth') {
						//WandOfLivingEarth.onZap() adds the damage dealt to RockArmor, capped
						//at twice `armorToGuardian()` (8 + 4*wand level). This port stores the
						//same persistent amount directly; the guardian conversion is still a
						//separate missing actor, so reaching the cap does not spawn one yet.
						this.livingEarthWandLevel = Math.max(this.livingEarthWandLevel, this.weaponLevel);
						this.livingEarthArmor = Math.min(
							2 * (8 + 4 * this.livingEarthWandLevel),
							this.livingEarthArmor + damage,
						);
					}
					if (this.wandType === 'corrosion') {
						//WandOfCorrosion.onZap() seeds CorrosiveGas at the collision cell and
						//lets its volume affect the 9-cell neighbourhood. This port has no
						//corrosive-gas intensity/volume actor, so the already-live Ooze status is
						//the documented damage-over-time stand-in; the target neighbourhood is
						//retained and no artificial direct zap damage is dealt.
						addBuff(victim, 'ooze');
					}
					if (this.wandType === 'corruption' && !victim.isHero && !victim.isNPC) {
						//WandOfCorruption.corruptEnemy() creates a permanent controlled ally
						//after healing/cleansing it. The port has no separate Corruption buff
						//or loot-transfer payload, so the existing ally scheduler is used for
						//the observable controlled-combat result.
						victim.isAlly = true;
						victim.allyKind = 'mirror';
						victim.hp = victim.maxHp;
						victim.buffs = {};
						victim.sleeping = false;
						victim.seesHero = false;
					}
					if (this.frostWand && victim === target) addBuff(victim, 'daze');
					if (this.wandType === 'fireblast') addBuff(victim, 'burning');
					if (this.wandType === 'prismaticLight' && Random.int(0, 5 + this.weaponLevel) >= 3) addBuff(victim, 'daze');
					this.sprite(victim).setColorAdd(0.6, 0.7, 1);
					if (this.wandType === 'corrosion') this.say(t('port.log.wandcorrosion', { target: victim.name }), 'positive');
					else if (this.wandType === 'corruption') this.say(t('port.log.wandcorruption', { target: victim.name }), 'positive');
					else this.say(t('port.log.wandhits', { target: victim.name, damage }), 'positive');
					if (this.subclass() === 'warlock') this.wandCharges.refund(1);
					if (victim.hp <= 0 && !victim.isAlly) this.kill(victim);
				}
				}
				if (fullyCharged && this.talentRank('excess_charge') > 0) this.grantHeroShield(Math.ceil((this.talentRank('excess_charge') * Math.max(1, this.weaponLevel)) / 1.5), this.hero.maxHp);
				//Arcane Vision (Mage T2, `Wand.wandProc()`): every zap marks its target with
				//`CharAwareness` for `5+5*points` turns (see through walls). No per-target
				//awareness primitive exists here, so the existing all-mobs `mindvision` stands
				//in at the real duration (over-broad, stated) - never shortened below an
				//active potion's remainder.
				if (this.heroClass === 'mage' && this.talentRank('arcane_vision') > 0) {
					this.hero.buffs['mindvision'] = Math.max(this.hero.buffs['mindvision'] ?? 0, arcaneVisionDuration(this.talentRank('arcane_vision')));
				}
			}
		} else {
			//SpiritBow.damageRoll: a normal hit roll, but the base damage is scaled by
			//distance (min(3, 1.2 * 1.125^(distance-1))) before armor is subtracted
			if (!rollHit(this.hero, target)) {
				this.say(t('port.log.arrowmisses', { target: target.name }), 'negative');
			} else {
				const distance = Roguelike.chebyshevDistance(this.hero, target);
				const multiplier = Math.min(3, 1.2 * Math.pow(1.125, distance - 1));
				//SpiritBow.min()/max(): RingOfSharpshooting's bonus is asymmetric here - +bonus on
				//the low end, +2*bonus on the high end (unlike MissileWeapon's identical +bonus
				//on both bounds above).
				const sharpshooting = ringSharpshootingBonus(this.equippedRing);
				const base = Random.normalRange(special.damage[0] + sharpshooting, special.damage[1] + 2 * sharpshooting);
				const dr = Random.normalRange(target.armor[0], target.armor[1]);
				const closeBonus = this.talentRank('point_blank') > 0 && distance <= 2 ? 1 + 0.2 * this.talentRank('point_blank') : 1;
				const momentum = projectileMomentumBonus(this.subclass(), this.talentRank('projectile_momentum'), this.projectileMomentumReady);
				const damage = Math.max(0, Math.round(base * multiplier * (this.subclass() === 'sniper' ? 1.15 : 1) * closeBonus) - dr) + momentum;
				this.projectileMomentumReady = false;
				target.hp -= damage;
				this.showDamage(target, damage);
				this.sprite(target).setColorAdd(1, 1, 1);
				this.say(t('port.log.shoot', { target: target.name, damage }), 'positive');
				if (this.talentRank('followup_strike') > 0) { this.followupTarget = target; this.followupDamage = this.talentRank('followup_strike') === 1 ? 2 : 3; }
				if (target.hp <= 0) {
					//SpiritBow kills are missile-weapon kills (`cause instanceof Weapon`), so
					//Lethal Haste triggers here just like at the melee/throw kill site above;
					//wand-zap kills never do (the Wand is not a Weapon - see `lethalHasteOnKill`).
					this.lethalHasteOnKill();
					this.kill(target);
				}
			}
		}

		//MeleeWeapon.useAbility()'s Duelist branch: shield = `1 + 2*points` (3/5), gated on a
		//flat HP/HT <= 0.5 - not a flat 3 with an invented per-rank threshold (0.4/0.6, no Java
		//basis at any rank) - found in the 2026-09-09 hero-progression audit. Real Java fires
		//this on weapon-*ability* use specifically; this port has no separate ability-use action
		//from the class's own special (`useSpecial` already stands in for Duelist's special
		//ability the same way it does for every other class), so triggering it here is this
		//port's existing convention, not a new substitution.
		{
			const rank = this.talentRank('aggressive_barrier');
			if (rank > 0 && this.hero.hp / this.hero.maxHp <= 0.5) this.grantHeroShield(1 + 2 * rank, this.hero.maxHp);
		}
		this.spawnProjectile(this.hero, target);
		return true;
	}

	private spawnProjectile(from: Creature, to: Creature): void {
		const sprite = new TintedSprite(this.dotTexture);
		sprite.tint = 0xffdd66;
		this.creatureLayer.addChild(sprite);

		const [fx, fy] = this.worldOf(from);
		const [tx, ty] = this.worldOf(to);
		this.projectiles.push({
			flight: new Projectile(sprite, { x: fx, y: fy }, { x: tx, y: ty }, { speed: 300 }),
			sprite,
		});
	}

	// -------------------------------------------------------------- the loop

	private runTurns(): void {
		this.simulation.runTurns();
	}

	/** Java's Buff.act() boundary for temporary monster speed effects. */
	private afterMonsterTurn(monster: Creature): void {
		if (!monster.hasteTurns) return;
		monster.hasteTurns--;
		if (monster.hasteTurns <= 0) {
			monster.speed = monster.hasteBaseSpeed ?? 1;
			delete monster.hasteTurns;
			delete monster.hasteBaseSpeed;
		}
	}

	private onAction(action: string): boolean {
		if (this.infoPanel?.visible) {
			if (action === 'cancel' || action === 'confirm') this.infoPanel.visible = false;
			return true;
		}
		if (this.journalOpen) {
			if (action === 'cancel' || action === 'confirm') this.closeJournal();
			return true;
		}
		if (this.gameOver || !this.awaitingInput) return false;
		if ((this.subclassChoiceOpen || this.armorChoiceOpen || this.augmentChoiceOpen || this.itemPickerOpen) && action !== 'talents') {
			this.talentOpen = true;
			this.refreshTalentPanel();
			return false;
		}

		// WndBag is modal: arrows select slots and confirm opens item actions.
		if (this.inventoryOpen) return this.inventoryPanel.handleAction(action);
		return dispatchHeroAction(action, this.heroActions);
	}

	/**
	 * `Hero.handle()`'s click-to-move: a click beyond one step away queues a destination and
	 * the real pathfinder walks it automatically, one step per turn, until it arrives or an
	 * interrupt condition fires (`Hero.interrupt()`/`resting` in Java) - previously a click on
	 * a distant tile only ever produced a single step toward it, with no travel at all.
	 */
	private handleMapPointer(screenX: number, screenY: number): void {
		if (this.gameOver || !this.awaitingInput || !this.map) return;
		const local = this.map.toLocal({ x: screenX, y: screenY });
		const target = { x: Math.floor(local.x / TILE), y: Math.floor(local.y / TILE) };
		if (!this.level.inside(target.x, target.y)) return;
		const dx = Math.sign(target.x - this.hero.x);
		const dy = Math.sign(target.y - this.hero.y);
		if (Math.max(Math.abs(target.x - this.hero.x), Math.abs(target.y - this.hero.y)) <= 1) {
			this.travelTarget = null;
			const action = Object.entries(MOVES).find(([, step]) => step.x === dx && step.y === dy)?.[0] ?? 'wait';
			this.onAction(action);
			return;
		}
		this.travelTarget = target;
		this.travelStartHp = this.hero.hp;
		this.stepTravel();
	}

	/** Takes one step of a queued `travelTarget`, or cancels it once arrived/interrupted. */
	private stepTravel(): void {
		const to = this.travelTarget;
		if (!to || this.gameOver || !this.awaitingInput) return;
		if (this.hero.x === to.x && this.hero.y === to.y) {
			this.travelTarget = null;
			return;
		}
		//Interrupt conditions, matching Java's real "stop and let the player decide" cases:
		//taking damage, or any awake, hostile creature coming into sight. This port checks
		//visibility broadly (any such creature currently seen) rather than Java's narrower
		//"a *newly* seen enemy" - a stated simplification, safer than under-interrupting.
		if (this.hero.hp < this.travelStartHp) {
			this.travelTarget = null;
			return;
		}
		if (this.creatures.some((c) => !c.isHero && !c.isNPC && c.hp > 0 && !c.sleeping && this.fov.isVisible(c.x, c.y))) {
			this.travelTarget = null;
			return;
		}
		const blocked = new Set(this.creatures.filter((c) => c !== this.hero).map((c) => this.level.index(c.x, c.y)));
		this.eternalFireBlockedInto(blocked);
		const path = this.pathfinder.find({ x: this.hero.x, y: this.hero.y }, to, { blocked });
		const next = path[0];
		if (!next) {
			this.travelTarget = null;
			return;
		}
		const dx = Math.sign(next.x - this.hero.x);
		const dy = Math.sign(next.y - this.hero.y);
		const action = Object.entries(MOVES).find(([, step]) => step.x === dx && step.y === dy)?.[0] ?? 'wait';
		this.onAction(action);
	}

	/**
	 * One hero turn passes: the TurnClock drives hunger (Hunger.STEP=10 per turn, HUNGRY 300,
	 * STARVING 450, continuous partial-damage accrual per `simulation/hunger.ts`), wand charges regenerate, and
	 * the hero's own buff timers tick down with their dot damage. turnCost (default 1) allows
	 * fractional turns for attack-speed modifiers (Weapon.Augment SPEED, Swiftness glyph,
	 * RingOfFuror/Haste).
	 */
	private spendHeroTurn(turnCost: number = 1): void {
		finishHeroTurn({
			isAlive: () => this.hero.hp > 0,
			advanceClock: () => {
				this.clock.advance(turnCost);
				//`ConservedDamage.act()`: `preservedDamage -= max(preserved*0.025, 0.1)`,
				//detaching at zero - previously a flat `*0.75` floor, a guess with no Java
				//basis, and the store rule below used to add half of every hit instead of
				//kill-overkill only. Both corrected against `Kinetic.java`/`Char.java` this pass.
				if (this.kineticStored > 0) {
					this.kineticStored -= Math.max(this.kineticStored * 0.025, 0.1);
					if (this.kineticStored <= 0) this.kineticStored = 0;
				}
			},
			advanceHunger: () => this.hungerStep(),
			// Recharging's Java Charger contribution is an additional recharge tick while the
			// 30-second flavour buff is active; Charges.advance() is this port's tick primitive.
			recoverWandCharge: () => {
				const missing = this.wandCharges.max - this.wandCharges.current;
				const turnsToCharge = 10 + 40 * Math.pow(0.875, Math.max(0, missing));
				//RingOfEnergy.wandChargeMultiplier(): 1.175^level, applied straight onto the base rate.
				const baseRate = ringEnergyMultiplier(this.equippedRing) / turnsToCharge;
				//Charger.recharge(): Recharging's CHARGE_BUFF_BONUS is a flat `+0.25 * remainder()`
				//added on top of the base rate, not a 1.25x multiplier on it - at typical missing-
				//charge counts the base rate is a few percent per turn, so the flat bonus dwarfs it
				//(a previous version here scaled the base rate by 1.25x instead, making Recharging
				//far weaker than real Java - fixed in the 2026-09-09 item-system audit).
				//`remainder()` is `min(1, cooldown())`, giving half benefit on the buff's last
				//partial turn; this port's integer-turn buff countdown has no sub-turn fraction to
				//read, so it simplifies to the flat `0.25` for every turn the buff is active.
				this.wandCharges.advance(baseRate + (this.hero.buffs['recharging'] ? 0.25 : 0));
			},
			recoverTomeCharge: () => { this.tomeCharges.advance(1); },
			spreadFire: () => this.spreadFire(),
			applyBuffDamage: () => {
				//Barrier.act(): partialLostShield += min(1, shielding/20), then absorbDamage(1)
				//and a hard reset to 0 (not a carried remainder, unlike Hunger's partialDamage)
				//once it reaches 1 - bigger shields decay faster, and this now actually runs;
				//previously heroBarrier.advance()/this decay was never called at all, so shields
				//held indefinitely once granted (documented "Not ported" gap, now closed).
				//The accrual base is the Barrier pool only: real BlockBuff.act() has no
				//proportional decay at all, so Blocking's own pool is exempt here.
				//Deliberate simplification carried over from the Barrier row: neither this nor
				//the cliff below is scaled by HoldFast.buffDecayFactor() (no HoldFast buff here).
				if (this.heroBarrier.total > 0) {
					this.barrierPartialLoss += Math.min(1, this.heroBarrier.total / 20);
					if (this.barrierPartialLoss >= 1) {
						this.heroBarrier.absorb(1);
						this.barrierPartialLoss = 0;
					}
				}
				//BlockBuff.act(): `left -= 1; left<=0 -> detach()` - a hard cliff-edge expiry of
				//Blocking's own pool, independent of the proportional curve above. Every fresh
				//proc resets the timer via grantBlockingShield; damage absorption eats into the
				//pool directly, so nothing needs clamping here anymore.
				if (this.blockingTurnsLeft > 0) {
					this.blockingTurnsLeft--;
					if (this.blockingTurnsLeft <= 0) this.blockingBarrier.clear();
				}
				if (this.sungrassHealing > 0) {
					const heroCell = this.level.index(this.hero.x, this.hero.y);
					if (heroCell !== this.sungrassPos) {
						this.sungrassHealing = 0;
						this.sungrassPartial = 0;
						this.sungrassPos = -1;
					} else {
						this.sungrassPartial += (40 + this.hero.maxHp) / 150;
						const healed = Math.min(this.sungrassHealing, Math.floor(this.sungrassPartial));
						if (healed > 0) {
							this.sungrassHealing -= healed;
							this.sungrassPartial -= healed;
							const before = this.hero.hp;
							this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + healed);
							if (this.hero.hp > before) this.showHeal(this.hero, this.hero.hp - before);
						}
						if (this.sungrassHealing <= 0) this.sungrassPos = -1;
					}
				}
				//Healing.act()/healingThisTick(): PotionOfHealing is a heal-over-time, not an
				//instant full heal - 25% of whatever's left per turn (floored at 1, capped at
				//what's left), fully replacing the port's former "quaff = instantly full HP"
				//stand-in. `setHeal`'s real semantics: a fresh potion only replaces `healingLeft`
				//if its amount is bigger, it never stacks additively on top of an in-progress heal.
				if (this.healingLeft > 0) {
					const tick = Math.min(this.healingLeft, Math.max(1, Math.round(this.healingLeft * 0.25)));
					if (this.hero.hp < this.hero.maxHp) {
						const before = this.hero.hp;
						this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + tick);
						if (this.hero.hp > before) this.showHeal(this.hero, this.hero.hp - before);
					}
					this.healingLeft -= tick;
				}
				if (this.hero.buffs['invisibility'] && this.talentRank('protective_shadows') > 0) {
					this.stealthTalentTicks++;
					const cadence = this.talentRank('protective_shadows') === 1 ? 2 : 1;
					if (this.stealthTalentTicks >= cadence) {
						this.stealthTalentTicks = 0;
						this.grantHeroShield(1, this.talentRank('protective_shadows') === 1 ? 3 : 5);
					}
				} else this.stealthTalentTicks = 0;
				const burning = this.hero.buffs['burning'] !== undefined;
				const hadAdrenaline = this.hero.buffs['adrenalineSurge'] !== undefined;
				//RingOfElements.resist(): Burning/Poison are both in `RESISTS`, so the DoT
				//they deal through `Char.damage()` is scaled by `0.825^level` in real Java.
				const dot = Math.floor(tickBuffs(this.hero) * ringElementsMultiplier(this.equippedRing));
				if (hadAdrenaline !== (this.hero.buffs['adrenalineSurge'] !== undefined)) this.syncHeroFromStats();
				if (dot > 0) {
					const blockedDot = this.absorbHeroDamage(dot);
					this.hero.hp -= blockedDot;
					this.showDamage(this.hero, dot);
					this.say(t('port.log.affliction', { damage: dot }), 'negative');
					if (this.hero.hp <= 0) {
						this.kill(this.hero, burning ? 'fire' : 'poison');
						return true;
					}
				}
				//Ooze.act(): depth-scaled direct damage (`1+depth/5` past depth 5, 1 at
				//depth 5, a coin-flip 1 in the Sewers), in RESISTS like Burning/Poison, with
				//the real `ondeath` line on a kill (no dedicated badge exists to award).
				if (this.hero.buffs['ooze'] !== undefined) {
					const rawOoze = this.depth > 5 ? 1 + Math.floor(this.depth / 5)
						: this.depth === 5 ? 1 : Random.chance(0.5) ? 1 : 0;
					const oozeDot = Math.floor(rawOoze * ringElementsMultiplier(this.equippedRing));
					if (oozeDot > 0) {
						const blockedOoze = this.absorbHeroDamage(oozeDot);
						this.hero.hp -= blockedOoze;
						this.showDamage(this.hero, oozeDot);
						this.say(t('port.log.affliction', { damage: oozeDot }), 'negative');
						if (this.hero.hp <= 0) {
							this.say(t('actors.buffs.ooze.ondeath'), 'negative');
							this.kill(this.hero, 'poison');
							return true;
						}
					}
				}
				//Level.java's per-turn WATER hook: a non-flying char standing in water forces
				//Burning to act (the DoT above already covers this turn's damage) then extinguish
				//on the following check, matching `Burning.act()`'s own `acted && water && !flying
				//-> detach()` cliff - collapsed here to an immediate extinguish once this turn's
				//tick has already landed, rather than reproducing the exact one-turn-late timing.
			//`Char.flying` is Levitation in this port (see `fallThroughChasm`'s own comment).
			//Ooze washes the same way (`Ooze.act()` detaches in water right after its own
			//tick) - real Poison, which shares nothing but the old stand-in, correctly stays.
			if (burning && this.level.get(this.hero.x, this.hero.y) === WATER && !this.hero.buffs['levitation']) delete this.hero.buffs['burning'];
			if (this.hero.buffs['ooze'] !== undefined && this.level.get(this.hero.x, this.hero.y) === WATER && !this.hero.buffs['levitation']) delete this.hero.buffs['ooze'];
			//Lit bomb fuses burn down here, after the hero's own DoT (a `Fuse` acts after the
			//hero in round order) - a hero-killing blast stops the sequence like fatal buff
			//damage does. See `tickBombFuses`.
			if (this.tickBombFuses()) return true;
			if (this.tickFallingRocks()) return true;
				if (this.tickCavesBossEnergy()) return true;
				return false;
			},
			spendScheduledTurn: () => {
				if (this.timeBubbleTurns > 0) {
					this.timeBubbleTurns--;
					if (this.hourglassFreeze) {
						this.hourglassTurnsToCost--;
						if (this.hourglassTurnsToCost <= 0) {
							const hourglass = this.bag.find('hourglass') as (typeof this.bag.items[number] & { charges?: number }) | undefined;
							if (hourglass && (hourglass.charges ?? 0) > 0) hourglass.charges!--;
							this.hourglassTurnsToCost = 2;
						}
					}
					if (this.timeBubbleTurns === 0) this.flushTimeBubblePresses();
					if (this.timeBubbleTurns === 0) this.hourglassFreeze = false;
				} else this.scheduler.spend(1);
			},
			runAutomaticTurns: () => { if (this.timeBubbleTurns <= 0) this.runTurns(); },
		});
		if (this.healingEvasionTurns > 0) { this.healingEvasionTurns--; this.syncHeroFromStats(); }
	}

	/** Hunger.act(): +10 per turn, warnings/1-damage on crossing STARVING, then continuous partialDamage accrual */
	private hungerStep(): void {
		this.simulation.hungerStep();
		const reduction = ironStomachReduction(this.heroClass, this.talentRank('iron_stomach'));
		if (reduction > 0) this.hunger = Math.max(0, this.hunger - reduction);
	}

	private takeHeroTurn(move: Step): void {
		let occupant: Creature | null = null;
		const plan = runMovement({ x: this.hero.x, y: this.hero.y }, move, {
			occupantAt: (target) => {
				occupant = this.creatureAt(target.x, target.y);
				return occupant ? (occupant.isNPC || occupant.isAlly ? 'npc' : 'enemy') : null;
			},
			closedDoorAt: (target) => this.doors.isDoor(target.x, target.y) && !this.doors.isOpen(target.x, target.y),
			isRooted: () => !!this.hero.buffs['roots'],
			passable: (target) =>
				(this.level.passable(target.x, target.y) || this.isChasmCell(target.x, target.y)) &&
				this.eternalFire.volumeAt(target.x, target.y) < 1,
		});
		if (plan.kind === 'wait') {
			if (this.talentRank('patient_strike') > 0) this.patientStrikeReady = true;
			this.say(t('port.log.wait'));
			return;
		}
		const { target } = plan;
		// Interaction plans only arise from the synchronous occupant query above.
		if (plan.kind === 'interact') {
			// Allies occupy a cell like a friendly NPC; interactWithNPC intentionally has no
			// branch for them, so bumping one cannot turn into friendly fire.
			this.interactWithNPC(occupant!);
		}
		else if (plan.kind === 'attack') this.attack(this.hero, occupant!);
		else if (plan.kind === 'door') this.bumpDoor(target.x, target.y);
		else if (plan.kind === 'rooted') this.say(t('actors.buffs.roots.heromsg'), 'negative');
		else if (plan.kind === 'move') {
			this.moveTo(this.hero, target);
			if (this.sungrassHealing > 0 && this.level.index(target.x, target.y) !== this.sungrassPos) {
				this.sungrassHealing = 0;
				this.sungrassPartial = 0;
				this.sungrassPos = -1;
			}
			this.projectileMomentumReady = this.subclass() === 'freerunner' && this.talentRank('projectile_momentum') > 0;
			this.trampleHighGrass(target.x, target.y);
			const targetCell = this.level.index(target.x, target.y);
			const delayedFeature = this.portedFeatures.kindAt(targetCell)?.startsWith('plant:') ?? false;
			const delayedTrap = this.trapKinds.has(targetCell);
			if (this.timeBubbleTurns > 0 && (delayedFeature || delayedTrap)) this.timeBubblePresses.add(targetCell);
			else this.portedFeatures.interact(targetCell, this);
			this.pickupGroundItemAt(target.x, target.y);
			this.checkCavesBossPylonGate();
			if (!(this.timeBubbleTurns > 0 && delayedTrap)) this.triggerTrapAt(target.x, target.y);
			if (this.fallThroughChasm(target.x, target.y)) return;
			if (this.miningBranchActive && this.miningBranchEntrance
				&& target.x === this.miningBranchEntrance.x && target.y === this.miningBranchEntrance.y) {
				this.leaveMiningBranch();
			} else if (!this.miningBranchActive && this.portedBranchExitCells.has(this.level.index(target.x, target.y))) {
				this.enterMiningBranch();
			}
			if (this.hasStairs && target.x === this.stairs.x && target.y === this.stairs.y) {
				this.depth++;
				this.deepestDepth = Math.max(this.deepestDepth, this.depth);
				this.say(this.depth in BOSSES ? t('port.log.descendboss') : t('scenes.gamescene.descend', { 0: this.depth }), 'warning');
				this.justDescended = true;
				this.enterLevel();
			}
		} else if (plan.kind === 'wall' && this.canMineCavesWall() && this.mineMiningWall(target.x, target.y)) {
			// Pickaxe mining spends its turn inside mineMiningWall(); the movement adapter must not spend it twice.
		} else {
			this.say(t('port.log.wall'), 'negative');
		}
	}

	/** Consumes a generated Java well once, applying the two WellWater hero effects. */
	private usePortedWellAtCell(cell: number): void {
		this.usePortedWellAt(cell % this.level.width, Math.floor(cell / this.level.width));
	}

	private usePortedWellAt(x: number, y: number): void {
		const cell = this.level.index(x, y);
		const kind = this.portedWellWater.get(cell);
		if (!kind || this.portedPaint?.map[cell] !== Terrain.WELL) return;
		if (kind === 'awareness' || kind === 'waterOfAwareness') {
			//WaterOfAwareness.affectHero(): `hero.belongings.observe()` - real Java identifies only
			//the equipped weapon/armor/artifact/ring (this port already treats those as identified
			//and curse-known the instant they're equipped, a pre-existing simplification, so there
			//is nothing left to reveal there) and marks every equipable/wand item still sitting in
			//the backpack cursed-known, without fully identifying it. The previous `for (item of
			//bag) Actors.identify(item)` was a real overreach with no Java basis at all - Java's
			//per-item full identify only happens via the separate `affectItem()` path, triggered by
			//the water blob spreading onto a *ground* item heap over time, which this port's
			//one-shot touch-the-well interaction doesn't model. Also grants the `awareness` buff.
			for (const item of this.bag.items) {
				if (item.id === 'clothArmor' || item.id === 'armor' || item.id === 'armorReward'
					|| item.id === 'weaponReward' || item.id === 'wand' || item.id.startsWith('ring_')) {
					(item as typeof item & { cursedKnown?: boolean }).cursedKnown = true;
				}
			}
			addBuff(this.hero, 'awareness');
			for (let yy = 0; yy < this.level.height; yy++) for (let xx = 0; xx < this.level.width; xx++) {
				if (this.secrets.isSecret(xx, yy)) this.secrets.discover(xx, yy);
			}
			this.say(t('port.log.wellreveals'), 'positive');
		} else {
			this.hero.hp = this.hero.maxHp;
			//PotionOfHealing.cure(): clears Poison/Cripple/Weakness/Vulnerable/Bleeding/Blindness/
			//Drowsy/Slow/Vertigo - notably not Burning, which the previous list here wrongly
			//cleared too (no Java basis; a lit hero stays lit through a health well).
			for (const buff of ['poison', 'weakness', 'vulnerable', 'cripple', 'roots'] as BuffId[]) delete this.hero.buffs[buff];
			//Belongings.uncurseEquipped(): clears a known curse from the equipped weapon/armor/ring,
			//the same three-slot clear ScrollOfRemoveCurse's branch above already uses.
			if (getCurse(this.weaponAffix ?? '')) this.weaponAffix = null;
			if (getCurse(this.armorGlyph ?? '')) this.armorGlyph = null;
			if (this.equippedRing?.cursed) this.equippedRing.cursed = false;
			this.hunger = Math.max(this.hunger, 300);
			this.say(t('port.log.wellheals'), 'positive');
		}
		this.portedWellWater.delete(cell);
		const plantIndex = this.portedPaint?.plants.findIndex((plant) => plant.pos === cell && plant.kind.startsWith('wellWater:')) ?? -1;
		if (plantIndex >= 0) this.portedPaint!.plants.splice(plantIndex, 1);
		if (this.portedPaint) this.portedPaint.map[cell] = Terrain.EMPTY_WELL;
		this.level.set(x, y, FLOOR);
		this.restitchTilesAround(x, y);
		this.featuresMap?.setLayerData('features', this.featureFrames());
	}

	/** Plant neighbours use Java's no-replacement `PathFinder.NEIGHBOURS8` pool.
	 * The live floor model cannot stack heaps, so occupied candidates are simply skipped. */
	private dropPlantNeighbourLoot(x: number, y: number, min: number, max: number, kind: 'dew' | 'seed'): void {
		const candidates = Roguelike.neighbourOffsets(8)
			.map(([dx, dy]) => ({ x: x + dx, y: y + dy }))
			.filter((at) => this.level.inside(at.x, at.y)
				&& this.level.passable(at.x, at.y)
				&& !this.isChasmCell(at.x, at.y)
				&& !(this.hasStairs && this.stairs && this.stairs.x === at.x && this.stairs.y === at.y));
		const count = Random.range(min, max);
		for (let i = 0; i < count && candidates.length > 0; i++) {
			const index = Random.int(candidates.length);
			const at = candidates.splice(index, 1)[0]!;
			if (this.groundItemAt(at.x, at.y)) continue;
			if (kind === 'dew') this.spawnGroundItem('dewdrop', at.x, at.y);
			else {
				const seed = randomUsingDefaults(Cat.SEED);
				this.spawnGroundItem('seed', at.x, at.y, sourceInventoryItem('seed', seed.cls, (kind) => this.newItemInstanceId(kind)));
			}
		}
	}

	/**
	 * `Plant.trigger()`/`Plant.wither()` for generated regional plants. Room painters record
	 * the concrete seed/plant class as a tag because the framework has no Java Plant registry;
	 * stepping on it still has the same one-shot consequence and removes only the plant marker,
	 * leaving the room's grass/high-grass terrain intact.
	 */
	private triggerPortedPlantAt(x: number, y: number): void {
		const cell = this.level.index(x, y);
		const featureKind = this.portedFeatures.kindAt(cell);
		const index = this.portedPaint?.plants.findIndex((plant) => plant.pos === cell && !plant.kind.startsWith('wellWater:')) ?? -1;
		const manualKind = this.manualPlants.get(cell);
		if (index < 0 && !manualKind) return;
		const kind = (featureKind?.startsWith('plant:') ? featureKind.slice('plant:'.length) : index >= 0 ? this.portedPaint!.plants[index]!.kind : manualKind!)
			.replace(/Seed$/, '').toLowerCase();
		if (index >= 0) this.portedPaint!.plants.splice(index, 1);
		this.manualPlants.delete(cell);

		switch (kind) {
			case 'sungrass':
				this.sungrassHealing = Math.max(0, this.hero.maxHp - this.hero.hp);
				this.sungrassPartial = 0;
				this.sungrassPos = cell;
				this.say(t('port.log.sungrassheal'), 'positive');
				break;
			case 'blandfruit':
			case 'blandfruitbush':
				this.spawnGroundItem('food', x, y);
				this.say(t('port.log.plantfruit'), 'positive');
				break;
			case 'starflower':
				addBuff(this.hero, 'bless');
				if (this.subclass() === 'warden') addBuff(this.hero, 'recharging');
				this.say(t('port.log.starflowerconfidence'), 'positive');
				break;
			case 'dewcatcher':
				this.dropPlantNeighbourLoot(x, y, 3, 6, 'dew');
				this.say(t('port.log.dewcatcherdew'), 'positive');
				break;
			case 'seedpod':
				this.dropPlantNeighbourLoot(x, y, 2, 4, 'seed');
				this.say(t('port.log.seedpodburst'), 'positive');
				break;
			case 'earthroot':
				this.grantHeroShield(this.hero.maxHp, this.hero.maxHp);
				break;
			case 'blindweed':
				if (this.subclass() === 'warden') addBuff(this.hero, 'invisibility');
				else { addBuff(this.hero, 'daze'); addBuff(this.hero, 'cripple'); }
				this.say(this.subclass() === 'warden' ? 'The blindweed shrouds you from sight.' : 'The blindweed clouds your senses.', this.subclass() === 'warden' ? 'positive' : 'negative');
				break;
			case 'fadeleaf': {
				const candidates: Step[] = [];
				for (let yy = 1; yy < this.level.height - 1; yy++) for (let xx = 1; xx < this.level.width - 1; xx++) {
					if ((xx === this.hero.x && yy === this.hero.y) || !this.level.passable(xx, yy) || this.creatureAt(xx, yy)) continue;
					candidates.push({ x: xx, y: yy });
				}
				if (candidates.length > 0) this.moveTo(this.hero, Random.element(candidates)!);
				this.say(t('port.log.fadeleafteleport'), 'positive');
				break;
			}
			case 'mageroyal':
				for (const buff of ['poison', 'burning', 'weakness', 'vulnerable', 'cripple', 'daze'] as BuffId[]) delete this.hero.buffs[buff];
				this.say(t('port.log.mageroyalclear'), 'positive');
				break;
			case 'icecap':
				this.plantFreeze.seed(x, y, 2);
				if (this.subclass() === 'warden') {
					addBuff(this.hero, 'frostImbue');
					this.say(t('port.log.icecapfrost'), 'positive');
				} else {
					addBuff(this.hero, 'paralysis');
					this.say(t('port.log.icecapfreeze'), 'negative');
				}
				break;
			case 'rotberry':
				if (this.subclass() === 'warden') {
					addBuff(this.hero, 'adrenalineSurge');
					this.syncHeroFromStats();
					this.say(t('port.log.rotberryadrenaline'), 'positive');
				} else {
					this.plantGas.seed(x, y, 100);
					addBuff(this.hero, 'poison');
					this.say(t('port.log.rotberrygas'), 'negative');
				}
				break;
			case 'sorrowmoss':
				addBuff(this.hero, 'poison');
				this.hero.buffs.poison = 5 + Math.round(2 * this.depth / 3);
				this.say(t('port.log.sorrowmosspoison'), 'negative');
				break;
			case 'firebloom':
				// Firebloom seeds Java's Fire blob at its cell. Warden FireImbue has no
				// matching attack-status subsystem yet, but the area consequence is live.
				this.fire.seed(x, y, 2);
				this.say(t('port.log.firebloomignite'), 'negative');
				break;
			case 'stormvine':
				if (this.subclass() === 'warden') addBuff(this.hero, 'levitation');
				else addBuff(this.hero, 'daze');
				this.say(t('port.log.stormvinetwist'), 'negative');
				break;
			case 'swiftthistle':
				// Swiftthistle.TimeBubble freezes other actors for seven hero-time units.
				// Count those units at the automatic-actor boundary instead of granting a
				// free hero action, which would incorrectly skip hunger and buffs.
				this.timeBubbleTurns = 7;
				this.say(t('port.log.swiftthistletime'), 'positive');
				break;
			default:
				this.say(t('port.log.plantwithers'));
		}
		this.featuresMap?.setLayerData('features', this.featureFrames());
	}

	private isChasmCell(x: number, y: number): boolean {
		return Boolean(this.portedPaint && this.level.inside(x, y) && this.portedPaint.map[this.level.index(x, y)] === Terrain.CHASM);
	}

	/** Swiftthistle.TimeBubble.triggerPresses(): activate delayed traps/plants in insertion order. */
	private flushTimeBubblePresses(): void {
		const cells = [...this.timeBubblePresses];
		this.timeBubblePresses.clear();
		for (const cell of cells) {
			if (this.trapKinds.has(cell)) this.triggerTrapAt(cell % this.level.width, Math.floor(cell / this.level.width));
			this.portedFeatures.interact(cell, this);
		}
	}

	/** Java chasms are traversable only by falling; monster pathfinding still sees them as solid.
	 * `Char.flying` (Levitation) makes `Char.move` skip the chasm interaction entirely in real
	 * Java - the same bypass already applied to traps in `triggerTrapAt`. */
	private fallThroughChasm(x: number, y: number): boolean {
		if (!this.isChasmCell(x, y) || this.miningBranchActive || this.depth >= 26 || this.hero.buffs['levitation']) return false;
		this.say(t('port.log.fallchasm'), 'negative');
		this.depth++;
		this.justDescended = true;
		this.enterLevel();
		this.landFromChasm();
		return true;
	}

	/**
	 * `Chasm.heroLand()` (`Chasm.java`): applies on arrival at the new floor, after the fall
	 * itself. Real Java also plays a landing sound, shakes the camera, and lets
	 * `ElixirOfFeatherFall.FeatherBuff` cancel the whole thing outright - none of those exist in
	 * this port (no camera-shake system, no such elixir), so only the two mechanical
	 * consequences are ported: a `Cripple` application and upfront damage scaled the same way
	 * Java's is (`max(HP/2, NormalIntRange(HP/2, HT/4))`, run through the same
	 * Tenacity/Barrier/Iron-Will/Deathless-Fury pipeline every other hero-damage source uses).
	 * Java also applies a separate `Bleeding` DoT here; this port has no distinct Bleeding
	 * buff at all (see the Sacrificial weapon curse's comment elsewhere in this file, which
	 * reuses `poison` as the closest stand-in for that same gap) and does not reuse `poison`
	 * for it either, since a chasm landing's bleed is a second, independent occurrence of a
	 * gap already tracked once - see `PORT_COVERAGE.md`.
	 */
	private landFromChasm(): void {
		if (this.hero.hp <= 0) return;
		addBuff(this.hero, 'cripple');
		const damage = this.absorbHeroDamage(Math.max(Math.floor(this.hero.hp / 2), Random.normalRange(Math.floor(this.hero.hp / 2), Math.floor(this.hero.maxHp / 4))));
		this.hero.hp -= damage;
		this.showDamage(this.hero, damage);
		//death badges (DEATH_FROM_*: trap/fire/poison/hunger/foe - gas/falling/magic variants,
		//including this one, need systems this port has none of, so a chasm death still books
		//as the generic 'foe' bucket via kill()'s default)
		if (this.hero.hp <= 0) this.kill(this.hero);
	}

	/** Pickaxe interaction for adjacent Caves/MiningLevel walls. Java mines ordinary WALL in
	 * one turn and WALL_DECO veins in one turn; only a vein yields DarkGold. */
	private canMineCavesWall(): boolean {
		return Boolean(this.bag.find('pickaxe') && this.depth >= 11 && this.depth <= 15 && this.portedPaint);
	}

	private mineMiningWall(x: number, y: number): boolean {
		const paint = this.portedPaint;
		if (!this.bag.find('pickaxe') || !paint || !this.level.inside(x, y) || this.level.get(x, y) !== WALL) return false;
		const cell = this.level.index(x, y);
		const vein = paint.map[cell] === Terrain.WALL_DECO;
		if (paint.map[cell] !== Terrain.WALL && !vein) return false;
		paint.map[cell] = Terrain.EMPTY_DECO;
		this.level.set(x, y, FLOOR);
		if (vein) {
			this.bag.add({ id: 'darkGold', quantity: 1, stackable: true, identified: true });
			this.say(t('port.log.pickup', { item: t('items.quest.darkgold.name') }), 'positive');
			runState.audio.cue('evoke', 0.7);
		} else {
			runState.audio.cue('mine', 0.7);
		}
		this.restitchTilesAround(x, y);
		this.actionSpentTurn = true;
		this.spendHeroTurn(1);
		return true;
	}

	/**
	 * One monster's turn. Sleeping mobs (Mob.SLEEPING) wake on the real `1/(distance +
	 * stealth)` detection roll while the hero is in their sight - or stay put; waking
	 * spends the turn. Ranged attackers (DM-100's lightning,
	 * Shaman's bolt, Necromancer's 2-10 bolt, Tengu's darts, Trickster's missiles) fire
	 * through `canTarget` when line-of-sight allows instead of pathing into melee; everyone
	 * else hunts through `decideMonsterAI`.
	 */
	private takeMonsterTurn(monster: Creature): void {
		this.pendingMonsterTurnCost = null;
		if (monster.isNPC) return;
		if (monster.isAlly) {
			this.takeAllyTurn(monster);
			return;
		}
		// Hostile mobs now recognize an adjacent friendly summon as a valid combat target.
		// Longer-range special attacks still use their existing hero-only dispatch until their
		// target selection is migrated, but this makes MirrorImage bodies able to intercept
		// ordinary melee turns instead of being harmless scenery.
		const adjacentAlly = this.creatures.find((c) => c.isAlly && c.allyKind !== 'sheep' && c.hp > 0
			&& Roguelike.chebyshevDistance(monster, c) === 1);
		if (adjacentAlly) {
			this.attack(monster, adjacentAlly);
			return;
		}
		//Statue.java is PASSIVE and immobile until struck. `sleeping` is the existing
		//port's compact passive-state flag; the attack path wakes it after damage lands.
		if (monster.kind === 'statue') {
			if (monster.sleeping) return;
			if (Math.max(Math.abs(monster.x - this.hero.x), Math.abs(monster.y - this.hero.y)) === 1) this.attack(monster, this.hero);
			return;
		}
		//Piranha.act(): water-bound mobs die immediately when a room effect or movement
		//places them on land; their pathing may only use water cells.
		if (monster.kind === 'piranha' && this.level.get(monster.x, monster.y) !== WATER) {
			this.kill(monster);
			return;
		}
		// Mob.act() updates enemySeen from the monster's field of view *before* its state
		// moves it. This is what makes the classic door trick work: a snake that steps into
		// the doorway while it cannot yet see the hero remains surprised until its next turn.
		const monsterFov = new Roguelike.FieldOfView(this.level);
		monsterFov.update(monster.x, monster.y, this.viewRadius());
		monster.seesHero = monsterFov.isVisible(this.hero.x, this.hero.y) && (monster.kind === 'sentry' || !this.hero.buffs['invisibility']);
		//ChampionEnemy.Growing.act(): its own real per-turn tick, `+0.01` to the multiplier
		//`meleeDamageFactor`/`damageTakenFactor`/`evasionAndAccuracyFactor` all read from
		//(real Java spends its own separate `4*TICK` actor slot for this; this port folds it
		//into the monster's ordinary turn instead, since it has no secondary-actor scheduling).
		if (monster.champion === 'growing') monster.championPower = (monster.championPower ?? 1.19) + 0.01;
		//dots tick on the sufferer's own turn, like Java's Buff.act()
		const monsterWasBurning = monster.buffs['burning'] !== undefined;
		const monsterWasOozing = monster.buffs['ooze'] !== undefined;
		const dot = tickBuffs(monster);
		if (dot > 0 && !(monster.kind === 'yog' && this.yogShielded(monster)) && !(monster.kind === 'yogFist' && this.guardFist(monster))) {
			const preHp = monster.hp;
			monster.hp -= dot;
			if (monster.kind === 'tengu') this.clampTenguBracket(monster, preHp);
			if (monster.kind === 'yog' && monster.hp > 0) this.yogDamageHook(monster, preHp);
			this.showDamage(monster, dot);
			if (monster.hp <= 0) {
				this.kill(monster);
				return;
			}
			if (monster.kind === 'tengu') this.tenguBracketJump(monster, preHp);
		}
		//Level.java's per-turn WATER hook (see the matching hero-side comment above): no monster
		//kind in this port tracks a real `flying` property (Java's own Bat/Swarm/Eye would be
		//exempt), so this applies uniformly, consistent with that existing simplification.
		//Ooze washes alongside Burning (real Poison shares nothing but the old stand-in).
		if (monsterWasBurning && this.level.get(monster.x, monster.y) === WATER) delete monster.buffs['burning'];
		//Ooze.act()'s own depth-scaled tick for monsters (same formula as the hero side).
		if (monsterWasOozing && monster.hp > 0) {
			const ooze = this.depth > 5 ? 1 + Math.floor(this.depth / 5)
				: this.depth === 5 ? 1 : Random.chance(0.5) ? 1 : 0;
			if (ooze > 0) {
				monster.hp -= ooze;
				this.showDamage(monster, ooze);
				if (monster.hp <= 0) {
					this.kill(monster);
					return;
				}
			}
			if (this.level.get(monster.x, monster.y) === WATER) delete monster.buffs['ooze'];
		}
		//Brute.BruteRage.act(): while active it drains at a flat 4/turn (Java's
		//`AscensionChallenge.statModifier` multiplier is 1 with no ascension-challenge UI), on
		//top of whatever combat damage also lands on it (both drain the same pool). Once it
		//actually reaches 0 this time, the Brute stays dead - `hasRaged` was already set true at
		//the revival, so there is no second one.
		if (monster.kind === 'brute' && monster.raged) {
			monster.hp -= 4;
			if (monster.hp <= 0) {
				this.kill(monster);
				return;
			}
		}
		//ArmoredBrute.ArmoredRage.act(): the same shield, but drains only 1 point every 3rd
		//turn (`spend(3*TICK)`) instead of 4 every turn - "similar rate...much slower" per
		//Java's own comment.
		if (monster.kind === 'armoredBrute' && monster.raged) {
			monster.armoredRageTicks = (monster.armoredRageTicks ?? 0) + 1;
			if (monster.armoredRageTicks >= 3) {
				monster.armoredRageTicks = 0;
				monster.hp -= 1;
				if (monster.hp <= 0) {
					this.kill(monster);
					return;
				}
			}
		}
		if (monster.buffs['paralysis']) return;
		if (monster.buffs['amok']) {
			this.takeAmokTurn(monster);
			return;
		}
		//DemonSpawner: PASSIVE, IMMOVABLE, never attacks - only its spawn-cooldown ticks, and
		//unlike every other monster here that happens regardless of hero distance/sleep state.
		if (monster.kind === 'demonSpawner') {
			this.tickDemonSpawner(monster);
			return;
		}
		//RotHeart: PASSIVE and immobile - never acts at all (placed after the DoT above so
		//burning still destroys it; Java's `destroy()`-vs-`die()` distinction on that path -
		//no death processing - is not reproduced, it dies the ordinary way).
		if (monster.kind === 'rotHeart') return;
		//RotLasher.act(): immobile Waiting - never moves or chases; attacks adjacent foes,
		//and regenerates +5/turn while hurt with no adjacent enemy (a `showHeal` tick stands
		//in for the status text). Terrified lashers hold still like the sentry (see below).
		if (monster.kind === 'rotLasher') {
			const adjacentHero = Roguelike.chebyshevDistance(monster, this.hero) === 1;
			if (!monster.buffs['terror'] && adjacentHero) this.attack(monster, this.hero);
			else if (monster.hp < monster.maxHp && !adjacentHero) {
				const healed = Math.min(monster.maxHp - monster.hp, 5);
				monster.hp += healed;
				this.showHeal(monster, healed);
			}
			return;
		}

		const distance = Math.max(Math.abs(monster.x - this.hero.x), Math.abs(monster.y - this.hero.y));
		if (this.heroClass === 'huntress' && this.talentRank('heightened_senses') > 0 && distance <= (this.talentRank('heightened_senses') === 1 ? 2 : 3)) monster.seesHero = true;
		// Invisibility makes monsters lose their target until the hero attacks or the
		// effect expires. Adjacent monsters retain current awareness, which is the
		// useful Char.canInteract behaviour without a separate target-memory system.
		if (this.hero.buffs['invisibility'] && distance > 1 && monster.kind !== 'sentry') return;
		if (monster.sleeping) {
			//Mob.Sleeping.act(): "debuffs cause mobs to wake as well" - checked first and
			//unconditionally (no roll), before the enemyInFOV-gated detection roll below, since
			//real Java wakes a sleeping monster from being hurt/debuffed even if it still can't
			//see the hero. **Found and fixed in the 2026-09-09 roadmap pass**: standing in fire
			//or a gas blob already applies `burning`/`poison`/`ooze` to a sleeping monster
			//elsewhere in this port (`spreadFire`/`spreadPlantBlobs` don't gate on `sleeping`),
			//it just never woke the monster up before this check existed - checked against each
			//buff's own Java class (`NEGATIVE_BUFFS`, tag `v3.3.8`) for which ones actually
			//carry `buffType.NEGATIVE`.
			const debuffed = Object.keys(monster.buffs).some((id) => NEGATIVE_BUFFS.has(id as BuffId));
			if (!debuffed) {
				//Mob.Sleeping.act(): waking is a per-turn `detectionChance` roll, `1/(distance +
				//stealth)` - here always the hero at stealth 0 (only Obfuscation raises it,
				//unported) - replacing the old flat wake radii (6/3/2) that had no Java basis.
				//Silent Steps (`distance >= 4-points` never wakes) and flying/levitation
				//(`distance >= 2` never wakes) are real immunities, not radius tweaks: Java sets
				//those candidates' chance to infinity, which never beats the initial infinity,
				//so they are never even selected for the roll. Only rolled while the hero is in
				//the mob's sight (see `seesHero` above - invisibility still hides); a woken mob
				//spends its turn waking (`TIME_TO_WAKE_UP`) rather than acting.
				if (!monster.seesHero) return;
				const silent = this.heroClass === 'rogue' ? this.talentRank('silent_steps') : 0;
				const flying = this.hero.buffs['levitation'] !== undefined;
				if ((silent > 0 && distance >= 4 - silent) || (flying && distance >= 2)) return;
				if (!Random.chance(1 / distance)) return;
			}
			monster.sleeping = false;
			this.say(t('port.log.wakes', { who: capitalize(monster.name) }), 'warning');
			//Mob.Sleeping.act()'s real SWARM_INTELLIGENCE hook: every other non-paralyzed,
			//not-yet-HUNTING enemy mob within 8 tiles of the noticing mob (not the hero) also
			//beckons toward the hero's position immediately, rather than each mob only ever
			//noticing independently. This port has no HUNTING/WANDERING state machine, so "not
			//yet HUNTING" is approximated as "not already awake-and-seesHero"; beckoning itself
			//reuses the same `sleeping=false`/`seesHero=true` stand-in ScrollOfRage's own beckon
			//already uses, and distance is this port's usual Chebyshev metric.
			if (isChallengeEnabled('swarm_intelligence')) {
				for (const other of this.creatures) {
					if (other === monster || other.isHero || other.isNPC || other.buffs['paralysis']) continue;
					if (other.sleeping === false && other.seesHero) continue;
					if (Roguelike.chebyshevDistance(monster, other) > 8) continue;
					other.sleeping = false;
					other.seesHero = true;
				}
			}
			return;
		}
		const aggressionTarget = this.aggressionTarget(monster);
		if (aggressionTarget) {
			this.takeAggressionTurn(monster, aggressionTarget);
			return;
		}
		//Monk.act(): `focusCooldown` decays every one of its own turns regardless of range or
		//whether it's currently meleeing, and Focus re-attaches the instant it reaches 0 while
		//HUNTING (this port's closest equivalent state is simply "not sleeping", checked above).
		//Found and fixed a real, previously-undiscovered placement bug auditing this: this check
		//used to sit after the `distance === 1` block below, which returns early for any
		//adjacent monster - so a Monk (or Senior, once included) actively meleeing the hero
		//every turn, the single most common case in a real fight, never advanced its combo
		//timer at all and could never regain Focus after using it once. `Senior extends Monk`
		//and inherits this unchanged (its own `move()` override only adds a faster movement-
		//triggered cooldown reduction, not modeled here since this port's flat per-turn combo
		//timer already doesn't model Monk's own smaller move bonus either - a pre-existing
		//simplification, not newly introduced for Senior) - previously excluded here too by the
		//same literal-kind-check bug already found for ArmoredBrute/DM201.
		if ((monster.kind === 'monk' || monster.kind === 'senior') && !monster.sleeping && !monster.buffs['focus']) {
			monster.combo = (monster.combo ?? 0) + 1;
			if (monster.combo >= 6) {
				monster.combo = 0;
				addBuff(monster, 'focus');
			}
		}
		//ScrollOfTerror.doRead()/Terror.java: real Java's Terror stops the mob attacking the
		//specific reader while otherwise letting it act freely (attack allies, flee toward
		//other exits) - this port's monster-turn model has no per-object avoidance and no
		//monster-vs-ally targeting distinction is now available for allies, but this compact
		//terror implementation still approximates the
		//practical single-hero effect as an always-flee override on the same
		//`decideMonsterAI`/`fleeBelow` mechanism `Thief.FLEEING` already uses, skipping every
		//attack branch below entirely for the turn. The immobile sentry is excluded (it
		//cannot flee) and simply holds fire while terrified - see its own branch.
		if (monster.buffs['terror'] && monster.kind !== 'sentry' && monster.kind !== 'tengu') {
			const blocked = new Set(
				this.creatures.filter((c) => c !== monster && c !== this.hero).map((c) => this.level.index(c.x, c.y))
			);
			this.eternalFireBlockedInto(blocked);
			const decision = Roguelike.decideMonsterAI(this.level, this.pathfinder, monster, monster.hp / monster.maxHp, this.hero, { sightRadius: this.viewRadius(), fleeBelow: 1, blocked });
			if (decision.step) this.moveTo(monster, decision.step);
			return;
		}
		// CrystalMimic remains in FLEEING after revealing itself. Revelation is separate from
		// `stolen`: Java reveals it before the first theft, so an untouched chest must still be
		// able to steal on its first hostile turn.
		if (monster.kind === 'crystalMimic' && monster.mimicRevealed) {
			if (this.fleeCrystalMimic(monster)) return;
			// CrystalMimic.Fleeing.nowhereToRun(): once it is no longer seen and has
			// reached distance 6, Java destroys it instead of invoking normal loot death.
			if (!monster.seesHero && distance >= 6) {
				this.escapeCrystalMimic(monster);
				return;
			}
		}

		//SentryRoom$Sentry.act(): an immobile beam turret - it never moves or melees, so this
		//branch owns its whole turn (placed ahead of the adjacent-attack block below, since
		//even an adjacent hero takes the beam, never a melee swing). The trigger is the
		//sentry's own field of view over its room, collapsed here to line-of-sight like every
		//other ranged mob (the EMPTY_SP/room-rect/lost-inventory conditions have no seam
		//here); invisibility never hides the hero (see the seesHero computation above). The
		//first sighting charges ~2 turns (`dangerDist/3+0.1` discrete), then it fires EVERY
		//visible turn (`curChargeDelay` resets to 1), and looking away resets the slow
		//charge. Shots are the real `NormalIntRange(2+depth/2, 4+depth)` DeathGaze: a magic
		//hit roll at `20+depth*2` accuracy that bypasses armor entirely, like the Eye branch
		//below. Not modeled: the Bestiary.setSeen tick, the travel-interrupt pity, and the
		//charge/zap particles (a port log line stands in for all three).
		if (monster.kind === 'sentry') {
			//Terror stops the sentry firing on the reader (its only conceivable target)
			//without moving it - an immobile turret cannot flee, so the generic flee
			//override above is skipped for this kind instead.
			if (monster.buffs['terror']) return;
			if (!monster.seesHero || !Roguelike.canTarget(this.level, monster, this.hero, { range: 8 })) {
				monster.sentryWarmup = undefined;
				return;
			}
			if ((monster.sentryWarmup ?? 2) > 0) {
				monster.sentryWarmup = (monster.sentryWarmup ?? 2) - 1;
				this.say(t('port.log.sentrycharge'), 'negative');
				return;
			}
			if (!rollHit(monster, this.hero, true)) {
				this.say(t('port.log.sentrymisses'), 'negative');
			} else {
				const dmg = this.absorbHeroDamage(Random.normalRange(2 + Math.floor(this.depth / 2), 4 + this.depth));
				this.hero.hp -= dmg;
				this.showDamage(this.hero, dmg);
				this.say(t('port.log.sentrygaze'), 'negative');
				if (this.hero.hp <= 0) this.kill(this.hero);
			}
			return;
		}
		if (distance === 1) {
			if (monster.kind === 'crystalMimic') {
				this.revealCrystalMimic(monster);
				this.crystalMimicSteal(monster);
				this.attack(monster, this.hero);
				if (monster.hp > 0) this.fleeCrystalMimic(monster);
				return;
			}
			if (monster.kind === 'goo') this.takeGooTurn(monster);
			else if (monster.kind === 'king') this.takeKingTurn(monster);
			//`SpectralNecromancer extends Necromancer` and shares its adjacent-bolt/skeleton-
			//summon behavior unchanged (its own overrides - a wraith-summoning variant and a
			//Scroll of Remove Curse drop - are both beyond this port's scope) - previously
			//excluded here by the same literal-kind-check bug found for ArmoredBrute/DM201/
			//Senior, so a SpectralNecromancer fought as a plain melee attacker with no ranged
			//bolt or skeleton summon at all.
			else if (monster.kind === 'necromancer' || monster.kind === 'spectralNecromancer') this.zapHero(monster, [2, 10]);
			else if (monster.kind === 'gnollTrickster') this.stepAway(monster);
			//Thief.FLEEING never attacks - it runs (same stepper as the Trickster's retreat).
			//`Bandit extends Thief` and shares this unchanged - previously excluded here by the
			//same literal-kind-check bug found for ArmoredBrute/DM201/Senior/SpectralNecromancer.
			else if ((monster.kind === 'thief' || monster.kind === 'bandit') && monster.stolen) this.stepAway(monster);
			//Scorpio refuses adjacent kills - it backs off to keep its range (getFurther).
			//`Acidic extends Scorpio` and shares this unchanged (its own override just adds an
			//Ooze/corrosion proc, already ported separately via the `causticSlime || acidic`
			//branch elsewhere in this file) - previously excluded here by the same literal-
			//kind-check bug found for the other rare variants.
			else if (monster.kind === 'scorpio' || monster.kind === 'acidic') this.stepAway(monster);
			else this.attack(monster, this.hero);
			return;
		}

		//Data-driven dispatch (was a 16-case, 236-line `if (kind === X && cond) {...; return}`
		//cascade - see `rangedAiOverrides`'s own doc comment). `distance` is always >=2 here
		//(the `distance === 1` block above always returns), so every handler below runs only
		//for a non-adjacent monster, matching where each original branch used to sit.
		const rangedOverride = monster.kind ? this.rangedAiOverrides[monster.kind] : undefined;
		if (rangedOverride && rangedOverride(monster, distance)) return;
		const blocked = new Set(
			this.creatures.filter((c) => c !== monster && c !== this.hero).map((c) => this.level.index(c.x, c.y))
		);
		this.eternalFireBlockedInto(blocked);
		if (monster.kind === 'piranha') {
			for (let cell = 0; cell < this.level.cellCount; cell++) {
				if (this.level.terrain[cell] !== WATER && cell !== this.level.index(this.hero.x, this.hero.y)) blocked.add(cell);
			}
		}

		const decision = Roguelike.decideMonsterAI(
			this.level,
			this.pathfinder,
			monster,
			monster.hp / monster.maxHp,
			this.hero,
			{
				sightRadius: this.viewRadius(),
				//Thief.FLEEING once it has stolen something; everyone else fights on (0.25).
				//Bandit extends Thief and shares this unchanged.
				fleeBelow: (monster.kind === 'thief' || monster.kind === 'bandit') && monster.stolen ? 1 : 0.25,
				blocked,
			}
		);

		if (decision.step) this.moveTo(monster, decision.step);
	}

	/** Basic allied Mob.act(): attack the nearest visible hostile, otherwise stay near the
	 * hero. This is the shared combat seam required by MirrorImage and future directable allies;
	 * Java's individual ally subclasses can add richer orders once their own quests are ported. */
	private takeAllyTurn(ally: Creature): void {
		if (ally.buffs['paralysis']) return;
		if (ally.allyKind === 'sheep') {
			ally.sheepTurns = (ally.sheepTurns ?? 1) - 1;
			if ((ally.sheepTurns ?? 0) <= 0) this.kill(ally);
			return;
		}
		const hostiles = this.creatures
			.filter((c) => !c.isHero && !c.isNPC && !c.isAlly && c.hp > 0 && this.fov.isVisible(c.x, c.y))
			.sort((a, b) => Roguelike.chebyshevDistance(ally, a) - Roguelike.chebyshevDistance(ally, b));
		const target = hostiles[0];
		if (target && Roguelike.chebyshevDistance(ally, target) === 1) {
			this.attack(ally, target);
			return;
		}
		const destination = target ?? this.hero;
		if (Roguelike.chebyshevDistance(ally, destination) <= (target ? 1 : 2)) return;
		const blocked = new Set(this.creatures.filter((c) => c !== ally && c !== destination)
			.map((c) => this.level.index(c.x, c.y)));
		this.eternalFireBlockedInto(blocked);
		const next = this.pathfinder.find({ x: ally.x, y: ally.y }, { x: destination.x, y: destination.y }, { blocked })[0];
		if (next) this.moveTo(ally, next);
	}

	/** `Amok.act()` lets a visible mob attack any nearby character, including another hostile
	 * mob or a player-side ally. The real Mob state also has an exact aggro/path memory; this
	 * port's compact turn model expresses the same combat consequence by selecting the nearest
	 * living non-NPC creature within eight tiles and pathing toward it. */
	private takeAmokTurn(monster: Creature): void {
		const target = this.creatures
			.filter((c) => c !== monster && !c.isNPC && c.hp > 0
				&& Roguelike.chebyshevDistance(monster, c) <= 8)
			.sort((a, b) => Roguelike.chebyshevDistance(monster, a) - Roguelike.chebyshevDistance(monster, b))[0];
		if (!target) return;
		if (Roguelike.chebyshevDistance(monster, target) === 1) {
			this.attack(monster, target);
			return;
		}
		const blocked = new Set(this.creatures.filter((c) => c !== monster && c !== target)
			.map((c) => this.level.index(c.x, c.y)));
		this.eternalFireBlockedInto(blocked);
		const next = this.pathfinder.find({ x: monster.x, y: monster.y }, { x: target.x, y: target.y }, { blocked })[0];
		if (next) this.moveTo(monster, next);
	}

	/** Java's hostile-target query considers the hero and friendly summoned characters. Keep
	 * the hero first for equal distances so ordinary runs preserve their previous target and
	 * random stream while a nearer MirrorImage can now draw a ranged attack. */
	private rangedTarget(monster: Creature, range: number): Creature | undefined {
		return [this.hero, ...this.creatures.filter((c) => c.isAlly && c.hp > 0)]
			.filter((target) => target !== monster && Roguelike.canTarget(this.level, monster, target, { range }))
			.sort((a, b) => Roguelike.chebyshevDistance(monster, a) - Roguelike.chebyshevDistance(monster, b))[0];
	}

	private aggressionTarget(monster: Creature): Creature | undefined {
		return this.creatures
			.filter((c) => c !== monster && !c.isNPC && c.hp > 0 && c.buffs['aggression']
				&& Roguelike.canTarget(this.level, monster, c, { range: 8 }))
			.sort((a, b) => Roguelike.chebyshevDistance(monster, a) - Roguelike.chebyshevDistance(monster, b))[0];
	}

	/** `Mob.chooseEnemy()` prioritizes a character carrying `Aggression`, even when that
	 * character is another enemy. This small shared branch applies that priority to all ordinary
	 * movement before per-kind ranged overrides, preserving the stone's forced-target effect. */
	private takeAggressionTurn(monster: Creature, target: Creature): void {
		if (Roguelike.chebyshevDistance(monster, target) === 1) {
			this.attack(monster, target);
			return;
		}
		const blocked = new Set(this.creatures.filter((c) => c !== monster && c !== target)
			.map((c) => this.level.index(c.x, c.y)));
		this.eternalFireBlockedInto(blocked);
		const next = this.pathfinder.find({ x: monster.x, y: monster.y }, { x: target.x, y: target.y }, { blocked })[0];
		if (next) this.moveTo(monster, next);
	}

	/**
	 * Data-driven per-kind ranged/special-turn dispatch for `takeMonsterTurn`'s
	 * non-adjacent case: was a 236-line, 16-case `if (monster.kind === 'x' && cond) { ...;
	 * return; }` cascade, one case per kind, each mutually exclusive since `kind` is a single
	 * string - restructured into an O(1) `Record` lookup instead of a linear string-compare
	 * chain, no behavior change. Each handler returns `true` if it consumed the monster's
	 * turn (the original branch's `return`) or `false` to fall through to the shared movement
	 * AI below (the original branch's condition failing, or no branch matching at all for a
	 * kind with no special ranged ability). A few kinds shared one underlying behavior in the
	 * original cascade (Necromancer/SpectralNecromancer, Scorpio/Acidic, DM200/DM201) - each
	 * still shares one helper method here, just referenced from two registry keys instead of
	 * one `||`-joined condition.
	 */
	private readonly rangedAiOverrides: Record<string, (monster: Creature, distance: number) => boolean> = {
		//DM100.canAttack/doAttack: lightning bolt (Normal(3,10)) over MAGIC_BOLT ballistics when
		//not adjacent - no blast exists in this SPD revision (that is DM200/DM201 territory)
		dm100: (monster) => {
			if (!this.rangedTarget(monster, 6)) return false;
			this.zapHero(monster, [3, 10]);
			return true;
		},
		//Shaman: melee 5-10 adjacent, zap Normal(6,15) at range over MAGIC_BOLT
		shaman: (monster) => {
			if (!this.rangedTarget(monster, 6)) return false;
			this.zapHero(monster, [6, 15]);
			return true;
		},
		//Necromancer: summons while it has none and the hero is close (see `summonSkeleton`
		//for the placement/push-aside/blocker-damage rules), otherwise bolts. The old comment
		//here claimed the push-aside needed a full knockback system - wrong (see above), now
		//ported as a plain neighbour search. SpectralNecromancer shares all of this unchanged.
		necromancer: (monster, distance) => this.necromancerRangedTurn(monster, distance),
		spectralNecromancer: (monster, distance) => this.necromancerRangedTurn(monster, distance),
		tengu: (monster) => { this.takeTenguTurn(monster); return true; },
		dm300: (monster) => { this.takeDM300Turn(monster); return true; },
		yog: (monster) => { this.takeYogTurn(monster); return true; },
		//Warlock DarkBolt, Elemental zap: same MAGIC_BOLT shape as the Shaman's (Warlock's
		//zap is its own 12-18; the Elemental's cooldown and opposite-element rules are not
		//modelled - it simply zaps within its own melee range)
		warlock: (monster) => {
			if (!this.rangedTarget(monster, 6)) return false;
			this.zapHero(monster, [12, 18]);
			return true;
		},
		elemental: (monster) => {
			if (!this.rangedTarget(monster, 5)) return false;
			this.zapHero(monster, [20, 25]);
			return true;
		},
		newbornElemental: (monster) => this.newbornElementalTurn(monster),
		//YogFist: ranged MAGIC_BOLT like its melee. The four Java fist kits are represented by
		//a deterministic debuff rotation until separate fist subclasses are introduced.
		yogFist: (monster) => {
			if (!this.rangedTarget(monster, 6)) return false;
			this.zapHero(monster, [6, 12]);
			monster.combo = ((monster.combo ?? 0) + 1) % 4;
			const effect: BuffId[] = ['burning', 'roots', 'cripple', 'daze'];
			addBuff(this.hero, effect[monster.combo]);
			return true;
		},
		//Scorpio: ranged-only over PROJECTILE ballistics, like the Trickster. Acidic shares this
		//unchanged (see the melee-retreat branch's own comment above, at the `distance === 1` dispatch).
		scorpio: (monster) => this.scorpioRangedTurn(monster),
		acidic: (monster) => this.scorpioRangedTurn(monster),
		//Guard.chain: distance<5 with a projectile path - pulls one cell closer + Cripple 4s.
		//Real Java's `chainsUsed` means a Guard may only ever do this once in its lifetime, not
		//every time the hero re-enters range - previously unmodeled, letting a Guard chain-pull
		//and Cripple-lock the hero repeatedly, something the real game never allows.
		guard: (monster, distance) => {
			if (monster.chainUsed || distance < 2 || distance >= 5 || !Roguelike.canTarget(this.level, monster, this.hero, { range: 5 })) return false;
			this.chainHero(monster);
			return true;
		},
		//DM200.Hunting.act()/canVent() - see `dm200VentAttempt`'s own doc comment for the Java
		//citation. `DM201 extends DM200` and inherits this vent ability unchanged, but is also
		//IMMOVABLE (DM200 itself is not): reaching here without a successful vent means real
		//Java simply does nothing rather than stepping closer like every other non-immobile
		//monster, so DM201's own entry always consumes the turn either way.
		dm200: (monster, distance) => distance >= 2 && this.dm200VentAttempt(monster, distance),
		dm201: (monster, distance) => {
			if (distance >= 2) this.dm200VentAttempt(monster, distance);
			return true;
		},
		//Spinner.Hunting.act()/shootWeb(): while not adjacent and off a 10-turn cooldown, roots
		//the hero directly on a clear shot. Real Java instead predicts the hero's movement
		//direction and seeds a real `Web` terrain blob across three cells (the aimed cell plus
		//its two neighbours) that immobilises whoever stands in it later, not a direct debuff
		//application - this port applies the same "shape not curve" simplification already used
		//for other line-based abilities here (DM200's vent, the Necromancer's bolt), rooting the
		//hero immediately instead of seeding persistent terrain.
		spinner: (monster, distance) => {
			if (distance < 2) return false;
			monster.webCooldown = (monster.webCooldown ?? 0) - 1;
			if ((monster.webCooldown ?? 0) > 0 || !Roguelike.canTarget(this.level, monster, this.hero, { range: 6 })) return false;
			monster.webCooldown = 10;
			addBuff(this.hero, 'roots');
			this.say(t('port.log.spinnerweb'), 'negative');
			return true;
		},
		//Golem.teleportEnemy()/canTele(): while not adjacent and off a 20-turn cooldown, teleports
		//the hero to whichever of the hero's own free 8-neighbours is farthest from the golem
		//(pushing the hero away rather than pulling itself closer). Real Java gates this on a real
		//BFS reachability check around blocking terrain (`canTele`) rather than a hard range, and
		//separately has its own self-teleport-to-reposition ability while wandering (not modelled
		//here, same "shape not curve" simplification already used for DM200/Spinner above) - this
		//port requires a clear line within 8 cells instead.
		golem: (monster, distance) => {
			if (distance < 2) return false;
			monster.golemTeleCooldown = (monster.golemTeleCooldown ?? 0) - 1;
			if ((monster.golemTeleCooldown ?? 0) > 0 || !Roguelike.canTarget(this.level, monster, this.hero, { range: 8 })) return false;
			let best: { x: number; y: number } | null = null;
			let bestDistance = -1;
			for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
				const at = { x: this.hero.x + dx, y: this.hero.y + dy };
				if (!this.level.passable(at.x, at.y) || this.creatureAt(at.x, at.y)) continue;
				const fromGolem = Math.max(Math.abs(at.x - monster.x), Math.abs(at.y - monster.y));
				if (fromGolem > bestDistance) { bestDistance = fromGolem; best = at; }
			}
			if (!best) return false;
			this.moveTo(this.hero, best);
			monster.golemTeleCooldown = 20;
			this.say(t('port.log.golemteleport'), 'negative');
			return true;
		},
		eye: (monster) => this.eyeBeamTurn(monster),
		//GnollTrickster: ranged-only (never adjacent), combo escalates in attack(). Falling
		//through here (out of range) means it's about to move via the shared mover below
		//rather than attack this turn, so its combo resets (see `stepAway`'s own identical
		//reset for the adjacent-retreat case).
		gnollTrickster: (monster) => {
			const target = this.rangedTarget(monster, 6);
			if (!target) {
				monster.combo = 0;
				return false;
			}
			this.attack(monster, target);
			this.spawnProjectile(monster, target);
			return true;
		},
		//GreatCrab.getCloser: only really advances every 3rd turn
		greatCrab: (monster) => {
			monster.moving = (monster.moving ?? 0) + 1;
			if (monster.moving < 3) return true;
			monster.moving = 0;
			return false;
		},
	};

	/** Necromancer/SpectralNecromancer's non-adjacent turn (the adjacent case bolts instead,
	 * handled at the `distance === 1` dispatch via `zapHero` directly). See the
	 * `rangedAiOverrides.necromancer` entry's own comment for the Java citation. */
	private necromancerRangedTurn(monster: Creature, distance: number): boolean {
		const skel = monster.skeleton;
		//Necromancer.onZapComplete(): while its skeleton lives and is in its own sight, it
		//supports rather than attacks directly - heals HT/5 if the skeleton is hurt, else
		//grants it a one-time Adrenaline (reusing this port's existing haste stand-in, since
		//there is no separate Adrenaline buff) once per summon. Previously the necromancer
		//never did either - once summoned, the skeleton just fought alone with no ongoing
		//support at all.
		const skelVisible = skel && skel.hp > 0 && Roguelike.canTarget(this.level, monster, skel, { range: 8 });
		if (skelVisible) {
			if (skel.hp < skel.maxHp) {
				const healed = Math.min(skel.maxHp - skel.hp, Math.round(skel.maxHp / 5));
				skel.hp += healed;
				this.showHeal(skel, healed);
				this.say(t('port.log.necroheal'), 'warning');
				return true;
			}
			if (!skel.hasteTurns) {
				skel.hasteBaseSpeed = skel.speed ?? 1;
				skel.speed = skel.hasteBaseSpeed * 2;
				skel.hasteTurns = 3;
				this.say(t('port.log.necroadrenaline'), 'warning');
				return true;
			}
		}
		//Hunting.act()'s teleport branch: an out-of-sight skeleton not already adjacent to
		//the hero gets teleported to a free cell beside the hero instead, so it can rejoin
		//the fight rather than being stranded wherever it last wandered. Real Java picks the
		//closest such cell that is also in the necromancer's own sight; this port picks any
		//free neighbour, a narrower selection than the real distance-ranked search.
		if (
			skel && skel.hp > 0 && !skelVisible && monster.seesHero &&
			Math.max(Math.abs(skel.x - this.hero.x), Math.abs(skel.y - this.hero.y)) > 1
		) {
			const candidates = Roguelike.neighbourOffsets(8)
				.map(([dx, dy]) => ({ x: this.hero.x + dx, y: this.hero.y + dy }))
				.filter((at) => this.level.passable(at.x, at.y) && !this.creatureAt(at.x, at.y));
			const at = Random.element(candidates);
			if (at) {
				this.moveTo(skel, at);
				this.say(t('port.log.necroteleport'), 'warning');
				return true;
			}
		}
		if ((!skel || skel.hp <= 0) && distance <= 4) {
			this.summonSkeleton(monster);
			return true;
		}
		if (this.rangedTarget(monster, 6)) {
			this.zapHero(monster, [2, 10]);
			return true;
		}
		return false;
	}

	/** Scorpio/Acidic's non-adjacent turn (the adjacent case retreats instead, handled at the
	 * `distance === 1` dispatch via `stepAway`). Scorpio: ranged-only over PROJECTILE
	 * ballistics, like the Trickster. Acidic shares this unchanged. */
	private scorpioRangedTurn(monster: Creature): boolean {
		const target = this.rangedTarget(monster, 6);
		if (!target) return false;
		this.attack(monster, target);
		this.spawnProjectile(monster, target);
		return true;
	}

	/** DM200.Hunting.act()/canVent(): a distance-scaled roll (Random.Int(100/distance)==0 -
	 * farther away is *more* likely, up to 30 turns' cooldown after each vent) seeds toxic gas
	 * along the line to the hero. Real Java's `canVent` also BFS-checks a path exists around
	 * blocking terrain even without line of sight, and retries venting if closing distance
	 * failed; this port requires a clear line instead (a narrower reachability check) and has
	 * no closing-distance-failed fallback - previously DM200 had no special behavior here at
	 * all and fought as a plain melee attacker. */
	private dm200VentAttempt(monster: Creature, distance: number): boolean {
		monster.ventCooldown = (monster.ventCooldown ?? 0) - 1;
		if (
			(monster.ventCooldown ?? 0) <= 0 &&
			Roguelike.canTarget(this.level, monster, this.hero, { range: 8 }) &&
			Random.int(Math.max(1, Math.floor(100 / distance))) === 0
		) {
			this.ventDM200(monster);
			return true;
		}
		return false;
	}

	/** Eye.doAttack()/deathGaze(): a real two-turn ranged beam, not a melee proc - turn 1
	 * charges (Java's own `spend(attackDelay()*2f)`, reproduced via `pendingMonsterTurnCost`;
	 * no damage yet, but the eye takes 1/4 damage meanwhile via the `beamCharged` check
	 * earlier in this file's damage-modifier chain), turn 2 fires along a clear line to the
	 * hero for a real magic hit roll (`hit(this, ch, true)`) and `NormalIntRange(30,50)`
	 * damage - Java's own `ch.damage(dmg, ...)` call bypasses armor/DR entirely here, unlike
	 * `zapHero`'s bolt (which does subtract it), so this doesn't reuse that helper - then a
	 * 4-6 turn cooldown. */
	private eyeBeamTurn(monster: Creature): boolean {
		if ((monster.beamCooldown ?? 0) > 0) monster.beamCooldown = (monster.beamCooldown ?? 0) - 1;
		if (monster.beamCharged) {
			monster.beamCharged = false;
			monster.beamCooldown = 4 + Random.int(3);
			if (Roguelike.canTarget(this.level, monster, this.hero, { range: 8 })) {
				if (!rollHit(monster, this.hero, true)) {
					this.say(t('port.log.eyegazemisses'), 'negative');
				} else {
					const dmg = this.absorbHeroDamage(Random.normalRange(30, 50));
					this.hero.hp -= dmg;
					this.showDamage(this.hero, dmg);
					this.say(t('port.log.eyegaze'), 'negative');
					if (this.hero.hp <= 0) this.kill(this.hero);
				}
			}
			return true;
		}
		if ((monster.beamCooldown ?? 0) <= 0 && Roguelike.canTarget(this.level, monster, this.hero, { range: 8 })) {
			monster.beamCharged = true;
			this.pendingMonsterTurnCost = 2;
			this.say(t('port.log.eyecharge'), 'negative');
			return true;
		}
		return false;
	}

	/** a magic bolt that never misses its roll the melee way - hit(accMulti 2), then damage */
	private zapHero(monster: Creature, damage: [number, number]): void {
		const target = this.rangedTarget(monster, 8);
		if (!target) return;
		if (!rollHit(monster, target, true)) {
			this.say(t('port.log.boltmisses', { who: capitalize(monster.name) }), 'negative');
			return;
		}
		let dmg = Math.max(0, Random.normalRange(damage[0], damage[1]) - Random.normalRange(target.armor[0], target.armor[1]));
		if (target.isHero) dmg = this.absorbHeroDamage(dmg);
		target.hp -= dmg;
		this.showDamage(target, dmg);
		this.sprite(target).setColorAdd(0.6, 0.7, 1);
		this.say(t('port.log.bolthits', { who: capitalize(monster.name), damage: dmg }), 'negative');
		this.spawnProjectile(monster, target);
		//Warlock DarkBolt: a LANDED ranged zap applies the Degrade buff half the time
		//(`Random.Int(2) == 0`, melee never does) - previously a 25% permanent weapon-level
		//decrement on any warlock hit, wrong trigger and wrong effect both. The buff only
		//reduces EFFECTIVE levels (see `degradedLevel`); true levels are untouched, so no
		//decrement happens here at all. No DEGRADE sound cue exists to play.
		if (monster.kind === 'warlock' && target.isHero && target.hp > 0 && Random.int(0, 2) === 0) {
			addBuff(target, 'degrade');
			this.syncHeroFromStats();
			this.say(t('port.log.degrade'), 'negative');
		}
		if (target.hp <= 0) this.kill(target);
	}

	/** Necromancer.summonMinion (`Necromancer.java`): a NecroSkeleton beside the hero.
	 * Real Java splits this across two turns (turn A picks `summoningPos` - the unoccupied,
	 * passable, reachable, in-sight hero-neighbour minimizing `trueDistance` to the necro - and
	 * spends `firstSummon ? TICK : 2*TICK`; turn B summons there), but the placement, push-aside,
	 * and blocker-damage rules below are all real, collapsed into the single turn this port's
	 * `necromancerRangedTurn` already spends on a summon. `trueDistance` is Euclidean, so these
	 * selections use `Math.hypot`, not the Chebyshev ruler used elsewhere here.
	 * Deliberate simplifications: no one-turn telegraph (no `summoning` sprite state exists);
	 * no reachability/FOV gating on the pick (passable + unoccupied only); the LARGE/`openSpace`
	 * gate on push targets is vacuous (no LARGE kinds exist here); the Pushing visual is a log
	 * line. Notably NOT simplified anymore: the old "push-aside needs a full knockback system"
	 * claim was wrong - checked against the source, the rule is just an 8-neighbour search
	 * maximizing distance from the necro, needing no framework primitive at all (and
	 * `Roguelike.knockbackPath`'s straight-line shove would not have matched its
	 * direction-choice logic anyway). Real Java's own turn cost is `firstSummon ? TICK :
	 * 2*TICK` - the very first summon this necromancer ever makes costs the normal 1, every
	 * one after that costs double. */
	private summonSkeleton(necro: Creature): void {
		const summonAt = (at: { x: number; y: number }): void => {
			const skel = this.spawnMonster('necroSkeleton', at);
			skel.sleeping = false;
			necro.skeleton = skel;
			this.pendingMonsterTurnCost = necro.firstSummon === false ? 2 : 1;
			necro.firstSummon = false;
			this.say(t('port.log.summonskeleton'), 'warning');
		};
		//Turn-A pick: unoccupied + passable hero-neighbour minimizing distance to the necro.
		let summoningPos: { x: number; y: number } | null = null;
		let best = Infinity;
		for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
			const at = { x: this.hero.x + dx, y: this.hero.y + dy };
			if (!this.level.passable(at.x, at.y) || this.creatureAt(at.x, at.y)) continue;
			const d = Math.hypot(necro.x - at.x, necro.y - at.y);
			if (d < best) {
				best = d;
				summoningPos = at;
			}
		}
		if (summoningPos) {
			summonAt(summoningPos);
			return;
		}
		//No free cell: Java's turn-B logic on the nearest passable neighbour even when occupied.
		let target: { x: number; y: number } | null = null;
		best = Infinity;
		for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
			const at = { x: this.hero.x + dx, y: this.hero.y + dy };
			if (!this.level.passable(at.x, at.y)) continue;
			const d = Math.hypot(necro.x - at.x, necro.y - at.y);
			if (d < best) {
				best = d;
				target = at;
			}
		}
		//Nowhere passable at all: Java's turn-A wait (spend the turn placing nothing).
		if (!target) return;
		const occupant = this.creatureAt(target.x, target.y);
		if (!occupant) {
			summonAt(target);
			return;
		}
		//Push-aside search: free + passable neighbours of the intended cell maximizing
		//distance from the necro (farthest first, ties keep the first enumerated).
		let pushPos: { x: number; y: number } | null = null;
		let pushBest = Math.hypot(necro.x - target.x, necro.y - target.y);
		for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
			const at = { x: target.x + dx, y: target.y + dy };
			if (!this.level.passable(at.x, at.y) || this.creatureAt(at.x, at.y)) continue;
			const d = Math.hypot(necro.x - at.x, necro.y - at.y);
			if (d > pushBest) {
				pushBest = d;
				pushPos = at;
			}
		}
		if (pushPos) {
			//Immovable occupants are never shoved - the skeleton takes the freed cell instead
			//(`kind` is absent on the hero, who is always pushable, like any ordinary mob).
			if (occupant.kind !== undefined && IMMOVABLE_KINDS.has(occupant.kind)) {
				summonAt(pushPos);
				return;
			}
			this.moveTo(occupant, pushPos);
			this.say(
				t(occupant.isHero ? 'port.log.necropushhero' : 'port.log.necropush', {
					who: capitalize(occupant.name),
				}),
				'warning'
			);
			summonAt(target);
			return;
		}
		//No valid push: `SummoningBlockDamage` - a direct NormalIntRange(2, 10) hit on the
		//blocker with no hit roll (Java calls blocker.damage() straight, never a bolt attack),
		//then wait. Corrected in the same pass: the old fallback fired the generic
		//`zapHero` bolt here, whose magic hit roll could miss and whose armor handling belongs
		//to bolts - and it fired even when no cell was passable at all, where Java waits.
		const raw = Random.normalRange(2, 10);
		if (occupant.isHero) {
			const dmg = this.absorbHeroDamage(raw);
			this.hero.hp -= dmg;
			this.showDamage(this.hero, dmg);
			this.say(t('port.log.necroblockdamagehero', { damage: dmg }), 'negative');
			if (this.hero.hp <= 0) this.kill(this.hero);
		} else {
			//A monster blocker takes the raw roll: the hero's shield pool must not absorb a
			//hit that never targeted the hero (Java runs this through the blocker's own DR;
			//this port tracks no per-monster armor outside the attack pipeline, so no reduction).
			occupant.hp -= raw;
			this.showDamage(occupant, raw);
			this.say(t('port.log.necroblockdamage', { who: capitalize(occupant.name), damage: raw }), 'warning');
			if (occupant.hp <= 0) this.kill(occupant);
		}
	}

	/** `Elemental.NewbornFireElemental`'s telegraphed fireball (`Elemental.java`, checked
	 * against tag `v3.3.8`): while off cooldown it aims at a random free sight-line cell
	 * beside the hero (never its own cell), charges a turn with the real `charging` line,
	 * then detonates a 3x3 blast there - `Fire` seeded at 8 per cell (2 over water, Java's
	 * own volumes) plus `Burning.reignite` on every char caught except itself. Cooldown
	 * re-rolls `3-5` after each blast (and starts there, set at ritual spawn). Melee is the
	 * ordinary shared attack with the newborn's own `[10,12]`/acc-15 stats and no fiery
	 * on-hit (`meleeProc` is a no-op unless ally-summoned, which never happens here).
	 * Simplifications: no `TargetedCell` ground markers or zap visuals (a log line stands
	 * in); the charge spends a plain turn (Java scales `attackDelay()` against the hero's
	 * `cooldown()`, a fractional cost with no expression here); the cooldown ticks only on
	 * ranged turns, not while adjacent (Java's `act()` ticks it every turn); no
	 * quest-score/music side effects on spawn or death (neither system exists). `Frost`
	 * harm and `FIERY` immunity live at their own call sites, shared with the base elemental. */
	private newbornElementalTurn(monster: Creature): boolean {
		const pending = monster.newbornTarget;
		if (pending) {
			monster.newbornTarget = null;
			if (Roguelike.canTarget(this.level, monster, pending, { range: 8 })) {
				for (let dy = -1; dy <= 1; dy++) {
					for (let dx = -1; dx <= 1; dx++) {
						const at = { x: pending.x + dx, y: pending.y + dy };
						if (!this.level.inside(at.x, at.y)) continue;
						this.fire.seed(at.x, at.y, this.level.get(at.x, at.y) === WATER ? 2 : 8);
					}
				}
				//`this.creatures` includes the hero (skipped explicitly, like the ignite
				//loops in `spreadFire`), so no separate hero pass is needed or wanted here.
				for (const target of this.creatures) {
					if (target === monster || target.hp <= 0 || target.isNPC) continue;
					if (target.kind === 'elemental' || target.kind === 'newbornElemental') continue;
					if (Math.abs(target.x - pending.x) > 1 || Math.abs(target.y - pending.y) > 1) continue;
					if (target.buffs['burning']) continue;
					addBuff(target, 'burning');
					if (target.isHero) this.say(t('port.log.firecatches'), 'negative');
				}
			}
			monster.rangedCooldown = Random.normalRange(3, 5);
			return true;
		}
		monster.rangedCooldown = (monster.rangedCooldown ?? 3) - 1;
		if ((monster.rangedCooldown ?? 0) > 0) return false;
		if (!Roguelike.canTarget(this.level, monster, this.hero, { range: 8 })) return false;
		const candidates = Roguelike.neighbourOffsets(8)
			.map(([dx, dy]) => ({ x: this.hero.x + dx, y: this.hero.y + dy }))
			.filter((at) => !(at.x === monster.x && at.y === monster.y)
				&& Roguelike.canTarget(this.level, monster, at, { range: 8 }));
		if (candidates.length === 0) {
			monster.rangedCooldown = 1;
			return false;
		}
		monster.newbornTarget = Random.element(candidates)!;
		this.say(t('port.log.newborncharging'), 'negative');
		return true;
	}

	/** Guard.chain: drag one cell closer through a clear path, then Cripple - once per Guard, ever */
	private chainHero(guard: Creature): void {
		guard.chainUsed = true;
		const dx = Math.sign(this.hero.x - guard.x);
		const dy = Math.sign(this.hero.y - guard.y);
		const at = { x: this.hero.x - dx, y: this.hero.y - dy };
		if ((dx !== 0 || dy !== 0) && this.level.passable(at.x, at.y) && !this.creatureAt(at.x, at.y)) {
			this.moveTo(this.hero, at);
		}
		addBuff(this.hero, 'cripple');
		this.say(t('port.log.chain'), 'negative');
	}

	/** DM200.zap(): toxic gas seeded along the line to the hero (20/cell), 100 at the far end. */
	private ventDM200(monster: Creature): void {
		monster.ventCooldown = 30;
		const line = Roguelike.traceLine(monster, this.hero);
		for (let i = 0; i < line.length - 1; i++) this.plantGas.seed(line[i].x, line[i].y, 20);
		const last = line[line.length - 1]!;
		this.plantGas.seed(last.x, last.y, 100);
		//`DM200.java`'s own `canVent`/vent code has no log line at all (the gas cloud itself is
		//the only real feedback); this port adds one for clarity, so it should at least name the
		//actual venting creature - previously hardcoded "DM-200" even when DM201 vented.
		this.say(t('port.log.dm200vent', { who: capitalize(monster.name) }), 'negative');
	}

	/** GnollTrickster adjacent: never melees - steps further away instead (Hunting.getFurther) */
	private stepAway(monster: Creature): void {
		//GnollTrickster.getCloser(): "if he's moving, he isn't attacking, reset combo."
		if (monster.kind === 'gnollTrickster') monster.combo = 0;
		let best: Step | null = null;
		let bestD = Math.max(Math.abs(monster.x - this.hero.x), Math.abs(monster.y - this.hero.y));
		for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
			const at = { x: monster.x + dx, y: monster.y + dy };
			if (!this.level.passable(at.x, at.y) || this.creatureAt(at.x, at.y)) continue;
			const d = Math.max(Math.abs(at.x - this.hero.x), Math.abs(at.y - this.hero.y));
			if (d > bestD) {
				bestD = d;
				best = at;
			}
		}
		if (best) this.moveTo(monster, best);
	}

	/** CrystalMimic.Fleeing: after revealing/attacking, run to the farthest open neighbour. */
	private fleeCrystalMimic(monster: Creature): boolean {
		let best: Step | null = null;
		let bestDistance = Math.max(Math.abs(monster.x - this.hero.x), Math.abs(monster.y - this.hero.y));
		for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
			const at = { x: monster.x + dx, y: monster.y + dy };
			if (!this.level.passable(at.x, at.y) || this.creatureAt(at.x, at.y)) continue;
			const distance = Math.max(Math.abs(at.x - this.hero.x), Math.abs(at.y - this.hero.y));
			if (distance > bestDistance) {
				bestDistance = distance;
				best = at;
			}
		}
		if (best) {
			this.moveTo(monster, best);
			return true;
		}
		return false;
	}

	/** `CrystalMimic.stopHiding()`: neutral chests get two hasted turns when revealed. */
	private revealCrystalMimic(monster: Creature): void {
		if (monster.mimicRevealed) return;
		monster.mimicRevealed = true;
		monster.sleeping = false;
		if (!monster.hasteTurns) {
			monster.hasteBaseSpeed = monster.speed ?? 1;
			monster.speed = monster.hasteBaseSpeed * 2;
			monster.hasteTurns = 2;
		}
		this.say(t('port.log.mimicreveals'), 'warning');
	}

	/** CrystalMimic.steal(): the first neutral attack may consume one eligible item from
	 * the unequipped backpack. The compact creature payload carries the item family and
	 * concrete class so death can return the same object rather than a generic substitute. */
	private crystalMimicSteal(monster: Creature): void {
		if (monster.stolen || !monster.mimicLoot) return;
		let picked: (typeof this.bag.items)[number] | undefined;
		// Belongings.randomUnequipped() samples the whole backpack, then retries invalid
		// unique/upgraded entries at most ten times. Keep that draw shape in the live bridge.
		for (let tries = 0; tries <= 10; tries++) {
			const candidate = Random.element(this.bag.items);
			if (!candidate) break;
			const unique = ['pickaxe', 'cloak', 'holyTome', 'spiritBow'].includes(candidate.id);
			if (!unique && (candidate.level ?? 0) < 1 && !['gold', 'crystalKey', 'ironKey'].includes(candidate.id)) {
				picked = candidate;
				break;
			}
		}
		if (!picked) {
			monster.stolen = 'none';
			return;
		}
		const sourceClass = (picked as NonNullable<GroundItem['item']>).sourceClass;
		const held = `${picked.id}${sourceClass ? `|${sourceClass}` : ''}`;
		this.bag.remove(picked.id, 1, picked.instanceId);
		monster.stolen = held;
		monster.mimicLoot += `;held:${held}`;
	}

	private escapeCrystalMimic(monster: Creature): void {
		const index = this.creatures.indexOf(monster);
		if (index < 0) return;
		this.scheduler.remove(monster);
		this.creatures.splice(index, 1);
		this.monsterMotion.get(this.sprite(monster))?.clear();
		this.monsterMotion.delete(this.sprite(monster));
		this.healthBars.get(monster)?.destroy();
		this.healthBars.delete(monster);
		this.sprite(monster).destroy();
		this.spriteFor.delete(monster.id);
		this.say(t('port.log.mimicescapes'), 'warning');
	}

	/**
	 * Tengu: melee acc 10 adjacent, ranged acc 20 otherwise (the dart half of attackSkill).
	 * Below half HP a bomb-ability rotation joins the darts (see below); relocation rides
	 * the damage hook (`tenguBracketJump`), not the turn.
	 */
	private takeTenguTurn(tengu: Creature): void {
		const distance = Math.max(Math.abs(tengu.x - this.hero.x), Math.abs(tengu.y - this.hero.y));
		if (distance > 1) {
			if (Roguelike.canTarget(this.level, tengu, this.hero, { range: 8 })) {
				this.say(t('port.log.tengudart'), 'negative');
				this.attack({ ...tengu, kind: undefined, accuracy: 20 }, this.hero);
				this.spawnProjectile(tengu, this.hero);
			} else {
				const blocked = new Set(
					this.creatures.filter((c) => c !== tengu && c !== this.hero).map((c) => this.level.index(c.x, c.y))
				);
				const decision = Roguelike.decideMonsterAI(this.level, this.pathfinder, tengu, tengu.hp / tengu.maxHp, this.hero, {
					sightRadius: this.viewRadius(),
					blocked,
				});
				if (decision.step) this.moveTo(tengu, decision.step);
			}
		} else {
			this.attack(tengu, this.hero);
		}

		//Phase-2 ability rotation, bombs only: the first two scripted uses are Bomb then
		//Shocker, then random among the three (plus bonus Fire on the bosses challenge) -
		//but Fire's spreading cone and Shocker's anchored bursts each need systems this
		//port doesn't have, so only the Bomb ability (whose fuse-and-blast machinery is
		//real since the Bomb item pass) is live, on a flat every-third-turn cadence below
		//half HP rather than Java's catch-up scheduler (`targetAbilityUses = 1+2*jumps`) -
		//stated cadence simplification, not a silent one.
		if (tengu.hp * 2 <= tengu.maxHp && tengu.hp > 0) {
			tengu.tenguAbilityCd = (tengu.tenguAbilityCd ?? 2) - 1;
			if (tengu.tenguAbilityCd <= 0) {
				tengu.tenguAbilityCd = 3;
				this.tenguThrowBomb(tengu);
			}
		}
	}

	/** Tengu.damage(): HP cannot cross more than one 1/8-bracket (`HT/8`, integer) per hit -
	 * a multi-bracket blow floors at the next bracket +1. Java tracks the bracket
	 * persistently; deriving it from pre-hit HP is equivalent since brackets only move
	 * down. Lethal hits kill normally (phase transitions own death, not the clamp). */
	private clampTenguBracket(tengu: Creature, preHp: number): void {
		if (tengu.kind !== 'tengu' || tengu.hp <= 0 || preHp <= 0) return;
		const bracket = Math.max(1, Math.floor(tengu.maxHp / 8));
		if (tengu.hp <= (Math.floor(preHp / bracket) - 1) * bracket) {
			tengu.hp = (Math.floor(preHp / bracket) - 1) * bracket + 1;
		}
	}

	/** Tengu's per-bracket `jump()`: relocate 5-7 away with the trap burst, capped at 4
	 * jumps (`arenaJumps`, Java's own phase-2 cap - without a FIGHT_START/ARENA room split
	 * the whole fight runs under these rules). The first jump keeps the old vanish flavor
	 * (the phase-shift moment); every jump re-seeds the burst. Called from damage sites
	 * after the hit resolves (Java queues it past the full attack the same way). */
	private tenguBracketJump(tengu: Creature, preHp: number): void {
		if (tengu.kind !== 'tengu' || tengu.hp <= 0 || (tengu.arenaJumps ?? 0) >= 4) return;
		const bracket = Math.max(1, Math.floor(tengu.maxHp / 8));
		if (Math.floor(preHp / bracket) === Math.floor(tengu.hp / bracket)) return;
		for (let attempt = 0; attempt < 20; attempt++) {
			const room = this.level.rooms[Random.int(0, this.level.rooms.length)];
			const at = { x: Random.range(room.left, room.right), y: Random.range(room.top, room.bottom) };
			const d = Math.max(Math.abs(at.x - this.hero.x), Math.abs(at.y - this.hero.y));
			if (d < 5 || d > 7 || !this.level.passable(at.x, at.y) || this.creatureAt(at.x, at.y)) continue;
			this.moveTo(tengu, at);
			tengu.arenaJumps = (tengu.arenaJumps ?? 0) + 1;
			this.seedBossTrap(at, 'explosive');
			for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1]] as const) {
				const trap = { x: at.x + dx, y: at.y + dy };
				if (this.level.passable(trap.x, trap.y) && !this.creatureAt(trap.x, trap.y)) this.seedBossTrap(trap, dx === 0 ? 'burning' : 'poisonDart');
			}
			this.say(t('port.log.tenguvanish'), 'warning');
			this.say(t('port.log.tengutraps'), 'warning');
			break;
		}
	}

	/** Tengu.throwBomb(): the free non-solid cell adjacent to the hero nearest Tengu (with
	 * no lit bomb already there) gets a 3-turn `tenguBomb` fuse - the range-2 scaled blast
	 * reuses `detonateGroundBomb` via the payload flag. When no cell is free the ability
	 * fizzles (Java falls back to Fire, which needs its cone system - stated gap). */
	private tenguThrowBomb(tengu: Creature): void {
		const cells: { x: number; y: number }[] = [];
		for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
			const at = { x: this.hero.x + dx, y: this.hero.y + dy };
			if (!this.level.inside(at.x, at.y) || !this.level.passable(at.x, at.y)) continue;
			if (this.isChasmCell(at.x, at.y) || this.groundItemAt(at.x, at.y)) continue;
			cells.push(at);
		}
		if (cells.length === 0) return;
		cells.sort((a, b) => Math.hypot(a.x - tengu.x, a.y - tengu.y) - Math.hypot(b.x - tengu.x, b.y - tengu.y));
		const at = cells[0]!;
		this.spawnGroundItem('bomb', at.x, at.y, { id: 'bomb', quantity: 1, identified: true, sourceClass: 'Bomb', fuseTurns: 3, tenguBomb: true });
		this.say(t('port.log.tengubomb'), 'warning');
	}

	/** Java CavesBossLevel seals its arena when the hero approaches a pylon. */
	private checkCavesBossPylonGate(): void {
		if (this.depth !== 15 || this.cavesBossSealed) return;
		const boss = this.creatures.find((creature) => creature.kind === 'dm300' && creature.hp > 0);
		if (!boss) return;
		const nearPylon = this.cavesBossPylons.some((pylon) =>
			Math.max(Math.abs(this.hero.x - pylon.x), Math.abs(this.hero.y - pylon.y)) <= 2
		);
		if (!nearPylon) return;
		this.cavesBossSealed = true;
		this.cavesBossEnergyTurns = 3;
		this.say(t('port.log.dm300overcharge'), 'warning');
		for (const pylon of this.cavesBossPylons) {
			for (const [dx, dy] of Roguelike.neighbourOffsets(4)) {
				const at = { x: pylon.x + dx, y: pylon.y + dy };
				if (this.level.passable(at.x, at.y) && !this.creatureAt(at.x, at.y)) this.fire.seed(at.x, at.y, 2);
			}
		}
	}

	/** Existing fire/blob mechanics provide the short-lived pylon electricity pressure. */
	private tickCavesBossEnergy(): boolean {
		if (this.depth !== 15 || !this.cavesBossSealed || this.cavesBossEnergyTurns <= 0) return false;
		const nearPylon = this.cavesBossPylons.some((pylon) =>
			Math.max(Math.abs(this.hero.x - pylon.x), Math.abs(this.hero.y - pylon.y)) <= 2
		);
		if (!nearPylon) return false;
		this.cavesBossEnergyTurns--;
		const damage = Random.normalRange(6, 12);
		const blocked = this.absorbHeroDamage(damage);
		this.hero.hp -= blocked;
		this.showDamage(this.hero, damage);
		this.say(t('port.log.affliction', { damage }), 'negative');
		if (this.hero.hp <= 0) {
			this.kill(this.hero, 'trap');
			return true;
		}
		return false;
	}

	/**
	 * DM-300: GAS/ROCKS ability rotation on a `NormalIntRange(5,9)` cooldown (7 max on the
	 * bosses challenge), first pick 50/50, then 1-in-4 to repeat GAS and 3-in-4 to repeat
	 * ROCKS. GAS vents live `toxicGas` along the trajectory (100 at the collision cell, 20
	 * per path cell, topped up around the hero to 250 total, doubled on the challenge).
	 * ROCKS schedules a telegraphed 7x7 rockfall that slams after 2 turns for
	 * `NormalIntRange(6,12)` (10-20 on the challenge) plus brief paralysis. The old
	 * every-3rd-turn fire-ring + double-strike had no Java basis and is gone. Remaining:
	 * the pylon/supercharge state (invulnerability, speed x2, pylon activation), the
	 * can't-reach targeting refinements (cone-AOE trickshotting, inorganic rule - the hero
	 * is never inorganic), and Java's adjacent-only turn spend (abilities cost the full
	 * turn here either way - 1-turn granularity, stated).
	 */
	private takeDM300Turn(dm300: Creature): void {
		if ((dm300.dmAbilityTurns ?? -1) < 0) dm300.dmAbilityTurns = 0;
		else dm300.dmAbilityTurns = (dm300.dmAbilityTurns ?? 0) + 1;
		const maxCooldown = isChallengeEnabled('stronger_bosses') ? 7 : 9;
		if (dm300.seesHero && (dm300.dmAbilityTurns ?? 0) > (dm300.dmAbilityCd ?? 5)) {
			const last = dm300.dmLastAbility ?? 0;
			let pick: number;
			if (last === 0) pick = Random.int(0, 2) === 0 ? 1 : 2;
			else if (last === 1) pick = Random.int(0, 4) === 0 ? 1 : 2;
			else pick = Random.int(0, 4) !== 0 ? 1 : 2;
			dm300.dmLastAbility = pick;
			dm300.dmAbilityTurns = 0;
			dm300.dmAbilityCd = Random.normalRange(5, maxCooldown);
			if (pick === 1) this.dm300VentGas(dm300);
			else this.dm300Rockfall(dm300);
			return;
		}
		const distance = Math.max(Math.abs(dm300.x - this.hero.x), Math.abs(dm300.y - this.hero.y));
		if (distance <= 1) {
			this.attack(dm300, this.hero);
			return;
		}
		const blocked = new Set(
			this.creatures.filter((c) => c !== dm300 && c !== this.hero).map((c) => this.level.index(c.x, c.y))
		);
		const decision = Roguelike.decideMonsterAI(this.level, this.pathfinder, dm300, dm300.hp / dm300.maxHp, this.hero, {
			sightRadius: this.viewRadius(),
			blocked,
		});
		if (decision.step) this.moveTo(dm300, decision.step);
	}

	/** DM300.ventGas(): toxic gas along a STOP_TARGET trajectory at the hero (100 at the
	 * collision cell, 20 per path cell, neighbours topped up to 250 total; doubled on the
	 * bosses challenge). The trajectory is greedy Chebyshev stepping (no ballistics
	 * primitive exists); the delayed-VFX-actor timing, GAS sound, and travel interrupt are
	 * presentation this port has no seam for - the gas lands immediately with a log line. */
	private dm300VentGas(dm300: Creature): void {
		const multi = isChallengeEnabled('stronger_bosses') ? 2 : 1;
		const path: { x: number; y: number }[] = [];
		let at = { x: dm300.x, y: dm300.y };
		for (let i = 0; i < 64; i++) {
			const dx = Math.sign(this.hero.x - at.x), dy = Math.sign(this.hero.y - at.y);
			if (dx === 0 && dy === 0) break;
			const nx = at.x + dx, ny = at.y + dy;
			if (!this.level.inside(nx, ny) || !this.level.passable(nx, ny)) break;
			at = { x: nx, y: ny };
			path.push(at);
			if (nx === this.hero.x && ny === this.hero.y) break;
		}
		let vented = 0;
		for (const cell of path) {
			this.toxicGas.seed(cell.x, cell.y, 20 * multi);
			vented += 20 * multi;
		}
		const collision = path[path.length - 1];
		if (collision) {
			this.toxicGas.seed(collision.x, collision.y, 100 * multi);
			vented += 100 * multi;
		}
		if (vented < 250 * multi) {
			const around = Math.ceil((250 * multi - vented) / 8);
			for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
				const nx = this.hero.x + dx, ny = this.hero.y + dy;
				if (this.level.inside(nx, ny) && this.level.passable(nx, ny)) this.toxicGas.seed(nx, ny, around);
			}
		}
		this.say(t('actors.mobs.dm300.vent'), 'warning');
	}

	/** DM300 rockfall: a 7x7 centred on the hero minus one safe neighbour (solid cells
	 * retried at 50%, like Java; the pylon-energy retry has no equivalent blob), where each
	 * cell joins with chance `1/distance` (distance-0/1 always join - `Random.Int(0/1)` is
	 * trivially 0). Slams after 2 hero turns (`gate(TICK, ceil(cooldown), 3*TICK)`
	 * collapses to the middle at this port's 1-turn granularity) for the real
	 * `NormalIntRange(6,12)` (10-20 on the challenge) to everything but DM-300 itself, plus
	 * Paralysis 3 (5 on the challenge). A port log line stands in for the red target cells.
	 */
	private dm300Rockfall(dm300: Creature): void {
		const safe = (() => {
			for (let attempt = 0; attempt < 20; attempt++) {
				const [dx, dy] = Roguelike.neighbourOffsets(8)[Random.int(8)]!;
				const at = { x: this.hero.x + dx, y: this.hero.y + dy };
				if (!this.level.inside(at.x, at.y) || (at.x === dm300.x && at.y === dm300.y)) continue;
				if (!this.level.passable(at.x, at.y) && Random.int(0, 2) === 0) continue;
				return at;
			}
			return null;
		})();
		const cells: { x: number; y: number }[] = [];
		for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
			const at = { x: this.hero.x + dx, y: this.hero.y + dy };
			if (!this.level.inside(at.x, at.y) || !this.level.passable(at.x, at.y)) continue;
			if (safe && at.x === safe.x && at.y === safe.y) continue;
			const d = Math.max(Math.abs(dx), Math.abs(dy));
			if (d <= 1 || Random.int(d) === 0) cells.push(at);
		}
		if (cells.length > 0) this.fallingRocks.push({ cells, turns: 2 });
		this.say(t('actors.mobs.dm300.rocks'), 'warning');
	}

	/** `FallingRockBuff` landing: damage + brief paralysis on every cell, DM-300 excluded
	 * (Pylons don't exist here to exclude). Runs from the end-of-turn pipeline next to the
	 * bomb-fuse tick; floor save/load carries unexploded volleys like any other heap state.
	 * Returns true when a rock kills the hero, stopping the sequence like bomb blasts do. */
	private tickFallingRocks(): boolean {
		let heroDied = false;
		for (const volley of [...this.fallingRocks]) {
			volley.turns--;
			if (volley.turns > 0) continue;
			this.fallingRocks.splice(this.fallingRocks.indexOf(volley), 1);
			const challenge = isChallengeEnabled('stronger_bosses');
			for (const cell of volley.cells) {
				const target = this.creatureAt(cell.x, cell.y);
				if (!target || target.hp <= 0 || target.kind === 'dm300') continue;
				const dmg = Random.normalRange(challenge ? 10 : 6, challenge ? 20 : 12);
				if (target.isHero) {
					const blocked = this.absorbHeroDamage(dmg);
					this.hero.hp -= blocked;
					this.showDamage(this.hero, dmg);
					if (this.hero.hp <= 0) {
						this.say(t('port.log.rockfallkill'), 'negative');
						this.kill(this.hero);
						heroDied = true;
					} else if (challenge) this.hero.buffs['paralysis'] = 5;
					else addBuff(this.hero, 'paralysis');
				} else {
					const hurt = Math.max(0, dmg - Random.normalRange(target.armor[0], target.armor[1]));
					target.hp -= hurt;
					this.showDamage(target, hurt);
					if (target.hp <= 0) this.kill(target);
					else if (challenge) target.buffs['paralysis'] = 5;
					else addBuff(target, 'paralysis');
				}
			}
		}
		return heroDied;
	}

	private seedBossTrap(at: Step, kind: TrapKind): void {
		if (!this.level.inside(at.x, at.y) || this.level.get(at.x, at.y) === WALL) return;
		this.secrets.conceal(at.x, at.y, this.level.get(at.x, at.y), TRAP);
		this.trapKinds.set(this.level.index(at.x, at.y), kind);
	}

	/**
	 * DwarfKing phase machine (1/2/3), replacing the old BossPhases/AbilityCycle sketch -
	 * whose half-HP Fury has no Java basis at all (DwarfKing.java never touches Fury) and
	 * whose "hold the barrier while adds live" turn is backwards (the real barrier is a
	 * shield pool on the King himself, not inaction). P1 hunts with summon/ability cooldowns
	 * (LINK/TELE-lite); at HP<=50 (100 on the bosses challenge) P2 makes him immobile with a
	 * full-HP shield and escalating ghoul/monk/warlock/golem waves that chip him as they land
	 * (`KingDamager` HT/12, HT/18 on the challenge); at shield 0, P3 bleeds (the bar's own
	 * 25% tint covers it), summons while fewer than 4 adds stand, and yells once under 20 HP.
	 * Not modeled: throne geometry (he stands his ground instead of teleporting to it),
	 * P3 viscosity-deferral (no Viscosity system), the King's Crown drop (no crown item),
	 * LloydsBeacon upgrade, and presentation (particles/sounds). Summon/ability cooldown
	 * damage-acceleration in P1 is exact (`-= taken/8`).
	 */
	/**
	 * DwarfKing's three one-way phase transitions (P1->P2 at an HP threshold, P2->P3 at
	 * shield-zero, and P3's one-time "losing" yell under 20 HP), as `mwg/core`'s
	 * `ReactionTable` rules instead of hand-rolled `if (...) { ...; phase = X; }` transition
	 * blocks each guarded by its own ad-hoc latch field. `once: true` matches Java's actual
	 * one-way transitions exactly - the same "boss entering phase two" shape `ReactionTable`'s
	 * own doc comment uses as its worked example. Rules close over this specific `king`
	 * instance (built fresh per King, not shared), so `action` mutates it directly rather than
	 * through the (`Readonly`-typed) `state` parameter `check()` passes.
	 */
	private kingPhaseRules(king: Creature): ReactionRule<Creature>[] {
		return [
			{
				id: 'kingPhase2',
				when: (k) => (k.kingPhase ?? 1) === 1 && k.hp <= (isChallengeEnabled('stronger_bosses') ? 100 : 50),
				action: () => {
					const threshold = isChallengeEnabled('stronger_bosses') ? 100 : 50;
					king.hp = threshold;
					king.kingPhase = 2;
					king.kingSummonsMade = 0;
					king.kingShield = king.maxHp;
					for (const add of [...this.kingAdds]) if (add.hp > 0) this.kill(add);
					this.kingLinkedAdds.clear();
					this.say(t('port.log.kingphase2'), 'warning');
				},
				once: true,
			},
			{
				id: 'kingPhase3',
				when: (k) => (k.kingPhase ?? 1) === 2 && (k.kingShield ?? 0) <= 0,
				action: () => {
					king.kingPhase = 3;
					king.kingSummonsMade = 1;
					this.say(t('actors.mobs.dwarfking.enraged', { '0': t(CLASS_KEYS[this.heroClass]) }), 'warning');
				},
				once: true,
			},
			{
				id: 'kingLosingYell',
				when: (k) => k.hp < 20,
				action: () => this.say(t('actors.mobs.dwarfking.losing'), 'warning'),
				once: true,
			},
		];
	}

	private takeKingTurn(king: Creature): void {
		const challenge = isChallengeEnabled('stronger_bosses');
		king.kingReactions ??= new ReactionTable<Creature>(this.kingPhaseRules(king));
		king.kingReactions.check(king);
		const phase = king.kingPhase ?? 1;
		if (phase === 1) {
			king.kingSummonCd = (king.kingSummonCd ?? 0) - 1;
			if ((king.kingSummonCd ?? 0) <= 0) {
				if (this.summonKingAdd(king, this.kingP1Summon((king.kingSummonsMade ?? 0), challenge))) {
					king.kingSummonsMade = (king.kingSummonsMade ?? 0) + 1;
					king.kingSummonCd = Random.normalRange(challenge ? 8 : 10, challenge ? 10 : 14);
				}
			}
			king.kingAbilityCd = (king.kingAbilityCd ?? 0) - 1;
			if ((king.kingAbilityCd ?? 0) <= 0 && this.kingAbility(king)) {
				king.kingAbilityCd = Random.normalRange(challenge ? 8 : 10, challenge ? 10 : 14);
				return;
			}
		}
		if (phase === 2) {
			this.kingWave(king, challenge);
			return;
		}
		if (phase === 3) {
			const adds = [...this.kingAdds].filter((add) => add.hp > 0);
			if (adds.length < 4) this.summonKingAdd(king, this.kingP1Summon(king.kingSummonsMade ?? 1, challenge));
		}
		const distance = Math.max(Math.abs(king.x - this.hero.x), Math.abs(king.y - this.hero.y));
		if (distance <= 1) {
			this.attack(king, this.hero);
			return;
		}
		const blocked = new Set(
			this.creatures.filter((c) => c !== king && c !== this.hero).map((c) => this.level.index(c.x, c.y))
		);
		const decision = Roguelike.decideMonsterAI(this.level, this.pathfinder, king, king.hp / king.maxHp, this.hero, {
			sightRadius: this.viewRadius(),
			blocked,
		});
		if (decision.step) this.moveTo(king, decision.step);
	}

	/** P1/P3 summon rotation: every 4th summon (3rd on the challenge, 9th a golem there)
	 * is a monk or warlock, otherwise a ghoul. Delayed-arrival `Summoning` buffs collapse
	 * to instant spawns (1-turn granularity, like abilities). */
	private kingP1Summon(made: number, challenge: boolean): 'ghoul' | 'monk' | 'warlock' | 'golem' {
		if (challenge) {
			if (made % 3 === 2) return made % 9 === 8 ? 'golem' : Random.int(0, 2) === 0 ? 'monk' : 'warlock';
			return 'ghoul';
		}
		if (made % 4 === 3) return Random.int(0, 2) === 0 ? 'monk' : 'warlock';
		return 'ghoul';
	}

	/** One royal servant beside the King (neighbour cells only, like the old guard calls);
	 * tracked for LifeLink subjects, wave counts, and death cleanup. */
	private summonKingAdd(king: Creature, kind: 'ghoul' | 'monk' | 'warlock' | 'golem'): boolean {
		for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
			const at = { x: king.x + dx, y: king.y + dy };
			if (!this.level.passable(at.x, at.y) || this.creatureAt(at.x, at.y)) continue;
			const add = this.spawnMonster(kind, at);
			add.sleeping = false;
			this.kingAdds.add(add);
			this.say(t('port.log.kingadds'), 'warning');
			return true;
		}
		return false;
	}

	/** P1 LINK/TELE-lite over the live servants (skeletons are never subjects in Java -
	 * only ghouls/monks/warlocks/golems, which is all this court ever holds). LINK marks
	 * the furthest unlinked servant (damage to it splits onto the King - see `attack()`);
	 * TELE relocates the furthest servant beside the hero with the real yell. First pick
	 * is 50/50, then 1-in-8 to repeat LINK, 7-in-8 to repeat TELE. */
	private kingAbility(king: Creature): boolean {
		const subjects = [...this.kingAdds].filter((add) => add.hp > 0
			&& (add.kind === 'ghoul' || add.kind === 'monk' || add.kind === 'warlock' || add.kind === 'golem'));
		if (subjects.length === 0) return false;
		const last = king.kingLastAbility ?? 0;
		const pick = last === 0 ? (Random.int(0, 2) === 0 ? 1 : 2)
			: last === 1 ? (Random.int(0, 8) === 0 ? 1 : 2)
			: (Random.int(0, 8) !== 0 ? 1 : 2);
		const furthest = (list: Creature[]): Creature | null => {
			let best: Creature | null = null;
			let bestDist = -1;
			for (const m of list) {
				const d = Math.hypot(m.x - king.x, m.y - king.y);
				if (d > bestDist) { bestDist = d; best = m; }
			}
			return best;
		};
		if ((pick === 1 || subjects.every((s) => this.kingLinkedAdds.has(s)))) {
			const target = furthest(subjects.filter((s) => !this.kingLinkedAdds.has(s)));
			if (pick === 1 && target) {
				king.kingLastAbility = 1;
				this.kingLinkedAdds.add(target);
				this.say(t('port.log.kinglink'), 'warning');
				return true;
			}
		}
		const target = furthest(subjects);
		if (target) {
			king.kingLastAbility = 2;
			const spots = Roguelike.neighbourOffsets(8)
				.map(([dx, dy]) => ({ x: this.hero.x + dx, y: this.hero.y + dy }))
				.filter((at) => this.level.inside(at.x, at.y) && this.level.passable(at.x, at.y) && !this.creatureAt(at.x, at.y));
			spots.sort((a, b) => Math.hypot(a.x - king.x, a.y - king.y) - Math.hypot(b.x - king.x, b.y - king.y));
			if (spots[0]) this.moveTo(target, spots[0]);
			this.say(t(Random.int(0, 2) === 0 ? 'actors.mobs.dwarfking.teleport_1' : 'actors.mobs.dwarfking.teleport_2'), 'warning');
			return true;
		}
		return false;
	}

	/** P2 wave schedule (non-challenge counts shown; challenge doubles early waves and adds
	 * golems): ghouls, then ghouls plus a monk, then the full warlock/monk/ghoul/ghoul
	 * set - each batch chipping the King's own shield (`KingDamager` HT/12, HT/18 on the
	 * challenge). Wave yells are real, placed exactly where Java yells them. */
	private kingWave(king: Creature, challenge: boolean): void {
		const made = king.kingSummonsMade ?? 0;
		const shield = king.kingShield ?? 0;
		const batch: ('ghoul' | 'monk' | 'warlock' | 'golem')[] = [];
		if (!challenge) {
			if (made >= 4 && (shield > 200 || made >= 8) && (shield > 100 || made >= 12)) return;
			if (made < 4) {
				if (made === 0) this.say(t('actors.mobs.dwarfking.wave_1'), 'warning');
				batch.push('ghoul');
			} else if (shield <= 200 && made < 8) {
				if (made === 4) this.say(t('actors.mobs.dwarfking.wave_2'), 'warning');
				if (made === 7) batch.push(Random.int(0, 2) === 0 ? 'monk' : 'warlock');
				else batch.push('ghoul');
			} else if (shield <= 100 && made < 12) {
				batch.push('warlock', 'monk', 'ghoul', 'ghoul');
			} else return;
			king.kingSummonsMade = shield <= 100 && made < 12 && made >= 8 ? 12 : made + batch.length;
		} else {
			if (made >= 6 && (shield > 300 || made >= 12) && (shield > 150 || made >= 18)) return;
			if (made < 6) {
				if (made === 0) this.say(t('actors.mobs.dwarfking.wave_1'), 'warning');
				batch.push('ghoul', 'ghoul');
			} else if (shield <= 300 && made < 12) {
				if (made === 6) this.say(t('actors.mobs.dwarfking.wave_2'), 'warning');
				batch.push('ghoul', 'ghoul', made === 6 ? 'monk' : 'warlock');
			} else if (shield <= 150 && made < 18) {
				if (made === 12) {
					this.say(t('actors.mobs.dwarfking.wave_3'), 'warning');
					batch.push('warlock', 'monk', 'ghoul', 'ghoul');
				} else batch.push('golem', 'golem');
			} else return;
			king.kingSummonsMade = made + batch.length;
		}
		for (const kind of batch) this.summonKingAdd(king, kind);
		king.kingShield = Math.max(0, shield - Math.floor(king.maxHp / (challenge ? 18 : 12)));
	}

	/**
	 * Yog-Dzewa through BossPhases: each crossed HP gate tears open another fist (Java's
	 * gates sit at HT-300*phase with several fist types; here three fists cycle their
	 * ranged debuffs). While any fist lives the fists fight and Yog holds its beams; fistless, it
	 * beams over line-of-sight. Larva/Ripper summons and the fistless-P5 bleed are not
	 * modelled.
	 */
	private takeYogTurn(yog: Creature): void {
		//Fists gate the beam (`isInvulnerable` while any lives - see `yogShielded`); a
		//fistless Yog beams over line-of-sight. Fist spawns, HP-gate floors, and phase
		//advancement all ride the damage hook (`yogDamageHook`), never the turn - the old
		//BossPhases turn-spawner double-spawned against the hook and is gone.
		const fists = this.creatures.filter((c) => c.kind === 'yogFist' && c.hp > 0);
		if (fists.length > 0) return;
		if (Roguelike.canTarget(this.level, yog, this.hero, { range: 8 })) {
			this.say(t('port.log.yogbeam'), 'warning');
			this.zapHero(yog, [8, 16]);
		}
	}

	/** YogFist.isNearYog(): within 4 cells of a live Yog (the real anchor is the exit+3
	 * arena spot Yog never leaves; live-position distance is equivalent while it holds).
	 * Near fists are invulnerable to everything - pull them away to kill them. Warns once
	 * per fight (Java warns once per fist; the per-fist latch has no seam here). */
	private fistNearYog(fist: Creature): boolean {
		const yog = this.creatures.find((c) => c.kind === 'yog' && c.hp > 0);
		return !!yog && Roguelike.chebyshevDistance(fist, yog) <= 4;
	}

	/** One-time-per-fight guard warning (Java warns once per fist - no per-fist latch exists). */
	private yogFistWarned = false;
	private guardFist(fist: Creature): boolean {
		if (fist.kind !== 'yogFist' || !this.fistNearYog(fist)) return false;
		if (!this.yogFistWarned) {
			this.yogFistWarned = true;
			this.say(t('actors.mobs.yogfist.invuln_warn'), 'warning');
		}
		return true;
	}

	/** YogDzewa.isInvulnerable(): dormant phase-0 (unmodeled - the port wakes Yog on entry)
	 * or any live fist. The central choke `Char.damage()` checks for EVERY source, so all
	 * hero-side damage paths (melee/thrown/zap, bomb blasts, DoT ticks, trap blasts, gas)
	 * route through it rather than only `attack()`. */
	private yogShielded(yog: Creature): boolean {
		if (yog.kind !== 'yog' || yog.hp <= 0) return false;
		return this.creatures.some((c) => c.kind === 'yogFist' && c.hp > 0);
	}

	/** YogDzewa.damage(): HP floors at each gate while a phase below 4 holds, and crossing
	 * a gate advances the phase with the darkness line and a new fist (the shuffled
	 * fistSummons deck order is cosmetic here - every fist shares one kind - and challenge
	 * pairs need a second-fist system that doesn't exist). Gates are Java's absolute
	 * 300-HP steps at HT 1000, scaled to this fight's own balance-scaled HP pool as the
	 * same 0.3 fractions (280/160/40 at 400 max, P4 floor at step/3 like Java's 100) -
	 * the old BossPhases 0.75/0.5/0.25 rhythm had no Java basis. Phase 5 opens in `kill()`,
	 * not here. Only runs when damage actually landed (the gate above owns the fist-up
	 * case). */
	private yogDamageHook(yog: Creature, preHp: number): void {
		if (yog.kind !== 'yog' || yog.hp <= 0) return;
		const step = 0.3 * yog.maxHp;
		const phase = yog.yogPhase ?? 1;
		if (phase < 4) {
			yog.hp = Math.max(yog.hp, yog.maxHp - step * phase);
			if (yog.hp <= yog.maxHp - step * phase) {
				yog.yogPhase = phase + 1;
				this.say(t('actors.mobs.yogdzewa.darkness'), 'negative');
				this.summonFist(yog);
			}
		} else if (phase === 4) {
			yog.hp = Math.max(yog.hp, step / 3);
		}
	}

	/** one Yog fist beside Yog (capped at 3 live - the gates can only open three times) */
	private summonFist(yog: Creature): void {
		if (this.creatures.filter((c) => c.kind === 'yogFist' && c.hp > 0).length >= 3) return;
		for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
			const at = { x: yog.x + dx, y: yog.y + dy };
			if (!this.level.passable(at.x, at.y) || this.creatureAt(at.x, at.y)) continue;
			const fist = this.spawnMonster('yogFist', at);
			fist.sleeping = false;
			this.say(t('port.log.yogfistslam'), 'warning');
			return;
		}
	}

	/**
	 * Goo's real pump-up mechanic (`Goo.java`'s `doAttack`/`pumpedUp`), simplified to melee
	 * range: `pumped` 0 -> chance to start charging instead of attacking (higher below half
	 * health, matching `Random.Int((HP*2<=HT) ? 2 : 5) > 0`) -> 1 -> 2, a guaranteed second
	 * charge turn, sprite-only in Java (`GooSprite.pumpUp`) - a log line here -> the slam
	 * itself at 3x damage and 2x accuracy, then back to 0. `liveStats` already applies the
	 * below-half-health enrage to Goo's ordinary attacks; the temporary object below only
	 * needs `kind` cleared so `liveStats` does not re-apply that on top of the 3x/2x it is
	 * already carrying explicitly.
	 */
	private takeGooTurn(goo: Creature): void {
		//Goo.act(): while standing in water and not at full HP, heals a flat amount every turn
		//(this port's own simplification: real Java's healInc ramps 1->3 under the
		//STRONGER_BOSSES challenge and resets to 1 on leaving water/reaching full HP, and also
		//eats into a boss-room door-lock countdown this port has no LockedFloor equivalent of -
		//neither reproduced here, a real, narrower gap left honest rather than faked). This
		//always runs before whatever else Goo's turn does below, exactly like Java's own act().
		if (this.level.get(goo.x, goo.y) === WATER && goo.hp < goo.maxHp) {
			goo.hp = Math.min(goo.maxHp, goo.hp + 1);
			this.showHeal(goo, 1);
		}
		const pumped = goo.pumped ?? 0;

		if (pumped >= 2) {
			goo.pumped = 0;
			const { accuracy, damage } = liveStats(goo);
			this.say(t('port.log.gooslam'), 'warning');
			this.attack({ ...goo, kind: undefined, accuracy: accuracy * 2, damage: [damage[0] * 3, damage[1] * 3] }, this.hero);
			return;
		}

		if (pumped === 1) {
			goo.pumped = 2;
			this.say(t('port.log.goopumpmore'), 'warning');
			return;
		}

		const enraged = goo.hp * 2 <= goo.maxHp;
		if (Random.chance(enraged ? 0.5 : 0.2)) {
			goo.pumped = 1;
			this.say(t('port.log.goopump'), 'warning');
			return;
		}

		this.attack(goo, this.hero);
	}

	/** A uniformly random free (passable, unoccupied) cell other than `exclude`'s own position -
	 * the shared search `Displacing`/`Displacement`/`ScrollOfTeleportation` all use in place of
	 * Java's real `teleportToLocation`'s room-preferring, reachability-checked placement (a
	 * documented simplification - see each caller's own comment). */
	private randomFreeCell(exclude: Step): Step | undefined {
		const candidates: Step[] = [];
		for (let y = 1; y < this.level.height - 1; y++) for (let x = 1; x < this.level.width - 1; x++) {
			if ((x !== exclude.x || y !== exclude.y) && this.level.passable(x, y) && !this.creatureAt(x, y)) candidates.push({ x, y });
		}
		return Random.element(candidates) ?? undefined;
	}

	private moveTo(creature: Creature, to: Step): void {
		if (creature.buffs['roots']) return;
		// Java mobs treat CHASM as solid for pathing even though the hero can enter it
		// and fall. The coarse terrain kind is open for FOV/hero collision, so enforce
		// the mob-specific rule at the final movement boundary.
		if (!creature.isHero && this.isChasmCell(to.x, to.y)) return;
		faceCharacter(this.sprite(creature), creature.x, to.x);
		if (creature.isHero) runState.audio.cue('step', 0.32);
		creature.x = to.x;
		creature.y = to.y;
		if (this.level.get(to.x, to.y) === WATER) this.waterSurface?.ripple(to.x, to.y);
		if (creature.isHero) {
			this.heroAnimation.move(to.x * TILE, to.y * TILE);
			const heal = rejuvenatingStepHeal(this.level.get(to.x, to.y), GRASS, this.hero.hp, this.hero.maxHp, this.talentRank('rejuvenating_steps'));
			if (heal > 0) { this.hero.hp += heal; this.showHeal(this.hero, heal); }
		} else {
			const sprite = this.sprite(creature);
			const motion = this.monsterMotion.get(sprite) ?? new Tweener();
			motion.clear(); this.monsterMotion.set(sprite, motion);
			const fromX = sprite.x, fromY = sprite.y;
			if (sprite instanceof AnimatedSprite && sprite.has('run')) sprite.play('run');
			// CharSprite.moveInterval: visual movement takes 0.1s; logical turns remain immediate.
			void motion.tween(0.1, progress => {
				if (sprite.destroyed) return;
				sprite.position.set(fromX + (to.x * TILE - fromX) * progress, fromY + (to.y * TILE - fromY) * progress);
				if (progress === 1 && sprite instanceof AnimatedSprite && sprite.playing === 'run') sprite.play('idle');
			});
		}
	}

	/**
	 * Melee (or missile) exchange with Java's own on-hit hooks: surprise attacks land
	 * automatically (INFINITE_ACCURACY, inside rollHit) and wake the victim; Rogue's
	 * SUCKER_PUNCH adds +2 on a surprise hit (+4 as an Assassin); Bat.attackProc heals
	 * min(damage-4, missing); Thief.attackProc steals once, then flees; FetidRat oozes
	 * (1/3 poison); GnollTrickster escalates; Monk Focus dodges once per charge; Eye's
	 * gaze triples every third hit; Succubus charms (daze) and feeds; Scorpio cripples;
	 * Warlock degrades; weapon enchants and Thorns fire; Blazing champions ignite; Swarm
	 * splits (numbers verbatim); Fury kindles below half HP.
	 */
	private attack(attacker: Creature, defender: Creature): boolean {
		if (attacker.isHero) this.cancelHourglassFreeze();
		faceCharacter(this.sprite(attacker), attacker.x, defender.x);
		if (attacker.isHero) this.heroAnimation.attack();
		else { const attackerSprite = this.sprite(attacker); if (attackerSprite instanceof AnimatedSprite && attackerSprite.has('attack')) attackerSprite.play('attack', true); }
		// Invisibility is dispelled by an aggressive action (Invisibility.dispel()).
		if (attacker.buffs['invisibility']) delete attacker.buffs['invisibility'];
		//`Sheep` is a neutral NPC in Java: it cannot be damaged or selected as a hostile target.
		//The port stores it as an ally only so the shared scheduler/render/save path can carry it.
		if (defender.allyKind === 'sheep') return false;
		const subject = attacker.isHero ? t('port.log.subject.you') : capitalize(attacker.name);
		//Was a hardcoded English literal 'you', bypassing translation entirely - a real i18n
		//bug that showed untranslated "you" in every non-English combat log line (found while
		//verifying the Spanish locale, but it predates that work and affects French/German too).
		//A separate object-form key (not `port.log.subject.you`) is needed here: the subject
		//pronoun is capitalized and nominative ("You"/"Vous"/"Du"/"Tú"), which is wrong both in
		//capitalization (mid-sentence) and case (German accusative "dich", Spanish's "a ti") for
		//an object position.
		const object = defender.isHero ? t('port.log.object.you') : defender.name;
		if (defender.kind === 'crystalMimic' && !defender.mimicRevealed) {
			this.revealCrystalMimic(defender);
		}
		// Mob.surprisedBy() is not limited to sleeping enemies: it also succeeds when the
		// target did not see the hero on its most recent turn. In particular, its FOV is
		// sampled before a chase step, so striking a snake immediately after it enters a
		// doorway is a guaranteed hit. `canSurpriseAttack()` (STR-ok, not a flail) always
		// passes here - neither STR requirements nor flails are modeled.
		const surprise = defender.sleeping === true || (!defender.isHero && !defender.seesHero);
		//Monk Focus: the first attack against a focused monk always misses and spends the
		//focus (re-earned over ~6 of its own turns via combo in takeMonsterTurn). `Senior
		//extends Monk` and shares this unchanged - previously excluded here too by the same
		//literal-kind-check bug, so a Senior's Focus buff (granted at spawn, and regained via
		//the `takeMonsterTurn` fix above) never actually did anything defensively.
		if ((defender.kind === 'monk' || defender.kind === 'senior') && defender.buffs['focus']) {
			delete defender.buffs['focus'];
			defender.combo = 0;
			defender.sleeping = false;
			this.say(t(attacker.isHero ? 'port.log.monkdodgehero' : 'port.log.monkdodge', { subject, object }), 'negative');
			return false;
		}
		//YogDzewa is invulnerable while any fist lives - the whole point of the gates.
		//Routed through the shared gate (see `yogShielded`) so bombs, DoT, traps and gas
		//below honor it exactly the way `Char.damage()` does for every source.
		if (defender.kind === 'yog' && this.yogShielded(defender)) {
			defender.sleeping = false;
			this.say(t('port.log.yogshielded'), 'negative');
			return false;
		}
		//YogFist proximity guard (see `guardFist`) - same central-choke treatment.
		if (defender.kind === 'yogFist' && this.guardFist(defender)) {
			defender.sleeping = false;
			return false;
		}

		const attackRoll = resolveAttack(attacker, defender, simulationRandom, false, surprise);
		if (!attackRoll.hit) {
			runState.audio.cue('miss', 0.55);
			defender.sleeping = false;
			this.say(t(attacker.isHero ? 'port.log.misshero' : 'port.log.miss', { subject, object }), 'negative');
			return false;
		}

		let damage = attackRoll.damage;
		//Weapon.Augment: real Java's `Augment` enum (`Weapon.java`, tag `v3.3.8`) trades damage
		//against attack speed in both directions - `SPEED(0.7f damageFactor, 2/3f delayFactor)`,
		//`DAMAGE(1.5f damageFactor, 5/3f delayFactor)` - not a flat "20% up, nothing down" this
		//previously modeled (wrong numbers, and only DAMAGE's half at all). The delay half lives
		//in `getAttackTurnCostMod()`.
		if (attacker === this.hero && this.weaponAugment === 'speed') {
			damage = Math.round(damage * 0.7);
		} else if (attacker === this.hero && this.weaponAugment === 'damage') {
			damage = Math.round(damage * 1.5);
		}
		//Weapon Recharging (`Hero.damageRoll()`, Duelist T2): `round(dmg*1.025 + 0.025*points)`
		//while a Recharging-class buff is held - a melee damage multiplier, never the
		//per-hit wand-charge refund this used to be (that shape had no Java basis at all;
		//charges still refund through MysticalCharge/ExcessCharge/SoulSiphon below, which are
		//real). `ArtifactRecharge` counts too in Java; no such buff exists here yet. Gate
		//note, read before "fixing": both tags gate the Java line on `heroClass != DUELIST`
		//- unsatisfiable alongside class-locked talents, so the port follows the evident
		//intent (the talent-holding class) rather than the literal gate.
		if (attacker === this.hero && this.talentRank('weapon_recharging') > 0 && this.hero.buffs['recharging']) {
			damage = weaponRechargingDamage(damage, this.talentRank('weapon_recharging'));
		}
		//RingOfForce.armedDamageBonus(): flat +level on any armed (non-missile) melee hit -
		//`Hero.damageRoll()` gates this on `wep instanceof MissileWeapon`, which this port already
		//expresses the same way every other hero-only bonus here does: `attacker === this.hero`
		//is only true for the real bump-attack call site, never `useSpecial`'s throw/shoot/zap
		//branches (those pass a shallow copy of the hero, not the hero itself).
		if (attacker === this.hero) damage += ringForceBonus(this.equippedRing);
		//`Unstable.proc()`/`Kinetic.proc()`: an Unstable weapon delegates every swing to one
		//`Random.element` draw over `UNSTABLE_DELEGATES` (Java's `Random.oneOf(randomEnchants)`
		//minus the documented exclusions). The pick is stashed so `heroOnHit`'s post-damage
		//branches resolve the same enchant this swing. `Kinetic.proc()` first reads back any
		//conserved damage (`damageBonus()` is `ceil(preserved)`, not floor) and detaches it,
		//then attaches the tracker - on EVERY Kinetic swing, even at zero conserved, which is
		//why the later kill-store keys off the flag rather than the amount.
		const strikeAffix = this.weaponAffix === 'unstable' && attacker === this.hero
			? Random.element(UNSTABLE_DELEGATES)!
			: this.weaponAffix;
		this.unstableDelegated = this.weaponAffix === 'unstable' && attacker === this.hero ? strikeAffix : null;
		//`kineticTrackerHit` arms this swing's kill-storage (used below at the death check) -
		//true whenever THIS swing resolves as Kinetic, whether directly or via Unstable's
		//delegation draw, matching `KineticTracker` only ever being attached from inside
		//`Kinetic.proc()` itself.
		this.kineticTrackerHit = attacker === this.hero && strikeAffix === 'kinetic';
		this.kineticConservedAdded = 0;
		//Read-back is a different condition from arming: both `Kinetic.proc()` AND
		//`Unstable.proc()` read back and clear any conserved damage unconditionally at the
		//top of their own proc, before Unstable goes on to delegate to a random enchant - so
		//this fires on every swing of a Kinetic OR Unstable weapon, not only the swings where
		//Unstable's delegate happens to redraw Kinetic. **Found in the 2026-09-09 item-system
		//audit**: this used to gate the read-back on `kineticTrackerHit` too, silently
		//withholding the stored bonus on ~8/9 of an Unstable weapon's own swings.
		if (attacker === this.hero && (this.weaponAffix === 'kinetic' || this.weaponAffix === 'unstable') && this.kineticStored > 0) {
			this.kineticConservedAdded = Math.ceil(this.kineticStored);
			damage += this.kineticConservedAdded;
			this.kineticStored = 0;
		}
		if (attacker === this.hero) damage += empoweredStrikeBonus(this.subclass(), this.talentRank('empowered_strike'));
		//Talent.java's SUCKER_PUNCH branch: `Random.IntRange(points, 2)` (1-2 at rank 1, flat 2
		//at rank 2), not a flat `points` bonus - found in the 2026-09-09 hero-progression audit.
		//Real Java also gates this once per enemy via a `SuckerPunchTracker` buff attached on
		//first proc, so surprising the same target twice in a row only triggers it the first
		//time; this port has no equivalent per-target tracker and re-procs on every surprise hit
		//- a real, undocumented-until-now simplification, not fixed here (needs a new buff type).
		if (attacker.isHero && surprise) {
			const rank = this.talentRank('sucker_punch');
			if (rank > 0) damage += Random.range(rank, 2);
		}
		if (attacker === this.hero && this.physicalBonusAttacks > 0) {
			damage += this.physicalBonusDamage;
			this.physicalBonusAttacks--;
		}
		if (attacker === this.hero && this.patientStrikeReady) {
			damage += this.talentRank('patient_strike');
			this.patientStrikeReady = false;
		}
		if (attacker === this.hero && this.followupTarget === defender) {
			damage += this.followupDamage;
			this.followupTarget = null;
			this.followupDamage = 0;
		}
		//Polarized.proc(): real chance is a flat 1/2 - on success it amplifies to 1.5x, on
		//failure it zeroes the hit outright (a coin-flip between "hits hard" and "whiffs"),
		//reproduced exactly since it needs no subsystem beyond the damage value itself.
		if (attacker === this.hero && this.weaponAffix === 'polarized') {
			damage = Random.chance(0.5) ? Math.round(damage * 1.5) : 0;
		}
		//Sacrificial.proc(): real chance is 1/10 x arcana (this port previously rolled a flat
		//1/12, an unconfirmed guess - corrected against `Sacrificial.java`); real bleed scales
		//((missingHpFraction^2) * attacker.maxHp)/5, floored at 1. This port has no separate
		//Bleeding buff (only the shared poison DoT), so - like Albino's real Bleeding proc
		//elsewhere in this file - it reuses poison as the closest available damage-over-time
		//primitive; the real magnitude curve is lost since this port's poison has no
		//configurable per-tick amount.
		if (attacker === this.hero && this.weaponAffix === 'sacrificial' && Random.chance((1 / 10) * ringArcanaMultiplier(this.equippedRing))) {
			addBuff(attacker, 'poison');
		}
		//Displacing.proc(): real chance is 1/12 x arcana, skipped against IMMOVABLE targets (a Java
		//property this port doesn't model, so every defender is teleportable here - a narrow
		//gap). Reuses the same free-cell search this file's Displacement armor curse already
		//uses in place of Java's ScrollOfTeleportation.teleportChar. Java also resets a fleeing
		//HUNTING mob back to WANDERING; this port has no such explicit state to reset, but the
		//next monster-turn FOV recompute (`seesHero`) naturally loses track once far enough away.
		if (attacker === this.hero && this.weaponAffix === 'displacing' && !defender.isNPC && Random.chance((1 / 12) * ringArcanaMultiplier(this.equippedRing))) {
			const destination = this.randomFreeCell(defender);
			if (destination) this.moveTo(defender, destination);
		}
		//Displacement.proc(): a 1-in-20 x arcana armor-curse proc teleports the defender
		//and replaces the incoming hit with zero damage.
		if (defender.isHero && this.armorGlyph === 'displacement' && Random.chance((1 / 20) * ringArcanaMultiplier(this.equippedRing))) {
			const destination = this.randomFreeCell(defender);
			if (destination) {
				this.moveTo(defender, destination);
				defender.sleeping = false;
				this.say(t('port.log.armordisplace'), 'warning');
				return false;
			}
		}
		//Friendly.proc()/Charm.java (checked against tag v3.3.8): an already-charmed attacker
		//deals zero damage to the specific object recorded by Charm.object. On a fresh proc,
		//Friendly attaches Charm.DURATION (10) to the attacker and Charm.DURATION/2 (5) to the
		//defender, records each object's stable id, and makes the defender ignore its next hit.
		//The generic buff map stores only durations, so the two small payloads live in these
		//scene maps and are persisted with the run. This closes the former missing Friendly curse
		//without pretending Charm is a global, target-free stun.
		if (attacker === this.hero && this.weaponAffix === 'friendly') {
			if (attacker.buffs['charm'] !== undefined && this.charmTargets.get(attacker.id) === defender.id) damage = 0;
			if (Random.chance((1 / 10) * ringArcanaMultiplier(this.equippedRing))) {
				addBuff(attacker, 'charm');
				this.charmTargets.set(attacker.id, defender.id);
				addBuff(defender, 'charm');
				this.charmTargets.set(defender.id, attacker.id);
				this.charmIgnoreNextHit.add(defender.id);
			}
		}
		//Charm.ignoreNextHit is consumed by the next landed hit against that char, before
		//damage absorption. It is deliberately separate from the attacker's object charm: Java
		//allows the two flags to coexist on opposite sides of the exchange.
		if (this.charmIgnoreNextHit.has(defender.id) && defender.buffs['charm'] !== undefined) {
			this.charmIgnoreNextHit.delete(defender.id);
			damage = 0;
		}
		runState.audio.cue('hit', 0.6);
		if (defender.isHero && this.advancement.choice(1) === 'warding') damage = Math.max(0, damage - 2);
		if (attacker.isHero && this.subclass() === 'gladiator') {
			attacker.combo = (attacker.combo ?? 0) + 1;
			if (attacker.combo % 3 === 0) {
				damage += 3 + this.talentRank('enhanced_combo');
				this.say(t('port.log.gladiatorcombo'), 'positive');
			}
		} else if (attacker.isHero) {
			attacker.combo = 0;
		}
		if (attacker.isHero && this.heroClass === 'rogue' && surprise) {
			damage += (this.subclass() === 'assassin' ? 4 : 2) + assassinReachBonus(this.subclass(), this.talentRank('assassins_reach'));
			this.awardBadge('surprises');
		}
		//Eye.damage(): `if (beamCharged) dmg /= 4` - while charging its real ranged DeathGaze
		//(see `takeMonsterTurn`'s eye branch), it takes quartered damage from any source.
		if (defender.kind === 'eye' && defender.beamCharged) damage = Math.floor(damage / 4);
		//DemonSpawner.damage(): big hits are soft-capped (20/21/22/.../30 raw becomes
		//20/22/25/29/34/40/47/55/64/74/85 incoming before this reduction), and the (possibly
		//reduced) damage also cuts its spawn-cooldown - being attacked makes it panic and summon
		//backup sooner, not later.
		if (defender.kind === 'demonSpawner' && damage >= 20) {
			damage = 19 + Math.floor((Math.sqrt(8 * (damage - 19) + 1) - 1) / 2);
		}
		//Slime.damage(): the same shape of soft cap as DemonSpawner's above, just with a lower
		//threshold (takes 5/6/7/8/9/10 at 5/7/10/14/19/25 incoming) - previously not ported at
		//all, for either Slime or `CausticSlime extends Slime` (which shares it unchanged; its
		//own override only adds the Ooze/corrosion attack proc, already ported separately).
		if ((defender.kind === 'slime' || defender.kind === 'causticSlime') && damage >= 5) {
			damage = 4 + Math.floor((Math.sqrt(8 * (damage - 4) + 1) - 1) / 2);
		}
		const lethalThreshold = Math.max(0.4 * this.talentRank('combined_lethality') / 3, enhancedLethalityThreshold(this.subclass(), this.talentRank('enhanced_lethality')));
		if (attacker === this.hero && lethalThreshold > 0 && defender.hp - damage <= defender.maxHp * lethalThreshold) {
			damage = defender.hp;
			this.say(t('port.log.talentexecute'), 'positive');
		}
		const preHp = defender.hp;
		if (defender.isHero) damage = this.absorbHeroDamage(damage);
		//LifeLink (Char.damage): damage to a linked subject splits evenly (ceil) between it
		//and the King - the King's own share runs through his P2 shield below like any hit.
		//A share lethal to the King ends the swing here (boss-death transition owns the rest).
		if (defender.kind !== 'king' && !defender.isHero) {
			const linkKing = this.creatures.find((c) => c.kind === 'king' && c.hp > 0 && this.kingLinkedAdds.has(defender));
			if (linkKing) {
				const share = Math.ceil(damage / 2);
				linkKing.hp -= share;
				if (linkKing.hp <= 0) {
					this.kill(linkKing);
					return true;
				}
				damage = share;
			}
		}
		//DKBarrier: the P2 shield pool absorbs before HP (no per-turn regen here - the
		//`incShield` half of `DKBarrior.act()` has no modeled trigger to hang it on).
		if (defender.kind === 'king' && (defender.kingShield ?? 0) > 0) {
			const blocked = Math.min(defender.kingShield ?? 0, damage);
			defender.kingShield = (defender.kingShield ?? 0) - blocked;
			damage -= blocked;
		}
		defender.hp -= damage;
		if (defender.kind === 'tengu') this.clampTenguBracket(defender, preHp);
		if (defender.kind === 'yog' && defender.hp > 0) this.yogDamageHook(defender, preHp);
		// FrostImbue.proc(): a surviving enemy hit receives Chill for two turns. The compact
		// status model uses the same short-duration movement/turn lock as the closest Chill hook.
		if (attacker === this.hero && this.hero.buffs['frostImbue'] && defender.hp > 0 && !defender.isHero && !defender.isNPC) {
			defender.buffs['cripple'] = 2;
		}
		if (defender.kind === 'statue') defender.sleeping = false;
		this.showDamage(defender, damage);
		if (defender.kind === 'demonSpawner') {
			defender.spawnCooldown = Math.max((defender.spawnCooldown ?? 60) - damage, -20);
		}
		defender.sleeping = false;
		this.sprite(defender).setColorAdd(1, 1, 1);
		//the one log line whose severity depends on which way the blow went: SPD colours
		//damage the hero takes red and leaves the hero's own hits plain
		this.say(
			t('port.log.hit', { subject, verb: t(attacker.isHero ? 'port.log.verb.hithero' : 'port.log.verb.hit'), object, damage }),
			defender.isHero ? 'negative' : 'info'
		);

		if (attacker.isHero) this.heroOnHit(attacker, defender, damage);
		else this.mobOnHit(attacker, defender, damage);
		// CrystalMimic.attackProc(): after its crystal-chest reveal it repositions the
		// struck hero to a neighbouring free cell instead of dealing bonus damage.
		if (attacker.kind === 'crystalMimic' && defender.isHero && defender.hp > 0) {
			const candidates = Roguelike.neighbourOffsets(8)
				.map(([dx, dy]) => ({ x: defender.x + dx, y: defender.y + dy }))
				.filter((at) => this.level.passable(at.x, at.y) && !this.creatureAt(at.x, at.y));
			const at = Random.element(candidates);
			if (at) {
				this.moveTo(this.hero, at);
				this.say(t('port.log.mimicdisplace'), 'warning');
			}
		}
		if (defender.hp <= 0 && defender.kind === 'ghoul') this.ghoulDown(defender);
		//DwarfKing P1: taken damage accelerates both cooldowns (`-= taken/8`).
		if (defender.kind === 'king' && (defender.kingPhase ?? 1) === 1 && defender.hp > 0) {
			const taken = Math.max(0, preHp - defender.hp);
			defender.kingSummonCd = (defender.kingSummonCd ?? 0) - taken / 8;
			defender.kingAbilityCd = (defender.kingAbilityCd ?? 0) - taken / 8;
		}
		//Tengu bracket jumps resolve after the hit (procs included) but before death.
		if (defender.kind === 'tengu' && defender.hp > 0) this.tenguBracketJump(defender, preHp);

		//Brute.isAlive()/triggerEnrage(): the first time it would die, it survives instead with
		//a shield of HT/2+4 (`BruteRage.setShield`) - reproduced here by giving its hp field
		//that value directly rather than tracking a separate shield pool, so the existing
		//damage-application code drains it exactly like real hp would. `raged` then boosts its
		//own damage roll (`liveStats`) and drives the flat 4/turn passive decay in
		//`takeMonsterTurn`; only ever fires once (`hasRaged`), matching Java exactly.
		//`ArmoredBrute extends Brute` and overrides `triggerEnrage()` with its own smaller
		//shield (`HT/2+1`, not `+4`) that decays far slower (1 point every 3 turns via
		//`ArmoredRage.act()`'s own `spend(3*TICK)`, vs plain `BruteRage`'s 4/turn) - previously
		//this port's check here was `kind === 'brute'` literally, so ArmoredBrute (a real,
		//spawnable alternative monster kind) never got the revival at all and could simply be
		//killed outright, the exact bug this port's own `Brute` fix once corrected for the base
		//kind. `armoredRageTicks` starts the every-3rd-turn decay counter.
		if (defender.hp <= 0 && (defender.kind === 'brute' || defender.kind === 'armoredBrute') && !defender.hasRaged) {
			defender.hasRaged = true;
			defender.raged = true;
			if (defender.kind === 'armoredBrute') {
				defender.hp = Math.round(defender.maxHp / 2 + 1);
				defender.armoredRageTicks = 0;
			} else {
				defender.hp = Math.round(defender.maxHp / 2 + 4);
			}
			this.say(t('port.log.bruterage'), 'negative');
			return true;
		}

		if (defender.hp <= 0) {
			const cleave = cleaveComboSeed(this.subclass(), this.talentRank('cleave'));
			if (attacker === this.hero && cleave > 0) attacker.combo = cleave;
			//Mob.die()'s kill triggers gate on the *cause* (`hero || Weapon || Enchantment`),
			//so missile kills count too - `isHero` (true for the hero and its thrown-missile
			//copy alike) rather than the melee-only `attacker === this.hero` reference check.
			//Lethal Momentum's own chance (0.34+0.33/point: 2/3 at rank 1, certain at 2) was
			//already exact, only its trigger was narrowed to melee; fixed the same way here.
			//Endless Rage's old free-turn line is gone outright: real `ENDLESS_RAGE` only raises
			//the Berserk rage cap (`1+0.1667x` max power), which needs the rage gain/decay clock
			//this port doesn't model (see the Berserk row) - a free turn had no Java basis.
			if (attacker.isHero && this.heroClass === 'warrior' && this.talentRank('lethal_momentum') > 0 && Random.chance(this.talentRank('lethal_momentum') >= 2 ? 1 : 2 / 3)) this.freeTurnNext = true;
			if (attacker.isHero) this.lethalHasteOnKill();
			this.kill(defender);
			return true;
		}
		if (defender.kind === 'swarm') this.swarmSplit(defender, damage, preHp);
		return true;
	}

	/** hero-side on-hit hooks: enchants, subclass effects, counters */
	private heroOnHit(attacker: Creature, defender: Creature, damage: number): void {
		//Both halves of an Unstable swing resolve the same delegated enchant (see `attack()`).
		const affix = this.unstableDelegated ?? this.weaponAffix;
		//`Char.damage()`'s Kinetic block: a killing blow with the tracker attached stores the
		//overkill BEYOND this swing's conserved bonus (`-HP - tracker.conservedDamage`),
		//scaled by `genericProcChanceMultiplier()` (Arcana, plus Berserk's
		//`0.15 x catalyst-talent ranks` when raging - RunicBlade/Smite trackers don't exist
		//here) and REPLACING the old amount (`setBonus` overwrites; the old code added half
		//of every landed hit whether it killed or not, capped at 20 - neither has a Java
		//basis). Fires pre-revival, like Java's HP<0 check ahead of `isAlive()`.
		if (this.kineticTrackerHit && defender.hp <= 0 && !defender.isHero && !defender.isNPC) {
			const overkill = Math.max(0, -defender.hp - this.kineticConservedAdded);
			const multi = ringArcanaMultiplier(this.equippedRing)
				+ (this.hero.buffs['berserk'] ? Math.min(1, 1 - this.hero.hp / this.hero.maxHp) * 0.15 * this.talentRank('enraged_catalyst') : 0);
			const stored = Math.round(overkill * multi);
			if (stored > 0) this.kineticStored = stored;
		}
		//Battlemage: staff melee feeds the wand (advance 2 per landed hit, simplified from
		//the per-wand on-hit effects)
		if (this.subclass() === 'battlemage') this.wandCharges.refund(2 + this.talentRank('mystical_charge'));
		if (this.subclass() === 'monk_sub' && this.talentRank('combined_energy') > 0) this.tomeCharges.advance(this.talentRank('combined_energy'));
		if (this.advancement.choice(1) === 'arcane') this.wandCharges.refund(1);
		if (this.advancement.choice(1) === 'arcane' && defender.hp > 0) {
			defender.hp -= 2;
			this.showDamage(defender, 2);
		}
		if (affix === 'blazing') addBuff(defender, 'burning');
		if (affix === 'chilling') addBuff(defender, 'daze');
		if (affix === 'shocking') {
			defender.hp -= 2;
			this.showDamage(defender, 2);
			this.say(t('port.log.shocking'));
		}
		if (affix === 'vampiric') {
			attacker.hp = Math.min(attacker.maxHp, attacker.hp + 1);
			this.showHeal(attacker, 1);
			this.say(t('port.log.vampiric'), 'positive');
		}
		//Grim.proc(): real chance scales 0-50% with the defender's missing-HP fraction plus
		//0-5%/weapon level, deferred through a tracker buff so `Char.damage` sees the *final*
		//damage. Simplified to a flat 15% flat-15-bonus-true-damage roll, gated the same way
		//(only worth rolling once the defender is already below half HP) - the shape (execute
		//pressure on a weakened target) is real, the curve is not.
		if (affix === 'grim' && defender.hp > 0 && defender.hp <= defender.maxHp / 2 && Random.chance(0.15 * ringArcanaMultiplier(this.equippedRing))) {
			defender.hp -= 15;
			this.showDamage(defender, 15);
			this.say(t('port.log.grim'), 'positive');
		}
		//Lucky.proc(): real effect only arms on a would-be-killing blow, then RingOfWealth-style
		//loot (80% common/20% uncommon/0% rare) lands via a deferred buff. Simplified to a flat
		//10% chance, on an actual kill, to spawn one bonus ground item alongside the corpse's own
		//loot roll - the "your kill got lucky" shape survives, the ring-of-wealth tier curve does
		//not (this port's `spawnGroundItem` has no rarity axis to roll on).
		if (affix === 'lucky' && defender.hp <= 0 && Random.chance(0.1 * ringArcanaMultiplier(this.equippedRing))) {
			this.spawnGroundItem(Random.element(['potion', 'scroll', 'gold'] as const)!, defender.x, defender.y);
			this.say(t('port.log.lucky'), 'positive');
		}
		//Blocking.proc(): real proc chance is (lvl+4)/(lvl+40) (10% at lvl 0, ~14% at lvl 2), and
		//the shield granted is round(max(1,procChance) * (2+lvl)) - both reproduced exactly. Real
		//Java grants this into its own BlockBuff (a distinct ShieldBuff from Barrier, priority 2
		//so it drains before Barrier's priority-0 pool), whose act() just detaches outright 5
		//turns after setShield() - a fixed cliff-edge, not a decay curve. This port mirrors that
		//with its own `blockingBarrier` pool (drained first in `absorbHeroDamage`, exempt from
		//the proportional decay, cliff-expired by `blockingTurnsLeft`) via grantBlockingShield,
		//which reproduces ShieldBuff.setShield()'s max-not-additive semantics plus the always-
		//reset 5-turn timer. Corrected this pass: the old code pooled Blocking into the shared
		//heroBarrier and tracked the share with an additive side counter - so repeated procs
		//stacked unboundedly where Java keeps the higher value, the proportional decay nibbled a
		//shield Java exempts from it, and drain order was recency, not priority.
		if (affix === 'blocking') {
			//Blocking.proc(): both the proc chance and the shield magnitude read
			//`weapon.buffedLvl()` (the Degrade-affected level), not the raw stored level -
			//found using raw `this.weaponLevel` instead in the 2026-09-09 item-system audit
			//(so a Degrade-hit weapon procced/shielded as if undegraded).
			const level = this.degradedLevel(this.weaponLevel);
			const procChance = ((level + 4) / (level + 40)) * ringArcanaMultiplier(this.equippedRing);
			if (Random.chance(procChance)) {
				const powerMulti = Math.max(1, procChance);
				this.grantBlockingShield(Math.round(powerMulti * (2 + level)));
			}
		}
		//Blooming.proc(): (lvl+1)/(lvl+3) x arcana chance to plant grass at the defender's
		//cell first, then shuffled 8-neighbours with the attacker's own cell dead last (only
		//when adjacent), planting (1+0.1*lvl) x max(1,procChance) cells with stochastic
		//rounding. plantGrass() targets EMPTY/EMPTY_DECO/EMBERS/GRASS/FURROWED_GRASS cells
		//with no plant: this port's terrain has no EMPTY_DECO/EMBERS/FURROWED ids, so FLOOR
		//and GRASS are the plantable set, and FURROWED (or HIGH_GRASS under Regeneration's
		//regen - a well-water state this port doesn't model) collapses straight to HIGH_GRASS.
		//Occupancy reuses the live plant-marker maps; the leaf-burst particles have no seam.
		if (affix === 'blooming') {
			//Blooming.proc() also reads `weapon.buffedLvl()`, same Degrade fix as Blocking above.
			const level = Math.max(0, this.degradedLevel(this.weaponLevel));
			const procChance = ((level + 1) / (level + 3)) * ringArcanaMultiplier(this.equippedRing);
			if (Random.chance(procChance)) {
				let plants = (1 + 0.1 * level) * Math.max(1, procChance);
				plants = Random.float() < (plants % 1) ? Math.ceil(plants) : Math.floor(plants);
				const cells = [{ x: defender.x, y: defender.y }];
				const around = Roguelike.neighbourOffsets(8)
					.map(([dx, dy]) => ({ x: defender.x + dx, y: defender.y + dy }))
					.filter((at) => !(at.x === attacker.x && at.y === attacker.y));
				for (let i = around.length - 1; i > 0; i--) {
					const j = Random.int(0, i + 1);
					[around[i], around[j]] = [around[j]!, around[i]!];
				}
				cells.push(...around);
				if (Roguelike.chebyshevDistance(attacker, defender) === 1) cells.push({ x: attacker.x, y: attacker.y });
				let planted = false;
				for (const cell of cells) {
					if (this.plantBloomingGrass(cell.x, cell.y)) {
						planted = true;
						if (--plants <= 0) break;
					}
				}
				if (planted) this.say(t('port.log.blooming'), 'positive');
			}
		}
	}

	/** the auto-decided subclass id (branch tier 0), or null before level 13 */
	private subclass(): string | null {
		return this.advancement.choice(0);
	}

	/** `Degrade.reduceLevel()`: zero and negative levels pass through untouched, otherwise
	 * `round(sqrt(2*(lvl-1)) + 1)` - so 1/2/3/4/5/6+ read as 1/2/3/3/4/4. Read through
	 * `Item.buffedLevel()` by damage rolls and armor DR while the buff holds (30 turns);
	 * everything else (proc chances, upgrade-loss rolls, the stored true level itself)
	 * keeps `level()`. */
	private degradedLevel(trueLevel: number): number {
		if (!this.hero.buffs['degrade'] || trueLevel <= 0) return trueLevel;
		return Math.round(Math.sqrt(2 * (trueLevel - 1)) + 1);
	}

	/** `Level.viewDistance`: `8`, `2` under the real `DARKNESS` challenge, and `4` on the
	 * final vault (`LastLevel.viewDistance = 4`) - the same shared radius this port already
	 * uses for both the hero's own FOV and every monster's `seesHero`/AI sight check (real
	 * Java's own light-casting array backs both alike, so one shared radius is the faithful
	 * shape, not a coincidence of this port's own structure). Darkness takes the minimum,
	 * matching `updateVisibility()`'s `min(viewDistance, 2)`. */
	private viewRadius(): number {
		const base = this.depth === 26 ? 4 : VIEW_RADIUS;
		//Farsight (Sniper T3, checked against tag `v3.3.8`'s `Level.updateVisibility()` and
		//`Dungeon.observe()`): sight radius scales by `1 + 0.25*points` (8/10/12/14 on the
		//shared base). Replaces a wrong-shaped stand-in that spent the talent as a +2/point
		//RANGED TARGETING range in `useSpecial` instead - Farsight never touches targeting.
		//The darkness minimum still applies on top, matching `updateVisibility()`'s own order.
		const scaled = base * farsightMultiplier(this.subclass(), this.talentRank('farsight'));
		return isChallengeEnabled('darkness') ? Math.min(scaled, 2) : scaled;
	}

	/** Barrier absorbs incoming damage before HP, matching Buff.Barrier's core rule. */
	private absorbHeroDamage(amount: number): number {
		//Hero.damage(): `dmg = ceil(dmg * RingOfTenacity.damageMultiplier())` is applied before
		//Char.damage()'s own Barrier absorption, so Tenacity scales the raw hit here too.
		const tenacityMultiplier = ringTenacityMultiplier(this.equippedRing, this.hero.hp, this.hero.maxHp);
		const scaled = tenacityMultiplier < 1 ? Math.ceil(amount * tenacityMultiplier) : amount;
		//WandOfLivingEarth.RockArmor.absorb(): blocks `damage - damage/2` (ceil half)
		//until its stored rock amount is exhausted, before ordinary ShieldBuff layers.
		//The port has no distinct Buff priority for RockArmor, so it drains first here;
		//the amount and half-damage rule are retained even though EarthGuardian is not.
		const livingEarthBlocked = Math.min(this.livingEarthArmor, Math.ceil(Math.max(0, scaled) / 2));
		this.livingEarthArmor -= livingEarthBlocked;
		//ShieldBuff.processDamage(): higher `shieldUsePriority` drains first - BlockBuff (2)
		//before Barrier (0) - so Blocking's own pool absorbs ahead of the shared pool.
		const afterLivingEarth = Math.max(0, scaled - livingEarthBlocked);
		const blockedBlocking = this.blockingBarrier.absorb(afterLivingEarth);
		const blockedBase = this.heroBarrier.absorb(Math.max(0, afterLivingEarth - blockedBlocking));
		const blocked = livingEarthBlocked + blockedBlocking + blockedBase;
		this.wandCharges.refund(shieldBatteryGain(blocked, this.talentRank('shield_battery')));
		const remaining = Math.max(0, scaled - blocked);
		const reduced = Math.max(0, remaining - ironWillReduction(this.hero.hp, this.hero.maxHp, this.talentRank('iron_will')));
		if (deathlessFuryTriggers(this.subclass(), this.talentRank('deathless_fury'), this.deathlessFuryUsed, reduced, this.hero.hp)) {
			this.deathlessFuryUsed = true;
			this.hero.hp = 1;
			addBuff(this.hero, 'berserk');
			return 0;
		}
		return reduced;
	}

	/** Blocking.BlockBuff.setShield(): keeps the higher of the current shield and the fresh
	 * proc amount (never additive) and always resets the 5-turn cliff timer - `super.setShield`
	 * is `if (shielding <= shield) shielding = shield`, then `left = 5f`. The port-level
	 * overflow cap is measured against both pools combined (Java has no cross-buff cap; this
	 * cap is this port's own anti-overflow guard, same as grantHeroShield's). */
	private grantBlockingShield(amount: number): void {
		const room = Math.max(0, this.hero.maxHp - this.heroBarrier.total - this.blockingBarrier.total);
		const added = Math.min(room, Math.max(0, amount));
		if (added >= this.blockingBarrier.total) {
			this.blockingBarrier.clear();
			if (added > 0) this.blockingBarrier.add(added);
		}
		this.blockingTurnsLeft = 5;
		this.say(t('port.log.shield', { amount: added }), 'positive');
	}

	/** Returns the amount actually added (may be less than `amount` if capped). */
	private grantHeroShield(amount: number, cap = 999): number {
		if (amount <= 0) return 0;
		const max = cap + this.talentRank('iron_will');
		const room = Math.max(0, max - this.heroBarrier.total);
		const added = Math.min(room, amount);
		this.heroBarrier.add(added);
		//Barrier.incShield() resets partialLostShield to 0 on every addition, so a fresh top-up
		//doesn't immediately spend whatever fraction had already accrued toward the next decay tick
		this.barrierPartialLoss = 0;
		this.say(t('port.log.shield', { amount }), 'positive');
		return added;
	}

	/** monster-side on-hit hooks (all pre-existing, now grouped) */
	private mobOnHit(attacker: Creature, defender: Creature, damage: number): void {
		if (defender.isHero) this.grantHeroShield(lethalDefenseShield(this.subclass(), this.talentRank('lethal_defense')), this.hero.maxHp);
		//Metabolism.proc(): 1-in-6 x arcana, consume 10 hunger and heal one HP,
		//provided the hero is not starving and has room to heal.
		if (defender.isHero && this.armorGlyph === 'metabolism' && this.hunger < 450 && this.hero.hp < this.hero.maxHp && Random.chance((1 / 6) * ringArcanaMultiplier(this.equippedRing))) {
			this.hunger = Math.max(0, this.hunger - 10);
			this.hero.hp++;
			this.showHeal(this.hero, 1);
		}
		//AntiEntropy.proc(): a 1-in-8 x arcana proc ignites the wearer and freezes the
		//eight neighboring cells. Daze is the port's timed freeze equivalent.
		if (defender.isHero && this.armorGlyph === 'antientropy' && Random.chance((1 / 8) * ringArcanaMultiplier(this.equippedRing))) {
			addBuff(this.hero, 'burning');
			for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
				const nearby = this.creatureAt(this.hero.x + dx, this.hero.y + dy);
				if (nearby && nearby !== this.hero) addBuff(nearby, 'daze');
			}
		}
		//Corrosion.proc(): a 1-in-10 x arcana proc spreads corrosive ooze across the
		//eight neighboring cells - a real `ooze` buff now (it used to reuse `poison`).
		//Duration refreshes rather than stacking via `extend()`; intensity is flat.
		if (defender.isHero && this.armorGlyph === 'corrosion' && Random.chance((1 / 10) * ringArcanaMultiplier(this.equippedRing))) {
			for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
				const nearby = this.creatureAt(this.hero.x + dx, this.hero.y + dy);
				if (nearby) addBuff(nearby, 'ooze');
			}
		}
		//Multiplicity.proc(): a 1-in-20 proc duplicates a non-boss attacker into
		// an available neighboring cell. Mirror-image duplication is not represented
		// as a separate actor type here, so hero-attacker procs are intentionally skipped.
		if (defender.isHero && this.armorGlyph === 'multiplicity' && !attacker.isHero && !attacker.isNPC && Random.chance((1 / 20) * ringArcanaMultiplier(this.equippedRing))) {
			const adjacent = Roguelike.neighbourOffsets(8)
				.map(([dx, dy]) => ({ x: this.hero.x + dx, y: this.hero.y + dy }))
				.filter((at) => this.level.passable(at.x, at.y) && !this.creatureAt(at.x, at.y));
			const destination = Random.element(adjacent);
			const attackerKind = attacker.kind;
			if (destination && attackerKind && !['goo', 'tengu', 'dm300', 'king', 'yog', 'yogFist'].includes(attackerKind)) {
				this.spawnMonster(attackerKind, destination);
			}
		}
		//Overgrowth.proc(): a 1-in-20 x arcana proc couches and immediately activates a
		//random supported seed at the defender's cell. The generator's full seed
		//weight table is not available, so selection is uniform across supported seeds.
		if (defender.isHero && this.armorGlyph === 'overgrowth' && Random.chance((1 / 20) * ringArcanaMultiplier(this.equippedRing))) {
			const seed = Random.element(['blindweed', 'earthroot', 'fadeleaf', 'firebloom', 'icecap', 'mageroyal',
				'rotberry', 'sorrowmoss', 'starflower', 'stormvine', 'sungrass', 'swiftthistle'] as const);
			if (seed) {
				const cell = this.level.index(this.hero.x, this.hero.y);
				this.manualPlants.set(cell, seed);
				this.placePortedFeature(cell, `plant:${seed}`);
				this.triggerPortedPlantAt(this.hero.x, this.hero.y);
			}
		}
		//Stench.proc(): 1/8 x arcana chance when hit to seed 250-volume ToxicGas at the
		//wearer's own feet (`Blob.seed(defender.pos, 250, ToxicGas.class)`) - the curse gasses
		//the wearer too, unlike the 1000-volume trap/potion seeds elsewhere in this file.
		if (defender.isHero && this.armorGlyph === 'stench' && Random.chance((1 / 8) * ringArcanaMultiplier(this.equippedRing))) {
			this.toxicGas.seed(this.hero.x, this.hero.y, 250);
			this.say(t('port.log.stenchcurse'), 'negative');
		}
		if (attacker.kind === 'bat' && damage > 4) {
			const reg = Math.min(damage - 4, attacker.maxHp - attacker.hp);
			if (reg > 0) {
				attacker.hp += reg;
				this.say(t('port.log.batfeeds', { who: capitalize(attacker.name), amount: reg }), 'negative');
			}
		}
		if ((attacker.kind === 'thief' || attacker.kind === 'bandit') && !attacker.stolen && defender.isHero) {
			this.thiefSteal(attacker);
			if (attacker.kind === 'bandit' && attacker.stolen) {
				// Bandit.java adds blindness, poison and cripple to a successful steal. The
				// framework buff set has no blindness/bleeding ids, so poison/cripple are the
				// closest live equivalents and preserve the dangerous post-steal consequence.
				addBuff(defender, 'poison');
				addBuff(defender, 'cripple');
				addBuff(defender, 'daze');
			}
		}
		//Explosive.proc(): every hit removes round(IntRange(0,10) x arcana) fuse points and
		//detonates when the 100-point fuse is exhausted.  The existing blast resolver
		//supplies the Java-shaped nearby damage and then the fuse resets.
		if (this.weaponAffix === 'explosive') {
			this.weaponCurseDurability -= Math.round(Random.range(0, 10) * ringArcanaMultiplier(this.equippedRing));
			if (this.weaponCurseDurability <= 0) {
				this.applyTrapBlast(defender.x, defender.y);
				this.weaponCurseDurability = 100;
			}
		}
		//Dazzling.proc(): a 1-in-10 x arcana blast blinds visible characters around the
		//defender. Daze is the available timed blindness/impairment equivalent.
		if (this.weaponAffix === 'dazzling' && Random.chance((1 / 10) * ringArcanaMultiplier(this.equippedRing))) {
			for (const creature of this.creatures) {
				if (creature.hp <= 0 || !this.fov.isVisible(creature.x, creature.y)) continue;
				creature.buffs.daze = Math.max(creature.buffs.daze ?? 0, creature === attacker ? 5 : 2);
			}
			delete this.hero.buffs.invisibility;
		}
		//Annoying.proc(): a 1-in-20 x arcana proc beckons every active monster toward
		//the hero. The AI's persisted seesHero flag is its target-acquisition state.
		if (this.weaponAffix === 'annoying' && Random.chance((1 / 20) * ringArcanaMultiplier(this.equippedRing))) {
			for (const creature of this.creatures) {
				if (!creature.isHero && !creature.isNPC && creature.hp > 0) creature.seesHero = true;
			}
			delete this.hero.buffs.invisibility;
		}
		if (attacker.kind === 'albino' && Random.chance(0.5)) {
			// Albino's Java proc is Bleeding; poison is the available damage-over-time
			// primitive and is intentionally applied only after a landed hit.
			addBuff(defender, 'poison');
		}
		if ((attacker.kind === 'causticSlime' || attacker.kind === 'acidic') && Random.chance(attacker.kind === 'acidic' ? 1 : 0.5)) {
			addBuff(defender, 'ooze');
			if (attacker.kind === 'acidic') addBuff(defender, 'cripple');
		}
		if (attacker.kind === 'fetidRat' && Random.chance(1 / 3)) {
			addBuff(defender, 'ooze');
			this.say(t(defender.isHero ? 'port.log.oozedhero' : 'port.log.oozed', { who: capitalize(defender.name) }), 'negative');
		}
		//Spinner.web: a landed bite can root the hero; the full web tile remains a later
		//terrain pass, but the combat-side immobilisation is now present.
		if (attacker.kind === 'spinner' && defender.isHero && Random.chance(0.5)) {
			addBuff(defender, 'cripple');
			this.say(t('port.log.spinnerweb'), 'negative');
		}
		//GnollTrickster.attackProc(): real formula is `Random.Int(4) + combo` (combo incrementing
		//every landed hit, reset to 0 whenever it moves instead - see `stepAway`), not a flat
		//combo>=3/>=6 cutoff - the randomness means an early hit can occasionally ignite or
		//poison too, while a long combo isn't a hard guarantee either. `effect>=6` ignites (skip
		//if already burning); otherwise `effect>2` poisons. Java's `Poison.set(effect-2)` sets a
		//real magnitude this port's poison buff has no field for (a pre-existing, documented
		//simplification elsewhere), so only the ignite-vs-poison-vs-nothing threshold is fixed here.
		if (attacker.kind === 'gnollTrickster') {
			attacker.combo = (attacker.combo ?? 0) + 1;
			const effect = Random.int(4) + attacker.combo;
			if (effect >= 6 && !defender.buffs['burning']) {
				addBuff(defender, 'burning');
				this.say(t('port.log.tricksterfire'), 'negative');
			} else if (effect > 2) {
				addBuff(defender, 'poison');
				this.say(t('port.log.trickstervenom'), 'negative');
			}
		}
		//Succubus: 1/3 charm (daze) and feeds 5+damage on a charmed victim
		if (attacker.kind === 'succubus' && defender.isHero) {
			if (Random.chance(1 / 3)) {
				addBuff(defender, 'daze');
				this.say(t('port.log.charm'), 'negative');
			}
			if (defender.buffs['daze']) {
				const feed = Math.min(5 + damage, attacker.maxHp - attacker.hp);
				if (feed > 0) {
					attacker.hp += feed;
					this.say(t('port.log.succubusfeeds', { who: capitalize(attacker.name), amount: feed }), 'negative');
				}
			}
		}
		//Scorpio: 50% cripple on a hit. Acidic's own attackProc() calls super.attackProc() after
		//adding its Ooze proc, so it still applies this too - previously excluded here.
		if ((attacker.kind === 'scorpio' || attacker.kind === 'acidic') && Random.chance(0.5)) {
			addBuff(defender, 'cripple');
			this.say(t('port.log.cripple'), 'negative');
		}
		//Thorns glyph: reflect 2 when the hero is hit
		if (defender.isHero && this.armorGlyph === 'thorns' && attacker.hp > 0) {
			attacker.hp -= 2;
			this.showDamage(attacker, 2);
			this.say(t('port.log.thorns'), 'positive');
			if (attacker.hp <= 0) this.kill(attacker);
		}
		//Entanglement glyph: real effect roots the attacker via Earthroot.Armor (a dedicated
		//immobilize buff scaled by armor level); this port has no root/immobilize state
		//distinct from the existing `cripple` debuff (already Guard.chain's stand-in), so the
		//25% base proc chance applies that instead - restricted movement either way, not the
		//real root's exact duration curve.
		if (defender.isHero && this.armorGlyph === 'entanglement' && !attacker.isHero && Random.chance(0.25)) {
			addBuff(attacker, 'cripple');
			this.say(t('port.log.entanglement'), 'positive');
		}
		//Potential glyph: real effect recharges wands when the hero is hit. Proc chance =
		//(level+1)/(level+6); powerMulti = max(1, procChance). Simplified: using the armor level
		//in the formula directly, and advancing wand charges by 1 per proc (Java's powerMulti
		//multiplies the recharge count).
		if (defender.isHero && this.armorGlyph === 'potential') {
			const level = Math.max(0, this.armorLevel);
			const procChance = (level + 1) / (level + 6);
			if (Random.float() < procChance) {
				this.wandCharges.refund(Math.max(1, Math.floor(procChance)));
				this.say(t('port.log.potential'), 'positive');
			}
		}
		if (attacker.champion === 'blazing') addBuff(defender, 'burning');
		if (!attacker.isHero && attacker.hp <= attacker.maxHp * 0.5 && !attacker.buffs['fury'] && attacker.kind !== 'necroSkeleton') {
			addBuff(attacker, 'fury');
			this.say(t('port.log.fury', { who: capitalize(attacker.name) }), 'warning');
		}
	}

	/**
	 * Ghoul lifelink, simplified: the first ghoul downed on a floor crumples and revives
	 * at a tenth of health (Java: GhoulLifeLink revive after timesDowned*5 turns near a
	 * live host); later downs stick. The timer is collapsed to immediate - stated.
	 */
	private ghoulDown(ghoul: Creature): void {
		if (this.ghoulsDowned > 0) return;
		this.ghoulsDowned++;
		ghoul.hp = Math.max(1, Math.round(ghoul.maxHp / 10));
		this.say(t('port.log.ghoulrises'), 'warning');
	}

	/**
	 * Thief.steal: one unequipped consumable (potion/scroll/food, else 10 gold), then FLEEING
	 * (fleeBelow 1 in takeMonsterTurn). Placeholders/shattering pots need the heap system -
	 * the item simply leaves the bag and rides on the thief until it dies.
	 */
	private thiefSteal(thief: Creature): void {
		const victim = this.bag.items.find((i) => ['potion', 'potionHealing', 'scrollIdentify', 'scroll', 'food', 'meat'].includes(i.id) && i.quantity > 0);
		if (victim) {
			this.bag.remove(victim.id, 1);
			thief.stolen = victim.id;
			this.say(t('port.log.thiefsteals'), 'negative');
		} else if (this.heroStats.base('gold') >= 10) {
			this.heroStats.setBase('gold', this.heroStats.base('gold') - 10);
			thief.stolen = 'gold:10';
			this.say(t('port.log.thiefgold'), 'negative');
		}
	}

	/**
	 * Swarm.defenseProc, verbatim: splits when pre-hit HP >= damage+2 into a clone holding
	 * half the post-hit HP (EXP 0 past generation 0), needing a free 4-neighbour.
	 */
	private swarmSplit(swarm: Creature, damage: number, preHp: number): void {
		if (preHp < damage + 2) return;
		for (const [dx, dy] of Roguelike.neighbourOffsets(4)) {
			const at = { x: swarm.x + dx, y: swarm.y + dy };
			if (!this.level.passable(at.x, at.y) || this.creatureAt(at.x, at.y)) continue;
			const clone = this.spawnMonster('swarm', at);
			clone.hp = Math.floor((preHp - damage) / 2);
			swarm.hp -= clone.hp;
			clone.maxHp = clone.hp;
			clone.generation = (swarm.generation ?? 0) + 1;
			clone.sleeping = false;
			this.say(t('port.log.swarmsplits'), 'warning');
			return;
		}
	}

	/** `Mob.die()`'s Lethal Haste trigger (Duelist T2, checked against tag `v3.3.8`): a
	 * hero-caused kill grants `GreaterHaste.set(2 + 2*points)` turns - this port's existing
	 * `haste` buff at its real x3 turn-cost multiplier, written directly since the duration
	 * is rank-scaled rather than the fixed 20 `addBuff` grants - gated by a real 100-turn
	 * `LethalHasteCooldown`. Replaces a wrong-shaped stand-in (a single `freeTurnNext` flag
	 * on every kill, no cooldown, no haste). Called from the melee kill site (which also
	 * covers enchant-proc kills, since those resolve inside `attack()`) and the
	 * thrown-missile/bow kill sites (Java's `cause instanceof Weapon` gate); wand-zap kills
	 * are excluded the same way (`cause` is the Wand, not a Weapon), as are bombs/traps.
	 * Gate note, same as Weapon Recharging above: both tags gate the Java line on
	 * `heroClass != DUELIST`, unsatisfiable with class-locked talents, so the port follows
	 * the evident intent for the talent-holding class. No log line: Java signals this with
	 * the haste visual only. */
	private lethalHasteOnKill(): void {
		const rank = this.talentRank('lethal_haste');
		if (this.heroClass !== 'duelist' || rank <= 0 || this.hero.buffs['lethalHasteCooldown'] !== undefined) return;
		this.hero.buffs['lethalHasteCooldown'] = LETHAL_HASTE_COOLDOWN;
		this.hero.buffs['haste'] = Math.max(this.hero.buffs['haste'] ?? 0, lethalHasteDuration(rank));
	}

	private kill(creature: Creature, cause: 'foe' | 'trap' | 'fire' | 'poison' | 'hunger' = 'foe'): void {
		const index = this.creatures.indexOf(creature);
		if (index < 0) return;
		runState.audio.cue('death', 0.65);
		this.scheduler.remove(creature);
		this.creatures.splice(index, 1);
		const deadSprite = this.sprite(creature);
		this.monsterMotion.get(deadSprite)?.clear();
		this.monsterMotion.delete(deadSprite);
		deadSprite.position.set(creature.x * TILE, creature.y * TILE);
		deadSprite.colorAdd = 0;
		if (creature.isHero) this.heroAnimation.die();
		else if (deadSprite instanceof AnimatedSprite && deadSprite.has('die')) {
			deadSprite.play('die', true);
			this.dyingMonsters.set(deadSprite, { x: creature.x, y: creature.y, fade: 0 });
		} else deadSprite.destroy();
		//the hero's sprite outlives `kill()` for the game-over screen (see the `gameOver`
		//check further down) - every other creature's sprite is either already destroyed above
		//or now only reachable through `dyingMonsters`, keyed by the sprite object itself, so
		//dropping the id mapping here is safe.
		if (!creature.isHero) this.spriteFor.delete(creature.id);
		this.charmTargets.delete(creature.id);
		this.charmIgnoreNextHit.delete(creature.id);
		//the bar is keyed on the creature, so it has to go with it or it hangs over an empty
		//cell for the rest of the floor
		this.healthBars.get(creature)?.destroy();
		this.healthBars.delete(creature);

		if (creature.isHero) {
			this.leaveBones();
			this.say(this.depth in BOSSES ? t('port.log.deathboss') : t('port.log.deathfloor', { depth: this.depth }), 'negative');
			//death badges (DEATH_FROM_*: trap/fire/poison/hunger/foe - gas/falling/magic
			//variants need systems this port has none of)
			this.awardBadge(
				cause === 'trap' ? 'death_trap' : cause === 'fire' ? 'death_fire' : cause === 'poison' ? 'death_poison' : cause === 'hunger' ? 'death_hunger' : 'death_foe'
			);
			this.awaitingInput = false;
			this.gameOver = true;
			recordRun({ result: 'lost', depth: this.depth, level: this.progression.level, gold: this.heroStats.base('gold') });
			this.showDefeatPanel();
			return;
		}
		//MirrorImage allies are temporary 1-HP summons, not hostile Mob instances: their death
		//must not award XP, loot, quest progress, or trigger monster-specific death hooks.
		if (creature.isAlly) return;
		this.processSacrifice(creature);
		//PinCushion: stuck missiles scatter back out as ground heaps (one item per cell here,
		//so extras take neighbouring cells, like statue drops). Generic stone heaps - the port
		//tracks no per-missile identity to restore.
		if (creature.stuckAmmo && creature.stuckAmmo > 0) {
			const cells = [{ x: creature.x, y: creature.y }, ...Roguelike.neighbourOffsets(8).map(([dx, dy]) => ({ x: creature.x + dx, y: creature.y + dy }))]
				.filter((at) => this.level.inside(at.x, at.y) && this.level.passable(at.x, at.y) && !this.groundItemAt(at.x, at.y));
			for (let i = 0; i < Math.min(creature.stuckAmmo, cells.length); i++) {
				this.spawnGroundItem('stone', cells[i]!.x, cells[i]!.y);
			}
			creature.stuckAmmo = 0;
		}
		if (creature.kind === 'bat' && this.blacksmithAlternative) {
			const pickaxe = this.bag.find('pickaxe');
			if (pickaxe && pickaxe.affix !== 'bloodStained') {
				pickaxe.affix = 'bloodStained';
				Actors.identify(pickaxe);
				this.say(t('port.log.pickaxeblood'), 'positive');
			}
		}

		//Mob.java: `exp = Dungeon.hero.lvl <= maxLvl ? EXP : 0` - a mob outgrown by the hero's
		//level grants nothing; NPCs never fight and clones past generation 0 grant nothing
		if (creature.kind && !creature.isNPC) {
			//Talent.BOUNTY_HUNTER's real effect (`Mob.lootChance()`/`Char.java`, tag `v3.3.8`) is
			//an item-drop-chance bonus scoped to kills made via a `Preparation` buff (the
			//Assassin subclass's own special ability: prepare, then attack for a prep-level-
			//scaled bonus) - `2^(prepLevel-1) * 0.02 * points` added to drop chance, never gold,
			//and never on an ordinary kill. This port has no Preparation/prep-level ability
			//subsystem at all (`useSpecial` has no Assassin-specific branch for it), so this
			//substitutes a flat gold bonus on any kill instead, giving the talent point
			//something to do until that subsystem exists - found undocumented in the 2026-09-09
			//hero-progression audit; not fixed to the real mechanic here since it needs the
			//whole Preparation subsystem built first, not a formula change.
			const bounty = bountyGoldBonus(this.subclass(), this.talentRank('bounty_hunter'));
			if (bounty > 0) this.heroStats.setBase('gold', this.heroStats.base('gold') + bounty);
			//Necromancer's Minions' old stand-in is gone outright: real Java only rolls
			//(`0.4*points/3`, the formula `necromancerMinionChance` still encodes for reference)
			//on a SOUL-MARKED victim's death, raising a Corrupted Wraith ally - and this port
			//has no SoulMark application or Wraith kind; ally combat now exists, but the required
			//to fight in. What stood here instead (a hostile necro skeleton on EVERY warlock
			//kill, marked or not) had the trigger, the minion, and the allegiance all wrong,
			//actively punishing the talent - removal plus this note, not a quieter stub.
			const def = MONSTERS[creature.kind];
			const isClone = creature.kind === 'swarm' && (creature.generation ?? 0) > 0;
			if (!isClone && this.progression.level <= def.maxLvl) this.grantExperience(def.exp);
			if (this.subclass() === 'warlock' && this.talentRank('soul_eater') > 0) {
				const heal = this.talentRank('soul_eater');
				this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + heal);
				this.showHeal(this.hero, heal);
			}
			this.wandCharges.refund(soulSiphonCharge(this.subclass(), this.talentRank('soul_siphon')));
			//Invented substitute for real Java's `VARIED_CHARGE` (`MeleeWeapon.java`, tag
			//`v3.3.8`): `charger.gainCharge(points/6f)` on weapon-*ability* use (partial wand-
			//charge gain) - this port has no ability-use action separate from a kill (see
			//`aggressive_barrier`'s own note on this same gap), so this substitutes extra
			//missile ammo on kill instead. Undocumented until the 2026-09-09 hero-progression
			//audit; not rebuilt to the real mechanic here since it needs a wand-charger this
			//subclass talent could actually feed.
			if (this.subclass() === 'champion' && this.talentRank('secondary_charge') > 0) this.ammo += this.talentRank('secondary_charge');
		}

		//Mob.rollToDropLoot, simplified to one-item ground drops (no stacking heaps, no Wealth
		//rings): one roll per table entry through real rollLoot. `Dungeon.LimitedDrops` decay is
		//now real for bat/necromancer/guard (`LIMITED_DROP_DECAY`, below) - see `PORT_COVERAGE.md`
		//for the remaining kinds whose base chance/category still diverges from Java outright.
		if (creature.kind && !creature.isNPC) {
			if ((creature.kind === 'statue' || creature.kind === 'armoredStatue') && creature.mimicLoot?.startsWith('statue:')) {
				try {
					const payload = JSON.parse(creature.mimicLoot.slice('statue:'.length)) as StatueLoot;
					this.dropGeneratedStatueItem(payload.weapon, creature.x, creature.y);
					if (payload.armor) this.dropGeneratedStatueItem(payload.armor, creature.x, creature.y);
					this.say(t('port.log.statuedrops'), 'positive');
				} catch {
					// An old save can contain a pre-payload statue; its generic loot table is absent
					// deliberately, so a malformed legacy payload simply has no statue equipment.
				}
			}
			if ((creature.kind === 'mimic' || creature.kind === 'crystalMimic') && creature.mimicLoot) {
				const [bonusSpec, heldGoldText] = creature.mimicLoot.split(';heldGold:', 2);
				const [bonusPayload, heldItem] = bonusSpec.split(';held:', 2);
				const [lootFamily, lootClass] = bonusPayload.split('|', 2);
				const bonusKind = lootFamily.toLowerCase().includes('missile')
					? 'stone'
					: portItemKind(lootFamily);
				if (bonusKind) {
					this.spawnGroundItem(bonusKind, creature.x, creature.y, sourceInventoryItem(lootFamily, lootClass, (kind) => this.newItemInstanceId(kind)));
					this.say(t('port.log.drops', { who: capitalize(creature.name), item: t(GROUND_ITEM_KEYS[bonusKind]) }));
				}
				const heldGold = heldGoldText ? Number(heldGoldText) : 0;
				if (heldGold > 0) {
					const at = Roguelike.neighbourOffsets(8)
						.map(([dx, dy]) => ({ x: creature.x + dx, y: creature.y + dy }))
						.find((candidate) => this.level.passable(candidate.x, candidate.y)
							&& !this.groundItemAt(candidate.x, candidate.y) && !this.creatureAt(candidate.x, candidate.y));
					if (at) this.spawnGroundItem('gold', at.x, at.y, { id: 'gold', quantity: heldGold, identified: true });
				}
				if (heldItem) {
					const [heldFamily, heldClass] = heldItem.split('|', 2);
					const heldKind = portItemKind(heldFamily);
					const at = Roguelike.neighbourOffsets(8)
						.map(([dx, dy]) => ({ x: creature.x + dx, y: creature.y + dy }))
						.find((candidate) => this.level.passable(candidate.x, candidate.y)
							&& !this.groundItemAt(candidate.x, candidate.y) && !this.creatureAt(candidate.x, candidate.y));
					if (heldKind && at) this.spawnGroundItem(heldKind, at.x, at.y, sourceInventoryItem(heldFamily, heldClass, (kind) => this.newItemInstanceId(kind)));
				}
			}
			//Warlock.createLoot(): a flat 0.5 lootChance (no LimitedDrops decay on the roll
			//itself, unlike Bat/Necromancer/Guard/etc.), but the *kind* of potion it drops is a
			//separate roll this port's generic 'potion' MOB_LOOT kind can't express - drinking
			//this port's plain 'potion' id always heals (see quaffPotion), so a Warlock always
			//"dropping a potion" would always be a free heal, when real Java guarantees the
			//opposite most of the time. `Random.Int(3)==0 && Random.Int(8) > WARLOCK_HP.count`
			//(1/3 chance, then scaled to never over 8 real healing drops this run) picks
			//`PotionOfHealing`; otherwise a fresh non-healing potion class is redrawn until it
			//isn't Healing. Reproduced here as a real `potionHealing` drop on the rare branch,
			//else a uniform pick among this port's 7 already-modeled non-healing potion ids.
			if (creature.kind === 'warlock' && Actors.rollLoot({ entries: [{ id: 'drop', weight: 1 }], chance: 0.5 * ringWealthMultiplier(this.equippedRing) })) {
				const warlockHp = this.limitedDrops.warlock ?? 0;
				if (Random.int(3) === 0 && Random.int(8) > warlockHp) {
					this.limitedDrops.warlock = warlockHp + 1;
					this.spawnGroundItem('potion', creature.x, creature.y, { id: 'potionHealing', quantity: 1, identified: false });
				} else {
					const nonHealing = ['potionStrength', 'potionFlame', 'potionMindVision', 'potionInvis', 'potionPurity', 'potionExperience', 'potionLevitation'] as const;
					this.spawnGroundItem('potion', creature.x, creature.y, { id: Random.element(nonHealing)!, quantity: 1, identified: false });
				}
				this.say(t('port.log.drops', { who: capitalize(creature.name), item: t(GROUND_ITEM_KEYS.potion) }));
			}
			//Scorpio.createLoot(): a flat 0.5 lootChance, always a potion class that is neither
			//Healing nor Strength (a plain redraw-until-excluded loop, no LimitedDrops counter
			//involved) - the same generic-'potion'-always-heals mismatch as Warlock above, fixed
			//the same way: a uniform pick among this port's 6 remaining modeled potion ids.
			if (creature.kind === 'scorpio' && Actors.rollLoot({ entries: [{ id: 'drop', weight: 1 }], chance: 0.5 * ringWealthMultiplier(this.equippedRing) })) {
				const eligible = ['potionFlame', 'potionMindVision', 'potionInvis', 'potionPurity', 'potionExperience', 'potionLevitation'] as const;
				this.spawnGroundItem('potion', creature.x, creature.y, { id: Random.element(eligible)!, quantity: 1, identified: false });
				this.say(t('port.log.drops', { who: capitalize(creature.name), item: t(GROUND_ITEM_KEYS.potion) }));
			}
			//Succubus.createLoot(): a flat 0.33 lootChance, always a scroll class that is neither
			//Identify nor Upgrade (a redraw-until-excluded loop, no LimitedDrops counter) - the
			//same mismatch as Warlock/Scorpio above, since this port's generic 'scroll' bag id
			//only ever resolves to exactly those two excluded ids (see the pickup branch's own
			//25%-upgrade/75%-identify split). Reproduced with a uniform pick among this port's 9
			//other modeled scroll ids (all 10 non-Identify/Upgrade members of Java's real
			//12-class `SCROLL` pool, now that `scrollTransmutation`'s own appearance-table gap -
			//found and fixed in the same pass - no longer makes it a crash risk to hand out).
			if (creature.kind === 'succubus' && Actors.rollLoot({ entries: [{ id: 'drop', weight: 1 }], chance: 0.33 * ringWealthMultiplier(this.equippedRing) })) {
				const eligible = ['scrollCleanse', 'scrollMirror', 'scrollRecharging', 'scrollTeleportation', 'scrollLullaby', 'scrollMapping', 'scrollRage', 'scrollRetribution', 'scrollTerror', 'scrollTransmutation'] as const;
				this.spawnGroundItem('scroll', creature.x, creature.y, { id: Random.element(eligible)!, quantity: 1, identified: false });
				this.say(t('port.log.drops', { who: capitalize(creature.name), item: t(GROUND_ITEM_KEYS.scroll) }));
			}
			for (const entry of MOB_LOOT[creature.kind] ?? []) {
				//Dungeon.LimitedDrops: Bat/Necromancer/Guard each scale their own lootChance()
				//down further by how many times this exact drop has already happened this run -
				//`(7-n)/7`, `(6-n)/6`, `(1/3)^n` respectively, real Java's own per-kind formulas.
				const decay = LIMITED_DROP_DECAY[creature.kind as MonsterId];
				const chance = (decay ? entry.chance * decay(this.limitedDrops[creature.kind as MonsterId] ?? 0) : entry.chance)
					* ringWealthMultiplier(this.equippedRing);
				const drop = Actors.rollLoot({ entries: [{ id: entry.kind, weight: 1 }], chance });
				if (drop) {
					if (decay) this.limitedDrops[creature.kind as MonsterId] = (this.limitedDrops[creature.kind as MonsterId] ?? 0) + 1;
					this.spawnGroundItem(entry.kind, creature.x, creature.y);
					this.say(t('port.log.drops', { who: capitalize(creature.name), item: t(GROUND_ITEM_KEYS[entry.kind]) }));
					break;
				}
			}
			//guards carry the iron key (the locked-door stand-in) one time in three
			if (creature.kind === 'guard' && Random.chance(1 / 3)) {
				this.spawnGroundItem('ironKey', creature.x, creature.y, { id: 'ironKey', quantity: 1, identified: true });
				this.say(t('port.log.guardkey'));
			}
			//NewbornFireElemental.die(): an enemy newborn always drops its `Embers` where it
			//died (plus quest-score/music effects neither system here exists to play). No
			//MOB_LOOT roll - guaranteed, outside the decay/wealth machinery above.
			if (creature.kind === 'newbornElemental') {
				this.spawnGroundItem('embers', creature.x, creature.y, { id: 'embers', quantity: 1, identified: true, sourceClass: 'Embers' });
				this.say(t('port.log.emberdrop'), 'positive');
			}
			//a slain thief returns what it stole, plus the gold it drops fleeing-or-dead.
			//Bandit extends Thief and shares this unchanged - previously excluded here too by
			//the same literal-kind-check bug found for its flee behavior above, so a killed
			//Bandit's stolen item vanished for good instead of being recoverable.
			if ((creature.kind === 'thief' || creature.kind === 'bandit') && creature.stolen) {
				if (creature.stolen.startsWith('gold:')) {
					this.heroStats.setBase('gold', this.heroStats.base('gold') + 10);
				} else {
					this.bag.add({ id: creature.stolen, quantity: 1, stackable: true, identified: true });
				}
				this.say(t('port.log.thiefloot'), 'positive');
				this.heroStats.setBase('gold', this.heroStats.base('gold') + 5);
			}
			if (creature.kind === 'greatCrab') {
				for (const [dx, dy] of Roguelike.neighbourOffsets(4)) {
					const at = { x: creature.x + dx, y: creature.y + dy };
					if (this.level.passable(at.x, at.y) && !this.groundItemAt(at.x, at.y)) {
						this.spawnGroundItem('meat', at.x, at.y);
						break;
					}
				}
			}
		}

		//Necromancer.die kills its skeleton with it (SpectralNecromancer shares this unchanged)
		if ((creature.kind === 'necromancer' || creature.kind === 'spectralNecromancer') && creature.skeleton && creature.skeleton.hp > 0) {
			this.say(t('port.log.skeletoncollapses'));
			this.kill(creature.skeleton);
		}
		this.kingLinkedAdds.delete(creature);
		//RotHeart.die(): every RotLasher on the level dies with it (the same shape as the
		//necromancer rule above - Java iterates `Dungeon.level.mobs` the same way).
		if (creature.kind === 'rotHeart') {
			for (const other of [...this.creatures]) {
				if (other.kind === 'rotLasher' && other.hp > 0) this.kill(other);
			}
		}
		//YogDzewa.processFistDeath(): the last fist's death at phase 4 opens phase 5 (hope
		//yell, minion burst, bleed). The burst needs larva/ripper mobs this port doesn't
		//have, so only the yell fires here; bleed rides the bar's own 25% tint and the
		//cadence is already every turn.
		if (creature.kind === 'yogFist') {
			const yog = this.creatures.find((c) => c.kind === 'yog' && c.hp > 0);
			if (yog && (yog.yogPhase ?? 1) === 4 && !this.creatures.some((c) => c.kind === 'yogFist' && c.hp > 0)) {
				yog.yogPhase = 5;
				this.say(t('actors.mobs.yogdzewa.hope'), 'warning');
			}
		}

		//Imp quest: Monks and Golems drop DwarfTokens half the time on City depths
		if ((creature.kind === 'monk' || creature.kind === 'golem') && this.depth >= 16 && this.depth <= 19 && Random.chance(0.5)) {
			this.spawnGroundItem('dwarfToken', creature.x, creature.y);
			this.say(t('port.log.dropstoken', { who: capitalize(creature.name) }));
		}

		const boss = creature.kind ? BOSSES[this.depth] : undefined;
		if (boss && boss.kind === creature.kind) {
			this.say(boss.victory, 'positive');
			//boss badges, one per chapter (BOSS_SLAIN_1..4)
			if (creature.kind === 'goo') this.awardBadge('boss_goo');
			if (creature.kind === 'tengu') this.awardBadge('boss_tengu');
			if (creature.kind === 'dm300') this.awardBadge('boss_dm300');
			if (creature.kind === 'king') {
				this.awardBadge('boss_king');
				for (const add of [...this.kingAdds]) if (add.hp > 0) this.kill(add);
			}
			if (creature.kind === 'yog') {
				for (const fist of this.creatures.filter((c) => c.kind === 'yogFist')) this.kill(fist);
			}
			this.depth++;
			this.deepestDepth = Math.max(this.deepestDepth, this.depth);
			this.justDescended = true;
			this.enterLevel();
			if (creature.kind === 'yog') {
				//Yog dies on depth 25, but SPD's LastLevel (depth 26) is the amulet vault.
				//Place the reward after entering that new level; Java's LastLevel.createItems()
				//drops it at AMULET_POS = 12 * WIDTH + MID, not at the hero's arrival cell.
				//Spawning it before the transition would be cleared with the defeated boss floor.
				this.spawnGroundItem('amulet', 8, 12);
				this.say(t('port.log.amuletwaits'), 'positive');
			}
		} else {
			this.say(t('port.log.dies', { who: capitalize(creature.name) }));
		}

		//Ghost.Quest.process() on any of the three minibosses' deaths
		if (creature.kind === 'fetidRat' || creature.kind === 'gnollTrickster' || creature.kind === 'greatCrab') {
			this.gameState.setSwitch('ghostTargetSlain', true);
			this.quests.advanceStage('sadGhost', this.gameState);
			this.say(t('port.npc.ghost.echo'));
		}
	}

	/** `Bones.leave()`: seeded runs leave gold; normal runs may leave eligible carried/equipped loot. */
	private bonesEligible(item: { id: string; sourceClass?: string }): boolean {
		const value = `${item.id}|${item.sourceClass ?? ''}`.toLowerCase();
		// Item.bones defaults to false in Java. These are the concrete classes represented by
		// the port that explicitly opt out; keeping the list class-based also handles a generated
		// item whose playable family is only a stand-in (weaponReward/armorReward/cloak).
		const never = [
			'clotharmor', 'warriorarmor', 'magearmor', 'roguearmor', 'huntressarmor', 'duelistarmor',
			'berry', 'brokenseal', 'spiritbow', 'cloakofshadows', 'pickaxe',
			'dagger', 'gloves', 'magesstaff', 'rapier', 'throwingstone', 'throwingknife', 'throwingspike',
			//`Bomb` never sets `bones = true` (`Item.bones` defaults false), so neither form
			//is preserved - without this, bombs would enter bones through the live bag.
			//CorpseDust likewise (a single-use quest item, not bones material).
			'bomb', 'doublebomb', 'corpsedust',
		];
		return !never.some((name) => value.includes(name));
	}

	private leaveBones(): void {
		const gold = this.heroStats.base('gold');
		const goldPayload = (): GroundItem['item'] => ({
			id: 'gold',
			quantity: gold > 100 ? Random.range(50, Math.max(50, Math.floor(gold / 2))) : 50,
			identified: true,
		});
		let item: NonNullable<GroundItem['item']> = goldPayload()!;
		if (!this.seededRun) {
			// Bones.pickItem(): the Java code first chooses equipment/quickslot (2/3) or
			// eligible backpack loot (1/3), recursively retrying an empty equipment slot.
			// Keep the same draw order; this port represents unsupported equipped categories
			// through their corresponding carried item when one exists.
			const backpack = this.bag.items.filter((carried) =>
				!['gold', 'waterskin', 'crystalKey', 'ironKey'].includes(carried.id)
				&& this.bonesEligible(carried));
			const equipmentCandidate = (choice: number): NonNullable<GroundItem['item']> | null => {
				switch (choice) {
					case 0: return this.weaponId !== 'startingWeapon' && this.bonesEligible({ id: this.weaponId })
						? { id: 'weaponReward', quantity: 1, identified: true, level: this.weaponLevel, sourceClass: this.weaponId }
						: null;
					case 1: return this.armorId !== 'clothArmor' && this.bonesEligible({ id: this.armorId })
						? { id: 'armorReward', quantity: 1, identified: true, level: this.armorLevel, sourceClass: this.armorId }
						: null;
					case 2: return backpack.find((carried) => carried.id === 'cloak' || carried.id.includes('artifact')) ?? null;
					case 3: return backpack.find((carried) => !carried.id.startsWith('ring_')) ?? null;
					case 4: return backpack.find((carried) => carried.id.startsWith('ring_')) ?? null;
					default: return backpack[0] ?? null; // quickslot placeholder in this port
				}
			};
			let picked: NonNullable<GroundItem['item']> | null = null;
			while (!picked) {
				if (Random.int(3) !== 0) {
					picked = equipmentCandidate(Random.int(7));
				} else {
					// Java's `if (Random.Int(3) < items.size())` falls through to Gold
					// immediately when the backpack has no eligible entries.
					if (Random.int(3) < backpack.length) picked = Random.element(backpack)!;
					else break;
				}
			}
			if (picked) {
				item = { ...picked, quantity: picked.quantity > 1
					? Random.range(1, Math.max(1, Math.floor((picked.quantity + 1) / 2)))
					: 1 };
			}
		}
		const kind = portItemKind(item.id) ?? 'gold';
		this.bones.save('pending', {
			depth: Math.max(this.depth, this.deepestDepth - 5),
			branch: this.miningBranchActive ? 1 : 0,
			kind,
			item,
		});
	}

	/** Rebuild the feature definitions for a newly generated floor. Definitions are code; only
	 * the placed cell/kind pairs are persisted, matching MWG's FeatureLayer contract. */
	private resetPortedFeatures(): void {
		this.portedFeatures = new Roguelike.FeatureLayer<SewersScene>();
		for (const kind of ['awareness', 'health', 'waterOfAwareness', 'waterOfHealth']) {
			this.portedFeatures.define(`well:${kind}`, {
				persistent: false,
				consequence: (cell, scene) => scene.usePortedWellAtCell(cell),
			});
		}
	}

	private placePortedFeature(cell: number, kind: string): void {
		if (kind.startsWith('well:')) {
			this.portedFeatures.place(cell, kind);
			return;
		}
		const plantKind = `plant:${kind}`;
		this.portedFeatures.define(plantKind, {
			persistent: false,
			consequence: (featureCell, scene) => scene.triggerPortedPlantAt(featureCell % scene.level.width, Math.floor(featureCell / scene.level.width)),
		});
		this.portedFeatures.place(cell, plantKind);
	}

	private restorePortedFeatures(data?: { cells: [number, string][] }): void {
		this.resetPortedFeatures();
		const cells = data?.cells ?? this.portedPaint?.plants.map((plant) => [
			plant.pos,
			plant.kind.startsWith('wellWater:') ? `well:${plant.kind.slice('wellWater:'.length)}` : `plant:${plant.kind}`,
		] as [number, string]) ?? [];
		for (const [cell, kind] of cells) {
			if (kind.startsWith('plant:')) {
				this.portedFeatures.define(kind, {
					persistent: false,
					consequence: (featureCell, scene) => scene.triggerPortedPlantAt(featureCell % scene.level.width, Math.floor(featureCell / scene.level.width)),
				});
			}
			this.portedFeatures.place(cell, kind);
		}
	}

	private creatureAt(x: number, y: number): Creature | null {
		return this.creatures.find((c) => c.x === x && c.y === y) ?? null;
	}

	// -------------------------------------------------------------- drawing

	private refresh(): void {
		this.fov.update(this.hero.x, this.hero.y, this.viewRadius());

		// FogOfWar owns explored shading and half-wall occlusion above every world layer.
		// Keep water quads disabled while unexplored, but do not darken explored art twice.
		for (let y = 0; y < this.level.height; y++) for (let x = 0; x < this.level.width; x++) {
			this.waterSurface?.setCellColor(x, y, this.fov.isExplored(x, y) || this.fov.isVisible(x, y) ? 0xffffff : 0);
		}
		this.fog?.refresh(this.visualTerrainAt, (x, y) =>
			this.fov.isVisible(x, y) ? 0 : this.fov.isExplored(x, y) ? 1 : 3);
		this.wallBlocking?.setLayerData('blocking', Array.from(this.tileVariance, (_, cell) =>
			this.depth === 25 ? -1 : wallBlockingFrame(cell % this.level.width, Math.floor(cell / this.level.width),
				this.level.width, this.level.height, this.visualTerrainAt,
				(x, y) => this.level.inside(x, y) && (this.fov.isExplored(x, y) || this.fov.isVisible(x, y)))));

		//MindVision: while active, every ordinary monster's position shows through walls/fog,
		//same as Java's real "see_mobs" reveal - NPCs and the hero are unaffected (not Mobs).
		const mindVision = !!this.hero.buffs['mindvision'];
		for (const creature of this.creatures) {
			this.sprite(creature).visible = creature.isHero === true || this.fov.isVisible(creature.x, creature.y)
				|| (mindVision && !creature.isNPC);
		}
		if (this.stairsSprite) {
			this.stairsSprite.visible = this.fov.isExplored(this.stairs.x, this.stairs.y);
			this.stairsSprite.tint = 0xffffff;
		}
		for (const item of this.groundItems) {
			this.sprite(item).visible = this.fov.isExplored(item.x, item.y);
			this.sprite(item).tint = 0xffffff;
		}

		const boss = BOSSES[this.depth];
		const region = regionForDepth(this.depth);
		const place = boss
			? t('port.ui.lair', { boss: t(MOB_KEYS[boss.kind]) })
			: t('port.ui.place', { region: t(REGION_KEYS[region]), depth: this.depth });
		//the bag was spelled out item by item on the status line. It is a count here until the
		//inventory window lands (a later batch) - the full list belongs in a window, not in a
		//string reformatted every turn. See PORT_COVERAGE.md's "UI and presentation" table.
		const carriedCount = this.bag.items.filter((i) => i.quantity > 0).length;
		this.statusPane.update({
			place,
			seed: this.runSeedLabel,
			level: this.progression.level,
			hp: this.hero.hp,
			maxHp: this.hero.maxHp,
			//SPD's own `hero.exp / hero.maxExp()` is progress *within* the level, exp resetting
			//to 0 on each level-up. mwg's Progression keeps a running total instead, so the
			//level's own span is subtracted back out here to get the same fraction.
			exp: this.progression.experience - SPD_LEVEL_CURVE.experienceFor(this.progression.level),
			maxExp:
				SPD_LEVEL_CURVE.experienceFor(this.progression.level + 1) -
				SPD_LEVEL_CURVE.experienceFor(this.progression.level),
			accuracy: this.hero.accuracy,
			evasion: this.hero.evasion,
			strength: this.heroStr,
			gold: this.heroStats.base('gold'),
			waterskin: this.waterskin,
			waterskinMax: WATERSKIN_MAX,
			hunger: this.hunger >= 450 ? 'starving' : this.hunger >= 300 ? 'hungry' : 'none',
			buffs: Object.keys(this.hero.buffs),
			staff: this.heroClass === 'mage' ? { current: this.wandCharges.current, max: this.wandCharges.max } : null,
			ammo: CLASS_AMMO.has(this.heroClass) ? this.ammo : null,
			carriedCount,
		});
		this.refreshInventoryPanel();
		this.refreshTalentPanel();

		this.refreshHealthBars();
	}

	/**
	 * A health bar over every damaged, visible creature, `ui/CharHealthIndicator.java`: it
	 * spans `sprite.width * 4/6` starting `width/6` in, sits 2px above the sprite, and is
	 * visible only while `HP < HT`. Colours are `HealthBar.java`'s own (`COLOR_BG 0xCC0000`
	 * behind, `COLOR_HP 0x00EE00` in front).
	 */
	private refreshHealthBars(): void {
		const boss = this.creatures.find((creature) => creature.kind && BOSSES[this.depth]?.kind === creature.kind);
		this.currentBoss = boss ?? null;
		if (boss && boss.hp > 0) {
			this.bossChrome.visible = true;
			this.bossHealthBar.visible = true;
			this.bossNameLabel.visible = true;
			this.bossNameLabel.text = `${Math.max(0, boss.hp)}/${boss.maxHp}`;
			const fraction = boss.hp / boss.maxHp;
			this.bossHealthBar.setLevel(Math.max(0, fraction));
			//`BossHealthBar.bleed`: a one-shot colour swap when HP crosses 25%, not a
			//continuous flash - Java's own `update()` only re-tints on the boolean's *edge*
			const bleeding = fraction < 0.25;
			if (bleeding !== this.bossBleeding) {
				this.bossBleeding = bleeding;
				this.bossHealthBar.setFillColor(bleeding ? 0xff7777 : 0xffffff);
				this.bossNameLabel.setColor(bleeding ? 0xff3030 : theme().color.textHighlight);
			}
		} else {
			this.bossChrome.visible = false;
			this.bossHealthBar.visible = false;
			this.bossNameLabel.visible = false;
			this.bossBleeding = false;
		}
		for (const creature of this.creatures) {
			const hurt = creature.hp < creature.maxHp && creature.hp > 0;
			const show = hurt && !creature.isHero && this.sprite(creature).visible;

			let bar = this.healthBars.get(creature);
			if (!show) {
				if (bar) bar.visible = false;
				continue;
			}
			if (!bar) {
				bar = new Bar({
					width: TILE * (4 / 6),
					height: 1,
					fillColor: 0x00ee00,
					backgroundColor: 0xcc0000,
				});
				this.healthBars.set(creature, bar);
				this.camera.world.addChild(bar);
			}
			bar.visible = true;
			bar.x = creature.x * TILE + TILE / 6;
			bar.y = creature.y * TILE - 2;
			bar.setLevel(creature.hp / creature.maxHp);
		}
	}

	/**
	 * Run persistence through mwg/core's SaveSystem (named slot, versioned, plain JSON -
	 * Dungeon.saveGame's bundle simplified: stats, bag and quests are flat JSON, while visited
	 * floors retain their mutable terrain, entities and effects as sprite-free snapshots.
	 */
	private saveRun(): void {
		if (!this.miningBranchActive) this.captureActiveFloor();
		this.saves.save('run', {
			runSeed: this.runSeed,
			runSeedLong: this.runSeedLong.toString(),
			seededRun: this.seededRun,
		depth: this.depth,
		deepestDepth: this.deepestDepth,
		miningBranchActive: this.miningBranchActive,
			hp: this.hero.hp,
			maxHp: this.hero.maxHp,
			level: this.progression.level,
			experience: this.progression.experience,
			progressionState: this.progression.toJSON(),
			attackSkill: this.heroAttackSkill,
			defenseSkill: this.heroDefenseSkill,
			gold: this.heroStats.base('gold'),
			str: this.heroStr,
			heroStatsState: this.heroStats.toJSON(),
		weaponLevel: this.weaponLevel,
		weaponTier: this.weaponTier,
		armorLevel: this.armorLevel,
		armorTier: this.armorTier,
			weaponId: this.weaponId,
			weaponInstanceId: this.weaponInstanceId,
			armorId: this.armorId,
			armorInstanceId: this.armorInstanceId,
			waterskin: this.waterskin,
			hunger: this.hunger,
			hungerPartialDamage: this.hungerPartialDamage,
			ammo: this.ammo,
			ammoDurability: this.ammoDurability,
			missileLevel: this.missileLevel,
			frostWand: this.frostWand,
			wandType: this.wandType,
			ghostSpawned: this.ghostSpawned,
			ghostType: this.ghostType,
			wandmakerSpawned: this.wandmakerSpawned,
			wandmakerQuestType: this.wandmakerType,
			shopkeeperSpawned: this.shopSpawnedDepths.has(6),
			shopkeeperWarned: this.shopkeeperWarned,
			shopSpawnedDepths: [...this.shopSpawnedDepths],
			shops: [...this.shopStocks.entries()].map(([depth, stock]) => ([
				depth,
				{
					potions: stock.find('potion')?.quantity ?? 0,
					identifies: stock.find('scrollIdentify')?.quantity ?? 0,
					buyback: this.shopBuybackShelves.get(depth) ?? [],
				},
			] as [number, { potions: number; identifies: number; buyback: { id: string; quantity: number; identified?: boolean }[] }])),
			blacksmithSpawned: this.blacksmithSpawned,
			impSpawned: this.impSpawned,
			limitedDrops: Object.entries(this.limitedDrops) as [MonsterId, number][],
			blacksmithAlternative: this.blacksmithAlternative,
			bag: this.bag.items.map((i) => ({ id: i.id, quantity: i.quantity, instanceId: i.instanceId, identified: i.identified, level: i.level, sandBags: (i as typeof i & { sandBags?: number }).sandBags, charges: (i as typeof i & { charges?: number }).charges, affix: i.affix, cursed: i.cursed,
				cursedKnown: (i as typeof i & { cursedKnown?: boolean }).cursedKnown,
				usesLeftToIdentify: (i as typeof i & { usesLeftToIdentify?: number }).usesLeftToIdentify,
				availableUsesToIdentify: (i as typeof i & { availableUsesToIdentify?: number }).availableUsesToIdentify,
				durability: (i as typeof i & { durability?: number }).durability,
				maxDurability: (i as typeof i & { maxDurability?: number }).maxDurability,
				seal: (i as typeof i & { seal?: boolean }).seal })),
			bagState: this.bag.toJSON(),
			bagDefinitions: [...new Map(this.bag.items.map((item) => [item.id, { stackable: item.stackable, weight: item.weight } as Actors.ItemDefinition]))],
			bagSources: this.bag.items.map((item) => ({
				id: item.id,
				instanceId: item.instanceId,
				sandBags: (item as typeof item & { sandBags?: number }).sandBags,
				charges: (item as typeof item & { charges?: number }).charges,
				sourceClass: (item as typeof item & { sourceClass?: string }).sourceClass,
				cursedKnown: (item as typeof item & { cursedKnown?: boolean }).cursedKnown,
				usesLeftToIdentify: (item as typeof item & { usesLeftToIdentify?: number }).usesLeftToIdentify,
				availableUsesToIdentify: (item as typeof item & { availableUsesToIdentify?: number }).availableUsesToIdentify,
				durability: (item as typeof item & { durability?: number }).durability,
				maxDurability: (item as typeof item & { maxDurability?: number }).maxDurability,
				seal: (item as typeof item & { seal?: boolean }).seal,
			})),
			itemSerial: this.itemSerial,
			appearances: this.appearances.toJSON(),
			switches: this.gameState.toJSON().switches,
			questStages: this.quests.toJSON().stageIndex,
			equippedRing: this.equippedRing,
			ringHtBonus: this.ringHtBonus,
			advancement: this.advancement.toJSON(),
			talentPoints: this.talentPoints,
			charges: {
				wand: this.wandCharges.toJSON(),
				tome: this.tomeCharges.toJSON(),
				fire: this.fireCharges.toJSON(),
				bolt: this.boltCharges.toJSON(),
			},
			talentAccuracy: this.talentAccuracy,
			talentEvasion: this.talentEvasion,
			talents: Object.entries(this.talentRanks),
			heroShield: this.heroBarrier.total + this.blockingBarrier.total,
			heroBarrierState: this.heroBarrier.toJSON(),
			livingEarthArmor: this.livingEarthArmor,
			livingEarthWandLevel: this.livingEarthWandLevel,
			regrowthTotalChargesUsed: this.regrowthTotalChargesUsed,
			regrowthChargesOverLimit: this.regrowthChargesOverLimit,
			barrierPartialLoss: this.barrierPartialLoss,
			blockingBarrierState: this.blockingBarrier.toJSON(),
			blockingTurnsLeft: this.blockingTurnsLeft,
			stealthTalentTicks: this.stealthTalentTicks,
			natureBerriesDropped: this.natureBerriesDropped,
			intuitionTracker: this.intuitionTracker,
			wandBonusDamage: this.wandBonusDamage,
			physicalBonusDamage: this.physicalBonusDamage,
			physicalBonusAttacks: this.physicalBonusAttacks,
			patientStrikeReady: this.patientStrikeReady,
			healingEvasionTurns: this.healingEvasionTurns,
			sungrassHealing: this.sungrassHealing,
			sungrassPartial: this.sungrassPartial,
			healingLeft: this.healingLeft,
			sungrassPos: this.sungrassPos,
			deathlessFuryUsed: this.deathlessFuryUsed,
			weaponAffix: this.weaponAffix,
			weaponCurseDurability: this.weaponCurseDurability,
			weaponAugment: this.weaponAugment,
			charmTargets: [...this.charmTargets.entries()],
			charmIgnoreNextHit: [...this.charmIgnoreNextHit],
			armorGlyph: this.armorGlyph,
			kineticStored: this.kineticStored,
			timeBubbleTurns: this.timeBubbleTurns,
			timeBubblePresses: [...this.timeBubblePresses],
			hourglassFreeze: this.hourglassFreeze,
			hourglassTurnsToCost: this.hourglassTurnsToCost,
			buffs: Object.entries(this.hero.buffs) as [BuffId, number][],
			floors: [...this.floorStates],
		});
		this.say(t('port.log.saved'), 'positive');
	}

	private loadRun(): void {
		const data = this.saves.load('run');
		if (!data) {
			this.say(t('port.log.nosave'), 'negative');
			return;
		}
		const s = data.state;
		// The scene may currently hold a different run. Never capture it under the loaded depth
		// while `enterLevel` tears it down; replace the entire floor-state cache first.
		this.activeFloorDepth = null;
		this.floorStates = new Map(s.floors ?? []);
		resetPortedRun();
		this.runSeedLong = s.runSeedLong ? BigInt(s.runSeedLong) : BigInt(s.runSeed ?? this.runSeed);
		this.runSeed = Number(this.runSeedLong % 4294967296n) >>> 0;
		this.runSeedLabel = s.runSeedLong ?? String(this.runSeed);
		this.seededRun = s.seededRun ?? false;
		if (s.appearances) this.appearances = Actors.Appearances.fromJSON(APPEARANCE_TABLES, s.appearances);
		this.depth = s.depth;
		this.deepestDepth = Math.max(this.depth, s.deepestDepth ?? this.depth);
		this.miningBranchActive = s.miningBranchActive ?? false;
		this.heroStr = s.str;
		this.heroAttackSkill = s.attackSkill ?? 10;
		this.heroDefenseSkill = s.defenseSkill ?? 5;
		this.talentAccuracy = s.talentAccuracy ?? 0;
		this.talentEvasion = s.talentEvasion ?? 0;
		this.talentRanks = Object.fromEntries(s.talents ?? []);
		this.heroBarrier = s.heroBarrierState
			? Actors.Barrier.fromJSON(s.heroBarrierState)
			: new Actors.Barrier();
		this.livingEarthArmor = s.livingEarthArmor ?? 0;
		this.livingEarthWandLevel = s.livingEarthWandLevel ?? 0;
		this.regrowthTotalChargesUsed = s.regrowthTotalChargesUsed ?? 0;
		this.regrowthChargesOverLimit = s.regrowthChargesOverLimit ?? 0;
		if (!s.heroBarrierState && s.heroShield) this.heroBarrier.add(s.heroShield);
		this.barrierPartialLoss = s.barrierPartialLoss ?? 0;
		this.blockingBarrier = s.blockingBarrierState
			? Actors.Barrier.fromJSON(s.blockingBarrierState)
			: new Actors.Barrier();
		if (!s.blockingBarrierState && (s.blockingShieldLeft ?? 0) > 0) {
			//Pre-two-pool saves kept Blocking's share inside the shared pool: carve it back
			//out so totals are preserved exactly across the migration.
			const moved = Math.min(s.blockingShieldLeft ?? 0, this.heroBarrier.total);
			this.heroBarrier.absorb(moved);
			if (moved > 0) this.blockingBarrier.add(moved);
		}
		this.blockingTurnsLeft = s.blockingTurnsLeft ?? 0;
		this.stealthTalentTicks = s.stealthTalentTicks ?? 0;
		this.natureBerriesDropped = s.natureBerriesDropped ?? 0;
		this.intuitionTracker = s.intuitionTracker ?? false;
		this.wandBonusDamage = s.wandBonusDamage ?? 0;
		this.physicalBonusDamage = s.physicalBonusDamage ?? 0;
		this.physicalBonusAttacks = s.physicalBonusAttacks ?? 0;
		this.patientStrikeReady = s.patientStrikeReady ?? false;
		this.healingEvasionTurns = s.healingEvasionTurns ?? 0;
		this.sungrassHealing = s.sungrassHealing ?? 0;
		this.sungrassPartial = s.sungrassPartial ?? 0;
		this.healingLeft = s.healingLeft ?? 0;
		this.sungrassPos = s.sungrassPos ?? -1;
		this.deathlessFuryUsed = s.deathlessFuryUsed ?? false;
		this.weaponLevel = s.weaponLevel;
		this.weaponTier = s.weaponTier ?? 1;
		this.armorLevel = s.armorLevel;
		this.armorTier = s.armorTier ?? 1;
		this.weaponId = s.weaponId ?? 'startingWeapon';
		this.weaponInstanceId = s.weaponInstanceId;
		this.armorId = s.armorId ?? 'clothArmor';
		this.armorInstanceId = s.armorInstanceId;
		this.weaponAffix = s.weaponAffix ?? null;
		//`Swiftness` exists in real Java only as an armor glyph (`Armor.Glyphs.Swiftness` -
		//checked tag `v3.3.8`: no `Weapon.Enchantments.Swiftness` class at all); this port
		//previously modeled a phantom 0.9x weapon version too, now removed with no equivalent
		//to map to, so a pre-correction weapon `swiftness` id is dropped rather than kept.
		if (this.weaponAffix === 'swiftness') this.weaponAffix = null;
		this.weaponCurseDurability = s.weaponCurseDurability ?? 100;
		this.weaponAugment = s.weaponAugment ?? null;
		this.charmTargets = new Map(s.charmTargets ?? []);
		this.charmIgnoreNextHit = new Set(s.charmIgnoreNextHit ?? []);
		this.armorGlyph = s.armorGlyph ?? null;
		//`Fragile` never existed in real Java (the 8th armor curse is `Stench` - see the
		//affix-table comment); saves from before the correction carry it here and on bag
		//items, so both migrate to `stench` on load rather than silently losing their curse.
		if (this.armorGlyph === 'fragile') this.armorGlyph = 'stench';
		this.kineticStored = s.kineticStored ?? 0;
		this.timeBubbleTurns = s.timeBubbleTurns ?? 0;
		this.timeBubblePresses = new Set(s.timeBubblePresses ?? []);
		this.hourglassFreeze = s.hourglassFreeze ?? false;
		this.hourglassTurnsToCost = s.hourglassTurnsToCost ?? 2;
		this.waterskin = s.waterskin;
		this.hunger = s.hunger;
		this.hungerPartialDamage = s.hungerPartialDamage ?? 0;
		this.ammo = s.ammo;
		this.ammoDurability = s.ammoDurability ?? 100;
		this.missileLevel = s.missileLevel ?? 0;
		this.frostWand = s.frostWand;
		this.wandType = s.wandType ?? (this.frostWand ? 'frost' : 'magicMissile');
		this.ghostSpawned = s.ghostSpawned;
		this.ghostType = s.ghostType;
		this.wandmakerSpawned = s.wandmakerSpawned;
		this.wandmakerType = s.wandmakerQuestType ?? 0;
		if (this.wandmakerType !== 0) setWandmakerQuestType(this.wandmakerType);
		this.shopStocks.clear();
		this.shopBuybackShelves.clear();
		this.shopSpawnedDepths = new Set(s.shopSpawnedDepths ?? (s.shopkeeperSpawned ? [6] : []));
		for (const [depth, shop] of s.shops ?? []) {
			this.shopSpawnedDepths.add(depth);
			//Rebuilt at exactly the saved counts - never through `shopStockFor`, whose
			//first-touch seeding would resurrect a shelf the save recorded depleted.
			const stock = new Actors.Inventory();
			if (shop.potions > 0) stock.add({ id: 'potion', quantity: shop.potions, stackable: true, identified: true });
			if (shop.identifies > 0) stock.add({ id: 'scrollIdentify', quantity: shop.identifies, stackable: true, identified: true });
			this.shopStocks.set(depth, stock);
			this.shopBuybackShelves.set(depth, (shop.buyback ?? []).slice(0, 3));
		}
		this.shopkeeperWarned = s.shopkeeperWarned ?? false;
		this.blacksmithSpawned = s.blacksmithSpawned ?? this.blacksmithSpawned;
		this.impSpawned = s.impSpawned ?? this.impSpawned;
		this.limitedDrops = Object.fromEntries(s.limitedDrops ?? []);
		this.blacksmithAlternative = s.blacksmithAlternative ?? this.blacksmithAlternative;
		this.equippedRing = s.equippedRing ?? null;
		this.ringHtBonus = s.ringHtBonus ?? 0;
		this.advancement = s.advancement ? Actors.Advancement.fromJSON(SUBCLASS_TRACK, s.advancement) : new Actors.Advancement(SUBCLASS_TRACK);
		this.subclassChoiceOpen = Boolean(SUBCLASS_OPTIONS[this.heroClass] && this.advancement.openTiers(s.level).includes(0) && !this.advancement.choice(0));
		this.armorChoiceOpen = Boolean(this.advancement.openTiers(s.level).includes(1) && !this.advancement.choice(1));
		this.talentOpen = this.subclassChoiceOpen || this.armorChoiceOpen;
		this.itemPickerOpen = false;
		this.itemPickerEntries = [];
		this.itemPickerOnPick = null;
		const classDef = CLASSES[this.heroClass];
		this.heroStats = s.heroStatsState
			? Actors.StatBlock.fromJSON({ base: { accuracy: classDef.accuracy, evasion: 5, gold: 0 } }, s.heroStatsState)
			: this.heroStats;
		this.heroStats.setBase('gold', s.heroStatsState?.base.gold ?? s.gold);
		//A save from before the per-tier talent-point split (see `talentPoints`'s own comment)
		//has no `talentPoints` array, only the old single pool's remaining count
		//(`skillPointsState.points`/`skillPoints`) - dumped into the T1 bucket as a one-time
		//migration, since the old save has no record of which tier those leftover points came
		//from. A save already on the new format just restores its array directly.
		this.talentPoints = s.talentPoints ?? [s.skillPointsState?.points ?? s.skillPoints ?? 0, 0, 0];
		this.itemSerial = s.itemSerial ?? 0;
		if (s.bagState && s.bagDefinitions) {
			this.bag = Actors.Inventory.fromJSON(new Map(s.bagDefinitions), s.bagState);
			for (const item of this.bag.items) {
				const source = s.bagSources?.find((saved) => saved.id === item.id && saved.instanceId === item.instanceId);
				if (source?.sourceClass) (item as typeof item & { sourceClass?: string }).sourceClass = source.sourceClass;
				if (source?.sandBags !== undefined) (item as typeof item & { sandBags?: number }).sandBags = source.sandBags;
				if (source?.charges !== undefined) (item as typeof item & { charges?: number }).charges = source.charges;
				if (source?.cursedKnown !== undefined) (item as typeof item & { cursedKnown?: boolean }).cursedKnown = source.cursedKnown;
				const state = item as typeof item & { usesLeftToIdentify?: number; availableUsesToIdentify?: number; durability?: number; maxDurability?: number; seal?: boolean };
				if (source?.usesLeftToIdentify !== undefined) state.usesLeftToIdentify = source.usesLeftToIdentify;
				if (source?.availableUsesToIdentify !== undefined) state.availableUsesToIdentify = source.availableUsesToIdentify;
				if (source?.durability !== undefined) state.durability = source.durability;
				if (source?.maxDurability !== undefined) state.maxDurability = source.maxDurability;
				if (source?.seal !== undefined) state.seal = source.seal;
			}
		} else {
			this.bag = new Actors.Inventory();
			for (const item of s.bag) {
				const instanceId = item.instanceId ?? (item.id === 'clothArmor' || item.id === 'armor' || item.id === 'armorReward' || item.id === 'weaponReward' || item.id.startsWith('ring_') ? this.newItemInstanceId(item.id) : undefined);
				this.bag.add({ ...item, instanceId, stackable: true });
				if (instanceId && s.itemSerial === undefined) this.itemSerial++;
			}
		}
		for (const item of this.bag.items) {
			if ((item as { affix?: string }).affix === 'fragile') (item as { affix?: string }).affix = 'stench';
			//Phantom weapon Swiftness (see the weaponAffix migration above): `swiftness` is only
			//a real id on armor, so a non-armor bag item carrying it is pre-correction residue.
			if ((item as { affix?: string }).affix === 'swiftness'
				&& item.id !== 'clothArmor' && item.id !== 'armor' && item.id !== 'armorReward') delete (item as { affix?: string }).affix;
		}
		this.armorInstanceId ??= this.bag.find(this.armorId)?.instanceId;
		this.gameState = new Rpg.GameState();
		for (const [name, value] of s.switches) this.gameState.setSwitch(name, value);
		this.quests = Rpg.QuestLog.fromJSON(
			[SAD_GHOST_QUEST, WANDMAKER_QUEST, BLACKSMITH_QUEST, IMP_QUEST],
			{ stageIndex: s.questStages },
		);
		this.progression = Actors.Progression.fromJSON(SPD_LEVEL_CURVE, s.progressionState ?? { level: s.level, experience: s.experience });
		if (s.charges) {
			const wandSave = { ...s.charges.wand, progress: s.charges.wand.progress > 1 ? s.charges.wand.progress / 12 : s.charges.wand.progress };
			this.wandCharges = Actors.Charges.fromJSON({ max: 4, regenRate: 1 }, wandSave);
			this.tomeCharges = Actors.Charges.fromJSON({ max: 3, regenRate: 20 }, s.charges.tome);
			this.fireCharges = Actors.Charges.fromJSON({ max: 3, current: 0, regenRate: 9999 }, s.charges.fire);
			this.boltCharges = Actors.Charges.fromJSON({ max: 3, current: 0, regenRate: 9999 }, s.charges.bolt);
		}
		this.hero.hp = Math.min(s.hp, s.maxHp);
		this.hero.maxHp = s.maxHp;
		this.hero.buffs = Object.fromEntries(s.buffs ?? []) as Partial<Record<BuffId, number>>;
		this.syncHeroFromStats();
		this.enterLevel();
		this.say(t('port.log.loaded', { depth: s.depth, level: s.level }), 'highlight');
	}

	private buildInterface(): void {
		//StatusPane sits top-left, where GameScene.java puts it
		this.statusPane = new StatusPane(runState.sprites.uiStatusPane, runState.sprites.uiBuffs, runState.sprites[this.heroClass]);
		this.statusPane.x = 0;
		this.statusPane.y = 0;
		this.stage.addChild(this.statusPane);
		this.infoPanel = new InfoWindow();
		this.stage.addChild(this.infoPanel);
		this.statusPane.on('pointertap', () => {
			this.stage.addChild(this.infoPanel);
			this.infoPanel.show(`${capitalize(t(CLASSES[this.heroClass].nameKey))} - ${this.progression.level}`, [
				[t('windows.wndhero$statstab.health'), `${Math.max(0, this.hero.hp)}/${this.hero.maxHp}`],
				[t('windows.wndhero$statstab.str'), String(this.heroStr)],
				[t('port.ui.accuracy'), String(this.hero.accuracy)],
				[t('port.ui.evasion'), String(this.hero.evasion)],
				[t('windows.wndhero$statstab.exp'), String(this.progression.experience)],
				[t('windows.wndhero$statstab.gold'), String(this.heroStats.base('gold'))],
				[t('windows.wndhero$statstab.depth'), String(this.depth)],
				[t('windows.wndhero$statstab.dungeon_seed'), this.runSeedLabel],
			], Game.current.width, Game.current.height);
		});

		//StatusPane.java centers the compass around the hero avatar.
		this.compass = new Compass(runState.sprites.uiIcons);
		this.stage.addChild(this.compass);

		this.gameLog = new GameLog(320);
		this.gameLog.x = 8;
		this.stage.addChild(this.gameLog);

		//see announceBuff's comment: the live scene is what turns a landed buff into text
		setAnnounceBuff((creature, id) => this.showStatus(creature, id, SPD_STATUS_COLOR.warning));

		//the keybind cheat-sheet used to be concatenated onto the end of the status line,
		//where it was reread every turn for information that never changes. It sits in the
		//corner on its own now; SPD needs no such list because its Toolbar's buttons are the
		//discoverable form of it, which is a later batch (see PORT_COVERAGE.md).
		this.hintLabel = new Label({
			text: t('port.hint.keys'),
			color: theme().color.textDim,
			size: 8,
		});
		this.hintLabel.alpha = 0.55;
		// The pointer toolbar exposes these actions; avoid a second line across its labels.
		this.hintLabel.visible = false;
		this.stage.addChild(this.hintLabel);

		// Toolbar.java's grouped art/layout, with fixed quick actions for this port.
		// ItemSpriteSheet.MISSILE_WEP starts at 144; Cleric uses a wand placeholder
		// because this checkout's item sheet predates HolyTome.
		const specialFrame = { warrior: 147, mage: ITEM_FRAME.wand, rogue: 146, huntress: 144, duelist: 145, cleric: ITEM_FRAME.wand }[this.heroClass];
		this.actionBar = new SpdToolbar(
			[ITEM_FRAME.scroll, ITEM_FRAME.potion, ITEM_FRAME.food, specialFrame].map(frame => this.itemsSheet.get(frame)),
			(action) => {
				if (action === 'inventory') {
					this.inventoryOpen = !this.inventoryOpen;
					this.refreshInventoryPanel();
				} else if (action === 'journal') this.openJournal();
				else this.onAction(action);
			},
			() => this.positionInterface(Game.current.width, Game.current.height),
		);
		this.stage.addChild(this.actionBar);

		this.inventoryPanel = new InventoryWindow(
			(id, instanceId) => this.useItemById(id, instanceId),
			() => { this.inventoryOpen = false; this.inventoryPanel.reset(); this.refreshInventoryPanel(); },
		);
		this.stage.addChild(this.inventoryPanel);
		this.refreshInventoryPanel();
		this.talentPanel = new Container();
		this.stage.addChild(this.talentPanel);
		this.refreshTalentPanel();
		this.victoryPanel = new Container();
		this.stage.addChild(this.victoryPanel);
		this.victoryPanel.visible = false;
		this.bossNameLabel = new Label({ text: '', size: 10, align: 'center', color: theme().color.textHighlight });
		this.stage.addChild(this.bossNameLabel);
		//BossHealthBar: real 64x16 chrome at an integer scale. Java's hp strip is
		//source rect (15,19,47,4), corresponding to inset (15,3) in the top frame.
		this.bossChrome = new Container();
		this.bossChrome.addChild(new Sprite(new Texture({ source: runState.sprites.uiBossHp.source, frame: new Rectangle(0, 0, 64, 16) })));
		const skull = new Sprite(new Texture({ source: runState.sprites.uiBossHp.source, frame: new Rectangle(5, 18, 6, 6) }));
		skull.position.set(5, 5); this.bossChrome.addChild(skull);
		this.bossChrome.scale.set(2);
		this.stage.addChild(this.bossChrome);
		this.bossHealthBar = new Bar({ width: 94, height: 8, fill: new Texture({ source: runState.sprites.uiBossHp.source, frame: new Rectangle(15, 19, 47, 4) }), backgroundColor: 0x000000 });
		this.stage.addChild(this.bossHealthBar);
		this.stage.addChild(this.bossNameLabel);
		this.bossNameLabel.style.fontSize = 7;
		this.bossNameLabel.alpha = 0.6;
		this.bossNameLabel.visible = false;
		this.bossChrome.visible = false;
		this.bossHealthBar.visible = false;
		this.badgeBanner = new BadgeBannerLayer(runState.sprites.uiBadges);
		this.stage.addChild(this.badgeBanner);
		//`bossInfo`'s click -> `WndInfoMob`: no mob-info window exists in this port, so this
		//logs the same name/HP line the bar already shows, the same "detailed window
		//simplifies to a log line" pattern `awardBadge` already uses for `BadgeBanner`
		this.bossHealthBar.eventMode = 'static';
		this.bossHealthBar.cursor = 'pointer';
		this.bossHealthBar.on('pointerdown', () => {
			if (!this.currentBoss) return;
			this.say(
				t('port.log.bossinfo', {
					name: capitalize(this.currentBoss.name),
					hp: Math.max(0, this.currentBoss.hp),
					maxHp: this.currentBoss.maxHp,
				})
			);
		});
	}

	/** LastLevel's Amulet pickup ends the run with a visible, restartable result screen. */
	private showVictoryPanel(): void {
		this.victoryPanel.removeChildren().forEach((child) => child.destroy());
		this.victoryPanel.visible = true;
		const width = Math.min(380, Math.max(260, Game.current.width - 28));
		const height = 150;
		this.victoryPanel.addChild(new Graphics().roundRect(0, 0, width, height, 10)
			.fill({ color: 0x0c1018, alpha: 0.98 }).stroke({ width: 3, color: 0xe0bd61 }));
		const title = new Label({ text: t('port.ui.victorytitle'), size: 22, bold: true, align: 'center', color: 0xf3d477 });
		title.anchor.set(0.5, 0);
		title.position.set(width / 2, 16);
		this.victoryPanel.addChild(title);
		const summary = new Label({
			text: t('port.ui.victorysummary', { level: this.progression.level, depth: this.depth }),
			size: 11, align: 'center', wrapWidth: width - 24, color: theme().color.text,
		});
		summary.anchor.set(0.5, 0);
		summary.position.set(width / 2, 55);
		this.victoryPanel.addChild(summary);
		const restart = new Button({ width: width - 40, height: 34, text: t('port.ui.newrun'), onClick: () => Game.current.switchScene(TitleScene) });
		restart.position.set(20, 102);
		restart.eventMode = 'static';
		restart.cursor = 'pointer';
		this.victoryPanel.addChild(restart);
		this.positionInterface(Game.current.width, Game.current.height);
	}

	private showDefeatPanel(): void {
		this.victoryPanel.removeChildren().forEach((child) => child.destroy());
		this.victoryPanel.visible = true;
		const width = Math.min(380, Math.max(260, Game.current.width - 28));
		this.victoryPanel.addChild(new Graphics().roundRect(0, 0, width, 150, 10)
			.fill({ color: 0x160d12, alpha: 0.98 }).stroke({ width: 3, color: 0xb95858 }));
		const title = new Label({ text: t('port.ui.defeattitle'), size: 22, bold: true, align: 'center', color: 0xe58c8c });
		title.anchor.set(0.5, 0);
		title.position.set(width / 2, 16);
		this.victoryPanel.addChild(title);
		const summary = new Label({ text: t('port.ui.defeatsummary', { depth: this.depth }), size: 11, align: 'center', wrapWidth: width - 24, color: theme().color.text });
		summary.anchor.set(0.5, 0);
		summary.position.set(width / 2, 55);
		this.victoryPanel.addChild(summary);
		const restart = new Button({ width: width - 40, height: 34, text: t('port.ui.newrun'), onClick: () => Game.current.switchScene(TitleScene) });
		restart.position.set(20, 102);
		restart.eventMode = 'static';
		restart.cursor = 'pointer';
		this.victoryPanel.addChild(restart);
		this.positionInterface(Game.current.width, Game.current.height);
	}

	/** Small explicit talent window: earned points are assigned to accuracy or evasion. */
	private refreshTalentPanel(): void {
		if (!this.talentPanel) return;
		this.talentPanel.removeChildren().forEach((child) => child.destroy());
		this.talentPanel.visible = this.talentOpen;
		if (!this.talentOpen) return;
		const width = Math.min(320, Math.max(240, Game.current.width - 24));
		if (this.itemPickerOpen) {
			//Generic `WndBag.ItemSelector` panel: title, one compact row per eligible entry
			//(two columns past 6 entries so a full bag still fits on screen), then a cancel
			//row. Labels reuse the inventory panel's own display names (appearance phrases
			//for unidentified potions/scrolls included) with a stack count where it matters.
			const cols = this.itemPickerEntries.length > 6 ? 2 : 1;
			const rows = Math.ceil(this.itemPickerEntries.length / cols);
			const rowHeight = 24;
			const panelHeight = 34 + rows * (rowHeight + 4) + (rowHeight + 4);
			this.talentPanel.addChild(new Graphics().roundRect(0, 0, width, panelHeight, 6)
				.fill({ color: 0x101116, alpha: 0.98 }).stroke({ width: 2, color: 0xc9a24c }));
			const pickerTitle = new Label({
				text: this.itemPickerTitle,
				size: 13, bold: true, color: theme().color.textHighlight,
			});
			pickerTitle.position.set(10, 7);
			this.talentPanel.addChild(pickerTitle);
			const columnWidth = (width - 16) / cols;
			this.itemPickerEntries.forEach((entry, index) => {
				const row = Math.floor(index / cols);
				const col = index % cols;
				const label = this.itemDisplayName(entry.id, entry.identified ?? false, entry.instanceId)
					+ (entry.quantity > 1 ? ` x${entry.quantity}` : '');
				const button = new Button({
					width: columnWidth - 8, height: rowHeight, text: label,
					onClick: () => this.chooseItemPicker(index),
				});
				button.position.set(8 + col * columnWidth, 34 + row * (rowHeight + 4));
				button.eventMode = 'static';
				button.cursor = 'pointer';
				this.talentPanel.addChild(button);
			});
			const cancel = new Button({
				width: width - 16, height: rowHeight, text: t('port.ui.itempicker.cancel'),
				onClick: () => this.chooseItemPicker(-1),
			});
			cancel.position.set(8, 34 + rows * (rowHeight + 4));
			cancel.eventMode = 'static';
			cancel.cursor = 'pointer';
			this.talentPanel.addChild(cancel);
			this.positionInterface(Game.current.width, Game.current.height);
			return;
		}
		if (this.subclassChoiceOpen || this.armorChoiceOpen || this.augmentChoiceOpen) {
			const options: readonly string[] = this.augmentChoiceOpen ? AUGMENT_OPTIONS
				: this.armorChoiceOpen ? ARMOR_OPTIONS : (SUBCLASS_OPTIONS[this.heroClass] ?? []);
			//Augment's option text ("Speed (+20% attack speed)") is real Java's own longer wording
			//(the actual button in `WndAugment` just says "Speed"/"Damage"/"None", with the detail
			//living in a separate message block above it) - kept as-is since it already existed in
			//this file before this pass, so it gets one full-width row per option instead of armor/
			//subclass's existing 2-up column layout, which is too narrow for text this long.
			const rowHeight = this.augmentChoiceOpen ? 30 : 38;
			const panelHeight = this.augmentChoiceOpen ? 34 + options.length * (rowHeight + 4) : 92;
			this.talentPanel.addChild(new Graphics().roundRect(0, 0, width, panelHeight, 6)
				.fill({ color: 0x101116, alpha: 0.98 }).stroke({ width: 2, color: 0xc9a24c }));
			const title = new Label({
				text: this.augmentChoiceOpen ? t('port.ui.augment.title') : this.armorChoiceOpen ? t('port.ui.armorability') : t('port.ui.subclass'),
				size: 13, bold: true, color: theme().color.textHighlight,
			});
			title.position.set(10, 7);
			this.talentPanel.addChild(title);
			const columnWidth = (width - 16) / options.length;
			options.forEach((option, index) => {
				const key = this.augmentChoiceOpen ? `port.ui.augment.${option}` : this.armorChoiceOpen ? `port.armor.${option}` : `port.subclass.${option}`;
				const button = new Button({
					width: this.augmentChoiceOpen ? width - 16 : columnWidth - 8, height: rowHeight, text: t(key),
					onClick: () => this.augmentChoiceOpen ? this.chooseAugment(option as (typeof AUGMENT_OPTIONS)[number])
						: this.armorChoiceOpen ? this.chooseArmorAbility(option) : this.chooseSubclass(option),
				});
				button.position.set(this.augmentChoiceOpen ? 8 : 8 + index * columnWidth, this.augmentChoiceOpen ? 34 + index * (rowHeight + 4) : 34);
				button.eventMode = 'static';
				button.cursor = 'pointer';
				this.talentPanel.addChild(button);
			});
			this.positionInterface(Game.current.width, Game.current.height);
			return;
		}
		const points = this.talentPoints[this.talentTier - 1] ?? 0;
		const defs: TalentDefinition[] = this.talentTier === 3
			? subclassTalentDefinitions(this.subclass() ?? '', this.heroClass)
			: (CLASS_TALENTS[this.heroClass]?.[this.talentTier - 1] ?? []);
		const panelHeight = 138;
		this.talentPanel.addChild(new Graphics().roundRect(0, 0, width, panelHeight, 6)
			.fill({ color: 0x101116, alpha: 0.96 }).stroke({ width: 2, color: 0x8b7651 }));
		const title = new Label({ text: `${t('port.action.talents')} · ${t('port.talent.tier', { tier: this.talentTier })} (${points})`, size: 11, bold: true, color: theme().color.textHighlight });
		title.position.set(8, 6);
		this.talentPanel.addChild(title);
		[1, 2, 3].forEach(tier => {
			const tab = new Button({ width: 38, height: 17, text: `T${tier}`, onClick: () => {
				const unlocked = tier === 1 || (tier === 2 && this.progression.level >= 7) || (tier === 3 && !!this.subclass() && this.progression.level >= 13);
				if (unlocked) { this.talentTier = tier as 1 | 2 | 3; this.refreshTalentPanel(); }
			} });
			tab.position.set(width - 122 + (tier - 1) * 40, 4);
			this.talentPanel.addChild(tab);
		});
		const description = new Label({ text: t('port.talent.select'), size: 6, wrapWidth: width - 16, color: theme().color.textDim });
		description.position.set(8, 108);
		this.talentPanel.addChild(description);
		defs.forEach((def: TalentDefinition, index: number) => {
			const rank = this.talentRank(def.id);
			const button = new Button({ width: width - 16, height: 17, text: `${t(`actors.hero.talent.${def.id}.title`)}  ${rank}/${def.maxRank}`, onClick: () => {
				description.setText(t(`actors.hero.talent.${def.id}.desc`));
				const tierIndex = this.talentTier - 1;
				if (rank < def.maxRank && this.talentPoints[tierIndex] > 0) {
					this.talentPoints[tierIndex]--;
					this.talentRanks[def.id] = rank + 1;
					this.syncHeroFromStats();
					this.say(t('port.log.talentspent', { stat: t(`actors.hero.talent.${def.id}.title`) }), 'positive');
					this.refresh();
				}
			} });
			button.position.set(8, 27 + index * 16);
			this.talentPanel.addChild(button);
		});
		this.positionInterface(Game.current.width, Game.current.height);
	}

	private talentRank(id: string): number { return this.talentRanks[id] ?? 0; }

	/**
	 * Turn-cost multiplier for hero actions, based on equipped gear and buffs.
	 * <1 = faster actions (Weapon.Augment SPEED, Swiftness glyph)
	 * >1 = slower actions (encumbrance penalties, once modeled)
	 * Default: 1 (no modifier)
	 */
	private getActionTurnCostMod(): number {
		let mod = 1;
		// Swiftness glyph: 20% speed increase (0.8x turn cost) when no enemies are within 3 cells.
		if (this.armorGlyph === 'swiftness') {
			const hasNearbyEnemy = this.creatures.some(
				(c) => !c.isHero && !c.isNPC && Roguelike.chebyshevDistance(this.hero, c) <= 3
			);
			if (!hasNearbyEnemy) mod *= 0.8;
		}
		//Bulk has no proc: Java's Armor.speedFactor makes movement/actions three times
		//faster while the hero occupies an open or closed doorway.
		if (this.armorGlyph === 'bulk' && this.doors.isDoor(this.hero.x, this.hero.y)) mod /= 3;
		//Char.speed()'s real `if (buff(Haste.class)) speed *= 3f` (PotionOfHaste).
		if (this.hero.buffs['haste']) mod /= 3;
		//RingOfHaste.speedMultiplier(): a higher Char.speed() means less time per action in
		//real Java; this port's turn-cost multiplier expresses the same relationship inverted.
		mod /= ringHasteMultiplier(this.equippedRing);
		return mod;
	}

	/**
	 * `Hero.attackDelay()`'s turn cost: the blanket `getActionTurnCostMod()` divided by
	 * `RingOfFuror.attackSpeedMultiplier()`, times the weapon's own `Augment.delayFactor`
	 * (real Java: `attackDelay() = 1 * weapon.delayFactor(this)`, and
	 * `Weapon.delayFactor()` folds `augment.delayFactor(DLY)` before the Furor-driven
	 * `speedMultiplier` divides it back down - `Weapon.java` at tag `v3.3.8`: `SPEED(0.7f,
	 * 2/3f)`, `DAMAGE(1.5f, 5/3f)`, `NONE(1f, 1f)`). Real Java keeps `attackDelay()` and
	 * `Char.speed()` as two separate cost functions; this port previously had only the
	 * single blanket cost, so Furor (and now the augment's delay half) had no faithful
	 * place to land. Only bump-attacks use this (see the `move` port's enemy pre-check) -
	 * movement, search, and item-use turns keep the blanket cost, matching Java's own split
	 * where neither Furor nor a weapon augment's delay factor ever touches those.
	 * **Found in the 2026-09-09 item-system audit**: this previously applied the augment's
	 * delay as a flat `0.8` on the *blanket* `getActionTurnCostMod()` (speeding up movement
	 * too, not just attacks) and never modeled `DAMAGE`'s real 5/3 delay penalty at all -
	 * both fixed here, alongside `attack()`'s damage-factor numbers (0.7/1.5, not a bare 1.2).
	 */
	private getAttackTurnCostMod(): number {
		const augmentDelayFactor = this.weaponAugment === 'speed' ? 2 / 3 : this.weaponAugment === 'damage' ? 5 / 3 : 1;
		return (this.getActionTurnCostMod() / ringFurorMultiplier(this.equippedRing)) * augmentDelayFactor;
	}

	private chooseSubclass(option: string): void {
		if (!this.subclassChoiceOpen || !(SUBCLASS_OPTIONS[this.heroClass] ?? []).includes(option)) return;
		this.advancement.choose(0, option, this.progression.level);
		this.subclassChoiceOpen = false;
		this.say(t('port.log.talent', { talent: t(`port.subclass.${option}`) }), 'highlight');
		if (option === 'berserker') addBuff(this.hero, 'berserk');
		if (option === 'monk_sub') addBuff(this.hero, 'focus');
		this.syncHeroFromStats();
		this.refresh();
	}

	private chooseArmorAbility(option: string): void {
		if (!this.armorChoiceOpen || !ARMOR_OPTIONS.includes(option as (typeof ARMOR_OPTIONS)[number])) return;
		this.advancement.choose(1, option, this.progression.level);
		this.armorChoiceOpen = false;
		this.say(t('port.log.armorabilitychosen', { ability: t(`port.armor.${option}`) }), 'highlight');
		this.refresh();
	}

	/** Opens the generic item picker over a snapshot of eligible bag entries. The pick
	 * callback runs with the chosen entry's id/instanceId; a cancel row closes the panel with
	 * no callback (the consuming item is never spent on a cancel - Java's known-scroll cancel
	 * path; the identifiedByUse/already-detached nuance has no expression here since this
	 * port consumes use-on-item scrolls only on completion). */
	private openItemPicker(
		title: string,
		entries: { id: string; instanceId?: string; identified?: boolean; quantity: number }[],
		onPick: (entry: { id: string; instanceId?: string }) => void
	): void {
		this.itemPickerOpen = true;
		this.itemPickerTitle = title;
		this.itemPickerEntries = entries;
		this.itemPickerOnPick = onPick;
		this.talentOpen = true;
		this.refreshTalentPanel();
	}

	/** Picker row (or cancel, with index -1): close the panel, then run the stored callback
	 * for a real pick. The callback re-validates the entry against the live bag first -
	 * the panel blocks hero actions while open, but this mirrors Java's own FIXME safety
	 * check on `curItem` rather than trusting the snapshot. */
	private chooseItemPicker(index: number): void {
		if (!this.itemPickerOpen) return;
		const cb = this.itemPickerOnPick;
		const entry = index >= 0 ? this.itemPickerEntries[index] : undefined;
		this.itemPickerOpen = false;
		this.itemPickerEntries = [];
		this.itemPickerOnPick = null;
		this.talentOpen = false;
		if (entry && cb) cb({ id: entry.id, instanceId: entry.instanceId });
		this.refresh();
	}

	/** Runestone use-action dispatch, one entry per ported stone id (was a 7-branch else-if
	 * chain in `useItemById`, converted to a table per the section-11 KISS note so each newly
	 * ported stone adds one line, not one more clause). The generic `'stone'` id has no entry
	 * and falls through silently, like every other unhandled bag id. */
	private useStoneById(id: string, instanceId?: string): void {
		const actions: Record<string, (instanceId?: string) => void> = {
			stoneOfAugmentation: (i) => this.useStoneOfAugmentation(i),
			stoneOfFear: (i) => this.useStoneOfFear(i),
			stoneOfDeepSleep: (i) => this.useStoneOfDeepSleep(i),
			stoneOfShock: (i) => this.useStoneOfShock(i),
			stoneOfBlast: (i) => this.useStoneOfBlast(i),
			stoneOfBlink: (i) => this.useStoneOfBlink(i),
			stoneOfClairvoyance: (i) => this.useStoneOfClairvoyance(i),
			stoneOfEnchantment: (i) => this.useStoneOfEnchantment(i),
			stoneOfIntuition: (i) => this.useStoneOfIntuition(i),
			stoneOfDetectMagic: (i) => this.useStoneOfDetectMagic(i),
			stoneOfFlock: (i) => this.useStoneOfFlock(i),
			stoneOfAggression: (i) => this.useStoneOfAggression(i),
		};
		actions[id]?.(instanceId);
	}

	/** `StoneOfFlock.activate(cell)`: Java fills every reachable non-solid cell within distance
	 * two with a temporary Sheep NPC. This port has no thrown-cell targeting, so the hero's
	 * cell is the center; the same radius is represented by a Chebyshev circle and each sheep
	 * uses the shared scheduled ally path with a tinted rat carrier sprite. */
	private useStoneOfFlock(instanceId?: string): void {
		this.bag.remove('stoneOfFlock', 1, instanceId);
		let count = 0;
		for (let y = Math.max(0, this.hero.y - 2); y <= Math.min(this.level.height - 1, this.hero.y + 2); y++) {
			for (let x = Math.max(0, this.hero.x - 2); x <= Math.min(this.level.width - 1, this.hero.x + 2); x++) {
				const at = { x, y };
				if (Roguelike.chebyshevDistance(this.hero, at) > 2 || !this.level.passable(x, y)
					|| this.isChasmCell(x, y) || this.creatureAt(x, y)) continue;
				this.spawnSheep(at);
				count++;
			}
		}
		this.say(t('port.log.stoneflock', { count }), 'positive');
	}

	/** `StoneOfAggression.activate(cell)`: real Java marks the thrown-at character for 20 turns
	 * (5 for a boss/miniboss), making nearby enemies force-target it. With no map-cell picker,
	 * this port uses the same nearest-visible-enemy convention as the other combat stones; the
	 * shared aggression branch then supports enemy-vs-enemy and enemy-vs-ally combat. */
	private useStoneOfAggression(instanceId?: string): void {
		this.bag.remove('stoneOfAggression', 1, instanceId);
		const target = this.nearestVisibleEnemy(8);
		if (!target) {
			this.say(t('port.log.stonewasted'), 'negative');
			return;
		}
		addBuff(target, 'aggression');
		if (target.kind && BOSS_KINDS.has(target.kind)) target.buffs.aggression = 5;
		this.say(t('port.log.stoneaggression', { target: target.name }), 'positive');
	}

	/** `StoneOfAugmentation.usableOnItem()`/`onItemSelected()`: real Java lets the player pick
	 * any enchantable weapon or armor to augment; this port auto-targets the hero's own equipped
	 * weapon (armor augment - `Armor.Augment.EVASION`/`DEFENSE`, an unrelated stat trade-off, not
	 * a turn-cost/damage thing - is not modeled at all, the same auto-target-rather-than-a-picker
	 * convention `ScrollOfIdentify`/`ScrollOfRemoveCurse` already use). Consumes the stone and
	 * opens the same choice panel the level-up armor-ability/subclass windows use.
	 */
	private useStoneOfAugmentation(instanceId?: string): void {
		this.bag.remove('stoneOfAugmentation', 1, instanceId);
		this.augmentChoiceOpen = true;
		this.talentOpen = true;
		this.refreshTalentPanel();
	}

	/** `StoneOfAugmentation.apply(Weapon, augment)`: sets the real `Weapon.Augment` this port
	 * already fully models (`weaponAugment`, read by `getActionTurnCostMod`/the damage-modifier
	 * chain). Real Java's stone also grants a genuine `ScrollOfUpgrade.upgrade()` bonus alongside
	 * the augment choice; this port's own upgrade path is tier-based rather than a plain +1 level
	 * (`upgradeGear`'s weaponTier/weaponLevel split), with no equivalent free-standing "+1 level"
	 * primitive to reuse without also advancing the tier state machine unexpectedly - so only the
	 * augment choice itself is reproduced here, stated as a deliberate, narrower simplification
	 * rather than silently dropped. */
	private chooseAugment(option: (typeof AUGMENT_OPTIONS)[number]): void {
		if (!this.augmentChoiceOpen) return;
		this.augmentChoiceOpen = false;
		this.weaponAugment = option;
		this.say(t('port.log.augmentchosen', { augment: t(`port.ui.augment.${option}`) }), 'highlight');
		this.refresh();
	}

	/** `StoneOfFear.activate(cell)`: real Java throws the stone at a chosen cell and applies a
	 * 20-turn `Terror` (`Terror.DURATION`) to whatever's there, unless it's an ally. This port has
	 * no map-click cell-targeting for thrown items (the same reason `useSpecial` above auto-targets
	 * instead of letting the player aim), so it reuses that exact nearest-visible-enemy convention
	 * rather than adding one just for this stone. `terror` is the same buff `ScrollOfTerror`
	 * already grants and `takeMonsterTurn` already honors, so no new mechanic was needed here -
	 * only a new item id/use-action to reach it, the same gap `StoneOfAugmentation` closed for
	 * weapon augments. */
	private useStoneOfFear(instanceId?: string): void {
		this.bag.remove('stoneOfFear', 1, instanceId);
		const target = this.nearestVisibleEnemy(8);
		if (target) {
			addBuff(target, 'terror');
			this.say(t('port.log.stonefear', { target: target.name }), 'positive');
		} else this.say(t('port.log.stonewasted'), 'negative');
	}

	/** `StoneOfDeepSleep.activate(cell)`: real Java applies a gradual `MagicalSleep` debuff (a
	 * few turns of `Drowsy` before the target actually falls asleep) to a mob at a thrown-to cell.
	 * This port already collapses that same gradual-then-asleep shape to an instant `sleeping =
	 * true` for `ScrollOfLullaby` (see its own comment), so this stone reuses the identical
	 * simplification rather than inventing a second one - the only difference from Lullaby is
	 * hitting one auto-targeted enemy instead of every visible mob at once, matching Java's own
	 * single-cell-vs-whole-screen distinction between the two items. */
	private useStoneOfDeepSleep(instanceId?: string): void {
		this.bag.remove('stoneOfDeepSleep', 1, instanceId);
		const target = this.nearestVisibleEnemy(8);
		if (target) {
			target.sleeping = true;
			this.say(t('port.log.stonesleep', { target: target.name }), 'positive');
		} else this.say(t('port.log.stonewasted'), 'negative');
	}

	/** `StoneOfShock.activate(cell)`: real Java paralyzes every char within a `PathFinder`
	 * distance-2 area of the thrown-to cell (each `Buff.prolong(n, Paralysis.class, 1f)`, a
	 * 1-turn paralysis distinct from the flat 3-turn `paralysis` this port's own buff table
	 * already uses for every other paralysis source) and refunds the hero's wand `1 + hits`
	 * charges. This port has no map-click cell-targeting (same as Fear/DeepSleep above) and no
	 * BFS-through-open-floor distance map handy in `main.ts`, so both are approximated: ground
	 * zero is the nearest visible enemy (the same auto-target convention), the area is a plain
	 * Chebyshev-distance-2 circle around it (ignoring walls, unlike Java's real flood fill), and
	 * every hit gets this port's existing 3-turn `paralysis` rather than a bespoke 1-turn variant
	 * (the shared `addBuff`/`BUFF_DURATION` mechanism has no per-call duration override) - stated
	 * simplifications, not silently dropped precision. The wand-charge refund is reproduced
	 * exactly, since `Actors.Charges.refund` already exists and no-ops harmlessly for classes
	 * without a wand, matching Java's own generic (and here mostly inert) `Belongings.charge()`. */
	private useStoneOfShock(instanceId?: string): void {
		this.bag.remove('stoneOfShock', 1, instanceId);
		const center = this.nearestVisibleEnemy(8);
		if (!center) { this.say(t('port.log.stonewasted'), 'negative'); return; }
		let hits = 0;
		for (const c of this.creatures) {
			if (c.isHero || c.isNPC) continue;
			if (Roguelike.chebyshevDistance(center, c) > 2) continue;
			addBuff(c, 'paralysis');
			hits++;
		}
		if (hits > 0) {
			this.wandCharges.refund(1 + hits);
			this.say(t('port.log.stoneshock', { count: hits }), 'positive');
		} else this.say(t('port.log.stonewasted'), 'negative');
	}

	/** `Bomb.execute(AC_LIGHTTHROW)` + `onThrow()`: lighting the fuse and throwing the bomb
	 * at the auto-targeted enemy's cell (this port has no map-click aiming for thrown items -
	 * the same convention every combat runestone already uses), where it lands as a lit heap
	 * and `Bomb.Fuse` detonates it after 2 further turns. Refuses WITHOUT consuming when no
	 * enemy is visible or no free cell exists around the target (pits/chasms are excluded -
	 * Java never lights a fuse over a pit either). The blast itself is `detonateGroundBomb`.
	 * Not reproduced: `EnhanceBomb` alchemy (needs the alchemy system) and the specialty
	 * bombs it brews - tracked in `PORT_COVERAGE.md`, not faked here. */
	private useBomb(instanceId?: string): void {
		const bomb = this.bag.find('bomb', instanceId);
		if (!bomb) return;
		const target = this.nearestVisibleEnemy(8);
		if (!target) { this.say(t('port.log.bombwasted'), 'negative'); return; }
		const candidates = [{ x: target.x, y: target.y }, ...Roguelike.neighbourOffsets(8).map(([dx, dy]) => ({ x: target.x + dx, y: target.y + dy }))];
		const at = candidates.find((cell) => this.level.inside(cell.x, cell.y) && this.level.passable(cell.x, cell.y)
			&& !this.isChasmCell(cell.x, cell.y) && !this.groundItemAt(cell.x, cell.y));
		if (!at) { this.say(t('port.log.bombwasted'), 'negative'); return; }
		this.bag.remove('bomb', 1, instanceId);
		this.spawnGroundItem('bomb', at.x, at.y, { id: 'bomb', quantity: 1, identified: true, sourceClass: 'Bomb', fuseTurns: 2 });
		this.say(t('port.log.bomblit', { target: target.name }), 'positive');
	}

	private removeGroundItem(g: GroundItem): void {
		this.groundItems.splice(this.groundItems.indexOf(g), 1);
		this.sprite(g).destroy();
		this.spriteFor.delete(g.id);
	}

	/** `Bomb.explode(cell)`: `explosionRange() = 1` with `NormalIntRange(4 + scalingDepth,
	 * 12 + 3*scalingDepth)` minus armor on every char caught in it, hero included (a bomb
	 * does not discriminate - the hero's share runs through `absorbHeroDamage`/`kill` like
	 * every other source, plus the real `ondeath` line when it kills). Tengu's `BombAbility`
	 * reuses this with its own ordnance (`fuseTurns: 3`, range-2 flood fill,
	 * `NormalIntRange(5 + scalingDepth, 10 + 2*scalingDepth)`), read off the payload's
	 * `tenguBomb` flag - same routine, same chaining, only the numbers differ. The flood
	 * fill through non-solid/flammable terrain is a passable-cell Chebyshev circle here (the
	 * same shape `useStoneOfBlast` already uses); `this.depth` stands in for
	 * `scalingDepth` the same way. `Heap.explode()`'s bomb-chaining is reproduced: other
	 * bomb heaps in the blast detonate through the same routine, guarded by `chained`.
	 * Returns true when the blast kills the hero. Not reproduced: flammable-terrain
	 * destruction (no terrain-destroy primitive exists at any item site) - see
	 * `PORT_COVERAGE.md`, same gap `useStoneOfBlast` already documents. */
	private detonateGroundBomb(g: GroundItem, chained: Set<string>): boolean {
		chained.add(g.id);
		const at = { x: g.x, y: g.y };
		this.removeGroundItem(g);
		const tengu = g.item?.tenguBomb === true;
		const range = tengu ? 2 : 1;
		const lo = (tengu ? 5 : 4) + this.depth;
		const hi = (tengu ? 10 : 12) + (tengu ? 2 : 3) * this.depth;
		let heroDied = false;
		for (const c of [...this.creatures]) {
			if (c.isNPC || c.hp <= 0) continue;
			if (!this.level.passable(c.x, c.y) || Roguelike.chebyshevDistance(at, c) > range) continue;
			//`if(!ch.isAlive()) continue` - already-dead chars are skipped, matching the
			//chained-blast guard above.
			let damage = Math.max(0, Random.normalRange(lo, hi));
			if (c.isHero) {
				damage = this.absorbHeroDamage(damage);
				this.hero.hp -= damage;
				this.showDamage(this.hero, damage);
				if (this.hero.hp <= 0) {
					this.say(t('items.bombs.bomb.ondeath'), 'negative');
					this.kill(this.hero, 'fire');
					heroDied = true;
				}
			} else {
				if (c.kind === 'yog' && this.yogShielded(c)) continue;
				if (c.kind === 'yogFist' && this.guardFist(c)) continue;
				damage = Math.max(0, damage - Random.normalRange(c.armor[0], c.armor[1]));
				const preHp = c.hp;
				c.hp -= damage;
				if (c.kind === 'tengu') this.clampTenguBracket(c, preHp);
				if (c.kind === 'yog' && c.hp > 0) this.yogDamageHook(c, preHp);
				this.showDamage(c, damage);
				c.sleeping = false;
				if (c.hp <= 0) this.kill(c, 'fire');
				else if (c.kind === 'tengu') this.tenguBracketJump(c, preHp);
			}
		}
		for (const other of [...this.groundItems]) {
			if (other.kind !== 'bomb' || !other.item || chained.has(other.id)) continue;
			if (!this.level.passable(other.x, other.y) || Roguelike.chebyshevDistance(at, other) > range) continue;
			if (this.detonateGroundBomb(other, chained)) heroDied = true;
		}
		return heroDied;
	}

	/** `Bomb.Fuse.act()`: lit bombs tick down once per hero turn (`Actor.addDelayed(fuse, 2)`
	 * is two fuse-acts, i.e. two rounds) and detonate at zero. Called from the end-of-turn
	 * pipeline, where a hero-killing blast returns true exactly like fatal buff damage.
	 * A running Timekeeper freeze stops every automatic actor, fuses included. Lit bombs
	 * ride ordinary ground-item payloads, so leaving the floor or saving/loading carries
	 * them exactly like any other heap (Java abandons level actors on descent the same way).
	 * Returns true when a blast kills the hero. */
	private tickBombFuses(): boolean {
		let heroDied = false;
		for (const g of [...this.groundItems]) {
			const fuse = g.item?.fuseTurns;
			if (g.kind !== 'bomb' || fuse === undefined || !g.item) continue;
			if (!this.groundItems.includes(g)) continue; //chained-detonated earlier this tick
			if (this.timeBubbleTurns > 0) continue;
			if (fuse <= 1) {
				if (this.detonateGroundBomb(g, new Set())) heroDied = true;
			} else g.item.fuseTurns = fuse - 1;
		}
		return heroDied;
	}

	/** `StoneOfBlast.activate(cell)` -> `Bomb.ConjuredBomb().explode(cell)`: real Java flood-fills
	 * a `PathFinder` distance-1 area through non-solid/flammable terrain (`explosionRange() = 1`,
	 * the `Bomb` base class default, never overridden by `ConjuredBomb`) and deals
	 * `NormalIntRange(4 + scalingDepth, 12 + 3*scalingDepth)` damage, minus armor, to every char
	 * caught in it - the hero included, since a bomb does not discriminate. This port approximates
	 * the flood fill as a plain Chebyshev-distance-1 circle (same simplification `StoneOfShock`
	 * above already makes, ignoring walls) around the same auto-targeted nearest-visible-enemy
	 * ground zero, and reuses `this.depth` for `scalingDepth` (the same substitution every other
	 * depth-scaled formula in this file already makes). The hero's own share of the blast, if
	 * caught in range, goes through the existing `absorbHeroDamage`/`kill` path exactly like
	 * `applyTrapBlast`'s hero branch does. **Not reproduced**: real Java also destroys flammable
	 * terrain and triggers/destroys heaps caught in the blast - this port has no equivalent
	 * terrain-destruction call from an item-use site, a real, narrower gap left honestly
	 * undone rather than faked. */
	private useStoneOfBlast(instanceId?: string): void {
		this.bag.remove('stoneOfBlast', 1, instanceId);
		const center = this.nearestVisibleEnemy(8);
		if (!center) { this.say(t('port.log.stonewasted'), 'negative'); return; }
		let hits = 0;
		//`kill()` splices the dying creature out of `this.creatures` - iterating a snapshot
		//copy (the same guard `detonateGroundBomb` already uses) so a kill mid-loop can't shift
		//a later creature into the just-visited index and make it silently dodge the blast.
		for (const c of [...this.creatures]) {
			if (c.isNPC || c.hp <= 0) continue;
			if (Roguelike.chebyshevDistance(center, c) > 1) continue;
			let damage = Math.max(0, Random.normalRange(4 + this.depth, 12 + 3 * this.depth));
			if (c.isHero) {
				damage = this.absorbHeroDamage(damage);
				this.hero.hp -= damage;
				this.showDamage(this.hero, damage);
				if (this.hero.hp <= 0) this.kill(this.hero, 'fire');
			} else {
				damage = Math.max(0, damage - Random.normalRange(c.armor[0], c.armor[1]));
				c.hp -= damage;
				this.showDamage(c, damage);
				c.sleeping = false;
				if (c.hp <= 0) this.kill(c, 'fire');
			}
			hits++;
		}
		this.say(t('port.log.stoneblast', { count: hits }), hits > 0 ? 'positive' : 'negative');
	}

	/** `StoneOfBlink.activate(cell)` -> `ScrollOfTeleportation.teleportToLocation(curUser, cell)`:
	 * real Java throws the stone at a player-aimed cell and blinks the hero there directly (a
	 * short, precise, player-chosen hop - `onThrow`'s own logic even steps back one cell along the
	 * path if a char already occupies the aimed cell). This port has no map-click cell-targeting
	 * for a thrown item (the same reason every stone above auto-targets instead of aiming), so it
	 * reuses the exact placement this port's own already-ported `ScrollOfTeleportation` uses -
	 * `randomFreeCell` - rather than inventing a second "aim-like" placement strategy; the real
	 * difference between Blink's short player-aimed hop and Teleportation's full-level random jump
	 * is lost here, since both collapse to the same uniformly-random free-cell search. */
	private useStoneOfBlink(instanceId?: string): void {
		this.bag.remove('stoneOfBlink', 1, instanceId);
		delete this.hero.buffs['roots'];
		const destination = this.randomFreeCell(this.hero);
		if (destination) {
			this.moveTo(this.hero, destination);
			this.say(t('items.scrolls.scrollofteleportation.tele'), 'positive');
		} else this.say(t('items.scrolls.scrollofteleportation.no_tele'), 'negative');
	}

	/** `StoneOfClairvoyance.activate(cell)`: real Java marks every cell within a `DIST = 20`
	 * diamond (via `ShadowCaster.rounding`) around the thrown-to cell `mapped` (visible on the map
	 * regardless of current sight) and reveals any secret terrain caught in that same area - a
	 * smaller, localized cousin of the already-ported `ScrollOfMagicMapping`'s whole-floor
	 * `revealAll()`. This port has no map-click cell-targeting (so centers on the hero's own
	 * position instead of an aimed cell - the natural default absent real aiming, unlike the
	 * combat stones above which auto-target the nearest enemy instead) and no per-cell partial
	 * reveal primitive, so it reproduces the same real DIST=20 radius as a plain Chebyshev circle
	 * (ignoring walls, the same simplification the light/AoE stones above already make) by adding
	 * each cell directly to `FieldOfView.explored` (a public, mutable `Set`) rather than calling
	 * `revealAll()`'s whole-level version. */
	private useStoneOfClairvoyance(instanceId?: string): void {
		this.bag.remove('stoneOfClairvoyance', 1, instanceId);
		const DIST = 20;
		for (let y = Math.max(0, this.hero.y - DIST); y <= Math.min(this.level.height - 1, this.hero.y + DIST); y++) {
			for (let x = Math.max(0, this.hero.x - DIST); x <= Math.min(this.level.width - 1, this.hero.x + DIST); x++) {
				if (Roguelike.chebyshevDistance(this.hero, { x, y }) > DIST) continue;
				this.fov.explored.add(this.level.index(x, y));
				if (this.secrets.isSecret(x, y)) this.secrets.discover(x, y);
			}
		}
		this.restitchAllTiles();
		this.say(t('port.log.stoneclairvoyance'), 'positive');
	}

	/** `StoneOfEnchantment.onItemSelected()`: imbue a picked weapon or armor with a random
	 * enchantment/glyph (`Weapon.enchant()`/`Armor.inscribe()` - good pool only, never a
	 * curse, overwriting whatever affix was there: `enchant(ench)` assigns unconditionally).
	 * Real Java's `usableOnItem` is `ScrollOfEnchantment.enchantable()` (any upgradable
	 * weapon/armor); this port's bag holds `weaponReward`/`armorReward` items (affix rides
	 * into `equipWeapon`/`equipArmor` already), so those are the eligible set, picked through
	 * the generic panel with the real `inv_title`. Armor *inscription* as such needs no
	 * separate path - a bag armor item takes a `GLYPH_TABLE` roll the same way a weapon takes
	 * an `ENCHANT_TABLE` one. Deliberate gaps, same family as Transmutation's: equipped gear
	 * is not targetable (bag-only picker), and the exotic `ScrollOfEnchantment`'s own
	 * choose-your-enchant window has no expression (the stone is random in Java too). */
	private useStoneOfEnchantment(instanceId?: string): void {
		type Gear = { id: string; instanceId?: string; identified?: boolean; quantity: number };
		const candidates = (this.bag.items as Gear[]).filter(
			(i) => i.quantity > 0 && (i.id === 'weaponReward' || i.id === 'armorReward')
		);
		if (candidates.length === 0) {
			this.say(t('items.scrolls.scrolloftransmutation.nothing'), 'negative');
			return;
		}
		this.openItemPicker(t('items.stones.stoneofenchantment.inv_title'), candidates, (pick) => {
			const live = (this.bag.items as (Gear & { affix?: string })[]).find(
				(i) => i.quantity > 0 && i.id === pick.id && (i.instanceId ?? undefined) === (pick.instanceId ?? undefined)
					&& (i.id === 'weaponReward' || i.id === 'armorReward')
			);
			if (!live) {
				this.say(t('items.scrolls.scrolloftransmutation.nothing'), 'negative');
				return;
			}
			const rolled = rollGeneratedAffix(live.id === 'weaponReward' ? ENCHANT_TABLE : GLYPH_TABLE, false, true);
			if (!rolled) {
				this.say(t('items.scrolls.scrolloftransmutation.nothing'), 'negative');
				return;
			}
			this.bag.remove('stoneOfEnchantment', 1, instanceId);
			live.affix = rolled;
			this.say(t(live.id === 'weaponReward' ? 'items.stones.stoneofenchantment.weapon' : 'items.stones.stoneofenchantment.armor'), 'positive');
		});
	}

	/** `CeremonialCandle` placement for the Wandmaker's type-2 ritual (`RitualSiteRoom` +
	 * `CeremonialCandle.checkCandles()`, checked against tag `v3.3.8`). Real Java litters the
	 * four candles as heaps on the ritual center's 4 cardinal neighbours (drop/throw them
	 * there, each drop re-checking) and fires when all four heaps hold a candle. This port
	 * has no aimed throw/drop-onto-cell UI (bombs auto-target; stones auto-target), so the
	 * candle gets a Place action instead: standing on an empty ritual-neighbour cell consumes
	 * one candle from the bag into that slot (`aflame`, like a placed heap). All four filled
	 * fires the same ritual: candles consumed, a `NewbornFireElemental` rises HUNTING at the
	 * center (or a free neighbour when occupied, Java's own fallback). Simplifications, all
	 * narrower than the shape change above: no heap/pickup/throw intermediaries (bag direct
	 * to slot, so the `aflame`-reset-on-pickup/drop nuances never arise); no `avoid`-cell
	 * acceptance in the fallback search (passable only); no quest-music swap or quest-score
	 * accounting (neither system exists here). */
	private useCandle(instanceId?: string): void {
		if (this.ritualPos < 0) {
			this.say(t('port.log.candleneeded'), 'negative');
			return;
		}
		const w = this.level.width;
		const slots = [
			{ x: (this.ritualPos % w), y: Math.floor(this.ritualPos / w) - 1 },
			{ x: (this.ritualPos % w) + 1, y: Math.floor(this.ritualPos / w) },
			{ x: (this.ritualPos % w), y: Math.floor(this.ritualPos / w) + 1 },
			{ x: (this.ritualPos % w) - 1, y: Math.floor(this.ritualPos / w) },
		];
		const at = slots.findIndex((s) => s.x === this.hero.x && s.y === this.hero.y);
		if (at < 0 || this.ritualCandles[at]) {
			this.say(t('port.log.candleneeded'), 'negative');
			return;
		}
		const candle = this.bag.find('candle', instanceId);
		if (!candle) return;
		this.bag.remove('candle', 1, instanceId);
		this.ritualCandles[at] = true;
		this.say(t('port.log.candleplaced'), 'positive');
		if (this.ritualCandles.every(Boolean)) this.fireRitual();
	}

	/** `CeremonialCandle.checkCandles()`' all-lit branch: burn the four placements and rise
	 * the newborn. Java picks a random free 8-neighbour when the center is occupied (staying
	 * put only when nothing is free); `RangedCooldown` starts at its real `3-5` roll. */
	private fireRitual(): void {
		this.ritualCandles = [false, false, false, false];
		const w = this.level.width;
		const cx = this.ritualPos % w;
		const cy = Math.floor(this.ritualPos / w);
		let at = { x: cx, y: cy };
		if (this.creatureAt(cx, cy) || !this.level.passable(cx, cy)) {
			const free = Roguelike.neighbourOffsets(8)
				.map(([dx, dy]) => ({ x: cx + dx, y: cy + dy }))
				.filter((c) => this.level.passable(c.x, c.y) && !this.creatureAt(c.x, c.y));
			if (free.length > 0) at = Random.element(free)!;
		}
		const elemental = this.spawnMonster('newbornElemental', at);
		elemental.sleeping = false;
		elemental.rangedCooldown = Random.normalRange(3, 5);
		this.say(t('port.log.ritualfire'), 'warning');
	}

	/** `StoneOfDetectMagic.onItemSelected()`: reveal a picked equipable/wand's curse state and
	 * report its magic (`detected_none/both/good/bad`): negative = cursed or a curse affix
	 * (`hasCurseEnchant()`/`hasCurseGlyph()`), positive = a real upgrade level or a good
	 * affix. Real Java's `usableOnItem` is `EquipableItem || Wand` while not fully known
	 * (`!isIdentified() || !cursedKnown`); this port's bag equipables are `weaponReward`,
	 * `armorReward`, `ring_*` (rings are `EquipableItem` in Java too) plus the single-id
	 * `wand`, and `cursedKnown` is already a tracked bag field (see the awareness-well row).
	 * The stone is consumed on completion, like every other `InventoryStone` here. Stated
	 * simplifications: equipped gear is not targetable (bag-only picker); the single-id wand
	 * carries no upgrade level in this model, so it only ever reports its curse state; the
	 * generated catalog has no `stoneofdetectmagic` keys at all, so the four report lines
	 * and the name resolve through `port.*` keys sourced verbatim from Java. */
	private useStoneOfDetectMagic(instanceId?: string): void {
		type Gear = { id: string; instanceId?: string; identified?: boolean; quantity: number; level?: number; affix?: string; cursed?: boolean; cursedKnown?: boolean };
		const isGear = (i: Gear): boolean =>
			i.id === 'weaponReward' || i.id === 'armorReward' || i.id.startsWith('ring_') || i.id === 'wand';
		const candidates = (this.bag.items as Gear[]).filter(
			(i) => i.quantity > 0 && isGear(i) && (!i.identified || !i.cursedKnown)
		);
		if (candidates.length === 0) {
			this.say(t('items.scrolls.scrolloftransmutation.nothing'), 'negative');
			return;
		}
		this.openItemPicker(t('port.stone.detectmagic.inv_title'), candidates, (pick) => {
			const live = (this.bag.items as Gear[]).find(
				(i) => i.quantity > 0 && i.id === pick.id && (i.instanceId ?? undefined) === (pick.instanceId ?? undefined)
					&& isGear(i) && (!i.identified || !i.cursedKnown)
			);
			if (!live) {
				this.say(t('items.scrolls.scrolloftransmutation.nothing'), 'negative');
				return;
			}
			live.cursedKnown = true;
			const negative = !!live.cursed || getCurse(live.affix ?? '') !== undefined;
			const positive = (live.level ?? 0) > 0 || (!!live.affix && getCurse(live.affix ?? '') === undefined);
			this.bag.remove('stoneOfDetectMagic', 1, instanceId);
			this.say(t(
				!positive && !negative ? 'port.stone.detectmagic.detected_none'
					: positive && negative ? 'port.stone.detectmagic.detected_both'
					: positive ? 'port.stone.detectmagic.detected_good'
					: 'port.stone.detectmagic.detected_bad'
			), 'positive');
		});
	}

	/** `StoneOfIntuition`: pick an unidentified potion/scroll/ring, guess its type from the
	 * still-unknown classes, identify on a correct guess (`WndGuess`, checked against tag
	 * `v3.3.8`). Two picker invocations stand in for the two windows: the item pick (real
	 * `inv_title`) then the guess rows (real `$wndguess.text` title, true names shown - Java
	 * shows each candidate's real name too). A correct guess identifies every bag instance
	 * of that id (Java's `identify()`/`setKnown()` are class-level, not per-instance).
	 * The alternating free/paid rule is real (`IntuitionUseTracker`, a `revivePersists`
	 * buff here kept as a plain run flag): the first guess only sets the tracker and keeps
	 * the stone, the next guess consumes a stone and clears it. Stated simplifications: no
	 * separate select-then-confirm step (a guess row confirms immediately); "unknown" means
	 * no identified bag instance of that class (consumed knowns read unknown again - no
	 * run-level `Handler` set exists here); exotic classes don't exist, so the decks are the
	 * regular 12 potion / 12 scroll / 12 ring ids; `Talent.onRunestoneUsed` has no expression
	 * (no caller among the other stones either). The dead `preserved`/`break` catalog keys
	 * are deliberately unused (`break` is referenced nowhere in Java source). */
	private useStoneOfIntuition(instanceId?: string): void {
		type Consumable = { id: string; instanceId?: string; identified?: boolean; quantity: number };
		const isGuessable = (id: string): boolean =>
			(id.startsWith('potion') && id !== 'potion' && id in POTION_CLASS_BY_PORT_ID)
			|| (id.startsWith('scroll') && id !== 'scroll')
			|| id.startsWith('ring_');
		const candidates = (this.bag.items as Consumable[]).filter(
			(i) => i.quantity > 0 && !i.identified && isGuessable(i.id)
		);
		if (candidates.length === 0) {
			this.say(t('items.scrolls.scrolloftransmutation.nothing'), 'negative');
			return;
		}
		this.openItemPicker(t('items.stones.stoneofintuition.inv_title'), candidates, (pick) => {
			const live = (this.bag.items as Consumable[]).find(
				(i) => i.quantity > 0 && !i.identified && i.id === pick.id
					&& (i.instanceId ?? undefined) === (pick.instanceId ?? undefined) && isGuessable(i.id)
			);
			if (!live) {
				this.say(t('items.scrolls.scrolloftransmutation.nothing'), 'negative');
				return;
			}
			//`Potion/Scroll/Ring.getUnknown()`: classes with no identified instance this run.
			const knownIds = new Set(
				(this.bag.items as Consumable[]).filter((i) => i.identified).map((i) => i.id)
			);
			let deck: string[];
			if (live.id.startsWith('potion')) deck = Object.keys(POTION_CLASS_BY_PORT_ID).filter((id) => id !== 'potion');
			else if (live.id.startsWith('scroll')) deck = APPEARANCE_TABLES.scroll.kinds.filter((id) => id !== 'scroll');
			else deck = Object.keys(RING_DEFS).map((k) => `ring_${k}`);
			const unknown = deck.filter((id) => !knownIds.has(id));
			if (unknown.length === 0) {
				this.say(t('items.scrolls.scrolloftransmutation.nothing'), 'negative');
				return;
			}
			this.openItemPicker(
				t('items.stones.stoneofintuition$wndguess.text'),
				unknown.map((id) => ({ id, identified: true, quantity: 1 })),
				(guess) => {
					const target = (this.bag.items as Consumable[]).find(
						(i) => i.quantity > 0 && !i.identified && i.id === live.id
							&& (i.instanceId ?? undefined) === (live.instanceId ?? undefined)
					);
					if (!target) {
						this.say(t('items.scrolls.scrolloftransmutation.nothing'), 'negative');
						return;
					}
					if (guess.id === target.id) {
						for (const same of this.bag.items as Consumable[]) if (same.id === target.id) Actors.identify(same);
						this.say(t('items.stones.stoneofintuition$wndguess.correct'), 'positive');
					} else {
						this.say(t('items.stones.stoneofintuition$wndguess.incorrect'), 'negative');
					}
					if (!this.intuitionTracker) this.intuitionTracker = true;
					else {
						this.bag.remove('stoneOfIntuition', 1, instanceId);
						this.intuitionTracker = false;
					}
				}
			);
		});
	}

	private refreshInventoryPanel(): void {
		if (!this.inventoryPanel) return;
		this.inventoryPanel.visible = this.inventoryOpen;
		if (!this.inventoryOpen) return;
		const entry = (item: { id: string; quantity: number; instanceId?: string; level?: number; identified?: boolean; cursed?: boolean }): InventoryEntry => {
			const id = item.id;
			let frame = ({ clothArmor: 176, armor: 176, armorReward: 176, weaponReward: 96,
				food: 437, meat: 432, seed: 58, waterskin: 480, velvetPouch: 482, cloak: 240, hourglass: 240,
				spiritBow: 144, wand: 208, holyTome: 246, darkGold: 453, dwarfToken: 454, amulet: 61, bomb: 80,
				corpseDust: 465 } as Record<string, number>)[id] ?? 0;
			//Every distinct runestone shares the generic stone icon frame (no per-type art here,
			//the same economy as the single shared wand/cloak icons) - one prefix rule rather
			//than a per-id entry that grows with every newly-ported stone.
			if (id.startsWith('stoneOf')) frame = 147;
			let action: string | undefined;
			if (id.startsWith('potion')) { frame = 352; action = capitalize(t('items.potions.potion.ac_drink')); }
			else if (id.startsWith('scroll')) { frame = 304; action = capitalize(t('items.scrolls.scroll.ac_read')); }
			else if (id === 'bomb') action = capitalize(t('items.bombs.bomb.ac_lightthrow'));
			else if (id === 'food' || id === 'meat') action = capitalize(t('items.food.food.ac_eat'));
			else if (id === 'seed') action = 'Plant';
			else if (id === 'pickaxe') action = capitalize(t('items.quest.pickaxe.ac_mine'));
			else if (id === 'hourglass') action = 'Freeze time';
			else if (id === 'stoneOfAugmentation') action = t('port.ui.augment.title');
			else if (id.startsWith('stoneOf')) action = t('items.stones.inventorystone.ac_use');
			else if (id === 'candle') action = t('port.ui.candle.place');
			else if (id.startsWith('ring_')) { frame = 224; action = capitalize(t('items.equipableitem.ac_equip')); }
			else if (['armor', 'armorReward', 'weaponReward', 'wand'].includes(id)) action = capitalize(t('items.equipableitem.ac_equip'));
			return { ...item, name: this.itemDisplayName(id, item.identified ?? false, item.instanceId), frame, action };
		};
		const rows = this.bag.items.filter(item => item.quantity > 0).map(entry);
		const armor = this.armorId === 'startingArmor' ? null : entry({ id: this.armorId, instanceId: this.armorInstanceId, quantity: 1, identified: true, level: this.armorLevel });
		if (armor) armor.action = undefined;
		const artifact = rows.find(item => item.id === 'cloak' || item.id === 'hourglass' || item.id === 'holyTome') ?? null;
		const weapon: InventoryEntry = { id: 'equippedWeapon', instanceId: this.weaponInstanceId, name: t(CLASSES[this.heroClass].weaponKey),
			frame: { warrior: 96, mage: 101, rogue: 100, huntress: 98, duelist: 99, cleric: 97 }[this.heroClass],
			quantity: 1, identified: true, level: this.weaponLevel };
		const ring = this.equippedRing ? entry({ ...this.equippedRing, quantity: 1, identified: true }) : null;
		if (ring) ring.action = undefined;
		this.inventoryPanel.setItems([weapon, armor, artifact, null, ring], rows.filter(item => item !== artifact && item.id !== this.armorId), this.heroStats.base('gold'));
		this.stage.addChild(this.inventoryPanel);
		this.positionInterface(Game.current.width, Game.current.height);
	}

	/** `WndJournal`: translated region lore plus live quest progress for this run. */
	private openJournal(): void {
		if (this.journalOpen) return;
		this.inventoryOpen = false;
		if (this.inventoryPanel) this.inventoryPanel.visible = false;
		const pages: JournalPage[] = (['sewers', 'prison', 'caves', 'city', 'halls'] as const).map(region => ({
			title: t(REGION_KEYS[region]),
			body: t(`journal.document.intros.${region}.body`),
		}));
		const quests = [
			['sadGhost', 'windows.wndsadghost.title'],
			['wandmaker', 'windows.wndwandmaker.title'],
			['blacksmith', 'windows.wndblacksmith.title'],
			['imp', 'windows.wndimp.title'],
		] as const;
		pages.push({
			title: t('windows.wndjournal.notes'),
			body: quests.map(([id, key]) => t('port.journal.queststatus', {
				quest: t(key),
				status: t(`port.journal.${this.quests.status(id)}`),
			})).join('\n\n'),
		});
		this.journalWindow = createJournalWindow(pages, () => this.closeJournal());
		this.journalOpen = true;
		this.stage.addChild(this.journalWindow);
		this.positionInterface(Game.current.width, Game.current.height);
	}

	private closeJournal(): void {
		this.journalOpen = false;
		this.journalWindow?.close();
	}

	private useItemById(id: string, instanceId?: string): void {
		if (!this.awaitingInput) return;
		this.requestedItemId = id;
		this.requestedItemInstanceId = instanceId;
		try {
			if (id === 'food' || id === 'meat') this.onAction('eat');
			else if (id.startsWith('potion')) this.onAction('quaff');
			else if (id.startsWith('scroll')) this.onAction(id === 'scrollUpgrade' ? 'upgrade' : 'read');
			else if (id.startsWith('ring_')) this.equipRing(id, instanceId);
			else if (id === 'clothArmor' || id === 'armor' || id === 'armorReward') this.equipArmor(id, instanceId);
			else if (id === 'weaponReward') this.equipWeapon(id, instanceId);
			else if (id === 'wand') this.equipWand();
			else if (id === 'pickaxe') this.mineWithPickaxe();
			else if (id === 'seed') this.plantSeed();
			else if (id === 'hourglass') this.useHourglass(instanceId);
			else if (id.startsWith('stoneOf')) this.useStoneById(id, instanceId);
			else if (id === 'candle') this.useCandle(instanceId);
			else if (id === 'bomb') this.useBomb(instanceId);
		} finally {
			this.requestedItemId = null;
			this.requestedItemInstanceId = undefined;
		}
	}

	/** `TimekeepersHourglass.timeFreeze`: freeze automatic actors while hero actions are free. */
	private useHourglass(instanceId?: string): void {
		const hourglass = this.bag.find('hourglass', instanceId) as (typeof this.bag.items[number] & { charges?: number }) | undefined;
		if (!hourglass || hourglass.cursed) {
			this.say(t('port.log.cursedhourglass'), 'negative');
			return;
		}
		if (this.timeBubbleTurns > 0) {
			this.cancelHourglassFreeze();
			return;
		}
		const maxCharge = 5 + Math.min(5, hourglass.level ?? 0);
		const charge = Math.min(maxCharge, hourglass.charges ?? maxCharge);
		if (charge <= 0) {
			this.say(t('port.log.hourglassnocharge'), 'negative');
			return;
		}
		hourglass.charges = charge - 1;
		this.hourglassFreeze = true;
		this.hourglassTurnsToCost = 2;
		//Looks like it should be `(charge - 1) * 2` (the post-spend charge) - it should NOT.
		//Real `timeFreeze.processTime()` (checked against tag v3.3.8) only detaches once
		//`charge < 0 || (charge === 0 && turnsToCost <= 0)`, and `turnsToCost` starts at 2 and
		//only wraps (consuming a charge) once it goes negative - so the charge-0 buff still
		//survives up to 2 more turns before that `turnsToCost <= 0` check finally trips.
		//Simulating that exact loop gives total turns = 2 * (postSpendCharge + 1), i.e. exactly
		//`2 * charge` using this function's pre-spend `charge` - confirmed against a real
		//turn-by-turn simulation of the Java loop during the 2026-09-09 item-system audit.
		this.timeBubbleTurns = charge * 2;
		this.say(t('port.log.timefreezes'), 'positive');
	}

	private cancelHourglassFreeze(): void {
		if (!this.hourglassFreeze) return;
		this.hourglassFreeze = false;
		this.timeBubbleTurns = 0;
		this.flushTimeBubblePresses();
	}

	/** `Pickaxe.execute(AC_MINE)`: scan adjacent cells for the first WALL_DECO vein,
	 * spend two turns, turn it into ordinary WALL, and auto-pick up one DarkGold. */
	private mineWithPickaxe(): void {
		if (!this.canMineCavesWall() || !this.portedPaint) {
			this.say(t('items.quest.pickaxe.no_vein'), 'negative');
			return;
		}
		for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
			const x = this.hero.x + dx, y = this.hero.y + dy;
			if (!this.level.inside(x, y)) continue;
			const cell = this.level.index(x, y);
			if (this.portedPaint.map[cell] !== Terrain.WALL_DECO) continue;
			this.portedPaint.map[cell] = Terrain.WALL;
			this.bag.add({ id: 'darkGold', quantity: 1, stackable: true, identified: true });
			this.say(t('port.log.pickup', { item: t('items.quest.darkgold.name') }), 'positive');
			runState.audio.cue('evoke', 0.7);
			this.actionSpentTurn = true;
			this.spendHeroTurn(2);
			return;
		}
		this.say(t('items.quest.pickaxe.no_vein'), 'negative');
	}

	/** One ring slot for this MWG UI; the ring's real level curve is applied below. */
	private equipRing(id: string, instanceId?: string): void {
		const item = this.bag.find(id, instanceId);
		if (!item || !id.startsWith('ring_')) return;
		const level = item.level ?? 0;
		//Talent.onItemEquipped()'s Thief's Intuition: rank 2 fully identifies an equipped ring
		//(reproduced below), but rank 1 has its own, weaker `setKnown()` effect - the ring's
		//*type* becomes known (you learn it's a "Ring of Force") while its level/curse stay
		//hidden - found in the 2026-09-09 hero-progression audit. This port's ring model has
		//no such intermediate state (`identified` is the only flag, gating both the type name
		//and the level/curse together via `itemDisplayName`), so rank 1 currently does nothing;
		//not fixed here, since faking it would need a new per-item "type known" field.
		if (this.heroClass === 'rogue' && this.talentRank('thiefs_intuition') >= 2) Actors.identify(item);
		if (this.equippedRing?.cursed && this.equippedRing.id !== id) {
			this.say(t('port.log.ringcursed'), 'negative');
			return;
		}
		if (this.equippedRing?.id === id && this.equippedRing.level === level) {
			this.say(t('port.log.ringalready'), 'negative');
			return;
		}
		const previous = this.equippedRing;
		const displayName = this.itemDisplayName(id, true, item.instanceId);
		if (previous) this.bag.add({ id: previous.id, quantity: 1, instanceId: previous.instanceId, identified: true, level: previous.level, cursed: previous.cursed });
		this.bag.remove(id, 1, item.instanceId);
		this.equippedRing = { id, level, cursed: item.cursed, instanceId: item.instanceId };
		//RingOfMight.HTMultiplier(): x1.035^lvl on max HP. Back out the previous ring's
		//contribution to find "base" maxHp, then reapply the new ring's - the same
		//old-max/hp-delta pattern levelUp's +5/level bump uses, so current HP shifts with it
		//rather than being clamped.
		const baseMaxHp = this.hero.maxHp - this.ringHtBonus;
		const newRingHtBonus = ringDef(id)?.stat === 'strength' ? Math.round(baseMaxHp * (Math.pow(1.035, level) - 1)) : 0;
		if (newRingHtBonus !== this.ringHtBonus) {
			this.hero.maxHp = baseMaxHp + newRingHtBonus;
			this.hero.hp += newRingHtBonus - this.ringHtBonus;
			this.ringHtBonus = newRingHtBonus;
		}
		this.syncHeroFromStats();
		this.say(t('port.log.ringworn', { item: displayName, level }), 'positive');
	}

	/** Found armor replaces the cloth armor entry and preserves the current effective level. */
	private equipArmor(id: string, instanceId?: string): void {
		const item = this.bag.find(id, instanceId);
		if (!item) return;
		if (this.armorInstanceId === item.instanceId) return;
		//EquipableItem.doUnequip()'s cursed-and-known lock: a cursed piece can't be swapped away
		//once equipped. This port treats an equipped item's curse as known immediately (no
		//separate identify-delay for gear already worn), a simplification of Java's real
		//identify-timing curtain.
		if (this.armorId !== 'clothArmor' && getCurse(this.armorGlyph ?? '')) {
			this.say(t('port.log.armorcursed'), 'negative');
			return;
		}
		if ((this.heroClass === 'duelist' && this.talentRank('adventurers_intuition') >= 2) || (this.heroClass === 'warrior' && this.talentRank('veterans_intuition') >= 2) || (this.heroClass === 'huntress' && this.talentRank('survivalists_intuition') >= 2)) Actors.identify(item);
		if (this.armorId === 'clothArmor' && this.armorInstanceId) this.bag.remove(this.armorId, 1, this.armorInstanceId);
		else if (this.armorId !== 'startingArmor') {
			const previous = { id: this.armorId, quantity: 1, instanceId: this.armorInstanceId, identified: true, level: this.armorLevel };
			const returned = { id: this.armorId, quantity: 1, instanceId: this.armorInstanceId, identified: true, affix: undefined as string | undefined };
			transferEnhancement({ ...previous, affix: this.armorGlyph ?? undefined }, returned);
			this.bag.add(returned);
		}
		this.bag.remove(id, 1, item.instanceId);
		this.armorId = id;
		this.armorInstanceId = item.instanceId;
		this.armorLevel = Math.min(5, item.level ?? 0);
		this.armorGlyph = item.affix ?? null;
		this.syncHeroFromStats();
		this.say(t('port.log.armorequipped', { level: this.armorLevel }), 'positive');
	}

	/** Generated quest weapons feed the same upgrade level used by the active class weapon. */
	private equipWeapon(id: string, instanceId?: string): void {
		const item = this.bag.find(id, instanceId);
		if (!item) return;
		if (this.weaponInstanceId === item.instanceId) return;
		//EquipableItem.doUnequip()'s cursed-and-known lock: a cursed weapon can't be swapped
		//away once equipped. This port treats an equipped item's curse as known immediately (no
		//separate identify-delay for gear already worn), a simplification of Java's real
		//identify-timing curtain.
		if (this.weaponId !== 'startingWeapon' && getCurse(this.weaponAffix ?? '')) {
			this.say(t('port.log.weaponcursed'), 'negative');
			return;
		}
		if ((this.heroClass === 'duelist' && this.talentRank('adventurers_intuition') >= 2) || (this.heroClass === 'warrior' && this.talentRank('veterans_intuition') >= 2) || (this.heroClass === 'huntress' && this.talentRank('survivalists_intuition') >= 2)) Actors.identify(item);
		if (this.weaponId !== 'startingWeapon') {
			const previous = { id: this.weaponId, quantity: 1, instanceId: this.weaponInstanceId, identified: true, level: this.weaponLevel, affix: this.weaponAffix ?? undefined };
			const returned = { id: this.weaponId, quantity: 1, instanceId: this.weaponInstanceId, identified: true, affix: undefined as string | undefined };
			transferEnhancement(previous, returned);
			this.bag.add(returned);
		}
		this.bag.remove(id, 1, item.instanceId);
		this.weaponId = id;
		this.weaponInstanceId = item.instanceId;
		this.weaponLevel = Math.min(5, Math.max(this.weaponLevel, item.level ?? 0));
		this.weaponAffix = item.affix ?? null;
		this.syncHeroFromStats();
		//**Correction, 2026-09-09 roadmap pass**: SWIFT_EQUIP's real spec (recovered from
		//`src/generated/spdMessages.ts`'s real English text, absent from the older Java tags an
		//earlier audit pass checked) is not "equipping generally costs less" as previously
		//assumed - it is a distinct, cooldown-gated quick-swap ability: rank 1 lets the Duelist
		//instantly re-equip a *quickslotted* weapon once per 20-turn cooldown; rank 2 raises
		//that to twice within a 5-turn window, still on the same 20-turn cooldown; ordinary
		//inventory-panel equipping is unaffected either way. This port's `equipWeapon`/
		//`equipArmor`/`equipRing`/`equipWand` never call `spendHeroTurn` at all - `useItemById`
		//is wired directly as the inventory window's click callback, entirely outside the
		//`onAction`/turn-spending pipeline every other bag action goes through - so every hero,
		//every class, already equips instantly and unconditionally, with no cooldown of any
		//kind. Against that baseline the real cooldown-gated ability has nothing to gate: there
		//is no "slow" case for it to speed up, so the distinct mechanic genuinely cannot be
		//modeled without first giving ordinary equipping a real cost/cooldown to be an
		//exception to - not attempted here. This log line remains an honest flavour-only stand-in.
		if (this.heroClass === 'duelist' && this.talentRank('swift_equip') > 0) this.say(t('items.kindofweapon.swift_equip'), 'positive');
		else this.say(t('port.log.weaponequipped', { level: this.weaponLevel }), 'positive');
	}

	/** A found wand refreshes the shared staff charge pool; Mage's special action consumes it. */
	private equipWand(): void {
		const wand = this.bag.find('wand');
		if (!wand) return;
		this.wandType = wandTypeFromSource((wand as typeof wand & { sourceClass?: string }).sourceClass) || this.wandType;
		this.frostWand = this.wandType === 'frost';
		if (this.heroClass === 'mage' && this.talentRank('scholars_intuition') >= 2) Actors.identify(wand);
		this.bag.remove('wand', 1);
		this.wandCharges = new Actors.Charges({ max: 4, current: 4, regenRate: 1 });
		this.say(t('port.log.wandequipped'), 'positive');
	}

	private positionInterface(width: number, height: number): void {
		this.infoPanel?.layout(width, height);
		if (this.actionBar) {
			this.actionBar.layout(width, height);
			if (this.gameLog) this.gameLog.y = height - this.actionBar.occupiedHeight - 8 - this.gameLog.logHeight;
		}

		if (this.inventoryPanel) {
			this.inventoryPanel.layout(width, height);
		}
		if (this.journalWindow) {
			this.journalWindow.x = Math.floor(width / 2);
			this.journalWindow.y = Math.floor(height / 2);
		}
		if (this.talentPanel) {
			this.talentPanel.x = Math.max(8, width - this.talentPanel.width - 8);
			this.talentPanel.y = Math.max(96, height - 92 - this.talentPanel.height);
		}
		if (this.victoryPanel) {
			this.victoryPanel.x = (width - this.victoryPanel.width) / 2;
			this.victoryPanel.y = Math.max(80, (height - this.victoryPanel.height) / 2);
		}
		if (this.bossHealthBar) {
			this.bossChrome.x = 12 + (width - this.bossChrome.width) / 2;
			this.bossChrome.y = 40;
			this.bossHealthBar.x = this.bossChrome.x + 15 * 2;
			this.bossHealthBar.y = this.bossChrome.y + 3 * 2;
			this.bossNameLabel.x = this.bossHealthBar.x + 2;
			this.bossNameLabel.y = this.bossHealthBar.y;
			this.bossNameLabel.anchor.set(0, 0);
		}
		this.badgeBanner.resize(width, height);
	}

	private say(line: string, level: LogLevel = 'info'): void {
		this.gameLog.add(line, level);
		this.positionInterface(Game.current.width, Game.current.height);
	}

	/**
	 * Status text over a creature, `CharSprite.showStatus` - a damage number, a heal, the
	 * name of a buff that just landed. Nothing was shown for any of these before: a hit was
	 * a one-frame white flash, so how hard it landed was only readable in the log.
	 */
	private showStatus(creature: Creature, text: string, color: number): void {
		if (!this.sprite(creature).visible) return;
		const [x, y] = this.worldOf(creature);
		this.floaters.show(x, y - TILE / 2, text, color);
	}

	/** damage taken, in `CharSprite.NEGATIVE` */
	private showDamage(creature: Creature, amount: number): void {
		if (amount > 0) this.showStatus(creature, String(amount), SPD_STATUS_COLOR.negative);
	}

	/** health gained, in `CharSprite.POSITIVE` */
	private showHeal(creature: Creature, amount: number): void {
		if (amount > 0) this.showStatus(creature, String(amount), SPD_STATUS_COLOR.positive);
	}

	/**
	 * Badge bookkeeping (`Badges.java`): bump a meta counter, announce whatever it newly
	 * earns, and persist the meta store at once (badges survive death, runs do not).
	 */
	private awardBadge(counter: string, amount = 1): void {
		for (const id of this.badges.increment(counter, amount)) {
			const def = BADGE_DEFS.find((b) => b.id === id);
			this.say(t('port.log.badge', { badge: def?.description ?? id }), 'positive');
			const icon = BADGE_ICON[id];
			if (icon !== undefined) this.badgeBanner.show(icon);
		}
		this.meta.save('meta', this.badges.toJSON());
	}

	/**
	 * What a bag item is called before identification: its shuffled appearance plus the
	 * plain noun ("a ruby potion"), the real `ItemSpriteSheet` variant system through
	 * `mwg/actors` Appearances. Identified items (and non-potion/scroll kinds) read as-is.
	 */
	private itemDisplayName(id: string, identified: boolean, instanceId?: string): string {
		//an identified item uses SPD's own name; an unidentified potion or scroll uses SPD's
		//appearance phrase, translated whole ('turquoise potion', 'scroll of KAUNAN') rather
		//than an adjective glued onto a noun - word order differs by language. An id with no
		//mapping falls through to the raw id, which is a developer-facing tell.
		if (id.startsWith('ring_')) {
			if (!identified) return t('port.name.ring');
			const ring = this.bag.find(id, instanceId);
			const curse = ring?.cursed ? ` (${t('port.name.cursed')})` : '';
			return `${t(RING_KEYS[id.slice(5)] ?? id)} +${ring?.level ?? 0}${curse}`;
		}
		if (identified) {
		const item = this.bag.find(id, instanceId);
			const affix = item?.affix ? ` (${t(`port.affix.${item.affix}`)})` : '';
			return `${t(ITEM_KEYS[id] ?? id)}${affix}`;
		}
		if (id.startsWith('potion')) return t(this.appearances.appearanceOf('potion', id));
		if (id.startsWith('scroll')) return t(this.appearances.appearanceOf('scroll', id));
		return t(ITEM_KEYS[id] ?? id);
	}

	private worldOf(creature: Creature): [number, number] {
		return [(creature.x + 0.5) * TILE, (creature.y + 0.5) * TILE];
	}

	private heroPoint(): { x: number; y: number } {
		const hero = this.hero;
		return {
			get x() {
				return (hero.x + 0.5) * TILE;
			},
			get y() {
				return (hero.y + 0.5) * TILE;
			},
		};
	}

	override resize(width: number, height: number): void {
		this.camera.setViewport(width, height);
		if (this.gameLog) {
			//wrap to the window, leaving room for the margin on both sides, and sit the block
			//on the bottom edge the way GameScene.java anchors its log
			this.gameLog.setWrapWidth(Math.max(100, (width - 16) / this.gameLog.scale.x));
			this.gameLog.y = height - this.gameLog.logHeight - 24;
		}
		if (this.hintLabel) {
			this.hintLabel.x = 8;
			this.hintLabel.y = height - 14;
		}
		if (this.compass) {
			//Centered on the portrait, as in StatusPane.layout().
			this.compass.x = this.statusPane.x + 30;
			this.compass.y = this.statusPane.y + 32;
		}
		this.positionInterface(width, height);
	}

	override update(dt: number): void {
		runState.audio.update(dt);
		if (this.interlevel) {
			const transition = this.interlevel;
			transition.elapsed += dt;
			transition.backdrop.tilePosition.y += dt * 5;
			const p = Math.min(1, transition.elapsed / transition.duration);
			//InterlevelScene uses exact 0.33s fades around a static middle phase.
			const fade = 0.33;
			transition.curtain.alpha = transition.elapsed < fade ? 1 - transition.elapsed / fade
				: transition.elapsed > transition.duration - fade ? (transition.elapsed - (transition.duration - fade)) / fade : 0;
			transition.message.alpha = 1 - transition.curtain.alpha;
			if (p >= 1) {
				transition.root.destroy({ children: true });
				this.interlevel = null;
				if (!this.gameOver) {
					this.awaitingInput = true;
					this.refresh();
				}
			}
		}
		this.heroAnimation?.update(dt);
		for (const creature of this.creatures) {
			const liveSprite = this.sprite(creature);
			if (!liveSprite.destroyed && liveSprite instanceof AnimatedSprite) {
				liveSprite.update(dt);
				if (liveSprite.isFinished) liveSprite.play('idle');
			}
		}
		// MobSprite finishes the death clip, then fades its corpse over three seconds.
		// Logical removal and loot are immediate; the corpse never blocks a cell.
		for (const [sprite, corpse] of this.dyingMonsters) {
			if (sprite.destroyed) { this.dyingMonsters.delete(sprite); continue; }
			sprite.visible = this.fov.isVisible(corpse.x, corpse.y);
			if (!sprite.isFinished) sprite.update(dt);
			else {
				corpse.fade += dt;
				sprite.alpha = Math.max(0, 1 - corpse.fade / 3);
				if (corpse.fade >= 3) { sprite.destroy(); this.dyingMonsters.delete(sprite); }
			}
		}
		for (const [sprite, motion] of this.monsterMotion) {
			if (!sprite.destroyed) motion.update(dt);
			if (sprite.destroyed || !motion.isBusy) { motion.clear(); this.monsterMotion.delete(sprite); }
		}
		this.characterEffects.update(dt, [
			...this.creatures.map(creature => ({ sprite: this.sprite(creature), sleeping: creature.sleeping })),
			...Array.from(this.dyingMonsters.keys(), sprite => ({ sprite })),
			...(this.gameOver && !this.sprite(this.hero).destroyed ? [{ sprite: this.sprite(this.hero) }] : []),
		]);
		this.camera.update(dt);
		this.map?.cull(this.camera);
		this.wallsMap?.cull(this.camera);
		this.featuresMap?.cull(this.camera);
		this.wallBlocking?.cull(this.camera);
		this.badgeBanner.update(dt);
		this.waterSurface?.update(dt);
		this.wallDecorations?.update(dt, (x, y) => this.fov.isVisible(x, y));
		this.waterEmbers?.update(dt, (x, y) => this.fov.isVisible(x, y));

		//the hit-flash fades by clearing only the additive term, never the tint - tint is a
		//creature's identity colour here, and resetColor() would wipe the sprite's own art
		//back to a flat white square along with the flash
		for (const creature of this.creatures) {
			if (this.sprite(creature).colorAdd !== 0) this.sprite(creature).colorAdd = 0;
		}

		for (let i = this.projectiles.length - 1; i >= 0; i--) {
			const thrown = this.projectiles[i];
			if (thrown.flight.update(dt)) {
				thrown.sprite.destroy();
				this.projectiles.splice(i, 1);
			}
		}

		this.floaters.update(dt);

		//Compass.java recomputes its angle whenever the camera scrolls, against the camera's
		//own centre - so it follows the view rather than the hero, and keeps pointing while
		//the hero stands still and the camera eases in
		if (this.compass && this.hasStairs && this.stairs) {
			const view = this.camera.view;
			this.compass.update(
				{ x: (this.stairs.x + 0.5) * TILE, y: (this.stairs.y + 0.5) * TILE },
				{ x: view.x + view.width / 2, y: view.y + view.height / 2 },
				this.fov?.isExplored(this.stairs.x, this.stairs.y) ?? false
			);
		}
	}
}

/** Registers SPD's bundled font before any Pixi Text/Label is constructed. */
async function loadSpdFont(): Promise<void> {
	if (!('fonts' in document)) return;
	try {
		const face = new FontFace('SPD Pixel', `url(${pixelFontUrl})`);
		await face.load();
		document.fonts.add(face);
	} catch {
		//Text remains readable through the comprehensive system fallback stack in the theme.
	}
}

async function main(): Promise<void> {
	//before any table is read or any widget built: a catalog installed later would leave
	//already-built strings in the previous language
	initI18n(localStorage.getItem(LANGUAGE_KEY));
	runState.audio = new SpdAudio();
	await loadSpdFont();

	const game = new Game({
		canvas: document.getElementById('game') as HTMLCanvasElement,
		// Java clears the scene to black, including space outside the dungeon map.
		background: 0x000000,
		//Every TintedSprite here (hero, monsters, items, both staircases) draws through mwg's
		//colour-transform pipe, and Pixi will only accept a custom pipe registered before the
		//renderer exists - so it cannot be done lazily on first use, and mwg deliberately
		//leaves the call to the game rather than registering behind our back.  Without it the
		//first frame that draws one throws "renderPipes[renderPipeId] is undefined" inside
		//Pixi's render-group walk, killing the renderer: a black screen with no game visible.
		//`TitleScene`'s scrolling `TilingSprite` background, and every `Chrome`/`Window`/
		//`Button` built through `mwg/ui`'s `NinePatch` (i.e. all of them - `NineSliceSprite`
		//is `NinePatch`'s underlying Pixi primitive), hit the exact same pitfall even though
		//both are *built-in* Pixi pipes, not custom ones: each normally self-registers via a
		//side-effect import inside the `pixi.js` package, but `vite build`'s production
		//tree-shaking drops that import once nothing else in the bundle references an export
		//from it - `npx tsc`/`vite`'s dev server never catch this, only a real `file://` load
		//of the built `dist/game.js` does (`Cannot read properties of undefined (reading
		//'validateRenderable')`). `NineSliceSprite`'s registration apparently only survived by
		//accident before now - adding the `TilingSprite` import changed enough of Rollup's
		//tree-shaking graph to drop it too. Registering both explicitly here, the same way
		//`registerColorTransform` already has to be, survives the tree-shake regardless of
		//what else gets imported later.
		extensions: [
			registerColorTransform,
			() => extensions.add(TilingSpritePipe),
			() => extensions.add(NineSliceSpritePipe),
		],
	});

	Input.bind('search', ['KeyF']);
	Input.bind('examine', ['KeyL']);
	Input.bind('special', ['KeyT']);
	Input.bind('eat', ['KeyE']);
	Input.bind('quaff', ['KeyQ']);
	Input.bind('read', ['KeyR']);
	Input.bind('upgrade', ['KeyU']);
	Input.bind('buyHeal', ['KeyB']);
	Input.bind('buyId', ['KeyN']);
	Input.bind('sellFood', ['KeyV']);
	Input.bind('buyback', ['KeyG']);
	Input.bind('save', ['KeyO']);
	Input.bind('load', ['KeyP']);

	runState.sprites = await loadSpdSprites();
	//before any widget is constructed, so every Label/Window/IconGrid built from here on
	//already carries SPD's frame and palette instead of mwg's default dark panel
	applySpdTheme(runState.sprites.uiChrome);
	await game.start(TitleScene);
}

main().catch((error) => {
	console.error(error);
	document.body.insertAdjacentHTML(
		'afterbegin',
		`<pre style="color:#c66;font:12px monospace;padding:16px">${String(error?.stack ?? error)}</pre>`
	);
});
