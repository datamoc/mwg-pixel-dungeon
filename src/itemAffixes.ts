import { Actors } from 'mwg';
import { MWL_ARMOR_GLYPHS, MWL_WEAPON_ENCHANTS, MWL_UNSTABLE_DELEGATES } from './mwlContent';

/**
 * Weapon enchantments and armor glyphs as `mwg/actors` affix tables, authored in
 * `src/content/affix-rules.mwl` and actually rolled through `Actors.rollAffix` (see
 * `generatedInventoryItem`) rather than sitting unused - a real wiring gap `main.ts` had until an
 * earlier pass: `generatedInventoryItem` set `cursed` from the generator's RNG-faithful
 * `cursed`/`hasGoodEnchant` flags but never picked or attached a concrete id, so no weapon/armor
 * obtained through normal play could ever carry one, and every proc branch keyed on
 * `weaponAffix`/`armorGlyph` was dead code in an actual playthrough. See `PORT_COVERAGE.md`'s
 * "Enchant/glyph/curse assignment" row for the full history.
 *
 * Real Java has 13 weapon enchantments + 8 weapon curses, and 13 armor glyphs + 8 armor curses
 * (`items/weapon/enchantments/`, `items/weapon/curses/`, `items/armor/glyphs/`,
 * `items/armor/curses/`). This port models nine enchants (Blazing/Chilling/Shocking/Vampiric/
 * Grim/Lucky/Blocking/Kinetic/Blooming), seven glyphs (Stone/Thorns/Flow/Entanglement/Swiftness/
 * Potential/Camouflage), all 7 remaining weapon curses with a real effect (Wayward/Annoying/
 * Dazzling/Explosive/Polarized/Sacrificial/Displacing), and all 8 armor curses (Stench/
 * AntiEntropy/Bulk/Corrosion/Displacement/Metabolism/Multiplicity/Overgrowth) - each chosen
 * because its real effect fits a system this port already has (a buff, a flat stat, a ground-item
 * drop, the shared `heroBarrier`, the shared poison DoT, a free-cell teleport search) rather than
 * needing a new one. Blocking's real proc chance and shield-amount formulas are both reproduced
 * (`(lvl+4)/(lvl+40)`, `round(max(1,procChance) * (2+lvl))`); the shared `heroBarrier` pool now
 * decays every hero turn via `Barrier.act()`'s real proportional curve. Every other real
 * enchant/glyph/curse needs a subsystem this port does not model - Corrupting converts lethal
 * targets through the existing ally model; Elastic and Repulsion use the shared straight shove
 * path; Projecting still needs thrown-range geometry; Unstable is ported (delegates per swing);
 * Friendly needs a two-way Charm subsystem this port lacks (confirmed against `Friendly.java`:
 * mutual Charm + zeroing damage to the charmed target); the remaining armor glyphs (Obfuscation)
 * need charm/wand-drain/blink/durability systems likewise absent. Swiftness uses the real
 * level-scaled `(1.2+0.04*buffedLvl) x Arcana` speed boost and a PathFinder-distance-2 safety
 * check, represented as inverse turn cost. The trigger routing (strike vs defend vs passive) is
 * the real shape either way. **No `Fragile` armor curse exists in real Java** (checked tag
 * `v3.3.8` back to `v3.3.1`); the real 8th curse is `Stench`, and pre-correction saves migrate
 * the never-real `fragile` id to it on load. Every curse entry locks gear via the equipment lock
 * until a cleanse scroll lifts it (`Actors.applyAffix`/`removeAffix`'s own curse-flag contract).
 *
 * The definitions themselves now live in `src/content/affix-rules.mwl`; this adapter only maps
 * them onto `Actors.AffixTable` and keeps the SPD-specific proc bodies in `main.ts`, which is
 * where they need live scene and combat state.
 */
export const ENCHANT_TABLE: Actors.AffixTable = {
	entries: MWL_WEAPON_ENCHANTS.map((definition) => ({ ...definition })),
};

export const GLYPH_TABLE: Actors.AffixTable = {
	entries: MWL_ARMOR_GLYPHS.map((definition) => ({ ...definition })),
};

/**
 * `Unstable.randomEnchants` minus Projecting (Java's own exclusion - no on-hit effect) and
 * Elastic (its shove is intentionally not delegated by Unstable, matching Java's own
 * `randomEnchants` exclusion). Corrupting has a live lethal conversion branch, so it is a valid
 * delegate too. Uncommon, like the real `Unstable` in `Weapon.java`'s rarity lists.
 */
export const UNSTABLE_DELEGATES: readonly string[] = MWL_UNSTABLE_DELEGATES;
