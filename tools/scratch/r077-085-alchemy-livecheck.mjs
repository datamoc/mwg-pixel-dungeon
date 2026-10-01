// node tools/browserTest.mjs --script tools/scratch/r077-085-alchemy-livecheck.mjs
// R077-R085 alchemy browser verification (2026-10-01): the eight alchemy roadmap bullets whose
// code and node coverage landed 2026-09-29 but which still lacked a live in-game pass. Each
// check group names the bullet it closes:
//
//  R077 identified-ingredient gate (Recipe.SimpleRecipe.testIngredients, Recipe.java:99-104):
//      the recipe list hides a simple recipe whose input is unidentified, the craft is refused
//      *after* the list was built (craft gate), and that refusal consumes nothing - no
//      ingredient, no energy, no window left open.
//  R078 SeedToPotion weighting (Generator.randomUsingDefaults(POTION), Generator.java:329-342):
//      36 brews of three DISTINCT seeds picked through the real chain - the weighted default
//      deck can never return Strength (weight 0), must produce Healing sometimes (3/15), must
//      produce deck-only potions (the distinct branch delivers only its three seeds' potions),
//      and cookingHpCount ends exactly equal to the number of accepted Healing deliveries
//      (the reroll counter counts accepted results, never re-rolls).
//  R079 MeatPie classes (MeatPie.java:54-78): the three chained category pickers admit only
//      their own class (the small ration is refused as the Food category), and the craft
//      consumes exactly one item from each category for six energy.
//  R080 scrap energy table (Item.energyVal() + overrides): the Alchemize energize picker
//      banks the Java values - elixir 12, MagicalInfusion 12, known scrollUpgrade 10,
//      known elixirHoneyedHealing 8, Augmentation stone 5, GooBlob/MetalShard/Rotberry 3,
//      stone base 3 - and never offers a Food item (energy 0).
//  R081 spell recipes: PhaseShift crafts six spells for 10 energy from an identified
//      Teleportation scroll, ScrollToExotic turns that scroll into the scrollPassage token
//      for 6, and BeaconOfReturning consumes the token for 12 and yields five.
//  R083 FeatherFall identity (ElixirOfFeatherFall.java:82): the recipe keyed featherFall
//      brews from an identified Levitation potion for 10 energy, and using the elixir grants
//      FeatherBuff for 50 turns and consumes it.
//  R084 ScrollToStone identification (Scroll.java:336-342): brewing one unidentified
//      Identify scroll into two stones of intuition identifies the whole remaining stack
//      first, spends no energy.
//  R085 alchemyRecipeManifest: the live bundle booted (the manifest's import-time validation
//      of Java's one/two/three registration groups threw nothing), and the opened recipe
//      list surfaced only the 35 registered alchemyRecipes ids (plus this port's own
//      toolkit-energize row) - no duplicate or unknown recipe can reach the window.
//
// The flow is driven through the real scene entry points a player reaches - AlchemistsToolkit
// AC_BREW (scene.useToolkit -> openAlchemyRecipes), the picker window's own chooseItemPicker
// callback (the same one R068's window buttons fire), itemActions useItemById for the elixir
// and scene.useAlchemize for the scrap flow - with bag/energy seeding as explicit test setup.
// Locale: fr (browserTest default).
const settle = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** The 35 registered alchemyRecipes ids (src/content/alchemy.mwl) - R085's registry set. */
const RECIPE_IDS = [
	'stewedMeat1', 'stewedMeat2', 'stewedMeat3', 'meatPie', 'potionSeed', 'blandfruit',
	'scrollToStone', 'scrollToExotic', 'potionToExotic', 'alchemize',
	'enhanceBombFrost', 'enhanceBombWoolly', 'enhanceBombFire', 'enhanceBombNoisemaker',
	'enhanceBombFlashbang', 'enhanceBombSmoke', 'enhanceBombRegrowth', 'enhanceBombHoly',
	'enhanceBombArcane', 'enhanceBombShrapnel',
	'infernalBrew', 'blizzardBrew', 'shockingBrew', 'causticBrew',
	'featherFall', 'magicalInfusion', 'phaseShift', 'recycle', 'telekineticGrab',
	'summonElemental', 'curseInfusion', 'reclaimTrap', 'wildEnergy', 'unstableSpell',
	'beaconOfReturning',
];

/** `alchemyRules.ts` POTION_DEFAULT_CLASSES - the weighted deck's12 possible potions. */
const DECK_POTIONS = [
	'potionStrength', 'potionHealing', 'potionMindVision', 'potionFrost', 'potionFlame',
	'potionToxicGas', 'potionHaste', 'potionInvis', 'potionLevitation', 'potionParalyticGas',
	'potionPurity', 'potionExperience',
];

/** The three brewing seeds: their potions (Healing/Invis/Flame) plus every deck-only answer. */
const SEED_POTIONS = ['potionHealing', 'potionInvis', 'potionFlame'];
const DECK_ONLY = DECK_POTIONS.filter((id) => SEED_POTIONS.indexOf(id) < 0);

/** `alchemy.ts` SCROLL_TO_STONE keys - the only scrolls the stone picker may offer. */
const MAPPABLE_SCROLLS = [
	'scrollIdentify', 'scrollLullaby', 'scrollMapping', 'scrollMirror', 'scrollRetribution',
	'scrollRage', 'scrollRecharging', 'scrollCleanse', 'scrollTeleportation', 'scrollTerror',
	'scrollTransmutation', 'scrollUpgrade',
];

export default async function (game) {
	const results = [];
	let failures = 0;
	const check = (name, ok, detail) => {
		results.push({ name, ok: !!ok });
		if (!ok) failures++;
		console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : ' :: ' + JSON.stringify(detail)));
	};

	// ---- boot: title -> class select -> warrior -> dungeon -----------------
	await game.waitFor('!!window.__MWG__ && !!window.__MWG__.app', { timeout: 90000 });
	await game.tapText('entrer dans le donjon|enter the dungeon|enter dungeon', { timeout: 90000 });
	for (let i = 0; ; i++) {
		if (await game.findText('choisissez votre h|choose your hero')) break;
		if (i > 300) throw new Error('class select never appeared');
		await settle(300);
	}
	await settle(800);
	// Portrait texture frames come out in classes.mwl order (warrior, mage, rogue, huntress,
	// duelist, cleric) -> index 0 is the warrior; no unlock badge needed.
	const portrait = await game.eval(`(() => {
		const mwg = window.__MWG__, stage = mwg.app.stage, screen = mwg.app.renderer.screen;
		const hits = [];
		const walk = (n) => {
			const f = n.texture && n.texture.frame;
			if (n.visible !== false && f && f.x === 0 && f.y === 90 && f.width === 12 && f.height === 15) {
				const b = n.getBounds();
				if (b.width > 0 && b.height > 0) hits.push({ fx: (b.x + b.width / 2) / screen.width, fy: (b.y + b.height / 2) / screen.height });
			}
			for (const c of (n.children || [])) walk(c);
		};
		walk(stage);
		return { count: hits.length, hits };
	})()`);
	if (portrait.count !== 6 || !portrait.hits[0]) throw new Error('portrait walk failed: ' + JSON.stringify(portrait));
	await game.tap(portrait.hits[0].fx, portrait.hits[0].fy);
	await settle(800);
	const sel = await game.eval(`(() => ({ selected: window.__MWG__.currentScene['selected'] }))()`);
	check('boot: warrior portrait selects', sel.selected === 'warrior', sel);
	await game.tapText('^commencer$|^start$', { timeout: 90000 });
	await game.waitFor('!!(window.__MWG__.currentScene && window.__MWG__.currentScene["hero"] && window.__MWG__.currentScene["creatures"])', { timeout: 90000 });
	await settle(1500);

	// ---- test setup: stock the bag, give the pool energy --------------------
	// Every seed below is explicit test setup (like R069's forced charge): the checks then
	// observe only the real alchemy code's own transactions.
	const setup = await game.eval(`(() => {
		const s = window.__MWG__.currentScene;
		// Start from a known bag: the warrior's own starting food/scrolls would otherwise
		// shift quantities and candidate lists.
		const wipe = ['food', 'smallRation', 'ration', 'pasty', 'meat', 'phantomMeat', 'berry',
			'supplyRation', 'chunks', 'stewedMeat', 'chargrilledMeat', 'frozenCarpaccio',
			'toolkit', 'potionLevitation', 'scrollTeleportation', 'scrollIdentify', 'stoneOfBlast',
			'seedSungrass', 'seedBlindweed', 'seedFirebloom'];
		for (const id of wipe) s.bag.remove(id, 999);
		const add = (o) => s.bag.add(Object.assign({ stackable: true }, o));
		s.alchemyEnergy = 40;
		s.cookingHpCount = 0;
		add({ id: 'toolkit', quantity: 1, stackable: false, level: 0, charge: 0, partialCharge: 0, warmUpDelay: 0, cursed: false });
		add({ id: 'potionLevitation', quantity: 1, identified: false });
		add({ id: 'scrollTeleportation', quantity: 1, identified: false });
		add({ id: 'scrollIdentify', quantity: 3, identified: false });
		add({ id: 'pasty', quantity: 1 });
		add({ id: 'food', quantity: 1 });
		add({ id: 'meat', quantity: 1 });
		add({ id: 'smallRation', quantity: 1 });
		add({ id: 'stoneOfBlast', quantity: 1 });
		add({ id: 'seedSungrass', quantity: 40 });
		add({ id: 'seedBlindweed', quantity: 40 });
		add({ id: 'seedFirebloom', quantity: 40 });
		return { energy: s.alchemyEnergy, hp: s.cookingHpCount, items: s.bag.items.map((i) => i.id + 'x' + i.quantity) };
	})()`);
	console.log('alchemy setup:', JSON.stringify(setup));
	check('setup: bag stocked, pool at 40, cookingHpCount 0', setup.energy === 40 && setup.hp === 0, setup);

	// ---- page-side helpers ---------------------------------------------------
	await game.eval(`(() => {
		const s = window.__MWG__.currentScene;
		const A = { s: s, RECIPE_IDS: ${JSON.stringify(RECIPE_IDS)} };
		window.__ALCH__ = A;
		A.qty = (id) => { const it = s.bag.items.find((i) => i.id === id); return it && it.quantity > 0 ? it.quantity : 0; };
		A.item = (id) => s.bag.items.find((i) => i.id === id && i.quantity > 0);
		A.entries = () => s['itemPickerEntries'] || [];
		A.entryIds = () => A.entries().map((e) => e.id);
		A.recipeIds = () => A.entries().map((e) => e.instanceId);
		A.open = () => { s['useToolkit'](); return { open: s['itemPickerOpen'] === true, title: s['itemPickerTitle'] }; };
		A.chooseRecipe = (id) => { const i = A.entries().findIndex((e) => e.instanceId === id); if (i < 0) return false; s['chooseItemPicker'](i); return true; };
		A.chooseId = (id) => { const i = A.entries().findIndex((e) => e.id === id); if (i < 0) return false; s['chooseItemPicker'](i); return true; };
		A.energy = () => s.alchemyEnergy;
		A.close = () => s['clearItemPicker']();
		A.potionTotals = () => {
			const m = {};
			for (const it of s.bag.items) if (it.id.indexOf('potion') === 0 && it.quantity > 0) m[it.id] = (m[it.id] || 0) + it.quantity;
			return m;
		};
		return true;
	})()`);

	// ---- A: open the real recipe window (AC_BREW), browse gate, registry ----
	const a = await game.eval(`(() => {
		const A = window.__ALCH__;
		const opened = A.open();
		const ids = A.recipeIds();
		const expect = ['potionSeed', 'meatPie', 'stewedMeat1', 'scrollToStone', 'alchemize'];
		const gated = ['featherFall', 'phaseShift', 'beaconOfReturning'];
		const out = {
			open: opened.open, title: opened.title, count: ids.length,
			listed: expect.filter((id) => ids.indexOf(id) >= 0),
			gated: gated.filter((id) => ids.indexOf(id) >= 0),
			unknown: ids.filter((id) => id !== 'toolkit-energize' && A.RECIPE_IDS.indexOf(id) < 0),
		};
		// No state-clear here: clearItemPicker is only the WindowStack-side cleanup and
		// never closes the window itself (production closes via the modal's own close first).
		// Phase B1's openItemPicker closes this window properly, the way a second recipe
		// open does in-game.
		return out;
	})()`);
	check('A: toolkit AC_BREW opens the recipe window with the energy pool in the title', a.open && typeof a.title === 'string' && a.title.endsWith('[40]'), a);
	check('A R077 browse gate: unidentified Levitation/Teleportation inputs hide featherFall+phaseShift, no Passage token hides beaconOfReturning', a.gated.length === 0, a);
	check('A R085: craftable subset listed (potionSeed, meatPie, stewedMeat1, scrollToStone, alchemize)', a.listed.length === 5, a);
	check('A R085: every listed row is a registered alchemyRecipes id', a.unknown.length === 0, a);

	// ---- B: identify -> gate opens (screenshot) -> craft gate -> craft -------
	const b1 = await game.eval(`(() => {
		const A = window.__ALCH__, s = A.s;
		const lev = s.bag.items.find((i) => i.id === 'potionLevitation');
		if (lev) lev.identified = true;
		s.bag.remove('scrollTeleportation', 999);
		s.bag.add({ id: 'scrollTeleportation', quantity: 2, stackable: true, identified: true });
		const opened = A.open();
		const ids = A.recipeIds();
		return { open: opened.open, title: opened.title, feather: ids.indexOf('featherFall') >= 0, phase: ids.indexOf('phaseShift') >= 0 };
	})()`);
	check('B R077: identifying both inputs re-opens the gate (featherFall + phaseShift listed)', b1.open && b1.feather && b1.phase, b1);
	await settle(500);
	await game.screenshot('tools/scratch/r077-085-recipes.png');

	const b2 = await game.eval(`(() => {
		const A = window.__ALCH__, s = A.s;
		const lev = s.bag.items.find((i) => i.id === 'potionLevitation');
		lev.identified = false;   // after the list was built with it identified
		const picked = A.chooseRecipe('featherFall');
		return { picked, feather: A.qty('featherFall'), lev: A.qty('potionLevitation'), energy: A.energy(), open: s['itemPickerOpen'] === true };
	})()`);
	check('B R077 craft gate + no consumption: the re-unidentified potion refuses the craft, keeps ingredient and energy', b2.picked && b2.feather === 0 && b2.lev === 1 && b2.energy === 40 && !b2.open, b2);

	const b3 = await game.eval(`(() => {
		const A = window.__ALCH__, s = A.s;
		const lev = s.bag.items.find((i) => i.id === 'potionLevitation');
		lev.identified = true;
		A.open();
		const picked = A.chooseRecipe('featherFall');
		return { picked, feather: A.qty('featherFall'), lev: A.qty('potionLevitation'), energy: A.energy(), open: s['itemPickerOpen'] === true };
	})()`);
	check('B R083: identified Levitation brews featherFall - one elixir, potion consumed, 40 -> 30 energy', b3.picked && b3.feather === 1 && b3.lev === 0 && b3.energy === 30, b3);

	// ---- C: use the elixir ---------------------------------------------------
	const c = await game.eval(`(() => {
		const A = window.__ALCH__;
		A.s['useItemById']('featherFall');
		return { buff: A.s.hero.buffs['featherFall'], feather: A.qty('featherFall') };
	})()`);
	// The flow's own `spendTurn()` ticks the fresh buff once inside the same call, so the
	// observed duration is 50 applied, 49 read back - either is the grant.
	check('C R083: using the elixir grants FeatherBuff (50, one turn ticked) and consumes it', (c.buff === 49 || c.buff === 50) && c.feather === 0, c);
	await settle(400);
	await game.screenshot('tools/scratch/r077-085-feather.png');
	await settle(2200);

	// ---- D: spell recipes ----------------------------------------------------
	const d1 = await game.eval(`(() => {
		const A = window.__ALCH__;
		A.s.alchemyEnergy = 40;
		A.open();
		const picked = A.chooseRecipe('phaseShift');
		return { picked, phase: A.qty('phaseShift'), scroll: A.qty('scrollTeleportation'), energy: A.energy(), open: A.s['itemPickerOpen'] === true };
	})()`);
	check('D R081: phaseShift crafts 6 spells from the identified scroll for 10 energy (40 -> 30)', d1.picked && d1.phase === 6 && d1.scroll === 1 && d1.energy === 30 && !d1.open, d1);

	const d2 = await game.eval(`(() => {
		const A = window.__ALCH__;
		A.open();
		const picked = A.chooseRecipe('scrollToExotic');
		const units = A.entryIds();
		const pickedUnit = A.chooseId('scrollTeleportation');
		return { picked, units, pickedUnit, passage: A.qty('scrollPassage'), scroll: A.qty('scrollTeleportation'), energy: A.energy(), open: A.s['itemPickerOpen'] === true };
	})()`);
	check('D R081: scrollToExotic offers only exotic-mapped scrolls and yields the identified scrollPassage token for 6 energy (30 -> 24)', d2.picked && d2.pickedUnit && d2.units.length === 1 && d2.units[0] === 'scrollTeleportation' && d2.passage === 1 && d2.scroll === 0 && d2.energy === 24 && !d2.open, d2);

	const d3 = await game.eval(`(() => {
		const A = window.__ALCH__;
		A.open();
		const picked = A.chooseRecipe('beaconOfReturning');
		return { picked, beacon: A.qty('beaconOfReturning'), passage: A.qty('scrollPassage'), energy: A.energy(), open: A.s['itemPickerOpen'] === true };
	})()`);
	check('D R081: beaconOfReturning consumes the Passage token for 5 spells, 12 energy (24 -> 12)', d3.picked && d3.beacon === 5 && d3.passage === 0 && d3.energy === 12 && !d3.open, d3);

	// ---- E: ScrollToStone ----------------------------------------------------
	const e = await game.eval(`(() => {
		const A = window.__ALCH__;
		A.s.alchemyEnergy = 40;
		A.open();
		const picked = A.chooseRecipe('scrollToStone');
		const units = A.entryIds();
		const pickedUnit = A.chooseId('scrollIdentify');
		const scroll = A.s.bag.items.find((i) => i.id === 'scrollIdentify');
		return { picked, units, pickedUnit, stones: A.qty('stoneOfIntuition'), qty: A.qty('scrollIdentify'), identified: scroll ? scroll.identified : null, energy: A.energy(), open: A.s['itemPickerOpen'] === true };
	})()`);
	// The warrior starts with a Scroll of Rage, which is also stone-mappable - the picker
	// correctly offers both stacks, and none of the many unmappable stacks in the bag.
	check('E R084: the scroll picker offers only stone-mappable scrolls (scrollIdentify + the starting scrollRage)', e.picked && e.units.indexOf('scrollIdentify') >= 0 && e.units.every((id) => MAPPABLE_SCROLLS.indexOf(id) >= 0), e);
	check('E R084: 3 unidentified Identify scrolls -> the surviving stack of 2 is identified, 2 stones of intuition, no energy', e.pickedUnit && e.stones === 2 && e.qty === 2 && e.identified === true && e.energy === 40 && !e.open, e);

	// ---- F: MeatPie category pickers ----------------------------------------
	const f1 = await game.eval(`(() => {
		const A = window.__ALCH__;
		A.s.alchemyEnergy = 40;
		A.open();
		const listed = A.chooseRecipe('meatPie');
		const pastyEntries = A.entryIds();
		const p1 = A.chooseId('pasty');
		const foodEntries = A.entryIds();
		const p2 = A.chooseId('food');
		const meatEntries = A.entryIds();
		return { listed, pastyEntries, p1, foodEntries, p2, meatEntries };
	})()`);
	check('F R079: the pasty picker admits only Pasty/PhantomMeat', f1.listed && f1.p1 && f1.pastyEntries.length === 1 && f1.pastyEntries[0] === 'pasty', f1);
	check('F R079: the Food picker refuses the small ration (exact Food class only)', f1.p2 && f1.foodEntries.length === 1 && f1.foodEntries[0] === 'food', f1);
	check('F R079: the meat picker admits the meat category', f1.p2 && f1.meatEntries.length >= 1 && f1.meatEntries.indexOf('meat') >= 0, f1);

	const f2 = await game.eval(`(() => {
		const A = window.__ALCH__;
		const picked = A.chooseId('meat');
		return { picked, pie: A.qty('meatPie'), pasty: A.qty('pasty'), food: A.qty('food'), meat: A.qty('meat'), ration: A.qty('smallRation'), energy: A.energy(), open: A.s['itemPickerOpen'] === true };
	})()`);
	check('F R079: one item from each category consumed atomically - meatPie baked, ration untouched, 6 energy (40 -> 34)', f2.picked && f2.pie === 1 && f2.pasty === 0 && f2.food === 0 && f2.meat === 0 && f2.ration === 1 && f2.energy === 34 && !f2.open, f2);

	// ---- G: SeedToPotion weighted deck over 36 brews -------------------------
	const g1 = await game.eval(`(() => {
		const A = window.__ALCH__;
		A.s.alchemyEnergy = 40;
		A.s.cookingHpCount = 0;
		A.open();
		const picked = A.chooseRecipe('potionSeed');
		return { picked, entries: A.entryIds(), open: A.s['itemPickerOpen'] === true, hp: A.s.cookingHpCount };
	})()`);
	check('G R078: the seed picker lists the three carried seed stacks', g1.picked && g1.open && g1.entries.length === 3
		&& g1.entries.indexOf('seedSungrass') >= 0 && g1.entries.indexOf('seedBlindweed') >= 0 && g1.entries.indexOf('seedFirebloom') >= 0, g1);
	await settle(500);
	await game.screenshot('tools/scratch/r077-085-seeds.png');

	const brewTail = `(() => {
		const A = window.__ALCH__;
		const p1 = A.chooseId('seedSungrass');
		const p2 = A.chooseId('seedBlindweed');
		const before = A.potionTotals();
		const p3 = A.chooseId('seedFirebloom');
		const after = A.potionTotals();
		const delivered = [];
		for (const id of Object.keys(after)) if (after[id] !== (before[id] || 0)) delivered.push(id);
		return { p1: p1, p2: p2, p3: p3, delivered: delivered.length === 1 ? delivered[0] : null, deliveredCount: delivered.length, open: A.s['itemPickerOpen'] === true, hp: A.s.cookingHpCount };
	})()`;
	const brewOnce = `(() => {
		const A = window.__ALCH__;
		const o = A.open();
		const listed = A.chooseRecipe('potionSeed');
		const p1 = A.chooseId('seedSungrass');
		const p2 = A.chooseId('seedBlindweed');
		const before = A.potionTotals();
		const p3 = A.chooseId('seedFirebloom');
		const after = A.potionTotals();
		const delivered = [];
		for (const id of Object.keys(after)) if (after[id] !== (before[id] || 0)) delivered.push(id);
		return { open: o.open, listed: listed, p1: p1, p2: p2, p3: p3, delivered: delivered.length === 1 ? delivered[0] : null, deliveredCount: delivered.length, openEnd: A.s['itemPickerOpen'] === true, hp: A.s.cookingHpCount };
	})()`;

	const brews = [];
	const tail = await game.eval(brewTail);
	brews.push(tail);
	let chainOk = tail.p1 && tail.p2 && tail.p3 && tail.delivered !== null && !tail.open;
	for (let i = 1; i < 36; i++) {
		const b = await game.eval(brewOnce);
		brews.push(b);
		if (!b.open || !b.listed || !b.p1 || !b.p2 || !b.p3 || b.delivered === null || b.openEnd || b.deliveredCount !== 1) {
			chainOk = false;
			console.log('brew chain broke at iteration ' + (i + 1) + ': ' + JSON.stringify(b));
			break;
		}
	}
	check('G R078: 36 full seed-brew chains complete through the real pickers', chainOk && brews.length === 36, { n: brews.length, chainOk });
	const delivered = brews.map((b) => b.delivered);
	const strengths = delivered.filter((id) => id === 'potionStrength').length;
	const healings = delivered.filter((id) => id === 'potionHealing').length;
	const deckOnly = delivered.filter((id) => id && DECK_ONLY.indexOf(id) >= 0).length;
	const invalid = delivered.filter((id) => !id || DECK_POTIONS.indexOf(id) < 0).length;
	const finalHp = await game.eval(`(() => window.__ALCH__.s.cookingHpCount)()`);
	console.log('G deliveries:', JSON.stringify({ strengths, healings, deckOnly, invalid, finalHp }));
	check('G R078: Strength never appears (weighted 0 in the default deck)', strengths === 0, { strengths });
	check('G R078: Healing appears (weight 3/15 accepted at least once)', healings >= 1, { healings });
	check('G R078: deck-only potions appear (the distinct-3 branch really rolled the deck)', deckOnly >= 1, { deckOnly });
	check('G R078: every delivery is one of the 12 deck potions', invalid === 0, { invalid, delivered });
	check('G R078: cookingHpCount equals the number of accepted Healing deliveries', finalHp === healings, { finalHp, healings });
	await settle(400);
	await game.screenshot('tools/scratch/r077-085-cooked.png');

	// ---- H: scrap energy table through the Alchemize energize picker ---------
	const hSetup = await game.eval(`(() => {
		const A = window.__ALCH__, s = A.s;
		const add = (o) => s.bag.add(Object.assign({ stackable: true, identified: true }, o));
		s.bag.remove('food', 999);
		add({ id: 'food', quantity: 1 });
		add({ id: 'alchemize', quantity: 10 });
		add({ id: 'elixirMight', quantity: 1 });
		add({ id: 'magicalInfusion', quantity: 1 });
		add({ id: 'scrollUpgrade', quantity: 1 });
		add({ id: 'elixirHoneyedHealing', quantity: 1 });
		add({ id: 'stoneOfAugmentation', quantity: 1 });
		add({ id: 'gooBlob', quantity: 1 });
		add({ id: 'metalShard', quantity: 1 });
		add({ id: 'seedRotberry', quantity: 1 });
		s.alchemyEnergy = 40;
		return { spells: A.qty('alchemize'), stone: A.qty('stoneOfBlast'), energy: s.alchemyEnergy };
	})()`);
	check('H setup: Alchemize spells and scrap targets stocked', hSetup.spells === 10 && hSetup.stone >= 1 && hSetup.energy === 40, hSetup);

	const SCRAP_TARGETS = [
		['elixirMight', 12], ['magicalInfusion', 12], ['scrollUpgrade', 10],
		['elixirHoneyedHealing', 8], ['stoneOfAugmentation', 5], ['gooBlob', 3],
		['metalShard', 3], ['seedRotberry', 3], ['stoneOfBlast', 3],
	];
	let foodNeverOffered = true;
	for (const [id, expected] of SCRAP_TARGETS) {
		const r = await game.eval(`(() => {
			const A = window.__ALCH__;
			const target = '${id}';
			const before = A.energy();
			A.s['useAlchemize']();
			const cands = A.entryIds();
			const listed = cands.indexOf(target) >= 0;
			const food = cands.indexOf('food') >= 0;
			const ration = cands.indexOf('smallRation') >= 0;
			const picked = A.chooseId(target);
			return { listed: listed, food: food, ration: ration, picked: picked, delta: A.energy() - before, left: A.qty(target), spells: A.qty('alchemize'), open: A.s['itemPickerOpen'] === true };
		})()`);
		if (r.food || r.ration) foodNeverOffered = false;
		check('H R080: ' + id + ' scraps for ' + expected + ' energy', r.listed && r.picked && r.delta === expected && r.left === 0 && !r.open, r);
		await settle(120);
	}
	check('H R080: Food and small ration are never offered as energize targets (energy 0)', foodNeverOffered, {});
	const hEnd = await game.eval(`(() => {
		const A = window.__ALCH__;
		return { spells: A.qty('alchemize'), food: A.qty('food'), ration: A.qty('smallRation'), energy: A.energy() };
	})()`);
	check('H R080: nine scraps spent nine spells and banked 59 energy (40 -> 99), Food left untouched', hEnd.spells === 1 && hEnd.food === 1 && hEnd.ration === 1 && hEnd.energy === 99, hEnd);

	// ---- console hygiene ------------------------------------------------------
	const errors = await game.consoleErrors();
	check('no console errors during the alchemy pass', errors.length === 0, errors.slice(0, 5));

	console.log('R077-R085 alchemy live check: ' + (results.length - failures) + '/' + results.length + ' passed');
	if (failures > 0) throw new Error(failures + ' alchemy live check(s) failed');
}
