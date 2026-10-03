// Throwaway (tools/scratch): a screenshot of the trade window with the item's description body.
// Run after `npm run build`:  node tools/scratch/shop-window-shot.mjs
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const globalRoot = process.env.GLOBAL_NODE_MODULES ?? 'C:\\Users\\miche\\AppData\\Roaming\\npm\\node_modules';
const { chromium } = require(path.join(globalRoot, 'playwright'));
const browser = await chromium.launch({
	executablePath: path.join(process.env.LOCALAPPDATA ?? 'C:\\Users\\miche\\AppData\\Local', 'ms-playwright', 'chromium-1193', 'chrome-win', 'chrome.exe'),
	args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await (await browser.newContext({ viewport: { width: 1024, height: 768 } })).newPage();
page.on('pageerror', (e) => console.log('pageerror:', e.message));
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=shop-window', { waitUntil: 'load', timeout: 120000 });
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

const info = await page.evaluate(async () => {
	const s = window.__MWG__.currentScene;
	const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
	s['depth'] = 6;
	s['enterLevel']();
	await sleep(3500);
	const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
	for (const [dx, dy] of dirs) {
		const x = s['hero'].x + dx, y = s['hero'].y + dy;
		if (!s['level'].passable(x, y) || s['isChasmCell'](x, y) || s['groundItemAt'](x, y) || s['creatureAt'](x, y)) continue;
		s['heroStats'].setBase('gold', 500);
		s['spawnGroundItem']('scrollMapping', x, y, { id: 'scrollMapping', quantity: 1, identified: true }, undefined, true);
		s['takeHeroTurn']({ x: dx, y: dy });
		await sleep(500);
		return { opened: s['itemPickerOpen'], body: (s['itemPickerBody'] ?? '').slice(0, 40), at: [s['hero'].x, s['hero'].y] };
	}
	return { opened: false };
});
await page.screenshot({ path: 'tools/scratch/shop-window.png' });
console.log(JSON.stringify(info));
await browser.close();
