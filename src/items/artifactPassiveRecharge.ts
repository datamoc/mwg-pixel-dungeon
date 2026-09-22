/**
 * The per-turn passive recharge of three carried artifacts (tag `v3.3.8`), all the same
 * shrinking-return shape - the closer to full, the slower the last charge fills:
 *
 * - `EtherealChains.chainsRecharge.act()`: below `chargeTarget = 5 + 2*level`, uncursed, no
 *   `MagicImmune`, `regenOn()`: `partialCharge += 1/(40 - 2*missing) * artifactChargeMultiplier`,
 *   whole points to `charge` with no cap-zeroing; a cursed chain instead rolls `Int(100) == 0`
 *   for a 10-turn `Cripple` (the caller applies it).
 * - `LloydsBeacon.beaconRecharge.act()`: below `chargeCap`, uncursed, `regenOn()` (no MagicImmune
 *   gate and no energy multiplier in Java): `partialCharge += 1/(100 - 10*missing)`, zeroed at cap.
 * - `TimekeepersHourglass.hourglassRecharge.act()`: below `chargeCap = 5 + level`, uncursed, no
 *   `MagicImmune`, `regenOn()`: `1/(90 - 3*missing) * artifactChargeMultiplier`, zeroed at cap.
 *
 * These were authored as MWL rows (`item-rules.mwl`) on 2026-09-15 but never read by any code, so
 * none of the three regained charge on its own until 2026-09-23 - see `PORT_COVERAGE.md`.
 */
import { mwlItemEffectValue } from '../mwlContent';

export interface PassiveCharge { charge: number; partialCharge: number }

export interface PassiveRechargeGates {
	cursed: boolean;
	magicImmune: boolean;
	regenOn: boolean;
	/** `RingOfEnergy.artifactChargeMultiplier(target)`. */
	artifactChargeMultiplier: number;
}

function bank(charge: number, partial: number, gain: number, cap: number, zeroAtCap: boolean): PassiveCharge {
	partial += gain;
	while (partial >= 1) {
		partial--;
		charge++;
		if (zeroAtCap && charge === cap) partial = 0;
	}
	return { charge, partialCharge: partial };
}

export function chainsPassiveRecharge(level: number, state: PassiveCharge, gates: PassiveRechargeGates): PassiveCharge {
	const target = mwlItemEffectValue('chains', 'chargeCapBase') + mwlItemEffectValue('chains', 'chargeCapPerLevel') * level;
	if (state.charge >= target || gates.cursed || gates.magicImmune || !gates.regenOn) return bank(state.charge, state.partialCharge, 0, target, false);
	const gain = gates.artifactChargeMultiplier
		/ (mwlItemEffectValue('chains', 'rechargeBase') - (target - state.charge) * mwlItemEffectValue('chains', 'rechargeCapWeight'));
	return bank(state.charge, state.partialCharge, gain, target, false);
}

export function beaconPassiveRecharge(chargeCap: number, state: PassiveCharge, gates: PassiveRechargeGates): PassiveCharge {
	if (state.charge >= chargeCap || gates.cursed || !gates.regenOn) return state;
	const gain = 1 / (mwlItemEffectValue('beacon', 'rechargeBase') - (chargeCap - state.charge) * mwlItemEffectValue('beacon', 'rechargeCapWeight'));
	return bank(state.charge, state.partialCharge, gain, chargeCap, true);
}

export function hourglassPassiveRecharge(chargeCap: number, state: PassiveCharge, gates: PassiveRechargeGates): PassiveCharge {
	if (state.charge >= chargeCap || gates.cursed || gates.magicImmune || !gates.regenOn) return state;
	const gain = gates.artifactChargeMultiplier
		/ (mwlItemEffectValue('hourglass', 'rechargeBase') - (chargeCap - state.charge) * mwlItemEffectValue('hourglass', 'rechargeCapWeight'));
	return bank(state.charge, state.partialCharge, gain, chargeCap, true);
}
