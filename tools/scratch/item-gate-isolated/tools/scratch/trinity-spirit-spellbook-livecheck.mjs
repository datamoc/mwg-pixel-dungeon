// Throwaway (tools/scratch): live-verify Trinity SpiritForm's UnstableSpellbook case.
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

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=trinity-spirit', { waitUntil: 'load', timeout: 120000 });
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
	s['talentRanks']['spirit_form'] = 3;
	s['armorCharge'] = 60;
	const out = {};
	out.beforeCharge = s['armorCharge'];
	const before = { hp: s['hero'].hp, invisible: s['hero'].buffs['invisibility'] };
	s['hero'].buffs['invisibility'] = 5;
	// direct call, bypassing the two-level UI picker (already covered by the source-level pin)
	let drawn = null;
	const origApply = window.__MWG_DEBUG_APPLY__;
	const orig = s['commitTrinitySpiritSpellbook'].bind(s);
	// monkeypatch randomSpellbookScroll indirectly by wrapping armorCharge setter is hard; just call and inspect say log instead
	s['commitTrinitySpiritSpellbook'](25);
	out.afterCharge = s['armorCharge'];
	out.sayLogTail = (s['messageLog'] ?? s['log'] ?? []).slice?.(-3) ?? null;
	out.chargeSpent = out.beforeCharge - out.afterCharge;
	out.invisibilityDispelled = s['hero'].buffs['invisibility'] === undefined;
	// magicImmune refusal
	s['hero'].magicImmune = true;
	const chargeBeforeRefusal = s['armorCharge'];
	s['commitTrinitySpiritSpellbook'](25);
	out.magicImmuneRefused = s['armorCharge'] === chargeBeforeRefusal;
	s['hero'].magicImmune = false;
	// low-charge refusal
	s['armorCharge'] = 1;
	s['commitTrinitySpiritSpellbook'](25);
	out.lowChargeRefused = s['armorCharge'] === 1;
	return out;
});
console.log(JSON.stringify(result, null, 1));
await browser.close();
