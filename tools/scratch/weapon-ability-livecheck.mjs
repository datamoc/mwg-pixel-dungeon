// Throwaway (tools/scratch): Duelist T-key weapon abilities - sneak spends 2 charges for
// invisibility, the flail spins to 3 with free re-spins and a warn at the cap, a cleave kill
// refunds the next cleave free within 5 turns, heavy blow dazes 5, the armed COUNTER_ABILITY
// tracker discounts a rank-4 sneak to free and is consumed, and landed melee AND thrown-copy
// hits both feed combo strike's recent-hit window.
//
// Run after `npm run build`:  node tools/scratch/weapon-ability-livecheck.mjs
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
const page = await (await browser.newContext({ viewport: { width: 1024, height: 768 } })).newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`console.error: ${m.text()}`); });

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=weapon-ability', { waitUntil: 'load', timeout: 120000 });
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
	const out = {};
	const setWeapon = (cls) => { s['weaponSourceClass'] = cls; s['weaponCharge'] = 10; };
	const spawnAwakeRat = (hp) => {
		const h = s['hero'];
		const cell = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]
			.map(([dx, dy]) => ({ x: h.x + dx, y: h.y + dy }))
			.find((c) => s['level'].passable(c.x, c.y) && !s['creatureAt'](c.x, c.y));
		const foe = s['spawnMonster']('rat', cell);
		foe.hp = hp;
		foe.sleeping = false;
		foe.seesHero = true;
		return foe;
	};

	// Sneak: 2 charges for invisibility, no target needed.
	setWeapon('Dagger');
	s['useWeaponAbility']();
	await sleep(300);
	out.sneakCharge = s['weaponCharge'];
	out.sneakInvis = s['hero'].buffs['invisibility'] ?? 0;

	// Spin: first spin costs, re-spins are free to 3, the fourth warns.
	setWeapon('Flail');
	s['useWeaponAbility'](); await sleep(200);
	out.spin1 = [s['spinSpins'], s['weaponCharge']];
	s['useWeaponAbility'](); await sleep(200);
	out.spin2 = [s['spinSpins'], s['weaponCharge']];
	s['useWeaponAbility'](); await sleep(200);
	out.spin3 = [s['spinSpins'], s['weaponCharge']];
	s['useWeaponAbility'](); await sleep(200);
	out.spin4 = [s['spinSpins'], s['weaponCharge']];
	s['spinSpins'] = 0; s['spinTurns'] = 0;

	// Cleave kill refunds the next cleave free.
	setWeapon('Shortsword');
	const foeA = spawnAwakeRat(1);
	s['useWeaponAbility'](); await sleep(300);
	// cleaveFreeTurns reads 4, not 5: the kill arms 5, then the ability's own spent turn
	// ticks it once - same spent-turn coupling as the daze below. Charge stays capped.
	out.cleaveKill = [foeA.hp <= 0, s['cleaveFreeTurns'] > 0, s['weaponCharge']];
	const foeB = spawnAwakeRat(200);
	const chargeBeforeFree = s['weaponCharge'];
	const hpBeforeFree = foeB.hp;
	s['useWeaponAbility'](); await sleep(300);
	out.cleaveFree = [s['weaponCharge'] === chargeBeforeFree, foeB.hp < hpBeforeFree];
	s['kill'](foeB); await sleep(200);

	// Heavy blow dazes 5 on an aware target (full cost, no surprise discount).
	setWeapon('Mace');
	const foeC = spawnAwakeRat(200);
	s['useWeaponAbility'](); await sleep(300);
	// Charge 9, not 8: the strike costs 2, then lands - and a landed melee strike accrues
	// a charge itself, so a landed 2-cost ability nets -1. Daze reads 4+: applied at 5,
	// then the ability's own spent turn ticks it once.
	out.heavy = [s['weaponCharge'], foeC.buffs['daze'] ?? 0];
	s['kill'](foeC); await sleep(200);

	// COUNTER_ABILITY at rank 4 makes a 2-charge sneak free and consumes the tracker.
	setWeapon('Dagger');
	s['talentRanks']['counter_ability'] = 4;
	s['hero'].buffs['counterAbility'] = 3;
	s['useWeaponAbility'](); await sleep(300);
	out.counter = [s['weaponCharge'], s['hero'].buffs['counterAbility']];

	// Combo window: landed melee hits and thrown-copy hits both count.
	s['recentHitClocks'] = [];
	const bag = spawnAwakeRat(500);
	let meleeHits = 0;
	for (let i = 0; i < 8 && meleeHits < 2; i++) {
		const before = bag.hp;
		s['attack'](s['hero'], bag);
		await sleep(150);
		if (bag.hp < before) meleeHits++;
	}
	out.comboMelee = [meleeHits, s['recentHitClocks'].length];
	const windowBefore = s['recentHitClocks'].length;
	let thrownHits = 0;
	for (let i = 0; i < 8 && thrownHits < 1; i++) {
		const before = bag.hp;
		s['attack']({ ...s['hero'], kind: undefined, attackMode: 'throw' }, bag);
		await sleep(150);
		if (bag.hp < before) thrownHits++;
	}
	out.comboThrown = [thrownHits, s['recentHitClocks'].length - windowBefore];
	return out;
});
await page.screenshot({ path: 'tools/scratch/weapon-ability-live.png' });
await browser.close();

const checks = [
	['sneak spends 2 charges', result.sneakCharge === 8],
	['sneak grants invisibility', result.sneakInvis > 0],
	['first spin costs 2', JSON.stringify(result.spin1) === JSON.stringify([1, 8])],
	['re-spin is free', JSON.stringify(result.spin2) === JSON.stringify([2, 8])],
	['spin caps at 3', JSON.stringify(result.spin3) === JSON.stringify([3, 8])],
	['fourth spin warns, spends nothing', JSON.stringify(result.spin4) === JSON.stringify([3, 8])],
	['cleave kill refunds free turns at no cost', JSON.stringify(result.cleaveKill) === JSON.stringify([true, true, 10])],
	['free recast costs nothing and lands', JSON.stringify(result.cleaveFree) === JSON.stringify([true, true])],
	['heavy blow nets -1 (cost 2, landed strike accrues 1) and dazes', result.heavy[0] === 9 && result.heavy[1] >= 4],
	['rank-4 counter makes sneak free and is consumed', JSON.stringify(result.counter) === JSON.stringify([10, undefined])],
	['landed melee hits feed the combo window', result.comboMelee[0] >= 2 && result.comboMelee[1] >= 2],
	['a landed thrown-copy hit feeds it too', result.comboThrown[0] >= 1 && result.comboThrown[1] >= 1],
	['no console errors', problems.length === 0],
];
let failed = 0;
for (const [label, ok] of checks) {
	console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
	if (!ok) failed++;
}
console.log(JSON.stringify({ ...result, problems }));
process.exit(failed === 0 ? 0 : 1);
