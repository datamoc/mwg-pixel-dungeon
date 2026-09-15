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

	check('only implemented abilities are offered, and the charge meter is Java\'s', () => {
		//The Warrior's three, the Rogue's Death Mark and the Huntress's Spectral Blades are the
		//ported set; a class with none of its own offers nothing, which is what keeps a choice panel
		//from listing an ability that cannot run.
		assert.deepEqual(armorAbilitiesFor('warrior'), ['heroicleap', 'shockwave', 'endure']);
		assert.deepEqual(armorAbilitiesFor('rogue'), ['deathmark']);
		assert.deepEqual(armorAbilitiesFor('huntress'), ['spectralblades']);
		assert.deepEqual(armorAbilitiesFor('mage'), ['warpbeacon']);
		assert.deepEqual(armorAbilitiesFor('duelist'), []);
		assert.equal(ARMOR_CHARGE_MAX, 100);
		assert.equal(ARMOR_CHARGE_START, 50);
		//`ClassArmor.Charger.act()`: `chargeGain = 100/500f`.
		assert.equal(ARMOR_CHARGE_PER_TURN, 0.2);
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
	});

	check('Endure\'s counter-attack is retribution-scaled, odds-scaled, and split over its hits', () => {
		//100 banked, no talents: one hit for the lot.
		assert.deepEqual(endureEndingBonus(100, 0, 0, 0), { perHitBonus: 100, hits: 1 });
		//+15% per SUSTAINED_RETRIBUTION point, and `1 + points` strikes to spend it over.
		const sustained = endureEndingBonus(100, 2, 0, 0);
		assert.equal(sustained.hits, 3);
		assert.equal(sustained.perHitBonus, (100 * 1.3) / 3);
		//EVEN_THE_ODDS adds 5% per nearby hostile per point: four neighbours at rank 2 is +40%.
		assert.equal(endureEndingBonus(100, 0, 4, 2).perHitBonus, 140);
		assert.equal(endureEndingBonus(100, 0, 4, 0).perHitBonus, 100);
		//Nothing banked means the tracker detaches instead of arming a zero bonus.
		assert.deepEqual(endureEndingBonus(0, 3, 5, 3), { perHitBonus: 0, hits: 0 });
	});
}
