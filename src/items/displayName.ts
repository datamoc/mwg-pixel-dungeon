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
	//`LloydsBeacon.actions()`'s own `AC_ZAP`/`AC_SET`/`AC_RETURN` labels: `useBeaconArtifact`'s
	//picker rows all share the real `beacon` id (so its own icon/frame render correctly), and
	//distinguish themselves only by these synthetic instance ids - the same trick
	//`openAlchemyRecipes`'s `toolkit-energize` row already uses for the toolkit.
	if (id === 'beacon' && instanceId === 'beacon-zap') return t('items.artifacts.lloydsbeacon.ac_zap');
	if (id === 'beacon' && instanceId === 'beacon-set') return t('items.artifacts.lloydsbeacon.ac_set');
	if (id === 'beacon' && instanceId === 'beacon-return') return t('items.artifacts.lloydsbeacon.ac_return');
	//`HornOfPlenty.actions()`'s own `AC_EAT`/`AC_SNACK`/`AC_STORE` labels: `useHorn`'s picker
	//rows all share the real `horn` id, distinguished only by these synthetic instance ids -
	//the same trick the beacon rows above use.
	if (id === 'horn' && instanceId === 'horn-eat') return t('items.artifacts.hornofplenty.ac_eat');
	if (id === 'horn' && instanceId === 'horn-snack') return t('items.artifacts.hornofplenty.ac_snack');
	if (id === 'horn' && instanceId === 'horn-store') return t('items.artifacts.hornofplenty.ac_store');
	//`SandalsOfNature.actions()`'s own `AC_FEED`/`AC_ROOT` labels, on the same synthetic-id trick
	//the beacon and horn rows above use.
	if (id === 'sandals' && instanceId === 'sandals-feed') return t('items.artifacts.sandalsofnature.ac_feed');
	if (id === 'sandals' && instanceId === 'sandals-root') return t('items.artifacts.sandalsofnature.ac_root');
	//`DriedRose.actions()`'s own `AC_SUMMON`/`AC_DIRECT` labels, on the same synthetic-id trick.
	if (id === 'rose' && instanceId === 'rose-summon') return t('items.artifacts.driedrose.ac_summon');
	if (id === 'rose' && instanceId === 'rose-direct') return t('items.artifacts.driedrose.ac_direct');
	//`SummonElemental`'s two actions (`AC_CAST` is Java's generic spell label, `AC_IMBUE` its own).
	if (id === 'summonElemental' && instanceId === 'summonElemental-cast') return t('items.spells.spell.ac_cast');
	if (id === 'summonElemental' && instanceId === 'summonElemental-imbue') return t('items.spells.summonelemental.ac_imbue');
	if (id.startsWith('ring_')) {
		if (!identified) return t('port.name.ring');
		const ring = scene.bag.find(id, instanceId);
		const curse = ring?.cursed ? ` (${t('port.name.cursed')})` : '';
		return `${t(RING_KEYS[id.slice(5)] ?? id)} +${ring?.level ?? 0}${curse}`;
	}
	if (identified) {
		const item = scene.bag.find(id, instanceId);
		if (id === 'wand') return t(WAND_KEYS[scene.wandType] ?? WAND_KEYS.magicMissile);
		//`SandalsOfNature.name()` (tag `v3.3.8`): the artifact renames itself as it grows, from
		//`name` ("sandals of nature") at +0 to `name_1`/`name_2`/`name_3` - "shoes", "boots" and
		//"greaves of nature". Java indexes the +1/+2/+3 keys off `level()` and falls back to the
		//base name below 1, which the `ITEM_KEYS` path at the foot of this function already does.
		if (id === 'sandals') {
			const level = (item as (typeof item | undefined) & { level?: number })?.level ?? 0;
			if (level >= 1) return t(`items.artifacts.sandalsofnature.name_${Math.min(3, level)}`);
		}
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
