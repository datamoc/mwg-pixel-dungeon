import { mwlItemEffectValue } from '../mwlContent';

export interface ToolkitWarmupState {
	warmUpDelay: number;
}

/** `AlchemistsToolkit.doEquip()`/`kitEnergy.act()` (tag `v3.3.8`): equip starts at
 * 101; the first actor tick changes it to 100, then each tick subtracts
 * `100 / (int)(10-level)^2`, unless cursed or Magic Immune. The port has no
 * artifact equip slot, so its explicit approximation starts on pickup and
 * advances while the Toolkit is carried; it does not restart on a later UI
 * visit. */
export function advanceToolkitWarmup(state: ToolkitWarmupState, level: number, cursed: boolean, magicImmune: boolean): void {
	if (state.warmUpDelay <= 0) return;
	const levelCap = mwlItemEffectValue('toolkit', 'levelCap');
	if (level >= levelCap) {
		state.warmUpDelay = 0;
	} else if (state.warmUpDelay === mwlItemEffectValue('toolkit', 'warmUpInitial')) {
		state.warmUpDelay = mwlItemEffectValue('toolkit', 'warmUpStart');
	} else if (!cursed && !magicImmune) {
		const baseLevel = mwlItemEffectValue('toolkit', 'warmUpBaseLevel');
		const turnsToWarmUp = Math.floor((baseLevel - level) ** 2);
		state.warmUpDelay -= mwlItemEffectValue('toolkit', 'warmUpTotal') / turnsToWarmUp;
	}
}

export function toolkitWarmupPercent(delay: number): number {
	return Math.max(0, 100 - Math.trunc(delay));
}
