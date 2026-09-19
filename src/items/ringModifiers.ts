import { Actors } from 'mwg';
import { MWL_RING_ITEMS } from '../mwlContent';

/** The subset of a stored/bag ring's shape these pure multiplier functions need. */
export interface EquippedRing {
	id: string;
	level: number;
	instanceId?: string;
	cursed?: boolean;
	/** Whether this ring is identified while worn - Java's Item.identify() is not implied by
	 * merely equipping something; only Thief's Intuition rank 2 (or an outside identify, e.g.
	 * a scroll used before equipping) reveals it. See `equipRing`'s own comment. */
	identified?: boolean;
}

/**
 * `rings.mwl` authors every ring's formula as `add=level` or `multiply=BASE^level` - the two
 * shapes this port's rings actually use. Parses one authored effect rather than hand-copying
 * its number a second time here, and throws on anything else so a future authored shape this
 * doesn't understand fails loudly instead of silently mismatching Java.
 */
function ringFormula(mwlId: string, operation: string | undefined, value: string | undefined): (level: number) => number {
	if (operation === 'add' && value === 'level') return (level) => level;
	const power = operation === 'multiply' ? /^([\d.]+)\^level$/.exec(value ?? '') : null;
	if (power) {
		const base = Number(power[1]);
		return (level) => Math.pow(base, level);
	}
	throw new Error(`rings.mwl's ${mwlId} effect has an unrecognized formula shape: ${operation}=${value}`);
}

/**
 * Looks up `ring${Capitalized(shortKey)}` in `rings.mwl` and parses its one authored effect.
 * `applyTo` is the authored `apply_to` label (matches `shortKey` for most rings, but Might's is
 * `strength` and Haste's is `haste` while this port's own internal `stat` for it is `speed` -
 * three independent vocabularies that happen to coincide most of the time, not by rule).
 * `mwlId` (`ringHaste`) is `rings.mwl`'s own item-node id, used only to look data up in
 * `MWL_RING_ITEMS` - it is not the runtime bag-item id (`ring_haste`, authored separately in
 * `item-rules.mwl`'s `ringClassAliases` and checked everywhere via `id.startsWith('ring_')`).
 * The two happen to share a lowercase suffix, which is the only reason `RING_KEYS` (keyed by
 * that shared suffix) can serve both; don't build a bag item id from this function's `mwlId`.
 */
function mwlRingFormula(shortKey: string, applyTo: string, stat: string, op: Actors.ModifierOp): { stat: string; op: Actors.ModifierOp; at: (level: number) => number } {
	const mwlId = 'ring' + shortKey[0]!.toUpperCase() + shortKey.slice(1);
	const item = MWL_RING_ITEMS.find((candidate) => candidate.id === mwlId);
	if (!item) throw new Error(`rings.mwl is missing the ${mwlId} item`);
	const effect = item.effects.find((candidate) => candidate.applyTo === applyTo);
	if (!effect) throw new Error(`rings.mwl's ${mwlId} item has no effect for ${applyTo}`);
	return { stat, op, at: ringFormula(mwlId, effect.operation, effect.value) };
}

/**
 * `RingOfTenacity`'s special-cased entry: `stat` is a marker only, skipped in the
 * `scaledModifiers` loop this table otherwise drives - see `ringTenacityMultiplier`'s own
 * comment for why it can't be a plain `StatBlock` modifier (it depends on live HP, not a
 * static stat, so unlike every other ring here its authored `multiply=0.85^(level*missing_hp_fraction)`
 * has a second free variable `ringFormula` above does not parse; `at` is never actually called).
 * - Accuracy: `RingOfAccuracy.accuracyMultiplier()` = `pow(1.3, bonusLevel)`.
 * - Evasion: `RingOfEvasion.evasionMultiplier()` = `pow(1.125, bonusLevel)`.
 * - Might: `RingOfMight.strengthBonus()` = the bonus level (can be negative when cursed).
 */
export const RING_DEFS: Record<string, { stat: string; op: Actors.ModifierOp; at: (level: number) => number }> = {
	//Every `at(level)` below receives Java's *bonus* level, not the ring's own upgrade level -
	//`ringBonusLevel` is the single translation (see its comment).
	accuracy: mwlRingFormula('accuracy', 'accuracy', 'accuracy', 'multiply'),
	evasion: mwlRingFormula('evasion', 'evasion', 'evasion', 'multiply'),
	might: mwlRingFormula('might', 'strength', 'strength', 'add'),
	tenacity: { stat: 'tenacity', op: 'add', at: (lvl) => lvl },
	//RingOfHaste.speedMultiplier()/RingOfEnergy.wandChargeMultiplier(): both real Java formulas
	//are `pow(1.175, getBuffedBonus(...))`, applied outside the StatBlock loop below the same way Tenacity is
	//(`getActionTurnCostMod`/`recoverWandCharge`'s rate read these via `ringDef` directly, since
	//"faster turns" and "faster wand recharge" aren't `heroStats` entries).
	haste: mwlRingFormula('haste', 'haste', 'speed', 'multiply'),
	energy: mwlRingFormula('energy', 'energy', 'energy', 'multiply'),
	//RingOfWealth.dropChanceMultiplier(): real Java formula is `pow(1.20, getBuffedBonus(...))`, read directly
	//via `ringDef` the same way (`ringWealthMultiplier`, applied to `MOB_LOOT`'s chance in `kill`).
	wealth: mwlRingFormula('wealth', 'wealth', 'wealth', 'multiply'),
	//RingOfArcana.enchantPowerMultiplier(): `pow(1.175, getBuffedBonus(...))`, read via `ringArcanaMultiplier`
	//at Grim/Lucky/Blocking's proc rolls - the only ported procs Java scales by it.
	arcana: mwlRingFormula('arcana', 'arcana', 'arcana', 'multiply'),
	//RingOfForce.armedDamageBonus(): the bonus level itself (a plain +0 ring already adds 1), read via `ringForceBonus` at the hero's own
	//melee-attack site (excluded from ranged/thrown the same way Java excludes MissileWeapon).
	force: mwlRingFormula('force', 'force', 'force', 'add'),
	//RingOfSharpshooting.levelDamageBonus(): the bonus level itself (a plain +0 ring already adds 1), read via `ringSharpshootingBonus` at
	//the hero's own thrown/SpiritBow damage rolls (the ranged mirror of Force's melee-only bonus).
	sharpshooting: mwlRingFormula('sharpshooting', 'sharpshooting', 'sharpshooting', 'add'),
	//RingOfElements.resist(): `pow(0.825, bonusLevel)` damage multiplier against elemental
	//sources (Burning/Chill/Frost/Ooze/Paralysis/Poison/Corrosion/ToxicGas/Electricity +
	//AntiMagic.RESISTS), read via `ringElementsMultiplier` at every hero elemental-damage
	//site this port models (burning/poison/corrosion DoT, toxic-gas/electricity blobs,
	//burning trap, ooze). Real Java applies this in
	//`Char.resist()`'s single choke point (`damage *= resist(srcClass)`); this port has no
	//shared Class-dispatch - each status/damage site calls `addBuff`/damage directly - so
	//the same factor is applied at each elemental call site instead. Status *durations*
	//are not scaled (Java scales damage, not buff length, through this path).
	elements: mwlRingFormula('elements', 'elements', 'elements', 'multiply'),
	//RingOfFuror.attackSpeedMultiplier(): `pow(1.09051, bonusLevel)`, read via
	//`ringFurorMultiplier` at the hero's own bump-attack turn cost only (real Java's
	//`Hero.attackDelay()` is a separate cost function from `Char.speed()`; RingOfHaste
	//feeds `speed()` while Furor feeds `attackDelay()`, so Furor must never speed up
	//movement - see `getAttackTurnCostMod`).
	furor: mwlRingFormula('furor', 'furor', 'furor', 'multiply'),
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
 * `Ring.RingBuff.level()`/`buffedLvl()`: every ring accessor in Java reads a *bonus level*, never
 * the ring's own upgrade level - `soloBonus()` is `level + 1` for an uncursed ring and
 * `min(0, level - 2)` for a cursed one, and `Ring.getBonus`/`getBuffedBonus` return 0 outright
 * when the wearer has `MagicImmune` (the AntiMagic glyph). So a plain +0 ring already grants one
 * level of effect, a cursed ring can never grant a *positive* bonus (at +0/+1 it is an active
 * penalty - a cursed Might ring *lowers* STR), and AntiMagic suppresses the ring entirely. Every
 * formula in this file used to be fed the raw `ring.level`, i.e. one level short of Java with no
 * cursed clamp and no AntiMagic gate - checked against tag `v3.3.8` (`Ring.java` 357-404,
 * `RingOf*.java`'s `soloBonus()` descriptions all printing `pow(1.175, level+1)`).
 */
export function ringBonusLevel(ring: EquippedRing | null, magicImmune = false): number {
	if (!ring) return 0;
	if (magicImmune) return 0;
	return ring.cursed ? Math.min(0, ring.level - 2) : ring.level + 1;
}

/** `RingOfMight.strengthBonus()`: `getBonus(Might.class)`, i.e. the bonus level itself - which
 * is negative for a cursed ring, so a cursed Might ring really does dock the wearer's STR. */
export function ringMightBonus(ring: EquippedRing | null, magicImmune = false): number {
	if (!ring || ringDef(ring.id)?.stat !== 'strength') return 0;
	return ringBonusLevel(ring, magicImmune);
}

/**
 * `RingOfTenacity.damageMultiplier()`: x0.85^(bonusLevel * missingHpFraction), read against HP
 * *before* this hit lands (matches `Hero.damage()`, which computes it before HP drops) -
 * stronger reduction the lower the wearer's current HP already is.
 */
export function ringTenacityMultiplier(ring: EquippedRing | null, hp: number, maxHp: number, magicImmune = false): number {
	if (!ring || ringDef(ring.id)?.stat !== 'tenacity') return 1;
	const missingFraction = (maxHp - hp) / maxHp;
	return Math.pow(0.85, ringBonusLevel(ring, magicImmune) * missingFraction);
}

/** `RingOfHaste.speedMultiplier()`: `1.175^bonusLevel`. Read by `getActionTurnCostMod` as a turn-
 * cost divisor - Java expresses this as `Char.speed()` scaling upward, this port's
 * fractional-turn-cost model expresses the same thing as the cost per action scaling down. */
export function ringHasteMultiplier(ring: EquippedRing | null, magicImmune = false): number {
	if (!ring || ringDef(ring.id)?.stat !== 'speed') return 1;
	return RING_DEFS.haste!.at(ringBonusLevel(ring, magicImmune));
}

/** `RingOfEnergy.wandChargeMultiplier()`: `1.175^bonusLevel` (this port doesn't model the
 * Light Reading talent's further multiplier on top, since that talent itself isn't ported). */
export function ringEnergyMultiplier(ring: EquippedRing | null, magicImmune = false): number {
	if (!ring || ringDef(ring.id)?.stat !== 'energy') return 1;
	return RING_DEFS.energy!.at(ringBonusLevel(ring, magicImmune));
}

/** `RingOfArcana.enchantPowerMultiplier()`: `1.175^bonusLevel`. Real Java's
 * `Enchantment.genericProcChanceMultiplier()`/`Glyph.genericProcChanceMultiplier()` fold
 * this into every enchant/glyph/curse proc-chance roll that calls `procChanceMultiplier()`
 * - which, checked against tag `v3.3.8`, is every ported chance-proc here including the
 * curses (Annoying/Dazzling/Explosive/Sacrificial/Displacing/Friendly and AntiEntropy/
 * Corrosion/Displacement/Metabolism/Multiplicity/Overgrowth/Stench all call it; Polarized
 * has no chance roll and Wayward's ported shape is a flat passive). Of the good enchants,
 * all nine ported enchant procs now roll a real chance in this port (Blazing/Chilling/Shocking/
 * Vampiric gained theirs on 2026-09-12), as do the weapon curses - and Wayward's shape is no longer
 * a flat passive either (it is a real toggle as of the same pass). */
export function ringArcanaMultiplier(ring: EquippedRing | null, magicImmune = false): number {
	if (!ring || ringDef(ring.id)?.stat !== 'arcana') return 1;
	return RING_DEFS.arcana!.at(ringBonusLevel(ring, magicImmune));
}

/** `RingOfForce.armedDamageBonus()`: the bonus level (a plain +0 ring already adds 1), read at the
 * hero's own melee-attack site. */
export function ringForceBonus(ring: EquippedRing | null, magicImmune = false): number {
	if (!ring || ringDef(ring.id)?.stat !== 'force') return 0;
	return ringBonusLevel(ring, magicImmune);
}

/** `RingOfSharpshooting.levelDamageBonus()`: the bonus level (a plain +0 ring already adds 1), read
 * at the hero's thrown/
 * SpiritBow damage rolls. */
export function ringSharpshootingBonus(ring: EquippedRing | null, magicImmune = false): number {
	if (!ring || ringDef(ring.id)?.stat !== 'sharpshooting') return 0;
	return ringBonusLevel(ring, magicImmune);
}

/** `RingOfSharpshooting.durabilityMultiplier()`: `1.2^getBonus(Aim.class)` (the same bonus level,
 * via Java's non-buffed accessor), read at the thrown-missile
 * `uses` calculation - Java scales `usages` (this port's `uses`) directly by it.
 * Unlike every formula above, this one has no `rings.mwl` authoring at all: `ringSharpshooting`
 * authors only its `add=level` damage effect (`RingOfSharpshooting.levelDamageBonus()`), not
 * this second, independent Java formula on the same ring - a real, minor gap in the MWL
 * catalogue rather than a duplication to remove. */
export function ringSharpshootingDurabilityMultiplier(ring: EquippedRing | null, magicImmune = false): number {
	if (!ring || ringDef(ring.id)?.stat !== 'sharpshooting') return 1;
	return Math.pow(1.2, ringBonusLevel(ring, magicImmune));
}

/** `RingOfWealth.dropChanceMultiplier()`: `1.20^bonusLevel`, read by `kill()`'s `MOB_LOOT` roll.
 * Real Java's separate `tryForBonusDrop()` (an independent bonus-item roll, tracked by its
 * own `TriesToDropTracker`/`dropsToRare` counters, escalating toward guaranteed rare loot the
 * longer it goes unrewarded) is not modeled - this only covers the flat chance multiplier. */
export function ringWealthMultiplier(ring: EquippedRing | null, magicImmune = false): number {
	if (!ring || ringDef(ring.id)?.stat !== 'wealth') return 1;
	return RING_DEFS.wealth!.at(ringBonusLevel(ring, magicImmune));
}

/** `Ring.getBuffedBonus(Wealth.class)`: only a *positive* bonus level enables the separate
 * tryForBonusDrop tracker, so a cursed or AntiMagic-suppressed ring does not start it (a plain
 * +0 ring does - its bonus level is 1). */
export function ringWealthBonus(ring: EquippedRing | null, magicImmune = false): number {
	if (!ring || ringDef(ring.id)?.stat !== 'wealth') return 0;
	return Math.max(0, ringBonusLevel(ring, magicImmune));
}

/** `RingOfElements.resist()`: `pow(0.825, getBuffedBonus(...))` against elemental sources. Real Java
 * gates this on the damage source's class being in `RESISTS`; this port's elemental
 * call sites (DoT tick, toxic-gas blob, burning trap) are all in that set by
 * construction, so no per-call gating is needed. Returns 1 when no Elements ring is
 * equipped (or the equipped ring is another type). */
export function ringElementsMultiplier(ring: EquippedRing | null, magicImmune = false): number {
	if (!ring || ringDef(ring.id)?.stat !== 'elements') return 1;
	return RING_DEFS.elements!.at(ringBonusLevel(ring, magicImmune));
}

/** `RingOfFuror.attackSpeedMultiplier()`: `pow(1.09051, bonusLevel)`. Real Java multiplies
 * attack speed up (dividing `attackDelay()`); this port's turn-cost model expresses
 * the same thing as the attack's turn cost scaling down (see `getAttackTurnCostMod`). */
export function ringFurorMultiplier(ring: EquippedRing | null, magicImmune = false): number {
	if (!ring || ringDef(ring.id)?.stat !== 'furor') return 1;
	return RING_DEFS.furor!.at(ringBonusLevel(ring, magicImmune));
}
