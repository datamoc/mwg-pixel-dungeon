// Throwaway (tools/scratch): does DM-300's Barrier follow Java's move() rule?
//
// `DM300.move()` grants `30 + (HT-HP)/10` of Barrier when the boss *steps onto an `INACTIVE_TRAP`
// wire cell* while hunting, and returns early when that cell is already energized. This port used to
// test the opposite - membership in the energized set - which also fired on energized water. This
// drives a real depth-15 floor, moves DM-300 onto each kind of cell in turn, and reads the Barrier.
//
// Run after `npm run build`:  node tools/scratch/dm300-barrier-livecheck.mjs
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
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=dm300-barrier', { waitUntil: 'load', timeout: 120000 });
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

	const paint = s['portedPaint'];
	const w = s['level'].width;
	const terrain = paint.map;
	// a wire cell, a water cell, and a third wire cell far from the first two
	let wire = null, water = null, wire2 = null;
	for (let y = 14; y < s['level'].height; y++) {
		for (let x = 0; x < w; x++) {
			const cell = y * w + x;
			if (terrain[cell] === 19 /* INACTIVE_TRAP */ && !wire) wire = { x, y, cell };
			else if (terrain[cell] === 19 && wire && !wire2 && cell !== wire.cell) wire2 = { x, y, cell };
			else if (terrain[cell] === 29 /* WATER */ && !water) water = { x, y, cell };
		}
	}
	// DM-300 only exists once the arena seals, which fires when the hero is within 3 of a pylon
	const pylon = s['cavesBossPylons'][0];
	s['hero'].x = pylon.x + 2; s['hero'].y = pylon.y;
	s['checkCavesBossPylonGate']();
	await sleep(500);
	const dm300 = s['creatures'].find((c) => c.kind === 'dm300');
	if (!dm300) return { spawned: false };
	dm300.dmSupercharged = true;
	dm300.hp = Math.floor(dm300.maxHp / 2);
	dm300.seesHero = true;
	s['cavesBossEnergyCells'] = new Set([wire.cell, water.cell]);

	const shield = () => Math.floor(30 + (dm300.maxHp - dm300.hp) / 10);
	const step = (at) => {
		dm300.dmBarrier = 0;
		s['moveTo'](dm300, { x: at.x, y: at.y });
		return dm300.dmBarrier;
	};
	const energizedWire = step(wire);
	const energizedWater = step(water);
	// `eliminatePylon()`'s own clear, which is what makes a wire cell un-energized in Java too
	s['cavesBossEnergyCells'].clear();
	const clearedWire = step(wire2 ?? wire);
	// and Java only does any of this while hunting
	s['cavesBossEnergyCells'].clear();
	dm300.seesHero = false;
	const notHunting = step(wire);
	dm300.seesHero = true;
	return {
		spawned: true, expect: shield(), energizedWire, energizedWater, clearedWire, notHunting,
		wireKindRaw: terrain[wire.cell], waterKindRaw: terrain[water.cell],
	};
});

console.log('probe results:', JSON.stringify(result, null, 1));
if (!result.spawned) {
	console.log('SKIP no DM-300 spawned on this floor at this seed');
	await browser.close();
	process.exit(0);
}
const expect = [
	['the wire cell really is an `INACTIVE_TRAP` and the water cell really is `WATER`',
		result.wireKindRaw === 19 && result.waterKindRaw === 29],
	['stepping onto an *energized* wire cell grants no Barrier (`volumeAt > 0` returns early)',
		result.energizedWire === 0],
	['nor onto energized water, which Java never grants the shield from',
		result.energizedWater === 0],
	['with the field cleared, the same step grants `30 + (HT-HP)/10`',
		result.clearedWire === result.expect && result.expect > 0],
	['and it does not apply while the boss is not hunting', result.notHunting === 0],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
console.log(`dm300 barrier livecheck: ${expect.length - failed}/${expect.length} assertions`);
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed || problems.length ? 1 : 0;
