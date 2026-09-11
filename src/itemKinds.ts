import { Actors } from 'mwg';
import type { GroundItem } from './combat';
import type { GroundItemKind } from './dungeonConstants';
import { MWL_MISSILE_BY_CLASS } from './mwlContent';

const SHOP_WEAPON_TIERS: Record<string, number> = Object.fromEntries([
	['WornShortsword', 1], ['MagesStaff', 1], ['Dagger', 1], ['Gloves', 1], ['Rapier', 1],
	['Shortsword', 2], ['HandAxe', 2], ['Spear', 2], ['Quarterstaff', 2], ['Dirk', 2], ['Sickle', 2],
	['Sword', 3], ['Mace', 3], ['Scimitar', 3], ['RoundShield', 3], ['Sai', 3], ['Whip', 3],
	['Longsword', 4], ['BattleAxe', 4], ['Flail', 4], ['RunicBlade', 4], ['AssassinsBlade', 4], ['Crossbow', 4], ['Katana', 4],
	['Greatsword', 5], ['WarHammer', 5], ['Glaive', 5], ['Greataxe', 5], ['Greatshield', 5], ['Gauntlet', 5], ['WarScythe', 5],
]);
const SHOP_ARMOR_TIERS: Record<string, number> = { ClothArmor: 1, LeatherArmor: 2, MailArmor: 3, ScaleArmor: 4, PlateArmor: 5 };

/** Rolls an affix from `table` when eligible, `undefined` otherwise - `generatedInventoryItem`'s
 * cursed/hasGoodEnchant gates decide eligibility, this only does the roll itself. */
export function rollGeneratedAffix(table: Actors.AffixTable, cursed: boolean, hasGoodEnchant: boolean): string | undefined {
	if (cursed) return Actors.rollAffix({ entries: table.entries.filter((e) => e.curse) })?.id;
	if (hasGoodEnchant) return Actors.rollAffix({ entries: table.entries.filter((e) => !e.curse) })?.id;
	return undefined;
}

export function groundKindForItem(item: NonNullable<GroundItem['item']>, fallback: GroundItemKind): GroundItemKind {
	if (item.id === 'gold') return 'gold';
	if (item.id === 'seed') return 'seed';
	if (item.id === 'weaponReward') return 'armor'; // same existing equipment sprite path; payload retains weapon identity
	if (item.id === 'armorReward') return 'armor';
	if (item.id === 'cloak') return 'wand'; // artifact stand-in uses the existing cloak sprite path
	if (item.id === 'wand') return 'wand';
	if (item.id.startsWith('ring_')) return 'ring';
	if (item.id === 'bomb' || item.id === 'doubleBomb') return 'bomb';
	if (item.id === 'corpseDust') return 'corpseDust';
	if (item.id === 'candle') return 'candle';
	if (item.id === 'embers') return 'embers';
	if (item.id === 'ankh') return 'ankh';
	if (item.id === 'stylus') return 'stylus';
	if (item.id === 'honeypot') return 'honeypot';
	if (item.id === 'alchemize') return 'alchemize';
	if (item.id === 'bag') return 'bag';
	if (item.id.startsWith('missile_')) return 'stone';
	if (item.id === 'sandBag') return 'sandBag';
	if (item.id.startsWith('potion')) return 'potion';
	if (item.id.startsWith('scroll')) return 'scroll';
	//Found while wiring StoneOfAugmentation: any generated `Cat.STONE` runestone (most still
	//collapse to the generic 'stone' id, a few now get their own) fell through to whatever
	//`fallback` the caller passed - 'food' at the one real floor-loot call site - rendering
	//and behaving as a food ground item instead of a stone. Pre-existing, not introduced here.
	//Collapsed from a per-id OR-chain to a prefix test per the section-11 KISS note: every
	//distinct runestone id starts with 'stoneOf', and no other bag id starts with 'stone'.
	if (item.id === 'stone' || item.id.startsWith('stoneOf')) return 'stone';
	return fallback;
}

/** Converts a Painter's concrete Java class name into the same payload used by live drops. */
export function sourceInventoryItem(id: string, sourceClass: string | undefined, newItemInstanceId: (kind: string) => string): GroundItem['item'] {
	if (id === 'crystalKey' || id === 'ironKey' || id === 'goldenKey') return { id, quantity: 1, identified: true };
	if (id.toLowerCase().includes('sandbag')) return { id: 'sandBag', quantity: 1, identified: true };
	if (id.toLowerCase() === 'ankh') return { id: 'ankh', quantity: 1, identified: true, sourceClass: 'Ankh' };
	if (id.toLowerCase() === 'stylus') return { id: 'stylus', quantity: 1, identified: true, sourceClass: 'Stylus' };
	if (id.toLowerCase() === 'honeypot') return { id: 'honeypot', quantity: 1, identified: true, sourceClass: 'Honeypot' };
	if (id.toLowerCase().startsWith('alchemize')) return { id: 'alchemize', quantity: 1, identified: true, sourceClass: 'Alchemize' };
	if (id.toLowerCase() === 'bag') return { id: 'bag', quantity: 1, identified: true, sourceClass: 'Bag' };
	if (id.toLowerCase().includes('timekeepershourglass')) return { id: 'hourglass', quantity: 1, identified: false, sandBags: 0, instanceId: newItemInstanceId('hourglass'), sourceClass };
	if (id.split('|', 1)[0]!.toLowerCase() === 'artifact') return { id: 'cloak', quantity: 1, identified: false, instanceId: newItemInstanceId('artifact'), sourceClass };
	if (id.toLowerCase() === 'seed') return { id: 'seed', quantity: 1, identified: true, sourceClass };
	const concrete = sourceClass ?? id;
	const lower = concrete.toLowerCase();
	const missile = MWL_MISSILE_BY_CLASS.get(concrete);
	if (missile) return {
		id: missile.id,
		quantity: 1,
		identified: true,
		tier: missile.tier,
		sourceClass: missile.sourceClass,
	};
	if (lower.includes('gold')) return { id: 'gold', quantity: 1, identified: true, sourceClass: concrete };
	//same short-id rename `generatedInventoryItem` needs for these two (see its comment)
	if (lower.includes('potion')) return { id: concrete === 'PotionOfLiquidFlame' ? 'potionFlame' : concrete === 'PotionOfInvisibility' ? 'potionInvis' : concrete.replace(/^PotionOf/, 'potion'), quantity: 1, identified: false, sourceClass: concrete };
	//same short-id rename `generatedInventoryItem` needs for these three (see its comment)
	if (lower.includes('scroll')) return { id: concrete === 'ScrollOfMirrorImage' ? 'scrollMirror' : concrete === 'ScrollOfMagicMapping' ? 'scrollMapping' : concrete === 'ScrollOfRemoveCurse' ? 'scrollCleanse' : concrete.replace(/^ScrollOf/, 'scroll'), quantity: 1, identified: false, sourceClass: concrete };
	if (lower.includes('ring')) return { id: `ring_${concrete.replace(/^RingOf/, '').replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`).replace(/^_/, '')}`, quantity: 1, identified: false, instanceId: newItemInstanceId('ring'), sourceClass: concrete };
	if (lower.includes('timekeepershourglass')) return { id: 'hourglass', quantity: 1, identified: false, sandBags: 0, instanceId: newItemInstanceId('hourglass'), sourceClass: concrete };
	if (lower.includes('artifact')) return { id: 'cloak', quantity: 1, identified: false, instanceId: newItemInstanceId('artifact'), sourceClass: concrete };
	if (lower.includes('wand')) return { id: 'wand', quantity: 1, identified: false, instanceId: newItemInstanceId('wand'), sourceClass: concrete };
	//`ShopRoom.generateItems()` places concrete weapon/armor classes directly. Preserve their
	//class and tier so generated stock becomes a real level-0 shop item instead of disappearing.
	const weaponTier = SHOP_WEAPON_TIERS[concrete];
	if (weaponTier !== undefined) return { id: 'weaponReward', quantity: 1, tier: weaponTier, level: 0, identified: false, instanceId: newItemInstanceId('weapon'), sourceClass: concrete };
	const armorTier = SHOP_ARMOR_TIERS[concrete];
	if (armorTier !== undefined) return { id: 'armorReward', quantity: 1, tier: armorTier, level: 0, identified: false, instanceId: newItemInstanceId('armor'), sourceClass: concrete };
	//Bomb room loot: `Bomb` stacks, `DoubleBomb` stays its own id so pickup can grant
	//the real "1+1 free!" Bomb x2 (`DoubleBomb.doPickUp`). Bombs are always identified
	//(`Bomb.isIdentified()` returns true unconditionally).
	if (concrete === 'DoubleBomb' || lower === 'doublebomb') return { id: 'doubleBomb', quantity: 1, identified: true, sourceClass: 'DoubleBomb' };
	if (concrete === 'Bomb' || lower === 'bomb') return { id: 'bomb', quantity: 1, identified: true, sourceClass: 'Bomb' };
	//RitualSiteRoom's four queued `CeremonialCandle`s (quest type 2) - always identified
	//(`isIdentified()` returns true unconditionally), like every other quest prop here.
	if (concrete === 'CeremonialCandle' || lower === 'ceremonialcandle') return { id: 'candle', quantity: 1, identified: true, sourceClass: 'CeremonialCandle' };
	//`Embers` (quest type 2 turn-in fetch) - always identified, like `CorpseDust` below.
	if (concrete === 'Embers' || lower === 'embers') return { id: 'embers', quantity: 1, identified: true, sourceClass: 'Embers' };
	//CorpseDust arrives cursed (`CorpseDust.cursed = true` in its initializer) - the
	//wraith-spawning curse itself needs a Wraith mob that doesn't exist yet, but the
	//flag rides the item honestly until then (and blocks nothing: only equipped gear
	//reads `cursed`). Quest items have no appearance shuffle, so it shows its name.
	if (lower === 'corpsedust') return { id: 'corpseDust', quantity: 1, identified: true, cursed: true, sourceClass: 'CorpseDust' };
	//same short-id rename `generatedInventoryItem` needs for all twelve runestones (see its comment)
	if (concrete === 'StoneOfAugmentation') return { id: 'stoneOfAugmentation', quantity: 1, identified: false, sourceClass: concrete };
	if (concrete === 'StoneOfFear') return { id: 'stoneOfFear', quantity: 1, identified: false, sourceClass: concrete };
	if (concrete === 'StoneOfDeepSleep') return { id: 'stoneOfDeepSleep', quantity: 1, identified: false, sourceClass: concrete };
	if (concrete === 'StoneOfShock') return { id: 'stoneOfShock', quantity: 1, identified: false, sourceClass: concrete };
	if (concrete === 'StoneOfBlast') return { id: 'stoneOfBlast', quantity: 1, identified: false, sourceClass: concrete };
	if (concrete === 'StoneOfBlink') return { id: 'stoneOfBlink', quantity: 1, identified: false, sourceClass: concrete };
	if (concrete === 'StoneOfClairvoyance') return { id: 'stoneOfClairvoyance', quantity: 1, identified: false, sourceClass: concrete };
	if (concrete === 'StoneOfEnchantment') return { id: 'stoneOfEnchantment', quantity: 1, identified: false, sourceClass: concrete };
	if (concrete === 'StoneOfIntuition') return { id: 'stoneOfIntuition', quantity: 1, identified: false, sourceClass: concrete };
	if (concrete === 'StoneOfDetectMagic') return { id: 'stoneOfDetectMagic', quantity: 1, identified: false, sourceClass: concrete };
	if (concrete === 'StoneOfFlock') return { id: 'stoneOfFlock', quantity: 1, identified: false, sourceClass: concrete };
	if (concrete === 'StoneOfAggression') return { id: 'stoneOfAggression', quantity: 1, identified: false, sourceClass: concrete };
	if (lower.includes('stone')) return { id: 'stone', quantity: 1, identified: false, sourceClass: concrete };
	if (lower.includes('seed') || lower.includes('starflower')) return { id: 'seed', quantity: 1, identified: true, sourceClass: concrete };
	if (lower.includes('armor')) return { id: 'armorReward', quantity: 1, identified: false, instanceId: newItemInstanceId('armor'), sourceClass: concrete };
	if (lower.includes('weapon')) return { id: 'weaponReward', quantity: 1, identified: false, instanceId: newItemInstanceId('weapon'), sourceClass: concrete };
	if (id === 'armor') return { id: 'armorReward', quantity: 1, identified: false, instanceId: newItemInstanceId('armor'), sourceClass: concrete };
	if (id === 'weapon') return { id: 'weaponReward', quantity: 1, identified: false, instanceId: newItemInstanceId('weapon'), sourceClass: concrete };
	if (id === 'missile' || id === 'stone') return { id: 'stone', quantity: 1, identified: true, sourceClass: concrete };
	if (id === 'food') return { id: 'food', quantity: 1, identified: false, sourceClass: concrete };
	if (id === 'potion') return { id: 'potion', quantity: 1, identified: false, sourceClass: concrete };
	if (id === 'scroll') return { id: 'scroll', quantity: 1, identified: false, sourceClass: concrete };
	if (id === 'ring') return { id: `ring_garnet`, quantity: 1, identified: false, instanceId: newItemInstanceId('ring'), sourceClass: concrete };
	if (id === 'wand') return { id: 'wand', quantity: 1, identified: false, instanceId: newItemInstanceId('wand'), sourceClass: concrete };
	if (id === 'runestone') return { id: 'stone', quantity: 1, identified: false, sourceClass: concrete };
	return undefined;
}

export function portItemKind(id: string): GroundItemKind | null {
	if (id === 'crystalKey') return 'crystalKey';
	if (id.toLowerCase().includes('sandbag')) return 'sandBag';
	if (id === 'ironKey') return 'ironKey';
	if (id === 'goldenKey') return 'goldenKey';
	if (id === 'seed') return 'seed';
	const lower = id.toLowerCase();
	//Direct room drops do not carry an Item-category suffix (Gold, StoneOfEnchantment,
	//MysteryMeat, Dewdrop, Amulet, and the mining/quest currencies), so handle them before
	//the broader Generator-style category checks below.
	if (lower.includes('dewdrop')) return 'dewdrop';
	//Bomb/DoubleBomb room loot (Armory/Honeypot/Artillery): exact match only, so a
	//future Tengu smoke-bomb heap never folds into the throwable-bomb family by
	//substring accident. Previously returned null, which silently dropped every
	//generated bomb instead of spawning it.
	if (lower === 'bomb' || lower === 'doublebomb') return 'bomb';
	//MassGraveRoom's CorpseDust heap (quest type 1) - exact match like bombs, so it
	//spawns as a real pickup instead of vanishing on the null branch below.
	if (lower === 'corpsedust') return 'corpseDust';
	//RitualSiteRoom's queued candles and the newborn's Embers drop (quest type 2).
	if (lower === 'ceremonialcandle') return 'candle';
	if (lower === 'embers') return 'embers';
	//ShopRoom's concrete stock classes were previously dropped here because they are neither
	//Generator categories nor ordinary room currencies. Preserve the Java class identity and
	//sprite family now; their specialized use windows remain separate roadmap work.
	if (lower === 'ankh') return 'ankh';
	if (lower === 'stylus') return 'stylus';
	if (lower === 'honeypot' || lower === 'shatteredpot') return 'honeypot';
	if (lower.startsWith('alchemize')) return 'alchemize';
	if (lower === 'bag' || lower.includes('backpack') || lower.includes('pouch') || lower.includes('bandolier') || lower.includes('holder') || lower.includes('holster')) return 'bag';
	if (lower.includes('energycrystal')) return 'stone';
	if (lower.includes('alchemypage') || lower.includes('guidebook')) return 'scroll';
	if (lower.includes('honeypot')) return 'food';
	if (lower.includes('runestone')) return 'stone';
	if (lower.includes('stone')) return 'stone';
	if (lower.includes('meat')) return 'meat';
	if (lower.includes('amulet')) return 'amulet';
	if (lower.includes('dwarftoken')) return 'dwarfToken';
	if (lower.includes('darkgold')) return 'darkGold';
	if (lower.includes('potion')) return 'potion';
	if (lower.includes('scroll')) return 'scroll';
	if (lower.includes('artifact')) return 'wand';
	if (lower.includes('ring')) return 'ring';
	if (lower.includes('wand')) return 'wand';
	if (lower.includes('armor') || lower.includes('weapon')) return 'armor';
	if (lower.includes('gold')) return 'gold';
	if (lower.includes('food') || lower.includes('ration')) return 'food';
	return null;
}
