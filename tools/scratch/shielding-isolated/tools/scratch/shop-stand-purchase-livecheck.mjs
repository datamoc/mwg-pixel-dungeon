// Throwaway (tools/scratch): buying a shop stand item - does a bare step still spend gold?
//
// Java's `WndTradeItem` charges only when its `buy` button is pressed (and disables that button
// while the price exceeds the hero's gold). This port used to charge on the step itself, so an
// accidental step bought the item. This drives a real FOR_SALE heap next to the hero and reads
// the window, the gold, and the heap across a cancel and a confirmed buy.
//
// Run after `npm run build`:  node tools/scratch/shop-stand-purchase-livecheck.mjs
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

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=shop-stand', { waitUntil: 'load', timeout: 120000 });
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

	const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
	let at = null;
	for (const [dx, dy] of dirs) {
		const x = s['hero'].x + dx, y = s['hero'].y + dy;
		if (s['level'].passable(x, y) && !s['isChasmCell'](x, y) && !s['groundItemAt'](x, y) && !s['creatureAt'](x, y)) { at = { x, y, dx, dy }; break; }
	}
	if (!at) return { found: false };

	// a real shop stand: a priced heap, exactly what a ported shop floor lays out. The stand's own id
	// is fixed rather than taken from this depth's stock: that stock is RNG-rolled per run, and its
	// first entry can be a gear heap (`weaponReward`) whose window row is fine but whose `inBag` count
	// would then depend on what the hero happens to carry. `scrollMapping` is a real depth-6 stock id
	// with a catalogue description, so the core assertions stay deterministic; the per-stock-id body
	// coverage further down is what varies between runs.
	const stockIds = s['shopStockFor'](6).items.map((entry) => entry.id);
	const standId = 'scrollMapping';
	s['heroStats'].setBase('gold', 500);
	s['spawnGroundItem'](standId, at.x, at.y, { id: standId, quantity: 1, identified: true }, undefined, true);
	// the price the shop itself charges, read off the game rather than guessed
	const standPrice = s['shopPrice'](standId);
	const goldBefore = s['heroStats'].base('gold');
	const standBefore = s['groundItemAt'](at.x, at.y)?.forSale ?? null;

	// stepping onto it must open the window, not buy
	s['takeHeroTurn']({ x: at.dx, y: at.dy });
	await sleep(400);
	const afterStep = {
		heroMoved: s['hero'].x === at.x && s['hero'].y === at.y,
		gold: s['heroStats'].base('gold'),
		pickerOpen: s['itemPickerOpen'],
		entries: s['itemPickerEntries'].length,
		// `WndTradeItem` extends `WndInfoItem`, so the window's body is the item's own description
		body: s['itemPickerBody'],
	};

	// cancelling spends nothing and leaves the stand standing
	s['chooseItemPicker'](-1);
	await sleep(300);
	const afterCancel = {
		gold: s['heroStats'].base('gold'),
		standStillPriced: s['groundItemAt'](at.x, at.y)?.forSale === true,
		inBag: (s['bag'].find(standId)?.quantity ?? 0),
	};

	// ...and the button does buy it
	s['pickupGroundItemAt'](at.x, at.y);
	await sleep(300);
	s['chooseItemPicker'](0);
	await sleep(400);
	const logs = (s['gameLog']?.['blocks'] ?? []).map((block) => block.text ?? block.label?.text ?? '');
	const afterBuy = {
		gold: s['heroStats'].base('gold'),
		standGone: s['groundItemAt'](at.x, at.y) === null,
		inBag: (s['bag'].find(standId)?.quantity ?? 0),
		buyLogged: logs.some((line) => /\d/.test(line) && /achat|achet|buy|acheté/i.test(line)),
	};

	// and an unaffordable stand refuses with Java's disabled-button equivalent, opening nothing
	s['heroStats'].setBase('gold', 1);
	s['spawnGroundItem'](standId, at.x, at.y, { id: standId, quantity: 1, identified: true }, undefined, true);
	s['pickupGroundItemAt'](at.x, at.y);
	await sleep(300);
	const afterPoor = { pickerOpen: s['itemPickerOpen'], gold: s['heroStats'].base('gold'), standStillPriced: s['groundItemAt'](at.x, at.y)?.forSale === true };

	// every id this depth's shop stocks, driven through the same window, to see which of them carry
	// a description at all (the body comes from `items.<class>.desc` via `ITEM_KEYS`)
	s['heroStats'].setBase('gold', 5000);
	const bodies = {};
	for (const id of stockIds.slice(0, 6)) {
		s['spawnGroundItem'](id, at.x, at.y, { id, quantity: 1, identified: true }, undefined, true);
		s['pickupGroundItemAt'](at.x, at.y);
		await sleep(120);
		bodies[id] = s['itemPickerBody'] ?? null;
		s['chooseItemPicker'](-1);
		await sleep(80);
		const heap = s['groundItemAt'](at.x, at.y);
		if (heap) s['groundItems'].splice(s['groundItems'].indexOf(heap), 1);
	}
	return { found: true, standId, stockIds: stockIds.slice(0, 6), bodies, standPrice, goldBefore, standBefore, afterStep, afterCancel, afterBuy, afterPoor };
});

console.log('probe results:', JSON.stringify(result, null, 1));
if (result.found === false) {
	console.log('SKIP no free cell beside the hero to place a stand on');
	await browser.close();
	process.exit(0);
}
const expect = [
	['the stand is a real priced heap', result.standBefore === true],
	['stepping onto it opens the trade window instead of buying',
		result.afterStep.pickerOpen === true && result.afterStep.entries === 1 && result.afterStep.gold === result.goldBefore],
	["the window carries the item's own description as its body (Java's `WndInfoItem` half)",
		typeof result.afterStep.body === 'string' && result.afterStep.body.length > 20
		&& !/\.desc$/.test(result.afterStep.body)],
	['and the ids this depth stocks resolve real descriptions too, not raw keys',
		Object.values(result.bodies).filter((body) => typeof body === 'string' && body.length > 20).length >= 5],
	['cancelling spends nothing and leaves the stand priced and unbought',
		result.afterCancel.gold === result.goldBefore && result.afterCancel.standStillPriced === true
		&& result.afterCancel.inBag === 0],
	['the buy button pays the price, takes the stand, and logs it',
		result.afterBuy.gold === result.goldBefore - result.standPrice && result.afterBuy.standGone === true
		&& result.afterBuy.inBag === 1 && result.afterBuy.buyLogged === true],
	['an unaffordable stand opens nothing and spends nothing',
		result.afterPoor.pickerOpen === false && result.afterPoor.gold === 1 && result.afterPoor.standStillPriced === true],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
console.log(`shop stand purchase livecheck: ${expect.length - failed}/${expect.length} assertions`);
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed || problems.length ? 1 : 0;
