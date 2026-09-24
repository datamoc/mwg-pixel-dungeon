/**
 * Hero subclass passive mechanics - pure, scene-free translations of the real
 * Java formulas (tag `v3.3.8`), so the headless simulation suite can pin them
 * against Java's numbers. 41st analysis matrix
 * (`MONSTER_ANALYSIS_SUBCLASS_PASSIVES.md`).
 *
 * Covered: Berserker rage (`actors/buffs/Berserk.java`), Warlock soul mark
 * (`items/wands/Wand.java#wandProc`, `actors/mobs/Mob.java#defenseProc`/`die`,
 * `Talent.SOUL_EATER`/`SOUL_SIPHON`), Sniper mark (`Hero.java` SNIPER case,
 * `Talent.SHARED_UPGRADES`), Freerunner momentum (`actors/buffs/Momentum.java`,
 * `Talent.EVASIVE_ARMOR`/`PROJECTILE_MOMENTUM`/`SPEEDY_STEALTH`), Battlemage staff charge
 * (`items/weapon/melee/MagesStaff.java#proc`), Champion weapon-ability charge
 * (`items/weapon/melee/MeleeWeapon.java`, via `weaponAbilities.ts`).
 *
 * Deliberately absent (no port-side system to hang them on, recorded in the
 * matrix, not silently dropped): the three Sniper bow
 * specials (need bow augment + UI), Champion dual-wield/second weapon (no
 * `secondWep` model), Battlemage per-wand `onHit` effects (no staff imbue),
 * Warlock `NecromancersMinions` (no Wraith kind). The Gladiator's Combo and the
 * Monk's energy live in `simulation/combo.ts` / `simulation/monkEnergy.ts`; the
 * Cleric subclasses in `simulation/clericSpells.ts` (this header predates them).
 */

/** `Berserk.damage()`: cap is `1 + 0.1667 x ENDLESS_RAGE ranks`. */
export function berserkMaxPower(endlessRageRank: number): number {
	return 1 + 0.1667 * Math.max(0, endlessRageRank);
}

/** `Berserk.damage()`: `power + (damage/HT)/4`, capped. */
export function berserkAccruePower(power: number, damage: number, maxHp: number, maxPower: number): number {
	if (maxHp <= 0) return power;
	return Math.min(maxPower, power + damage / maxHp / 4);
}

const clamp = (lo: number, v: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/**
 * `Berserk.act()` NORMAL branch:
 * `power -= gate(0.1, power, 1) x 0.05 x (HP/HT)^2`. `GameMath.gate` clamps.
 */
export function berserkDecayPower(power: number, hp: number, maxHp: number): number {
	if (maxHp <= 0) return power;
	const ratio = hp / maxHp;
	return power - clamp(0.1, power, 1) * 0.05 * ratio * ratio;
}

/** `Berserk.damageFactor()`: `dmg x min(1.5, 1 + power/2)`. */
export function berserkDamageFactor(damage: number, power: number): number {
	return damage * Math.min(1.5, 1 + power / 2);
}

/**
 * `Berserk.currentShieldBoost()`: `round((8 + 2 x armor buffedLvl) x
 * (1 + 2 x (1-HP/HT)^3) x (power > 1 ? power : 1))`. The `power > 1` branch is
 * the Endless Rage over-cap effect (it also scales the recoveries, which this
 * port folds into a single turn counter - stated in the matrix).
 */
export function berserkShieldBoost(hp: number, maxHp: number, armorBuffedLevel: number, power: number): number {
	if (maxHp <= 0) return 0;
	const missing = 1 - hp / maxHp;
	const multiplier = (1 + 2 * missing * missing * missing) * (power > 1 ? power : 1);
	return Math.round((8 + 2 * Math.max(0, armorBuffedLevel)) * multiplier);
}

/** `Berserk.act()` BERSERK branch: `ceil(shielding x 0.025)` per turn. */
export function berserkShieldDrain(shielding: number): number {
	return Math.ceil(Math.max(0, shielding) * 0.025);
}

/** `Berserk` recovery constants. */
export const BERSERK_TURN_RECOVERY_START = 100;
export const BERSERK_LEVEL_RECOVERY_START = 4;

/**
 * `Combo.hit()`: a landed hit refreshes the window to at least 5; a killing
 * hit extends it to `15 + 15 x CLEAVE ranks` (the `Talent.CLEAVE` desc:
 * 15/30/45 turns). The port counts the window in hero turns rather than
 * fractional actor ticks - stated, not silent.
 */
export const COMBO_HIT_WINDOW = 5;
export function comboKillWindow(cleaveRank: number): number {
	return 15 + 15 * Math.max(0, cleaveRank);
}

/** Combo move thresholds (`Combo.ComboMove`), for the unlock log line. */
export const COMBO_MOVE_THRESHOLDS = [2, 4, 6, 8, 10];

/**
 * `Wand.wandProc()`'s Warlock branch: mark when
 * `Random.Float() > 0.92^(wandLevel x chargesUsed + 1) - 0.07` (a standard
 * `1 - 0.92^x` roll plus 7%, starting at 15%).
 */
export function warlockMarkThreshold(wandLevel: number, chargesUsed: number): number {
	return Math.pow(0.92, wandLevel * chargesUsed + 1) - 0.07;
}

/** `SoulMark.DURATION` (10) plus one turn per wand level. */
export function soulMarkDuration(wandLevel: number): number {
	return 10 + Math.max(0, wandLevel);
}

export interface SoulMarkHeal {
	/** HP actually restored (`ceil(restoration x 0.4)`). */
	heal: number;
	/** Hunger (satiety) restored (`restoration x SOUL_EATER ranks / 3`). */
	satiety: number;
}

/**
 * `Mob.defenseProc()`'s SoulMark branch: `restoration = min(damage, HP +
 * shielding)`; damage not from the hero is scaled by
 * `0.4 x SOUL_SIPHON ranks / 3` (13/27/40% - the talent desc); the heal is
 * `ceil(restoration x 0.4)` (the subclass desc: 2 HP per 5 damage); hunger is
 * fed `restoration x SOUL_EATER ranks / 3` (the talent desc: 0.33/0.67/1 turn
 * of satiety per damage). Only melee/thrown/bow damage reaches `defenseProc`
 * in Java - wand zaps call `damage()` directly, so the port hooks this only
 * on its non-zap paths and the melee-only gate comes free.
 */
export function soulMarkHeal(
	damage: number,
	victimHp: number,
	victimShield: number,
	attackerIsHero: boolean,
	soulSiphonRank: number,
	soulEaterRank: number,
): SoulMarkHeal {
	let restoration = Math.min(Math.max(0, damage), Math.max(0, victimHp) + Math.max(0, victimShield));
	if (!attackerIsHero) restoration = Math.round(restoration * 0.4 * Math.max(0, soulSiphonRank) / 3);
	if (restoration <= 0) return { heal: 0, satiety: 0 };
	return { heal: Math.ceil(restoration * 0.4), satiety: restoration * Math.max(0, soulEaterRank) / 3 };
}

/** `Mob.die()`'s Soul Eater branch: `Random.Int(10) < SOUL_EATER ranks`. */
export function soulEaterOnEatChance(soulEaterRank: number): number {
	return Math.max(0, soulEaterRank) / 10;
}

/**
 * The Hero Sniper case: `prolong(SnipersMark, 4 + levelBonus).set(id,
 * levelBonus/6)` with `levelBonus = min(2 x SHARED_UPGRADES ranks, thrown
 * weapon buffedLvl)` - and a bare 4-turn mark without the talent. The desc
 * (10/20/30% per level) is the same `levelBonus/6` at the rank's own cap
 * (2/4/6 levels): 2/6, 4/6... stated in the matrix.
 */
export function sniperMarkDuration(sharedUpgradesRank: number, weaponLevel: number): number {
	const bonus = Math.min(2 * Math.max(0, sharedUpgradesRank), Math.max(0, weaponLevel));
	return 4 + bonus;
}

export function sniperMarkBonus(sharedUpgradesRank: number, weaponLevel: number): number {
	return Math.min(2 * Math.max(0, sharedUpgradesRank), Math.max(0, weaponLevel)) / 6;
}

/** `SnipersMark.DURATION` without the talent. */
export const SNIPER_MARK_BASE_DURATION = 4;

/**
 * `Momentum.act()`'s idle branch:
 * `stacks = gate(0, stacks - 1, round(stacks x 0.667))`.
 */
export function momentumDecay(stacks: number): number {
	return clamp(0, Math.round(stacks * 0.667), Math.max(0, stacks) - 1);
}

/** `Momentum` caps: 10 stacks, 2 freerun turns per stack, `10 + 4 x stacks` cooldown. */
export const MOMENTUM_MAX_STACKS = 10;
export function freerunTurns(stacks: number): number {
	return 2 * Math.max(0, stacks);
}
export function freerunCooldown(stacks: number): number {
	return 10 + 4 * Math.max(0, stacks);
}

/**
 * `Momentum.evasionBonus()`: `heroLvl/2 + excessArmorStr x EVASIVE_ARMOR
 * ranks`, while freerunning only. Called from `Armor.java` with
 * `max(0, -aEnc)` (excess STR over the armor requirement, floored at 0);
 * `heroLvl/2` is Java int division.
 */
export function freerunEvasion(heroLevel: number, excessStr: number, evasiveArmorRank: number): number {
	return Math.floor(Math.max(0, heroLevel) / 2) + Math.max(0, excessStr) * Math.max(0, evasiveArmorRank);
}

/** `Momentum.speedMultiplier()`: x2 while freerunning. */
export function freerunSpeedMultiplier(freerunning: boolean): number {
	return freerunning ? 2 : 1;
}

/** `Hero.attackSkill()`'s freerun branch: `accuracy x (1 + PROJECTILE_MOMENTUM ranks/2)`. */
export function projectileMomentumAccuracy(projectileMomentumRank: number): number {
	return 1 + Math.max(0, projectileMomentumRank) / 2;
}

/**
 * `MonkEnergy.gainEnergy()`: 5 for bosses, 3 for minibosses, 0.5 for ghouls,
 * ripper demons, Yog larvae and wraiths, 1 otherwise.
 */
export function monkEnergyBaseGain(victim: { boss: boolean; miniboss: boolean; halfEnergy: boolean }): number {
	if (victim.boss) return 5;
	if (victim.miniboss) return 3;
	if (victim.halfEnergy) return 0.5;
	return 1;
}

/** `MonkEnergy.energyCap()`: `max(10, 5 + lvl/2)` (Java int division). */
export function monkEnergyCap(heroLevel: number): number {
	return Math.max(10, 5 + Math.floor(Math.max(0, heroLevel) / 2));
}

/**
 * `Talent.UNENCUMBERED_SPIRIT`'s energy multiplier: each qualifying piece
 * (armor, then melee weapon) adds +1.00/+0.75/+0.50 at tier<=1&3pts,
 * tier<=2&2pts, tier<=3&1pts. The weapon piece needs a melee weapon (the
 * Brawler's-stance exclusion has no port-side buff to read - stated).
 */
export function unencumberedEnergyMultiplier(
	points: number,
	armorTier: number | null,
	weaponTier: number | null,
	weaponIsMelee: boolean,
): number {
	let multi = 1;
	const piece = (tier: number | null): number => {
		if (tier === null) return 0;
		if (tier <= 1 && points >= 3) return 1;
		if (tier <= 2 && points >= 2) return 0.75;
		if (tier <= 3 && points >= 1) return 0.5;
		return 0;
	};
	multi += piece(armorTier);
	if (weaponIsMelee) multi += piece(weaponTier);
	return multi;
}

/**
 * `MagesStaff.proc()`'s Battlemage branch: `wand.partialCharge += 0.5` while
 * the wand is not full (`ScrollOfRecharging.charge()` there is particles
 * only; each wand's own `onHit` needs the staff-imbue model this port does
 * not have - recorded, not faked).
 */
export const BATTLEMAGE_STAFF_PARTIAL_CHARGE = 0.5;
