import { Actors } from 'mwg';
import type { GroundItem } from '../combat';
import type { GroundItemKind } from '../dungeonConstants';
import { MWL_CONSUMABLE_CLASS_TO_ID, MWL_ITEM_CATEGORIES, MWL_ITEM_GROUND_KIND_ALIASES, MWL_MISSILE_BY_CLASS, MWL_RING_CLASS_TO_ID, MWL_SPECIAL_ITEM_GROUND_KINDS, MWL_SPECIAL_ITEM_INVENTORY_BY_CLASS } from '../mwlContent';
import { WEAPON_TIER_BY_CLASS, ARMOR_TIER_BY_CLASS } from './catalog';
export const SPECIALTY_BOMB_IDS = new Set(
	[...MWL_ITEM_CATEGORIES].filter(([, category]) => category === 'specialtyBomb').map(([id]) => id),
);

/** Rolls an affix from `table` when eligible, `undefined` otherwise - `generatedInventoryItem`'s
 * cursed/hasGoodEnchant gates decide eligibility. MWG 0.7.2's `rollAffix` `curse` option does the
 * pool split itself (`Boolean(entry.curse) === options.curse`), so the port no longer filters the
 * entry list by hand. */
export function rollGeneratedAffix(table: Actors.AffixTable, cursed: boolean, hasGoodEnchant: boolean): string | undefined {
	if (cursed) return Actors.rollAffix(table, { curse: true })?.id;
	if (hasGoodEnchant) return Actors.rollAffix(table, { curse: false })?.id;
	return undefined;
}

export function groundKindForItem(item: NonNullable<GroundItem['item']>, fallback: GroundItemKind): GroundItemKind {
	const authoredAlias = MWL_ITEM_GROUND_KIND_ALIASES[item.id];
	if (authoredAlias) return authoredAlias as GroundItemKind;
	if (item.id.startsWith('ring_')) return 'ring';
	if (SPECIALTY_BOMB_IDS.has(item.id)) return 'bomb';
	if (item.id.startsWith('missile_')) return 'stone';
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
	const directSpecial = MWL_SPECIAL_ITEM_INVENTORY_BY_CLASS.get(id.toLowerCase());
	if (directSpecial) return { id: directSpecial.itemId, quantity: 1, identified: directSpecial.identified, ...(directSpecial.cursed ? { cursed: true } : {}), sourceClass: directSpecial.sourceClass };
	//Keep the generic Painter aliases for variants that are not concrete MWL rows.
	if (id.toLowerCase().includes('sandbag')) return { id: 'sandBag', quantity: 1, identified: true };
	if (id.toLowerCase().startsWith('alchemize')) return { id: 'alchemize', quantity: 1, identified: true, sourceClass: 'Alchemize' };
	if (id.toLowerCase().includes('timekeepershourglass')) return { id: 'hourglass', quantity: 1, identified: false, sandBags: 0, instanceId: newItemInstanceId('hourglass'), sourceClass };
	//`ChaliceOfBlood` (tag `v3.3.8`), checked before the generic artifact fallback below: every
	//other artifact class still collapses to `cloak` (Cloak of Shadows), which used to be true of
	//Chalice too - a real Java artifact silently rendering and behaving as a different one.
	if (id.toLowerCase().includes('chaliceofblood')) return { id: 'chalice', quantity: 1, identified: false, instanceId: newItemInstanceId('artifact'), sourceClass };
	if (id.split('|', 1)[0]!.toLowerCase() === 'artifact') return { id: 'cloak', quantity: 1, identified: false, instanceId: newItemInstanceId('artifact'), sourceClass };
	if (id.toLowerCase() === 'seed') return { id: 'seed', quantity: 1, identified: true, sourceClass, ...(sourceClass ? { instanceId: `seed:${sourceClass.toLowerCase()}` } : {}) };
	const concrete = sourceClass ?? id;
	const lower = concrete.toLowerCase();
	const authoredSpecial = MWL_SPECIAL_ITEM_INVENTORY_BY_CLASS.get(lower);
	if (authoredSpecial) return { id: authoredSpecial.itemId, quantity: 1, identified: authoredSpecial.identified, ...(authoredSpecial.cursed ? { cursed: true } : {}), sourceClass: authoredSpecial.sourceClass };
	const consumableAlias = MWL_CONSUMABLE_CLASS_TO_ID.get(concrete);
	if (consumableAlias) return { id: consumableAlias, quantity: 1, identified: false, sourceClass: concrete };
	if (concrete === 'ChargrilledMeat' || lower === 'chargrilledmeat') return { id: 'chargrilledMeat', quantity: 1, identified: true, sourceClass: 'ChargrilledMeat' };
	const missile = MWL_MISSILE_BY_CLASS.get(concrete);
	if (missile) return {
		id: missile.id,
		quantity: 1,
		identified: true,
		tier: missile.tier,
		sourceClass: missile.sourceClass,
	};
	if (lower.includes('gold')) return { id: 'gold', quantity: 1, identified: true, sourceClass: concrete };
	//same short-id rename `generatedInventoryItem` needs for these two (see its comment).
	//Room painters can pass the already-lowercase `potionOf...` id while generator drops pass
	//the Java `PotionOf...` class, so the prefix removal must be case-insensitive; otherwise an
	//unidentified PotionOfLevitation becomes `potionOfLevitation`, which is absent from the
	//appearance table and crashes when the hero picks it up.
	if (lower.includes('potion')) return { id: concrete.toLowerCase() === 'potionofliquidflame' ? 'potionFlame' : concrete.toLowerCase() === 'potionofinvisibility' ? 'potionInvis' : concrete.replace(/^PotionOf/i, 'potion'), quantity: 1, identified: false, sourceClass: concrete };
	//same short-id rename `generatedInventoryItem` needs for these three (see its comment)
	if (lower.includes('scroll')) return { id: concrete === 'ScrollOfMirrorImage' ? 'scrollMirror' : concrete === 'ScrollOfMagicMapping' ? 'scrollMapping' : concrete === 'ScrollOfRemoveCurse' ? 'scrollCleanse' : concrete.replace(/^ScrollOf/, 'scroll'), quantity: 1, identified: false, sourceClass: concrete };
	if (lower.includes('ring')) {
		const ringId = MWL_RING_CLASS_TO_ID.get(concrete);
		if (!ringId) throw new Error(`MWL ring alias is missing source class: ${concrete}`);
		return { id: ringId, quantity: 1, identified: false, instanceId: newItemInstanceId('ring'), sourceClass: concrete };
	}
	if (lower.includes('timekeepershourglass')) return { id: 'hourglass', quantity: 1, identified: false, sandBags: 0, instanceId: newItemInstanceId('hourglass'), sourceClass: concrete };
	if (lower.includes('chaliceofblood')) return { id: 'chalice', quantity: 1, identified: false, instanceId: newItemInstanceId('artifact'), sourceClass: concrete };
	if (lower.includes('artifact')) return { id: 'cloak', quantity: 1, identified: false, instanceId: newItemInstanceId('artifact'), sourceClass: concrete };
	if (lower.includes('wand')) return { id: 'wand', quantity: 1, identified: false, instanceId: newItemInstanceId('wand'), sourceClass: concrete };
	//`ShopRoom.generateItems()` places concrete weapon/armor classes directly. Preserve their
	//class and tier so generated stock becomes a real level-0 shop item instead of disappearing.
	const weaponTier = WEAPON_TIER_BY_CLASS[concrete.toLowerCase()];
	if (weaponTier !== undefined) return { id: 'weaponReward', quantity: 1, tier: weaponTier, level: 0, identified: false, instanceId: newItemInstanceId('weapon'), sourceClass: concrete };
	const armorTier = ARMOR_TIER_BY_CLASS[concrete.toLowerCase()];
	if (armorTier !== undefined) return { id: 'armorReward', quantity: 1, tier: armorTier, level: 0, identified: false, instanceId: newItemInstanceId('armor'), sourceClass: concrete };
	//Bomb room loot: `Bomb` stacks, `DoubleBomb` stays its own id so pickup can grant
	//the real "1+1 free!" Bomb x2 (`DoubleBomb.doPickUp`). Bombs are always identified
	//(`Bomb.isIdentified()` returns true unconditionally).
	if (concrete === 'DoubleBomb' || lower === 'doublebomb') return { id: 'doubleBomb', quantity: 1, identified: true, sourceClass: 'DoubleBomb' };
	if (concrete === 'Bomb' || lower === 'bomb') return { id: 'bomb', quantity: 1, identified: true, sourceClass: 'Bomb' };
	if (SPECIALTY_BOMB_IDS.has(id)) return { id, quantity: 1, identified: true, sourceClass: id };
	if (lower === 'gooblob') return { id: 'gooBlob', quantity: 1, identified: true, sourceClass: concrete };
	if (lower === 'metalshard') return { id: 'metalShard', quantity: 1, identified: true, sourceClass: concrete };
	if (lower === 'energycrystal') return { id: 'energyCrystal', quantity: 1, identified: true, sourceClass: concrete };
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
	const authoredGroundKind = MWL_SPECIAL_ITEM_GROUND_KINDS[lower];
	if (authoredGroundKind) return authoredGroundKind as GroundItemKind;
	//Direct room drops do not carry an Item-category suffix (Gold, StoneOfEnchantment,
	//MysteryMeat, Dewdrop, Amulet, and the mining/quest currencies), so handle them before
	//the broader Generator-style category checks below.
	if (lower.includes('dewdrop')) return 'dewdrop';
	//Bomb/DoubleBomb room loot (Armory/Honeypot/Artillery): exact match only, so a
	//future Tengu smoke-bomb heap never folds into the throwable-bomb family by
	//substring accident. Previously returned null, which silently dropped every
	//generated bomb instead of spawning it.
	if (SPECIALTY_BOMB_IDS.has(id)) return 'bomb';
	if (lower === 'gooblob') return 'food';
	if (lower === 'metalshard') return 'food';
	//MassGraveRoom's CorpseDust heap (quest type 1) - exact match like bombs, so it
	//spawns as a real pickup instead of vanishing on the null branch below.
	//RitualSiteRoom's queued candles and the newborn's Embers drop (quest type 2).
	//ShopRoom's concrete stock classes were previously dropped here because they are neither
	//Generator categories nor ordinary room currencies. Preserve the Java class identity and
	//sprite family now; their specialized use windows remain separate roadmap work.
	if (lower === 'honeypot' || lower === 'shatteredpot') return 'honeypot';
	if (lower.startsWith('alchemize')) return 'alchemize';
	if (lower.includes('backpack') || lower.includes('pouch') || lower.includes('bandolier') || lower.includes('holder') || lower.includes('holster')) return 'bag';
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
