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
	const out = {};
	// Hourglass: bubble of artifactLevel(6)+1 armed, one absorbed by the cast itself.
	s['armorCharge'] = 90; s['timeBubbleTurns'] = 0;
	s['commitTrinitySpiritArtifact'](25, 'TimekeepersHourglass', 'h', () => s['trinitySpiritHourglass'](), true);
	out.hourglass = { bubble: s['timeBubbleTurns'], freeze: s['hourglassFreeze'], spent: +(90 - s['armorCharge']).toFixed(1) };
	s['timeBubbleTurns'] = 0;
	// Rose: an allied wraith with HP 20+8*6 = 68 next to the hero.
	s['armorCharge'] = 90;
	const before = s['creatures'].length;
	s['commitTrinitySpiritArtifact'](25, 'DriedRose', 'r', () => s['trinitySpiritRose'](), true);
	const w = s['creatures'].find((c) => c.kind === 'wraith' && c.isAlly);
	out.rose = { added: s['creatures'].length - before, ally: !!w, hp: w?.hp, maxHp: w?.maxHp, spent: +(90 - s['armorCharge']).toFixed(1) };
	// Horn: hunger drops by STARVING/5 (90), a meal turn spent, 25 armor charge.
	s['armorCharge'] = 90; s['hunger'] = 200;
	s['commitTrinitySpiritArtifact'](25, 'HornOfPlenty', 'horn', () => s['trinitySpiritHorn'](), false);
	out.horn = { hunger: s['hunger'], spent: +(90 - s['armorCharge']).toFixed(1) };
	// MagicImmune and low charge refuse.
	s['armorCharge'] = 90; s['hero'].magicImmune = true; s['commitTrinitySpiritArtifact'](25, 'DriedRose', 'r', () => {}, true);
	out.magicImmuneRefused = s['armorCharge'] === 90;
	s['hero'].magicImmune = false; s['armorCharge'] = 10; s['commitTrinitySpiritArtifact'](25, 'DriedRose', 'r', () => {}, true);
	out.lowChargeRefused = s['armorCharge'] >= 9.9;
	return out;
});
console.log(JSON.stringify(result, null, 1));
await browser.close();
