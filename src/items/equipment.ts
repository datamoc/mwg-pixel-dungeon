import { Actors } from 'mwg';
import type { EquippedRing } from './ringModifiers';
import { ringDef, ringMightBonus } from './ringModifiers';
import { markRingTypesKnown } from '../simulation/ringKnow';
import { t } from '../i18n';
import { transferEnhancement } from './itemWorkflows';

export interface RingEquipmentContext {
	readonly bag: Actors.Inventory;
	readonly heroClass: string;
	readonly hero: { hp: number; maxHp: number; magicImmune?: boolean };
	equippedRing: EquippedRing | null;
	ringHtBonus: number;
	talentRank(id: string): number;
	/** `Ring.setKnown()` on identify - the scene owns the per-run known set. */
	markRingTypesKnown(ids: string[]): void;
	/** Test Subject / Tested Hypothesis on any newly-identified item (see the row). */
	procIdentifyTalents(): void;
	/** `ShardOfOblivion.passiveIDDisabled()`: the item is only made ready to identify (true when handled). */
	shardMarkReady?(item: { id: string; instanceId?: string }): boolean;
	itemDisplayName(id: string, identified: boolean, instanceId?: string): string;
	syncHeroFromStats(): void;
	say(line: string, level?: 'info' | 'positive' | 'negative' | 'warning'): void;
	/** `KindofMisc.doEquip`'s `hero.spendAndNext( timeToEquip(hero) )` (tag `v3.3.8`): wearing a
	 * ring costs its 1 turn, and swapping the worn ring out also pays the unequip side
	 * (`EquipableItem.doUnequip`, `single=false` -> `hero.spend( timeToEquip )`), i.e. 2 - see
	 * `equipRing`. A cost of 0 is Java's SwiftEquip-style instant equip and spends nothing. */
	spendTurn(cost: number): void;
}

/** Equips one ring instance and applies its persistent max-HP contribution. */
export function equipRing(scene: RingEquipmentContext, id: string, instanceId?: string): void {
	const item = scene.bag.find(id, instanceId);
	if (!item || !id.startsWith('ring_')) return;
	const level = item.level ?? 0;
	//Rank 1 Thief's Intuition reveals the ring's type in Java (`Ring.setKnown()`,
	//level/curse stay hidden): `markRingTypesKnown` records exactly that, so rank 2
	//below is the full identification it has always been.
	//`Talent.onItemEquipped()`: any rank of Thief's Intuition marks the ring type known; rank 2 identifies it - or, under the
	//Shard of Oblivion, only makes it ready (`setIDReady()`).
	if (scene.talentRank('thiefs_intuition') >= 1) scene.markRingTypesKnown([id]);
	if (scene.talentRank('thiefs_intuition') >= 2 && !scene.shardMarkReady?.(item)) {
		const newlyIdentified = !item.identified;
		Actors.identify(item);
		if (newlyIdentified) scene.procIdentifyTalents();
	}
	if (scene.equippedRing?.cursed && scene.hero.magicImmune !== true && scene.equippedRing.id !== id) {
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
	//`KindofMisc.doEquip` (tag `v3.3.8`) always ends in `hero.spendAndNext( timeToEquip( hero ) )`
	//(1 turn); Java reaches it straight through for a free slot, but through
	//`equipped.doUnequip( hero, true, false )` first when a ring must be swapped off - that
	//`EquipableItem.doUnequip` spends its own `timeToEquip` too, so a swap costs 2.
	scene.spendTurn(previous ? 2 : 1);
}

export interface GearEquipmentContext {
	readonly bag: Actors.Inventory;
	readonly heroClass: string;
	readonly hero: { magicImmune?: boolean };
	armorId: string; armorInstanceId?: string; armorLevel: number; armorTier: number; armorGlyph: string | null; armorHardened: boolean; armorCursed: boolean; armorCursedKnown: boolean; armorSealed: boolean;
	/** Whether the equipped armor is identified - see `equipRing`'s `EquippedRing.identified`
	 * doc comment; equipping alone never implies it. */
	armorIdentified: boolean;
	/** `Armor.doEquip()`'s seal-transfer offer; the scene owns the window and the rule. */
	offerSealTransfer(outgoingWasSealed: boolean, incomingCursed: boolean, sealGlyph: string | null): void;
	weaponId: string; weaponInstanceId?: string; weaponLevel: number; weaponTier: number; weaponAffix: string | null; weaponHardened: boolean; weaponCursed: boolean; weaponCursedKnown: boolean;
	weaponIdentified: boolean;
	/** Java's slots hold the item object itself (`hero.belongings.weapon = this`), so the worn
	 * piece always carries its own class; this port's minted `weaponReward`/`armorReward` ids
	 * cannot name theirs, so the scene tracks it alongside the id - for the equipped entries'
	 * display name, and for the bag copy a swap sends back (`sourceClass`). */
	weaponSourceClass: string | undefined;
	armorSourceClass: string | undefined;
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
	shardMarkReady?(item: { id: string; instanceId?: string }): boolean;
	syncHeroFromStats(): void;
	say(line: string, level?: 'info' | 'positive' | 'negative' | 'warning'): void;
	/** Both equip sides pay for themselves in Java: the outgoing piece unequips
	 * (`EquipableItem.doUnequip`, tag `v3.3.8`, `hero.spend( timeToEquip )`) and the incoming one
	 * equips (`hero.spendAndNext`/`hero.spend( timeToEquip )`) - `EquipableItem.timeToEquip`
	 * returns 1f, so a weapon/armor swap costs 2 turns total. `KindOfWeapon.doEquip`'s SwiftEquip
	 * talent overrides that with 0 (`isSwiftEquipping`), which the port approximates as free
	 * whenever the talent rank exists - a cost of 0 spends nothing. */
	spendTurn(cost: number): void;
}

export function equipArmor(scene: GearEquipmentContext, id: string, instanceId?: string): void {
	const item = scene.bag.find(id, instanceId);
	if (!item || scene.armorInstanceId === item.instanceId) return;
	// `Armor.checkSeal().getGlyph()` retains the curse glyph that was on the outgoing
	// armor when its seal was attached; keep that value across replacing `armorGlyph` below.
	const outgoingSealGlyph = scene.armorSealed ? scene.armorGlyph : null;
	//`EquipableItem.doUnequip()` (`EquipableItem.java`, inherited by `Armor`, tag `v3.3.8`)
	//refuses removal only while the
	//armor item's own `cursed` flag is set. A curse glyph can remain equipped and still
	//be removed when that independent item flag is false; MagicImmune bypasses the gate.
	if (scene.armorId !== 'clothArmor' && scene.armorCursed && scene.hero.magicImmune !== true) {
		scene.say(t('port.log.armorcursed'), 'negative');
		return;
	}
	//`Talent.onItemEquipped()`: Veteran's Intuition rank 2 identifies worn armor (the Shard of Oblivion only makes it ready).
	if (scene.talentRank('veterans_intuition') >= 2 && !scene.shardMarkReady?.(item)) {
		const newlyIdentified = !item.identified;
		Actors.identify(item);
		if (newlyIdentified) scene.procIdentifyTalents();
	}
	//Java unequips the outgoing armor with `collect=true` (`Armor.doEquip` ->
	//`EquipableItem.doUnequip`, tag `v3.3.8`: `if (!collect || !collect( hero.belongings.backpack ))`),
	//so EVERY swapped-off piece survives in the backpack - cloth armor included. A worn cloth
	//armor is additionally still listed in the bag (scene start mints it there, see
	//`coreSpawnTiles`), so drop that duplicate before the return below re-adds the refreshed one;
	//before this, the cloth branch removed the worn piece and returned nothing, destroying the
	//hero's only cloth armor on the first swap.
	if (scene.armorId === 'clothArmor' && scene.armorInstanceId) scene.bag.remove(scene.armorId, 1, scene.armorInstanceId);
	if (scene.armorId !== 'startingArmor') {
		//Equipping never implies identification (see `equipRing`'s comment on the same rule) -
		//the outgoing piece returns to the bag with whatever real identified state it had.
		const previous = { id: scene.armorId, quantity: 1, instanceId: scene.armorInstanceId, identified: scene.armorIdentified, cursed: scene.armorCursed, cursedKnown: scene.armorCursedKnown, level: scene.armorLevel, tier: scene.armorTier, sourceClass: scene.armorSourceClass };
		//`sourceClass` travels with the piece: a minted `armorReward` that lost it in the bag
		//would name itself the generic "quest armor" and re-equip as the wrong class.
		const returned = { id: scene.armorId, quantity: 1, instanceId: scene.armorInstanceId, identified: scene.armorIdentified, cursed: scene.armorCursed, cursedKnown: scene.armorCursedKnown, sourceClass: scene.armorSourceClass, level: scene.armorLevel, tier: scene.armorTier, affix: undefined as string | undefined, curseInfusionBonus: false };
		transferEnhancement({ ...previous, affix: scene.armorGlyph ?? undefined, curseInfusionBonus: scene.armorCurseInfusionBonus }, returned);
		//The infusion marker travels with its item, like the weapon's above.
		returned.curseInfusionBonus = scene.armorCurseInfusionBonus;
		scene.bag.add(returned);
	}
	scene.bag.remove(id, 1, item.instanceId);
	scene.armorId = id;
	scene.armorInstanceId = item.instanceId;
	//`Armor.doEquip()` puts the item object itself in the slot, so its class travels with the
	//worn piece; the minted `armorReward` id cannot, hence this mirror of `weaponSourceClass`.
	scene.armorSourceClass = (item as typeof item & { sourceClass?: string }).sourceClass ?? (id !== 'armorReward' ? id : scene.armorSourceClass);
	scene.armorIdentified = item.identified ?? false;
	scene.armorCursed = item.cursed ?? false;
	scene.armorCursedKnown = (item as typeof item & { cursedKnown?: boolean }).cursedKnown ?? false;
	//`Armor.doEquip()` assigns the slot the item with ITS OWN level - a downgrade is a normal
	//swap in Java; the `Math.min(5, ...)` this used to carry clamped a +6 bag armor to +5 (Java
	//caps nothing - scroll upgrades of a worn piece go past 5 here too).
	scene.armorLevel = item.level ?? 0;
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
	//Java pays both sides - `Armor.doEquip` unequips the outgoing piece (`hero.spend( timeToEquip )`,
	//`single=false`) and then spends its own `hero.spend( timeToEquip( hero ) )` before the seal
	//window opens - 2 turns together, `EquipableItem.timeToEquip` = 1f.
	scene.spendTurn(2);
	//After the equip, as in Java: the offer is about the armor now being worn.
	scene.offerSealTransfer(outgoingWasSealed, item.cursed ?? false, outgoingSealGlyph);
}

export interface ClassArmorState { armorInstanceId?: string; armorLevel: number; armorTier: number; armorGlyph: string | null; armorHardened: boolean; armorIdentified: boolean; armorCursed: boolean; armorCursedKnown: boolean; armorCurseInfusionBonus: boolean; armorSealed: boolean }
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
	//Java's transfer writes `level(armor.trueLevel())` onto the worn class armor - the picked
	//piece's own level with no cap (`ClassArmor.java`, tag `v3.3.8`), so no `Math.min(5, ...)`.
	scene.writeArmor({ armorInstanceId: target.instanceId, armorLevel: target.level ?? 0,
		armorTier: Math.max(1, Math.min(5, (target as typeof target & { tier?: number }).tier ?? armor.armorTier)),
		armorGlyph: target.affix ?? null, armorHardened: (target as typeof target & { hardened?: boolean }).hardened ?? false,
		armorIdentified: target.identified ?? false, armorCursed: target.cursed ?? false,
		armorCursedKnown: (target as typeof target & { cursedKnown?: boolean }).cursedKnown ?? false,
		armorCurseInfusionBonus: (target as typeof target & { curseInfusionBonus?: boolean }).curseInfusionBonus ?? false,
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
	//`EquipableItem.doUnequip()` (`EquipableItem.java`, inherited by `Weapon`, tag `v3.3.8`)
	//checks the item's own `cursed` flag; a cursed enchantment is separate and does not itself
	//bind the weapon. Java's MagicImmune gate bypasses this too.
	if (scene.weaponId !== 'startingWeapon' && scene.weaponCursed && scene.hero.magicImmune !== true) {
		scene.say(t('port.log.weaponcursed'), 'negative');
		return;
	}
	//`Talent.onItemEquipped()`: Adventurer's Intuition rank 2 identifies a wielded weapon (the Shard of Oblivion only makes it ready).
	if (scene.talentRank('adventurers_intuition') >= 2 && !scene.shardMarkReady?.(item)) {
		const newlyIdentified = !item.identified;
		Actors.identify(item);
		if (newlyIdentified) scene.procIdentifyTalents();
	}
	if (scene.weaponId !== 'startingWeapon') {
		//Equipping never implies identification (see `equipRing`'s comment on the same rule).
		const previous = { id: scene.weaponId, quantity: 1, instanceId: scene.weaponInstanceId, identified: scene.weaponIdentified, cursed: scene.weaponCursed, cursedKnown: scene.weaponCursedKnown, level: scene.weaponLevel, tier: scene.weaponTier, affix: scene.weaponAffix ?? undefined, curseInfusionBonus: scene.weaponCurseInfusionBonus, sourceClass: scene.weaponSourceClass };
		//`sourceClass` travels with the piece: a minted `weaponReward` that lost it in the bag
		//would name itself the generic "quest weapon" and re-equip with the previous wielded
		//weapon's class. (The class write for the INCOMING piece happens below, after the curse
		//gates - it used to happen in the scene wrapper first, so a refused equip still renamed
		//the weapon that stayed on.) The hero's *starting* weapon is not returned here: this port
		//models it as a scene phantom with no MWL bag node, unlike Java's `doUnequip(collect=true)`.
		const returned = { id: scene.weaponId, quantity: 1, instanceId: scene.weaponInstanceId, identified: scene.weaponIdentified, cursed: scene.weaponCursed, cursedKnown: scene.weaponCursedKnown, sourceClass: scene.weaponSourceClass, level: scene.weaponLevel, tier: scene.weaponTier, affix: undefined as string | undefined, curseInfusionBonus: false };
		transferEnhancement(previous, returned);
		//The infusion marker travels with its item, the way Java's `curseInfusionBonus` does: a
		//swapped-out weapon keeps it and the weapon coming in brings its own.
		returned.curseInfusionBonus = previous.curseInfusionBonus;
		scene.bag.add(returned);
	}
	scene.bag.remove(id, 1, item.instanceId);
	scene.weaponId = id;
	scene.weaponInstanceId = item.instanceId;
	//`KindOfWeapon.doEquip()` puts the item object itself in the slot, so its class travels with
	//the worn piece; the minted `weaponReward` id cannot, hence this mirror of `armorSourceClass`.
	scene.weaponSourceClass = (item as typeof item & { sourceClass?: string }).sourceClass ?? (id !== 'weaponReward' ? id : scene.weaponSourceClass);
	scene.weaponIdentified = item.identified ?? false;
	scene.weaponCursed = item.cursed ?? false;
	scene.weaponCursedKnown = (item as typeof item & { cursedKnown?: boolean }).cursedKnown ?? false;
	//`KindOfWeapon.doEquip()` assigns the slot the item with ITS OWN level - a downgrade is a
	//normal swap in Java. The `Math.max( scene.weaponLevel, ...)` this used to carry pinned a +0
	//replacement to the outgoing weapon's level (both were fossils of the pre-instance model,
	//where `weaponReward` carried no level of its own and equipping had to keep the slot's).
	scene.weaponLevel = item.level ?? 0;
	scene.weaponTier = Math.max(1, Math.min(5, (item as typeof item & { tier?: number }).tier ?? scene.weaponTier));
	scene.setWeaponAffix(item.affix ?? null);
	scene.weaponHardened = (item as typeof item & { hardened?: boolean }).hardened ?? false;
	scene.weaponCurseInfusionBonus = (item as typeof item & { curseInfusionBonus?: boolean }).curseInfusionBonus ?? false;
	scene.syncHeroFromStats();
	//`KindOfWeapon.doEquip` (tag `v3.3.8`): the swap pays the unequip side too
	//(`hero.belongings.weapon.doUnequip( hero, true )` -> `spendAndNext( timeToEquip )`) plus its
	//own `hero.spendAndNext( timeToEquip(hero) )` - 2 turns together, `EquipableItem.timeToEquip`
	//= 1f. SwiftEquip overrides that with `timeToEquip` 0 while `isSwiftEquipping`, and the port
	//prints Java's `swift_equip` line on the same condition (talent rank owned); the real 20-turn
	//charge budget (1 free swap, 2 at rank 2) is not modeled, so the talent reads as always ready.
	const swiftEquipping = scene.talentRank('swift_equip') > 0;
	if (swiftEquipping) scene.say(t('items.kindofweapon.swift_equip'), 'positive');
	else scene.say(t('port.log.weaponequipped', { level: scene.effectiveWeaponLevel() }), 'positive');
	scene.spendTurn(swiftEquipping ? 0 : 2);
}
