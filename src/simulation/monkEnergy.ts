/**
 * The Duelist Monk's `MonkEnergy` resource and its five abilities (`actors/buffs/MonkEnergy.java`, tag
 * `v3.3.8`) as pure functions. The scene (`scenes/dungeon/hero/monkAbilities.ts`) owns the state, the
 * aiming and the swings.
 */

export type MonkAbilityId = 'flurry' | 'focus' | 'dash' | 'dragonKick' | 'meditate';

/** `MonkAbility.abilities` in Java's order (the order `WndMonkAbilities` lists them), with `energyCost()`. */
export const MONK_ABILITIES: ReadonlyArray<{ id: MonkAbilityId; cost: number }> = [
	{ id: 'flurry', cost: 1 },
	{ id: 'focus', cost: 2 },
	{ id: 'dash', cost: 3 },
	{ id: 'dragonKick', cost: 4 },
	{ id: 'meditate', cost: 5 },
];

/** `energyCap()`: 10 at the start, 20 at level 30. */
export function monkEnergyCap(heroLevel: number): number {
	return Math.max(10, 5 + Math.floor(heroLevel / 2));
}

/** `gainEnergy`'s base per kill: bosses 5, minibosses 3, Ghoul / RipperDemon / Larva / Wraith half, everyone else 1. */
export function monkEnergyPerKill(enemy: { boss?: boolean; miniboss?: boolean; kind?: string }): number {
	if (enemy.boss) return 5;
	if (enemy.miniboss) return 3;
	if (enemy.kind === 'ghoul' || enemy.kind === 'ripperDemon' || enemy.kind === 'larva' || enemy.kind === 'wraith') return 0.5;
	return 1;
}

/**
 * Unencumbered Spirit's gain multiplier: 1 plus a bonus for the worn armor's tier and another for the wielded
 * melee weapon's tier - +1.00 at tier <= 1 with 3 points, +0.75 at tier <= 2 with 2, +0.50 at tier <= 3 with 1
 * (each `else if` chain checks the tiers in that order). `null` tier means nothing worn / no melee weapon.
 */
export function monkEnergyGainMultiplier(unencumberedRank: number, armorTier: number | null, weaponTier: number | null): number {
	const bonus = (tier: number | null): number => {
		if (tier === null) return 0;
		if (tier <= 1 && unencumberedRank >= 3) return 1.0;
		if (tier <= 2 && unencumberedRank >= 2) return 0.75;
		if (tier <= 3 && unencumberedRank >= 1) return 0.5;
		return 0;
	};
	return 1 + bonus(armorTier) + bonus(weaponTier);
}

/** `energy += gain`, capped unless an ability is mid-use (a kill made by an unarmed ability defers the cap). */
export function monkEnergyAfterGain(energy: number, gain: number, cap: number, deferCap: boolean): number {
	const next = energy + gain;
	return deferCap ? next : Math.min(next, cap);
}

/** `abilityUsed()`: the cost is paid and the result re-capped. */
export function monkEnergyAfterAbility(energy: number, cost: number, cap: number): number {
	return Math.min(energy - cost, cap);
}

/** `abilitiesEmpowered()`: 100% / 80% / 60% of the cap at Monastic Vigor +1 / +2 / +3 (120% with none). */
export function monkAbilitiesEmpowered(energy: number, cap: number, monasticVigorRank: number): boolean {
	return energy / cap >= 1.2 - 0.2 * monasticVigorRank;
}

/** Unarmed damage range (`RingOfForce.damageRoll` without a Ring of Force): `1 .. max(STR - 8, 1)`. */
export function monkUnarmedRange(str: number): [number, number] {
	return [1, Math.max(str - 8, 1)];
}

export const MONK_FLURRY_MULTIPLIER = 1.5;

/** Dragon Kick's damage multiplier: 6x, 9x when empowered. */
export function monkDragonKickMultiplier(empowered: boolean): number {
	return empowered ? 9 : 6;
}

/** Dash range: 4 cells, 8 when empowered. */
export function monkDashRange(empowered: boolean): number {
	return empowered ? 8 : 4;
}

/** Dragon Kick's paralysis: `min(6, cells the target travelled)`, only if it travelled at all. */
export function monkDragonKickParalysis(distance: number): number {
	return distance > 0 ? Math.min(6, distance) : 0;
}

/** Empowered Meditate heals `round((HT - HP) / 5)` over time. */
export function monkMeditateHeal(maxHp: number, hp: number): number {
	return Math.max(0, Math.round((maxHp - hp) / 5));
}

/** Meditate Resistance (and only while it runs): damage taken x0.2. */
export const MONK_MEDITATE_DAMAGE_FACTOR = 0.2;
