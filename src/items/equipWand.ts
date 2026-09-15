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
	if (scene.heroClass === 'mage' && scene.talentRank('scholars_intuition') >= 2) Actors.identify(wand);
	scene.bag.remove('wand', 1);
	scene.wandCharges = new Actors.Charges({ max: 4, current: 4, regenRate: 1 });
	scene.say(t('port.log.wandequipped'), 'positive');
}
