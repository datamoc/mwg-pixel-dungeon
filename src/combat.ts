// Compatibility boundary for scene callers. Rules live in simulation/; sprites and the
// legacy announcement hook remain here until the scene migration is complete.
import type { TintedSprite } from 'mwg';
import type { AnyMonsterId } from './monsters';
import type { GroundItemKind } from './dungeonConstants';
import type { Combatant, Step } from './simulation/combatState';
import type { BuffId } from './simulation/buffs';
import { createCombatAdapter } from './adapters/combatSimulation';
import { simulationRandom } from './adapters/mwgRandom';
export { INFINITE_ACCURACY, INFINITE_EVASION, ASCENSION_MOD, ASCENSION_ON, accRollMulti, setStrongerBossesEnabled } from './simulation/combat';
export { BUFF_DURATION, type BuffId } from './simulation/buffs';

const combat = createCombatAdapter(simulationRandom);
export const rollHit = combat.rollHit;
export const rollDamage = combat.rollDamage;
export const tickBuffs = combat.tickBuffs;

/** Talent.tierLevelThresholds = [0,2,7,13,21,31] - tiers unlock at 2/7/13/21 */
export const TALENT_TIERS = [0, 2, 7, 13, 21, 31];

export type { Step } from './simulation/combatState';

/** a creature on the map - the hero and every monster share this shape */
export interface Creature extends Combatant {
	name: string;
	sprite: TintedSprite;
	/** mwg/roguelike's Scheduler.Actor speed; Huntress's gloves are the one exception at 2 */
	speed?: number;
	/** which MONSTERS entry this is, for its sprite and (for Goo) its special turn logic - absent on the hero */
	kind?: AnyMonsterId;
	/** Goo's pump-up counter: 0 idle, 1 first charge turn, 2 primed to unleash next turn - `Goo.java`'s `pumpedUp` field */
	pumped?: number;
	/** NPCs (ghost/wandmaker/shopkeeper): bumping into them opens dialogue instead of combat */
	isNPC?: boolean;
	npcKind?: 'ghost' | 'wandmaker' | 'shopkeeper' | 'blacksmith' | 'imp';
	/** GnollTrickster.combo: attacks escalate the longer it keeps hitting */
	combo?: number;
	/** GreatCrab.moving: only really advances every 3rd turn */
	moving?: number;
	/** Necromancer.mySkeleton: its summoned skeleton, null until it summons one */
	skeleton?: Creature | null;
	/** Tengu.arenaJumps: how many times it has relocated this fight */
	arenaJumps?: number;
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
}

/** makes a Creature-shaped object with the combat-state fields every spawn needs */
export function baseCreature(init: Omit<Creature, 'buffs'> & { buffs?: Creature['buffs'] }): Creature {
	const { buffs, ...rest } = init;
	return { sleeping: true, champion: null, ...rest, buffs: { ...(buffs ?? {}) } };
}

/** an item lying on the floor, picked up by stepping onto its cell - see `pickupGroundItemAt` */
export interface GroundItem extends Step {
	kind: GroundItemKind;
	sprite: TintedSprite;
	/** Java Heap.Type.CHEST/CRYSTAL_CHEST; contents are opened instead of auto-picked up. */
	chest?: 'normal' | 'locked' | 'crystal';
	/** Concrete inventory payload; absent only for legacy scripted/cosmetic drops. */
	item?: { id: string; quantity: number; level?: number; sandBags?: number; charges?: number; affix?: string; cursed?: boolean; cursedKnown?: boolean; identified?: boolean; instanceId?: string; sourceClass?: string;
		usesLeftToIdentify?: number; availableUsesToIdentify?: number; durability?: number; maxDurability?: number; seal?: boolean };
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
	'cripple',
	'weakness',
	'vulnerable',
	'daze',
	'hex',
	'berserk',
	'fury',
]);

export function addBuff(c: Creature, id: BuffId): void {
	const event = combat.addBuff(c, id);
	if (event.fresh && announceBuff && ANNOUNCED_BUFFS.has(id)) announceBuff(c, id);
}
