// Throwaway (tools/scratch): live-check that the defender damage() curves apply at Java's point.
//
// Unit checks prove the curves' values; only a real run proves *where* they are applied, which is
// the actual bug fixed here: a charged Pylon's curve used to run before the attacker's multiplier
// chain. With a x1.5 augment and a raw 40:
//   Java/new order : 40 * 1.5 = 60 -> curve -> 23
//   old order      : 40 -> curve 20, then * 1.5 -> 30
// A Slime with no multiplier separates "curved" from "uncurved" instead: raw 40 -> 12, not 40.
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

const shots = 'C:/Users/miche/dev/_browsercheck/mwgpd_shots_2026-09-12-curves';
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
await page.screenshot({ path: path.join(shots, '01-ingame.png') });

const result = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	const freeNeighbour = () => {
		for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
			const x = s.hero.x + dx, y = s.hero.y + dy;
			if (s.level.inside(x, y) && s.level.passable(x, y)) return { x, y };
		}
		return null;
	};
	const probe = (kind, configure) => {
		const cell = freeNeighbour();
		if (!cell) return { kind, error: 'no free neighbour' };
		const mob = s.spawnMonster(kind, cell);
		mob.maxHp = mob.hp = 5000;
		mob.armor = [0, 0];
		configure?.(mob);
		const before = mob.hp;
		s.attack(s.hero, mob);
		const delta = before - mob.hp;
		if (mob.hp <= 0) s.kill(mob); else mob.hp = 0, s.kill(mob);
		return { kind, delta };
	};
	const hero = s.hero;
	hero.damage = [40, 40];
	hero.str = hero.strReq ?? hero.str;
	hero.armor = [0, 0];
	const plain = probe('slime');
	// a charged Pylon is the ordering probe: the curve must see the augmented 60, not the raw 40
	s.weaponAugment = 'damage';
	const pylon = probe('pylon', (mob) => { mob.pylonActive = true; });
	s.weaponAugment = undefined;
	return { plain, pylon, weaponAffix: s.weaponAffix ?? null };
});

console.log('probe results:', JSON.stringify(result, null, 1));
console.log(result.plain?.delta === 12 ? 'PASS slime: raw 40 -> 12 (curved)' : `FAIL slime: expected 12, got ${result.plain?.delta}`);
console.log(result.pylon?.delta === 23 ? 'PASS pylon: 40*1.5=60 -> 23 (curve after the augment)' : `FAIL pylon: expected 23 (30 would mean the old order), got ${result.pylon?.delta}`);
await page.screenshot({ path: path.join(shots, '02-after.png') });
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
