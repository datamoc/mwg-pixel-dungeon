// Throwaway (tools/scratch): live-verify Trinity SpiritForm's Ring branch (state/expiry only -
// the ring-formula call sites themselves are a separate, larger slice, not yet wired).
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const globalRoot = process.env.GLOBAL_NODE_MODULES ?? 'C:\\Users\\miche\\AppData\\Roaming\\npm\\node_modules';
const { chromium } = require(path.join(globalRoot, 'playwright'));
const executablePath = path.join(process.env.LOCALAPPDATA ?? 'C:\\Users\\miche\\AppData\\Local', 'ms-playwright', 'chromium-1193', 'chrome-win', 'chrome.exe');
const browser = await chromium.launch({ executablePath, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 1024, height: 768 } })).newPage();
page.on('pageerror', (e) => console.log('pageerror:', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('console.error:', m.text()); });

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=trinity-ring', { waitUntil: 'load', timeout: 120000 });
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
	const out = {};
	const hero = s['hero'];
	const c = [[2,0],[-2,0],[0,2],[0,-2]].map(([a,b]) => ({ x: hero.x + a, y: hero.y + b })).find((p) => s['level'].passable(p.x, p.y) && !s['groundItemAt'](p.x, p.y));
	s['spawnGroundItem']('meat', c.x, c.y, { id: 'meat', quantity: 2, identified: true });
	s['spawnGroundItem']('potion', c.x, c.y, { id: 'potionHealing', quantity: 1, identified: true, instanceId: 'q1' });
	s['freezeHeapAt'](c.x, c.y);
	out.after = s['heapItemsAt'](c.x, c.y).map((g) => g.item?.id ?? g.kind);
	// frost flask thrown at the same cell freezes a fresh stack too
	s['spawnGroundItem']('meat', c.x, c.y, { id: 'meat', quantity: 1, identified: true });
	s['bag'].add({ id: 'potionFrost', quantity: 1, identified: true, instanceId: 'pf', stackable: true });
	s['finishThrow']('potionFrost', 'pf', c);
	out.afterFrost = s['heapItemsAt'](c.x, c.y).map((g) => g.item?.id ?? g.kind);
	// eat carpaccio 40 times: some effect lines, hunger drops
	let effects = 0; const log = [];
	const orig = s['say'].bind(s); s['say'] = (m, l) => { log.push(m); return orig(m, l); };
	for (let i = 0; i < 40; i++) { s['bag'].add({ id: 'frozenCarpaccio', quantity: 1, identified: true, stackable: true }); s['hunger'] = 300; s['requestedItemId'] = 'frozenCarpaccio'; s['eatFood'] ? 0 : 0; s['onAction']('eat'); }
	out.effectLines = [...new Set(log.filter((m) => /invisible|skin|Refresh|better|feel/i.test(m)))].length;
	out.hungerAfter = s['hunger'];
	return out;
});
console.log(JSON.stringify(result));
await browser.close();
