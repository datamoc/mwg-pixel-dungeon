// Throwaway (tools/scratch): live-check the two FloatingTextStack defects this port carried, both
// fixed upstream in 0.7.7 and adopted here on 0.7.8.
//
//   1. A pop-up scaled *after* `push` was measured before the scale, so stacked lines were spaced by
//      the 21px raster instead of the 7px they are drawn at (~3x too far). `push` now takes
//      `scale`, applied before measurement, and `showStatus` passes it.
//   2. The stack moved the *newcomer* down where Java's `FloatingText.push()` anchors the newcomer
//      on the target and lifts the lines already there above it (`floaters-livecheck` asserts the
//      direction, which the framework's own older tests never checked).
//
// Run after `npm run build`:  node tools/scratch/floaters-livecheck.mjs
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
	const hero = s.hero;
	for (const c of [...s.creatures]) if (!c.isHero) { c.hp = 0; s.kill(c); }
	const freeCell = (fromX, fromY) => {
		for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
			const x = fromX + dx, y = fromY + dy;
			if (s.level.inside(x, y) && s.level.passable(x, y) && !s.creatureAt(x, y)) return { x, y };
		}
		return null;
	};
	const clampAll = () => {
		// keep the clamp from moving anything while we measure
		if (typeof s['clampCamera'] === 'function') s['clampCamera']();
	};
	const target = s.spawnMonster('rat', freeCell(hero.x, hero.y));
	target.maxHp = target.hp = 1000;
	clampAll();
	const floaters = s['floaters'];
	floaters.clear();
	// two numbers on one target, as one turn of combat would produce
	s['showDamage'](target, 5);
	const firstLive = floaters.live[floaters.live.length - 1];
	const firstY = firstLive.entry.y;
	s['showDamage'](target, 7);
	const newcomer = floaters.live[floaters.live.length - 1];
	const older = floaters.live[0];
	const scale = s['floaterTextScale'];
	const font = s['floaterFontSize'];
	return {
		live: floaters.live.length,
		scale,
		font,
		newcomerHeight: newcomer.entry.height,
		newcomerPopupHeight: newcomer.popup.height,
		newcomerScale: newcomer.popup.scale.x,
		newcomerY: newcomer.entry.y,
		olderY: older.entry.y,
		olderHeight: older.entry.height,
		gap: newcomer.entry.y - older.entry.y,
		firstY,
		olderIsAbove: older.entry.y < newcomer.entry.y,
		heightMatchesPopup: Math.abs(newcomer.entry.height - newcomer.popup.height) < 0.001,
	};
});

console.log('probe results:', JSON.stringify(result, null, 1));
const expect = [
	['two numbers on one target both live', result.live === 2],
	['the pop-up carries the world-space scale', Math.abs(result.newcomerScale - result.scale) < 1e-9],
	['the stack measured the pop-up at its drawn size, not the 21px raster',
		result.heightMatchesPopup && result.newcomerHeight < result.font * 2],
	['the older line is lifted above the newcomer (Java direction)', result.olderIsAbove === true],
	['the lift clears the older line by the drawn height plus the gap',
		result.gap >= result.olderHeight + 3],
	['the newcomer stayed where it was asked to appear', result.firstY === result.newcomerY],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed ? 1 : 0;
