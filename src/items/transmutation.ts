import { Random } from 'mwg';
import { RING_DEFS, ringDef } from './ringModifiers';
import { MWL_CONSUMABLE_CLASS_ALIASES, MWL_MISSILE_DEFINITIONS, MWL_WAND_DEFINITIONS } from '../mwlContent';
import { MISSILE_MAX_DURABILITY, TIPPED_DART_BY_SEED, missileStackId } from './missiles';

/**
 * `ScrollOfTransmutation.changeItem()`'s per-category decks, adapted to this port's ids
 * (checked against tag `v3.3.8`'s `Generator.java` + `ScrollOfTransmutation.java`).
 * Melee tiers are `Generator`'s real `WEP_T1..T5` class lists; potions/scrolls/seeds/stones
 * are the real 12-class decks. `PORT_ID_BY_POTION_CLASS` inverts the short-id rename
 * `generatedInventoryItem` applies (`PotionOfLiquidFlame` -> `potionFlame`,
 * `PotionOfInvisibility` -> `potionInvis`); the generic bag `'potion'` placeholder counts
 * as `PotionOfHealing` for exclusion purposes. Stone classes are the real 12 from
 * `items/stones/` (the generator deck uses the real `StoneOfDetectMagic` class; the former
 * `StoneOfDisarming` name was a stale port typo); all 12
 * stones now have distinct port ids and use-actions.
 */
const WEP_TIER_CLASSES: string[][] = [
	['WornShortsword', 'MagesStaff', 'Dagger', 'Gloves', 'Rapier'],
	['Shortsword', 'HandAxe', 'Spear', 'Quarterstaff', 'Dirk', 'Sickle'],
	['Sword', 'Mace', 'Scimitar', 'RoundShield', 'Sai', 'Whip'],
	['Longsword', 'BattleAxe', 'Flail', 'RunicBlade', 'AssassinsBlade', 'Crossbow', 'Katana'],
	['Greatsword', 'WarHammer', 'Glaive', 'Greataxe', 'Greatshield', 'Gauntlet', 'WarScythe'],
];
/**
 * `Generator`'s real `MIS_T1..T5` class lists (`Generator.java`, tag `v3.3.8`), read off
 * the authored `missiles.mwl` rows instead of hardcoded, so the deck cannot drift from
 * the catalogue. `Dart` has no row (this port stocks only tipped darts, matching what
 * the shop sells) and `TippedDart` transmutes through its own tip table below, never here.
 */
function missileTierClasses(tier: number): string[] {
	return MWL_MISSILE_DEFINITIONS.filter((def) => def.tier === tier && def.sourceClass !== 'TippedDart').map((def) => def.sourceClass);
}
/** Wand classes from the authored MWL definitions (13 real `items/wands/*.java` classes). */
const WAND_TRANSMUTE_CLASSES: string[] = MWL_WAND_DEFINITIONS.map((def) => def.sourceClass);
/** `wands.ts`' executable type for a wand class, for the wielded-wand picker entry. */
export function wandTypeForTransmute(sourceClass: string): string | undefined {
	return MWL_WAND_DEFINITIONS.find((def) => def.sourceClass.toLowerCase() === sourceClass.toLowerCase())?.type;
}
/** Wand class for an executable type (the wielded wand's `wandType` back to a class). */
export function wandClassForType(type: string): string | undefined {
	return MWL_WAND_DEFINITIONS.find((def) => def.type === type)?.sourceClass;
}
/** Bag id for a missile class (`ThrowingKnife` -> `missile_throwingknife`). */
export function missileIdForClass(sourceClass: string): string {
	return `missile_${sourceClass.toLowerCase()}`;
}
/** Missile tier for a class, from the authored rows (0 when unknown). */
export function missileTierForClass(sourceClass: string): number {
	return MWL_MISSILE_DEFINITIONS.find((def) => def.sourceClass === sourceClass)?.tier ?? 0;
}
const PORT_ID_BY_POTION_CLASS: Readonly<Record<string, string>> = Object.fromEntries(
	MWL_CONSUMABLE_CLASS_ALIASES.filter((alias) => alias.category === 'potion').map((alias) => [alias.sourceClass, alias.item]),
);
/** Also used outside transmutation (`generatedInventoryItem`'s potion resolution, item-picker decks). */
export const POTION_CLASS_BY_PORT_ID: Readonly<Record<string, string>> = {
	potion: 'PotionOfHealing',
	...Object.fromEntries(MWL_CONSUMABLE_CLASS_ALIASES.filter((alias) => alias.category === 'potion').map((alias) => [alias.item, alias.sourceClass])),
};
/** Concrete scroll results - never `scrollTransmutation` itself, never the generic `'scroll'`. */
const SCROLL_TRANSMUTE_POOL = MWL_CONSUMABLE_CLASS_ALIASES.filter((alias) => alias.category === 'scroll' && alias.item !== 'scrollTransmutation').map((alias) => alias.item);
const SEED_TRANSMUTE_CLASSES = MWL_CONSUMABLE_CLASS_ALIASES.filter((alias) => alias.category === 'seed').map((alias) => alias.sourceClass);
const STONE_CLASS_TO_ID = new Map(MWL_CONSUMABLE_CLASS_ALIASES.filter((alias) => alias.category === 'stone').map((alias) => [alias.sourceClass, alias.item]));
const STONE_TRANSMUTE_CLASSES = [...STONE_CLASS_TO_ID.keys()];
/** Also used outside transmutation (`spawnGroundItem`'s floor-loot stone naming). */
export function stonePortId(stoneClass: string): string {
	return STONE_CLASS_TO_ID.get(stoneClass) ?? 'stone';
}

export interface TransmutableItem {
	id: string;
	quantity: number;
	instanceId?: string;
	identified?: boolean;
	level?: number;
	affix?: string;
	cursed?: boolean;
	sourceClass?: string;
	/** Tipped-dart tip seed (`TippedDart` stacks only). */
	tippedSeed?: string;
	/** Missile wear on the shared 100-point scale (carried/wielded stacks). */
	durability?: number;
	maxDurability?: number;
	/** The stack's `MissileWeapon.setID` lineage (a new set is minted on reroll). */
	missileSet?: string;
}

export interface TransmutedItem extends TransmutableItem {
	stackable?: boolean;
}

/**
 * `ScrollOfTransmutation.usableOnItem()` adapted to this port's bag ids. Eligible: bag
 * melee weapons (`weaponReward`), rings, potions, scrolls (except itself - real Java only
 * allows self-target when the stack holds 2+ or the scroll was already consumed by
 * identify-on-read, neither of which this port models), seeds, runestones, and the
 * `cloak` artifact stand-in. Deliberately ineligible in this bag-item helper, each for a
 * stated model reason (the scene picker handles equipped rings separately):
 * armor (real Java's `usableOnItem` never accepts armor at all - no `changeArmor`
 * exists); `wand` (one shared id with no class identity to change into something
 * different); thrown `stone` ammo (a bare count, like missiles, not an item - and real
 * Java excludes plain `Dart` the same way); `hourglass` (unique artifact, like real
 * Java's Holy Tome/Cloak of Shadows exclusion); and equipped weapons/armor (tier fields,
 * not bag items - real Java's picker includes them, while this port's scene currently
 * handles only equipped rings). `MagesStaff` weapons are excluded too: real Java's `changeStaff` keeps the
 * staff and only re-imbues its wand, which has no expression in a tier-only model.
 */
export function isTransmutableForScroll(item: { id: string; sourceClass?: string }): boolean {
	const id = item.id;
	if (id === 'weaponReward') return item.sourceClass !== 'MagesStaff';
	if (id.startsWith('ring_')) return ringDef(id) !== undefined;
	//Ported exotics flip to their regular counterpart in `transmuteItem` below rather
	//than joining the random deck, so they are transmutable without a class alias.
	if (id.startsWith('potion')) return item.id in POTION_CLASS_BY_PORT_ID || item.id === 'potionShrouding';
	if (id.startsWith('scroll')) return id !== 'scrollTransmutation';
	if (id === 'seed') return true;
	if (id === 'stone' || id.startsWith('stoneOf')) return true;
	if (id === 'cloak') return true;
	//`changeTippedDart`/`changeWeapon`'s missile half: every carried `missile_*` stack,
	//tipped or not (real Java takes all missiles except the plain `Dart`, which has no
	//port id at all). Carried wands with a class transmute through `changeWand`; the
	//classless shared `wand` entry does not (the wielded wand is a scene-side entry).
	//`pickaxe` is a tier-2 melee weapon in real Java, eligible everywhere except the
	//mining branch - the scene filters the branch, this helper does not know it.
	if (id.startsWith('missile_')) return true;
	if (id === 'wand') return item.sourceClass !== undefined && item.sourceClass !== '';
	if (id === 'pickaxe') return true;
	return false;
}

/**
 * `ScrollOfTransmutation.changeItem()` per category, over gameplay `Random` (a live
 * hero action, not level generation - so never the level-stream `SpdRandom`). The
 * result always differs from the input (`do...while` in real Java), preserves upgrade
 * level/curse/identified state and weapon enchantments (`changeWeapon`'s
 * `enchantment`/`augment`/`curseInfusionBonus` carry-over; this port's model only has
 * the shared `affix` string to carry), and consumes exactly one unit of a stackable
 * target (returned with `quantity: 1` so it merges into an existing stack the same
 * way Java's `result.collect()` does - except non-tipped missiles, where Java detaches
 * the whole stack and the result keeps its quantity). Simplifications: regular<->exotic
 * scroll/potion flips collapse to a random different regular type (no exotic classes
 * exist here); `changeStaff` has no expression (excluded at eligibility - the staff keeps
 * its item and only re-imbues, which a tier-only model cannot do); `changeArtifact`'s
 * different-artifact reroll collapses to Java's own no-artifacts-left fallback (a random
 * ring at +0/+1/+2 by visible upgrades - here a flat +0, since the `cloak` stand-in
 * carries no upgrade level); trinket rerolls don't exist (no trinket items here).
 * Returns `undefined` only defensively (a one-entry deck), in which case the caller
 * keeps the scroll, mirroring the `result == null` path.
 */
export function transmuteItem(target: TransmutableItem, newItemInstanceId: (kind: string) => string): TransmutedItem | undefined {
	if (target.id === 'weaponReward') {
		const current = target.sourceClass ?? '';
		let tier = WEP_TIER_CLASSES.findIndex((classes) => classes.includes(current));
		const pool = (tier >= 0 ? WEP_TIER_CLASSES[tier]! : WEP_TIER_CLASSES.flat()).filter((c) => c !== current && c !== 'MagesStaff');
		if (pool.length === 0) return undefined;
		const picked = Random.element(pool)!;
		return { id: 'weaponReward', quantity: 1, instanceId: newItemInstanceId('weapon'), identified: target.identified, level: target.level, affix: target.affix, cursed: target.cursed, sourceClass: picked };
	}
	if (target.id.startsWith('ring_')) {
		const current = target.id.replace(/^ring_/, '');
		const pool = Object.keys(RING_DEFS).filter((k) => k !== current);
		if (pool.length === 0) return undefined;
		return { id: `ring_${Random.element(pool)!}`, quantity: 1, instanceId: newItemInstanceId('ring'), identified: target.identified, level: target.level, cursed: target.cursed };
	}
	if (target.id.startsWith('potion')) {
		//`changePotion` (same file): an exotic flips to its own regular counterpart
		//(`ExoticPotion.exoToReg`) - with one exotic pair ported that is
		//`potionShrouding` -> `potionInvis`, mirroring the scroll branch below.
		if (target.id === 'potionShrouding') return { id: 'potionInvis', quantity: 1, stackable: true, identified: target.identified };
		const current = POTION_CLASS_BY_PORT_ID[target.id];
		const pool = Object.values(PORT_ID_BY_POTION_CLASS).filter((id) => POTION_CLASS_BY_PORT_ID[id] !== current);
		if (pool.length === 0) return undefined;
		return { id: Random.element(pool)!, quantity: 1, stackable: true, identified: target.identified };
	}
	if (target.id.startsWith('scroll')) {
		//`changeScroll` (same file): an exotic flips to its own regular counterpart
		//(`ExoticScroll.exoToReg`), not to a random scroll - with one exotic pair
		//ported that is `scrollPrismatic` -> `scrollMirror`, identified state
		//carried like every other branch. Regular inputs keep the port's
		//random-regular simplification (stated above), which a fuller exotic
		//roster will narrow pair by pair.
		if (target.id === 'scrollPrismatic') return { id: 'scrollMirror', quantity: 1, stackable: true, identified: target.identified };
		const pool = SCROLL_TRANSMUTE_POOL.filter((id) => id !== target.id);
		if (pool.length === 0) return undefined;
		return { id: Random.element(pool)!, quantity: 1, stackable: true, identified: target.identified };
	}
	if (target.id === 'seed') {
		const current = (target.sourceClass ?? '').split('.').pop() ?? '';
		const pool = SEED_TRANSMUTE_CLASSES.filter((c) => c !== current);
		if (pool.length === 0) return undefined;
		return { id: 'seed', quantity: 1, stackable: true, identified: true, sourceClass: Random.element(pool)! };
	}
	if (target.id === 'stone' || target.id.startsWith('stoneOf')) {
		const current = target.sourceClass ?? '';
		const pool = STONE_TRANSMUTE_CLASSES.filter((c) => c !== current);
		if (pool.length === 0) return undefined;
		const picked = Random.element(pool)!;
		return { id: stonePortId(picked), quantity: 1, stackable: true, identified: target.identified, sourceClass: picked };
	}
	if (target.id === 'cloak') {
		const pool = Object.keys(RING_DEFS);
		if (pool.length === 0) return undefined;
		return { id: `ring_${Random.element(pool)!}`, quantity: 1, instanceId: newItemInstanceId('ring'), identified: target.identified, level: target.level, cursed: target.cursed };
	}
	if (target.id === 'missile_tippeddart') {
		//`changeTippedDart`: a different tip as one fresh unit (`randomTipped(1)` - level
		//0, full wear, its own new set).
		const current = (target.tippedSeed ?? '').toLowerCase();
		const pool = Object.keys(TIPPED_DART_BY_SEED).filter((seed) => seed !== current);
		if (pool.length === 0) return undefined;
		const seed = Random.element(pool)!;
		const set = newItemInstanceId('missile');
		return { id: 'missile_tippeddart', quantity: 1, stackable: true, identified: target.identified, sourceClass: 'TippedDart', tippedSeed: seed, level: 0, durability: MISSILE_MAX_DURABILITY, maxDurability: MISSILE_MAX_DURABILITY, missileSet: set, instanceId: missileStackId(set, 0, seed) };
	}
	if (target.id.startsWith('missile_')) {
		//`changeWeapon`'s missile half: a different class in the same `misTiers` tier,
		//keeping level, quantity and wear on the shared 100-point scale; the old set is
		//destroyed (the scene records the `UpgradedSetTracker` threshold from the swap).
		const current = target.sourceClass ?? '';
		const pool = missileTierClasses(missileTierForClass(current)).filter((c) => c !== current);
		if (pool.length === 0) return undefined;
		const picked = Random.element(pool)!;
		const set = newItemInstanceId('missile');
		const level = target.level ?? 0;
		return { id: missileIdForClass(picked), quantity: target.quantity, stackable: true, identified: target.identified, sourceClass: picked, level, durability: target.durability, maxDurability: target.maxDurability, missileSet: set, instanceId: missileStackId(set, level) };
	}
	if (target.id === 'wand' && target.sourceClass) {
		//`changeWand`: a different class. Carried spares carry no level or charges here
		//(wand power and charges are scene-level state), so only the class changes.
		const current = target.sourceClass.toLowerCase();
		const pool = WAND_TRANSMUTE_CLASSES.filter((c) => c.toLowerCase() !== current);
		if (pool.length === 0) return undefined;
		return { id: 'wand', quantity: 1, stackable: true, identified: target.identified, sourceClass: Random.element(pool)! };
	}
	if (target.id === 'pickaxe') {
		//The pickaxe is a tier-2 melee weapon (`Pickaxe.java`); outside the mining branch
		//it rerolls into a real tier-2 weapon like any other (`changeWeapon`).
		const pool = (WEP_TIER_CLASSES[1] ?? []).filter((c) => c !== 'MagesStaff');
		if (pool.length === 0) return undefined;
		return { id: 'weaponReward', quantity: 1, instanceId: newItemInstanceId('weapon'), identified: target.identified, level: 0, sourceClass: Random.element(pool)! };
	}
	return undefined;
}
