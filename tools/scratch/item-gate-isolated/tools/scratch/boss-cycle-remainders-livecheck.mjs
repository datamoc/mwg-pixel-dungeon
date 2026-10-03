// Throwaway (tools/scratch): verify the boss-cycle close-out (2026-09-18) live:
// King P1->P2 teleports onto CITY_THRONE, P3 latches the bar bleed, Yog's aim turn
// spends the gated cost + interrupts travel, and the last fist opens P5 with the latch.
//
// Run after `npm run build`:  node tools/scratch/boss-cycle-remainders-livecheck.mjs
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
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=boss-cycle-remainders', { waitUntil: 'load', timeout: 120000 });
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
	const out = {};

	// --- Dwarf King, depth 20 ---
	s['depth'] = 20;
	s['enterLevel']();
	await sleep(4000);
	const king = s['creatures'].find((c) => c.kind === 'king');
	if (!king) { out.kingMissing = true; return out; }
	king.hp = 10;
	s['takeKingTurn'](king);
	out.kingPhase2 = king.kingPhase;
	out.kingAtThrone = [king.x, king.y];
	//P2 opens with a full-HP shield, but the same turn's wave chips it (`KingDamager`
	//HT/12 per batch), so live it reads back lower - the functional check is a live shield.
	out.kingShieldLive = king.kingShield;
	king.kingShield = 0;
	s['takeKingTurn'](king);
	out.kingPhase3 = king.kingPhase;
	out.kingBleedLatched = s['bossBleedLatched'] === true;

	// --- Yog-Dzewa, depth 25 (Yog rises on the seal, not on entry: walk the hero
	// off the entrance first, exactly what `checkHallsBossSeal` gates on) ---
	s['depth'] = 25;
	s['enterLevel']();
	await sleep(4000);
	s['hero'].x = Math.floor(s['level'].width / 2);
	s['hero'].y = Math.floor(s['level'].height / 2);
	s['checkHallsBossSeal']();
	await sleep(1000);
	const yog = s['creatures'].find((c) => c.kind === 'yog');
	if (!yog) { out.yogMissing = true; return out; }
	yog.yogPhase = 1;
	yog.yogBeamCd = 0;
	yog.yogTargeted = [];
	s['travelTarget'] = { x: 1, y: 1 };
	s['takeYogTurn'](yog);
	out.yogAimed = (yog.yogTargeted ?? []).length;
	out.yogAimCost = s['pendingMonsterTurnCost'];
	out.yogInterrupted = s['travelTarget'] === null || s['travelTarget'] === undefined;

	// last fist opens P5 with the bleed latch
	yog.yogPhase = 4;
	s['summonFist'](yog);
	const fist = s['creatures'].find((c) => c.kind === 'yogFist' && c.hp > 0);
	if (!fist) { out.fistMissing = true; return out; }
	s['kill'](fist, 'foe');
	out.yogPhase5 = yog.yogPhase;
	out.yogBurstDebt = yog.yogSummonCd;
	out.yogBleedLatched = s['bossBleedLatched'] === true;
	return out;
});
console.log('probe results:', JSON.stringify(result, null, 1));
const expect = [
	['king enters phase 2 on the forced turn', result.kingPhase2 === 2],
	['king teleports onto CITY_THRONE (7,31)', Array.isArray(result.kingAtThrone) && result.kingAtThrone[0] === 7 && result.kingAtThrone[1] === 31],
	['king opens P2 with a live shield (the wave chips it same turn)', typeof result.kingShieldLive === 'number' && result.kingShieldLive > 0 && result.kingShieldLive <= 300],
	['king enters phase 3 at shield zero', result.kingPhase3 === 3],
	['phase 3 latches the bar bleed', result.kingBleedLatched === true],
	['yog aim paints at least one target cell', typeof result.yogAimed === 'number' && result.yogAimed >= 1],
	['yog aim spends a gated 1-3 turn cost', typeof result.yogAimCost === 'number' && result.yogAimCost >= 1 && result.yogAimCost <= 3],
	['yog aim interrupts auto-travel', result.yogInterrupted === true],
	['last fist opens phase 5', result.yogPhase5 === 5],
	['phase 5 opens with the -15 summon burst debt', result.yogBurstDebt === -15],
	['phase 5 latches the bar bleed', result.yogBleedLatched === true],
	['no page errors', true],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
console.log(`boss-cycle-remainders livecheck: ${expect.length - failed}/${expect.length} assertions`);
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed || problems.length ? 1 : 0;
