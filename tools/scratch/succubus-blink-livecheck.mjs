// Throwaway (tools/scratch): the Succubus's hunting blink.
//
// The fifth family matrix left blink as an open question; the Ripper pilot established
// the stateful-movement shape, so blink follows it: off cooldown, seen, unrooted and
// 3+ cells away she teleports to the hero (backing up one on an occupied landing)
// instead of stepping, free (cost 0), with a 4-6 reset; ordinary-approach turns tick
// the cooldown down.
//
// Run after `npm run build`:  node tools/scratch/succubus-blink-livecheck.mjs
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
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=succubus-blink', { waitUntil: 'load', timeout: 120000 });
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

	const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
	const hero = s['hero'];
	let spawn = null;
	const candidates = [];
	for (let y = 0; y < s['level'].height; y++) {
		for (let x = 0; x < s['level'].width; x++) {
			const d = cheb({ x, y }, hero);
			if (d >= 3 && d <= 6 && s['level'].passable(x, y) && !s['creatureAt'](x, y)) candidates.push({ x, y });
		}
	}
	if (candidates.length === 0) return { found: false };
	const from = { x: 0, y: 0 };
	for (const cell of candidates) {
		if (spawn) s['moveTo'](spawn, cell); else spawn = s['spawnMonster']('succubus', cell);
		spawn.sleeping = false;
		spawn.seesHero = true;
		spawn.blinkCooldown = 0;
		from.x = spawn.x; from.y = spawn.y;
		s['trySuccubusBlink'](spawn, cheb(spawn, hero));
		if (cheb(spawn, hero) === 1) break;
		spawn.blinkCooldown = 0;
	}
	if (!spawn || cheb(spawn, hero) > 1) return { found: false, reason: 'no blink landing' };
	const landed = {
		at: { x: spawn.x, y: spawn.y },
		from,
		adjacent: cheb(spawn, hero) === 1,
		cooldown: spawn.blinkCooldown,
		cost: s['pendingMonsterTurnCost'],
	};

	// an ordinary-approach turn ticks the cooldown and does not consume it here
	const before = spawn.blinkCooldown;
	const moved = s['trySuccubusBlink'](spawn, cheb(spawn, hero));
	const ticked = { consumed: moved, cooldown: spawn.blinkCooldown, expected: before - 1 };

	// rooted: no blink, cooldown still ticks, turn falls through to the shared mover
	spawn.blinkCooldown = 0;
	spawn.buffs['roots'] = 5;
	const rootedAt = { x: spawn.x, y: spawn.y };
	const rootedMoved = s['trySuccubusBlink'](spawn, cheb(spawn, hero));
	const rooted = {
		consumed: rootedMoved,
		cooldown: spawn.blinkCooldown,
		unmoved: spawn.x === rootedAt.x && spawn.y === rootedAt.y,
	};
	delete spawn.buffs['roots'];

	return { found: true, landed, ticked, rooted };
});
console.log('probe results:', JSON.stringify(result, null, 1));
if (result.found === false) {
	console.log('SKIP no free cell at a usable distance');
	await browser.close();
	process.exit(0);
}
const expect = [
	['the blink lands adjacent to the hero from 3+ cells away', result.landed.adjacent === true],
	['a landed blink resets a 4-6 cooldown and costs nothing',
		result.landed.cooldown >= 4 && result.landed.cooldown <= 6 && result.landed.cost === 0],
	['an ordinary-approach turn ticks the cooldown and falls through to the mover',
		result.ticked.consumed === false && result.ticked.cooldown === result.ticked.expected],
	['a rooted succubus holds still while the cooldown ticks',
		result.rooted.consumed === false && result.rooted.cooldown === -1 && result.rooted.unmoved === true],
	['no page errors', true],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
await page.screenshot({ path: 'C:/tmp/succubus-blink.png' });
console.log(`succubus blink livecheck: ${expect.length - failed}/${expect.length} assertions`);
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed || problems.length ? 1 : 0;
