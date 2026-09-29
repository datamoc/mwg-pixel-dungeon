/**
 * `TenguDartTrap` (tag `v3.3.8`, `levels/traps/TenguDartTrap.java:36-43`) is a `PoisonDartTrap`
 * whose `poisonAmount()` is 8, or 15 under `Challenges.STRONGER_BOSSES` ("50 damage total, equal
 * to poison dart traps on floor 10"), instead of the plain trap's `8 + round(2*depth/3)`.
 * The port has one `poisonDart` trap kind, so the cells `PrisonBossLevel.placeTrapsInTenguCell`
 * seeds are remembered here and the two trigger sites ask `poisonDartAmount`. The set is reset with
 * the scene's trap table on a fresh floor; it is not saved (the traps fade with the fight).
 */
const tenguDartCells = new Set<number>();

export function markTenguDartTrap(cell: number): void { tenguDartCells.add(cell); }
export function resetTenguDartTraps(): void { tenguDartCells.clear(); }

export function poisonDartAmount(cell: number, depth: number, strongerBosses: boolean): number {
	if (tenguDartCells.has(cell)) return strongerBosses ? 15 : 8;
	return 8 + Math.round((2 * depth) / 3);
}

/** `PrisonBossLevel.placeTrapsInTenguCell`: the dart-field density, `0.675 + fill/4` (78-90%) under Badder bosses. */
export function tenguTrapFill(fill: number, strongerBosses: boolean): number {
	return strongerBosses ? 0.675 + fill / 4 : fill;
}
