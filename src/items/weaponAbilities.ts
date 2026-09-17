/**
 * `MeleeWeapon`/`MissileWeapon` T-key abilities (tag `v3.3.8`), translated.
 *
 * Every melee weapon has its own `ability()` override with its own name, cost and effect;
 * the catalogue already ships all of their `ability_name`/`ability_desc` strings, and the
 * numbers below come straight from those descs (each cites its key). Costs are in weapon
 * charges: the meter below caps at 10 and refills over time plus one per landed melee hit.
 * Java's exact accrual rate and cap are simplified here (stated, not silent - see the
 * `PORT_COVERAGE.md` row); every *cost* and every *effect magnitude* is the real one.
 *
 * `Talent.COUNTER_ABILITY` is real too: while the `counterAbility` tracker is up (armed by
 * `Feint` when the afterimage is attacked), an ability costs `0.5/1/1.5/2` fewer charges
 * at ranks 1-4 (`actors.hero.talent.counter_ability.desc`).
 */

/** Charge meter cap. Simplified (see header): Java's exact cap/accrual are not reproduced. */
export const WEAPON_ABILITY_MAX_CHARGE = 10;

/** `Talent.COUNTER_ABILITY` discount in charges by rank (1-4). */
export function counterAbilityDiscount(rank: number): number {
	return [0, 0.5, 1, 1.5, 2][Math.max(0, Math.min(4, rank))] ?? 0;
}

/** The discounted cost, never below zero. */
export function weaponAbilityCost(baseCost: number, counterRank: number, counterArmed: boolean): number {
	if (!counterArmed) return baseCost;
	return Math.max(0, baseCost - counterAbilityDiscount(counterRank));
}

export type WeaponAbilityKind =
	| 'sneak' | 'heavyBlow' | 'cleave' | 'spin' | 'guard' | 'comboStrike'
	| 'spike' | 'lunge' | 'harvest' | 'swordDance' | 'defensiveStance'
	| 'retribution' | 'chargedShot' | 'runicSlash' | 'lash';

export interface WeaponAbilityDef {
	kind: WeaponAbilityKind;
	/** Charge cost before the `COUNTER_ABILITY` discount. */
	cost: number;
	/** Percent damage bonus (e.g. 35 = +35%), where the ability is a damage strike. */
	damageBonus?: number;
	/** Buff turns granted (sneak invisibility, guard window, stances). */
	buffTurns?: number;
	/** Spin count cap (flail only). */
	maxSpins?: number;
}

/**
 * Per-weapon ability table. Source class names are lower-cased compact ids (the same
 * `sourceClass` payload generated weapons carry); costs and magnitudes are each weapon's
 * own `ability_desc`:
 * - sneak (`assassinsblade` 6 / `dirk` 8 / `dagger` 10 turns invis, cost 2)
 * - heavy blow (`battleaxe` +35 / `handaxe` +45 / `mace` +40 / `warhammer` +30, +daze 5,
 *   cost 2 unless surprise)
 * - cleave (`greatsword` +20 / `longsword` +23 / `sword` +27 / `shortsword` +30 /
 *   `wornshortsword` +33, free re-cleave within 5 turns on a kill)
 * - spin (`flail`: start costs 2, +33%/spin to 3 spins, guaranteed hit while spinning)
 * - guard (`greatshield` 6 / `roundshield` 8 turns of negating the next attack)
 * - combo strike (`gauntlet` +35 / `sai` +40 / `gloves` +45 per recent hit in 5 turns)
 * - spike (`glaive` +30 / `spear` +45, knockback, ranged non-adjacent)
 * - lunge (`katana` +35 / `rapier` +67, steps toward a 1-away enemy)
 * - harvest (`sickle` bleed 100% / `warscythe` bleed 80% of damage, cost 2)
 * - sword dance (`scimitar`: +60% attack speed, +25% accuracy, 5 turns, cost 2)
 * - defensive stance (`quarterstaff`: 3x evasion 5 turns, cost 2)
 * - retribution (`greataxe`: +50% below half health, guaranteed hit)
 * - charged shot (`crossbow`: next dart always hits, 5x5 on-hit area)
 * - runic slash (`runicblade`: +300% enchantment power, guaranteed hit)
 * - lash (`whip`: normal attack vs all in range, closest guaranteed)
 */
const ABILITIES: Record<string, WeaponAbilityDef> = {
	assassinsblade: { kind: 'sneak', cost: 2, buffTurns: 6 },
	dirk: { kind: 'sneak', cost: 2, buffTurns: 8 },
	dagger: { kind: 'sneak', cost: 2, buffTurns: 10 },
	battleaxe: { kind: 'heavyBlow', cost: 2, damageBonus: 35 },
	handaxe: { kind: 'heavyBlow', cost: 2, damageBonus: 45 },
	mace: { kind: 'heavyBlow', cost: 2, damageBonus: 40 },
	warhammer: { kind: 'heavyBlow', cost: 2, damageBonus: 30 },
	greatsword: { kind: 'cleave', cost: 0, damageBonus: 20 },
	longsword: { kind: 'cleave', cost: 0, damageBonus: 23 },
	sword: { kind: 'cleave', cost: 0, damageBonus: 27 },
	shortsword: { kind: 'cleave', cost: 0, damageBonus: 30 },
	wornshortsword: { kind: 'cleave', cost: 0, damageBonus: 33 },
	flail: { kind: 'spin', cost: 2, damageBonus: 33, maxSpins: 3 },
	greatshield: { kind: 'guard', cost: 0, buffTurns: 6 },
	roundshield: { kind: 'guard', cost: 0, buffTurns: 8 },
	gauntlet: { kind: 'comboStrike', cost: 0, damageBonus: 35 },
	sai: { kind: 'comboStrike', cost: 0, damageBonus: 40 },
	gloves: { kind: 'comboStrike', cost: 0, damageBonus: 45 },
	glaive: { kind: 'spike', cost: 0, damageBonus: 30 },
	spear: { kind: 'spike', cost: 0, damageBonus: 45 },
	katana: { kind: 'lunge', cost: 0, damageBonus: 35 },
	rapier: { kind: 'lunge', cost: 0, damageBonus: 67 },
	sickle: { kind: 'harvest', cost: 2, damageBonus: 100 },
	warscythe: { kind: 'harvest', cost: 2, damageBonus: 80 },
	scimitar: { kind: 'swordDance', cost: 2, buffTurns: 5 },
	quarterstaff: { kind: 'defensiveStance', cost: 2, buffTurns: 5 },
	greataxe: { kind: 'retribution', cost: 0, damageBonus: 50 },
	crossbow: { kind: 'chargedShot', cost: 0 },
	runicblade: { kind: 'runicSlash', cost: 0, damageBonus: 300 },
	whip: { kind: 'lash', cost: 0 },
};

/** This port's compact source-class names to the table above (generated payloads vary in
 * case; starting weapons map by their bag id). */
export function weaponAbilityFor(sourceClass: string | undefined, weaponId: string): WeaponAbilityDef | null {
	const key = (sourceClass ?? weaponId).toLowerCase();
	if (key === 'startingweapon' || key === 'weaponreward') return null;
	return ABILITIES[key] ?? null;
}

/** Flail `SpinAbilityTracker`: each spin adds +33% (to 3 spins); the tracker key below. */
export function spinDamageMultiplier(spins: number): number {
	return 1 + 0.33 * Math.max(0, Math.min(3, spins));
}
