import assert from 'node:assert/strict';

/**
 * Hero subclass passives, pinned against the real Java source (tag `v3.3.8`):
 * `actors/buffs/Berserk.java`, `Combo.java`, `Momentum.java`,
 * `MonkEnergy.java`, `SoulMark.java`, `SnipersMark.java`,
 * `items/wands/Wand.java#wandProc`, `actors/mobs/Mob.java#defenseProc`,
 * `actors/hero/Hero.java` (SNIPER case, freerun accuracy, combo hooks),
 * `actors/Char.java` (sniper armor pierce, freerun momentum gain),
 * `items/weapon/melee/MagesStaff.java#proc`, and the subclass-relevant
 * `Talent` descs (CLEAVE, SOUL_EATER, SOUL_SIPHON, SHARED_UPGRADES,
 * EVASIVE_ARMOR, PROJECTILE_MOMENTUM, UNENCUMBERED_SPIRIT).
 */
export function verifySubclassPassives(require, check) {
	const {
		berserkMaxPower, berserkAccruePower, berserkDecayPower, berserkDamageFactor,
		berserkShieldBoost, berserkShieldDrain, BERSERK_TURN_RECOVERY_START,
		BERSERK_LEVEL_RECOVERY_START, COMBO_HIT_WINDOW, comboKillWindow,
		COMBO_MOVE_THRESHOLDS, warlockMarkThreshold, soulMarkDuration,
		soulMarkHeal, soulEaterOnEatChance, sniperMarkDuration, sniperMarkBonus,
		SNIPER_MARK_BASE_DURATION, momentumDecay, MOMENTUM_MAX_STACKS,
		freerunTurns, freerunCooldown, freerunEvasion, freerunSpeedMultiplier,
		projectileMomentumAccuracy, monkEnergyBaseGain, monkEnergyCap,
		unencumberedEnergyMultiplier, BATTLEMAGE_STAFF_PARTIAL_CHARGE,
	} = require('./simulation/subclassPassives');

	check('berserk rage accrues (damage/HT)/4 under the endless-rage cap', () => {
		assert.equal(berserkMaxPower(0), 1);
		assert.ok(Math.abs(berserkMaxPower(3) - 1.5001) < 1e-9);
		//40 damage on 40 max HP: (40/40)/4 = 0.25.
		assert.equal(berserkAccruePower(0, 40, 40, 1), 0.25);
		//Cap holds: 0.9 + 0.25 clamps to 1 without the talent.
		assert.equal(berserkAccruePower(0.9, 40, 40, 1), 1);
		//With endless rage 3 the same hit keeps climbing past 1.
		assert.equal(berserkAccruePower(0.9, 40, 40, berserkMaxPower(3)), 1.15);
	});

	check('berserk rage decays gate(0.1, power, 1) x 0.05 x (HP/HT)^2, slower when hurt', () => {
		//Full HP, power 1: 1 x 0.05 x 1 = 0.05.
		assert.ok(Math.abs(berserkDecayPower(1, 40, 40) - 0.95) < 1e-9);
		//Half HP: 0.05 x 0.25 = 0.0125 - fades four times slower.
		assert.ok(Math.abs(berserkDecayPower(1, 20, 40) - 0.9875) < 1e-9);
		//Below 0.1 power the gate floors the drain rate at 0.1 x 0.05.
		assert.ok(Math.abs(berserkDecayPower(0.05, 40, 40) - 0.0475) < 1e-9);
	});

	check('berserk damage factor caps at x1.5 with 50% at full rage', () => {
		assert.equal(berserkDamageFactor(10, 0), 10);
		assert.equal(berserkDamageFactor(10, 1), 15);
		assert.equal(berserkDamageFactor(10, 2), 15);
		assert.equal(berserkDamageFactor(10, 0.5), 12.5);
	});

	check('berserk shield scales 1/1.5/2/2.5/3x at 100/37/20/9/0% HP', () => {
		//Full HP, no armor: round(8 x 1) = 8.
		assert.equal(berserkShieldBoost(40, 40, 0, 1), 8);
		//Empty HP: round(8 x 3) = 24.
		assert.equal(berserkShieldBoost(0, 40, 0, 1), 24);
		//Armor adds 2 per buffed level before the multiplier.
		assert.equal(berserkShieldBoost(0, 40, 3, 1), 42);
		//Endless-rage over-cap multiplies again.
		assert.equal(berserkShieldBoost(0, 40, 0, 1.5), 36);
		//BERSERK-state drain is ceil(2.5% of shielding).
		assert.equal(berserkShieldDrain(40), 1);
		assert.equal(berserkShieldDrain(100), 3);
		assert.equal(BERSERK_TURN_RECOVERY_START, 100);
		assert.equal(BERSERK_LEVEL_RECOVERY_START, 4);
	});

	check('gladiator combo refreshes to 5 per hit, 15/30/45 on a kill', () => {
		assert.equal(COMBO_HIT_WINDOW, 5);
		assert.equal(comboKillWindow(0), 15);
		assert.equal(comboKillWindow(1), 15);
		assert.equal(comboKillWindow(2), 45);
		assert.deepEqual(COMBO_MOVE_THRESHOLDS, [2, 4, 6, 8, 10]);
	});

	check('warlock wand mark is 1 - 0.92^x plus 7%, duration 10 + wand level', () => {
		//Level-0 wand, one charge: 0.92 - 0.07 = 0.85 threshold (15% to mark).
		assert.ok(Math.abs(warlockMarkThreshold(0, 1) - 0.85) < 1e-9);
		//Level-3 wand, one charge: 0.92^4 - 0.07.
		assert.ok(Math.abs(warlockMarkThreshold(3, 1) - (Math.pow(0.92, 4) - 0.07)) < 1e-9);
		assert.equal(soulMarkDuration(0), 10);
		assert.equal(soulMarkDuration(3), 13);
	});

	check('soul-marked damage heals ceil(0.4 x restoration), satiety on top', () => {
		//10 damage on a 20-HP mark: ceil(10 x 0.4) = 4, no talent satiety.
		assert.deepEqual(soulMarkHeal(10, 20, 0, true, 0, 0), { heal: 4, satiety: 0 });
		//Overkill clamps to HP + shielding: 100 damage on 6 HP + 4 shield = 4 heal... ceil(10 x 0.4).
		assert.deepEqual(soulMarkHeal(100, 6, 4, true, 0, 0), { heal: 4, satiety: 0 });
		//Allied damage at soul siphon 3: round(10 x 0.4) = 4, heal ceil(4 x 0.4) = 2.
		assert.deepEqual(soulMarkHeal(10, 20, 0, false, 3, 0), { heal: 2, satiety: 0 });
		//Soul eater 2 feeds 10 x 2/3 satiety alongside the same 4 heal.
		const fed = soulMarkHeal(10, 20, 0, true, 0, 2);
		assert.equal(fed.heal, 4);
		assert.ok(Math.abs(fed.satiety - 20 / 3) < 1e-9);
		assert.equal(soulEaterOnEatChance(3), 0.3);
	});

	check("sniper mark lasts 4 + min(2 x ranks, weapon level), bonus a sixth of it", () => {
		assert.equal(SNIPER_MARK_BASE_DURATION, 4);
		assert.equal(sniperMarkDuration(0, 5), 4);
		assert.equal(sniperMarkBonus(0, 5), 0);
		//Rank 2, +5 weapon: min(4, 5) = 4 -> 8 turns, 4/6 bonus.
		assert.equal(sniperMarkDuration(2, 5), 8);
		assert.ok(Math.abs(sniperMarkBonus(2, 5) - 4 / 6) < 1e-9);
		//Rank 1 caps the bonus at 2 even for a +9 weapon.
		assert.equal(sniperMarkDuration(1, 9), 6);
	});

	check('momentum decays by thirds, freerun spends 2 turns per stack', () => {
		assert.equal(MOMENTUM_MAX_STACKS, 10);
		assert.equal(momentumDecay(10), 7);
		assert.equal(momentumDecay(3), 1);
		assert.equal(momentumDecay(1), 0);
		assert.equal(freerunTurns(7), 14);
		assert.equal(freerunCooldown(7), 38);
		assert.equal(freerunSpeedMultiplier(true), 2);
		assert.equal(freerunSpeedMultiplier(false), 1);
		//Level-20 freerunner: floor(20/2) = 10, plus 3 x 2 excess STR.
		assert.equal(freerunEvasion(20, 2, 3), 16);
		assert.equal(projectileMomentumAccuracy(2), 2);
	});

	check('monk energy pays 5/3/1/0.5 under max(10, 5 + lvl/2)', () => {
		assert.equal(monkEnergyBaseGain({ boss: true, miniboss: false, halfEnergy: false }), 5);
		assert.equal(monkEnergyBaseGain({ boss: false, miniboss: true, halfEnergy: false }), 3);
		assert.equal(monkEnergyBaseGain({ boss: false, miniboss: false, halfEnergy: true }), 0.5);
		assert.equal(monkEnergyBaseGain({ boss: false, miniboss: false, halfEnergy: false }), 1);
		assert.equal(monkEnergyCap(1), 10);
		assert.equal(monkEnergyCap(30), 20);
		//Rank 3, tier-1 armor and weapon: 1 + 1 + 1 = triple energy.
		assert.equal(unencumberedEnergyMultiplier(3, 1, 1, true), 3);
		//Rank 1, tier-4 armor and no melee weapon: no bonus.
		assert.equal(unencumberedEnergyMultiplier(1, 4, 5, false), 1);
		//Rank 2, tier-2 armor only: 1.75x.
		assert.equal(unencumberedEnergyMultiplier(2, 2, 9, false), 1.75);
		assert.equal(BATTLEMAGE_STAFF_PARTIAL_CHARGE, 0.5);
	});
}
