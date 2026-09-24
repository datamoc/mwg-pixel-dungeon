// Throwaway (tools/scratch): live-verify the Berserker's Berserk rage: build, fade, berserk shield, recovery, Deathless Fury.
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
	s['subclass'] = () => 'berserker'; s['armorSealed'] = true;
	const talents = { endless_rage: 0, deathless_fury: 0, enraged_catalyst: 0 };
	s['talentRank'] = (n) => talents[n] ?? 0;
	const fresh = () => { s['rageState'] = { mode: 'normal', power: 0, powerLossBuffer: 0, levelRecovery: 0, turnRecovery: 0, zeroHp: false }; s['rageBarrier'].clear(); s['sealBarrier'].clear(); s['sealState'] = { cooldown: 999, turnsSinceEnemies: 0, initialShield: 0 }; hero.hp = hero.maxHp = 40; hero.buffs = {}; s['rageSync'](); };
	fresh(); s['rageOnDamage'](20);
	out.built = { power: s['rageState'].power, buff: hero.buffs.berserk, heroPower: hero.berserkPower, grace: s['rageState'].powerLossBuffer };
	for (let i = 0; i < 3; i++) s['rageTurn']();
	const afterGrace = s['rageState'].power;
	s['rageTurn']();
	out.fade = { afterGrace, afterOneFade: s['rageState'].power };
	fresh(); s['rageOnDamage'](160);
	out.atFull = { power: s['rageState'].power };
	s['rageAction']();
	out.berserking = { mode: s['rageState'].mode, shield: s['rageBarrier'].total, turnRecovery: s['rageState'].turnRecovery, power: s['rageState'].power };
	const before = s['rageBarrier'].total; s['rageTurn'](); const drained = before - s['rageBarrier'].total;
	s['rageOnDamage'](10);
	out.whileBerserk = { drained, powerUnchanged: s['rageState'].power };
	s['rageBarrier'].clear(); s['rageTurn']();
	out.recovering = { mode: s['rageState'].mode, power: s['rageState'].power, turns: s['rageState'].turnRecovery };
	fresh(); s['rageOnDamage'](160); s['armorSealed'] = false; s['rageAction'](); s['armorSealed'] = true;
	out.noSeal = { mode: s['rageState'].mode };
	fresh(); talents.deathless_fury = 2; s['rageOnDamage'](160); hero.hp = 3;
	const taken = s['absorbHeroDamage'](50);
	out.deathless = { taken, hp: hero.hp, mode: s['rageState'].mode, zeroHp: s['rageState'].zeroHp, shield: s['rageBarrier'].total, levelRecovery: s['rageState'].levelRecovery };
	s['rageOnExperience'](1); out.afterXp1 = s['rageState'].levelRecovery;
	fresh(); talents.deathless_fury = 0; s['rageOnDamage'](160); hero.hp = 3;
	out.noTalent = { survives: s['rageSurvivesDeath']() };
	return out;
});
console.log(JSON.stringify(result, null, 1));
await browser.close();
