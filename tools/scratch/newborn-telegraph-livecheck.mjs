// Throwaway (tools/scratch): the newborn fire elemental's telegraphed fireball.
//
// Three things this port used to state as simplifications, now implemented: the `TargetedCell` red
// 3x3 telegraph, the charge's hero-cooldown-scaled turn cost (Java's
// `gate(attackDelay(), ceil(hero.cooldown()), 3*attackDelay())`), and the cooldown ticking on every
// turn while hunting rather than only on non-adjacent ones.
//
// Run after `npm run build`:  node tools/scratch/newborn-telegraph-livecheck.mjs
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const globalRoot = process.env.GLOBAL_NODE_MODULES ?? 'C:\\Users\\miche\\AppData\\Roaming\\npm\\node_modules';
const { chromium } = require(path.join(globalRoot, 'playwright'));
const browser = await chromium.launch({
	executablePath: path.join(process.env.LOCALAPPDATA ?? 'C:\\Users\\miche\\AppData\\Local', 'ms-playwright', 'chromium-1193', 'chrome-win', 'chrome.exe'),
	args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await (await browser.newContext({ viewport: { width: 1024, height: 768 } })).newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`console.error: ${m.text()}`); });
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=newborn-telegraph', { waitUntil: 'load', timeout: 120000 });
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
	s['depth'] = 11;
	s['enterLevel']();
	await sleep(3500);

	// a newborn elemental a few cells from the hero, aware and off cooldown. The charge needs a clear
	// bolt line to the hero (`Ballistica` `STOP_SOLID|STOP_TARGET`), so cells are tried until the
	// game's own targeting accepts one rather than assuming the first free cell has line of sight.
	let spawn = null;
	let turned = false;
	const candidates = [];
	for (let y = 0; y < s['level'].height; y++) {
		for (let x = 0; x < s['level'].width; x++) {
			const distance = Math.max(Math.abs(x - s['hero'].x), Math.abs(y - s['hero'].y));
			if (distance >= 3 && distance <= 6 && s['level'].passable(x, y) && !s['creatureAt'](x, y)) candidates.push({ x, y });
		}
	}
	if (candidates.length === 0) return { found: false };
	for (const cell of candidates) {
		if (spawn) s['moveTo'](spawn, cell); else spawn = s['spawnMonster']('newbornElemental', cell);
		spawn.seesHero = true;
		spawn.rangedCooldown = 0;
		turned = s['newbornElementalTurn'](spawn);
		if (turned) break;
	}
	if (!spawn) return { found: false };

	// the charge: a pending target beside the hero, the red telegraph over its 3x3, and Java's cost
	const overlayRects = s['targetedCells'] ? s['targetedCells'].context?.instructions?.length ?? -1 : null;
	const pending = spawn.newbornTarget ?? null;
	const cost = s['pendingMonsterTurnCost'];
	const heroCost = s['getAttackTurnCostMod']();
	let painted = 0;
	if (pending) {
		for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
			const x = pending.x + dx, y = pending.y + dy;
			if (s['level'].inside(x, y) && s['level'].passable(x, y)) painted++;
		}
	}

	// the next turn detonates that telegraphed cell (Java's charge-then-zap pair)
	const hadTelegraph = spawn.newbornTarget !== null;
	const fireBefore = s['fire'].total();
	s['newbornElementalTurn'](spawn);
	await sleep(200);

	// ...and the cooldown ticks on an adjacent melee turn too, which never reaches this method
	spawn.newbornTarget = null;
	spawn.rangedCooldown = 5;
	const before = spawn.rangedCooldown;
	s['hero'].x = spawn.x + 1; s['hero'].y = spawn.y;
	s['takeMonsterTurn'](spawn);
	const afterAdjacent = spawn.rangedCooldown;
	const afterBlast = {
		targetCleared: spawn.newbornTarget === null,
		fireAdded: s['fire'].total() - fireBefore,
		cooldownReRolled: spawn.rangedCooldown,
		overlayRects: s['targetedCells']?.context?.instructions?.length ?? -1,
	};
	return {
		found: true, turned, pending, painted, heroCost, cost, overlayRects,
		cooldown: { before, afterAdjacent }, hadTelegraph, afterBlast,
	};
});
console.log('probe results:', JSON.stringify(result, null, 1));
if (result.found === false) {
	console.log('SKIP no free cell at a usable distance');
	await browser.close();
	process.exit(0);
}
const expect = [
	['the charge aims at a cell beside the hero and paints the red 3x3 over every passable one',
		result.turned === true && result.pending !== null && result.painted > 0 && result.overlayRects === result.painted],
	["the charge's turn cost is Java's gate(attackDelay(), ceil(hero.cooldown()), 3*attackDelay())",
		result.cost === Math.min(3, Math.max(1, Math.ceil(result.heroCost)))],
	['the cooldown still ticks on an adjacent melee turn (`Elemental.act()` ticks every hunting turn)',
		result.cooldown.afterAdjacent === result.cooldown.before - 1],
	['the blast clears the telegraph and re-rolls the cooldown',
		result.hadTelegraph === true && result.afterBlast.targetCleared === true
		&& result.afterBlast.overlayRects === 0 && result.afterBlast.cooldownReRolled >= 3
		&& result.afterBlast.cooldownReRolled <= 5],
	['the blast seeds real fire on the target cells', result.afterBlast.fireAdded > 0],
	['no page errors', true],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
console.log(`newborn telegraph livecheck: ${expect.length - failed}/${expect.length} assertions`);
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed || problems.length ? 1 : 0;
