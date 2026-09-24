/**
 * The Warrior's `BrokenSeal.WarriorShield` (`items/BrokenSeal.java`, `actors/Char.damage()`, tag `v3.3.8`;
 * identical in `4.0.0-beta` and `v4.0.0`) as pure functions. The shield is not a regenerating pool: it
 * ACTIVATES in one go when the hero is hit down to half HP, then cools down for 150 turns and is dropped
 * once the hero has seen no enemy for five turns. The scene keeps the state and the shield pool itself.
 */

export const SEAL_COOLDOWN_START = 150;

export interface SealState {
	cooldown: number;
	turnsSinceEnemies: number;
	initialShield: number;
}

/** `BrokenSeal.maxShield(armTier, armLvl)`: 3 + 2 x armor tier + Iron Will ranks (5-15); the armor's level plays no part. */
export function sealMaxShield(armorTier: number, ironWillRank: number): number {
	return 3 + 2 * armorTier + ironWillRank;
}

/**
 * `Char.damage()`'s trigger: a real (non-Hunger) hit, while HP is already half or below or the hit brings it to half
 * or below counting the shield already up, and the seal is off cooldown.
 */
export function sealShouldActivate(args: { damage: number; hp: number; maxHp: number; shielding: number; coolingDown: boolean }): boolean {
	const half = Math.trunc(args.maxHp / 2);
	return args.damage > 0 && !args.coolingDown && (args.hp <= half || args.hp + args.shielding - args.damage <= half);
}

/** `activate()`: the fresh shield amount is added by the caller; the cooldown is set and the idle counter reset. */
export function sealActivate(state: SealState, maxShield: number): SealState {
	return { cooldown: Math.max(0, state.cooldown + SEAL_COOLDOWN_START), turnsSinceEnemies: 0, initialShield: maxShield };
}

/**
 * `act()` for one turn. Cooldown ticks down while regeneration is on. With shield up: no visible enemy and no Combo
 * for five turns drops the whole shield and refunds up to half the remaining cooldown in proportion to what was left
 * (`int` cast); any enemy in view resets the count.
 */
export function sealTick(state: SealState, args: { regenOn: boolean; shielding: number; enemiesVisible: boolean; comboActive: boolean }): { state: SealState; dropShield: boolean } {
	let { cooldown, turnsSinceEnemies } = state;
	const { initialShield } = state;
	if (cooldown > 0 && args.regenOn) cooldown--;
	let dropShield = false;
	if (args.shielding > 0) {
		if (!args.enemiesVisible && !args.comboActive) {
			turnsSinceEnemies += 1;
			if (turnsSinceEnemies >= 5) {
				if (cooldown > 0) {
					const percentLeft = args.shielding / initialShield;
					cooldown = Math.max(0, Math.trunc(cooldown - SEAL_COOLDOWN_START * (percentLeft / 2)));
				}
				dropShield = true;
			}
		} else {
			turnsSinceEnemies = 0;
		}
	}
	return { state: { cooldown, turnsSinceEnemies, initialShield }, dropShield };
}

/** `reduceCooldown(percentage)` (Lethal Defense): `cooldown -= round(150 x percentage)`, never below -150. */
export function sealReduceCooldown(cooldown: number, percentage: number): number {
	return Math.max(cooldown - Math.round(SEAL_COOLDOWN_START * percentage), -SEAL_COOLDOWN_START);
}
