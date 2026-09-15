import { Actors } from 'mwg';
import { ITEM_KEYS, RING_KEYS, WAND_KEYS, t } from '../i18n';
import type { WandType } from './wands';

export interface ItemDisplayContext {
	readonly bag: Actors.Inventory;
	readonly appearances: Actors.Appearances;
	readonly wandType: WandType;
	readonly weaponId: string; readonly weaponInstanceId?: string; readonly weaponHardened: boolean;
	readonly armorId: string; readonly armorInstanceId?: string; readonly armorHardened: boolean;
}

/** Resolves the player-facing name of a bag item, including appearances and enhancement notes. */
export function itemDisplayName(scene: ItemDisplayContext, id: string, identified: boolean, instanceId?: string): string {
	if (id.startsWith('ring_')) {
		if (!identified) return t('port.name.ring');
		const ring = scene.bag.find(id, instanceId);
		const curse = ring?.cursed ? ` (${t('port.name.cursed')})` : '';
		return `${t(RING_KEYS[id.slice(5)] ?? id)} +${ring?.level ?? 0}${curse}`;
	}
	if (identified) {
		const item = scene.bag.find(id, instanceId);
		if (id === 'wand') return t(WAND_KEYS[scene.wandType] ?? WAND_KEYS.magicMissile);
		const affix = item?.affix ? ` (${t(`port.affix.${item.affix}`)})` : '';
		const weapon = ['weaponReward', 'startingWeapon'].includes(id);
		const armor = ['armor', 'armorReward', 'clothArmor', 'startingArmor'].includes(id);
		const hardenedFlag = (item as (typeof item | undefined) & { hardened?: boolean })?.hardened;
		const isEquipped = (slotId: string, slotInstanceId: string | undefined): boolean =>
			id === slotId && (instanceId === undefined ? slotInstanceId === undefined : instanceId === slotInstanceId);
		const hardened = weapon ? (hardenedFlag ?? (isEquipped(scene.weaponId, scene.weaponInstanceId) ? scene.weaponHardened : false))
			: armor ? (hardenedFlag ?? (isEquipped(scene.armorId, scene.armorInstanceId) ? scene.armorHardened : false)) : false;
		const hardenedNote = hardened ? ` ${t(weapon ? 'port.item.hardened.weapon' : 'port.item.hardened.armor')}` : '';
		return `${t(ITEM_KEYS[id] ?? id)}${affix}${hardenedNote}`;
	}
	if (id.startsWith('potion')) return t(scene.appearances.appearanceOf('potion', id));
	if (id.startsWith('scroll')) return t(scene.appearances.appearanceOf('scroll', id));
	return t(ITEM_KEYS[id] ?? id);
}
