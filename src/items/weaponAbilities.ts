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
 * port uses). The base gain is gated on `Regeneration.regenOn()` (the boss-arena lock - see
 * `simulation/regeneration.ts`); the Recharging/ArtifactRecharge bonus is not, as in Java.
 * Brawler's stance has no expression (no such buff exists here) - stated, not silent. */
export function accrueWeaponCharge(
	state: WeaponChargeState,
	opts: { cap: number; champion: boolean; weaponRechargingRank: number; recharging: boolean; artifactRecharge: boolean; regenOn?: boolean },
	turns = 1,
): WeaponChargeState {
	let { charges, partial } = state;
	if (charges < opts.cap) {
		if (opts.regenOn !== false) partial += (1 / (60 - 1.5 * (opts.cap - charges))) * (opts.champion ? 1.5 : 1) * turns;
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

/** `Weapon.Augment.damageFactor(int)`: `Math.round(dmg * factor)` - SPEED 0.7, DAMAGE
 * 1.5, NONE 1.0 (tag `v3.3.8`, `Weapon.java` 91-109). */
export function augmentDamageFactor(augment: 'damage' | 'speed' | 'none' | null | undefined, dmg: number): number {
	const factor = augment === 'damage' ? 1.5 : augment === 'speed' ? 0.7 : 1;
	return Math.round(dmg * factor);
}

/** An ability's flat `dmgBoost`: `augment.damageFactor(base + round(scale*lvl))`, with the
 * rounding outside the sum where Java writes it that way (`Sickle`/`WarScythe` round the
 * whole `15+2.5*lvl`/`30+4.5*lvl`; every other strike rounds only the `scale*lvl` term).
 * Pass the Degrade-aware level (this port's `degradedLevel`), matching `buffedLvl()`. */
export function abilityFlatBoost(base: number, perLevel: number, weaponLevel: number, augment: 'damage' | 'speed' | 'none' | null | undefined, roundSum: boolean): number {
	const raw = roundSum ? Math.round(base + perLevel * weaponLevel) : base + Math.round(perLevel * weaponLevel);
	return augmentDamageFactor(augment, raw);
}

/** `Talent.PRECISE_ASSAULT` accuracy by rank (`Hero.attackSkill`, tag `v3.3.8`):
 * 2x/5x/infinite at 1/2/3 - not `2^points` (that misread gave 4x/8x at 2/3). */
export function preciseAssaultAccuracy(rank: number): number {
	if (rank >= 3) return Number.POSITIVE_INFINITY;
	if (rank === 2) return 5;
	return 2;
}

export type WeaponAbilityKind =
	| 'sneak' | 'heavyBlow' | 'cleave' | 'spin' | 'guard' | 'comboStrike'
	| 'spike' | 'lunge' | 'harvest' | 'swordDance' | 'defensiveStance'
	| 'retribution' | 'chargedShot' | 'runicSlash' | 'lash';

export interface WeaponAbilityFlatBoost {
	base: number;
	perLevel: number;
	roundSum: boolean;
}

export interface WeaponAbilityDef {
	kind: WeaponAbilityKind;
	/** Flat-damage boost `{base, perLevel}` where the ability adds to the roll (Java's
	 * `dmgBoost`, augment-scaled at use - never a percent). Harvest's `bleedAmt` rides
	 * the same shape (multi 0, damage replaced by the amount). */
	flatBoost?: WeaponAbilityFlatBoost;
	/** Spin count cap (flail only). */
	maxSpins?: number;
	/** Blink range in tiles (sneak only: blade 3 / dirk 4 / dagger 5, from each weapon's `sneakAbility` call). */
	blinkRange?: number;
}

/**
 * Per-weapon ability table. Source class names are lower-cased compact ids (the same
 * `sourceClass` payload generated weapons carry); every cost here is Java's
 * `baseChargeUse`, uniformly 1 (the shipped descs' "costs 2 charges" lines predate
 * v3.3.8 and are wrong). Damage strikes carry Java's flat `dmgBoost` `{base, perLevel}`
 * (augment-scaled at use via `abilityFlatBoost`) - never a percent: the old table read
 * percents out of `ability_desc` lines that actually print absolute min/max ranges
 * (`min()+dmgBoost`), which is why every number below changed in the 32nd matrix.
 * - sneak (blink ranges 3/4/5 tiles for blade/dirk/dagger, `(2+level)-1` turns invis; aimed
 *   through the `TargetingController` since 2026-09-17, free like Java's instant)
 * - heavy blow (`cudgel` 3 / `handaxe` 4 / `battleaxe` 5 / `mace` 5 / `warhammer` 6,
 *   each `+ round(1.5*level)`, +daze 5; surprise gates the bonus only, never the cost)
 * - cleave (`greatsword` 7 / `longsword` 6 / `sword` 5 / `shortsword` 4 /
 *   `wornshortsword` 3, each `+level`; killing cleave is free with a 4-turn free
 *   re-cleave window, a non-killing cleave clears it)
 * - spin (`flail`: first spin costs 1, further spins free, `spins*(8+2*level)` flat,
 *   guaranteed hit while spinning, tracker 3 turns)
 * - guard (`greatshield` 3+level / `roundshield` 5+level turns of infinite evasion)
 * - combo strike (`gauntlet` 5 / `sai` 4 / `gloves` 3, each `+level`, times recent hits
 *   in 5 turns; firing consumes the window)
 * - spike (`glaive` 12+2.5/level / `spear` 9+2/level, knockback 1, reach 2, never adjacent)
 * - lunge (`katana` 8+2/level / `rapier` 5+1.5/level; needs distance 2+, unrooted)
 * - harvest (`sickle` round(15+2.5*level) / `warscythe` round(30+4.5*level): damage
 *   replaced by the amount, applied as bleeding)
 * - sword dance (`scimitar`: +0.6 speed, x1.5 accuracy, 3+level turns, free to start)
 * - defensive stance (`quarterstaff`: 3x evasion, 3+level turns, free to start)
 * - retribution (`greataxe`: 15+2/level below half health, guaranteed hit, killing
 *   retribution is free)
 * - charged shot (`crossbow`: next dart always hits with +4+level damage (untipped),
 *   dart-proc splash, melee knockback 4; free to ready, cannot re-ready while armed)
 * - runic slash (`runicblade`: guaranteed hit, enchant proc chance +3+0.5/level)
 * - lash (`whip`: every enemy in reach 3, all guaranteed)
 */
const ABILITIES: Record<string, WeaponAbilityDef> = {
	assassinsblade: { kind: 'sneak', blinkRange: 3 },
	dirk: { kind: 'sneak', blinkRange: 4 },
	dagger: { kind: 'sneak', blinkRange: 5 },
	cudgel: { kind: 'heavyBlow', flatBoost: { base: 3, perLevel: 1.5, roundSum: false } },
	battleaxe: { kind: 'heavyBlow', flatBoost: { base: 5, perLevel: 1.5, roundSum: false } },
	handaxe: { kind: 'heavyBlow', flatBoost: { base: 4, perLevel: 1.5, roundSum: false } },
	mace: { kind: 'heavyBlow', flatBoost: { base: 5, perLevel: 1.5, roundSum: false } },
	warhammer: { kind: 'heavyBlow', flatBoost: { base: 6, perLevel: 1.5, roundSum: false } },
	greatsword: { kind: 'cleave', flatBoost: { base: 7, perLevel: 1, roundSum: false } },
	longsword: { kind: 'cleave', flatBoost: { base: 6, perLevel: 1, roundSum: false } },
	sword: { kind: 'cleave', flatBoost: { base: 5, perLevel: 1, roundSum: false } },
	shortsword: { kind: 'cleave', flatBoost: { base: 4, perLevel: 1, roundSum: false } },
	wornshortsword: { kind: 'cleave', flatBoost: { base: 3, perLevel: 1, roundSum: false } },
	flail: { kind: 'spin', flatBoost: { base: 8, perLevel: 2, roundSum: false }, maxSpins: 3 },
	greatshield: { kind: 'guard' },
	roundshield: { kind: 'guard' },
	gauntlet: { kind: 'comboStrike', flatBoost: { base: 5, perLevel: 1, roundSum: false } },
	sai: { kind: 'comboStrike', flatBoost: { base: 4, perLevel: 1, roundSum: false } },
	gloves: { kind: 'comboStrike', flatBoost: { base: 3, perLevel: 1, roundSum: false } },
	glaive: { kind: 'spike', flatBoost: { base: 12, perLevel: 2.5, roundSum: false } },
	spear: { kind: 'spike', flatBoost: { base: 9, perLevel: 2, roundSum: false } },
	katana: { kind: 'lunge', flatBoost: { base: 8, perLevel: 2, roundSum: false } },
	rapier: { kind: 'lunge', flatBoost: { base: 5, perLevel: 1.5, roundSum: false } },
	sickle: { kind: 'harvest', flatBoost: { base: 15, perLevel: 2.5, roundSum: true } },
	warscythe: { kind: 'harvest', flatBoost: { base: 30, perLevel: 4.5, roundSum: true } },
	scimitar: { kind: 'swordDance' },
	quarterstaff: { kind: 'defensiveStance' },
	greataxe: { kind: 'retribution', flatBoost: { base: 15, perLevel: 2, roundSum: false } },
	crossbow: { kind: 'chargedShot' },
	runicblade: { kind: 'runicSlash' },
	whip: { kind: 'lash' },
};

/** This port's compact source-class names to the table above (generated payloads vary in
 * case; starting weapons map by their bag id). */
export function weaponAbilityFor(sourceClass: string | undefined, weaponId: string): WeaponAbilityDef | null {
	const key = (sourceClass ?? weaponId).toLowerCase();
	if (key === 'startingweapon' || key === 'weaponreward') return null;
	return ABILITIES[key] ?? null;
}

/* `spinDamageMultiplier` (+33%/spin) lived here until the 32nd matrix: nothing in
 * any Java version computes a percent-per-spin - `Flail` adds `spins*(8+2*level)`
 * flat (`Flail.java` 87). Removed, not rebuilt; the scene reads the flat boost
 * straight from the table's `flatBoost` via `abilityFlatBoost`. */
