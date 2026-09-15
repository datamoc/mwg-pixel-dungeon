/**
 * `RingOfWealth.tryForBonusDrop`'s own rules (tag `v3.3.8`), split out of the scene so the tracker
 * arithmetic and every tier/category decision can be checked without a live game - the same split
 * `items/sandals.ts`/`rose.ts`/`talisman.ts` use. What is left here is *what* drops; the scene
 * materialises the plans into real items through its generator.
 *
 * The mechanic is a pair of counters on the hero rather than a per-drop chance: every `tries` a
 * payout is owed (`TriesToDropTracker`), and each payout is either a consumable or an equipment
 * item depending on a second counter (`DropsToEquipTracker`), which refills itself every time the
 * equipment one fires. Java's own counters are `CounterBuff`s with `revivePersists`, so they last
 * the whole run.
 */
import { mwlItemEffectValue } from '../mwlContent';

/** Java's `TriesToDropTracker`/`DropsToEquipTracker`, as plain numbers the caller persists. */
export interface WealthTrackers {
	/** Java's `count()`, decremented by each drop attempt's `tries`. */
	triesToDrop: number;
	/** Java's `count()`: how many consumable payouts are still owed before the next equipment one. */
	dropsToEquip: number;
}

/** The three draws this module needs, injected so it stays a pure function of its inputs. */
export interface WealthRng {
	int(n: number): number;
	float(): number;
	normalIntRange(min: number, max: number): number;
}

/** One payout, as Java's generators decide it - the scene turns each of these into items. */
export type WealthDropPlan =
	| { kind: 'gold' }
	| { kind: 'stone' }
	| { kind: 'potion' }
	| { kind: 'scroll' }
	| { kind: 'bomb' }
	| { kind: 'honeypot' }
	| { kind: 'stoneOfEnchantment' }
	| { kind: 'potionExperience' }
	| { kind: 'scrollTransmutation' }
	| { kind: 'doubleBomb' }
	/** Java's `i.quantity(i.quantity()*2)` - the caller doubles whatever the inner plan makes. */
	| { kind: 'doubled'; inner: WealthDropPlan }
	| { kind: 'equip'; slot: 'weapon' | 'armor' | 'ring' | 'artifact'; level: number };

/**
 * Java's `equipBonus` loop, verbatim - including the odd-looking branch that caps *later* rings:
 * "A second ring of wealth can be at most +1 when calculating wealth bonus for equips ... to
 * prevent using an upgraded wealth to farm another upgraded wealth". Once one level is above the
 * running total, subsequent ones only add up to 2, and once it is below, `min(level, 2)` is added.
 * The port equips one ring, so this normally sees a single level; the loop is kept general because
 * the rule is what makes the number.
 */
export function wealthEquipBonus(wealthLevels: readonly number[]): number {
	let equipBonus = 0;
	for (const level of wealthLevels) {
		if (level > equipBonus) equipBonus = level + Math.min(equipBonus, 2);
		else equipBonus += Math.min(level, 2);
	}
	return equipBonus;
}

/** The two counters as Java lazily creates them on the first call (`Buff.affect` + `countUp`). */
export function initialiseWealthTrackers(rng: WealthRng): WealthTrackers {
	return {
		triesToDrop: rng.normalIntRange(0, mwlItemEffectValue('wealth', 'triesToDropMax')),
		dropsToEquip: rng.normalIntRange(mwlItemEffectValue('wealth', 'dropsToEquipMin'), mwlItemEffectValue('wealth', 'dropsToEquipMax')),
	};
}

/** `genConsumableDrop(level)`'s three-way split: "60% chance - 4% per level" for the low tier,
 *  "30% + 2% per level" for the mid one, the rest high. At +15 the low tier is gone (its
 *  threshold reaches 0) and the high tier has grown to 40% - both of which fall out of the
 *  thresholds themselves rather than being special-cased, exactly as Java leaves them. */
export function wealthConsumableTier(level: number, roll: number): 1 | 2 | 3 {
	if (roll < mwlItemEffectValue('wealth', 'lowTierBase') - mwlItemEffectValue('wealth', 'lowTierPerLevel') * level) return 1;
	if (roll < mwlItemEffectValue('wealth', 'midTierBase') - mwlItemEffectValue('wealth', 'midTierPerLevel') * level) return 2;
	return 3;
}

/** `genLowValueConsumable()`: `Random.Int(4)` over gold (halved), a runestone, a potion, a scroll. */
function planLowValue(rng: WealthRng): WealthDropPlan {
	switch (rng.int(4)) {
		case 1: return { kind: 'stone' };
		case 2: return { kind: 'potion' };
		case 3: return { kind: 'scroll' };
		default: return { kind: 'gold' };
	}
}

/**
 * `genMidValueConsumable()`: `Random.Int(6)`, in Java's own order. Two of its six cases are the
 * *exotic* half of a potion or scroll (a `Reflection.newInstance` of the exotic counterpart, or the
 * item itself if it was already exotic), and a third is `UnstableBrew`/`UnstableSpell`; **this port
 * has no exotic or unstable items at all**, so those cases return the regular potion, scroll or
 * spend the same draw as their regular counterpart would - a stated reduction, not a silent swap.
 * The caller still makes every draw Java makes (`Int(6)`, then `Int(2)` for the unstable pair), so
 * the stream stays Java's shape.
 */
function planMidValue(rng: WealthRng): WealthDropPlan {
	switch (rng.int(6)) {
		case 0: return { kind: 'doubled', inner: planLowValue(rng) };
		case 1: return { kind: 'potion' };
		case 2: return { kind: 'scroll' };
		//`Random.Int(2) == 0 ? new UnstableBrew() : new UnstableSpell()` - both are random-effect
		//consumables this port has no items for, so the draw is made and a regular potion or scroll
		//stands in for them (documented in PORT_COVERAGE.md).
		case 3: return rng.int(2) === 0 ? { kind: 'potion' } : { kind: 'scroll' };
		case 4: return { kind: 'bomb' };
		default: return { kind: 'honeypot' };
	}
}

/**
 * `genHighValueConsumable()`: `Random.Int(4)`. Cases 2 and 3 are the exotic pairs
 * (`PotionOfDivineInspiration`/`PotionOfExperience` and `ScrollOfMetamorphosis`/
 * `ScrollOfTransmutation`), gated on `ExoticCrystals.consumableExoticChance()`; **with no
 * ExoticCrystals equipped that chance is exactly 0** (`trinketLevel` is -1), so the regular half is
 * always what Java returns too - the `Float()` draw is still made here so the stream matches.
 * Neither exotic exists in this port either way.
 */
function planHighValue(rng: WealthRng): WealthDropPlan {
	switch (rng.int(4)) {
		case 0: {
			//`if (i instanceof Bomb) return new Bomb.DoubleBomb(); else return i.quantity(i.quantity()*2);`
			const inner = planMidValue(rng);
			return inner.kind === 'bomb' ? { kind: 'doubleBomb' } : { kind: 'doubled', inner };
		}
		case 1: return { kind: 'stoneOfEnchantment' };
		case 2:
			//`Random.Float() < consumableExoticChance() ? new PotionOfDivineInspiration() : new PotionOfExperience()`
			//- the draw is made, then the regular potion is what both branches reach here.
			rng.float();
			return { kind: 'potionExperience' };
		default:
			rng.float();
			return { kind: 'scrollTransmutation' };
	}
}

/** `genConsumableDrop(level)`: one `Random.Float()` and then the tier's own generator. */
function planConsumable(level: number, rng: WealthRng): WealthDropPlan {
	const tier = wealthConsumableTier(level, rng.float());
	return tier === 1 ? planLowValue(rng) : tier === 2 ? planMidValue(rng) : planHighValue(rng);
}

/**
 * `genEquipmentDrop(level)`: `Random.Int(5)` - weapons twice, armor, a ring, an artifact - with the
 * `floorset = (depth + level)/5` band and the minimum upgrade level `(level+1)/2` that Java applies
 * afterwards ("minimum level is 1/2/3/4/5/6 when ring level is 1/3/5/7/9/11"). The scene applies
 * both, since it is the one that knows the depth and can mint the item; this returns the slot and
 * the level the caller needs.
 */
function planEquipment(level: number, rng: WealthRng): WealthDropPlan {
	const roll = rng.int(5);
	const slot = roll <= 1 ? 'weapon' : roll === 2 ? 'armor' : roll === 3 ? 'ring' : 'artifact';
	return { kind: 'equip', slot, level };
}

/**
 * `tryForBonusDrop(target, tries)`, without the item generation: the counter arithmetic and the
 * sequence of plans it owes. `bonus` is the hero's Wealth bonus level (the caller checks it is
 * positive before calling, as Java does) and `equipBonus` its capped counterpart.
 *
 * The loop is Java's own `countDown(tries)` / `while (count() <= 0)`, so a large `tries` (a boss's
 * 15) can pay out several times in one call and leaves the counter wherever the arithmetic lands.
 */
export function planWealthDrops(
	trackers: WealthTrackers,
	tries: number,
	bonus: number,
	equipBonus: number,
	rng: WealthRng,
): { plans: WealthDropPlan[]; trackers: WealthTrackers } {
	const plans: WealthDropPlan[] = [];
	let triesToDrop = trackers.triesToDrop - tries;
	let dropsToEquip = trackers.dropsToEquip;
	let guard = 0;
	while (triesToDrop <= 0) {
		if (dropsToEquip <= 0) {
			plans.push(planEquipment(equipBonus - 1, rng));
			dropsToEquip += rng.normalIntRange(mwlItemEffectValue('wealth', 'dropsToEquipMin'), mwlItemEffectValue('wealth', 'dropsToEquipMax'));
		} else {
			plans.push(planConsumable(bonus - 1, rng));
			dropsToEquip -= 1;
		}
		triesToDrop += rng.normalIntRange(0, mwlItemEffectValue('wealth', 'triesToDropMax'));
		//Java's own loop cannot spin forever (the counter always rises by at least 1), but a
		//mis-authored MWL value of 0 would, so the bound is explicit rather than assumed.
		if (++guard > 1000) break;
	}
	return { plans, trackers: { triesToDrop, dropsToEquip } };
}

/** `Rolls` for a mob's death: Java's `rolls = 1`, `15` for a boss and `5` for a miniboss. */
export function wealthDeathRolls(isBoss: boolean, isMiniboss: boolean): number {
	if (isBoss) return mwlItemEffectValue('wealth', 'bossRolls');
	if (isMiniboss) return mwlItemEffectValue('wealth', 'minibossRolls');
	return 1;
}
