import assert from 'node:assert/strict';

/**
 * `src/simulation/clericSpells.ts` - the HolyTome charge cap, cast gates, and
 * `spendCharge` exp/upgrade math. The scene presentation around them (spell
 * picker, aim, buff ticks) has no DOM-free harness and is covered by the
 * type-check plus browser verification instead.
 */
export function verifyClericSpells(require, check) {
	const { tomeChargeCap, tomeCastGate, spendTomeCharge, TOME_SPELL_COST, holyIntuitionCost, SHIELD_OF_LIGHT_COST, satiatedShieldAmount, searingLightBonus, shieldOfLightRange, SHIELD_OF_LIGHT_TURNS, recallTrackerDuration, recallInscriptionCost, sunrayDamage, sunrayBlindDuration, SUNRAY_COST, DIVINE_SENSE_COST, divineSenseRange, BLESS_COST, blessSelfDurations, blessOtherDurations, enlighteningMealCharge, CLEANSE_COST, cleanseImmunityTurns, cleanseShield, JUDGEMENT_COST, judgementDamageBase, flashCost, flashRange, auraDamageFactor, auraProtectedDamage, auraProcBonus } = require('./simulation/clericSpells');
	const { BUFF_DURATION } = require('./simulation/buffs');

	check('the tome cap is min(level+3, 10)', () => {
		assert.equal(tomeChargeCap(0), 3);
		assert.equal(tomeChargeCap(4), 7);
		assert.equal(tomeChargeCap(7), 10);
		assert.equal(tomeChargeCap(10), 10);
	});

	check('AuraOfProtection reduces only active nearby same-alignment damage', () => {
		assert.equal(auraDamageFactor(1), 0.8);
		assert.equal(auraProtectedDamage(10, 1, true, true, true), 8);
		assert.equal(auraProtectedDamage(10, 2, true, true, true), 7);
		assert.equal(auraProtectedDamage(10, 3, true, true, true), 6);
		assert.equal(auraProtectedDamage(10, 3, false, true, true), 10);
		assert.equal(auraProtectedDamage(10, 3, true, false, true), 10);
		assert.equal(auraProtectedDamage(10, 3, true, true, false), 10);
	});

	check('Armor defend-side procs add the aura term near an active aura', () => {
		assert.equal(auraProcBonus(0, true, true, true), 0.25);
		assert.equal(auraProcBonus(1, true, true, true), 0.5);
		assert.equal(auraProcBonus(3, true, true, true), 1.0);
		assert.equal(auraProcBonus(9, true, true, true), 1.0);
		assert.equal(auraProcBonus(3, false, true, true), 0);
		assert.equal(auraProcBonus(3, true, false, true), 0);
		assert.equal(auraProcBonus(3, true, true, false), 0);
	});

	check('tier-1 spell costs are 1/2/1 - HolyWard has no chargeUse override in Java', () => {
		assert.deepEqual([TOME_SPELL_COST.guidingLight, TOME_SPELL_COST.holyWeapon, TOME_SPELL_COST.holyWard], [1, 2, 1]);
	});

	check('cast gates read cursed, then MagicImmune, then charges', () => {
		assert.equal(tomeCastGate(true, true, 0, 1), 'cursed');
		assert.equal(tomeCastGate(false, true, 9, 1), 'warded');
		assert.equal(tomeCastGate(false, false, 1, 2), 'charges');
		assert.equal(tomeCastGate(false, false, 2, 2), 'ok');
	});

	check('a spend borrows whole charges off partialCharge', () => {
		const state = { charge: 3, partialCharge: 0.7, level: 0, exp: 0 };
		spendTomeCharge(state, 1, 1);
		assert.deepEqual([state.charge, state.partialCharge], [2, 0.7]);
	});

	check('exp scales up past the target level and down below it', () => {
		//target is 1+2*level: a level-1 hero with a +0 tome is exactly on target.
		const onTarget = { charge: 3, partialCharge: 0, level: 0, exp: 0 };
		spendTomeCharge(onTarget, 1, 1);
		assert.equal(onTarget.exp, 10);
		const above = { charge: 3, partialCharge: 0, level: 0, exp: 0 };
		spendTomeCharge(above, 1, 2);
		assert.equal(above.exp, Math.round(10 * 1.1));
		const below = { charge: 3, partialCharge: 0, level: 0, exp: 0 };
		spendTomeCharge(below, 1, 0);
		assert.equal(below.exp, Math.round(10 * 0.75));
		//past 6 the target gains an extra level per tome level: 1+2*7+1 = 16,
		//so a level-16 hero is exactly on target for base exp.
		const high = { charge: 9, partialCharge: 0, level: 7, exp: 0 };
		spendTomeCharge(high, 1, 16);
		assert.equal(high.exp, 10);
	});

	check('hitting (level+1)*50 upgrades and subtracts the new level times 50', () => {
		const state = { charge: 3, partialCharge: 0, level: 0, exp: 45 };
		const leveled = spendTomeCharge(state, 1, 1);
		assert.equal(leveled, true);
		assert.deepEqual([state.level, state.exp], [1, 5]);
		assert.equal(tomeChargeCap(state.level), 4);
	});

	check('the cap is 10: a +10 tome banks exp without leveling', () => {
		const state = { charge: 10, partialCharge: 0, level: 10, exp: 0 };
		const leveled = spendTomeCharge(state, 2, 30);
		assert.equal(leveled, false);
		assert.equal(state.level, 10);
		assert.ok(state.exp > 0);
	});

	check('HolyIntuition costs 4-points: 3 at rank 1, 2 at rank 2', () => {
		assert.equal(holyIntuitionCost(1), 3);
		assert.equal(holyIntuitionCost(2), 2);
	});

	check('ShieldOfLight costs the ClericSpell default 1 and prolongs 4 turns', () => {
		assert.equal(SHIELD_OF_LIGHT_COST, 1);
		assert.equal(SHIELD_OF_LIGHT_TURNS, 4);
	});

	check('Satiated converts a cast to a 1+2*points Barrier: 3 at rank 1, 5 at rank 2', () => {
		assert.equal(satiatedShieldAmount(1), 3);
		assert.equal(satiatedShieldAmount(2), 5);
	});

	check('Searing Light adds 1+2*points on an illuminated hit: 3 at rank 1, 5 at rank 2', () => {
		assert.equal(searingLightBonus(1), 3);
		assert.equal(searingLightBonus(2), 5);
	});

	check('ShieldOfLight blocks NormalIntRange(1+points, 2+2points): 2-4 at rank 1, 3-6 at rank 2', () => {
		assert.deepEqual(shieldOfLightRange(1), [2, 4]);
		assert.deepEqual(shieldOfLightRange(2), [3, 6]);
	});

	check('the recall tracker runs 10 turns at rank 1, 300 at rank 2', () => {
		assert.equal(recallTrackerDuration(1), 10);
		assert.equal(recallTrackerDuration(2), 300);
	});

	check('recall prices the tracked class: exotic 8/4, transmutation 6, scrolls 3, aug/ench stones 4, stones 2, untracked 0', () => {
		assert.equal(recallInscriptionCost(undefined), 0);
		assert.equal(recallInscriptionCost('ScrollOfMetamorphosis'), 8);
		assert.equal(recallInscriptionCost('ScrollOfEnchantment'), 8);
		assert.equal(recallInscriptionCost('ScrollOfTransmutation'), 6);
		assert.equal(recallInscriptionCost('ScrollOfIdentify'), 3);
		assert.equal(recallInscriptionCost('ScrollOfTerror'), 3);
		assert.equal(recallInscriptionCost('StoneOfAugmentation'), 4);
		assert.equal(recallInscriptionCost('StoneOfEnchantment'), 4);
		assert.equal(recallInscriptionCost('StoneOfFlock'), 2);
		assert.equal(recallInscriptionCost('StoneOfBlink'), 2);
	});

	check('sunray deals flat 8/12 to undead or demonic foes, heroDamageIntRange 4-8/6-12 otherwise', () => {
		assert.deepEqual(sunrayDamage(1, true), { flat: 8 });
		assert.deepEqual(sunrayDamage(2, true), { flat: 12 });
		assert.deepEqual(sunrayDamage(1, false), { min: 4, max: 8 });
		assert.deepEqual(sunrayDamage(2, false), { min: 6, max: 12 });
	});

	check('sunray blinds 2+2*points: 4 at rank 1, 6 at rank 2', () => {
		assert.equal(sunrayBlindDuration(1), 4);
		assert.equal(sunrayBlindDuration(2), 6);
	});

	check('Sunray and Bless cost the ClericSpell default 1; DivineSense costs 2 for a 50-turn tracker', () => {
		assert.equal(SUNRAY_COST, 1);
		assert.equal(BLESS_COST, 1);
		assert.equal(DIVINE_SENSE_COST, 2);
		assert.equal(BUFF_DURATION['divineSense'], 50);
	});

	check('divine sense reaches 4+4*points: 8 at rank 1, 12 at rank 2', () => {
		assert.equal(divineSenseRange(1), 8);
		assert.equal(divineSenseRange(2), 12);
	});

	check('spell/cooldown durations are single-sourced in authored buff data', () => {
		assert.equal(BUFF_DURATION['guidingPriestCooldown'], 50);
		assert.equal(BUFF_DURATION['lanceCooldown'], 30);
		assert.equal(BUFF_DURATION['auraProtection'], 20);
		assert.equal(BUFF_DURATION['holyWeapon'], 50);
		assert.equal(BUFF_DURATION['holyWard'], 50);
	});

	check('bless grants 2+4*points Bless and 5+5*points shield on the hero: 6/10 at rank 1, 10/15 at rank 2', () => {
		assert.deepEqual(blessSelfDurations(1), { bless: 6, shield: 10 });
		assert.deepEqual(blessSelfDurations(2), { bless: 10, shield: 15 });
	});

	check('bless grants 5+5*points Bless and healing on others: 10/10 at rank 1, 15/15 at rank 2', () => {
		assert.deepEqual(blessOtherDurations(1), { bless: 10, heal: 10 });
		assert.deepEqual(blessOtherDurations(2), { bless: 15, heal: 15 });
	});

	check('enlightening meal grants (1+points)/3 of a charge: 2/3 at rank 1, 1 at rank 2', () => {
		assert.equal(enlighteningMealCharge(1), 2 / 3);
		assert.equal(enlighteningMealCharge(2), 1);
	});

	check('Cleanse costs 2 charges, grants 0/2/4 immunity above rank 1 and 10/20/30 shielding', () => {
		assert.equal(CLEANSE_COST, 2);
		assert.equal(cleanseImmunityTurns(1), 0);
		assert.equal(cleanseImmunityTurns(2), 2);
		assert.equal(cleanseImmunityTurns(3), 4);
		assert.equal(cleanseShield(1), 10);
		assert.equal(cleanseShield(2), 20);
		assert.equal(cleanseShield(3), 30);
	});

	check('Judgement costs 3 and adds round(base*prior casts/3) to its rank-scaled base', () => {
		assert.equal(JUDGEMENT_COST, 3);
		assert.equal(judgementDamageBase(1, 0), 10);
		assert.equal(judgementDamageBase(2, 3), 30);
		assert.equal(judgementDamageBase(4, 1), 33);
	});

	check('Flash costs 2 plus prior Flash casts and reaches 2+rank cells', () => {
		assert.equal(flashCost(0), 2);
		assert.equal(flashCost(3), 5);
		assert.equal(flashRange(1), 3);
		assert.equal(flashRange(4), 6);
	});
}
