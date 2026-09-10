import type { ClassId } from './classes';

export interface TalentDefinition {
	id: string;
	classId: ClassId;
	tier: 1 | 2 | 3;
	maxRank: 2 | 3;
}

const groups: Record<ClassId, [string[], string[]]> = {
	warrior: [
		['hearty_meal', 'veterans_intuition', 'test_subject', 'iron_will'],
		['iron_stomach', 'restored_willpower', 'runic_transference', 'lethal_momentum', 'improvised_projectiles'],
	],
	mage: [
		['empowering_meal', 'scholars_intuition', 'tested_hypothesis', 'backup_barrier'],
		['energizing_meal', 'energizing_upgrade', 'wand_preservation', 'arcane_vision', 'shield_battery'],
	],
	rogue: [
		['cached_rations', 'thiefs_intuition', 'sucker_punch', 'protective_shadows'],
		['mystical_meal', 'mystical_upgrade', 'wide_search', 'silent_steps', 'rogues_foresight'],
	],
	huntress: [
		['natures_bounty', 'survivalists_intuition', 'followup_strike', 'natures_aid'],
		['invigorating_meal', 'restored_nature', 'rejuvenating_steps', 'heightened_senses', 'durable_projectiles'],
	],
	duelist: [
		['strengthening_meal', 'adventurers_intuition', 'patient_strike', 'aggressive_barrier'],
		['focused_meal', 'restored_agility', 'weapon_recharging', 'lethal_haste', 'swift_equip'],
	],
	//Cleric's own real Java talent tree (`Talent.java`'s "Cleric T1"/"T2"/"T3" sections, tag
	//`4.0.0-beta`) is wholly distinct from Mage's, built around Holy Lantern/light-spell
	//mechanics this port has none of at all. Cleric IS a real, playable, unlockable class here
	//(`src/classes.ts`, unlocked by winning a run) - this is Mage's tree relabeled as a
	//placeholder, not a faithful translation, found undocumented anywhere (code or
	//PORT_COVERAGE.md) in the 2026-09-09 hero-progression audit. Not replaced here: building
	//Cleric's real talents needs the Cleric class's own spell/lantern mechanics first, which
	//don't exist in this port at all - see PORT_COVERAGE.md's new Cleric row.
	cleric: [
		['empowering_meal', 'scholars_intuition', 'tested_hypothesis', 'backup_barrier'],
		['energizing_meal', 'energizing_upgrade', 'wand_preservation', 'arcane_vision', 'shield_battery'],
	],
};

export const CLASS_TALENTS: Record<ClassId, TalentDefinition[][]> = Object.fromEntries(
	(Object.keys(groups) as ClassId[]).map(classId => [classId, groups[classId].map((ids, index) => ids.map(id => ({ id, classId, tier: (index + 1) as 1 | 2, maxRank: 2 })))])
) as Record<ClassId, TalentDefinition[][]>;

/** T3 nodes are the two Java HeroSubClass branches already exposed by Advancement.
 *
 * `shared_enchantment` (Sniper) and `durable_tips` (Warden) are listed here as real
 * talent-tree entries but have NO effect anywhere in `main.ts` at all - genuinely
 * unimplemented, not just simplified, found in the 2026-09-09 hero-progression audit
 * (matches ROADMAP.md section 6's own "Implement rune transfer and shared-enchantment
 * behavior" line). Both turned out to need more than a formula fix once actually checked
 * against `MissileWeapon.java`/`TippedDart.java` (tag `v3.3.8`):
 * - `shared_enchantment`: `Random.Int(3) < points` (33%/67%/100% at rank 1/2/3) on a thrown
 *   missile's hit, re-invoking whatever enchant is on the hero's own equipped SpiritBow
 *   directly against that hit (`bow.enchantment.proc(...)`) - a deliberate, narrow exception
 *   real Java carves out specifically because `MissileWeapon` normally has no enchant
 *   mechanism of its own (weapon enchants are melee-only). This port's enchant procs are
 *   hard-coded `weaponAffix ===` branches inside `attack()`/`heroOnHit()`, all gated on
 *   `attacker === this.hero` (deliberately excluding ranged attacks, which pass a shallow
 *   copy - correct per Java's own melee-only design). Reusing that pipeline for a ranged hit
 *   would need either a real extraction of the enchant-proc logic into a standalone callable
 *   function (a nontrivial refactor of the single most combat-critical code in this file), or
 *   a temporary-attacker-identity substitution hack that risks other hero-only bonuses
 *   (Force ring, Kinetic, Polarized, curses) firing where they shouldn't - not attempted here
 *   given the risk/value ratio for one low-usage T3 talent.
 * - `durable_tips`: `use /= (1 + points)` on `TippedDart.durabilityPerUse()` (2x/3x/4x total
 *   durability at rank 1/2/3) - but this port has no `TippedDart` item at all (no
 *   poison/fire/etc-tipped dart type exists), and Huntress/Warden's own special ability is
 *   the SpiritBow (`'shoot'`), never a `'throw'` action in `useSpecial` - there is no dart-
 *   throwing code path to attach this multiplier to. Needs the tipped-dart item type built
 *   first, not a formula change. */
export const SUBCLASS_TALENTS: Record<string, string[]> = {
	berserker: ['endless_rage', 'deathless_fury', 'enraged_catalyst'], gladiator: ['cleave', 'lethal_defense', 'enhanced_combo'],
	battlemage: ['empowered_strike', 'mystical_charge', 'excess_charge'], warlock: ['soul_eater', 'soul_siphon', 'necromancers_minions'],
	assassin: ['enhanced_lethality', 'assassins_reach', 'bounty_hunter'], freerunner: ['evasive_armor', 'projectile_momentum', 'speedy_stealth'],
	sniper: ['farsight', 'shared_enchantment', 'shared_upgrades'], warden: ['durable_tips', 'barkskin', 'shielding_dew'],
	champion: ['secondary_charge', 'twin_upgrades', 'combined_lethality'], monk_sub: ['unencumbered_spirit', 'monastic_vigor', 'combined_energy'],
};

export function subclassTalentDefinitions(subclass: string, classId: ClassId): TalentDefinition[] {
	return (SUBCLASS_TALENTS[subclass] ?? []).map(id => ({ id, classId, tier: 3, maxRank: 3 }));
}
