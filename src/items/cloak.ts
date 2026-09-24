/**
 * Cloak of Shadows' own rules (`items/artifacts/CloakOfShadows.java`, tag `v3.3.8`), scene-free:
 * the charge cap, the recharge cadence (`cloakRecharge.act()`) and the experience the active
 * `cloakStealth` earns each time it spends a charge (which levels the cloak). The scene owns the
 * invisibility buff, the four-turn cost clock and the messages.
 */

/** `chargeCap = Math.min(level()+3, 10)` (the constructor and every `upgrade()`). */
export function cloakChargeCap(level: number): number {
	return Math.min(level + 3, 10);
}

/**
 * `cloakRecharge.act()`'s turns per charge: `45 - missing` where `missing = chargeCap - charge`, plus
 * `5*(level-7)/3` once the cloak is past +7, divided by `RingOfEnergy.artifactChargeMultiplier`.
 * (`45 - missing` bottoms out at 35 - 5 = 30, so it never divides by zero.)
 */
export function cloakTurnsToCharge(level: number, charge: number, energyMultiplier: number): number {
	let missing = cloakChargeCap(level) - charge;
	if (level > 7) missing += 5 * (level - 7) / 3;
	return (45 - missing) / energyMultiplier;
}

/**
 * `cloakStealth.act()`'s experience per charge spent: relative to a "target hero level" of `1 + 2*level`
 * (one more per cloak level past 6), `round(10 * 1.1^diff)` at or above it and `round(10 * 0.75^-diff)` below.
 */
export function cloakExpPerCharge(heroLevel: number, cloakLevel: number): number {
	let diff = heroLevel - (1 + cloakLevel * 2);
	if (cloakLevel >= 7) diff -= cloakLevel - 6;
	return diff >= 0 ? Math.round(10 * Math.pow(1.1, diff)) : Math.round(10 * Math.pow(0.75, -diff));
}

/**
 * Adds one charge's experience and levels the cloak while `exp >= (level+1)*50` and below the cap
 * (`levelCap = 10`), carrying `exp -= level*50` with the new level.
 * @returns whether the cloak levelled up (the caller prints `levelup`).
 */
export function cloakGainExp(item: { level?: number; exp?: number }, heroLevel: number): boolean {
	const level = item.level ?? 0;
	item.exp = (item.exp ?? 0) + cloakExpPerCharge(heroLevel, level);
	if (item.exp >= (level + 1) * 50 && level < 10) {
		item.level = level + 1;
		item.exp -= item.level * 50;
		return true;
	}
	return false;
}
