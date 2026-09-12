// Throwaway (tools/scratch): the Regrowth wand's bolt path, its Lotus, and its cone.
//
// `WandOfRegrowth.onZap()` walks the *bolt path* for its centre line, puts its Lotus on the aimed
// cell when that cell is free (otherwise the first free cone cell walking that path backwards), and
// works over a real `ConeAOE` - a circular sector of `2 + 2*charges` range and `20 + 10*charges`
// degrees - dropping any cell whose character is `IMMOVABLE` before the roots pass.
//
// The probe checks all three against the same run of open floor: with a monster three cells east of
// the hero, the Lotus must land on the cell immediately back from the monster (Java's backwards
// walk), every cell the zap changed must lie inside the sector while a cell the old radius-8 circle
// would have covered must be untouched, and a pylon (an immovable kind) must be neither grassed
// under nor rooted while an ordinary monster beside it is.
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
	const clearFloor = () => { for (const c of [...s.creatures]) if (!c.isHero) { c.hp = 0; s.kill(c); } };
	const free = (x, y) => s.level.inside(x, y) && s.level.passable(x, y) && !s.creatureAt(x, y);
	/** the first open three-cell run beside the hero, in one of the four directions */
	const openRun = (extra = () => true) => {
		for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
			const cells = [1, 2, 3].map((n) => ({ x: hero.x + dx * n, y: hero.y + dy * n }));
			if (cells.every((c) => free(c.x, c.y)) && cells.every(extra)) return cells;
		}
		return null;
	};
	const snapshot = () => {
		const values = new Array(s.level.width * s.level.height);
		for (let y = 0; y < s.level.height; y++) for (let x = 0; x < s.level.width; x++) values[y * s.level.width + x] = s.level.get(x, y);
		return values;
	};
	const at = (values, x, y) => values[y * s.level.width + x];

	clearFloor();
	const run = openRun();
	if (!run) return { skipped: 'no open three-cell run beside the hero' };

	// ---- phase 1: three charges (cone + Lotus), the shape and the path
	const monster = s.spawnMonster('rat', run[2]);
	monster.maxHp = monster.hp = 1000;
	s.weaponLevel = 3;
	const before = snapshot();
	s['useRegrowthWand'](monster, 3);
	const after = snapshot();

	const lotus = s.creatures.find((c) => c.allyKind === 'lotus');
	const aimAngle = (Math.atan2(monster.y - hero.y, monster.x - hero.x) * 180) / Math.PI;
	const degreesOf = (ratio) => (Math.atan(ratio) * 180) / Math.PI;
	const inside = [];
	const outside = [];
	let onPath = 0;
	for (let y = 0; y < s.level.height; y++) {
		for (let x = 0; x < s.level.width; x++) {
			if (at(before, x, y) === at(after, x, y)) continue;
			const chebyshev = Math.max(Math.abs(x - hero.x), Math.abs(y - hero.y));
			if (chebyshev > 12) continue;
			const distance = Math.hypot(x - hero.x, y - hero.y);
			let delta = Math.abs((Math.atan2(y - hero.y, x - hero.x) * 180) / Math.PI - aimAngle) % 360;
			if (delta > 180) delta = 360 - delta;
			// the sector bound: half the 50-degree arc, plus this cell's own quantisation, plus the
			// rim's (measured at the aimed radius), plus a degree of half-degree sampling
			const bound = 25 + degreesOf(0.75 / Math.max(1, distance)) + degreesOf(1 / (Math.hypot(monster.x - hero.x, monster.y - hero.y) + 0.5)) + 1;
			if (delta <= bound && distance <= 8.5) inside.push({ x, y });
			else outside.push({ x, y, delta: +delta.toFixed(1), distance: +distance.toFixed(2) });
			if (run.some((cell) => cell.x === x && cell.y === y)) onPath++;
		}
	}

	// ---- phase 2: an immovable occupant is dropped from the cone before the roots pass.
	// It has to sit *beside* the aim line, not on it: Java's rays use `STOP_TARGET`, so an actor on
	// the line truncates the ray, which would put the monster behind it outside the cone entirely.
	clearFloor();
	// a run whose cells phase 1 did *not* already grass, so a terrain change is observable
	const run2 = openRun((cell) => at(before, cell.x, cell.y) === s.level.get(cell.x, cell.y));
	let immovable = null;
	if (run2) {
		const beside = [{ x: hero.x + 3, y: hero.y + 1 }, { x: hero.x + 3, y: hero.y - 1 }, { x: hero.x + 2, y: hero.y + 1 }, { x: hero.x + 2, y: hero.y - 1 }]
			.find((cell) => free(cell.x, cell.y));
		if (beside) {
			const pylon = s.spawnMonster('pylon', beside);
			pylon.maxHp = pylon.hp = 1000;
			const other = s.spawnMonster('snake', run2[2]);
			other.maxHp = other.hp = 1000;
			const before2 = snapshot();
			s['useRegrowthWand'](other, 1);
			const after2 = snapshot();
			immovable = {
				pylonCell: beside,
				pylonTerrainChanged: at(before2, beside.x, beside.y) !== at(after2, beside.x, beside.y),
				pylonRooted: pylon.buffs['roots'] !== undefined,
				otherTerrainChanged: at(before2, run2[2].x, run2[2].y) !== at(after2, run2[2].x, run2[2].y),
				otherRooted: other.buffs['roots'] !== undefined,
			};
		}
	}

	return {
		hero: { x: hero.x, y: hero.y },
		monster: { x: monster.x, y: monster.y },
		expectedLotus: { x: run[1].x, y: run[1].y },
		lotus: lotus ? { x: lotus.x, y: lotus.y, kind: lotus.allyKind } : null,
		lotusDistanceToMonster: lotus ? Math.max(Math.abs(lotus.x - monster.x), Math.abs(lotus.y - monster.y)) : null,
		lotusIsCollinear: lotus ? (lotus.x - hero.x) * (monster.y - hero.y) - (lotus.y - hero.y) * (monster.x - hero.x) === 0 : null,
		lotusOnMonsterCell: lotus ? lotus.x === monster.x && lotus.y === monster.y : null,
		changedInsideSector: inside.length,
		changedOutsideSector: outside,
		changedOnPath: onPath,
		immovable,
	};
});

console.log('probe results:', JSON.stringify(result, null, 1));
const expect = [
	['the probe found an open run to aim along', !result.skipped],
	['a Lotus was created', result.lotus !== null && result.lotus !== undefined],
	['it is not on the monster\'s own cell', result.lotusOnMonsterCell === false],
	['it lies on the straight line from the hero to the monster (the bolt path)', result.lotusIsCollinear === true],
	['and it is the first free path cell back from the monster - one step away', result.lotusDistanceToMonster === 1],
	['the Lotus landed on the cell Java\'s backwards walk would pick',
		result.lotus !== null && result.lotus.x === result.expectedLotus.x && result.lotus.y === result.expectedLotus.y],
	['the same path placed grass along the bolt line', result.changedOnPath > 0],
	['every cell the zap changed is inside the cone\'s sector', result.changedInsideSector > 0 && result.changedOutsideSector.length === 0],
	['an immovable pylon in the cone is neither grassed under nor rooted',
		result.immovable !== null && result.immovable.pylonTerrainChanged === false && result.immovable.pylonRooted === false],
	['while the ordinary monster beside it is both grassed under and rooted',
		result.immovable !== null && result.immovable.otherTerrainChanged === true && result.immovable.otherRooted === true],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed ? 1 : 0;
