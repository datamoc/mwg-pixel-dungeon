/**
 * `MeleeWeapon` T-key abilities (tag `v3.3.8`), translated.
 *
 * Every melee weapon has its own `ability()` override with its own name and effect; the
 * effect magnitudes below are each weapon's own `ability_desc`. The charge economy is
 * Java's `MeleeWeapon.Charger` buff, reproduced exactly:
 * - every ability costs exactly 1 charge (`baseChargeUse` returns 1; only the flail's
 *   mid-spin and the swords' free re-cleave windows override to 0), spent partial-first
 *   (`beforeAbilityUsed`), and gated on `charges + partialCharge >= cost` (`execute`).
 * - the meter accrues over time in `Charger.act()`, never per hit: `1/(60-1.5*(cap-charges))`
 *   per turn (60 down to 45 turns per charge), x1.5 for the Champion, x0.5 under the
 *   ring's brawler stance, plus `1/(20-5*points)` with `WEAPON_RECHARGING` ranked while
 *   `Recharging` (or unconditionally under `ArtifactRecharge`) holds.
 * - the cap is the hero's level (`chargeCap()`), not a flat 10.
 *
 * `Talent.COUNTER_ABILITY` is real too, and it is a post-use *refund*, not a discount:
 * `afterAbilityUsed` calls `gainCharge(points*0.375)` and detaches the tracker `Feint`
 * arms when the afterimage is attacked. (The shipped catalogue's talent text still says
 * "0.5/1/1.5/2 fewer charges" - it predates v3.3.8's rework, as do that file's "costs 2
 * charges" ability descs; the mechanics here follow the code, see PORT_COVERAGE.)
 */

/** `Charger.chargeCap()`: `min(8, 2+(lvl-1)/3)`, champion `min(10, 4+(lvl-1)/3)`. */
export function weaponChargeCap(heroLevel: number, champion: boolean): number {
	const base = champion ? 4 : 2;
	const max = champion ? 10 : 8;
	return Math.min(max, base + Math.floor((Math.max(1, heroLevel) - 1) / 3));
}

export interface WeaponChargeState {
	charges: number;
	partial: number;
}

/** One turn of `Charger.act()`, scaled by the spent turn cost (this port's whole-turn
 * ticks stand in for the buff's per-tick accrual, the same convention the armor-Charger
 * port uses). `regenOn` is always true here: Java gates only on `LockedFloor`/`Vault`,
 * neither of which this port models. Brawler's stance has no expression either (no such
 * buff exists here) - both stated, not silent. */
export function accrueWeaponCharge(
	state: WeaponChargeState,
	opts: { cap: number; champion: boolean; weaponRechargingRank: number; recharging: boolean; artifactRecharge: boolean },
	turns = 1,
): WeaponChargeState {
	let { charges, partial } = state;
	if (charges < opts.cap) {
		partial += (1 / (60 - 1.5 * (opts.cap - charges))) * (opts.champion ? 1.5 : 1) * turns;
		if ((opts.weaponRechargingRank > 0 && opts.recharging) || opts.artifactRecharge) {
			partial += (1 / (20 - 5 * opts.weaponRechargingRank)) * turns;
		}
		if (partial >= 1) {
			charges++;
			partial--;
		}
	} else {
		partial = 0;
	}
	return { charges, partial };
}

/** `beforeAbilityUsed`'s partial-first spend. Null when `execute` would refuse:
 * `charges + partialCharge < cost` (`ability_no_charge`). */
export function spendWeaponCharge(state: WeaponChargeState, cost: number): WeaponChargeState | null {
	if (state.charges + state.partial < cost) return null;
	let { charges, partial } = state;
	partial -= cost;
	while (partial < 0 && charges > 0) {
		charges--;
		partial++;
	}
	return { charges, partial };
}

/** `Charger.gainCharge()`: the `COUNTER_ABILITY`/`VARIED_CHARGE` refund path, with
 * Java's own clamp (whole charges banked, remainder dropped at the cap). */
export function gainWeaponCharge(state: WeaponChargeState, amount: number, cap: number): WeaponChargeState {
	if (state.charges >= cap) return state;
	let { charges, partial } = state;
	partial += amount;
	while (partial >= 1) {
		charges++;
		partial--;
	}
	if (charges >= cap) {
		charges = cap;
		partial = 0;
	}
	return { charges, partial };
}

/** `baseChargeUse`: 1 for every ability, 0 only inside the flail's spin and the swords'
 * free re-cleave windows. */
export function weaponAbilityChargeCost(kind: WeaponAbilityKind, windows: { cleaveFree: boolean; spinning: boolean }): number {
	if (kind === 'cleave' && windows.cleaveFree) return 0;
	if (kind === 'spin' && windows.spinning) return 0;
	return 1;
}

/** `Talent.COUNTER_ABILITY` refund in charges by rank (1-4): `points*0.375`. */
export function counterAbilityRefund(rank: number): number {
	return Math.max(0, Math.min(4, rank)) * 0.375;
}

export type WeaponAbilityKind =
	| 'sneak' | 'heavyBlow' | 'cleave' | 'spin' | 'guard' | 'comboStrike'
	| 'spike' | 'lunge' | 'harvest' | 'swordDance' | 'defensiveStance'
	| 'retribution' | 'chargedShot' | 'runicSlash' | 'lash';

export interface WeaponAbilityDef {
	kind: WeaponAbilityKind;
	/** Percent damage bonus (e.g. 35 = +35%), where the ability is a damage strike. */
	damageBonus?: number;
	/** Buff turns granted (guard window, stances). Sneak's invisibility is `2+weaponLevel`
	 * from the code (`Dagger.sneakAbility`'s `invisTurns`, applied minus one by its own
	 * `prolong`), not a table value. */
	buffTurns?: number;
	/** Spin count cap (flail only). */
	maxSpins?: number;
}

/**
 * Per-weapon ability table. Source class names are lower-cased compact ids (the same
 * `sourceClass` payload generated weapons carry); magnitudes are each weapon's own
 * `ability_desc` (the shipped descs' "costs 2 charges" lines predate v3.3.8 and are wrong -
 * every cost here is Java's `baseChargeUse`, uniformly 1):
 * - sneak (blink ranges 3/4/5 tiles for blade/dirk/dagger, `(2+level)-1` turns invis; the
 *   blink itself has no expression - no cell targeting here - stated in PORT_COVERAGE)
 * - heavy blow (`battleaxe` +35 / `handaxe` +45 / `mace` +40 / `warhammer` +30, +daze 5;
 *   surprise gates the bonus only, never the cost)
 * - cleave (`greatsword` +20 / `longsword` +23 / `sword` +27 / `shortsword` +30 /
 *   `wornshortsword` +33, free re-cleave within 5 turns on a kill)
 * - spin (`flail`: first spin costs 1, further spins free, +33%/spin to 3 spins,
 *   guaranteed hit while spinning)
 * - guard (`greatshield` 6 / `roundshield` 8 turns of negating the next attack)
 * - combo strike (`gauntlet` +35 / `sai` +40 / `gloves` +45 per recent hit in 5 turns)
 * - spike (`glaive` +30 / `spear` +45, knockback, ranged non-adjacent)
 * - lunge (`katana` +35 / `rapier` +67, steps toward a 1-away enemy)
 * - harvest (`sickle` bleed 100% / `warscythe` bleed 80% of damage)
 * - sword dance (`scimitar`: +60% attack speed, +25% accuracy, 5 turns, free to start)
 * - defensive stance (`quarterstaff`: 3x evasion 5 turns, free to start)
 * - retribution (`greataxe`: +50% below half health, guaranteed hit)
 * - charged shot (`crossbow`: next dart always hits, 5x5 on-hit area, free to ready)
 * - runic slash (`runicblade`: +300% enchantment power, guaranteed hit)
 * - lash (`whip`: normal attack vs all in range, closest guaranteed)
 */
const ABILITIES: Record<string, WeaponAbilityDef> = {
	assassinsblade: { kind: 'sneak' },
	dirk: { kind: 'sneak' },
	dagger: { kind: 'sneak' },
	battleaxe: { kind: 'heavyBlow', damageBonus: 35 },
	handaxe: { kind: 'heavyBlow', damageBonus: 45 },
	mace: { kind: 'heavyBlow', damageBonus: 40 },
	warhammer: { kind: 'heavyBlow', damageBonus: 30 },
	greatsword: { kind: 'cleave', damageBonus: 20 },
	longsword: { kind: 'cleave', damageBonus: 23 },
	sword: { kind: 'cleave', damageBonus: 27 },
	shortsword: { kind: 'cleave', damageBonus: 30 },
	wornshortsword: { kind: 'cleave', damageBonus: 33 },
	flail: { kind: 'spin', damageBonus: 33, maxSpins: 3 },
	greatshield: { kind: 'guard', buffTurns: 6 },
	roundshield: { kind: 'guard', buffTurns: 8 },
	gauntlet: { kind: 'comboStrike', damageBonus: 35 },
	sai: { kind: 'comboStrike', damageBonus: 40 },
	gloves: { kind: 'comboStrike', damageBonus: 45 },
	glaive: { kind: 'spike', damageBonus: 30 },
	spear: { kind: 'spike', damageBonus: 45 },
	katana: { kind: 'lunge', damageBonus: 35 },
	rapier: { kind: 'lunge', damageBonus: 67 },
	sickle: { kind: 'harvest', damageBonus: 100 },
	warscythe: { kind: 'harvest', damageBonus: 80 },
	scimitar: { kind: 'swordDance', buffTurns: 5 },
	quarterstaff: { kind: 'defensiveStance', buffTurns: 5 },
	greataxe: { kind: 'retribution', damageBonus: 50 },
	crossbow: { kind: 'chargedShot' },
	runicblade: { kind: 'runicSlash', damageBonus: 300 },
	whip: { kind: 'lash' },
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
