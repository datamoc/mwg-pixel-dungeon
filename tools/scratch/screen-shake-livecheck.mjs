// Throwaway (tools/scratch): is the screen shake wired, and does it move the camera?
//
// `main.ts` gained `shakeScreen(magnitude, duration)` - `PixelScene.shake`'s Java body minus its
// settings multiplier (this port has no screen-shake setting) - and calls it at the sites whose Java
// feature is ported. `mwg`'s `Camera.shake` is the target: it records the magnitude/duration and
// `Camera.update` jitters `shakeX`/`shakeY` by `Random.float(-magnitude, magnitude)` damped linearly
// to zero, so both the wiring and the motion are directly observable.
//
// Run after `npm run build`:  node tools/scratch/screen-shake-livecheck.mjs
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

// ---- the port has no shake of its own before anything is triggered
const idle = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	return { remaining: s.camera.shakeRemaining, x: s.camera.shakeX, y: s.camera.shakeY };
});

// ---- a real site: DM-300's ROCKS ability (`DM300.java` 655, shake(5, 1f))
const triggered = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	const hero = s.hero;
	for (const c of [...s.creatures]) if (!c.isHero) { c.hp = 0; s.kill(c); }
	const freeCell = (fromX, fromY) => {
		for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
			const x = fromX + dx, y = fromY + dy;
			if (s.level.inside(x, y) && s.level.passable(x, y) && !s.creatureAt(x, y)) return { x, y };
		}
		return null;
	};
	const dm300 = s.spawnMonster('dm300', freeCell(hero.x, hero.y));
	dm300.maxHp = dm300.hp = 500;
	const before = { remaining: s.camera.shakeRemaining, magnitude: s.camera.shakeMagnitude };
	s['dm300Rockfall'](dm300);
	const after = { remaining: s.camera.shakeRemaining, duration: s.camera.shakeDuration, magnitude: s.camera.shakeMagnitude, volley: s.fallingRocks.length };
	s.fallingRocks.length = 0;
	return { before, after };
});

// ---- a frame or two of the real update loop, so the jitter lands
await page.waitForTimeout(120);
const during = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	return { remaining: s.camera.shakeRemaining, x: s.camera.shakeX, y: s.camera.shakeY, magnitude: s.camera.shakeMagnitude };
});

// ---- the second wired site (the chasm landing, `Chasm.java` 143, shake(4, 1f)); the hero is
// restored right after, since that path also cripples and damages by design
const chasm = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	s.hero.hp = s.hero.maxHp;
	s['landFromChasm']();
	const after = { remaining: s.camera.shakeRemaining, magnitude: s.camera.shakeMagnitude };
	s.hero.hp = s.hero.maxHp;
	delete s.hero.buffs['cripple'];
	delete s.hero.buffs['bleeding'];
	return after;
});

// ---- and the shake ends: duration elapses, jitter returns to zero
await page.waitForTimeout(1400);
const settled = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	return { remaining: s.camera.shakeRemaining, x: s.camera.shakeX, y: s.camera.shakeY };
});

console.log('probe results:', JSON.stringify({ idle, triggered, during, chasm, settled }, null, 1));
const expect = [
	['nothing is shaking before a site fires', idle.remaining === 0 && idle.x === 0 && idle.y === 0],
	['DM-300 ROCKS starts a 5-unit, 1-second shake (Java `DM300.java` 655)', triggered.after.remaining > 0 && triggered.after.magnitude === 5 && triggered.after.duration === 1],
	['and it still called the volley down', triggered.after.volley === 1],
	['the running camera jitters within the magnitude', during.x !== 0 || during.y !== 0],
	['the jitter stays within the magnitude', Math.abs(during.x) <= 5 && Math.abs(during.y) <= 5],
	['the chasm landing starts its own 4-unit shake (Java `Chasm.java` 143)', chasm.remaining > 0 && chasm.magnitude === 4],
	['and both shakes end: no remaining duration, jitter at zero', settled.remaining <= 0 && settled.x === 0 && settled.y === 0],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed ? 1 : 0;
