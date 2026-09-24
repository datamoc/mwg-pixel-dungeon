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
	// a cell whose 8 neighbours are all open floor with nothing standing on them
	const open = (x, y) => s['level'].inside(x, y) && s['level'].passable(x, y) && !s['creatureAt'](x, y);
	let spot = null;
	for (let y = 2; y < s['level'].height - 2 && !spot; y++) for (let x = 2; x < s['level'].width - 2 && !spot; x++) {
		if ([[-1,-1],[0,-1],[1,-1],[-1,0],[0,0],[1,0],[-1,1],[0,1],[1,1]].every(([a,b]) => open(x + a, y + b))) spot = { x, y };
	}
	out.spot = spot;
	const counts = {};
	hero.buffs['vertigo'] = 9999;
	for (let i = 0; i < 400; i++) {
		hero.x = spot.x; hero.y = spot.y;
		s['takeHeroTurn']({ x: 1, y: 0 });
		const key = `${hero.x - spot.x},${hero.y - spot.y}`;
		counts[key] = (counts[key] ?? 0) + 1;
	}
	out.directions = Object.keys(counts).length; out.intendedShare = (counts['1,0'] ?? 0) / 400; out.counts = counts;
	delete hero.buffs['vertigo'];
	// confusion gas grants vertigo
	s['confusionGas'].seed(hero.x, hero.y, 500);
	s['spendHeroTurn'](1);
	out.gasGaveVertigo = hero.buffs['vertigo'] !== undefined && hero.buffs['daze'] === undefined;
	return out;
});
console.log(JSON.stringify(result));
await browser.close();
