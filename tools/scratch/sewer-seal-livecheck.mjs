// Throwaway (tools/scratch): `SewerBossLevel.seal()`, live - does the entrance drown?
//
// Java seals when Goo wakes, is first scratched, or notices the hero (`Goo.act()`/
// `damage()`/`notice()`): the entrance cell becomes WATER. This port spawned Goo awake, so
// there was nothing to seal on; he now sleeps on spawn (Java's `Mob.state = SLEEPING`
// default) and the seal runs on his first acting turn. The check drives a real depth-5
// floor through the wake path and looks at all of it.
//
// Run after `npm run build`:  node tools/scratch/sewer-seal-livecheck.mjs
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

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=sewer-seal', { waitUntil: 'load', timeout: 120000 });
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

const sealed = await page.evaluate(async () => {
	const s = window.__MWG__.currentScene;
	const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
	s['depth'] = 5;
	s['enterLevel']();
	await sleep(3000);   // the interlevel curtain owns `awaitingInput` until it finishes

	const width = s['level'].width;
	const entrance = s['entranceCell'];
	const cell = (x, y) => y * width + x;
	const goo = () => s['creatures'].find((c) => c.kind === 'goo');
	const before = {
		entrance,
		paint: s['portedPaint'].map[cell(entrance.x, entrance.y)],
		live: s['level'].get(entrance.x, entrance.y),
		gooSleeping: goo()?.sleeping ?? null,
		gooHp: goo()?.hp ?? null,
		sealed: s['sewerBossSealed'],
	};
	// walk Goo's real wake path rather than flipping the flag: park the hero beside him in
	// sight (distance 1 wakes at chance 1/(1+0) = 1, no RNG involved) and run his turn, which
	// Java's `TIME_TO_WAKE_UP` spends waking instead of acting
	const g = goo();
	const offsets = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
	const beside = offsets.map(([dx, dy]) => ({ x: g.x + dx, y: g.y + dy }))
		.find((at) => s['level'].inside(at.x, at.y) && s['level'].passable(at.x, at.y) && !s['creatureAt'](at.x, at.y));
	s['hero'].x = beside.x; s['hero'].y = beside.y;
	g.seesHero = true;
	s['takeMonsterTurn'](g);
	const woken = { sleeping: g.sleeping, sealed: s['sewerBossSealed'] };
	// the next turn is Goo's first acting one - Java's `act()` site - so the seal lands here
	s['takeMonsterTurn'](g);
	const after = {
		paint: s['portedPaint'].map[cell(entrance.x, entrance.y)],
		live: s['level'].get(entrance.x, entrance.y),
		passable: s['level'].passable(entrance.x, entrance.y),
		steppable: s['canStepOnto'](entrance.x, entrance.y),
		gooSleeping: goo()?.sleeping ?? null,
		gooHp: goo()?.hp ?? null,
		sealed: s['sewerBossSealed'],
		heroHp: s['hero'].hp,
	};
	// and a full save/load round-trip keeps the latched flag with the drowned entrance
	s['saveRun']();
	await sleep(500);
	s['loadRun']();
	await sleep(4000);
	const entrance2 = s['entranceCell'];
	const reloaded = {
		sealed: s['sewerBossSealed'],
		depth: s['depth'],
		paint: s['portedPaint'].map[cell(entrance2.x, entrance2.y)],
		live: s['level'].get(entrance2.x, entrance2.y),
		goo: s['creatures'].filter((c) => c.kind === 'goo' && c.hp > 0).length,
	};
	return { before, woken, after, reloaded };
});

console.log('probe results:', JSON.stringify(sealed, null, 1));
const { before, woken, after, reloaded } = sealed;
const expect = [
	// paint ENTRANCE is 7; the live kind is the shared FLOOR one, so "dry" here is paint plus
	// not-water-live. Goo arrives at full HP, asleep like Java's `Mob.state = SLEEPING`.
	['Goo arrives asleep at full HP with the entrance dry and the seal unspent',
		before.gooSleeping === true && before.gooHp !== null && before.gooHp > 0 && before.paint === 7 && before.live !== 3 && before.sealed === false],
	['the wake turn spends itself waking (Java\'s `TIME_TO_WAKE_UP`) without sealing yet',
		woken.sleeping === false && woken.sealed === false],
	['on his first acting turn the entrance drowns - paint and live map both WATER',
		after.sealed === true && after.paint === 29 && after.live === 3],
	['while staying steppable: Java\'s own WATER is walkable too, the `LockedFloor` buff bars the exit, not the tile',
		after.passable === true && after.steppable === true],
	['and Goo is up fighting (the wake cost his first turn, not his HP)',
		after.gooSleeping === false && after.gooHp === before.gooHp],
	['a save/load round-trip keeps the latched flag, the drowned entrance and the one Goo',
		reloaded.sealed === true && reloaded.depth === 5 && reloaded.paint === 29 && reloaded.live === 3 && reloaded.goo === 1],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
console.log(`sewer seal livecheck: ${expect.length - failed}/${expect.length} assertions`);
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed || problems.length ? 1 : 0;
