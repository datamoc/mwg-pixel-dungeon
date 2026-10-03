// Throwaway (tools/scratch): where may the pickaxe actually dig?
//
// `Hero.java` 1913 gates mining on `Dungeon.level instanceof MiningLevel` - the mining *branch*
// level, not the Caves region. This port gated it on a depth range (11-15) instead, which let the
// hero tunnel through ordinary Caves floors and, worse, through the Caves boss arena. This drives
// a real depth-11 floor and a real branch and reads the gate plus what a wall step actually does.
//
// Run after `npm run build`:  node tools/scratch/caves-mining-gate-livecheck.mjs
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

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=mining-gate', { waitUntil: 'load', timeout: 120000 });
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
	// depth 11 is a real, ported Caves floor with real WALL terrain to try the pickaxe on
	s['depth'] = 11;
	s['enterLevel']();
	await sleep(3500);

	s['bag'].add({ id: 'pickaxe', quantity: 1, identified: true });
	const withPickaxe = s['canMineCavesWall']();
	const branchFlagBefore = s['miningBranchActive'];

	// a wall with a walkable cell beside it, so the hero can be parked next to one - the spawn
	// cell of a generated floor is a room's interior, with no wall orthogonally adjacent
	const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
	let target = null;
	for (let y = 1; y < s['level'].height - 1 && !target; y++) {
		for (let x = 1; x < s['level'].width - 1 && !target; x++) {
			if (s['level'].get(x, y) !== 0) continue;   // WALL is the port's terrain code 0, not SPD's 4
			for (const [dx, dy] of dirs) {
				if (!s['level'].passable(x + dx, y + dy) || s['level'].get(x + dx, y + dy) === 0) continue;
				if (s['isChasmCell'](x + dx, y + dy)) continue;
				s['hero'].x = x + dx; s['hero'].y = y + dy;
				s['refresh']();
				target = { x, y, dx: -dx, dy: -dy };
				break;
			}
		}
	}
	await sleep(200);
	let wallStayedWall = null, dugNothing = null;
	if (target) {
		wallStayedWall = s['level'].get(target.x, target.y) === 0;
		s['takeHeroTurn']({ x: target.dx, y: target.dy });
		await sleep(300);
		dugNothing = s['level'].get(target.x, target.y) === 0;
	}

	// ...and with the branch flag on, the same gate opens and the same wall gives way
	s['miningBranchActive'] = true;
	const withBranch = s['canMineCavesWall']();
	let mined = null;
	if (target) {
		s['mineMiningWall'](target.x, target.y);
		mined = s['level'].get(target.x, target.y) !== 0;
	}
	s['miningBranchActive'] = branchFlagBefore;

	// and the gate is closed again the moment the branch is left
	const afterLeaving = s['canMineCavesWall']();
	return { withPickaxe, withBranch, afterLeaving, branchFlagBefore, foundWall: target !== null, wallStayedWall, dugNothing, mined };
});

console.log('probe results:', JSON.stringify(result, null, 1));
const expect = [
	['a pickaxe on an ordinary Caves floor does not open the gate (Java wants a MiningLevel)',
		result.withPickaxe === false && result.branchFlagBefore === false],
	['stepping into a wall there refuses, and leaves the wall standing',
		result.foundWall === true && result.wallStayedWall === true && result.dugNothing === true],
	['inside the mining branch the same gate opens', result.withBranch === true],
	['and the wall really comes down, which is what the Blacksmith quest needs',
		result.mined === true],
	['leaving the branch closes it again', result.afterLeaving === false],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
console.log(`caves mining gate livecheck: ${expect.length - failed}/${expect.length} assertions`);
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed || problems.length ? 1 : 0;
