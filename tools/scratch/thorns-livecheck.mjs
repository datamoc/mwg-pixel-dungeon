// Throwaway (tools/scratch): live-check the Thorns glyph's real proc.
//
// Java: `procChance = (level+2)/(level+12) * arcana` (16.7% at level 0), applied only against an
// opposite-alignment attacker, setting `Bleeding` at `round((4 + level) * max(1, chance))`. The port
// used to deal 2 points of instant damage on every hit with no roll at all.
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
	for (const c of [...s.creatures]) if (!c.isHero) { c.hp = 0; s.kill(c); }
	const cell = () => {
		for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
			const x = hero.x + dx, y = hero.y + dy;
			if (s.level.inside(x, y) && s.level.passable(x, y)) return { x, y };
		}
		return null;
	};
	s.armorGlyph = 'thorns';
	s.armorLevel = 0;
	const mob = s.spawnMonster('rat', cell());
	mob.maxHp = mob.hp = 100000;
	mob.damage = [0, 0];

	let procs = 0;
	let instantDamage = 0;
	let level0 = 0;
	const trials = 1200;
	for (let i = 0; i < trials; i++) {
		delete mob.buffs.bleeding;
		const before = mob.hp;
		s['mobOnHit'](mob, hero, 10);
		instantDamage += before - mob.hp;
		if (mob.buffs.bleeding !== undefined) { procs++; level0 = mob.buffs.bleeding; }
	}
	const level = level0;
	// a level-3 glyph for the scaling half: chance 5/15 = 1/3, bleeding round((4+3) * 1) = 7
	s.armorLevel = 3;
	let procs3 = 0;
	let level3 = 0;
	for (let i = 0; i < 1200; i++) {
		delete mob.buffs.bleeding;
		s['mobOnHit'](mob, hero, 10);
		if (mob.buffs.bleeding !== undefined) { procs3++; level3 = mob.buffs.bleeding; }
	}
	s.armorGlyph = undefined;
	mob.hp = 0;
	s.kill(mob);
	return {
		trials, procs, rate: +(procs / trials).toFixed(3), bleedingLevel: level, instantDamage,
		trials3: 1200, rate3: +(procs3 / 1200).toFixed(3), bleedingLevel3: level3,
	};
});

console.log('probe results:', JSON.stringify(result));
const expect = [
	['a level-0 Thorns procs about 1 in 6 hits', result.rate > 0.13 && result.rate < 0.21],
	['the proc sets Bleeding 4, not instant damage', result.bleedingLevel === 4],
	['no instant damage is dealt at all', result.instantDamage === 0],
	['a level-3 Thorns procs about 1 in 3 hits', result.rate3 > 0.28 && result.rate3 < 0.39],
	['and its Bleeding scales with the armor level', result.bleedingLevel3 === 7],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed ? 1 : 0;
