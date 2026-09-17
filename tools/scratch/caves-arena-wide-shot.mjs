// Throwaway (tools/scratch): screenshots of the dressed depth-15 floor - the city-entrance facade,
// the gate, and the arena's pylon wiring. The hero has to *walk* to each spot (`takeHeroTurn`, the
// port's own turn entry point): writing `hero.x/y` alone moves the game's idea of the hero but not
// the sprite, camera or field of view, so the picture never changes.
//
// Run after `npm run build`:  node tools/scratch/caves-arena-wide-shot.mjs
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
page.on('pageerror', (e) => console.log('pageerror:', e.message));
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=caves-arena', { waitUntil: 'load', timeout: 120000 });
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

await page.evaluate(async () => {
	const s = window.__MWG__.currentScene;
	const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
	s['depth'] = 15;
	s['enterLevel']();
	await sleep(3500);
	window.__shot = async (dir, turns) => {
		for (let i = 0; i < turns; i++) { s['takeHeroTurn'](dir); await sleep(110); }
		await sleep(500);
		return { at: [s['hero'].x, s['hero'].y] };
	};
});

const shots = [
	['gate', { x: 0, y: -1 }, 12],
	['corridor', { x: 0, y: -1 }, 6],
	['ore', { x: 0, y: -1 }, 8],
];
for (const [name, dir, turns] of shots) {
	const at = await page.evaluate(([d, t]) => window.__shot(d, t), [dir, turns]);
	await page.screenshot({ path: `tools/scratch/caves-arena-${name}.png` });
	console.log(`wrote tools/scratch/caves-arena-${name}.png`, JSON.stringify(at));
}
await browser.close();
