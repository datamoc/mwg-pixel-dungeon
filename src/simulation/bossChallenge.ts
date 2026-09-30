/**
 * Java's DwarfKing.damage() clears the no-weapon challenge when the hero's
 * attacking weapon is not unarmed, or RingOfForce's Force buff is active.
 * Hero.shoot() and Hero.doThrow() report their missile as attackingWeapon too.
 */
export function weaponHitDisqualifiesDwarfKingChallenge(targetKind: string | undefined,
	attackMode: string | undefined, weaponId: string, ringOfForcePresent: boolean): boolean {
	if (targetKind !== 'king') return false;
	return attackMode === 'throw' || attackMode === 'shoot' || weaponId !== 'startingWeapon' || ringOfForcePresent;
}
