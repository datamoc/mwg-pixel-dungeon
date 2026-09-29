import type { GroundItemKind } from '../dungeonConstants';

/**
 * `Heap.explode()`'s survivor test (`items/Heap.java`, tag `v3.3.8`): an entry is skipped when
 * `item.unique || item.isUpgradable() || item instanceof EquipableItem`. Every other entry is
 * removed (potions shatter, bombs detonate, a `ShatteredPot` is destroyed first).
 *
 * Mapped onto this port's ground kinds from the Java sources (`unique = true` in `Key`, `Bag`,
 * `BrokenSeal`, `Amulet`, `DwarfToken`, `DarkGold`, `CorpseDust`, `Embers`, `CeremonialCandle`;
 * default-true `Item.isUpgradable()` for weapons, armor, wands, rings; `EquipableItem` for
 * weapons/armor/rings). NOT survivors in Java: `Ankh`, `Stylus`, `Torch`, `Honeypot` override
 * `isUpgradable()` to false and are not unique, so a blast destroys them (this port used to
 * protect ankh and stylus, and to destroy weapons, keys and quest items - the reverse).
 */
const SURVIVING_KINDS: ReadonlySet<GroundItemKind> = new Set<GroundItemKind>([
	'weapon', 'armor', 'wand', 'ring', 'amulet',
	'crystalKey', 'ironKey', 'goldenKey',
	'dwarfToken', 'darkGold', 'corpseDust', 'candle', 'embers',
	'bag', 'brokenSeal',
]);

/** Payload ids that are `unique = true` in Java while sharing a destructible kind (potion/scroll/stone). */
const UNIQUE_PAYLOAD_IDS: ReadonlySet<string> = new Set(['potionStrength', 'scrollUpgrade', 'stoneOfEnchantment']);

export function survivesHeapExplosion(kind: GroundItemKind, payloadId?: string): boolean {
	return SURVIVING_KINDS.has(kind) || (payloadId !== undefined && UNIQUE_PAYLOAD_IDS.has(payloadId));
}
