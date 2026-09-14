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
	assert.equal(Object.keys(MWL_ITEM_GROUND_KIND_ALIASES).length, 22, 'ground-kind alias count');
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
	console.log('PASS item-instance separation, enhancement transfer, upgrade policy, appearance restore, missile dust pickup, the Unstable delegate list, rings.mwl-derived ring formulas, and items.mwl-derived weapon/armor tiers');
} finally {
	rmSync(out, { recursive: true, force: true });
}
