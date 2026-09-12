// Throwaway (tools/scratch): live-check Preparation's blink strike.
//
// Java (`Preparation.doAction()`/its cell listener): the action exists only while Preparation is up
// (the hero is invisible); picking an already-adjacent enemy just attacks, picking a further one
// steps to the cheapest free cell beside it within `AttackLevel.blinkDistance()` and strikes from
// there, and an unreachable or rooted case refuses with `out_of_reach`.
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
	const originalSubclass = s.subclass.bind(s);
	const originalTalentRank = s.talentRank.bind(s);
	// an Assassin with ASSASSINS_REACH, so the blink ranges are level 4's own (4/6/8/10)
	s.subclass = () => 'assassin';
	s.talentRank = (key) => (key === 'assassins_reach' ? 3 : originalTalentRank(key));
	s.refresh();

	const clearFloor = () => { for (const c of [...s.creatures]) if (!c.isHero) { c.hp = 0; s.kill(c); } };
	// every case starts from the same cell, so a blink in one cannot decide whether the next has a
	// clear line to work with
	const start = { x: s.hero.x, y: s.hero.y };
	/** the first of the 8 directions with `steps` clear passable cells from the hero, so each case
	 * is independent of wherever the previous blink left the hero */
	const clearLine = (steps) => {
		for (const [dx, dy] of RoguelikeOffsets()) {
			let ok = true;
			for (let i = 1; i <= steps; i++) {
				const x = s.hero.x + dx * i, y = s.hero.y + dy * i;
				if (!s.level.inside(x, y) || !s.level.passable(x, y)) { ok = false; break; }
			}
			if (ok) return { dx, dy };
		}
		return null;
	};
	const RoguelikeOffsets = () => [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
	/** spawn an enemy `steps` cells away along a clear line, then blink onto it.
	 * `turnsInvis`/`reach` choose the blink distance: level 4 with ASSASSINS_REACH 3 gives 10, and
	 * level 1 with reach 0 gives 1, which is how the refusal boundary is exercised in a small room. */
	const blinkFrom = (steps, { turnsInvis = 9, reach = 3 } = {}) => {
		clearFloor();
		s['moveTo'](s.hero, start);
		const dir = clearLine(steps);
		if (!dir) return { skipped: true, steps };
		const enemy = s.spawnMonster('rat', { x: s.hero.x + dir.dx * steps, y: s.hero.y + dir.dy * steps });
		enemy.maxHp = enemy.hp = 100000;
		enemy.armor = [0, 0];
		enemy.evasion = 0;
		enemy.sleeping = true;
		s.talentRank = (key) => (key === 'assassins_reach' ? reach : originalTalentRank(key));
		const hero = s.hero;
		hero.hp = hero.maxHp;
		hero.buffs['invisibility'] = 9999;
		s['prepInvisibleTurns'] = turnsInvis;
		// the scene syncs the mirror on attack/turn; a probe setting the counter directly has to
		// ask for the same sync before the HUD reflects it
		s['syncPreparation']();
		s.refresh();
		const buttonVisible = s.actionBar['preparationButton'].visible === true;
		const before = { x: hero.x, y: hero.y, enemyHp: enemy.hp };
		s['usePreparationBlink']();
		const aiming = s.aiming !== null;
		const aimState = {};
		if (aiming) {
			// the cursor starts on the hero; walk it exactly onto the enemy's cell
			for (let i = 0; i < steps; i++) s.aiming.controller.move(dir.dx, dir.dy);
			aimState.cursor = { ...s.aiming.controller.target };
			aimState.valid = s.aiming.controller.valid;
			aimState.distance = s.aiming.controller.distance;
			aimState.enemyCell = { x: enemy.x, y: enemy.y };
			aimState.confirmed = s['confirmAiming']();
		}
		const after = { x: hero.x, y: hero.y, enemyHp: enemy.hp, distance: Math.max(Math.abs(hero.x - enemy.x), Math.abs(hero.y - enemy.y)) };
		return {
			buttonVisible, aiming, aimState, moved: after.x !== before.x || after.y !== before.y,
			adjacentAfter: after.distance <= 1, dealt: before.enemyHp - after.enemyHp,
			teleportDistance: Math.max(Math.abs(after.x - before.x), Math.abs(after.y - before.y)),
		};
	};

	const near = blinkFrom(1);      // already adjacent: Java just attacks, no teleport
	const three = blinkFrom(3);     // inside level 4's range with reach 3 (10)
	// the refusal boundary: at level 1 with no ASSASSINS_REACH the blink distance is 1, so a
	// target 3 cells away has no free neighbour within one step of the hero and must be refused
	const refused = blinkFrom(3, { turnsInvis: 1, reach: 0 });

	// the button must be gone without Preparation
	clearFloor();
	delete s.hero.buffs['invisibility'];
	s['prepInvisibleTurns'] = 0;
	s['syncPreparation']();
	s.refresh();
	const buttonWithoutPrep = s.actionBar['preparationButton'].visible === true;

	s.subclass = originalSubclass;
	s.talentRank = originalTalentRank;
	return { near, three, refused, buttonWithoutPrep };
});

console.log('probe results:', JSON.stringify(result, null, 1));
const expect = [
	['the blink button is visible while prepared', result.near.buttonVisible === true],
	['the blink button is gone without Preparation', result.buttonWithoutPrep === false],
	['the action opens an aim', result.near.aiming === true],
	['an adjacent target is attacked without moving', result.near.moved === false && result.near.dealt > 0],
	['a target 3 cells away is blinked onto and struck', result.three.moved === true && result.three.adjacentAfter === true && result.three.dealt > 0],
	['the blink moved the hero but not the whole way', result.three.teleportDistance > 0 && result.three.teleportDistance < 3],
	['a target beyond the blink distance is refused, not attacked', result.refused.moved === false && result.refused.dealt === 0],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed ? 1 : 0;
