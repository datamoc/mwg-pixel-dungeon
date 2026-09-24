// Compatibility boundary for scene callers. Rules live in simulation/; the legacy
// announcement hook remains here until the scene migration is complete. Sprites are owned by
// the scene's `spriteFor` registry (see `SIMULATION_ARCHITECTURE.md`'s "Step 6"), not by
// `Creature`/`GroundItem` here.
import type { AnyMonsterId } from './monsters';
import type { ReactionTable } from 'mwg';
import type { MultiTurnBeamSave } from 'mwg/roguelike';
import type { GroundItemKind } from './dungeonConstants';
import type { Combatant, Step } from './simulation/combatState';
import type { BuffId } from './simulation/buffs';
import { NEGATIVE_BUFFS, elementalBacklashApplies, monsterBuffImmune } from './simulation/buffs';
import { nextEntityId } from './simulation/entityId';
import { createCombatAdapter } from './adapters/combatSimulation';
import { simulationRandom } from './adapters/mwgRandom';
import { STATUS_IMMUNITIES } from './simulation/mwlStatusImmunities';
export { INFINITE_ACCURACY, INFINITE_EVASION, ASCENSION_MOD, accRollMulti, setAscensionActive, stoneGlyphReduction, grimTrapDamage, explosiveTrapBounds } from './simulation/combat';
export { BUFF_DURATION, NEGATIVE_BUFFS, absorbShield, electricDamageHalved, elementalBacklashApplies, icyDamageHalved, type BuffId } from './simulation/buffs';

const combat = createCombatAdapter(simulationRandom);
export const rollHit = combat.rollHit;
export const rollDamage = combat.rollDamage;
export const tickBuffs = combat.tickBuffs;

export type { Step } from './simulation/combatState';

/** a creature on the map - the hero and every monster share this shape */
export interface Creature extends Combatant {
	name: string;
	/** Internal combat provenance; thrown missiles use the Sniper shared-enchantment gate. */
	attackMode?: 'melee' | 'throw';
	/** Derived from the equipped Brimstone glyph; Java's `Char.isImmune(Burning)` path. */
	fireImmune?: boolean;
	/** Derived from AntiMagic; blocks the ported magical status applications. */
	magicImmune?: boolean;
	/** `Bleeding.source` (`Bleeding.java`, tag `v3.3.8`): which producer set the currently-active
	 * bleed, used only for death-consequence branching (see `setBleeding`). Follows the same
	 * max-wins overwrite as the level itself. */
	bleedSource?: 'chasm' | 'sacrificial' | 'harvestBleed';
	/** Java Mob.target: persistent random destination while the mob is wandering. */
	patrolTarget?: { x: number; y: number };
	/**
	 * Java Mob.target while hunting: the last cell where the mob saw the hero, refreshed
	 * every seen turn. A mob that loses sight paths here before giving up to wandering
	 * (`Mob.Hunting`), instead of patrolling immediately.
	 */
	lastSeen?: { x: number; y: number };
	/**
	 * Java's per-char `Swiftthistle.TimeBubble`: the owner's own spends absorb into
	 * this counter (`Char.spendConstant`) instead of advancing its scheduler clock,
	 * so it acts repeatedly while everything else waits. Delayed presses still
	 * belong to the hero's bubble only (`Level.pressCell` reads the hero's buff).
	 */
	timeBubbleTurns?: number;
	/** Ratmogrify's temporary wrapper: the original kind/stats remain intact while abilities are disabled. */
	ratmogrifiedTurns?: number;
	ratmogrifiedPermanent?: boolean;
	/**
	 * `DeathMark.DeathMarkTracker`'s two payload fields. Java keeps them on the buff; this port's
	 * buff map holds durations only, so the mark's countdown and the target's HP when it was first
	 * marked live here, alongside the other per-creature payloads. `deathMarkTurns > 0` is the
	 * creature's `deathMarked` flag, i.e. Java's `isAlive()` returning true at zero HP.
	 */
	deathMarkTurns?: number;
	/** `Challenge.DuelParticipant.takenDmg`: the hero's own accumulated duel damage,
	 * feeding `INVIGORATING_VICTORY`. Lives on the hero; reset when the duel ends. */
	duelTakenDmg?: number;
	/**
	 * `ShieldOfLight.ShieldOfLightTracker.object` (`actors/hero/spells/ShieldOfLight.java`,
	 * tag `v3.3.8`): the enemy id the hero's light-shield answers to. Java keeps it on
	 * the buff; this port's buff map holds durations only, so it lives here with the
	 * other per-creature payloads. Meaningful only while `buffs['shieldOfLight']` is up.
	 */
	shieldOfLightTarget?: string;
	/**
	 * `RecallInscription.UsedItemTracker.item` (`actors/hero/spells/RecallInscription.java`,
	 * tag `v3.3.8`): the re-castable scroll/stone sourceClass. Java keeps it on the
	 * buff; this port's buff map holds durations only, so it lives here with the
	 * other per-creature payloads. Meaningful only while `buffs['recallUsed']` is up.
	 */
	recallItemClass?: string;
	deathMarkInitialHp?: number;
	/**
	 * `Sungrass.Health` (`plants/Sungrass.java`, tag `v3.3.8`): the gradual-heal pool a
	 * non-Warden char gains from Sungrass - `boost(HT)` adds max HP to `sungrassLevel`,
	 * `sungrassPartial` accrues `(40+HT)/150` per own turn, and `sungrassPos` is the grant
	 * cell the buff ends on leaving. This port's buff map holds durations only, so the pool
	 * lives here, alongside the other per-creature payloads above.
	 */
	sungrassLevel?: number;
	sungrassPartial?: number;
	sungrassPos?: number;
	/**
	 * `Earthroot.Armor` (`plants/Earthroot.java`, tag `v3.3.8`): the keep-max block pool of
	 * the char's max HP, absorbing `min(damage, (depth+5)/2)` per landed attack hit and
	 * ending on leaving `earthrootArmorPos` or exhaustion. Same payload treatment as the
	 * sungrass pool above.
	 */
	earthrootArmorLevel?: number;
	earthrootArmorPos?: number;
	/** `Barkskin`'s independent armor roll and actor-time decay state. */
	barkskinLevel?: number;
	barkskinInterval?: number;
	barkskinCooldown?: number;
	/** Viscosity's accumulated deferred damage and its one-turn initial delay. */
	deferredDamage?: number;
	deferredDamageDelay?: boolean;
	/** `Corrosion`'s remaining actor turns and current increasing damage value. */
	corrosionTurns?: number;
	corrosionDamage?: number;
	/** mwg/roguelike's Scheduler.Actor speed: 1 for the hero (a weapon's `DLY` rides the attack cost instead) */
	speed?: number;
	/** A statue's weapon `DLY` (`Statue.attackDelay()`): the cost multiplier of one of its swings. */
	attackDelay?: number;
	/** A statue's weapon `RCH` (`Statue.canAttack()`): how many cells away it can strike. Absent = 1. */
	reach?: number;
	/** A statue's weapon enchantment class (`StatueEnchant`) and the weapon's level, read by `statueEnchantProc`. */
	statueEnchant?: string;
	statueLevel?: number;
	/** `Blocking`'s `BlockBuff` on a statue: the shield pool and the turns left before it lapses. */
	blockShield?: number;
	blockTurns?: number;
	/**
	 * `DivineIntervention.DivineShield` (tag `v3.3.8`): an ally's ShieldBuff that never decays,
	 * absorbs ahead of priority-0 shields (`shieldUsePriority = 1`), and reads as zero - then is
	 * detached - once the hero's AscendBuff is gone.
	 */
	divineShield?: number;
	/** which MONSTERS entry this is, for its sprite and (for Goo) its special turn logic - absent on the hero */
	kind?: AnyMonsterId;
	/** Goo's pump-up counter: 0 idle, 1 first charge turn, 2 primed to unleash next turn - `Goo.java`'s `pumpedUp` field */
	pumped?: number;
	/** Goo.java's water-healing increment; STRONGER_BOSSES ramps this from 1 to 3. */
	gooHealInc?: number;
	/** Monk.java's floating Focus cooldown, reduced by action time and extra movement time. */
	focusCooldown?: number;
	/** NPCs (ghost/wandmaker/shopkeeper): bumping into them opens dialogue instead of combat */
	isNPC?: boolean;
	/** Java Char.flying: Swarm is the currently ported monster that can occupy chasms. */
	flying?: boolean;
	/** `DirectableAlly.attacksAutomatically`: false for the spirit hawk, which Java keeps from
	 *  picking its own fights - it only ever attacks a target the hero directed it at. Absent
	 *  means true, Java's own default. */
	attacksAutomatically?: boolean;
	/** Java-aligned friendly combatant (MirrorImage and the directable allies). */
	isAlly?: boolean;
	/** Friendly summon subtype; sheep are neutral, short-lived and non-combatant. */
	allyKind?: 'mirror' | 'sheep' | 'ward' | 'earthGuardian' | 'lotus' | 'ghost' | 'ninjaLog' | 'spiritHawk' | 'lightAlly' | 'afterImage' | 'shadowClone' | 'prismatic';
	/** `PowerOfMany.LightAlly`'s Java hero class, used to rebuild its class-specific sprite. */
	lightAllyClass?: 'warrior' | 'mage' | 'rogue' | 'huntress' | 'duelist';
	/** `PowerOfMany`'s Barrier pool and Barrier.partialLostShield actor state. */
	powerOfManyBarrier?: number;
	powerOfManyBarrierPartial?: number;
	/**
	 * `PrismaticGuard`'s HP pool (`actors/buffs/PrismaticGuard.java`, tag `v3.3.8`):
	 * the latent image's health, capped at `prismaticGuardMaxHp(hero level)`. Present
	 * means the guard is active; the `prismaticGuard` buff-map entry alongside it is
	 * only the status-pane icon (re-armed every hero turn, Java's `spend(TICK)`
	 * persistence). The guard absorbs nothing - it hatches into the image, it is
	 * not a shield. Persisted through save/load like the other pools above.
	 */
	prismaticGuardHp?: number;
	/**
	 * `PrismaticImage`'s post-death fade (`deathTimer`, same source): a non-chasm
	 * killing blow sets 0 HP plus this 5-turn countdown instead of destroying the
	 * actor. Healing above 0 clears it (the next image turn resets); reaching 0
	 * destroys it. Chasm deaths skip the fade entirely. Persisted with the ally.
	 */
	prismaticFade?: number;
	/** `DirectableAlly.defendingPos`/`enemy`: the standing order a hero gives a directable ally
	 *  (the Dried Rose's `AC_DIRECT` order, and the spirit hawk's re-cast). An ordered attack
	 *  target wins over the nearest hostile, and an ordered defend cell replaces the hero as the
	 *  ally's fallback destination - see `takeAllyTurn`'s directable branch. Neither is persisted:
	 *  Java saves them on the ally, which this port cannot do without a per-creature id, so a
	 *  save/load drops a standing order (the ally simply follows the hero again). */
	allyDefendCell?: { x: number; y: number };
	allyTargetChar?: Creature;
	/** `SpiritHawk.HawkAlly`'s two instance fields: the `SWIFT_SPIRIT` dodge pool already spent,
	 *  and its 100-unit lifespan. Java keeps them on the ally rather than in a stat, so they live
	 *  here too - and, like the two order fields above, are not persisted. */
	spiritHawkDodges?: number;
	spiritHawkTime?: number;
	sheepTurns?: number;
	/** `WandOfWarding.Ward`'s persistent tier, wand level, and zap count. */
	wardTier?: number;
	wardWandLevel?: number;
	wardTotalZaps?: number;
	/** `WandOfLivingEarth.EarthGuardian`'s persistent wand level and hero-derived defense. */
	earthGuardianWandLevel?: number;
	earthGuardianDefense?: number;
	npcKind?: 'ghost' | 'wandmaker' | 'shopkeeper' | 'blacksmith' | 'imp' | 'ratKing' | 'impShopkeeper';
	/** `ImpShopkeeper.seenBefore`: the first-sight greeting yell fires once. Persisted like
	 *  every other creature flag below (see `captureActiveFloor`). */
	impShopkeeperGreeted?: boolean;
	/** GnollTrickster.combo: attacks escalate the longer it keeps hitting */
	combo?: number;
	/** GreatCrab.moving: only really advances every 3rd turn */
	moving?: number;
	/** Necromancer.mySkeleton: its summoned skeleton, null until it summons one */
	skeleton?: Creature | null;
	/** Necromancer.firstSummon: true until this necromancer has ever summoned once - its real
	 * `spend(firstSummon ? TICK : 2*TICK)` only costs double from its second summon onward. */
	firstSummon?: boolean;
	/** `Wraith.level`, set by `adjustStats()` at spawn and persisted (`storeInBundle`). */
	wraithLevel?: number;
	/** Tengu.arenaJumps: how many times it has relocated this fight */
	arenaJumps?: number;
	/** `PrisonBossLevel.State` collapse for this port's single arena: `cell` is Java's
	 * FIGHT_START (the small Tengu cell - warps and dart fills, no abilities), `arena` is
	 * FIGHT_ARENA (5-7 relocations, abilities, `arenaJumps`). Latched at HP <= HT/2. */
	tenguPhase?: 'cell' | 'paused' | 'arena';

	/**
	 * `Tengu.FireAbility`: the `PathFinder.CIRCLE8` index of the cone's direction and the ring of
	 * cells it has reached so far, grown one ring per Tengu turn. Java keeps both on a `Buff` that
	 * acts with its host; the port keeps them on the creature the buff belonged to.
	 */
	/** An in-progress Tengu fire cone: the `CIRCLE8` direction it was aimed in, plus MWG's
	 * `MultiTurnBeam.toJSON()` payload (the ring-per-turn traversal this used to hand-roll). */
	tenguFire?: { direction: number; beam: MultiTurnBeamSave };
	/** Tengu's phase-2 bomb-ability countdown (Java's `abilityCooldown`, bomb-first rotation). */
	tenguAbilityCd?: number;
	/** Tengu's persisted phase-2 ability count, used to keep Bomb/Shocker ordering across saves. */
	tenguAbilityUses?: number;
	/** Tengu.lastAbility: the id of the previous phase-2 ability, so a repeat is rerolled 9/10. */
	tenguLastAbility?: number;
	/** Active logical ShockerAbility actors; Java stores these as buffs on Tengu. */
	tenguShockers?: { x: number; y: number; ordinals: boolean; turns: number }[];
	/** MeleeWeapon upgrade level: min/max grow as tier+lvl / 5(tier+1)+lvl(tier+1) */
	weaponLevel?: number;
	/** Thief.item: what it stole (dropped again on death); Swarm split generation (EXP=0 past 0) */
	stolen?: string | null;
	/** Mimic.java's generated bonus item, carried until the mimic dies. */
	mimicLoot?: string;
	/** `MasterThievesArmband.StolenTracker` (tag `v3.3.8`): a one-shot marker set the first time
	 * this creature is targeted by `AC_STEAL`, win or lose - real Java's `CounterBuff` tracks a
	 * 0/1 count so a second steal attempt against the same mob can never roll loot again, only
	 * still apply the disorient debuff. This port keeps the same "ever attempted" semantics as a
	 * plain boolean, since the count only ever gates on `> 0`. */
	armbandStolen?: boolean;
	/** CrystalMimic's neutral chest has revealed itself but may not have stolen yet. */
	mimicRevealed?: boolean;
	/** Java Haste duration after a CrystalMimic reveal, measured in its own turns. */
	hasteTurns?: number;
	/** Original scheduler speed restored when the temporary Haste expires. */
	hasteBaseSpeed?: number;
	generation?: number;
	/** DemonSpawner.spawnCooldown: turns until its next RipperDemon spawn attempt, clamped at
	 *  -20; also reduced by damage taken (see `attack()`'s demonSpawner branch). Undefined until
	 *  its first turn, at which point `tickDemonSpawner` seeds it at 60. */
	spawnCooldown?: number;
	/** `Mob.enemySeen`, sampled at the start of this mob's most recent turn. A monster which
	 * moved around a blind corner (especially into a doorway) remains vulnerable until it gets
	 * another turn to notice the hero. */
	seesHero?: boolean;
	/** Generic `Mob.Fleeing` state. Thief/Bandit derive it from `stolen` (see
	 * `takeMonsterTurn`); Spinner sets it directly from `Spinner.attackProc()`. */
	fleeing?: boolean;
	/** `Brute.hasRaged`: true once it has used its one-time near-death revival this fight. */
	hasRaged?: boolean;
	/** Currently past that revival, boosting `damageRoll()` to 15-40 (`Brute.BruteRage` active). */
	raged?: boolean;
	/** `Guard.chainsUsed`: a Guard may only pull the hero with its chains once, ever. */
	chainUsed?: boolean;
	/** `DM200.ventCooldown`: turns until it may seed toxic gas along a line to the hero again. */
	ventCooldown?: number;
	/** `Spinner.webCoolDown`: turns until it may shoot another web at the hero. */
	webCooldown?: number;
	/** `Golem.enemyTeleCooldown`: turns until it may teleport the hero away again. */
	golemTeleCooldown?: number;
	/** `Golem.selfTeleCooldown`: turns until its wandering reposition teleport is available. */
	golemSelfTeleCooldown?: number;
	/** `Eye.beamCharged`/`beamCooldown`: DeathGaze's two-turn charge-then-fire cycle. */
	beamCharged?: boolean;
	beamCooldown?: number;
	/** `RipperDemon.leapPos`/`leapCooldown`/`lastEnemyPos`: the two-turn telegraphed pounce.
	 * `leapTarget` is the armed landing cell (null/undefined = no leap pending);
	 * `leapLastEnemy`/`leapPrevEnemy` are the hero's cell on the previous two turns, rotated
	 * by the pre-turn hook so the trigger can tell a moved enemy (cut off at the far side)
	 * from a stationary one (aimed at directly). */
	leapTarget?: { x: number; y: number } | null;
	leapCooldown?: number;
	leapLastEnemy?: { x: number; y: number };
	leapPrevEnemy?: { x: number; y: number };
	/** `Succubus.blinkCooldown`: turns until she may blink to the hero again (4-6 reset). */
	blinkCooldown?: number;
	/** `Elemental.rangedCooldown` (3-5 turns) and `NewbornFireElemental.targetingPos`: the
	 * telegraphed fireball's charge state. Only the newborn uses the targeted cell. */
	rangedCooldown?: number;
	newbornTarget?: { x: number; y: number } | null;
	/** `ArmoredBrute.ArmoredRage.act()`'s own `spend(3*TICK)`: counts up while `raged`, decaying
	 * the shield only every 3rd turn instead of every turn like the base `Brute.BruteRage`. */
	armoredRageTicks?: number;
	/** `PinCushion`: thrown missiles stuck in this living target, scattering back out as
	 * ground heaps when it dies (knives and spikes; stones are sticky=false and drop). */
	stuckAmmo?: number;
	/** `SentryRoom$Sentry.curChargeDelay`: turns of charge-up left before the beam starts
	 * firing every visible turn (undefined = idle, reset whenever the hero leaves sight). */
	sentryWarmup?: number;
	/** Initial `SentryRoom$Sentry.initialChargeDelay`, supplied by the painted room. */
	sentryInitialWarmup?: number;
	/** Pylon.java's neutral/active alignment and clockwise shock cursor. */
	pylonActive?: boolean;
	pylonTargetNeighbor?: number;
	/** DM300's GAS/ROCKS ability state (`turnsSinceLastAbility`/`abilityCooldown`/`lastAbility`). */
	dmAbilityTurns?: number;
	dmAbilityCd?: number;
	dmLastAbility?: number;
	/** DM300.java's persisted overcharge state and number of pylons activated so far. */
	dmSupercharged?: boolean;
	dmPylonsActivated?: number;
	dmBarrier?: number;
	/** DwarfKing phase machine (1/2/3), summon/ability cooldowns, P2 shield. */
	kingPhase?: number;
	kingSummonsMade?: number;
	kingSummonCd?: number;
	kingAbilityCd?: number;
	kingLastAbility?: number;
	kingShield?: number;
	kingWaveCd?: number;
	/** `maxLvl = -2` summons (the King's servants): no XP, no loot. */
	noExp?: boolean;
	/** P2-wave King servants carrying `KingDamager` (chip the P2 shield on death). */
	kingDamager?: boolean;
	/** Edge-triggered phase-1->2, phase-2->3, and losing-yell rules (`mwg/core`'s
	 * `ReactionTable`), lazily built per King instance in `takeKingTurn`. Not part of the
	 * plain `SavedCreature` field list - its own `toJSON()`/`fromJSON()` round-trip is wired
	 * separately in `captureActiveFloor`/`restoreFloor`. */
	kingReactions?: ReactionTable<Creature>;
	/** YogDzewa phase (1-5; 0-dormancy unmodeled, wakes on entry). */
	yogPhase?: number;
	/** YogFist.java's six concrete fist subclasses, selected by Yog's summon deck. */
	yogFistType?: 'burning' | 'soiled' | 'rotting' | 'rusted' | 'bright' | 'dark';
	/** Elemental.random()'s concrete subtype, retained by the compact shared sprite/AI carrier. */
	elementalType?: 'fire' | 'frost' | 'shock' | 'chaos';
	/** Shaman.random()'s red/blue/purple spell subtype, retained by the shared sprite carrier. */
	shamanType?: 'red' | 'blue' | 'purple';
	yogSummonCd?: number;
	yogSummonIndex?: number;
	/** `YogDzewa.regularSummons`: the per-fight minion deck, built once from the live
	 * spawner count and cycled draw-and-replace. `AnyMonsterId` here (the scene widens
	 * the sim module's own narrow union on store). */
	yogMinionDeck?: AnyMonsterId[];
	yogBeamCd?: number;
	/** `YogFist.rangedCooldown` (a float bundle field, 0 on a fresh fist): the four
	 * elemental fists (burning/soiled/rotting/rusted) add `NormalFloat(8, 12)` on every
	 * zap and tick it down 1 per unparalysed turn; bright/dark override the increment
	 * to a no-op so they zap every ranged turn. While it is above 0 `canAttack` only
	 * allows melee, so a cooling fist must advance instead of zapping. */
	fistZapCd?: number;
	/** `YogDzewa.targetedCells`: cells DeathGaze has painted but not yet fired along (cell indices). */
	yogTargeted?: number[];
	/** `YogDzewa.fistSummons`/`challengeSummons`: the remaining per-gate fist identities. The
	 * normal deck holds one fist from each opposed pair; the challenge deck holds the paired
	 * counterparts, arranged so two of a pair never open together. */
	yogFistDeck?: string[];
	yogChallengeDeck?: string[];
	/** `Bee`'s pot anchor (`setPotInfo`): where the pot broke, and whose held inventory
	 * it lives in (creature id; absent for a ground pot, Java's -1). The bee defends the
	 * pot, not a free hunt - see `takeBeeTurn`. */
	potPos?: { x: number; y: number };
	potHolderId?: string;
	/** The Blacksmith GNOLL mine quest's links (`GnollGuard.sapperID`,
	 * `GnollGeomancer.sapperID`, `GnollSapper.partnerID`): the partner's creature id. */
	gnollPartnerId?: string;
	/** `GnollSapper.spawnPos`, a raw cell index. */
	gnollSpawnCell?: number;
	/** `GnollSapper`/`GnollGeomancer.abilityCooldown`, a Java `int`: `damage()`'s `-= dmg/10f`
	 * narrows back through `(int)`, truncating toward zero (`gnollMineAfterDamage`). */
	gnollAbilityCd?: number;
	gnollLastRockfall?: boolean;
	/** Boulders queued to be thrown on the thrower's next act (`throwingRockFromPos`, or the
	 * geomancer's `throwingRocksFromPos` array) at `gnollThrowTo`, all raw cell indices. */
	gnollThrowFrom?: number[];
	gnollThrowTo?: number;
	/** The `TargetedCell` warnings of the queued throws, drawn until they resolve. */
	gnollWarnCells?: number[];
	/** `GnollGeomancer.hits` (every pickaxe strike on its rock armour, asleep or re-armoured) and `sapperSpawns`. */
	geomancerHits?: number;
	geomancerSapperSpawns?: number[];
	/** `GnollGeomancer.RockArmor`, a `ShieldBuff` pool. */
	rockArmor?: number;
	/** The Blacksmith CRYSTAL mine quest (`crystalMine.ts`): each actor's constructor-rolled
	 * `Blue`/`Green`/`Red` sprite class (`Random.Int(3)`), 0-2. */
	crystalTint?: number;
	/** `CrystalGuardian.recovering`: crumpled at 1 HP, healing 5 a turn back to full. */
	guardianRecovering?: boolean;
	/** `CrystalSpire.hits` (pickaxe strikes), `abilityCooldown` (a Java `float`) and
	 * `targetedCells` (the queued spike waves, raw cell indices). */
	spireHits?: number;
	/** The spire's real HP, which only the pickaxe lowers (`CrystalSpire.damage()` zeroes every other
	 * source): any other seam that subtracts `hp` directly is undone against it (`crystalMine.ts`). */
	spireHp?: number;
	spireAbilityCd?: number;
	spireTargets?: number[][];
}

/** makes a Creature-shaped object with the combat-state fields every spawn needs.
 * `id` is optional at call sites - it defaults to a fresh one, since no caller today has a
 * reason to name its own (see `entityId.ts`). `boss`/`miniboss` are *not* derived here: this
 * module deliberately carries no runtime dependency on the monster catalogue (the simulation
 * harness compiles it without `monsters.ts`, which needs Pixi), so the spawn site supplies them
 * from `BOSS_KINDS`/`MINIBOSS_KINDS` - see `spawnMonster`, the one factory every monster,
 * including a save-restored one, goes through. */
export function baseCreature(init: Omit<Creature, 'buffs' | 'id'> & { buffs?: Creature['buffs']; id?: Creature['id'] }): Creature {
	const { buffs, id, ...rest } = init;
	return { id: id ?? nextEntityId(rest.isHero ? 'hero' : 'actor'), sleeping: true, champion: null, ...rest, buffs: { ...(buffs ?? {}) } };
}

/** an item lying on the floor, picked up by stepping onto its cell - see `pickupGroundItemAt` */
export interface GroundItem extends Step {
	/** Stable across the object's lifetime; see `entityId.ts`. */
	id: string;
	kind: GroundItemKind;
	/** Java Heap.Type.CHEST/CRYSTAL_CHEST; contents are opened instead of auto-picked up. */
	chest?: 'normal' | 'locked' | 'crystal';
	/** Java Heap.Type.FOR_SALE: a shop stand - priced, never free loot. */
	forSale?: boolean;
	/**
	 * `MissileWeapon` lineage for thrown-ammo heaps (see `src/missiles.ts`): the `missileLevel`
	 * the heap was scattered or dropped at, and the missile set it belongs to. Absent on every
	 * other heap - including pre-rule saves, which therefore stay always-valid pickups.
	 */
	missileLevel?: number;
	missileSet?: string;
	/** A scattered tipped-dart heap's tip seed (`TippedDart` only) - same side channel as the set. */
	tippedSeed?: string;
	/** Concrete inventory payload; absent only for legacy scripted/cosmetic drops. */
	item?: { id: string; quantity: number; level?: number; tier?: number; sandBags?: number; charges?: number; affix?: string; cursed?: boolean; cursedKnown?: boolean; identified?: boolean; instanceId?: string; sourceClass?: string; depth?: number;
		usesLeftToIdentify?: number; availableUsesToIdentify?: number; durability?: number; maxDurability?: number; seal?: boolean;
		/** A carried missile stack's own set id (see `src/missiles.ts`) - the legend half of its
		 * `instanceId`, on the payload because that is what a picked-up heap carries into the bag. */
		missileSet?: string;
		/** A tipped dart stack's seed (`TippedDart` only) - same side channel as the set id. */
		tippedSeed?: string;
		/** `Bomb.Fuse`: lit bombs count down 2 hero turns on the ground, then detonate. */
		fuseTurns?: number;
		/** `Noisemaker.NoisemakerFuse`: after its fuse burns out the bomb arms instead of
		 * exploding; it then detonates on contact and screams every 6 acts. Both persist with
		 * the heap. */
		noisemakerArmed?: boolean;
		noisemakerAlertIn?: number;
		/** Tengu's `BombAbility` ordnance: a 3-turn fuse and the range-2 scaled blast. */
		tenguBomb?: boolean };
}

/**
 * Announces a buff as it lands, `Buff.java`'s `announced` flag - Java shows the buff's name
 * over the creature through `CharSprite.showStatus`.
 *
 * A hook rather than a direct call because `addBuff` is module-level and has 60-odd call
 * sites, none of which hold a scene reference; the live scene installs itself here instead
 * of every site growing an argument. Buffs the port applies before a scene exists simply
 * announce nothing.
 */
export let announceBuff: ((c: Creature, id: BuffId) => void) | null = null;

export function setAnnounceBuff(hook: ((c: Creature, id: BuffId) => void) | null): void {
	announceBuff = hook;
}

/**
 * Where attach-time backlash damage lands. `addBuff`/`reigniteBuff` are module-level
 * with dozens of scene call sites, none of which could show the damage or run the
 * death path - so like `announceBuff` above, the live scene installs itself here
 * (show the number, kill at zero) instead of every site growing a branch. Buffs the
 * port applies before a scene exists simply subtract HP with no presentation.
 */
export let attachBacklash: ((c: Creature, damage: number) => void) | null = null;

export function setAttachBacklash(hook: ((c: Creature, damage: number) => void) | null): void {
	attachBacklash = hook;
}

/** `Elemental.add(Buff)`'s damage half (`actors/mobs/Elemental.java`, tag `v3.3.8`):
 * a hate-listed opposite-element attach deals `NormalIntRange(HT/2, HT*3/5)` with
 * the buff as the source instead of attaching. Returns the damage dealt, 0 when the
 * pairing is not a backlash (and nothing is attached either way here - callers still
 * route the ordinary path through `buffBlocked`). HT is the port's `maxHp`
 * (60 on every real elemental); the inclusive Java range rides the same exclusive-
 * upper-bound `int()` vehicle `advanceBuffs` uses for Burning's own NormalIntRange.
 * Simplified and stated: the damage bypasses aura/shield reductions - it lands raw,
 * the way this module's other direct HP writes do. */
export function applyElementalBacklash(c: Creature, id: BuffId): number {
	if (!elementalBacklashApplies(c.kind, c.elementalType, id)) return 0;
	const damage = simulationRandom.int(Math.floor(c.maxHp / 2), Math.floor(c.maxHp * 3 / 5) + 1);
	c.hp -= damage;
	attachBacklash?.(c, damage);
	return damage;
}

/**
 * Which buffs are worth announcing. `Buff.java` sets `announced` per subclass, so this is
 * not a blanket "all of them": the ones left out here are the ones the hero applies to
 * itself knowingly (`cloak`, `bless`) or that re-land every turn, where a number rising off
 * the sprite each turn would be noise rather than information.
 */
export const ANNOUNCED_BUFFS = new Set<BuffId>([
	'burning',
	'poison',
	'bleeding',
	'ooze',
	'cripple',
	'weakness',
	'vulnerable',
	'daze',
	'hex',
	'berserk',
	'fury',
	'degrade',
]);

/**
 * `Char.isImmune()`'s three class lists, authored in `src/content/resistance-rules.mwl` and
 * generated into `simulation/mwlStatusImmunities.ts` so this compatibility module keeps its
 * framework-free, type-only-`mwg` import boundary. Membership replaces the hardcoded
 * `id === '...'` chains these checks used to be, so adding a newly ported immunity is a data
 * change, not a code change here.
 */
const FIRE_IMMUNITY_BUFFS = new Set<string>(STATUS_IMMUNITIES.fire);
const MAGIC_IMMUNITY_BUFFS = new Set<string>(STATUS_IMMUNITIES.magic);
const CHILL_IMMUNITY_BUFFS = new Set<string>(STATUS_IMMUNITIES.chill);

/** The immunity gates Java applies before a buff can attach, shared by `addBuff`,
 * `reigniteBuff`, and every direct negative-buff write below so no caller can route
 * around them (`Char.add()` refuses in Java no matter which `affect`/`prolong` path
 * the application took - the Cleanse clause included). */
export function buffBlocked(c: Creature, id: BuffId): boolean {
	//`Feint.AfterImage.add(Buff)` (tag `v3.3.8`) returns false unconditionally - the decoy
	//takes no buffs at all. It is spawned on the `rat` kind, so no MWL row can carry this;
	//the gate lives here, where every buff application funnels through.
	if (c.allyKind === 'afterImage') return true;
	//`Sheep.add(Buff)` (tag `v3.3.8`) returns false unconditionally - the sheep
	//takes no buffs at all. Same shared boundary as the decoy above.
	if (c.allyKind === 'sheep') return true;
	//`SentryRoom$Sentry.add()` (tag `v3.3.8`) likewise returns false - the beam
	//turret takes no buffs either. Its `damage()` no-op rides the blob/bomb
	//skips below (melee and zaps already defeat themselves on its infinite
	//evasion, the same shape as the sheep's).
	if (c.kind === 'sentry') return true;
	//`GnollGeomancer.add()` (tag `v3.3.8`) refuses every buff while it is `SLEEPING` - its own
	//`RockArmor`/`DelayedRockFall` aside, which this port keeps as plain fields, not buffs.
	if (c.kind === 'gnollGeomancer' && c.sleeping) return true;
	//`CrystalSpire.add()` returns false unconditionally: "immune to all buffs and debuffs".
	if (c.kind === 'crystalSpire') return true;
	//`PowerOfMany.LightAlly` has `Property.INORGANIC` (tag `v3.3.8`), which refuses Bleeding
	//and Poison just like the other inorganic mobs; LightAlly is a rat scheduler carrier, so its
	//property cannot come through the kind-keyed `monsterStatusImmunities` table.
	if (c.allyKind === 'lightAlly' && (id === 'bleeding' || id === 'poison')) return true;
	//Every quest-giver/shop NPC's `add(Buff)` returns false unconditionally (tag
	//`v3.3.8`): `RatKing`, `Shopkeeper`, `Ghost`, `Wandmaker`, `Blacksmith` and
	//`Imp` (plus the `ImpShopkeeper` subclass, which inherits `Shopkeeper`'s).
	//No NPC can ever be buffed - or debuffed - by anything. The flag is MWL's
	//`npc` actor set, so all seven ids refuse here through the one `isNPC` bit.
	if (c.isNPC) return true;
	//`Elemental.add(Buff)` (tag `v3.3.8`) returns false for hate-listed opposite-
	//element attaches (Fire: Frost/Chill; Frost: Burning) - the damage half rides
	//`applyElementalBacklash` at the `addBuff`/`reigniteBuff` boundary, this refusal
	//covers the direct-write sites that consult only this gate and never that one.
	if (elementalBacklashApplies(c.kind, c.elementalType, id)) return true;
	//Brimstone.java grants Burning immunity through Char.isImmune(), before the
	//effect can be attached. Keep this check at the shared buff boundary so fire
	//from traps, blobs, wands, plants, and enemy attacks all obey it.
	if (FIRE_IMMUNITY_BUFFS.has(id) && c.fireImmune) return true;
	//`FireImbue.attachTo()`: the imbued holder detaches Burning on attach and is immune
	//to it while the imbue lasts (`immunities.add(Burning.class)`). Not expressible in
	//the data table above (that gates buffs refused *by* fiery creatures, not the
	//holder immunity an imbue grants), so it lives here at the same shared boundary.
	if (id === 'burning' && c.buffs.fireImbue !== undefined) return true;
	//`ToxicImbue` (`actors/buffs/ToxicImbue.java`, tag `v3.3.8`) refuses both
	//Poison and ToxicGas for its holder. The gas half is checked by the blob
	//reader as well, while this gate prevents poison sources bypassing it.
	if (id === 'poison' && c.buffs.toxicImbue !== undefined) return true;
	//AntiMagic.RESISTS (items/armor/glyphs/AntiMagic.java): these status classes
	//are magical in Java and are rejected before attachment. Damage-source
	//resistance is handled separately by the scene's explicit magical flag.
	if (MAGIC_IMMUNITY_BUFFS.has(id) && c.magicImmune) return true;
	//Frost.java declares immunity to Chill: a frozen creature cannot be slowed again.
	if (CHILL_IMMUNITY_BUFFS.has(id) && c.buffs.frost !== undefined) return true;
	//`Char.add()`'s cleansing clause (tag `v3.3.8`): while the Cleanse immunity runs,
	//NEGATIVE applications are refused outright. `AllyBuff`/`LostInventory` have no
	//port model, so their exclusions are vacuous - stated, not silent.
	if (c.buffs['cleanseImmunity'] !== undefined && NEGATIVE_BUFFS.has(id)) return true;
	//`Char.isImmune()`'s mob half (`resistance-rules.mwl`'s `monsterStatusImmunities` table):
	//per-kind refusals (INORGANIC/STATIC/ACIDIC/FIERY properties plus the instance lists)
	//that travel with the kind through every caller above, since all of them funnel here.
	return monsterBuffImmune(c.kind, c.yogFistType, id);
}

/** `Buff.affect(c, id, duration?)`: set the duration (the table's own unless overridden). */
export function addBuff(c: Creature, id: BuffId, duration?: number): void {
	//`Elemental.add()`'s hate-listed attaches never land - they backlash instead.
	if (applyElementalBacklash(c, id) > 0) return;
	if (buffBlocked(c, id)) return;
	const event = combat.addBuff(c, id, duration);
	if (event.fresh && announceBuff && ANNOUNCED_BUFFS.has(id)) announceBuff(c, id);
}

/** `Burning.reignite(c, duration?)`: raise the remaining time to `duration` only when it is
 * shorter - see `simulation/buffs.ts`'s `reigniteBuff`. Used by fire itself, which re-arms the
 * burn on every creature standing in it, every turn. */
export function reigniteBuff(c: Creature, id: BuffId, duration?: number): void {
	//Same backlash-first shape as `addBuff` above - fire re-arms Burning every turn,
	//so a frost elemental standing in flames takes the backlash, never the buff.
	if (applyElementalBacklash(c, id) > 0) return;
	if (buffBlocked(c, id)) return;
	const event = combat.reigniteBuff(c, id, duration);
	if (event.fresh && announceBuff && ANNOUNCED_BUFFS.has(id)) announceBuff(c, id);
}

/** `Buff.affect(..., Bleeding).set(level, source)`: retain the strongest active bleed,
 * updating `source` only alongside a winning level (Java's `set()` writes both fields
 * inside the same `if (this.level < level)` guard). `source` is used only by the death
 * consequences `Bleeding.act()` branches on - see `PORT_COVERAGE.md`'s Chasm row. */
export function setBleeding(c: Creature, level: number, source?: Creature['bleedSource']): void {
	if (buffBlocked(c, 'bleeding')) return;
	const current = c.buffs.bleeding ?? 0;
	if (level > current) {
		c.buffs.bleeding = level;
		c.bleedSource = source;
		if (announceBuff && ANNOUNCED_BUFFS.has('bleeding') && current <= 0) announceBuff(c, 'bleeding');
	}
}
