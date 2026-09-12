// Throwaway (tools/scratch): a live check that an Elemental's ranged zap deals no damage.
//
// Java's `Elemental.zap()` is `hit()` -> `rangedProc()`, and every `rangedProc` is a pure status
// application (Burning / Freezing / Blindness / a cursed-wand effect). The port used to roll
// NormalIntRange(20, 25) on top; this pins that the bolt now only applies its status.
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
	for (const c of [...s.creatures]) if (!c.isHero) { c.hp = 0; s.kill(c); }
	const cell = () => {
		for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
			const x = s.hero.x + dx, y = s.hero.y + dy;
			if (s.level.inside(x, y) && s.level.passable(x, y)) return { x, y };
		}
		return null;
	};
	const probe = (elementalType) => {
		const mob = s.spawnMonster('elemental', cell());
		mob.elementalType = elementalType;
		mob.maxHp = mob.hp = 100000;
		mob.armor = [0, 0];
		const hero = s.hero;
		hero.hp = hero.maxHp;
		const before = hero.hp;
		let buffed = 0;
		for (let i = 0; i < 25; i++) {
			hero.hp = hero.maxHp;
			s['elementalRangedTurn'](mob);
			if (Object.keys(hero.buffs).some((b) => ['burning', 'chill', 'frost', 'daze'].includes(b))) buffed++;
		}
		return { elementalType, hpLost: before - hero.hp, buffsApplied: buffed };
	};
	return { fire: probe('fire'), frost: probe('frost'), shock: probe('shock') };
});

console.log('probe results:', JSON.stringify(result));
const expect = [
	['fire elemental zap deals no damage but applies a status', result.fire.hpLost === 0 && result.fire.buffsApplied > 0],
	['frost elemental zap deals no damage but applies a status', result.frost.hpLost === 0 && result.frost.buffsApplied > 0],
	['shock elemental zap deals no damage but applies a status', result.shock.hpLost === 0 && result.shock.buffsApplied > 0],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed ? 1 : 0;
