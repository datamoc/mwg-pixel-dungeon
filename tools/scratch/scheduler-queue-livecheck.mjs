// Throwaway (tools/scratch): does a save/load round-trip resume the *exact* turn queue?
//
// `main.ts` used to save only `schedulerNow` plus a per-creature `nextTurn`, re-adding actors in
// `creatures` array order, so every actor got a fresh `Scheduler` sequence number: two actors tied on
// time could come out of a load in a different order than they would have without saving.
// `Scheduler.toJSON`/`Scheduler.restore` carry `now`, the `sequence` counter and each entry's
// time/sequence/priority. This checks that - with a queue deliberately ordered *against* the
// creature array, so the old shape's failure would show up as a reorder - and then that the loaded
// game is still *playable* (real keypress, turn spent, hero input reached) and that a save without
// the snapshot still loads through the legacy path.
//
// The phases are split by a real wait because `loadRun` ends in `enterLevel`'s interlevel curtain,
// which holds input off for its 1.33-1.66s on purpose (`showInterlevel` sets `awaitingInput = false`);
// reading "is the game awaiting input" before it lifts would measure the transition, not the queue.
//
// Run after `npm run build`:  node tools/scratch/scheduler-queue-livecheck.mjs
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

// ---- phase 1: build a queue ordered against the creature array, then save/load it twice.
const baseline = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	const hero = s.hero;
	for (const c of [...s.creatures]) if (!c.isHero) { c.hp = 0; s.kill(c); }
	const freeCell = (fromX, fromY) => {
		for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
			const x = fromX + dx, y = fromY + dy;
			if (s.level.inside(x, y) && s.level.passable(x, y) && !s.creatureAt(x, y)) return { x, y };
		}
		return null;
	};
	// three distinguishable monsters, spawned A, B, C - so `creatures` order is hero, A, B, C
	const a = s.spawnMonster('rat', freeCell(hero.x, hero.y));
	const b = s.spawnMonster('snake', freeCell(hero.x, hero.y));
	const c = s.spawnMonster('crab', freeCell(hero.x, hero.y));
	for (const mob of [a, b, c]) mob.maxHp = mob.hp = 1000;

	// A queue deliberately ordered against the creature array, all tied on time: hero, C, B, A.
	s.scheduler.clear();
	s.scheduler.now = 100;
	s.scheduler.add(hero, 0);
	s.scheduler.add(c, 0);
	s.scheduler.add(b, 0);
	s.scheduler.add(a, 0);

	const key = (creature) => (creature.isHero ? 'hero' : creature.kind);
	window.__probeKey = key;
	const before = s.scheduler.toJSON(key);
	const creatureOrderBefore = s.creatures.map(key);

	s['saveRun']();
	s['loadRun']();
	s['saveRun']();
	s['loadRun']();

	return { now: before.now, sequence: before.sequence, entries: before.entries, queueOrderBefore: before.entries.map((entry) => entry.id), creatureOrderBefore };
});

await page.waitForTimeout(2600);

// ---- phase 2: the loaded queue, a real keypress on the loaded game, and a legacy save.
const result = await page.evaluate((before) => {
	const s = window.__MWG__.currentScene;
	const key = window.__probeKey;
	const after = s.scheduler.toJSON(key);

	const heroTimeBeforeAction = s.scheduler.timeOf(s.hero);
	const awaitingBeforeAction = s.awaitingInput === true;
	// searching is a real turn-spending hero action, bound to KeyF by `Input.bind('search', ...)` -
	// the whole chain a player goes through: keydown -> Input -> onAction -> hero turn -> monster turns
	window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyF', key: 'f', bubbles: true, cancelable: true }));
	window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyF', key: 'f', bubbles: true, cancelable: true }));
	const heroTimeAfterAction = s.scheduler.timeOf(s.hero);
	const afterAction = s.scheduler.toJSON(key);

	// A save written *before* the queue was serialised must still load: strip the snapshot and
	// re-load, which is what "legacy fields remain accepted" means here.
	const stored = s['saves'].load('run');
	let legacy = null;
	if (stored?.state?.floors) {
		for (const [, floor] of stored.state.floors) delete floor.scheduler;
		s['saves'].save('run', stored.state);
		s['loadRun']();
		const afterLegacy = s.scheduler.toJSON(key);
		legacy = {
			now: afterLegacy.now,
			creatureOrder: s.creatures.map(key),
			queueOrder: afterLegacy.entries.map((entry) => entry.id),
			heroEntries: afterLegacy.entries.filter((entry) => entry.id === 'hero').length,
			turnStop: s.simulation.runTurns(),
		};
	}

	return {
		after: { now: after.now, sequence: after.sequence, entries: after.entries },
		queueOrderAfter: after.entries.map((entry) => entry.id),
		creatureOrderAfter: s.creatures.map(key),
		heroEntriesAfter: after.entries.filter((entry) => entry.id === 'hero').length,
		awaitingBeforeAction,
		heroTimeBeforeAction,
		heroTimeAfterAction,
		awaitingAfterAction: s.awaitingInput === true,
		heroEntriesAfterAction: afterAction.entries.filter((entry) => entry.id === 'hero').length,
		turnStopAfterAction: s.simulation.runTurns(),
		legacy,
	};
}, baseline);

console.log('probe results:', JSON.stringify(result, null, 1));
const tuples = (entries) => JSON.stringify(entries.map((entry) => [entry.id, entry.time, entry.sequence, entry.priority ?? 0]));
const before = baseline;
const expect = [
	['the queue order before the save is against the creature array (so a reorder would be visible)',
		JSON.stringify(before.queueOrderBefore) !== JSON.stringify(before.creatureOrderBefore)],
	['two save/load round-trips kept `now`', result.after.now === before.now],
	['and kept the sequence counter', result.after.sequence === before.sequence],
	['every entry kept its time and sequence, in the same order', tuples(result.after.entries) === tuples(before.entries)],
	['so the loaded queue order is the saved one, not the creature array order',
		JSON.stringify(result.queueOrderAfter) === JSON.stringify(before.queueOrderBefore)
		&& JSON.stringify(result.queueOrderAfter) !== JSON.stringify(result.creatureOrderAfter)],
	['the hero is queued exactly once', result.heroEntriesAfter === 1],
	['after the interlevel curtain, the loaded game awaits hero input', result.awaitingBeforeAction === true],
	['a real keypress then spends the hero\'s turn', result.heroTimeAfterAction > result.heroTimeBeforeAction],
	['and the game comes back to hero input with the hero still queued once',
		result.awaitingAfterAction === true && result.heroEntriesAfterAction === 1],
	['the turn loop after that action still stops for the hero', result.turnStopAfterAction === 'hero-input'],
	['a save without the queue snapshot still loads (legacy path)', result.legacy !== null],
	['the legacy path rebuilds `now`, the creature array and exactly one hero entry',
		result.legacy !== null && result.legacy.now === before.now
		&& JSON.stringify(result.legacy.creatureOrder) === JSON.stringify(before.creatureOrderBefore)
		&& result.legacy.heroEntries === 1],
	['and the legacy queue still reaches hero input', result.legacy !== null && result.legacy.turnStop === 'hero-input'],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed ? 1 : 0;
