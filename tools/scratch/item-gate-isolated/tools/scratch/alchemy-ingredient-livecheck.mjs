// Throwaway (tools/scratch): alchemy ingredient choice - the recipe picker now pauses for
// one ingredient picker per unit on the five category recipes. A 3-firebloom brew (with
// sungrass first in the bag, which the old first-eligible path would have taken) yields an
// identified flame potion; the rage scroll transmutes while identify sits untouched; a
// frost+blast catalyst costs the runestone-secondary 1 energy; a seed+blink pair brews 8
// alchemize; closing an ingredient picker aborts with nothing consumed.
//
// Run after `npm run build`:  node tools/scratch/alchemy-ingredient-livecheck.mjs
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
const page = await (await browser.newContext({ viewport: { width: 1024, height: 768 } })).newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`console.error: ${m.text()}`); });

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=alchemy-pick', { waitUntil: 'load', timeout: 120000 });
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

const result = await page.evaluate(async () => {
	const s = window.__MWG__.currentScene;
	const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
	const out = {};
	const qty = (id) => s['bag'].find(id)?.quantity ?? 0;
	const add = (id, quantity) => s['bag'].add({ id, quantity, stackable: true, identified: true });
	const openRecipe = (recipeId) => {
		s['openAlchemyRecipes']();
		const idx = (s['itemPickerEntries'] ?? []).findIndex((e) => e.instanceId === recipeId);
		if (idx < 0) return false;
		s['chooseItemPicker'](idx);
		return true;
	};
	const pickId = async (id) => {
		await sleep(250);
		const idx = (s['itemPickerEntries'] ?? []).findIndex((e) => e.id === id);
		if (idx < 0) return false;
		s['chooseItemPicker'](idx);
		return true;
	};
	s['alchemyEnergy'] = 10;

	// Sungrass sits first in the bag; brewing three firebloom proves the picks, not the
	// old first-eligible order, chose the units (distinct 1 => identified flame).
	add('seedSungrass', 1);
	add('seedFirebloom', 3);
	out.seedRow = openRecipe('potionSeed');
	out.pickTitle = s['itemPickerTitle'];
	const seedRows = (s['itemPickerEntries'] ?? []).map((e) => e.id);
	out.seedRowsHaveBoth = seedRows.includes('seedSungrass') && seedRows.includes('seedFirebloom');
	await pickId('seedFirebloom');
	await pickId('seedFirebloom');
	await pickId('seedFirebloom');
	await sleep(300);
	out.brew = [s['bag'].find('potionFlame')?.quantity ?? 0, s['bag'].find('potionFlame')?.identified ?? false, qty('seedSungrass'), qty('seedFirebloom')];

	// The rage scroll transmutes; the kit identify stays untouched. (The warrior kit already
	// carries one rage scroll, so the added second merges to a stack of 2 and one remains.)
	add('scrollRage', 1);
	out.stoneRow = openRecipe('scrollToStone');
	await pickId('scrollRage');
	await sleep(300);
	out.stone = [qty('stoneOfAggression'), qty('scrollIdentify'), qty('scrollRage')];

	// Frost + blast: the runestone secondary costs one energy off the pool.
	add('potionFrost', 1);
	add('stoneOfBlast', 1);
	out.catalystRow = openRecipe('alchemicalCatalyst');
	await pickId('potionFrost');
	await pickId('stoneOfBlast');
	await sleep(300);
	out.catalyst = [qty('alchemicalCatalyst'), s['alchemyEnergy'], qty('potionFrost'), qty('stoneOfBlast')];

	// A named seed + blink-stone pair brews 8 alchemize.
	add('seedMageroyal', 1);
	add('stoneOfBlink', 1);
	out.alchemizeRow = openRecipe('alchemize');
	await pickId('seedMageroyal');
	await pickId('stoneOfBlink');
	await sleep(300);
	out.alchemize = [qty('alchemize'), qty('seedMageroyal'), qty('stoneOfBlink')];

	// Closing an ingredient picker aborts with nothing consumed.
	add('seedSwiftthistle', 3);
	out.abortRow = openRecipe('potionSeed');
	s['chooseItemPicker'](-1);
	await sleep(300);
	out.abort = [qty('seedSwiftthistle'), (s['bag'].items ?? []).filter((i) => i.id.startsWith('potionHaste')).length];
	return out;
});
await page.screenshot({ path: 'tools/scratch/alchemy-ingredient-live.png' });
await browser.close();

const checks = [
	['the seed recipe opens an ingredient picker', result.seedRow === true],
	['the picker has a real title', typeof result.pickTitle === 'string' && result.pickTitle.length > 3],
	['the picker offers both seed kinds', result.seedRowsHaveBoth === true],
	['three chosen firebloom brew identified flame', result.brew[0] === 1 && result.brew[1] === true],
	['the unchosen sungrass survives', result.brew[2] === 1 && result.brew[3] === 0],
	['the chosen rage transmutes to 2 aggression', result.stone[0] === 2],
	['identify untouched, one kit rage left over', result.stone[1] === 1 && result.stone[2] === 1],
	['frost+blast catalyzes for 1 energy', result.catalyst[0] === 1 && result.catalyst[1] === 9],
	['both catalyst units are consumed', result.catalyst[2] === 0 && result.catalyst[3] === 0],
	['the named pair brews 8 alchemize', result.alchemize[0] === 8 && result.alchemize[1] === 0 && result.alchemize[2] === 0],
	['closing the picker aborts cleanly', result.abort[0] === 3 && result.abort[1] === 0],
	['no console errors', problems.length === 0],
];
let failed = 0;
for (const [label, ok] of checks) {
	console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
	if (!ok) failed++;
}
console.log(JSON.stringify({ ...result, problems }));
process.exit(failed === 0 ? 0 : 1);
