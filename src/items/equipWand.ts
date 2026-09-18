import { Actors } from 'mwg';
import { t } from '../i18n';
import { wandTypeFromSource, type WandType } from './wands';

export interface EquipWandContext {
	readonly bag: Actors.Inventory;
	readonly heroClass: string;
	wandType: WandType;
	frostWand: boolean;
	wandCharges: Actors.Charges;
	talentRank(id: string): number;
	/** `Talent.TEST_SUBJECT`/`TESTED_HYPOTHESIS` on any newly-identified item. */
	procIdentifyTalents(): void;
	say(line: string, level?: 'info' | 'positive' | 'negative' | 'warning'): void;
}

/** Equips the inventory wand and initializes the shared staff charge pool. */
export function equipWand(scene: EquipWandContext): void {
	const wand = scene.bag.find('wand');
	if (!wand) return;
	const wandType = wandTypeFromSource((wand as typeof wand & { sourceClass?: string }).sourceClass);
	//An unknown source is invalid item identity, not Magic Missile. Keep it in the bag so a
	//new MWL wand cannot silently acquire unrelated behaviour until its category is registered.
	if (!wandType) return;
	scene.wandType = wandType;
	scene.frostWand = scene.wandType === 'frost';
	scene.bag.remove('wand', 1);
	scene.wandCharges = new Actors.Charges({ max: 4, current: 4, regenRate: 1 });
	//Rank 2 Scholar's Intuition identifies on equip; the identify (and its talent proc)
	//lands after the pool reset, so `tested_hypothesis`'s banked regen survives it.
	if (scene.heroClass === 'mage' && scene.talentRank('scholars_intuition') >= 2) {
		const newlyIdentified = !wand.identified;
		Actors.identify(wand);
		if (newlyIdentified) scene.procIdentifyTalents();
	}
	scene.say(t('port.log.wandequipped'), 'positive');
}
