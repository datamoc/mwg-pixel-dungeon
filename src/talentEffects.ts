import type { ClassId } from './classes';

/** Pure, scene-independent rules for the small talent procs implemented by the port. */
/** `Talent.IRON_WILL`'s real effect (`BrokenSeal.maxShield()`, tag `v3.3.8`): `+points` added to
 * the Warrior's seal-shield cap, `armTier + armLvl + points`. This is not a standalone formula
 * call site any more - `dungeonScene.ts`'s seal-shield regen tick reads `talentRank('iron_will')`
 * directly into that cap - kept only as the historical note that this port used to carry a flat
 * damage-reduction stand-in here (`rank` while below 50% HP) instead, invented before the seal
 * item existed. That stand-in's own citation was also wrong: it claimed the real cap was
 * `3 + 2*armTier + points`, which does not match `BrokenSeal.java`'s actual `armTier + armLvl +
 * points` - not just simplified, factually incorrect, caught only once the real item was read
 * directly rather than re-cited from memory. */

export function shieldBatteryGain(blocked: number, rank: number): number {
	return blocked > 0 && rank > 0 ? rank : 0;
}

export function rejuvenatingStepHeal(terrain: number, grass: number, hp: number, maxHp: number, rank: number): number {
	return terrain === grass && rank > 0 ? Math.min(Math.max(0, maxHp - hp), rank) : 0;
}

/** `GreaterHaste.set(2 + 2*points)` turns granted by Lethal Haste on a hero-caused kill. */
export function lethalHasteDuration(rank: number): number {
	return 2 + 2 * rank;
}

/** `Talent.LethalHasteCooldown`, 100 turns gating the next GreaterHaste grant. */
export const LETHAL_HASTE_COOLDOWN = 100;

/** `Hero.damageRoll()`'s Weapon Recharging line: `round(dmg*1.025 + 0.025*points)` while the
 * hero holds a Recharging-class buff - a melee damage multiplier, not a charge refund. */
export function weaponRechargingDamage(damage: number, rank: number): number {
	return Math.round(damage * 1.025 + 0.025 * rank);
}

/** `Level.observe()`/`updateVisibility()`'s Farsight line: sight radius scales by
 * `1 + 0.25*points` - a vision multiplier, not a targeting range. */
export function farsightMultiplier(subclass: string | null, rank: number): number {
	return subclass === 'sniper' ? 1 + 0.25 * rank : 1;
}

export function shieldingDewGain(subclass: string | null, rank: number): number {
	return subclass === 'warden' && rank > 0 ? rank : 0;
}

export function preservationChance(rank: number): number {
	return rank === 1 ? 0.2 : rank >= 2 ? 0.35 : 0;
}

export function ironStomachReduction(classId: ClassId, rank: number): number {
	return classId === 'warrior' ? 2 * rank : 0;
}

export function cachedRationChance(classId: ClassId, rank: number): number {
	return classId === 'rogue' ? 0.2 * rank : 0;
}

export function canImproviseProjectile(classId: ClassId, rank: number, stones: number): boolean {
	return classId === 'warrior' && rank > 0 && stones > 0;
}

export function evasiveArmorBonus(subclass: string | null, rank: number, armorLevel: number): number {
	return subclass === 'freerunner' ? rank * armorLevel : 0;
}

export function assassinReachBonus(subclass: string | null, rank: number): number {
	return subclass === 'assassin' ? rank : 0;
}

export function empoweredStrikeBonus(subclass: string | null, rank: number): number {
	return subclass === 'battlemage' ? rank : 0;
}

/** `Talent.BOUNTY_HUNTER`'s only real effect (`Mob.lootChance()`, tag v3.3.8): while the tracker
 * armed by a *prepared* attack is live and Preparation is still up, this is **added to the drop
 * chance multiplier** alongside the Ring of Wealth's own - `0.02 * 2^(prepLevel-1) * points`, then
 * the whole multiplier is applied to the mob's base chance. It is not gold, and it does not apply
 * to an ordinary kill; the flat `5 * rank` gold this replaces was an invented stand-in from before
 * `Preparation` existed. */
export function bountyHunterDropBonus(prepLevel: number, rank: number): number {
	if (rank <= 0) return 0;
	return 0.02 * Math.pow(2, Math.min(Math.max(prepLevel, 1), 4) - 1) * rank;
}

export function unencumberedSpiritEvasion(subclass: string | null, rank: number): number {
	return subclass === 'monk_sub' ? rank : 0;
}

export function lethalDefenseShield(subclass: string | null, rank: number): number {
	return subclass === 'gladiator' ? rank : 0;
}

/** Invented substitute for real Java's `MONASTIC_VIGOR` (`MonkEnergy.java`, tag `v3.3.8`):
 * `energy/energyCap() >= 1.2 - 0.2*points`, a threshold on the Monk subclass's own separate
 * energy resource this port doesn't model at all. Absent that resource, this instead grants a
 * flat `rank` shield on the Cleric-shaped Holy Tome heal (`useSpecial`'s `'none'` branch) -
 * undocumented until the 2026-09-09 hero-progression audit; not rebuilt to the real mechanic
 * here since it needs the whole Monk energy resource built first. */
export function monasticVigorShield(subclass: string | null, rank: number): number {
	return subclass === 'monk_sub' ? rank : 0;
}

export function sharedUpgradeArmor(subclass: string | null, rank: number, armorLevel: number): number {
	return subclass === 'sniper' && rank > 0 && armorLevel < 3 ? 1 : 0;
}

/** Substitute for real Java's `TWIN_UPGRADES` (`MeleeWeapon.java`, tag `v3.3.8`): equalizes
 * tier between two *simultaneously wielded* weapons on upgrade - this port has no dual-wield
 * system at all, so there is no second weapon to equalize against. Repurposed instead to boost
 * armor-tier progression during a weapon upgrade (the same shape `shared_upgrades`/Sniper
 * already uses) - undocumented until the 2026-09-09 hero-progression audit; not rebuilt to the
 * real mechanic here since it needs dual-wielding built first. */
export function twinUpgradeArmor(subclass: string | null, rank: number, armorLevel: number): number {
	return subclass === 'champion' && rank > 0 && armorLevel < 3 ? 1 : 0;
}

export function soulSiphonCharge(subclass: string | null, rank: number): number {
	return subclass === 'warlock' ? rank : 0;
}

export function projectileMomentumBonus(subclass: string | null, rank: number, ready: boolean): number {
	return subclass === 'freerunner' && ready ? rank : 0;
}

export function enragedCatalystBonus(subclass: string | null, rank: number, hp: number, maxHp: number): number {
	return subclass === 'berserker' && hp <= maxHp * 0.5 ? rank : 0;
}

export function cleaveComboSeed(subclass: string | null, rank: number): number {
	return subclass === 'gladiator' && rank > 0 ? 2 : 0;
}

export function deathlessFuryTriggers(subclass: string | null, rank: number, used: boolean, damage: number, hp: number): boolean {
	return !used && subclass === 'berserker' && rank > 0 && damage >= hp;
}

/** `Wand.wandProc()`'s Arcane Vision line: a `CharAwareness`-class mark lasting
 * `5 + 5*points` turns on the zapped target - a per-target reveal, not a secret radius. */
export function arcaneVisionDuration(rank: number): number {
	return 5 + 5 * rank;
}

/** `NECROMANCERS_MINIONS` roll (`Mob.die()`): `0.4*points/3` on a soul-marked victim's
 * death. Kept as a formula reference only - no call site remains until SoulMark, Wraith,
 * and ally combat exist (see the removed kill-site stand-in's note in main.ts). */
export function necromancerMinionChance(subclass: string | null, rank: number): number {
	return subclass === 'warlock' ? [0, 0.13, 0.27, 0.4][Math.min(3, rank)] : 0;
}

/** `Talent.EMPOWERING_SCROLLS` (`Talent.java`, tag `v3.3.8`; desc at
 * `actors.hero.talent.empowering_scrolls.desc`): when the Mage reads a scroll, his next
 * 1/2/3 wand zaps get +3 levels. The count is the rank itself; the bonus is flat +3 at
 * every rank - one charge consumed per zap action, whatever the wand. */
export const EMPOWERING_SCROLLS_BONUS = 3;

export function empoweringScrollsCharges(rank: number): number {
	return Math.max(0, Math.min(3, rank));
}

/** `Talent.ENHANCED_RINGS` (desc `actors.hero.talent.enhanced_rings.desc`): when the
 * Rogue uses an artifact, his rings gain +1 upgrade for 3/6/9 turns. The bonus is a
 * whole upgrade level (read through the ring's own bonus translation, so a plain +0
 * ring reads +2 while it lasts); only the duration scales with rank. */
export function enhancedRingsDuration(rank: number): number {
	return 3 * Math.max(0, Math.min(3, rank));
}

/** `Talent.LIGHT_CLOAK`, Rogue half (desc `actors.hero.talent.light_cloak.desc`): the
 * Rogue may use the Cloak of Shadows while it is not equipped, recharging at
 * 25/50/75% of the normal rate. This port has no artifact equip slot - a carried cloak
 * is always usable, i.e. the talent's use-half is satisfied by construction - so the
 * rate is what the scene applies to the cloak's recharge progress while the talent is
 * taken (full rate without it, which is the deliberate divergence: Java refuses the
 * unequipped use entirely instead of granting it at full rate). */
export function lightCloakRechargeRate(rank: number): number {
	return [1, 0.25, 0.5, 0.75][Math.max(0, Math.min(3, rank))]!;
}

/** `Talent.LIGHT_CLOAK`, cross-hero half (`meta_desc`): gained by a non-Rogue, it
 * instead raises every artifact's charge speed by 7/13/20% at +1/+2/+3. Read as a
 * straight multiplier on the scene's per-turn artifact charge gains. */
export function lightCloakArtifactBonus(rank: number): number {
	return [0, 0.07, 0.13, 0.2][Math.max(0, Math.min(3, rank))]!;
}

/** `Talent.ALLY_WARP` (desc `actors.hero.talent.ally_warp.desc`): the Mage taps an ally
 * to swap places with them at 2/4/6 tiles range (rank 1/2/3), never with an immovable
 * ally. Pure range; the swap itself is scene movement. */
export function allyWarpRange(rank: number): number {
	return 2 * Math.max(0, Math.min(3, rank));
}

/** `Talent.SEER_SHOT` (desc `actors.hero.talent.seer_shot.desc`): firing at the ground
 * grants vision in a 3x3 area around the landing cell for 5/10/15 turns, on a flat
 * 20-turn cooldown. Gained cross-hero it triggers from any thrown weapon
 * (`meta_desc`) - the scene therefore procs it on both bow shots and missile throws. */
export const SEER_SHOT_COOLDOWN = 20;

export function seerShotDuration(rank: number): number {
	return 5 * Math.max(0, Math.min(3, rank));
}
