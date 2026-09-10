import { Random } from 'mwg';
import { RING_DEFS, ringDef } from './ringModifiers';

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
const PORT_ID_BY_POTION_CLASS: Record<string, string> = {
	PotionOfStrength: 'potionStrength', PotionOfHealing: 'potionHealing', PotionOfMindVision: 'potionMindVision',
	PotionOfFrost: 'potionFrost', PotionOfLiquidFlame: 'potionFlame', PotionOfToxicGas: 'potionToxicGas',
	PotionOfHaste: 'potionHaste', PotionOfInvisibility: 'potionInvis', PotionOfLevitation: 'potionLevitation',
	PotionOfParalyticGas: 'potionParalyticGas', PotionOfPurity: 'potionPurity', PotionOfExperience: 'potionExperience',
};
/** Also used outside transmutation (`generatedInventoryItem`'s potion resolution, item-picker decks). */
export const POTION_CLASS_BY_PORT_ID: Record<string, string> = {
	potion: 'PotionOfHealing', potionHealing: 'PotionOfHealing', potionStrength: 'PotionOfStrength',
	potionFlame: 'PotionOfLiquidFlame', potionMindVision: 'PotionOfMindVision', potionInvis: 'PotionOfInvisibility',
	potionPurity: 'PotionOfPurity', potionLevitation: 'PotionOfLevitation', potionExperience: 'PotionOfExperience',
	potionToxicGas: 'PotionOfToxicGas', potionParalyticGas: 'PotionOfParalyticGas', potionHaste: 'PotionOfHaste',
	potionFrost: 'PotionOfFrost',
};
/** Concrete scroll results - never `scrollTransmutation` itself, never the generic `'scroll'`. */
const SCROLL_TRANSMUTE_POOL = ['scrollIdentify', 'scrollUpgrade', 'scrollCleanse', 'scrollMirror', 'scrollRecharging',
	'scrollTeleportation', 'scrollLullaby', 'scrollMapping', 'scrollRage', 'scrollRetribution', 'scrollTerror'];
const SEED_TRANSMUTE_CLASSES = ['Rotberry', 'Sungrass', 'Fadeleaf', 'Icecap', 'Firebloom', 'Sorrowmoss',
	'Swiftthistle', 'Blindweed', 'Stormvine', 'Earthroot', 'Mageroyal', 'Starflower'];
const STONE_TRANSMUTE_CLASSES = ['StoneOfAugmentation', 'StoneOfFear', 'StoneOfDeepSleep', 'StoneOfShock',
	'StoneOfBlast', 'StoneOfBlink', 'StoneOfClairvoyance', 'StoneOfEnchantment', 'StoneOfIntuition',
	'StoneOfDetectMagic', 'StoneOfFlock', 'StoneOfAggression'];
/** Also used outside transmutation (`spawnGroundItem`'s floor-loot stone naming). */
export function stonePortId(stoneClass: string): string {
	switch (stoneClass) {
		case 'StoneOfAugmentation': return 'stoneOfAugmentation';
		case 'StoneOfFear': return 'stoneOfFear';
		case 'StoneOfDeepSleep': return 'stoneOfDeepSleep';
		case 'StoneOfShock': return 'stoneOfShock';
		case 'StoneOfBlast': return 'stoneOfBlast';
		case 'StoneOfBlink': return 'stoneOfBlink';
		case 'StoneOfClairvoyance': return 'stoneOfClairvoyance';
		case 'StoneOfEnchantment': return 'stoneOfEnchantment';
		case 'StoneOfIntuition': return 'stoneOfIntuition';
		case 'StoneOfDetectMagic': return 'stoneOfDetectMagic';
		case 'StoneOfFlock': return 'stoneOfFlock';
		case 'StoneOfAggression': return 'stoneOfAggression';
		default: return 'stone';
	}
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
}

export interface TransmutedItem extends TransmutableItem {
	stackable?: boolean;
}

/**
 * `ScrollOfTransmutation.usableOnItem()` adapted to this port's bag ids. Eligible: bag
 * melee weapons (`weaponReward`), rings, potions, scrolls (except itself - real Java only
 * allows self-target when the stack holds 2+ or the scroll was already consumed by
 * identify-on-read, neither of which this port models), seeds, runestones, and the
 * `cloak` artifact stand-in. Deliberately ineligible, each for a stated model reason:
 * armor (real Java's `usableOnItem` never accepts armor at all - no `changeArmor`
 * exists); `wand` (one shared id with no class identity to change into something
 * different); thrown `stone` ammo (a bare count, like missiles, not an item - and real
 * Java excludes plain `Dart` the same way); `hourglass` (unique artifact, like real
 * Java's Holy Tome/Cloak of Shadows exclusion); and equipped gear (tier fields and the
 * ring slot, not bag items - real Java's picker includes them, this port's bag-only
 * picker does not yet). `MagesStaff` weapons are excluded too: real Java's `changeStaff` keeps the
 * staff and only re-imbues its wand, which has no expression in a tier-only model.
 */
export function isTransmutableForScroll(item: { id: string; sourceClass?: string }): boolean {
	const id = item.id;
	if (id === 'weaponReward') return item.sourceClass !== 'MagesStaff';
	if (id.startsWith('ring_')) return ringDef(id) !== undefined;
	if (id.startsWith('potion')) return item.id in POTION_CLASS_BY_PORT_ID;
	if (id.startsWith('scroll')) return id !== 'scrollTransmutation';
	if (id === 'seed') return true;
	if (id === 'stone' || id.startsWith('stoneOf')) return true;
	if (id === 'cloak') return true;
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
 * way Java's `result.collect()` does). Simplifications: regular<->exotic scroll/potion
 * flips collapse to a random different regular type (no exotic classes exist here);
 * `changeStaff`/`changeTippedDart` have no expression (excluded at eligibility);
 * `changeArtifact`'s different-artifact reroll collapses to Java's own
 * no-artifacts-left fallback (a random ring at +0/+1/+2 by visible upgrades - here a
 * flat +0, since the `cloak` stand-in carries no upgrade level); wand/trinket rerolls
 * don't exist (see eligibility). Returns `undefined` only defensively (a one-entry
 * deck), in which case the caller keeps the scroll, mirroring the `result == null` path.
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
		const current = POTION_CLASS_BY_PORT_ID[target.id];
		const pool = Object.values(PORT_ID_BY_POTION_CLASS).filter((id) => POTION_CLASS_BY_PORT_ID[id] !== current);
		if (pool.length === 0) return undefined;
		return { id: Random.element(pool)!, quantity: 1, stackable: true, identified: target.identified };
	}
	if (target.id.startsWith('scroll')) {
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
		return { id: `ring_${Random.element(pool)!}`, quantity: 1, instanceId: newItemInstanceId('ring'), identified: target.identified, level: 0, cursed: target.cursed };
	}
	return undefined;
}
