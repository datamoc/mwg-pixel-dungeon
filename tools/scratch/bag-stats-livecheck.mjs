// Throwaway (tools/scratch): the bag container-half stat slice (2026-09-18).
// A ground-picked bag fires its `validateAllBagsBought` badge on the real pickup path;
// the owned holster stretches missile durability (1.2x uses); the free velvet badge
// fires at run start, like `HeroClass.initHero()`'s own `collect()`.
//
// Run after `npm run build`:  node tools/scratch/bag-stats-livecheck.mjs
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
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`console.error: ${m.text()}`); });
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=bag-stats', { waitUntil: 'load', timeout: 120000 });
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
	out.velvetBadgeAtStart = s['badges'].unlocked('bag_velvet') === true;
	// a holder on the ground, picked up through the real pickup path
	const hx = s['hero'].x, hy = s['hero'].y;
	s['spawnGroundItem']('bag', hx, hy, { id: 'scrollHolder', quantity: 1, identified: true });
	s['pickupGroundItemAt'](hx, hy);
	out.holderInBag = s['bag'].find('scrollHolder') !== undefined;
	out.holderBadge = s['badges'].unlocked('bag_holder') === true;
	// missile durability with and without the owned holster (Bolas pile, level 0)
	s['ammoSourceClass'] = 'Bolas';
	s['missileLevel'] = 0;
	const bare = s['missileDurabilityCost']();
	s['bag'].add({ id: 'magicalHolster', quantity: 1, identified: true });
	const holstered = s['missileDurabilityCost']();
	out.bareCost = bare;
	out.holsteredCost = holstered;
	out.holsterBadge = s['badges'].unlocked('bag_holster') === true;
	return out;
});
console.log('probe results:', JSON.stringify(result, null, 1));
const expect = [
	['free velvet badge fires at run start', result.velvetBadgeAtStart === true],
	['picked-up holder reaches the bag', result.holderInBag === true],
	['picked-up holder fires its badge', result.holderBadge === true],
	['owned holster stretches missile durability (lower wear cost)',
		typeof result.bareCost === 'number' && typeof result.holsteredCost === 'number'
		&& result.bareCost > 0 && result.holsteredCost > 0 && result.holsteredCost < result.bareCost],
	['direct-added holster does not itself fire (acquisition hook is the pickup path)',
		result.holsterBadge === false],
	['no page errors', true],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
console.log(`bag-stats livecheck: ${expect.length - failed}/${expect.length} assertions`);
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed || problems.length ? 1 : 0;
