// Throwaway (tools/scratch): `HallsBossLevel.seal()`, live - does Yog rise on approach?
//
// Java's seal runs when the hero walks two cells from the entrance (`occupyCell`): the
// entrance tile becomes `EMPTY_SP` floor, and Yog-Dzewa himself is created at
// `exit() + width*3`, shoving any occupant to a free 8-neighbour. This port spawned Yog on
// floor entry instead; the check drives a real depth-25 floor and looks at the trigger, the
// tile, the spawn cell, and the push-aside.
//
// Run after `npm run build`:  node tools/scratch/halls-seal-livecheck.mjs
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

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=halls-seal', { waitUntil: 'load', timeout: 120000 });
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
	s['depth'] = 25;
	s['enterLevel']();
	await sleep(3000);   // the interlevel curtain owns `awaitingInput` until it finishes

	const width = s['level'].width;
	const entrance = s['entranceCell'];
	const cell = (x, y) => y * width + x;
	const bossPosOf = () => {
		const exitCell = s['portedPaint'].map.indexOf(8);
		return { x: exitCell % width, y: Math.floor(exitCell / width) + 3 };
	};
	const before = {
		entrance,
		terrain: s['level'].get(entrance.x, entrance.y),
		paint: s['portedPaint'].map[cell(entrance.x, entrance.y)],
		frame: s['terrainFrameAt'](entrance.x, entrance.y),
		passable: s['level'].passable(entrance.x, entrance.y),
		heroAtEntrance: s['hero'].x === entrance.x && s['hero'].y === entrance.y,
		yog: (s['creatures'] ?? []).some((c) => c.kind === 'yog' && c.hp > 0),
		sealed: s['hallsBossSealed'],
	};
	// Java's trigger is distance-based, so standing on the entrance must not seal: call the
	// check with the hero still there and confirm nothing happens before the real approach
	s['checkHallsBossSeal']();
	const atEntrance = { sealed: s['hallsBossSealed'], yog: s['creatures'].some((c) => c.kind === 'yog' && c.hp > 0) };
	// park a rat on the exact cell Java's `exit() + width*3` resolves to, so the push-aside
	// branch has something to move - the seal happens while the hero walks in in real play
	const bossPos = bossPosOf();
	s['spawnMonster']('rat', { x: bossPos.x, y: bossPos.y });
	// two cells east along the entry arm, still inside it - this is the approach Java seals on
	s['hero'].x = entrance.x + 2; s['hero'].y = entrance.y;
	s['refresh']();
	await sleep(300);
	s['checkHallsBossSeal']();
	await sleep(400);

	const rat = s['creatures'].find((c) => c.kind === 'rat');
	const yog = s['creatures'].find((c) => c.kind === 'yog' && c.hp > 0);
	const after = {
		terrain: s['level'].get(entrance.x, entrance.y),
		paint: s['portedPaint'].map[cell(entrance.x, entrance.y)],
		frame: s['terrainFrameAt'](entrance.x, entrance.y),
		passable: s['level'].passable(entrance.x, entrance.y),
		rat: rat ? { x: rat.x, y: rat.y } : null,
		yog: yog ? { x: yog.x, y: yog.y } : null,
		bossPos,
		sealed: s['hallsBossSealed'],
	};
	const stepIntoTerrain = s['canStepOnto'](entrance.x, entrance.y);
	// migration: a run saved before the seal existed arrives with a live entry-spawned Yog
	// and no flag - staging exactly that must not double him
	s['hallsBossSealed'] = false;
	const yogCountBefore = s['creatures'].filter((c) => c.kind === 'yog' && c.hp > 0).length;
	s['checkHallsBossSeal']();
	const migration = {
		sealed: s['hallsBossSealed'],
		yogCount: s['creatures'].filter((c) => c.kind === 'yog' && c.hp > 0).length,
		yogCountBefore,
	};
	return { before, atEntrance, after, stepIntoTerrain, migration };
});

console.log('probe results:', JSON.stringify(sealed, null, 1));
const { before, atEntrance, after, migration } = sealed;
const expect = [
	['the hero arrives on the floor\'s entrance cell, walkable and drawn as one',
		before.terrain === 1 && before.paint === 7 && before.frame === 16 && before.passable === true && before.heroAtEntrance === true],
	['and Yog is nowhere yet - the seal owns his spawn, not floor entry',
		before.yog === false && before.sealed === false],
	['standing on the entrance seals nothing (Java needs distance >= 2)',
		atEntrance.sealed === false && atEntrance.yog === false],
	['two cells in, the seal latches and the entrance becomes `EMPTY_SP` floor art',
		after.sealed === true && after.paint === 14 && after.frame !== 16],
	['while the live map stays walkable floor through the scene\'s own step rule too',
		after.terrain === 1 && after.passable === true && sealed.stepIntoTerrain === true],
	['Yog rises at Java\'s `exit() + width*3`, not the room centre approximation',
		after.yog !== null && after.yog.x === after.bossPos.x && after.yog.y === after.bossPos.y],
	['and the rat parked there was shoved off, not stacked under him',
		after.rat !== null && !(after.rat.x === after.bossPos.x && after.rat.y === after.bossPos.y)],
	['a pre-seal save\'s live Yog with no flag spawns no second Yog',
		migration.sealed === false && migration.yogCount === migration.yogCountBefore && migration.yogCount === 1],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
console.log(`halls seal livecheck: ${expect.length - failed}/${expect.length} assertions`);
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed || problems.length ? 1 : 0;
