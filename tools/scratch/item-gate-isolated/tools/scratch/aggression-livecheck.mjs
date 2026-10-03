// Throwaway (tools/scratch): live-check the StoneOfAggression duration rule.
//
// Java (`StoneOfAggression.activate`, v3.3.8 line 49) gives `Aggression.DURATION / 4` (5 turns)
// only to a BOSS or MINIBOSS target and the full 20 to everyone else. The port used to shorten
// *any* non-ally to 5, i.e. 4x too short for every ordinary enemy - and never reached 20 at all,
// since this call site can only target an enemy.
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

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href, { waitUntil: 'load', timeout: 120000 });
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

const result = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	const cell = () => {
		for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
			const x = s.hero.x + dx, y = s.hero.y + dy;
			if (s.level.inside(x, y) && s.level.passable(x, y)) return { x, y };
		}
		return null;
	};
	const mark = (kind) => {
		const at = cell();
		const mob = s.spawnMonster(kind, at);
		mob.sleeping = false;
		s.bag.add({ id: 'stoneOfAggression', quantity: 1, identified: true });
		s['useStoneOfAggression']();
		const marked = { kind, duration: mob.buffs.aggression, isAlly: mob.isAlly, boss: mob.boss, miniboss: mob.miniboss };
		mob.hp = 0;
		s.kill(mob);
		return marked;
	};
	return { rat: mark('rat'), crab: mark('greatCrab'), goo: mark('goo'), pylon: mark('pylon') };
});

console.log('probe results:', JSON.stringify(result, null, 1));
const checks = [
	['rat (ordinary enemy)', result.rat, 20],
	['greatCrab (Java MINIBOSS)', result.crab, 5],
	['goo (Java BOSS)', result.goo, 5],
	['pylon (Java MINIBOSS)', result.pylon, 5],
];
let failed = 0;
for (const [label, marked, expected] of checks) {
	if (marked.duration === expected) console.log(`PASS ${label}: ${marked.duration} turns (miniboss=${marked.miniboss} boss=${marked.boss})`);
	else {
		failed++;
		console.log(`FAIL ${label}: got ${marked.duration}, expected ${expected} (miniboss=${marked.miniboss} boss=${marked.boss})`);
	}
}
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
