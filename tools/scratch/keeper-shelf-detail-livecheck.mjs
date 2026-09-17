// Throwaway (tools/scratch): keeper shelf detail window - does picking a shelf row open
// the row's own detail (description + stats body) with a working buy row?
//
// Java opens one `WndTradeItem` per heap (info body + buy button). This port lists the whole
// shelf at once, so picking a row must open that row's detail through `openShelfItemDetail`
// and the detail's buy row must complete through the unchanged `buyStockEntry` path.
//
// Run after `npm run build`:  node tools/scratch/keeper-shelf-detail-livecheck.mjs
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

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=keeper-detail', { waitUntil: 'load', timeout: 120000 });
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
	s['depth'] = 6;
	s['enterLevel']();
	await sleep(3500);
	s['heroStats'].setBase('gold', 50000);

	// talk to the keeper: the shelf list opens, buying nothing yet
	s['interactWithShopkeeper']();
	await sleep(400);
	const shelf = {
		open: s['itemPickerOpen'],
		rows: (s['itemPickerEntries'] ?? []).map((e) => e.id),
		body: s['itemPickerBody'] ?? null,
	};
	const goldBefore = s['heroStats'].base('gold');
	if (!shelf.open || shelf.rows.length === 0) return { found: true, shelf, goldBefore };

	// pick the first shelf row: its own detail window must open, with a real body
	const firstId = shelf.rows[0];
	const bagBefore = s['bag'].find(firstId)?.quantity ?? 0;
	s['chooseItemPicker'](0);
	await sleep(400);
	const detail = {
		open: s['itemPickerOpen'],
		title: s['itemPickerTitle'] ?? null,
		rows: (s['itemPickerEntries'] ?? []).map((e) => e.id),
		body: s['itemPickerBody'] ?? null,
	};
	return { found: true, shelf, goldBefore, firstId, bagBefore, detail };
});
await page.screenshot({ path: 'tools/scratch/keeper-detail.png' });

// the detail's buy row completes the purchase through buyStockEntry
const afterBuy = await page.evaluate(async (firstId) => {
	const s = window.__MWG__.currentScene;
	const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
	s['chooseItemPicker'](0);
	await sleep(400);
	const logs = (s['gameLog']?.['blocks'] ?? []).map((block) => block.text ?? block.label?.text ?? '');
	return {
		gold: s['heroStats'].base('gold'),
		inBag: (s['bag'].find(firstId)?.quantity ?? 0),
		buyLogged: logs.some((line) => /\d/.test(line) && /achat|achet|buy|acheté/i.test(line)),
	};
}, result.firstId);
result.afterBuy = afterBuy;

console.log('probe results:', JSON.stringify(result, null, 1));
const expect = [
	['the keeper opens the shelf list without charging', result.shelf?.open === true && (result.shelf?.rows?.length ?? 0) > 0],
	['the shelf list itself carries no shared body', result.shelf?.body == null],
	['picking a row opens its own detail with a real description body',
		result.detail?.open === true && result.detail?.rows?.length === 1
		&& typeof result.detail?.body === 'string' && result.detail.body.length > 20
		&& !/\.desc$/.test(result.detail.body)],
	['the detail buy row pays and delivers exactly one unit',
		result.afterBuy && result.afterBuy.gold < result.goldBefore
		&& result.afterBuy.inBag === (result.bagBefore ?? 0) + 1 && result.afterBuy.buyLogged === true],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
console.log(`keeper shelf detail livecheck: ${expect.length - failed}/${expect.length} assertions`);
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed || problems.length ? 1 : 0;
