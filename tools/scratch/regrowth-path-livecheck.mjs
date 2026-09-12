// Throwaway (tools/scratch): the Regrowth wand's bolt path and Lotus placement.
//
// `WandOfRegrowth.onZap()` walks the *bolt path* for its centre line, and puts its Lotus on the
// aimed cell when that cell is free, otherwise on the first free cone cell walking that path
// backwards from its end. The port used a cross-product band and a nearest-eligible search; both are
// now Java's rule, with the path coming from `Roguelike.traceLine` (the wand's own
// `collisionProperties` is `WONT_STOP` for an uncursed one, so the path ignores walls by design).
//
// With an open floor and a monster three cells east of the hero, Java's backwards walk must stop on
// the cell immediately west of the monster - so that is what this asserts, along with the grass the
// same path places.
//
// Run after `npm run build`:  node tools/scratch/regrowth-path-livecheck.mjs
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
	// find an open horizontal run of floor three cells wide, starting one cell from the hero
	const free = (x, y) => s.level.inside(x, y) && s.level.passable(x, y) && !s.creatureAt(x, y);
	const run = (() => {
		for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
			const cells = [1, 2, 3].map((n) => ({ x: hero.x + dx * n, y: hero.y + dy * n }));
			if (cells.every((c) => free(c.x, c.y))) return cells;
		}
		return null;
	})();
	if (!run) return { skipped: 'no open three-cell run beside the hero' };
	const monster = s.spawnMonster('rat', run[2]);
	monster.maxHp = monster.hp = 1000;
	s.weaponLevel = 3;
	// the port's coarse terrain constants are not reachable from here, so grass is detected by the
	// terrain value changing on a cell that was plain floor before the zap
	const terrainBefore = [run[0], run[1], run[2]].map((cell) => s.level.get(cell.x, cell.y));
	// 3 charges: the Lotus branch, and ~14 cells of grass to place
	s['useRegrowthWand'](monster, 3);
	const terrainAfter = [run[0], run[1], run[2]].map((cell) => s.level.get(cell.x, cell.y));

	const lotus = s.creatures.find((c) => c.allyKind === 'lotus');
	let changedOnPath = 0;
	for (let i = 0; i < 3; i++) if (terrainBefore[i] !== terrainAfter[i]) changedOnPath++;
	const collinear = lotus
		? (lotus.x - hero.x) * (monster.y - hero.y) - (lotus.y - hero.y) * (monster.x - hero.x) === 0
		: null;
	return {
		hero: { x: hero.x, y: hero.y },
		monster: { x: monster.x, y: monster.y },
		expectedLotus: { x: run[1].x, y: run[1].y },
		lotus: lotus ? { x: lotus.x, y: lotus.y, name: lotus.name, kind: lotus.allyKind } : null,
		lotusDistanceToMonster: lotus ? Math.max(Math.abs(lotus.x - monster.x), Math.abs(lotus.y - monster.y)) : null,
		lotusIsCollinear: collinear,
		onMonsterCell: lotus ? lotus.x === monster.x && lotus.y === monster.y : null,
		changedOnPath,
		terrainBefore, terrainAfter,
	};
});

console.log('probe results:', JSON.stringify(result, null, 1));
const expect = [
	['the probe found an open run to aim along', !result.skipped],
	['a Lotus was created', result.lotus !== null && result.lotus !== undefined],
	['it is not on the monster\'s own cell', result.onMonsterCell === false],
	['it lies on the straight line from the hero to the monster (the bolt path)', result.lotusIsCollinear === true],
	['and it is the first free path cell back from the monster - one step away', result.lotusDistanceToMonster === 1],
	['the Lotus landed on the cell Java\'s backwards walk would pick',
		result.lotus !== null && result.lotus.x === result.expectedLotus.x && result.lotus.y === result.expectedLotus.y],
	['the same path placed grass along the bolt line', result.changedOnPath > 0],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed ? 1 : 0;
