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
import { Game, Scene2D, Input, Random, SaveSystem, Achievements } from 'mwg';
import { SceneSimulationAdapter } from './adapters/sceneSimulation';
import { dispatchHeroAction, type HeroActionPorts } from './adapters/heroActions';
import { MOVES } from './simulation/heroActions';
import { finishHeroTurn } from './simulation/heroTurn';
import { planMovement } from './simulation/movement';
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
import { arcaneVisionRadius, assassinReachBonus, bountyGoldBonus, cachedRationChance, canImproviseProjectile, cleaveComboSeed, deathlessFuryTriggers, endlessRageFreeTurn, enhancedLethalityThreshold, enragedCatalystBonus, evasiveArmorBonus, empoweredStrikeBonus, farsightRange, ironStomachReduction, ironWillReduction, lethalDefenseShield, lethalHasteFreeTurn, monasticVigorShield, naturesBountyDewChance, necromancerMinionChance, preservationChance, projectileMomentumBonus, rejuvenatingStepHeal, shieldBatteryGain, shieldingDewGain, sharedUpgradeArmor, soulSiphonCharge, twinUpgradeArmor, unencumberedSpiritEvasion, weaponRechargingGain } from './talentEffects';
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
import { getSellPrice, getShopPrice } from './shopPricing';
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
import { Cat, generatorRandom, randomArmor, randomUsingDefaults, randomWeapon, removeArtifactClass, setGeneratorDepth, type GenItem, type StatueLoot } from './spdItems/generator';
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
	type Step,
	type Creature,
	type GroundItem,
	type BuffId,
} from './combat';
import { nextEntityId } from './simulation/entityId';
import { heroSheet, MONSTERS, mobRosterForDepth, liveStats, BOSSES, MOB_LOOT, type AnyMonsterId, type MonsterId } from './monsters';

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
 * `items/armor/curses/`). This port models eight enchants (Blazing/Chilling/Shocking/Vampiric/
 * Grim/Lucky/Blocking/Kinetic), one passive (Swiftness), six glyphs (Stone/Thorns/Flow/
 * Entanglement/Swiftness/Potential), all 7 remaining weapon curses with a real effect
 * (Wayward/Annoying/Dazzling/Explosive/Polarized/Sacrificial/Displacing), and all 8 armor curses
 * (Fragile/AntiEntropy/Bulk/Corrosion/Displacement/Metabolism/Multiplicity/Overgrowth) - each
 * chosen because its real effect fits a system this port already has (a buff, a flat stat, a
 * ground-item drop, the shared `heroBarrier`, the shared poison DoT, a free-cell teleport
 * search) rather than needing a new one. Blocking's real proc chance and shield-amount formulas
 * are both reproduced (`(lvl+4)/(lvl+40)`, `round(max(1,procChance) * (2+lvl))`); the shared
 * `heroBarrier` pool now decays every hero turn via `Barrier.act()`'s real proportional curve
 * (`min(1, shielding/20)` per turn, accumulated fractionally), but Blocking's own `BlockBuff` is
 * a separate Java `ShieldBuff` whose fixed 5-turn cliff-edge expiry (`postpone(5f)`) still isn't
 * reproduced, since this port pools every shield source into one barrier rather than tracking
 * Blocking's contribution as its own timed buff. Every other real enchant/glyph/curse needs a
 * subsystem this port does not model - Kinetic needs a decaying "conserved damage" carry-over
 * read back into the *next* hit's damage calc before defense is applied (**note**: Kinetic
 * itself is listed among the modeled enchants above via `kineticStored` - only the remaining
 * unmodeled group is: Blooming needs plants; Corrupting needs a "convert enemy" mechanic;
 * Elastic/Projecting need AoE/thrown-range geometry; Unstable is a meta-enchant with no fixed
 * effect to port; Friendly needs a two-way Charm subsystem this port lacks; the remaining armor
 * glyphs (Affection/AntiMagic/Brimstone/Camouflage/Obfuscation/Repulsion/Viscosity) need
 * charm/wand-drain/blink/durability systems likewise absent, and the armor-glyph Swiftness needs
 * a per-weapon attack-delay economy for the *hero* that the weapon-enchant Swiftness above
 * doesn't (that one is a flat turn-cost multiplier, already reproduced). See PORT_COVERAGE.md
 * for the itemized list. The trigger routing (strike vs defend vs passive) is the real shape
 * either way. Every curse entry locks gear via the equipment lock until a cleanse scroll lifts
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
		{ id: 'swiftness', trigger: 'passive', weight: 3, description: 'Faster attacks (10% speed increase per rank)' },
		{ id: 'wayward', trigger: 'strike', weight: 1, curse: true, description: 'Cursed: -3 accuracy' },
		{ id: 'annoying', trigger: 'strike', weight: 1, curse: true, description: 'Cursed: chance to alert every monster on the floor' },
		{ id: 'dazzling', trigger: 'strike', weight: 1, curse: true, description: 'Cursed: chance to blind everyone nearby, including you' },
		{ id: 'explosive', trigger: 'strike', weight: 1, curse: true, description: 'Cursed: eventually detonates on its wielder' },
		{ id: 'polarized', trigger: 'strike', weight: 1, curse: true, description: 'Cursed: every other hit is amplified, the rest whiff entirely' },
		{ id: 'sacrificial', trigger: 'strike', weight: 1, curse: true, description: 'Cursed: chance to wound its wielder' },
		{ id: 'displacing', trigger: 'strike', weight: 1, curse: true, description: 'Cursed: chance to teleport the struck target away' },
	],
};
const GLYPH_TABLE: Actors.AffixTable = {
	entries: [
		{ id: 'stone', trigger: 'defend', weight: 3, description: '+2 armor' },
		{ id: 'thorns', trigger: 'defend', weight: 3, description: 'Reflects 2' },
		{ id: 'flow', trigger: 'passive', weight: 3, description: '+2 evasion' },
		{ id: 'entanglement', trigger: 'defend', weight: 2, description: 'Chance to root an attacker' },
		{ id: 'swiftness', trigger: 'passive', weight: 3, description: 'Faster movement when safe (20% speed increase)' },
		{ id: 'potential', trigger: 'defend', weight: 3, description: 'Chance to recharge wands when hit' },
		{ id: 'fragile', trigger: 'defend', weight: 1, curse: true, description: 'Cursed: +2 damage taken' },
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
 * Rings (`items/rings/`) as level-scaled modifiers, 4 of the real 12
 * (`RingOfAccuracy`/`RingOfEvasion`/`RingOfMight`/`RingOfTenacity` - Arcana/Elements/
 * Energy/Force/Furor/Haste/Sharpshooting/Wealth not ported at all). Verified against
 * Java source, all four now exact:
 * - Accuracy: `accuracyMultiplier()` = x1.30^lvl.
 * - Evasion: `evasionMultiplier()` = x1.125^lvl.
 * - Might: `strengthBonus()` = flat +lvl STR (here); `HTMultiplier()` = x1.035^lvl max HP
 *   is applied separately in `equipRing` as `ringHtBonus`, since it changes max HP rather
 *   than a StatBlock stat and `syncHeroFromStats` runs far more often than the ring
 *   actually changes.
 * - Tenacity: `damageMultiplier()` = x0.85^(lvl * missingHpFraction) applied to *incoming*
 *   damage (heavier reduction the lower the wearer's current HP) - applied directly in
 *   `absorbHeroDamage` via `ringTenacityMultiplier()`, since it depends on live HP rather
 *   than a static stat; its `stat` entry below is a marker only (skipped in the
 *   `scaledModifiers` loop), not a StatBlock modifier. The Imp's reward is a fixed +2
 *   cursed ring, as in Java.
 */
const RING_DEFS: Record<string, { stat: string; op: Actors.ModifierOp; at: (level: number) => number }> = {
	accuracy: { stat: 'accuracy', op: 'multiply', at: (lvl) => Math.pow(1.3, lvl) },
	evasion: { stat: 'evasion', op: 'multiply', at: (lvl) => Math.pow(1.125, lvl) },
	might: { stat: 'strength', op: 'add', at: (lvl) => lvl },
	tenacity: { stat: 'tenacity', op: 'add', at: (lvl) => lvl },
	//RingOfHaste.speedMultiplier()/RingOfEnergy.wandChargeMultiplier(): both real Java formulas
	//are `pow(1.175, level)`, applied outside the StatBlock loop below the same way Tenacity is
	//(`getActionTurnCostMod`/`recoverWandCharge`'s rate read these via `ringDef` directly, since
	//"faster turns" and "faster wand recharge" aren't `heroStats` entries).
	haste: { stat: 'speed', op: 'multiply', at: (lvl) => Math.pow(1.175, lvl) },
	energy: { stat: 'energy', op: 'multiply', at: (lvl) => Math.pow(1.175, lvl) },
};

/**
 * `RING_DEFS` is keyed bare ("might"), but every stored/bag ring id carries the UI's
 * "ring_" prefix ("ring_might" - see `useItemById`'s `id.startsWith('ring_')` dispatch and
 * the `` `ring_${...}` `` construction at every ring spawn site). Indexing `RING_DEFS`
 * directly by `equippedRing.id` was a real, previously-undiscovered bug: it looked up
 * `RING_DEFS["ring_might"]`, always undefined, so equipping *any* ring crashed
 * `syncHeroFromStats()` with a `TypeError` reading `.stat` of undefined the next time it
 * ran. Route every lookup through this helper instead of indexing `RING_DEFS` directly.
 */
function ringDef(id: string): { stat: string; op: Actors.ModifierOp; at: (level: number) => number } | undefined {
	return RING_DEFS[id.replace(/^ring_/, '')];
}

/**
 * Unidentified appearances (`ItemSpriteSheet`'s shuffled variants) as `mwg/actors`
 * Appearances: nine potion looks, eight scroll looks, dealt per run. This replaces the
 * old "always the first variant" simplification with the real shuffle.
 */
const APPEARANCE_TABLES: Record<string, Actors.AppearanceTable> = {
	potion: {
		kinds: ['potion', 'potionHealing', 'potionStrength', 'potionFlame', 'potionMindVision', 'potionInvis', 'potionPurity', 'potionExperience', 'potionLevitation'],
		labels: POTION_APPEARANCE_KEYS.slice(0, 9) as string[],
	},
	scroll: {
		kinds: ['scroll', 'scrollIdentify', 'scrollUpgrade', 'scrollRage', 'scrollLullaby', 'scrollMapping', 'scrollMirror', 'scrollCleanse', 'scrollRecharging', 'scrollTeleportation', 'scrollTerror', 'scrollRetribution'],
		labels: SCROLL_APPEARANCE_KEYS.slice(0, 12) as string[],
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
	frostWand: boolean;
	ghostSpawned: boolean;
	ghostType: number;
	wandmakerSpawned: boolean;
	shopkeeperSpawned: boolean;
	blacksmithSpawned?: boolean;
	impSpawned?: boolean;
	blacksmithAlternative?: boolean;
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
	equippedRing?: { id: string; level: number; instanceId?: string; cursed?: boolean } | null;
	ringHtBonus?: number;
	advancement?: { grantedTiers: number; balance: number; choices: [number, string][] };
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
	armorGlyph?: string | null;
	kineticStored?: number;
	timeBubbleTurns?: number;
	timeBubblePresses?: number[];
	hourglassFreeze?: boolean;
	hourglassTurnsToCost?: number;
	heroShield?: number;
	heroBarrierState?: { layers: { amount: number; decayPerTick?: number }[] };
	barrierPartialLoss?: number;
	stealthTalentTicks?: number;
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
	plantFreeze?: FireState;
	sacrificialFire?: FireState;
	sacrificialFireCharge?: number;
	sacrificialFireCell?: number;
	sacrificialFirePrize?: GroundItem['item'];
	portedFeatures?: { cells: [number, string][] };
	groundItems: { kind: GroundItemKind; x: number; y: number; item?: GroundItem['item']; chest?: 'normal' | 'locked' | 'crystal' }[];
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
	champion?: 'blessed' | 'blazing' | 'giant' | 'growing' | null;
	championPower?: number;
	pumped?: number;
	combo?: number;
	moving?: number;
	arenaJumps?: number;
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
	nextTurn: number | null;
	hasRaged?: boolean;
	raged?: boolean;
	chainUsed?: boolean;
	ventCooldown?: number;
	webCooldown?: number;
}

/**
 * `examineTile`'s per-region `tileName`/`tileDesc` overrides, each checked directly against
 * its real `*Level.java` - every branch below is a literal `t('...')` call, deliberately
 * never a template string, because `tools/i18n-extract.mjs` only scrapes literal string
 * arguments (see its own doc comment) and a computed key would silently resolve to nothing
 * at runtime, printing the raw key text instead of a translation.
 */
function examineWaterName(region: Region): string {
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
function examineGrassName(region: Region): string {
	if (region === 'caves') return t('levels.caveslevel.grass_name');
	if (region === 'halls') return t('levels.hallslevel.grass_name');
	return t('levels.level.grass_name');
}
/** `high_grass_name`: every region but Sewers/Prison overrides it */
function examineHighGrassName(region: Region): string {
	if (region === 'caves') return t('levels.caveslevel.high_grass_name');
	if (region === 'city') return t('levels.citylevel.high_grass_name');
	if (region === 'halls') return t('levels.hallslevel.high_grass_name');
	return t('levels.level.high_grass_name');
}
/** `entrance_desc`: only CavesLevel/CityLevel override it */
function examineEntranceDesc(region: Region): string {
	if (region === 'caves') return t('levels.caveslevel.entrance_desc');
	if (region === 'city') return t('levels.citylevel.entrance_desc');
	return t('levels.level.entrance_desc');
}
/** `exit_desc`: only CavesLevel/CityLevel override it */
function examineExitDesc(region: Region): string {
	if (region === 'caves') return t('levels.caveslevel.exit_desc');
	if (region === 'city') return t('levels.citylevel.exit_desc');
	return t('levels.level.exit_desc');
}
/** `bookshelf_desc`: Sewer/Prison/CavesLevel each override it; `Level`'s base `tileDesc()` has no
 *  BOOKSHELF case at all, so any other region falls through to no description - matching Java,
 *  not a gap in this port. */
function examineBookshelfDesc(region: Region): string {
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
function examineEmptyDecoDesc(region: Region): string {
	if (region === 'sewers') return t('levels.sewerlevel.empty_deco_desc');
	if (region === 'prison') return t('levels.prisonlevel.empty_deco_desc');
	if (region === 'city') return t('levels.citylevel.deco_desc');
	return '';
}
/** `deco_desc` on a WALL_DECO cell: only `CityLevel` overrides this case (shared with
 *  EMPTY_DECO above, per `CityLevel.tileDesc()`'s combined `case WALL_DECO: case EMPTY_DECO:`). */
function examineWallDecoDesc(region: Region): string {
	return region === 'city' ? t('levels.citylevel.deco_desc') : '';
}
/** `statue_name`: `Level`'s own base has a STATUE/STATUE_SP case (`statue_name`); `HallsLevel` is
 *  the only region that overrides it (`City` does not, despite overriding the matching `_desc`
 *  below - checked directly against `CityLevel.tileName()`, which has no STATUE case at all). */
function examineStatueName(region: Region): string {
	return region === 'halls' ? t('levels.hallslevel.statue_name') : t('levels.level.statue_name');
}
/** `statue_desc`: `Level`'s own base already has a STATUE/STATUE_SP case (unlike WALL_DECO/
 *  EMPTY_SP, which have no base case at all); `City`/`HallsLevel` each override it with their own
 *  flavored text, every other region falls through to the base key. */
function examineStatueDesc(region: Region): string {
	if (region === 'city') return t('levels.citylevel.statue_desc');
	if (region === 'halls') return t('levels.hallslevel.statue_desc');
	return t('levels.level.statue_desc');
}
/** `sp_desc`: only `CityLevel` overrides EMPTY_SP. */
function examineSpDesc(region: Region): string {
	return region === 'city' ? t('levels.citylevel.sp_desc') : '';
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
	private simulation = new SceneSimulationAdapter<Creature>({
		scheduler: this.scheduler,
		isGameOver: () => this.gameOver,
		takeMonsterTurn: (actor) => this.takeMonsterTurn(actor),
		afterMonsterTurn: (actor) => this.afterMonsterTurn(actor),
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
				this.talentOpen = this.subclassChoiceOpen || this.armorChoiceOpen || !this.talentOpen;
				this.refreshTalentPanel();
			},
			buyHeal: () => this.shopBuy('potion'), buyId: () => this.shopBuy('scrollIdentify'),
			sellFood: () => this.shopSellFood(), save: () => this.saveRun(), load: () => this.loadRun(),
		},
		move: (step) => {
			this.justDescended = false;
			this.actionSpentTurn = false;
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
	/** MissileWeapon durability is shared by the active stack; a projectile breaks only at 0. */
	private ammoDurability = 100;
	private projectiles: Array<{ flight: Projectile; sprite: TintedSprite }> = [];
	/** a plain dot for a thrown item or a bolt in flight - there is no real projectile sprite to port for these, just the numbers */
	private dotTexture!: Texture;

	/** `Hero.exp`/`lvl` against SPD's real curve - see `SPD_LEVEL_CURVE` */
	private progression!: Actors.Progression;
	/** base `accuracy`/`evasion`/`gold` a skill point can raise */
	private heroStats!: Actors.StatBlock;
	private skillPoints!: Actors.SkillPoints;
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

	/** switches/variables the quest stage conditions read */
	private gameState = new Rpg.GameState();
	private quests = new Rpg.QuestLog();
	/** `Ghost.Quest.spawned` / Wandmaker `spawned` - each NPC appears once per run */
	private ghostSpawned = false;
	private wandmakerSpawned = false;
	private shopkeeperSpawned = false;
	private blacksmithSpawned = false;
	/** Java Blacksmith.Quest.alternative: blood-stained pickaxe instead of 15 DarkGold. */
	private blacksmithAlternative = false;
	private impSpawned = false;
	/** Imp token ask for this run (5 monk tokens on odd depths, 4 golem tokens on even) */
	private impNeed = 5;
	/** Ghost Quest.type for this run (1 Fetid Rat, 2 Gnoll Trickster, 3 Great Crab) */
	private ghostType = 1;
	/** shop stock + prices (Shopkeeper.sellPrice simplified to flat numbers, see interact) */
	private shopStock = new Actors.Inventory();
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
	/** Kinetic's conserved damage, decaying between turns until the next hero hit. */
	private kineticStored = 0;
	/** Swiftthistle's TimeBubble: hero actions advance while automatic actors are frozen. */
	private timeBubbleTurns = 0;
	private timeBubblePresses = new Set<number>();
	/** Timekeeper's Hourglass freeze state; unlike Swiftthistle's bubble it consumes charges. */
	private hourglassFreeze = false;
	private hourglassTurnsToCost = 2;
	/** Java Barrier/BrokenSeal-style shielding, consumed before HP and saved with the run. */
	private heroBarrier = new Actors.Barrier();
	/** Barrier.partialLostShield (`actors/buffs/Barrier.java`): fractional decay accumulator. */
	private barrierPartialLoss = 0;
	private stealthTalentTicks = 0;
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
	private equippedRing: { id: string; level: number; instanceId?: string; cursed?: boolean } | null = null;
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
	/** SacrificialFire blob and its generated prize, adopted from SacrificeRoom. */
	private sacrificialFire!: Roguelike.Blob;
	private sacrificialFireCharge = 0;
	private sacrificialFireCell = -1;
	private sacrificialFirePrize: GroundItem['item'] | undefined;
	/** phased-boss state, rebuilt on each boss floor */
	private kingPhases = new Roguelike.BossPhases([0.5]);
	private kingCycle = new Roguelike.AbilityCycle({ summon: 10 });
	private yogPhases = new Roguelike.BossPhases([0.75, 0.5, 0.25]);
	/** loot wands: fireblast (cone) and lightning (chain), no recharge (found wands only) */
	private fireCharges = new Actors.Charges({ max: 3, current: 0, regenRate: 9999 });
	private boltCharges = new Actors.Charges({ max: 3, current: 0, regenRate: 9999 });
	/** Ghoul lifelink: downs this floor (first down revives, later ones stick) */
	private ghoulsDowned = 0;
	/** the King's live summoned guard, for the barrier check and death cleanup */
	private kingAdds = new Set<Creature>();
	/** CavesBossLevel's pylon gate/energy stand-in; the fixed floor supplies these cells. */
	private cavesBossSealed = false;
	private cavesBossEnergyTurns = 0;
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
		//Shopkeeper stock: two healing potions, two identify scrolls (flat-price stand-in for
		//sellPrice()'s 5x-value formula - no per-item values exist here to multiply)
		this.shopStock.add({ id: 'potion', quantity: 2, stackable: true, identified: true });
		this.shopStock.add({ id: 'scrollIdentify', quantity: 2, stackable: true, identified: true });

		this.hero = this.makeHero();
		this.heroAnimation = new HeroAnimation(this.sprite(this.hero), runState.sprites[this.heroClass]);
		this.characterEffects = new CharacterEffects(runState.sprites.uiIcons);
		this.ammo = CLASSES[this.heroClass].special.ammo ?? 0;
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
		this.deathlessFuryUsed = false;
		this.stealthTalentTicks = 0;
		this.wandBonusDamage = 0;
		this.physicalBonusDamage = 0;
		this.physicalBonusAttacks = 0;
		this.patientStrikeReady = false;
		this.healingEvasionTurns = 0;
		//a flat +5 cap over the starting value in place of any specific real talent's own cap
		this.skillPoints = new Actors.SkillPoints(this.heroStats, {
			cap: (stat) => (stat === 'gold' ? 0 : this.heroStats.base(stat) + 5),
			cost: () => 1,
		});
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
		this.hero.damage = [this.weaponTier + this.weaponLevel, 5 * (this.weaponTier + 1) + this.weaponLevel * (this.weaponTier + 1)];
		const bark = this.talentRank('barkskin');
		//Armor: min = lvl, max = tier*(2+lvl). Tier 1 (cloth): [lvl, 2+lvl],
		//tier 2 (leather): [lvl, 4+2*lvl], tier 3 (mail): [lvl, 6+3*lvl], etc.
		this.hero.armor = [this.armorLevel + (bark > 0 ? 1 : 0), this.armorTier * (2 + this.armorLevel) + bark];
		const subclass = this.subclass();
		if (subclass === 'champion') this.hero.damage = [this.hero.damage[0] + 1, this.hero.damage[1] + 1];
		if (subclass === 'warden' && this.level && this.level.get(this.hero.x, this.hero.y) === HIGH_GRASS) {
			this.hero.armor = [this.hero.armor[0] + 2, this.hero.armor[1] + 2];
		}
		//passive affix math lives here, next to every other flat stat: Wayward -3 accuracy,
		//Stone +2 armor, Fragile -2 armor (floored at 0), Flow +2 evasion
		if (this.weaponAffix === 'wayward') this.hero.accuracy = Math.max(0, this.hero.accuracy - 3);
		if (this.armorGlyph === 'stone') this.hero.armor = [this.hero.armor[0] + 2, this.hero.armor[1] + 2];
		if (this.armorGlyph === 'fragile') this.hero.armor = [Math.max(0, this.hero.armor[0] - 2), Math.max(0, this.hero.armor[1] - 2)];
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
			if (def && def.stat !== 'strength' && def.stat !== 'tenacity' && def.stat !== 'speed' && def.stat !== 'energy') {
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

			//tier windows straight from TALENT_TIERS: [2,7) and [7,13)
			if (level >= TALENT_TIERS[1] && level < TALENT_TIERS[5]) {
				//Talent points are intentionally separate from the combat-skill counters.
				this.skillPoints.grant(1);
			}
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
	private spawnMonster(kind: AnyMonsterId, at: Step, restoring = false, mimicLoot?: string): Creature {
		const baseDef = MONSTERS[kind];
		const def = (kind === 'mimic' || kind === 'crystalMimic')
			? { ...baseDef, hp: (1 + this.depth) * 6, accuracy: 6 + this.depth, evasion: 2 + Math.floor(this.depth / 2), damage: [1 + this.depth, 2 + this.depth * 2] as [number, number], armor: [0, 1 + Math.floor(this.depth / 2)] as [number, number] }
			: kind === 'piranha'
				? { ...baseDef, hp: 10 + this.depth * 5, accuracy: 20 + this.depth * 2, evasion: 10 + this.depth * 2, damage: [this.depth, 4 + this.depth * 2] as [number, number], armor: [0, this.depth] as [number, number] }
				: kind === 'bee'
					? { ...baseDef, hp: (2 + this.depth) * 4, accuracy: 9 + this.depth, evasion: 9 + this.depth, damage: [Math.max(1, Math.floor((2 + this.depth) * 4 / 10)), Math.max(1, Math.floor((2 + this.depth) * 4 / 4))] as [number, number], armor: [0, 0] as [number, number] }
				: kind === 'statue'
					? { ...baseDef, hp: 15 + this.depth * 5, accuracy: 9 + this.depth, evasion: 4 + this.depth, damage: [2, 8 + this.depth] as [number, number], armor: [0, 2 + this.depth] as [number, number] }
					: kind === 'armoredStatue'
						? { ...baseDef, hp: 30 + this.depth * 10, accuracy: 9 + this.depth, evasion: 4 + this.depth, damage: [2, 8 + this.depth] as [number, number], armor: [0, 4 + this.depth] as [number, number] }
				: baseDef;
		const baseKind: MonsterId = kind === 'albino' ? 'rat'
			: kind === 'causticSlime' ? 'slime'
			: kind === 'bandit' ? 'thief'
			: kind === 'spectralNecromancer' ? 'necromancer'
			: kind === 'armoredBrute' ? 'brute'
			: kind === 'dm201' ? 'dm200'
			: kind === 'senior' ? 'monk'
			: kind === 'acidic' ? 'scorpio'
			: kind === 'crystalMimic' ? 'mimic'
			: kind === 'armoredStatue' ? 'statue'
			: kind;
		//quest minibosses reuse their family's sheet at their own sprite's idle frame
		//(FetidRatSprite on rat.png:32, GnollTricksterSprite on gnoll.png:21, GreatCrabSprite
		//on crab.png:16 - all three sprite classes texture() the base family sheet in Java)
		const texture =
			kind === 'fetidRat'
				? runState.sprites.rat
				: kind === 'gnollTrickster'
					? runState.sprites.gnoll
					: kind === 'greatCrab'
						? runState.sprites.crab
						: kind === 'necroSkeleton'
							? runState.sprites.skeleton
							: baseKind === 'fetidRat'
								? runState.sprites.rat
								: baseKind === 'gnollTrickster'
									? runState.sprites.gnoll
									: baseKind === 'greatCrab'
										? runState.sprites.crab
										: baseKind === 'necroSkeleton'
												? runState.sprites.skeleton
															: baseKind === 'mimic'
															? runState.sprites.slime
											: baseKind === 'piranha' || baseKind === 'bee'
												? runState.sprites.crab
																	: baseKind === 'statue'
																		? runState.sprites.crab
															: runState.sprites[baseKind as keyof typeof runState.sprites];
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

		const isNPC = kind === 'ghost' || kind === 'wandmaker' || kind === 'shopkeeper' || kind === 'blacksmith' || kind === 'imp';
		const isBoss = kind === 'goo' || kind === 'tengu' || kind === 'dm300' || kind === 'king' || kind === 'yog' || kind === 'yogFist';
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
			npcKind: isNPC ? (kind as 'ghost' | 'wandmaker' | 'shopkeeper' | 'blacksmith' | 'imp') : undefined,
			//Mob.java: everything spawns SLEEPING (bosses and NPCs excepted); champions are a
			//flat 10% roll here (real `rollForChampion` instead scales the roster-wide budget
			//by depth via `Dungeon.mobsToChampion`, not modeled), among 4 of the real 6
			//ChampionEnemy types - Blessed/Blazing/Giant/Growing; Projecting/AntiMagic still need
			//systems (reach-based targeting, a magic-vs-physical damage distinction) this port
			//doesn't model, so the roll is a 1-in-4 among the ported subset rather than Java's
			//real 1-in-6 with 2 silently no-op'd - see `PORT_COVERAGE.md`
			//DemonSpawner never sleeps (state=PASSIVE from the start, not SLEEPING)
			sleeping: restoring || !(isNPC || isBoss || kind === 'fetidRat' || kind === 'gnollTrickster' || kind === 'greatCrab' || kind === 'demonSpawner'),
			champion: restoring ? null : (!isNPC && !isBoss && kind !== 'necroSkeleton' && kind !== 'demonSpawner' && Random.chance(0.1) ? Random.element(['blessed', 'blazing', 'giant', 'growing'] as const)! : null),
			championPower: 1.19,
			combo: 0,
			moving: 0,
			skeleton: null,
			arenaJumps: 0,
			generation: 0,
			mimicLoot,
			mimicRevealed: kind === 'crystalMimic' ? false : undefined,
		});
		this.spriteFor.set(monster.id, sprite);
		//Monk.java: enters HUNTING with Focus (one guaranteed dodge, re-earned over ~6 turns)
		if (kind === 'monk' || kind === 'senior') addBuff(monster, 'focus');
		this.creatures.push(monster);
		// A restored creature receives its saved scheduler time below. Rolling a fresh stagger
		// here would both lose turn order and perturb the run's random stream.
		if (!restoring) this.scheduler.add(monster, Random.float(0.1, 0.9));
		return monster;
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
				combo: creature.combo, moving: creature.moving, arenaJumps: creature.arenaJumps,
				weaponLevel: creature.weaponLevel, stolen: creature.stolen, mimicLoot: creature.mimicLoot, generation: creature.generation,
				spawnCooldown: creature.spawnCooldown, seesHero: creature.seesHero, mimicRevealed: creature.mimicRevealed,
				hasteTurns: creature.hasteTurns, hasteBaseSpeed: creature.hasteBaseSpeed,
				hasRaged: creature.hasRaged, raged: creature.raged, chainUsed: creature.chainUsed,
				ventCooldown: creature.ventCooldown, webCooldown: creature.webCooldown,
				skeletonIndex: creature.skeleton ? savedIndex.get(creature.skeleton) : undefined,
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
			portedFeatures: this.portedFeatures.toJSON(),
			sacrificialFire: this.sacrificialFire.toJSON(),
			sacrificialFireCharge: this.sacrificialFireCharge,
			sacrificialFireCell: this.sacrificialFireCell,
			sacrificialFirePrize: this.sacrificialFirePrize,
			groundItems: this.groundItems.map(({ kind, x, y, item, chest }) => ({ kind, x, y, item, chest })),
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
		this.manualPlants = new Map(state.manualPlants ?? []);
		this.restorePortedFeatures(state.portedFeatures);
		for (const [cell, kind] of this.manualPlants) this.placePortedFeature(cell, kind);
		this.sacrificialFire = state.sacrificialFire ? Roguelike.Blob.fromJSON(state.sacrificialFire) : new Roguelike.Blob(this.level.width, this.level.height);
		this.sacrificialFireCharge = state.sacrificialFireCharge ?? 0;
		this.sacrificialFireCell = state.sacrificialFireCell ?? -1;
		this.sacrificialFirePrize = state.sacrificialFirePrize;
		for (const item of state.groundItems) this.spawnGroundItem(item.kind, item.x, item.y, item.item, item.chest);

		this.scheduler.clear();
		this.scheduler.now = state.schedulerNow;
		const restored: Creature[] = [];
		for (const saved of state.creatures) {
			const creature = this.spawnMonster(saved.kind, saved, true);
			Object.assign(creature, {
				hp: saved.hp, maxHp: saved.maxHp, accuracy: saved.accuracy, evasion: saved.evasion,
				damage: [...saved.damage] as [number, number], armor: [...saved.armor] as [number, number],
				buffs: Object.fromEntries(saved.buffs), sleeping: saved.sleeping, champion: saved.champion,
				championPower: saved.championPower, pumped: saved.pumped, combo: saved.combo, moving: saved.moving, arenaJumps: saved.arenaJumps,
				weaponLevel: saved.weaponLevel, stolen: saved.stolen, mimicLoot: saved.mimicLoot, generation: saved.generation,
				spawnCooldown: saved.spawnCooldown, seesHero: saved.seesHero,
				mimicRevealed: saved.mimicRevealed ?? Boolean(saved.stolen),
				hasteTurns: saved.hasteTurns, hasteBaseSpeed: saved.hasteBaseSpeed,
				hasRaged: saved.hasRaged, raged: saved.raged, chainUsed: saved.chainUsed,
				ventCooldown: saved.ventCooldown, webCooldown: saved.webCooldown,
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
		this.sacrificialFire = new Roguelike.Blob(this.level.width, this.level.height);
		this.sacrificialFireCharge = 0;
		this.sacrificialFireCell = -1;
		this.sacrificialFirePrize = undefined;
		this.ghoulsDowned = 0;
		this.kingAdds = new Set();
		this.cavesBossSealed = false;
		this.cavesBossEnergyTurns = 0;
		if (this.depth === 20) {
			this.kingPhases = new Roguelike.BossPhases([0.5]);
			this.kingCycle = new Roguelike.AbilityCycle({ summon: 10 });
		}
		if (this.depth === 25) this.yogPhases = new Roguelike.BossPhases([0.75, 0.5, 0.25]);

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
		const x = this.hero.x, y = this.hero.y;
		const cell = this.level.index(x, y);
		if (!this.level.passable(x, y) || this.isChasmCell(x, y) || this.portedFeatures.kindAt(cell) !== undefined) {
			this.say('This cell cannot grow a plant.', 'negative');
			return;
		}
		const sourceClass = (seed as typeof seed & { sourceClass?: string }).sourceClass;
		const kind = this.seedPlantKind(sourceClass);
		if (!kind) {
			this.say('The seed has no known plant effect.', 'negative');
			return;
		}
		this.bag.remove('seed', 1, seed.instanceId);
		this.manualPlants.set(cell, kind);
		this.placePortedFeature(cell, kind);
		this.say('You plant a ' + kind + ' seed.', 'positive');
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
			this.say('The abandoned mine is quiet.', 'warning');
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
	 * no type is fixed - the sites need level features this port has none of, so the odds and
	 * the once-per-run flag are real, the fetch target (any scroll) is the stand-in.
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
	 * Shopkeeper: Java's shops are fixed rooms on depths 6/11/16/21 - this port has no shop
	 * rooms, so the keeper simply stands on depth 6 once per run (stated simplification);
		 * prices are derived from the shared item-value table and scale by depth/tier; sold
		 * items remain in the same inventory as a buyback shelf.
	 */
	private maybeSpawnShopkeeper(): void {
		if (this.shopkeeperSpawned || this.depth !== 6) return;
		const at = this.standableCellIn(this.randomSpawnRoom());
		if (!at) return;
		this.spawnMonster('shopkeeper', at);
		this.shopkeeperSpawned = true;
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
		else this.interactWithGhost();
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
		//Ghost.Quest gives a generated weapon and armor set. These generic instances preserve
		//the real reward shape while avoiding a second, incomplete weapon table in this port.
		setGeneratorDepth(this.depth);
		const weaponReward = this.generatedInventoryItem(randomWeapon(Math.floor(this.depth / 5)));
		const armorReward = this.generatedInventoryItem(randomArmor(Math.floor(this.depth / 5)));
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

	/** Wandmaker turn-in: one scroll from the bag for a choice of two wands (Magic Missile's
	 * clean damage, or Frost's damage-plus-chill simplified to damage-plus-daze) */
	private interactWithWandmaker(): void {
		const status = this.quests.status('wandmaker');
		if (status === 'available') {
			this.quests.start('wandmaker');
			this.quests.advanceStage('wandmaker', this.gameState);
			this.say(t('port.npc.wandmaker.offer'));
			return;
		}
		if (status === 'complete') {
			this.say(t('port.npc.wandmaker.done'));
			return;
		}
		const scroll = this.bag.find('scroll') ?? this.bag.find('scrollIdentify') ?? this.bag.find('scrollUpgrade');
		if (!scroll) {
			this.say(t('port.npc.wandmaker.remind'));
			return;
		}
		this.bag.remove(scroll.id, 1);
		//WndWandmaker's choice, simplified to "frost or not" - missile stays clean damage,
		//frost trades nothing here but adds a 5-turn chill (daze) to every zap
		this.frostWand = this.heroClass === 'mage' ? false : true;
		this.bag.add({ id: 'wand', quantity: 1, stackable: true, identified: true });
		this.gameState.setSwitch('wandQuestDone', true);
		this.quests.advanceStage('wandmaker', this.gameState);
		this.say(
			this.frostWand
				? 'The wandmaker hands you a frost wand: your zaps now chill their target as well.'
				: 'The wandmaker tunes your staff: its zaps strike cleaner than before.'
		);
	}

	/** Shopkeeper: bump to hear prices, B/N to buy through mwg/actors' real buy(), V to sell food */
	private interactWithShopkeeper(): void {
		const potionPrice = this.shopPrice('potion');
		const identifyPrice = this.shopPrice('scrollIdentify');
		const foodPrice = this.shopSellPrice('food');
		this.say(
			`The shopkeeper grins: "Healing draughts, ${potionPrice} gold (B). Scrolls of identify, ${identifyPrice} (N). ` +
				`I buy food for ${foodPrice} (V). You carry ${this.heroStats.base('gold')} gold."`
		);
	}

	private shopPrice(id: 'potion' | 'scrollIdentify'): number {
		return getShopPrice(id === 'potion' ? 'potionHealing' : id, this.depth);
	}

	private shopSellPrice(id: 'food' | 'meat'): number {
		return getSellPrice(id === 'meat' ? 'food' : id, this.depth);
	}

	private shopBuy(id: 'potion' | 'scrollIdentify'): void {
		const price = this.shopPrice(id);
		const prices = new Map([[id, { buy: price, sell: 0 }]]);
		const potionName = id === 'potion' ? 'a healing draught' : 'a scroll of identify';
		if (Actors.buy(this.heroStats, this.shopStock, this.bag, id, 1, { currency: 'gold', prices })) {
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
		const sell = this.shopSellPrice(food.id as 'food' | 'meat');
		const prices = new Map([[food.id, { buy: this.shopPrice('potion'), sell }]]);
		if (Actors.sell(this.heroStats, this.shopStock, this.bag, food.id, 1, { currency: 'gold', prices })) {
			this.say(t('port.log.soldfood'), 'positive');
		}
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
						this.spawnGroundItem(this.groundKindForItem(item, 'food'), at.x, at.y, item, 'locked');
						goldenKeysToSpawn++;
					}
					break;
				}
				//The compact ground-item model has no separate skeleton heap sprite; a normal
				//chest preserves the item and pickup boundary for the remaining heap outcomes.
				this.spawnGroundItem(this.groundKindForItem(item, 'food'), at.x, at.y, item,
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
		if (generated.cat === Cat.GOLD) id = 'gold';
		else if (generated.cat === Cat.WEAPON || generated.cat === Cat.MISSILE) id = 'weaponReward';
		else if (generated.cat === Cat.STONE) id = 'stone';
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
		if (generated.cat === Cat.WEAPON) affix = this.rollGeneratedAffix(ENCHANT_TABLE, generated.cursed, generated.hasGoodEnchant);
		else if (generated.cat === Cat.ARMOR) affix = this.rollGeneratedAffix(GLYPH_TABLE, generated.cursed, generated.hasGoodEnchant);
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
	private rollGeneratedAffix(table: Actors.AffixTable, cursed: boolean, hasGoodEnchant: boolean): string | undefined {
		if (cursed) return Actors.rollAffix({ entries: table.entries.filter((e) => e.curse) })?.id;
		if (hasGoodEnchant) return Actors.rollAffix({ entries: table.entries.filter((e) => !e.curse) })?.id;
		return undefined;
	}

	private groundKindForItem(item: NonNullable<GroundItem['item']>, fallback: GroundItemKind): GroundItemKind {
		if (item.id === 'gold') return 'gold';
		if (item.id === 'seed') return 'seed';
		if (item.id === 'weaponReward') return 'armor'; // same existing equipment sprite path; payload retains weapon identity
		if (item.id === 'armorReward') return 'armor';
		if (item.id === 'cloak') return 'wand'; // artifact stand-in uses the existing cloak sprite path
		if (item.id === 'wand') return 'wand';
		if (item.id.startsWith('ring_')) return 'ring';
		if (item.id.startsWith('potion')) return 'potion';
		if (item.id.startsWith('scroll')) return 'scroll';
		return fallback;
	}

	/** Drops a generated statue object as a real inventory payload, using a neighbouring cell for
	 * the second object because this port's floor model permits one heap entry per cell. */
	private dropGeneratedStatueItem(generated: GenItem, x: number, y: number): void {
		const item = this.generatedInventoryItem(generated);
		const candidates = [{ x, y }, ...Roguelike.neighbourOffsets(8).map(([dx, dy]) => ({ x: x + dx, y: y + dy }))];
		const at = candidates.find((cell) => this.level.passable(cell.x, cell.y)
			&& !this.groundItemAt(cell.x, cell.y) && !this.creatureAt(cell.x, cell.y));
		if (!at) return;
		this.spawnGroundItem(this.groundKindForItem(item, 'armor'), at.x, at.y, item);
	}

	private spawnGroundItem(kind: GroundItemKind, x: number, y: number, item?: GroundItem['item'], chest?: 'normal' | 'locked' | 'crystal'): void {
		if (this.groundItemAt(x, y)) return; //one item per cell - this port's simplification of Java's stacking heaps

		const sprite = new TintedSprite(this.itemsSheet.get(ITEM_FRAME[kind]));
		sprite.x = x * TILE;
		sprite.y = y * TILE;
		this.itemLayer.addChild(sprite);
		const groundItem = { id: nextEntityId('item'), kind, x, y, item, chest };
		this.spriteFor.set(groundItem.id, sprite);
		this.groundItems.push(groundItem);
	}

	/** stepping onto a ground item's cell picks it up - `GameScene.pickUp` without a "leave it" choice, since there is no inventory UI to offer one through */
	private pickupGroundItemAt(x: number, y: number): void {
		const item = this.groundItemAt(x, y);
		if (!item) return;
		if (item.chest === 'crystal') {
			if (!this.bag.find('crystalKey')) {
				this.say('The crystal chest is locked.', 'negative');
				return;
			}
			this.bag.remove('crystalKey', 1);
			this.say('You unlock the crystal chest.', 'positive');
		}
		if (item.chest === 'locked') {
			if (!this.bag.find('goldenKey')) {
				this.say('The locked chest needs a golden key.', 'negative');
				return;
			}
			this.bag.remove('goldenKey', 1);
			this.say('You unlock the chest.', 'positive');
		}
		if (item.chest) item.chest = undefined;
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
				this.say('You have no usable hourglass for this sand.', 'negative');
				return;
			}
			hourglass.sandBags = Math.min(5, (hourglass.sandBags ?? hourglass.level ?? 0) + 1);
			hourglass.level = hourglass.sandBags;
			this.say(hourglass.sandBags >= 5 ? 'Your hourglass is filled with magical sand.' : 'You add the sand to your hourglass.', 'positive');
			return;
		}
		if (item.item) {
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
		if (this.heroClass === 'warrior') {
			const pts = this.talentRank('hearty_meal');
			if (this.hero.hp <= this.hero.maxHp * 0.25) heal += 1 + 2 * pts;
			else if (this.hero.hp <= this.hero.maxHp * 0.5) heal += 1 + pts;
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
		if (id === 'potion' || id === 'potionHealing') {
			//PotionOfHealing.heal(): `Buff.affect(ch, Healing.class).setHeal((int)(0.8*HT+14), 0.25, 0)`
			//- a gradual heal-over-time, not an instant full heal (see the applyBuffDamage tick
			//in spendHeroTurn). `setHeal` only replaces `healingLeft` if the new amount is bigger,
			//so quaffing a second potion mid-heal doesn't stack additively on top of the first.
			const amount = Math.round(0.8 * this.hero.maxHp + 14);
			if (amount > this.healingLeft) this.healingLeft = amount;
			for (const b of ['poison', 'burning', 'weakness', 'vulnerable', 'cripple'] as BuffId[]) delete this.hero.buffs[b];
			const willpower = this.talentRank('restored_willpower');
			if (willpower > 0) this.grantHeroShield(Math.round(this.hero.maxHp * (willpower === 1 ? 0.67 : 1)), this.hero.maxHp);
			if (this.talentRank('restored_agility') > 0) { this.healingEvasionTurns = 1; this.syncHeroFromStats(); }
			const nature = this.talentRank('restored_nature');
			if (nature > 0) for (const enemy of this.creatures.filter(c => !c.isHero && !c.isNPC && Roguelike.chebyshevDistance(this.hero, c) <= 1)) addBuff(enemy, 'roots');
			this.say(t('port.log.quaffhealing'), 'positive');
		} else if (id === 'potionStrength') {
			this.heroStr++;
			this.syncHeroFromStats();
			this.say(t('port.log.stronger', { str: this.heroStr }), 'positive');
		} else if (id === 'potionFlame') {
			const target = this.nearestVisibleEnemy(6);
			if (target) {
				target.hp -= 4;
				this.showDamage(target, 4);
				addBuff(target, 'burning');
				this.say(t('port.log.hurlflame', { target: target.name }));
				if (target.hp <= 0) this.kill(target);
			} else this.say(t('port.log.flaskwasted'), 'negative');
		} else if (id === 'potionMindVision') {
			//PotionOfMindVision.apply(): a 20-turn MindVision buff that reveals every monster's
			//position through walls/fog, not a trap/secret reveal - this port previously
			//confused it with something closer to Scroll of Magic Mapping (which really does
			//reveal traps). See `this.sprite(creature).visible`'s gate for the actual reveal.
			addBuff(this.hero, 'mindvision');
			this.say(t(this.creatures.some((c) => !c.isHero && !c.isNPC) ? 'port.log.mindvisionmobs' : 'port.log.mindvisionnone'), 'positive');
		} else if (id === 'potionInvis') {
			//PotionOfInvisibility.apply()/Invisibility.attachTo(): grants the buff and nothing
			//else - it does not put monsters to sleep. This port previously force-slept every
			//monster on the floor here, a much stronger and incorrect effect layered on top of
			//the actually-correct, already-ported invisibility AI gating elsewhere
			//(`monster.seesHero`'s `!hero.buffs['invisibility']` check and `takeMonsterTurn`'s
			//`distance > 1` skip already reproduce Java's real "distant monsters lose track,
			//adjacent ones keep fighting" behavior on their own).
			addBuff(this.hero, 'invisibility');
			if (this.subclass() === 'freerunner' && this.talentRank('speedy_stealth') > 0) this.hero.buffs['invisibility'] = 20 + 5 * this.talentRank('speedy_stealth');
			this.say(t('port.log.invisible'), 'positive');
		} else if (id === 'potionExperience') {
			//PotionOfExperience.apply(): `hero.earnExp(hero.maxExp())` - grants exactly the XP
			//needed to complete the current level, evaluated before the level-up itself raises
			//the requirement (so always exactly one level's worth, never a partial one).
			const maxExp = SPD_LEVEL_CURVE.experienceFor(this.progression.level + 1) - SPD_LEVEL_CURVE.experienceFor(this.progression.level);
			this.grantExperience(maxExp);
			this.say(t('port.log.quaffexperience'), 'positive');
		} else if (id === 'potionLevitation') {
			//PotionOfLevitation.apply(): grants Levitation.DURATION (20 turns, already this
			//port's BUFF_DURATION.levitation) and nothing else - no blast, no identification
			//side effect beyond the buff itself. Levitation.attachTo() also clears Roots the
			//instant it lands (flight lifts you clear of whatever rooted you); this port's
			//`cripple`/`roots` are separate buffs, so only `roots` needs clearing here.
			addBuff(this.hero, 'levitation');
			delete this.hero.buffs['roots'];
			this.say(t('port.log.levitate'), 'positive');
		} else {
			//PotionOfPurity.apply() itself only clears poison/burning ('potionPurity' - Java's
			//`GasCloud`/`Fire` extinguish). Java's Frost/Haste/ToxicGas/ParalyticGas potions
			//('potionFrost'/'potionHaste'/'potionToxicGas'/'potionParalyticGas', all in the real
			//Generator pool per `spdItems/generator.ts`) still land here too and get this same
			//Purity-shaped effect - not their own, and not merely "unported" as previously implied:
			//each needs a system this port doesn't have yet (a freeze/immobilize status, a hero
			//speed buff, and a "blob that applies a status to whoever stands in it" consequence
			//for the two gas potions) before it can have its real effect. See `PORT_COVERAGE.md`.
			for (const b of ['poison', 'burning'] as BuffId[]) delete this.hero.buffs[b];
			this.say(t('port.log.purity'), 'positive');
		}
		return true;
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
		this.bag.remove(id, 1, this.requestedItemInstanceId);
		if (id === 'scrollIdentify') {
			if (unidentified) {
				Actors.identify(unidentified);
				const heal = this.heroClass === 'warrior' ? this.talentRank('test_subject') : 0;
				const charge = this.heroClass === 'mage' ? this.talentRank('tested_hypothesis') : 0;
				if (heal > 0) { this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + heal + 1); this.showHeal(this.hero, heal + 1); }
				if (charge > 0) this.wandCharges.refund(charge + 1);
				const visionRadius = arcaneVisionRadius(this.heroClass, this.talentRank('arcane_vision'));
				if (visionRadius > 0) {
					for (let y = Math.max(0, this.hero.y - visionRadius); y <= Math.min(this.level.height - 1, this.hero.y + visionRadius); y++)
						for (let x = Math.max(0, this.hero.x - visionRadius); x <= Math.min(this.level.width - 1, this.hero.x + visionRadius); x++)
							if (Roguelike.chebyshevDistance(this.hero, { x, y }) <= visionRadius && this.secrets.isSecret(x, y)) this.secrets.discover(x, y);
					this.restitchAllTiles();
				}
				this.say(t('port.log.identify', { item: this.itemDisplayName(unidentified.id, true) }), 'positive');
			} else this.say(t('port.log.nothingunidentified'), 'negative');
		} else if (id === 'scrollRage') {
			//ScrollOfRage.doRead(): every mob on the level (not just visible ones) is beckoned
			//toward the reader's position - reusing the same `seesHero` target-acquisition stand-in
			//the Annoying weapon curse already uses for its own beckon effect, previously missing
			//here (mobs only woke in place instead of actually turning to approach). Visible,
			//non-ally mobs additionally get 5 turns of `Amok` (attack anything nearby, allies
			//included) in real Java - not modeled, since this port has no monster-vs-monster
			//combat at all for an Amok'd mob to express itself through.
			for (const c of this.creatures) if (!c.isHero && !c.isNPC) { c.sleeping = false; c.seesHero = true; }
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
			//This port has no ally-vs-monster combat at all - every monster AI decision here
			//hardcodes the hero as its only possible target, so a spawned decoy would never
			//actually get attacked or fight back; a full port needs that whole capability first
			//(tracked in ROADMAP.md, not attempted here). The previous "grants a 10-turn Bless"
			//behavior wasn't a simplification of that effect, it was simply unrelated to it - a
			//stray leftover, not a stand-in anyone chose deliberately. Replaced with a shield
			//sized as a rough stand-in for "two extra bodies soak some hits for you", the closest
			//real system this port has to the actual effect's practical benefit.
			this.grantHeroShield(Math.round(this.hero.maxHp * 0.15), this.hero.maxHp);
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
			//it correctly), but so does anything unread: `ScrollOfTransmutation` is also in the
			//real Generator pool (`spdItems/generator.ts`) and has no branch here, so it still
			//falls through to Remove Curse's effect instead of its own - not merely inert, an
			//active (if narrow) misbehavior, same as the equivalent unported potions above. It
			//needs a whole item-transmutation system (`usableOnItem`/`changeItem`'s per-category
			//reroll rules, plus a generic item-picker UI this port doesn't have - every other
			//"pick one item" scroll here auto-targets instead) - see `PORT_COVERAGE.md`.
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
	 * Weapon.upgrade: +1 level (min/1, max/+2 at tier 1), 1-in-3 decurse ignored (no cursed
	 * gear exists to clear), enchant-type odds not rolled - the level is the whole effect,
	 * stated. Weapon first to +3, then armor (same cap as found armor).
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
			this.armorTier++;
			this.armorLevel = 0;
			this.syncHeroFromStats();
			this.say(t('port.log.armorupgraded', { tier: this.armorTier }), 'positive');
		} else {
			this.say(t('port.log.cannotupgrade'), 'negative');
			return false;
		}
		return true;
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
	 * the real Generator defaults/substream and its concrete class is retained in the payload;
	 * seed use/growth remains a separate unported item interaction, so the live inventory still
	 * presents that payload through the current food-family stand-in.
	 */
	private trampleHighGrass(x: number, y: number): void {
		if (this.level.get(x, y) !== HIGH_GRASS) return;

		this.level.set(x, y, GRASS);
		if (this.heroClass === 'huntress' && this.talentRank('natures_aid') > 0) this.grantHeroShield(Random.int(0, 3), 2);
		this.restitchTilesAround(x, y);
		this.featuresMap?.setLayerData('features', this.featureFrames());

		const seedDropped = Random.chance(1 / 25);
		if (seedDropped) {
			const seed = randomUsingDefaults(Cat.SEED);
				this.spawnGroundItem('seed', x, y, this.sourceInventoryItem('seed', seed.cls));
		}
		const dewChance = naturesBountyDewChance(this.heroClass, this.talentRank('natures_bounty'));
		if (Random.chance(dewChance)) this.spawnGroundItem('dewdrop', x, y);
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
		this.portedMobSpawns = floor.mobs.filter((mob) => {
			if (mob.kind === 'sacrificialFire') {
				this.sacrificialFireCell = this.level.index(mob.x, mob.y);
				this.sacrificialFireCharge = 6 + this.depth * 4;
				this.sacrificialFire.seed(mob.x, mob.y, this.sacrificialFireCharge);
				const [family, sourceClass] = (mob.loot ?? 'weapon').split('|', 2);
				this.sacrificialFirePrize = this.sourceInventoryItem(family, sourceClass);
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
			const kind = this.portItemKind(item.kind);
			const remainsGold = item.note?.match(/^remains:gold:(\d+)$/);
			const fixedGold = item.note?.match(/(?:^|,)qty:(\d+)/);
			const chest = item.note?.includes('crystalChest') ? 'crystal' : item.note?.includes('chest') ? 'normal' : undefined;
			const payload = remainsGold || fixedGold
				? { id: 'gold', quantity: Number((remainsGold ?? fixedGold)![1]), stackable: true, identified: true }
				: this.sourceInventoryItem(item.kind, item.sourceClass);
			if (kind && !this.groundItemAt(item.x, item.y)) this.spawnGroundItem(kind, item.x, item.y, payload, chest);
		}
		// Java's RegularLevel places Level.itemsToSpawn after ordinary room drops using a valid
		// StandardRoom cell. The generator bridge preserves the queue; consume it here so crystal
		// keys and room keys are playable instead of silently disappearing.
		for (const queued of floor.queuedItems) this.placeQueuedPortedItem(queued, floor.rooms);
		this.placePendingBones(floor.rooms);
	}

	private placeQueuedPortedItem(sourceId: string, rooms: { left: number; top: number; right: number; bottom: number }[], payload?: GroundItem['item']): boolean {
		const kind = this.portItemKind(sourceId);
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
		this.spawnGroundItem(kind, at.x, at.y, payload ?? this.sourceInventoryItem(sourceId));
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
			const kind = this.portItemKind(item.id);
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
			this.spawnMonster(mob.kind as AnyMonsterId, { x: mob.x, y: mob.y }, false, mob.loot);
		}
		this.portedMobSpawns = [];
		this.portedMobCells.clear();
	}

	/** Converts a Painter's concrete Java class name into the same payload used by live drops. */
	private sourceInventoryItem(id: string, sourceClass?: string): GroundItem['item'] {
		if (id === 'crystalKey' || id === 'ironKey' || id === 'goldenKey') return { id, quantity: 1, identified: true };
		if (id.toLowerCase().includes('sandbag')) return { id: 'sandBag', quantity: 1, identified: true };
		if (id.toLowerCase().includes('timekeepershourglass')) return { id: 'hourglass', quantity: 1, identified: false, sandBags: 0, instanceId: this.newItemInstanceId('hourglass'), sourceClass };
		if (id.split('|', 1)[0]!.toLowerCase() === 'artifact') return { id: 'cloak', quantity: 1, identified: false, instanceId: this.newItemInstanceId('artifact'), sourceClass };
		if (id.toLowerCase() === 'seed') return { id: 'seed', quantity: 1, identified: true, sourceClass };
		const concrete = sourceClass ?? id;
		const lower = concrete.toLowerCase();
		if (lower.includes('gold')) return { id: 'gold', quantity: 1, identified: true, sourceClass: concrete };
		//same short-id rename `generatedInventoryItem` needs for these two (see its comment)
		if (lower.includes('potion')) return { id: concrete === 'PotionOfLiquidFlame' ? 'potionFlame' : concrete === 'PotionOfInvisibility' ? 'potionInvis' : concrete.replace(/^PotionOf/, 'potion'), quantity: 1, identified: false, sourceClass: concrete };
		//same short-id rename `generatedInventoryItem` needs for these three (see its comment)
		if (lower.includes('scroll')) return { id: concrete === 'ScrollOfMirrorImage' ? 'scrollMirror' : concrete === 'ScrollOfMagicMapping' ? 'scrollMapping' : concrete === 'ScrollOfRemoveCurse' ? 'scrollCleanse' : concrete.replace(/^ScrollOf/, 'scroll'), quantity: 1, identified: false, sourceClass: concrete };
		if (lower.includes('ring')) return { id: `ring_${concrete.replace(/^RingOf/, '').replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`).replace(/^_/, '')}`, quantity: 1, identified: false, instanceId: this.newItemInstanceId('ring'), sourceClass: concrete };
		if (lower.includes('timekeepershourglass')) return { id: 'hourglass', quantity: 1, identified: false, sandBags: 0, instanceId: this.newItemInstanceId('hourglass'), sourceClass: concrete };
		if (lower.includes('artifact')) return { id: 'cloak', quantity: 1, identified: false, instanceId: this.newItemInstanceId('artifact'), sourceClass: concrete };
		if (lower.includes('wand')) return { id: 'wand', quantity: 1, identified: false, instanceId: this.newItemInstanceId('wand'), sourceClass: concrete };
		if (lower.includes('stone')) return { id: 'stone', quantity: 1, identified: false, sourceClass: concrete };
		if (lower.includes('seed') || lower.includes('starflower')) return { id: 'seed', quantity: 1, identified: true, sourceClass: concrete };
		if (lower.includes('armor')) return { id: 'armorReward', quantity: 1, identified: false, instanceId: this.newItemInstanceId('armor'), sourceClass: concrete };
		if (lower.includes('weapon')) return { id: 'weaponReward', quantity: 1, identified: false, instanceId: this.newItemInstanceId('weapon'), sourceClass: concrete };
		if (id === 'armor') return { id: 'armorReward', quantity: 1, identified: false, instanceId: this.newItemInstanceId('armor'), sourceClass: concrete };
		if (id === 'weapon') return { id: 'weaponReward', quantity: 1, identified: false, instanceId: this.newItemInstanceId('weapon'), sourceClass: concrete };
		if (id === 'missile' || id === 'stone') return { id: 'stone', quantity: 1, identified: true, sourceClass: concrete };
		if (id === 'food') return { id: 'food', quantity: 1, identified: false, sourceClass: concrete };
		if (id === 'potion') return { id: 'potion', quantity: 1, identified: false, sourceClass: concrete };
		if (id === 'scroll') return { id: 'scroll', quantity: 1, identified: false, sourceClass: concrete };
		if (id === 'ring') return { id: `ring_garnet`, quantity: 1, identified: false, instanceId: this.newItemInstanceId('ring'), sourceClass: concrete };
		if (id === 'wand') return { id: 'wand', quantity: 1, identified: false, instanceId: this.newItemInstanceId('wand'), sourceClass: concrete };
		if (id === 'runestone') return { id: 'stone', quantity: 1, identified: false, sourceClass: concrete };
		return undefined;
	}

	/** Converts Painter's concrete Java item ids to the playable ground-item families. */
	private portItemKind(id: string): GroundItemKind | null {
		if (id === 'crystalKey') return 'crystalKey';
		if (id.toLowerCase().includes('sandbag')) return 'food';
		if (id === 'ironKey') return 'ironKey';
		if (id === 'goldenKey') return 'goldenKey';
		if (id === 'seed') return 'seed';
		const lower = id.toLowerCase();
		//Direct room drops do not carry an Item-category suffix (Gold, StoneOfEnchantment,
		//MysteryMeat, Dewdrop, Amulet, and the mining/quest currencies), so handle them before
		//the broader Generator-style category checks below.
		if (lower.includes('dewdrop')) return 'dewdrop';
		if (lower.includes('energycrystal')) return 'stone';
		if (lower.includes('alchemypage') || lower.includes('guidebook')) return 'scroll';
		if (lower.includes('honeypot')) return 'food';
		if (lower.includes('runestone')) return 'stone';
		if (lower.includes('stone')) return 'stone';
		if (lower.includes('meat')) return 'meat';
		if (lower.includes('amulet')) return 'amulet';
		if (lower.includes('dwarftoken')) return 'dwarfToken';
		if (lower.includes('darkgold')) return 'darkGold';
		if (lower.includes('potion')) return 'potion';
		if (lower.includes('scroll')) return 'scroll';
		if (lower.includes('artifact')) return 'wand';
		if (lower.includes('ring')) return 'ring';
		if (lower.includes('wand')) return 'wand';
		if (lower.includes('armor') || lower.includes('weapon')) return 'armor';
		if (lower.includes('gold')) return 'gold';
		if (lower.includes('food') || lower.includes('ration')) return 'food';
		return null;
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
			if (this.fire.volumeAt(creature.x, creature.y) >= 1 && !creature.buffs['burning']) addBuff(creature, 'burning');
		}
		this.spreadSacrificialFire();
		this.spreadPlantBlobs();
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
		const kind = this.groundKindForItem(this.sacrificialFirePrize, 'armor');
		this.spawnGroundItem(kind, cell.x, cell.y, this.sacrificialFirePrize);
		this.say('The sacrificial fire grants its reward.', 'positive');
		this.sacrificialFirePrize = undefined;
		this.sacrificialFireCharge = 0;
		this.sacrificialFire = new Roguelike.Blob(this.level.width, this.level.height);
	}

	/** Applies the Java plant blobs to every actor standing in an active cell. */
	private spreadPlantBlobs(): void {
		this.plantGas.spread((x, y) => this.level.passable(x, y), 0.25, 0.9);
		this.plantFreeze.spread((x, y) => this.level.passable(x, y), 0.25, 0.9);
		for (const cell of this.plantGas.cellsAbove(1)) {
			const target = this.creatureAt(cell.x, cell.y);
			if (target) addBuff(target, 'poison');
		}
		for (const cell of this.plantFreeze.cellsAbove(0.5)) {
			const target = this.creatureAt(cell.x, cell.y);
			if (target) addBuff(target, 'paralysis');
		}
	}

	private searchForSecrets(): void {
		const radius = 1 + this.talentRank('wide_search');
		const offsets: [number, number][] = [];
		for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
			if (dx !== 0 || dy !== 0) offsets.push([dx, dy]);
		}
		for (const [dx, dy] of offsets) {
			const x = this.hero.x + dx;
			const y = this.hero.y + dy;
			if (!this.secrets.isSecret(x, y)) continue;
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
			return;
		}
		this.say(t('port.log.foundnothing'), 'negative');
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
			addBuff(this.hero, 'poison');
			this.hero.buffs['poison'] = 3;
			// ToxicTrap seeds a spreading gas blob rather than affecting only the trigger cell.
			this.plantGas.seed(x, y, 300 + 20 * this.depth);
			this.say(t('port.log.trap.toxic'), 'negative');
		} else if (kind === 'burning') {
			let damage = Random.int(2, 5);
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
			let damage = Math.max(0, Random.normalRange(5 + this.depth, 10 + 2 * this.depth));
			if (dx !== 0 || dy !== 0) damage = Math.round(damage * 0.67);
			damage = Math.max(0, damage - Random.normalRange(target.armor[0], target.armor[1]));
			target.hp -= damage;
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
		if (special.kind === 'zap' && !this.wandCharges.canAfford(1)) {
			this.say(t('port.log.staffempty'), 'negative');
			return false;
		}

		const range = farsightRange(this.subclass(), this.talentRank('farsight'));
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
			let missileSurvived = true;
			if (carried) {
				const baseUses = this.heroClass === 'duelist' ? 10 : 5;
				const uses = baseUses * (1 + 0.25 * this.talentRank('durable_projectiles'));
				this.ammoDurability -= 100 / Math.max(1, Math.round(uses));
				if (this.ammoDurability <= 0) {
					this.ammo--;
					this.ammoDurability = this.ammo > 0 ? 100 : 0;
					missileSurvived = false;
				}
			} else {
				this.bag.remove('stone', 1);
			}
			//rolls to hit exactly like a melee swing (SPD's MissileWeapon shares Weapon's
			//accuracy machinery) - only the damage range and the range itself differ; the
			//MissileWeapon.rangedHit drops a surviving non-sticky missile at the target;
			//pickup later merges it back into the carried stack.
			if (missileSurvived) this.spawnGroundItem('stone', target.x, target.y);
			if (this.heroClass === 'huntress' && this.talentRank('followup_strike') > 0) { this.followupTarget = target; this.followupDamage = this.talentRank('followup_strike') === 1 ? 2 : 3; }
			this.attack({ ...this.hero, kind: undefined, damage: special.damage }, target);
		} else if (special.kind === 'zap') {
			const fullyCharged = this.wandCharges.current === this.wandCharges.max;
			const lastCharge = this.wandCharges.current === 1;
			this.wandCharges.spend(1);
			const preservation = preservationChance(this.talentRank('wand_preservation'));
			if (preservation > 0 && Random.chance(preservation)) this.wandCharges.refund(1);
			if (lastCharge && this.talentRank('backup_barrier') > 0) this.grantHeroShield(this.talentRank('backup_barrier') === 1 ? 3 : 5, this.hero.maxHp);
			//GreatCrab.damage negates wand bolts from a seen hero - kept verbatim
			if (target.kind === 'greatCrab' && !target.sleeping) {
				this.say(t('port.log.crabparries'), 'negative');
			} else {
				//WandOfMagicMissile.onZap calls ch.damage() directly in Java - never a hit
				//roll; min/max grow with upgrades (2+lvl / 8+2*lvl), frost adds a chill
				const damage = Random.normalRange(2 + this.weaponLevel, 8 + 2 * this.weaponLevel) + (this.subclass() === 'warlock' ? 2 : 0) + enragedCatalystBonus(this.subclass(), this.talentRank('enraged_catalyst'), this.hero.hp, this.hero.maxHp) + this.wandBonusDamage;
				this.wandBonusDamage = 0;
				target.hp -= damage;
				this.showDamage(target, damage);
				target.sleeping = false;
				if (this.frostWand) addBuff(target, 'daze');
				this.sprite(target).setColorAdd(0.6, 0.7, 1);
				this.say(t('port.log.wandhits', { target: target.name, damage }), 'positive');
				if (this.subclass() === 'warlock') this.wandCharges.refund(1);
				if (fullyCharged && this.talentRank('excess_charge') > 0) this.grantHeroShield(Math.ceil((this.talentRank('excess_charge') * Math.max(1, this.weaponLevel)) / 1.5), this.hero.maxHp);
				if (target.hp <= 0) this.kill(target);
			}
		} else {
			//SpiritBow.damageRoll: a normal hit roll, but the base damage is scaled by
			//distance (min(3, 1.2 * 1.125^(distance-1))) before armor is subtracted
			if (!rollHit(this.hero, target)) {
				this.say(t('port.log.arrowmisses', { target: target.name }), 'negative');
			} else {
				const distance = Roguelike.chebyshevDistance(this.hero, target);
				const multiplier = Math.min(3, 1.2 * Math.pow(1.125, distance - 1));
				const base = Random.normalRange(special.damage[0], special.damage[1]);
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
				if (target.hp <= 0) this.kill(target);
			}
		}

		if (this.talentRank('aggressive_barrier') > 0 && this.hero.hp <= this.hero.maxHp * (this.talentRank('aggressive_barrier') === 1 ? 0.4 : 0.6)) this.grantHeroShield(3, this.hero.maxHp);
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
		if ((this.subclassChoiceOpen || this.armorChoiceOpen) && action !== 'talents') {
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
	 * fractional turns for attack-speed modifiers (Swiftness enchant, Weapon.Augment SPEED).
	 */
	private spendHeroTurn(turnCost: number = 1): void {
		finishHeroTurn({
			isAlive: () => this.hero.hp > 0,
			advanceClock: () => { this.clock.advance(turnCost); this.kineticStored = Math.floor(this.kineticStored * 0.75); },
			advanceHunger: () => this.hungerStep(),
			// Recharging's Java Charger contribution is an additional recharge tick while the
			// 30-second flavour buff is active; Charges.advance() is this port's tick primitive.
			recoverWandCharge: () => {
				const missing = this.wandCharges.max - this.wandCharges.current;
				const turnsToCharge = 10 + 40 * Math.pow(0.875, Math.max(0, missing));
				//RingOfEnergy.wandChargeMultiplier(): 1.175^level, applied straight onto the rate.
				this.wandCharges.advance((this.hero.buffs['recharging'] ? 1.25 : 1) * this.ringEnergyMultiplier() / turnsToCharge);
			},
			recoverTomeCharge: () => { this.tomeCharges.advance(1); },
			spreadFire: () => this.spreadFire(),
			applyBuffDamage: () => {
				//Barrier.act(): partialLostShield += min(1, shielding/20), then absorbDamage(1)
				//and a hard reset to 0 (not a carried remainder, unlike Hunger's partialDamage)
				//once it reaches 1 - bigger shields decay faster, and this now actually runs;
				//previously heroBarrier.advance()/this decay was never called at all, so shields
				//held indefinitely once granted (documented "Not ported" gap, now closed).
				if (this.heroBarrier.total > 0) {
					this.barrierPartialLoss += Math.min(1, this.heroBarrier.total / 20);
					if (this.barrierPartialLoss >= 1) {
						this.heroBarrier.absorb(1);
						this.barrierPartialLoss = 0;
					}
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
				const dot = tickBuffs(this.hero);
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
		const plan = planMovement({ x: this.hero.x, y: this.hero.y }, move, {
			occupantAt: (target) => {
				occupant = this.creatureAt(target.x, target.y);
				return occupant ? (occupant.isNPC ? 'npc' : 'enemy') : null;
			},
			closedDoorAt: (target) => this.doors.isDoor(target.x, target.y) && !this.doors.isOpen(target.x, target.y),
			isRooted: () => !!this.hero.buffs['roots'],
			passable: (target) => this.level.passable(target.x, target.y) || this.isChasmCell(target.x, target.y),
		});
		if (plan.kind === 'wait') {
			if (this.talentRank('patient_strike') > 0) this.patientStrikeReady = true;
			this.say(t('port.log.wait'));
			return;
		}
		const { target } = plan;
		// Interaction plans only arise from the synchronous occupant query above.
		if (plan.kind === 'interact') this.interactWithNPC(occupant!);
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
			for (const item of this.bag.items) Actors.identify(item);
			for (let yy = 0; yy < this.level.height; yy++) for (let xx = 0; xx < this.level.width; xx++) {
				if (this.secrets.isSecret(xx, yy)) this.secrets.discover(xx, yy);
			}
			this.say('The well reveals the secrets around you.', 'positive');
		} else {
			this.hero.hp = this.hero.maxHp;
			for (const buff of ['poison', 'burning', 'weakness', 'vulnerable', 'cripple', 'roots'] as BuffId[]) delete this.hero.buffs[buff];
			this.hunger = Math.max(this.hunger, 300);
			this.say('The well restores your health.', 'positive');
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
				this.spawnGroundItem('seed', at.x, at.y, this.sourceInventoryItem('seed', seed.cls));
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
				this.say('The sungrass begins restoring your health.', 'positive');
				break;
			case 'blandfruit':
			case 'blandfruitbush':
				this.spawnGroundItem('food', x, y);
				this.say('The plant drops a nourishing fruit.', 'positive');
				break;
			case 'starflower':
				addBuff(this.hero, 'bless');
				if (this.subclass() === 'warden') addBuff(this.hero, 'recharging');
				this.say('The starflower fills you with confidence.', 'positive');
				break;
			case 'dewcatcher':
				this.dropPlantNeighbourLoot(x, y, 3, 6, 'dew');
				this.say('The dewcatcher releases dew.', 'positive');
				break;
			case 'seedpod':
				this.dropPlantNeighbourLoot(x, y, 2, 4, 'seed');
				this.say('The seedpod bursts open.', 'positive');
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
				this.say('The fadeleaf carries you elsewhere.', 'positive');
				break;
			}
			case 'mageroyal':
				for (const buff of ['poison', 'burning', 'weakness', 'vulnerable', 'cripple', 'daze'] as BuffId[]) delete this.hero.buffs[buff];
				this.say('The mageroyal clears your afflictions.', 'positive');
				break;
			case 'icecap':
				this.plantFreeze.seed(x, y, 2);
				if (this.subclass() === 'warden') {
					addBuff(this.hero, 'frostImbue');
					this.say('The icecap imbues your attacks with frost.', 'positive');
				} else {
					addBuff(this.hero, 'paralysis');
					this.say('The icecap freezes you in place.', 'negative');
				}
				break;
			case 'rotberry':
				if (this.subclass() === 'warden') {
					addBuff(this.hero, 'adrenalineSurge');
					this.syncHeroFromStats();
					this.say('The rotberry fills you with adrenaline.', 'positive');
				} else {
					this.plantGas.seed(x, y, 100);
					addBuff(this.hero, 'poison');
					this.say('The rotberry releases toxic gas.', 'negative');
				}
				break;
			case 'sorrowmoss':
				addBuff(this.hero, 'poison');
				this.hero.buffs.poison = 5 + Math.round(2 * this.depth / 3);
				this.say('The sorrowmoss poisons you.', 'negative');
				break;
			case 'firebloom':
				// Firebloom seeds Java's Fire blob at its cell. Warden FireImbue has no
				// matching attack-status subsystem yet, but the area consequence is live.
				this.fire.seed(x, y, 2);
				this.say('The firebloom ignites the ground.', 'negative');
				break;
			case 'stormvine':
				if (this.subclass() === 'warden') addBuff(this.hero, 'levitation');
				else addBuff(this.hero, 'daze');
				this.say('The stormvine twists your senses.', 'negative');
				break;
			case 'swiftthistle':
				// Swiftthistle.TimeBubble freezes other actors for seven hero-time units.
				// Count those units at the automatic-actor boundary instead of granting a
				// free hero action, which would incorrectly skip hunger and buffs.
				this.timeBubbleTurns = 7;
				this.say('Time bends around the swiftthistle.', 'positive');
				break;
			default:
				this.say('The plant withers beneath your step.');
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
		this.say('You fall through the chasm.', 'negative');
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
	 * One monster's turn. Sleeping mobs (Mob.SLEEPING) stay put until the hero gets close -
	 * wake radius 6 (3 with the Rogue's cloak, the stealth stand-in; Java rolls distance +
	 * stealth each turn) - or until something hits them. Ranged attackers (DM-100's lightning,
	 * Shaman's bolt, Necromancer's 2-10 bolt, Tengu's darts, Trickster's missiles) fire
	 * through `canTarget` when line-of-sight allows instead of pathing into melee; everyone
	 * else hunts through `decideMonsterAI`.
	 */
	private takeMonsterTurn(monster: Creature): void {
		if (monster.isNPC) return;
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
		monsterFov.update(monster.x, monster.y, VIEW_RADIUS);
		monster.seesHero = monsterFov.isVisible(this.hero.x, this.hero.y) && !this.hero.buffs['invisibility'];
		//ChampionEnemy.Growing.act(): its own real per-turn tick, `+0.01` to the multiplier
		//`meleeDamageFactor`/`damageTakenFactor`/`evasionAndAccuracyFactor` all read from
		//(real Java spends its own separate `4*TICK` actor slot for this; this port folds it
		//into the monster's ordinary turn instead, since it has no secondary-actor scheduling).
		if (monster.champion === 'growing') monster.championPower = (monster.championPower ?? 1.19) + 0.01;
		//dots tick on the sufferer's own turn, like Java's Buff.act()
		const dot = tickBuffs(monster);
		if (dot > 0) {
			monster.hp -= dot;
			this.showDamage(monster, dot);
			if (monster.hp <= 0) {
				this.kill(monster);
				return;
			}
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
		if (monster.buffs['paralysis']) return;
		//DemonSpawner: PASSIVE, IMMOVABLE, never attacks - only its spawn-cooldown ticks, and
		//unlike every other monster here that happens regardless of hero distance/sleep state.
		if (monster.kind === 'demonSpawner') {
			this.tickDemonSpawner(monster);
			return;
		}

		const distance = Math.max(Math.abs(monster.x - this.hero.x), Math.abs(monster.y - this.hero.y));
		if (this.heroClass === 'huntress' && this.talentRank('heightened_senses') > 0 && distance <= (this.talentRank('heightened_senses') === 1 ? 2 : 3)) monster.seesHero = true;
		// Invisibility makes monsters lose their target until the hero attacks or the
		// effect expires. Adjacent monsters retain current awareness, which is the
		// useful Char.canInteract behaviour without a separate target-memory system.
		if (this.hero.buffs['invisibility'] && distance > 1) return;
		if (monster.sleeping) {
			const silent = this.heroClass === 'rogue' ? this.talentRank('silent_steps') : 0;
			const wakeRadius = silent >= 2 ? 2 : silent === 1 ? 3 : this.heroClass === 'rogue' ? 3 : 6;
			if (distance > wakeRadius) return;
			monster.sleeping = false;
			this.say(t('port.log.wakes', { who: capitalize(monster.name) }), 'warning');
		}
		//ScrollOfTerror.doRead()/Terror.java: real Java's Terror stops the mob attacking the
		//specific reader while otherwise letting it act freely (attack allies, flee toward
		//other exits) - this port's monster-turn model has no per-object avoidance and no
		//monster-vs-ally combat for that distinction to matter against, so it approximates the
		//practical single-hero effect as an always-flee override on the same
		//`decideMonsterAI`/`fleeBelow` mechanism `Thief.FLEEING` already uses, skipping every
		//attack branch below entirely for the turn.
		if (monster.buffs['terror']) {
			const blocked = new Set(
				this.creatures.filter((c) => c !== monster && c !== this.hero).map((c) => this.level.index(c.x, c.y))
			);
			const decision = Roguelike.decideMonsterAI(this.level, this.pathfinder, monster, monster.hp / monster.maxHp, this.hero, { sightRadius: VIEW_RADIUS, fleeBelow: 1, blocked });
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

		if (distance === 1) {
			if (monster.kind === 'crystalMimic') {
				this.revealCrystalMimic(monster);
				this.crystalMimicSteal(monster);
				this.attack(monster, this.hero);
				if (monster.hp > 0) this.fleeCrystalMimic(monster);
				return;
			}
			if (monster.kind === 'goo') this.takeGooTurn(monster);
			else if (monster.kind === 'dm300') this.takeDM300Turn(monster);
			else if (monster.kind === 'king') this.takeKingTurn(monster);
			else if (monster.kind === 'necromancer') this.zapHero(monster, [2, 10]);
			else if (monster.kind === 'gnollTrickster') this.stepAway(monster);
			//Thief.FLEEING never attacks - it runs (same stepper as the Trickster's retreat)
			else if (monster.kind === 'thief' && monster.stolen) this.stepAway(monster);
			//Scorpio refuses adjacent kills - it backs off to keep its range (getFurther)
			else if (monster.kind === 'scorpio') this.stepAway(monster);
			else this.attack(monster, this.hero);
			return;
		}

		//DM100.canAttack/doAttack: lightning bolt (Normal(3,10)) over MAGIC_BOLT ballistics when
		//not adjacent - no blast exists in this SPD revision (that is DM200/DM201 territory)
		if (monster.kind === 'dm100' && Roguelike.canTarget(this.level, monster, this.hero, { range: 6 })) {
			this.zapHero(monster, [3, 10]);
			return;
		}
		//Shaman: melee 5-10 adjacent, zap Normal(6,15) at range over MAGIC_BOLT
		if (monster.kind === 'shaman' && Roguelike.canTarget(this.level, monster, this.hero, { range: 6 })) {
			this.zapHero(monster, [6, 15]);
			return;
		}
		//Necromancer: summons while it has none and the hero is close (spend first summon is
		//one turn here, two in Java - stated), otherwise bolts (blocker-damage branch: the
		//push-aside needs a full knockback system, so adjacency bolts too)
		if (monster.kind === 'necromancer') {
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
					return;
				}
				if (!skel.hasteTurns) {
					skel.hasteBaseSpeed = skel.speed ?? 1;
					skel.speed = skel.hasteBaseSpeed * 2;
					skel.hasteTurns = 3;
					this.say(t('port.log.necroadrenaline'), 'warning');
					return;
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
					return;
				}
			}
			if ((!skel || skel.hp <= 0) && distance <= 4) {
				this.summonSkeleton(monster);
				return;
			}
			if (Roguelike.canTarget(this.level, monster, this.hero, { range: 6 })) {
				this.zapHero(monster, [2, 10]);
				return;
			}
		}
		if (monster.kind === 'tengu') {
			this.takeTenguTurn(monster);
			return;
		}
		if (monster.kind === 'yog') {
			this.takeYogTurn(monster);
			return;
		}
		//Warlock DarkBolt, Elemental zap: same MAGIC_BOLT shape as the Shaman's (Warlock's
		//zap is its own 12-18; the Elemental's cooldown and opposite-element rules are not
		//modelled - it simply zaps within its own melee range)
		if (monster.kind === 'warlock' && Roguelike.canTarget(this.level, monster, this.hero, { range: 6 })) {
			this.zapHero(monster, [12, 18]);
			return;
		}
		if (monster.kind === 'elemental' && Roguelike.canTarget(this.level, monster, this.hero, { range: 5 })) {
			this.zapHero(monster, [20, 25]);
			return;
		}
		//YogFist: ranged MAGIC_BOLT like its melee. The four Java fist kits are represented by
		//a deterministic debuff rotation until separate fist subclasses are introduced.
		if (monster.kind === 'yogFist' && Roguelike.canTarget(this.level, monster, this.hero, { range: 6 })) {
			this.zapHero(monster, [6, 12]);
			monster.combo = ((monster.combo ?? 0) + 1) % 4;
			const effect: BuffId[] = ['burning', 'roots', 'cripple', 'daze'];
			addBuff(this.hero, effect[monster.combo]);
			return;
		}
		//Scorpio: ranged-only over PROJECTILE ballistics, like the Trickster
		if (monster.kind === 'scorpio' && Roguelike.canTarget(this.level, monster, this.hero, { range: 6 })) {
			this.attack(monster, this.hero);
			this.spawnProjectile(monster, this.hero);
			return;
		}
		//Guard.chain: distance<5 with a projectile path - pulls one cell closer + Cripple 4s.
		//Real Java's `chainsUsed` means a Guard may only ever do this once in its lifetime, not
		//every time the hero re-enters range - previously unmodeled, letting a Guard chain-pull
		//and Cripple-lock the hero repeatedly, something the real game never allows.
		if (monster.kind === 'guard' && !monster.chainUsed && distance >= 2 && distance < 5 && Roguelike.canTarget(this.level, monster, this.hero, { range: 5 })) {
			this.chainHero(monster);
			return;
		}
		//DM200.Hunting.act()/canVent(): while not adjacent, a distance-scaled roll
		//(Random.Int(100/distance)==0 - farther away is *more* likely, up to 30 turns'
		//cooldown after each vent) seeds toxic gas along the line to the hero before it tries
		//to close distance normally. Real Java's `canVent` also BFS-checks a path exists around
		//blocking terrain even without line of sight, and retries venting if closing distance
		//failed; this port requires a clear line instead (a narrower reachability check) and
		//has no closing-distance-failed fallback - previously DM200 had no special behavior
		//here at all and fought as a plain melee attacker.
		if (monster.kind === 'dm200' && distance >= 2) {
			monster.ventCooldown = (monster.ventCooldown ?? 0) - 1;
			if (
				(monster.ventCooldown ?? 0) <= 0 &&
				Roguelike.canTarget(this.level, monster, this.hero, { range: 8 }) &&
				Random.int(Math.max(1, Math.floor(100 / distance))) === 0
			) {
				this.ventDM200(monster);
				return;
			}
		}
		//Spinner.Hunting.act()/shootWeb(): while not adjacent and off a 10-turn cooldown, roots
		//the hero directly on a clear shot. Real Java instead predicts the hero's movement
		//direction and seeds a real `Web` terrain blob across three cells (the aimed cell plus
		//its two neighbours) that immobilises whoever stands in it later, not a direct debuff
		//application - this port applies the same "shape not curve" simplification already used
		//for other line-based abilities here (DM200's vent, the Necromancer's bolt), rooting the
		//hero immediately instead of seeding persistent terrain. Previously Spinner had no ranged
		//ability at all; only its melee bite's on-hit cripple chance existed.
		if (monster.kind === 'spinner' && distance >= 2) {
			monster.webCooldown = (monster.webCooldown ?? 0) - 1;
			if ((monster.webCooldown ?? 0) <= 0 && Roguelike.canTarget(this.level, monster, this.hero, { range: 6 })) {
				monster.webCooldown = 10;
				addBuff(this.hero, 'roots');
				this.say(t('port.log.spinnerweb'), 'negative');
				return;
			}
		}
		//GnollTrickster: ranged-only (never adjacent), combo escalates in attack()
		if (
			monster.kind === 'gnollTrickster' &&
			Roguelike.canTarget(this.level, monster, this.hero, { range: 6 })
		) {
			this.attack(monster, this.hero);
			this.spawnProjectile(monster, this.hero);
			return;
		}
		//GreatCrab.getCloser: only really advances every 3rd turn
		if (monster.kind === 'greatCrab') {
			monster.moving = (monster.moving ?? 0) + 1;
			if (monster.moving < 3) return;
			monster.moving = 0;
		}
		//Monk Focus: re-earned over ~6 of its own turns once spent (combo is the timer)
		if (monster.kind === 'monk' && !monster.buffs['focus']) {
			monster.combo = (monster.combo ?? 0) + 1;
			if (monster.combo >= 6) {
				monster.combo = 0;
				addBuff(monster, 'focus');
			}
		}

		//GnollTrickster.getCloser(): reaching here means it's about to move via the generic
		//mover below rather than attack this turn, so its combo resets (see `stepAway`'s own
		//identical reset for the adjacent-retreat case).
		if (monster.kind === 'gnollTrickster') monster.combo = 0;
		const blocked = new Set(
			this.creatures.filter((c) => c !== monster && c !== this.hero).map((c) => this.level.index(c.x, c.y))
		);
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
				sightRadius: VIEW_RADIUS,
				//Thief.FLEEING once it has stolen something; everyone else fights on (0.25)
				fleeBelow: monster.kind === 'thief' && monster.stolen ? 1 : 0.25,
				blocked,
			}
		);

		if (decision.step) this.moveTo(monster, decision.step);
	}

	/** a magic bolt that never misses its roll the melee way - hit(accMulti 2), then damage */
	private zapHero(monster: Creature, damage: [number, number]): void {
		if (!rollHit(monster, this.hero, true)) {
			this.say(t('port.log.boltmisses', { who: capitalize(monster.name) }), 'negative');
			return;
		}
		let dmg = Math.max(0, Random.normalRange(damage[0], damage[1]) - Random.normalRange(this.hero.armor[0], this.hero.armor[1]));
		dmg = this.absorbHeroDamage(dmg);
		this.hero.hp -= dmg;
		this.showDamage(this.hero, dmg);
		this.sprite(this.hero).setColorAdd(0.6, 0.7, 1);
		this.say(t('port.log.bolthits', { who: capitalize(monster.name), damage: dmg }), 'negative');
		this.spawnProjectile(monster, this.hero);
		if (this.hero.hp <= 0) this.kill(this.hero);
	}

	/** Necromancer.summonMinion: a NecroSkeleton beside the hero (push-aside simplified away) */
	private summonSkeleton(necro: Creature): void {
		for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
			const at = { x: this.hero.x + dx, y: this.hero.y + dy };
			if (!this.level.passable(at.x, at.y) || this.creatureAt(at.x, at.y)) continue;
			const skel = this.spawnMonster('necroSkeleton', at);
			skel.sleeping = false;
			necro.skeleton = skel;
			this.say(t('port.log.summonskeleton'), 'warning');
			return;
		}
		//nowhere to put one: the bolt's blocker-damage branch instead
		this.zapHero(necro, [2, 10]);
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
		this.say(t('port.log.dm200vent'), 'negative');
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
		this.say('The crystal mimic reveals itself.', 'warning');
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
		this.say('The crystal mimic escapes into the darkness.', 'warning');
	}

	/**
	 * Tengu: melee acc 10 adjacent, ranged acc 20 otherwise (the dart half of attackSkill);
	 * below half HP he relocates once to a cell 5-7 away and seeds a trap (the
	 * PrisonBossLevel vanish/reappear + shifting floor, minus the floor-shift script and the
	 * Bomb/Fire/Shocker ability cycle - stated, not silent).
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
					sightRadius: VIEW_RADIUS,
					blocked,
				});
				if (decision.step) this.moveTo(tengu, decision.step);
			}
		} else {
			this.attack(tengu, this.hero);
		}

		if (tengu.hp * 2 <= tengu.maxHp && tengu.hp > 0 && (tengu.arenaJumps ?? 0) === 0) {
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
	 * DM-300: pylon proximity seals the arena and briefly energizes the pylon cells; its
	 * overcharge vents hazardous ground around the hero and doubles the strike, while the
	 * Java rockfall/gas details remain outside the current blob/status vocabulary.
	 */
	private takeDM300Turn(dm300: Creature): void {
		dm300.combo = (dm300.combo ?? 0) + 1;
		if (dm300.combo % 3 === 0) {
			this.say(t('port.log.dm300overcharge'), 'warning');
			//DM-300's arena pressure: the overcharge vents hazardous ground around the hero.
			for (const [dx, dy] of Roguelike.neighbourOffsets(4)) {
				const at = { x: this.hero.x + dx, y: this.hero.y + dy };
				if (this.level.passable(at.x, at.y) && !this.creatureAt(at.x, at.y)) this.fire.seed(at.x, at.y, 2);
			}
			const { damage } = liveStats(dm300);
			this.attack({ ...dm300, kind: undefined, damage: [damage[0] * 2, damage[1] * 2] }, this.hero);
		} else {
			this.attack(dm300, this.hero);
		}
	}

	private seedBossTrap(at: Step, kind: TrapKind): void {
		if (!this.level.inside(at.x, at.y) || this.level.get(at.x, at.y) === WALL) return;
		this.secrets.conceal(at.x, at.y, this.level.get(at.x, at.y), TRAP);
		this.trapKinds.set(this.level.index(at.x, at.y), kind);
	}

	/**
	 * DwarfKing through `mwg/roguelike` BossPhases + AbilityCycle: summons skeletal guards
	 * on a 10-turn rotation (P1), and past half HP fights behind a barrier - while any
	 * guard stands he spends his turn holding it instead of attacking, plus Fury. Java's
	 * LifeLink/teleport abilities, the P2 wave-chip (HT/12 per wave) and the P3
	 * viscosity-deferral are not modelled - the phase hook and the barrier shape are.
	 */
	private takeKingTurn(king: Creature): void {
		this.kingCycle.advance();
		for (const phase of this.kingPhases.check(king.hp / king.maxHp)) {
			if (phase === 1) {
				addBuff(king, 'fury');
				this.say(t('port.log.kingrage'), 'warning');
				this.summonKingAdds(king);
			}
		}
		const adds = [...this.kingAdds].filter((add) => add.hp > 0);
		if (adds.length > 0) {
			this.say(t('port.log.kingbarrier'), 'negative');
			if (adds.length < 2 && this.kingCycle.use('summon')) this.summonKingAdds(king);
			return;
		}
		if (this.kingCycle.use('summon')) this.summonKingAdds(king);
		this.attack(king, this.hero);
	}

	/** the King's skeletal guard: plain skeletons, awake, tracked for the barrier */
	private summonKingAdds(king: Creature): void {
		let summoned = 0;
		for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
			if (summoned >= 2) break;
			const at = { x: king.x + dx, y: king.y + dy };
			if (!this.level.passable(at.x, at.y) || this.creatureAt(at.x, at.y)) continue;
			const add = this.spawnMonster('skeleton', at);
			add.sleeping = false;
			this.kingAdds.add(add);
			summoned++;
		}
		if (summoned > 0) this.say(t('port.log.kingadds'), 'warning');
	}

	/**
	 * Yog-Dzewa through BossPhases: each crossed HP gate tears open another fist (Java's
	 * gates sit at HT-300*phase with several fist types; here three fists cycle their
	 * ranged debuffs). While any fist lives the fists fight and Yog holds its beams; fistless, it
	 * beams over line-of-sight. Larva/Ripper summons and the fistless-P5 bleed are not
	 * modelled.
	 */
	private takeYogTurn(yog: Creature): void {
		for (const _phase of this.yogPhases.check(yog.hp / yog.maxHp)) {
			this.say(t('port.log.yogfist'), 'warning');
			this.summonFist(yog);
		}
		const fists = this.creatures.filter((c) => c.kind === 'yogFist' && c.hp > 0);
		if (fists.length > 0) return;
		if (Roguelike.canTarget(this.level, yog, this.hero, { range: 8 })) {
			this.say(t('port.log.yogbeam'), 'warning');
			this.zapHero(yog, [8, 16]);
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
	private attack(attacker: Creature, defender: Creature): void {
		if (attacker.isHero) this.cancelHourglassFreeze();
		faceCharacter(this.sprite(attacker), attacker.x, defender.x);
		if (attacker.isHero) this.heroAnimation.attack();
		else { const attackerSprite = this.sprite(attacker); if (attackerSprite instanceof AnimatedSprite && attackerSprite.has('attack')) attackerSprite.play('attack', true); }
		// Invisibility is dispelled by an aggressive action (Invisibility.dispel()).
		if (attacker.buffs['invisibility']) delete attacker.buffs['invisibility'];
		const subject = attacker.isHero ? t('port.log.subject.you') : capitalize(attacker.name);
		const object = defender.isHero ? 'you' : defender.name;
		if (defender.kind === 'crystalMimic' && !defender.mimicRevealed) {
			this.revealCrystalMimic(defender);
		}
		// Mob.surprisedBy() is not limited to sleeping enemies: it also succeeds when the
		// target did not see the hero on its most recent turn. In particular, its FOV is
		// sampled before a chase step, so striking a snake immediately after it enters a
		// doorway is a guaranteed hit.
		const surprise = defender.sleeping === true || (!defender.isHero && !defender.seesHero);
		//Monk Focus: the first attack against a focused monk always misses and spends the
		//focus (re-earned over ~6 of its own turns via combo in takeMonsterTurn)
		if (defender.kind === 'monk' && defender.buffs['focus']) {
			delete defender.buffs['focus'];
			defender.combo = 0;
			defender.sleeping = false;
			this.say(t(attacker.isHero ? 'port.log.monkdodgehero' : 'port.log.monkdodge', { subject, object }), 'negative');
			return;
		}
		//YogDzewa is invulnerable while any fist lives - the whole point of the gates
		if (defender.kind === 'yog' && this.creatures.some((c) => c.kind === 'yogFist' && c.hp > 0)) {
			defender.sleeping = false;
			this.say(t('port.log.yogshielded'), 'negative');
			return;
		}

		if (!rollHit(attacker, defender, false, surprise)) {
			runState.audio.cue('miss', 0.55);
			defender.sleeping = false;
			this.say(t(attacker.isHero ? 'port.log.misshero' : 'port.log.miss', { subject, object }), 'negative');
			return;
		}

		let damage = rollDamage(attacker, defender);
		// Weapon.Augment DAMAGE: 20% damage increase (1.2x multiplier). Applied to base damage.
		if (attacker === this.hero && this.weaponAugment === 'damage') {
			damage = Math.round(damage * 1.2);
		}
		if (attacker === this.hero && this.weaponAffix === 'kinetic' && this.kineticStored > 0) {
			damage += this.kineticStored;
			this.kineticStored = 0;
		}
		if (attacker === this.hero) damage += empoweredStrikeBonus(this.subclass(), this.talentRank('empowered_strike'));
		if (attacker.isHero && surprise) damage += this.talentRank('sucker_punch');
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
		//Sacrificial.proc(): real bleed scales ((missingHpFraction^2) * attacker.maxHp)/5,
		//floored at 1. This port has no separate Bleeding buff (only the shared poison DoT),
		//so - like Albino's real Bleeding proc elsewhere in this file - it reuses poison as
		//the closest available damage-over-time primitive; the real magnitude curve is lost
		//since this port's poison has no configurable per-tick amount.
		if (attacker === this.hero && this.weaponAffix === 'sacrificial' && Random.chance(1 / 12)) {
			addBuff(attacker, 'poison');
		}
		//Displacing.proc(): real chance is 1/12, skipped against IMMOVABLE targets (a Java
		//property this port doesn't model, so every defender is teleportable here - a narrow
		//gap). Reuses the same free-cell search this file's Displacement armor curse already
		//uses in place of Java's ScrollOfTeleportation.teleportChar. Java also resets a fleeing
		//HUNTING mob back to WANDERING; this port has no such explicit state to reset, but the
		//next monster-turn FOV recompute (`seesHero`) naturally loses track once far enough away.
		if (attacker === this.hero && this.weaponAffix === 'displacing' && !defender.isNPC && Random.chance(1 / 12)) {
			const destination = this.randomFreeCell(defender);
			if (destination) this.moveTo(defender, destination);
		}
		//Displacement.proc(): a 1-in-20 armor-curse proc teleports the defender
		//and replaces the incoming hit with zero damage.
		if (defender.isHero && this.armorGlyph === 'displacement' && Random.chance(1 / 20)) {
			const destination = this.randomFreeCell(defender);
			if (destination) {
				this.moveTo(defender, destination);
				defender.sleeping = false;
				this.say('Your armor displaces you.', 'warning');
				return;
			}
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
		//Eye DeathGaze, simplified: every third landed hit strikes at 1.5x (no charge-up
		//turn or beam visuals - the multiplier is the real part)
		if (attacker.kind === 'eye') {
			attacker.combo = (attacker.combo ?? 0) + 1;
			if (attacker.combo % 3 === 0) {
				damage = Math.round(damage * 1.5);
				this.say(t('port.log.eyegaze'), 'negative');
			}
		}
		//DemonSpawner.damage(): big hits are soft-capped (20/21/22/.../30 raw becomes
		//20/22/25/29/34/40/47/55/64/74/85 incoming before this reduction), and the (possibly
		//reduced) damage also cuts its spawn-cooldown - being attacked makes it panic and summon
		//backup sooner, not later.
		if (defender.kind === 'demonSpawner' && damage >= 20) {
			damage = 19 + Math.floor((Math.sqrt(8 * (damage - 19) + 1) - 1) / 2);
		}
		const lethalThreshold = Math.max(0.4 * this.talentRank('combined_lethality') / 3, enhancedLethalityThreshold(this.subclass(), this.talentRank('enhanced_lethality')));
		if (attacker === this.hero && lethalThreshold > 0 && defender.hp - damage <= defender.maxHp * lethalThreshold) {
			damage = defender.hp;
			this.say(t('port.log.talentexecute'), 'positive');
		}
		const preHp = defender.hp;
		if (defender.isHero) damage = this.absorbHeroDamage(damage);
		defender.hp -= damage;
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
				this.say('The crystal mimic displaces you.', 'warning');
			}
		}
		if (defender.hp <= 0 && defender.kind === 'ghoul') this.ghoulDown(defender);

		//Brute.isAlive()/triggerEnrage(): the first time it would die, it survives instead with
		//a shield of HT/2+4 (`BruteRage.setShield`) - reproduced here by giving its hp field
		//that value directly rather than tracking a separate shield pool, so the existing
		//damage-application code drains it exactly like real hp would. `raged` then boosts its
		//own damage roll (`liveStats`) and drives the flat 4/turn passive decay in
		//`takeMonsterTurn`; only ever fires once (`hasRaged`), matching Java exactly.
		if (defender.hp <= 0 && defender.kind === 'brute' && !defender.hasRaged) {
			defender.hasRaged = true;
			defender.raged = true;
			defender.hp = Math.round(defender.maxHp / 2 + 4);
			this.say(t('port.log.bruterage'), 'negative');
			return;
		}

		if (defender.hp <= 0) {
			const cleave = cleaveComboSeed(this.subclass(), this.talentRank('cleave'));
			if (attacker === this.hero && cleave > 0) attacker.combo = cleave;
			if (attacker === this.hero && this.heroClass === 'warrior' && this.talentRank('lethal_momentum') > 0 && Random.chance(this.talentRank('lethal_momentum') >= 2 ? 1 : 2 / 3)) this.freeTurnNext = true;
			if (attacker === this.hero && endlessRageFreeTurn(this.subclass(), this.talentRank('endless_rage'))) this.freeTurnNext = true;
			if (attacker === this.hero && lethalHasteFreeTurn(this.heroClass, this.talentRank('lethal_haste'))) this.freeTurnNext = true;
			this.kill(defender);
			return;
		}
		if (defender.kind === 'swarm') this.swarmSplit(defender, damage, preHp);
	}

	/** hero-side on-hit hooks: enchants, subclass effects, counters */
	private heroOnHit(attacker: Creature, defender: Creature, damage: number): void {
		if (this.weaponAffix === 'kinetic' && damage > 0) this.kineticStored = Math.min(20, this.kineticStored + Math.floor(damage * 0.5));
		this.wandCharges.refund(weaponRechargingGain(this.heroClass, this.talentRank('weapon_recharging')));
		//Battlemage: staff melee feeds the wand (advance 2 per landed hit, simplified from
		//the per-wand on-hit effects)
		if (this.subclass() === 'battlemage') this.wandCharges.refund(2 + this.talentRank('mystical_charge'));
		if (this.subclass() === 'monk_sub' && this.talentRank('combined_energy') > 0) this.tomeCharges.advance(this.talentRank('combined_energy'));
		if (this.advancement.choice(1) === 'arcane') this.wandCharges.refund(1);
		if (this.advancement.choice(1) === 'arcane' && defender.hp > 0) {
			defender.hp -= 2;
			this.showDamage(defender, 2);
		}
		if (this.weaponAffix === 'blazing') addBuff(defender, 'burning');
		if (this.weaponAffix === 'chilling') addBuff(defender, 'daze');
		if (this.weaponAffix === 'shocking') {
			defender.hp -= 2;
			this.showDamage(defender, 2);
			this.say(t('port.log.shocking'));
		}
		if (this.weaponAffix === 'vampiric') {
			attacker.hp = Math.min(attacker.maxHp, attacker.hp + 1);
			this.showHeal(attacker, 1);
			this.say(t('port.log.vampiric'), 'positive');
		}
		//Grim.proc(): real chance scales 0-50% with the defender's missing-HP fraction plus
		//0-5%/weapon level, deferred through a tracker buff so `Char.damage` sees the *final*
		//damage. Simplified to a flat 15% flat-15-bonus-true-damage roll, gated the same way
		//(only worth rolling once the defender is already below half HP) - the shape (execute
		//pressure on a weakened target) is real, the curve is not.
		if (this.weaponAffix === 'grim' && defender.hp > 0 && defender.hp <= defender.maxHp / 2 && Random.chance(0.15)) {
			defender.hp -= 15;
			this.showDamage(defender, 15);
			this.say(t('port.log.grim'), 'positive');
		}
		//Lucky.proc(): real effect only arms on a would-be-killing blow, then RingOfWealth-style
		//loot (80% common/20% uncommon/0% rare) lands via a deferred buff. Simplified to a flat
		//10% chance, on an actual kill, to spawn one bonus ground item alongside the corpse's own
		//loot roll - the "your kill got lucky" shape survives, the ring-of-wealth tier curve does
		//not (this port's `spawnGroundItem` has no rarity axis to roll on).
		if (this.weaponAffix === 'lucky' && defender.hp <= 0 && Random.chance(0.1)) {
			this.spawnGroundItem(Random.element(['potion', 'scroll', 'gold'] as const)!, defender.x, defender.y);
			this.say(t('port.log.lucky'), 'positive');
		}
		//Blocking.proc(): real proc chance is (lvl+4)/(lvl+40) (10% at lvl 0, ~14% at lvl 2), and
		//the shield granted is round(max(1,procChance) * (2+lvl)) - both reproduced exactly. Real
		//Java grants this into its own BlockBuff (a distinct ShieldBuff from Barrier) whose act()
		//just detaches outright 5 turns after setShield() - a fixed cliff-edge, not a decay curve.
		//This port pools every shield source (Barrier, Blocking, talent grants) into one heroBarrier,
		//which now decays via Barrier.act()'s real proportional curve (see the applyBuffDamage hook
		//in spendHeroTurn) - closer to Java's actual Barrier behavior than "never decays" was, but
		//still not BlockBuff's specific fixed-duration expiry, since a shared pool can't expire only
		//the portion Blocking itself contributed.
		if (this.weaponAffix === 'blocking') {
			const procChance = (this.weaponLevel + 4) / (this.weaponLevel + 40);
			if (Random.chance(procChance)) {
				const powerMulti = Math.max(1, procChance);
				this.grantHeroShield(Math.round(powerMulti * (2 + this.weaponLevel)), this.hero.maxHp);
			}
		}
	}

	/** the auto-decided subclass id (branch tier 0), or null before level 13 */
	private subclass(): string | null {
		return this.advancement.choice(0);
	}

	/**
	 * `RingOfTenacity.damageMultiplier()`: x0.85^(lvl * missingHpFraction), read against HP
	 * *before* this hit lands (matches `Hero.damage()`, which computes it before HP drops) -
	 * stronger reduction the lower the wearer's current HP already is.
	 */
	private ringTenacityMultiplier(): number {
		if (!this.equippedRing || ringDef(this.equippedRing.id)?.stat !== 'tenacity') return 1;
		const missingFraction = (this.hero.maxHp - this.hero.hp) / this.hero.maxHp;
		return Math.pow(0.85, this.equippedRing.level * missingFraction);
	}

	/** `RingOfHaste.speedMultiplier()`: `1.175^level`. Read by `getActionTurnCostMod` as a turn-
	 * cost divisor - Java expresses this as `Char.speed()` scaling upward, this port's
	 * fractional-turn-cost model expresses the same thing as the cost per action scaling down. */
	private ringHasteMultiplier(): number {
		if (!this.equippedRing || ringDef(this.equippedRing.id)?.stat !== 'speed') return 1;
		return Math.pow(1.175, this.equippedRing.level);
	}

	/** `RingOfEnergy.wandChargeMultiplier()`: `1.175^level` (this port doesn't model the
	 * Light Reading talent's further multiplier on top, since that talent itself isn't ported). */
	private ringEnergyMultiplier(): number {
		if (!this.equippedRing || ringDef(this.equippedRing.id)?.stat !== 'energy') return 1;
		return Math.pow(1.175, this.equippedRing.level);
	}

	/** Barrier absorbs incoming damage before HP, matching Buff.Barrier's core rule. */
	private absorbHeroDamage(amount: number): number {
		//Hero.damage(): `dmg = ceil(dmg * RingOfTenacity.damageMultiplier())` is applied before
		//Char.damage()'s own Barrier absorption, so Tenacity scales the raw hit here too.
		const tenacityMultiplier = this.ringTenacityMultiplier();
		const scaled = tenacityMultiplier < 1 ? Math.ceil(amount * tenacityMultiplier) : amount;
		const blocked = this.heroBarrier.absorb(Math.max(0, scaled));
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

	private grantHeroShield(amount: number, cap = 999): void {
		if (amount <= 0) return;
		const max = cap + this.talentRank('iron_will');
		const room = Math.max(0, max - this.heroBarrier.total);
		this.heroBarrier.add(Math.min(room, amount));
		//Barrier.incShield() resets partialLostShield to 0 on every addition, so a fresh top-up
		//doesn't immediately spend whatever fraction had already accrued toward the next decay tick
		this.barrierPartialLoss = 0;
		this.say(t('port.log.shield', { amount }), 'positive');
	}

	/** monster-side on-hit hooks (all pre-existing, now grouped) */
	private mobOnHit(attacker: Creature, defender: Creature, damage: number): void {
		if (defender.isHero) this.grantHeroShield(lethalDefenseShield(this.subclass(), this.talentRank('lethal_defense')), this.hero.maxHp);
		//Metabolism.proc(): on a 1-in-6 hit, consume 10 hunger and heal one HP,
		//provided the hero is not starving and has room to heal.
		if (defender.isHero && this.armorGlyph === 'metabolism' && this.hunger < 450 && this.hero.hp < this.hero.maxHp && Random.chance(1 / 6)) {
			this.hunger = Math.max(0, this.hunger - 10);
			this.hero.hp++;
			this.showHeal(this.hero, 1);
		}
		//AntiEntropy.proc(): a 1-in-8 proc ignites the wearer and freezes the
		//eight neighboring cells. Daze is the port's timed freeze equivalent.
		if (defender.isHero && this.armorGlyph === 'antientropy' && Random.chance(1 / 8)) {
			addBuff(this.hero, 'burning');
			for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
				const nearby = this.creatureAt(this.hero.x + dx, this.hero.y + dy);
				if (nearby && nearby !== this.hero) addBuff(nearby, 'daze');
			}
		}
		//Corrosion.proc(): a 1-in-10 proc spreads corrosive ooze across the
		//eight neighboring cells. Poison is the available timed damage-over-time
		//equivalent; the port has no separate Ooze stack/intensity model.
		if (defender.isHero && this.armorGlyph === 'corrosion' && Random.chance(1 / 10)) {
			for (const [dx, dy] of Roguelike.neighbourOffsets(8)) {
				const nearby = this.creatureAt(this.hero.x + dx, this.hero.y + dy);
				if (nearby) addBuff(nearby, 'poison');
			}
		}
		//Multiplicity.proc(): a 1-in-20 proc duplicates a non-boss attacker into
		// an available neighboring cell. Mirror-image duplication is not represented
		// as a separate actor type here, so hero-attacker procs are intentionally skipped.
		if (defender.isHero && this.armorGlyph === 'multiplicity' && !attacker.isHero && !attacker.isNPC && Random.chance(1 / 20)) {
			const adjacent = Roguelike.neighbourOffsets(8)
				.map(([dx, dy]) => ({ x: this.hero.x + dx, y: this.hero.y + dy }))
				.filter((at) => this.level.passable(at.x, at.y) && !this.creatureAt(at.x, at.y));
			const destination = Random.element(adjacent);
			const attackerKind = attacker.kind;
			if (destination && attackerKind && !['goo', 'tengu', 'dm300', 'king', 'yog', 'yogFist'].includes(attackerKind)) {
				this.spawnMonster(attackerKind, destination);
			}
		}
		//Overgrowth.proc(): a 1-in-20 proc couches and immediately activates a
		//random supported seed at the defender's cell. The generator's full seed
		//weight table is not available, so selection is uniform across supported seeds.
		if (defender.isHero && this.armorGlyph === 'overgrowth' && Random.chance(1 / 20)) {
			const seed = Random.element(['blindweed', 'earthroot', 'fadeleaf', 'firebloom', 'icecap', 'mageroyal',
				'rotberry', 'sorrowmoss', 'starflower', 'stormvine', 'sungrass', 'swiftthistle'] as const);
			if (seed) {
				const cell = this.level.index(this.hero.x, this.hero.y);
				this.manualPlants.set(cell, seed);
				this.placePortedFeature(cell, `plant:${seed}`);
				this.triggerPortedPlantAt(this.hero.x, this.hero.y);
			}
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
		//Explosive.proc(): every hit removes Random.IntRange(0,10) fuse points and
		//detonates when the 100-point fuse is exhausted.  The existing blast resolver
		//supplies the Java-shaped nearby damage and then the fuse resets.
		if (this.weaponAffix === 'explosive') {
			this.weaponCurseDurability -= Random.range(0, 10);
			if (this.weaponCurseDurability <= 0) {
				this.applyTrapBlast(defender.x, defender.y);
				this.weaponCurseDurability = 100;
			}
		}
		//Dazzling.proc(): a 1-in-10 blast blinds visible characters around the
		//defender. Daze is the available timed blindness/impairment equivalent.
		if (this.weaponAffix === 'dazzling' && Random.chance(1 / 10)) {
			for (const creature of this.creatures) {
				if (creature.hp <= 0 || !this.fov.isVisible(creature.x, creature.y)) continue;
				creature.buffs.daze = Math.max(creature.buffs.daze ?? 0, creature === attacker ? 5 : 2);
			}
			delete this.hero.buffs.invisibility;
		}
		//Annoying.proc(): a 1-in-20 proc beckons every active monster toward
		//the hero. The AI's persisted seesHero flag is its target-acquisition state.
		if (this.weaponAffix === 'annoying' && Random.chance(1 / 20)) {
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
			addBuff(defender, 'poison');
			if (attacker.kind === 'acidic') addBuff(defender, 'cripple');
		}
		if (attacker.kind === 'fetidRat' && Random.chance(1 / 3)) {
			addBuff(defender, 'poison');
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
		//Scorpio: 50% cripple on a hit
		if (attacker.kind === 'scorpio' && Random.chance(0.5)) {
			addBuff(defender, 'cripple');
			this.say(t('port.log.cripple'), 'negative');
		}
		//Warlock Degrade: 25% chip off the hero's weapon level (buffedLvl loss, simplified)
		if (attacker.kind === 'warlock' && defender.isHero && Random.chance(0.25) && this.weaponLevel > 0) {
			this.weaponLevel--;
			this.syncHeroFromStats();
			this.say(t('port.log.degrade'), 'negative');
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
		this.processSacrifice(creature);
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
			const bounty = bountyGoldBonus(this.subclass(), this.talentRank('bounty_hunter'));
			if (bounty > 0) this.heroStats.setBase('gold', this.heroStats.base('gold') + bounty);
			const minionChance = necromancerMinionChance(this.subclass(), this.talentRank('necromancers_minions'));
			if (minionChance > 0 && Random.chance(minionChance) && !this.creatureAt(creature.x, creature.y)) {
				const minion = this.spawnMonster('necroSkeleton', { x: creature.x, y: creature.y });
				minion.sleeping = false;
			}
			const def = MONSTERS[creature.kind];
			const isClone = creature.kind === 'swarm' && (creature.generation ?? 0) > 0;
			if (!isClone && this.progression.level <= def.maxLvl) this.grantExperience(def.exp);
			if (this.subclass() === 'warlock' && this.talentRank('soul_eater') > 0) {
				const heal = this.talentRank('soul_eater');
				this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + heal);
				this.showHeal(this.hero, heal);
			}
			this.wandCharges.refund(soulSiphonCharge(this.subclass(), this.talentRank('soul_siphon')));
			if (this.subclass() === 'champion' && this.talentRank('secondary_charge') > 0) this.ammo += this.talentRank('secondary_charge');
		}

		//Mob.rollToDropLoot, simplified to one-item ground drops (no stacking heaps, no
		//LimitedDrops decay, no Wealth rings): one roll per table entry through real rollLoot
		if (creature.kind && !creature.isNPC) {
			if ((creature.kind === 'statue' || creature.kind === 'armoredStatue') && creature.mimicLoot?.startsWith('statue:')) {
				try {
					const payload = JSON.parse(creature.mimicLoot.slice('statue:'.length)) as StatueLoot;
					this.dropGeneratedStatueItem(payload.weapon, creature.x, creature.y);
					if (payload.armor) this.dropGeneratedStatueItem(payload.armor, creature.x, creature.y);
					this.say('The statue drops its enchanted equipment.', 'positive');
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
					: this.portItemKind(lootFamily);
				if (bonusKind) {
					this.spawnGroundItem(bonusKind, creature.x, creature.y, this.sourceInventoryItem(lootFamily, lootClass));
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
					const heldKind = this.portItemKind(heldFamily);
					const at = Roguelike.neighbourOffsets(8)
						.map(([dx, dy]) => ({ x: creature.x + dx, y: creature.y + dy }))
						.find((candidate) => this.level.passable(candidate.x, candidate.y)
							&& !this.groundItemAt(candidate.x, candidate.y) && !this.creatureAt(candidate.x, candidate.y));
					if (heldKind && at) this.spawnGroundItem(heldKind, at.x, at.y, this.sourceInventoryItem(heldFamily, heldClass));
				}
			}
			for (const entry of MOB_LOOT[creature.kind] ?? []) {
				const drop = Actors.rollLoot({ entries: [{ id: entry.kind, weight: 1 }], chance: entry.chance });
				if (drop) {
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
			//a slain thief returns what it stole, plus the gold it drops fleeing-or-dead
			if (creature.kind === 'thief' && creature.stolen) {
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

		//Necromancer.die kills its skeleton with it
		if (creature.kind === 'necromancer' && creature.skeleton && creature.skeleton.hp > 0) {
			this.say(t('port.log.skeletoncollapses'));
			this.kill(creature.skeleton);
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
		const kind = this.portItemKind(item.id) ?? 'gold';
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
		this.fov.update(this.hero.x, this.hero.y, VIEW_RADIUS);

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
			frostWand: this.frostWand,
			ghostSpawned: this.ghostSpawned,
			ghostType: this.ghostType,
			wandmakerSpawned: this.wandmakerSpawned,
			shopkeeperSpawned: this.shopkeeperSpawned,
			blacksmithSpawned: this.blacksmithSpawned,
			impSpawned: this.impSpawned,
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
			skillPoints: this.skillPoints.points,
			skillPointsState: this.skillPoints.toJSON(),
			charges: {
				wand: this.wandCharges.toJSON(),
				tome: this.tomeCharges.toJSON(),
				fire: this.fireCharges.toJSON(),
				bolt: this.boltCharges.toJSON(),
			},
			talentAccuracy: this.talentAccuracy,
			talentEvasion: this.talentEvasion,
			talents: Object.entries(this.talentRanks),
			heroShield: this.heroBarrier.total,
			heroBarrierState: this.heroBarrier.toJSON(),
			barrierPartialLoss: this.barrierPartialLoss,
			stealthTalentTicks: this.stealthTalentTicks,
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
		if (!s.heroBarrierState && s.heroShield) this.heroBarrier.add(s.heroShield);
		this.barrierPartialLoss = s.barrierPartialLoss ?? 0;
		this.stealthTalentTicks = s.stealthTalentTicks ?? 0;
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
		this.weaponCurseDurability = s.weaponCurseDurability ?? 100;
		this.weaponAugment = s.weaponAugment ?? null;
		this.armorGlyph = s.armorGlyph ?? null;
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
		this.frostWand = s.frostWand;
		this.ghostSpawned = s.ghostSpawned;
		this.ghostType = s.ghostType;
		this.wandmakerSpawned = s.wandmakerSpawned;
		this.shopkeeperSpawned = s.shopkeeperSpawned;
		this.blacksmithSpawned = s.blacksmithSpawned ?? this.blacksmithSpawned;
		this.impSpawned = s.impSpawned ?? this.impSpawned;
		this.blacksmithAlternative = s.blacksmithAlternative ?? this.blacksmithAlternative;
		this.equippedRing = s.equippedRing ?? null;
		this.ringHtBonus = s.ringHtBonus ?? 0;
		this.advancement = s.advancement ? Actors.Advancement.fromJSON(SUBCLASS_TRACK, s.advancement) : new Actors.Advancement(SUBCLASS_TRACK);
		this.subclassChoiceOpen = Boolean(SUBCLASS_OPTIONS[this.heroClass] && this.advancement.openTiers(s.level).includes(0) && !this.advancement.choice(0));
		this.armorChoiceOpen = Boolean(this.advancement.openTiers(s.level).includes(1) && !this.advancement.choice(1));
		this.talentOpen = this.subclassChoiceOpen || this.armorChoiceOpen;
		const classDef = CLASSES[this.heroClass];
		this.heroStats = s.heroStatsState
			? Actors.StatBlock.fromJSON({ base: { accuracy: classDef.accuracy, evasion: 5, gold: 0 } }, s.heroStatsState)
			: this.heroStats;
		this.heroStats.setBase('gold', s.heroStatsState?.base.gold ?? s.gold);
		this.skillPoints = new Actors.SkillPoints(this.heroStats, {
			cap: (stat) => (stat === 'gold' ? 0 : this.heroStats.base(stat) + 5),
			cost: () => 1,
		});
		this.skillPoints = s.skillPointsState
			? Actors.SkillPoints.fromJSON(this.heroStats, {
				cap: (stat) => (stat === 'gold' ? 0 : this.heroStats.base(stat) + 5),
				cost: () => 1,
			}, s.skillPointsState)
			: this.skillPoints;
		if (!s.skillPointsState) this.skillPoints.grant(s.skillPoints ?? 0);
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
		if (this.subclassChoiceOpen || this.armorChoiceOpen) {
			const options = this.armorChoiceOpen ? ARMOR_OPTIONS : (SUBCLASS_OPTIONS[this.heroClass] ?? []);
			this.talentPanel.addChild(new Graphics().roundRect(0, 0, width, 92, 6)
				.fill({ color: 0x101116, alpha: 0.98 }).stroke({ width: 2, color: 0xc9a24c }));
			const title = new Label({ text: this.armorChoiceOpen ? t('port.ui.armorability') : t('port.ui.subclass'), size: 13, bold: true, color: theme().color.textHighlight });
			title.position.set(10, 7);
			this.talentPanel.addChild(title);
			options.forEach((option, index) => {
				const key = this.armorChoiceOpen ? `port.armor.${option}` : `port.subclass.${option}`;
				const button = new Button({ width: (width - 24) / 2, height: 38, text: t(key), onClick: () => this.armorChoiceOpen ? this.chooseArmorAbility(option) : this.chooseSubclass(option) });
				button.position.set(8 + index * (width / 2), 34);
				button.eventMode = 'static';
				button.cursor = 'pointer';
				this.talentPanel.addChild(button);
			});
			this.positionInterface(Game.current.width, Game.current.height);
			return;
		}
		const points = this.skillPoints?.points ?? 0;
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
				if (rank < def.maxRank && this.skillPoints.spend('accuracy')) {
					this.heroStats.setBase('accuracy', this.heroStats.base('accuracy') - 1);
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
	 * <1 = faster actions (Swiftness enchant, Weapon.Augment SPEED)
	 * >1 = slower actions (encumbrance penalties, once modeled)
	 * Default: 1 (no modifier)
	 */
	private getActionTurnCostMod(): number {
		let mod = 1;
		// Swiftness enchant: 10% speed increase (0.9x turn cost). Real Java scales per rank via
		// multiple applications; this port's simplified version gives flat bonus if present.
		if (this.weaponAffix === 'swiftness') mod *= 0.9;
		// Weapon.Augment SPEED: 20% speed increase (0.8x turn cost). Applied once per weapon.
		if (this.weaponAugment === 'speed') mod *= 0.8;
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
		//RingOfHaste.speedMultiplier(): a higher Char.speed() means less time per action in
		//real Java; this port's turn-cost multiplier expresses the same relationship inverted.
		mod /= this.ringHasteMultiplier();
		return mod;
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

	private refreshInventoryPanel(): void {
		if (!this.inventoryPanel) return;
		this.inventoryPanel.visible = this.inventoryOpen;
		if (!this.inventoryOpen) return;
		const entry = (item: { id: string; quantity: number; instanceId?: string; level?: number; identified?: boolean; cursed?: boolean }): InventoryEntry => {
			const id = item.id;
			let frame = ({ clothArmor: 176, armor: 176, armorReward: 176, weaponReward: 96,
				food: 437, meat: 432, seed: 58, waterskin: 480, velvetPouch: 482, cloak: 240, hourglass: 240,
				spiritBow: 144, wand: 208, holyTome: 246, darkGold: 453, dwarfToken: 454, amulet: 61 } as Record<string, number>)[id] ?? 0;
			let action: string | undefined;
			if (id.startsWith('potion')) { frame = 352; action = capitalize(t('items.potions.potion.ac_drink')); }
			else if (id.startsWith('scroll')) { frame = 304; action = capitalize(t('items.scrolls.scroll.ac_read')); }
			else if (id === 'food' || id === 'meat') action = capitalize(t('items.food.food.ac_eat'));
			else if (id === 'seed') action = 'Plant';
			else if (id === 'pickaxe') action = capitalize(t('items.quest.pickaxe.ac_mine'));
			else if (id === 'hourglass') action = 'Freeze time';
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
		} finally {
			this.requestedItemId = null;
			this.requestedItemInstanceId = undefined;
		}
	}

	/** `TimekeepersHourglass.timeFreeze`: freeze automatic actors while hero actions are free. */
	private useHourglass(instanceId?: string): void {
		const hourglass = this.bag.find('hourglass', instanceId) as (typeof this.bag.items[number] & { charges?: number }) | undefined;
		if (!hourglass || hourglass.cursed) {
			this.say('You cannot use a cursed hourglass.', 'negative');
			return;
		}
		if (this.timeBubbleTurns > 0) {
			this.cancelHourglassFreeze();
			return;
		}
		const maxCharge = 5 + Math.min(5, hourglass.level ?? 0);
		const charge = Math.min(maxCharge, hourglass.charges ?? maxCharge);
		if (charge <= 0) {
			this.say('Your hourglass has no charge.', 'negative');
			return;
		}
		hourglass.charges = charge - 1;
		this.hourglassFreeze = true;
		this.hourglassTurnsToCost = 2;
		this.timeBubbleTurns = charge * 2;
		this.say('Time freezes around you.', 'positive');
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
		const newRingHtBonus = id.startsWith('ring_might') ? Math.round(baseMaxHp * (Math.pow(1.035, level) - 1)) : 0;
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
		if (this.heroClass === 'duelist' && this.talentRank('swift_equip') > 0) this.say(t('items.kindofweapon.swift_equip'), 'positive');
		else this.say(t('port.log.weaponequipped', { level: this.weaponLevel }), 'positive');
	}

	/** A found wand refreshes the shared staff charge pool; Mage's special action consumes it. */
	private equipWand(): void {
		const wand = this.bag.find('wand');
		if (!wand) return;
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
