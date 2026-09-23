// Throwaway (tools/scratch): Chains/Beacon/Hourglass passive recharge, driven in-page on the built game.
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
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=artifact-recharge-check', { waitUntil: 'load', timeout: 120000 });
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
const result = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	s['bag'].add({ id: 'chains', quantity: 1, identified: true, level: 0, charge: 0, partialCharge: 0 });
	s['bag'].add({ id: 'beacon', quantity: 1, identified: true, level: 0, charge: 0, partialCharge: 0 });
	s['bag'].add({ id: 'hourglass', quantity: 1, identified: true, level: 0, charges: 0, partialCharge: 0 });
	s['hero'].maxHp = 999; s['hero'].hp = 999;
	const read = () => ({ chains: s['bag'].find('chains').charge, beacon: s['beaconArtifactItem']()?.charge, hourglass: s['bag'].find('hourglass').charges });
	const before = read();
	for (let i = 0; i < 80; i++) { s['hunger'] = 0; s['spendHeroTurn'](1); }
	const after80 = read();
	s['depth'] = 5; s['sewerBossSealed'] = true; s['bossUnsealedDepths'].delete(5);
	for (let i = 0; i < 60; i++) { s['hunger'] = 0; s['spendHeroTurn'](1); }
	const lockedMid = read();
	for (let i = 0; i < 80; i++) { s['hunger'] = 0; s['spendHeroTurn'](1); }
	return { before, after80, lockedMid, lockedAfter80More: read(), lockLeft: s['regeneration'].lockLeft };
});
console.log(JSON.stringify(result));
console.log(problems.length ? problems : 'no page errors');
await browser.close();
