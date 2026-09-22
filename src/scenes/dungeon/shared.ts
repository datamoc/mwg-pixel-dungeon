import { Texture } from 'mwg/two-d/pixi-interop';
import { Actors, Random, Roguelike, Rpg, SaveSystem, SpriteSheet } from 'mwg';
import { sourceInventoryItem } from '../../items/itemKinds';
import { RING_DEFS, ringDef, type EquippedRing } from '../../items/ringModifiers';
import { POTION_APPEARANCE_KEYS, SCROLL_APPEARANCE_KEYS, has, t } from '../../i18n/index';
import { Feeling } from '../../spdLevelGen/regularPainter';
import { type ClassId } from '../../classes';
import { WEAPON_NAME_BY_CLASS } from '../../items/catalog';
import { Cat, type GenItem, type StatueLoot } from '../../items/generator';
import { MWL_PROGRESSION, MWL_QUEST_DEFINITIONS, MWL_SCENARIO_QUESTS } from '../../mwlContent';
import { type WandType } from '../../items/wands';
import { type SandalsFlowContext } from '../../items/sandals';
import { wandmakerQuestType } from '../../spdLevelGen/wandmaker';
import { type FloorState } from '../floorState';
import { FLOOR, GRASS, HIGH_GRASS, WATERSKIN_MAX, type GroundItemKind, type TrapKind } from '../../dungeonConstants';
import { REGION_GRASS, patchGenerate } from '../../genericDungeon';
import { type BuffId, type Creature, type GroundItem } from '../../combat';
import { type MonsterId } from '../../monsters';
//`Level.Feeling`'s own ordinals, for the handful of rules that branch on the floor's feeling -
//	rampleHighGrass`'s GRASS-feeling dew halving is the newest of them.
//The Sandals of Nature's own rules - and the feed/root window flow behind `SandalsFlowContext` -
//live in their own module (scene-free, so `verifyItemWorkflows` can drive them the way it
//drives `shopPricing`/`missiles`); the scene only builds the flow context.

export function scenarioQuest(id: string) {
	const quest = MWL_SCENARIO_QUESTS.find((candidate) => candidate.id === id);
	if (!quest) throw new Error(`MWL scenario quest is missing ${id}`);
	return quest;
}

export function questDefinition(id: string) {
	const definition = MWL_QUEST_DEFINITIONS.find((candidate) => candidate.id === id);
	if (!definition) throw new Error(`MWL quest definition is missing ${id}`);
	return definition;
}

export function isStatueLoot(value: unknown): value is StatueLoot {
	if (!value || typeof value !== 'object') return false;
	const record = value as Record<string, unknown>;
	const isGenerated = (candidate: unknown): candidate is GenItem => {
		if (!candidate || typeof candidate !== 'object') return false;
		const item = candidate as Record<string, unknown>;
		return Number.isInteger(item.cat) && Number(item.cat) >= Cat.WEAPON && Number(item.cat) <= Cat.GOLD
			&& typeof item.cls === 'string' && typeof item.cursed === 'boolean'
			&& typeof item.level === 'number' && Number.isFinite(item.level)
			&& typeof item.quantity === 'number' && Number.isFinite(item.quantity)
			&& typeof item.hasGoodEnchant === 'boolean';
	};
	return typeof record.armored === 'boolean' && isGenerated(record.weapon)
		&& (record.armor === undefined || isGenerated(record.armor));
}


/** `Wandmaker.interact()`'s class-specific intro lines, by hero class. Java has six (`case
 *  CLERIC:` included); this port's generated catalogue carries five, because it was built from a
 *  source that predates `intro_cleric` - so a Cleric hears the intro without its own class line
 *  rather than another class's words or a raw key. Recorded here and in `PORT_COVERAGE.md` rather
 *  than papered over. */
export const WANDMAKER_CLASS_INTROS: Record<string, true> = {
	warrior: true, mage: true, rogue: true, huntress: true, duelist: true,
};


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
 * 	urnsToCharge`). Huntress's `SpiritBow` (1-6 dmg base) is not a
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
 * The Sewers' real "Sad Ghost" side quest is in, in all three 	ype` forms (`Ghost.java`'s
 * `Quest.type == depth-1`: Fetid Rat on 2, Gnoll Trickster on 3, Great Crab on 4, at the
 * real per-depth odds). The
 * Ghost NPC has Java's own spawn roll (`Random.Int(5 - depth) == 0` on depths 2-4,
 * 	ype = depth-1`), is
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
 * (`DungeonTileSheet.stitchWaterTile`: a 4-bit top/right/bottom/left mask into 16 tiles),
 * reproduced by the port's own `waterFrames()` (`dungeonTileFrames.ts`) - deliberately not
 * through `mwg/render`'s `autotileFrames`/`BLOB_SHAPES`: that is a 47-shape 8-neighbour blob
 * convention, one level more detailed than SPD's own 4-neighbour water mask, and this port
 * never calls it (a past revision imported `autotileFrames` and claimed otherwise; both the
 * import and the claim are gone).
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
 * (`HighGrass.trample`, 	rampleHighGrass`): 1-in-6 for a dew drop, 1-in-25 for a stone -
 * this port has no seed item, so that second roll always yields a stone rather than Java's own
 * stone-or-seed split. Dew drops (and a scattered few stones/potions/scrolls placed at floor
 * generation, standing in for SPD's own `Generator`/`Room` loot system this port does not
 * reproduce) sit on the ground as real `items.png` sprites and are picked up by walking onto
 * them - not through any inventory screen, since this port still has none. A collected dew
 * drop tops up a real `Waterskin` (`collectDewdrop`, `WATERSKIN_MAX = 20`, matching
 * `Waterskin.MAX_VOLUME`) shown in the status bar. Drinking now consumes only the drops needed
 * for the Java 5%-of-max-HP-per-drop heal plus the Warden's Shielding Dew overflow cap.
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
export const SPD_LEVEL_CURVE: Actors.GrowthCurve = {
	maxLevel: MWL_PROGRESSION.maxLevel,
	experienceFor: (level) => (level <= 1 ? 0 : Math.round((MWL_PROGRESSION.experienceNumerator * (level - 1) * (level + MWL_PROGRESSION.experienceOffset)) / MWL_PROGRESSION.experienceDivisor)),
};

/**
 * The real Sewers "Sad Ghost" quest (`Ghost.java`'s inner `Quest` class), all three types -
 * the Fetid Rat (depth 2), Gnoll Trickster (depth 3), Great Crab (depth 4). Stage 0 is a
 * milestone that completes the instant `DungeonScene` calls `advanceStage()` right after
 * `start()` (the "you were given this quest" moment); stage 1 is the real objective, gated on the
 * `ghostTargetSlain` `GameState` switch whichever miniboss's death sets; stage 2 is another
 * milestone, completing (and so finishing the quest) when the hero picks one of the two
 * generated reward items out of the turn-in picker - Java's `WndSadGhost` weapon-or-armor
 * choice, never both, with no max-HP bonus on either side.
 */
export const SAD_GHOST_QUEST: Rpg.QuestDefinition = {
	id: 'sadGhost',
	stages: [{}, { condition: { switch: questDefinition('sadGhost').conditionSwitch, equals: true }, description: questDefinition('sadGhost').description }, {}],
};

/**
 * The Wandmaker quest, simplified: Java's three fetch sites (MassGrave/CorpseDust,
 * RitualSite/Embers, RotGarden/Rotberry seed) need level features this port does not model,
 * so the ask here is any one scroll from the bag - the shape (offer, fetch, turn-in for a
 * choice of two wands) is real, the fetch target is the stand-in.
 */
export const WANDMAKER_QUEST: Rpg.QuestDefinition = {
	id: 'wandmaker',
	stages: [{}, { condition: { switch: questDefinition('wandmaker').conditionSwitch, equals: true }, description: questDefinition('wandmaker').description }, {}],
};

/**
 * The Troll Blacksmith quest, simplified: Java's two variants (15 DarkGold mined with the
 * given Pickaxe, or staining it on a Bat) now carries the generator's selected variant into
 * gameplay. The gold path asks for 15 dark-gold chunks; the alternative stains the pickaxe
 * on a Bat kill. The reforge reward (combine two same-class items) collapses to +1 weapon
 * and +1 armor level - this port has no second weapon/armor instances to absorb.
 */
export const BLACKSMITH_QUEST: Rpg.QuestDefinition = {
	id: 'blacksmith',
	stages: [{}, { condition: { switch: questDefinition('blacksmith').conditionSwitch, equals: true }, description: questDefinition('blacksmith').description }, {}],
};

/**
 * The Imp quest, simplified: Java wants 5 DwarfTokens from Monks (or 4 from Golems) for a
 * pre-rolled +2 cursed ring. The ask and the cursed-+2-ring reward are real; the token
 * drop is simplified to a flat 50% per Monk/Golem kill on any City depth (no depth-20
 * exclusion matters here - depth 20 is the King arena, which drops nothing).
 */
export const IMP_QUEST: Rpg.QuestDefinition = {
	id: 'imp',
	stages: [{}, { condition: { switch: questDefinition('imp').conditionSwitch, equals: true }, description: questDefinition('imp').description }, {}],
};

/**
 * Talent tiers 3+ as an `mwg/actors` Advancement track. Tier 3 (level 13) is the subclass branch -
 * both of each class's real HeroSubClass names (the Cleric postdates this checkout's subclasses,
 * so it takes no branch).
 *
 * Tier 4 (the armor ability) is deliberately **not** a tier of this track. Real Java does not grant
 * it at a level: `KingsCrown.WEAR` opens `WndChooseAbility` and `KingsCrown.upgradeArmor()` sets
 * `hero.armorAbility`, so a hero whose crown is still in the dungeon at level 21 has no ability and
 * no tier-4 talent points (`Hero.talentPointsAvailable(4)` returns 0 while `armorAbility == null`),
 * which is a state a level-triggered branch cannot express (`Advancement.choose` also throws for a
 * tier that has not opened). The chosen ability therefore lives in 	his.armorAbility` and the
 * ability panel is opened by the crown. Saves written before this change recorded an invented
 * `warding`/`arcane` capstone in tier 1 of this track; those ids are not abilities any more and are
 * dropped on load (see `loadRun`), with the real choice available again at the next crown.
 */
/**
 * `NaturesPower.naturesPowerTracker`: an eight-turn window (`DURATION = 8`) with at most two
 * `WILD_MOMENTUM` extensions per cast.
 */
export const NATURES_POWER_DURATION = 8;
/** `NaturesPower.harmfulPlants`: the five seeds `NATURES_WRATH` can sprout. */
export const HARMFUL_PLANTS = ['blindweed', 'firebloom', 'icecap', 'sorrowmoss', 'stormvine'] as const;

export const SUBCLASS_TRACK: Actors.AdvancementTrack = {
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
	],
};
export const SUBCLASS_OPTIONS: Record<ClassId, readonly string[] | undefined> = {
	warrior: ['berserker', 'gladiator'], mage: ['battlemage', 'warlock'],
	rogue: ['assassin', 'freerunner'], huntress: ['sniper', 'warden'],
	duelist: ['champion', 'monk_sub'], cleric: ['priest', 'paladin'],
};
/** `HeroClass.initHero()`'s real starting `belongings.weapon` class per class (tag `v3.3.8`),
 * lowercased to match `WEAPON_NAME_BY_CLASS`'s own keys. Cleric has no real weapon system
 * here yet (its "cudgel" is an invented port-only key with no `WEAPONS` table entry), so it
 * stays unmapped - see `pickupWeapon`'s own comment for the fallback that gives it. */
export const STARTING_WEAPON_CLASS: Partial<Record<ClassId, string>> = {
	warrior: 'wornshortsword', mage: 'magesstaff', rogue: 'dagger', huntress: 'gloves', duelist: 'rapier',
};

/**
 * The scheduler id the hero is saved under. Every other queued actor is a monster the floor state
 * already indexes (`mob-<index>` into `FloorState.creatures`), but the hero is deliberately not part
 * of that array - it outlives every floor - so it needs its own key. See `captureActiveFloor` and
 * `restoreFloor`: these keys exist only for `Roguelike.Scheduler.toJSON`/`restore`, which identify
 * actors by a caller-assigned id because the scheduler itself holds references, not ids.
 */
export const HERO_SCHEDULER_ID = 'hero';
export const MOB_SCHEDULER_ID_PREFIX = 'mob-';

/**
 * `PathFinder.CIRCLE8` in Java's own index order: 0 is up-left and 3 is right, so
 * `index - 1`/`index + 1` walk the ring the way `FireAbility.left()`/`right()` do. The port's
 * own neighbour ordering is a different one, so this table is spelled out rather than reused.
 */
export const TENGU_CIRCLE8: ReadonlyArray<readonly [number, number]> = [
	[-1, -1],
	[0, -1],
	[1, -1],
	[1, 0],
	[1, 1],
	[0, 1],
	[-1, 1],
	[-1, 0],
];
//Weapon.Augment: SPEED/DAMAGE/NONE, chosen when using StoneOfAugmentation on the equipped weapon.
export const AUGMENT_OPTIONS = ['speed', 'damage', 'none'] as const;

/** `WndBlacksmith`'s flat smith price (`Messages.get(this, "smith", 2000)`). */
export const BLACKSMITH_SMITH_COST = 2000;

/** `MagicalFireRoom.EternalFire.evolve()`'s own burn duration: one of the three Java sites that
 * pass a literal instead of `Burning.DURATION` (see `src/content/buff-rules.mwl`). */
export const ETERNAL_FIRE_BURN = 4;

/** Weapon enchantments and armor glyphs now live in `src/content/affix-rules.mwl` and are
 * adapted to `Actors.AffixTable` by `itemAffixes.ts`; the per-id proc bodies stay here, where
 * they need live scene and combat state. See `itemAffixes.ts` and `PORT_COVERAGE.md` for the
 * Java-cited list of which enchantments/glyphs/curses are modeled and which remain gaps. */

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
export const NON_STATBLOCK_RING_STATS = new Set([
	'strength', 'tenacity', 'speed', 'energy', 'wealth', 'arcana', 'force', 'sharpshooting',
	'elements', 'furor',
]);

/**
 * Unidentified appearances (`ItemSpriteSheet`'s shuffled variants) as `mwg/actors`
 * Appearances: thirteen potion looks, thirteen scroll looks (12 real Java classes plus
 * this port's own synthetic pre-resolution 'scroll' placeholder), dealt per run. This
 * replaces the old "always the first variant" simplification with the real shuffle.
 */
export const APPEARANCE_TABLES: Record<string, Actors.AppearanceTable> = {
	potion: {
		//The generic `potion` placeholder is synthetic; these twelve ids cover the complete
		//Potion generator deck. Missing generated ids made appearance lookup throw on an
		//unidentified Frost/ToxicGas/ParalyticGas/Haste potion.
		kinds: ['potion', 'potionHealing', 'potionStrength', 'potionFlame', 'potionMindVision', 'potionInvis', 'potionPurity', 'potionExperience', 'potionLevitation', 'potionToxicGas', 'potionParalyticGas', 'potionHaste', 'potionFrost'],
		labels: [...POTION_APPEARANCE_KEYS, POTION_APPEARANCE_KEYS[0]!] as string[],
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
		//13th fake SPD rune name Java doesn't have. `scrollPrismatic` shares `scrollMirror`'s
		//rune label, exactly like Java's `ExoticScroll.reset()` (`image = regular + 16`,
		//same `handler.label`) - the exotic is distinguishable by its identified name,
		//not by a new rune.
		kinds: ['scroll', 'scrollIdentify', 'scrollUpgrade', 'scrollRage', 'scrollLullaby', 'scrollMapping', 'scrollMirror', 'scrollCleanse', 'scrollRecharging', 'scrollTeleportation', 'scrollTerror', 'scrollRetribution', 'scrollTransmutation', 'scrollPrismatic'],
		labels: [...SCROLL_APPEARANCE_KEYS.slice(0, 12), SCROLL_APPEARANCE_KEYS[0], SCROLL_APPEARANCE_KEYS[6]] as string[],
	},
};

/** flattened run state for mwg/core's SaveSystem (plain JSON, not the live object graph) */
export interface SaveShape {
	runSeed: number;
	runSeedLong?: string;
	seededRun?: boolean;
	depth: number;
	deepestDepth?: number;
	mobsToChampion?: number;
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
	weaponSourceClass?: string;
	armorId?: string;
	armorInstanceId?: string;
	waterskin: number;
	hunger: number;
	hungerPartialDamage?: number;
	ammo: number;
	/** The wielded missile class (`ammoSourceClass`); absent on saves written before a carried
	 * missile could be wielded, which fall back to the hero class's own starting missile. */
	ammoSourceClass?: string;
	/** The wielded pile's tip seed (`TippedDart` only); absent unless tipped darts are wielded. */
	ammoTippedSeed?: string;
	ammoDurability?: number;
	missileLevel?: number;
	/** `MissileWeapon` set lineage: the wielded pile's set, and the `UpgradedSetTracker`
	 * thresholds - see `src/missiles.ts`. A set id is a string (this port's per-instance counter,
	 * not Java's `SecureRandom` long). Absent on pre-rule saves. */
	ammoSetId?: string;
	missileThresholds?: [string, number][];
	dustSpawnPower?: number;
	/** `HeavyBoomerang.CircleBack`'s in-flight return, if one is pending - see the field's own
	 * comment. Java's buff survives saves (`revivePersists`), so a boomerang thrown before a save
	 * still flies home after the load. Absent on saves with nothing in flight. */
	boomerangReturn?: { fromX: number; fromY: number; returnX: number; returnY: number; left: number; level: number; setId: string; depth: number };
	frostWand: boolean;
	wandType?: WandType;
	ghostSpawned: boolean;
	ghostType: number;
	wandmakerSpawned: boolean;
	wandmakerQuestType?: number;
	/** `Wandmaker.Quest.wand1`/`wand2`'s classes - the reward pair, rolled during level
	 *  generation and consumed when the quest is turned in, so they ride the save. */
	wandmakerWands?: [string, string];
	shopkeeperSpawned: boolean;
	shopkeeperWarned?: boolean;
	/** Per-shop shelf state, replacing the single run-global stock. `shopkeeperSpawned`
	 * stays (read-only) so pre-migration saves seed their depth-6 shop from it. */
	shopSpawnedDepths?: number[];
	shops?: [number, { potions: number; identifies: number; buyback: { id: string; quantity: number; identified?: boolean; tier?: number; level?: number; affix?: string; cursed?: boolean; cursedKnown?: boolean; seal?: boolean }[] }][];
	blacksmithSpawned?: boolean;
	impSpawned?: boolean;
	blacksmithAlternative?: boolean;
	blacksmithFavor?: number;
	blacksmithBossBeaten?: boolean;
	/** `HallsBossLevel.seal()` spent (depth 25): entrance tile + Yog already risen. */
	hallsBossSealed?: boolean;
	/** `CavesBossLevel.seal()` spent (depth 15): entrance walled + DM-300 released. */
	cavesBossSealed?: boolean;
	/** `SewerBossLevel.seal()` spent (depth 5): entrance drowned + Goo risen. */
	sewerBossSealed?: boolean;
	/** `CityBossLevel.seal()` spent (depth 20): arena bottom door locked behind the hero. */
	cityBossSealed?: boolean;
	/** Boss floors whose `unseal()` has run (depths 5/15/20/25): the auto-descent is
	 * replaced by a real walkable exit. */
	bossUnsealedDepths?: number[];
	/** `PrisonBossLevel.occupyCell()`'s `case START:` fired (depth 10): Tengu has been spawned. */
	tenguFightStarted?: boolean;
	interfaceSize?: 0 | 1;
	quickslots?: ({ id: string; instanceId?: string } | null)[];
	weaponCharge?: number;
	weaponPartialCharge?: number;
	spinSpins?: number;
	spinTurns?: number;
	cleaveFreeTurns?: number;
	guardTurns?: number;
	swordDanceTurns?: number;
	/** `Talent.CombinedLethalityAbilityTracker` - see the field's own comment. */
	clAbilityWeaponClass?: string | null;
	clAbilityWeaponInstanceId?: string;
	clAbilityTurns?: number;
	defensiveStanceTurns?: number;
	chargedShotArmed?: boolean;
	heroActionClock?: number;
	recentHitClocks?: number[];
	/** `Statistics.qualifiedForBossChallengeBadge` (run-scoped, persisted). */
	qualifiedForBossChallenge?: boolean;
	resurrectPending?: boolean;
	blacksmithPickaxeAvailable?: boolean;
	blacksmithPickaxeFree?: boolean;
	blacksmithHardens?: number;
	blacksmithUpgrades?: number;
	blacksmithSmiths?: number;
	/** `Weapon.enchantHardened`/`Armor.glyphHardened` for the equipped gear */
	weaponHardened?: boolean;
	armorHardened?: boolean;
	weaponIdentified?: boolean;
	armorIdentified?: boolean;
	blacksmithReforges?: number;
	limitedDrops?: [MonsterId, number][];
	droppedBags?: string[];
	reclaimedTrap?: TrapKind | null;
	wealthTriesToDrop?: number;
	wealthDropsToEquip?: number;
	/** Creature ids that have already received Rogue's Sucker Punch bonus this run. */
	suckerPunchTargets?: string[];
	/** Java Dungeon.LimitedDrops.UPGRADE_SCROLLS count, including suppressed NO_SCROLLS drops. */
	upgradeScrollDrops?: number;
	bag: { id: string; quantity: number; instanceId?: string; identified?: boolean; level?: number; sandBags?: number; affix?: string; cursed?: boolean; cursedKnown?: boolean; returnDepth?: number; returnBranch?: number; returnPos?: number; returnX?: number; returnY?: number;
		usesLeftToIdentify?: number; availableUsesToIdentify?: number; durability?: number; maxDurability?: number; seal?: boolean; hardened?: boolean; wandCur?: number; wandPartial?: number; wandMax?: number }[];
	/** MWG actor inventory save; `bag` remains for loading pre-migration slots. */
	bagState?: Actors.SavedInventory;
	bagDefinitions?: [string, Actors.ItemDefinition][];
		bagSources?: { id: string; instanceId?: string; sandBags?: number; charges?: number; sourceClass?: string; cursedKnown?: boolean; returnDepth?: number; returnBranch?: number; returnPos?: number; returnX?: number; returnY?: number;
		usesLeftToIdentify?: number; availableUsesToIdentify?: number; durability?: number; maxDurability?: number; seal?: boolean; blessed?: boolean; hardened?: boolean; curseInfusionBonus?: boolean; beaconCharge?: number; beaconPartialCharge?: number; wandCur?: number; wandPartial?: number; wandMax?: number; tomeCharge?: number; tomePartialCharge?: number; tomeExp?: number; tomeLevel?: number;
		/** A carried missile stack's own set id - see `src/missiles.ts`. Its `level`/`durability`/
		 * `maxDurability` ride `Actors.Inventory.toJSON` itself, so only this needs the side channel. */
		missileSet?: string;
		/** A tipped dart stack's seed (`TippedDart` only) - same side channel as the set id. */
		tippedSeed?: string }[];
	/** The staff's imbued wand class (`MagesStaff.wandClass()`), defaulting to Magic Missile. */
	staffImbue?: string;
	itemSerial?: number;
	appearances?: { assigned: [string, [string, string][]][] };
	switches: [string, boolean][];
	questStages: [string, number][];
	equippedRing?: EquippedRing | null;
	ringHtBonus?: number;
	/** Ring ids whose type (not level/curse) stands revealed - Thief's Intuition or a full identify. */
	ringTypesKnown?: string[];
	advancement?: { grantedTiers: number; balance: number; choices: [number, string][] };
	/** Per-tier talent points (T1/T2/T3/T4) - see 	alentPoints`'s own comment. */
	talentPoints?: number[];
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
	armorAbility?: string | null;
	/** `ClassArmor.charge`. Absent in saves written before the real armor abilities existed. */
	armorCharge?: number;
	/** `AscendedForm.AscendBuff`: the Cleric's temporary shield and remaining actor turns. */
	ascendedBarrierState?: { layers: { amount: number; decayPerTick?: number }[] };
	ascendedTurns?: number;
	ascendedSpellCasts?: number;
	ascendedFlashCasts?: number;
	/** Trinity's selected form/window; effect dispatch remains a documented follow-up. */
	trinityForm?: 'body' | 'mind' | 'spirit' | null;
	trinityTurns?: number;
	trinityBodyAffix?: string | null;
	/** `Endure.EndureTracker`'s own bundled fields plus its flavour countdown. */
	endureTurns?: number;
	endureEnduring?: boolean;
	endureBanked?: number;
	endureHits?: number;
	/** `HeroicLeap.DoubleJumpTracker`'s remaining turns. */
	doubleJumpTurns?: number;
	/** `NaturesPower.naturesPowerTracker`'s remaining turns and leftover extensions. */
	naturesPowerTurns?: number;
	naturesPowerExtensions?: number;
	/** `DeathMark.DoubleMarkTracker`'s presence. */
	doubleMarkArmed?: boolean;
	/** `WarpBeaconTracker`'s saved cell and the depth/branch it was placed on. */
	warpBeacon?: { x: number; y: number; depth: number; branch: number } | null;
	deferredDamage?: number;
	deferredDamageDelay?: boolean;
	corrosionTurns?: number;
	corrosionDamage?: number;
	/** `PrismaticGuard`'s HP pool (null when no guard is owed). */
	prismaticGuardHp?: number | null;
	/** `ShieldOfLightTracker.object`: the enemy id the light-shield answers to (null when down). */
	shieldOfLightTarget?: string | null;
	/** `RecallInscription.UsedItemTracker.item`: the re-castable scroll/stone class (null when down). */
	recallItemClass?: string | null;
	kineticStored?: number;
	elementalFurrow?: number;
	timeBubbleTurns?: number;
	timeBubblePresses?: number[];
	hourglassFreeze?: boolean;
	hourglassTurnsToCost?: number;
	alchemyEnergy?: number;
	heroShield?: number;
	heroBarrierState?: { layers: { amount: number; decayPerTick?: number }[] };
	livingEarthArmor?: number;
	livingEarthWandLevel?: number;
	/** `Earthroot.Armor`'s own pool and the cell it was granted on: the buff saves both in Java. */
	earthrootArmorLevel?: number;
	earthrootArmorPos?: number;
	barkskinLevel?: number;
	barkskinInterval?: number;
	barkskinCooldown?: number;
	regrowthTotalChargesUsed?: number;
	regrowthChargesOverLimit?: number;
	barrierPartialLoss?: number;
	blockingBarrierState?: { layers: { amount: number; decayPerTick?: number }[] };
	/** Legacy (pre-two-pool saves): Blocking's share used to live inside `heroBarrier`. */
	blockingShieldLeft?: number;
	blockingTurnsLeft?: number;
	sealBarrierState?: { layers: { amount: number; decayPerTick?: number }[] };
	sealPartialGain?: number;
	armorSealed?: boolean;
	weaponCurseInfusionBonus?: boolean;
	armorCurseInfusionBonus?: boolean;
	stealthTalentTicks?: number;
	/** `Talent.EMPOWERING_SCROLLS`: armed +3-level zap charges left. */
	empoweredZaps?: number;
	/** `Talent.ENHANCED_RINGS`: turns of +1 ring upgrade left. */
	enhancedRingsTurns?: number;
	/** `Talent.SEER_SHOT`: cooldown turns left. */
	seerShotCooldown?: number;
	/** `Talent.SEER_SHOT`: revealed floor indices with vision turns left (floor-scoped). */
	seerCells?: [number, number][];
	cloakChargeProgress?: number;
	cloakStealthTurnsToCost?: number;
	natureBerriesDropped?: number;
	/** `Berry.SeedCounter`: berries eaten since the last random-seed payout. */
	berryCounter?: number;
	/** `Burning.burnIncrement`: persisted progress toward the next backpack item-burn roll. */
	burningIncrement?: number;
	intuitionTracker?: boolean;
	wandBonusDamage?: number;
	physicalBonusDamage?: number;
	physicalBonusAttacks?: number;
	patientStrikeReady?: boolean;
	holdFastX?: number | null;
	holdFastY?: number | null;
	preciseAssaultReady?: boolean;
	healingEvasionTurns?: number;
	sungrassHealing?: number;
	sungrassPartial?: number;
 	healingLeft?: number;
 	healingPercent?: number;
 	healingFlat?: number;
	sungrassPos?: number;
	deathlessFuryUsed?: boolean;
	/** Timed Char buffs survive a save instead of silently clearing on reload. */
	buffs?: [BuffId, number][];
	/** `Preparation.turnsInvis`, persisted separately from the invisibility buff in Java's
	 * `storeInBundle`/`restoreFromBundle`; the derived `prepLevel` is rebuilt after load. */
	prepInvisibleTurns?: number;
	/** `MnemonicPrayer`'s once-ever extension marks (`mnemonicExtended`), same reason. */
	mnemonicExtended?: BuffId[];
	/** Mutable state for every floor already entered this run. */
	floors?: [number, FloorState][];
	/** Items that fell down a chasm and have not yet landed (`Dungeon.droppedItems`). */
	fallenItems?: [number, { kind: GroundItemKind; item?: GroundItem['item']; chest?: GroundItem['chest'] }[]][];
}

export interface BonesShape {
	depth: number;
	branch: 0 | 1;
	kind: GroundItemKind;
	item?: GroundItem['item'];
}

// -------------------------------------------------------------------- sewers

// `WardSprite` cuts six variable-width frames from wards.png, rather than a regular grid.
// Keep those exact source rectangles so the port uses the Java actor's own art at every tier.
// MWG 0.8.0's `SpriteSheet.rect` (item 326) declares those frames once per texture instead of
// cutting a fresh `Texture` per ward: asking twice returns the same cached `Texture`.
export const WARD_FRAME_RECTS = [
	{ x: 0, y: 0, width: 9, height: 10 },
	{ x: 10, y: 0, width: 11, height: 12 },
	{ x: 22, y: 0, width: 15, height: 16 },
	{ x: 38, y: 0, width: 6, height: 13 },
	{ x: 45, y: 0, width: 6, height: 15 },
	{ x: 52, y: 0, width: 9, height: 15 },
] as const;

export const wardSheets = new WeakMap<Texture, SpriteSheet>();

export function wardSheet(texture: Texture): SpriteSheet {
	const cached = wardSheets.get(texture);
	if (cached) return cached;
	const sheet = SpriteSheet.fromTexture(texture);
	WARD_FRAME_RECTS.forEach((rect, index) => sheet.rect(index, rect.x, rect.y, rect.width, rect.height));
	wardSheets.set(texture, sheet);
	return sheet;
}

export function wardTexture(texture: Texture, tier: number): Texture {
	return wardSheet(texture).get(Math.max(1, Math.min(6, tier)) - 1);
}

/**
 * `Effects.get()`'s `WOUND`/`EXCLAMATION` frames (`Effects.java`, tag `v3.3.8`):
 * the red slash (`uvRect(16, 8, 32, 16)`, tinted `hardlight(1, 0, 0)` at runtime)
 * and the `!` (`uvRect(0, 16, 6, 25)`), cut with `SpriteSheet.rect` exactly like
 * the ward frames above - `effects.png` is not a regular grid.
 */
export const EFFECT_MARK_RECTS = [
{ x: 16, y: 8, width: 16, height: 8 },
{ x: 0, y: 16, width: 6, height: 9 },
] as const;

export const effectMarkSheets = new WeakMap<Texture, SpriteSheet>();

export function effectMarkSheet(texture: Texture): SpriteSheet {
	const cached = effectMarkSheets.get(texture);
	if (cached) return cached;
	const sheet = SpriteSheet.fromTexture(texture);
	EFFECT_MARK_RECTS.forEach((rect, index) => sheet.rect(index, rect.x, rect.y, rect.width, rect.height));
	effectMarkSheets.set(texture, sheet);
	return sheet;
}
