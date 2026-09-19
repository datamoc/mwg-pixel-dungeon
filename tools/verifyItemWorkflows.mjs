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
	compile(join(root, 'src/items/itemKinds.ts'), 'items/itemKinds.js');
// `ChooseBag()`'s pick and the bag `canHold` gates - scene-free, tested below.
compile(join(root, 'src/items/bags.ts'), 'items/bags.js');
compile(join(root, 'src/items/weaponAbilities.ts'), 'items/weaponAbilities.js');
	compile(join(root, 'src/items/resurrect.ts'), 'items/resurrect.js');
	compile(join(root, 'src/items/itemActions.ts'), 'items/itemActions.js');
	compile(join(root, 'src/items/shopPricing.ts'), 'items/shopPricing.js');
	compile(join(root, 'src/items/shopActions.ts'), 'items/shopActions.js');
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
	// shopActions.ts calls `t()` for the sell labels, which would pull the whole message catalogue
	// (all 19 locales) into this narrow tree. The stub keeps the key and its substituted values
	// visible, so the assertions below prove *which* SPD string each sell button uses and with what
	// price. The wording itself is the real catalogue's job, and `npm run i18n:verify` already
	// asserts every `{0}` a key declares is supplied.
	mkdirSync(join(out, 'i18n'), { recursive: true });
	writeFileSync(join(out, 'i18n', 'index.js'),
		'exports.t = (key, params) => key + (params ? "[" + Object.values(params).join(",") + "]" : "");\n');
	compile(join(root, 'src/items/alchemy.ts'), 'items/alchemy.js');
	compile(join(root, 'src/items/groundPickup.ts'), 'items/groundPickup.js');
	// The Sandals of Nature's rules are scene-free (only the authored MWL rows feed them), so the
	// artifact's charge economy, seed list and root cost are checked here rather than only live.
	compile(join(root, 'src/items/sandals.ts'), 'items/sandals.js');
	// The Talisman of Foresight's scry formulas (cone arc, charge cost, exp curve, per-turn trickle)
	// are scene-free in the same way, so they are pinned here against Java's own numbers.
	compile(join(root, 'src/items/talisman.ts'), 'items/talisman.js');
	// The Dried Rose's ghost stats, recharge clock and petal economy are scene-free the same way.
	compile(join(root, 'src/items/rose.ts'), 'items/rose.js');
	// The Ring of Wealth's bonus-drop counters and drop catalogue are scene-free in the same way.
	compile(join(root, 'src/items/shopStock.ts'), 'items/shopStock.js');
	compile(join(root, 'src/items/wealthDrops.ts'), 'items/wealthDrops.js');
	// `ArtifactRecharge`'s per-artifact charge table and banking, the same way.
	compile(join(root, 'src/items/artifactRecharge.ts'), 'items/artifactRecharge.js');
	// Strength requirements are pure and scene-free, pinned against Java's numbers below.
	compile(join(root, 'src/items/strReq.ts'), 'items/strReq.js');
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
		`exports.Actors = require(${JSON.stringify(join(dist, 'actors', 'index.js'))}); exports.Random = require(${JSON.stringify(join(dist, 'core', 'Random.js'))}); exports.Roguelike = require(${JSON.stringify(join(dist, 'roguelike', 'index.js'))});\n`);
	const require = createRequire(join(out, 'check.cjs'));
	const { Inventory } = require('./actors/Inventory.js');
	const { Appearances } = require('./actors/Appearances.js');
	const { transferEnhancement, upgradeItem, reverseCurseInfusion, curseInfusionLevelBonus } = require('./items/workflows.js');
	const { transmuteItem, isTransmutableForScroll, missileTierForClass } = require('./items/transmutation.js');
	const { missileDamageRange, missilePickupValid, recordMissileUpgrade, missileAdjacentAccFactor, missileBaseUses, bolasCrippleTurns, tomahawkBleedRange, BOOMERANG_RETURN_TURNS, BOOMERANG_RETURN_ACC_FACTOR, tippedDartUseDivisor, TIPPED_DART_BY_SEED } = require('./items/missiles.js');
	const { blacksmithTurnInFavor, BLACKSMITH_FAVOR_CAP, BLACKSMITH_QUEST_BOSS_BONUS } = require('./items/blacksmith.js');
	// `MissileWeapon.baseUses` (tag `v3.3.8`): Java's field defaults to 8, and each class overrides
	// it. It is a property of the *wielded missile class*, not the hero class - this port used to
	// derive it as `duelist ? 12 : 5`, which was wrong for every other class's missile.
	assert.deepEqual(
		['ThrowingStone', 'ThrowingKnife', 'ThrowingSpike', 'ThrowingSpear', 'Kunai', 'ThrowingClub',
			'ThrowingHammer', 'Bolas', 'Tomahawk', 'HeavyBoomerang', 'Shuriken', 'ForceCube', 'Javelin',
			'Trident', 'FishingSpear'].map(missileBaseUses),
		[5, 5, 12, 8, 8, 12, 12, 5, 5, 5, 5, 5, 8, 8, 8],
		'per-class baseUses match MissileWeapon.baseUses and its overrides',
	);
	// The same authored table now decides what a *wielded* missile deals - damage the port could not
	// reach at all while only the hero class's own missile was throwable.
	assert.deepEqual(missileDamageRange('Bolas', 0), [4, 9], "Bolas keeps Java's own min/max overrides");
	assert.deepEqual(missileDamageRange('Bolas', 3), [4, 9 + 2 * 3], 'Bolas min never scales; max scales (tier-1)*lvl');
	assert.deepEqual(missileDamageRange('Tomahawk', 0), [6, 16], "Tomahawk keeps Java's round(1.5*tier)/round(4*tier) bases");
	assert.deepEqual(missileDamageRange('ThrowingKnife', 1), [3, 8], "knives keep Java's 6*tier max base and 2*lvl scaling");
	assert.deepEqual(missileDamageRange('ThrowingStone', 1), [3, 6], "stones keep Java's 5*tier max base and tier*lvl scaling");
	assert.deepEqual(missileDamageRange('ForceCube', 3), [13, 40], 'tier-5 min scales lvl and max scales tier*lvl');
	// `Bolas.proc()` / `Tomahawk.proc()` (tag `v3.3.8`): `Cripple.DURATION/2` and a bleed roll of
	// `NormalFloat(minBleed(lvl), maxBleed(lvl))` with `minBleed = 3 + lvl/2f`, `maxBleed = 6 + lvl`.
	assert.equal(bolasCrippleTurns(), 5, 'Bolas cripples for half of Cripple.DURATION (10f)');
	assert.deepEqual(tomahawkBleedRange(0), [3, 6]);
	assert.deepEqual(tomahawkBleedRange(6), [6, 12]);
	// `MissileWeapon.adjacentAccFactor` (tag `v3.3.8`): the ranged accuracy factor carried by every
	// thrown weapon and the spirit bow - `0.5f` adjacent (a hero gets `0.5 + 0.25*POINT_BLANK`
	// instead), `1.5f` at any distance. Point Blank is accuracy-only and hero-only.
	assert.equal(missileAdjacentAccFactor(true, true, 0), 0.5, 'a thrown weapon at melee range is -50% accurate');
	assert.equal(missileAdjacentAccFactor(true, true, 1), 0.75, 'Point Blank 1 is 0.5 + 0.25*1');
	assert.equal(missileAdjacentAccFactor(true, true, 3), 1.25, 'Point Blank 3 is 0.5 + 0.25*3, a +10% bonus over baseline');
	assert.equal(missileAdjacentAccFactor(true, false, 3), 0.5, 'Point Blank is the *hero* talent - a monster throwing at melee range stays at a flat 0.5');
	// `TippedDart.durabilityPerUse()` with `Talent.DURABLE_TIPS` (tag `v3.3.8`):
	// `use /= (1 + points)` while a Warden throws tipped darts (2x/3x/4x total durability).
	assert.equal(tippedDartUseDivisor('firebloom', 1, true), 2, 'Warden rank 1 doubles tipped-dart durability');
	assert.equal(tippedDartUseDivisor('firebloom', 3, true), 4, 'Warden rank 3 quadruples it');
	assert.equal(tippedDartUseDivisor('firebloom', 0, true), 1, 'unranked Warden throws at full cost');
	assert.equal(tippedDartUseDivisor('firebloom', 3, false), 1, 'a non-Warden gets no divisor');
	assert.equal(tippedDartUseDivisor('rotberry', 3, true), 1, 'rot darts are exempt per their desc');
	compile(join(root, 'src/items/candles.ts'), 'items/candles.js');
	const { candleRitualSlots, placeCandleAtSlot } = require('./items/candles.js');
	// `CeremonialCandle.checkCandles()` slots: the four cardinal neighbours of ritualPos.
	assert.deepEqual(candleRitualSlots(117, 32), [{ x: 21, y: 2 }, { x: 22, y: 3 }, { x: 21, y: 4 }, { x: 20, y: 3 }]);
	{
		// Aimed placement consumes one candle onto the validated slot; the fourth
		// completes the ritual (slots cleared, newborn elemental spawned at ritualPos).
		let carried = 4;
		const said = [];
		let spawnedAt = null;
		const scene = {
			bag: { find: () => (carried > 0 ? {} : undefined), remove: () => { carried--; } },
			ritualPos: 117,
			level: { width: 32, height: 32, passable: () => true },
			hero: { x: 0, y: 0 },
			ritualCandles: [false, false, false, false],
			isChasmCell: () => false,
			creatureAt: () => null,
			spawnNewbornElemental: (at) => { spawnedAt = at; return {}; },
			say: (line) => { said.push(line); },
		};
		placeCandleAtSlot(scene, 0);
		assert.equal(carried, 3);
		assert.deepEqual(scene.ritualCandles, [true, false, false, false]);
		placeCandleAtSlot(scene, 0);
		assert.equal(carried, 3, 'an already-filled slot consumes nothing');
		placeCandleAtSlot(scene, 9);
		assert.equal(carried, 3, 'an out-of-range slot consumes nothing');
		placeCandleAtSlot(scene, 1);
		placeCandleAtSlot(scene, 2);
		placeCandleAtSlot(scene, 3);
		assert.equal(carried, 0);
		assert.deepEqual(scene.ritualCandles, [false, false, false, false], 'completion clears the placements first');
		assert.deepEqual(spawnedAt, { x: 21, y: 3 }, 'elemental rises at ritualPos when free');
		assert.ok(said.some((line) => String(line).includes('port.log.ritualfire')), 'completion says the ritual line');
	}
	assert.equal(missileAdjacentAccFactor(false, true, 3), 1.5, 'thrown weapons and the bow always have +50% accuracy at a distance');
	assert.equal(missileAdjacentAccFactor(false, false, 0), 1.5, 'the +50% at distance is not hero-gated');
	// `HeavyBoomerang` (tag `v3.3.8`): `CircleBack.setup` sets `left = 5`, and the return flight's
	// own `hero.shoot` runs with `circlingBack` up, which the class's `adjacentAccFactor` override
	// turns into a flat 1.5 rather than the melee-range penalty.
	assert.equal(BOOMERANG_RETURN_TURNS, 5, 'CircleBack counts down from 5 hero turns');
	assert.equal(BOOMERANG_RETURN_ACC_FACTOR, 1.5, 'the return throw is a flat 1.5, adjacency or not');
	const { alchemicalCatalystCost, arcaneCatalystCost, canCraftPotionSeed, craftPotionSeed, craftAlchemicalCatalyst, craftArcaneCatalyst, craftScrollToStone, craftAlchemize } = require('./items/alchemy.js');

	// `Item.isUpgradable()` (tag `v3.3.8`) and the two infusion selectors that read it. Java's
	// default is true with 42 classes overriding it false, so the assertions below are built from
	// that false-list rather than from a list of upgradables: an id this port mints that is missing
	// from the predicate's own false-set shows up here as a wrong `true`.
	const { isUpgradableItem, isEquipableItem, usableForMagicalInfusion, usableForCurseInfusion } = require('./items/itemKinds.js');
	const upgradable = (item) => isUpgradableItem(item);
	// every equipment family, authored and port-minted
	for (const id of ['weapon_dagger_t1', 'armor_clotharmor_t1_cloth', 'wand_wandfrost_t1', 'missile_bolas',
		'weaponReward', 'armorReward', 'wand', 'ring_garnet', 'ring_might', 'ring_haste']) {
		assert.equal(upgradable({ id }), true, `${id} is upgradable`);
	}
	// artifacts: `artifacts/Artifact.isUpgradable()` is false, DriedRose and TimekeepersHourglass included
	for (const id of ['artifact_chalice', 'artifact_rose', 'artifact_hourglass', 'toolkit', 'rose', 'chains',
		'horn', 'beacon', 'armband', 'sandals', 'talisman', 'spellbook', 'cloak', 'hourglass', 'chalice', 'cape']) {
		assert.equal(upgradable({ id }), false, `${id} is an artifact and not upgradable`);
	}
	// consumables and props, each a Java class that overrides isUpgradable false
	for (const id of ['potionHealing', 'exoticPotion', 'blizzardBrew', 'elixirMight', 'scrollUpgrade', 'exoticScroll',
		'seedFirebloom', 'seed', 'stoneOfBlast', 'stoneOfAugmentation', 'food', 'meat', 'pasty', 'bomb', 'doubleBomb',
		'fireBomb', 'noisemaker', 'flashbang', 'crystalKey', 'ironKey', 'goldenKey', 'gooBlob', 'metalShard',
		'energyCrystal', 'candle', 'embers', 'corpseDust', 'sandBag', 'alchemize', 'torch', 'curseInfusion', 'magicalInfusion',
		'aquaBlast', 'featherFall', 'arcaneCatalyst', 'alchemicalCatalyst',
		//`bags/Bag.isUpgradable()` is false: the starting pouch and the three shop bags.
		'velvetPouch', 'scrollHolder', 'potionBandolier', 'magicalHolster']) {
		assert.equal(upgradable({ id }), false, `${id} is not upgradable`);
	}
	// the one ambiguous id: 'stone' is a missile stack *or* a runestone, decided by sourceClass
	assert.equal(upgradable({ id: 'stone', sourceClass: 'Bolas' }), true, 'a picked-up missile stack is upgradable');
	assert.equal(upgradable({ id: 'stone', sourceClass: 'StoneOfBlast' }), false, 'a picked-up runestone is not');
	assert.equal(upgradable({ id: 'stone' }), false, 'a stone with no class is not assumed to be a missile');
	// `EquipableItem`: Ring/Artifact come in through KindofMisc, Wand does **not**, which is why
	// `CurseInfusion` needs its explicit wand clause
	assert.equal(isEquipableItem({ id: 'ring_might' }), true, 'a ring is an EquipableItem');
	assert.equal(isEquipableItem({ id: 'wand_wandfrost_t1' }), false, 'a wand is not an EquipableItem');
	assert.equal(isEquipableItem({ id: 'artifact_chalice' }), true, 'an artifact *is* an EquipableItem (and still excluded, below)');
	// the two selectors: MagicalInfusion takes every upgradable, CurseInfusion takes upgradable
	// equipables plus wands - which over this port's ids is the same set
	for (const item of [{ id: 'wand_wandfrost_t1' }, { id: 'weapon_dagger_t1' }, { id: 'ring_might' }, { id: 'stone', sourceClass: 'Bolas' }]) {
		assert.equal(usableForMagicalInfusion(item), true, `${item.id} is a MagicalInfusion target`);
		assert.equal(usableForCurseInfusion(item), true, `${item.id} is a CurseInfusion target`);
	}
	for (const item of [{ id: 'artifact_chalice' }, { id: 'potionHealing' }, { id: 'scrollUpgrade' }, { id: 'bomb' },
		{ id: 'velvetPouch' }, { id: 'scrollHolder' }, { id: 'potionBandolier' }, { id: 'magicalHolster' }]) {
		assert.equal(usableForMagicalInfusion(item), false, `${item.id} is not a MagicalInfusion target`);
		assert.equal(usableForCurseInfusion(item), false, `${item.id} is not a CurseInfusion target`);
	}

	// `WndTradeItem`'s selling half: a lone item gets one button, a real stack gets `sell_1` at
	// `value/quantity()` beside `sell_all` at `value()` - and an *upgradable missile stack* gets
	// the single button too, because Java's condition is
	// `quantity() == 1 || (item instanceof MissileWeapon && item.isUpgradable())`. What this
	// replaced sold one unit for every item, so a stack of twelve took twelve picks to clear.
	const { sellFood } = require('./items/shopActions.js');
	const sellRun = (carried) => {
		const pickerCalls = [];
		const choiceCalls = [];
		const bag = new Inventory();
		for (const item of carried) bag.add({ stackable: true, identified: true, ...item });
		const buyback = [];
		sellFood({
			heroStats: { base: (key) => (key === 'gold' ? 100 : 0), setBase: () => {} },
			bag, stock: new Inventory(), buyback, depth: 6,
			openItemPicker: (title, entries, onPick) => pickerCalls.push({ title, entries, onPick }),
			itemDisplayName: (id) => id,
			say: () => {},
			showSellOptions: (itemName, options, onPick) => choiceCalls.push({ itemName, options, onPick }),
		});
		/** pick the only candidate, then hand back the sell window the pick opened */
		const choose = (entry) => { pickerCalls[0].onPick(entry); return choiceCalls[0]; };
		return { pickerCalls, choiceCalls, choose, bag, buyback };
	};
	// a stack: two options, priced as Java prices them
	const stack = sellRun([{ id: 'potionHealing', quantity: 5, stackable: true }]);
	const stackChoice = stack.choose({ id: 'potionHealing', quantity: 1 });
	assert.equal(stack.pickerCalls.length, 1, 'a sellable stack is offered by the picker');
	assert.equal(stack.choiceCalls.length, 1, 'picking it opens the sell window');
	assert.equal(stackChoice.itemName, 'potionHealing', 'the window is titled with the item');
	assert.equal(stackChoice.options.length, 2, 'a stack offers exactly Sell 1 and Sell all');
	assert.match(stackChoice.options[0].label, /^windows\.wndtradeitem\.sell_1\[\d+\]$/, "the first button uses SPD's sell_1 string");
	assert.match(stackChoice.options[1].label, /^windows\.wndtradeitem\.sell_all\[\d+\]$/, "the second uses sell_all");
	assert.equal(stackChoice.options[0].units, 1);
	assert.equal(stackChoice.options[1].units, 5, 'Sell all sells the whole stack');
	// selling one unit really moves one unit and shelves one
	stackChoice.onPick(1);
	assert.equal(stack.bag.find('potionHealing')?.quantity ?? 0, 4, 'Sell 1 removes one unit');
	assert.deepEqual(stack.buyback.map((entry) => entry.quantity), [1], 'and shelves one unit');
	// and Sell all empties it
	const all = sellRun([{ id: 'potionHealing', quantity: 5, stackable: true }]);
	all.choose({ id: 'potionHealing', quantity: 1 }).onPick(5);
	assert.equal(all.bag.find('potionHealing'), undefined, 'Sell all empties the stack');
	assert.deepEqual(all.buyback.map((entry) => entry.quantity), [5], 'and shelves the whole stack');
	// a lone item: one button, SPD's plain sell wording
	const lone = sellRun([{ id: 'potionHealing', quantity: 1, stackable: true }]);
	const loneChoice = lone.choose({ id: 'potionHealing', quantity: 1 });
	assert.equal(loneChoice.options.length, 1, 'a lone item gets a single button');
	assert.match(loneChoice.options[0].label, /^windows\.wndtradeitem\.sell\[\d+\]$/, "using SPD's plain sell string");
	loneChoice.onPick(1);
	assert.equal(lone.bag.find('potionHealing'), undefined, 'which sells it');
	// an upgradable missile stack takes the same single-button branch as a lone item
	const missiles = sellRun([{ id: 'stone', quantity: 8, stackable: true, sourceClass: 'Bolas' }]);
	const missileChoice = missiles.choose({ id: 'stone', quantity: 1 });
	assert.equal(missileChoice.options.length, 1,
		"Java's `item instanceof MissileWeapon && item.isUpgradable()` branch sells the stack whole");
	missileChoice.onPick(8);
	assert.equal(missiles.bag.find('stone'), undefined, 'the missile stack left the bag');
	// `Shopkeeper.canSell()`: `unique && !stackable` is refused - bags are `unique`
	// (`Bag.java`), so a priced bag is still never a sell candidate. The price assertion
	// first proves the exclusion does the work (the holder is worth 40), not pricelessness.
	{
		const { getSellPrice } = require('./items/shopPricing.js');
		assert.ok(getSellPrice('scrollHolder', 6, 1, true, { id: 'scrollHolder', quantity: 1 }) > 0,
			'the holder has a real sell price');
		const bags = sellRun([{ id: 'scrollHolder', quantity: 1 }]);
		assert.equal(bags.pickerCalls.length, 0, 'a bag is never offered by the sell picker');
	}
	assert.deepEqual(missiles.buyback.map((entry) => entry.quantity), [8], 'whole, in one shelf entry');
	const { pickupGroundItem } = require('./items/groundPickup.js');
	const { MWL_CONSUMABLE_DESCRIPTION_KEYS, MWL_MISSILE_DESCRIPTION_KEYS, MWL_MISSILE_NAME_KEYS, MWL_GROUND_ITEM_NAME_KEYS, MWL_ITEM_GROUND_KIND_ALIASES, MWL_ITEM_NAME_KEYS, mwlItemEffectValue } = require('./mwlContent.js');
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
	// `Weapon.enchant()` (`Weapon.java` 316-321) / `Armor.inscribe()` (`Armor.java` 596-601):
	// cleansing drops the curse-infusion marker with the curse - and nothing else, because the
	// bonus Java applies is the *virtual* `1 + level/6` in `level()` (`curseInfusionLevelBonus`),
	// never a stored level. This assertion used to pin the old "+1 persistent level" model, which
	// took a real level back off the item on cleanse.
	const infused = { id: 'sword', quantity: 1, level: 3, affix: 'wayward', cursed: true, curseInfusionBonus: true };
	assert.equal(reverseCurseInfusion(infused), true);
	assert.equal(infused.curseInfusionBonus, false);
	assert.equal(infused.level, 3, 'a cleanse must not change the stored level');
	const floored = { id: 'sword', quantity: 1, level: 0, curseInfusionBonus: true };
	assert.equal(reverseCurseInfusion(floored), true);
	assert.equal(floored.level, 0);
	// `Weapon.level()`/`Armor.level()`: `level += 1 + level/6` in Java's integer arithmetic, so the
	// bonus is 1 at +0, 2 from +6 and 3 from +12.
	assert.deepEqual([0, 1, 3, 5, 6, 11, 12, 18].map(curseInfusionLevelBonus), [1, 2, 4, 6, 8, 13, 15, 22], 'curse-infusion level bonus matches Java');
	assert.equal(reverseCurseInfusion({ id: 'sword', quantity: 1, level: 2 }), false);
	const looks = new Appearances({ potion: { kinds: ['a', 'b'], labels: ['red', 'blue'] } });
	const first = looks.appearanceOf('potion', 'a');
	const restored = Appearances.fromJSON({ potion: { kinds: ['a', 'b'], labels: ['red', 'blue'] } }, looks.toJSON());
	assert.equal(restored.appearanceOf('potion', 'a'), first);
	const ring = transmuteItem({ id: 'ring_might', quantity: 1, identified: true, level: 4, cursed: false }, (kind) => `test-${kind}`);
	assert.ok(ring);
	assert.equal(ring.level, 4);
	// `ScrollOfTransmutation.changeWeapon()`'s missile half, `changeTippedDart` and `changeWand`
	// (tag `v3.3.8`): carried missiles, tipped darts, classed wands and the pickaxe transmute.
	assert.equal(isTransmutableForScroll({ id: 'missile_bolas' }), true);
	assert.equal(isTransmutableForScroll({ id: 'missile_tippeddart' }), true);
	assert.equal(isTransmutableForScroll({ id: 'wand', sourceClass: 'WandOfFireblast' }), true);
	assert.equal(isTransmutableForScroll({ id: 'wand' }), false, 'the classless shared wand entry has no class to change');
	assert.equal(isTransmutableForScroll({ id: 'pickaxe' }), true);
	const bolas = transmuteItem({ id: 'missile_bolas', quantity: 7, stackable: true, identified: true, sourceClass: 'Bolas', level: 3, durability: 50, maxDurability: 100, missileSet: 'm-1', instanceId: 'm-1:3' }, (kind) => `test-${kind}`);
	assert.ok(bolas);
	assert.notEqual(bolas.sourceClass, 'Bolas', 'a missile rerolls to a different class in its tier');
	assert.equal(missileTierForClass(bolas.sourceClass), 3, 'the new class stays in the old tier');
	assert.equal(bolas.quantity, 7, 'Java detaches the whole stack and the result keeps its quantity');
	assert.equal(bolas.level, 3);
	assert.equal(bolas.durability, 50, 'wear carries over on the shared 100-point scale');
	assert.ok(bolas.missileSet && bolas.missileSet !== 'm-1', 'the reroll mints a new set');
	const dart = transmuteItem({ id: 'missile_tippeddart', quantity: 5, stackable: true, identified: true, sourceClass: 'TippedDart', tippedSeed: 'firebloom', level: 2, durability: 40, maxDurability: 100, missileSet: 'm-2', instanceId: 'm-2:2' }, (kind) => `test-${kind}`);
	assert.ok(dart);
	assert.equal(dart.id, 'missile_tippeddart');
	assert.notEqual(dart.tippedSeed, 'firebloom', '`changeTippedDart` picks a different tip');
	assert.ok(dart.tippedSeed && TIPPED_DART_BY_SEED[dart.tippedSeed] !== undefined, 'the new tip is a real seed');
	assert.equal(dart.quantity, 1, 'a tipped reroll is one fresh unit (`randomTipped(1)`)');
	assert.equal(dart.level, 0);
	assert.equal(dart.durability, 100, 'a fresh dart has full wear');
	const transmuteWand = transmuteItem({ id: 'wand', quantity: 1, stackable: true, identified: true, sourceClass: 'WandOfFireblast' }, (kind) => `test-${kind}`);
	assert.ok(transmuteWand);
	assert.equal(transmuteWand.id, 'wand');
	assert.notEqual((transmuteWand.sourceClass ?? '').toLowerCase(), 'wandoffireblast', '`changeWand` picks a different class');
	const pick = transmuteItem({ id: 'pickaxe', quantity: 1, identified: true }, (kind) => `test-${kind}`);
	assert.ok(pick);
	assert.equal(pick.id, 'weaponReward', 'the tier-2 pickaxe rerolls like any tier-2 weapon');
	assert.equal(pick.level, 0);
	assert.notEqual(pick.sourceClass, 'MagesStaff');
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

	// A carried missile stack's own identity (2026-09-16; see `src/missiles.ts`'s header). The
	// framework's merge key is `(id, instanceId)` and every missile class shares a bag id, so the
	// identity has to carry both the set and the level - which is exactly `MissileWeapon.isSimilar`
	// (`trueLevel() == trueLevel() && getClass() == getClass() && setID == setID`).
	const { missileStackId, missileStackFields, MISSILE_MAX_DURABILITY } = require('./items/missiles.js');
	assert.equal(MISSILE_MAX_DURABILITY, 100, "Java's `MissileWeapon.MAX_DURABILITY`");
	assert.equal(missileStackId('m-1', 0), 'm-1:0', 'the identity is "<set>:<level>"');
	const fields = missileStackFields('m-7', 2);
	assert.deepEqual(fields, { missileSet: 'm-7', instanceId: 'm-7:2', level: 2, durability: 100, maxDurability: 100 },
		'a freshly minted stack carries its set, its own level and full wear');

	// `MissileSprite` flight art (`items/missiles.ts`): every thrown pile flies its own
	// `ItemSpriteSheet` frame (`MISSILE_WEP` = slot 161, darts at 177), spinning at the
	// class's `ANGULAR_SPEEDS` rate. Unknown classes keep the dot fallback (null).
	const { MISSILE_ITEM_FRAMES, TIPPED_DART_FRAMES, missileFlightArt } = require('./items/missiles.js');
	assert.equal(MISSILE_ITEM_FRAMES.SpiritArrow, 161, 'the spirit arrow is MISSILE_WEP itself');
	assert.equal(MISSILE_ITEM_FRAMES.ThrowingKnife, 163, 'knives sit at +2');
	assert.equal(MISSILE_ITEM_FRAMES.HeavyBoomerang, 173, 'the boomerang at +12');
	assert.equal(MISSILE_ITEM_FRAMES.ForceCube, 176, 'the cube closes the row at +15');
	assert.equal(TIPPED_DART_FRAMES.blindweed, 189, 'blinding darts are DARTS+12');
	assert.equal(TIPPED_DART_FRAMES.rotberry, 178, 'rot darts are DARTS+1');
	assert.equal(Object.keys(TIPPED_DART_FRAMES).length, 12, 'all twelve dart seeds have art');
	assert.deepEqual(missileFlightArt('ThrowingKnife'), { frame: 163, spin: 0 }, 'knives fly straight');
	assert.deepEqual(missileFlightArt('HeavyBoomerang'), { frame: 173, spin: 1440 }, 'boomerangs spin');
	assert.deepEqual(missileFlightArt('Bolas'), { frame: 169, spin: 1440 }, 'bolas spin');
	assert.deepEqual(missileFlightArt('Shuriken'), { frame: 166, spin: 2160 }, 'shurikens spin fastest');
	assert.deepEqual(missileFlightArt('TippedDart', 'blindweed'), { frame: 189, spin: 0 }, 'tipped darts fly their own tip art');
	assert.equal(missileFlightArt('NoSuchClass'), null, 'unknown classes keep the dot fallback');
	assert.equal(missileFlightArt('TippedDart', 'nosuchseed'), null, 'unknown seeds keep the dot fallback');

	/** What `bag.add` does to a stack carrying this identity - the *only* merge decision the port
	 * makes, and therefore the one that has to reproduce `isSimilar`. */
	const merged = (a, b) => {
		const bag = new Inventory();
		bag.add({ id: 'stone', quantity: 1, stackable: true, identified: true, ...a });
		bag.add({ id: 'stone', quantity: 1, stackable: true, identified: true, ...b });
		return bag.items.map((item) => `${item.instanceId ?? '-'}x${item.quantity}`);
	};
	// same class, same set, same level -> one pile, the way Java merges them
	assert.deepEqual(merged(missileStackFields('m-1', 0), missileStackFields('m-1', 0)), ['m-1:0x2'],
		'one set at one level is a single stack');
	// an upgraded stack of that set no longer merges with its un-upgraded twin (`trueLevel()` differs)
	assert.deepEqual(merged(missileStackFields('m-1', 0), missileStackFields('m-1', 1)), ['m-1:0x1', 'm-1:1x1'],
		'a level-differing stack of the same set stays its own stack');
	// two separately-minted stacks of one class never merge, whatever their levels (`setID` differs)
	assert.deepEqual(merged(missileStackFields('m-1', 0), missileStackFields('m-2', 0)), ['m-1:0x1', 'm-2:0x1'],
		'two sets never merge, even at the same level and class');

	// The two places a floor's missile payloads are minted both go through that identity, so two
	// stacks of one class dropped separately arrive as two stacks rather than one fungible pile.
	const { sourceInventoryItem } = require('./items/itemKinds.js');
	let minted = 0;
	const instanceId = (kind) => `${kind}-seed-${minted++}`;
	const knife = sourceInventoryItem('missile', 'ThrowingKnife', instanceId);
	const knife2 = sourceInventoryItem('missile', 'ThrowingKnife', instanceId);
	assert.equal(knife.id, 'missile_throwingknife', 'the stack keeps the authored bag id for its class');
	assert.equal(knife.missileSet, 'missile-seed-0', 'a floor missile payload is minted with its own set');
	assert.equal(knife.instanceId, 'missile-seed-0:0', 'and its identity names that set and level');
	assert.equal(knife.durability, 100, 'and starts unworn');
	assert.notEqual(knife2.missileSet, knife.missileSet, 'a second stack of the same class gets its own set');
	assert.deepEqual(merged(knife, knife2), ['missile-seed-0:0x1', 'missile-seed-1:0x1'],
		'so two same-class stacks never collapse into one pile');
	// a runestone shares the `stone` bag id and must not be given a missile identity
	const runestone = sourceInventoryItem('missile', 'StoneOfBlast', instanceId);
	assert.equal(runestone.missileSet, undefined, 'a runestone payload carries no missile set');
	assert.equal(runestone.durability, undefined, 'and no missile wear');

	// A scattered heap's set and level survive the pickup as the stack they belong to - Java's heap
	// *is* the stack, and this port's heaps carry no class, so this is what is left of it.
	const picked = new Inventory();
	pickupGroundItem({
		item: { id: 'g1', kind: 'stone', x: 0, y: 0, missileLevel: 3, missileSet: 'm-9' },
		depth: 6, heroClass: 'mage', gold: 0,
		hasItem: () => false, removeItem: () => {}, setGold: () => {}, shopPrice: () => 0,
		itemName: (id) => id, offerPurchase: () => {}, missilePickupValid: () => true,
		removeGround: () => {}, playSound: () => {}, addItem: (item, stackable) => picked.add(stackable ? { ...item, stackable: true } : item),
		identify: () => {}, say: () => {}, showStatus: () => {}, collectDewdrop: () => true,
		collectPetal: () => 'levelup', addSand: () => {}, addEnergy: () => {}, addLooseGold: () => {},
		recoverStone: () => {}, pickupArmor: () => {}, pickupWand: () => {}, pickupAmulet: () => {},
		pickupRing: () => {}, pickupCrystalKey: () => {}, addSimpleGroundKind: () => {},
		messages: { pickup: (name) => name, missileDust: 'dust' },
	});
	assert.equal(picked.items.length, 1);
	assert.equal(picked.items[0].missileSet, 'm-9', 'the picked heap keeps the set it was thrown at');
	assert.equal(picked.items[0].instanceId, 'm-9:3', 'and the identity its level belongs to');
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
	// Explicit ingredient selection for the category recipes: chosen units brew, and a bad
	// selection (wrong count, a non-ingredient, an uncovered unit, the same unit twice)
	// fails whole with nothing consumed.
	const selectBag = new Inventory();
	selectBag.add({ id: 'seedSungrass', quantity: 3, stackable: true, identified: true });
	assert.deepEqual(craftPotionSeed(selectBag, [{ id: 'seedSungrass' }, { id: 'seedSungrass' }]), undefined, 'two units cannot brew');
	assert.equal(selectBag.items[0].quantity, 3, '...and nothing is consumed');
	assert.deepEqual(craftPotionSeed(selectBag, [{ id: 'potionHealing' }, { id: 'seedSungrass' }, { id: 'seedSungrass' }]), undefined, 'a non-seed fails the selection');
	assert.equal(selectBag.items[0].quantity, 3, '...still nothing consumed');
	assert.deepEqual(craftPotionSeed(selectBag, [{ id: 'seedSungrass' }, { id: 'seedSungrass' }, { id: 'seedSungrass' }]), { id: 'potionHealing', identified: true }, 'three chosen sungrass brew healing');
	assert.equal(selectBag.items.length, 0, 'the chosen units are consumed');
	const selectScroll = new Inventory();
	selectScroll.add({ id: 'scrollRage', quantity: 1, stackable: true });
	assert.equal(craftScrollToStone(selectScroll, { id: 'potionHealing' }), false, 'a non-scroll cannot transmute');
	assert.equal(selectScroll.items[0].quantity, 1, '...unconsumed');
	assert.equal(craftScrollToStone(selectScroll, { id: 'scrollRage' }), true, 'the chosen rage scroll transmutes');
	assert.equal(selectScroll.find('stoneOfAggression')?.quantity, 2, 'into two aggression stones');
	assert.equal(selectScroll.find('scrollRage'), undefined, 'and the chosen scroll is consumed');
	const selectAlchemize = new Inventory();
	selectAlchemize.add({ id: 'seedFirebloom', quantity: 1, stackable: true });
	selectAlchemize.add({ id: 'stoneOfBlast', quantity: 1, stackable: true });
	assert.equal(craftAlchemize(selectAlchemize, { seed: { id: 'seedFirebloom' }, stone: { id: 'potionFlame' } }), false, 'a non-stone cannot brew alchemize');
	assert.equal(craftAlchemize(selectAlchemize, { seed: { id: 'seedFirebloom' }, stone: { id: 'stoneOfBlast' } }), true, 'the chosen pair brews');
	assert.equal(selectAlchemize.find('alchemize')?.quantity, 8, 'eight alchemize');
	const selectCatalyst = new Inventory();
	selectCatalyst.add({ id: 'potionFrost', quantity: 1, stackable: true });
	selectCatalyst.add({ id: 'stoneOfBlast', quantity: 1, stackable: true });
	assert.equal(alchemicalCatalystCost(selectCatalyst, { primary: { id: 'potionFrost' }, secondary: { id: 'potionFrost' } }), undefined, 'the same unit cannot pair with itself');
	assert.equal(alchemicalCatalystCost(selectCatalyst, { primary: { id: 'potionFrost' }, secondary: { id: 'stoneOfBlast' } }), 1, 'a runestone secondary costs one energy');
	assert.equal(craftAlchemicalCatalyst(selectCatalyst, { primary: { id: 'potionFrost' }, secondary: { id: 'stoneOfBlast' } }), true, 'the chosen pair catalyzes');
	assert.ok(selectCatalyst.find('alchemicalCatalyst'));
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
	// `WndBlacksmith.WndUpgrade`'s `itemSelectable`: `isUpgradable() && isIdentified() && !cursed &&
	// level() < 2`. The one exclusion below is this port's own - a real Java target whose upgrade
	// would be a silent no-op here (a wand's level is read by nothing; wands run off `weaponLevel`) -
	// so it is asserted explicitly rather than left to the shared predicate. A carried missile stack
	// used to be excluded on the same grounds and is offered now that stacks carry their own level.
	const { selectBlacksmithUpgradeItems } = require('./items/blacksmith.js');
	const upgradeCandidates = (items) => selectBlacksmithUpgradeItems(items, new Set()).map((item) => item.id);
	assert.deepEqual(
		upgradeCandidates([
			{ id: 'weaponReward', quantity: 1, identified: true, level: 1 },
			{ id: 'armorReward', quantity: 1, identified: true, level: 0 },
			{ id: 'ring_garnet', quantity: 1, identified: true, level: 1 },
			{ id: 'wand', quantity: 1, identified: true, sourceClass: 'WandOfFireblast', level: 0 },
			{ id: 'stone', quantity: 5, identified: true, sourceClass: 'ThrowingKnife', level: 0 },
			{ id: 'stone', quantity: 1, identified: true, sourceClass: 'StoneOfBlast' },
			{ id: 'potionHealing', quantity: 1, identified: true },
			{ id: 'ring_garnet', quantity: 1, identified: true, level: 2 },
			{ id: 'armorReward', quantity: 1, identified: true, level: 1, cursed: true },
			{ id: 'weaponReward', quantity: 1, identified: false, level: 1 },
			{ id: 'hourglass', quantity: 1, identified: true, level: 1 },
		]),
		['weaponReward', 'armorReward', 'ring_garnet', 'stone'],
		'Java\'s upgrade selector, minus the one wand this port cannot upgrade meaningfully',
	);
	// `WndBlacksmith.WndReforge`'s own selector and pair rule. Java's `itemSelectable` is the *same*
	// predicate as the upgrade window's (identified, uncursed, upgradable, no level cap), so this now
	// offers rings too - and the pair rule is the class test the old bag-id pairing got wrong, which
	// is what let a handaxe be reforged with a shortsword here.
	const { blacksmithItemClass, blacksmithReforgePairValid, selectBlacksmithReforgeItems } = require('./items/blacksmith.js');
	const reforgeCandidates = (items) => selectBlacksmithReforgeItems(items).map((item) => `${item.id}:${item.sourceClass ?? ''}`);
	const shortsword = { id: 'weaponReward', quantity: 1, identified: true, level: 1, sourceClass: 'Shortsword', instanceId: 'w1' };
	const handaxe = { id: 'weaponReward', quantity: 1, identified: true, level: 2, sourceClass: 'Handaxe', instanceId: 'w2' };
	const otherSword = { id: 'weaponReward', quantity: 1, identified: true, level: 0, sourceClass: 'Shortsword', instanceId: 'w3' };
	const garnet = { id: 'ring_garnet', quantity: 1, identified: true, level: 1 };
	const wand = { id: 'wand', quantity: 1, identified: true, level: 0, sourceClass: 'WandOfFireblast' };
	const reforgeMissiles = { id: 'stone', quantity: 5, identified: true, sourceClass: 'ThrowingKnife', level: 0 };
	const potion = { id: 'potionHealing', quantity: 1, identified: true };
	assert.deepEqual(
		reforgeCandidates([shortsword, garnet, wand, reforgeMissiles, potion]),
		['weaponReward:Shortsword', 'ring_garnet:', 'stone:ThrowingKnife'],
		"Java's reforge predicate, including carried missile stacks; only the wand remains model-blocked",
	);
	assert.equal(blacksmithItemClass(shortsword), 'Shortsword', 'the class, not the minted bag id');
	assert.equal(blacksmithItemClass(garnet), 'ring_garnet', 'ids that name their own class fall back to it');
	assert.equal(blacksmithReforgePairValid(shortsword, otherSword), true, 'same class, different entry');
	assert.equal(blacksmithReforgePairValid(shortsword, handaxe), false, 'two different weapon classes never pair');
	assert.equal(blacksmithReforgePairValid(shortsword, shortsword), false, 'nor does an item pair with itself');
	assert.equal(blacksmithReforgePairValid(garnet, { id: 'ring_garnet', quantity: 1, identified: true, level: 1 }), true);
	assert.equal(blacksmithReforgePairValid(garnet, shortsword), false, 'a ring never pairs with a weapon');
	assert.equal(Object.keys(MWL_MISSILE_DESCRIPTION_KEYS).length, 16);
	assert.equal(MWL_MISSILE_DESCRIPTION_KEYS.missile_forcecube, 'items.weapon.missiles.forcecube.desc');
	assert.equal(MWL_MISSILE_DESCRIPTION_KEYS.missile_tippeddart, 'items.weapon.missiles.darts.dart.desc');
	// `HeavyBoomerang`'s return logs Java's real `hero.you_now_have` pickup line, which needs the
	// missile's display name - the mechanical `missileDefinitions` table has no name column, so it
	// comes from the authored item node instead.
	assert.equal(MWL_MISSILE_NAME_KEYS.missile_heavyboomerang, 'items.weapon.missiles.heavyboomerang.name');
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
	assert.equal(MWL_ITEM_GROUND_KIND_ALIASES.brokenSeal, 'brokenSeal');
	assert.equal(Object.keys(MWL_ITEM_GROUND_KIND_ALIASES).length, 30, 'ground-kind alias count (torch has its alias row)');
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
		'sheep', 'ninjaLog', 'spiritHawk', 'ward', 'earthGuardian', 'sentry', 'ratKing', 'rotHeart', 'rotLasher',
		'fetidRat', 'impShopkeeper', 'gnollTrickster', 'greatCrab', 'necroSkeleton', 'newbornElemental',
		'mimic', 'piranha', 'bee', 'statue',
	], 'monster sprite-source overrides stay authored in asset-references.mwl');
	assert.equal(tableRows('monsterSpriteFrames', 'monster').length, 70, 'all monster sprite frame metadata stays authored in asset-references.mwl');
	//`loadSpdSprites` reads its textures through two positionally-paired lists: the `const [a, b, ...]`
	//destructuring and the `Promise.all([loadImage(aUrl), ...])` array. They were transposed once
	//(`sheep`/`ninjaLog`) and nothing failed - the Smoke Bomb decoy simply rendered the sheep
	//sprite - so the two orders are pinned together here. Only three names legitimately differ,
	//because two Java classes share a sheet and one entry is the item atlas itself.
	{
		const source = readFileSync(new URL('../src/images.ts', import.meta.url), 'utf8');
		const destructureStart = source.indexOf('const [');
		const loadStart = source.indexOf('] = await Promise.all([');
		const names = source.slice(destructureStart, loadStart)
			.split('\n').map((line) => line.trim().replace(/,$/, ''))
			.filter((line) => line && !line.startsWith('//') && line !== 'const [');
		const loads = source.slice(loadStart, source.indexOf(']);', loadStart))
			.split('\n').map((line) => (/loadImage\((\w+)\)/.exec(line.trim()) ?? [])[1]).filter(Boolean);
		const ALIASES = { spawnerUrl: 'demonSpawner', ripperUrl: 'ripperDemon', itemAtlasUrl: 'items' };
		assert.equal(names.length, loads.length, 'images.ts texture lists are the same length');
		names.forEach((name, index) => {
			const url = loads[index];
			const expected = ALIASES[url] ?? url.replace(/Url$/, '');
			assert.equal(name, expected, `images.ts texture ${index} is ${name}, loaded from ${url}`);
		});
	}
	assert.deepEqual(tableRows('specialItemInventoryRules', 'sourceClass'), [
		'Bomb', 'DoubleBomb', 'CorpseDust', 'CeremonialCandle', 'Embers', 'Ankh', 'Stylus',
		'BrokenSeal', 'Honeypot', 'Alchemize', 'Bag', 'SandBag', 'Torch',
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
	// The same index's *name* half, which is what a minted payload id needs: one id (`weaponReward`,
	// `armorReward`, the ammo `stone`) covers every class, and its own node's name key is generic, so
	// before this resolution every generated weapon read as "quest weapon", a carried wand as the
	// *wielded* one, and a stack of throwing knives as a stack of stones.
	const { ARMOR_NAME_BY_CLASS, WEAPON_NAME_BY_CLASS } = require('./items/catalog.js');
	assert.equal(WEAPON_NAME_BY_CLASS.shortsword, 'items.weapon.melee.shortsword.name');
	assert.equal(WEAPON_NAME_BY_CLASS.handaxe, 'items.weapon.melee.handaxe.name');
	assert.equal(ARMOR_NAME_BY_CLASS.leatherarmor, 'items.armor.leatherarmor.name');
	// (a *wand*'s name resolves through `WAND_KEYS` by class instead - see `itemDisplayName` -
	// because a wand's authored node and its Java class are spelled differently: `wand_wandfirebolt_t1`
	// carries `items.wands.wandoffireblast.name`.)
	assert.equal(WEAPON_NAME_BY_CLASS.wornshortsword, 'items.weapon.melee.wornshortsword.name');
	assert.equal(WEAPON_NAME_BY_CLASS.nonexistentclass, undefined, 'an unknown class has no name key');
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
	assert.equal(MWL_MONSTER_NODES.length, 70, 'monster roster size');
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
		// `Wraith.java` level-0 values (`HP = 1`, `EXP = 0`, `maxLvl = -2`, `10 + 0` accuracy,
		// `(10 + 0) * 5` evasion, `1 + 0/2 .. 2 + 0` damage); `DustWraith` inherits them all.
		wraith: [1, 10, 50, 1, 2, 0, 0, 0, -2],
		dustWraith: [1, 10, 50, 1, 2, 0, 0, 0, -2],
		rotHeart: [80, 0, 0, 0, 0, 0, 5, 4, 29],
		// Lasher armor is 0 since the tenth matrix (no Java behind the old 8).
		rotLasher: [80, 25, 0, 10, 20, 0, 0, 1, 29],
	};
	const mwlMonsterById = new Map(MWL_MONSTERS.map((monster) => [String(monster.id), monster]));
	// `DM200`/`Golem` roll equipment at a real 0.2 base (`lootChance = 0.2f`), and `DM201`
	// inherits `DM200.lootChance()` wholesale - same 0.2 base, same shared `DM200_EQUIP`
	// counter (the counter sharing itself lives in `kill()`, next to the decay read).
	const lootByMonster = new Map(MWL_TABLE_ROWS('monsterLoot', 'monster').map((row) => [String(row.monster), row]));
	for (const [kind, chance] of [['dm200', 0.2], ['dm201', 0.2], ['golem', 0.2]]) {
		assert.equal(Number(lootByMonster.get(kind).chance), chance, kind + ' equipment base chance');
		assert.equal(String(lootByMonster.get(kind).kind), 'armor', kind + ' weapon-or-armor folds to armor');
	}
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
	// 20, Degrade 30, Ooze 20, Wayward 10, Charm 10, Light 250, Invulnerability 3, HazardAssistTracker 50 - all tag `v3.3.8`). The rest are the
	// port's own documented conventions, not Java values: cripple 4 / paralysis 3 / roots 3 each
	// equal a real Java application site (see PORT_COVERAGE.md's BUFF_DURATION row), poison 6
	// and bleeding 0 have no Java DURATION to match, magicalSleep 0 lasts until woken,
	// fury/berserk/cloak/focus 9999 are state markers, frostImbue 15 and lethalHasteCooldown 100
	// are port-side cooldowns (see simulation/buffs.ts). Two more differ from their Java
	// `affect()` argument for the same reason cripple/paralysis/roots do - a real Java
	// application site, adjusted to this port's decrement-before-read tick order: feintConfusion
	// 2 (Java applies `FeintConfusion` for 1 turn; the port's `advanceBuffs` decrements before
	// the skip-turn gate reads it) and counterAbility 3 (`Talent.CounterAbilityTacker`'s own 3),
	// both authored in buff-rules.mwl with their citations. Pinning the whole table so drift fails.
	const buffRows = MWL_TABLE_ROWS('buffDurations', 'buff');
	assert.deepEqual(
		Object.fromEntries(buffRows.map((row) => [String(row.buff), Number(row.duration)])),
		{
			bless: 30, hex: 30, daze: 5, chill: 10, frost: 10, drowsy: 5, magicalSleep: 0, fury: 9999,
			berserk: 9999, weakness: 20, vulnerable: 20, burning: 8, poison: 6, bleeding: 0, cripple: 4,
			paralysis: 3, roots: 3, levitation: 20, featherFall: 50, invisibility: 20, cloak: 9999,
			focus: 9999, recharging: 30, frostImbue: 15, adrenalineSurge: 200, mindvision: 20,
			terror: 20, amok: 5, aggression: 20, awareness: 2, haste: 20, degrade: 30, ooze: 20,
			wayward: 10, charm: 10, lethalHasteCooldown: 100, blindness: 10, light: 250, invulnerability: 3,
			feintConfusion: 2, counterAbility: 3, hazardAssist: 50,
		},
		'buff durations match the authored table',
	);
	// The shop shelf: `ShopRoom.generateItems()` is now a real generator (see
	// `src/items/shopStock.ts`), so what is checked here is its *decisions* - the tier-matched
	// weapon and missile, the fixed catalogue, the randomised slots and the rare roll - with the
	// draws injected rather than taken off the live stream.
	{
		const { planShopStock, shopSandBags } = require('./items/shopStock');
		/** A scripted `ShopStockSources`: the RNG queue is consumed in call order (so each draw can
		 *  be aimed), and the category/draw sources are fakes that echo back an identifiable marker
		 *  so assertions can tell which category or draw kind produced a given plan entry. */
		const scripted = (ints) => {
			const queue = [...ints];
			const rng = {
				int: () => (queue.length ? queue.shift() : 0),
				intRange: (min) => min,
				long: () => 1,
				pushGenerator: () => {},
				popGenerator: () => {},
			};
			return {
				rng,
				weaponTier: (tier) => ({ cat: 2, tier }),
				missileTier: (tier) => ({ cat: 3, tier }),
				potion: { cat: 4 },
				scroll: { cat: 5 },
				seed: { cat: 8 },
				wand: { cat: 6 },
				ring: { cat: 7 },
				randomCategory: (deck) => ({ cls: `deck-${deck.cat}`, cat: deck.cat, level: 0 }),
				randomUsingDefaults: (deck) => ({ cls: `deck-${deck.cat}`, cat: deck.cat, level: 0 }),
				randomArtifact: () => null,
			};
		};
		const ids = (plans) => plans.map((p) => (p.kind === 'item' ? p.id : p.kind === 'sandBag' ? 'sandBag' : p.kind === 'tippedDart' ? `tippedDart:${p.seedClass}` : p.generated.cls));
		// `rng.int()` draws happen in this order inside `planShopStock`: the two potion-or-scroll
		// loop picks, the bomb-slot `Random.Int(4)`, the rare-slot `Random.Int(10)`, then the
		// post-shuffle draws (which the mock resolves to 0 once the queue is spent - a deterministic
		// reorder, not a functional draw, so it doesn't affect which items ended up on the shelf).
		// Every one of Java's fixed entries is on the shelf at depth 6, plus the tier-matched pair.
		const six = planShopStock(6, null, scripted([0, 0, 0, 0]));
		const sixIds = ids(six);
		for (const fixed of ['potionHealing', 'scrollIdentify', 'scrollCleanse', 'scrollMapping',
			'alchemize', 'food', 'stoneOfAugmentation']) {
			assert.ok(sixIds.includes(fixed), `depth 6 stocks ${fixed}`);
		}
		assert.ok(six.some((p) => p.kind === 'item' && p.id === 'food' && p.quantity === 2), 'two SmallRations');
		assert.ok(six.some((p) => p.kind === 'item' && p.id === 'armorReward' && p.tier === 2), 'depth 6 stocks tier-2 armor');
		assert.ok(six.some((p) => p.kind === 'generated' && p.generated.cat === 2), 'the weapon draw is on the shelf');
		assert.ok(six.some((p) => p.kind === 'tippedDart' && p.quantity === 2), 'a stack of two tipped darts is on the shelf');
		// The rare slot is `Random.Int(10)`: a stylus on 7 of 10, and the three 1-in-10s. The bomb
		// slot's own draw (index 2) is set to 0/bomb here since it isn't what's under test.
		assert.ok(ids(planShopStock(6, null, scripted([0, 0, 0, 7]))).includes('stylus'), 'rare roll 7 -> stylus');
		// The Bomb slot is `Random.Int(4)` over Bomb/DoubleBomb/DoubleBomb/Honeypot.
		assert.ok(ids(planShopStock(6, null, scripted([0, 0, 0, 0]))).includes('bomb'), 'bomb roll 0 -> bomb');
		assert.ok(ids(planShopStock(6, null, scripted([0, 0, 1, 0]))).includes('doubleBomb'), 'bomb roll 1 -> doubleBomb');
		assert.ok(ids(planShopStock(6, null, scripted([0, 0, 3, 0]))).includes('honeypot'), 'bomb roll 3 -> honeypot');
		// Alchemize is `Random.IntRange(2, 3)`.
		assert.ok(six.some((p) => p.kind === 'item' && p.id === 'alchemize' && p.quantity >= 2 && p.quantity <= 3));
				// Deeper shops stock the next tier up. The TippedDart stack, the depth-20/21 torches,
		// the Ankh and now the `ChooseBag` pick are all stocked - no Java entry is absent.
		// The torches are three separate one-unit identified heaps, Java's own `ShopRoom`
		// depth-20/21 branch, at the real `Torch.value()` unit price of 8.
		assert.ok(planShopStock(16, null, scripted([0, 0, 0, 0])).some((p) => p.kind === 'item' && p.id === 'armorReward' && p.tier === 4));
		assert.ok(planShopStock(21, null, scripted([0, 0, 0, 0])).some((p) => p.kind === 'item' && p.id === 'armorReward' && p.tier === 5));
		const torchesAt = (depth) => planShopStock(depth, null, scripted([0, 0, 0, 0]))
			.filter((p) => p.kind === 'item' && p.id === 'torch');
		for (const depth of [6, 11, 16]) assert.equal(torchesAt(depth).length, 0, `no torches on a depth-${depth} shelf`);
		for (const depth of [20, 21]) {
			const torches = torchesAt(depth);
			assert.equal(torches.length, 3, `three torches on a depth-${depth} shelf`);
			for (const torch of torches) assert.deepEqual([torch.quantity, torch.identify], [1, true], 'each torch is its own identified heap');
		}
		assert.equal(require('./items/shopPricing.js').itemValue('torch', 3), 24, 'torch value() is 8 per unit');
		assert.equal(require('./items/shopPricing.js').getShopPrice('torch', 21), 200, 'depth-21 shelf price is 8 x5 wealth bracket');
		// `ShopRoom.generateItems()` stocks one `new Ankh()` in the shared tail every depth takes.
		assert.equal(planShopStock(6, null, scripted([0, 0, 0, 0])).filter((p) => p.kind === 'item' && p.id === 'ankh').length, 1, 'every shop stocks one ankh');
		assert.equal(require('./items/shopPricing.js').itemValue('ankh', 1), 50, 'ankh value() is 50 per unit');
		assert.equal(require('./items/shopPricing.js').getShopPrice('ankh', 6), 500, 'depth-6 shelf price is 50 x2 wealth bracket');
		// Sandbags appear only with a carried hourglass, at the depth's own fraction of the missing
		// ones - and never without it.
		assert.equal(planShopStock(6, null, scripted([0, 3, 0, 0, 7])).filter((p) => p.kind === 'sandBag').length, 0,
			'no hourglass means no sandbags');
		assert.equal(planShopStock(6, 5, scripted([0, 3, 0, 0, 7])).filter((p) => p.kind === 'sandBag').length, 1,
			'ceil(5 * 0.20) at depth 6');
		assert.equal(planShopStock(21, 4, scripted([0, 3, 0, 0, 7])).filter((p) => p.kind === 'sandBag').length, 4,
			'ceil(4 * 0.80) at depth 21');
		assert.equal(shopSandBags(11, 5), 2);
		assert.equal(shopSandBags(16, 5), 3);

		// The `ChooseBag` pick rides the fourth argument: omitted (the older three-argument
		// calls above) stocks no bag, while a pick is stocked as one identified heap in
		// Java's own position - after the alchemize stack, before the healing potion.
		assert.ok(!ids(planShopStock(6, null, scripted([0, 0, 0, 0]))).some((id) => id.endsWith('Holder') || id.endsWith('Bandolier') || id.endsWith('Holster') || id === 'velvetPouch'),
			'no bag state means no bag on the shelf');
		const bagShelf = ids(planShopStock(6, null, scripted([0, 0, 0, 0]), 'scrollHolder'));
		assert.ok(bagShelf.indexOf('scrollHolder') > bagShelf.indexOf('alchemize')
			&& bagShelf.indexOf('scrollHolder') < bagShelf.indexOf('potionHealing'),
			'the bag sits between the alchemize stack and the healing potion');
		const bagPlan = planShopStock(6, null, scripted([0, 0, 0, 0]), 'magicalHolster')
			.find((p) => p.kind === 'item' && p.id === 'magicalHolster');
		assert.deepEqual([bagPlan.quantity, bagPlan.identify], [1, true], 'the bag is one identified heap');
		// The four bag `value()` bodies, and a shelf price off one of them.
		assert.equal(require('./items/shopPricing.js').itemValue('velvetPouch', 1), 30, 'pouch value() is 30');
		assert.equal(require('./items/shopPricing.js').itemValue('scrollHolder', 1), 40, 'holder value() is 40');
		assert.equal(require('./items/shopPricing.js').itemValue('potionBandolier', 1), 40, 'bandolier value() is 40');
		assert.equal(require('./items/shopPricing.js').itemValue('magicalHolster', 1), 60, 'holster value() is 60');
		assert.equal(require('./items/shopPricing.js').getShopPrice('scrollHolder', 6), 400, 'depth-6 shelf price is 40 x2 wealth bracket');
	}
	// `ShopRoom.ChooseBag()` (`items/bags.ts`): the highest scorer among the not-yet-dropped
	// bags - base weight (velvet 1, the rest 0) plus one per holdable backpack entry - with
	// `null` once every flag is dropped. Ties go to the earlier bag id (Java's own tie-break
	// is JVM `HashMap` order and is not reproducible even in principle).
	{
		const { chooseShopBag, bagCanHold, BAG_VALUES, isBagId, ownsBag,
			HOLSTER_RECHARGE_BASE, NORMAL_RECHARGE_BASE, HOLSTER_DURABILITY_FACTOR,
			BAG_BADGE, ALL_BAGS_BADGE } = require('./items/bags.js');
		assert.deepEqual(BAG_VALUES, {
			velvetPouch: 30, scrollHolder: 40, potionBandolier: 40, magicalHolster: 60,
		}, 'bag values match the four value() bodies');
		for (const id of ['velvetPouch', 'scrollHolder', 'potionBandolier', 'magicalHolster']) {
			assert.equal(isBagId(id), true, id + ' is a bag id');
		}
		assert.equal(isBagId('bag'), false, 'the generic ground-kind bag is not a shop bag');
		assert.equal(chooseShopBag([], []), 'velvetPouch', 'an empty field still offers velvet on its base weight');
		assert.equal(chooseShopBag(['velvetPouch'], []), 'scrollHolder', 'ties break to the earlier bag id');
		assert.equal(chooseShopBag(['velvetPouch', 'scrollHolder', 'potionBandolier', 'magicalHolster'], []), null,
			'every flag dropped means no bag');
		assert.equal(chooseShopBag([], [{ id: 'seed' }]), 'velvetPouch', 'a seed scores the pouch');
		assert.equal(chooseShopBag(['velvetPouch'], [{ id: 'scrollIdentify' }, { id: 'scrollUpgrade' }]), 'scrollHolder',
			'scrolls score the holder once velvet is gone');
		assert.equal(chooseShopBag(['velvetPouch', 'scrollHolder'], [{ id: 'potionHealing' }]), 'potionBandolier',
			'a potion scores the bandolier');
		assert.equal(chooseShopBag(['velvetPouch', 'scrollHolder', 'potionBandolier'], [{ id: 'wand' }]), 'magicalHolster',
			'a wand scores the holster');
		// The shared `stone` id is disambiguated by class, the same test `wieldMissile` uses.
		assert.equal(chooseShopBag([], [{ id: 'stone', sourceClass: 'StoneOfBlast' }]), 'velvetPouch',
			'a runestone stone scores the pouch');
		assert.equal(chooseShopBag(['velvetPouch', 'scrollHolder', 'potionBandolier'], [{ id: 'stone', sourceClass: 'Bolas' }]), 'magicalHolster',
			'a missile stone scores the holster');
		// `canHold` spot checks: the honeypot is an `Item`, not a `Bomb`, so the holster
		// refuses it; the spell, the waterskin and the goo shard each land in their own bag.
		assert.equal(bagCanHold('magicalHolster', { id: 'honeypot' }), false, 'the holster refuses the honeypot');
		assert.equal(bagCanHold('magicalHolster', { id: 'doubleBomb' }), true, 'the holster takes a double bomb');
		assert.equal(bagCanHold('scrollHolder', { id: 'alchemize' }), true, 'the holder takes the spell');
		assert.equal(bagCanHold('potionBandolier', { id: 'waterskin' }), true, 'the bandolier takes the waterskin');
		assert.equal(bagCanHold('velvetPouch', { id: 'gooBlob' }), true, 'the pouch takes the goo shard');
		assert.equal(bagCanHold('velvetPouch', { id: 'wand' }), false, 'the pouch refuses a wand');
		// The holster's stat halves (`MagicalHolster.java`, tag `v3.3.8`): 0.85 recharge base
		// against the normal 0.875 (`Wand.java:804`), 1.2x missile-use durability.
		assert.equal(HOLSTER_RECHARGE_BASE, 0.85, 'holster recharge base is 0.85');
		assert.equal(NORMAL_RECHARGE_BASE, 0.875, 'normal recharge base is 0.875');
		assert.equal(HOLSTER_DURABILITY_FACTOR, 1.2, 'holster durability factor is 1.2x');
		assert.equal(ownsBag([{ id: 'scrollHolder' }], 'scrollHolder'), true, 'ownership reads the flat bag');
		assert.equal(ownsBag([{ id: 'scrollHolder' }], 'magicalHolster'), false, 'a missing bag is not owned');
		// `Badges.validateAllBagsBought` (`Badges.java`): one badge per bag plus the meta set.
		assert.deepEqual(BAG_BADGE, {
			velvetPouch: 'bag_velvet', scrollHolder: 'bag_holder',
			potionBandolier: 'bag_bandolier', magicalHolster: 'bag_holster',
		}, 'per-bag badge counters match the four bags');
		assert.equal(ALL_BAGS_BADGE, 'bags_all', 'the meta badge counter is bags_all');
	}
	// The bag open action (`items/bags.ts`'s `bagTab`): using a bag opens the bag window
	// on its own filtered tab. Three mappings are exact; velvet opens the runestone tab
	// because that tab carries the velvet name, with seeds one tap away.
	{
		const { bagTab } = require('./items/bags.js');
		assert.equal(bagTab('scrollHolder'), 'holder_scroll', 'the holder opens its scroll tab');
		assert.equal(bagTab('potionBandolier'), 'bag_potion', 'the bandolier opens its potion tab');
		assert.equal(bagTab('magicalHolster'), 'holster_wand', 'the holster opens its wand tab');
		assert.equal(bagTab('velvetPouch'), 'pouch_stone', 'the pouch opens the velvet-named tab');
	}
	// `MeleeWeapon.ability()` per-weapon table and `Charger` economy
	// (`src/items/weaponAbilities.ts`, tag `v3.3.8`): all 30 real melee classes resolve with
	// desc-verified kinds, the lookup ignores case and falls back to the bag id, the
	// port-minted stand-ins resolve to nothing, every ability costs exactly 1 charge (free
	// only inside the cleave/spin windows), the cap follows the hero level, accrual is
	// `Charger.act()`'s time rate, spends go partial-first behind the `charges + partial`
	// gate, and `COUNTER_ABILITY` refunds `rank*0.375` after the spend; sneak's blink
	// range is 3/4/5 tiles by weapon (the aim itself runs through the scene's TargetingController).
	{
		const { weaponAbilityFor, weaponAbilityChargeCost, weaponChargeCap, accrueWeaponCharge, spendWeaponCharge, gainWeaponCharge, counterAbilityRefund, spinDamageMultiplier } = require('./items/weaponAbilities.js');
		const abilityKinds = {
			AssassinsBlade: 'sneak', Dirk: 'sneak', Dagger: 'sneak',
			BattleAxe: 'heavyBlow', HandAxe: 'heavyBlow', Mace: 'heavyBlow', WarHammer: 'heavyBlow',
			Greatsword: 'cleave', Longsword: 'cleave', Sword: 'cleave', Shortsword: 'cleave', WornShortsword: 'cleave',
			Flail: 'spin', Greatshield: 'guard', RoundShield: 'guard',
			Gauntlet: 'comboStrike', Sai: 'comboStrike', Gloves: 'comboStrike',
			Glaive: 'spike', Spear: 'spike', Katana: 'lunge', Rapier: 'lunge',
			Sickle: 'harvest', WarScythe: 'harvest', Scimitar: 'swordDance',
			Quarterstaff: 'defensiveStance', Greataxe: 'retribution', Crossbow: 'chargedShot',
			RunicBlade: 'runicSlash', Whip: 'lash',
		};
		assert.equal(Object.keys(abilityKinds).length, 30, 'all 30 real melee classes have an ability');
		for (const [cls, kind] of Object.entries(abilityKinds)) {
			assert.equal(weaponAbilityFor(cls, 'weaponReward')?.kind, kind, `${cls} ability is ${kind}`);
		}
		assert.equal(weaponAbilityFor('SHORTSWORD', 'weaponReward')?.kind, 'cleave', 'lookup ignores case');
		assert.equal(weaponAbilityFor(undefined, 'dagger')?.kind, 'sneak', 'bag id answers when no class is carried');
		assert.equal(weaponAbilityFor(undefined, 'startingWeapon'), null, 'the starting stand-in has no ability');
		assert.equal(weaponAbilityFor(undefined, 'weaponReward'), null, 'the generated stand-in has no ability');
		assert.equal(weaponAbilityFor('PotionOfHealing', 'potionHealing'), null, 'non-weapons have no ability');
		// `Dagger.sneakAbility(hero, target, maxDist, ...)` per-weapon ranges (tag `v3.3.8`).
		assert.equal(weaponAbilityFor('AssassinsBlade', 'weaponReward')?.blinkRange, 3, 'blade blinks 3');
		assert.equal(weaponAbilityFor('Dirk', 'weaponReward')?.blinkRange, 4, 'dirk blinks 4');
		assert.equal(weaponAbilityFor('Dagger', 'weaponReward')?.blinkRange, 5, 'dagger blinks 5');
		assert.equal(weaponAbilityFor('Shortsword', 'weaponReward')?.damageBonus, 30, 'cleave magnitudes ride along');
		assert.equal(weaponAbilityFor('Rapier', 'weaponReward')?.damageBonus, 67, 'rapier lunge is +67');
		assert.equal(weaponAbilityFor('RunicBlade', 'weaponReward')?.damageBonus, 300, 'runic slash is +300%');
		assert.equal(weaponAbilityFor('Dagger', 'weaponReward')?.buffTurns, undefined, 'sneak duration is computed, not tabled');
		// `baseChargeUse`: 1 everywhere, 0 only in the two free windows.
		for (const kind of ['sneak', 'heavyBlow', 'guard', 'comboStrike', 'spike', 'lunge', 'harvest', 'swordDance', 'defensiveStance', 'retribution', 'chargedShot', 'runicSlash', 'lash']) {
			assert.equal(weaponAbilityChargeCost(kind, { cleaveFree: false, spinning: false }), 1, `${kind} costs 1`);
		}
		assert.equal(weaponAbilityChargeCost('cleave', { cleaveFree: false, spinning: false }), 1, 'first cleave costs 1');
		assert.equal(weaponAbilityChargeCost('cleave', { cleaveFree: true, spinning: false }), 0, 're-cleave is free');
		assert.equal(weaponAbilityChargeCost('spin', { cleaveFree: false, spinning: false }), 1, 'first spin costs 1');
		assert.equal(weaponAbilityChargeCost('spin', { cleaveFree: false, spinning: true }), 0, 'mid-spin spins are free');
		assert.equal(weaponAbilityChargeCost('guard', { cleaveFree: true, spinning: true }), 1, 'foreign windows change nothing');
		// `chargeCap()`: 2+(lvl-1)/3 capped at 8, champion 4+(lvl-1)/3 capped at 10.
		assert.deepEqual([1, 2, 4, 7, 19, 20, 30].map((lvl) => weaponChargeCap(lvl, false)), [2, 2, 3, 4, 8, 8, 8], 'non-champion cap curve');
		assert.deepEqual([1, 4, 19, 22, 30].map((lvl) => weaponChargeCap(lvl, true)), [4, 5, 10, 10, 10], 'champion cap curve');
		// `Charger.act()`: 1/(60-1.5*(cap-charges)) per turn, so 1/57 at cap 2 from empty.
		const baseOpts = { cap: 2, champion: false, weaponRechargingRank: 0, recharging: false, artifactRecharge: false };
		let st = accrueWeaponCharge({ charges: 0, partial: 0 }, baseOpts);
		assert.ok(Math.abs(st.partial - 1 / 57) < 1e-12, 'base accrual is 1/57 per turn at cap 2');
		assert.equal(st.charges, 0, 'no whole charge banked yet');
		st = accrueWeaponCharge({ charges: 1, partial: 0 }, baseOpts);
		assert.ok(Math.abs(st.partial - 1 / 58.5) < 1e-12, 'near-cap accrual slows to 1/58.5');
		st = accrueWeaponCharge({ charges: 0, partial: 0 }, { ...baseOpts, champion: true });
		assert.ok(Math.abs(st.partial - 1.5 / 57) < 1e-12, 'champion accrues 1.5x');
		st = accrueWeaponCharge({ charges: 0, partial: 0 }, { ...baseOpts, weaponRechargingRank: 1, recharging: true });
		assert.ok(Math.abs(st.partial - (1 / 57 + 1 / 15)) < 1e-12, 'recharging adds 1/15 at rank 1');
		st = accrueWeaponCharge({ charges: 0, partial: 0 }, { ...baseOpts, weaponRechargingRank: 2, recharging: true });
		assert.ok(Math.abs(st.partial - (1 / 57 + 1 / 10)) < 1e-12, 'recharging adds 1/10 at rank 2');
		st = accrueWeaponCharge({ charges: 0, partial: 0 }, { ...baseOpts, artifactRecharge: true });
		assert.ok(Math.abs(st.partial - (1 / 57 + 1 / 20)) < 1e-12, 'artifact recharge adds 1/20 even unranked');
		st = accrueWeaponCharge({ charges: 0, partial: 0.99 }, baseOpts);
		assert.equal(st.charges, 1, 'crossing 1 banks one charge');
		assert.ok(Math.abs(st.partial - (0.99 + 1 / 57 - 1)) < 1e-12, 'the remainder carries over');
		st = accrueWeaponCharge({ charges: 2, partial: 0.4 }, baseOpts);
		assert.deepEqual([st.charges, st.partial], [2, 0], 'at cap the fraction is dropped, not banked');
		st = accrueWeaponCharge({ charges: 0, partial: 0.03 }, baseOpts, 2);
		assert.ok(Math.abs(st.partial - (0.03 + 2 / 57)) < 1e-12, 'multi-turn ticks scale the gain');
		// `beforeAbilityUsed` / `execute`: partial-first spend behind the float gate.
		assert.equal(spendWeaponCharge({ charges: 0, partial: 0.9 }, 1), null, '0.9 total cannot pay 1');
		assert.deepEqual(spendWeaponCharge({ charges: 2, partial: 0.5 }, 1), { charges: 1, partial: 0.5 }, 'the borrow comes out of whole charges');
		assert.deepEqual(spendWeaponCharge({ charges: 1, partial: 0 }, 1), { charges: 0, partial: 0 }, 'exact whole spend');
		assert.deepEqual(spendWeaponCharge({ charges: 0, partial: 1 }, 1), { charges: 0, partial: 0 }, 'exact partial spend');
		assert.deepEqual(spendWeaponCharge({ charges: 3, partial: 0.2 }, 0), { charges: 3, partial: 0.2 }, 'free windows spend nothing');
		// `gainCharge`: banks whole charges, drops the remainder at the cap.
		st = gainWeaponCharge({ charges: 1, partial: 0.2 }, 0.375, 8);
		assert.equal(st.charges, 1, 'refund banks no whole charge yet');
		assert.ok(Math.abs(st.partial - 0.575) < 1e-12, 'refund lands in the fraction');
		st = gainWeaponCharge({ charges: 1, partial: 0.8 }, 0.5, 8);
		assert.equal(st.charges, 2, 'overflow banks one charge');
		assert.ok(Math.abs(st.partial - 0.3) < 1e-12, 'overflow leaves the remainder');
		assert.deepEqual(gainWeaponCharge({ charges: 7, partial: 0.9 }, 1.5, 8), { charges: 8, partial: 0 }, 'the cap keeps whole charges, drops the rest');
		assert.deepEqual(gainWeaponCharge({ charges: 8, partial: 0 }, 1.5, 8), { charges: 8, partial: 0 }, 'full meter ignores refunds');
		assert.deepEqual([0, 1, 2, 3, 4].map(counterAbilityRefund), [0, 0.375, 0.75, 1.125, 1.5], 'refund is rank*0.375');
		assert.equal(counterAbilityRefund(9), 1.5, 'refund clamps at rank 4');
		for (const [spins, mult] of [[0, 1], [1, 1.33], [2, 1.66], [3, 1.99]]) {
			assert.ok(Math.abs(spinDamageMultiplier(spins) - mult) < 1e-9, `spin x${spins} multiplies ${mult}`);
		}
		assert.ok(Math.abs(spinDamageMultiplier(9) - 1.99) < 1e-9, 'spin caps at 3');	}
	// `Torch` (tag `v3.3.8`): single-category registration. The torch is a stackable
	// consumable-slot item (`consumables.mwl`, like `Alchemize`) plus the special-item
	// mappings its Java source class needs - and nothing else: its name is single-sourced
	// from the consumable node (no second `itemNameKeys` row), it is not food
	// (`consumableStats` is `Food.energy`), and its description resolves through the
	// name-key fallback rather than a redundant `consumableDescriptionKeys` row. Both
	// sprite frames are `ItemSpriteSheet.TORCH = MISC_CONSUMABLE + 3 = 51`.
	{
		const { MWL_TABLE_ROWS: torchRows, MWL_CONSUMABLE_ITEMS: torchConsumables } = require('./mwlContent.js');
		const hasRow = (table, key, value) => torchRows(table, key).some((row) => String(row[key]) === value);
		assert.ok(torchConsumables.some((item) => item.id === 'torch'), 'torch has its consumables.mwl node');
		assert.equal(hasRow('itemNameKeys', 'item', 'torch'), false, 'torch name is single-sourced, not duplicated in itemNameKeys');
		assert.equal(hasRow('consumableStats', 'item', 'torch'), false, 'torch is not food');
		assert.equal(hasRow('consumableDescriptionKeys', 'item', 'torch'), false, 'torch desc resolves via the name-key fallback');
		assert.equal(hasRow('groundItemNameKeys', 'groundKind', 'torch'), true, 'ground torch has a name key');
		assert.equal(hasRow('specialItemGroundKinds', 'sourceClass', 'Torch'), true, 'Torch source class maps to the torch ground kind');
		assert.equal(hasRow('specialItemInventoryRules', 'sourceClass', 'Torch'), true, 'Torch source class maps to the torch item id');
		assert.equal(hasRow('itemGroundKindAliases', 'itemId', 'torch'), true, 'torch item id maps to the torch ground kind');
		const frameOf = (table, key, match) => torchRows(table, key).find((row) => String(row[key]) === match)?.frame;
		assert.equal(Number(frameOf('itemFrames', 'kind', 'torch')), 51, 'ground torch uses ItemSpriteSheet.TORCH');
		assert.equal(Number(frameOf('itemSpecificFrames', 'item', 'torch')), 51, 'inventory torch uses ItemSpriteSheet.TORCH');
		assert.equal(torchRows('itemActionKeys', 'item').find((row) => String(row.item) === 'torch')?.actionKey,
			'items.torch.ac_light', 'torch keeps its LIGHT action');
		assert.equal(require('./simulation/mwlBuffDurations.js').BUFF_DURATION_DATA.light, 250, 'Light lasts Light.DURATION');
		const torchCalls = [];
		const torchScene = { awaitingInput: true, setRequestedItem: () => {}, useTorch: (instanceId) => torchCalls.push(instanceId) };
		require('./items/itemActions.js').useItemById(torchScene, 'torch', 'torch:abc');
		assert.deepEqual(torchCalls, ['torch:abc'], 'the LIGHT action routes to useTorch');
		require('./items/itemActions.js').useItemById({ ...torchScene, awaitingInput: false }, 'torch');
		const ankhCalls = [];
		require('./items/itemActions.js').useItemById({ awaitingInput: true, setRequestedItem: () => {}, useAnkh: (instanceId) => ankhCalls.push(instanceId) }, 'ankh', 'ankh:abc');
		assert.deepEqual(ankhCalls, ['ankh:abc'], 'the BLESS action routes to useAnkh');
		assert.equal(torchRows('itemActionKeys', 'item').find((row) => String(row.item) === 'ankh')?.actionKey,
			'items.ankh.ac_bless', 'ankh keeps its BLESS action');
		// `WndResurrect`: two keeps survive (matched by id plus instance), everything else -
		// including other ankhs - is lost; the selector admits everything but ankhs and bags.
		const resurrectRules = require('./items/resurrect.js');
		assert.equal(resurrectRules.isResurrectKeepCandidate({ id: 'potionHealing', quantity: 1 }), true, 'ordinary goods are keepable');
		assert.equal(resurrectRules.isResurrectKeepCandidate({ id: 'ankh', quantity: 1 }), false, 'ankhs are not keepable');
		for (const id of ['velvetPouch', 'scrollHolder', 'potionBandolier', 'magicalHolster']) {
		assert.equal(resurrectRules.isResurrectKeepCandidate({ id, quantity: 1 }), false, `${id} is not keepable`);
	}
		assert.equal(resurrectRules.isResurrectKeepCandidate({ id: 'food', quantity: 0 }), false, 'empty stacks are not keepable');
		const split = resurrectRules.partitionResurrectKeeps([
			{ id: 'weaponReward', instanceId: 'w:1', quantity: 1 },
			{ id: 'armorReward', instanceId: 'a:1', quantity: 1 },
			{ id: 'ankh', quantity: 1 },
			{ id: 'food', quantity: 2 },
		], { id: 'weaponReward', instanceId: 'w:1' }, { id: 'armorReward', instanceId: 'a:1' });
		assert.deepEqual(split.kept.map((item) => item.id), ['weaponReward', 'armorReward'], 'only the two keeps survive');
		assert.deepEqual(split.lost.map((item) => item.id), ['ankh', 'food'], 'the spare ankh and the rest are lost');
		const sameId = resurrectRules.partitionResurrectKeeps([
			{ id: 'potion', quantity: 1 },
			{ id: 'potion', quantity: 3 },
		], { id: 'potion' }, { id: 'food' });
		assert.equal(sameId.kept.length, 2, 'instance-less same-id stacks both survive');
		assert.deepEqual(torchCalls, ['torch:abc'], 'no item action fires outside input');
	}
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
		'dm300:', 'goo:', 'golem:', 'necroSkeleton:', 'ninjaLog:', 'pylon:', 'piranha:', 'rotHeart:',
		'skeleton:', 'statue:', 'succubus:', 'tengu:', 'yog:', 'yogFist:bright', 'yogFist:burning',
		'yogFist:rotting', 'yogFist:rusted',
	].sort(), 'monster immunity table covers exactly the Java-immune kinds');
	assert.deepEqual(immunityByKey.get('ninjaLog:'), ['amok', 'charm', 'terror'], 'the NinjaLog decoy refuses terror/amok/charm');
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
	const { sandalsSeedChargeReq, sandalsCanUseSeed, feedSandalsSeed, sandalsRootChargeReq,
		sandalsNaturalismLevel, applySandalsNaturalismCharge, sandalsChargeCap, sandalsLevelCap } = require('./items/sandals.js');
	// `SandalsOfNature.seedChargeReqs`'s static block (tag `v3.3.8`), one row per seed class. This
	// pins the authored MWL table to Java's own numbers: the table drives both the `AC_ROOT` charge
	// gate and the "is this seed feedable at all" filter, so a drifted row would be a silent
	// gameplay change rather than a compile error.
	const sandalsSeedReqs = new Map(MWL_TABLE_ROWS('sandalsSeedReqs', 'seed').map((row) => [row.seed, Number(row.charge)]));
	assert.deepEqual([...sandalsSeedReqs.entries()].sort(), [
		['blindweed', 12], ['earthroot', 40], ['fadeleaf', 12], ['firebloom', 20], ['icecap', 20],
		['mageroyal', 12], ['rotberry', 8], ['sorrowmoss', 20], ['starflower', 40], ['stormvine', 20],
		['sungrass', 80], ['swiftthistle', 20],
	].sort(), 'the authored seed-charge table equals Java\'s seedChargeReqs');
	for (const [seed, charge] of sandalsSeedReqs) assert.equal(sandalsSeedChargeReq(seed), charge, `charge requirement for ${seed}`);
	assert.equal(sandalsSeedChargeReq('blandfruit'), null, 'an unmapped kind has no requirement');
	assert.equal(sandalsChargeCap(), 100);
	assert.equal(sandalsLevelCap(), 3);
	// Java's `naturalismLevel`: 0 with no artifact, -1 for a cursed pair, `itemLevel()+1` otherwise.
	assert.equal(sandalsNaturalismLevel(undefined), 0);
	assert.equal(sandalsNaturalismLevel({ level: 0 }), 1);
	assert.equal(sandalsNaturalismLevel({ level: 3 }), 4);
	assert.equal(sandalsNaturalismLevel({ level: 2, cursed: true }), -1);
	// `ArtifactBuff.isCursed()` is `MagicImmune == null && cursed`, so a cursed pair under AntiMagic
	// is NOT cursed for `HighGrass.trample`'s purposes and keeps the full loot scaling - while still
	// gaining no charge, which is the one case where Java's two checks disagree.
	assert.equal(sandalsNaturalismLevel({ level: 2, cursed: true }, true), 3, 'AntiMagic clears the curse for loot');
	assert.equal(sandalsNaturalismLevel({ level: 2 }, true), 3);
	// `Naturalism.charge()`: `(3+level)/6` per trampled grass, banked in whole units at the cap.
	const grassSandals = { level: 0, charge: 0, partialCharge: 0 };
	applySandalsNaturalismCharge(grassSandals, 1, false);
	assert.equal(grassSandals.charge, 0);
	assert.equal(grassSandals.partialCharge, 0.5, 'half a charge per grass at +0');
	applySandalsNaturalismCharge(grassSandals, 1, false);
	assert.equal(grassSandals.charge, 1, 'two tramples bank one whole charge at +0');
	assert.equal(grassSandals.partialCharge, 0);
	const maxedSandals = { level: 3, charge: 100, partialCharge: 0 };
	applySandalsNaturalismCharge(maxedSandals, 1, false);
	assert.equal(maxedSandals.charge, 100);
	assert.equal(maxedSandals.partialCharge, 0, 'a full pair banks nothing further');
	const cursedSandals = { level: 3, charge: 0, partialCharge: 0, cursed: true };
	applySandalsNaturalismCharge(cursedSandals, 1, false);
	assert.equal(cursedSandals.charge, 0, 'cursed footwear gains no charge');
	const immuneSandals = { level: 3, charge: 0, partialCharge: 0 };
	applySandalsNaturalismCharge(immuneSandals, 1, true);
	assert.equal(immuneSandals.charge, 0, 'AntiMagic gains no charge');
	const ringedSandals = { level: 0, charge: 0, partialCharge: 0 };
	applySandalsNaturalismCharge(ringedSandals, 1.175, false);
	assert.equal(ringedSandals.partialCharge, 0.5 * 1.175, 'the energy-ring multiplier scales the gain');
	// `canUseSeed()`: never a kind the footwear already holds; at the level cap, never the attuned
	// kind either - which is what stops a maxed pair from being fed its own current seed forever.
	assert.equal(sandalsCanUseSeed({ level: 0, seeds: [] }, 'rotberry'), true);
	assert.equal(sandalsCanUseSeed({ level: 0, seeds: ['rotberry'] }, 'rotberry'), false);
	assert.equal(sandalsCanUseSeed({ level: 3, seeds: [], curSeedEffect: 'rotberry' }, 'rotberry'), false);
	assert.equal(sandalsCanUseSeed({ level: 3, seeds: [], curSeedEffect: 'sungrass' }, 'rotberry'), true);
	assert.equal(sandalsCanUseSeed({ level: 0, seeds: [] }, 'blandfruit'), false);
	// `itemSelector.onSelect()`: the third seed at +0 clears the list and levels the artifact.
	const fedSandals = { level: 0, seeds: [] };
	assert.equal(feedSandalsSeed(fedSandals, 'rotberry'), false, 'one seed is not enough at +0');
	assert.equal(feedSandalsSeed(fedSandals, 'firebloom'), false, 'two are not either');
	assert.equal(feedSandalsSeed(fedSandals, 'icecap'), true, 'the third reaches `3 + level()*3`');
	assert.equal(fedSandals.level, 1);
	assert.deepEqual(fedSandals.seeds, [], 'the list empties on the level');
	assert.equal(fedSandals.curSeedEffect, 'icecap', 'the last fed seed stays attuned');
	assert.equal(sandalsRootChargeReq(fedSandals), 20, 'the attuned seed sets the root cost');
	assert.equal(sandalsRootChargeReq({ level: 0, seeds: [] }), null, 'nothing attuned means no root at all');
	// At the cap the list stops growing, so no further level is reachable however much is fed.
	const cappedSandals = { level: 3, seeds: [] };
	for (const seed of sandalsSeedReqs.keys()) {
		assert.equal(feedSandalsSeed(cappedSandals, seed), false, `no further level once capped (${seed})`);
	}
	assert.equal(cappedSandals.level, 3);
	const { talismanMaxDist, talismanScryAngle, talismanScryCost, talismanApplyScryCost, talismanApplyExp,
		talismanAwarenessDuration, talismanProcFigure, talismanScryGate, applyTalismanPerTurnCharge,
		talismanChargeCap, talismanLevelCap } = require('./items/talisman.js');
	// `TalismanOfForesight` (tag `v3.3.8`): the caps, the `maxDist()` pair of bounds, the
	// distance-scaled cone angle and its cost, the per-turn trickle and the exp curve.
	assert.equal(talismanChargeCap(), 100);
	assert.equal(talismanLevelCap(), 10);
	assert.equal(talismanScryGate({ charge: 4 }, false), 'low', 'the scry needs 5 charge');
	assert.equal(talismanScryGate({ charge: 5 }, false), 'ok');
	assert.equal(talismanScryGate({ charge: 5, cursed: true }, false), 'cursed');
	assert.equal(talismanScryGate({ charge: 5 }, true), 'missing', 'AntiMagic blocks the action silently');
	assert.equal(talismanScryGate(undefined, false), 'missing');
	// `min(5 + 2*level, (charge-3)/1.08)`: the charge bound bites for a low charge, the level bound
	// for a high one. At +0/100 charge the level bound wins at 5; at +10/5 charge the charge bound
	// wins at 1.85 (the documented "nearly-empty charge" case).
	assert.equal(talismanMaxDist(0, 100), 5);
	assert.equal(talismanMaxDist(10, 100), 25);
	assert.equal(Math.round(talismanMaxDist(10, 5) * 100) / 100, 1.85);
	// `round(200 * 0.92^dist)`: 200 degrees point-blank, 184 at one tile, 92 at nine.
	assert.equal(talismanScryAngle(0), 200);
	assert.equal(talismanScryAngle(1), 184);
	assert.equal(talismanScryAngle(9), 94);
	// The cost is `3 + dist*1.08`, and Java spends it on an *int* charge, truncating: at dist 2 the
	// cost is 5.16, so a charge of 20 becomes 14 with 0.16 owed back out of `partialCharge`.
	const scried = { charge: 20, partialCharge: 0.5 };
	talismanApplyScryCost(scried, 2);
	assert.equal(scried.charge, 14, 'Java truncates the fractional charge');
	assert.equal(Math.round(scried.partialCharge * 100) / 100, 0.34);
	// An over-spend borrows from `partialCharge` and can leave a negative partial on a zero charge,
	// which is Java's own `while (charge < 0)` branch.
	const broke = { charge: 3, partialCharge: 0 };
	talismanApplyScryCost(broke, 0);
	assert.equal(broke.charge, 0);
	assert.equal(Math.round(broke.partialCharge * 100) / 100, 0);
	assert.equal(talismanScryCost(0), 3);
	assert.equal(Math.round(talismanScryCost(25) * 100) / 100, 30);
	// `5 + 2*level()` awareness, the `(int)(3 + dist*1.08)` proc figure, and the `100 + 50*level`
	// exp curve with its level cap.
	assert.equal(talismanAwarenessDuration(0), 5);
	assert.equal(talismanAwarenessDuration(5), 15);
	assert.equal(talismanProcFigure(0), 3);
	assert.equal(talismanProcFigure(2), 5);
	const leveling = { level: 0, exp: 99 };
	assert.equal(talismanApplyExp(leveling, 1), true, '100 exp levels a +0 talisman');
	assert.equal(leveling.level, 1);
	assert.equal(leveling.exp, 0, 'the threshold is subtracted, not reset');
	assert.equal(talismanApplyExp(leveling, 149), false, 'a +1 talisman needs 150');
	assert.equal(leveling.exp, 149);
	assert.equal(talismanApplyExp({ level: 10, exp: 100000 }, 0), false, 'the cap holds at +10');
	// `Foresight.act()`: 0.05 a turn at +0 (2000 turns to full), doubled at +10, and no gain at all
	// past the cap or under AntiMagic.
	const charging = { level: 0, charge: 0, partialCharge: 0 };
	for (let i = 0; i < 20; i++) applyTalismanPerTurnCharge(charging, 1, false, true);
	assert.equal(charging.charge, 1, '20 turns at +0 = exactly one charge');
	// Not exactly 0: twenty `float` additions of 0.05 leave a residue of ~1.2e-7, which is Java's own
	// arithmetic (`partialCharge` is a float there too), not a port artefact.
	assert.ok(Math.abs(charging.partialCharge) < 1e-6, `float residue stays negligible (${charging.partialCharge})`);
	const fast = { level: 10, charge: 0, partialCharge: 0 };
	for (let i = 0; i < 10; i++) applyTalismanPerTurnCharge(fast, 1, false, true);
	assert.equal(fast.charge, 1, '10 turns at +10 = exactly one charge');
	const immuneCharge = { level: 0, charge: 0, partialCharge: 0 };
	applyTalismanPerTurnCharge(immuneCharge, 1, true, true);
	assert.equal(immuneCharge.partialCharge, 0, 'AntiMagic gains nothing');
	const pausedCharge = { level: 0, charge: 0, partialCharge: 0 };
	applyTalismanPerTurnCharge(pausedCharge, 1, false, false);
	assert.equal(pausedCharge.partialCharge, 0, 'a suppressed regen tick gains nothing');
	const fullCharge = { level: 0, charge: 100, partialCharge: 0.5 };
	applyTalismanPerTurnCharge(fullCharge, 1, false, true);
	assert.equal(fullCharge.partialCharge, 0.5, 'a capped talisman is left entirely alone');
	const { roseLevelCap, roseChargeCap, roseGhostMaxHp, roseGhostAttackSkill, roseGhostDefenseSkill,
		roseGhostDamageRange, roseGhostStrength, applyRoseRecharge, roseSummonGate, rosePetalsNeeded,
		rosePetalDropCap, rosePetalPickup } = require('./items/rose.js');
	// `DriedRose` (tag `v3.3.8`): the caps and the ghost's whole stat line.
	assert.equal(roseLevelCap(), 10);
	assert.equal(roseChargeCap(), 100);
	assert.equal(roseGhostMaxHp(0), 20, 'a +0 rose raises a 20 HP ghost');
	assert.equal(roseGhostMaxHp(10), 100);
	assert.equal(roseGhostAttackSkill(7), 16, 'hero.lvl + 9');
	assert.equal(roseGhostDefenseSkill(7), 11, 'hero.lvl + 4');
	assert.deepEqual(roseGhostDamageRange(), [0, 5], 'a bare-handed ghost rolls NormalIntRange(0, 5)');
	assert.equal(roseGhostStrength(0), 13);
	assert.equal(roseGhostStrength(9), 17, 'level()/2 is integer division');
	// The `AC_SUMMON` ladder, in Java's own order.
	assert.equal(roseSummonGate(undefined, true, false, false), 'missing');
	assert.equal(roseSummonGate({ charge: 100 }, false, false, false), 'quest', 'the Sad Ghost quest gates it');
	assert.equal(roseSummonGate({ charge: 100 }, true, true, false), 'spawned', 'one ghost at a time');
	assert.equal(roseSummonGate({ charge: 99 }, true, false, false), 'no_charge', 'it must be *full*, not just charged');
	assert.equal(roseSummonGate({ charge: 100, cursed: true }, true, false, false), 'cursed');
	assert.equal(roseSummonGate({ charge: 100 }, true, false, false), 'ok');
	assert.equal(roseSummonGate({ charge: 100 }, true, false, true), 'missing', 'AntiMagic blocks it silently');
	// `roseRecharge.act()` with no ghost: `1/5` a turn, 500 turns to a full charge, and Java's
	// *strict* `> 1` boundary - exactly 1.0 sits without paying out.
	const roseCharging = { charge: 0, partialCharge: 0 };
	for (let i = 0; i < 4; i++) applyRoseRecharge(roseCharging, { ghostAlive: false, ringMultiplier: 1, magicImmune: false, regenOn: true });
	assert.equal(roseCharging.charge, 0, 'four turns of 0.2 is still under a whole charge');
	assert.ok(Math.abs(roseCharging.partialCharge - 0.8) < 1e-9);
	const fifth = applyRoseRecharge(roseCharging, { ghostAlive: false, ringMultiplier: 1, magicImmune: false, regenOn: true });
	assert.ok(!fifth.charged, 'a boundary of exactly 1.0 does not pay out');
	for (let i = 0; i < 4; i++) applyRoseRecharge(roseCharging, { ghostAlive: false, ringMultiplier: 1, magicImmune: false, regenOn: true });
	assert.equal(roseCharging.charge, 1, 'ten turns bank exactly one charge');
	const roseCapped = { charge: 100, partialCharge: 0 };
	const cappedTick = applyRoseRecharge(roseCapped, { ghostAlive: false, ringMultiplier: 1, magicImmune: false, regenOn: true });
	assert.equal(roseCapped.charge, 100, 'a full rose is left alone');
	assert.ok(!cappedTick.charged, 'and does not re-announce itself');
	const roseSuppressed = { charge: 0, partialCharge: 0 };
	applyRoseRecharge(roseSuppressed, { ghostAlive: false, ringMultiplier: 1, magicImmune: true, regenOn: true });
	applyRoseRecharge(roseSuppressed, { ghostAlive: false, ringMultiplier: 1, magicImmune: false, regenOn: false });
	applyRoseRecharge({ charge: 0, partialCharge: 0, cursed: true }, { ghostAlive: false, ringMultiplier: 1, magicImmune: false, regenOn: true });
	assert.equal(roseSuppressed.charge, 0, 'AntiMagic and a paused regen both gain nothing');
	// With a ghost alive the clock heals *instead*: `HT/500` a turn, and the charge never moves.
	const roseHealing = { charge: 0, partialCharge: 0 };
	let healed = 0;
	for (let i = 0; i < 50; i++) {
		healed += applyRoseRecharge(roseHealing, { ghostAlive: true, ghostHp: 0, ghostMaxHp: 100, ringMultiplier: 1, magicImmune: false, regenOn: true }).ghostHealed;
	}
	// Nine, not ten: Java's healing loop is `while (partialCharge > 1)`, *strictly* greater, so the
	// tenth point of a 50-tick tenth sits at exactly 1.0 and waits for the 51st - the loop, not the
	// "heals to full over 500 turns" comment above it, is what this port reproduces.
	assert.equal(healed, 9, '50 turns heals a 100 HP ghost by 9, the strict boundary holding the tenth');
	assert.equal(roseHealing.charge, 0, 'and no charge accrues while the ghost lives');
	const fullGhost = applyRoseRecharge({ charge: 0, partialCharge: 0.5 }, { ghostAlive: true, ghostHp: 100, ghostMaxHp: 100, ringMultiplier: 1, magicImmune: false, regenOn: true });
	assert.equal(fullGhost.ghostHealed, 0);
	// `RegularLevel`'s petal drop: `ceil((depth/2 - dropped)/3)`, integer division inside the ceil.
	assert.equal(rosePetalsNeeded(2, 0), 1, 'depth 2 wants its first petal');
	assert.equal(rosePetalsNeeded(6, 1), 1, 'depth 6, one dropped: (3-1)/3 rounds up to 1');
	assert.equal(rosePetalsNeeded(10, 5), 0, 'on schedule means no extra petals');
	assert.equal(rosePetalsNeeded(12, 0), 2, 'far behind drops two');
	assert.equal(rosePetalDropCap(), 11);
	// `DriedRose.Petal.doPickUp()`'s four outcomes.
	assert.equal(rosePetalPickup(undefined), 'no_rose');
	assert.equal(rosePetalPickup({ level: 0 }), 'levelup');
	assert.equal(rosePetalPickup({ level: 9 }), 'maxlevel', 'the tenth petal tops it out');
	assert.equal(rosePetalPickup({ level: 10 }), 'no_room');
	const { wealthEquipBonus, wealthConsumableTier, wealthDeathRolls, initialiseWealthTrackers,
		planWealthDrops } = require('./items/wealthDrops.js');
	// `RingOfWealth.tryForBonusDrop` (tag `v3.3.8`): the capped equip-bonus loop, the consumable
	// tier thresholds and the per-kill roll counts.
	assert.equal(wealthEquipBonus([]), 0);
	assert.equal(wealthEquipBonus([3]), 3, 'one ring contributes its own level');
	assert.equal(wealthEquipBonus([3, 5]), 7, 'a higher second ring adds 5 + min(3, 2)');
	assert.equal(wealthEquipBonus([5, 3]), 7, 'a lower one adds min(3, 2)');
	assert.equal(wealthEquipBonus([3, 3, 3]), 7, 'the cap keeps a third ring from compounding');
	// `genConsumableDrop`: "60% chance - 4% per level" low, "30% + 2% per level" mid.
	assert.equal(wealthConsumableTier(0, 0.5), 1);
	assert.equal(wealthConsumableTier(0, 0.7), 2);
	assert.equal(wealthConsumableTier(0, 0.95), 3);
	assert.equal(wealthConsumableTier(15, 0.5), 2, 'the low tier is gone by +15');
	assert.equal(wealthConsumableTier(15, 0.7), 3, 'and the high tier has grown to 40%');
	assert.equal(wealthDeathRolls(true, false), 15);
	assert.equal(wealthDeathRolls(false, true), 5);
	assert.equal(wealthDeathRolls(false, false), 1);
	// A scripted RNG, so the counter arithmetic and the plan sequence are pinned exactly.
	const scripted = (values) => {
		const queue = [...values];
		const rng = {
			int: () => queue.shift(),
			float: () => queue.shift(),
			normalIntRange: () => queue.shift(),
		};
		return rng;
	};
	const fresh = initialiseWealthTrackers(scripted([7, 6]));
	assert.deepEqual(fresh, { triesToDrop: 7, dropsToEquip: 6 });
	// One call with `tries = 8` on a {7, 6} counter: the counter goes to -1, so one consumable pays
	// out (`dropsToEquip` 6 -> 5) and the counter refills by the drawn 4, landing at 3.
	// `Random.Float()` 0.5 takes the low tier, whose `Int(4)` of 2 is a potion, and `bonus - 1` = 0.
	const one = planWealthDrops({ triesToDrop: 7, dropsToEquip: 6 }, 8, 1, 1, scripted([0.5, 2, 4]));
	assert.deepEqual(one.plans, [{ kind: 'potion' }]);
	assert.deepEqual(one.trackers, { triesToDrop: 3, dropsToEquip: 5 });
	// Two payouts from one boss-sized call: the consumable first (`dropsToEquip` still had one left),
	// then an equipment drop, then the refill lifts the counter out of the loop. The scripted draws
	// follow Java's own order - `Float()` for the tier, `Int(4)`/`Int(6)`/`Int(4)` down the
	// high/mid/low chain, then the loop's two `NormalIntRange` draws and the equipment `Int(5)`.
	const boss = planWealthDrops({ triesToDrop: 1, dropsToEquip: 1 }, 15, 3, 3, scripted([0.95, 0, 0, 2, 4, 3, 8, 12]));
	// Java nests the doublings (high's `quantity *2` around mid's `quantity *2`), which is four
	// potions in one stack - the nesting is the mechanic, so the plan keeps it.
	assert.deepEqual(boss.plans, [
		{ kind: 'doubled', inner: { kind: 'doubled', inner: { kind: 'potion' } } },
		{ kind: 'equip', slot: 'ring', level: 2 },
	], 'a doubly-doubled potion, then the equip payout at equipBonus - 1');
	assert.deepEqual(boss.trackers, { triesToDrop: 2, dropsToEquip: 8 }, 'the equip counter refilled by the drawn 8');
	// The mid tier's Bomb case becomes a DoubleBomb when the high tier doubles it, exactly as
	// Java's `if (i instanceof Bomb) return new Bomb.DoubleBomb();` does.
	const doubleBomb = planWealthDrops({ triesToDrop: 0, dropsToEquip: 5 }, 1, 1, 1, scripted([0.95, 0, 4, 7]));
	assert.deepEqual(doubleBomb.plans, [{ kind: 'doubleBomb' }]);
	assert.deepEqual(doubleBomb.trackers, { triesToDrop: 6, dropsToEquip: 4 });
	const { artifactRechargeEffect, bankArtifactCharge, chaliceRechargeHeal, roseRechargeGhostHeal } = require('./items/artifactRecharge.js');
	// `ArtifactRecharge.chargeArtifacts()` (tag `v3.3.8`): every artifact's own `charge()` override,
	// with its rate and its guard set. Java's base `Artifact.charge()` is a no-op, so anything not
	// in the table must be too.
	assert.deepEqual(artifactRechargeEffect('talisman'), { kind: 'charge', rate: 2, capZeroesPartial: true, fullLineKey: 'items.artifacts.talismanofforesight.full_charge', guards: 'cursedAndImmune' });
	assert.deepEqual(artifactRechargeEffect('sandals'), { kind: 'charge', rate: 2, capZeroesPartial: true, guards: 'cursedAndImmune' });
	assert.deepEqual(artifactRechargeEffect('toolkit'), { kind: 'charge', rate: 0.25, capZeroesPartial: false, guards: 'immuneOnly' });
	assert.deepEqual(artifactRechargeEffect('cape'), { kind: 'addCharge', rate: 4, procAtCap: true, guards: 'none' });
	assert.deepEqual(artifactRechargeEffect('chains'), { kind: 'charge', rate: 0.5, capZeroesPartial: false, guards: 'cursedAndImmune' });
	assert.equal(artifactRechargeEffect('hourglass').kind, 'none', 'the Hourglass never overrides charge()');
	assert.equal(artifactRechargeEffect('not-an-artifact').kind, 'none');
	// The bank: whole units onto the integer charge, and the cap's two behaviours (Beacon/Chains/
	// Toolkit keep the fraction they had banked; everything else zeroes it).
	const banking = { charge: 0, partialCharge: 0 };
	assert.equal(bankArtifactCharge(banking, 100, 2, 4, true), false);
	assert.deepEqual(banking, { charge: 8, partialCharge: 0 });
	const capped = { charge: 9, partialCharge: 0 };
	assert.equal(bankArtifactCharge(capped, 10, 2, 4, true), true, 'rate 2 x 4 overflows a cap of 10');
	assert.deepEqual(capped, { charge: 10, partialCharge: 0 });
	const keepsFraction = { charge: 9, partialCharge: 0.5 };
	assert.equal(bankArtifactCharge(keepsFraction, 10, 0.25, 4, false), true);
	assert.deepEqual(keepsFraction, { charge: 10, partialCharge: 0.5 });
	// `ChaliceOfBlood.charge()`: `healDelay = (10 - (1.33 + level*0.667))/amount`, `heal = 5/healDelay`,
	// with Java's `Random.Float() < heal % 1` rounding the fraction up.
	assert.equal(chaliceRechargeHeal(10, 1, 0.9), 2, 'a +10 chalice heals a flat 2 a turn');
	assert.equal(chaliceRechargeHeal(10, 1, 0.1), 3, 'and 3 when the fractional roll lands');
	assert.equal(chaliceRechargeHeal(0, 1, 0.9), 0, 'a +0 chalice usually heals nothing');
	// `DriedRose.charge()`'s ghost half.
	assert.equal(roseRechargeGhostHeal(0, 1), 1);
	assert.equal(roseRechargeGhostHeal(3, 1), 2, '(1 + level/3) * amount');
	assert.equal(roseRechargeGhostHeal(9, 4), 16);
	const { weaponSTRReq, armorSTRReq, missileSTRReq, canSurpriseAttack } = require('./items/strReq.js');
	// `Weapon.STRReq`/`Armor.STRReq`/`MissileWeapon.STRReq` (tags `v2.1.4`/`v3.3.8`):
	// `(8 + tier*2) - (int)(sqrt(8*lvl+1)-1)/2`, decreasing at +1/+3/+6/+10.
	assert.equal(weaponSTRReq(1, 0), 10);
	assert.equal(weaponSTRReq(1, 1), 9);
	assert.equal(weaponSTRReq(1, 2), 9);
	assert.equal(weaponSTRReq(1, 3), 8);
	assert.equal(weaponSTRReq(1, 6), 7);
	// `Hero.canSurpriseAttack()` (tag `v3.3.8`): thrown and unarmed always qualify,
	// a swung weapon needs the STR and a non-flail class.
	assert.equal(canSurpriseAttack({ thrown: true, unarmed: false, flail: true, heroStr: 1, weaponTier: 5, weaponLevel: 0 }), true, 'a thrown dart reads the missile, never the melee flail');
	assert.equal(canSurpriseAttack({ thrown: false, unarmed: true, flail: false, heroStr: 1, weaponTier: 1, weaponLevel: 0 }), true);
	assert.equal(canSurpriseAttack({ thrown: false, unarmed: false, flail: false, heroStr: 10, weaponTier: 1, weaponLevel: 0 }), true, '10 STR meets a tier-1 req of exactly 10');
	assert.equal(canSurpriseAttack({ thrown: false, unarmed: false, flail: false, heroStr: 9, weaponTier: 1, weaponLevel: 0 }), false, '9 STR misses it');
	assert.equal(canSurpriseAttack({ thrown: false, unarmed: false, flail: true, heroStr: 30, weaponTier: 1, weaponLevel: 0 }), false, 'a flail never surprises');
	assert.equal(canSurpriseAttack({ thrown: false, unarmed: false, flail: false, heroStr: 17, weaponTier: 5, weaponLevel: 0 }), false, '17 STR misses a tier-5 req of 18');
	assert.equal(canSurpriseAttack({ thrown: false, unarmed: false, flail: false, heroStr: 18, weaponTier: 5, weaponLevel: 0 }), true);
	assert.equal(weaponSTRReq(1, 10), 6);
	assert.equal(weaponSTRReq(5, 0), 18);
	assert.equal(weaponSTRReq(5, 12), 14);
	assert.equal(weaponSTRReq(1, -3), 10, 'negative levels clamp to 0');
	assert.equal(armorSTRReq(1, 0), 10);
	assert.equal(armorSTRReq(2, 6), 9);
	assert.equal(missileSTRReq(1, 0), 9, 'missiles need 1 less STR than their tier');
	assert.equal(missileSTRReq(3, 6), 10);
	// The stats line names Java's real info keys; the wording itself is the catalogue's
	// job (`npm run i18n:verify`), so this pins the key set the stats line uses, not
	// the sentences.
	//Missile stats use the real v3.3.8 split key (`stats_known`, alongside `stats_unknown`),
	//not the old unified `stats` - `MissileWeapon.info()` names both explicitly.
	for (const key of ['items.weapon.melee.meleeweapon.stats_known', 'items.armor.armor.curr_absorb', 'items.weapon.missiles.missileweapon.stats_known', 'items.weapon.weapon.too_heavy', 'items.weapon.weapon.excess_str', 'items.armor.armor.too_heavy']) {
		assert.ok(readFileSync(join(root, 'src/items/displayName.ts'), 'utf8').includes(`'${key}'`), `stats line uses ${key}`);
		assert.ok(readFileSync(join(root, 'src/generated/spdMessages.ts'), 'utf8').includes(`"${key}"`), `${key} exists in the catalogue`);
	}
	console.log('PASS item-instance separation, enhancement transfer, upgrade policy, appearance restore, missile dust pickup, the Unstable delegate list, rings.mwl-derived ring formulas, items.mwl-derived weapon/armor tiers, Generator.java deck parity, monster/hero/buff Java parity, per-monster status immunities, the Sandals of Nature seed/charge economy, the Talisman of Foresight scry formulas, the Dried Rose ghost/petal economy, the Ring of Wealth bonus-drop counters, the generated shop shelf, and the ArtifactRecharge table, and weapon/armor/missile STR requirements, and ceremonial-candle aimed placement');
} finally {
	rmSync(out, { recursive: true, force: true });
}
