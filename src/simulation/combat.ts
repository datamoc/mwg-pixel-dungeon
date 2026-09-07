import type { Combatant } from './combatState';
import type { SimulationRandom } from './random';

// Char.java:509-510 - surprise attacks and truly-untargetable defenders short-circuit the
// whole hit roll around these values, rather than through any percentage
export const INFINITE_ACCURACY = 1000000;
export const INFINITE_EVASION = 1000000;

/**
 * AscensionChallenge.statModifier's own per-class table (Rat 10 down to Scorpio 1.1): only
 * entries for mobs this port actually spawns are listed. There is no ascension-challenge UI,
 * so this stays 1 in-game; the table is present so the multiplier is real data rather than
 * an undocumented gap.
 */
export const ASCENSION_MOD: Record<string, number> = {
	rat: 10, snake: 9, gnoll: 9, swarm: 8.5, crab: 8, slime: 8, skeleton: 6, thief: 6, dm100: 5, guard: 4, necromancer: 4,
};
/** Kept for callers that inspect the old port flag; the selected challenge is now persisted. */
export const ASCENSION_ON = false;
let strongerBossesEnabled = false;
/** Runtime hook keeps the simulation module usable in isolated Node tests. */
export function setStrongerBossesEnabled(enabled: boolean): void { strongerBossesEnabled = enabled; }
const ascensionOn = (): boolean => strongerBossesEnabled;

/**
 * Combat numbers that can change turn to turn: Goo (`Goo.java`:
 * `damageRoll`/`attackSkill`/`defenseSkill` all branch on `HP*2 <= HT`, so its evasion and
 * damage ceiling both jump the moment it crosses half health, live, not as a state it enters
 * once). Brute's `raged` flag mirrors Java's real one-time near-death revival (`Brute.java`'s
 * `hasRaged`/`BruteRage` shield) - see `main.ts`'s death-interception and per-turn decay, not a
 * half-HP threshold; other actors return stored fields.
 */
export function liveStats(c: Readonly<Combatant>): { accuracy: number; evasion: number; damage: [number, number] } {
	if (c.kind === 'goo') {
		const enraged = c.hp * 2 <= c.maxHp;
		return { accuracy: enraged ? 15 : 10, evasion: enraged ? 12 : 8, damage: enraged ? [1, 12] : [1, 8] };
	}
	//Brute.damageRoll(): 15-40 while BruteRage is active, 5-25 otherwise - real Java only grants
	//this after the Brute's one-time near-death revival, not below any HP threshold.
	//ArmoredBrute inherits damageRoll() from Brute unchanged, so the same boost applies to it.
	if ((c.kind === 'brute' || c.kind === 'armoredBrute') && c.raged) {
		return { accuracy: c.accuracy, evasion: c.evasion, damage: [15, 40] };
	}
	//Tengu.attackSkill: 20 at range, 10 adjacent - resolved by the caller (which knows the
	//distance), not here; this returns the melee half
	return { accuracy: c.accuracy, evasion: c.evasion, damage: c.damage };
}

/**
 * SPD's hit formula, straight out of `Char.hit()`: both sides roll a *uniform* float up to
 * their own stat (`Random.Float(x)` in Java, i.e. `[0, x)`), and the attacker's roll has to reach or
 * beat the defender's. Higher accuracy raises the ceiling of a good roll; higher evasion
 * raises the ceiling the attacker has to clear - two uniform rolls, not a single percentage,
 * which is why a strong hit against a high-evasion target is rarer than the raw numbers
 * suggest at a glance.
 *
 * Plus Char.hit()'s real roll multipliers: Bless x1.25, Hex x0.8, Daze x0.5 on *both* rolls
 * (each side's own buffs), ChampionEnemy.Blessed x4 (`evasionAndAccuracyFactor()` - previously
 * x3 here, an unconfirmed guess; corrected against source), AscensionChallenge's per-mob table
 * (gated by ASCENSION_ON - no challenge UI exists to turn it on), and the
 * INFINITE_ACCURACY/INFINITE_EVASION short-circuits (a sleeping target grants a surprise
 * attack that always lands; GreatCrab blocks seen melee and NPCs can't be hit at all).
 * `magic` is hit()'s own accMulti=2 branch for wand/zap attacks.
 */
export function accRollMulti(c: Readonly<Combatant>): number {
	let m = 1;
	if (c.buffs['bless']) m *= 1.25;
	if (c.buffs['hex']) m *= 0.8;
	if (c.buffs['daze']) m *= 0.5;
	if (c.champion === 'blessed') m *= 4;
	//ChampionEnemy.Growing.evasionAndAccuracyFactor(): same growth multiplier as its own
	//damage/damage-taken factors, read on whichever side of the roll this creature is on.
	if (c.champion === 'growing') m *= c.championPower ?? 1.19;
	if (ascensionOn() && c.kind && ASCENSION_MOD[c.kind]) m *= ASCENSION_MOD[c.kind]!;
	return m;
}

export function rollHit(attacker: Readonly<Combatant>, defender: Readonly<Combatant>, random: SimulationRandom, magic = false, surprise = false): boolean {
	if (liveStats(defender).evasion >= INFINITE_EVASION) return false;
	let acu = liveStats(attacker).accuracy;
	// Invisible attackers and sleepers can surprise an unaware target. The previous
	// port only represented the latter; Invisibility is now a real timed Char state.
	if (surprise || defender.sleeping || (attacker.buffs['invisibility'] && !defender.isHero)) acu = INFINITE_ACCURACY;
	if (acu >= INFINITE_ACCURACY) return true;
	//GreatCrab.defenseSkill: INFINITE_EVASION against its seen target's melee - simplified to
	//range-based (adjacent = melee, blocked; anything further = throwable, lands on evasion 0)
	//so the quest stays completable; Java also negates wand damage when seen (kept in useSpecial)
	if (defender.kind === 'greatCrab' && !defender.sleeping && !magic) {
		const adjacent = Math.max(Math.abs(attacker.x - defender.x), Math.abs(attacker.y - defender.y)) <= 1;
		if (adjacent) return false;
	}
	const acuRoll = random.float(acu) * accRollMulti(attacker) * (magic ? 2 : 1);
	const defRoll = random.float(liveStats(defender).evasion) * accRollMulti(defender);
	//Weapon.java under-STR penalty: ACC /= 1.5^encumbrance (delay penalty N/A - turns here
	//have no fractional duration, documented at the call site rather than silently dropped)
	if (attacker.str !== undefined && attacker.strReq !== undefined && attacker.str < attacker.strReq) {
		return acuRoll / Math.pow(1.5, attacker.strReq - attacker.str) >= defRoll;
	}
	return acuRoll >= defRoll;
}

/**
 * SPD's `Char.attack()`: a damage roll minus the defender's armor roll, floored at 0 - a hit
 * can land as a scratch. Plus its real multiplier chain: Berserk (power simplified to
 * remaining-missing-HP fraction - no rage-decay clock exists here), Fury x1.5 below half HP,
 * ChampionEnemy.Blessed...Blazing x1.25, Weakness x0.67, Vulnerable-taken x1.33, and
 * MeleeWeapon's excess-STR bonus (+Random(0..excess)).
 */
export function rollDamage(attacker: Readonly<Combatant>, defender: Readonly<Combatant>, random: SimulationRandom): number {
	const [min, max] = liveStats(attacker).damage;
	let raw = random.normalRange(min, max);
	//MeleeWeapon.damageRoll: excess STR over the requirement adds up to the whole surplus
	if (attacker.str !== undefined && attacker.strReq !== undefined && attacker.str > attacker.strReq) {
		raw += random.range(0, attacker.str - attacker.strReq);
	}
	let dmg = raw;
	if (attacker.buffs['berserk']) {
		const power = 1 - attacker.hp / attacker.maxHp;
		dmg *= Math.min(1.5, 1 + power / 2);
	}
	if (attacker.buffs['fury'] && attacker.hp <= attacker.maxHp * 0.5) dmg *= 1.5;
	if (attacker.champion === 'blazing') dmg *= 1.25;
	//ChampionEnemy.Growing.meleeDamageFactor(): its own growth multiplier, same value read
	//below for damageTakenFactor's inverse.
	if (attacker.champion === 'growing') dmg *= attacker.championPower ?? 1.19;
	if (ascensionOn() && attacker.kind && ASCENSION_MOD[attacker.kind]) dmg *= ASCENSION_MOD[attacker.kind]!;
	if (attacker.buffs['weakness']) dmg *= 0.67;
	const dr = random.normalRange(defender.armor[0], defender.armor[1]);
	let effective = Math.max(0, Math.round(dmg) - dr);
	if (defender.buffs['vulnerable']) effective *= 1.33;
	//ChampionEnemy.Giant.damageTakenFactor()/Growing.damageTakenFactor(): flat 0.2x for Giant,
	//1/growthMultiplier for Growing (so its rising offense is paired with falling defense, as
	//real Java's own inverse relationship works). Not modeled: Java's Giant/Projecting
	//`canAttackWithExtraReach` (a 2/4-cell melee reach via pathfinding) - see `PORT_COVERAGE.md`.
	if (defender.champion === 'giant') effective *= 0.2;
	if (defender.champion === 'growing') effective /= defender.championPower ?? 1.19;
	return Math.max(0, Math.round(effective));
}

