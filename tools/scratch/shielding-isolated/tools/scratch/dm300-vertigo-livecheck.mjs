// Throwaway (tools/scratch): live-verify DM300's Vertigo resistance: half duration from ConfusionGas, Stormvine and Combo Clobber.
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

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=combo', { waitUntil: 'load', timeout: 120000 });
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
	s['creatures'].splice(0, s['creatures'].length, hero);
	const mk = (kind) => {
		let at = null;
		for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) if (s['level'].passable(hero.x + dx, hero.y + dy)) { at = { x: hero.x + dx, y: hero.y + dy }; break; }
		s['spawnMonster'](kind, at, false, undefined, false, undefined, false, undefined);
		const m = s['creatures'].find((c) => c.kind === kind);
		m.buffs = {};
		return m;
	};
	// ConfusionGas: 2 turns normally, 1 for DM300
	let rat = mk('rat'); s['confusionGas'].seed(rat.x, rat.y, 500); out.gasRatImmediate = rat.buffs.vertigo ?? null; s['spendHeroTurn'](1); out.gasRat = rat.buffs.vertigo ?? null;
	s['creatures'] = s['creatures'].filter((c) => c === hero);
	let dm = mk('dm300');
	out.dmSpawned = !!dm;
	out.dmBefore = dm ? { x: dm.x, y: dm.y, kind: dm.kind } : null;
	if (dm) { s['confusionGas'].seed(dm.x, dm.y, 500); out.gasDm300Immediate = dm.buffs.vertigo ?? null; s['spendHeroTurn'](1); out.gasDm300AfterTurn = dm.buffs.vertigo ?? null; }
	// direct buff-rule call for Stormvine/Clobber (no plant/finisher rig needed for a numeric check)
	out.factorRat = s['creatures'].length; // placeholder to keep structure simple
	// Stormvine mob half (duration 10, halved for DM300): call the manual-plant trigger path directly.
	s['creatures'] = s['creatures'].filter((c) => c === hero);
	let rat2 = mk('rat');
	s['manualPlants'].set(s['level'].index(rat2.x, rat2.y), 'stormvine');
	s['triggerPortedPlantAt'](rat2.x, rat2.y);
	out.stormvineRat = rat2.buffs.vertigo ?? null;
	s['creatures'] = s['creatures'].filter((c) => c === hero);
	let dm2 = mk('dm300');
	s['manualPlants'].set(s['level'].index(dm2.x, dm2.y), 'stormvine');
	s['triggerPortedPlantAt'](dm2.x, dm2.y);
	out.stormvineDm300 = dm2.buffs.vertigo ?? null;
	return out;
});
console.log(JSON.stringify(result, null, 1));
await browser.close();
