import type { ClassId } from './classes';
import { MWL_TABLE_ROWS, MWL_TRAIT_NODES } from './mwlContent';

export interface TalentDefinition {
	id: string;
	classId: ClassId;
	tier: 1 | 2 | 3 | 4;
	maxRank: 2 | 3 | 4;
}

const talentsOf = (row: Readonly<Record<string, unknown>>): string[] =>
	(Array.isArray(row.talents) ? row.talents.map(String) : []).filter((id) => id.length > 0);

const CLASS_TALENT_ENTRIES = (() => {
	const entries = new Map<string, string[]>();
	for (const row of MWL_TABLE_ROWS('talentClassEntries')) {
		const key = `${String(row.class)}|${Number(row.tier)}`;
		if (entries.has(key)) throw new Error(`MWL talent rule has duplicate class entry ${key}`);
		entries.set(key, talentsOf(row));
	}
	return entries;
})();
const SUBCLASS_TALENT_ENTRIES = new Map(MWL_TABLE_ROWS('talentSubclassEntries', 'subclass').map((row) => [String(row.subclass), talentsOf(row)]));

const TALENT_TREE_NODE = MWL_TRAIT_NODES.find((candidate) => candidate.attributes.id === 'talentTrees')!;
const TIER_THRESHOLD_TEXT = TALENT_TREE_NODE.children.find((child) => child.tag === 'effect' && child.attributes.apply_to === 'tier_thresholds')?.attributes.set;
if (TIER_THRESHOLD_TEXT === undefined) throw new Error('MWL talent rule is missing tier thresholds');
export const TALENT_TIERS = TIER_THRESHOLD_TEXT.split(',').map(Number);
if (TALENT_TIERS.length !== 6 || TALENT_TIERS.some((value) => !Number.isInteger(value) || value < 0)) throw new Error('MWL talent rule has invalid tier thresholds');

export const CLASS_TALENTS: Record<ClassId, TalentDefinition[][]> = Object.fromEntries(
	(['warrior', 'mage', 'rogue', 'huntress', 'duelist', 'cleric'] as ClassId[]).map(classId => [classId, [1, 2].map((tier) => (CLASS_TALENT_ENTRIES.get(`${classId}|${tier}`) ?? []).map(id => ({ id, classId, tier: tier as 1 | 2, maxRank: 2 })))])
) as Record<ClassId, TalentDefinition[][]>;

/** T3 nodes are the two Java HeroSubClass branches already exposed by Advancement.
 *
 * `durable_tips` (Warden) is live in `missileDurabilityCost()` via `tippedDartUseDivisor`
 * (rot darts exempt, per their desc). `shared_enchantment` (Sniper) is
 * now wired in the thrown-hit path with its real proc gate (both live, both documented
 * with their exact formulas below).
 * The distinction was found in the 2026-09-09 hero-progression audit
 * (matches ROADMAP.md section 6's own "Implement rune transfer and shared-enchantment
 * behavior" line). The two entries were checked against `MissileWeapon.java`/`TippedDart.java`
 * (tag `v3.3.8`):
 * - `shared_enchantment`: `Random.Int(3) < points` (33%/67%/100% at rank 1/2/3) on a thrown
 *   missile's hit, re-invoking whatever enchant is on the hero's own equipped SpiritBow
 *   directly against that hit (`bow.enchantment.proc(...)`) - a deliberate, narrow exception
 *   real Java carves out specifically because `MissileWeapon` normally has no enchant
 *   mechanism of its own (weapon enchants are melee-only). This port's enchant procs are
 *   hard-coded `weaponAffix ===` branches inside `attack()`/`heroOnHit()`; the explicit
 *   ranged attack mode now reuses only that enchantment branch for the talent roll, while
 *   melee-only hero bonuses remain gated out.
 * - `durable_tips`: `use /= (1 + points)` on `TippedDart.durabilityPerUse()` (2x/3x/4x total
 *   durability at rank 1/2/3) - live in `missileDurabilityCost()` via `tippedDartUseDivisor`
 *   (rot darts exempt, per their desc), now that the `TippedDart` item exists. */
export const SUBCLASS_TALENTS: Record<string, string[]> = Object.fromEntries(SUBCLASS_TALENT_ENTRIES);

export function subclassTalentDefinitions(subclass: string, classId: ClassId): TalentDefinition[] {
	return (SUBCLASS_TALENTS[subclass] ?? []).map(id => ({ id, classId, tier: 3, maxRank: 3 }));
}

/**
 * Tier 4 is the armor-ability tier. `HeroClass.armorAbilities()` gives every class three
 * (`Talent.java`, tag `v3.3.8`: "Heroic Leap T4"/"Shockwave T4"/"Endure T4" and their five
 * siblings), each an `ArmorAbility` whose own `talents()` returns its three T4 talents followed
 * by the universal `HEROIC_ENERGY` - `Talent.initArmorTalents()` writes exactly that array into
 * tier 4. All four are rank-4 talents (`Talent(17, 4)` and friends: the second constructor
 * argument is `maxPoints`), against tier 3's 3 and tiers 1/2's 2.
 *
 * The Cleric's three (`Trinity`/`PowerOfMany`/`AscendedForm`) have no row here on purpose: this
 * port's Cleric has no HolyTome spell system or Cleric-specific subclass tree to hang them on
 * (`src/classes.ts` gives it the Mage's tree, documented there), and `spdMessages.ts` carries no
 * `actors.hero.abilities.cleric.*` strings at all, so there is nothing to name them with. Listed
 * as "Not ported" in `PORT_COVERAGE.md` rather than silently absent.
 */
const ARMOR_ABILITY_ROWS = MWL_TABLE_ROWS('armorAbilities', 'id');
const ARMOR_ABILITY_TALENT_ENTRIES = new Map(ARMOR_ABILITY_ROWS.map((row) => [String(row.id), talentsOf(row)]));

/** Per-class ability ids in the authored table's own row order, which is
 *  `HeroClass.armorAbilities()`'s order (`HeroicLeap`, `Shockwave`, `Endure`, ...). */
export const ARMOR_ABILITIES: Record<ClassId, string[]> = Object.fromEntries(
	(['warrior', 'mage', 'rogue', 'huntress', 'duelist', 'cleric'] as ClassId[]).map(classId => [
		classId,
		ARMOR_ABILITY_ROWS.filter((row) => String(row.class) === classId).map((row) => String(row.id)),
	]),
) as Record<ClassId, string[]>;

/** Every ability an `armorAbilities` row covers, i.e. those this port can actually offer. */
export const ARMOR_ABILITY_TALENTS: ReadonlyMap<string, string[]> = ARMOR_ABILITY_TALENT_ENTRIES;

/** `Talent.initArmorTalents()`: the ability's own three T4 talents plus the universal
 *  `HEROIC_ENERGY`, all rank-4. An ability with no row yields nothing, which is what keeps an
 *  unported ability from being silently offered with an empty talent tree. */
export function armorTalentDefinitions(ability: string, classId: ClassId): TalentDefinition[] {
	const own = ARMOR_ABILITY_TALENT_ENTRIES.get(ability);
	if (own === undefined) return [];
	return [...own, 'heroic_energy'].map(id => ({ id, classId, tier: 4, maxRank: 4 }));
}

