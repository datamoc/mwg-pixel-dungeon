/**
 * `Mob.lootChance()`'s composition - the one pure piece of the loot drop decision that
 * `Mob.rollToDropLoot()` compares its `Random.Float()` against (actors/mobs/Mob.java, tag
 * `v3.3.8`). Extracted from the scene's kill() funnel so the Java-vs-TS parity kit
 * (`tools/parityLootTrace.ts`, BACKLOG B3 / coord T57) checks the *same* arithmetic the game
 * runs rather than a second copy of it.
 *
 * Java, in order:
 *  - `rollToDropLoot()` returns before rolling whenever `Dungeon.hero.lvl > maxLvl + 2`;
 *  - `Mob.lootChance()` returns `this.lootChance * dropBonus`, where `dropBonus` starts at
 *    `RingOfWealth.dropChanceMultiplier(hero)` and *gains* the Bounty Hunter preparation bonus
 *    additively (plus `ShardOfOblivion`'s multiplier, which this port has no shard for) - that
 *    sum is the port's `dropBonus`;
 *  - the ten classes that override it multiply the result by their own `LimitedDrops` decay
 *    (`(7f - BAT_HP)/7f`, `(1f/3f)^GUARD_ARM`, ... - authored per kind in `limitedDropDecay`),
 *    and `Swarm.lootChance()` additionally *replaces* the base with `1f/(6*(generation+1))`,
 *    which the port expresses as its `generationDivisor`.
 *
 * The composition is deliberately the same shape and the same operation order as the inline
 * expression it replaced, so the change is behavior-identical.
 */

export interface MobLootChanceInputs {
	/** Java's `lootChance` field, the authored `MOB_LOOT` chance for this kind. */
	baseChance: number;
	/** The port's monster id - only `swarm` reads it (see the override inside). */
	kind?: string;
	/** `LIMITED_DROP_DECAY[kind]`; absent when Java's class keeps the plain field. */
	decay?: ((count: number) => number) | undefined;
	/** `Dungeon.LimitedDrops.<X>.count` - how many times this drop already happened this run. */
	decayCount?: number;
	/** Java's Swarm divides by `generation + 1`; every other kind is 1. */
	generationDivisor?: number;
	/** `RingOfWealth.dropChanceMultiplier(hero) + the Bounty Hunter Preparation bonus`. */
	dropBonus?: number;
}

/** The chance `rollToDropLoot()` rolls `Random.Float() <` against. */
export function mobLootChance(inputs: MobLootChanceInputs): number {
	//`Swarm.lootChance()` (Swarm.java, tag v3.3.8) *replaces* its own `lootChance` field
	//(0.1667f) with `1f/(6*(generation+1))` before applying the SWARM_HP decay, so the field
	//only survives as the value `monsterLoot` authors (and `mobdata` diffs against Java's own
	//field). The runtime base is restored here, where the composition happens: without it every
	//Swarm case sat 2e-4 above Java - found by the `loot` parity stage, 2026-09-26.
	const base = inputs.kind === 'swarm' ? 1 / 6 : inputs.baseChance;
	const decayed = inputs.decay ? base * inputs.decay(inputs.decayCount ?? 0) : base;
	return (decayed / (inputs.generationDivisor ?? 1)) * (inputs.dropBonus ?? 1);
}

/** `Eye.createLoot()`'s `Random.Int(4)` switch (`actors/mobs/Eye.java`, tag `v3.3.8`). */
export function eyeLootOutcome(roll: number): 'dewdrop' | 'seed' | 'stone' {
	if (!Number.isInteger(roll) || roll < 0 || roll > 3) throw new RangeError(`Invalid Eye loot roll: ${roll}`);
	return roll < 2 ? 'dewdrop' : roll === 2 ? 'seed' : 'stone';
}

/** `GnollTrickster.createLoot()`'s integer `(quantity + 1) / 2` rounding. */
export function gnollTricksterMissileQuantity(defaultQuantity: number): number {
	if (!Number.isInteger(defaultQuantity) || defaultQuantity < 1) throw new RangeError(`Invalid missile quantity: ${defaultQuantity}`);
	return Math.ceil(defaultQuantity / 2);
}
