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
	const sum = (b) => { const j = b.toJSON(); return JSON.stringify(j).length; };
	const gas0 = sum(s['toxicGas']);
	s['spawnGroundItem']('potion', c.x, c.y, { id: 'potionToxicGas', quantity: 1, identified: true, instanceId: 'e1' });
	s['spawnGroundItem']('scroll', c.x, c.y, { id: 'scrollIdentify', quantity: 1, identified: true, instanceId: 'e2' });
	for (const e of [...s['heapItemsAt'](c.x, c.y)].reverse()) s['explodeHeapEntry'](e, new Set());
	out.stackAfterBlast = s['heapItemsAt'](c.x, c.y).length;
	out.gasGrew = sum(s['toxicGas']) > gas0;
	// purity flask clears it
	s['bag'].add({ id: 'potionPurity', quantity: 1, identified: true, instanceId: 'pu', stackable: true });
	s['finishThrow']('potionPurity', 'pu', c);
	out.gasAfterPurity = sum(s['toxicGas']) <= gas0 + 10;
	// levitation flask -> confusion gas
	const cg0 = sum(s['confusionGas']);
	s['bag'].add({ id: 'potionLevitation', quantity: 1, identified: true, instanceId: 'lv', stackable: true });
	s['finishThrow']('potionLevitation', 'lv', c);
	out.confusionGrew = sum(s['confusionGas']) > cg0;
	return out;
});
console.log(JSON.stringify(result));
await browser.close();
