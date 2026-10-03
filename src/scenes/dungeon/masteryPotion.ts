import { t } from '../../i18n/index';
import { masteredItemsFor } from '../../items/mastery';
import { markPotionKindsKnown } from '../../items/potionKnow';
import type { DungeonScene } from '../dungeonScene';

/**
 * `PotionOfMastery.drink()` + its item selector (`items/potions/exotic/PotionOfMastery.java`, tag `v3.3.8`): pick a weapon or armor
 * that does not have the bonus yet and set its `masteryPotionBonus` (-2 strength requirement, `items/mastery.ts`), log the
 * `weapon_easier` / `armor_easier` line, and spend the potion. Differences, stated: the selectable set is the carried gear plus
 * the worn weapon and armor that have an instance id (the run-start weapon and armor are scene phantoms with none, so they cannot
 * carry the flag), and backing out of the picker keeps the potion instead of Java's "are you sure" confirmation that consumes an
 * unidentified one. The read's turn is spent when the picker opens, like the Enchantment scroll's.
 */
export function startMasteryPick(scene: DungeonScene, potionInstanceId: string | undefined): boolean {
	const mastered = masteredItemsFor(scene);
	const entries: Array<{ id: string; instanceId?: string; quantity: number; identified?: boolean; level?: number; tier?: number; sourceClass?: string }> = scene.bag.items
		.filter((item) => item.quantity > 0 && (item.id === 'weaponReward' || item.id === 'armorReward') && !(item.instanceId && mastered.has(item.instanceId)))
		.map((item) => item as typeof item & { level?: number; tier?: number });
	if (scene.weaponInstanceId && !mastered.has(scene.weaponInstanceId)) entries.push({ id: scene.weaponId, instanceId: scene.weaponInstanceId, quantity: 1, identified: scene.weaponIdentified, level: scene.weaponLevel, tier: scene.weaponTier });
	if (scene.armorInstanceId && !mastered.has(scene.armorInstanceId)) entries.push({ id: scene.armorId, instanceId: scene.armorInstanceId, quantity: 1, identified: scene.armorIdentified, level: scene.armorLevel, tier: scene.armorTier });
	if (entries.length === 0) {
		scene.say(t('items.scrolls.scrolloftransmutation.nothing'), 'negative');
		return false;
	}
	scene.openItemPicker(t('items.potions.exotic.potionofmastery.prompt'), entries, (pick) => {
		if (!pick.instanceId) return;
		const isArmor = pick.id === 'armorReward' || pick.instanceId === scene.armorInstanceId;
		mastered.add(pick.instanceId);
		scene.bag.remove('potionMastery', 1, potionInstanceId);
		markPotionKindsKnown(scene, ['potionMastery']);
		scene.say(t(isArmor ? 'items.potions.exotic.potionofmastery.armor_easier' : 'items.potions.exotic.potionofmastery.weapon_easier'), 'positive');
		scene.syncHeroFromStats();
		scene.refreshInventoryPanel?.();
	});
	return true;
}
