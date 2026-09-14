import { Actors } from 'mwg';
import type { EquippedRing } from './ringModifiers';
import { ringDef, ringMightBonus } from './ringModifiers';
import { t } from '../i18n';
import { getCurse } from './itemCurses';
import { transferEnhancement } from './itemWorkflows';

export interface RingEquipmentContext {
	readonly bag: Actors.Inventory;
	readonly heroClass: string;
	readonly hero: { hp: number; maxHp: number; magicImmune?: boolean };
	equippedRing: EquippedRing | null;
	ringHtBonus: number;
	talentRank(id: string): number;
	itemDisplayName(id: string, identified: boolean, instanceId?: string): string;
	syncHeroFromStats(): void;
	say(line: string, level?: 'info' | 'positive' | 'negative' | 'warning'): void;
}

/** Equips one ring instance and applies its persistent max-HP contribution. */
export function equipRing(scene: RingEquipmentContext, id: string, instanceId?: string): void {
	const item = scene.bag.find(id, instanceId);
	if (!item || !id.startsWith('ring_')) return;
	const level = item.level ?? 0;
	//Rank 1 Thief's Intuition only reveals the type in Java. This port has no separate type-known
	//flag, so only rank 2's full identification is represented.
	if (scene.heroClass === 'rogue' && scene.talentRank('thiefs_intuition') >= 2) Actors.identify(item);
	if (scene.equippedRing?.cursed && scene.equippedRing.id !== id) {
		scene.say(t('port.log.ringcursed'), 'negative');
		return;
	}
	if (scene.equippedRing?.id === id && scene.equippedRing.level === level) {
		scene.say(t('port.log.ringalready'), 'negative');
		return;
	}
	const previous = scene.equippedRing;
	const displayName = scene.itemDisplayName(id, true, item.instanceId);
	if (previous) scene.bag.add({ id: previous.id, quantity: 1, instanceId: previous.instanceId, identified: true, level: previous.level, cursed: previous.cursed });
	scene.bag.remove(id, 1, item.instanceId);
	scene.equippedRing = { id, level, cursed: item.cursed, instanceId: item.instanceId };
	const baseMaxHp = scene.hero.maxHp - scene.ringHtBonus;
	const newRingHtBonus = ringDef(id)?.stat === 'strength'
		? Math.round(baseMaxHp * (Math.pow(1.035, ringMightBonus({ id, level, cursed: item.cursed }, scene.hero.magicImmune)) - 1))
		: 0;
	if (newRingHtBonus !== scene.ringHtBonus) {
		scene.hero.maxHp = baseMaxHp + newRingHtBonus;
		scene.hero.hp += newRingHtBonus - scene.ringHtBonus;
		scene.ringHtBonus = newRingHtBonus;
	}
	scene.syncHeroFromStats();
	scene.say(t('port.log.ringworn', { item: displayName, level }), 'positive');
}

export interface GearEquipmentContext {
	readonly bag: Actors.Inventory;
	readonly heroClass: string;
	readonly hero: { magicImmune?: boolean };
	armorId: string; armorInstanceId?: string; armorLevel: number; armorTier: number; armorGlyph: string | null; armorHardened: boolean; armorSealed: boolean;
	weaponId: string; weaponInstanceId?: string; weaponLevel: number; weaponTier: number; weaponAffix: string | null; weaponHardened: boolean;
	talentRank(id: string): number;
	syncHeroFromStats(): void;
	say(line: string, level?: 'info' | 'positive' | 'negative' | 'warning'): void;
}

export function equipArmor(scene: GearEquipmentContext, id: string, instanceId?: string): void {
	const item = scene.bag.find(id, instanceId);
	if (!item || scene.armorInstanceId === item.instanceId) return;
	if (scene.armorId !== 'clothArmor' && getCurse(scene.armorGlyph ?? '')) {
		scene.say(t('port.log.armorcursed'), 'negative');
		return;
	}
	if ((scene.heroClass === 'duelist' && scene.talentRank('adventurers_intuition') >= 2)
		|| (scene.heroClass === 'warrior' && scene.talentRank('veterans_intuition') >= 2)
		|| (scene.heroClass === 'huntress' && scene.talentRank('survivalists_intuition') >= 2)) Actors.identify(item);
	if (scene.armorId === 'clothArmor' && scene.armorInstanceId) scene.bag.remove(scene.armorId, 1, scene.armorInstanceId);
	else if (scene.armorId !== 'startingArmor') {
		const previous = { id: scene.armorId, quantity: 1, instanceId: scene.armorInstanceId, identified: true, level: scene.armorLevel, tier: scene.armorTier };
		const returned = { id: scene.armorId, quantity: 1, instanceId: scene.armorInstanceId, identified: true, tier: scene.armorTier, affix: undefined as string | undefined };
		transferEnhancement({ ...previous, affix: scene.armorGlyph ?? undefined }, returned);
		scene.bag.add(returned);
	}
	scene.bag.remove(id, 1, item.instanceId);
	scene.armorId = id;
	scene.armorInstanceId = item.instanceId;
	scene.armorLevel = Math.min(5, item.level ?? 0);
	scene.armorTier = Math.max(1, Math.min(5, (item as typeof item & { tier?: number }).tier ?? scene.armorTier));
	scene.armorGlyph = item.affix ?? null;
	scene.armorHardened = (item as typeof item & { hardened?: boolean }).hardened ?? false;
	//`Armor.doEquip()`/`doUnequip()`: the seal stays with the specific armor instance it was
	//affixed to (`BrokenSeal.WarriorShield.setArmor(null)` on unequip) - Java lets the player
	//detach it and re-affix it to a different piece (`Armor.AC_DETACH`/`BrokenSeal.AC_AFFIX`),
	//which this port does not model, so equipping any different armor here simply loses the
	//seal bonus for the rest of the run rather than carrying or re-offering it.
	scene.armorSealed = false;
	scene.syncHeroFromStats();
	scene.say(t('port.log.armorequipped', { level: scene.armorLevel }), 'positive');
}

export function equipWeapon(scene: GearEquipmentContext, id: string, instanceId?: string): void {
	const item = scene.bag.find(id, instanceId);
	if (!item || scene.weaponInstanceId === item.instanceId) return;
	if (scene.weaponId !== 'startingWeapon' && getCurse(scene.weaponAffix ?? '')) {
		scene.say(t('port.log.weaponcursed'), 'negative');
		return;
	}
	if ((scene.heroClass === 'duelist' && scene.talentRank('adventurers_intuition') >= 2)
		|| (scene.heroClass === 'warrior' && scene.talentRank('veterans_intuition') >= 2)
		|| (scene.heroClass === 'huntress' && scene.talentRank('survivalists_intuition') >= 2)) Actors.identify(item);
	if (scene.weaponId !== 'startingWeapon') {
		const previous = { id: scene.weaponId, quantity: 1, instanceId: scene.weaponInstanceId, identified: true, level: scene.weaponLevel, tier: scene.weaponTier, affix: scene.weaponAffix ?? undefined };
		const returned = { id: scene.weaponId, quantity: 1, instanceId: scene.weaponInstanceId, identified: true, tier: scene.weaponTier, affix: undefined as string | undefined };
		transferEnhancement(previous, returned);
		scene.bag.add(returned);
	}
	scene.bag.remove(id, 1, item.instanceId);
	scene.weaponId = id;
	scene.weaponInstanceId = item.instanceId;
	scene.weaponLevel = Math.max(scene.weaponLevel, item.level ?? 0);
	scene.weaponTier = Math.max(1, Math.min(5, (item as typeof item & { tier?: number }).tier ?? scene.weaponTier));
	scene.weaponAffix = item.affix ?? null;
	scene.weaponHardened = (item as typeof item & { hardened?: boolean }).hardened ?? false;
	scene.syncHeroFromStats();
	if (scene.heroClass === 'duelist' && scene.talentRank('swift_equip') > 0) scene.say(t('items.kindofweapon.swift_equip'), 'positive');
	else scene.say(t('port.log.weaponequipped', { level: scene.weaponLevel }), 'positive');
}
