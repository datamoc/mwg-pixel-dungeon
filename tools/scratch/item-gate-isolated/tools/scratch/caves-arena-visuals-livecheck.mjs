// Throwaway (tools/scratch): do `CavesBossLevel`'s three custom tilemaps actually reach the screen?
//
// The depth-15 floor used to render as bare tiles: `CityEntrance`/`EntranceOverhang`'s dressing and
// `ArenaVisuals`' wires all come from `caves_boss.png`, a sheet this port was not loading at all, so
// nothing on the arena looked like Java's. This drives a real depth-15 floor, reads the frames back
// out of the live layers, re-runs the pylon-destroyed refresh, and screenshots the entrance.
//
// Run after `npm run build`:  node tools/scratch/caves-arena-visuals-livecheck.mjs
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

const result = await page.evaluate(async () => {
	const s = window.__MWG__.currentScene;
	const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
	s['depth'] = 15;
	s['enterLevel']();
	await sleep(4000);

	const tiles = s['cavesBossTiles'];
	const walls = s['cavesBossWalls'];
	if (!tiles || !walls) return { layersMissing: true, tiles: !!tiles, walls: !!walls };

	const terrain = s['portedPaint']?.map;
	const w = s['level'].width;
	const tile = (layer, x, y) => tiles.getTile(layer, x, y);
	const wallTile = (x, y) => walls.getTile('cavesOverhang', x, y);

	// a real `INACTIVE_TRAP` wire cell in the arena, a real `EMPTY_SP` cell beside a pylon, and the
	// frame Java's own formula puts on that neighbour: `54 + (x + 8y) - (x' + 8y')` of the two cells
	let wire = null, besidePylon = null, besidePylonExpect = null;
	const pylons = s['cavesBossPylons'];
	for (let y = 14; y < s['level'].height && (!wire || !besidePylon); y++) {
		for (let x = 0; x < w; x++) {
			const cell = y * w + x;
			if (!wire && terrain[cell] === 19 /* Terrain.INACTIVE_TRAP */) wire = { x, y };
			if (!besidePylon && terrain[cell] === 14 /* Terrain.EMPTY_SP */) {
				const pylon = pylons.find((p) => Math.max(Math.abs(p.x - x), Math.abs(p.y - y)) === 1);
				if (pylon) {
					besidePylon = { x, y };
					besidePylonExpect = 54 + (x + 8 * y) - (pylon.x + 8 * pylon.y);
				}
			}
		}
	}

	const beforeSeal = {
		entranceBlock: [tile('cavesEntrance', 15, 0), tile('cavesEntrance', 16, 0), tile('cavesEntrance', 14, 0)],
		entranceRow2: tile('cavesEntrance', 0, 2),
		entranceRow3Metal: [tile('cavesEntrance', 9, 3), tile('cavesEntrance', 10, 3)],
		overhangBlock: [wallTile(15, 0), wallTile(16, 0), wallTile(14, 0)],
		gateRun: [14, 15, 16, 17, 18].map((x) => tile('cavesArena', x, 13)),
		wireFrame: wire ? tile('cavesArena', wire.x, wire.y) : null,
		besidePylonFrame: besidePylon ? tile('cavesArena', besidePylon.x, besidePylon.y) : null,
		besidePylonExpect,
		pylonSocket: tile('cavesArena', pylons[0].x, pylons[0].y),
		pylonTerrain: terrain[pylons[0].y * w + pylons[0].x],
		// `CavesPainter`'s null-room pass, which the floor now runs: real deco cells in the paint,
		// and the ore-sparkle layer the port builds from the WALL_DECO ones
		emptyDeco: Array.from(terrain).filter((value) => value === 20 /* EMPTY_DECO */).length,
		wallDeco: Array.from(terrain).filter((value) => value === 12 /* WALL_DECO */).length,
		wallDecoLayers: s['wallDecorations'] ? (s['wallDecorations'].spots?.length ?? s['wallDecorations'].children?.length ?? -1) : null,
		// the same layer the scene would rebuild from the current state
		matchesRebuild: tile('cavesArena', 16, 13) === s['cavesArenaLayer']()[13 * w + 16],
	};

	// examine a wire cell and the gate
	const logs = [];
	const readLog = () => (s['gameLog']?.['blocks'] ?? []).map((block) => block.text ?? block.label?.text ?? '').join(' | ');
	if (wire) { s['examineTile'](wire.x, wire.y); await sleep(250); logs.push(readLog()); }
	s['examineTile'](16, 13); await sleep(250); logs.push(readLog());

	// `Pylon.die()` -> `eliminatePylon()` -> `updateState()`: with the arena sealed and that pylon
	// gone, its cell picks up the socket frame
	const pylon = s['creatures'].find((c) => c.kind === 'pylon' && c.hp > 0);
	s['cavesBossSealed'] = true;
	pylon.hp = 0;
	s['refreshCavesBossArenaVisuals']();
	await sleep(300);
	const afterRefresh = {
		socket: tile('cavesArena', pylon.x, pylon.y),
		stillMatchesRebuild: tile('cavesArena', 16, 13) === s['cavesArenaLayer']()[13 * w + 16],
	};

	// park the hero at the entrance so the screenshot shows the dressed corridor and gate
	s['hero'].x = 16; s['hero'].y = 11;
	s['refresh']();
	await sleep(600);
	const crop = s['camera'].toScreen(16 * 16, 9 * 16);
	return {
		layersMissing: false, w, beforeSeal, afterRefresh,
		wireFound: !!wire, besidePylonFound: !!besidePylon,
		logs, crop: { x: crop.x, y: crop.y, size: 16 * s['camera'].zoom },
	};
});

if (result.layersMissing) {
	console.log('FAIL the depth-15 layers were never created:', JSON.stringify(result));
	await browser.close();
	process.exit(1);
}

await page.screenshot({
	path: 'tools/scratch/caves-arena-entrance.png',
	clip: {
		x: Math.max(0, result.crop.x - result.crop.size * 3),
		y: Math.max(0, result.crop.y - result.crop.size * 2),
		width: result.crop.size * 9,
		height: result.crop.size * 7,
	},
});

console.log('probe results:', JSON.stringify(result, null, 1));
const expect = [
	["the CityEntrance entry block lands on cols 14..18 of row 0 (7,7 with -1 edges)",
		result.beforeSeal.entranceBlock[0] === 7 && result.beforeSeal.entranceBlock[1] === 7 && result.beforeSeal.entranceBlock[2] === -1],
	['its row-2 ceiling frame and row-3 wall frame are drawn, with the two metal columns left blank',
		result.beforeSeal.entranceRow2 === 13 && result.beforeSeal.entranceRow3Metal[0] === -1 && result.beforeSeal.entranceRow3Metal[1] === 21],
	['`EntranceOverhang` draws its own entry column on the wall layer',
		result.beforeSeal.overhangBlock[0] === 7 && result.beforeSeal.overhangBlock[1] === 7 && result.beforeSeal.overhangBlock[2] === 0],
	['the gate is Java\'s five-cell run, drawn as one 40..44 strip',
		JSON.stringify(result.beforeSeal.gateRun) === JSON.stringify([40, 41, 42, 43, 44])],
	['a real `INACTIVE_TRAP` cell draws the exposed-wiring frame',
		result.wireFound && result.beforeSeal.wireFrame === 37],
	['a cell beside a live pylon draws the directional wire tile Java\'s formula names',
		result.besidePylonFound && result.beforeSeal.besidePylonFrame === result.beforeSeal.besidePylonExpect],
	['before the seal a pylon cell draws nothing, and the layer matches a fresh rebuild',
		result.beforeSeal.pylonSocket === -1 && result.beforeSeal.matchesRebuild],
	['destroying a pylon while sealed re-maps its cell to the socket frame',
		result.afterRefresh.socket === 38 && result.afterRefresh.stillMatchesRebuild],
	['examining the gate names it as the gate',
		result.logs.some((line) => /Metal gate|porte m[ée]tallique|Metal|$/.test(line) && /gate|porte|Tor|tor/i.test(line))],
	['examining exposed wiring names it as wiring',
		result.logs.some((line) => /wiring|Wiring|c[âa]bl|fil|Kabel/i.test(line))],
	["CavesPainter's null-room pass painted floor deco and ore veins on this floor",
		result.beforeSeal.emptyDeco > 0 && result.beforeSeal.wallDeco > 0],
	['and the WALL_DECO cells reach the screen as the ore-sparkle layer',
		result.beforeSeal.wallDecoLayers !== null && result.beforeSeal.wallDecoLayers > 0],
	['no page errors', true],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
console.log(`caves arena visuals livecheck: ${expect.length - failed}/${expect.length} assertions`);
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed || problems.length ? 1 : 0;
