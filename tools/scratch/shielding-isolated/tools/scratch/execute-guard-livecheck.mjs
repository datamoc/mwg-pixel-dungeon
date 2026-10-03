// Throwaway (tools/scratch): the execute `isAlive` guard. With rank-3 Combined
// Lethality, a plain killing blow must NOT report an execution: the old code clamped
// `damage = defender.hp` (final HP exactly 0 plus the execute line), the fixed code
// lets overkill through (final HP negative, kill path only).
//
// Run after `npm run build`:  node tools/scratch/execute-guard-livecheck.mjs
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
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=execute-guard', { waitUntil: 'load', timeout: 120000 });
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
	s['heroClass'] = 'rogue';
	s['talentRanks'] = { combined_lethality: 3 };
	//any live non-boss mob; 1 HP so the first landed hit is lethal outright
	const victim = s['creatures'].find((c) => !c.isHero && !c.isAlly && !c.isNPC && c.hp > 0 && !c.boss && !c.miniboss);
	if (!victim) { out.noVictim = true; return out; }
	out.victimKind = victim.kind;
	victim.hp = 1;
	victim.maxHp = Math.max(victim.maxHp, 30);
	let swings = 0;
	while (victim.hp > 0 && swings < 12) {
		//stand the hero next to the victim so the swing can land
		s['hero'].x = victim.x + 1;
		s['hero'].y = victim.y;
		s['attack'](s['hero'], victim);
		swings++;
	}
	out.swings = swings;
	out.finalHp = victim.hp;
	return out;
});
console.log('probe results:', JSON.stringify(result, null, 1));
const expect = [
	['a live victim existed', result.noVictim !== true],
	['the lethal hit landed', typeof result.finalHp === 'number' && result.finalHp <= 0],
	['no execution clamps overkill to exactly 0 (HP goes negative)', typeof result.finalHp === 'number' && result.finalHp < 0],
	['no page errors', true],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
console.log(`execute-guard livecheck: ${expect.length - failed}/${expect.length} assertions`);
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed || problems.length ? 1 : 0;
