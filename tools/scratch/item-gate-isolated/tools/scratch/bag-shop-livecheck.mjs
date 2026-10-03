// Throwaway (tools/scratch): ChooseBag shop shelf - the depth-6 shelf stocks the
// `ChooseBag()` pick (a scroll holder for the starting kit's scrolls), names it through
// SPD's own catalogue, prices it off the real value() body, and sells it through the
// real shelf-picker -> detail -> buy path; a second shelf finds no bag once every flag
// is dropped.
//
// Run after `npm run build`:  node tools/scratch/bag-shop-livecheck.mjs
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

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=bag-shop', { waitUntil: 'load', timeout: 120000 });
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
	s['depth'] = 6;
	out.startFlags = [...s['droppedBags']];
	// The starting kit's scrolls outscore everything else, so the pick is the holder.
	const stock = s['shopStockFor'](6);
	const stockIds = stock.items.filter((i) => (i.quantity ?? 0) > 0).map((i) => i.id);
	out.bagOnShelf = stockIds.find((id) => ['scrollHolder', 'potionBandolier', 'magicalHolster', 'velvetPouch'].includes(id)) ?? null;
	out.flagsAfterBuild = [...s['droppedBags']];
	// A cached shelf rebuilds nothing and drops no second flag.
	s['shopStockFor'](6);
	out.flagsAfterRebuild = [...s['droppedBags']];
	out.name = s['itemDisplayName']('scrollHolder', true);
	out.body = s['tradeItemBody']({ id: 'scrollHolder' });
	// The real UI path: keeper talk -> shelf picker -> detail -> buy row.
	s['heroStats'].setBase('gold', 1000);
	s['interactWithShopkeeper']();
	await sleep(400);
	const shelfRows = (s['itemPickerEntries'] ?? []).map((e) => ({ id: e.id, note: e.note }));
	out.shelfHasBag = shelfRows.some((e) => e.id === 'scrollHolder');
	out.bagNote = (shelfRows.find((e) => e.id === 'scrollHolder') ?? {}).note ?? null;
	const bagIndex = (s['itemPickerEntries'] ?? []).map((e) => e.id).indexOf('scrollHolder');
	if (bagIndex >= 0) s['chooseItemPicker'](bagIndex);
	await sleep(400);
	out.detailRows = (s['itemPickerEntries'] ?? []).length;
	if ((s['itemPickerEntries'] ?? []).length === 1) s['chooseItemPicker'](0);
	await sleep(400);
	out.goldAfterBuy = s['heroStats'].base('gold');
	out.bagHasHolder = (s['bag'].find('scrollHolder')?.quantity ?? 0) > 0;
	out.bagLeftShelf = (s['shopStockFor'](6).find('scrollHolder')?.quantity ?? 0) === 0;
	// Exhaustion: every flag dropped means the next shelf carries no bag.
	s['droppedBags'].push('scrollHolder', 'potionBandolier', 'magicalHolster');
	s['shopStocks'].delete(11);
	const later = s['shopStockFor'](11);
	out.laterShelfHasBag = later.items.some((i) => (i.quantity ?? 0) > 0
		&& ['scrollHolder', 'potionBandolier', 'magicalHolster', 'velvetPouch'].includes(i.id));
	return out;
});
await page.screenshot({ path: 'tools/scratch/bag-shop-shelf.png' });
await browser.close();

const checks = [
	['velvet starts dropped (initHero)', JSON.stringify(result.startFlags) === JSON.stringify(['velvetPouch'])],
	['the shelf stocks the scroll holder', result.bagOnShelf === 'scrollHolder'],
	['the build drops the picked flag', JSON.stringify(result.flagsAfterBuild) === JSON.stringify(['velvetPouch', 'scrollHolder'])],
	['a cached shelf drops nothing more', JSON.stringify(result.flagsAfterRebuild) === JSON.stringify(['velvetPouch', 'scrollHolder'])],
	['the holder names through the catalogue', typeof result.name === 'string' && result.name !== 'scrollHolder' && result.name.length > 3],
	['the detail body is SPD text', typeof result.body === 'string' && result.body.length > 20],
	['the shelf picker lists the bag', result.shelfHasBag === true],
	['the shelf note carries the 400g price', typeof result.bagNote === 'string' && result.bagNote.includes('400')],
	['the detail opens one buy row', result.detailRows === 1],
	['the UI buy pays 400g', result.goldAfterBuy === 600],
	['the holder reaches the bag', result.bagHasHolder === true],
	['the shelf loses the sold bag', result.bagLeftShelf === true],
	['an exhausted field stocks no bag', result.laterShelfHasBag === false],
	['no console errors', problems.length === 0],
];
let failed = 0;
for (const [label, ok] of checks) {
	console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
	if (!ok) failed++;
}
console.log(JSON.stringify({ name: result.name, note: result.bagNote, problems }, null, 1));
process.exit(failed === 0 ? 0 : 1);
