// Throwaway (tools/scratch): live-check the execute mechanics' boss/miniboss handling.
//
// Java's two execute mechanics differ in one way that needs no Preparation model:
// `CombinedLethality` excludes BOSS/MINIBOSS outright (Char.java 543-545), while the Assassin's
// `Preparation.canKO` still allows them at a fifth of its threshold (Preparation.java). Both are
// now reproduced; this probe pins them on the built game.
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
	s.hero.damage = [10, 10];
	s.hero.str = s.hero.strReq ?? s.hero.str;
	const cell = () => {
		for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
			const x = s.hero.x + dx, y = s.hero.y + dy;
			if (s.level.inside(x, y) && s.level.passable(x, y)) return { x, y };
		}
		return null;
	};
	const originalTalentRank = s.talentRank.bind(s);
	const originalSubclass = s.subclass.bind(s);
	// rank 3 COMBINED_LETHALITY = Java's 0.4*points/3 = 0.4 threshold; rank 3 ENHANCED_LETHALITY
	// through the port's Assassin stand-in = 0.2*3 = 0.6, so 0.6/5 = 0.12 on a boss
	s.talentRank = (key) => (key === 'combined_lethality' ? 3 : key === 'enhanced_lethality' ? 3 : originalTalentRank(key));

	const strike = (kind, hp, { assassin = false } = {}) => {
		s.subclass = () => (assassin ? 'assassin' : originalSubclass());
		const at = cell();
		const mob = s.spawnMonster(kind, at);
		mob.maxHp = 1000;   // so 100 is 10% and 400 is 40% of max
		mob.hp = hp;
		mob.armor = [0, 0];
		mob.evasion = 0;
		mob.sleeping = true;
		s.attack(s.hero, mob);
		return { kind, startHp: hp, endHp: mob.hp, died: mob.hp <= 0, boss: mob.boss, miniboss: mob.miniboss };
	};

	return {
		// 40% of max: inside COMBINED_LETHALITY's 0.4 - an ordinary mob dies, a boss/miniboss does not
		rat: strike('rat', 400),
		crab: strike('greatCrab', 400),
		goo: strike('goo', 400),
		// Assassin at a fifth: 12% of max. A boss at 40% survives; at 10% it does not.
		assassinBossHigh: strike('goo', 400, { assassin: true }),
		assassinBossLow: strike('goo', 100, { assassin: true }),
	};
});

console.log('probe results:', JSON.stringify(result, null, 1));
const expect = [
	['rat at 40% executes (CombinedLethality)', result.rat.died, true],
	['GreatCrab (MINIBOSS) at 40% survives', result.crab.died, false],
	['Goo (BOSS) at 40% survives', result.goo.died, false],
	['Assassin vs Goo at 40% survives (threshold is a fifth)', result.assassinBossHigh.died, false],
	['Assassin vs Goo at 10% executes', result.assassinBossLow.died, true],
];
let failed = 0;
for (const [label, actual, wanted] of expect) {
	if (actual === wanted) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}: died=${actual}, wanted ${wanted}`); }
}
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed ? 1 : 0;
