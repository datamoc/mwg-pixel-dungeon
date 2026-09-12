// Throwaway (tools/scratch): `CavesBossLevel.seal()`, live - does the arena close behind the hero?
//
// Java's seal runs when the hero comes within three tiles of a pylon: the entrance cell becomes a
// wall, anything standing on it (or heaped there) is pushed to a random passable neighbour, the
// map is restitched, rocks are shaken loose, DM-300 is created at a random open `mainArena` point,
// and the boss music starts. This port had only the DM-300 half; the check drives the seal on a
// real depth-15 floor and looks at all of it.
//
// Run after `npm run build`:  node tools/scratch/caves-seal-livecheck.mjs
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

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=caves-seal', { waitUntil: 'load', timeout: 120000 });
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

const sealed = await page.evaluate(async () => {
	const s = window.__MWG__.currentScene;
	const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
	s['depth'] = 15;
	s['enterLevel']();
	await sleep(3000);   // the interlevel curtain owns `awaitingInput` until it finishes

	const width = s['level'].width;
	const entrance = s['entranceCell'];
	const cell = (x, y) => y * width + x;
	const before = {
		entrance,
		terrain: s['level'].get(entrance.x, entrance.y),
		paint: s['portedPaint'].map[cell(entrance.x, entrance.y)],
		passable: s['level'].passable(entrance.x, entrance.y),
		heroAtEntrance: s['hero'].x === entrance.x && s['hero'].y === entrance.y,
	};
	// put the hero on the entrance, a heap beside it and a monster right on it, so the push-aside
	// branch has something to move - the seal happens while the hero is *away* from the entrance
	// in real play, which is what makes this worth forcing
	s['hero'].x = entrance.x; s['hero'].y = entrance.y;
	s['spawnGroundItem']('gold', entrance.x + 1, entrance.y, { id: 'gold', quantity: 7, identified: true });
	s['spawnMonster']('rat', { x: entrance.x, y: entrance.y });
	s['refresh']();
	// the hero must leave the cell or the push-aside would move the hero itself; Java's real
	// trigger is the hero being near a pylon, so move there and let the turn path seal it
	s['hero'].x = 6; s['hero'].y = 13;
	s['refresh']();
	await sleep(300);
	s['checkCavesBossPylonGate']();
	await sleep(400);

	const rat = s['creatures'].find((c) => c.kind === 'rat');
	const dm300 = s['creatures'].find((c) => c.kind === 'dm300');
	const gold = s['groundItems'].find((g) => g.kind === 'gold');
	const after = {
		terrain: s['level'].get(entrance.x, entrance.y),
		paint: s['portedPaint'].map[cell(entrance.x, entrance.y)],
		passable: s['level'].passable(entrance.x, entrance.y),
		rat: rat ? { x: rat.x, y: rat.y, wasAtEntrance: rat.x === entrance.x && rat.y === entrance.y } : null,
		gold: gold ? { x: gold.x, y: gold.y } : null,
		dm300: dm300 ? { x: dm300.x, y: dm300.y, inArena: dm300.x >= 5 && dm300.x <= 28 && dm300.y >= 14 && dm300.y <= 37 } : null,
		sealed: s['cavesBossSealed'],
		shakeRemaining: s['camera'].shakeRemaining,
	};
	// and the sealed cell really is unwalkable through the scene's own step rule
	const stepIntoTerrain = s['canStepOnto'](entrance.x, entrance.y);
	return { before, after, stepIntoTerrain };
});

console.log('probe results:', JSON.stringify(sealed, null, 1));
const { before, after } = sealed;
const expect = [
	// the live kind for an entrance is the shared FLOOR one (the staircase art comes from the
	// paint grid), so what "it is an entrance" means here is the paint value plus walkability
	['the hero arrives on the arena\'s entrance cell, walkable and drawn as one',
		before.terrain === 1 && before.paint === 7 && before.passable === true],
	['the seal walls it (`CavesBossLevel.seal()`\'s `set(entrance, WALL)`)',
		after.terrain === 0 && after.paint === 4 && after.passable === false],
	['and the scene\'s own step rule refuses it too', sealed.stepIntoTerrain === false],
	['the monster standing there was pushed off, not walled in',
		after.rat !== null && !(after.rat.x === before.entrance.x && after.rat.y === before.entrance.y)
			&& after.rat.x !== before.entrance.x || after.rat.y !== before.entrance.y],
	['the heap beside it stayed put (Java only relocates what is *on* the entrance)',
		after.gold !== null && after.gold.x === before.entrance.x + 1 && after.gold.y === before.entrance.y],
	['DM-300 was created inside `mainArena`, the way `seal()` does it', after.dm300 !== null && after.dm300.inArena === true],
	['and the seal is latched, with rocks shaken loose', after.sealed === true && after.shakeRemaining > 0],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
console.log(`caves seal livecheck: ${expect.length - failed}/${expect.length} assertions`);
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed || problems.length ? 1 : 0;
