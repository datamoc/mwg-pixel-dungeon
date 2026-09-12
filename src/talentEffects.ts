import type { ClassId } from './classes';

/** Pure, scene-independent rules for the small talent procs implemented by the port. */
/** Invented substitute for real Java's `IRON_WILL` (`BrokenSeal.java`, tag `v3.3.8`): a flat
 * `+points` boost to a `BrokenSeal` armor-seal's shield capacity (`3 + 2*armTier + points`),
 * an item this port doesn't have at all. Absent a seal to scale, this instead grants a flat
 * `points` reduction to incoming damage below 50% HP - undocumented until the 2026-09-09
 * hero-progression audit; not rebuilt to the real mechanic here since it needs the seal item
 * (and armor-tier tracking on it) built first. */
export function ironWillReduction(hp: number, maxHp: number, rank: number): number {
	return rank > 0 && hp <= maxHp * 0.5 ? rank : 0;
}

export function shieldBatteryGain(blocked: number, rank: number): number {
	return blocked > 0 && rank > 0 ? rank : 0;
}

export function rejuvenatingStepHeal(terrain: number, grass: number, hp: number, maxHp: number, rank: number): number {
	return terrain === grass && rank > 0 ? Math.min(Math.max(0, maxHp - hp), rank) : 0;
}

/** `GreaterHaste.set(2 + 2*points)` turns granted by Lethal Haste on a hero-caused kill. */
export function lethalHasteDuration(rank: number): number {
	return 2 + 2 * rank;
}

/** `Talent.LethalHasteCooldown`, 100 turns gating the next GreaterHaste grant. */
export const LETHAL_HASTE_COOLDOWN = 100;

/** `Hero.damageRoll()`'s Weapon Recharging line: `round(dmg*1.025 + 0.025*points)` while the
 * hero holds a Recharging-class buff - a melee damage multiplier, not a charge refund. */
export function weaponRechargingDamage(damage: number, rank: number): number {
	return Math.round(damage * 1.025 + 0.025 * rank);
}

/** `Level.observe()`/`updateVisibility()`'s Farsight line: sight radius scales by
 * `1 + 0.25*points` - a vision multiplier, not a targeting range. */
export function farsightMultiplier(subclass: string | null, rank: number): number {
	return subclass === 'sniper' ? 1 + 0.25 * rank : 1;
}

export function shieldingDewGain(subclass: string | null, rank: number): number {
	return subclass === 'warden' && rank > 0 ? rank : 0;
}

export function preservationChance(rank: number): number {
	return rank === 1 ? 0.2 : rank >= 2 ? 0.35 : 0;
}

export function ironStomachReduction(classId: ClassId, rank: number): number {
	return classId === 'warrior' ? 2 * rank : 0;
}

export function cachedRationChance(classId: ClassId, rank: number): number {
	return classId === 'rogue' ? 0.2 * rank : 0;
}

export function canImproviseProjectile(classId: ClassId, rank: number, stones: number): boolean {
	return classId === 'warrior' && rank > 0 && stones > 0;
}

export function evasiveArmorBonus(subclass: string | null, rank: number, armorLevel: number): number {
	return subclass === 'freerunner' ? rank * armorLevel : 0;
}

export function assassinReachBonus(subclass: string | null, rank: number): number {
	return subclass === 'assassin' ? rank : 0;
}

export function empoweredStrikeBonus(subclass: string | null, rank: number): number {
	return subclass === 'battlemage' ? rank : 0;
}

export function bountyGoldBonus(subclass: string | null, rank: number): number {
	return subclass === 'assassin' ? 5 * rank : 0;
}

export function unencumberedSpiritEvasion(subclass: string | null, rank: number): number {
	return subclass === 'monk_sub' ? rank : 0;
}

export function lethalDefenseShield(subclass: string | null, rank: number): number {
	return subclass === 'gladiator' ? rank : 0;
}

/** Invented substitute for real Java's `MONASTIC_VIGOR` (`MonkEnergy.java`, tag `v3.3.8`):
 * `energy/energyCap() >= 1.2 - 0.2*points`, a threshold on the Monk subclass's own separate
 * energy resource this port doesn't model at all. Absent that resource, this instead grants a
 * flat `rank` shield on the Cleric-shaped Holy Tome heal (`useSpecial`'s `'none'` branch) -
 * undocumented until the 2026-09-09 hero-progression audit; not rebuilt to the real mechanic
 * here since it needs the whole Monk energy resource built first. */
export function monasticVigorShield(subclass: string | null, rank: number): number {
	return subclass === 'monk_sub' ? rank : 0;
}

export function sharedUpgradeArmor(subclass: string | null, rank: number, armorLevel: number): number {
	return subclass === 'sniper' && rank > 0 && armorLevel < 3 ? 1 : 0;
}

/** Substitute for real Java's `TWIN_UPGRADES` (`MeleeWeapon.java`, tag `v3.3.8`): equalizes
 * tier between two *simultaneously wielded* weapons on upgrade - this port has no dual-wield
 * system at all, so there is no second weapon to equalize against. Repurposed instead to boost
 * armor-tier progression during a weapon upgrade (the same shape `shared_upgrades`/Sniper
 * already uses) - undocumented until the 2026-09-09 hero-progression audit; not rebuilt to the
 * real mechanic here since it needs dual-wielding built first. */
export function twinUpgradeArmor(subclass: string | null, rank: number, armorLevel: number): number {
	return subclass === 'champion' && rank > 0 && armorLevel < 3 ? 1 : 0;
}

export function soulSiphonCharge(subclass: string | null, rank: number): number {
	return subclass === 'warlock' ? rank : 0;
}

export function projectileMomentumBonus(subclass: string | null, rank: number, ready: boolean): number {
	return subclass === 'freerunner' && ready ? rank : 0;
}

export function enragedCatalystBonus(subclass: string | null, rank: number, hp: number, maxHp: number): number {
	return subclass === 'berserker' && hp <= maxHp * 0.5 ? rank : 0;
}

export function cleaveComboSeed(subclass: string | null, rank: number): number {
	return subclass === 'gladiator' && rank > 0 ? 2 : 0;
}

export function deathlessFuryTriggers(subclass: string | null, rank: number, used: boolean, damage: number, hp: number): boolean {
	return !used && subclass === 'berserker' && rank > 0 && damage >= hp;
}

/** `Wand.wandProc()`'s Arcane Vision line: a `CharAwareness`-class mark lasting
 * `5 + 5*points` turns on the zapped target - a per-target reveal, not a secret radius. */
export function arcaneVisionDuration(rank: number): number {
	return 5 + 5 * rank;
}

/** `NECROMANCERS_MINIONS` roll (`Mob.die()`): `0.4*points/3` on a soul-marked victim's
 * death. Kept as a formula reference only - no call site remains until SoulMark, Wraith,
 * and ally combat exist (see the removed kill-site stand-in's note in main.ts). */
export function necromancerMinionChance(subclass: string | null, rank: number): number {
	return subclass === 'warlock' ? [0, 0.13, 0.27, 0.4][Math.min(3, rank)] : 0;
}
