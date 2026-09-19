import { Random } from 'mwg';
import type { Creature } from '../combat';
import { isChallengeEnabled } from '../challenges';
import {
	BASE_KIND_ALIASES,
	BOSS_KINDS,
	DEPTH_SCALED_STATS,
	FLYING_KINDS,
	MINIBOSS_KINDS,
	MONSTERS,
	NEVER_SLEEPS_KINDS,
	NPC_KINDS,
	type AnyMonsterId,
	type MonsterDef,
	type MonsterId,
} from '../monsters';

/** The content-side part of creating a monster. `DungeonScene` still owns sprites, layers,
 * scheduler registration and the actor collection; this profile keeps depth scaling, Java
 * inheritance flags and spawn-time rolls in the actor domain instead of in the scene adapter. */
export interface MonsterSpawnProfile {
	baseKind: MonsterId;
	def: MonsterDef;
	adjustedDef: MonsterDef;
	isNPC: boolean;
	isBoss: boolean;
	miniboss: boolean;
	flying: boolean;
	elementalType?: NonNullable<Creature['elementalType']>;
	shamanType?: 'red' | 'blue' | 'purple';
	sleeping: boolean;
	champion: Creature['champion'];
	/** `Dungeon.mobsToChampion`'s value after this call, for the scene to persist and pass back
	 * into the next eligible spawn - see `rollForChampion` below. Unchanged (just echoes the
	 * input) for an ineligible spawn, matching Java never touching the counter outside
	 * `Level.createMob()`. */
	mobsToChampion: number;
}

function randomElementalType(): NonNullable<Creature['elementalType']> {
	//Elemental.random() (Elemental.java, tag v3.3.8): `Random.Float() < 1/50 * RatSkull.exoticChanceMultiplier()`,
	//then one float for Fire (<.4), Frost (<.8), or Shock. The old `Random.int(0, 50) === 0` rolled over 51
	//inclusive values (1/51, not 1/50) with the wrong draw shape; the trinket multiplier is its default 1
	//here (no trinket system - the ParchmentScrap precedent in `src/items/generator.ts`).
	if (Random.float() < 1 / 50) return 'chaos';
	const roll = Random.float();
	return roll < 0.4 ? 'fire' : roll < 0.8 ? 'frost' : 'shock';
}

/**
 * `ChampionEnemy.rollForChampion` (tag `v3.3.8`, re-verified against `git show
 * refs/tags/v3.3.8:...` after an earlier pass this session misread the mechanic from a plain
 * working-tree file - this checkout's working tree sits near `v2.1.4`, not `v3.3.8`, and reading
 * a bare path instead of the tagged ref silently returns the wrong version): `Dungeon
 * .mobsToChampion` (a **float**, not an int) decrements by 1 on every eligible spawn, with no
 * reset-to-8 step at all. Only once it is at or below 0 *and* the challenge is active does a
 * champion get a chance - and even then, real Java **does** exclude Crab/Thief/Guard/Bat below
 * depths 3/4/7/9 (`m instanceof Crab && scalingDepth() <= 3`, etc.), returning immediately
 * without incrementing the counter, so the very next eligible spawn retries rather than waiting
 * out a full fresh interval. A successful, non-excluded assignment adds `8 - min(20,
 * scalingDepth()-1)/10` back to the counter (so the interval itself shrinks from 8 to 6 as depth
 * increases from 1 to 201+, not a fixed period). **This corrects a wrong "correction" made
 * earlier the same day**: the exclusion was not invented, the countdown was not a flat reset-to-8
 * - both were misread from the wrong git ref, and the fix that removed the exclusion and
 * hardcoded the interval to 8 was itself a regression, caught before being reported as done.
 * `Dungeon.mobsToChampion` resets to `1` on a fresh run (`Dungeon.java`'s `reset()`), not 0 - so
 * the very first eligible spawn after a reset already clears the countdown.
 * The type roll itself (`Random.Int(6)`) always happens in Java "to ensure mobsToChampion does
 * not affect levelgen RNG" - this port does not attempt that RNG-order parity (its own gameplay
 * stream is already a stated approximation elsewhere), so the type is only drawn when a champion
 * is actually being assigned.
 */
export function rollForChampion(
	mobsToChampion: number,
	challengeActive: boolean,
	excluded: boolean,
	depth: number,
): { champion: Creature['champion']; mobsToChampion: number } {
	const next = mobsToChampion - 1;
	if (next > 0 || !challengeActive || excluded) return { champion: null, mobsToChampion: next };
	const champion = Random.element(['blessed', 'blazing', 'giant', 'growing', 'antimagic', 'projecting'] as const)!;
	const interval = 8 - Math.min(20, Math.max(0, depth - 1)) / 10;
	return { champion, mobsToChampion: next + interval };
}

/** `rollForChampion`'s own exclusion check (`ChampionEnemy.java`, tag `v3.3.8`): Crab/Thief
 * (`instanceof`, so `GreatCrab`/`Bandit` inherit their base kind's exclusion the same way real
 * Java's subclassing does)/Guard/Bat below depths 3/4/7/9. */
function championExcluded(kind: AnyMonsterId, baseKind: MonsterId, depth: number): boolean {
	return ((kind === 'crab' || kind === 'greatCrab') && depth <= 3)
		|| (baseKind === 'thief' && depth <= 4)
		|| (kind === 'guard' && depth <= 7)
		|| (kind === 'bat' && depth <= 9);
}

export function monsterSpawnProfile(
	kind: AnyMonsterId,
	depth: number,
	restoring: boolean,
	isAlly: boolean,
	championEligible: boolean,
	mobsToChampion: number,
): MonsterSpawnProfile {
	const baseDef = MONSTERS[kind];
	const statOverride = DEPTH_SCALED_STATS[kind]?.(depth);
	const def = statOverride ? { ...baseDef, ...statOverride } : baseDef;
	const adjustedDef = kind === 'pylon' && isChallengeEnabled('stronger_bosses')
		? { ...def, hp: 80 }
		: kind === 'goo' && isChallengeEnabled('stronger_bosses')
			? { ...def, hp: 120 }
			: def;
	const baseKind: MonsterId = BASE_KIND_ALIASES[kind] ?? (kind as MonsterId);
	const isNPC = NPC_KINDS.has(kind);
	const isBoss = BOSS_KINDS.has(kind);
	//Java calls `rollForChampion` from every eligible `createMob()` draw regardless of ally/
	//restore state - but an ally or restored creature is never that draw at all in this port
	//(see `championEligible`'s own doc comment at the call site), so the counter is correctly
	//left untouched here rather than being spent on a spawn Java would never route through it.
	const rolled = isAlly || restoring || !championEligible
		? { champion: null, mobsToChampion }
		: rollForChampion(mobsToChampion, isChallengeEnabled('champion_enemies'), championExcluded(kind, baseKind, depth), depth);
	return {
		baseKind,
		def,
		adjustedDef,
		isNPC,
		isBoss,
		miniboss: MINIBOSS_KINDS.has(kind),
		flying: FLYING_KINDS.has(kind),
		elementalType: kind === 'newbornElemental' ? 'fire' : kind === 'elemental' && !restoring ? randomElementalType() : undefined,
		shamanType: kind === 'shaman' && !restoring
			? (() => { const roll = Random.float(); return roll < 0.4 ? 'red' : roll < 0.7 ? 'blue' : 'purple'; })()
			: undefined,
		//Java's `Mob.state` defaults to SLEEPING and Goo keeps it - he wakes (and seals the
	//floor) when the hero comes close, is noticed, or takes damage. The other bosses keep
	//this port's awake-on-spawn until each one's own Java spawn state is verified.
	sleeping: isAlly ? false : restoring || kind === 'goo' || !(isNPC || isBoss || NEVER_SLEEPS_KINDS.has(kind)),
		champion: rolled.champion,
		mobsToChampion: rolled.mobsToChampion,
	};
}
