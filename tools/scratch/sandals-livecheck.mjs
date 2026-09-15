// Throwaway (tools/scratch): `SandalsOfNature`, live - is the artifact a real, reachable one?
//
// Java's Sandals of Nature are a three-stage grass artifact: trampling high grass charges them
// (`Naturalism.charge()`, which also scales `HighGrass.trample`'s own seed/dew rolls), `AC_FEED`
// takes a carried seed and levels the footwear once enough have been banked, and `AC_ROOT` aims
// the attuned seed at a visible cell within 3 tiles to plant it and spend the charge. Before this
// pass the port's `useSandals` printed the item's own name and nothing else - its two optional
// scene hooks (`spawnAlly`/`revealNearbyTraps`) were never provided, so the artifact was inert.
//
// Run after `npm run build`:  node tools/scratch/sandals-livecheck.mjs
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const globalRoot = process.env.GLOBAL_NODE_MODULES ?? 'C:\\Users\\miche\\AppData\\Roaming\\npm\\node_modules';
const { chromium } = require(path.join(globalRoot, 'playwright'));

const executablePath = path.join(
	process.env.LOCALAPPDATA ?? 'C:\\Users\\miche\\AppData\\Local',
	'ms-playwright',
	'chromium-1193',
	'chrome-win',
	'chrome.exe'
);
const browser = await chromium.launch({
	executablePath,
	args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const page = await context.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`console.error: ${m.text()}`); });

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=sandals-live', { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(6000);

const tap = async (fx, fy) => {
	await page.evaluate(([x, y]) => {
		const c = document.querySelector('canvas');
		const r = c.getBoundingClientRect();
		const opts = { bubbles: true, cancelable: true, composed: true, clientX: r.x + r.width * x, clientY: r.y + r.height * y, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: 1 };
		c.dispatchEvent(new PointerEvent('pointermove', opts));
		c.dispatchEvent(new PointerEvent('pointerdown', opts));
		c.dispatchEvent(new PointerEvent('pointerup', { ...opts, buttons: 0 }));
		c.dispatchEvent(new MouseEvent('click', { ...opts, buttons: 0 }));
	}, [fx, fy]);
	await page.waitForTimeout(1200);
};
await tap(398 / 1024, 400 / 768);
await tap(62 / 1024, 261 / 768);
await tap(0.166, 0.921);
await page.waitForTimeout(5000);

const probe = await page.evaluate(async () => {
	const s = window.__MWG__.currentScene;
	const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
	const FRESH = 'sandals-live';
	const bag = s['bag'];
	const sandals = () => bag.find('sandals', FRESH);
	const label = (entry) => s['itemDisplayName'](entry.id, entry.identified ?? false, entry.instanceId);
	const rows = () => (s['itemPickerEntries'] ?? []).map((e) => ({ instanceId: e.instanceId, label: label(e) }));

	bag.add({ id: 'sandals', quantity: 1, identified: true, instanceId: FRESH });
	for (const [cls, kind] of [['Rotberry$Seed', 'rotberry'], ['Firebloom$Seed', 'firebloom'], ['Icecap$Seed', 'icecap']]) {
		bag.add({ id: 'seed', quantity: 1, identified: true, sourceClass: cls, instanceId: `seed:${kind}` });
	}
	const hero = s['hero'];
	const fresh = {
		inBag: sandals() !== undefined,
		name: s['itemDisplayName']('sandals', true, FRESH),
		charge: sandals().charge ?? 0,
		seedsInBag: bag.items.filter((i) => i.id === 'seed' && i.quantity > 0).length,
	};

	// --- charging: `Naturalism.charge()` fires from the trample path, (3+level)/6 per grass ---
	const grass = [];
	for (let dy = -1; dy <= 1 && grass.length < 2; dy++) {
		for (let dx = -1; dx <= 1 && grass.length < 2; dx++) {
			if (dx === 0 && dy === 0) continue;
			const x = hero.x + dx, y = hero.y + dy;
			if (s['level'].passable(x, y)) grass.push({ x, y });
		}
	}
	for (const cell of grass) s['level'].set(cell.x, cell.y, 6 /* HIGH_GRASS */);
	s['trampleHighGrass'](grass[0].x, grass[0].y);
	const afterOne = { charge: sandals().charge ?? 0, partial: sandals().partialCharge ?? 0, terrain: s['level'].get(grass[0].x, grass[0].y) };
	s['trampleHighGrass'](grass[1].x, grass[1].y);
	const afterTwo = { charge: sandals().charge ?? 0, partial: sandals().partialCharge ?? 0, terrain: s['level'].get(grass[1].x, grass[1].y) };
	// a cursed pair banks nothing at all (`Naturalism.charge()`'s own `cursed` guard)
	sandals().cursed = true;
	sandals().charge = 0; sandals().partialCharge = 0;
	s['level'].set(grass[0].x, grass[0].y, 6);
	s['trampleHighGrass'](grass[0].x, grass[0].y);
	const cursedCharge = sandals().charge ?? 0;
	sandals().cursed = false;

	// --- AC_FEED: picker rows, then the seed picker, then the level-up at 3 + level()*3 ---
	s['useSandals'](FRESH);
	const feedRows = { open: s['itemPickerOpen'], rows: rows() };
	s['chooseItemPicker'](0);
	const seedPicker = { open: s['itemPickerOpen'], rows: rows() };
	const seedsBeforePick = bag.items.filter((i) => i.id === 'seed' && i.quantity > 0).length;
	s['chooseItemPicker'](0);
	const afterOneFeed = {
		seedsInBag: bag.items.filter((i) => i.id === 'seed' && i.quantity > 0).length,
		banked: [...(sandals().seeds ?? [])],
		cur: sandals().curSeedEffect ?? null,
		level: sandals().level ?? 0,
		name: s['itemDisplayName']('sandals', true, FRESH),
	};
	// AC_FEED's filter, taken while `rotberry` is banked and the other two are still carried: a
	// kind the footwear already holds is never offered again (`canUseSeed`'s first clause).
	const seedIds = () => {
		s['useSandals'](FRESH);
		s['chooseItemPicker'](rows().findIndex((r) => r.instanceId === 'sandals-feed'));
		const ids = rows().map((r) => r.instanceId);
		s['chooseItemPicker'](-1);
		return ids;
	};
	const feedFilter = { banked: [...(sandals().seeds ?? [])], offered: seedIds() };

	// two more, so the third seed crosses `3 + level()*3` and levels the footwear to +1
	for (let i = 0; i < 2; i++) {
		s['useSandals'](FRESH);
		s['chooseItemPicker'](0);
		s['chooseItemPicker'](0);
	}
	const leveled = {
		level: sandals().level ?? 0,
		name: s['itemDisplayName']('sandals', true, FRESH),
		banked: [...(sandals().seeds ?? [])],
		cur: sandals().curSeedEffect ?? null,
		chargeCap: 100,
	};

	// --- AC_ROOT: aim with the real controller, confirm, and look at the planted cell ---
	sandals().charge = 100;
	s['useSandals'](FRESH);
	const rootRows = rows();
	s['chooseItemPicker'](rootRows.findIndex((r) => r.instanceId === 'sandals-root'));
	const aimed = s['aiming'] !== null && s['aiming'] !== undefined;
	s['hero'].buffs['invisibility'] = 12;
	// the controller's own pointer entry point is `moveTo(cell)`; the cursor starts on the hero
	const target = { x: hero.x + 1, y: hero.y };
	s['aiming'].controller.moveTo(target);
	const aim = { cursor: s['aiming'].controller.target, valid: s['aiming'].controller.valid };
	const confirmed = s['confirmAiming']();
	await sleep(300);
	const idx = s['level'].index(target.x, target.y);
	const rooted = {
		confirmed,
		manualPlant: s['manualPlants'].get(idx) ?? null,
		feature: s['portedFeatures'].kindAt(idx) ?? null,
		chargeAfter: sandals().charge ?? 0,
		heroInvisible: s['hero'].buffs['invisibility'] !== undefined,
	};
	// An aim past the 3-tile range cannot be confirmed at all: the controller refuses it
	// (`valid` false), so `confirmAiming` reports Java's `notarget` and spends nothing. Java's
	// own selector accepts the cell and then logs `out_of_range` from its callback - the same
	// outcome reached one step earlier, because this port's aiming only ever offers legal cells.
	sandals().charge = 100;
	const far = { x: hero.x + 6, y: hero.y };
	s['beginSandalsRoot'](FRESH);
	s['aiming'].controller.moveTo(far);
	const farAimValid = s['aiming'].controller.valid;
	const farConfirmed = s['confirmAiming']();
	s['cancelAiming']();
	const farCell = {
		aimValid: farAimValid,
		confirmed: farConfirmed,
		charge: sandals().charge ?? 0,
		plantedAnywhere: [...s['manualPlants'].keys()].length,
	};

	// --- the refusal paths: each closes the picker, so `itemPickerOpen` reflects this call ---
	const closed = () => { s['chooseItemPicker'](-1); return s['itemPickerOpen']; };
	sandals().charge = 0;
	closed();
	s['useSandals'](FRESH);
	const lowCharge = { open: s['itemPickerOpen'], rows: rows() };
	const keptSeed = sandals().curSeedEffect ?? null;
	sandals().curSeedEffect = null;
	closed();
	s['useSandals'](FRESH);
	const noEffect = { open: s['itemPickerOpen'], rows: rows() };
	sandals().curSeedEffect = keptSeed;
	sandals().cursed = true;
	closed();
	s['useSandals'](FRESH);
	const cursedRows = { open: s['itemPickerOpen'], rows: rows() };
	sandals().cursed = false;

	return {
		fresh, afterOne, afterTwo, cursedCharge, feedRows, seedPicker, seedsBeforePick, afterOneFeed, leveled,
		rootRows, aimed, aim, rooted, farCell, lowCharge, noEffect, cursedRows, feedFilter,
	};
});

// A screenshot of the artifact's own action picker, so the rows are confirmed in pixels and not
// only through their labels: both of Java's actions, in the locale this run is playing in.
await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	const FRESH = 'sandals-live';
	const sandals = s['bag'].find('sandals', FRESH);
	sandals.cursed = false;
	sandals.curSeedEffect = 'icecap';
	sandals.charge = 100;
	s['useSandals'](FRESH);
});
await page.waitForTimeout(800);
await page.screenshot({ path: 'tools/scratch/sandals-picker.png' });

console.log('probe results:', JSON.stringify(probe, null, 1));
const expect = [
	['the artifact is a carried, identified item with no charge yet',
		probe.fresh.inBag === true && probe.fresh.charge === 0 && probe.fresh.seedsInBag === 3],
	['one trample banks half a charge and converts the high grass to plain grass',
		probe.afterOne.charge === 0 && probe.afterOne.partial === 0.5 && probe.afterOne.terrain === 5],
	['a second trample rolls that half over into a whole charge',
		probe.afterTwo.charge === 1 && probe.afterTwo.partial === 0 && probe.afterTwo.terrain === 5],
	['a cursed pair banks nothing', probe.cursedCharge === 0],
	['AC_FEED offers its own row, labelled with the real `ac_feed` string',
		probe.feedRows.open === true && probe.feedRows.rows.some((r) => r.instanceId === 'sandals-feed')],
	['the seed selector lists the three carried seeds', probe.seedPicker.rows.length === 3],
	['feeding consumes exactly one seed and banks its kind',
		probe.afterOneFeed.seedsInBag === probe.seedsBeforePick - 1
		&& probe.afterOneFeed.banked.length === 1 && probe.afterOneFeed.cur !== null],
	['the third seed levels the footwear and empties the banked list',
		probe.leveled.level === 1 && probe.leveled.banked.length === 0 && probe.leveled.cur !== null],
	['and the item renames itself through the real level-name ladder (sandales -> chaussures)',
		probe.fresh.name === 'sandales de la nature' && probe.leveled.name === 'chaussures de la nature'],
	['a kind the footwear already banked is no longer offered, the others still are',
		probe.feedFilter.offered.includes('seed:rotberry') === false
		&& probe.feedFilter.offered.includes('seed:firebloom') && probe.feedFilter.offered.includes('seed:icecap')
		&& probe.feedFilter.banked.includes('rotberry')],
	['AC_ROOT offers its own row once a seed is attuned and charged',
		probe.rootRows.some((r) => r.instanceId === 'sandals-root')],
	['choosing it opens a real aiming session', probe.aimed === true],
	['the aimed cell takes the attuned plant and the charge is spent on it',
		probe.aim.valid === true && probe.rooted.confirmed === true
		&& probe.rooted.manualPlant !== null && probe.rooted.feature === 'plant:' + probe.leveled.cur
		&& probe.rooted.chargeAfter === 100 - 20],
	['and the hero is left visible again, as Java dispels it',
		probe.rooted.heroInvisible === false],
	['an aim past the 3-tile range cannot be confirmed, so nothing is planted or spent',
		probe.farCell.aimValid === false && probe.farCell.confirmed === false && probe.farCell.charge === 100],
	['an under-charged footwear offers no root row',
		probe.lowCharge.rows.some((r) => r.instanceId === 'sandals-root') === false],
	['with no seed attuned it offers only FEED, the `no_effect` case',
		probe.noEffect.rows.length === 1 && probe.noEffect.rows[0].instanceId === 'sandals-feed'],
	['a cursed pair offers neither row and opens no picker',
		probe.cursedRows.open === false && probe.cursedRows.rows.length === 0],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
console.log(`sandals livecheck: ${expect.length - failed}/${expect.length} assertions`);
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed || problems.length ? 1 : 0;
