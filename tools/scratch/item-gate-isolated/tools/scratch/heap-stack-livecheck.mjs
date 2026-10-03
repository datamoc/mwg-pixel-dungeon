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
	const c = [[1,0],[-1,0],[0,1],[0,-1]].map(([a,b]) => ({ x: hero.x + a, y: hero.y + b })).find((p) => s['level'].passable(p.x, p.y) && !s['groundItemAt'](p.x, p.y));
	s['spawnGroundItem']('potion', c.x, c.y, { id: 'potionHealing', quantity: 1, identified: true, instanceId: 'p1' });
	s['spawnGroundItem']('scroll', c.x, c.y, { id: 'scrollIdentify', quantity: 1, identified: true, instanceId: 's1' });
	s['spawnGroundItem']('gold', c.x, c.y, { id: 'gold', quantity: 7, identified: true });
	const stack = s['heapItemsAt'](c.x, c.y);
	out.stackKinds = stack.map((g) => g.kind);
	out.top = s['groundItemAt'](c.x, c.y).kind;
	s['refresh']?.();
	out.visible = stack.map((g) => s['spriteFor'].get(g.id).visible);
	const goldBefore = s['heroStats'].base('gold');
	const bagBefore = s['bag'].items.length;
	s['moveTo'](hero, c);
	s['pickupGroundItemAt'](c.x, c.y);
	out.left = s['heapItemsAt'](c.x, c.y).length;
	out.goldDelta = s['heroStats'].base('gold') - goldBefore;
	out.bagDelta = s['bag'].items.length - bagBefore;
	out.spritesLeft = s['groundItems'].filter((g) => g.x === c.x && g.y === c.y).length;
	// chest under a drop: relocates
	s['spawnGroundItem']('wand', c.x + 0, c.y + 0, { id: 'wand', quantity: 1, identified: false, instanceId: 'w9', sourceClass: 'WandOfMagicMissile' }, 'locked');
	const r = s['spawnGroundItem']('gold', c.x, c.y, { id: 'gold', quantity: 3, identified: true });
	out.relocated = r ? (r.x !== c.x || r.y !== c.y) : null;
	out.chestStillTop = s['groundItemAt'](c.x, c.y)?.chest;
	return out;
});
console.log(JSON.stringify(result));
await browser.close();
