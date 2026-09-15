import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = fileURLToPath(new URL('../node_modules/mwg/dist/', import.meta.url));
const out = mkdtempSync(join(tmpdir(), 'spd-items-'));
function fileURLToPath(url) { return new URL(url).pathname.replace(/^\//, '').replaceAll('/', '\\'); }
function compile(source, destination) {
	const target = join(out, destination);
	mkdirSync(dirname(target), { recursive: true });
	writeFileSync(target, ts.transpileModule(readFileSync(source, 'utf8'), {
		compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, rewriteRelativeImportExtensions: true },
	}).outputText);
}
try {
	writeFileSync(join(out, 'package.json'), '{"type":"commonjs"}');
	compile(join(root, 'src/generated/mwlContent.ts'), 'generated/mwlContent.js');
	compile(join(root, 'src/mwlContent.ts'), 'mwlContent.js');
	// Compiled under items/, preserving the real src/items/ nesting - ringModifiers.ts's own
	// `../mwlContent` import needs its true relative depth to resolve to the mwlContent.js above.
	compile(join(root, 'src/items/catalog.ts'), 'items/catalog.js');
	compile(join(root, 'src/items/itemWorkflows.ts'), 'items/workflows.js');
	compile(join(root, 'src/items/ringModifiers.ts'), 'items/ringModifiers.js');
	compile(join(root, 'src/items/transmutation.ts'), 'items/transmutation.js');
	compile(join(root, 'src/items/missiles.ts'), 'items/missiles.js');
	compile(join(root, 'src/items/itemCurses.ts'), 'items/itemCurses.js');
	compile(join(root, 'src/items/blacksmith.ts'), 'items/blacksmith.js');
	// simulation/buffs.ts is framework-free (its mwg/random import is type-only), so the
	// monster-immunity gate is unit-tested here directly against the generated table.
	compile(join(root, 'src/simulation/mwlMonsterImmunities.ts'), 'simulation/mwlMonsterImmunities.js');
	compile(join(root, 'src/simulation/mwlBuffDurations.ts'), 'simulation/mwlBuffDurations.js');
	compile(join(root, 'src/simulation/buffs.ts'), 'simulation/buffs.js');
	// alchemy.ts reads the no_healing challenge toggle for the AlchemicalCatalyst reroll rule via
	// `isChallengeEnabled`; the real challenges.ts also pulls in the full i18n/message catalogue
	// (for its display strings), which this narrow harness has no need to load - a tiny stub
	// standing in for the one function this workflow path actually calls is simpler and more
	// robust than compiling the real module transitively. This harness never exercises the
	// challenge toggle itself (no_healing is covered live, not headlessly), so "always disabled"
	// is a safe stand-in here.
	writeFileSync(join(out, 'challenges.js'), 'exports.isChallengeEnabled = () => false;\n');
	compile(join(root, 'src/items/alchemy.ts'), 'items/alchemy.js');
	compile(join(root, 'src/items/groundPickup.ts'), 'items/groundPickup.js');
	// The framework side is the installed `@datamoc/mw_games` build the game itself ships,
	// shimmed rather than compiled from a sibling checkout of the framework's sources - the two
	// are different versions in general, so compiling a checkout would test something this port
	// does not depend on. mwg's dist is ESM and this temporary tree is CommonJS, which `require()`
	// bridges directly on Node >= 22.12.
	function shim(destination, source) {
		const target = join(out, destination);
		mkdirSync(dirname(target), { recursive: true });
		writeFileSync(target, `module.exports = require(${JSON.stringify(source)});\n`);
	}
	shim(join('actors', 'Inventory.js'), join(dist, 'actors', 'Inventory.js'));
	shim(join('actors', 'Appearances.js'), join(dist, 'actors', 'Appearances.js'));
	shim(join('node_modules', 'mwg', 'actors.js'), join(dist, 'actors', 'index.js'));
	shim(join('core', 'Random.js'), join(dist, 'core', 'Random.js'));
	shim(join('node_modules', 'mwg', 'mwl', 'index.js'), join(dist, 'mwl', 'index.js'));
	//The workflow module imports only actors and Random from the package, so provide a tiny local barrel.
	mkdirSync(join(out, 'node_modules/mwg'), { recursive: true });
	writeFileSync(join(out, 'node_modules/mwg/index.js'),
		`exports.Actors = require(${JSON.stringify(join(dist, 'actors', 'index.js'))}); exports.Random = require(${JSON.stringify(join(dist, 'core', 'Random.js'))});\n`);
	const require = createRequire(join(out, 'check.cjs'));
	const { Inventory } = require('./actors/Inventory.js');
	const { Appearances } = require('./actors/Appearances.js');
	const { transferEnhancement, upgradeItem } = require('./items/workflows.js');
	const { transmuteItem } = require('./items/transmutation.js');
	const { missileDamageRange, missilePickupValid, recordMissileUpgrade } = require('./items/missiles.js');
	const { blacksmithTurnInFavor, BLACKSMITH_FAVOR_CAP, BLACKSMITH_QUEST_BOSS_BONUS } = require('./items/blacksmith.js');
	const { alchemicalCatalystCost, arcaneCatalystCost, canCraftPotionSeed, craftPotionSeed, craftAlchemicalCatalyst, craftArcaneCatalyst } = require('./items/alchemy.js');
	const { pickupGroundItem } = require('./items/groundPickup.js');
	const { MWL_CONSUMABLE_DESCRIPTION_KEYS, MWL_MISSILE_DESCRIPTION_KEYS, MWL_GROUND_ITEM_NAME_KEYS, MWL_ITEM_GROUND_KIND_ALIASES, MWL_ITEM_NAME_KEYS, mwlItemEffectValue } = require('./mwlContent.js');
	const bag = new Inventory();
	bag.add({ id: 'sword', quantity: 1, stackable: true, instanceId: 'flame', level: 2, affix: 'blazing' });
	bag.add({ id: 'sword', quantity: 1, stackable: true, instanceId: 'frost', level: 1, affix: 'chilling' });
	assert.equal(bag.items.length, 2);
	const source = bag.take('sword', 1, 'flame');
	const target = bag.take('sword', 1, 'frost');
	assert.ok(source && target);
	transferEnhancement(source, target);
	assert.equal(target.instanceId, 'frost');
	assert.equal(target.affix, 'blazing');
	upgradeItem(target, 1);
	assert.equal(target.level, 3);
	const looks = new Appearances({ potion: { kinds: ['a', 'b'], labels: ['red', 'blue'] } });
	const first = looks.appearanceOf('potion', 'a');
	const restored = Appearances.fromJSON({ potion: { kinds: ['a', 'b'], labels: ['red', 'blue'] } }, looks.toJSON());
	assert.equal(restored.appearanceOf('potion', 'a'), first);
	const ring = transmuteItem({ id: 'ring_might', quantity: 1, identified: true, level: 4, cursed: false }, (kind) => `test-${kind}`);
	assert.ok(ring);
	assert.equal(ring.level, 4);
	// `MissileWeapon.UpgradedSetTracker.pickupValid`: no tracker, no entry, or a level at/above
	// the recorded threshold merges; anything below the threshold crumbles to dust instead.
	assert.equal(missilePickupValid(undefined, 1, 0), true);
	assert.equal(missilePickupValid(new Map(), 1, 0), true);
	assert.equal(missilePickupValid(new Map([[1, 2]]), undefined, 0), true);
	assert.equal(missilePickupValid(new Map([[1, 2]]), 2, 0), true);
	assert.equal(missilePickupValid(new Map([[1, 2]]), 1, 2), true);
	assert.equal(missilePickupValid(new Map([[1, 2]]), 1, 3), true);
	assert.equal(missilePickupValid(new Map([[1, 2]]), 1, 1), false);
	assert.equal(missilePickupValid(new Map([[1, 2]]), 1, 0), false);
	// `MissileWeapon.upgrade()`: the upgraded set records trueLevel()+1, immutably.
	const recorded = recordMissileUpgrade(new Map(), 1, 2);
	assert.deepEqual([...recorded], [[1, 2]]);
	assert.equal(recordMissileUpgrade(recorded, 1, 5).get(1), 5);
	// `Potion.SeedToPotion`: generic seed payloads retain their concrete source class in the
	// stack key, and one distinct source maps deterministically to its regular potion.
	const seedBag = new Inventory();
	seedBag.add({ id: 'seed', quantity: 1, stackable: true, identified: true, sourceClass: 'Sungrass', instanceId: 'seed:sungrass' });
	seedBag.add({ id: 'seed', quantity: 1, stackable: true, identified: true, sourceClass: 'Sungrass', instanceId: 'seed:sungrass' });
	seedBag.add({ id: 'seed', quantity: 1, stackable: true, identified: true, sourceClass: 'Sungrass', instanceId: 'seed:sungrass' });
	assert.equal(seedBag.items.length, 1);
	assert.equal(seedBag.items[0].quantity, 3);
	assert.equal(canCraftPotionSeed(seedBag), true);
	assert.deepEqual(craftPotionSeed(seedBag), { id: 'potionHealing', identified: true });
	assert.equal(seedBag.items.length, 0);
	const catalystBag = new Inventory();
	catalystBag.add({ id: 'potionHealing', quantity: 1, stackable: true });
	catalystBag.add({ id: 'seed', quantity: 1, stackable: true, sourceClass: 'Sungrass', instanceId: 'seed:sungrass' });
	assert.equal(alchemicalCatalystCost(catalystBag), 0);
	assert.equal(craftAlchemicalCatalyst(catalystBag), true);
	assert.ok(catalystBag.find('alchemicalCatalyst'));
	const arcaneBag = new Inventory();
	arcaneBag.add({ id: 'scrollIdentify', quantity: 1, stackable: true });
	arcaneBag.add({ id: 'stoneOfIntuition', quantity: 1, stackable: true });
	assert.equal(arcaneCatalystCost(arcaneBag), 0);
	assert.equal(craftArcaneCatalyst(arcaneBag), true);
	assert.ok(arcaneBag.find('arcaneCatalyst'));
	assert.deepEqual(missileDamageRange('ThrowingStone', 0), [2, 5]);
	assert.deepEqual(missileDamageRange('ThrowingStone', 3), [5, 8]);
	assert.deepEqual(missileDamageRange('ThrowingKnife', 3, 2), [7, 14]);
	assert.deepEqual(missileDamageRange('ThrowingSpike', 2), [4, 7]);
	// `Blacksmith.Quest.complete()` favor: 50 per ore capped at 2000, +1000 for the beaten
	// quest-branch boss. 15 ore is the minimum turn-in (750), 40 ore hits the cap exactly.
	assert.equal(BLACKSMITH_FAVOR_CAP, 2000);
	assert.equal(BLACKSMITH_QUEST_BOSS_BONUS, 1000);
	assert.equal(blacksmithTurnInFavor(15, false), 750);
	assert.equal(blacksmithTurnInFavor(40, false), 2000);
	assert.equal(blacksmithTurnInFavor(99, false), 2000);
	assert.equal(blacksmithTurnInFavor(15, true), 1750);
	assert.equal(blacksmithTurnInFavor(40, true), 3000);
	assert.equal(Object.keys(MWL_MISSILE_DESCRIPTION_KEYS).length, 15);
	assert.equal(MWL_MISSILE_DESCRIPTION_KEYS.missile_forcecube, 'items.weapon.missiles.forcecube.desc');
	assert.equal(Object.keys(MWL_CONSUMABLE_DESCRIPTION_KEYS).length, 64);
	assert.equal(MWL_CONSUMABLE_DESCRIPTION_KEYS.seedStarflower, 'plants.starflower.desc');
	assert.equal(mwlItemEffectValue('scrollMirror', 'imageCount'), 2);
	assert.equal(mwlItemEffectValue('scrollRetribution', 'maxPower'), 4);
	assert.equal(mwlItemEffectValue('potionFrost', 'radius'), 2);
	assert.equal(mwlItemEffectValue('runestones', 'targetRange'), 8);
	assert.equal(mwlItemEffectValue('runestones', 'blastMaxPerDepth'), 3);
	assert.equal(mwlItemEffectValue('bombs', 'targetRange'), 8);
	assert.equal(mwlItemEffectValue('waterskin', 'healFractionPerDrop'), 0.05);
	assert.equal(mwlItemEffectValue('wandTransfusion', 'healingPerLevel'), 3);
	// Java's Dewdrop.doPickUp removes the heap only after consumeDew accepts it. A full,
	// fully-healed Waterskin refuses ordinary floor pickups, while the entrance/exit force
	// path consumes one anyway. Pin the transaction ordering here so a UI refactor cannot
	// silently lose a dewdrop before its refusal is known.
	for (const force of [false, true]) {
		let removed = 0;
		let collected = 0;
		pickupGroundItem({
			item: { id: `dew-${force}`, kind: 'dewdrop', x: 4, y: 4 }, depth: 1, heroClass: 'warrior', gold: 0,
			hasItem: () => false, removeItem: () => {}, setGold: () => {}, shopPrice: () => 0,
			itemName: () => 'Dewdrop', missilePickupValid: () => true, removeGround: () => { removed++; },
			playSound: () => {}, addItem: () => {}, identify: () => {}, say: () => {}, showStatus: () => {},
			forceDewdropPickup: () => force,
			collectDewdrop: () => { collected++; return force; }, addSand: () => {},
			addEnergy: () => {}, addLooseGold: () => {}, recoverStone: () => {}, pickupArmor: () => {},
			pickupWand: () => {}, pickupAmulet: () => {}, pickupRing: () => {}, pickupCrystalKey: () => {},
			addSimpleGroundKind: () => {}, messages: {
				crystalChestLocked: '', unlockCrystalChest: '', lockedChestNeedsGoldenKey: '', unlockChest: '',
				cannotAfford: () => '', buy: () => '', missileDust: '', noHourglassSand: '', snuffFuse: '',
				freeDoubleBomb: '', pickup: () => '', pickupGold: () => '', recoverStone: '', pickUpRing: () => '',
			},
		});
		assert.equal(collected, 1);
		assert.equal(removed, force ? 1 : 0);
	}
	assert.equal(MWL_ITEM_GROUND_KIND_ALIASES.weaponReward, 'armor');
	assert.equal(MWL_ITEM_GROUND_KIND_ALIASES.doubleBomb, 'bomb');
	assert.equal(Object.keys(MWL_ITEM_GROUND_KIND_ALIASES).length, 23, 'ground-kind alias count');
	assert.equal(MWL_ITEM_NAME_KEYS.weaponReward, 'port.name.questweapon');
	assert.equal(MWL_ITEM_NAME_KEYS.sandBag, 'items.artifacts.timekeepershourglass$sandbag.name');
	assert.equal(MWL_GROUND_ITEM_NAME_KEYS.bomb, 'items.bombs.bomb.name');
	assert.equal(MWL_GROUND_ITEM_NAME_KEYS.seed, 'plants.plant$seed$placeholder.name');
	assert.equal(recorded.get(1), 2);
	// `Unstable.randomEnchants` (`items/weapon/enchantments/Unstable.java`, tag `v3.3.8`): the
	// eleven enchantments its proc may delegate a swing to, in Java's own array order - the port
	// picks a delegate from a single draw, so the index each one sits at has to be Java's for that
	// draw to mean the same thing. Projecting is Java's deliberate omission ("no on-hit effect")
	// and Unstable never delegates to itself; the check fails both ways, on a missing delegate and
	// on one Java does not list.
	const { gameData } = require('./generated/mwlContent');
	const tableRows = (id, field = 'enchant') => {
		const tables = [];
		const walk = (node) => {
			if (node.tag === 'table' && node.attributes?.id === id) tables.push(node);
			for (const child of node.children ?? []) walk(child);
		};
		for (const rootNode of gameData.roots) walk(rootNode);
		assert.equal(tables.length, 1, `exactly one ${id} table`);
		return tables[0].children.filter((child) => child.tag === 'row').map((row) => row.attributes[field]);
	};
	assert.deepEqual(tableRows('unstableEnchants'), [
		'blazing', 'blocking', 'blooming', 'chilling', 'kinetic', 'corrupting', 'elastic',
		'grim', 'lucky', 'shocking', 'vampiric',
	], 'Unstable delegates to exactly Java\'s list, in Java\'s order');
	assert.equal(tableRows('wandDamageRules').length, 8, 'wand damage rule count');
	assert.equal(tableRows('wandFireblastRules').length, 3, 'Fireblast charge rule count');
	assert.equal(tableRows('wandRegrowthRules').length, 3, 'Regrowth charge rule count');
	assert.deepEqual(tableRows('monsterDepthStats', 'monster'), [
		'mimic', 'crystalMimic', 'piranha', 'bee', 'statue', 'armoredStatue', 'sentry',
	], 'depth-scaled monster formulas stay authored in actor-rules.mwl');
	assert.deepEqual(tableRows('heroBaseStats', 'id'), ['spdHero'], 'hero base stats stay authored in actor-rules.mwl');
	assert.deepEqual(tableRows('heroLevelGrowth', 'id'), ['spdHeroLevelGrowth'], 'hero level growth stays authored in actor-rules.mwl');
	assert.deepEqual(tableRows('monsterSpriteOverrides', 'monster'), [
		'sheep', 'ward', 'earthGuardian', 'sentry', 'ratKing', 'rotHeart', 'rotLasher',
		'fetidRat', 'gnollTrickster', 'greatCrab', 'necroSkeleton', 'newbornElemental',
		'mimic', 'piranha', 'bee', 'statue',
	], 'monster sprite-source overrides stay authored in asset-references.mwl');
	assert.equal(tableRows('monsterSpriteFrames', 'monster').length, 65, 'all monster sprite frame metadata stays authored in asset-references.mwl');
	assert.deepEqual(tableRows('specialItemInventoryRules', 'sourceClass'), [
		'Bomb', 'DoubleBomb', 'CorpseDust', 'CeremonialCandle', 'Embers', 'Ankh', 'Stylus',
		'Honeypot', 'Alchemize', 'Bag', 'SandBag',
	], 'special inventory identities stay authored in MWL');
	// ringModifiers.ts derives RING_DEFS from rings.mwl's authored add: level/multiply: BASE^level
	// effects rather than hand-copying their numbers - this pins the resulting formulas to the
	// exact values every ring's Java citation names, so a future rings.mwl edit that silently
	// changes a base, or renames an apply_to the lookup depends on, fails loudly here instead of
	// only at runtime. Caught a real bug during that refactor: ringHaste's effect is authored as
	// apply_to: "haste", not speed (this port's own internal stat name for the same ring).
	const { RING_DEFS } = require('./items/ringModifiers.js');
	const ringPower = (key, base) => { for (const level of [0, 1, 3, 7]) assert.equal(RING_DEFS[key].at(level), Math.pow(base, level), `${key} at level ${level}`); };
	ringPower('accuracy', 1.3);
	ringPower('evasion', 1.125);
	ringPower('haste', 1.175);
	ringPower('energy', 1.175);
	ringPower('wealth', 1.2);
	ringPower('arcana', 1.175);
	ringPower('elements', 0.825);
	ringPower('furor', 1.09051);
	for (const key of ['might', 'force', 'sharpshooting']) {
		for (const level of [0, 1, 3, 7]) assert.equal(RING_DEFS[key].at(level), level, `${key} at level ${level}`);
	}
	// itemKinds.ts/generatedItems.ts read weapon/armor tiers from catalog.ts's MWL-sourced
	// WEAPON_TIER_BY_CLASS/ARMOR_TIER_BY_CLASS rather than each hand-typing its own copy of the
	// same 31+5 class-to-tier assignments (three independent copies existed before this pass).
	const { WEAPON_TIER_BY_CLASS, ARMOR_TIER_BY_CLASS } = require('./items/catalog.js');
	const expectedWeaponTiers = {
		wornshortsword: 1, magesstaff: 1, dagger: 1, gloves: 1, rapier: 1,
		shortsword: 2, handaxe: 2, spear: 2, quarterstaff: 2, dirk: 2, sickle: 2,
		sword: 3, mace: 3, scimitar: 3, roundshield: 3, sai: 3, whip: 3,
		longsword: 4, battleaxe: 4, flail: 4, runicblade: 4, assassinsblade: 4, crossbow: 4, katana: 4,
		greatsword: 5, warhammer: 5, glaive: 5, greataxe: 5, greatshield: 5, gauntlet: 5, warscythe: 5,
	};
	for (const [id, tier] of Object.entries(expectedWeaponTiers)) assert.equal(WEAPON_TIER_BY_CLASS[id], tier, `weapon ${id}`);
	assert.equal(Object.keys(WEAPON_TIER_BY_CLASS).length, Object.keys(expectedWeaponTiers).length, 'weapon tier count');
	const expectedArmorTiers = { clotharmor: 1, leatherarmor: 2, mailarmor: 3, scalearmor: 4, platearmor: 5 };
	for (const [id, tier] of Object.entries(expectedArmorTiers)) assert.equal(ARMOR_TIER_BY_CLASS[id], tier, `armor ${id}`);
	assert.equal(Object.keys(ARMOR_TIER_BY_CLASS).length, Object.keys(expectedArmorTiers).length, 'armor tier count');
	// `Generator.java`'s static deck tables (tag `v2.1.4`, the baseline these MWL decks
	// reproduce): every tier/category's class order and starting weights are authored data, so
	// a typo'd class or weight would compile clean and only surface as wrong loot at runtime -
	// the same silent-failure shape the loot-kind validators in tools/compile-mwl.mjs close at
	// compile time. This pins all seventeen decks to Java's values so MWL drift fails loudly
	// here instead. Class order matters as much as the weights: `Random.chances()` resolves a
	// draw to an index, and the index maps to a class.
	const { MWL_TRAIT_NODES, MWL_TABLE_ROWS } = require('./mwlContent.js');
	const mwlDeck = (id) => {
		const deck = MWL_TRAIT_NODES.find((node) => node.attributes?.id === id);
		assert.ok(deck, `MWL generator deck is present: ${id}`);
		const value = (key) => {
			const effect = deck.children.find((child) => child.tag === 'effect' && child.attributes?.apply_to === key);
			assert.ok(effect?.attributes?.set !== undefined, `MWL generator deck ${id} carries ${key}`);
			return String(effect.attributes.set);
		};
		return {
			classes: value('classes').split(',').map((entry) => entry.trim()).filter(Boolean),
			probs: value('default_probs').split(',').map(Number),
		};
	};
	const EXPECTED_GENERATOR_DECKS = {
		weaponDeckT1: { classes: ['WornShortsword', 'MagesStaff', 'Dagger', 'Gloves', 'Rapier'], probs: [2, 0, 2, 2, 2] },
		weaponDeckT2: { classes: ['Shortsword', 'HandAxe', 'Spear', 'Quarterstaff', 'Dirk', 'Sickle'], probs: [2, 2, 2, 2, 2, 2] },
		// Deliberate divergence (see PORT_COVERAGE.md's Generator row and src/items/generator.ts):
		// Java's static init has `WEP_T3.probs = WEP_T1.defaultProbs.clone()` at every tag checked
		// (v2.1.4 through 4.0.0-beta), so tier 3's live deck copies tier 1 instead of its own
		// table. The port authors tier 3's own six weights instead. On current Java (six tier-1
		// weights) only Mace at index 1 is observably affected; the five-weight v2.1.4 table
		// additionally stranded Whip past the end of the cloned array.
		weaponDeckT3: { classes: ['Sword', 'Mace', 'Scimitar', 'RoundShield', 'Sai', 'Whip'], probs: [2, 2, 2, 2, 2, 2] },
		weaponDeckT4: { classes: ['Longsword', 'BattleAxe', 'Flail', 'RunicBlade', 'AssassinsBlade', 'Crossbow', 'Katana'], probs: [2, 2, 2, 2, 2, 2, 2] },
		weaponDeckT5: { classes: ['Greatsword', 'WarHammer', 'Glaive', 'Greataxe', 'Greatshield', 'Gauntlet', 'WarScythe'], probs: [2, 2, 2, 2, 2, 2, 2] },
		missileDeckT1: { classes: ['ThrowingStone', 'ThrowingKnife', 'ThrowingSpike'], probs: [3, 3, 3] },
		missileDeckT2: { classes: ['FishingSpear', 'ThrowingClub', 'Shuriken'], probs: [3, 3, 3] },
		missileDeckT3: { classes: ['ThrowingSpear', 'Kunai', 'Bolas'], probs: [3, 3, 3] },
		missileDeckT4: { classes: ['Javelin', 'Tomahawk', 'HeavyBoomerang'], probs: [3, 3, 3] },
		missileDeckT5: { classes: ['Trident', 'ThrowingHammer', 'ForceCube'], probs: [3, 3, 3] },
		potionDeck: { classes: ['PotionOfStrength', 'PotionOfHealing', 'PotionOfMindVision', 'PotionOfFrost', 'PotionOfLiquidFlame', 'PotionOfToxicGas', 'PotionOfHaste', 'PotionOfInvisibility', 'PotionOfLevitation', 'PotionOfParalyticGas', 'PotionOfPurity', 'PotionOfExperience'], probs: [0, 6, 4, 3, 3, 3, 2, 2, 2, 2, 2, 1] },
		scrollDeck: { classes: ['ScrollOfUpgrade', 'ScrollOfIdentify', 'ScrollOfRemoveCurse', 'ScrollOfMirrorImage', 'ScrollOfRecharging', 'ScrollOfTeleportation', 'ScrollOfLullaby', 'ScrollOfMagicMapping', 'ScrollOfRage', 'ScrollOfRetribution', 'ScrollOfTerror', 'ScrollOfTransmutation'], probs: [0, 6, 4, 3, 3, 3, 2, 2, 2, 2, 2, 1] },
		// Java v2.1.4 names StoneOfDisarming at index 2; the port authors StoneOfDetectMagic
		// there instead (that class does not exist in real SPD - see the runestone row - so the
		// implemented detect-magic stone would otherwise be unreachable through floor generation).
		runestoneDeck: { classes: ['StoneOfEnchantment', 'StoneOfIntuition', 'StoneOfDetectMagic', 'StoneOfFlock', 'StoneOfShock', 'StoneOfBlink', 'StoneOfDeepSleep', 'StoneOfClairvoyance', 'StoneOfAggression', 'StoneOfBlast', 'StoneOfFear', 'StoneOfAugmentation'], probs: [0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 0] },
		// MWL spells seeds lowercase; Java names the same twelve in the same order as
		// Rotberry.Seed (quest item, weight 0) through Starflower.Seed.
		seedDeck: { classes: ['rotberry', 'sungrass', 'fadeleaf', 'icecap', 'firebloom', 'sorrowmoss', 'swiftthistle', 'blindweed', 'stormvine', 'earthroot', 'mageroyal', 'starflower'], probs: [0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 2] },
		wandGeneratorDeck: { classes: ['WandOfMagicMissile', 'WandOfLightning', 'WandOfDisintegration', 'WandOfFireblast', 'WandOfCorrosion', 'WandOfBlastWave', 'WandOfLivingEarth', 'WandOfFrost', 'WandOfPrismaticLight', 'WandOfWarding', 'WandOfTransfusion', 'WandOfCorruption', 'WandOfRegrowth'], probs: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3] },
		ringGeneratorDeck: { classes: ['RingOfAccuracy', 'RingOfArcana', 'RingOfElements', 'RingOfEnergy', 'RingOfEvasion', 'RingOfForce', 'RingOfFuror', 'RingOfHaste', 'RingOfMight', 'RingOfSharpshooting', 'RingOfTenacity', 'RingOfWealth'], probs: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3] },
		artifactGeneratorDeck: { classes: ['AlchemistsToolkit', 'ChaliceOfBlood', 'CloakOfShadows', 'DriedRose', 'EtherealChains', 'HornOfPlenty', 'MasterThievesArmband', 'SandalsOfNature', 'TalismanOfForesight', 'TimekeepersHourglass', 'UnstableSpellbook'], probs: [1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1] },
		foodGeneratorDeck: { classes: ['Food', 'Pasty', 'MysteryMeat'], probs: [4, 1, 0] },
		armorGeneratorDeck: { classes: ['ClothArmor', 'LeatherArmor', 'MailArmor', 'ScaleArmor', 'PlateArmor', 'WarriorArmor', 'MageArmor', 'RogueArmor', 'HuntressArmor', 'DuelistArmor'], probs: [1, 1, 1, 1, 1, 0, 0, 0, 0, 0] },
	};
	for (const [id, expected] of Object.entries(EXPECTED_GENERATOR_DECKS)) {
		const deck = mwlDeck(id);
		assert.deepEqual(deck.classes.map((entry) => entry.toLowerCase()), expected.classes.map((entry) => entry.toLowerCase()), `${id} class order matches Generator.java`);
		assert.deepEqual(deck.probs, expected.probs, `${id} starting weights match Generator.java`);
	}
	// `Generator.floorSetTierProbs` (Generator.java, tag `v2.1.4`): the depth-bracket tier roll
	// `randomWeapon`/`randomArmor`/`randomMissile` make before touching a tier deck.
	assert.deepEqual(
		MWL_TABLE_ROWS('floorSetTierProbs').map((row) => (Array.isArray(row.chances) ? row.chances.map(Number) : [])),
	 [[0, 75, 20, 4, 1], [0, 25, 50, 20, 5], [0, 0, 40, 50, 10], [0, 0, 20, 40, 40], [0, 0, 0, 20, 80]],
		'floorSetTierProbs matches Generator.java',
	);
	// `Weapon.Enchantment`/`Armor.Glyph` pool shapes (Weapon.java/Armor.java, tag `v2.1.4`):
	// identical `{50,40,10}` rarity splits over 4-common/6-uncommon/3-rare pools with 8 curses
	// each. Only the lengths reach the level stream (`Random.chances` + `Random.element`), which
	// is why the authored pools are pinned by size here and by membership in affix-rules.mwl.
	const mwlTraitSet = (id, key) => {
		const trait = MWL_TRAIT_NODES.find((node) => node.attributes?.id === id);
		assert.ok(trait, `MWL generator rule is present: ${id}`);
		const effect = trait.children.find((child) => child.tag === 'effect' && child.attributes?.apply_to === key);
		assert.ok(effect?.attributes?.set !== undefined, `MWL generator rule ${id} carries ${key}`);
		return String(effect.attributes.set).split(',').map((entry) => entry.trim()).filter(Boolean);
	};
	assert.deepEqual(mwlTraitSet('affixPools', 'type_chances').map(Number), [50, 40, 10], 'enchant/glyph rarity split matches Weapon.java/Armor.java');
	assert.deepEqual(mwlTraitSet('affixPools', 'pool_sizes').map(Number), [4, 6, 3], 'enchant/glyph pool sizes match Weapon.java/Armor.java');
	assert.equal(Number(mwlTraitSet('affixPools', 'curse_pool_size')[0]), 8, 'curse pool size matches Weapon.java/Armor.java');
	// `Ghost.Quest.spawn` (Ghost.java, tag `v2.1.4`): fixed 50/30/15/5 tier weights for tiers
	// 2-5, shared by the armor switch and the weapon-tier roll.
	assert.deepEqual(mwlTraitSet('ghostQuestReward', 'tier_weights').map(Number), [0, 0, 10, 6, 3, 1], 'ghost reward tier weights match Ghost.java');
	assert.deepEqual(mwlTraitSet('ghostQuestReward', 'armor_classes'), ['ClothArmor', 'LeatherArmor', 'MailArmor', 'ScaleArmor', 'PlateArmor'], 'ghost reward armor classes match Ghost.java');
	// Hero shared stats (Hero.java, tag `v3.3.8`): HT 20, STR 10 (`STARTING_STR`), attackSkill 10,
	// defenseSkill 5, and the level-up `updateHT` (+5) with `attackSkill++`/`defenseSkill++`.
	// Base evasion equals the starting defense skill (`Hero.evasion()` builds on defenseSkill);
	// heroes start with no gold.
	const { MWL_MONSTERS, MWL_MONSTER_DEPTH_STATS, MWL_HERO_BASE_STATS, MWL_HERO_LEVEL_GROWTH, MWL_MONSTER_NODES } = require('./mwlContent.js');
	// Monster display names are authored on the nodes (`name` message key) with `MOB_KEYS`
	// derived in `spdKeys.ts` - including the two kinds that had no key at all (larva,
	// armoredStatue) and rendered as bare ids. Resolution itself is gated by `i18n:verify`.
	assert.equal(MWL_MONSTER_NODES.length, 65, 'monster roster size');
	for (const node of MWL_MONSTER_NODES) assert.ok(node.attributes?.name, `monster has a display-name key: ${node.attributes?.id}`);
	assert.equal(MWL_MONSTER_NODES.find((node) => node.attributes?.id === 'larva')?.attributes?.name, 'actors.mobs.yogdzewa$larva.name', 'larva name key');
	assert.equal(MWL_MONSTER_NODES.find((node) => node.attributes?.id === 'armoredStatue')?.attributes?.name, 'actors.mobs.armoredstatue.name', 'armoredStatue name key');
	assert.deepEqual(MWL_HERO_BASE_STATS, { hp: 20, maxHp: 20, strength: 10, attackSkill: 10, defenseSkill: 5, baseEvasion: 5, baseGold: 0 }, 'hero base stats match Hero.java');
	assert.deepEqual(MWL_HERO_LEVEL_GROWTH, { hpPerLevel: 5, attackSkillPerLevel: 1, defenseSkillPerLevel: 1 }, 'hero level growth matches Hero.java');
	// Monster base stats (actors/mobs/*.java, tag `v3.3.8`): every authored row below was checked
	// field-by-field against its Java class on 2026-09-15, resolving `extends` chains (variants
	// inherit everything their file does not override) and `Mob`/`Char` defaults (EXP 1,
	// maxLvl 29, no drRoll override means 0-0). That audit fixed nine real errors in the same
	// pass (skeleton/necroSkeleton armor, armoredBrute armor, fetidRat armor, albino HP, and the
	// King/Yog/fists' experience gate - see PORT_COVERAGE.md's new row), so this pins the fixed
	// values rather than merely restating the file. Format per mob:
	// [hp, accuracy, evasion, dmgMin, dmgMax, armorMin, armorMax, exp, maxLvl].
	const EXPECTED_MONSTER_STATS = {
		rat: [8, 8, 2, 1, 4, 0, 1, 1, 5],
		snake: [4, 10, 25, 1, 4, 0, 0, 2, 7],
		gnoll: [12, 10, 4, 1, 6, 0, 2, 2, 8],
		swarm: [50, 10, 5, 1, 4, 0, 0, 3, 9],
		crab: [15, 12, 5, 1, 7, 0, 4, 4, 9],
		slime: [20, 12, 5, 2, 5, 0, 0, 4, 9],
		goo: [100, 10, 8, 1, 8, 0, 2, 10, 29],
		skeleton: [25, 12, 9, 2, 10, 0, 5, 5, 10],
		thief: [20, 12, 12, 1, 10, 0, 3, 5, 11],
		bandit: [20, 12, 12, 1, 10, 0, 3, 5, 11],
		dm100: [20, 11, 8, 2, 8, 0, 4, 6, 13],
		guard: [40, 12, 10, 4, 12, 0, 7, 7, 14],
		necroSkeleton: [20, 12, 9, 2, 10, 0, 5, 0, -5],
		tengu: [200, 10, 15, 6, 12, 0, 5, 20, 29],
		fetidRat: [20, 12, 5, 1, 4, 0, 3, 4, 5],
		gnollTrickster: [20, 16, 5, 1, 6, 0, 2, 5, 8],
		greatCrab: [25, 12, 0, 1, 7, 0, 4, 6, 9],
		bat: [30, 16, 15, 5, 18, 0, 4, 7, 15],
		brute: [40, 20, 15, 5, 25, 0, 8, 8, 16],
		armoredBrute: [40, 20, 15, 5, 25, 4, 12, 8, 16],
		shaman: [35, 18, 15, 5, 10, 0, 6, 8, 16],
		spinner: [50, 22, 17, 10, 20, 0, 6, 9, 17],
		dm200: [80, 20, 12, 10, 25, 0, 8, 9, 17],
		dm201: [120, 20, 12, 15, 25, 0, 8, 9, 17],
		dm300: [300, 20, 15, 15, 25, 0, 10, 30, 29],
		ghoul: [45, 24, 20, 16, 22, 0, 4, 5, 20],
		elemental: [60, 25, 20, 20, 25, 0, 5, 10, 20],
		// The summoned-ally branch numbers (`attackSkill` 15, damage 10-12 when the ally flag is
		// set) with the newborn's own evasion-12 override (Elemental.java) - see PORT_COVERAGE.md's
		// wandmaker row, which walks the whole ritual kit.
		newbornElemental: [60, 15, 12, 10, 12, 0, 5, 10, 20],
		warlock: [70, 25, 18, 12, 18, 0, 8, 11, 21],
		monk: [70, 30, 30, 12, 25, 0, 2, 11, 21],
		senior: [70, 30, 30, 16, 25, 0, 2, 11, 21],
		golem: [120, 28, 15, 25, 30, 0, 12, 12, 22],
		succubus: [80, 40, 25, 25, 30, 0, 10, 12, 25],
		eye: [100, 30, 20, 20, 30, 0, 10, 13, 26],
		scorpio: [110, 36, 24, 30, 40, 0, 16, 14, 27],
		acidic: [110, 36, 24, 30, 40, 0, 16, 14, 27],
		// `maxLvl = -2` (DwarfKing.java): through `exp = hero.lvl <= maxLvl ? EXP : 0` the King
		// grants no experience - the authored 29 used to pay 40 EXP per kill.
		king: [300, 26, 22, 15, 25, 0, 10, 40, -2],
		// HP 400 is the port's deliberate balance scaling (Java: flat 1000); accuracy keeps
		// Java's INFINITE_ACCURACY, and the melee line plus the -2 experience gate are Java's own
		// (the beam uses its own 30-50/20-30 constants, never this row).
		yog: [400, 1000000, 12, 15, 25, 0, 4, 50, -2],
		// Deliberately scaled encounter matching Yog's own scaling: Java's six fist subclasses
		// share one stat line (HP 300, acc 36, eva 20, dmg 18-36, armor 0-15, EXP 25) and differ
		// only in abilities, which the port preserves per subclass - see PORT_COVERAGE.md's Yog
		// row, whose older "preserves HP/accuracy/evasion/damage/armor" wording overstated this.
		// The -2 experience gate is Java's own (fists grant nothing).
		yogFist: [60, 20, 10, 6, 12, 0, 5, 10, -2],
		larva: [20, 30, 12, 15, 25, 0, 4, 5, -2],
		// Never attacks in either version, so damage is the port's no-melee modeling (Char's own
		// default would be 1); everything else is Java's, including the 0-12 armor roll.
		demonSpawner: [120, 0, 0, 0, 0, 0, 12, 15, 29],
		ripperDemon: [60, 30, 22, 15, 25, 0, 4, 9, -2],
		// Albino HP is v3.3.8's 12 (v2.1.4 had 15); everything else inherits Rat in both tags.
		albino: [12, 8, 2, 1, 4, 0, 1, 2, 5],
		causticSlime: [20, 12, 5, 2, 5, 0, 0, 4, 9],
		// Non-challenge HP (Java splits 80 challenged / 50 otherwise; this port has no
		// challenges); damage/exp never land - no melee path and maxLvl -2 zeroes experience.
		pylon: [50, 0, 0, 0, 0, 0, 0, 0, -2],
		rotHeart: [80, 0, 0, 0, 0, 0, 5, 4, 29],
		rotLasher: [80, 25, 0, 10, 20, 0, 8, 1, 29],
	};
	const mwlMonsterById = new Map(MWL_MONSTERS.map((monster) => [String(monster.id), monster]));
	for (const [id, expected] of Object.entries(EXPECTED_MONSTER_STATS)) {
		const monster = mwlMonsterById.get(id);
		assert.ok(monster, `MWL monster is present: ${id}`);
		assert.deepEqual(
			[monster.hp, monster.accuracy, monster.evasion, monster.damage?.[0], monster.damage?.[1], monster.armor?.[0], monster.armor?.[1], monster.experience, monster.maxLevel],
			expected, `monster ${id} matches its Java stats`,
		);
	}
	// The necromancer's authored accuracy/damage carry its ranged bolt (`Normal(2,10)` via
	// `zapHero`), not a melee line - Necromancer.java defines neither `attackSkill` nor
	// `damageRoll` (Char defaults would be 0/1). Everything else in both rows is Java's own.
	for (const id of ['necromancer', 'spectralNecromancer']) {
		const monster = mwlMonsterById.get(id);
		assert.ok(monster, `MWL monster is present: ${id}`);
		assert.deepEqual(
			[monster.hp, monster.evasion, monster.armor?.[0], monster.armor?.[1], monster.experience, monster.maxLevel],
			[40, 14, 0, 5, 7, 14], `monster ${id} matches its Java stats (accuracy/damage carry the zap)`,
		);
	}
	// Deliberately outside the pin, each with the row that documents it: quest/shop NPCs and the
	// Rat King use unkillable modeling (huge HP/evasion) for Java's untargetable/damage-immune
	// NPCs; wards/earthGuardians/sheep are scene-driven allies/summons with dynamic stats; the
	// sentry's accuracy runs through the depth rule below and its beam through scene code (see
	// PORT_COVERAGE.md's sentry row); depth-scaled mobs compose the base row's experience/level
	// cap with the formula rules pinned next.
	for (const id of ['ghost', 'wandmaker', 'shopkeeper', 'blacksmith', 'imp', 'ratKing', 'sheep', 'ward', 'earthGuardian', 'sentry', 'mimic', 'crystalMimic', 'piranha', 'bee', 'statue', 'armoredStatue']) {
		assert.ok(mwlMonsterById.get(id), `MWL special monster is present: ${id}`);
	}
	// Depth-scaled formulas (Mimic/Piranha/Bee/Statue/CrystalMimic, tag `v3.3.8`): coefficients of
	// the closed shapes in actor-rules.mwl - `HP = (1+level)*6`, `20+2*depth` accuracy,
	// `HT/10..HT/4` damage with `HT = (2+level)*4`, and the statue's generated-weapon terms
	// (accuracy `(9+depth)*factor`, armor `0..depth+defenseFactor`) folded to the fixed
	// coefficients the 2026-09-13 audit authored. [base, perDepth, divisor, floor] per field.
	const EXPECTED_DEPTH_RULES = {
		mimic: { hp: [6, 6], accuracy: [6, 1], evasion: [4, 1, 2], damageMin: [1, 1, 0, 0], damageMax: [2, 2, 0, 0], armorMin: [0, 0, 0], armorMax: [2, 1, 2] },
		crystalMimic: { hp: [6, 6], accuracy: [6, 1], evasion: [4, 1, 2], damageMin: [1, 1, 0, 0], damageMax: [2, 2, 0, 0], armorMin: [0, 0, 0], armorMax: [2, 1, 2] },
		piranha: { hp: [10, 5], accuracy: [20, 2], evasion: [10, 2, 0], damageMin: [0, 1, 0, 0], damageMax: [4, 2, 0, 0], armorMin: [0, 0, 0], armorMax: [0, 1, 0] },
		bee: { hp: [8, 4], accuracy: [9, 1], evasion: [9, 1, 0], damageMin: [8, 4, 10, 1], damageMax: [8, 4, 4, 1], armorMin: [0, 0, 0], armorMax: [0, 0, 0] },
		statue: { hp: [15, 5], accuracy: [9, 1], evasion: [4, 1, 0], damageMin: [2, 0, 0, 0], damageMax: [8, 1, 0, 0], armorMin: [0, 0, 0], armorMax: [2, 1, 0] },
		armoredStatue: { hp: [30, 10], accuracy: [9, 1], evasion: [4, 1, 0], damageMin: [2, 0, 0, 0], damageMax: [8, 1, 0, 0], armorMin: [0, 0, 0], armorMax: [4, 1, 0] },
		sentry: { hp: [0, 0], accuracy: [20, 2], evasion: [0, 0, 0], damageMin: [0, 0, 0, 0], damageMax: [0, 0, 0, 0], armorMin: [0, 0, 0], armorMax: [0, 0, 0] },
	};
	for (const [id, expected] of Object.entries(EXPECTED_DEPTH_RULES)) {
		const rule = MWL_MONSTER_DEPTH_STATS[id];
		assert.ok(rule, `MWL depth rule is present: ${id}`);
		assert.deepEqual(
			{
				hp: [rule.hpBase, rule.hpPerDepth],
				accuracy: [rule.accuracyBase, rule.accuracyPerDepth],
				evasion: [rule.evasionBase, rule.evasionPerDepth, rule.evasionDivisor],
				damageMin: [rule.damageMinBase, rule.damageMinPerDepth, rule.damageMinDivisor, rule.damageMinFloor],
				damageMax: [rule.damageMaxBase, rule.damageMaxPerDepth, rule.damageMaxDivisor, rule.damageMaxFloor],
				armorMin: [rule.armorMinBase, rule.armorMinPerDepth, rule.armorMinDivisor],
				armorMax: [rule.armorMaxBase, rule.armorMaxPerDepth, rule.armorMaxDivisor],
			},
			expected, `depth rule ${id} matches its Java formula`,
		);
	}
	// Buff durations (buff-rules.mwl): durations with a Java `DURATION` constant match it
	// verbatim here (Bless/Hex 30, Daze 5, Chill/Frost 10, Drowsy 5, Weakness/Vulnerable 20,
	// Burning 8, Levitation 20, FeatherFall 50, Invisibility 20, Recharging 30, AdrenalineSurge
	// 200, MindVision 20, Terror 20, Amok 5 via ScrollOfRage, Aggression 20, Awareness 2, Haste
	// 20, Degrade 30, Ooze 20, Wayward 10, Charm 10 - all tag `v3.3.8`). The rest are the
	// port's own documented conventions, not Java values: cripple 4 / paralysis 3 / roots 3 each
	// equal a real Java application site (see PORT_COVERAGE.md's BUFF_DURATION row), poison 6
	// and bleeding 0 have no Java DURATION to match, magicalSleep 0 lasts until woken,
	// fury/berserk/cloak/focus 9999 are state markers, frostImbue 15 and lethalHasteCooldown 100
	// are port-side cooldowns (see simulation/buffs.ts). Pinning the whole table so drift fails.
	const buffRows = MWL_TABLE_ROWS('buffDurations', 'buff');
	assert.deepEqual(
		Object.fromEntries(buffRows.map((row) => [String(row.buff), Number(row.duration)])),
		{
			bless: 30, hex: 30, daze: 5, chill: 10, frost: 10, drowsy: 5, magicalSleep: 0, fury: 9999,
			berserk: 9999, weakness: 20, vulnerable: 20, burning: 8, poison: 6, bleeding: 0, cripple: 4,
			paralysis: 3, roots: 3, levitation: 20, featherFall: 50, invisibility: 20, cloak: 9999,
			focus: 9999, recharging: 30, frostImbue: 15, adrenalineSurge: 200, mindvision: 20,
			terror: 20, amok: 5, aggression: 20, awareness: 2, haste: 20, degrade: 30, ooze: 20,
			wayward: 10, charm: 10, lethalHasteCooldown: 100,
		},
		'buff durations match the authored table',
	);
	// Each shop's opening shelf (`scenario-rules.mwl`'s `shopShelfStock`): the simplified
	// two-potions/two-identifies stock this shop UI trades - authored data, not code.
	assert.deepEqual(
		MWL_TABLE_ROWS('shopShelfStock').map((row) => [String(row.item), Number(row.quantity)]),
		[['potion', 2], ['scrollIdentify', 2]],
		'shop shelf stock matches the authored scenario table',
	);
	// Per-monster status immunities (`Char.isImmune()`'s mob half, tag `v3.3.8`): the authored
	// `monsterStatusImmunities` table rows, plus the live gate's verdicts through the real
	// `monsterBuffImmune` helper. INORGANIC kinds refuse bleeding/poison, STATIC kinds refuse
	// terror/amok/charm/paralysis, ACIDIC kinds refuse ooze, the burning fist refuses burning,
	// the bright fist refuses frost, the rusted fist reuses the INORGANIC pair, the succubus
	// refuses charm, Tengu refuses roots/terror, and piranhas refuse burning.
	// Keyed 'id' (a column this table does not declare) so the reader skips its single-key
	// uniqueness check - uniqueness here is the composite monster+subtype pair, enforced by
	// tools/compile-mwl.mjs, since yogFist legitimately carries four subtype rows.
	const immunityRows = MWL_TABLE_ROWS('monsterStatusImmunities', 'id');
	const immunityByKey = new Map(immunityRows.map((row) => [`${String(row.monster)}:${String(row.subtype ?? '')}`, (Array.isArray(row.immunities) ? row.immunities : []).map(String).sort()]));
	assert.deepEqual([...immunityByKey.keys()].sort(), [
		'acidic:', 'armoredStatue:', 'causticSlime:', 'demonSpawner:', 'dm100:', 'dm200:', 'dm201:',
		'dm300:', 'goo:', 'golem:', 'necroSkeleton:', 'pylon:', 'piranha:', 'rotHeart:', 'skeleton:',
		'statue:', 'succubus:', 'tengu:', 'yog:', 'yogFist:bright', 'yogFist:burning', 'yogFist:rotting',
		'yogFist:rusted',
	].sort(), 'monster immunity table covers exactly the Java-immune kinds');
	assert.deepEqual(immunityByKey.get('pylon:'), ['amok', 'bleeding', 'charm', 'paralysis', 'poison', 'terror'], 'pylon carries INORGANIC + STATIC sets');
	assert.deepEqual(immunityByKey.get('yogFist:rotting'), ['ooze'], 'rotting fist carries the ACIDIC set');
	assert.deepEqual(immunityByKey.get('yogFist:rusted'), ['bleeding', 'poison'], 'rusted fist carries the INORGANIC pair');
	const { monsterBuffImmune } = require('./simulation/buffs.js');
	assert.equal(monsterBuffImmune('skeleton', undefined, 'bleeding'), true, 'skeleton refuses bleeding');
	assert.equal(monsterBuffImmune('skeleton', undefined, 'poison'), true, 'skeleton refuses poison');
	assert.equal(monsterBuffImmune('rat', undefined, 'bleeding'), false, 'rat accepts bleeding');
	assert.equal(monsterBuffImmune(undefined, undefined, 'bleeding'), false, 'hero has no monster immunities');
	assert.equal(monsterBuffImmune('yogFist', 'rotting', 'ooze'), true, 'rotting fist refuses ooze');
	assert.equal(monsterBuffImmune('yogFist', 'burning', 'ooze'), false, 'burning fist accepts ooze');
	assert.equal(monsterBuffImmune('yogFist', 'burning', 'burning'), true, 'burning fist refuses burning');
	assert.equal(monsterBuffImmune('yog', undefined, 'terror'), true, 'yog refuses terror');
	assert.equal(monsterBuffImmune('goo', undefined, 'terror'), false, 'goo accepts terror');
	assert.equal(monsterBuffImmune('tengu', undefined, 'roots'), true, 'tengu refuses roots');
	assert.equal(monsterBuffImmune('dm300', undefined, 'terror'), false, 'dm300 only resists terror for damage, still takes the buff');
	assert.equal(monsterBuffImmune('succubus', undefined, 'charm'), true, 'succubus refuses charm');
	assert.equal(monsterBuffImmune('piranha', undefined, 'burning'), true, 'piranha refuses burning');
	console.log('PASS item-instance separation, enhancement transfer, upgrade policy, appearance restore, missile dust pickup, the Unstable delegate list, rings.mwl-derived ring formulas, items.mwl-derived weapon/armor tiers, Generator.java deck parity, monster/hero/buff Java parity, and per-monster status immunities');
} finally {
	rmSync(out, { recursive: true, force: true });
}
