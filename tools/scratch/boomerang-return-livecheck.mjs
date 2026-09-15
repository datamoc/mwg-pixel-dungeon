// Throwaway (tools/scratch): `HeavyBoomerang.CircleBack`'s return flight.
//
// Java attaches a `CircleBack` buff to the hero when a boomerang is thrown - unconditionally on a
// miss (`rangedMiss`), and on a hit only while durability remains - carrying the cell it landed on,
// the hero's cell at throw time, the depth, and `left = 5`. Five hero turns later it flies home to
// that cell and resolves against whoever is standing there (`HeavyBoomerang.java`, tag `v3.3.8`):
// the hero picks it up, anyone else is attacked with it (`hero.shoot`, with `circlingBack` up so the
// accuracy factor is a flat 1.5), and an empty cell just drops it. The countdown stalls while the
// hero is on another depth.
//
// This port's ammo is a fungible counter, so the translation is: the thrown unit leaves the pile,
// no heap is left where it landed, and the return either gives the unit back, hits the squatter and
// drops the heap, or drops the heap on an empty cell.
//
//   - a real boomerang throw takes the unit out of the pile, leaves nothing on the ground, and
//     schedules a return with Java's 5-turn countdown at the right cells;
//   - four turns later nothing has happened; the fifth resolves it;
//   - the hero still standing there gets the unit back, with Java's real pickup line;
//   - a monster that took his place is hit with the returning boomerang and the heap lands there;
//   - an empty cell just gets the heap;
//   - and a return pending on another depth does not tick.
//
// Run after `npm run build`:  node tools/scratch/boomerang-return-livecheck.mjs
import { createRequire } from 'node:module';
import fs from 'node:fs';
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

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=boomerang', { waitUntil: 'load', timeout: 120000 });
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
// HERO -> warrior (throws an improvised projectile, so `special` is a throw)
await tap(398 / 1024, 400 / 768);
await tap(62 / 1024, 261 / 768);
await tap(0.166, 0.921);
await page.waitForTimeout(5000);

const result = {};
const sleep = (ms) => page.waitForTimeout(ms);

/** Wield a real heavy boomerang through the scene's own action, clear the floor, and aim at a fresh rat. */
const arm = () => page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	const hero = s['hero'];
	for (const creature of s['creatures']) if (!creature.isHero && !creature.isNPC) creature.hp = 0;
	s['bag'].add({ id: 'missile_heavyboomerang', quantity: 1, stackable: true, instanceId: 'bm' + Math.random(), identified: true, sourceClass: 'HeavyBoomerang' });
	s['wieldMissile']('missile_heavyboomerang');
	s['ammo'] = 3;
	s['ammoDurability'] = 100;
	s['boomerangReturn'] = null;
	for (const item of s['groundItems']) item.x = -1;
	const target = s['spawnMonster']('rat', { x: hero.x + 3, y: hero.y });
	target.hp = target.maxHp = 500;
	target.sleeping = false;
	s['fov'].update(hero.x, hero.y, 8);
	s['refresh']();
	return {
		className: s['ammoSourceClass'], ammo: s['ammo'],
		hero: [hero.x, hero.y], target: [target.x, target.y], targetId: target.id,
	};
});

/** Throw at the rat through the real special action. */
const throwAt = () => page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	s['missileThrowConfirmed'] = true;
	s['specialTarget'] = s['creatures'].find((c) => c.kind === 'rat' && c.hp > 0) ?? null;
	s['useSpecial']();
	return {
		ammo: s['ammo'],
		pending: s['boomerangReturn'] ? { ...s['boomerangReturn'] } : null,
		heaps: s['groundItems'].filter((i) => i.x >= 0).map((i) => [i.x, i.y]),
	};
});

const snapshot = () => page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	const rat = s['creatures'].find((c) => c.kind === 'rat' && c.hp > 0);
	return {
		ammo: s['ammo'],
		durability: s['ammoDurability'],
		pending: s['boomerangReturn'] ? { ...s['boomerangReturn'] } : null,
		heaps: s['groundItems'].filter((i) => i.x >= 0).map((i) => [i.x, i.y]),
		ratHp: rat ? rat.hp : null,
		hero: [s['hero'].x, s['hero'].y],
	};
});

/** Advance the hero's own turn, which is what ticks the countdown. */
const waitTurn = () => page.evaluate(() => {
	window.__MWG__.currentScene['onAction']('wait');
});

const dir = path.join(process.env.BROWSERCHECK_DIR ?? 'C:/Users/miche/dev/_browsercheck', 'mwgpd_shots_boomerang');
fs.mkdirSync(dir, { recursive: true });

// ---- 1. the throw schedules the return and leaves nothing behind
result.armed = await arm();
result.thrown = await throwAt();
await page.screenshot({ path: path.join(dir, 'in-flight.png') }).catch(() => {});
// the hero's cell at throw time is the return cell; the rat's cell is where it landed
result.scheduled = {
	tookUnitOutOfPile: result.armed.ammo === 3 && result.thrown.ammo === 2,
	leftIsFive: result.thrown.pending?.left === 5,
	returnCellIsHeroCell: result.thrown.pending
		? [result.thrown.pending.returnX, result.thrown.pending.returnY].join() === result.armed.hero.join() : false,
	fromCellIsTargetCell: result.thrown.pending
		? [result.thrown.pending.fromX, result.thrown.pending.fromY].join() === result.armed.target.join() : false,
	nothingOnTheGround: result.thrown.heaps.length === 0,
};

// ---- 2. four turns later it is still in flight
for (let i = 0; i < 4; i++) { await waitTurn(); await sleep(250); }
result.afterFourTurns = await snapshot();

// ---- 3. the fifth resolves it, with the hero still standing on the return cell
await waitTurn();
await sleep(400);
result.afterFiveTurns = await snapshot();
result.heroPickup = {
	unitBackInThePile: result.afterFiveTurns.ammo === 3,
	returnCleared: result.afterFiveTurns.pending === null,
	noHeap: result.afterFiveTurns.heaps.length === 0,
	logged: await page.evaluate(() => {
		const s = window.__MWG__.currentScene;
		// `GameLog`'s own `blocks` carry the text that was added through `say()`. The line is
		// SPD's real `actors.hero.hero.you_now_have` ("you picked up: {0}."), so it names the
		// wielded missile - the assertion is that *something* naming a boomerang was logged.
		const blocks = s['gameLog']?.['blocks'] ?? [];
		return blocks.map((b) => b.text ?? b.label?.text ?? '').filter((t) => /boomerang/i.test(t)).slice(-2);
	}),
};

// ---- 4. a monster standing on the return cell is hit with it, and the heap lands there
const branchB = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	const hero = s['hero'];
	s['boomerangReturn'] = null;
	s['ammo'] = 3; s['ammoDurability'] = 100;
	// arm by hand at a fixed return cell, then put a rat on it
	const rx = hero.x + 1, ry = hero.y + 1;
	const squatter = s['spawnMonster']('rat', { x: rx, y: ry });
	squatter.hp = squatter.maxHp = 500;
	squatter.sleeping = false;
	s['boomerangReturn'] = { fromX: hero.x + 3, fromY: hero.y, returnX: rx, returnY: ry, left: 1, level: 0, setId: 1, depth: s['depth'] };
	// the hero must NOT be on the return cell for this branch
	const startHp = squatter.hp;
	return { rx, ry, startHp, hero: [hero.x, hero.y], sameCell: hero.x === rx && hero.y === ry, id: squatter.id };
});
result.branchBSetup = branchB;
await waitTurn();
await sleep(400);
result.branchB = await page.evaluate(({ id, startHp }) => {
	const s = window.__MWG__.currentScene;
	const squatter = s['creatures'].find((c) => c.id === id);
	return {
		damaged: (squatter?.hp ?? 0) < startHp,
		hp: squatter?.hp,
		heapAtReturnCell: s['groundItems'].some((i) => i.x >= 0 && i.durability !== 0 || (i.x >= 0)),
		heaps: s['groundItems'].filter((i) => i.x >= 0).map((i) => [i.x, i.y]),
		pending: s['boomerangReturn'],
	};
}, { id: branchB.id, startHp: branchB.startHp });

// ---- 5. an empty return cell just drops the heap
const branchC = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	s['boomerangReturn'] = null;
	for (const item of s['groundItems']) item.x = -1;
	for (const creature of s['creatures']) if (!creature.isHero && !creature.isNPC) { creature.x = 1; creature.y = 1; }
	const hero = s['hero'];
	const rx = hero.x + 2, ry = hero.y + 2;
	s['ammo'] = 3;
	s['boomerangReturn'] = { fromX: hero.x + 3, fromY: hero.y, returnX: rx, returnY: ry, left: 1, level: 2, setId: 7, depth: s['depth'] };
	return { rx, ry, ammo: s['ammo'] };
});
await waitTurn();
await sleep(400);
result.branchC = await page.evaluate(({ rx, ry, ammo }) => {
	const s = window.__MWG__.currentScene;
	const heap = s['groundItems'].find((i) => i.x === rx && i.y === ry);
	return {
		heapAtReturnCell: !!heap,
		heapLevel: heap?.missileLevel,
		heapSet: heap?.missileSet,
		unitNotReturned: s['ammo'] === ammo,
		pending: s['boomerangReturn'],
	};
}, branchC);

// ---- 6. a return pending on another depth does not tick
const depthGate = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	const hero = s['hero'];
	s['boomerangReturn'] = { fromX: hero.x + 3, fromY: hero.y, returnX: hero.x, returnY: hero.y, left: 3, level: 0, setId: 1, depth: s['depth'] + 1 };
	return { left: s['boomerangReturn'].left, depth: s['boomerangReturn'].depth, here: s['depth'] };
});
await waitTurn();
await sleep(300);
result.depthGate = await page.evaluate((before) => {
	const s = window.__MWG__.currentScene;
	return { before: before.left, after: s['boomerangReturn']?.left ?? null, stillPending: s['boomerangReturn'] !== null };
}, depthGate);
await page.evaluate(() => { window.__MWG__.currentScene['boomerangReturn'] = null; });

// ---- 7. a pending return survives a save/load round-trip
const roundTrip = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	const hero = s['hero'];
	s['ammo'] = 2;
	s['boomerangReturn'] = { fromX: hero.x + 3, fromY: hero.y, returnX: hero.x, returnY: hero.y, left: 2, level: 1, setId: 4, depth: s['depth'] };
	s['saveRun']();
	return { savedLeft: 2, ammo: s['ammo'] };
});
await sleep(500);
await page.evaluate(() => window.__MWG__.currentScene['loadRun']());
await sleep(4000);
result.roundTrip = await page.evaluate(({ savedLeft, ammo }) => {
	const s = window.__MWG__.currentScene;
	const pending = s['boomerangReturn'];
	return {
		pendingSurvived: !!pending,
		left: pending?.left ?? null,
		leftMatches: pending?.left === savedLeft,
		setId: pending?.setId ?? null,
		ammo: s['ammo'],
		ammoMatches: s['ammo'] === ammo,
	};
}, roundTrip);

// ---- 8. swapping the map out from under it gives the boomerang back (Java's `clearEntities`)
const mapSwap = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	const hero = s['hero'];
	s['ammo'] = 1;
	s['boomerangReturn'] = { fromX: hero.x + 3, fromY: hero.y, returnX: hero.x, returnY: hero.y, left: 4, level: 0, setId: 1, depth: s['depth'] };
	// the mining branch swaps the whole map at the *same* depth, which the depth gate cannot see
	const before = { ammo: s['ammo'], pending: !!s['boomerangReturn'] };
	s['enterMiningBranch']();
	const after = { ammo: s['ammo'], pending: !!s['boomerangReturn'], branch: s['miningBranchActive'] };
	s['leaveMiningBranch']();
	return { before, after, leftAgain: s['ammo'], stillPending: !!s['boomerangReturn'] };
});
result.mapSwap = mapSwap;

// ---- report
const checks = [
	['the throw takes the unit out of the pile', result.scheduled.tookUnitOutOfPile],
	['CircleBack starts at Java\'s left = 5', result.scheduled.leftIsFive],
	['return cell is the hero\'s cell at throw time', result.scheduled.returnCellIsHeroCell],
	['thrown cell is where the boomerang landed', result.scheduled.fromCellIsTargetCell],
	['a boomerang in flight leaves no heap behind', result.scheduled.nothingOnTheGround],
	['four turns later it is still in flight', result.afterFourTurns.pending?.left === 1 && result.afterFourTurns.ammo === 2],
	['the hero still there gets the unit back', result.heroPickup.unitBackInThePile],
	['the return clears', result.heroPickup.returnCleared],
	['his own pickup drops no heap', result.heroPickup.noHeap],
	['and logs SPD\'s real pickup line', result.heroPickup.logged.length > 0],
	['a squatter is hit with the returning boomerang', result.branchB.damaged],
	['and the heap lands on the return cell', result.branchB.heaps.some(([x, y]) => x === branchB.rx && y === branchB.ry)],
	['an empty return cell gets the heap', result.branchC.heapAtReturnCell],
	['that heap keeps the pile\'s level and set', result.branchC.heapLevel === 2 && result.branchC.heapSet === 7],
	['an empty return does not give the unit back', result.branchC.unitNotReturned],
	['a return pending on another depth does not tick', result.depthGate.after === result.depthGate.before && result.depthGate.stillPending],
	['a pending return survives a save/load', result.roundTrip.pendingSurvived && result.roundTrip.leftMatches],
	['and the pile it belongs to comes back too', result.roundTrip.ammoMatches],
	['a map swap at the same depth gives the boomerang back', result.mapSwap.before.pending && !result.mapSwap.after.pending],
	['and the unit really returns to the pile', result.mapSwap.before.ammo === 1 && result.mapSwap.after.ammo === 2],
	['leaving the branch does not cancel again', result.mapSwap.leftAgain === 2 && !result.mapSwap.stillPending],
];
let failed = 0;
for (const [name, ok] of checks) {
	if (!ok) failed++;
	console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
}
console.log(`\n${checks.length - failed}/${checks.length} boomerang-return checks passed.`);
if (result.heroPickup.logged) console.log(`pickup line: ${JSON.stringify(result.heroPickup.logged)}`);
if (problems.length) console.log(`page problems: ${JSON.stringify(problems.slice(0, 4))}`);
await page.screenshot({ path: path.join(dir, 'final.png') }).catch(() => {});
await browser.close();
process.exit(failed === 0 && problems.length === 0 ? 0 : 1);
