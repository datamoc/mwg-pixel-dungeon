// Throwaway (tools/scratch): the King's throne room, live - is it Java's own diamond on screen?
//
// `CityBossLevel.build()` carves the arena with `Painter.fillDiamond(this, arena, 1, EMPTY)`.
// This port had transcribed that as an *ellipse* - a different shape with a different walkable
// set (a diamond is a 45-degree square, so its corners are wall). This drives a real depth-20
// floor and checks the live terrain against Java's shape, then runs the King's own phase
// machine over it to be sure the narrower room still supports the fight.
//
// Run after `npm run build`:  node tools/scratch/city-arena-livecheck.mjs
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

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=city-arena', { waitUntil: 'load', timeout: 120000 });
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
	s['depth'] = 20;
	s['enterLevel']();
	await sleep(3500);

	const W = s['level'].width;
	// The port's coarse game kind maps Java's CHASM to `floor` too, so `level.passable()` cannot
	// answer this question - chasm-ness lives in the raw ported paint, which is what the floor was
	// generated from. Compare there, and confirm the scene's own predicate agrees.
	const raw = s['portedPaint'].map;
	const walkable = (x, y) => raw[y * W + x] !== 0;   // Terrain.CHASM is 0
	// Java's `fillDiamond(Rect(1,25,14,38), 1)`: 11x11 at (2,26), rows growing 3,5,7,9,11 wide and
	// stacking 11,9,7,5,3 tall - a rhombus, so the bounding rect's corners are solid wall.
	const expected = [];
	{
		let diamondWidth = 11 - (11 - 2 - (11 % 2));
		diamondWidth = Math.max(diamondWidth, 11 % 2 === 0 ? 2 : 3);
		for (let i = 0; i <= 11; i++) {
			for (let dy = 0; dy < 11 - 2 * i; dy++) {
				for (let dx = 0; dx < diamondWidth; dx++) expected.push({ x: 2 + Math.floor((11 - diamondWidth) / 2) + dx, y: 26 + i + dy });
			}
			diamondWidth += 2;
			if (diamondWidth > 11) break;
		}
	}
	// Java's `fillDiamond` paints concentric *rectangles*, so the rhombus is their union: 81 cells
	// here, not the 205 the rectangles add up to.
	const expectedSet = new Set(expected.map((c) => c.y * W + c.x));
	const missing = expected.filter((c) => !walkable(c.x, c.y)).length;
	// every walkable cell in the rhombus's own bounding rows must be one of them. Rows 37+ are the
	// separate entrance room below the arena (`entry = Rect(1,37,14,48)`), so they are out of scope.
	let extra = 0;
	for (let y = 26; y <= 36; y++) {
		for (let x = 2; x <= 12; x++) {
			if (walkable(x, y) && !expectedSet.has(y * W + x)) extra++;
		}
	}
	const corners = [[2, 26], [12, 26], [2, 36], [12, 36]].map(([x, y]) => walkable(x, y));
	const sceneAgrees = s['isChasmCell'](2, 26) === true && s['isChasmCell'](7, 31) === false;
	const probes = {
		missing,
		extra,
		expectedCount: expectedSet.size,
		corners,
		centreWalkable: walkable(7, 31),
		throneDoor: { locked: s['doors'].isLocked(7, 25), isDoor: s['doors'].isDoor(7, 25) },
		entrance: { x: s['hero'].x, y: s['hero'].y },
		sceneAgrees,
	};

	// the King himself, and his own phase machine, over the new room
	const king = s['spawnMonster']('king', { x: 7, y: 31 });
	probes.kingSpawned = s['creatures'].some((c) => c.kind === 'king' && c.hp > 0);
	king.hp = Math.floor(king.maxHp / 2);
	s['takeKingTurn'](king);
	await sleep(300);
	probes.phaseAfterHalfHp = king.kingPhase ?? null;
	const gateBefore = s['creatures'].some((c) => c.kind === 'king' && c.hp > 0);
	probes.kingAlive = gateBefore;
	return probes;
});

console.log('probe results:', JSON.stringify(result, null, 1));
const expect = [
	['every cell of Java\'s diamond is walkable on the live floor',
		result.missing === 0 && result.expectedCount === 81],
	['nothing else in the arena\'s rows is - the shape is a diamond, not the ellipse it was',
		result.extra === 0],
	['so the four corners of its bounding rect are solid, and the centre is floor',
		result.corners.every((w) => w === false) && result.centreWalkable === true],
	['and the scene\'s own chasm predicate agrees about both',
		result.sceneAgrees === true],
	['the King\'s own throne door and the entrance cell are where Java puts them',
		result.throneDoor.isDoor === true && result.entrance.y === 44],
	['and the King still spawns and takes a turn over the narrower room',
		result.kingSpawned === true && result.kingAlive === true],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
console.log(`city arena livecheck: ${expect.length - failed}/${expect.length} assertions`);
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed || problems.length ? 1 : 0;
