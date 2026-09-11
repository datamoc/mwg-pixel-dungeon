import type { ClassId } from './classes';
import { MWL_TRAIT_NODES } from './mwlContent';

export interface TalentDefinition {
	id: string;
	classId: ClassId;
	tier: 1 | 2 | 3;
	maxRank: 2 | 3;
}

function talentEntries(applyTo: string): Map<string, string[]> {
	const node = MWL_TRAIT_NODES.find((candidate) => candidate.attributes.id === 'talentTrees');
	if (!node) throw new Error('MWL talent rule is missing talentTrees');
	const effect = node.children.find((child) => child.tag === 'effect' && child.attributes.apply_to === applyTo);
	const raw = effect?.attributes.set;
	if (raw === undefined) throw new Error(`MWL talent rule is missing ${applyTo}`);
	const entries = new Map<string, string[]>();
	for (const entry of raw.split(';')) {
		const [owner, tier, values] = entry.split('|');
		const key = applyTo === 'class_entries' ? `${owner}|${tier}` : owner;
		const list = applyTo === 'class_entries' ? values : tier;
		if (!key || !list || entries.has(key)) throw new Error(`MWL talent rule has invalid entry ${entry}`);
		entries.set(key, list.split(',').filter(Boolean));
	}
	return entries;
}

const CLASS_TALENT_ENTRIES = talentEntries('class_entries');
const SUBCLASS_TALENT_ENTRIES = talentEntries('subclass_entries');

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
 * `durable_tips` (Warden) remains listed here as a real talent-tree entry but has no
 * effect yet because this port has no TippedDart item. `shared_enchantment` (Sniper) is
 * now wired in `main.ts`'s thrown-hit path with its real proc gate; it is kept in this
 * comment only to document the remaining dart gap, not as an unimplemented talent.
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
 *   durability at rank 1/2/3) - but this port has no `TippedDart` item at all (no
 *   poison/fire/etc-tipped dart type exists), and Huntress/Warden's own special ability is
 *   the SpiritBow (`'shoot'`), never a `'throw'` action in `useSpecial` - there is no dart-
 *   throwing code path to attach this multiplier to. Needs the tipped-dart item type built
 *   first, not a formula change. */
export const SUBCLASS_TALENTS: Record<string, string[]> = Object.fromEntries(SUBCLASS_TALENT_ENTRIES);

export function subclassTalentDefinitions(subclass: string, classId: ClassId): TalentDefinition[] {
	return (SUBCLASS_TALENTS[subclass] ?? []).map(id => ({ id, classId, tier: 3, maxRank: 3 }));
}
