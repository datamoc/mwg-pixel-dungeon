// Throwaway (tools/scratch): live-check the two attack() reorderings from 2026-09-12.
//
// 1. Corrupting.proc is a weapon proc, so it must evaluate its `damage >= defender.hp` guard on the
//    pre-`damage()`-override value. A Slime soft-caps every hit to `4+(...)/2` - a raw 40 becomes
//    12 - so with the slime on 20 HP Java still corrupts it, while the old order (guard after the
//    curve) could never fire. Asserted by frequency: ~55% per swing over 60 swings, so zero hits
//    would mean the guard never fires.
// 2. The execute mechanics are Java's last step, after `enemy.damage()` has applied the shield
//    pools. The Dwarf King's `DKBarrier` absorbs before HP; with it up, the old order set
//    damage = hp and then let the shield absorb all of it (king survives at full HP while the log
//    says "executed"), the new order kills it.
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
	const cell = () => {
		for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
			const x = s.hero.x + dx, y = s.hero.y + dy;
			if (s.level.inside(x, y) && s.level.passable(x, y)) return { x, y };
		}
		return null;
	};
	s.hero.damage = [40, 40];
	s.hero.str = s.hero.strReq ?? s.hero.str;
	s.hero.armor = [0, 0];

	// --- probe 1: corrupting guard sees the pre-curve damage
	const slimCell = cell();
	const slime = s.spawnMonster('slime', slimCell);
	slime.maxHp = slime.hp = 20;  // between the post-curve 12 and the raw 40
	slime.armor = [0, 0];
	slime.evasion = 0;
	s.weaponAffix = 'corrupting';
	s.weaponLevel = 20;
	let corruptions = 0;
	let deaths = 0;
	for (let i = 0; i < 60; i++) {
		slime.hp = 20;
		slime.isAlly = false;
		slime.allyKind = undefined;
		slime.buffs = {};
		slime.sleeping = true;
		s.attack(s.hero, slime);
		if (slime.isAlly) corruptions++;
		if (slime.hp <= 0) deaths++;
	}
	s.weaponAffix = undefined;

	// --- probe 2: the execute runs after the shield pools
	const kingCell = cell();
	slime.hp = 0;
	const king = s.spawnMonster('king', kingCell);
	king.maxHp = 300;
	king.hp = 100;            // 100 - 80 = 20, inside the 0.4 threshold of a rank-3 COMBINED_LETHALITY
	king.kingPhase = 1;
	king.kingShield = 1000;
	king.armor = [0, 0];
	king.evasion = 0;
	king.sleeping = true;
	s.hero.damage = [80, 80];
	const originalTalentRank = s.talentRank.bind(s);
	s.talentRank = (key) => (key === 'combined_lethality' ? 3 : originalTalentRank(key));
	s.attack(s.hero, king);
	s.talentRank = originalTalentRank;
	const kingAfter = { hp: king.hp, shield: king.kingShield, alive: king.hp > 0 };

	return { corruptions, deaths, kingAfter };
});

console.log('probe results:', JSON.stringify(result));
console.log(result.corruptions > 0
	? `PASS corrupting: ${result.corruptions}/60 hits corrupted the slime through the soft cap (guard sees the pre-curve value)`
	: 'FAIL corrupting: 0 corruptions in 60 swings - the guard is still evaluated after the damage() curve');
console.log(result.kingAfter.hp <= 0
	? `PASS execute: the King died through a 1000-point DKBarrier (hp ${result.kingAfter.hp})`
	: `FAIL execute: the King survived at hp ${result.kingAfter.hp} with shield ${result.kingAfter.shield} - the shield absorbed the execution`);
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
