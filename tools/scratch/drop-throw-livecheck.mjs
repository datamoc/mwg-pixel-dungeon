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
	s['bag'].add({ id: 'potionToxicGas', quantity: 2, identified: true, instanceId: 'tg', stackable: true });
	s['bag'].add({ id: 'potionHealing', quantity: 1, identified: true, instanceId: 'hl', stackable: true });
	out.verbs = { toxic: s['itemVerbs']('potionToxicGas', true), heal: s['itemVerbs']('potionHealing', true), ring: s['itemVerbs']('ring_garnet', true), key: s['itemVerbs']('ironKey', true) };
	// drop the healing potion: heap on hero cell
	const n0 = s['bag'].items.length;
	s['dropBagItem']('potionHealing', 'hl');
	out.dropped = { heap: s['groundItemAt'](hero.x, hero.y)?.item?.id, bagDelta: s['bag'].items.length - n0 };
	// pick it back up by re-stepping: simulate pickup
	s['pickupGroundItemAt'](hero.x, hero.y);
	out.repicked = s['bag'].find('potionHealing') !== undefined;
	// throw toxic gas at a cell 3 away: gas seeded there
	const dir = [[1,0],[-1,0],[0,1],[0,-1]].find(([a,b]) => s['level'].passable(hero.x + a*3, hero.y + b*3) && s['level'].passable(hero.x + a, hero.y + b) && s['level'].passable(hero.x + a*2, hero.y + b*2));
	const target = { x: hero.x + dir[0]*3, y: hero.y + dir[1]*3 };
	s['fov'].update(hero.x, hero.y, s['viewRadius']());
	const before = s['toxicGas'].get ? s['toxicGas'].get(target.x, target.y) : null;
	s['finishThrow']('potionToxicGas', 'tg', target);
	out.thrown = { left: s['bag'].find('potionToxicGas')?.quantity, gasAtTarget: (() => { const j = s['toxicGas'].toJSON(); return JSON.stringify(j).length; })(), before };
	// throw healing at target: harmless splash, no heap
	s['finishThrow']('potionHealing', 'hl', target);
	out.healThrow = { gone: s['bag'].find('potionHealing') === undefined, heapAtTarget: !!s['groundItemAt'](target.x, target.y) };
	// throw a scroll: lands as heap
	s['bag'].add({ id: 'scrollIdentify', quantity: 1, identified: true, instanceId: 'sc', stackable: true });
	s['finishThrow']('scrollIdentify', 'sc', target);
	out.scrollThrow = s['groundItemAt'](target.x, target.y)?.kind;
	return out;
});
console.log(JSON.stringify(result));
await browser.close();
