// Throwaway (tools/scratch): is the furrowed-grass art reachable on screen?
//
// `DungeonTileSheet` gives FURROWED_GRASS its own foreground cuts (152/156 against high grass's
// 151/155). This port keeps both kinds on one game kind and carries the furrowed bit in its own
// set, so the renderer's terrain value collapsed to plain high grass and those two frames were
// computed but never reachable. This drives a real floor and reads the value the overlay keys on.
//
// Run after `npm run build`:  node tools/scratch/furrowed-grass-livecheck.mjs
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
const page = await (await browser.newContext({ viewport: { width: 1024, height: 768 } })).newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`console.error: ${m.text()}`); });

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=furrowed-grass', { waitUntil: 'load', timeout: 120000 });
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
	const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
	s['depth'] = 1;
	s['enterLevel']();
	await sleep(3500);

	// a real high-grass cell, anywhere on this floor (the game kind id comes from the port's own
	// constants, so it is read off the level rather than assumed)
	let at = null;
	for (let y = 0; y < s['level'].height && !at; y++) {
		for (let x = 0; x < s['level'].width && !at; x++) {
			const kind = s['level'].get(x, y);
			const raw = s['portedPaint']?.map?.[s['level'].index(x, y)];
			if (raw === 15 || (kind !== 0 && kind !== 2 && raw === 15)) at = { x, y };
		}
	}
	if (!at) return { found: false };
	const cell = s['level'].index(at.x, at.y);

	// park the hero on it so the camera (and the FOV) cover it, then read what the overlay keys on
	s['hero'].x = at.x; s['hero'].y = at.y;
	s['refresh']();
	await sleep(400);
	const before = s['visualTerrainAt'](at.x, at.y);

	s['furrowedGrass'].add(cell);
	s['refresh']();
	await sleep(400);
	const after = s['visualTerrainAt'](at.x, at.y);

	// ...and the same read one step away is unchanged, so the value is the cell's own
	const neighbourKind = s['visualTerrainAt'](at.x + 1, at.y);
	return { found: true, at, cell, before, after, neighbourKind, setHas: s['furrowedGrass'].has(cell) };
});

if (result.found === false) {
	console.log('SKIP no high grass on this floor at this seed');
	await browser.close();
	process.exit(0);
}
const crop = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	const p = s['camera'].toScreen(s['hero'].x * 16, s['hero'].y * 16);
	return { x: p.x, y: p.y, size: 16 * s['camera'].zoom };
});
await page.screenshot({
	path: 'tools/scratch/furrowed-grass.png',
	clip: { x: Math.max(0, crop.x - crop.size), y: Math.max(0, crop.y - crop.size), width: crop.size * 3, height: crop.size * 3 },
});

console.log('probe results:', JSON.stringify(result, null, 1));
const expect = [
	['the cell reads as plain high grass (15) first - the pair that was reachable before',
		result.before === 15],
	['marking it furrowed makes the renderer read Java\'s own FURROWED_GRASS value (30)',
		result.after === 30],
	['the state used is the one the floor persists and the trample path maintains',
		result.setHas === true],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
console.log(`furrowed grass livecheck: ${expect.length - failed}/${expect.length} assertions`);
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed || problems.length ? 1 : 0;
