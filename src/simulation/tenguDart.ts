/** `TenguDartTrap.poisonAmount()` (`levels/traps/TenguDartTrap.java`, tag `v3.3.8`):
 * unlike the regular depth-scaled `PoisonDartTrap`, this is fixed at 8 normally and 15
 * under `STRONGER_BOSSES`. */
export function tenguDartPoisonAmount(strongerBosses: boolean): number {
	return strongerBosses ? 15 : 8;
}

/** `PrisonBossLevel.placeTrapsInTenguCell()` (`PrisonBossLevel.java`, tag `v3.3.8`)
 * increases the Tengu jump patch fill under `STRONGER_BOSSES`. */
export function tenguTrapFill(fill: number, strongerBosses: boolean): number {
	return strongerBosses ? 0.675 + fill / 4 : fill;
}
