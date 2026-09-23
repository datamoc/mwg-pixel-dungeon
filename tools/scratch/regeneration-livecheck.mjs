// Throwaway (tools/scratch): Regeneration + LockedFloor, driven in-page on the built game.
// Run after `npm run build`:  node tools/scratch/divine-intervention-livecheck.mjs
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
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=regen-check', { waitUntil: 'load', timeout: 120000 });
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
await page.waitForTimeout(6000);

const result = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	const h = s['hero'];
	const out = {};
	h.maxHp = 40; h.hp = 10; s['hunger'] = 0;
	s['regeneration'] = { partial: 0, lockLeft: null };
	for (let i = 0; i < 100; i++) s['spendHeroTurn'](1);
	out.after100 = h.hp;
	out.hungerAfter100 = s['hunger'];
	//Starving gate.
	h.hp = 10; s['hunger'] = 460;
	for (let i = 0; i < 30; i++) s['spendHeroTurn'](1);
	out.starvingHp = h.hp;
	//Locked floor: pretend a sealed sewer boss floor.
	s['hunger'] = 100; h.hp = 10;
	out.depth = s['depth'];
	s['depth'] = 5; s['sewerBossSealed'] = true; s['bossUnsealedDepths'].delete(5);
	s['spendHeroTurn'](1);
	out.lockAfterSeal = s['regeneration'].lockLeft;
	for (let i = 0; i < 49; i++) s['spendHeroTurn'](1);
	out.lockAfter50 = s['regeneration'].lockLeft;
	out.hpAfter50Locked = h.hp;
	out.hungerLocked = s['hunger'];
	out.regenOnAt0 = s['regenOn']();
	const hp0 = h.hp;
	for (let i = 0; i < 40; i++) s['spendHeroTurn'](1);
	out.hpGainedWhileStalled = h.hp - hp0;
	s['lockedFloorBossDamage']({ kind: 'goo', hp: 70 }, 10, 80);
	out.lockAfterGooHit = s['regeneration'].lockLeft;
	out.regenOnAfterHit = s['regenOn']();
	s['refresh']();
	return out;
});
console.log(JSON.stringify(result));
await page.screenshot({ path: 'tools/scratch/regeneration-locked-floor.png' });
const save = await page.evaluate(() => { const s = window.__MWG__.currentScene; const snap = s['saveState'] ? 'hasSave' : 'nosave'; return snap; });
console.log(save, problems.length ? problems : 'no page errors');
await browser.close();
