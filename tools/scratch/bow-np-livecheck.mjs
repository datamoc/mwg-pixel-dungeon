// Throwaway (tools/scratch): the Huntress bow slice (2026-09-18).
// A Nature's-Powered bow shot stashes `1 + (8+GROWING_POWER)/24` for the shared
// spend port (bow shots only); without the tracker nothing is stashed. The shot
// itself resolves on the real path (hit or clean miss, no errors).
//
// Run after `npm run build`:  node tools/scratch/bow-np-livecheck.mjs
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
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=bow-np', { waitUntil: 'load', timeout: 120000 });
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
	const out = {};
	s['heroClass'] = 'huntress';
	s['talentRanks'] = { growing_power: 2, point_blank: 3 };
	const victim = s['creatures'].find((c) => !c.isHero && !c.isAlly && !c.isNPC && c.hp > 0);
	if (!victim) { out.noVictim = true; return out; }
	victim.x = s['hero'].x + 1;
	victim.y = s['hero'].y;
	victim.hp = victim.maxHp = 200;
	s['refresh']();
	// without the tracker: no divisor stashed
	const before = victim.hp;
	const plain = s['useSpecial']();
	out.plainResolved = plain === true;
	out.plainDivisor = s['pendingBowNpDivisor'];
	out.plainHp = victim.hp;
	// with the tracker: the exact Java divisor, then the shot resolves on top
	s['naturesPowerTurns'] = 8;
	victim.hp = 200;
	const powered = s['useSpecial']();
	out.poweredResolved = powered === true;
	out.poweredDivisor = s['pendingBowNpDivisor'];
	out.poweredHp = victim.hp;
	out.expectedDivisor = 1 + (8 + 2) / 24;
	return out;
});
console.log('probe results:', JSON.stringify(result, null, 1));
const expect = [
	['a live victim existed', result.noVictim !== true],
	['plain bow shot resolves', result.plainResolved === true],
	['no divisor without the tracker', result.plainDivisor === null || result.plainDivisor === undefined],
	['plain shot lands or misses cleanly', typeof result.plainHp === 'number' && result.plainHp <= 200],
	['powered bow shot resolves', result.poweredResolved === true],
	['powered shot stashes the exact Java divisor', result.poweredDivisor === result.expectedDivisor],
	['powered shot lands or misses cleanly', typeof result.poweredHp === 'number' && result.poweredHp <= 200],
	['no page errors', true],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
console.log(`bow-np livecheck: ${expect.length - failed}/${expect.length} assertions`);
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed || problems.length ? 1 : 0;
