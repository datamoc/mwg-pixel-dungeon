// Compatibility boundary for scene callers. Rules live in simulation/; the legacy
// announcement hook remains here until the scene migration is complete. Sprites are owned by
// the scene's `spriteFor` registry (see `SIMULATION_ARCHITECTURE.md`'s "Step 6"), not by
// `Creature`/`GroundItem` here.
import type { AnyMonsterId } from './monsters';
import type { ReactionTable } from 'mwg';
import type { GroundItemKind } from './dungeonConstants';
import type { Combatant, Step } from './simulation/combatState';
import type { BuffId } from './simulation/buffs';
import { nextEntityId } from './simulation/entityId';
import { createCombatAdapter } from './adapters/combatSimulation';
import { simulationRandom } from './adapters/mwgRandom';
import { STATUS_IMMUNITIES } from './simulation/mwlStatusImmunities';
export { INFINITE_ACCURACY, INFINITE_EVASION, ASCENSION_MOD, ASCENSION_ON, accRollMulti, setStrongerBossesEnabled } from './simulation/combat';
export { BUFF_DURATION, NEGATIVE_BUFFS, type BuffId } from './simulation/buffs';

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
	/** Java Mob.target: persistent random destination while the mob is wandering. */
	patrolTarget?: { x: number; y: number };
	/** Ratmogrify's temporary wrapper: the original kind/stats remain intact while abilities are disabled. */
	ratmogrifiedTurns?: number;
	ratmogrifiedPermanent?: boolean;
	/** Viscosity's accumulated deferred damage and its one-turn initial delay. */
	deferredDamage?: number;
	deferredDamageDelay?: boolean;
	/** mwg/roguelike's Scheduler.Actor speed; Huntress's gloves are the one exception at 2 */
	speed?: number;
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
	/** Java-aligned friendly combatant (MirrorImage and future directable allies). */
	isAlly?: boolean;
	/** Friendly summon subtype; sheep are neutral, short-lived and non-combatant. */
	allyKind?: 'mirror' | 'sheep' | 'ward' | 'earthGuardian' | 'lotus';
	sheepTurns?: number;
	/** `WandOfWarding.Ward`'s persistent tier, wand level, and zap count. */
	wardTier?: number;
	wardWandLevel?: number;
	wardTotalZaps?: number;
	/** `WandOfLivingEarth.EarthGuardian`'s persistent wand level and hero-derived defense. */
	earthGuardianWandLevel?: number;
	earthGuardianDefense?: number;
	npcKind?: 'ghost' | 'wandmaker' | 'shopkeeper' | 'blacksmith' | 'imp' | 'ratKing';
	/** GnollTrickster.combo: attacks escalate the longer it keeps hitting */
	combo?: number;
	/** GreatCrab.moving: only really advances every 3rd turn */
	moving?: number;
	/** Necromancer.mySkeleton: its summoned skeleton, null until it summons one */
	skeleton?: Creature | null;
	/** Necromancer.firstSummon: true until this necromancer has ever summoned once - its real
	 * `spend(firstSummon ? TICK : 2*TICK)` only costs double from its second summon onward. */
	firstSummon?: boolean;
	/** Tengu.arenaJumps: how many times it has relocated this fight */
	arenaJumps?: number;
	/** `PrisonBossLevel.State` collapse for this port's single arena: `cell` is Java's
	 * FIGHT_START (the small Tengu cell - warps and dart fills, no abilities), `arena` is
	 * FIGHT_ARENA (5-7 relocations, abilities, `arenaJumps`). Latched at HP <= HT/2. */
	tenguPhase?: 'cell' | 'arena';
	/** Tengu's phase-2 bomb-ability countdown (Java's `abilityCooldown`, bomb-first rotation). */
	tenguAbilityCd?: number;
	/** Tengu's persisted phase-2 ability count, used to keep Bomb/Shocker ordering across saves. */
	tenguAbilityUses?: number;
	/** Tengu.lastAbility: the id of the previous phase-2 ability, so a repeat is rerolled 9/10. */
	tenguLastAbility?: number;
	/** MeleeWeapon upgrade level: min/max grow as tier+lvl / 5(tier+1)+lvl(tier+1) */
	weaponLevel?: number;
	/** Thief.item: what it stole (dropped again on death); Swarm split generation (EXP=0 past 0) */
	stolen?: string | null;
	/** Mimic.java's generated bonus item, carried until the mimic dies. */
	mimicLoot?: string;
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
	yogBeamCd?: number;
	/** `YogDzewa.targetedCells`: cells DeathGaze has painted but not yet fired along (cell indices). */
	yogTargeted?: number[];
	/** `YogDzewa.fistSummons`/`challengeSummons`: the remaining per-gate fist identities. The
	 * normal deck holds one fist from each opposed pair; the challenge deck holds the paired
	 * counterparts, arranged so two of a pair never open together. */
	yogFistDeck?: string[];
	yogChallengeDeck?: string[];
}

/** makes a Creature-shaped object with the combat-state fields every spawn needs.
 * `id` is optional at call sites - it defaults to a fresh one, since no caller today has a
 * reason to name its own (see `entityId.ts`). */
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
	/** Concrete inventory payload; absent only for legacy scripted/cosmetic drops. */
	item?: { id: string; quantity: number; level?: number; tier?: number; sandBags?: number; charges?: number; affix?: string; cursed?: boolean; cursedKnown?: boolean; identified?: boolean; instanceId?: string; sourceClass?: string;
		usesLeftToIdentify?: number; availableUsesToIdentify?: number; durability?: number; maxDurability?: number; seal?: boolean;
		/** `Bomb.Fuse`: lit bombs count down 2 hero turns on the ground, then detonate. */
		fuseTurns?: number;
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

export function addBuff(c: Creature, id: BuffId): void {
	//Brimstone.java grants Burning immunity through Char.isImmune(), before the
	//effect can be attached. Keep this check at the shared buff boundary so fire
	//from traps, blobs, wands, plants, and enemy attacks all obey it.
	if (FIRE_IMMUNITY_BUFFS.has(id) && c.fireImmune) return;
	//AntiMagic.RESISTS (items/armor/glyphs/AntiMagic.java): these status classes
	//are magical in Java and are rejected before attachment. Damage-source
	//resistance is handled separately by the scene's explicit magical flag.
	if (MAGIC_IMMUNITY_BUFFS.has(id) && c.magicImmune) return;
	//Frost.java declares immunity to Chill: a frozen creature cannot be slowed again.
	if (CHILL_IMMUNITY_BUFFS.has(id) && c.buffs.frost !== undefined) return;
	const event = combat.addBuff(c, id);
	if (event.fresh && announceBuff && ANNOUNCED_BUFFS.has(id)) announceBuff(c, id);
}

/** `Buff.affect(..., Bleeding).set(level)`: retain the strongest active bleed. */
export function setBleeding(c: Creature, level: number): void {
	const current = c.buffs.bleeding ?? 0;
	if (level > current) {
		c.buffs.bleeding = level;
		if (announceBuff && ANNOUNCED_BUFFS.has('bleeding') && current <= 0) announceBuff(c, 'bleeding');
	}
}
