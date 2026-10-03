// Throwaway (tools/scratch): `WndTradeItem`'s selling half in the built game.
//
// Java builds one of two windows from one rule (`WndTradeItem.java` 78-131): `quantity() == 1 ||
// (item instanceof MissileWeapon && item.isUpgradable())` gets a single `sell` button that sells the
// item outright, otherwise `sell_1` at `value()/quantity()` beside `sell_all` at `value()`. This
// port used to sell exactly one unit for every item, from a picker with no second step.
//
//   node tools/scratch/sell-window-livecheck.mjs      (after `npm run build`)
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

// Pin the locale: the game follows the browser's, and the label assertions below are about SPD's
// own English wording (`windows.wndtradeitem.sell*`), which the port ships in all 19 locales.
await page.addInitScript(() => { try { window.localStorage.setItem('spd-on-mwg.language', 'en'); } catch { /* ignore */ } });
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=sellwindow', { waitUntil: 'load', timeout: 120000 });
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
// HERO -> warrior
await tap(398 / 1024, 400 / 768);
await tap(62 / 1024, 261 / 768);
await tap(0.166, 0.934);
await page.waitForTimeout(5000);

/** Runs the whole sell flow on a stack and reports what each step produced. */
const sellFlow = (quantity, spell) => page.evaluate(([qty]) => {
	const s = window.__MWG__.currentScene;
	// each phase starts clean: a leftover window from the previous one would sit under the new
	// dialog and swallow the pointer click this check depends on
	s['gameWindows'].closeAll();
	const bag = s['bag'];
	for (const item of [...bag.items]) bag.remove(item.id, item.quantity, item.instanceId);
	bag.add({ id: 'potionHealing', quantity: qty, identified: true, stackable: true });

	const goldBefore = s['heroStats'].base('gold');
	let picked = null;
	let onPick = null;
	const originalPicker = s['openItemPicker'].bind(s);
	s['openItemPicker'] = (title, entries, cb) => { picked = { title, ids: entries.map((e) => e.id) }; onPick = cb; return originalPicker(title, entries, cb); };
	s['shopSellFood']();
	s['openItemPicker'] = originalPicker;
	if (!picked || !onPick) return { error: 'the picker never opened' };

	// pick the potion; that should open the trade window rather than sell anything
	onPick({ id: 'potionHealing', quantity: 1 });

	// read the window the scene put up: its title and every button label
	const windows = s['gameWindows'].children.filter((child) => child.content);
	const win = windows.at(-1);
	const labels = [];
	const buttons = [];
	const walk = (node) => {
		if (node.onClick) { buttons.push(node); labels.push((node.children ?? []).find((c) => typeof c.text === 'string')?.text ?? node.text); }
		for (const child of node.children ?? []) walk(child);
	};
	if (win) walk(win.content);
	return {
		picked: picked.ids, title: picked.title, quantityAfterPick: bag.find('potionHealing')?.quantity ?? 0,
		goldBefore, goldAfterPick: s['heroStats'].base('gold'),
		// `title` is a constructor option, not a retained field: the live string is on the private label
		windowTitle: win?.['titleLabel']?.text ?? null, labels, buttonCount: buttons.length,
		expectedTitle: s['itemDisplayName']('potionHealing', true),
	};
}, [quantity]);

const stack = await sellFlow(5);
const lone = await sellFlow(1);
const missiles = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	s['gameWindows'].closeAll();
	const bag = s['bag'];
	for (const item of [...bag.items]) bag.remove(item.id, item.quantity, item.instanceId);
	bag.add({ id: 'stone', quantity: 8, identified: true, stackable: true, sourceClass: 'Bolas' });
	let onPick = null;
	const originalPicker = s['openItemPicker'].bind(s);
	s['openItemPicker'] = (title, entries, cb) => { onPick = cb; return originalPicker(title, entries, cb); };
	s['shopSellFood']();
	s['openItemPicker'] = originalPicker;
	onPick({ id: 'stone', quantity: 1 });
	const win = s['gameWindows'].children.filter((child) => child.content).at(-1);
	const labels = [];
	const walk = (node) => {
		if (node.onClick) labels.push((node.children ?? []).find((c) => typeof c.text === 'string')?.text ?? node.text);
		for (const child of node.children ?? []) walk(child);
	};
	if (win) walk(win.content);
	return { labels, quantityAfterPick: bag.find('stone')?.quantity ?? 0 };
});

// and finally: click "Sell all" through the real pointer path (the house convention - the same
// sequence `lastmissile-confirm-livecheck.mjs` uses for its "Yes", since a signal is not a function
// to call), then see the units move.
const prepared = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	s['gameWindows'].closeAll();
	const bag = s['bag'];
	for (const item of [...bag.items]) bag.remove(item.id, item.quantity, item.instanceId);
	bag.add({ id: 'potionHealing', quantity: 5, identified: true, stackable: true });
	const goldBefore = s['heroStats'].base('gold');
	let onPick = null;
	const originalPicker = s['openItemPicker'].bind(s);
	s['openItemPicker'] = (title, entries, cb) => { onPick = cb; return originalPicker(title, entries, cb); };
	s['shopSellFood']();
	s['openItemPicker'] = originalPicker;
	onPick({ id: 'potionHealing', quantity: 1 });
	// hand the window's geometry back to the caller, which waits a frame before reading it: a
	// freshly built window has not been laid out yet, and `getBounds()` read too early is what
	// makes this click miss
	return { goldBefore, ready: true };
});
await page.waitForTimeout(300);   // let the window lay out before its bounds are read
const sellAllButton = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	const win = s['gameWindows'].children.filter((child) => child.content).at(-1);
	const buttons = [];
	const walk = (node) => { if (node.onClick) buttons.push(node); for (const child of node.children ?? []) walk(child); };
	if (win) walk(win.content);
	const last = buttons.at(-1);
	const bounds = last.getBounds();
	return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2, buttons: buttons.length };
});
sellAllButton.goldBefore = prepared.goldBefore;
await page.evaluate(([x, y]) => {
	const c = document.querySelector('canvas');
	const r = c.getBoundingClientRect();
	const opts = { bubbles: true, cancelable: true, composed: true, clientX: r.x + (x / 1024) * r.width, clientY: r.y + (y / 768) * r.height, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: 1 };
	c.dispatchEvent(new PointerEvent('pointermove', opts));
	c.dispatchEvent(new PointerEvent('pointerdown', opts));
	c.dispatchEvent(new PointerEvent('pointerup', { ...opts, buttons: 0 }));
	c.dispatchEvent(new MouseEvent('click', { ...opts, buttons: 0 }));
}, [sellAllButton.x, sellAllButton.y]);
await page.waitForTimeout(600);
const sold = await page.evaluate((goldBefore) => {
	const s = window.__MWG__.currentScene;
	return {
		buttons: null,
		quantityAfter: s['bag'].find('potionHealing')?.quantity ?? 0,
		goldBefore, goldAfter: s['heroStats'].base('gold'),
		buyback: (s['buybackFor'](s['depth']) ?? []).map((e) => [e.id, e.quantity]),
		windowsLeft: s['gameWindows'].children.filter((child) => child.content).length,
	};
}, sellAllButton.goldBefore);
sold.buttons = sellAllButton.buttons;
sold.goldBefore = sellAllButton.goldBefore;

const checks = [
	['a stack sells nothing on the pick alone', stack.quantityAfterPick === 5],
	['and opens a window instead', stack.buttonCount === 2],
	["titled with the item's own display name", stack.windowTitle !== null && stack.windowTitle === stack.expectedTitle],
	["whose buttons are SPD's sell_1 and sell_all", /Sell 1 for \d+g/.test(stack.labels[0] ?? '') && /Sell all for \d+g/.test(stack.labels[1] ?? '')],
	['a lone item gets one button', lone.buttonCount === 1],
	["using SPD's plain sell wording", /^Sell for \d+g$/.test(lone.labels[0] ?? '')],
	['an upgradable missile stack gets one button too', missiles.labels.length === 1 && /^Sell for \d+g$/.test(missiles.labels[0] ?? '')],
	['and is not sold by the pick alone', missiles.quantityAfterPick === 8],
	['Sell all empties the stack', sold.quantityAfter === 0],
	['and pays for every unit', sold.goldAfter - sold.goldBefore > 0],
	['shelving the whole stack at once', JSON.stringify(sold.buyback) === JSON.stringify([['potionHealing', 5]])],
];
let failed = 0;
for (const [name, ok] of checks) { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); }
console.log(`\n${checks.length - failed}/${checks.length} sell-window checks passed.`);
console.log(`stack window: ${JSON.stringify(stack.labels)}`);
console.log(`lone window:  ${JSON.stringify(lone.labels)}  missiles: ${JSON.stringify(missiles.labels)}`);
console.log(`sell-all click: ${JSON.stringify({ buttons: sold.buttons, quantityAfter: sold.quantityAfter, goldBefore: sold.goldBefore, goldAfter: sold.goldAfter, buyback: sold.buyback, windowsLeft: sold.windowsLeft })}`);
if (problems.length) console.log(`page problems: ${JSON.stringify(problems.slice(0, 3))}`);
await browser.close();
process.exit(failed === 0 && problems.length === 0 ? 0 : 1);
