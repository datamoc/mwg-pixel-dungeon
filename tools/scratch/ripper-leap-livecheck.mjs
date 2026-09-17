// Throwaway (tools/scratch): the RipperDemon's two-turn telegraphed leap.
//
// The fifth family matrix's pilot recommendation: trigger arms a landing cell off
// cooldown/seen/unrooted at 3+ cells (far-side prediction on a moved enemy), execution
// next turn resets the cooldown first, re-traces, bounces off occupants and pounces with
// an infinite-accuracy hit plus 0.75x Bleeding.
//
// Run after `npm run build`:  node tools/scratch/ripper-leap-livecheck.mjs
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
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=ripper-leap', { waitUntil: 'load', timeout: 120000 });
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

	const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
	const hero = s['hero'];
	// a ripper a few cells from the hero with a clear corridor between them
	let spawn = null;
	const candidates = [];
	for (let y = 0; y < s['level'].height; y++) {
		for (let x = 0; x < s['level'].width; x++) {
			const d = cheb({ x, y }, hero);
			if (d >= 3 && d <= 6 && s['level'].passable(x, y) && !s['creatureAt'](x, y)) candidates.push({ x, y });
		}
	}
	if (candidates.length === 0) return { found: false };
	for (const cell of candidates) {
		if (spawn) s['moveTo'](spawn, cell); else spawn = s['spawnMonster']('ripperDemon', cell);
		spawn.sleeping = false;
		spawn.seesHero = true;
		spawn.leapCooldown = 0;
		spawn.leapPrevEnemy = { x: hero.x, y: hero.y };
		if (s['takeRipperLeapTrigger'](spawn, cheb(spawn, hero))) break;
		spawn.leapTarget = null;
	}
	if (!spawn || !spawn.leapTarget) return { found: false, reason: 'no trigger cell' };
	const armed = { ...spawn.leapTarget };
	const cost = s['pendingMonsterTurnCost'];

	// turn 2 executes the armed leap: the hero is on the landing cell, so the ripper
	// bounces beside them, lands the hit and bleeds them
	const heroHp = hero.hp;
	s['executeRipperLeap'](spawn);
	await sleep(200);
	const after = {
		targetCleared: spawn.leapTarget === null,
		cooldown: spawn.leapCooldown,
		moved: spawn.x !== armed.x || spawn.y !== armed.y || cheb(spawn, hero) <= 1,
		heroHurt: hero.hp < heroHp,
		bleeding: hero.buffs['bleeding'] ?? 0,
		ripperAt: { x: spawn.x, y: spawn.y },
	};

	// a rooted ripper stands down instead: cooldown still resets, no relocation, no hit
	spawn.leapTarget = { x: hero.x, y: hero.y };
	spawn.leapCooldown = 0;
	const rootedAt = { x: spawn.x, y: spawn.y };
	spawn.buffs['roots'] = 5;
	const hpBeforeRoot = hero.hp;
	const rootedFired = s['executeRipperLeap'](spawn);
	const rootedAfter = {
		fired: rootedFired,
		targetCleared: spawn.leapTarget === null,
		cooldownReset: (spawn.leapCooldown ?? 0) > 0,
		unmoved: spawn.x === rootedAt.x && spawn.y === rootedAt.y,
		heroUnhurt: hero.hp === hpBeforeRoot,
	};
	delete spawn.buffs['roots'];

	// the pre-turn hook ticks the cooldown (but never while paralysed) and rotates tracking
	spawn.leapCooldown = 3;
	spawn.leapLastEnemy = { x: 1, y: 1 };
	s['monsterTurnHooks']['ripperDemon'](spawn);
	const ticked = spawn.leapCooldown;
	const rotated = { prev: { ...spawn.leapPrevEnemy }, last: { ...spawn.leapLastEnemy } };
	spawn.leapCooldown = 3;
	spawn.buffs['paralysis'] = 5;
	s['monsterTurnHooks']['ripperDemon'](spawn);
	const frozen = spawn.leapCooldown;
	delete spawn.buffs['paralysis'];

	return {
		found: true, armed, cost, after, rootedAfter,
		hook: { ticked, frozen, rotated, heroAt: { x: hero.x, y: hero.y } },
	};
});
console.log('probe results:', JSON.stringify(result, null, 1));
if (result.found === false) {
	console.log('SKIP no free cell at a usable distance');
	await browser.close();
	process.exit(0);
}
const expect = [
	['the trigger arms the hero cell for a stationary hero and costs one turn',
		result.armed.x === result.hook.heroAt.x && result.armed.y === result.hook.heroAt.y && result.cost === 1],
	['execution clears the target and resets a 2-4 cooldown',
		result.after.targetCleared === true && result.after.cooldown >= 2 && result.after.cooldown <= 4],
	['execution relocates the ripper next to the hero and hurts them',
		result.after.moved === true && result.after.heroHurt === true],
	['the pounce bleeds the hero', result.after.bleeding > 0],
	['a rooted ripper stands down: target cleared, cooldown reset, no move, no hit',
		result.rootedAfter.fired === true && result.rootedAfter.targetCleared === true
		&& result.rootedAfter.cooldownReset === true && result.rootedAfter.unmoved === true
		&& result.rootedAfter.heroUnhurt === true],
	['the hook ticks the cooldown, freezes it while paralysed, and rotates tracking',
		result.hook.ticked === 2 && result.hook.frozen === 3
		&& result.hook.rotated.prev.x === 1 && result.hook.rotated.last.x === result.hook.heroAt.x],
	['no page errors', true],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
await page.screenshot({ path: 'C:/tmp/ripper-leap.png' });
console.log(`ripper leap livecheck: ${expect.length - failed}/${expect.length} assertions`);
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed || problems.length ? 1 : 0;
