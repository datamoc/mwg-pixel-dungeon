import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readSceneSource } from './sceneSource.mjs';

/**
 * The armor-ability data table and each class's ability formulas, pinned against the real Java source
 * (tag `v3.3.8`): `HeroClass.armorAbilities()`, `Talent.java`'s tier-4 blocks,
 * `ArmorAbility.chargeUse()`, and each Warrior ability's own `activate()`.
 *
 * Rolled values are supplied by hand here, which is the point of `simulation/warriorAbilities.ts`
 * taking them as arguments rather than rolling internally.
 */
export function verifyArmorAbilities(require, check) {
	const { ARMOR_ABILITIES } = require('./talents');
	const { armorAbilityDef, armorAbilitiesFor, armorAbilityKey, armorChargeUse, ARMOR_CHARGE_PER_TURN, ARMOR_CHARGE_MAX, ARMOR_CHARGE_START } = require('./armorAbilities');
	const { armorTalentDefinitions } = require('./talents');
	const { RATSISTANCE_BASE, ratsistanceFactor } = require('./simulation/ratmogrify');
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
	const { trinityBodyDuration, trinityMindItemLevel, trinitySpiritRingLevel, trinitySpiritArtifactLevel, trinityChargeUsePerEffect, POWER_OF_MANY_TURNS, POWER_OF_MANY_ATTACK_FACTOR, powerOfManyDamageFactor } = require('./simulation/clericSpells');

	//`HeroClass.armorAbilities()`, in its own order.
	check('every class offers its three real armor abilities, in Java order', () => {
		assert.deepEqual(ARMOR_ABILITIES.warrior, ['heroicleap', 'shockwave', 'endure']);
		assert.deepEqual(ARMOR_ABILITIES.mage, ['elementalblast', 'warpbeacon', 'wildmagic']);
		assert.deepEqual(ARMOR_ABILITIES.rogue, ['smokebomb', 'deathmark', 'shadowclone']);
		assert.deepEqual(ARMOR_ABILITIES.huntress, ['spectralblades', 'naturespower', 'spirithawk']);
		assert.deepEqual(ARMOR_ABILITIES.duelist, ['challenge', 'elementalstrike', 'feint']);
		//The Cleric's three (`AscendedForm`/`Trinity`/`PowerOfMany`) carry Java's own values;
		//the base AscendedForm window is now live, while the spell-heavy alternatives remain
		//unoffered until their ally/tome systems exist.
		assert.deepEqual(ARMOR_ABILITIES.cleric, ['ascendedform', 'trinity', 'powerofmany']);
	});

	check('base charge use and targeting are Java\'s per ability', () => {
		//`ArmorAbility.baseChargeUse` default 35, overridden per class: Endure 50, Wild Magic/Death
		//Mark/Spectral Blades/Elemental Strike 25, Smoke Bomb/Feint 50.
		const expected = {
			heroicleap: [35, 'cell'], shockwave: [35, 'cell'], endure: [50, 'none'],
			elementalblast: [35, 'none'], warpbeacon: [35, 'beacon'], wildmagic: [25, 'cell'],
			smokebomb: [50, 'cell'], deathmark: [25, 'cell'], shadowclone: [35, 'clone'], ascendedform: [50, 'none'],
			spectralblades: [25, 'cell'], naturespower: [35, 'none'], spirithawk: [35, 'hawk'],
			challenge: [35, 'cell'], elementalstrike: [25, 'cell'], feint: [50, 'cell'],
		};
		for (const [id, [charge, targeting]] of Object.entries(expected)) {
			const def = armorAbilityDef(id);
			assert.equal(def.baseChargeUse, charge, `${id} charge`);
			assert.equal(def.targeting, targeting, `${id} targeting`);
		}
	});

	check('Trinity form rules keep Java\'s authored duration, levels, and charge multipliers', () => {
		//`BodyForm.duration`, `MindForm.itemLevel`, `SpiritForm.ringLevel`/
		//`artifactLevel`, and `Trinity.trinityChargeUsePerEffect` (tag `v3.3.8`).
		assert.deepEqual([0, 1, 2, 3, 4].map(trinityBodyDuration), [13, 20, 27, 33, 40]);
		assert.deepEqual([0, 1, 4].map(trinityMindItemLevel), [2, 3, 6]);
		assert.deepEqual([0, 1, 4].map(trinitySpiritRingLevel), [0, 1, 4]);
		assert.deepEqual([0, 1, 4].map(trinitySpiritArtifactLevel), [2, 4, 10]);
		assert.equal(trinityChargeUsePerEffect(25, 'Corrupting', 'body'), 50);
		assert.equal(trinityChargeUsePerEffect(25, 'WandOfFireblast', 'mind'), 50);
		assert.equal(trinityChargeUsePerEffect(25, 'DriedRose', 'spirit'), 50);
		assert.equal(trinityChargeUsePerEffect(25, 'EtherealChains', 'spirit'), 35);
		assert.equal(trinityChargeUsePerEffect(25, 'RingOfMight', 'spirit'), 25);
	});

	check('Stench armor curse seeds Java ToxicGas, while FetidRat keeps StenchGas', () => {
		const mobOnHit = readFileSync(new URL('../src/scenes/mobOnHit.ts', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
		const branch = mobOnHit.slice(mobOnHit.indexOf('//Stench.proc()'), mobOnHit.indexOf("if (attacker.kind === 'bat'", mobOnHit.indexOf('//Stench.proc()')));
		assert.match(branch, /ctx\.toxicGas\.seed\(ctx\.hero\.x, ctx\.hero\.y, 250\)/,
			'Armor.java Stench imports ToxicGas and seeds it at the defender\'s cell');
		assert.doesNotMatch(branch, /ctx\.stenchGas\.seed/,
			'armor Stench must not use the separate FetidRat StenchGas blob');
		assert.match(mobOnHit, /FetidRat\.defenseProc\(\).*?ctx\.stenchGas\.seed/s,
			'FetidRat remains the distinct StenchGas producer');
	});

	check('Displacing weapon curse refuses Java IMMOVABLE targets', () => {
		const source = readSceneSource();
		assert.match(source, /this\.weaponAffix === 'displacing'[\s\S]*?IMMOVABLE_KINDS\.has\(defender\.kind\)/,
			'Displacing must preserve Java\'s IMMOVABLE target gate');
	});

	check('Ratmogrify has its own row: 50 charge, cell targeting, three rat talents, classless key', () => {
		//`Ratmogrify.baseChargeUse = 50f`, cell-targeted (`usesTargeting`), granted by the Rat
		//King to any class - so its row is `class: "any"` and lands in no class's offer list.
		const rat = armorAbilityDef('ratmogrify');
		assert.equal(rat.baseChargeUse, 50, 'ratmogrify charge');
		assert.equal(rat.targeting, 'cell', 'ratmogrify targeting');
		assert.deepEqual(rat.talents, ['ratsistance', 'ratlomacy', 'ratforcements']);
		assert.deepEqual(ARMOR_ABILITIES.warrior.includes('ratmogrify'), false);
		assert.deepEqual(ARMOR_ABILITIES.rogue.includes('ratmogrify'), false);
		assert.deepEqual(armorAbilitiesFor('rogue').includes('ratmogrify'), false);
		//Java derives the key from the ability class's package, and Ratmogrify lives directly
		//in `abilities` - so unlike the eighteen class abilities its key has no class segment.
		assert.equal(armorAbilityKey('ratmogrify', 'warrior'), 'actors.hero.abilities.ratmogrify');
		assert.equal(armorAbilityKey('heroicleap', 'warrior'), 'actors.hero.abilities.warrior.heroicleap');
		assert.equal(armorAbilityKey('ascendedform', 'cleric'), 'port.armorability.ascendedform');
		//The row feeds the tier-4 window for every hero: three rat talents plus HEROIC_ENERGY.
		assert.deepEqual(armorTalentDefinitions('ratmogrify', 'mage').map((d) => d.id),
			['ratsistance', 'ratlomacy', 'ratforcements', 'heroic_energy']);
	});

	check('RATSISTANCE scales a transformed non-ally\'s damage by 0.9^points', () => {
		//`Ratmogrify.TransmogRat.damageRoll()`: `damage *= Math.pow(0.9f, points)` for a
		//non-allied rat, skipped entirely without the talent (which is 0.9^0 = 1).
		assert.equal(RATSISTANCE_BASE, 0.9);
		const r4 = (v) => Math.round(v * 10000) / 10000;
		assert.deepEqual([0, 1, 2, 3, 4].map((p) => r4(ratsistanceFactor(p))),
			[0, 1, 2, 3, 4].map((p) => r4(Math.pow(0.9, p))));
		//dungeonScene.ts cannot load in this harness (Pixi), so the dispatch is pinned
		//at source level: the factor folds into the attack multiplier exactly when the
		//attacker is a transformed non-ally, reading the hero's own talent rank.
		const source = readSceneSource();
		assert.match(source, /!attacker\.isAlly && attacker\.ratmogrifiedTurns !== undefined/,
			'permanent allies must keep full damage, like Java\'s allied rats');
		assert.match(source, /mult \*= ratsistanceFactor\(this\.talentRank\('ratsistance'\)\)/,
			'the transformed attacker\'s multiplier must read RATSISTANCE');
	});

	check('each ability owns exactly its three tier-4 talents', () => {
		assert.deepEqual(armorAbilityDef('heroicleap').talents, ['body_slam', 'impact_wave', 'double_jump']);
		assert.deepEqual(armorAbilityDef('shockwave').talents, ['expanding_wave', 'striking_wave', 'shock_force']);
		assert.deepEqual(armorAbilityDef('endure').talents, ['sustained_retribution', 'shrug_it_off', 'even_the_odds']);
		assert.deepEqual(armorAbilityDef('feint').talents, ['feigned_retreat', 'expose_weakness', 'counter_ability']);
		assert.deepEqual(armorAbilityDef('wildmagic').talents, ['wild_power', 'fire_everything', 'conserved_magic']);
		for (const def of ['heroicleap', 'shockwave', 'endure', 'elementalblast', 'warpbeacon', 'wildmagic',
			'smokebomb', 'deathmark', 'shadowclone', 'spectralblades', 'naturespower', 'spirithawk', 'ascendedform',
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
		//The Warrior's three, the Cleric's AscendedForm, Trinity selector and existing-ally PowerOfMany path, the Rogue's Smoke Bomb, Death Mark and Shadow Clone, the
		//Huntress's Spectral Blades, Nature's Power and Spirit Hawk, the Mage's Warp Beacon
		//and Wild Magic, and the Duelist's Challenge, Elemental Strike and Feint are the
		//ported set; a class with none of its own offers nothing, which is what keeps a
		//choice panel from listing an ability that cannot run.
		assert.deepEqual(armorAbilitiesFor('warrior'), ['heroicleap', 'shockwave', 'endure']);
		assert.deepEqual(armorAbilitiesFor('rogue'), ['smokebomb', 'deathmark', 'shadowclone']);
		assert.deepEqual(armorAbilitiesFor('huntress'), ['spectralblades', 'naturespower', 'spirithawk']);
		assert.deepEqual(armorAbilitiesFor('mage'), ['elementalblast', 'warpbeacon', 'wildmagic']);
		assert.deepEqual(armorAbilitiesFor('cleric'), ['ascendedform', 'trinity', 'powerofmany']);
	check('ElementalBlast erupts the imbued class down the roomiest cardinal', () => {
		//`ElementalBlast.activate()` (tag `v3.3.8`): the scene half is Pixi-bound, so
		//the wiring is pinned at source level while the arithmetic lives in
		//`test:simulation` (`simulation/mageAbilities.ts`).
		const source = readSceneSource();
		assert.ok(source.includes(": id === 'elementalblast' ? this.activateElementalBlast(def, cost)"), 'the ability dispatches without a target cell');
		assert.ok(source.includes('const wandType = staffImbueFor(this);'), 'the blast reads the imbued class');
		assert.ok(source.includes('elementalBlastAim(this.hero.x, this.hero.y'), 'the aim ignores the target cell');
		assert.ok(source.includes('elementalBlastDamage(Random.normalRange(15, 25), multi, factor)'), 'damage rolls the real range through the class factor');
		assert.ok(source.includes('elementalBlastUndeadDamage('), 'transfusion smites the undead');
		assert.ok(source.includes('elementalBlastTransfusionSplit('), 'transfusion heals allies and the charmed');
		assert.ok(source.includes('elementalBlastReactiveShield(charsHit,'), 'the reactive barrier counts what the blast caught');
		assert.ok(source.includes("this.bumpDoor(at.x, at.y);"), 'fireblast opens doors in the cone');
		assert.ok(source.includes('this.featuresMap?.setLayerData('), 'regrown grass restitches the tiles');
	});

	check('ElementalStrike Lucky rewards are in the right ability and include Java\'s gold case', () => {
		//`ElementalStrike.perCharEffect()` (`ElementalStrike.java`, tag `v3.3.8`) handles the
		//Lucky enchantment; `ElementalBlast.java` has no enchantment/Lucky branch. Scope this
		//source pin to the owning method so unrelated matching text cannot make it pass.
		const source = readSceneSource();
		const strikeStart = source.indexOf('activateElementalStrike(this: DungeonScene');
		assert.notEqual(strikeStart, -1, 'the ElementalStrike scene method exists');
		const strikeEnd = source.indexOf('\n\t},', strikeStart);
		assert.notEqual(strikeEnd, -1, 'the ElementalStrike scene method has an object-method boundary');
		const strike = source.slice(strikeStart, strikeEnd);
		assert.ok(strike.includes("ench === 'lucky'"), 'the lucky weapon enchant is handled in ElementalStrike');
		assert.ok(strike.includes("if (Random.float() < 0.8) low(false);"), 'Lucky uses Java\'s 80% low-tier roll');
		assert.ok(strike.includes('switch (Random.int(6))'), 'Lucky uses Java\'s six-way mid-tier roll');
		assert.ok(strike.includes("kind('bomb')") && strike.includes("kind('honeypot')"), 'Lucky includes bomb and honeypot mid-tier drops');
		assert.ok(strike.includes("Random.element(['gold', 'stone', 'potion', 'scroll']"), 'Lucky low tier includes Java\'s gold case');
		assert.ok(strike.includes("this.spawnGroundItem('gold'"), 'Lucky halves or doubles the gold amount');

		const blastStart = source.indexOf('activateElementalBlast(this: DungeonScene');
		assert.notEqual(blastStart, -1, 'the ElementalBlast scene method exists');
		const blastEnd = source.indexOf('\n\t},', blastStart);
		assert.notEqual(blastEnd, -1, 'the ElementalBlast scene method has an object-method boundary');
		assert.doesNotMatch(source.slice(blastStart, blastEnd), /ench === 'lucky'/,
			'ElementalBlast must not be mistaken for the weapon-enchantment Lucky implementation');
	});

	check('PowerOfMany keeps Java duration and attack damage factors', () => {
		assert.equal(POWER_OF_MANY_TURNS, 100);
		assert.equal(POWER_OF_MANY_ATTACK_FACTOR, 1.25);
		assert.equal(powerOfManyDamageFactor(0), 0.75);
		assert.ok(Math.abs(powerOfManyDamageFactor(1) - 0.65) < 1e-12);
		assert.ok(Math.abs(powerOfManyDamageFactor(4) - 0.5) < 1e-12);
		const source = readSceneSource();
		assert.ok(source.includes("id === 'powerofmany' ? this.activatePowerOfMany(def, cost, cell)"), 'the ability routes aimed ally selection');
		assert.ok(source.includes("addBuff(target, 'powerOfMany', POWER_OF_MANY_TURNS)"), 'cast applies the 100-turn buff');
		assert.ok(source.includes("attacker.buffs['powerOfMany']"), 'the buff grants its melee damage factor');
		assert.ok(source.includes("defender.buffs['powerOfMany']"), 'the buff reduces ordinary melee damage taken');
		assert.ok(source.includes('this.spawnLightAlly(cell)'), 'an empty valid cell summons LightAlly');
		assert.ok(source.includes("this.spawnMonster('rat', at, false, undefined, true, 'lightAlly', false, undefined, 0)"), 'the LightAlly uses an unjittered scheduler carrier');
		assert.ok(source.includes('target.powerOfManyBarrier = 25'), 'the cast grants Java Barrier shield');
		assert.ok(source.includes('this.directAlly(powered, cell'), 'a live LightAlly receives free direct orders');
		assert.ok(source.includes('powerOfManyBarrierPartial'), 'Barrier retains its fractional decay state');
		assert.ok(source.includes('this.kill(ally);'), 'LightAlly dies after its PowerBuff ends');
		assert.ok(source.includes("this.say(t('port.ally.novision')"), 'unseen summon targets get Java no-vision feedback');
		assert.ok(source.includes('!this.level.passable(cell.x, cell.y)'), 'empty-cell placement checks this port\'s available terrain gate');
		assert.equal(armorChargeUse(armorAbilityDef('powerofmany'), { heroicEnergyRank: 4, powerOfManyLightAlly: true }), 0);
		const allyTurns = readFileSync(new URL('../src/scenes/dungeon/actorTurnsHazards.ts', import.meta.url), 'utf8');
		assert.match(allyTurns, /const returningLightAlly = ally\.allyKind === 'lightAlly' && !target && !defend;/,
			'only an uncommanded LightAlly returning to its hero gets the speed rider');
		assert.match(allyTurns, /const returningFast = returningLightAlly && Roguelike\.chebyshevDistance\(ally, this\.hero\) > 1;/,
			'Java doubles LightAlly speed only while more than one cell from its hero');
		assert.match(allyTurns, /if \(returningFast\) this\.pendingMonsterTurnCost = 0\.5;/,
			'the twice-speed return advances the scheduler at half the normal turn cost');
		const traps = readFileSync(new URL('../src/scenes/dungeon/environmentFireTraps.ts', import.meta.url), 'utf8');
		assert.ok(traps.includes('absorbCreatureShields(target, damage, this.ascendedTurns > 0)'), 'blob and trap damage drains ally shields');
		assert.ok(traps.includes('absorbCreatureShields(monster, damage, this.ascendedTurns > 0)'), 'mob-triggered traps drain ally shields');
	});
		assert.deepEqual(armorAbilitiesFor('duelist'), ['challenge', 'elementalstrike', 'feint']);
		assert.equal(ARMOR_CHARGE_MAX, 100);
		assert.equal(ARMOR_CHARGE_START, 50);
		//`ClassArmor.Charger.act()`: `chargeGain = 100/500f`.
		assert.equal(ARMOR_CHARGE_PER_TURN, 0.2);
	});

	check('WildMagic fires spare wands with Java\'s selection, spend and boost', () => {
		//`WildMagic.activate()` (tag `v3.3.8`): the scene half is Pixi-bound, so the
		//wiring is pinned at source level while the pure selection/spend/boost live
		//in `test:simulation` (`simulation/spareWands.ts`).
		const source = readSceneSource();
		assert.ok(source.includes(": id === 'wildmagic' ? this.activateWildMagic(def, cost, cell)"), 'the ability dispatches');
		assert.ok(source.includes("t('actors.hero.abilities.mage.wildmagic.no_wands')"), 'an empty volley says no_wands with no charge spent');
		assert.ok(source.includes('wildMagicShots('), 'shots come from the ported selection');
		assert.ok(source.includes('wildMagicBoostedLevel('), 'shots fire at the Wild-Power-boosted level');
		assert.ok(source.includes('spendWildMagicShot(state, shotCost)'), 'every shot spends its own partial charge');
		assert.ok(source.includes('if (spare.entry.cursed) this.castCursedWandEffect(aim, cell);'),
			'cursed spares now fire through the cursed effect table instead of sitting out');
		assert.ok(source.includes('if (Random.int(4) >= conserved) this.spendHeroAction(1);'), 'the turn is free only under a conserved roll');
	});
	check('castCursedWandCommonEffect ports CursedWand.cursedZap\'s Common tier (6 of 8 effects, scoped)', () => {
		//`simulation/cursedWand.ts` has the full scoping rationale: only the Common tier
		//(60% of Java's category weight) is modeled, and only 6 of its 8 effects - the two
		//left out need a generic Regrowth/Freezing blob type this port has no infrastructure
		//for at all.
		const source = readSceneSource();
		for (const marker of [
			"pickCursedCommonEffect((bound) => Random.int(bound))",
			"effect === 'burnAndFreeze'",
			"effect === 'randomTeleport'",
			"effect === 'randomGas'",
			"effect === 'bubbles'",
			"effect === 'randomWand'",
		]) {
			assert.ok(source.includes(marker), `castCursedWandCommonEffect must branch on ${marker}`);
		}
		assert.ok(source.includes('addBuff(creature, \'ooze\')'), 'the SelfOoze fallthrough branch applies Ooze');
		assert.ok(source.includes("distances[this.level.index(creature.x, creature.y)]"),
			'SelfOoze reads a walkable-distance flood from the caster, not a raw radius');
	});
	check('castCursedWandUncommonEffect ports all 8 of CursedWand.cursedZap\'s Uncommon effects', () => {
		const source = readSceneSource();
		for (const marker of [
			"pickCursedUncommonEffect((bound) => Random.int(bound))",
			"effect === 'healthTransfer'",
			"effect === 'geyser'",
			"effect === 'summonSheep'",
			"effect === 'levitate'",
		]) {
			assert.ok(source.includes(marker), `castCursedWandUncommonEffect must branch on ${marker}`);
		}
		assert.ok(source.includes('this.spawnSheep({ x: cx, y: cy }, 6)'), 'SummonSheep reuses the flock-trap spawn shape');
		assert.ok(source.includes("activateGeyserTrapFlow({"), 'Geyser reuses the ported geyser-trap flow');
		assert.ok(source.includes("addBuff(targetEligible ? target : this.hero, 'levitation')"), 'Levitate falls back to the caster when the target is ineligible');
		assert.ok(source.includes("if (!mob.fleeing) mob.lastSeen = { x: this.hero.x, y: this.hero.y };"), 'Alarm wakes mobs toward the caster');
		//AntiMagic.RESISTS lists CursedWand as a source class: HealthTransfer's damage half
		//must zero against a magicImmune victim while its heal half still lands (fixed 2026-09-21).
		assert.ok(source.includes('if (victim.magicImmune) return;'), 'HealthTransfer must RESISTS-gate its damage half only');
		assert.ok(source.includes("effect === 'alarm'"), 'Alarm must be an explicit branch, not the catch-all default');
		assert.ok(source.includes('this.manualPlants.set(plantCellIndex, kind)') && source.includes('this.placePortedFeature(plantCellIndex, kind)'),
			'RandomPlant reuses the same primitives the hero\'s own plantSeed action uses');
		assert.ok(source.includes("const rule = MWL_BOMB_RULES.standard;"), 'Explosion resolves through the standard bomb rule, matching ConjuredBomb');
		assert.ok(source.includes('applyBlastDamage(victim, Math.max(0, Random.normalRange(lo, hi)), false, context)'),
			'Explosion reuses applyBlastDamage rather than re-deriving the boss-hook edge cases');
		assert.ok(source.includes("effect === 'explosion'"), 'Explosion must be an explicit branch, not the catch-all default');
		assert.ok(source.includes('applyBlastDamage(victim, Math.max(0, Random.normalRange(lo, hi)), true, context)'),
			'LightningBolt reuses applyBlastDamage with pierceArmor true (Electricity source)');
		assert.ok(source.includes("if (victim.isHero) reigniteBuff(this.hero, 'recharging');"), 'LightningBolt grants Recharging to the hero additively');
		assert.ok(source.includes("if (victim.hp > 0) reigniteBuff(victim, 'paralysis');"), 'LightningBolt paralyzes every survivor, hero included');
	});
	check('castCursedWandEffect dispatches all three modeled tiers, and castCursedWandRareEffect ports MassInvuln + ConeOfColors + SheepPolymorph', () => {
		const source = readSceneSource();
		assert.ok(source.includes("if (tier === 'common') this.castCursedWandCommonEffect(target, cell);"), 'the tier dispatch must branch on common');
		assert.ok(source.includes("else if (tier === 'uncommon') this.castCursedWandUncommonEffect(target, cell);"), 'the tier dispatch must branch on uncommon');
		assert.ok(source.includes("else this.castCursedWandRareEffect(target, cell);"), 'the tier dispatch must fall through to rare');
		assert.ok(source.includes("addBuff(creature, 'invulnerability', 10)") && source.includes("addBuff(creature, 'bless')"),
			'MassInvuln grants every character Invulnerability 10 and a full Bless');
		assert.ok(source.includes("degrees: 90,") && source.includes("maxDistance: 8,"), 'ConeOfColors must build Java\'s exact 90-degree, 8-radius cone');
		assert.ok(source.includes("trace: (coneFrom, coneTo) => this.coneRay(coneFrom, coneTo, false),"),
			'ConeOfColors casts STOP_SOLID alone, so the ray must not stop at a character (coneRay\'s stopAtTarget: false)');
		assert.ok(source.includes("if (coneCell.x === this.hero.x && coneCell.y === this.hero.y) continue;"),
			'ConeOfColors excludes the caster\'s own cell from the affected set, matching Java\'s `if (cell == user.pos) continue;`');
		assert.ok(source.includes("Random.normalRange(5 + this.depth, 10 + this.depth * 2)"),
			'ConeOfColors damage must be Java\'s NormalIntRange(5 + scalingDepth(), 10 + scalingDepth()*2)');
		assert.ok(source.includes("victim.buffs['poison'] = Math.max(victim.buffs['poison'] ?? 0, 3 + Math.floor(this.depth / 2))"),
			'ConeOfColors poison branch must be Java\'s Poison.set(3 + scalingDepth()/2), which is a max-with-current write');
		assert.ok(source.includes("if (effect === 'sheepPolymorph') {"), 'SheepPolymorph must be an explicit branch, checked before MassInvuln/ConeOfColors');
		assert.ok(source.includes('!target.isHero && !target.isNPC'), 'SheepPolymorph must refuse the hero and NPCs, matching Java\'s valid() gate');
		assert.ok(source.includes('!BOSS_KINDS.has(target.kind) && !MINIBOSS_KINDS.has(target.kind)'), 'SheepPolymorph must refuse bosses and minibosses');
		assert.ok(source.includes('this.spawnSheep(at, 10)'), 'SheepPolymorph must spawn Java\'s 10-turn Sheep at the destroyed target\'s cell');
		assert.ok(source.includes('this.creatures.splice(this.creatures.indexOf(target), 1)') && source.includes('this.spriteFor.delete(target.id)'),
			'SheepPolymorph must silently remove the target (no death, no loot), matching destroyAlly\'s own teardown shape');
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
		//The frost leg (`ElementalBlast.java`, tag `v3.3.8`) is a direct
		//`Buff.affect(mob, Frost.class, effectMulti*Frost.DURATION)` - Frost, not
		//Chill - with Burning/Chill detach and paralysis. dungeonScene.ts cannot
		//load in this harness (Pixi), so the call site is pinned at source level.
		const blastSource = readSceneSource();
		assert.match(blastSource, /addBuff\(mob, 'frost', elementalBlastFrostDuration\(multi\)\)/,
			'the blast frost leg must apply Frost, not Chill');
		assert.doesNotMatch(blastSource, /addBuff\(mob, 'chill', elementalBlastFrostDuration/,
			'the old chill-routed frost leg must be gone');
		assert.match(blastSource, /delete mob\.buffs\['burning'\];\n\t\t\t\taddBuff\(mob, 'frost', elementalBlastFrostDuration\(multi\)\)/,
			'the blast must detach Burning around the Frost attach');
		assert.match(blastSource, /mob\.buffs\['paralysis'\] = Math\.max\(mob\.buffs\['paralysis'\] \?\? 0, elementalBlastFrostDuration\(multi\)\)/,
			'the blast Frost must carry the paralysis clock');
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

	check('DeathMark re-marks stack, DoubleMark expires with the round, one NinjaLog stands', () => {
		//`DeathMark.activate()` (tag `v3.3.8`): `Buff.affect()` *spends* (additive) on an
		//existing tracker, so re-marking extends the window instead of refreshing it; the
		//`DoubleMarkTracker` is a 0.01-duration latch, so any clock advance - and any
		//save/load round trip - drops it, leaving same-round chaining as the only way to
		//spend the discount; and a new `NinjaLog` kills every existing one first.
		//dungeonScene.ts cannot load in this harness (Pixi), so this pins all three at
		//source level, the way the Spirit-Blades check above does.
		const source = readSceneSource();
		assert.match(source, /target\.deathMarkTurns = \(target\.deathMarkTurns \?\? 0\) \+ 5/,
			're-marking must extend the window, not reset it to 5');
		const clock = /advanceClock: \(\) => \{([\s\S]*?)\n\t\t\t\},/.exec(source);
		assert.ok(clock, 'spendHeroTurn still advances through advanceClock');
		assert.match(clock[1], /doubleMarkArmed = false/,
			'any clock advance must drop the DoubleMark latch');
		assert.doesNotMatch(source, /doubleMarkArmed = s\.doubleMarkArmed/,
			'the latch must not survive a save/load round trip');
		const log = /	placeNinjaLog\(this: DungeonScene[^)]*\)[^{]*\{([\s\S]*?)\n\t\}/.exec(source);
		assert.ok(log, 'placeNinjaLog still exists');
		assert.match(log[1], /allyKind === 'ninjaLog'/,
			'a new decoy must retire the existing ones first');
	});
	check('the AfterImage decoy takes no buffs and no direct blob damage', () => {
		//`Feint.AfterImage` (tag `v3.3.8`): `add(Buff)` returns false unconditionally and the
		//class carries the whole `BlobImmunity` set - the decoy exists to eat one attack, not
		//to burn, rot, or ride out gas. The buff half is behavioral (the real `addBuff`
		//through the real facade); the three direct-damage blob sites cannot load here
		//(scene/Pixi), so they are pinned at source level.
		const { addBuff } = require('./combat');
		const image = { kind: 'rat', allyKind: 'afterImage', buffs: {}, magicImmune: false };
		addBuff(image, 'burning');
		addBuff(image, 'terror');
		addBuff(image, 'poison');
		addBuff(image, 'paralysis');
		assert.deepEqual(image.buffs, {}, 'no buff sticks to the decoy');
		const rat = { kind: 'rat', buffs: {}, magicImmune: false };
		addBuff(rat, 'burning');
		assert.ok(rat.buffs['burning'] > 0, 'control: the base kind still burns');
		const source = readSceneSource();
		assert.match(source, /isToxicImmune: \(target\) =>[\s\S]{0,500}afterImage/,
			'toxic gas must skip the decoy');
		assert.match(source, /applyCorrosion: \(target, strength\) => \{[\s\S]{0,200}afterImage/,
			'corrosive gas must skip the decoy');
		const blobs = readFileSync(new URL('../src/simulation/environmentalBlobs.ts', import.meta.url), 'utf8');
		assert.match(blobs, /cellsAbove\('electricity'[\s\S]{0,600}afterImage/,
			'the electricity tick must skip the decoy');
	});
	check('WarpBeacon placement dispels invisibility like the recall halves', () => {
		//`WarpBeacon.activate()` (tag `v3.3.8`) calls `Invisibility.dispel()` on placement
		//as well as on recall - it is not one of the two abilities that skip it.
		//dungeonScene.ts cannot load in this harness (Pixi), so this pins the placement
		//half at source level.
		const source = readSceneSource();
		const place = /	placeWarpBeacon\(this: DungeonScene[^)]*\)[^{]*\{([\s\S]*?)\n\t\}/.exec(source);
		assert.ok(place, 'placeWarpBeacon still exists');
		assert.match(place[1], /delete this\.hero\.buffs\['invisibility'\]/,
			'placing the beacon must dispel invisibility');
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
	check("a hero execute (Combined Lethality or Assassin Preparation KO) suppresses BruteRage revival", () => {
		//`Char.hit()` (tag `v3.3.8`) runs the identical `enemy.HP = 0` + `BruteRage.detach()`
		//block for both execute paths - fixed 2026-09-21, this port's own suppression used
		//to cover only Combined Lethality, letting an Assassin KO still trigger the revive.
		const source = readSceneSource();
		assert.match(source, /const heroExecuted = attacker === this\.hero && \(combinedLethality \|\| assassinLethality\)/,
			'the suppression flag must cover both execute paths, not just Combined Lethality');
		assert.match(source, /!defender\.hasRaged && !heroExecuted/,
			'the Brute/ArmoredBrute revival gate must read the combined flag');
	});
	check('a consumed Spirit Blades tracker runs the bow nature-proc, never bonus damage', () => {
		//`Talent.onAttackProc` (Talent.java 896-901, tag `v3.3.8`): with the tracker armed a
		//landed hero attack rolls `Int(10) < 3*SPIRIT_BLADES` for `bow.proc()` - the SpiritBow
		//nature block (plant roll + kill-extend) - detaching the tracker on a success.
		//dungeonScene.ts cannot load in this harness (Pixi), so this pins the two call-site
		//halves at source level: the consume branch must reach `applyNaturesPowerOnHit`, and
		//the old `x1.1` damage stand-in (Java's `+0.1` lives in
		//`Enchantment.genericProcChanceMultiplier`, a proc-chance term - and is unreachable
		//anyway, since a rank-4 `Int(10) < 12` roll always consumes the tracker before
		//`wep.proc` runs) must be gone.
		const source = readSceneSource();
		const consume = /const spiritBladesProc = [\s\S]*?;\n([\s\S]*?)\n\t\tconst affix/.exec(source);
		assert.ok(consume, 'the tracker-consume block still exists');
		assert.match(consume[1], /applyNaturesPowerOnHit\(defender\)/,
			'a consumed tracker must run the bow nature-proc');
		assert.doesNotMatch(source, /damageMultiplier \*= 1\.1/,
			'the invented x1.1 spirit-blades damage bonus must be gone');
	});
}
