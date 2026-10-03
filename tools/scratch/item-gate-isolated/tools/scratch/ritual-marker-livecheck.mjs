// Throwaway (tools/scratch): does the Wandmaker's ritual marker reach the screen?
//
// `RitualSiteRoom.RitualMarker` is a 3x3 block over the four ceremonial candles' own cell, drawn
// from `prison_quest.png` - a sheet this port did not load at all, so the quest site had no marker
// art. This drives a real floor, plants a site by setting `ritualPos` the way `adoptPortedFeatures`
// does, re-enters the level, reads the live layer back and screenshots the site.
//
// Run after `npm run build`:  node tools/scratch/ritual-marker-livecheck.mjs
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
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=ritual-marker', { waitUntil: 'load', timeout: 120000 });
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
	s['depth'] = 11;
	s['enterLevel']();
	await sleep(3500);

	// no site on a fresh Caves floor: nothing is drawn and no cell answers as the marker
	const before = { layer: s['ritualMarker'] !== null, ritualPos: s['ritualPos'] };

	// plant a site the way `adoptPortedFeatures` does - `ritualPos` straight from the paint grid -
	// on the hero's own cell, then re-enter so the layer is built from it
	const w = s['level'].width;
	const placed = { x: s['hero'].x, y: s['hero'].y };
	s['ritualPos'] = placed.y * w + placed.x;
	s['enterLevel']();
	await sleep(3500);

	const layer = s['ritualMarker'];
	const ritualPosAfter = s['ritualPos'];
	if (!layer) return { before, placed, ritualPosAfter, layerMissing: true };
	const cell = (x, y) => layer.getTile('ritualMarker', x, y);
	const frames = [];
	for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) frames.push(cell(placed.x + dx, placed.y + dy));

	// the marker's own examine text, and a cell just outside it staying ordinary. The log is
	// append-only, so each read takes the *newest* line rather than the whole history (which would
	// keep the previous examine's words in it).
	const newestLine = () => {
		const blocks = s['gameLog']?.['blocks'] ?? [];
		const last = blocks[blocks.length - 1];
		return (last?.text ?? last?.label?.text ?? '').trim();
	};
	s['examineTile'](placed.x, placed.y);
	await sleep(200);
	const insideLog = newestLine();
	s['examineTile'](placed.x + 2, placed.y);
	await sleep(200);
	const outsideLog = newestLine();

	s['hero'].x = placed.x; s['hero'].y = placed.y;
	s['refresh']();
	await sleep(600);
	const at = s['camera'].toScreen(placed.x * 16, placed.y * 16);
	return {
		before, placed, ritualPosAfter, layerMissing: false, frames,
		offMarker: [cell(placed.x + 2, placed.y), cell(placed.x, placed.y + 2), cell(0, 0)],
		insideIsMarker: /marque|marker|rituel|ritual/i.test(insideLog),
		insideLog: insideLog.slice(-160),
		outsideLog: outsideLog.slice(-160),
		heroAt: [s['hero'].x, s['hero'].y],
		outsideIsMarker: /marque|marker|rituel|ritual/i.test(outsideLog),
		crop: { x: at.x, y: at.y, size: 16 * s['camera'].zoom },
	};
});
if (result.crop) {
	await page.screenshot({ path: 'tools/scratch/ritual-marker.png' });
	await page.screenshot({
		path: 'tools/scratch/ritual-marker-zoom.png',
		clip: { x: Math.max(0, result.crop.x - result.crop.size * 2), y: Math.max(0, result.crop.y - result.crop.size * 2), width: result.crop.size * 5, height: result.crop.size * 5 },
	});
}
console.log('probe results:', JSON.stringify(result, null, 1));
if (result.layerMissing) {
	console.log('FAIL the marker layer was never built');
	await browser.close();
	process.exit(1);
}
const expect = [
	['the marker layer tracks the site: built exactly when `ritualPos` names one',
		result.before.layer === (result.before.ritualPos >= 0)],
	["the site's 3x3 takes Java's nine atlas frames (0,1,2 / 4,5,6 / 8,9,10)",
		JSON.stringify(result.frames) === JSON.stringify([0, 1, 2, 4, 5, 6, 8, 9, 10])],
	['nothing outside its own rect is drawn', result.offMarker.every((frame) => frame === -1)],
	["the marker's own cells answer its catalogue name", result.insideIsMarker === true],
	['and the cell just outside does not', result.outsideIsMarker === false],
	['no page errors', true],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
console.log(`ritual marker livecheck: ${expect.length - failed}/${expect.length} assertions`);
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed || problems.length ? 1 : 0;
