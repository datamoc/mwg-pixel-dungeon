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
	cleric: [
		['empowering_meal', 'scholars_intuition', 'tested_hypothesis', 'backup_barrier'],
		['energizing_meal', 'energizing_upgrade', 'wand_preservation', 'arcane_vision', 'shield_battery'],
	],
};

export const CLASS_TALENTS: Record<ClassId, TalentDefinition[][]> = Object.fromEntries(
	(Object.keys(groups) as ClassId[]).map(classId => [classId, groups[classId].map((ids, index) => ids.map(id => ({ id, classId, tier: (index + 1) as 1 | 2, maxRank: 2 })))])
) as Record<ClassId, TalentDefinition[][]>;

/** T3 nodes are the two Java HeroSubClass branches already exposed by Advancement. */
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
