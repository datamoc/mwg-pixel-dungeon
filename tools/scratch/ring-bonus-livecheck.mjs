// Throwaway (tools/scratch): live-check the corrected ring *bonus level*.
//
// Every ring accessor in Java reads `Ring.RingBuff.level()`/`buffedLvl()` - `soloBonus()` is
// `level + 1` for an uncursed ring and `min(0, level - 2)` for a cursed one - and
// `Ring.getBonus`/`getBuffedBonus` return 0 outright under `MagicImmune` (the AntiMagic glyph).
// This port fed every formula the raw item level instead: one level short, with no cursed clamp
// (so a cursed ring granted a bonus Java never grants) and no AntiMagic gate.
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const globalRoot = process.env.GLOBAL_NODE_MODULES ?? 'C:\\Users\\miche\\AppData\\Roaming\\npm\\node_modules';
const { chromium } = require(path.join(globalRoot, 'playwright'));

const executablePath = path.join(
	process.env.LOCALAPPDATA ?? 'C:\\Users\\miche\\AppData\\Local',
	'ms-playwright',
	'chromium-1193',
	'chrome-win',
	'chrome.exe'
);
const browser = await chromium.launch({
	executablePath,
	args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const page = await context.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`console.error: ${m.text()}`); });

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href, { waitUntil: 'load', timeout: 120000 });
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

const result = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	const hero = s.hero;
	// bring the game to a clean, ringless baseline
	for (const c of [...s.creatures]) if (!c.isHero) { c.hp = 0; s.kill(c); }
	s.equippedRing = null;
	s['ringHtBonus'] = 0;
	s.armorGlyph = undefined;
	s['syncHeroFromStats']();
	const baseCost = s['getActionTurnCostMod']();
	const baseStr = hero.str;
	const baseMaxHp = hero.maxHp;
	let probeId = 0;
	const equip = (id, level, cursed) => {
		const instanceId = `probe-${probeId++}`;
		s.bag.add({ id, quantity: 1, instanceId, identified: true, level, cursed });
		s['equipRing'](id, instanceId);
		return s.equippedRing;
	};
	// back to no ring, rebuilding the Might max-HP bookkeeping the way equipRing's own delta does
	const clear = () => {
		if (s['ringHtBonus']) {
			hero.maxHp -= s['ringHtBonus'];
			hero.hp = Math.min(hero.hp, hero.maxHp);
			s['ringHtBonus'] = 0;
		}
		s.equippedRing = null;
		s.armorGlyph = undefined;
		s['syncHeroFromStats']();
	};

	clear();
	equip('ring_haste', 0, false);
	const hastePlain = s['getActionTurnCostMod']();
	clear();
	equip('ring_haste', 3, false);
	const hastePlus3 = s['getActionTurnCostMod']();
	clear();
	equip('ring_haste', 0, true);
	const hasteCursedPlain = s['getActionTurnCostMod']();
	clear();
	equip('ring_haste', 5, true);
	const hasteCursedPlus5 = s['getActionTurnCostMod']();
	clear();
	equip('ring_might', 0, false);
	const mightStrPlain = hero.str;
	clear();
	equip('ring_might', 3, false);
	const mightStrPlus3 = hero.str;
	const mightMaxHpPlus3 = hero.maxHp;
	clear();
	equip('ring_might', 0, true);
	const mightStrCursedPlain = hero.str;
	const mightMaxHpCursedPlain = hero.maxHp;
	clear();
	// MagicImmune (AntiMagic glyph) suppresses the ring entirely
	equip('ring_haste', 3, false);
	s.armorGlyph = 'antimagic';
	s['syncHeroFromStats']();
	const hasteUnderAntiMagic = s['getActionTurnCostMod']();
	const antiMagicFlag = hero.magicImmune;
	clear();
	equip('ring_might', 3, false);
	s.armorGlyph = 'antimagic';
	s['syncHeroFromStats']();
	const mightStrUnderAntiMagic = hero.str;
	clear();

	return {
		baseCost, baseStr, baseMaxHp,
		hastePlain, hastePlus3, hasteCursedPlain, hasteCursedPlus5,
		mightStrPlain, mightStrPlus3, mightMaxHpPlus3, mightStrCursedPlain, mightMaxHpCursedPlain,
		hasteUnderAntiMagic, antiMagicFlag, mightStrUnderAntiMagic,
		expected: {
			plain: 1 / Math.pow(1.175, 1),
			plus3: 1 / Math.pow(1.175, 4),
			cursedPlain: 1 / Math.pow(1.175, -2),
			cursedPlus5: 1 / Math.pow(1.175, 0),
			mightPlus3MaxHp: baseMaxHp + Math.round(baseMaxHp * (Math.pow(1.035, 4) - 1)),
			mightCursedPlainMaxHp: baseMaxHp + Math.round(baseMaxHp * (Math.pow(1.035, -2) - 1)),
		},
	};
});

console.log('probe results:', JSON.stringify(result, null, 1));
const r = result;
const near = (a, b) => Math.abs(a - b) < 1e-9;
const expect = [
	['a plain +0 Haste ring now grants Java\'s one bonus level (1.175x)', near(r.hastePlain, r.expected.plain)],
	['a +3 ring grants level 4 (1.175^4), not 3', near(r.hastePlus3, r.expected.plus3)],
	['a cursed +0 ring is a real penalty (level -2)', near(r.hasteCursedPlain, r.expected.cursedPlain)],
	['a cursed +5 ring clamps to level 0, never a bonus', near(r.hasteCursedPlus5, r.expected.cursedPlus5)],
	['a plain Might ring adds exactly +1 STR', r.mightStrPlain === r.baseStr + 1],
	['a +3 Might ring adds +4 STR', r.mightStrPlus3 === r.baseStr + 4],
	['and raises max HP by 1.035^4', r.mightMaxHpPlus3 === r.expected.mightPlus3MaxHp],
	['a cursed Might ring docks 2 STR', r.mightStrCursedPlain === r.baseStr - 2],
	['and lowers max HP below its base', r.mightMaxHpCursedPlain === r.expected.mightCursedPlainMaxHp && r.mightMaxHpCursedPlain < r.baseMaxHp],
	['the AntiMagic glyph reports magic immunity', r.antiMagicFlag === true],
	['and suppresses a +3 Haste ring entirely', near(r.hasteUnderAntiMagic, r.baseCost)],
	['and suppresses a +3 Might ring entirely', r.mightStrUnderAntiMagic === r.baseStr],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed ? 1 : 0;
