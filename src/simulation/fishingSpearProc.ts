/**
 * Apply `FishingSpear.proc()` after the target's defense roll. In v3.3.8,
 * `Hero.attackProc()` calls the equipped missile's `proc()` after `Char.attack()`
 * has subtracted `defender.drRoll()` and before `Char.attack()` calls `enemy.damage()`.
 * `FishingSpear.proc()` then raises the already armor-reduced value to at least
 * integer `defender.HP / 2` for either Piranha class.
 */
export function fishingSpearPiranhaDamage(sourceClass: string | undefined, defenderKind: string | undefined,
	defenderHp: number, damageAfterDefense: number): number {
	if (sourceClass !== 'FishingSpear' || (defenderKind !== 'piranha' && defenderKind !== 'phantomPiranha')) {
		return damageAfterDefense;
	}
	return Math.max(damageAfterDefense, Math.floor(defenderHp / 2));
}
