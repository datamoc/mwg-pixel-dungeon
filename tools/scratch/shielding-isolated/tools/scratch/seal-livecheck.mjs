// Throwaway (tools/scratch): live-verify the Warrior's BrokenSeal shield: activation at half HP, cooldown, idle drop, Lethal Defense.
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

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=combo', { waitUntil: 'load', timeout: 120000 });
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
	const hero = s['hero'];
	const out = {};
	s['creatures'].splice(0, s['creatures'].length, hero);
	s['armorSealed'] = true; s['armorTier'] = 2;
	const talents = { iron_will: 1, lethal_defense: 0 };
	s['talentRank'] = (n) => talents[n] ?? 0;
	const reset = () => { s['sealBarrier'].clear(); s['sealState'] = { cooldown: 0, turnsSinceEnemies: 0, initialShield: 0 }; hero.hp = hero.maxHp = 20; };
	// a hit that stays above half HP does nothing
	reset();
	let taken = s['absorbHeroDamage'](5);
	out.aboveHalf = { taken, shield: s['sealBarrier'].total, cooldown: s['sealState'].cooldown };
	// a hit that would bring HP to <= half activates the seal first (3 + 2*2 + 1 = 8), which absorbs it
	reset(); hero.hp = 15;
	taken = s['absorbHeroDamage'](6);
	out.activates = { taken, shieldLeft: s['sealBarrier'].total, cooldown: s['sealState'].cooldown, initial: s['sealState'].initialShield };
	// on cooldown a second low-HP hit does not re-activate
	s['sealBarrier'].clear(); hero.hp = 8;
	taken = s['absorbHeroDamage'](3);
	out.coolingDown = { taken, shield: s['sealBarrier'].total, cooldown: s['sealState'].cooldown };
	// five quiet turns with shield up drop it and refund cooldown
	reset(); hero.hp = 8; s['absorbHeroDamage'](1);
	const shieldUp = s['sealBarrier'].total; const cd0 = s['sealState'].cooldown;
	for (let i = 0; i < 5; i++) s['spendHeroTurn'](1);
	out.idleDrop = { shieldUp, shieldAfter: s['sealBarrier'].total, cooldownBefore: cd0, cooldownAfter: s['sealState'].cooldown };
	// no regrowth: nothing accrues on its own
	reset();
	for (let i = 0; i < 90; i++) s['spendHeroTurn'](1);
	out.noRegrowth = { shield: s['sealBarrier'].total };
	// lethal defense: a combo finisher kill refunds rank/3 of the cooldown
	reset(); s['sealState'].cooldown = 120; talents.lethal_defense = 3;
	s['comboLethalDefense']();
	out.lethalDefense = { cooldown: s['sealState'].cooldown };
	return out;
});
console.log(JSON.stringify(result, null, 1));
await browser.close();
