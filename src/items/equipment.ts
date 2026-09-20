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
	/** Test Subject / Tested Hypothesis on any newly-identified item (see the row). */
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
	//`Item.identify()` is not implied by equipping - a ring worn without Thief's Intuition
	//rank 2 (or one already identified some other way) keeps whatever real identified state
	//it had; forcing `identified: true` unconditionally here used to silently identify any
	//ring the instant it was swapped out, real Java basis or not.
	if (previous) scene.bag.add({ id: previous.id, quantity: 1, instanceId: previous.instanceId, identified: previous.identified ?? true, level: previous.level, cursed: previous.cursed });
	scene.bag.remove(id, 1, item.instanceId);
	scene.equippedRing = { id, level, cursed: item.cursed, instanceId: item.instanceId, identified: item.identified };
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
	/** Whether the equipped armor is identified - see `equipRing`'s `EquippedRing.identified`
	 * doc comment; equipping alone never implies it. */
	armorIdentified: boolean;
	/** `Armor.doEquip()`'s seal-transfer offer; the scene owns the window and the rule. */
	offerSealTransfer(outgoingWasSealed: boolean, incomingCursed: boolean): void;
	weaponId: string; weaponInstanceId?: string; weaponLevel: number; weaponTier: number; weaponAffix: string | null; weaponHardened: boolean;
	weaponIdentified: boolean;
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
	/** Test Subject / Tested Hypothesis on any newly-identified item (see the row). */
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
		//Equipping never implies identification (see `equipRing`'s comment on the same rule) -
		//the outgoing piece returns to the bag with whatever real identified state it had.
		const previous = { id: scene.armorId, quantity: 1, instanceId: scene.armorInstanceId, identified: scene.armorIdentified, level: scene.armorLevel, tier: scene.armorTier };
		const returned = { id: scene.armorId, quantity: 1, instanceId: scene.armorInstanceId, identified: scene.armorIdentified, tier: scene.armorTier, affix: undefined as string | undefined, curseInfusionBonus: false };
		transferEnhancement({ ...previous, affix: scene.armorGlyph ?? undefined, curseInfusionBonus: scene.armorCurseInfusionBonus }, returned);
		//The infusion marker travels with its item, like the weapon's above.
		returned.curseInfusionBonus = scene.armorCurseInfusionBonus;
		scene.bag.add(returned);
	}
	scene.bag.remove(id, 1, item.instanceId);
	scene.armorId = id;
	scene.armorInstanceId = item.instanceId;
	scene.armorIdentified = item.identified ?? false;
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

export interface ClassArmorState { armorInstanceId?: string; armorLevel: number; armorTier: number; armorGlyph: string | null; armorHardened: boolean; armorIdentified: boolean; armorCurseInfusionBonus: boolean; armorSealed: boolean }
export interface ClassArmorTransferContext {
	readonly bag: Actors.Inventory; readArmor(): ClassArmorState; writeArmor(state: ClassArmorState): void;
	syncHeroFromStats(): void; say(line: string, level?: 'info' | 'positive' | 'negative' | 'warning'): void; spendTurn(): void;
}

/** `ClassArmor.execute(AC_TRANSFER)` (`ClassArmor.java`, tag `v3.3.8`): destroy the
 * class-armor shell while keeping its ability/charge, and put those properties on a
 * selected armor with that armor's own level, tier, glyph, curse and identification. */
export function transferClassArmor(scene: ClassArmorTransferContext, id: string, instanceId?: string): boolean {
	const target = scene.bag.find(id, instanceId);
	if (!target || target.quantity <= 0) return false;
	const armor = scene.readArmor();
	scene.bag.remove(id, 1, target.instanceId);
	scene.writeArmor({ armorInstanceId: target.instanceId, armorLevel: Math.min(5, target.level ?? 0),
		armorTier: Math.max(1, Math.min(5, (target as typeof target & { tier?: number }).tier ?? armor.armorTier)),
		armorGlyph: target.affix ?? null, armorHardened: (target as typeof target & { hardened?: boolean }).hardened ?? false,
		armorIdentified: target.identified ?? false, armorCurseInfusionBonus: (target as typeof target & { curseInfusionBonus?: boolean }).curseInfusionBonus ?? false,
		armorSealed: armor.armorSealed || Boolean((target as typeof target & { seal?: boolean }).seal) });
	scene.syncHeroFromStats();
	scene.say('items.armor.classarmor.transfer_complete', 'positive');
	scene.spendTurn();
	return true;
}

export interface ClassArmorTransferScene extends ClassArmorState {
	readonly bag: Actors.Inventory;
	syncHeroFromStats(): void;
}
export type ClassArmorPicker = (title: string, entries: { id: string; instanceId?: string; quantity: number; identified?: boolean }[], onPick: (entry: { id: string; instanceId?: string }) => void, body: string) => void;

/** Inventory-window adapter for `ClassArmor.execute(AC_TRANSFER)`; the picker remains UI-owned. */
export function openClassArmorTransfer(scene: ClassArmorTransferScene, openPicker: ClassArmorPicker, refresh: () => void, translate: (key: string) => string, say: (line: string, level?: 'info' | 'positive' | 'negative' | 'warning') => void, spendTurn: () => void): void {
	const entries = scene.bag.items.filter((item) => item.quantity > 0 && (item.id === 'clothArmor' || item.id === 'armor' || item.id === 'armorReward' || item.id.endsWith('armor')))
		.map((item) => ({ id: item.id, instanceId: item.instanceId, quantity: item.quantity, identified: item.identified }));
	openPicker(translate('items.armor.classarmor.transfer_title'), entries, (pick) => {
		if (transferClassArmor({ bag: scene.bag, readArmor: () => scene, writeArmor: (state) => Object.assign(scene, state), syncHeroFromStats: () => scene.syncHeroFromStats(), say: (line, level) => say(translate(line), level), spendTurn }, pick.id, pick.instanceId)) refresh();
	}, translate('items.armor.classarmor.transfer_desc'));
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
		//Equipping never implies identification (see `equipRing`'s comment on the same rule).
		const previous = { id: scene.weaponId, quantity: 1, instanceId: scene.weaponInstanceId, identified: scene.weaponIdentified, level: scene.weaponLevel, tier: scene.weaponTier, affix: scene.weaponAffix ?? undefined, curseInfusionBonus: scene.weaponCurseInfusionBonus };
		const returned = { id: scene.weaponId, quantity: 1, instanceId: scene.weaponInstanceId, identified: scene.weaponIdentified, tier: scene.weaponTier, affix: undefined as string | undefined, curseInfusionBonus: false };
		transferEnhancement(previous, returned);
		//The infusion marker travels with its item, the way Java's `curseInfusionBonus` does: a
		//swapped-out weapon keeps it and the weapon coming in brings its own.
		returned.curseInfusionBonus = previous.curseInfusionBonus;
		scene.bag.add(returned);
	}
	scene.bag.remove(id, 1, item.instanceId);
	scene.weaponId = id;
	scene.weaponInstanceId = item.instanceId;
	scene.weaponIdentified = item.identified ?? false;
	scene.weaponLevel = Math.max(scene.weaponLevel, item.level ?? 0);
	scene.weaponTier = Math.max(1, Math.min(5, (item as typeof item & { tier?: number }).tier ?? scene.weaponTier));
	scene.setWeaponAffix(item.affix ?? null);
	scene.weaponHardened = (item as typeof item & { hardened?: boolean }).hardened ?? false;
	scene.weaponCurseInfusionBonus = (item as typeof item & { curseInfusionBonus?: boolean }).curseInfusionBonus ?? false;
	scene.syncHeroFromStats();
	if (scene.heroClass === 'duelist' && scene.talentRank('swift_equip') > 0) scene.say(t('items.kindofweapon.swift_equip'), 'positive');
	else scene.say(t('port.log.weaponequipped', { level: scene.effectiveWeaponLevel() }), 'positive');
}
