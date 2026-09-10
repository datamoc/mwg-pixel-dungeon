import { Actors } from 'mwg';

/** The subset of a stored/bag ring's shape these pure multiplier functions need. */
export interface EquippedRing {
	id: string;
	level: number;
	instanceId?: string;
	cursed?: boolean;
}

/**
 * `RingOfTenacity`'s special-cased entry: `stat` is a marker only, skipped in the
 * `scaledModifiers` loop this table otherwise drives - see `ringTenacityMultiplier`'s own
 * comment for why it can't be a plain `StatBlock` modifier (it depends on live HP, not a
 * static stat).
 * - Accuracy: `RingOfAccuracy.accuracyMultiplier()` = `pow(1.3, level)`.
 * - Evasion: `RingOfEvasion.evasionMultiplier()` = `pow(1.125, level)`.
 * - Might: `RingOfMight.strengthBonus()` = flat `+level`.
 */
export const RING_DEFS: Record<string, { stat: string; op: Actors.ModifierOp; at: (level: number) => number }> = {
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
	//RingOfWealth.dropChanceMultiplier(): real Java formula is `pow(1.20, level)`, read directly
	//via `ringDef` the same way (`ringWealthMultiplier`, applied to `MOB_LOOT`'s chance in `kill`).
	wealth: { stat: 'wealth', op: 'multiply', at: (lvl) => Math.pow(1.2, lvl) },
	//RingOfArcana.enchantPowerMultiplier(): `pow(1.175, level)`, read via `ringArcanaMultiplier`
	//at Grim/Lucky/Blocking's proc rolls - the only ported procs Java scales by it.
	arcana: { stat: 'arcana', op: 'multiply', at: (lvl) => Math.pow(1.175, lvl) },
	//RingOfForce.armedDamageBonus(): flat `+level`, read via `ringForceBonus` at the hero's own
	//melee-attack site (excluded from ranged/thrown the same way Java excludes MissileWeapon).
	force: { stat: 'force', op: 'add', at: (lvl) => lvl },
	//RingOfSharpshooting.levelDamageBonus(): flat `+level`, read via `ringSharpshootingBonus` at
	//the hero's own thrown/SpiritBow damage rolls (the ranged mirror of Force's melee-only bonus).
	sharpshooting: { stat: 'sharpshooting', op: 'add', at: (lvl) => lvl },
	//RingOfElements.resist(): `pow(0.825, level)` damage multiplier against elemental
	//sources (Burning/Chill/Frost/Ooze/Paralysis/Poison/Corrosion/ToxicGas/Electricity +
	//AntiMagic.RESISTS), read via `ringElementsMultiplier` at the hero's elemental-damage
	//sites (burning/poison DoT, toxic-gas blob, burning trap). Real Java applies this in
	//`Char.resist()`'s single choke point (`damage *= resist(srcClass)`); this port has no
	//shared Class-dispatch - each status/damage site calls `addBuff`/damage directly - so
	//the same factor is applied at each elemental call site instead. Status *durations*
	//are not scaled (Java scales damage, not buff length, through this path).
	elements: { stat: 'elements', op: 'multiply', at: (lvl) => Math.pow(0.825, lvl) },
	//RingOfFuror.attackSpeedMultiplier(): `pow(1.09051, level)`, read via
	//`ringFurorMultiplier` at the hero's own bump-attack turn cost only (real Java's
	//`Hero.attackDelay()` is a separate cost function from `Char.speed()`; RingOfHaste
	//feeds `speed()` while Furor feeds `attackDelay()`, so Furor must never speed up
	//movement - see `getAttackTurnCostMod`).
	furor: { stat: 'furor', op: 'multiply', at: (lvl) => Math.pow(1.09051, lvl) },
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
export function ringDef(id: string): { stat: string; op: Actors.ModifierOp; at: (level: number) => number } | undefined {
	return RING_DEFS[id.replace(/^ring_/, '')];
}

/**
 * `RingOfTenacity.damageMultiplier()`: x0.85^(lvl * missingHpFraction), read against HP
 * *before* this hit lands (matches `Hero.damage()`, which computes it before HP drops) -
 * stronger reduction the lower the wearer's current HP already is.
 */
export function ringTenacityMultiplier(ring: EquippedRing | null, hp: number, maxHp: number): number {
	if (!ring || ringDef(ring.id)?.stat !== 'tenacity') return 1;
	const missingFraction = (maxHp - hp) / maxHp;
	return Math.pow(0.85, ring.level * missingFraction);
}

/** `RingOfHaste.speedMultiplier()`: `1.175^level`. Read by `getActionTurnCostMod` as a turn-
 * cost divisor - Java expresses this as `Char.speed()` scaling upward, this port's
 * fractional-turn-cost model expresses the same thing as the cost per action scaling down. */
export function ringHasteMultiplier(ring: EquippedRing | null): number {
	if (!ring || ringDef(ring.id)?.stat !== 'speed') return 1;
	return Math.pow(1.175, ring.level);
}

/** `RingOfEnergy.wandChargeMultiplier()`: `1.175^level` (this port doesn't model the
 * Light Reading talent's further multiplier on top, since that talent itself isn't ported). */
export function ringEnergyMultiplier(ring: EquippedRing | null): number {
	if (!ring || ringDef(ring.id)?.stat !== 'energy') return 1;
	return Math.pow(1.175, ring.level);
}

/** `RingOfArcana.enchantPowerMultiplier()`: `1.175^level`. Real Java's
 * `Enchantment.genericProcChanceMultiplier()`/`Glyph.genericProcChanceMultiplier()` fold
 * this into every enchant/glyph/curse proc-chance roll that calls `procChanceMultiplier()`
 * - which, checked against tag `v3.3.8`, is every ported chance-proc here including the
 * curses (Annoying/Dazzling/Explosive/Sacrificial/Displacing/Friendly and AntiEntropy/
 * Corrosion/Displacement/Metabolism/Multiplicity/Overgrowth/Stench all call it; Polarized
 * has no chance roll and Wayward's ported shape is a flat passive). Of the good enchants,
 * only Grim/Lucky/Blocking/Blooming currently roll a real chance in this port at all
 * (Blazing/Chilling/Shocking/Vampiric are unconditional here, a pre-existing simplification
 * unrelated to Arcana - there's no roll left for it to scale until those get their own
 * probabilistic formulas). */
export function ringArcanaMultiplier(ring: EquippedRing | null): number {
	if (!ring || ringDef(ring.id)?.stat !== 'arcana') return 1;
	return Math.pow(1.175, ring.level);
}

/** `RingOfForce.armedDamageBonus()`: flat `+level`, read at the hero's own melee-attack site. */
export function ringForceBonus(ring: EquippedRing | null): number {
	if (!ring || ringDef(ring.id)?.stat !== 'force') return 0;
	return ring.level;
}

/** `RingOfSharpshooting.levelDamageBonus()`: flat `+level`, read at the hero's thrown/
 * SpiritBow damage rolls. */
export function ringSharpshootingBonus(ring: EquippedRing | null): number {
	if (!ring || ringDef(ring.id)?.stat !== 'sharpshooting') return 0;
	return ring.level;
}

/** `RingOfSharpshooting.durabilityMultiplier()`: `1.2^level`, read at the thrown-missile
 * `uses` calculation - Java scales `usages` (this port's `uses`) directly by it. */
export function ringSharpshootingDurabilityMultiplier(ring: EquippedRing | null): number {
	if (!ring || ringDef(ring.id)?.stat !== 'sharpshooting') return 1;
	return Math.pow(1.2, ring.level);
}

/** `RingOfWealth.dropChanceMultiplier()`: `1.20^level`, read by `kill()`'s `MOB_LOOT` roll.
 * Real Java's separate `tryForBonusDrop()` (an independent bonus-item roll, tracked by its
 * own `TriesToDropTracker`/`dropsToRare` counters, escalating toward guaranteed rare loot the
 * longer it goes unrewarded) is not modeled - this only covers the flat chance multiplier. */
export function ringWealthMultiplier(ring: EquippedRing | null): number {
	if (!ring || ringDef(ring.id)?.stat !== 'wealth') return 1;
	return Math.pow(1.2, ring.level);
}

/** `Ring.getBuffedBonus(Wealth.class)`: positive bonus levels enable the separate
 * tryForBonusDrop tracker; cursed/zero-level rings do not start that tracker. */
export function ringWealthBonus(ring: EquippedRing | null): number {
	if (!ring || ringDef(ring.id)?.stat !== 'wealth') return 0;
	return Math.max(0, ring.level);
}

/** `RingOfElements.resist()`: `pow(0.825, level)` against elemental sources. Real Java
 * gates this on the damage source's class being in `RESISTS`; this port's elemental
 * call sites (DoT tick, toxic-gas blob, burning trap) are all in that set by
 * construction, so no per-call gating is needed. Returns 1 when no Elements ring is
 * equipped (or the equipped ring is another type). */
export function ringElementsMultiplier(ring: EquippedRing | null): number {
	if (!ring || ringDef(ring.id)?.stat !== 'elements') return 1;
	return Math.pow(0.825, ring.level);
}

/** `RingOfFuror.attackSpeedMultiplier()`: `pow(1.09051, level)`. Real Java multiplies
 * attack speed up (dividing `attackDelay()`); this port's turn-cost model expresses
 * the same thing as the attack's turn cost scaling down (see `getAttackTurnCostMod`). */
export function ringFurorMultiplier(ring: EquippedRing | null): number {
	if (!ring || ringDef(ring.id)?.stat !== 'furor') return 1;
	return Math.pow(1.09051, ring.level);
}
