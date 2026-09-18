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
	/** `Talent.TEST_SUBJECT`/`TESTED_HYPOTHESIS` on any newly-identified item. */
	procIdentifyTalents(): void;
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
	if (scene.heroClass === 'rogue' && scene.talentRank('thiefs_intuition') >= 2) {
		const newlyIdentified = !item.identified;
		Actors.identify(item);
		if (newlyIdentified) scene.procIdentifyTalents();
	}
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
	/** `Armor.doEquip()`'s seal-transfer offer; the scene owns the window and the rule. */
	offerSealTransfer(outgoingWasSealed: boolean, incomingCursed: boolean): void;
	weaponId: string; weaponInstanceId?: string; weaponLevel: number; weaponTier: number; weaponAffix: string | null; weaponHardened: boolean;
	/** `Weapon.curseInfusionBonus`/`Armor.curseInfusionBonus` for the equipped pair, and the
	 * `level()` reads that carry them - see `effectiveWeaponLevel`'s own doc comment. */
	weaponCurseInfusionBonus: boolean;
	armorCurseInfusionBonus: boolean;
	effectiveWeaponLevel(): number;
	effectiveArmorLevel(): number;
	/** `Weapon.enchant()`/`Armor.inscribe()`'s clearing rule, which every affix write goes through. */
	setWeaponAffix(affix: string | null): void;
	setArmorGlyph(glyph: string | null): void;
	talentRank(id: string): number;
	/** `Talent.TEST_SUBJECT`/`TESTED_HYPOTHESIS` on any newly-identified item. */
	procIdentifyTalents(): void;
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
		|| (scene.heroClass === 'huntress' && scene.talentRank('survivalists_intuition') >= 2)) {
		const newlyIdentified = !item.identified;
		Actors.identify(item);
		if (newlyIdentified) scene.procIdentifyTalents();
	}
	if (scene.armorId === 'clothArmor' && scene.armorInstanceId) scene.bag.remove(scene.armorId, 1, scene.armorInstanceId);
	else if (scene.armorId !== 'startingArmor') {
		const previous = { id: scene.armorId, quantity: 1, instanceId: scene.armorInstanceId, identified: true, level: scene.armorLevel, tier: scene.armorTier };
		const returned = { id: scene.armorId, quantity: 1, instanceId: scene.armorInstanceId, identified: true, tier: scene.armorTier, affix: undefined as string | undefined, curseInfusionBonus: false };
		transferEnhancement({ ...previous, affix: scene.armorGlyph ?? undefined, curseInfusionBonus: scene.armorCurseInfusionBonus }, returned);
		//The infusion marker travels with its item, like the weapon's above.
		returned.curseInfusionBonus = scene.armorCurseInfusionBonus;
		scene.bag.add(returned);
	}
	scene.bag.remove(id, 1, item.instanceId);
	scene.armorId = id;
	scene.armorInstanceId = item.instanceId;
	scene.armorLevel = Math.min(5, item.level ?? 0);
	scene.armorTier = Math.max(1, Math.min(5, (item as typeof item & { tier?: number }).tier ?? scene.armorTier));
	scene.setArmorGlyph(item.affix ?? null);
	scene.armorHardened = (item as typeof item & { hardened?: boolean }).hardened ?? false;
	scene.armorCurseInfusionBonus = (item as typeof item & { curseInfusionBonus?: boolean }).curseInfusionBonus ?? false;
	//`Armor.doEquip()`/`doUnequip()`: the seal stays with the specific armor instance it was
	//affixed to (`BrokenSeal.WarriorShield.setArmor(null)` on unequip). `AC_DETACH` (returning the
	//seal to the bag as an item) is still unmodeled - this port has no action surface on the
	//equipped armor - but Java's *transfer* offer is now handled: equipping a different piece
	//clears the seal here and hands the outgoing state to `offerSealTransfer`, which asks.
	//`Armor.doEquip()` (tag `v3.3.8`, `Armor.java` 261-283): a Warrior swapping armor may keep his
	//seal - Java offers the transfer through a confirm window rather than dropping it silently.
	const outgoingWasSealed = scene.armorSealed;
	scene.armorSealed = false;
	scene.syncHeroFromStats();
	scene.say(t('port.log.armorequipped', { level: scene.effectiveArmorLevel() }), 'positive');
	//After the equip, as in Java: the offer is about the armor now being worn.
	scene.offerSealTransfer(outgoingWasSealed, getCurse(item.affix ?? '') !== undefined);
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
		|| (scene.heroClass === 'huntress' && scene.talentRank('survivalists_intuition') >= 2)) {
		const newlyIdentified = !item.identified;
		Actors.identify(item);
		if (newlyIdentified) scene.procIdentifyTalents();
	}
	if (scene.weaponId !== 'startingWeapon') {
		const previous = { id: scene.weaponId, quantity: 1, instanceId: scene.weaponInstanceId, identified: true, level: scene.weaponLevel, tier: scene.weaponTier, affix: scene.weaponAffix ?? undefined, curseInfusionBonus: scene.weaponCurseInfusionBonus };
		const returned = { id: scene.weaponId, quantity: 1, instanceId: scene.weaponInstanceId, identified: true, tier: scene.weaponTier, affix: undefined as string | undefined, curseInfusionBonus: false };
		transferEnhancement(previous, returned);
		//The infusion marker travels with its item, the way Java's `curseInfusionBonus` does: a
		//swapped-out weapon keeps it and the weapon coming in brings its own.
		returned.curseInfusionBonus = previous.curseInfusionBonus;
		scene.bag.add(returned);
	}
	scene.bag.remove(id, 1, item.instanceId);
	scene.weaponId = id;
	scene.weaponInstanceId = item.instanceId;
	scene.weaponLevel = Math.max(scene.weaponLevel, item.level ?? 0);
	scene.weaponTier = Math.max(1, Math.min(5, (item as typeof item & { tier?: number }).tier ?? scene.weaponTier));
	scene.setWeaponAffix(item.affix ?? null);
	scene.weaponHardened = (item as typeof item & { hardened?: boolean }).hardened ?? false;
	scene.weaponCurseInfusionBonus = (item as typeof item & { curseInfusionBonus?: boolean }).curseInfusionBonus ?? false;
	scene.syncHeroFromStats();
	if (scene.heroClass === 'duelist' && scene.talentRank('swift_equip') > 0) scene.say(t('items.kindofweapon.swift_equip'), 'positive');
	else scene.say(t('port.log.weaponequipped', { level: scene.effectiveWeaponLevel() }), 'positive');
}
