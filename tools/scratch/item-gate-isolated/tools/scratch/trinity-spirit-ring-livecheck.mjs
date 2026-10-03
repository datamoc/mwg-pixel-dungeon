// Throwaway (tools/scratch): live-verify Trinity SpiritForm's Ring branch (state/expiry only -
// the ring-formula call sites themselves are a separate, larger slice, not yet wired).
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const globalRoot = process.env.GLOBAL_NODE_MODULES ?? 'C:\\Users\\miche\\AppData\\Roaming\\npm\\node_modules';
const { chromium } = require(path.join(globalRoot, 'playwright'));
const executablePath = path.join(process.env.LOCALAPPDATA ?? 'C:\\Users\\miche\\AppData\\Local', 'ms-playwright', 'chromium-1193', 'chrome-win', 'chrome.exe');
const browser = await chromium.launch({ executablePath, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 1024, height: 768 } })).newPage();
page.on('pageerror', (e) => console.log('pageerror:', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('console.error:', m.text()); });

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=trinity-ring', { waitUntil: 'load', timeout: 120000 });
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
	s['heroClass'] = 'cleric';
	s['talentRanks']['spirit_form'] = 2;
	s['armorCharge'] = 60;
	const out = {};

	s['commitTrinitySpiritRing']('ring_might', 25);
	out.armed = { form: s['trinityForm'], turns: s['trinityTurns'], effect: s['trinitySpiritEffect'] };
	out.chargeSpent = 60 - s['armorCharge'];
	out.ringReader = s['trinitySpiritRing']();

	// Duplicate-equipped refusal.
	s['equippedRing'] = { id: 'ring_haste', level: 1 };
	s['trinityForm'] = null; s['trinityTurns'] = 0; s['trinitySpiritEffect'] = null;
	s['armorCharge'] = 60;
	s['commitTrinitySpiritRing']('ring_haste', 25);
	out.duplicateRefused = s['trinityForm'] === null && s['armorCharge'] === 60;

	// Expiry via real turn resolution (spendHeroTurn drives the same tick the dungeon loop uses).
	s['commitTrinitySpiritRing']('ring_might', 25);
	for (let i = 0; i < 20; i++) s['spendHeroTurn'](1);
	out.afterTwentyTurns = { form: s['trinityForm'], turns: s['trinityTurns'], effect: s['trinitySpiritEffect'], reader: s['trinitySpiritRing']() };
	return out;
});
console.log(JSON.stringify(result, null, 1));
await browser.close();
