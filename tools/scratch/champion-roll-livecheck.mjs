// Throwaway (tools/scratch): live-check that only the floor-rotation spawn may roll a champion.
//
// Java rolls a champion only in `Level.createMob()` (ChampionEnemy.rollForChampion is called from
// there and nowhere else), which is the path that draws from the floor's mob rotation; every
// directly-constructed mob - a quest miniboss, a mimic, a pylon, a summon, an ally - never is.
// This port used to approximate that with a hand-written kind list, so several of those could roll.
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
// the challenge module reads its set from localStorage at import time
await context.addInitScript(() => window.localStorage.setItem('spd-on-mwg.challenges.v1', JSON.stringify(['champion_enemies'])));
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
	// `eligible` is spawnMonster's own championEligible argument, i.e. "this is Java's createMob()"
	const roll = (kind, eligible, ally = false) => {
		let champions = 0;
		for (let i = 0; i < 300; i++) {
			const mob = s['spawnMonster'](kind, cell(), false, undefined, ally, undefined, eligible);
			if (mob.champion) champions++;
			mob.hp = 0;
			s.kill(mob);
		}
		return { kind, eligible, ally, champions };
	};
	return {
		eligibleRat: roll('rat', true),
		eligibleSnake: roll('snake', true),
		questMiniboss: roll('fetidRat', false),
		mimic: roll('mimic', false),
		pylon: roll('pylon', false),
		larva: roll('larva', false),
		ally: roll('rat', true, true),
	};
});

console.log('probe results:', JSON.stringify(result, null, 1));
const expect = [
	['roster rat rolls champions (~10%)', result.eligibleRat.champions > 5],
	['roster snake rolls champions (~10%)', result.eligibleSnake.champions > 5],
	['quest miniboss fetidRat never rolls', result.questMiniboss.champions === 0],
	['mimic never rolls', result.mimic.champions === 0],
	['pylon never rolls', result.pylon.champions === 0],
	['larva never rolls', result.larva.champions === 0],
	['an allied rat never rolls', result.ally.champions === 0],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed ? 1 : 0;
