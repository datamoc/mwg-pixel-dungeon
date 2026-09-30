import type { SimulationRandom } from './random';

export interface WeaponAffixState {
	affix: string | null;
	isLiveHero: boolean;
	enchantProcMultiplier: number;
	attackerHp: number;
	attackerMaxHp: number;
	defenderIsNpc: boolean;
	defenderImmovable: boolean;
}

export interface WeaponAffixResolution {
	damage: number;
	applySacrificialBleeding: boolean;
	sacrificialBleedAmount: number;
	displaceDefender: boolean;
}

/** Resolves attack-time weapon-affix rolls from `Weapon.proc()` (tag `v3.3.8`). */
export function resolveAttackWeaponAffixes(
	damage: number,
	state: WeaponAffixState,
	random: SimulationRandom,
): WeaponAffixResolution {
	let applySacrificialBleeding = false;
	let sacrificialBleedAmount = 0;
	let displaceDefender = false;
	if (state.isLiveHero && state.affix === 'polarized') {
		damage = random.chance(0.5) ? Math.round(damage * 1.5) : 0;
	}
	if (state.isLiveHero && state.affix === 'sacrificial'
		&& random.chance((1 / 10) * state.enchantProcMultiplier)) {
		sacrificialBleedAmount = (state.attackerHp / state.attackerMaxHp) ** 2 * state.attackerMaxHp / 8;
		applySacrificialBleeding = random.chance(sacrificialBleedAmount);
	}
	if (state.isLiveHero && state.affix === 'displacing' && !state.defenderIsNpc && !state.defenderImmovable) {
		displaceDefender = random.chance((1 / 12) * state.enchantProcMultiplier);
	}
	return { damage, applySacrificialBleeding, sacrificialBleedAmount, displaceDefender };
}
/**
 * Weapon enchant/curse proc chances - the pure decision half of each `Weapon.proc()` branch
 * (`items/weapon/enchantments/*.java`, curses under `items/weapon/curses/`, tag `v3.3.8`).
 * Extracted from the post-hit affix chain in combatResolution so the parity kit (BACKLOG B7)
 * checks the *same* chances the game rolls rather than a second copy of them.
 * Behavior-identical: the same formulas in the same order; the `Random.chance` rolls, the
 * per-branch gates (killing hit, buff presence, hero/delegated wielder) and all effects stay
 * scene-side. Each formula verified against its Java class; the shared `multiplier` is the
 * port's `enchantProcMultiplier()` (Arcana-inclusive, per the ring row).
 */

/** `Blazing.proc()` (33/50/60% at 0/1/2): `(level+1)/(level+3) x arcana`. */
export function blazingProcChance(level: number, multiplier: number): number {
	return ((level + 1) / (level + 3)) * multiplier;
}

/** `Blooming.proc()`: `(level+1)/(level+3) x arcana`. */
export function bloomingProcChance(level: number, multiplier: number): number {
	return ((level + 1) / (level + 3)) * multiplier;
}

/** `Chilling.proc()` (25/40/50% at 0/1/2): `(level+1)/(level+4) x arcana`. */
export function chillingProcChance(level: number, multiplier: number): number {
	return ((level + 1) / (level + 4)) * multiplier;
}

/** `Elastic.proc()`: `(level+1)/(level+5) x arcana`. */
export function elasticProcChance(level: number, multiplier: number): number {
	return ((level + 1) / (level + 5)) * multiplier;
}

/** `Lucky.proc()`: `(buffedLvl+4)/(buffedLvl+40) x arcana` - only a would-be-killing hit can
 * arm the deferred bonus (gate stays scene-side). */
export function luckyProcChance(level: number, multiplier: number): number {
	return ((level + 4) / (level + 40)) * multiplier;
}

/** `Blocking.proc()` (10% at 0): `(level+4)/(level+40) x arcana`. */
export function blockingProcChance(level: number, multiplier: number): number {
	return ((level + 4) / (level + 40)) * multiplier;
}

/** `Shocking.proc()`: flat `1/3 x arcana`. */
export function shockingProcChance(multiplier: number): number {
	return (1 / 3) * multiplier;
}

/** `Vampiric.proc()`: `(0.05 + 0.25 x missing-HP fraction) x arcana`, 5% unhurt to 30%. */
export function vampiricHealChance(attackerHp: number, attackerMaxHp: number, multiplier: number): number {
	const missing = attackerMaxHp > 0 ? (attackerMaxHp - attackerHp) / attackerMaxHp : 0;
	return (0.05 + 0.25 * missing) * multiplier;
}

/** `Explosive` fuse wear: each hit removes `round(IntRange(0,10) x arcana)` from the
 * 100-point fuse (mean 5, ~20 hits per explosion). Takes the rolled draw. */
export function explosiveFuseWear(rawDraw: number, multiplier: number): number {
	return Math.round(rawDraw * multiplier);
}

/** `Dazzling.proc()`: `1/10 x arcana`. */
export function dazzlingProcChance(multiplier: number): number {
	return (1 / 10) * multiplier;
}

/** `Annoying.proc()`: `1/20 x arcana`. */
export function annoyingProcChance(multiplier: number): number {
	return (1 / 20) * multiplier;
}

/** `Wayward.proc()`: `1/4 x arcana` toggles the wielder's buff (toggle stays scene-side). */
export function waywardProcChance(multiplier: number): number {
	return (1 / 4) * multiplier;
}
/** `Friendly.proc()` (`items/weapon/curses/Friendly.java`, tag `v3.3.8`): `1/10 x arcana`,
 * charming both sides of the exchange (payloads stay scene-side). */
export function friendlyProcChance(multiplier: number): number {
	return (1 / 10) * multiplier;
}

