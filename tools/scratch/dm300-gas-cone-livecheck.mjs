// Throwaway (tools/scratch): DM-300's "can't reach the hero" ability branch.
//
// `DM300.java` 202-234: while hunting with an enemy it cannot reach, and `turnsSinceLastAbility >=
// MIN_COOLDOWN` (5, not the rotation's `> abilityCooldown`), DM-300 casts a 30-degree,
// infinite-range, `STOP_SOLID`-only cone at the hero. If the hero is inside it (and not
// `INORGANIC`, which the hero never is) it vents gas; otherwise it drops rocks - unless the hero is
// already paralysed. That branch re-rolls no `abilityCooldown` and spends no turn, unlike the
// rotation below it, which is what this probe keys on: the cooldown is re-rolled only by the
// rotation.
//
// Reachability is isolated by stubbing the port's pathfinder to find nothing, so "the hero is
// unreachable" can be tested with the aim line left clear (the cone's own case) and with it walled
// (the cone's miss), without needing a sealed room.
//
// Run after `npm run build`:  node tools/scratch/dm300-gas-cone-livecheck.mjs
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
	const free = (x, y) => s.level.inside(x, y) && s.level.passable(x, y) && !s.creatureAt(x, y);
	// an open three-cell run beside the hero, so DM-300 can stand two cells away with a clear line
	// (any of the eight directions, since not every seed's first room has a long straight run)
	const run = (() => {
		const offsets = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
		for (const [dx, dy] of offsets) {
			const cells = [1, 2, 3].map((n) => ({ x: hero.x + dx * n, y: hero.y + dy * n }));
			if (cells.every((c) => free(c.x, c.y))) return cells;
		}
		return null;
	})();
	if (!run) return { skipped: 'no open three-cell run beside the hero' };
	const gasVolume = () => s.toxicGas.total();
	const caseOf = (label, { counter, wallBetween, paralysed, stubPathfinder }) => {
		for (const c of [...s.creatures]) if (!c.isHero) { c.hp = 0; s.kill(c); }
		for (const cell of run) s.level.set(cell.x, cell.y, 1 /* FLOOR */);
		const dm300 = s.spawnMonster('dm300', run[2]);
		dm300.maxHp = dm300.hp = 500;
		dm300.seesHero = true;
		dm300.dmAbilityTurns = counter;
		dm300.dmAbilityCd = 3;
		dm300.dmLastAbility = 0;
		if (wallBetween) {
			s.level.set(run[1].x, run[1].y, 0 /* WALL */);
			s.level.set(run[2].x, run[2].y, 0 /* WALL */);
		}
		if (paralysed) hero.buffs['paralysis'] = 5;
		else delete hero.buffs['paralysis'];
		const realPathfinder = s['pathfinder'];
		// stub by swapping the *method* on the real instance: spreading a class instance loses its
		// prototype methods, and the port's own AI walks call others on the same object
		const realFind = realPathfinder.find;
		if (stubPathfinder) realPathfinder.find = () => [];
		const gasBefore = gasVolume();
		const rocksBefore = s.fallingRocks.length;
		s['takeDM300Turn'](dm300);
		const observed = {
			label,
			lastAbility: dm300.dmLastAbility,
			cooldownRerolled: dm300.dmAbilityCd !== 3,
			gasGained: gasVolume() > gasBefore,
			rocksScheduled: s.fallingRocks.length > rocksBefore,
		};
		s.fallingRocks.length = 0;
		realPathfinder.find = realFind;
		delete hero.buffs['paralysis'];
		for (const cell of run) s.level.set(cell.x, cell.y, 1 /* FLOOR */);
		return observed;
	};

	return {
		// reachable (no stub) + counter past the cooldown: the rotation, which re-rolls the cooldown
		reachable: caseOf('reachable', { counter: 5, wallBetween: false, paralysed: false, stubPathfinder: false }),
		// unreachable, aim line clear: the cone contains the hero, so gas - and no cooldown re-roll
		unreachableInCone: caseOf('unreachable-in-cone', { counter: 5, wallBetween: false, paralysed: false, stubPathfinder: true }),
		// unreachable, line walled: the cone misses, so rocks
		unreachableConeMiss: caseOf('unreachable-cone-miss', { counter: 5, wallBetween: true, paralysed: false, stubPathfinder: true }),
		// unreachable, cone misses, hero already paralysed: neither ability fires
		unreachableParalysed: caseOf('unreachable-paralysed', { counter: 5, wallBetween: true, paralysed: true, stubPathfinder: true }),
		// unreachable but the counter is still under MIN_COOLDOWN: neither ability fires (the counter
		// is incremented at the top of the turn, so 2 becomes 3, and the rotation's own gate
		// `> dmAbilityCd` is 3 > 3, false)
		unreachableEarly: caseOf('unreachable-early', { counter: 2, wallBetween: false, paralysed: false, stubPathfinder: true }),
	};
});

console.log('probe results:', JSON.stringify(result, null, 1));
const expect = [
	['the probe found a run to stand DM-300 on', !result.skipped],
	['a reachable hero past the cooldown uses the rotation, which re-rolls the cooldown',
		!result.skipped && result.reachable.cooldownRerolled === true],
	['an unreachable hero with a clear aim line is gassed through the cone',
		!result.skipped && result.unreachableInCone.gasGained === true && result.unreachableInCone.lastAbility === 1],
	['and that branch re-rolls no cooldown, unlike the rotation',
		!result.skipped && result.unreachableInCone.cooldownRerolled === false],
	['an unreachable hero the cone cannot see through is rockfalled instead',
		!result.skipped && result.unreachableConeMiss.rocksScheduled === true && result.unreachableConeMiss.lastAbility === 2],
	['and that branch re-rolls no cooldown either',
		!result.skipped && result.unreachableConeMiss.cooldownRerolled === false],
	['an already-paralysed unreachable hero is not hit by either ability',
		!result.skipped && result.unreachableParalysed.gasGained === false && result.unreachableParalysed.rocksScheduled === false],
	['and before MIN_COOLDOWN neither ability fires at all',
		!result.skipped && result.unreachableEarly.gasGained === false && result.unreachableEarly.rocksScheduled === false],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed ? 1 : 0;
