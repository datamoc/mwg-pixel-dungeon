// Throwaway (tools/scratch): `PrisonBossLevel.progress()`'s `case START:`, live - does Tengu
// appear only once the hero is past his locked door?
//
// Java's `occupyCell` fires the trigger the moment the hero's own move lands past
// `tenguCell.top` (row 23): it resolves a spawn cell at `tenguCellCenter` (10,27), re-locks the
// door the iron key just opened, and only then creates Tengu. This port used to spawn him on
// floor entry like every other boss, which also meant there was no "boss floor with the fight
// not yet started" state. This check drives a real depth-10 floor and looks at the trigger, the
// spawn cell, the ordering, and the re-lock.
//
// Run after `npm run build`:  node tools/scratch/tengu-start-livecheck.mjs
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

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=tengu-start', { waitUntil: 'load', timeout: 120000 });
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

const result = await page.evaluate(async () => {
	const s = window.__MWG__.currentScene;
	const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
	s['depth'] = 10;
	s['enterLevel']();
	await sleep(3000);   // the interlevel curtain owns `awaitingInput` until it finishes

	const tenguOf = () => s['creatures'].find((c) => c.kind === 'tengu' && c.hp > 0) ?? null;
	const door = { x: 10, y: 23 };
	const doorState = () => ({
		isDoor: s['doors'].isDoor(door.x, door.y),
		isLocked: s['doors'].isLocked(door.x, door.y),
		isOpen: s['doors'].isOpen(door.x, door.y),
		passable: s['level'].passable(door.x, door.y),
	});

	// 1. Floor entry: Tengu is not a live actor at all, and the door is still his locked one.
	const entry = {
		tengu: tenguOf() !== null,
		flag: s['tenguFightStarted'],
		door: doorState(),
		heroY: s['hero'].y,
	};

	// 2. The whole real-play path, not a staged one: walk the hero down the hallway from the cell
	//    he actually arrives on, bump the locked door with a real iron key (the guard drop), and
	//    step through into the cell - `takeHeroTurn` is the hook Java's `occupyCell` corresponds
	//    to. This is what the floor's own connectivity bug made impossible until this pass: the
	//    hallway spine at x=10 did not exist, so no key could ever have reached this door.
	const bagBefore = s['bag'].find('ironKey') ?? null;
	s['bag'].add({ id: 'ironKey', quantity: 1, identified: true });
	const walk = { start: { x: s['hero'].x, y: s['hero'].y } };
	for (let i = 0; i < 20 && s['hero'].y < 22; i++) {
		s['takeHeroTurn']({ x: 0, y: 1 });
		await sleep(120);
	}
	walk.atHallwayBottom = { x: s['hero'].x, y: s['hero'].y };
	walk.triggeredOnWalk = s['tenguFightStarted'];
	// standing in the hallway directly above the cell fires nothing: Java's test is the hero's
	// own y against `tenguCell.top`, not proximity to the door
	s['checkTenguFightStart']();
	const above = { tengu: tenguOf() !== null, flag: s['tenguFightStarted'] };
	// the door is still locked from this side; bumping it is what spends the key
	s['takeHeroTurn']({ x: 0, y: 1 });
	await sleep(300);
	const beforeStep = doorState();
	// ...and now step through it and past, into the cell. Row 23 is the door itself; the trigger
	// is `y > tenguCell.top`, so it takes the step beyond that.
	walk.stepsIntoCell = 0;
	for (let i = 0; i < 4 && s['hero'].y < 24; i++) {
		s['takeHeroTurn']({ x: 0, y: 1 });
		walk.stepsIntoCell++;
		await sleep(300);
	}
	walk.endedAt = { x: s['hero'].x, y: s['hero'].y };
	// `takeHeroTurn` is the move resolver on its own; the scene's input loop is what normally
	// refreshes the field of view after it, so the driving script has to do it here or the
	// screenshot below is fog. `explored` is asserted so a black frame cannot be mistaken for one.
	s['refresh']();
	await sleep(900);
	walk.explored = s['fov'].explored.size;
	const tengu = tenguOf();
	const afterStep = {
		heroY: s['hero'].y,
		tengu: tengu ? { x: tengu.x, y: tengu.y } : null,
		flag: s['tenguFightStarted'],
		door: doorState(),
		beforeStep,
		walk,
		keySpent: bagBefore === null && (s['bag'].find('ironKey') ?? null) === null,
		logged: (s['gameLog']?.['blocks'] ?? []).map((b) => b.text ?? b.label?.text ?? '').filter((t) => /Tengu/i.test(t)).slice(-2),
	};

	return { entry, above, afterStep };
});

// The trigger moment, as pixels - the door cell was just re-stitched, so this is also the check
// that the re-lock renders as a real door rather than as a corrupted tile.
await page.screenshot({ path: 'tools/scratch/tengu-start.png' });
// ...and zoomed onto the door cell itself, so a logically-closed door that still *draws* as an
// open one would show up here rather than only in the assertion above.
const doorPixel = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	// world -> screen through the same camera the map draws under; 16 world units per tile.
	const at = s['camera'].toScreen(10 * 16, 23 * 16);
	return { x: at.x, y: at.y, size: 16 * s['camera'].zoom };
});
await page.screenshot({
	path: 'tools/scratch/tengu-start-door.png',
	clip: { x: Math.max(0, doorPixel.x - doorPixel.size), y: Math.max(0, doorPixel.y - doorPixel.size), width: doorPixel.size * 3, height: doorPixel.size * 3 },
});

const result2 = await page.evaluate(async () => {
	const s = window.__MWG__.currentScene;
	const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
	const tenguOf = () => s['creatures'].find((c) => c.kind === 'tengu' && c.hp > 0) ?? null;
	const door = { x: 10, y: 23 };
	const doorState = () => ({
		isDoor: s['doors'].isDoor(door.x, door.y),
		isLocked: s['doors'].isLocked(door.x, door.y),
		isOpen: s['doors'].isOpen(door.x, door.y),
		passable: s['level'].passable(door.x, door.y),
	});

	// 4. Occupied centre: Java resolves `tenguCellCenter` first and falls back to a random free
	//    8-neighbour - it does not stack Tengu on whatever is standing there.
	s['tenguFightStarted'] = false;
	s['creatures'].splice(0, s['creatures'].length, ...s['creatures'].filter((c) => c.kind !== 'tengu'));
	s['spawnMonster']('rat', { x: 10, y: 27 });
	s['checkTenguFightStart']();
	const squatterTengu = tenguOf();
	const occupied = {
		tengu: squatterTengu ? { x: squatterTengu.x, y: squatterTengu.y } : null,
		onRat: squatterTengu ? (squatterTengu.x === 10 && squatterTengu.y === 27) : null,
		adjacent: squatterTengu ? Math.max(Math.abs(squatterTengu.x - 10), Math.abs(squatterTengu.y - 27)) === 1 : null,
		flag: s['tenguFightStarted'],
	};

	// 5. No free cell anywhere: Java abandons the whole transition (`return` before `seal()` and
	//    before the door lock) and retries on the hero's next move - the trigger must stay
	//    unspent, or the fight could be started with Tengu nowhere to stand.
	s['tenguFightStarted'] = false;
	s['creatures'].splice(0, s['creatures'].length, ...s['creatures'].filter((c) => c.kind !== 'tengu'));
	const blockers = [];
	for (const [dx, dy] of [[0, 0], [-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]) {
		s['spawnMonster']('rat', { x: 10 + dx, y: 27 + dy });
		blockers.push({ x: 10 + dx, y: 27 + dy });
	}
	s['checkTenguFightStart']();
	const blocked = { tengu: tenguOf() !== null, flag: s['tenguFightStarted'], blockers: blockers.length };

	// 6. A pre-trigger save: no flag, but a live entry-spawned Tengu already on the floor (the
	//    old behaviour). Staging exactly that must adopt the flag rather than spawn a second.
	s['creatures'].splice(0, s['creatures'].length, ...s['creatures'].filter((c) => c.kind !== 'tengu' && c.kind !== 'rat'));
	s['spawnMonster']('tengu', { x: 10, y: 27 });
	s['tenguFightStarted'] = false;
	s['checkTenguFightStart']();
	const migration = {
		tenguCount: s['creatures'].filter((c) => c.kind === 'tengu' && c.hp > 0).length,
		flag: s['tenguFightStarted'],
	};

	// 7. The door chain the three transitions share. Sealing the hero in at the trigger is only
	//    coherent because Java reopens the door twice more; getting that wrong strands the hero
	//    and makes the whole arena phase unreachable, so walk the chain here rather than trust it.
	s['creatures'].splice(0, s['creatures'].length, ...s['creatures'].filter((c) => c.kind !== 'rat'));
	const boss = tenguOf();
	s['tenguFightStarted'] = true;
	const halfBracket = Math.max(1, Math.floor(boss.maxHp / 8));
	boss.hp = Math.floor(boss.maxHp / 2);
	s['clampTenguBracket'](boss, boss.hp + 1);
	void halfBracket;
	await sleep(500);
	const atHalfHp = {
		phase: boss.tenguPhase,
		door: doorState(),
		// the retreat trigger must now be reachable: the hero can stand in the hallway again
		hallwayWalkable: s['level'].passable(10, 22),
	};

	// ...and the retreat itself, driven the way the fight drives it.
	s['hero'].x = 10; s['hero'].y = 24;
	s['refresh']();
	await sleep(200);
	s['hero'].y = 8;
	s['refresh']();
	s['checkTenguArenaRetreat']();
	await sleep(500);
	const afterRetreat = { phase: boss.tenguPhase, heroY: s['hero'].y, onEllipse: s['hero'].y <= 16 };

	// ...and the death transition's own door, which the walkable exit sits behind.
	s['applyTenguDeathTransition']();
	await sleep(500);
	const atDeath = { door: doorState(), heroY: s['hero'].y, hasStairs: s['hasStairs'] };

	return { occupied, blocked, migration, atHalfHp, afterRetreat, atDeath };
});
Object.assign(result, result2);

console.log('probe results:', JSON.stringify(result, null, 1));
const { entry, above, afterStep, occupied, blocked, migration, atHalfHp, afterRetreat, atDeath } = result;
const expect = [
	['on floor entry Tengu is not a live actor at all',
		entry.tengu === false && entry.flag === false],
	['and his door is the start map\'s own locked one, not a plain door',
		entry.door.isDoor === true && entry.door.isLocked === true && entry.door.isOpen === false && entry.door.passable === false],
	['waiting above the cell fires nothing (Java tests the hero\'s own y)',
		above.tengu === false && above.flag === false],
	['the hero can walk the whole hallway down to the door without triggering anything',
		afterStep.walk.atHallwayBottom.y === 22 && afterStep.walk.triggeredOnWalk === false],
	['stepping past the door spawns Tengu at Java\'s `tenguCellCenter` (10,27)',
		afterStep.tengu !== null && afterStep.tengu.x === 10 && afterStep.tengu.y === 27],
	['and it cost the real iron key, not a debug unlock',
		afterStep.keySpent === true],
	['the walked path is genuinely explored, so the screenshot below is the real floor',
		afterStep.walk.explored > 100],
	['and the trigger latches', afterStep.flag === true],
	['the door the iron key just opened is re-locked behind the hero',
		afterStep.beforeStep.isLocked === false && afterStep.beforeStep.isOpen === true
		&& afterStep.door.isLocked === true && afterStep.door.isOpen === false && afterStep.door.passable === false],
	['an occupied centre puts Tengu on a free neighbour instead of stacking him',
		occupied.tengu !== null && occupied.onRat === false && occupied.adjacent === true && occupied.flag === true],
	['with no free cell at all the whole transition is abandoned, not half-applied',
		blocked.tengu === false && blocked.flag === false],
	['a pre-trigger save\'s live Tengu is adopted, not duplicated',
		migration.tenguCount === 1 && migration.flag === true],
	['half HP repaints to `setMapPause()` and reopens the door the hero was sealed behind',
		atHalfHp.phase === 'paused' && atHalfHp.door.isLocked === false && atHalfHp.door.isOpen === false
		&& atHalfHp.door.passable === false && atHalfHp.hallwayWalkable === true],
	['so the retreat to row 8 is reachable in real play, and it fires the arena repaint',
		afterRetreat.phase === 'arena' && afterRetreat.heroY === 8 && afterRetreat.onEllipse === true],
	['the death transition leaves the door openable with its walkable exit behind it',
		atDeath.door.isLocked === false && atDeath.door.isDoor === true && atDeath.hasStairs === true
		&& atDeath.heroY === 25],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
console.log(`tengu start livecheck: ${expect.length - failed}/${expect.length} assertions`);
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed || problems.length ? 1 : 0;
