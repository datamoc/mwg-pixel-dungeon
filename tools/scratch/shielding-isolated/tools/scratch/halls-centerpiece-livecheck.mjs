// Throwaway (tools/scratch): does the Yog arena's centre piece reach the screen at depth 25?
//
// `HallsBossLevel`'s `CenterPieceVisuals`/`CenterPieceWalls` are the art over Yog's own arena - a
// 9x8 block on the floor layer at (12,9) and one on the wall layer at (12,8). This drives a real
// depth-25 floor, reads the frames out of the live layers, checks the two sit either side of the
// wall layer (Java's `customTiles`/`customWalls` split), and screenshots the arena.
//
// Run after `npm run build`:  node tools/scratch/halls-centerpiece-livecheck.mjs
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
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=halls-centerpiece', { waitUntil: 'load', timeout: 120000 });
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
	s['depth'] = 25;
	s['enterLevel']();
	await sleep(4000);

	const center = s['hallsBossCenter'];
	const centerWalls = s['hallsBossCenterWalls'];
	if (!center || !centerWalls) return { layersMissing: true, center: !!center, centerWalls: !!centerWalls };

	const children = s['camera'].world.children;
	const indexOf = (child) => children.indexOf(child);
	const order = {
		center: indexOf(center),
		centerWalls: indexOf(centerWalls),
		wallsMap: indexOf(s['wallsMap']),
		itemLayer: indexOf(s['itemLayer']),
	};

	// which layer owns the frames in the arena's own band? (the screenshot shows multicoloured
	// vertical strips there, which is not the centre-piece art)
	const layers = {
		map: s['map'], wallsMap: s['wallsMap'], demonSpawnerFloor: s['demonSpawnerFloor'],
		hallsBossCenter: center, hallsBossCenterWalls: centerWalls,
	};
	const band = {};
	for (const [name, layer] of Object.entries(layers)) {
		if (!layer) { band[name] = null; continue; }
		const samples = [];
		for (let y = 8; y <= 16; y++) for (const x of [12, 13, 19, 20]) {
			samples.push({ layer: name, x, y, tile: layer.getTile ? layer.getTile(layer.layerNames ? layer.layerNames[0] : 0, x, y) : null });
		}
		band[name] = samples.filter((sample) => sample.tile !== -1 && sample.tile !== undefined).slice(0, 6);
	}
	return {
		layersMissing: false,
		band,
		order,
		// `pos(ROOM_LEFT, ROOM_TOP+1)` on the floor layer, `pos(ROOM_LEFT, ROOM_TOP)` on the wall one
		floorBlock: [center.getTile('hallsCenter', 12, 9), center.getTile('hallsCenter', 20, 16), center.getTile('hallsCenter', 12, 8)],
		wallBlock: [centerWalls.getTile('hallsCenterWalls', 12, 14), centerWalls.getTile('hallsCenterWalls', 20, 14), centerWalls.getTile('hallsCenterWalls', 12, 8)],
		blankOutside: [center.getTile('hallsCenter', 0, 0), centerWalls.getTile('hallsCenterWalls', 31, 31)],
		// the arena's own terrain, so the art is confirmed to sit over the boss room rather than
		// somewhere else on the floor
		exitAt: [s['level'].index(16, 9) % 32, Math.floor(s['level'].index(16, 9) / 32)],
		crop: (() => {
			const topLeft = s['camera'].toScreen(11 * 16, 7 * 16);
			const bottomRight = s['camera'].toScreen(22 * 16, 18 * 16);
			return { x: topLeft.x, y: topLeft.y, width: bottomRight.x - topLeft.x, height: bottomRight.y - topLeft.y };
		})(),
	};
});
await page.screenshot({ path: 'tools/scratch/halls-centerpiece.png' });
if (result.crop && result.crop.width > 0) {
	await page.screenshot({ path: 'tools/scratch/halls-centerpiece-zoom.png', clip: result.crop });
}
console.log('probe results:', JSON.stringify(result, null, 1));
if (result.layersMissing) {
	console.log('FAIL the depth-25 layers were never created');
	await browser.close();
	process.exit(1);
}
const expect = [
	['the floor block is drawn at (12,9)-(20,16) on the centre layer',
		result.floorBlock[0] === 8 && result.floorBlock[1] === 49 && result.floorBlock[2] === -1],
	['the wall block is drawn one row higher, on the wall layer',
		result.wallBlock[0] === 32 && result.wallBlock[1] === 33 && result.wallBlock[2] === -1],
	['both layers leave the rest of the floor blank',
		result.blankOutside[0] === -1 && result.blankOutside[1] === -1],
	['the floor block sits below the actors and the wall block above the wall layer',
		result.order.center > result.order.wallsMap === false
		&& result.order.center < result.order.itemLayer
		&& result.order.centerWalls > result.order.wallsMap],
	['no page errors', true],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
console.log(`halls centerpiece livecheck: ${expect.length - failed}/${expect.length} assertions`);
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed || problems.length ? 1 : 0;
