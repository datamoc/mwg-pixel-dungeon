import assert from 'node:assert/strict';

/**
 * The armor-ability data table and the Warrior's formulas, pinned against the real Java source
 * (tag `v3.3.8`): `HeroClass.armorAbilities()`, `Talent.java`'s tier-4 blocks,
 * `ArmorAbility.chargeUse()`, and each Warrior ability's own `activate()`.
 *
 * Rolled values are supplied by hand here, which is the point of `simulation/warriorAbilities.ts`
 * taking them as arguments rather than rolling internally.
 */
export function verifyArmorAbilities(require, check) {
	const { ARMOR_ABILITIES } = require('./talents');
	const { armorAbilityDef, armorAbilitiesFor, armorChargeUse, ARMOR_CHARGE_PER_TURN, ARMOR_CHARGE_MAX, ARMOR_CHARGE_START } = require('./armorAbilities');
	const {
		bodySlamDamage, endureBankedDamage, endureDamageTaken, endureEndingBonus,
		impactWaveStrength, impactWaveVulnerable, shockForceParalyses, shockwaveCone,
		shockwaveDamage, strikingWaveProcs,
	} = require('./simulation/warriorAbilities');
	const {
		SPIRIT_HAWK_LIFESPAN, goForTheEyesEffect, spiritHawkDodges, spiritHawkSpeed, spiritHawkViewDistance,
	} = require('./simulation/huntressAbilities');
	const { exposeWeaknessDuration, feignedRetreatHaste, closeTheGapRange, eliminationMatchFactor, invigoratingVictoryHeal, combinedLethalityTest, elementalStrikeCone, elementalPowerMulti, directedPowerBoost, elementalBlockingShield, elementalVampiricHeal, elementalSacrificialSelf, elementalBlobAmount, elementalBloomingBudget, elementalFurrowStep, elementalBaseDamage, elementalKineticSplash, elementalRootsDuration, elementalKnockback, elementalLuckyChance, elementalProjectingSplash, elementalCorruptingChance, elementalGrimChance, elementalCurseChance, elementalAnnoyingChance, elementalSacrificialOther, elementalStrikeResisted } = require('./simulation/duelistAbilities');
	const { ELEMENTAL_BLAST_DAMAGE_FACTORS, elementalBlastEffectMulti, elementalBlastAoeSize, elementalBlastAim, elementalBlastDamage, elementalBlastUndeadDamage, elementalBlastTransfusionSplit, elementalBlastCorrosion, elementalBlastParalysisDuration, elementalBlastFrostDuration, elementalBlastBlindnessDuration, elementalBlastLightDuration, elementalBlastCharmDuration, elementalBlastAmokDuration, elementalBlastRootsDuration, elementalBlastRechargingDuration, elementalBlastRegrowthChance, elementalBlastKnockback, elementalBlastReactiveShield } = require('./simulation/mageAbilities');
	const { BUFF_DURATION } = require('./simulation/buffs');

	//`HeroClass.armorAbilities()`, in its own order.
	check('every class offers its three real armor abilities, in Java order', () => {
		assert.deepEqual(ARMOR_ABILITIES.warrior, ['heroicleap', 'shockwave', 'endure']);
		assert.deepEqual(ARMOR_ABILITIES.mage, ['elementalblast', 'warpbeacon', 'wildmagic']);
		assert.deepEqual(ARMOR_ABILITIES.rogue, ['smokebomb', 'deathmark', 'shadowclone']);
		assert.deepEqual(ARMOR_ABILITIES.huntress, ['spectralblades', 'naturespower', 'spirithawk']);
		assert.deepEqual(ARMOR_ABILITIES.duelist, ['challenge', 'elementalstrike', 'feint']);
		//The Cleric's three (`Trinity`/`PowerOfMany`/`AscendedForm`) are unported and unnamed by
		//this port's message catalogue - see `talents.ts`'s own note.
		assert.deepEqual(ARMOR_ABILITIES.cleric, []);
	});

	check('base charge use and targeting are Java\'s per ability', () => {
		//`ArmorAbility.baseChargeUse` default 35, overridden per class: Endure 50, Wild Magic/Death
		//Mark/Spectral Blades/Elemental Strike 25, Smoke Bomb/Feint 50.
		const expected = {
			heroicleap: [35, 'cell'], shockwave: [35, 'cell'], endure: [50, 'none'],
			elementalblast: [35, 'none'], warpbeacon: [35, 'beacon'], wildmagic: [25, 'cell'],
			smokebomb: [50, 'cell'], deathmark: [25, 'cell'], shadowclone: [35, 'clone'],
			spectralblades: [25, 'cell'], naturespower: [35, 'none'], spirithawk: [35, 'hawk'],
			challenge: [35, 'cell'], elementalstrike: [25, 'cell'], feint: [50, 'cell'],
		};
		for (const [id, [charge, targeting]] of Object.entries(expected)) {
			const def = armorAbilityDef(id);
			assert.equal(def.baseChargeUse, charge, `${id} charge`);
			assert.equal(def.targeting, targeting, `${id} targeting`);
		}
	});

	check('each ability owns exactly its three tier-4 talents', () => {
		assert.deepEqual(armorAbilityDef('heroicleap').talents, ['body_slam', 'impact_wave', 'double_jump']);
		assert.deepEqual(armorAbilityDef('shockwave').talents, ['expanding_wave', 'striking_wave', 'shock_force']);
		assert.deepEqual(armorAbilityDef('endure').talents, ['sustained_retribution', 'shrug_it_off', 'even_the_odds']);
		assert.deepEqual(armorAbilityDef('feint').talents, ['feigned_retreat', 'expose_weakness', 'counter_ability']);
		for (const def of ['heroicleap', 'shockwave', 'endure', 'elementalblast', 'warpbeacon', 'wildmagic',
			'smokebomb', 'deathmark', 'shadowclone', 'spectralblades', 'naturespower', 'spirithawk',
			'challenge', 'elementalstrike', 'feint'].map(armorAbilityDef)) {
			assert.equal(def.talents.length, 3, `${def.id} talent count`);
		}
	});

	check('SmokeBomb\'s SHADOW_STEP discount is 0.84^points while the hero is invisible', () => {
		const smoke = armorAbilityDef('smokebomb');
		assert.equal(smoke.baseChargeUse, 50);
		assert.equal(armorChargeUse(smoke, { heroicEnergyRank: 0, shadowStepArmed: false, shadowStepRank: 4 }), 50);
		//16/30/41/50% off at rank 1-4, and the override is SmokeBomb's alone.
		assert.deepEqual([1, 2, 3, 4].map((points) => Math.round(armorChargeUse(smoke, { heroicEnergyRank: 0, shadowStepArmed: true, shadowStepRank: points }) * 1000) / 1000),
			[1, 2, 3, 4].map((points) => Math.round(50 * Math.pow(0.84, points) * 1000) / 1000));
		const mark = armorAbilityDef('deathmark');
		assert.equal(armorChargeUse(mark, { heroicEnergyRank: 0, shadowStepArmed: true, shadowStepRank: 4 }), 25);
	});

	check('only implemented abilities are offered, and the charge meter is Java\'s', () => {
		//The Warrior's three, the Rogue's Smoke Bomb, Death Mark and Shadow Clone, the
		//Huntress's Spectral Blades, Nature's Power and Spirit Hawk, the Mage's Warp Beacon,
		//and the Duelist's Challenge, Elemental Strike and Feint are the ported set; a
		//class with none of its own offers nothing, which is what keeps a choice panel
		//from listing an ability that cannot run.
		assert.deepEqual(armorAbilitiesFor('warrior'), ['heroicleap', 'shockwave', 'endure']);
		assert.deepEqual(armorAbilitiesFor('rogue'), ['smokebomb', 'deathmark', 'shadowclone']);
		assert.deepEqual(armorAbilitiesFor('huntress'), ['spectralblades', 'naturespower', 'spirithawk']);
		assert.deepEqual(armorAbilitiesFor('mage'), ['warpbeacon']);
		assert.deepEqual(armorAbilitiesFor('duelist'), ['challenge', 'elementalstrike', 'feint']);
		assert.equal(ARMOR_CHARGE_MAX, 100);
		assert.equal(ARMOR_CHARGE_START, 50);
		//`ClassArmor.Charger.act()`: `chargeGain = 100/500f`.
		assert.equal(ARMOR_CHARGE_PER_TURN, 0.2);
	});

	check('SpiritHawk\'s charge is Java\'s 35, and free while the hawk is already out', () => {
		const hawk = armorAbilityDef('spirithawk');
		assert.equal(hawk.baseChargeUse, 35);
		assert.equal(hawk.targeting, 'hawk');
		assert.equal(armorChargeUse(hawk, { heroicEnergyRank: 0 }), 35);
		//`SpiritHawk.chargeUse()` returns a flat 0 while `getHawk() != null`, which is an override
		//rather than a discount - so HEROIC_ENERGY does not survive it either.
		assert.equal(armorChargeUse(hawk, { heroicEnergyRank: 0, hawkSummoned: true }), 0);
		assert.equal(armorChargeUse(hawk, { heroicEnergyRank: 4, hawkSummoned: true }), 0);
		//And it is that ability's own override: nothing else becomes free.
		assert.equal(armorChargeUse(armorAbilityDef('warpbeacon'), { heroicEnergyRank: 0, hawkSummoned: true }), 35);
	});

	check('SpiritHawk\'s speed, sight, dodge pool and lifespan are Java\'s tables', () => {
		//`baseSpeed = 2f + SWIFT_SPIRIT / 2f`.
		assert.deepEqual([0, 1, 2, 3, 4].map(spiritHawkSpeed), [2, 2.5, 3, 3.5, 4]);
		//`viewDistance = GameMath.gate(6, 6 + EAGLE_EYE, 8)`.
		assert.deepEqual([0, 1, 2, 3, 4].map(spiritHawkViewDistance), [6, 7, 8, 8, 8]);
		//`defenseSkill()`'s pool: `2 * SWIFT_SPIRIT` outright dodges.
		assert.deepEqual([0, 1, 2, 3, 4].map(spiritHawkDodges), [0, 2, 4, 6, 8]);
		assert.equal(SPIRIT_HAWK_LIFESPAN, 100);
	});

	check('GO_FOR_THE_EYES blinds for Java\'s durations and cripples from rank 3', () => {
		assert.deepEqual([0, 1, 2, 3, 4].map(goForTheEyesEffect), [
			{ blindness: 0, cripple: 0 },
			{ blindness: 2, cripple: 0 },
			{ blindness: 5, cripple: 0 },
			{ blindness: 5, cripple: 2 },
			{ blindness: 5, cripple: 5 },
		]);
	});

	check('HEROIC_ENERGY scales charge use by Java\'s own table', () => {
		const leap = armorAbilityDef('heroicleap');
		//12%/23%/32%/40% reductions at rank 1/2/3/4.
		assert.deepEqual([0, 1, 2, 3, 4].map((rank) => armorChargeUse(leap, { heroicEnergyRank: rank })),
			[35, 35 * 0.88, 35 * 0.77, 35 * 0.68, 35 * 0.6]);
		//Ranks beyond four clamp rather than extrapolating.
		assert.equal(armorChargeUse(leap, { heroicEnergyRank: 9 }), 35 * 0.6);
	});

	check('HeroicLeap\'s DOUBLE_JUMP discount is 0.84^points and applies only while armed', () => {
		const leap = armorAbilityDef('heroicleap');
		assert.equal(armorChargeUse(leap, { heroicEnergyRank: 0, doubleJumpArmed: false, doubleJumpRank: 3 }), 35);
		assert.equal(armorChargeUse(leap, { heroicEnergyRank: 0, doubleJumpArmed: true, doubleJumpRank: 3 }), 35 * Math.pow(0.84, 3));
		//The discount is an override on HeroicLeap alone: no other ability takes it, however many
		//points the hero has.
		const shockwave = armorAbilityDef('shockwave');
		assert.equal(armorChargeUse(shockwave, { heroicEnergyRank: 0, doubleJumpArmed: true, doubleJumpRank: 4 }), 35);
	});

	check('DeathMark\'s DOUBLE_MARK discount is 0.707^points while the tracker is armed', () => {
		const mark = armorAbilityDef('deathmark');
		assert.equal(mark.baseChargeUse, 25);
		assert.equal(armorChargeUse(mark, { heroicEnergyRank: 0, doubleMarkArmed: false, doubleMarkRank: 4 }), 25);
		//30/50/65/75% off, and the two overrides are per-ability: a Warrior's leap never takes it.
		assert.deepEqual([1, 2, 3, 4].map((points) => Math.round(armorChargeUse(mark, { heroicEnergyRank: 0, doubleMarkArmed: true, doubleMarkRank: points }) * 1000) / 1000),
			[1, 2, 3, 4].map((points) => Math.round(25 * Math.pow(0.707, points) * 1000) / 1000));
		const leap = armorAbilityDef('heroicleap');
		assert.equal(armorChargeUse(leap, { heroicEnergyRank: 0, doubleMarkArmed: true, doubleMarkRank: 4 }), 35);
		//`HEROIC_ENERGY` applies underneath, in Java's own order (`super.chargeUse()` first).
		assert.equal(armorChargeUse(mark, { heroicEnergyRank: 4, doubleMarkArmed: true, doubleMarkRank: 1 }), 25 * 0.6 * 0.707);
	});

	check('Challenge\'s ELIMINATION_MATCH discount is 0.84^points, and its talent math is Java\'s', () => {
		const duel = armorAbilityDef('challenge');
		assert.equal(duel.baseChargeUse, 35);
		assert.equal(duel.targeting, 'cell');
		assert.deepEqual(duel.talents, ['close_the_gap', 'invigorating_victory', 'elimination_match']);
		assert.equal(armorChargeUse(duel, { heroicEnergyRank: 0 }), 35);
		//16/30/40/50% off at ranks 1-4 (Java's rounded strings), stacking over HEROIC_ENERGY.
		assert.deepEqual([1, 2, 3, 4].map(eliminationMatchFactor),
			[1, 2, 3, 4].map((points) => Math.pow(0.84, points)));
		assert.equal(armorChargeUse(duel, { heroicEnergyRank: 0, eliminationMatchArmed: true, eliminationMatchRank: 2 }), 35 * Math.pow(0.84, 2));
		assert.equal(armorChargeUse(duel, { heroicEnergyRank: 4, eliminationMatchArmed: true, eliminationMatchRank: 1 }), 35 * 0.6 * 0.84);
		assert.equal(armorChargeUse(armorAbilityDef('feint'), { heroicEnergyRank: 0, eliminationMatchArmed: true, eliminationMatchRank: 4 }), 50);
		//`CLOSE_THE_GAP` blinks 1 + points cells.
		assert.deepEqual([1, 2, 3, 4].map(closeTheGapRange), [2, 3, 4, 5]);
		//`INVIGORATING_VICTORY`: `round(taken*(1-0.707^points)) + 5*points`, capped at missing HP.
		assert.equal(invigoratingVictoryHeal(40, 2, 100), 30);
		assert.equal(invigoratingVictoryHeal(40, 1, 100), 17);
		assert.equal(invigoratingVictoryHeal(40, 2, 25), 25);
	});

	check('BODY_SLAM rolls `NormalIntRange(points, 4*points)` plus a quarter of the armor roll per point', () => {
		const flat = { normalIntRange: (min) => min, int: () => 0 };
		//points 3: 3 + round(20*0.25*3) - 5 = 3 + 15 - 5.
		assert.equal(bodySlamDamage(3, 20, 5, flat), 13);
		//The roll's own bounds are Java's: 1..4 per point at rank 1.
		assert.equal(bodySlamDamage(1, 0, 0, flat), 1);
		assert.equal(bodySlamDamage(1, 0, 0, { normalIntRange: (min, max) => max, int: () => 0 }), 4);
		//No points, no damage (Java only reaches this branch for a talent rank).
		assert.equal(bodySlamDamage(0, 20, 0, flat), 0);
		//A negative total is returned as-is; `Char.damage` ignores it, which is Java's own shape.
		assert.equal(bodySlamDamage(1, 0, 99, flat), -98);
	});

	check('IMPACT_WAVE shoves by `1 + points` and rolls `Int(4) < points` for Vulnerable', () => {
		assert.deepEqual([0, 1, 2, 3, 4].map(impactWaveStrength), [1, 2, 3, 4, 5]);
		assert.equal(impactWaveVulnerable(3, 2), true);
		assert.equal(impactWaveVulnerable(3, 3), false);
		assert.equal(impactWaveVulnerable(4, 3), true);
	});

	check('Shockwave\'s cone is `min(aim, 5 + points)` cells wide of `60 + 15*points` degrees', () => {
		assert.deepEqual(shockwaveCone(0, 9), { distance: 5, degrees: 60 });
		assert.deepEqual(shockwaveCone(4, 3), { distance: 3, degrees: 120 });
		assert.deepEqual(shockwaveCone(2, 20), { distance: 7, degrees: 90 });
	});

	check('Shockwave\'s damage is `5+STR-10 .. 10+2*(STR-10)` scaled by SHOCK_FORCE, less armor', () => {
		const low = { normalIntRange: (min) => min, int: () => 0 };
		const high = { normalIntRange: (min, max) => max, int: () => 0 };
		//STR 10 (no scaling): 5-10 base.
		assert.equal(shockwaveDamage(10, 0, 0, low), 5);
		assert.equal(shockwaveDamage(10, 0, 0, high), 10);
		//STR 13: 8-16 base, and SHOCK_FORCE 3 multiplies by 1.6 before rounding.
		assert.equal(shockwaveDamage(13, 0, 0, low), 8);
		assert.equal(shockwaveDamage(13, 0, 0, high), 16);
		assert.equal(shockwaveDamage(13, 3, 0, low), Math.round(8 * 1.6));
		//The target's armor roll comes off the total.
		assert.equal(shockwaveDamage(10, 0, 4, high), 6);
	});

	check('STRIKING_WAVE procs on `Int(10) < 3*points` and SHOCK_FORCE paralyses on `Int(4) < points`', () => {
		assert.equal(strikingWaveProcs(1, 2), true);
		assert.equal(strikingWaveProcs(1, 3), false);
		assert.equal(strikingWaveProcs(4, 9), true);
		assert.equal(strikingWaveProcs(0, 0), false);
		assert.equal(shockForceParalyses(1, 0), true);
		assert.equal(shockForceParalyses(1, 1), false);
		assert.equal(shockForceParalyses(3, 2), true);
	});

	check('Endure halves incoming damage, 0.8^SHRUG_IT_OFF further, banking half of what arrived', () => {
		assert.equal(endureDamageTaken(40, 0), 20);
		assert.equal(endureDamageTaken(40, 1), 16);
		assert.equal(endureDamageTaken(40, 4), 20 * Math.pow(0.8, 4));
		assert.equal(endureBankedDamage(40), 20);
		//Java's `damageBonus` is an int: `damageBonus += damage/2` truncates per hit.
		assert.equal(endureBankedDamage(15), 7);
	});

	check('Endure\'s counter-attack is retribution-scaled, odds-scaled, and split over its hits', () => {
		//100 banked, no talents: one hit for the lot.
		assert.deepEqual(endureEndingBonus(100, 0, 0, 0), { perHitBonus: 100, hits: 1 });
		//+15% per SUSTAINED_RETRIBUTION point, and `1 + points` strikes to spend it over.
		const sustained = endureEndingBonus(100, 2, 0, 0);
		assert.equal(sustained.hits, 3);
		//Java scales and splits with int truncation: 100*1.3=130 (truncated), 130/3=43.
		assert.equal(sustained.perHitBonus, 43);
		//Odd banked damage truncates at every step: 7*1.3=9.1->9, split 9/3=3.
		assert.deepEqual(endureEndingBonus(7, 2, 0, 0), { perHitBonus: 3, hits: 3 });
		//A split that truncates to zero detaches (no phantom hits): 2*1.45=2.9->2, 2/4=0.
		assert.deepEqual(endureEndingBonus(2, 3, 0, 0), { perHitBonus: 0, hits: 0 });
		//EVEN_THE_ODDS adds 5% per nearby hostile per point: four neighbours at rank 2 is +40%.
		assert.equal(endureEndingBonus(100, 0, 4, 2).perHitBonus, 140);
		assert.equal(endureEndingBonus(100, 0, 4, 0).perHitBonus, 100);
		//Nothing banked means the tracker detaches instead of arming a zero bonus.
		assert.deepEqual(endureEndingBonus(0, 3, 5, 3), { perHitBonus: 0, hits: 0 });
	});

	check('ShadowClone\'s charge is Java\'s 35, free while the clone is out, with Java\'s ally stats', () => {
		const clone = armorAbilityDef('shadowclone');
		assert.equal(clone.baseChargeUse, 35);
		assert.equal(clone.targeting, 'clone');
		assert.deepEqual(clone.talents, ['shadow_blade', 'cloned_armor', 'perfect_copy']);
		assert.equal(armorChargeUse(clone, { heroicEnergyRank: 0 }), 35);
		//Directing an existing clone costs nothing, like the hawk's order - and only the clone's.
		assert.equal(armorChargeUse(clone, { heroicEnergyRank: 0, cloneSummoned: true }), 0);
		assert.equal(armorChargeUse(clone, { heroicEnergyRank: 4, cloneSummoned: true }), 0);
		assert.equal(armorChargeUse(armorAbilityDef('smokebomb'), { heroicEnergyRank: 0, cloneSummoned: true }), 50);
		const { SHADOW_CLONE_HP, shadowCloneHp, shadowCloneAccuracy, shadowCloneEvasion, shadowCloneBladeShare, shadowCloneArmorShare } = require('./simulation/rogueAbilities');
		assert.equal(SHADOW_CLONE_HP, 80);
		//`15 + 5*heroLevel`, plus 10% per PERFECT_COPY point: level 10 rank 0 is 80, rank 2 is 93.
		assert.equal(shadowCloneHp(10, 0), 80);
		assert.equal(shadowCloneHp(10, 2), 93);
		assert.equal(shadowCloneHp(1, 4), 88);
		//`defenseSkill = heroLevel + 4`, `attackSkill = defenseSkill + 5`.
		assert.equal(shadowCloneAccuracy(1), 10);
		assert.equal(shadowCloneEvasion(1), 5);
		assert.equal(shadowCloneAccuracy(10), 19);
		assert.equal(shadowCloneEvasion(10), 14);
		//`round(0.08 * points * heroMean / delay)`: 8% of a 15-mean at delay 1, rank 2 is 2.
		assert.equal(shadowCloneBladeShare(0, 15, 1), 0);
		assert.equal(shadowCloneBladeShare(2, 15, 1), 2);
		assert.equal(shadowCloneBladeShare(4, 15, 1), 5);
		//`round(0.12 * points * armorMean)`: 12% of a 10-mean, rank 3 is 4.
		assert.equal(shadowCloneArmorShare(0, 10), 0);
		assert.equal(shadowCloneArmorShare(3, 10), 4);
		assert.equal(shadowCloneArmorShare(4, 10), 5);
	});

	check('ElementalStrike\'s cone, talents and imbuement arithmetic are Java\'s', () => {
		const strike = armorAbilityDef('elementalstrike');
		assert.equal(strike.baseChargeUse, 25);
		assert.equal(strike.targeting, 'cell');
		assert.deepEqual(strike.talents, ['elemental_reach', 'striking_force', 'directed_power']);
		assert.equal(armorChargeUse(strike, { heroicEnergyRank: 0 }), 25);
		//Cone: `maxDist = 4 + reach`, `dist = min(aim, maxDist)`, `65 + 10*reach` degrees.
		assert.deepEqual(elementalStrikeCone(0, 9), { distance: 4, degrees: 65 });
		assert.deepEqual(elementalStrikeCone(4, 3), { distance: 3, degrees: 105 });
		assert.deepEqual(elementalStrikeCone(2, 6), { distance: 6, degrees: 85 });
		//`STRIKING_FORCE`: `1 + 0.30*points`.
		const r3 = (v) => Math.round(v * 1000) / 1000;
		assert.deepEqual([0, 1, 2, 4].map((points) => r3(elementalPowerMulti(points))), [1, 1.3, 1.6, 2.2]);
		//`DIRECTED_POWER`: `0.30 * targetsHit * points` onto the primary swing.
		assert.equal(r3(directedPowerBoost(2, 3)), 1.8);
		assert.equal(directedPowerBoost(0, 3), 0);
		//Blocking: `round(6*targetsHit*powerMulti)`, nothing when nothing is caught.
		assert.equal(elementalBlockingShield(0, 1.6), 0);
		assert.equal(elementalBlockingShield(3, 1), 18);
		assert.equal(elementalBlockingShield(2, 1.3), 16);
		//Vampiric: `round(2.5*targetsHit*powerMulti)`, capped at missing HP.
		assert.equal(elementalVampiricHeal(0, 1.6, 50), 0);
		assert.equal(elementalVampiricHeal(2, 1, 50), 5);
		assert.equal(elementalVampiricHeal(4, 2.2, 10), 10);
		//Sacrificial: hero bleeds `10*powerMulti`, caught chars `12*powerMulti`.
		assert.equal(r3(elementalSacrificialSelf(1.6)), 16);
		assert.equal(r3(elementalSacrificialOther(1.6)), 19.2);
		//Blazing/Chilling/Shocking seed `round(8*powerMulti)`; Blooming budgets the same.
		assert.equal(elementalBlobAmount(1), 8);
		assert.equal(elementalBloomingBudget(1.3), 10);
		//Furrow: 40+ counted uses furrow, empty-field uses count 4, others 1.
		assert.deepEqual(elementalFurrowStep(40, 0, false), { furrowed: true, increment: 0 });
		assert.deepEqual(elementalFurrowStep(39, 0, false), { furrowed: false, increment: 4 });
		assert.deepEqual(elementalFurrowStep(0, 1, false), { furrowed: false, increment: 1 });
		assert.deepEqual(elementalFurrowStep(0, 0, true), { furrowed: false, increment: 1 });
		//Plain strike: `round(powerMulti * roll(6, 12))`.
		assert.equal(elementalBaseDamage(1.3, 9), 12);
		assert.equal(elementalBaseDamage(1, 6), 6);
		//Kinetic splash: `round(stored*0.4*powerMulti)`; roots: `round(6*powerMulti)`.
		assert.equal(elementalKineticSplash(50, 1.3), 26);
		assert.equal(elementalRootsDuration(1.6), 10);
		//Elastic shoves `round(5*powerMulti)`; Lucky pays `0.125*powerMulti`.
		assert.equal(elementalKnockback(1), 5);
		assert.equal(elementalKnockback(1.3), 7);
		assert.equal(r3(elementalLuckyChance(2)), 0.25);
		//Projecting: `round(roll*0.3*powerMulti)`; Corrupting 5-25%, Grim 6-30%.
		assert.equal(elementalProjectingSplash(20, 1.3), 8);
		assert.equal(elementalCorruptingChance(0, 1), 0.05);
		assert.equal(r3(elementalCorruptingChance(1, 1)), 0.25);
		assert.equal(elementalGrimChance(0, 1), 0.06);
		assert.equal(r3(elementalGrimChance(0.5, 2)), 0.36);
		//Shared curse chance `0.5*powerMulti`, Annoying `0.2*powerMulti`.
		assert.equal(r3(elementalCurseChance(2)), 1);
		assert.equal(r3(elementalAnnoyingChance(2)), 0.4);
		//The Lucky tracker caps each mob at one payout (Java's permanent buff; 9999 turns
		//is the catalogue's effectively-permanent stand-in).
		assert.equal(BUFF_DURATION.luckyTracker, 9999);
	});

	check('ElementalBlast\'s factors, aim, damage and talent arithmetic are Java\'s', () => {
		const blast = armorAbilityDef('elementalblast');
		assert.equal(blast.baseChargeUse, 35);
		assert.equal(blast.targeting, 'none');
		assert.deepEqual(blast.talents, ['blast_radius', 'elemental_power', 'reactive_barrier']);
		assert.equal(armorChargeUse(blast, { heroicEnergyRank: 0 }), 35);
		//The per-wand damage factors, all thirteen.
		assert.deepEqual(ELEMENTAL_BLAST_DAMAGE_FACTORS, {
			magicMissile: 0.5, lightning: 1, disintegration: 1, fireblast: 1, corrosion: 0,
			blastWave: 0.67, livingEarth: 0.5, frost: 1, prismaticLight: 0.67, warding: 0,
			transfusion: 0, corruption: 0, regrowth: 0,
		});
		//`ELEMENTAL_POWER`: `1 + 0.25*points`; `BLAST_RADIUS`: `4 + points`.
		const r3 = (v) => Math.round(v * 1000) / 1000;
		assert.deepEqual([0, 1, 2, 4].map(elementalBlastEffectMulti), [1, 1.25, 1.5, 2]);
		assert.deepEqual([0, 1, 4].map(elementalBlastAoeSize), [4, 5, 8]);
		//The aim fires down the roomiest cardinal: wider axis wins, ties go horizontal,
		//each axis away from its nearer edge.
		assert.equal(elementalBlastAim(25, 15, 30, 30), 'west');
		assert.equal(elementalBlastAim(5, 15, 30, 30), 'east');
		assert.equal(elementalBlastAim(15, 25, 30, 30), 'north');
		assert.equal(elementalBlastAim(15, 5, 30, 30), 'south');
		assert.equal(elementalBlastAim(15, 15, 30, 30), 'east');
		//Damage: `round(roll(15, 25) * multi * factor)`.
		assert.equal(elementalBlastDamage(20, 1.5, 1), 30);
		assert.equal(elementalBlastDamage(15, 1, 0.5), 8);
		assert.equal(elementalBlastDamage(25, 2, 0.67), 34);
		assert.equal(elementalBlastDamage(20, 1.5, 0), 0);
		//Transfusion vs undead skips the (zero) factor: `round(roll * multi)`.
		assert.equal(elementalBlastUndeadDamage(20, 1.5), 30);
		//Transfusion vs allies/charmed: `round(10*multi)` healing, overflow to Barrier.
		assert.deepEqual(elementalBlastTransfusionSplit(50, 100, 1), { heal: 10, shield: 0 });
		assert.deepEqual(elementalBlastTransfusionSplit(95, 100, 1), { heal: 5, shield: 5 });
		assert.deepEqual(elementalBlastTransfusionSplit(100, 100, 2), { heal: 0, shield: 20 });
		//Corrosion: fixed 4-turn `set` with `round(6*multi)` damage.
		assert.deepEqual(elementalBlastCorrosion(1), { duration: 4, damage: 6 });
		assert.deepEqual(elementalBlastCorrosion(1.5), { duration: 4, damage: 9 });
		//Buff durations: Paralysis/Blindness/Charm at `multi*5`, Frost at `multi*10`,
		//Roots at `multi*5`, Recharging at `multi*15`, Amok at `multi*5`.
		assert.equal(elementalBlastParalysisDuration(1.5), 7.5);
		assert.equal(elementalBlastFrostDuration(1.5), 15);
		assert.equal(elementalBlastBlindnessDuration(2), 10);
		assert.equal(elementalBlastCharmDuration(2), 10);
		assert.equal(elementalBlastAmokDuration(2), 10);
		assert.equal(elementalBlastRootsDuration(1.5), 7.5);
		assert.equal(elementalBlastRechargingDuration(2), 30);
		//Light: `multi*10` under Darkness, `multi*50` otherwise.
		assert.equal(elementalBlastLightDuration(1.5, true), 15);
		assert.equal(elementalBlastLightDuration(1.5, false), 75);
		//Regrowth grass chance: `0.33*multi`.
		assert.equal(r3(elementalBlastRegrowthChance(1.5)), 0.495);
		//Blast Wave shove: `aoeSize + 1 - trunc(dist)`, times multi, truncated.
		assert.equal(elementalBlastKnockback(4, 2.9, 1), 3);
		assert.equal(elementalBlastKnockback(6, 2, 1.5), 7);
		//`REACTIVE_BARRIER`: capped at `4 + points`, `round(capped*2.5*points)` with talent.
		assert.equal(elementalBlastReactiveShield(10, 2, true), 30);
		assert.equal(elementalBlastReactiveShield(3, 2, true), 15);
		assert.equal(elementalBlastReactiveShield(10, 2, false), 0);
		assert.equal(elementalBlastReactiveShield(0, 4, true), 0);
	});

	check('Feint\'s charge is Java\'s 50, and FEIGNED_RETREAT/EXPOSE_WEAKNESS scale 2 turns per point', () => {
		const feint = armorAbilityDef('feint');
		assert.equal(feint.baseChargeUse, 50);
		assert.equal(feint.targeting, 'cell');
		assert.deepEqual(feint.talents, ['feigned_retreat', 'expose_weakness', 'counter_ability']);
		assert.equal(armorChargeUse(feint, { heroicEnergyRank: 0 }), 50);
		assert.deepEqual([0, 1, 2, 3, 4].map(feignedRetreatHaste), [0, 2, 4, 6, 8]);
		assert.deepEqual([0, 1, 2, 3, 4].map(exposeWeaknessDuration), [0, 2, 4, 6, 8]);
		//This port's own `feintConfusion` buff duration (`buff-rules.mwl`) is 2, not Java's bare
		//1: `advanceBuffs` decrements before the attacker's next-turn skip-turn gate reads it, so
		//1 would already be gone by the time that gate runs - 2 is what actually survives to be
		//read once, matching Java's single lost turn.
		assert.equal(BUFF_DURATION.feintConfusion, 2);
		assert.equal(BUFF_DURATION.counterAbility, 3);
	});

	check('ElementalStrike zeroes strike/grim damage on magic-immune, never kinetic/projecting/bomb', () => {
		//`Char.damage()`'s `isImmune(srcClass)` gate against `AntiMagic.RESISTS`: the base
		//strike and Polarized pass `ElementalStrike.this`, the execute passes `Grim.class`.
		assert.equal(elementalStrikeResisted('strike', true), true);
		assert.equal(elementalStrikeResisted('grim', true), true);
		//Kinetic/Projecting splashes pass their unresisted enchantment, the ConjuredBomb
		//blast passes the (unresisted base) bomb - all three deal full damage.
		assert.equal(elementalStrikeResisted('kinetic', true), false);
		assert.equal(elementalStrikeResisted('projecting', true), false);
		assert.equal(elementalStrikeResisted('bomb', true), false);
		//Nothing is resisted without the immunity.
		assert.equal(elementalStrikeResisted('strike', false), false);
		assert.equal(elementalStrikeResisted('grim', false), false);
	});

	check('CombinedLethality tests only on a weapon-changed hero melee swing, executing at `0.4*points/3`', () => {
		//`Char.java` 541-561: the tracker's weapon must differ from the attacking weapon
		//(`!=` instance identity), the attacker must be the hero, and the attacking weapon
		//a `MeleeWeapon`. The tracker detaches one-shot once the gate holds, whether or
		//not the threshold fired. Bosses and minibosses are excluded outright.
		const live = (over = {}) => combinedLethalityTest({
			trackerTurns: 1, storedWeapon: 'sword:1', swingWeapon: 'axe:2',
			isHeroMelee: true, targetIsAlly: false, targetIsBossOrMiniboss: false,
			talentPoints: 3, predictedHp: 30, targetMaxHp: 100, ...over,
		});
		//Rank 3 is a 0.4 threshold: 30 of 100 executes, 40 of 100 does not (strict `<=`).
		assert.deepEqual(live(), { tests: true, executes: true });
		assert.deepEqual(live({ predictedHp: 40 }), { tests: true, executes: true });
		assert.deepEqual(live({ predictedHp: 41 }), { tests: true, executes: false });
		//Rank 1 is `0.4/3`: 13 of 100 executes, 14 does not.
		assert.deepEqual(live({ talentPoints: 1, predictedHp: 13 }), { tests: true, executes: true });
		assert.deepEqual(live({ talentPoints: 1, predictedHp: 14 }), { tests: true, executes: false });
		//The arming gate: same weapon instance never tests, whatever the HP.
		assert.deepEqual(live({ swingWeapon: 'sword:1', predictedHp: 1 }), { tests: false, executes: false });
		//No live tracker, a throw instead of a melee swing, an ally, a boss, a
		//miniboss, or a target the hit already killed: no test, or test without execute.
		assert.deepEqual(live({ trackerTurns: 0, predictedHp: 1 }), { tests: false, executes: false });
		assert.deepEqual(live({ isHeroMelee: false, predictedHp: 1 }), { tests: false, executes: false });
		assert.deepEqual(live({ targetIsAlly: true, predictedHp: 1 }), { tests: true, executes: false });
		assert.deepEqual(live({ targetIsBossOrMiniboss: true, predictedHp: 1 }), { tests: true, executes: false });
		assert.deepEqual(live({ predictedHp: 0 }), { tests: true, executes: false });
	});
}
