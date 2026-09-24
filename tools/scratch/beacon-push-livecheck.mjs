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
page.on('console', (m) => console.log('C:', m.text()));
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
	s['bag'].add({ id: 'beaconOfReturning', quantity: 1, identified: true, instanceId: 'bc' });
	s['useBeaconOfReturning']('bc'); // first cast: set (no existing tracker)
	const beacon = s['bag'].find('beaconOfReturning', 'bc');
	out.setResult = { depth: beacon.returnDepth, x: beacon.returnX, y: beacon.returnY };
	const away = [[3,0],[-3,0],[0,3],[0,-3]].map(([a,b])=>({x:hero.x+a,y:hero.y+b})).find(p=>s['level'].passable(p.x,p.y));
	s['moveTo'](hero, away);
	s['spawnMonster']('rat', { x: beacon.returnX, y: beacon.returnY }, false, undefined, false, undefined, false, undefined);
	out.beforeOccupant = !!s['creatureAt'](beacon.returnX, beacon.returnY);
	const ctx = s['beaconFlowContext']();
	const before = s['creatureAt'](beacon.returnX, beacon.returnY);
	out.beforeRat = before ? { x: before.x, y: before.y, kind: before.kind } : null;
	out.freeNear = ctx.randomFreeCellNear(beacon.returnX, beacon.returnY);
	s['useBeaconOfReturning']('bc'); // second cast: return (has tracker) - should push the rat and land the hero
	out.afterHero = { x: hero.x, y: hero.y, landed: hero.x === beacon.returnX && hero.y === beacon.returnY };
	out.ratMoved = !s['creatureAt'](beacon.returnX, beacon.returnY);
	return out;
});
console.log(JSON.stringify(result));
await browser.close();
