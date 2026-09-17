import { Actors } from 'mwg';
import type { GroundItem } from '../combat';
import type { GroundItemKind } from '../dungeonConstants';
import { MWL_CONSUMABLE_CLASS_TO_ID, MWL_ITEM_CATEGORIES, MWL_ITEM_GROUND_KIND_ALIASES, MWL_ITEM_SLOTS, MWL_MISSILE_BY_CLASS, MWL_RING_CLASS_TO_ID, MWL_SPECIAL_ITEM_GROUND_KINDS, MWL_SPECIAL_ITEM_INVENTORY_BY_CLASS } from '../mwlContent';
import { missileStackFields } from './missiles';
import { WEAPON_TIER_BY_CLASS, ARMOR_TIER_BY_CLASS } from './catalog';
export const SPECIALTY_BOMB_IDS = new Set(
	[...MWL_ITEM_CATEGORIES].filter(([, category]) => category === 'specialtyBomb').map(([id]) => id),
);

/** A carried item as the infusion predicates below see it: its bag id, plus the `sourceClass` a
 * picked-up heap or a generated payload keeps (see `sourceInventoryItem`). */
export interface CarriedItem { id: string; sourceClass?: string }

/** Bag ids the port mints for **artifacts** (`sourceInventoryItem`'s per-class collapse). Java:
 * `artifacts/Artifact.isUpgradable()` returns false, and DriedRose/TimekeepersHourglass - the two
 * artifacts that do have levels - override it false as well, so every artifact is excluded. */
const ARTIFACT_IDS = new Set([
	'toolkit', 'rose', 'chains', 'horn', 'beacon', 'armband', 'sandals', 'talisman', 'spellbook',
	'cloak', 'hourglass', 'chalice', 'cape',
]);

/** Bag ids the port mints for non-upgradable **consumables and props**, each mapping onto a Java
 * class that overrides `isUpgradable()` false: Bomb/DoubleBomb/SPECIALTY_BOMB_IDS (`Bomb`),
 * `food`/`meat` (`Food`), `potion` (`Potion`, which brews and elixirs extend), `scroll`
 * (`Scroll`), `seed` (`Plant$Seed`), the three keys (`Key`), `gooBlob`/`metalShard`
 * (`quest/GooBlob`, `quest/MetalShard`), `energyCrystal` (`EnergyCrystal`), `candle`
 * (`quest/CeremonialCandle`), `embers` (`quest/Embers`), `corpseDust` (`quest/CorpseDust`),
 * `sandBag` (a Timekeeper's Hourglass part, not an item of its own), and `alchemize` - one of the
 * port's spell ids, `Alchemize extends Spell`, which is false like every other spell. */
const NON_UPGRADABLE_MINTED_IDS = new Set([
	'bomb', 'doubleBomb', 'food', 'meat', 'potion', 'scroll', 'seed',
	'crystalKey', 'ironKey', 'goldenKey', 'gooBlob', 'metalShard', 'energyCrystal',
	'candle', 'embers', 'corpseDust', 'sandBag', 'alchemize',
	//`bags/Bag.isUpgradable()` is false: the velvet pouch and the three shop bags.
	'velvetPouch', 'scrollHolder', 'potionBandolier', 'magicalHolster',
	...SPECIALTY_BOMB_IDS,
]);

/** A picked-up missile stack: Java's `ThrowingStone`/`Bolas`/... are `MissileWeapon`s, which
 * extend `Weapon` and never override `isUpgradable()`, so a carried stack is a real upgrade
 * target - the same conclusion `missiles.mwl`'s uncapped `missileLevel` and the scroll-of-upgrade
 * path already act on. The bag id `'stone'` is ambiguous by design (`sourceInventoryItem` gives a
 * missile heap *and* a runestone that id), so the class decides: exactly the test `wieldMissile`
 * validates with. */
export function isMissileStack(item: CarriedItem): boolean {
	return item.sourceClass !== undefined && MWL_MISSILE_BY_CLASS.has(item.sourceClass);
}

/**
 * `Item.isUpgradable()` (tag `v3.3.8`), and the whole of `MagicalInfusion`'s selector:
 * `usableOnItem(item) { return item.isUpgradable(); }` - no type test at all.
 *
 * Java's default is **true** - `Item.isUpgradable()` returns true and exactly 42 classes override
 * it false. The list was walked from the whole tree rather than sampled, because a class missed
 * here silently *widens* the selector this port is matching:
 *   Amulet, Ankh, ArcaneResin, Dewdrop, EnergyCrystal, Gold, Honeypot, KingsCrown, LiquidMetal,
 *   Stylus, TengusMask, Torch, Waterskin; `artifacts/Artifact` (so DriedRose and
 *   TimekeepersHourglass with it); `bags/Bag`; `bombs/Bomb`; `food/Food`; `journal/DocumentPage`,
 *   `journal/Guidebook`; `keys/Key`; `potions/Potion`; the eight `quest/*`; `remains/RemainsItem`;
 *   `scrolls/Scroll`; `spells/Spell`; `stones/Runestone`; `trinkets/Trinket`,
 *   `trinkets/TrinketCatalyst`; `weapon/SpiritBow`; `weapon/missiles/darts/Dart`; and
 *   `plants/Plant$Seed` (which lives outside `items/`, where a first pass missed it).
 * Everything else is upgradable, so this keeps Java's default-true shape rather than listing what
 * *is* upgradable: the port's upgradable ids are open-ended (authored equipment nodes, the
 * generated `weaponReward`/`armorReward`/`wand` payloads, the `ring_garnet`/`ring_*` runtime ring
 * ids), while its non-upgradable ones all descend from that 42-class list.
 *
 * The one id that needs its payload and not just its name is `'stone'`, above.
 */
export function isUpgradableItem(item: CarriedItem): boolean {
	const slot = MWL_ITEM_SLOTS.get(item.id);
	if (slot !== undefined) return slot !== 'artifact' && slot !== 'consumable';
	if (item.id === 'stone') return isMissileStack(item);
	if (ARTIFACT_IDS.has(item.id) || NON_UPGRADABLE_MINTED_IDS.has(item.id)) return false;
	return true;
}

/**
 * `EquipableItem` (tag `v3.3.8`), the other half of `CurseInfusion`'s selector:
 * `(item instanceof EquipableItem && item.isUpgradable()) || item instanceof Wand || item
 * instanceof SpiritBow`.
 *
 * The interface is implemented through `KindOfWeapon` (so Weapon and every MissileWeapon),
 * `KindofMisc` (so **Ring and Artifact**, which is why an artifact answers true here and is still
 * excluded from `CurseInfusion` - by the `&& isUpgradable()` half, not by this), and by Armor.
 * It is **not** implemented by `Wand`, which extends `Item` directly - which is exactly why Java's
 * predicate needs its explicit `|| item instanceof Wand` clause even though a wand *is* upgradable.
 * `SpiritBow` is a `Weapon` whose `isUpgradable()` is false and which Java adds back explicitly;
 * this port has no bow *item* (the Huntress's bow is class state, not `belongings`), so that clause
 * has nothing to match here and is recorded rather than modeled.
 */
export function isEquipableItem(item: CarriedItem): boolean {
	const slot = MWL_ITEM_SLOTS.get(item.id);
	if (slot !== undefined) return slot !== 'wand' && slot !== 'consumable';
	if (item.id === 'stone') return isMissileStack(item);
	// the port-minted artifact ids are EquipableItem too; only the consumable/prop ids are not
	return !NON_UPGRADABLE_MINTED_IDS.has(item.id);
}

/** `MagicalInfusion.usableOnItem`: every upgradable carried item, no type test. */
export function usableForMagicalInfusion(item: CarriedItem): boolean {
	return isUpgradableItem(item);
}

/** `CurseInfusion.usableOnItem`: an upgradable equipable, or a wand or the spirit bow. Over this
 * port's id vocabulary that resolves to the same set as above - the port's artifacts are all
 * non-upgradable, so the `&& isUpgradable()` half excludes them here too, and the two explicit
 * clauses add nothing (no bow item exists; wands are already upgradable). Stated separately
 * anyway: the two Java methods are separate, and a future port item could part them. */
export function usableForCurseInfusion(item: CarriedItem): boolean {
	if (MWL_ITEM_SLOTS.get(item.id) === 'wand') return true;
	return isEquipableItem(item) && isUpgradableItem(item);
}

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
	//`CapeOfThorns` (tag `v3.3.8`), same reasoning as Chalice directly above: checked before
	//the generic artifact fallback so it does not silently collapse to Cloak of Shadows.
	if (id.toLowerCase().includes('capeofthorns')) return { id: 'cape', quantity: 1, identified: false, instanceId: newItemInstanceId('artifact'), sourceClass };
	const artifactIdByClass = (cls: string): string | undefined => {
		const lower = cls.toLowerCase();
		if (lower.includes('alchemiststoolkit')) return 'toolkit';
		if (lower.includes('driedrose')) return 'rose';
		if (lower.includes('etherealchains')) return 'chains';
		if (lower.includes('hornofplenty')) return 'horn';
		if (lower.includes('lloydsbeacon')) return 'beacon';
		if (lower.includes('masterthievesarmband')) return 'armband';
		if (lower.includes('sandalsofnature')) return 'sandals';
		if (lower.includes('talismanofforesight')) return 'talisman';
		if (lower.includes('unstablespellbook')) return 'spellbook';
		return undefined;
	};
	const namedArtifact = artifactIdByClass(id);
	if (namedArtifact) return { id: namedArtifact, quantity: 1, identified: false, instanceId: newItemInstanceId('artifact'), sourceClass };
	if (id.split('|', 1)[0]!.toLowerCase() === 'artifact') return { id: 'cloak', quantity: 1, identified: false, instanceId: newItemInstanceId('artifact'), sourceClass };
	if (id.toLowerCase() === 'seed') return { id: 'seed', quantity: 1, identified: true, sourceClass, ...(sourceClass ? { instanceId: `seed:${sourceClass.toLowerCase()}` } : {}) };
	const concrete = sourceClass ?? id;
	const lower = concrete.toLowerCase();
	//A carried missile stack carries its own identity - its own set id and level - rather than
	//being fungible class ammo (see `src/missiles.ts`'s header). Minted here, at the one place a
	//floor's missile payloads are built, so two stacks of the same class dropped separately never
	//merge into one pile. Every non-missile class gets `{}` - the explicit missile branch below is
	//the only one that can see a missile class, since the `'stone'` branches further down catch
	//runestones, which share that bag id.
	const missileFields = MWL_MISSILE_BY_CLASS.has(concrete) ? missileStackFields(newItemInstanceId('missile'), 0) : {};
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
		...missileFields,
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
	if (lower.includes('capeofthorns')) return { id: 'cape', quantity: 1, identified: false, instanceId: newItemInstanceId('artifact'), sourceClass: concrete };
	if (lower.includes('alchemiststoolkit')) return { id: 'toolkit', quantity: 1, identified: false, instanceId: newItemInstanceId('artifact'), sourceClass: concrete };
	if (lower.includes('driedrose')) return { id: 'rose', quantity: 1, identified: false, instanceId: newItemInstanceId('artifact'), sourceClass: concrete };
	if (lower.includes('etherealchains')) return { id: 'chains', quantity: 1, identified: false, instanceId: newItemInstanceId('artifact'), sourceClass: concrete };
	if (lower.includes('hornofplenty')) return { id: 'horn', quantity: 1, identified: false, instanceId: newItemInstanceId('artifact'), sourceClass: concrete };
	if (lower.includes('lloydsbeacon')) return { id: 'beacon', quantity: 1, identified: false, instanceId: newItemInstanceId('artifact'), sourceClass: concrete };
	if (lower.includes('masterthievesarmband')) return { id: 'armband', quantity: 1, identified: false, instanceId: newItemInstanceId('artifact'), sourceClass: concrete };
	if (lower.includes('sandalsofnature')) return { id: 'sandals', quantity: 1, identified: false, instanceId: newItemInstanceId('artifact'), sourceClass: concrete };
	if (lower.includes('talismanofforesight')) return { id: 'talisman', quantity: 1, identified: false, instanceId: newItemInstanceId('artifact'), sourceClass: concrete };
	if (lower.includes('unstablespellbook')) return { id: 'spellbook', quantity: 1, identified: false, instanceId: newItemInstanceId('artifact'), sourceClass: concrete };
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
