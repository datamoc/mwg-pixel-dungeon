// Throwaway (tools/scratch): live-verify WandOfCorruption's resistance model: a full-health gnoll is usually debuffed, not converted.
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
	const hero = s['hero'];
	const tally = { converted: 0, debuffed: 0, none: 0 };
	const ids = {};
	for (let i = 0; i < 300; i++) {
		s['creatures'].splice(0, s['creatures'].length, hero);
		let at = null;
		for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1]]) if (s['level'].passable(hero.x + dx, hero.y + dy)) { at = { x: hero.x + dx, y: hero.y + dy }; break; }
		s['spawnMonster']('gnoll', at, false, undefined, false, undefined, false, undefined);
		const mob = s['creatures'].find((c) => c.kind === 'gnoll');
		s['fireWandShot']('corruption', 0, mob, 1);
		if (mob.isAlly) tally.converted++;
		else { const b = Object.keys(mob.buffs); if (b.length) { tally.debuffed++; for (const k of b) ids[k] = (ids[k] ?? 0) + 1; } else tally.none++; }
	}
	return { tally, ids };
});
console.log(JSON.stringify(result));
await browser.close();
