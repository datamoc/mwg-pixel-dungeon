// Throwaway (tools/scratch): live-verify Trinity SpiritForm's ring FALLBACK across real formula
// sites - the equipped ring wins per-stat when its own bonus is nonzero, the spirit ring only
// fills in when the equipped one is 0 or absent, and two different stats both apply at once.
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

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=trinity-ring-formula', { waitUntil: 'load', timeout: 120000 });
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
	const heroStrBase = s['heroStr'];

	// 1) No equipped ring at all: spirit Might should still apply (fallback with nothing to beat).
	s['equippedRing'] = null;
	s['armorCharge'] = 60;
	s['commitTrinitySpiritRing']('ring_might', 25);
	s['syncHeroFromStats']();
	out.spiritOnlyMight = { str: s['hero'].str, expectedBonus: s['talentRanks']['spirit_form'] + 1 };

	// 2) Equipped Might ring present (nonzero bonus): equipped wins, spirit Might is masked.
	s['trinityForm'] = null; s['trinityTurns'] = 0; s['trinitySpiritEffect'] = null;
	s['equippedRing'] = { id: 'ring_might', level: 5, cursed: false };
	s['armorCharge'] = 60;
	s['commitTrinitySpiritRing']('ring_might', 25);
	s['syncHeroFromStats']();
	out.equippedWinsOverSpirit = { str: s['hero'].str, expectedBonus: 6 };

	// 3) Equipped ring of a DIFFERENT stat (Wealth) + spirit Might: both apply independently.
	s['trinityForm'] = null; s['trinityTurns'] = 0; s['trinitySpiritEffect'] = null;
	s['equippedRing'] = { id: 'ring_wealth', level: 1, cursed: false };
	s['armorCharge'] = 60;
	s['commitTrinitySpiritRing']('ring_might', 25);
	s['syncHeroFromStats']();
	out.differentStatsBothApply = { str: s['hero'].str, expectedBonus: s['talentRanks']['spirit_form'] + 1 };

	// 4) Accuracy/Evasion via the StatBlock path, spirit-only (no equipped ring).
	s['trinityForm'] = null; s['trinityTurns'] = 0; s['trinitySpiritEffect'] = null;
	s['equippedRing'] = null;
	s['armorCharge'] = 60;
	s['commitTrinitySpiritRing']('ring_evasion', 25);
	out.spiritEvasionApplied = s['hero'].evasion;

	out.heroStrBase = heroStrBase;
	return out;
});
console.log(JSON.stringify(result, null, 1));
await browser.close();
