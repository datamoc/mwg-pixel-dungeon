// Throwaway (tools/scratch): live-verify Char.interact()'s default ally bump: swap places, refuse on paralysis/roots/vertigo or an immovable ally.
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

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=allyorders', { waitUntil: 'load', timeout: 120000 });
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
	const hero = s['hero'];
	const out = {};
	let row = null;
	for (let y = 2; y < s['level'].height - 2 && !row; y++) for (let x = 3; x < s['level'].width - 3 && !row; x++) {
		if (Array.from({ length: 6 }, (_, k) => s['level'].passable(x - 3 + k, y)).every(Boolean)) row = { x, y };
	}
	hero.x = row.x; hero.y = row.y; hero.buffs = {};
	s['fov'].update(hero.x, hero.y, 20);
	s['creatures'].splice(0, s['creatures'].length, hero);
	const mk = () => {
		s['spawnMonster']('rat', { x: row.x + 1, y: row.y }, false, undefined, true, 'mirror', false, undefined, 0);
		return s['creatures'].find((c) => c.allyKind === 'mirror');
	};
	// ordinary swap succeeds and spends a turn
	let ally = mk();
	const before = { hero: { x: hero.x, y: hero.y }, ally: { x: ally.x, y: ally.y } };
	const hungerBefore = hero.hunger ?? s['hunger'];
	const swapped = s['trySwapPlaces'](ally);
	out.ordinary = { swapped, heroAt: { x: hero.x, y: hero.y }, allyAt: { x: ally.x, y: ally.y }, before, turnSpent: (hero.hunger ?? s['hunger']) !== hungerBefore };
	// refuses under paralysis
	hero.x = row.x; hero.y = row.y; ally.x = row.x + 1; ally.y = row.y;
	hero.buffs.paralysis = 5;
	out.paralysed = { refused: !s['trySwapPlaces'](ally), heroUnmoved: hero.x === row.x };
	hero.buffs = {};
	// refuses under the ally's Vertigo
	ally.buffs = { vertigo: 3 };
	out.allyVertigo = { refused: !s['trySwapPlaces'](ally) };
	ally.buffs = {};
	// refuses for an immovable ally kind
	s['creatures'].splice(0, s['creatures'].length, hero);
	s['spawnMonster']('shopkeeper', { x: row.x + 1, y: row.y }, false, undefined, true, 'mirror', false, undefined, 0);
	const keeper = s['creatures'].find((c) => c.kind === 'shopkeeper');
	out.immovable = keeper ? { refused: !s['trySwapPlaces'](keeper) } : { skipped: true };
	return out;
});
console.log(JSON.stringify(result, null, 1));
await browser.close();
