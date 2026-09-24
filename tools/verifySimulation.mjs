import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { verifyCombat } from './verifyCombat.mjs';
import { verifyMovement } from './verifyMovement.mjs';
import { verifyHeroTurn } from './verifyHeroTurn.mjs';
import { verifyHeroActions } from './verifyHeroActions.mjs';
import { verifySearch } from './verifySearch.mjs';
import { verifyCone } from './verifyCone.mjs';
import { verifyRipperLeap } from './verifyRipperLeap.mjs';
import { verifyActorCollision } from './verifyActorCollision.mjs';
import { verifyCombatRolls } from './verifyCombatRolls.mjs';
import { verifySuccubusBlink } from './verifySuccubusBlink.mjs';
import { verifyArmorAbilities } from './verifyArmorAbilities.mjs';
import { verifyRings } from './verifyRings.mjs';
import { verifyPrismatic } from './verifyPrismatic.mjs';
import { verifyBrews } from './verifyBrews.mjs';
import { verifySmoke } from './verifySmoke.mjs';
import { verifyDoors } from './verifyDoors.mjs';
import { verifyShakes } from './verifyShakes.mjs';
import { verifyParticles } from './verifyParticles.mjs';
import { verifyProjectiles } from './verifyProjectiles.mjs';
import { verifyClericSpells } from './verifyClericSpells.mjs';
import { verifyGnollMine } from './verifyGnollMine.mjs';
import { verifyParalysisOrdering } from './verifyParalysisOrdering.mjs';
import { verifyTrinitySpirit } from './verifyTrinitySpirit.mjs';
import { verifyTrinitySpiritRing } from './verifyTrinitySpiritRing.mjs';
import { readSceneSource } from './sceneSource.mjs';

// Compile the actual implementation into a private temporary CommonJS tree. Type-only
// mwg imports disappear, so tests never load Pixi, a DOM, or the full framework barrel.
// Type checking remains npm run check's responsibility; no extra test dependency needed.
const output = mkdtempSync(join(tmpdir(), 'spd-simulation-'));
let passed = 0;
function check(name, run) {
	run();
	passed++;
	console.log(`PASS ${name}`);
}
function compile(source, destination) {
	const file = join(output, destination);
	mkdirSync(dirname(file), { recursive: true });
	writeFileSync(file, ts.transpileModule(readFileSync(source, 'utf8'), {
		compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, rewriteRelativeImportExtensions: true },
	}).outputText);
}

try {
	writeFileSync(join(output, 'package.json'), '{"type":"commonjs"}');
	for (const file of ['simulation/movement', 'simulation/heroTurn', 'simulation/hunger', 'simulation/turns', 'adapters/sceneSimulation',
		'adapters/hungerSimulation', 'simulation/random', 'simulation/combatState', 'simulation/mwlBuffDurations', 'simulation/mwlStatusImmunities', 'simulation/mwlMonsterImmunities', 'simulation/mwlMonsterStateStats', 'simulation/buffs', 'simulation/combat', 'simulation/entityId', 'talentEffects',
		'adapters/combatSimulation', 'adapters/mwgRandom', 'combat', 'simulation/heroActions', 'adapters/heroActionSimulation', 'adapters/heroActions',
	'simulation/search', 'adapters/searchSimulation', 'adapters/movementSimulation', 'simulation/attackResolution', 'adapters/attackSimulation', 'simulation/warriorAbilities', 'simulation/huntressAbilities', 'simulation/duelistAbilities', 'simulation/mageAbilities', 'simulation/rogueAbilities', 'simulation/ratmogrify', 'talents', 'armorAbilities', 'simulation/tenguAbility', 'simulation/tenguBeam', 'simulation/gooBoss', 'simulation/ratKingBoss', 'simulation/dm300Boss', 'simulation/gnollGeomancer', 'simulation/yogBoss', 'simulation/defenderDamageCurves', 'simulation/preparation', 'simulation/disintegration', 'items/wands', 'items/missiles', 'mechanics/cone', 'dungeonConstants',
	'simulation/javaBlob', 'simulation/fireSpread', 'simulation/environmentalBlobs', 'simulation/wraith', 'simulation/plantPools', 'simulation/plantDrops', 'simulation/plantTriggers', 'simulation/teleport', 'simulation/teleportAppear', 'simulation/timeBubble', 'simulation/targeting', 'simulation/ripperLeap', 'simulation/succubusBlink', 'simulation/prismatic', 'simulation/mirrorImage', 'simulation/sentryTurn', 'simulation/brews', 'simulation/levelPopulation', 'simulation/smoke', 'simulation/deathBursts', 'simulation/pourAuras', 'simulation/skeletonExplosion', 	'simulation/ringKnow', 'simulation/actorCollision', 'simulation/wandering', 'simulation/zoomStep', 'simulation/chasmJump', 'simulation/spareWands', 'simulation/clericSpells', 'simulation/shockArc', 'simulation/geyserTrap', 'simulation/cursedWand', 'ui/buffOverlays', 'settings',
	// `actors/monsterSpawn` (plus its `monsters`/`challenges`/i18n chain) for the spawn-profile
	// checks: the chaos-elemental roll, the rare-alt table, and the unported-mob absences.
	'monsters', 'challenges', 'i18n/index', 'i18n/portStrings', 'i18n/portMineStrings', 'i18n/languages', 'i18n/spdKeys', 'generated/spdMessages', 'items/artifacts', 'actors/monsterSpawn',
	// `dungeonConstants` and `items/wands` read the MWL item tables, so the harness compiles the
	// real adapter and the real generated catalogue instead of a hand-copied stub of them - a stub
	// is how the old, hand-listed framework set above drifted once already, and how the item-frame
	// table silently lost a ground kind the moment the game's union grew one.
	'generated/mwlContent', 'mwlContent', 'items/ringModifiers',
	// The five per-domain adapters are thin facades over this shared runtime module.
	'adapters/gameSimulation']) {
		compile(new URL(`../src/${file}.ts`, import.meta.url), `${file}.js`);
	}
	compile(new URL('../src/simulation/highGrass.ts', import.meta.url), 'simulation/highGrass.js');
	// The framework half of the harness is the INSTALLED package - the same
	// `@datamoc/mw_games` build the game itself ships - rather than a sibling checkout of the
	// framework's sources. The two are different versions in general (the checkout is typically
	// ahead), so compiling a checkout would exercise something this port does not depend on.
	//
	// mwg's dist is ESM and this temporary tree is CommonJS; `require()` bridges that directly on
	// Node >= 22.12, and none of these modules use top-level await. Shim rather than compile, so
	// the harness follows whatever the package re-exports: the previous hand-listed set silently
	// missed `Campaign.ts` once the framework's `simulation/index.ts` grew it, leaving an
	// `index.js` that required a file never emitted and failing the suite.
	const dist = fileURLToPath(new URL('../node_modules/mwg/dist/', import.meta.url));
	function shim(destination, source) {
		const file = join(output, destination);
		mkdirSync(dirname(file), { recursive: true });
		writeFileSync(file, `module.exports = require(${JSON.stringify(source)});\n`);
	}
	shim('scheduler.js', join(dist, 'roguelike', 'Scheduler.js'));
	shim('random.js', join(dist, 'core', 'Random.js'));
	shim(join('node_modules', 'mwg', 'roguelike', 'Scheduler.js'), join(dist, 'roguelike', 'Scheduler.js'));
	shim(join('node_modules', 'mwg', 'core', 'Random.js'), join(dist, 'core', 'Random.js'));
	shim(join('node_modules', 'mwg', 'simulation', 'index.js'), join(dist, 'simulation', 'index.js'));
	// `src/mwlContent.ts` reads the generated catalogue through the framework's own
	// `contentCatalog`, so the harness needs that one entry point too - shimmed from the installed
	// package, exactly like the rest of the framework half.
	shim(join('node_modules', 'mwg', 'mwl', 'index.js'), join(dist, 'mwl', 'index.js'));
	// The adapters take only `Random`/`Generator` from the barrel, so nothing rendering-side is
	// pulled in; the real namespace module is re-exported under the barrel's own names.
	mkdirSync(join(output, 'node_modules', 'mwg'), { recursive: true });
	writeFileSync(join(output, 'node_modules', 'mwg', 'index.js'),
		`const random = require(${JSON.stringify(join(dist, 'core', 'Random.js'))}); exports.Random = random; exports.Generator = random.Generator; exports.I18n = require(${JSON.stringify(join(dist, 'i18n', 'index.js'))}); exports.Roguelike = require(${JSON.stringify(join(dist, 'roguelike', 'index.js'))});\n`);
	const require = createRequire(join(output, 'tests.cjs'));
	const { advanceHunger, advanceWellFed, exertHunger } = require('./simulation/hunger');
	const { runHungerStep } = require('./adapters/hungerSimulation');
	const { runMovement } = require('./adapters/movementSimulation');
	const { resolveAttack } = require('./simulation/attackResolution');
	const { runAttackResolution } = require('./adapters/attackSimulation');
	const { stepTenguAbility, tenguTargetAbilityUses, tenguAbilityCost } = require('./simulation/tenguAbility');
	const { planDisintegration } = require('./simulation/disintegration');
	const { wandTypeFromSource, wandTargetRange, wandChargesPerCast, livingEarthZapRange } = require('./items/wands');
	const { runUntilHeroInput } = require('./adapters/sceneSimulation');
	const { SceneSimulationAdapter } = require('./adapters/sceneSimulation');
	const { trampleHighGrass } = require('./simulation/highGrass');
	const { evolveElectricity, evolveJavaBlob } = require('./simulation/javaBlob');
	const { planFireSpread } = require('./simulation/fireSpread');
	const { planMonsterPopulation } = require('./simulation/levelPopulation');
	const { wraithCombatStats, dustSpawnerStep, dustSpawnerCap } = require('./simulation/wraith');
const { grantSungrassHealth, tickSungrassHealth, grantEarthrootArmor, absorbEarthrootArmor } = require('./simulation/plantPools');
const { plantDropCandidates, plantDropCount } = require('./simulation/plantDrops');
const { runHeroPlantEffect, runMobPlantEffect } = require('./simulation/plantTriggers');
const { TIME_BUBBLE_TURNS: MOB_BUBBLE_TURNS } = require('./simulation/timeBubble');
const { teleportCandidates, disarmBubblePresses } = require('./simulation/teleport');
const { teleportAppearPlan } = require('./simulation/teleportAppear');
const { selectRangedTarget, findEnemyAlly, pursueTarget } = require('./simulation/targeting');
	const { TIME_BUBBLE_TURNS, timeBubbleTurnCost, spendTimeBubbleTurn } = require('./simulation/timeBubble');
	const { CIRCLE8_OFFSETS, wanderBlocked, isPatrolTargetValid, randomPatrolDestination } = require('./simulation/wandering');
	const { skeletonBoneExplosionDamage } = require('./simulation/skeletonExplosion');
	const { applyEnvironmentalBlobs, spreadSacrificialFire, sacrificeCost, processSacrifice } = require('./simulation/environmentalBlobs');
	check('Skeleton bone explosion subtracts two defender rolls and clamps at zero', () => {
		assert.equal(skeletonBoneExplosionDamage(12, 2, 3), 7);
		assert.equal(skeletonBoneExplosionDamage(6, 4, 4), 0);
	});
	// The four coefficients `HighGrass.trample` reads, as the port's MWL rows carry them.
	const grassRules = { seedChanceBase: 25, seedChancePerLevel: 4, dewChanceBase: 6, dewChanceLevelDivisor: 2 };
	check('Huntress furrows high grass before clearing it without drops', () => {
		assert.deepEqual(trampleHighGrass('high', true, grassRules), { next: 'furrowed', rollDrops: false, drops: null });
		assert.deepEqual(trampleHighGrass('furrowed', true, grassRules), { next: 'furrowed', rollDrops: false, drops: null });
		assert.deepEqual(trampleHighGrass('furrowed', false, grassRules), { next: 'plain', rollDrops: false, drops: null });
		assert.deepEqual(trampleHighGrass('high', false, grassRules), {
			next: 'plain', rollDrops: true, drops: { seedChance: 1 / 25, dewChance: 1 / 6 },
		});
	});
	check('grass loot scales with Sandals of Nature, and a cursed pair suppresses it', () => {
		// Java's own table: seed `1/(25 - 4*naturalismLevel)`, dew `1/(6 - naturalismLevel/2)`.
		// naturalismLevel is `itemLevel()+1`, so the artifact's 0..3 levels give 1..4.
		for (const [level, seedDenominator, dewDenominator] of [[1, 21, 5.5], [2, 17, 5], [3, 13, 4.5], [4, 9, 4]]) {
			const { drops } = trampleHighGrass('high', false, grassRules, { naturalismLevel: level });
			assert.equal(drops.seedChance, 1 / seedDenominator, `seed chance at naturalismLevel ${level}`);
			assert.equal(drops.dewChance, 1 / dewDenominator, `dew chance at naturalismLevel ${level}`);
		}
		// Cursed footwear: Java sets `naturalismLevel = -1` and skips the whole drop block, while
		// still returning through its ordinary trample path.
		assert.deepEqual(trampleHighGrass('high', false, grassRules, { naturalismLevel: -1 }), {
			next: 'plain', rollDrops: true, drops: null,
		});
		// A GRASS-feeling floor halves the dew chance and nothing else.
		const grassy = trampleHighGrass('high', false, grassRules, { naturalismLevel: 2, grassFeeling: true });
		assert.equal(grassy.drops.seedChance, 1 / 17);
		assert.equal(grassy.drops.dewChance, 1 / 10);
	});
	check('Sandals roots activate Java empty-cell plant effects', () => {
		const hazards = readFileSync(new URL('../src/scenes/dungeon/actorTurnsHazards.ts', import.meta.url), 'utf8');
		const quickslot = readFileSync(new URL('../src/scenes/dungeon/hero/inventoryQuickslot.ts', import.meta.url), 'utf8');
		assert.ok(hazards.includes('triggerEmptyPlantAt'), 'the scene has an empty-cell plant trigger');
		for (const effect of ["case 'firebloom': this.fire.seed(x, y, 2)", "case 'rotberry': this.plantGas.seed(x, y, 100)", "case 'dewcatcher': this.dropPlantNeighbourLoot(x, y, 3, 6, 'dew')", "case 'seedpod': this.dropPlantNeighbourLoot(x, y, 2, 4, 'seed')"]) {
			assert.ok(hazards.includes(effect), `empty-cell effect is wired: ${effect}`);
		}
		assert.ok(quickslot.includes('else scene.triggerEmptyPlantAt(cell.x, cell.y)'), 'an empty root dispatches the null-Char path');
	});
	check('Health well satiates like Java instead of force-feeding hunger', () => {
		//`WaterOfHealth.affectHero()` (tag `v3.3.8`) runs `buff(Hunger).satisfy(STARVING)`,
		//i.e. hunger minus 450 floored at zero - never a jump toward HUNGRY.
		const hazards = readFileSync(new URL('../src/scenes/dungeon/actorTurnsHazards.ts', import.meta.url), 'utf8');
		assert.match(hazards, /this\.hunger = Math\.max\(0, this\.hunger - STARVING\)/);
	});
	check('Java blob evolution diffuses through four neighbours and loses one volume', () => {
		const before = new Array(25).fill(0);
		before[12] = 5;
		const next = evolveJavaBlob(5, 5, before, () => false);
		assert.equal(next[12], 4);
		for (const cell of [7, 11, 13, 17]) assert.equal(next[cell], 1);
		assert.equal(next[0], 0);
		const blocked = evolveJavaBlob(5, 5, before, (x, y) => x === 2 && y === 1);
		assert.equal(blocked[7], 0);
	});
	check('Fire extinguishes frozen cells and never ignites them', () => {
		//`Fire.evolve()` (`Fire.java`, tag `v3.3.8`): a burning frozen cell goes
		//out outright (`freeze.clear`, `off = cur = 0`, no burn, no destroy) and a
		//frozen empty cell never ignites. The `isFrozen` tail carries Java's
		//`freeze.volume > 0 && freeze.cur[cell] > 0`; 5x5, seed at (2,2) = cell 12.
		const seed = (volume) => Object.assign(new Array(25).fill(0), { 12: volume });
		const at = (plan, x, y) => plan.burning.some((c) => c.x === x && c.y === y);
		const out = (plan, x, y) => plan.burntOut.some((c) => c.x === x && c.y === y);
		//Legacy shape (no frost): the seed ages 5->4 and lights its ring at 4.
		const plain = planFireSpread(5, 5, seed(5), () => true);
		assert.equal(plain.next[12], 4);
		for (const cell of [7, 11, 13, 17]) assert.equal(plain.next[cell], 4);
		//A frozen burning cell goes out: no burn record, no destroy record, and a
		//frost-clear record for the scene (`freeze.clear(cell)` in Java)...
		const doused = planFireSpread(5, 5, seed(5), () => true, (x, y) => x === 2 && y === 2);
		assert.equal(doused.next[12], 0);
		assert.equal(at(doused, 2, 2), false);
		assert.equal(out(doused, 2, 2), false);
		assert.deepEqual(doused.extinguished, [{ x: 2, y: 2 }]);
		assert.deepEqual(plain.extinguished, []);
		//Java's mutable x-major/y-minor cur scan can ignite an already-visited neighbor
		//before it douses the source, but later neighbors do not see that source. Deliberately
		//drop the whole source in this port so fire does not spread asymmetrically from a cell
		//Freezing extinguishes.
		for (const cell of [7, 11, 13, 17]) assert.equal(doused.next[cell], 0);
		//A frozen empty cell never ignites even beside fire.
		const held = planFireSpread(5, 5, seed(5), () => true, (x, y) => x === 2 && y === 1);
		assert.equal(held.next[7], 0);
		assert.equal(at(held, 2, 1), false);
		//An unfrozen ember (volume 1) burns out with a destroy record; frozen, silently.
		const ember = planFireSpread(5, 5, seed(1), () => true);
		assert.equal(ember.next[12], 0);
		assert.equal(at(ember, 2, 2), true);
		assert.equal(out(ember, 2, 2), true);
		const coldEmber = planFireSpread(5, 5, seed(1), () => true, () => true);
		assert.equal(coldEmber.next[12], 0);
		assert.equal(at(coldEmber, 2, 2), false);
		assert.equal(out(coldEmber, 2, 2), false);
		//The live scene must pass the frost predicate and apply the planner's
		//extinguished cells; otherwise the pure planner pin would not protect
		//the actual turn loop.
		const scene = readSceneSource();
		assert.ok(scene.includes('this.plantFreeze.volumeAt(x, y) > 0'), 'scene reads Freezing for fire evolution');
		assert.ok(scene.includes('for (const cell of plan.extinguished) this.plantFreeze.clear(cell.x, cell.y)'),
			'scene clears frost where fire extinguishes it');
	});
	check('mob population carries Java roster, rare table and count rules', () => {
		//`MobSpawner.addRareMobs()`/`swapMobAlts()` plus `RegularLevel.mobLimit()`
		//and the floor-1 eight (`createMobs`), all tag `v3.3.8`. The framework roll
		//is stubbed to capture the entries; only the plan shape is pinned here.
		let seen = null;
		const roguelike = { rollRoster: (regular, rare) => { seen = { regular, rare }; return { roster: regular.map((e) => e.value) }; } };
		const plan = planMonsterPopulation(4, ['rat', 'crab'], false, { int: () => 0 }, roguelike);
		assert.deepEqual(plan.roster, ['rat', 'crab']);
		//Depth 4 adds the Thief at 0.025 (9: Bat, 14: Ghoul, 19: Succubus).
		assert.deepEqual(seen.rare, [{ value: 'thief', chance: 0.025 }]);
		//The runtime roster now carries the two Java rare alternatives as well;
		//the pure population planner still receives the already-rolled roster.
		assert.deepEqual(seen.regular, [
			{ value: 'rat', alternative: { value: 'albino', chance: 1 / 50 } },
			{ value: 'crab', alternative: { value: 'hermitCrab', chance: 1 / 50 } },
		]);
		for (const [depth, mob, chance] of [[9, 'bat', 0.025], [14, 'ghoul', 0.025], [19, 'succubus', 0.025]]) {
			planMonsterPopulation(depth, [], false, { int: () => 0 }, roguelike);
			assert.deepEqual(seen.rare, [{ value: mob, chance }]);
		}
		planMonsterPopulation(5, [], false, { int: () => 0 }, roguelike);
		assert.deepEqual(seen.rare, []);
		//Counts: floor-1 eight; 3 + depth%5 + Int(3); LARGE ceils 1.33x.
		const count = (depth, large, roll) => planMonsterPopulation(depth, [], large, { int: () => roll }, roguelike).count;
		assert.equal(count(1, false, 0), 8);
		assert.equal(count(6, false, 0), 4);
		assert.equal(count(6, true, 0), 6);
		assert.equal(count(2, false, 2), 7);
	});
	check('Electricity conducts full power through connected water, then loses one volume', () => {
		//5x5: water is the middle row plus a cell below its centre; the seed sits dry above.
		const isWater = (x, y) => (y === 2 && x >= 0 && x <= 4) || (x === 2 && y === 3);
		const before = new Array(25).fill(0);
		before[7] = 10;
		const next = evolveElectricity(5, 5, before, isWater);
		//The dry seed keeps its own charge minus one; every connected water cell
		//conducts the full 10 first, so all read 9 after the decrement.
		assert.equal(next[7], 9);
		for (const cell of [10, 11, 12, 13, 14, 17]) assert.equal(next[cell], 9);
		//Dry cells off the water stay uncharged, and diagonal water never conducts.
		assert.equal(next[0], 0);
		assert.equal(next[6], 0);
		assert.equal(next[8], 0);
	});
	check('TimeBubble ownership absorbs the owner\'s own clock and clears after seven turns', () => {
		assert.equal(TIME_BUBBLE_TURNS, 7);
		//A bubble owner costs 0 scheduler clock; everyone else pays the base cost.
		assert.equal(timeBubbleTurnCost(7, 1), 0);
		assert.equal(timeBubbleTurnCost(1, 1), 0);
		assert.equal(timeBubbleTurnCost(undefined, 1), 1);
		assert.equal(timeBubbleTurnCost(0, 2.5), 2.5);
		//Each own-turn spends one bubble turn; the last spend clears the bubble.
		assert.equal(spendTimeBubbleTurn(7), 6);
		assert.equal(spendTimeBubbleTurn(2), 1);
		assert.equal(spendTimeBubbleTurn(1), undefined);
		assert.equal(spendTimeBubbleTurn(undefined), undefined);
		//Seven absorbed spends end exactly where the eighth would overdraw.
		let turns = TIME_BUBBLE_TURNS;
		let acts = 0;
		while (turns !== undefined) { assert.equal(timeBubbleTurnCost(turns, 1), 0); turns = spendTimeBubbleTurn(turns); acts++; }
		assert.equal(acts, 7);
		assert.equal(timeBubbleTurnCost(turns, 1), 1);
	});
	check('Electricity never diffuses into dry cells and dies out by one per turn', () => {
		const dry = new Array(25).fill(0);
		dry[12] = 3;
		const next = evolveElectricity(5, 5, dry, () => false);
		assert.equal(next[12], 2);
		for (const cell of [7, 11, 13, 17]) assert.equal(next[cell], 0);
		const spent = evolveElectricity(5, 5, next, () => false);
		assert.equal(spent[12], 1);
		const gone = evolveElectricity(5, 5, spent, () => false);
		assert.equal(gone[12], 0);
	});
	check('Wraith.adjustStats scales accuracy, evasion and damage with the spawn level', () => {
		assert.deepEqual(wraithCombatStats(0), { accuracy: 10, evasion: 50, damageMin: 1, damageMax: 2 });
		assert.deepEqual(wraithCombatStats(1), { accuracy: 11, evasion: 55, damageMin: 1, damageMax: 3 });
		//The +1 runs after Java's integer division: level 2 already rolls 2-4.
		assert.deepEqual(wraithCombatStats(2), { accuracy: 12, evasion: 60, damageMin: 2, damageMax: 4 });
		assert.deepEqual(wraithCombatStats(9), { accuracy: 19, evasion: 95, damageMin: 5, damageMax: 11 });
	});
	check('CorpseDust spawner banks one power per tick toward min(49, wraiths^2)', () => {
		assert.deepEqual(dustSpawnerStep(0, 0), { power: 0, spawn: true, cost: 1 });
		assert.deepEqual(dustSpawnerStep(0, 1), { power: 1, spawn: false, cost: 4 });
		assert.deepEqual(dustSpawnerStep(3, 1), { power: 0, spawn: true, cost: 4 });
		assert.deepEqual(dustSpawnerStep(48, 7), { power: 0, spawn: true, cost: 49 });
		assert.deepEqual(dustSpawnerStep(0, 8), { power: 1, spawn: false, cost: 49 });
		assert.equal(dustSpawnerCap(30, 1), 4, 'with no candidate the bank caps at 2*wraiths');
		assert.equal(dustSpawnerCap(3, 1), 3);
	});
	check('Sungrass.Health boosts additively and pays out (40+HT)/150 per turn', () => {
	assert.deepEqual(grantSungrassHealth(undefined, 20), { level: 20, partial: 0 });
	//`boost()` is additive, never keep-max, and keeps the fractional carry.
	assert.deepEqual(grantSungrassHealth({ level: 5, partial: 0.5 }, 20), { level: 25, partial: 0.5 });
	//HT 110 accrues exactly 1.0/turn: the first turn banks the carry without healing.
	assert.deepEqual(tickSungrassHealth({ level: 110, partial: 0 }, 110, 50, false), { pool: { level: 110, partial: 1 }, healed: 0 });
	//A carry landing exactly on 1.0 heals nothing - Java's gate is a strict `> 1`.
	const payout = tickSungrassHealth({ level: 110, partial: 1 }, 110, 50, false);
	assert.deepEqual(payout, { pool: { level: 108, partial: 0 }, healed: 2 });
	//The HP gain caps at what is missing, but the pool still drains the whole tick.
	assert.deepEqual(tickSungrassHealth({ level: 110, partial: 1 }, 110, 1, false), { pool: { level: 108, partial: 0 }, healed: 1 });
	//Exhaustion ends the buff.
	assert.deepEqual(tickSungrassHealth({ level: 1, partial: 1 }, 110, 50, false), { pool: null, healed: 2 });
	//Leaving the grant cell ends it with no parting tick.
	assert.deepEqual(tickSungrassHealth({ level: 110, partial: 1 }, 110, 50, true), { pool: null, healed: 0 });
});
check('Earthroot.Armor grants keep-max and absorbs min(damage, blocking) per hit', () => {
	assert.equal(grantEarthrootArmor(undefined, 20), 20);
	//`level()` keeps the higher pool, unlike Sungrass's additive boost.
	assert.equal(grantEarthrootArmor(25, 20), 25);
	assert.equal(grantEarthrootArmor(10, 20), 20);
	assert.deepEqual(absorbEarthrootArmor(20, 10, 5, false), { level: 15, damage: 5 });
	assert.deepEqual(absorbEarthrootArmor(20, 3, 5, false), { level: 17, damage: 0 });
	//The detaching hit still blocks the full cap, not just the remaining pool.
	assert.deepEqual(absorbEarthrootArmor(2, 10, 5, false), { level: null, damage: 5 });
	//A moved owner detaches and takes the hit whole.
	assert.deepEqual(absorbEarthrootArmor(20, 10, 5, true), { level: null, damage: 10 });
});
check('the moved hero plant-effect switch fires every branch', () => {
	//Drive of `runHeroPlantEffect` (the `triggerPortedPlantAt` hero half moved to
	//`simulation/plantTriggers.ts` in the file-size refactor): a recording fake scene
	//with key-echo `t` and real `Roguelike` offsets. Effect routing and key selection
	//are asserted, not wording - except the two blindweed lines, which are hardcoded
	//literals in the source itself (pre-existing, moved verbatim).
	function drive(kind, overrides = {}, subclass = 'none') {
		const { heroBuffs, ...ctxOverrides } = overrides;
		const hero = { x: 1, y: 2, maxHp: 20, hp: 10, buffs: {} };
		if (heroBuffs) Object.assign(hero.buffs, heroBuffs);
		const rec = {
			said: [], grants: [], prolongs: [], foods: [], loots: [],
			freezes: [], gases: [], fires: [], hazards: [], shakes: [],
			armor: null, barkskin: null, bubble: null, cured: false, synced: false,
			healLeft: 0, healFlat: 0, sungrass: null, moved: null,
			travelCancelled: false, returned: false, teleports: [],
		};
		const ctx = {
			subclass: () => subclass,
			level: 12,
			depth: 12,
			say: (line, level) => { rec.said.push({ line, level }); },
			t: (key) => key,
			neighbour8: require('mwg').Roguelike.neighbourOffsets(8),
			grantBuff: (target, id, duration) => { rec.grants.push([id, duration]); target.buffs[id] = duration ?? 0; },
			prolongBuff: (target, id, duration) => { rec.prolongs.push([id, duration]); target.buffs[id] = duration ?? 0; },
			cureHero: () => { rec.cured = true; },
			spawnFood: (x, y) => { rec.foods.push([x, y]); },
			dropLoot: (x, y, min, max, lootKind) => { rec.loots.push([x, y, min, max, lootKind]); },
			seedFreeze: (x, y, volume) => { rec.freezes.push([x, y, volume]); },
			seedGas: (x, y, volume) => { rec.gases.push([x, y, volume]); },
			seedFire: (x, y, volume) => { rec.fires.push([x, y, volume]); },
			markHazardArea: (x, y) => { rec.hazards.push([x, y]); },
			passable: () => true,
			isVisible: () => true,
			shake: (intensity, duration) => { rec.shakes.push([intensity, duration]); },
			setEarthrootArmor: (level, pos) => { rec.armor = [level, pos]; },
			setBarkskin: (level, interval) => { rec.barkskin = [level, interval]; },
			setTimeBubble: (turns) => { rec.bubble = turns; },
			syncHero: () => { rec.synced = true; },
			healingLeft: () => rec.healLeft,
			setHealingLeft: (value) => { rec.healLeft = value; },
			healingFlat: () => rec.healFlat,
			setHealingFlat: (value) => { rec.healFlat = value; },
			sungrass: () => null,
			setSungrass: (level, partial, pos) => { rec.sungrass = [level, partial, pos]; },
			findTeleportCell: () => ({ x: 9, y: 9 }),
			cancelTravel: () => { rec.travelCancelled = true; },
			returnToPreviousFloor: () => { rec.returned = true; return true; },
			moveHero: (to) => { rec.moved = [to.x, to.y]; hero.x = to.x; hero.y = to.y; },
			showTeleport: (from, to) => { rec.teleports.push([[from.x, from.y], [to.x, to.y]]); },
			...ctxOverrides,
		};
		runHeroPlantEffect(kind, 3, 4, 7, hero, ctx);
		return { hero, rec };
	}
	//Sungrass banks the whole additive pool for anyone but a Warden.
	let r = drive('sungrass');
	assert.deepEqual(r.rec.sungrass, [20, 0, 7]);
	assert.equal(r.rec.said.length, 1);
	r = drive('sungrass', {}, 'warden');
	assert.equal(r.rec.sungrass, null);
	assert.equal(r.rec.healLeft, 20);
	assert.equal(r.rec.healFlat, 1);
	//Blandfruit (and its bush) drops exactly one food.
	for (const kind of ['blandfruit', 'blandfruitbush']) {
		r = drive(kind);
		assert.deepEqual(r.rec.foods, [[3, 4]], kind);
		assert.equal(r.rec.said.length, 1, kind);
	}
	//Starflower blesses anyone, and only a Warden recharges (both prolongs).
	r = drive('starflower');
	assert.deepEqual(r.rec.prolongs, [['bless', undefined]]);
	r = drive('starflower', {}, 'warden');
	assert.deepEqual(r.rec.prolongs, [['bless', undefined], ['recharging', undefined]]);
	//Dewcatcher/Seedpod scatter their own loot counts.
	r = drive('dewcatcher');
	assert.deepEqual(r.rec.loots, [[3, 4, 3, 6, 'dew']]);
	r = drive('seedpod');
	assert.deepEqual(r.rec.loots, [[3, 4, 2, 4, 'seed']]);
	//Earthroot pools max HP at the cell and shakes when the cell shows.
	r = drive('earthroot');
	assert.deepEqual(r.rec.armor, [20, 7]);
	assert.deepEqual(r.rec.shakes, [[1, 0.4]]);
	r = drive('earthroot', {}, 'warden');
	assert.deepEqual(r.rec.barkskin, [17, 5]);
	assert.equal(r.rec.armor, null);
	r = drive('earthroot', { isVisible: () => false });
	assert.deepEqual(r.rec.shakes, []);
	//Blindweed: a Warden turns invisible, everyone else is dazed and crippled.
	r = drive('blindweed');
	assert.deepEqual(r.rec.grants, [['daze', 10]], 'blindness arrives as daze for the whole Blindness.DURATION');
	assert.deepEqual(r.rec.prolongs, [['cripple', undefined]]);
	assert.ok(r.rec.said[0].line.includes('clouds your senses'));
	r = drive('blindweed', {}, 'warden');
	assert.deepEqual(r.rec.grants, [['invisibility', 10]]);
	assert.ok(r.rec.said[0].line.includes('shrouds you from sight'));
	//Fadeleaf detaches roots and teleports; without a cell it still says the line.
	r = drive('fadeleaf', { heroBuffs: { roots: 1 } });
	assert.equal(r.hero.buffs.roots, undefined, 'roots detach on the fadeleaf escape');
	assert.deepEqual(r.rec.moved, [9, 9]);
	assert.equal(r.rec.travelCancelled, true);
	assert.deepEqual(r.rec.teleports, [[[1, 2], [9, 9]]]);
	r = drive('fadeleaf', { heroBuffs: { roots: 1 } }, 'warden');
	assert.equal(r.rec.returned, true);
	assert.equal(r.rec.moved, null);
	assert.deepEqual(r.rec.teleports, []);
	r = drive('fadeleaf', { heroBuffs: { roots: 1 }, findTeleportCell: () => null });
	assert.equal(r.hero.buffs.roots, undefined, 'roots detach even with nowhere to go');
	assert.equal(r.rec.moved, null);
	assert.equal(r.rec.said.length, 1, 'the line still says with no destination');
	//Mageroyal runs the shared cure; Warden also receives the Java half-duration immunity.
	r = drive('mageroyal');
	assert.equal(r.rec.cured, true);
	assert.deepEqual(r.rec.grants, []);
	r = drive('mageroyal', {}, 'warden');
	assert.deepEqual(r.rec.grants, [['blobImmunity', undefined]]);
	//Icecap freezes all nine passable neighbours and marks the 3x3.
	r = drive('icecap');
	assert.equal(r.rec.freezes.length, 9);
	assert.ok(r.rec.freezes.every(([x, y, volume]) => volume === 2));
	assert.deepEqual(r.rec.hazards, [[3, 4]]);
	assert.deepEqual(r.rec.grants, []);
	r = drive('icecap', { passable: (x, y) => x !== 3 || y !== 4 });
	assert.equal(r.rec.freezes.length, 8, 'impassable neighbours seed nothing');
	r = drive('icecap', {}, 'warden');
	assert.deepEqual(r.rec.grants, [['frostImbue', undefined]]);
	//Rotberry gasses non-Wardens, surges Wardens.
	r = drive('rotberry');
	assert.deepEqual(r.rec.gases, [[3, 4, 100]]);
	assert.equal(r.rec.synced, false);
	r = drive('rotberry', {}, 'warden');
	assert.deepEqual(r.rec.gases, []);
	assert.deepEqual(r.rec.grants, [['adrenalineSurge', undefined]]);
	assert.equal(r.rec.synced, true);
	//Sorrowmoss sets the depth-scaled poison: 5 + round(2*12/3) = 13.
	r = drive('sorrowmoss');
	assert.deepEqual(r.rec.grants, [['poison', 13]]);
	//Firebloom always seeds fire; a Warden sheds burning and ignites the imbue.
	r = drive('firebloom');
	assert.deepEqual(r.rec.fires, [[3, 4, 2]]);
	r = drive('firebloom', {}, 'warden');
	assert.deepEqual(r.hero.buffs.burning, undefined);
	assert.deepEqual(r.rec.grants, [['fireImbue', undefined]]);
	//Stormvine levitates a Warden for 10, gives everyone else Vertigo.
	r = drive('stormvine', {}, 'warden');
	assert.deepEqual(r.rec.grants, [['levitation', 10]]);
	r = drive('stormvine');
	assert.deepEqual(r.rec.grants, [['vertigo', 10]], 'Stormvine grants the real Vertigo buff for the whole Vertigo.DURATION');
	//Swiftthistle banks seven bubble turns, plus one hasted turn for a Warden.
	r = drive('swiftthistle');
	assert.equal(r.rec.bubble, 7);
	assert.deepEqual(r.rec.grants, []);
	r = drive('swiftthistle', {}, 'warden');
	assert.deepEqual(r.rec.grants, [['haste', 1]]);
	//Anything unrecognized withers with no effect at all.
	r = drive('dreamfoil');
	assert.deepEqual(r.rec.grants, []);
	assert.deepEqual(r.rec.fires, []);
	assert.deepEqual(r.rec.gases, []);
	assert.equal(r.rec.said.length, 1);
});
check('the moved mob plant-effect switch fires every branch', () => {
	//Drive of `runMobPlantEffect` (the `triggerMobPlantAt` half moved to
	//`simulation/plantTriggers.ts` in the file-size refactor, fifth extraction):
	//a recording fake scene with real `Roguelike` offsets. Effect routing is
	//asserted, including the two orderings Java cares about (fadeleaf marks
	//before teleporting; sorrowmoss sets rather than prolongs).
	function driveMob(kind, overrides = {}) {
		const { presetBuffs, ...ctxOverrides } = overrides;
		const creature = {
			x: 5, y: 5, kind: 'rat', maxHp: 20, hp: 20, buffs: {}, seesHero: true,
		};
		if (presetBuffs) Object.assign(creature.buffs, presetBuffs);
		const rec = {
			grants: [], prolongs: [], fires: [], gases: [], freezes: [],
			hazards: [], areas: [], shakes: [], placed: [], teleports: [], patrols: [],
		};
		const ctx = {
			depth: 12,
			neighbour8: require('mwg').Roguelike.neighbourOffsets(8),
			grantBuff: (target, id, duration) => { rec.grants.push([id, duration]); target.buffs[id] = duration ?? 0; },
			prolongBuff: (target, id, duration) => { rec.prolongs.push([id, duration]); target.buffs[id] = duration ?? 0; },
			markHazardMob: (target) => { rec.hazards.push(target.kind); },
			markHazardArea: (x, y) => { rec.areas.push([x, y]); },
			patrolDestination: () => { rec.patrols.push(1); return { x: 0, y: 0 }; },
			findTeleportCell: () => ({ x: 8, y: 8 }),
			placeSprite: (target, x, y) => { rec.placed.push([target.kind, x, y]); },
			showTeleport: (from, to) => { rec.teleports.push([[from.x, from.y], [to.x, to.y]]); },
			seedFreeze: (x, y, volume) => { rec.freezes.push([x, y, volume]); },
			seedGas: (x, y, volume) => { rec.gases.push([x, y, volume]); },
			seedFire: (x, y, volume) => { rec.fires.push([x, y, volume]); },
			passable: () => true,
			isVisibleCell: () => true,
			shake: (intensity, duration) => { rec.shakes.push([intensity, duration]); },
			isImmovableKind: () => false,
			...ctxOverrides,
		};
		runMobPlantEffect(kind, 77, creature, ctx);
		return { creature, rec };
	}
	//Blindweed dazes, cripples, blinds to patrol and marks.
	let m = driveMob('blindweed');
	assert.deepEqual(m.rec.grants, [['daze', 10]]);
	assert.deepEqual(m.rec.prolongs, [['cripple', undefined]]);
	assert.equal(m.creature.seesHero, false);
	assert.deepEqual(m.creature.patrolTarget, { x: 0, y: 0 });
	assert.deepEqual(m.rec.hazards, ['rat']);
	//Firebloom seeds fire at the stepper and marks; rotberry gasses without marking.
	m = driveMob('firebloom');
	assert.deepEqual(m.rec.fires, [[5, 5, 2]]);
	assert.deepEqual(m.rec.hazards, ['rat']);
	m = driveMob('rotberry');
	assert.deepEqual(m.rec.gases, [[5, 5, 100]]);
	assert.deepEqual(m.rec.hazards, [], 'rotberry never marks its own gas');
	//Starflower prolongs bless; sorrowmoss SETS the depth-scaled poison and marks.
	m = driveMob('starflower');
	assert.deepEqual(m.rec.prolongs, [['bless', undefined]]);
	m = driveMob('sorrowmoss');
	assert.deepEqual(m.rec.grants, [['poison', 13]]);
	assert.deepEqual(m.rec.hazards, ['rat']);
	//Stormvine grants vertigo and marks.
	m = driveMob('stormvine');
	assert.deepEqual(m.rec.grants, [['vertigo', 10]]);
	assert.deepEqual(m.rec.hazards, ['rat']);
	//Icecap freezes all nine passable neighbours and marks the 3x3, with no status.
	m = driveMob('icecap');
	assert.equal(m.rec.freezes.length, 9);
	assert.ok(m.rec.freezes.every(([x, y, volume]) => volume === 2));
	assert.deepEqual(m.rec.areas, [[5, 5]]);
	assert.deepEqual(m.rec.grants, []);
	//Mageroyal detaches the cure list but never burning.
	m = driveMob('mageroyal', { presetBuffs: { poison: 3, burning: 4, blindness: 2 } });
	assert.deepEqual(m.creature.buffs, { burning: 4 }, 'the cure keeps burning burning');
	//Sungrass banks the additive pool on the stepper; earthroot keep-maxes its armor.
	m = driveMob('sungrass');
	assert.equal(m.creature.sungrassLevel, 20);
	assert.equal(m.creature.sungrassPos, 77);
	m = driveMob('earthroot');
	assert.equal(m.creature.earthrootArmorLevel, 20);
	assert.equal(m.creature.earthrootArmorPos, 77);
	assert.deepEqual(m.rec.shakes, [[1, 0.4]]);
	m = driveMob('earthroot', { isVisibleCell: () => false });
	assert.deepEqual(m.rec.shakes, []);
	//Swiftthistle banks the mob its own bubble turns, overwriting unconditionally.
	m = driveMob('swiftthistle');
	assert.equal(m.creature.timeBubbleTurns, MOB_BUBBLE_TURNS);
	//Fadeleaf marks first, then teleports body and sprite with presentation.
	m = driveMob('fadeleaf');
	assert.deepEqual([m.creature.x, m.creature.y], [8, 8]);
	assert.deepEqual(m.rec.placed, [['rat', 8, 8]]);
	assert.deepEqual(m.rec.teleports, [[[5, 5], [8, 8]]]);
	assert.deepEqual(m.rec.hazards, ['rat'], 'the mark lands before the teleport');
	//An immovable stepper is refused before the mark; a missing cell keeps the mark.
	m = driveMob('fadeleaf', { isImmovableKind: () => true });
	assert.deepEqual([m.creature.x, m.creature.y], [5, 5]);
	assert.deepEqual(m.rec.hazards, [], 'an unmoved mob is never marked');
	m = driveMob('fadeleaf', { findTeleportCell: () => null });
	assert.deepEqual([m.creature.x, m.creature.y], [5, 5]);
	assert.deepEqual(m.rec.hazards, ['rat']);
	//A kind with no mob branch is a silent no-op.
	m = driveMob('dewcatcher');
	assert.deepEqual(m.rec.grants, []);
	assert.deepEqual(m.rec.fires, []);
	assert.deepEqual(m.rec.gases, []);
});
check('the moved sacrificial-fire rule spreads, prices and pays out', () => {
	//Drive of `spreadSacrificialFire`/`sacrificeCost`/`processSacrifice` (moved to
	//`simulation/environmentalBlobs.ts` in the file-size refactor, seventh
	//extraction): a recording fake fire blob and prize triple at depth 12.
	function driveSacrifice(overrides = {}) {
		const state = {
			prize: { id: 'armor', quantity: 1 }, charge: 0, cell: 65,
			spreads: 0, volume: 0, rewards: [], said: [], resets: 0,
		};
		const ctx = {
			prize: () => state.prize,
			setPrize: (prize) => { state.prize = prize; },
			charge: () => state.charge,
			setCharge: (charge) => { state.charge = charge; },
			cell: () => state.cell,
			levelWidth: 32,
			depth: 12,
			fire: {
				spread: () => { state.spreads++; },
				volumeAt: () => state.volume,
			},
			resetFire: () => { state.resets++; state.volume = 0; },
			passable: () => true,
			monsterExp: () => 3,
			rollRange: () => 2,
			spawnReward: (prize, x, y) => { state.rewards.push([prize.id, x, y]); },
			say: (line, level) => { state.said.push({ line, level }); },
			t: (key) => key,
			...overrides,
		};
		return { state, ctx };
	}
	//Cost math: table exp times the 2-3 roll, with the three Java overrides.
	let s = driveSacrifice();
	assert.equal(sacrificeCost('rat', 0, s.ctx), 6, 'a plain mob costs table exp times the roll');
	assert.equal(sacrificeCost('statue', 0, s.ctx), 26, 'statues cost 1 + depth');
	assert.equal(sacrificeCost('mimic', 0, s.ctx), 26);
	assert.equal(sacrificeCost('piranha', 0, s.ctx), 14, 'piranhas cost 1 + half depth');
	assert.equal(sacrificeCost('swarm', 1, s.ctx), 2, 'split swarms cost a flat 1');
	assert.equal(sacrificeCost('swarm', 0, s.ctx), 6, 'an unsplit swarm costs the table');
	assert.equal(sacrificeCost(undefined, 0, s.ctx), 6, 'a kindless death costs the table too');
	//Spread runs only while a prize is banked and charge remains.
	s = driveSacrifice();
	s.state.charge = 10;
	spreadSacrificialFire(s.ctx);
	assert.equal(s.state.spreads, 1);
	s.state.prize = undefined;
	spreadSacrificialFire(s.ctx);
	assert.equal(s.state.spreads, 1, 'no prize, no spread');
	//A death outside the volume pays nothing; a partial payment banks no reward.
	s = driveSacrifice();
	s.state.charge = 10;
	s.state.volume = 0;
	processSacrifice({ x: 1, y: 2, kind: 'rat', generation: 0 }, s.ctx);
	assert.equal(s.state.charge, 10, 'outside the fire nothing is owed');
	s.state.volume = 5;
	processSacrifice({ x: 1, y: 2, kind: 'rat', generation: 0 }, s.ctx);
	assert.equal(s.state.charge, 4, 'a 6-cost death on 10 charge leaves 4');
	assert.deepEqual(s.state.rewards, []);
	//The paying death drops the prize at the prize cell, says the line, and resets.
	processSacrifice({ x: 1, y: 2, kind: 'rat', generation: 0 }, s.ctx);
	assert.deepEqual(s.state.rewards, [['armor', 1, 2]], 'cell 65 on a width-32 floor is (1, 2)');
	assert.deepEqual(s.state.said, [{ line: 'port.log.sacrificialfirereward', level: 'positive' }]);
	assert.equal(s.state.prize, undefined);
	assert.equal(s.state.charge, 0);
	assert.equal(s.state.resets, 1);
	//With no prize cell the reward lands on the stepper instead.
	s = driveSacrifice();
	s.state.charge = 6;
	s.state.volume = 5;
	s.state.cell = -1;
	processSacrifice({ x: 7, y: 7, kind: 'rat', generation: 0 }, s.ctx);
	assert.deepEqual(s.state.rewards, [['armor', 7, 7]]);
});
check('Dewcatcher/Seedpod drops avoid stairs and the entrance on distinct cells', () => {
	const ring = [];
	for (let i = 0; i < 8; i++) ring.push({ x: i, y: 0, passable: true, isChasm: false, isStairs: i === 2, isEntrance: i === 5 });
	assert.deepEqual(plantDropCandidates(ring), [
		{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 6, y: 0 }, { x: 7, y: 0 },
	]);
	//Impassable and chasm neighbours are out too, like Java's own passable test.
	assert.deepEqual(plantDropCandidates([
		{ x: 0, y: 0, passable: false, isChasm: false, isStairs: false, isEntrance: false },
		{ x: 1, y: 0, passable: true, isChasm: true, isStairs: false, isEntrance: false },
		{ x: 2, y: 0, passable: true, isChasm: false, isStairs: false, isEntrance: false },
	]), [{ x: 2, y: 0 }]);
});
check('Dewcatcher/Seedpod counts roll triangular like NormalIntRange', () => {
	//The roll delegates to the triangular distribution with the same bounds, never the flat one.
	let seen = null;
	const stub = { normalRange: (min, max) => { seen = [min, max]; return min; } };
	assert.equal(plantDropCount(3, 6, stub), 3);
	assert.deepEqual(seen, [3, 6]);
	//Shape check against the real distribution: middles outweigh ends ~3:1, uniform would tie.
	const { Random: SeededRandom } = require('mwg');
	const draws = 2000;
	let middle = 0;
	SeededRandom.withSeed(20260917, () => {
		for (let i = 0; i < draws; i++) {
			const v = plantDropCount(3, 6, SeededRandom);
			assert(v >= 3 && v <= 6, `count ${v} inside [3, 6]`);
			if (v === 4 || v === 5) middle++;
		}
	});
	assert(middle > 1200, `triangular middle ${middle}/${draws} beats uniform`);
});
check('HazardAssistTracker lasts 50 turns toward a 10-kill badge', () => {
	const { MWL_TABLE_ROWS } = require('./mwlContent');
	const durationRow = MWL_TABLE_ROWS('buffDurations', 'buff').find((row) => row.buff === 'hazardAssist');
	assert.equal(durationRow.duration, 50);
	const { BUFF_DURATION } = require('./simulation/buffs');
	assert.equal(BUFF_DURATION.hazardAssist, 50);
	const badgeRow = MWL_TABLE_ROWS('badgeCatalogue', 'id').find((row) => row.id === 'enemy_hazards');
	assert.equal(badgeRow.counter, 'hazard_assists');
	assert.equal(badgeRow.target, 10);
	assert.equal(badgeRow.icon, 64);
});
check('Ranged targeting picks the nearest visible hero or ally, never the invisible', () => {
	const roguelike = {
		canTarget: () => true,
		chebyshevDistance: (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)),
	};
	const monster = { x: 0, y: 0, buffs: {} };
	const hero = { x: 5, y: 0, hp: 10, isHero: true, buffs: {} };
	const ally = { x: 2, y: 0, hp: 10, isAlly: true, buffs: {} };
	assert.equal(selectRangedTarget({}, monster, hero, [ally], 8, roguelike), ally);
	const nearHero = { ...hero, x: 1 };
	assert.equal(selectRangedTarget({}, monster, nearHero, [ally], 8, roguelike), nearHero);
	assert.equal(selectRangedTarget({}, monster, { ...hero, buffs: { invisibility: 3 } }, [ally], 8, roguelike), ally);
	assert.equal(selectRangedTarget({}, monster, { ...hero, buffs: { invisibility: 3 } }, [{ ...ally, buffs: { invisibility: 3 } }], 8, roguelike), null);
	assert.equal(selectRangedTarget({}, monster, hero, [{ ...ally, hp: 0 }], 8, roguelike), hero);
});
check('Ally pursuit skips sheep and invisible allies', () => {
	//`Mob.act()` only collects candidates with `invisible <= 0` - a MirrorInvis
	//image cannot be pursued until its first swing dispels it (42nd matrix).
	const roguelike = {
		chebyshevDistance: (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)),
	};
	const monster = { x: 0, y: 0, buffs: {} };
	const visible = { x: 2, y: 0, hp: 10, isAlly: true, buffs: {} };
	const isVisible = () => true;
	const smokeBlocked = () => false;
	assert.equal(findEnemyAlly(monster, [visible], isVisible, smokeBlocked, roguelike), visible);
	assert.equal(findEnemyAlly(monster, [{ ...visible, buffs: { invisibility: 9999 } }], isVisible, smokeBlocked, roguelike), null);
	assert.equal(findEnemyAlly(monster, [{ ...visible, allyKind: 'sheep' }], isVisible, smokeBlocked, roguelike), null);
});
check('Pursuit strikes adjacent targets and steps around blockers', () => {
	//46th extraction: the shared Amok/Aggression tail - adjacency strikes,
	//anything else paths one step with the target and bystanders unblocked.
	const calls = [];
	const monster = { x: 0, y: 0 };
	const target = { x: 1, y: 0 };
	const context = {
		creatures: [monster, target, { x: 5, y: 5 }],
		cellIndex: (x, y) => x + y * 10,
		blockEternalFire: () => {},
		findStep: (from, to, blocked) => {
			assert.ok(!blocked.has(0) && !blocked.has(10), 'monster and target stay walkable');
			assert.ok(blocked.has(55), 'bystanders block');
			calls.push(['step', from, to]);
			return { x: 0, y: 1 };
		},
		isAdjacent: (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) === 1,
		step: (m, to) => calls.push(['moved', to]),
		strike: (m, t) => calls.push(['strike', t]),
	};
	pursueTarget(monster, target, context);
	assert.deepEqual(calls, [['strike', target]]);
	calls.length = 0;
	const farMonster = { x: 0, y: 0 };
	const farTarget = { x: 3, y: 0 };
	const farContext = { ...context, creatures: [farMonster, farTarget, { x: 5, y: 5 }] };
	pursueTarget(farMonster, farTarget, farContext);
	assert.deepEqual(calls, [['step', { x: 0, y: 0 }, { x: 3, y: 0 }], ['moved', { x: 0, y: 1 }]]);
});
check('Teleport lands passable, unoccupied, unseen, non-secret and out of pits', () => {
	const open = { passable: true, occupied: false, visible: false, secret: false, chasm: false };
	assert.deepEqual(teleportCandidates([
		{ x: 0, y: 0, ...open },
		{ x: 1, y: 0, ...open, passable: false },
		{ x: 2, y: 0, ...open, occupied: true },
		{ x: 3, y: 0, ...open, visible: true },
		{ x: 4, y: 0, ...open, secret: true },
		{ x: 5, y: 0, ...open, chasm: true },
	]), [{ x: 0, y: 0 }]);
});
check('Teleport appear plays visibility-gated sound, bursts and fade', () => {
	assert.deepEqual(teleportAppearPlan(true, false, true, false),
		{ sound: true, burstFrom: false, fade: true, burstTo: true });
	assert.deepEqual(teleportAppearPlan(true, true, false, false),
		{ sound: true, burstFrom: true, fade: true, burstTo: true });
	assert.deepEqual(teleportAppearPlan(false, false, false, false),
		{ sound: false, burstFrom: false, fade: true, burstTo: false });
	assert.deepEqual(teleportAppearPlan(true, true, false, true),
		{ sound: true, burstFrom: true, fade: false, burstTo: true });
});
check('TimeBubble disarm uproots presses but spares Rotberry', () => {
	assert.deepEqual(
		disarmBubblePresses([3, 7, 9], (cell) => (cell === 3 ? 'rotberry' : cell === 7 ? 'firebloom' : undefined), (cell) => cell === 7 || cell === 9),
		{ uproot: [7], disarm: [7, 9] },
	);
	assert.deepEqual(disarmBubblePresses([], () => undefined, () => false), { uproot: [], disarm: [] });
});
check('StenchGas applies its distinct two-turn paralysis effect', () => {
		const target = { hp: 10 };
		const advanced = [];
		const buffs = [];
		applyEnvironmentalBlobs({
			creatures: [], passable: () => true,
			advance: blob => advanced.push(blob),
			cellsAbove: blob => blob === 'stenchGas' || blob === 'corrosiveGas' ? [{ x: 1, y: 1 }] : [],
			creatureAt: () => target,
			addBuff: (...args) => buffs.push(args),
			applyCorrosion: (...args) => buffs.push(args),
			corrosiveStrength: () => 3,
			toxicDamage: () => 1,
			isToxicImmune: () => false,
			applyDamage: () => true,
		});
		assert.deepEqual(advanced, ['plantGas', 'plantFreeze', 'toxicGas', 'paralyticGas', 'stenchGas', 'corrosiveGas', 'confusionGas', 'web', 'electricity', 'smokeScreen', 'inferno', 'blizzard']);
		assert.deepEqual(buffs, [[target, 'paralysis', 2], [target, 3]]);
	});
	check('Warden BlobImmunity blocks every shared harmful blob effect', () => {
		const target = { hp: 10, buffs: { blobImmunity: 10 } };
		const applied = [];
		const blobs = ['plantGas', 'plantFreeze', 'toxicGas', 'paralyticGas', 'stenchGas', 'corrosiveGas', 'confusionGas', 'web', 'electricity', 'inferno', 'blizzard'];
		applyEnvironmentalBlobs({
			creatures: [], passable: () => true, advance: () => {},
			cellsAbove: (blob) => blobs.includes(blob) ? [{ x: 1, y: 1 }] : [],
			creatureAt: () => target,
			addBuff: (...args) => applied.push(['buff', ...args]),
			applyCorrosion: (...args) => applied.push(['corrosion', ...args]),
			corrosiveStrength: () => 3, toxicDamage: () => 1, isToxicImmune: () => false,
			isBlobImmune: (creature) => creature.buffs.blobImmunity !== undefined,
			applyDamage: (...args) => applied.push(['damage', ...args]) || true,
			applyChill: (...args) => applied.push(['chill', ...args]),
			reigniteBurning: (...args) => applied.push(['fire', ...args]),
			clearCell: () => {},
			amountAt: () => 0,
		});
		assert.deepEqual(applied, []);
	});
	check('Webs root once, consume the cell, and let spinners through', () => {
		//`Level.occupyCell()` (tag `v3.3.8`): stepping on web clears the cell
		//and roots 5; `Web`-immune spinners pass with the web intact.
		const rooted = [];
		const cleared = [];
		const hero = { x: 1, y: 1, hp: 10 };
		const spider = { x: 2, y: 2, hp: 10, kind: 'spinner' };
		applyEnvironmentalBlobs({
			creatures: [], passable: () => true,
			advance: () => {},
			cellsAbove: (blob) => blob === 'web' ? [{ x: 1, y: 1 }, { x: 2, y: 2 }] : [],
			creatureAt: (x, y) => x === 1 && y === 1 ? hero : spider,
			addBuff: (target, id, duration) => rooted.push([target, id, duration]),
			clearCell: (blob, x, y) => cleared.push([blob, x, y]),
			applyCorrosion: () => {},
			corrosiveStrength: () => 0,
			toxicDamage: () => 0,
			isToxicImmune: () => false,
			applyDamage: () => true,
		});
		assert.deepEqual(rooted, [[hero, 'roots', 5]]);
		assert.deepEqual(cleared, [['web', 1, 1]]);
	});
	check('Poison-resistant targets halve each tick, rounded', () => {
		//The poison tick routes through `Char.damage()`, so `Poison`
		//resistance (the spinner) halves with `Math.round` - not duration.
		const { advanceBuffs } = require('./simulation/buffs');
		const random = { int: (min) => min, float: () => 0, normalRange: (min) => min, range: (min) => min };
		assert.equal(advanceBuffs({ poison: 6 }, random, 0).damage, 3);
		assert.equal(advanceBuffs({ poison: 6 }, random, 0, true).damage, 2);
		assert.equal(advanceBuffs({ poison: 4 }, random, 0, true).damage, 1);
	});
	const { takeGooTurn } = require('./simulation/gooBoss');
	const { mirrorImageStats } = require('./simulation/mirrorImage');
	const { takeSentryTurn } = require('./simulation/sentryTurn');
	const { ratKingP1Summon, planRatKingWave } = require('./simulation/ratKingBoss');
	const { chooseDM300Ability, dm300VentPath, planDM300Rockfall, planDM300Knockback } = require('./simulation/dm300Boss');
	const { aimYogDeathGaze, buildYogMinionDeck } = require('./simulation/yogBoss');
	const { Scheduler } = require('./scheduler');
	const talents = require('./talentEffects');
	const buffDurations = require('./simulation/buffs');
	const initial = (extra = {}) => ({ hunger: 0, partialDamage: 0, hp: 20, maxHp: 20, ...extra });
	check('WellFed pauses hunger, heals every 18 turns, and expires after its Java clock', () => {
		assert.deepEqual(advanceWellFed(450, 10, 20), { remaining: 449, heal: 0 });
		assert.deepEqual(advanceWellFed(433, 10, 20), { remaining: 432, heal: 1 });
		assert.deepEqual(advanceWellFed(432, 20, 20), { remaining: 431, heal: 0 });
		assert.deepEqual(advanceWellFed(150, 10, 20), { remaining: 149, heal: 0 });
		assert.deepEqual(advanceWellFed(0, 10, 20), { remaining: null, heal: 0 });
	});
	check('movement runtime preserves the pure decision and lazy query order', () => {
		const calls = [];
		const plan = runMovement({ x: 4, y: 8 }, { x: -1, y: 1 }, {
			occupantAt: target => { assert.deepEqual(target, { x: 3, y: 9 }); calls.push('actor'); return null; },
			isRooted: () => { calls.push('rooted'); return false; },
			closedDoorAt: () => { calls.push('door'); return true; },
			passable: () => { throw new Error('queried after closed door'); },
		});
		assert.deepEqual(plan, { kind: 'door', target: { x: 3, y: 9 } });
		assert.deepEqual(calls, ['actor', 'rooted', 'door']);
		assert.deepEqual(runMovement({ x: 4, y: 8 }, { x: 0, y: 0 }, {}), { kind: 'wait' });
	});
	check('attack resolution preserves hit short-circuit and base damage rolls', () => {
		const random = {
			float: () => 0,
			normalRange: (min) => min,
			range: (min) => min,
			int: (min) => min,
		};
		const attacker = { id: 'hero-1', x: 1, y: 1, hp: 20, maxHp: 20, accuracy: 10, evasion: 5, damage: [3, 7], armor: [0, 0], buffs: {}, isHero: true };
		const defender = { id: 'rat-1', x: 2, y: 1, hp: 10, maxHp: 10, accuracy: 5, evasion: 0, damage: [1, 2], armor: [1, 1], buffs: {}, isHero: false };
		assert.deepEqual(resolveAttack(attacker, defender, random), { hit: true, damage: 2 });
		assert.deepEqual(runAttackResolution(attacker, defender, random), { hit: true, damage: 2 });
		const untargetable = { ...defender, evasion: 1000000 };
		assert.deepEqual(resolveAttack(attacker, untargetable, random), { hit: false, damage: 0 });
		assert.deepEqual(runAttackResolution(attacker, untargetable, random), { hit: false, damage: 0 });
	});
	check('recent talent effects cover thresholds, class gates, and rank scaling', () => {
		//ironWillReduction was removed (2026-09-14): Iron Will's real effect is a Warrior-only
		//BrokenSeal shield-size boost, now `sealMaxShield` (`simulation/sealShield.ts`, pinned in `verifySealShield`).
		assert.equal(talents.shieldBatteryGain(3, 2), 2);
		assert.equal(talents.shieldBatteryGain(0, 2), 0);
		assert.equal(talents.rejuvenatingStepHeal(4, 4, 19, 20, 2), 1);
		assert.equal(talents.rejuvenatingStepHeal(3, 4, 10, 20, 2), 0);
		assert.equal(talents.lethalHasteDuration(1), 4);
		assert.equal(talents.lethalHasteDuration(2), 6);
		assert.equal(buffDurations.BUFF_DURATION['lethalHasteCooldown'], 100);
		assert.equal(talents.weaponRechargingDamage(100, 2), 103);
		assert.equal(talents.weaponRechargingDamage(40, 1), 41);
		assert.equal(talents.farsightMultiplier('sniper', 2), 1.5);
		assert.equal(talents.farsightMultiplier('warden', 2), 1);
		assert.equal(talents.shieldingDewGain('warden', 2), 2);
		assert.equal(talents.shieldingDewGain('sniper', 2), 0);
		assert.equal(talents.preservationChance(1), 0.2);
		assert.equal(talents.preservationChance(2), 0.35);
		assert.equal(talents.preservationChance(0), 0);
		assert.equal(talents.ironStomachReduction('warrior', 2), 4);
		assert.equal(talents.ironStomachReduction('rogue', 2), 0);
		assert.equal(talents.cachedRationChance('rogue', 2), 0.4);
		assert.equal(talents.cachedRationChance('warrior', 2), 0);
		assert.equal(talents.canImproviseProjectile('warrior', 1, 1), true);
		assert.equal(talents.canImproviseProjectile('warrior', 1, 0), false);
		assert.equal(talents.evasiveArmorBonus('freerunner', 2, 3), 6);
		assert.equal(talents.evasiveArmorBonus('assassin', 2, 3), 0);
		assert.equal(talents.assassinReachBonus('assassin', 2), 2);
		assert.equal(talents.empoweredStrikeBonus('battlemage', 2), 2);
		//Bounty Hunter: Java's real term is a drop-chance *multiplier* of `0.02 * 2^(prep-1) *
		//points`, not the flat gold this used to stand in with. Ranks 1-3 at prep level 4 give
		//0.16 / 0.32 / 0.48; a level-1 prepare gives an eighth of that.
		assert.equal(talents.bountyHunterDropBonus(4, 3), 0.48);
		assert.equal(talents.bountyHunterDropBonus(4, 1), 0.16);
		assert.equal(talents.bountyHunterDropBonus(1, 3), 0.06);
		assert.equal(talents.bountyHunterDropBonus(4, 0), 0);
		//`unencumberedSpiritEvasion` / `monasticVigorShield` were invented stand-ins for the Monk's talents; the real ones
		//(`MonkEnergy.gainEnergy`'s tier bonus, `abilitiesEmpowered`) are pinned in `verifyMonkEnergy`.
		//`lethalDefenseShield` (a shield on every hit taken) was an invented stand-in; the real Lethal Defense (a seal-cooldown
		//refund on a Combo kill) is pinned in `verifySealShield`.
		assert.equal(talents.sharedUpgradeArmor('sniper', 1, 1), 1);
		assert.equal(talents.sharedUpgradeArmor('sniper', 1, 3), 0);
		assert.equal(talents.twinUpgradeArmor('champion', 1, 1), 1);
		assert.equal(talents.soulSiphonCharge('warlock', 2), 2);
		assert.equal(talents.projectileMomentumBonus('freerunner', 2, true), 2);
		assert.equal(talents.projectileMomentumBonus('sniper', 2, true), 0);
		//`enragedCatalystBonus` / `deathlessFuryTriggers` were invented stand-ins; the real talents are pinned in `verifyBerserkRage`.
		//`cleaveComboSeed` (start a kill's combo at 2) is gone: Java's Cleave only lengthens `Combo`'s clock after a kill
		//(`Combo.hit`, `15 + 15*rank`), pinned in `verifyCombo`.
		//`enhancedLethalityThreshold` (the flat `0.2*rank` stand-in for the Assassin's execute) is
		//gone: the talent now feeds `AttackLevel.KOThreshold()`'s table column directly, and that
		//whole table is pinned in verifyCombat.
		assert.equal(talents.arcaneVisionDuration(2), 15);
		assert.equal(talents.arcaneVisionDuration(0), 5);
		assert.equal(talents.necromancerMinionChance('warlock', 1), 0.13);
		assert.equal(talents.necromancerMinionChance('warlock', 3), 0.4);
		assert.equal(talents.necromancerMinionChance('battlemage', 3), 0);
		//2026-09-19 pass: the five T3 talents whose formulas were tabled but unwired.
		assert.equal(talents.EMPOWERING_SCROLLS_BONUS, 3);
		assert.equal(talents.empoweringScrollsCharges(1), 1);
		assert.equal(talents.empoweringScrollsCharges(3), 3);
		assert.equal(talents.empoweringScrollsCharges(0), 0);
		assert.equal(talents.enhancedRingsDuration(1), 3);
		assert.equal(talents.enhancedRingsDuration(3), 9);
		assert.equal(talents.lightCloakRechargeRate(1), 0.25);
		assert.equal(talents.lightCloakRechargeRate(3), 0.75);
		assert.equal(talents.lightCloakArtifactBonus(1), 0.07);
		assert.equal(talents.lightCloakArtifactBonus(2), 0.13);
		assert.equal(talents.lightCloakArtifactBonus(3), 0.2);
		assert.equal(talents.allyWarpRange(1), 2);
		assert.equal(talents.allyWarpRange(3), 6);
		assert.equal(talents.SEER_SHOT_COOLDOWN, 20);
		assert.equal(talents.seerShotDuration(1), 5);
		assert.equal(talents.seerShotDuration(3), 15);
	});
	check('cleric tier-3 halves shed, quicken wands, and open their own tab', () => {
		//Talent.CLEANSE's onArtifactUsed half: rank/10 (10/20/30%).
		assert.equal(talents.cleanseArtifactChance(1), 0.1);
		assert.equal(talents.cleanseArtifactChance(2), 0.2);
		assert.equal(talents.cleanseArtifactChance(3), 0.3);
		//LIGHT_READING's RingOfEnergy leg: 1+0.2*rank/3 off-Cleric, 1 on-Cleric.
		assert.equal(talents.lightReadingWandMult('mage', 1), 1 + (0.2 * 1) / 3);
		assert.equal(talents.lightReadingWandMult('mage', 3), 1 + (0.2 * 3) / 3);
		assert.equal(talents.lightReadingWandMult('rogue', 0), 1);
		assert.equal(talents.lightReadingWandMult('cleric', 3), 1);
		//Only the Cleric authors a class tier-3 row, so only its tab opens at the
		//level threshold without the subclass Java's talentPointsAvailable(3) needs.
		const { hasClassTier3Row } = require('./talents');
		assert.equal(hasClassTier3Row('cleric'), true);
		for (const cls of ['warrior', 'mage', 'rogue', 'huntress', 'duelist']) {
			assert.equal(hasClassTier3Row(cls), false);
		}
	});

	check('hunger runtime dispatch matches the direct transition exactly', () => {
		for (const state of [initial({ hunger: 290 }), initial({ hunger: 440, hp: 20 }), initial({ hunger: 450, hp: 20, maxHp: 20 })]) {
			const direct = advanceHunger(state);
			const routed = runHungerStep(state);
			assert.deepEqual(routed.state, direct.state);
			assert.deepEqual(routed.events, direct.events);
		}
	});
	check('hunger transition is immutable and warns once at 300', () => {
		//STEP is Java's real 1/turn (`Hunger.act()`: `level + 1f/hungerDelay`), not the
		//old invented 10 - so 290 climbs to 291 silently, and the warning fires at 299.
		const input = Object.freeze(initial({ hunger: 290 }));
		const result = advanceHunger(input);
		assert.equal(input.hunger, 290);
		assert.equal(result.state.hunger, 291);
		assert.deepEqual(result.events, []);
		const edge = advanceHunger(initial({ hunger: 299 }));
		assert.equal(edge.state.hunger, 300);
		assert.deepEqual(edge.events, [{ type: 'hungry' }]);
		assert.deepEqual(advanceHunger(edge.state).events, []);
	});
	check('crossing 450 fires starving + an immediate 1 damage, matching hero.damage(1,this)', () => {
		assert.deepEqual(advanceHunger(initial({ hunger: 280 })).events, []);
		assert.deepEqual(advanceHunger(initial({ hunger: 440 })).events, []);
		const result = advanceHunger(initial({ hunger: 449, hp: 20 }));
		assert.deepEqual(result.events, [{ type: 'starving' }, { type: 'starvation-damage', damage: 1 }]);
		assert.equal(result.state.hp, 19);
		assert.equal(result.state.hunger, 450);
		//Java clamps the level at STARVING on the crossing tick: a bulk step
		//lands on 450, never 451+, so later subtractive food eats the same base.
		const bulk = advanceHunger(initial({ hunger: 449, hp: 20 }), 2);
		assert.equal(bulk.state.hunger, 450);
		assert.deepEqual(bulk.events, [{ type: 'starving' }, { type: 'starvation-damage', damage: 1 }]);
		//Java's `1f/hungerDelay`: cloak stealth (delay 1.5) climbs two-thirds as fast.
		assert.equal(advanceHunger(initial({ hunger: 0 }), 3, 1.5).state.hunger, 2);
		assert.equal(advanceHunger(initial({ hunger: 0 }), 1, 1.5).state.hunger, 1 / 1.5);
		//Search exertion mirrors affectHunger with negative energy: direct bump
		//with crossing lines, STARVING clamp, and excess into partialDamage.
		const exert = exertHunger(initial({ hunger: 296, hp: 20 }), 4);
		assert.equal(exert.state.hunger, 300);
		assert.deepEqual(exert.events, [{ type: 'hungry' }]);
		const exertStarve = exertHunger(initial({ hunger: 449, hp: 20 }), 4);
		assert.equal(exertStarve.state.hunger, 450);
		assert.deepEqual(exertStarve.events, [{ type: 'starving' }, { type: 'starvation-damage', damage: 1 }]);
		assert.equal(exertStarve.state.hp, 19);
	});
	check('once starving, level freezes and partialDamage accrues HT/1000 per turn (Hunger.act isStarving branch)', () => {
		//Java accrues a flat HT/1000 per act with no STEP factor: at HT 20 the strict
		//`> 1` gate trips on the 50th turn (float accumulation lands just above 1.0).
		let state = initial({ hunger: 450, hp: 20, maxHp: 20 });
		for (let i = 0; i < 49; i++) {
			const result = advanceHunger(state);
			assert.deepEqual(result.events, []);
			state = result.state;
		}
		assert.equal(state.hunger, 450);
		assert.equal(state.hp, 20);
		const result = advanceHunger(state);
		assert.deepEqual(result.events, [{ type: 'starvation-damage', damage: 1 }]);
		assert.equal(result.state.hp, 19);
		assert.ok(Math.abs(result.state.partialDamage) < 1e-9);
	});
	check('high max HP can deal multiple damage per turn, and death follows the damage event', () => {
		//HT 250 accrues 0.25/turn: a seeded 1.9 crosses 2.0 for double damage.
		const result = advanceHunger(initial({ hunger: 450, hp: 2, maxHp: 250, partialDamage: 1.9 }));
		assert.equal(result.state.hp, 0);
		assert.deepEqual(result.events, [{ type: 'starvation-damage', damage: 2 }, { type: 'starvation-death' }]);
	});
	check('feeding remains a caller decision; partialDamage is untouched while not starving', () => {
		const result = advanceHunger(initial({ hunger: 0, partialDamage: 0.7 }));
		assert.equal(result.state.partialDamage, 0.7);
		assert.equal(result.state.hunger, 1);
		assert.deepEqual(result.events, []);
	});
	check('no actor runs when empty or already game over', () => {
		const ports = { scheduler: new Scheduler(), isGameOver: () => false,
			takeMonsterTurn: () => assert.fail('unexpected actor') };
		assert.equal(runUntilHeroInput(ports), 'empty');
		assert.equal(runUntilHeroInput({ ...ports, isGameOver: () => true }), 'game-over');
	});
	check('real scheduler preserves speed and stops before spending the hero turn', () => {
		const scheduler = new Scheduler();
		const monster = { isHero: false, speed: 2 };
		const hero = { isHero: true };
		scheduler.add(monster, 0);
		scheduler.add(hero, 0.75);
		let actions = 0;
		assert.equal(runUntilHeroInput({ scheduler, isGameOver: () => false,
			takeMonsterTurn: (actor) => { assert.equal(actor, monster); actions++; } }), 'hero-input');
		assert.equal(actions, 2);
		assert.equal(scheduler.peek(), hero);
		assert.equal(scheduler.timeOf(hero), 0.75);
	});
	check('monster turn hooks run after each actor action', () => {
		const scheduler = new Scheduler();
		const monster = { isHero: false, speed: 2 };
		const hero = { isHero: true };
		scheduler.add(monster, 0);
		scheduler.add(hero, 0.75);
		let after = 0;
		assert.equal(runUntilHeroInput({ scheduler, isGameOver: () => false,
			takeMonsterTurn: () => {}, afterMonsterTurn: (actor) => { assert.equal(actor, monster); after++; },
		}), 'hero-input');
		assert.equal(after, 2);
	});
	check('game-over is checked on the next iteration, after the existing spend', () => {
		let over = false;
		const trace = [];
		assert.equal(runUntilHeroInput({
			scheduler: { peek: () => ({ isHero: false }), spend: (cost) => trace.push(cost) },
			isGameOver: () => over,
			takeMonsterTurn: () => { trace.push('act'); over = true; },
		}), 'game-over');
		assert.deepEqual(trace, ['act', 1]);
	});
	check('actor removal keeps the scheduler current-entry spending behaviour', () => {
		const scheduler = new Scheduler();
		const monster = { isHero: false };
		const hero = { isHero: true };
		scheduler.add(monster);
		scheduler.add(hero);
		runUntilHeroInput({ scheduler, isGameOver: () => false,
			takeMonsterTurn: (actor) => scheduler.remove(actor) });
		assert.equal(scheduler.timeOf(hero), 1);
	});
	check('iteration bound is explicit and does not manufacture a hero turn', () => {
		let actions = 0;
		assert.equal(runUntilHeroInput({
			scheduler: { peek: () => ({ isHero: false }), spend: () => {} },
			isGameOver: () => false, takeMonsterTurn: () => actions++,
		}), 'iteration-limit');
		assert.equal(actions, 1000);
	});
	check('adapter reads replacement state and writes it before presenting events', () => {
		let state = initial();
		let ready = 0;
		const scheduler = new Scheduler();
		const events = [];
		const adapter = new SceneSimulationAdapter({ scheduler, isGameOver: () => false,
			takeMonsterTurn: () => assert.fail('unexpected actor'), awaitHeroInput: () => ready++,
			readHunger: () => state, writeHunger: (next) => { state = next; },
			presentHungerEvent: (event) => { assert.equal(state.hp, 0); events.push(event.type); },
		});
		adapter.hungerStep();
		state = initial({ hunger: 449, hp: 1 }); // e.g. state after loading, one turn from crossing into starving
		adapter.hungerStep();
		assert.deepEqual(events, ['starving', 'starvation-damage', 'starvation-death']);
		assert.equal(adapter.runTurns(), 'empty');
		assert.equal(ready, 0);
		scheduler.add({ isHero: true });
		assert.equal(adapter.runTurns(), 'hero-input');
		assert.equal(ready, 1);
		scheduler.clear(); // entering a floor reuses the scheduler instance
		scheduler.add({ isHero: true });
		adapter.runTurns();
		assert.equal(ready, 2);
	});
	verifyMovement(require, check);
	check('extracted boss planners preserve deterministic Goo, Rat King, DM-300, and Yog rules', () => {
		const random = { int: (min) => min, chance: () => true };
		const hero = { x: 4, y: 4, hp: 20, maxHp: 20 };
		const goo = { x: 3, y: 4, hp: 100, maxHp: 100, pumped: 0 };
		const attacks = [];
		const messages = [];
		const gooContext = {
			hero, inWater: () => false, strongerBosses: false,
			stats: () => ({ accuracy: 10, damage: [2, 4] }),
			attack: (attacker, defender) => attacks.push({ attacker, defender }),
			showHeal: () => assert.fail('dry Goo must not heal'), say: (message) => messages.push(message), random,
			foulBossChallenge: () => { fouled++; },
			messages: { slam: 'slam', pump: 'pump', pumpMore: 'pump-more' },
		};
		let fouled = 0;
		takeGooTurn(goo, gooContext); takeGooTurn(goo, gooContext); takeGooTurn(goo, gooContext);
		assert.equal(goo.pumped, 0);
		assert.equal(attacks.length, 1);
		assert.deepEqual(attacks[0].attacker.damage, [6, 12]);
		assert.equal(attacks[0].attacker.accuracy, 20);
		assert.deepEqual(messages, ['pump', 'pump-more', 'slam']);
		//The pumped slam fouls the bosses challenge exactly once per slam.
		assert.equal(fouled, 1);
		assert.deepEqual(planRatKingWave(0, 300, false, random), { adds: ['ghoul'], nextSummonsMade: 1, announcement: 'wave_1', cadence: 3 });
		assert.deepEqual(ratKingP1Summon(8, true, random), 'golem');
		assert.deepEqual(planRatKingWave(12, 150, true, random), { adds: ['warlock', 'monk', 'ghoul', 'ghoul'], nextSummonsMade: 16, announcement: 'wave_3', cadence: 3 });
		//34th matrix: the wave-3 yell fires wherever the branch fires (made 8, not
		//just 12), and every plan carries Java's spend pacing (3 for wave-1
		//schedules, 1 for the per-turn waves).
		assert.deepEqual(planRatKingWave(8, 50, false, random), { adds: ['warlock', 'monk', 'ghoul', 'ghoul'], nextSummonsMade: 12, announcement: 'wave_3', cadence: 1 });
		assert.deepEqual(planRatKingWave(4, 150, false, random), { adds: ['ghoul'], nextSummonsMade: 5, announcement: 'wave_2', cadence: 1 });
		assert.deepEqual(planRatKingWave(14, 100, true, random), { adds: ['golem', 'golem'], nextSummonsMade: 16, announcement: undefined, cadence: 1 });
		assert.deepEqual(planRatKingWave(0, 400, true, random), { adds: ['ghoul', 'ghoul'], nextSummonsMade: 2, announcement: 'wave_1', cadence: 3 });
		assert.equal(chooseDM300Ability(0, random), 'vent');
		assert.equal(chooseDM300Ability(2, random), 'rockfall');
		// Java's weighted repeat rule, pinned exactly: fresh is 50/50, a repeat lands
		// only on the 1-in-4 roll, a switch on the other three.
		const cycle = (last, rolls) => { let i = 0; return rolls.map(() => chooseDM300Ability(last, { int: () => rolls[i++] })); };
		assert.deepEqual(cycle(0, [0, 1]), ['vent', 'rockfall']);
		assert.deepEqual(cycle(1, [0, 1, 2, 3]), ['vent', 'rockfall', 'rockfall', 'rockfall']);
		assert.deepEqual(cycle(2, [0, 1, 2, 3]), ['rockfall', 'vent', 'vent', 'vent']);
		assert.deepEqual(dm300VentPath({ x: 0, y: 0 }, { x: 3, y: 3 }, (x, y) => !(x === 2 && y === 2)), [{ x: 1, y: 1 }]);
		const rockfall = planDM300Rockfall({ x: 3, y: 3 }, { x: 0, y: 0 }, 7, 7, () => true, random);
		assert.deepEqual(rockfall.safe, { x: 2, y: 2 });
		assert.equal(rockfall.cells.length, 48);
		//`DM300.dropRocks()`'s opening knockback (tag `v3.3.8`): power 2 adjacent, 1 at
		//distance 2, pure displacement whose landing is the 7x7's rockCenter.
		const open = { blocked: () => false, occupied: () => false, immovable: false };
		assert.deepEqual(planDM300Knockback({ x: 3, y: 3 }, { x: 3, y: 4 }, 2, open), { x: 3, y: 6 });
		assert.deepEqual(planDM300Knockback({ x: 3, y: 3 }, { x: 3, y: 4 }, 1, open), { x: 3, y: 5 });
		assert.deepEqual(planDM300Knockback({ x: 0, y: 0 }, { x: 1, y: 1 }, 2, open), { x: 3, y: 3 });
		assert.deepEqual(planDM300Knockback({ x: 3, y: 3 }, { x: 3, y: 4 }, 0, open), { x: 3, y: 4 });
		assert.deepEqual(planDM300Knockback({ x: 3, y: 3 }, { x: 3, y: 4 }, 2, { ...open, immovable: true }), { x: 3, y: 4 });
		//A solid cell stops the throw in front of it; an occupied landing steps back
		//one, matching `throwChar`'s `findChar` branch.
		assert.deepEqual(planDM300Knockback({ x: 3, y: 3 }, { x: 3, y: 4 }, 2,
			{ ...open, blocked: (x, y) => x === 3 && y === 5 }), { x: 3, y: 4 });
		assert.deepEqual(planDM300Knockback({ x: 3, y: 3 }, { x: 3, y: 4 }, 2,
			{ ...open, occupied: (x, y) => x === 3 && y === 6 }), { x: 3, y: 5 });
		const yog = aimYogDeathGaze({ width: 9, height: 9, hero: { x: 4, y: 4 }, yog: { x: 0, y: 0 }, maxHp: 400, hp: 400,
			neighbours: [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]],
			index: (x, y) => y * 9 + x, passable: () => true, trace: (from, to) => {
				const cells = []; let x = from.x, y = from.y;
				while (x !== to.x || y !== to.y) { cells.push({ x, y }); x += Math.sign(to.x - x); y += Math.sign(to.y - y); }
				cells.push({ x, y }); return cells;
			}, random });
		assert.deepEqual(yog, [40]);
		//Duplicate extra beams survive: Java paints into an `ArrayList` and fires the
		//cell twice, so the planner returns a list, not a set.
		const neighbours8 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
		const diagonal = (from, to) => {
			const cells = []; let x = from.x, y = from.y;
			while (x !== to.x || y !== to.y) { cells.push({ x, y }); x += Math.sign(to.x - x); y += Math.sign(to.y - y); }
			cells.push({ x, y }); return cells;
		};
		const dupe = aimYogDeathGaze({ width: 9, height: 9, hero: { x: 4, y: 4 }, yog: { x: 0, y: 0 }, maxHp: 800, hp: 0,
			neighbours: neighbours8, index: (x, y) => y * 9 + x, passable: () => true, trace: diagonal, random: { int: () => 0 } });
		assert.deepEqual(dupe, [40, 30, 30]);
		//Java's blanket check sweeps `NEIGHBOURS9`: the hero's own cell counts. A trace
		//covering all eight neighbours but not the center keeps every beam.
		const blanket = aimYogDeathGaze({ width: 9, height: 9, hero: { x: 4, y: 4 }, yog: { x: 0, y: 0 }, maxHp: 800, hp: 400,
			neighbours: neighbours8, index: (x, y) => y * 9 + x, passable: () => true,
			trace: () => neighbours8.map(([dx, dy]) => ({ x: 4 + dx, y: 4 + dy })), random: { int: () => 0 } });
		assert.deepEqual(blanket, [40, 30]);
		//Yog's 400-HP scaling preserves Java's escalation fractions (2nd beam at 60%
		//HP remaining, 3rd at 20%): a literal /400 divisor would never exceed one beam.
		const beamCount = (hp) => aimYogDeathGaze({ width: 9, height: 9, hero: { x: 4, y: 4 }, yog: { x: 0, y: 0 },
			maxHp: 400, hp, neighbours: neighbours8, index: (x, y) => y * 9 + x, passable: () => true,
			trace: diagonal, random: { int: () => 0 } }).length;
		assert.deepEqual([241, 240, 81, 80].map(beamCount), [1, 2, 2, 3]);
	});
	check('Yog minion deck follows the live spawner count and grants nothing', () => {
		//`YogDzewa.regularSummons` (tag `v3.3.8`): normal is four slots with rippers
		//for the first `spawnersAlive` and larvae after; challenge is six slots with
		//eye/scorpio under the count (eye first), larvae to index 4, rippers last.
		assert.deepEqual(buildYogMinionDeck(false, 4),
			['ripperDemon', 'ripperDemon', 'ripperDemon', 'ripperDemon']);
		assert.deepEqual(buildYogMinionDeck(false, 2),
			['ripperDemon', 'ripperDemon', 'larva', 'larva']);
		assert.deepEqual(buildYogMinionDeck(false, 0),
			['larva', 'larva', 'larva', 'larva']);
		assert.deepEqual(buildYogMinionDeck(true, 4),
			['eye', 'scorpio', 'eye', 'scorpio', 'ripperDemon', 'ripperDemon']);
		assert.deepEqual(buildYogMinionDeck(true, 2),
			['eye', 'scorpio', 'larva', 'larva', 'ripperDemon', 'ripperDemon']);
		assert.deepEqual(buildYogMinionDeck(true, 0),
			['larva', 'larva', 'larva', 'larva', 'ripperDemon', 'ripperDemon']);
		//Structural: the scene builds the deck once per Yog from the live spawner
		//count, shuffles, cycles by index, and flags every arrival noExp (all four
		//are `maxLvl = -2`, so neither XP nor loot - the King's-servant precedent).
		const scene = readSceneSource();
		assert.ok(scene.includes('buildYogMinionDeck(challenge, spawnersAlive)'),
			'scene builds the minion deck from the live spawner count');
		assert.ok(scene.includes('Random.shuffle(deck)') && scene.includes('yog.yogMinionDeck = deck'),
			'scene shuffles once and caches the deck on the Yog');
		assert.ok(scene.includes('deck[index % deck.length]'),
			'scene draws the cached deck cyclically');
		assert.ok(scene.includes('minion.noExp = true'),
			'every Yog arrival carries the noExp flag');
		assert.ok(scene.includes('yogMinionDeck: saved.yogMinionDeck'),
			'the cached deck persists through save/restore');
	});
	check('DemonSpawner attempts its first spawn immediately, then adds 60', () => {
		//`DemonSpawner.act()` (tag `v3.3.8`): the clock starts at the field-init 0,
		//so the first turn already attempts; a success ADDS 60 (`+=`) minus the
		//depth cut, it never resets flat.
		const scene = readSceneSource();
		assert.ok(scene.includes('(spawner.spawnCooldown ?? 0) - 1'),
			'the spawner clock starts at Java field-init 0, not 60');
		assert.ok(scene.includes('spawner.spawnCooldown += 60'),
			'a successful spawn adds 60 onto the decremented clock');
	});
	check('mirror images read Java\'s hero-derived combat stats at half damage', () => {
		//42nd matrix (`MirrorImage.java`, tag `v3.3.8`): `attackSkill()` is
		//`(9 + lvl) * accuracyMultiplier`, `defenseSkill()` is
		//`super.defenseSkill(enemy) * (baseEvasion + heroEvasion) / 2` with
		//`baseEvasion = 4 + lvl` - the `super` 0/1 multiplier (surprised,
		//paralysed, illuminated-vs-Cleric, facing the hero; `Mob.java`
		//684-705) rides the optional `superDefense` tail, pinned alongside
		//the prismatic twin in `verifyPrismatic` - and `damageRoll()` halves
		//the hero roll rounded up (`(damage+1)/2` in integer math is
		//`ceil(d/2)`). The `(int)` casts truncate.
		assert.deepEqual(mirrorImageStats(1, 1, 1, 3, 9),
			{ accuracy: 10, evasion: 5, damageMin: 2, damageMax: 5 });
		assert.deepEqual(mirrorImageStats(10, 1.3, 1.125, 11, 30),
			{ accuracy: 24, evasion: 14, damageMin: 6, damageMax: 15 });
		assert.deepEqual(mirrorImageStats(10, 1, 1, 4, 7),
			{ accuracy: 19, evasion: 14, damageMin: 2, damageMax: 4 });
	});
	check('tengu ability cadence matches Java targetAbilityUses and catch-up cooldown', () => {
		// Tengu.targetAbilityUses(): 1 base, +2 per jump, +2 more for jumps 3 and 4.
		assert.deepEqual([0, 1, 2, 3, 4, 5].map(tenguTargetAbilityUses), [1, 3, 5, 8, 11, 14]);
		// Phase 1 (HP > HT/2) never draws, never casts, and leaves the cooldown untouched.
		let draws = 0;
		let step = stepTenguAbility({ hp: 101, maxHp: 200, cooldown: 2, used: 0, arenaJumps: 0, strongerBosses: false },
			() => { draws++; return 4; });
		assert.equal(step.ready, false); assert.equal(step.cooldown, 2); assert.equal(draws, 0);
		// Phase 2 starts at cooldown 2: one waiting turn (2->1), then a cast (1->0).
		step = stepTenguAbility({ hp: 100, maxHp: 200, cooldown: 2, used: 0, arenaJumps: 0, strongerBosses: false },
			() => { draws++; return 4; });
		assert.equal(step.ready, false); assert.equal(step.cooldown, 1); assert.equal(draws, 0);
		step = stepTenguAbility({ hp: 100, maxHp: 200, cooldown: 1, used: 0, arenaJumps: 0, strongerBosses: false },
			() => { draws++; return 4; });
		assert.equal(step.ready, true); assert.equal(step.cooldown, 0); assert.equal(draws, 0);
		// After a cast the cooldown sits at 0; the next turn draws the real IntRange(1,4).
		step = stepTenguAbility({ hp: 100, maxHp: 200, cooldown: 0, used: 0, arenaJumps: 0, strongerBosses: false }, () => 3);
		assert.equal(step.ready, false); assert.equal(step.cooldown, 3); assert.equal(step.target, 1);
		// The cast budget scales with arena jumps, so a two-jump fight stops at five casts.
		assert.equal(stepTenguAbility({ hp: 100, maxHp: 200, cooldown: 1, used: 5, arenaJumps: 2, strongerBosses: false }, () => 1).ready, false);
		assert.equal(stepTenguAbility({ hp: 100, maxHp: 200, cooldown: 1, used: 4, arenaJumps: 2, strongerBosses: false }, () => 1).ready, true);
		// 3+ behind: pinned to every other turn (cooldown forced to 1), no draw.
		const lag3 = stepTenguAbility({ hp: 100, maxHp: 200, cooldown: 0, used: 2, arenaJumps: 2, strongerBosses: false },
			() => { assert.fail('3-behind must not draw'); });
		assert.equal(lag3.cooldown, 1); assert.equal(lag3.ready, false); assert.equal(lag3.behind, 3);
		// 4+ behind, normal rules: cast immediately, no draw.
		const lag4 = stepTenguAbility({ hp: 100, maxHp: 200, cooldown: 2, used: 1, arenaJumps: 2, strongerBosses: false },
			() => { assert.fail('4-behind must not draw'); });
		assert.equal(lag4.cooldown, 0); assert.equal(lag4.ready, true);
		// 4+ behind, bosses challenge: the instant branch is skipped, so it paces like 3-behind.
		const lag4s = stepTenguAbility({ hp: 100, maxHp: 200, cooldown: 0, used: 1, arenaJumps: 2, strongerBosses: true },
			() => { assert.fail('challenge 4-behind must not draw either'); });
		assert.equal(lag4s.cooldown, 1); assert.equal(lag4s.ready, false);
		// Dead Tengu is inert.
		assert.equal(stepTenguAbility({ hp: 0, maxHp: 200, cooldown: 0, used: 0, arenaJumps: 0, strongerBosses: false }, () => 1).ready, false);
		// Ability turn cost (`Tengu.useAbility()`'s trailing spend, `Actor.TICK = 1`): normal mode
		// costs 2 ticks, or 1 when 4+ behind; the bosses challenge costs 1 tick, or 0 when 4+ behind.
		assert.deepEqual(
			[[false, 0], [false, 1], [false, 3], [false, 4], [false, 8], [true, 1], [true, 3], [true, 4], [true, 8]]
				.map(([stronger, behind]) => tenguAbilityCost(stronger, behind)),
			[2, 2, 2, 1, 1, 1, 1, 0, 0],
		);
	});
	check('disintegration plans the Java range, hit bonus, terrain bonus, and flammable cells', () => {
		const cells = Array.from({ length: 10 }, () => ({ solid: false, flammable: false, victim: false, eligibleVictim: false }));
		cells[1].victim = cells[1].eligibleVictim = true;
		cells[2].solid = true;
		cells[3].flammable = true;
		cells[4].victim = cells[4].eligibleVictim = true;
		cells[5].victim = cells[5].eligibleVictim = true; // NPCs count through Actor.findChar
		const plan = planDisintegration(1, cells);
		assert.equal(plan.maxDistance, 8);
		assert.deepEqual(plan.victimCells, [1, 4, 5]);
		assert.deepEqual(plan.flammableCells, [3]);
		assert.equal(plan.terrainBonus, 1);
		assert.equal(plan.effectiveLevel, 4); // wand 1 + two extra hits + one terrain level
	});
	check('wand categories centralize identity and category-specific formulas', () => {
		const classes = [
			['WandOfMagicMissile', 'magicMissile'], ['WandOfFrost', 'frost'], ['WandOfFireblast', 'fireblast'],
			['WandOfLightning', 'lightning'], ['WandOfCorrosion', 'corrosion'], ['WandOfCorruption', 'corruption'],
			['WandOfDisintegration', 'disintegration'], ['WandOfBlastWave', 'blastWave'],
			['WandOfLivingEarth', 'livingEarth'], ['WandOfPrismaticLight', 'prismaticLight'],
			['WandOfRegrowth', 'regrowth'], ['WandOfTransfusion', 'transfusion'], ['WandOfWarding', 'warding'],
		];
		for (const [source, type] of classes) assert.equal(wandTypeFromSource(source), type);
		assert.equal(wandTypeFromSource(undefined), null);
		assert.equal(wandTypeFromSource('WandOfNotARealWand'), null);
		assert.equal(wandTargetRange('disintegration', 3), 12);
		assert.equal(wandTargetRange('frost', 9), 6);
		assert.equal(wandChargesPerCast('fireblast', 4), 2);
		assert.equal(wandChargesPerCast('magicMissile', 4), 1);
		//`WandOfLivingEarth.damageRoll()` is depth-scaled, never wand-level-scaled:
		//`NormalIntRange(2, 4 + scalingDepth()/2)` with Java's integer division.
		assert.deepEqual([1, 2, 3, 5, 10, 25].map(livingEarthZapRange),
			[[2, 4], [2, 5], [2, 5], [2, 6], [2, 9], [2, 16]]);
	});
	verifyHeroTurn(require, check);
	verifyCombat(require, check);
	check('Freezing escalates capped Chill into the shared Frost immobilization', () => {
		const { applyChillFreeze, BUFF_DURATION } = require('./simulation/buffs');
		//One `Freezing.freeze()` impact extends Chill by 3 dry (5 in water), it does
		//not refresh it to full - the old full-refresh froze after two contacts.
		const chilled = applyChillFreeze({ burning: 4 });
		assert.equal(chilled.frozen, false);
		assert.equal(chilled.buffs.chill, 3);
		assert.equal(chilled.buffs.burning, 4);
		assert.equal(applyChillFreeze({ burning: 4 }, 5).buffs.chill, 5);
		const building = applyChillFreeze({ chill: 6 });
		assert.equal(building.frozen, false);
		assert.equal(building.buffs.chill, 9);
		const capped = applyChillFreeze({ chill: 8 });
		assert.equal(capped.frozen, true);
		assert.equal(capped.buffs.chill, undefined);
		assert.equal(capped.buffs.frost, BUFF_DURATION.frost);
		const frozen = applyChillFreeze({ chill: BUFF_DURATION.chill, paralysis: 1 });
		assert.equal(frozen.frozen, true);
		assert.equal(frozen.buffs.chill, undefined);
		assert.equal(frozen.buffs.frost, BUFF_DURATION.frost);
		assert.equal(frozen.buffs.paralysis, BUFF_DURATION.frost);
	});
	verifyHeroActions(require, check);
	verifySearch(require, check);
	verifyCone(require, check);
	verifyRipperLeap(require, check);
	verifyActorCollision(require, check);
	verifyCombatRolls(require, check);
	verifySuccubusBlink(require, check);
	verifyArmorAbilities(require, check);
	check('Elemental.random() deals chaos at 1/50 with the fire/frost/shock split', () => {
		// `Elemental.random()` (Elemental.java, tag v3.3.8): `Float() < 1/50` chaos, else one
		// float for fire (<.4)/frost (<.8)/shock. The old `Random.int(0, 50) === 0` rolled over
		// 51 inclusive values - no sane sample distinguishes 1/51 from 1/50, so the exact draw
		// shape is pinned structurally while the live distribution gets a wide sanity band over
		// 20000 spawns (chaos 400, fire/frost 7840 each, shock 3920 - all ±10σ and then some).
		const { monsterSpawnProfile } = require('./actors/monsterSpawn');
		const counts = { chaos: 0, fire: 0, frost: 0, shock: 0 };
		for (let i = 0; i < 20000; i++) {
			const type = monsterSpawnProfile('elemental', 17, false, false, false, 1).elementalType;
			assert.ok(type !== undefined, 'every elemental rolls a type');
			counts[type]++;
		}
		assert.ok(counts.chaos >= 200 && counts.chaos <= 700, `chaos spawns: ${counts.chaos}`);
		for (const kind of ['fire', 'frost']) {
			assert.ok(counts[kind] >= 7000 && counts[kind] <= 8700, `${kind} spawns: ${counts[kind]}`);
		}
		assert.ok(counts.shock >= 3300 && counts.shock <= 4600, `shock spawns: ${counts.shock}`);
		const spawnSrc = readFileSync(new URL('../src/actors/monsterSpawn.ts', import.meta.url), 'utf8');
		assert.ok(spawnSrc.includes('Random.float() < 1 / 50'), 'chaos roll is a float draw at 1/50');
	});
	check('Bee.spawn() depth scaling matches Java, and the shatter chain is wired', () => {
		// `Bee.spawn(level)`: HT/HP `(2+level)*4`, evasion `9+level`, accuracy = evasion,
		// damage `NormalIntRange(HT/10, HT/4)` (Java int division floors). The port's
		// depth row evaluates the same closed shapes (40th matrix,
		// `MONSTER_ANALYSIS_HONEYPOT_BEE.md`).
		const { monsterSpawnProfile } = require('./actors/monsterSpawn');
		const at = (depth) => monsterSpawnProfile('bee', depth, false, false, false, 1).adjustedDef;
		assert.deepEqual([at(1).hp, at(1).accuracy, at(1).evasion, at(1).damage], [12, 10, 10, [1, 3]]);
		assert.deepEqual([at(5).hp, at(5).accuracy, at(5).evasion, at(5).damage], [28, 14, 14, [2, 7]]);
		assert.deepEqual([at(14).hp, at(14).accuracy, at(14).evasion, at(14).damage], [64, 23, 23, [6, 16]]);
		// Structural: the item routes to the shatter, the bee hunts through its own
		// override (never the generic dispatch), and the pot anchor persists.
		const scene = readSceneSource();
		const actions = readFileSync(new URL('../src/items/itemActions.ts', import.meta.url), 'utf8');
		assert.ok(actions.includes("id === 'honeypot') scene.useHoneypot(instanceId)"), 'honeypot routes to the shatter');
		assert.ok(scene.includes('bee: (monster) => { this.takeBeeTurn(monster); return true; }'), 'bee hunts through its own override');
		assert.ok(scene.includes('potPos: creature.potPos') && scene.includes('potPos: saved.potPos'), 'pot anchor persists through save/restore');
	});
	check('Sentry spawns unhittable with nonzero HP like Java', () => {
		//`SentryRoom$Sentry` (tag `v3.3.8`): `defenseSkill()` is INFINITE_EVASION and
		//`damage()` a no-op, so the turret can neither be hit nor killed. The base
		//`monsters.mwl` row already carries evasion 1000000 and hp 1 - this pins that
		//the `monsterDepthStats` override preserves both instead of clobbering them
		//to a hittable 0-HP turret (its accuracy half, 20+2*depth, is unaffected).
		const { monsterSpawnProfile } = require('./actors/monsterSpawn');
		const sentryAt = (depth) => monsterSpawnProfile('sentry', depth, false, false, false, 1).adjustedDef;
		assert.deepEqual([sentryAt(3).hp, sentryAt(3).accuracy, sentryAt(3).evasion], [1, 26, 1000000]);
		assert.deepEqual([sentryAt(10).hp, sentryAt(10).accuracy, sentryAt(10).evasion], [1, 40, 1000000]);
	});
	check('Sentry initial warmup survives a pre-activation floor save', () => {
		const floorState = readFileSync(new URL('../src/scenes/floorState.ts', import.meta.url), 'utf8');
		const spawn = readFileSync(new URL('../src/scenes/dungeon/coreSpawnTiles.ts', import.meta.url), 'utf8');
		assert.ok(floorState.includes('sentryInitialWarmup?: number'), 'save schema carries the room delay');
		assert.ok(spawn.includes('sentryInitialWarmup: creature.sentryInitialWarmup'), 'capture writes the room delay');
		assert.ok(spawn.includes('sentryInitialWarmup: saved.sentryInitialWarmup'), 'restore reads the room delay');
		//The turn hook prefers a consumed current delay, then the persisted room delay. This is
		//the exact Java distinction between CUR_DELAY and INITIAL_DELAY on SentryRoom$Sentry.
		const scene = readSceneSource();
		assert.ok(scene.includes('warmup: monster.sentryWarmup ?? monster.sentryInitialWarmup'), 'turn hook keeps both delays');
	});
	check('STRONGER_BOSSES raises DM300 and King HP to Java floors', () => {
		//`DM300`/`DwarfKing` HP=HT lines (tag `v3.3.8`): 300 normally, 400/450 under
		//the challenge - the same ternary shape Goo/Tengu/pylon already use here.
		const { monsterSpawnProfile } = require('./actors/monsterSpawn');
		const { toggleChallenge, isChallengeEnabled } = require('./challenges');
		if (!isChallengeEnabled('stronger_bosses')) toggleChallenge('stronger_bosses');
		try {
			assert.equal(monsterSpawnProfile('dm300', 15, false, false, false, 1).adjustedDef.hp, 400);
			assert.equal(monsterSpawnProfile('king', 20, false, false, false, 1).adjustedDef.hp, 450);
			assert.equal(monsterSpawnProfile('goo', 5, false, false, false, 1).adjustedDef.hp, 120);
			assert.equal(monsterSpawnProfile('tengu', 10, false, false, false, 1).adjustedDef.hp, 250);
		} finally {
			if (isChallengeEnabled('stronger_bosses')) toggleChallenge('stronger_bosses');
		}
		assert.equal(monsterSpawnProfile('dm300', 15, false, false, false, 1).adjustedDef.hp, 300);
		assert.equal(monsterSpawnProfile('king', 20, false, false, false, 1).adjustedDef.hp, 300);
	});
	check('Piranha deaths feed the PIRANHAS badge at six kills', () => {
		//`Piranha.die()` (tag `v3.3.8`): every death counts, any cause.
		const badges = readFileSync(new URL('../src/content/badges.mwl', import.meta.url), 'utf8');
		assert.ok(badges.includes('id: "piranhas"'), 'the piranhas badge row exists');
		assert.ok(badges.includes('counter: "piranhas"'), 'the row counts piranha kills');
		const scene = readSceneSource();
		assert.ok(scene.includes("creature.kind === 'piranha' || creature.kind === 'phantomPiranha'"),
			'every piranha death counts');
	});
	check('Pylon shock cursor follows CIRCLE8 from a random start', () => {
		//`Pylon.act()` (tag `v3.3.8`): `PathFinder.CIRCLE8` runs clockwise from
		//north-west, and `targetNeighbor` starts at `Random.Int(8)`.
		assert.deepEqual(CIRCLE8_OFFSETS, [
			[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0],
		]);
		const scene = readSceneSource();
		assert.ok(scene.includes('const offsets = CIRCLE8_OFFSETS'),
			'the pylon shock cursor reads CIRCLE8 order, not the north-first order');
		//monsterSpawn.ts lives outside the dungeon method groups readSceneSource covers.
		const spawnSource = readFileSync(new URL('../src/scenes/monsterSpawn.ts', import.meta.url), 'utf8');
		assert.ok(spawnSource.includes("pylonTargetNeighbor: kind === 'pylon' ? Random.int(0, 8) : undefined"),
			'the pylon cursor starts at a random 0-7 like Java Random.Int(8)');
	});
	check('Crystal mimic steals whole stacks, renames on reveal, waits boxed, uncurses prize', () => {
		//`CrystalMimic` minors (tag `v3.3.8`): `steal()` detaches the whole backpack
		//stack including gold/keys; `name()` flips to the monster once ENEMY; boxed
		//FLEEING waits instead of attacking; `generatePrize()` uncurses the prize.
		const scene = readSceneSource();
		assert.ok(!scene.includes("!['gold', 'crystalKey', 'ironKey'].includes(candidate.id)"),
			'steal no longer excludes gold and keys');
		assert.ok(scene.includes('monster.mimicLoot += `;heldGold:${qty}`'),
			'stolen gold rides the quantity-preserving heldGold payload');
		assert.ok(scene.includes("monster.name = t('actors.mobs.crystalmimic.name')"),
			'reveal flips the name from the chest to the monster');
		assert.ok(scene.includes('never falls through to attack/approach from'),
			'boxed FLEEING waits out the turn');
		assert.ok(scene.includes('prize.cursed = false'),
			'the restored prize is never cursed');
	});
	check('Piranhas remain confined to water in both wandering helpers', () => {
		const water = 7;
		const hero = { x: 2, y: 2 };
		const creatures = [{ kind: 'piranha', x: 1, y: 1 }, { kind: 'phantomPiranha', x: 3, y: 3 }, hero];
		const ctx = {
			width: 5, height: 5, cellCount: 25, waterTerrain: water,
			passable: () => true, inside: (x, y) => x >= 0 && y >= 0 && x < 5 && y < 5,
			terrainAt: (x, y) => (x === 1 && y === 2 ? water : 0),
			terrainAtCell: (cell) => cell === 11 ? water : 0,
			cellIndex: (x, y) => y * 5 + x, isChasm: () => false,
			creatureAt: (x, y) => creatures.find((c) => c.x === x && c.y === y) ?? null,
			creatures, hero, blockExtraInto: () => {}, pickElement: (items) => items[0],
		};
		const blocked = wanderBlocked(creatures[0], false, ctx);
		assert.ok(blocked.has(ctx.cellIndex(0, 0)), 'land is blocked for piranhas');
		assert.ok(!blocked.has(ctx.cellIndex(1, 2)), 'water remains available');
		assert.equal(isPatrolTargetValid({ x: 1, y: 2 }, true, ctx), true);
		assert.equal(isPatrolTargetValid({ x: 0, y: 0 }, true, ctx), false);
		assert.deepEqual(randomPatrolDestination(true, ctx), { x: 1, y: 2 });
	});
	check('PhantomPiranha keeps Java room rolls and remote-defense hooks', () => {
		const pool = readFileSync(new URL('../src/spdLevelGen/rooms/special/poolRoom.ts', import.meta.url), 'utf8');
		const aquarium = readFileSync(new URL('../src/spdLevelGen/rooms/standard/aquariumRoom.ts', import.meta.url), 'utf8');
		const combat = readFileSync(new URL('../src/scenes/dungeon/combatResolution.ts', import.meta.url), 'utf8');
		assert.ok(pool.includes("phantom ? 'phantomPiranha' : 'piranha'"), 'pool rooms instantiate the rolled variant');
		assert.ok(aquarium.includes("phantom ? 'phantomPiranha' : 'piranha'"), 'aquariums instantiate the rolled variant');
		assert.ok(combat.includes("defender.kind === 'phantomPiranha'"), 'remote damage reads the variant');
		assert.ok(combat.includes('phantomPiranhaTeleport'), 'live variants teleport after surviving remote damage');
		const blasts = readFileSync(new URL('../src/scenes/dungeon/panelsSingleUse.ts', import.meta.url), 'utf8');
		const environment = readFileSync(new URL('../src/scenes/dungeon/environmentFireTraps.ts', import.meta.url), 'utf8');
		assert.ok(blasts.includes("const phantomDirect = c.kind === 'phantomPiranha'"), 'blast seams halve direct phantom damage');
		assert.ok(environment.includes("const phantomDirect = target.kind === 'phantomPiranha'"), 'environment seams halve direct phantom damage');
	});
	check('HolyWard gates beneficial armor glyphs and refreshes derived state', () => {
		const scene = readSceneSource();
		assert.ok(scene.includes('armorGlyphActive'), 'armor glyph paths share the HolyWard gate');
		assert.ok(scene.includes("this.hero.buffs['holyWard'] === undefined"), 'the gate observes the live HolyWard buff');
		assert.ok(scene.includes("if (spell === 'holyWard') this.syncHeroFromStats()"), 'casting HolyWard refreshes derived hero state');
		assert.ok(scene.includes('hadHolyWard'), 'HolyWard expiry refreshes derived hero state');
	});
	check('Shock elementals halve lightning-family damage, rounded', () => {
		//`Char.Property.ELECTRIC` (tag `v3.3.8`): `Char.damage()` halves with
		//`Math.round` - same rounding the ACIDIC corrosion half uses.
		//2026-09-22: both gates widened from shock-only to every ELECTRIC holder
		//(shock elemental, DM100, Pylon, BrightFist) through one shared predicate.
		const scene = readSceneSource();
		assert.ok(scene.includes('electricDamageHalved(target.kind, target.elementalType, target.yogFistType)'),
			'the blob seam halves electricity for every ELECTRIC holder');
		assert.ok(scene.includes('electricDamageHalved(victim.kind, victim.elementalType, victim.yogFistType)'),
			'the lightning wand halves for every ELECTRIC holder');
		assert.ok(scene.includes('electricDamageHalved(hit.kind, hit.elementalType, hit.yogFistType)'),
			'the Shocking chain halves per hit');
	});
	check('Sentry turrets charge two turns, then gaze every visible turn', () => {
		//`SentryRoom$Sentry.act()` (tag `v3.3.8`): ~2-turn charge, fire every
		//visible turn after, warmup reset when the hero leaves sight.
		const events = [];
		let warmup;
		const base = {
			depth: 8,
			seesHero: true,
			canTargetHero: () => true,
			get warmup() { return warmup; },
			setWarmup: (value) => { warmup = value; },
			sayCharge: () => events.push('charge'),
			sayMiss: () => events.push('miss'),
			sayGaze: () => events.push('gaze'),
			rollHit: () => true,
			strikeHero: (min, max) => events.push(['strike', min, max]),
		};
		const monster = {};
		const hero = {};
		takeSentryTurn(monster, hero, base);
		takeSentryTurn(monster, hero, base);
		takeSentryTurn(monster, hero, base);
		assert.deepEqual(events, ['charge', 'charge', ['strike', 6, 12], 'gaze']);
		assert.equal(warmup, 0);
		//Losing sight resets the slow charge.
		takeSentryTurn(monster, hero, { ...base, seesHero: false });
		assert.equal(warmup, undefined);
		//A miss says so and never strikes.
		events.length = 0;
		takeSentryTurn(monster, hero, { ...base, warmup: 0, rollHit: () => false });
		assert.deepEqual(events, ['miss']);
	});
	check('Sentry turrets and sheep refuse buffs and direct damage', () => {
		//`SentryRoom$Sentry.add()`/`damage()` and `Sheep.add()`/`damage()`
		//(tag `v3.3.8`): both refuse everything - melee and zaps already fail
		//on infinite evasion, so the shared seams carry the no-op halves.
		const combat = readFileSync(new URL('../src/combat.ts', import.meta.url), 'utf8');
		assert.ok(combat.includes("if (c.kind === 'sentry') return true;"), 'sentries refuse buffs');
		const scene = readSceneSource();
		assert.ok(scene.includes("if (target.kind === 'sentry') return true;"), 'blob seams spare sentries');
		assert.ok(scene.includes('elemental.evasion = 5 * regionScale;'), 'newborns scale evasion by region');
		assert.ok(scene.includes('elemental.maxHp = 15 * regionScale;'), 'newborns scale HT by region');
	});
	check('Fire spreads onto webbed cells without destroying the floor', () => {
		//`Web.onUpdateCellFlags()` (tag `v3.3.8`) marks webbed cells flammable so
		//`Fire.evolve()` ignites them; the web decays on its own clock and the
		//floor underneath survives (only the solidity half is unmodeled).
		const scene = readSceneSource();
		assert.ok(scene.includes('this.isFireFlammableTerrain(x, y) || this.web.volumeAt(x, y) > 0'),
			'fire spread treats webbed cells as flammable');
		assert.ok(scene.includes('if (this.web.volumeAt(cell.x, cell.y) > 0) continue;'),
			'burnt-out webbed cells skip the ember pass');
	});
	check('tile frames stitch furrowed grass and exits like v2.1.4 Java', () => {
		//Art and frame code both follow v2.1.4's DungeonTileSheet layout (checked
		//pixel-for-pixel and constant-for-constant against the v2.1.4 tag - the
		//v3.3.8 sheet moved every wall/water row, so v3.3.8 numbers would draw
		//the wrong art here). Three v2.1.4 facts this pins:
		//- `waterStitcheable` includes FURROWED_GRASS (Terrain id 30);
		//- FURROWED_GRASS draws RAISED_FURROWED_GRASS (150, alt 154), not floor;
		//- UNLOCKED_EXIT draws FLAT_WALLS+12 (76), not 78.
		const frames = readFileSync(new URL('../src/scenes/dungeonTileFrames.ts', import.meta.url), 'utf8');
		const dry = /const dry = new Set<number>\(\[([^\]]+)\]\)/.exec(frames);
		assert.ok(dry, 'waterFrames carries a literal dry set');
		const ids = dry[1].split(',').map((s) => Number(s.trim())).sort((a, b) => a - b);
		assert.deepEqual(ids, [1, 2, 3, 5, 6, 7, 8, 9, 10, 13, 15, 17, 18, 19, 20, 23, 24, 25, 28, 30, 31, 35, 36]);
		assert.ok(/Terrain\.FURROWED_GRASS\) return alternate\(150\)/.test(frames),
			'furrowed grass renders its own raised frame');
		assert.ok(frames.includes('150: 154'), 'furrowed alt variant registered');
		assert.ok(/raw === 22\) return 76/.test(frames), 'unlocked exit draws frame 76');
		assert.ok(!/raw === 22\) return 78/.test(frames), 'unlocked exit no longer draws frame 78');
	});
	check('Thief\u2019s Intuition marks ring types known by rank', () => {
		const { thiefsIntuitionKnownIds } = require('./simulation/ringKnow');
		//Rank 1: worn rings only.
		assert.deepEqual(thiefsIntuitionKnownIds(['ring_force', null], ['ring_haste', 'ring_force'], 1), ['ring_force']);
		assert.deepEqual(thiefsIntuitionKnownIds([null, null], ['ring_haste'], 1), []);
		//Rank 2: worn plus every carried ring, deduplicated.
		assert.deepEqual(
			thiefsIntuitionKnownIds(['ring_force', null], ['ring_haste', 'ring_force'], 2).sort(),
			['ring_force', 'ring_haste'],
		);
	});
	check('Ctrl+wheel steps the zoom offset down on roll-down, up on roll-up', () => {
		const { wheelZoomStep } = require('./simulation/zoomStep');
		assert.equal(wheelZoomStep(120), -1);
		assert.equal(wheelZoomStep(-120), 1);
		assert.equal(wheelZoomStep(0), 0);
		assert.equal(wheelZoomStep(NaN), 0);
	});
	check('chasm steps warn unless flying or already confirmed', () => {
		const { chasmJumpLatched, setChasmJumpLatched, chasmStepNeedsConfirm } = require('./simulation/chasmJump');
		const scene = {};
		assert.equal(chasmStepNeedsConfirm(true, false, chasmJumpLatched(scene)), true);
		assert.equal(chasmStepNeedsConfirm(true, true, false), false);
		assert.equal(chasmStepNeedsConfirm(false, false, false), false);
		setChasmJumpLatched(scene, true);
		assert.equal(chasmJumpLatched(scene), true);
		assert.equal(chasmStepNeedsConfirm(true, false, chasmJumpLatched(scene)), false);
		setChasmJumpLatched(scene, false);
		assert.equal(chasmJumpLatched(scene), false);
	});
	check('spare wands arrive full, recharge alone, and feed WildMagic selection', () => {
		const { spareWandMaxCharges, newSpareWandCharges, rechargeSpareWand, wildMagicShotCost, wildMagicShots, spendWildMagicShot } = require('./simulation/spareWands');
		assert.equal(spareWandMaxCharges(2, 0), 2);
		assert.equal(spareWandMaxCharges(3, 0), 3);
		assert.equal(spareWandMaxCharges(2, 3), 5);
		assert.equal(spareWandMaxCharges(2, 9), 10);
		const full = newSpareWandCharges(2);
		assert.deepEqual([full.cur, full.partial, full.max], [2, 0, 2]);
		rechargeSpareWand(full, 0.5);
		assert.deepEqual([full.cur, full.partial], [2, 0], 'progress past a full wand is dropped');
		const spent = { cur: 0, partial: 0, max: 2 };
		rechargeSpareWand(spent, 1.5);
		assert.deepEqual([spent.cur, spent.partial], [1, 0.5]);
		assert.equal(wildMagicShotCost(0), 0.5);
		assert.ok(Math.abs(wildMagicShotCost(2) - 0.5 * 0.67 * 0.67) < 1e-9);
		const identity = (arr) => arr.slice();
		const zero = () => 0;
		const states = [{ cur: 2, partial: 0 }, { cur: 0, partial: 0.4 }, { cur: 0, partial: 0 }];
		assert.deepEqual(wildMagicShots(states, 0, 0, identity, zero), [0, 0], 'only the charged wand is eligible, doubled through the seconds round');
		const rich = [{ cur: 3, partial: 0 }];
		assert.deepEqual(wildMagicShots(rich, 0, 0, identity, zero), [0, 0], 'one rich wand fires twice: first plus the seconds round, never thirds at zero FIRE_EVERYTHING');
		const shot = { cur: 1, partial: 0, max: 2 };
		spendWildMagicShot(shot, 0.5);
		assert.deepEqual([shot.cur, shot.partial], [0, 0.5], 'a partial-only cost still borrows the charge it spends through');
		const borrowed = { cur: 1, partial: 0.2, max: 2 };
		spendWildMagicShot(borrowed, 0.5);
		assert.deepEqual([borrowed.cur, borrowed.partial], [0, 0.7], 'the shot borrows a whole charge when partial runs out');
		const { wildMagicBoostedLevel } = require('./simulation/spareWands');
		assert.equal(wildMagicBoostedLevel(0, 0, false), 2, 'untalented bonus is +2');
		assert.equal(wildMagicBoostedLevel(0, 0, true), 2, 'the coin halves away at rank 0');
		assert.equal(wildMagicBoostedLevel(0, 1, true), 3, 'rank 1 coin lands +3 at the cap');
		assert.equal(wildMagicBoostedLevel(1, 4, true), 5, 'rank 4 coin lands +4 below its cap of 7');
		assert.equal(wildMagicBoostedLevel(3, 0, false), 3, 'no boost at or above the cap');
	});
	check('cursedWand picks the six ported Common effects uniformly and reads the exact Java tables', () => {
		//`CursedWand.cursedZap()`'s Common tier (`simulation/cursedWand.ts` has the full
		//scoping rationale for why only 6 of 8 are modeled).
		const { CURSED_COMMON_EFFECT_IDS, pickCursedCommonEffect, CURSED_RANDOM_GAS, pickBurnAndFreeze,
			CURSED_UNCOMMON_EFFECT_IDS, pickCursedUncommonEffect, pickCursedTier, CURSED_PLANT_KINDS,
			CURSED_RARE_EFFECT_IDS, pickCursedRareEffect, CONE_OF_COLORS_STATUSES, pickConeOfColorsStatus } = require('./simulation/cursedWand');
		assert.deepEqual(CURSED_COMMON_EFFECT_IDS, ['burnAndFreeze', 'randomTeleport', 'randomGas', 'bubbles', 'randomWand', 'selfOoze']);
		assert.equal(pickCursedCommonEffect((n) => { assert.equal(n, 6); return 0; }), 'burnAndFreeze');
		assert.equal(pickCursedCommonEffect((n) => { assert.equal(n, 6); return 5; }), 'selfOoze');
		assert.deepEqual(CURSED_UNCOMMON_EFFECT_IDS, ['healthTransfer', 'geyser', 'summonSheep', 'levitate', 'alarm', 'randomPlant', 'explosion', 'lightningBolt']);
		assert.equal(pickCursedUncommonEffect((n) => { assert.equal(n, 8); return 0; }), 'healthTransfer');
		assert.equal(pickCursedUncommonEffect((n) => { assert.equal(n, 8); return 7; }), 'lightningBolt');
		assert.deepEqual(CURSED_PLANT_KINDS, ['blindweed', 'earthroot', 'fadeleaf', 'firebloom', 'icecap', 'mageroyal',
			'rotberry', 'sorrowmoss', 'starflower', 'stormvine', 'sungrass', 'swiftthistle']);
		assert.deepEqual(CURSED_RARE_EFFECT_IDS, ['massInvuln', 'coneOfColors', 'sheepPolymorph']);
		assert.equal(pickCursedRareEffect((n) => { assert.equal(n, 3); return 0; }), 'massInvuln');
		assert.equal(pickCursedRareEffect((n) => { assert.equal(n, 3); return 1; }), 'coneOfColors');
		assert.equal(pickCursedRareEffect((n) => { assert.equal(n, 3); return 2; }), 'sheepPolymorph');
		//ConeOfColors.effect()'s Random.Int(5): burning/frost/poison/ooze/electricity.
		assert.deepEqual(CONE_OF_COLORS_STATUSES, ['burning', 'frost', 'poison', 'ooze', 'electricity']);
		assert.equal(pickConeOfColorsStatus((n) => { assert.equal(n, 5); return 0; }), 'burning');
		assert.equal(pickConeOfColorsStatus((n) => { assert.equal(n, 5); return 4; }), 'electricity');
		//EFFECT_CAT_CHANCES's real common/uncommon/rare weights (60/30/9 of 99, VeryRare's 1%
		//folded into Rare).
		assert.equal(pickCursedTier((n) => { assert.equal(n, 99); return 0; }), 'common');
		assert.equal(pickCursedTier((n) => { assert.equal(n, 99); return 59; }), 'common');
		assert.equal(pickCursedTier((n) => { assert.equal(n, 99); return 60; }), 'uncommon');
		assert.equal(pickCursedTier((n) => { assert.equal(n, 99); return 89; }), 'uncommon');
		assert.equal(pickCursedTier((n) => { assert.equal(n, 99); return 90; }), 'rare');
		assert.equal(pickCursedTier((n) => { assert.equal(n, 99); return 98; }), 'rare');
		//RandomGas.effect()'s Random.Int(3): ConfusionGas 800, ToxicGas 500, ParalyticGas 200.
		assert.deepEqual(CURSED_RANDOM_GAS, [
			{ id: 'confusionGas', volume: 800 },
			{ id: 'toxicGas', volume: 500 },
			{ id: 'paralyticGas', volume: 200 },
		]);
		//BurnAndFreeze.effect()'s Random.Int(2): true (Int==0) gives the user Frost and the
		//target Burning; false gives the user Burning and the target Frost.
		assert.deepEqual(pickBurnAndFreeze(true), { userStatus: 'frost', targetStatus: 'burning' });
		assert.deepEqual(pickBurnAndFreeze(false), { userStatus: 'burning', targetStatus: 'frost' });
	});
	check('the vault branch stays fully absent (VaultSentry + rooms + quest)', () => {
		//PORT_COVERAGE.md's VaultSentry row: the mob only spawns from the
		//unported crystal-key VaultLevel branch, so porting it alone would be
		//dead code. This pins the absence - no spawn kind, room table, or
		//quest state may mention it - so a half-port fails loudly.
		//(`crystalVault`/`crystalChoice` rooms are the ported crystal-key queue,
		//not this branch, so the ban names the sentry and the quest branch only.)
		for (const file of ['monsters.mwl', 'dungeon-rosters.mwl', 'room-rules.mwl', 'actor-rules.mwl']) {
			const text = readFileSync(new URL(`../src/content/${file}`, import.meta.url), 'utf8');
			assert.ok(!/vaultsentry|quest\/vault|vaultlevel/i.test(text), `${file} mentions the vault branch`);
		}
		const roster = readFileSync(new URL('../src/monsters.ts', import.meta.url), 'utf8');
		assert.ok(!/vaultsentry/i.test(roster), 'monsters.ts carries a VaultSentry kind');
	});
	verifyRings(require, check);
	verifyPrismatic(require, check);
	verifyBrews(require, check);
	verifySmoke(require, check);
	verifyDoors(require, check);
	verifyShakes(require, check);
	verifyParticles(require, check);
	verifyProjectiles(require, check);
	verifyClericSpells(require, check);
	verifyGnollMine(require, check);
	verifyParalysisOrdering(require, check);
	verifyTrinitySpirit(require, check);
	verifyTrinitySpiritRing(require, check);
	console.log(`${passed} simulation checks passed.`);
} finally {
	// Only the fresh directory returned by mkdtempSync above is removed.
	rmSync(output, { recursive: true, force: true });
}
