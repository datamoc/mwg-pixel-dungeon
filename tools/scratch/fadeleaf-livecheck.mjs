// Throwaway (tools/scratch): live-check Fadeleaf's teleport, in particular that it frees a rooted
// hero.
//
// Java's `Fadeleaf.activate` teleports through `ScrollOfTeleportation.teleportChar`, which detaches
// `Roots` right after it places the char. This port's plant path never did, and `moveTo` refuses a
// rooted creature outright - so a fadeleaf that fired while the hero was entangled (reachable in
// this port through the Overgrowth armor glyph's own proc) silently did nothing at all.
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const globalRoot = process.env.GLOBAL_NODE_MODULES ?? 'C:\\Users\\miche\\AppData\\Roaming\\npm\\node_modules';
const { chromium } = require(path.join(globalRoot, 'playwright'));

const executablePath = path.join(
	process.env.LOCALAPPDATA ?? 'C:\\Users\\miche\\AppData\\Local',
	'ms-playwright',
	'chromium-1193',
	'chrome-win',
	'chrome.exe'
);
const browser = await chromium.launch({
	executablePath,
	args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const page = await context.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`console.error: ${m.text()}`); });

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href, { waitUntil: 'load', timeout: 120000 });
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

const result = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	/** fire a fadeleaf at the hero's own cell the way the Overgrowth proc does */
	const fadeleaf = ({ rooted }) => {
		const hero = s.hero;
		hero.hp = hero.maxHp;
		if (rooted) hero.buffs['roots'] = 10;
		else delete hero.buffs['roots'];
		const before = { x: hero.x, y: hero.y };
		const cell = s.level.index(hero.x, hero.y);
		s['manualPlants'].set(cell, 'fadeleaf');
		s['placePortedFeature'](cell, 'fadeleaf');
		s['triggerPortedPlantAt'](hero.x, hero.y);
		return {
			moved: hero.x !== before.x || hero.y !== before.y,
			rootsAfter: !!hero.buffs['roots'],
			distance: Math.max(Math.abs(hero.x - before.x), Math.abs(hero.y - before.y)),
		};
	};
	return { rooted: fadeleaf({ rooted: true }), free: fadeleaf({ rooted: false }) };
});

console.log('probe results:', JSON.stringify(result));
const expect = [
	['a fadeleaf frees a rooted hero and moves them', result.rooted.moved === true && result.rooted.rootsAfter === false],
	['a fadeleaf teleports a rooted hero a real distance', result.rooted.distance >= 2],
	['a fadeleaf still teleports an unrooted hero', result.free.moved === true && result.free.distance >= 2],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed ? 1 : 0;
