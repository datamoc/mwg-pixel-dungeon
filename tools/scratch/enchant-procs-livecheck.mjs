// Throwaway (tools/scratch): live-check the Blazing/Chilling/Shocking/Vampiric enchant procs.
//
// Each of the four used to be unconditional and wrong in effect; Java gives every one of them a
// level-scaled proc chance and a specific consequence, checked against tag v3.3.8:
//   Blazing  (level+1)/(level+3) -> reignite 8 turns, then leftover power as burn damage
//   Chilling (level+1)/(level+4) -> 3 x power turns of Chill, capped at 6 x power in total
//   Shocking flat 1/3            -> arc to every char within 2 cells (never the defender)
//   Vampiric (0.05 + 0.25*missing) -> heal round(damage/2 * power), capped by missing HP
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
	const freeCell = (fromX, fromY) => {
		for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
			const x = fromX + dx, y = fromY + dy;
			if (s.level.inside(x, y) && s.level.passable(x, y) && !s.creatureAt(x, y)) return { x, y };
		}
		return null;
	};
	hero.maxHp = 100;
	hero.hp = 100;
	hero.damage = [10, 10];
	const trials = 1500;

	// --- Blazing: a roll, ignition, and leftover power spent as burn damage
	s.weaponAffix = 'blazing';
	s.weaponLevel = 0;
	clearFloor();
	const burned = s.spawnMonster('rat', freeCell(hero.x, hero.y));
	burned.maxHp = burned.hp = 100000;
	let blazingProcs = 0;
	let burningSeen = 0;
	for (let i = 0; i < trials; i++) {
		delete burned.buffs.burning;
		s['heroOnHit'](hero, burned, 10);
		if (burned.buffs.burning !== undefined) { blazingProcs++; burningSeen = burned.buffs.burning; }
	}
	// with the target already burning, the proc's whole power goes to direct damage (1-2 at depth 1)
	const alreadyBurning = s.spawnMonster('snake', freeCell(hero.x, hero.y));
	alreadyBurning.maxHp = alreadyBurning.hp = 100000;
	let burnDamageHits = 0;
	let burnDamageTotal = 0;
	for (let i = 0; i < trials; i++) {
		alreadyBurning.buffs.burning = 8;
		const before = alreadyBurning.hp;
		s['heroOnHit'](hero, alreadyBurning, 10);
		const dealt = before - alreadyBurning.hp;
		if (dealt > 0) { burnDamageHits++; burnDamageTotal += dealt; }
	}

	// --- Chilling: the real Chill status, 3 turns per proc capped at 6 in total
	s.weaponAffix = 'chilling';
	const chilled = s.spawnMonster('rat', freeCell(hero.x, hero.y));
	chilled.maxHp = chilled.hp = 100000;
	let chillingProcs = 0;
	let dazeSeen = false;
	for (let i = 0; i < trials; i++) {
		delete chilled.buffs.chill;
		delete chilled.buffs.daze;
		s['heroOnHit'](hero, chilled, 10);
		if (chilled.buffs.chill !== undefined) chillingProcs++;
		if (chilled.buffs.daze !== undefined) dazeSeen = true;
	}
	// the cap: many procs in a row must never exceed 6 turns at level 0
	let capped = 0;
	for (let i = 0; i < 200; i++) s['heroOnHit'](hero, chilled, 10);
	capped = chilled.buffs.chill ?? 0;
	const singleProcChill = (() => {
		delete chilled.buffs.chill;
		for (let i = 0; i < 200 && chilled.buffs.chill === undefined; i++) s['heroOnHit'](hero, chilled, 10);
		return chilled.buffs.chill ?? 0;
	})();

	// --- Shocking: arcs to neighbours, never to the defender
	s.weaponAffix = 'shocking';
	clearFloor();
	const victim = s.spawnMonster('rat', freeCell(hero.x, hero.y));
	victim.maxHp = victim.hp = 100000;
	const neighbour = s.spawnMonster('snake', freeCell(victim.x, victim.y));
	neighbour.maxHp = neighbour.hp = 100000;
	let shockingProcs = 0;
	let victimDamage = 0;
	let neighbourDamage = 0;
	for (let i = 0; i < trials; i++) {
		victim.hp = neighbour.hp = 100000;
		s['heroOnHit'](hero, victim, 10);
		const vLost = 100000 - victim.hp;
		const nLost = 100000 - neighbour.hp;
		if (nLost > 0) { shockingProcs++; neighbourDamage = nLost; victimDamage += vLost; }
	}

	// --- Vampiric: a missing-HP-scaled chance to heal half the damage
	s.weaponAffix = 'vampiric';
	clearFloor();
	const biteTarget = s.spawnMonster('rat', freeCell(hero.x, hero.y));
	biteTarget.maxHp = biteTarget.hp = 100000;
	let vampiricProcs = 0;
	let healAmount = 0;
	let affixWrong = 0;
	let vampiricDiagnostics = {};
	for (let i = 0; i < trials; i++) {
		// the hero's maximum HP is re-derived from its stats elsewhere, so read it fresh
		const maxHp = hero.maxHp;
		const half = Math.floor(maxHp / 2);
		hero.hp = half;   // half missing: chance = 0.05 + 0.25*0.5 = 0.175
		s['heroOnHit'](hero, biteTarget, 10);
		const healed = hero.hp - half;
		if (healed > 0) { vampiricProcs++; healAmount = healed; }
		if (s['weaponAffix'] !== 'vampiric') affixWrong++;
		if (i === 0) vampiricDiagnostics = { maxHp, hp: hero.hp, affix: s['weaponAffix'], unstable: s['unstableDelegated'], ally: biteTarget.isAlly, npc: biteTarget.isNPC, attackMode: hero.attackMode };
	}
	// and nothing heals at full HP
	hero.hp = hero.maxHp;
	s['heroOnHit'](hero, biteTarget, 10);
	const healAtFull = hero.hp - hero.maxHp;

	s.weaponAffix = undefined;
	clearFloor();
	return {
		trials,
		blazing: { procs: blazingProcs, rate: +(blazingProcs / trials).toFixed(3), burning: burningSeen, burnDamageHits, burnDamageTotal },
		chilling: { procs: chillingProcs, rate: +(chillingProcs / trials).toFixed(3), dazeSeen, capped, singleProcChill },
		shocking: { procs: shockingProcs, rate: +(shockingProcs / trials).toFixed(3), neighbourDamage, victimDamage },
		vampiric: { procs: vampiricProcs, rate: +(vampiricProcs / trials).toFixed(3), healAmount, healAtFull, affixWrong, vampiricDiagnostics },
	};
});

console.log('probe results:', JSON.stringify(result, null, 1));
const expect = [
	['Blazing procs about 1 in 3 hits', result.blazing.rate > 0.28 && result.blazing.rate < 0.39],
	['Blazing ignites for the port\'s own Burning duration (Java\'s reignite sets 8)', result.blazing.burning === 3],
	['an already-burning target takes burn damage instead', result.blazing.burnDamageHits > 0 && result.blazing.burnDamageTotal > 0],
	['Chilling procs about 1 in 4 hits', result.chilling.rate > 0.20 && result.chilling.rate < 0.30],
	['Chilling applies Chill and never Daze', result.chilling.singleProcChill === 3 && result.chilling.dazeSeen === false],
	['Chill is capped at 6 turns at level 0', result.chilling.capped === 6],
	['Shocking procs about 1 in 3 hits', result.shocking.rate > 0.28 && result.shocking.rate < 0.39],
	['the arc damages the neighbour for half the hit', result.shocking.neighbourDamage === 5],
	['the arc never damages the defender itself', result.shocking.victimDamage === 0],
	['Vampiric procs about 17.5% of the time at half HP', result.vampiric.rate > 0.13 && result.vampiric.rate < 0.22],
	['and heals half the damage dealt', result.vampiric.healAmount === 5],
	['nothing heals at full HP', result.vampiric.healAtFull === 0],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed ? 1 : 0;
