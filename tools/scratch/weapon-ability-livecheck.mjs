// Throwaway (tools/scratch): Duelist T-key weapon abilities under the Java-exact
// `Charger` economy - every ability costs 1 charge spent partial-first, sneak grants
// (2+weaponLevel)-1 invisibility free, the flail's first spin costs 1 with free re-spins
// to 3, a cleave kill refunds the next cleave free, heavy blow costs 1 even on surprise
// (surprise gates the bonus only) and dazes 5, the armed COUNTER_ABILITY tracker refunds
// rank*0.375 after the spend and is consumed, the charged shot readies free, and landed
// melee AND thrown-copy hits both feed combo strike's recent-hit window (but no charge -
// accrual is time-only).
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
	const setWeapon = (cls) => { s['weaponSourceClass'] = cls; s['weaponCharge'] = 10; s['weaponPartialCharge'] = 0; };
	const spendCalls = [];
	const origSpend = s['spendHeroAction'].bind(s);
	s['spendHeroAction'] = (c) => { spendCalls.push(c); return origSpend(c); };
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

	// Sneak: 1 charge, (2+weaponLevel)-1 invisibility, no turn spent.
	setWeapon('Dagger');
	s['weaponLevel'] = 0;
	spendCalls.length = 0;
	s['useWeaponAbility']();
	await sleep(300);
	out.sneak = [s['weaponCharge'], s['hero'].buffs['invisibility'] ?? 0, spendCalls.length];

	// Spin: first spin costs 1, re-spins are free to 3, the fourth warns.
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

	// Cleave: first cast costs 1, a kill refunds the next one free.
	setWeapon('Shortsword');
	const foeA = spawnAwakeRat(1);
	s['useWeaponAbility'](); await sleep(300);
	// cleaveFreeTurns reads 4, not 5: the kill arms 5, then the ability's own spent turn
	// ticks it once.
	out.cleaveKill = [foeA.hp <= 0, s['cleaveFreeTurns'] > 0, s['weaponCharge']];
	const foeB = spawnAwakeRat(200);
	const chargeBeforeFree = s['weaponCharge'];
	const hpBeforeFree = foeB.hp;
	s['useWeaponAbility'](); await sleep(300);
	out.cleaveFree = [s['weaponCharge'] === chargeBeforeFree, foeB.hp < hpBeforeFree];
	s['kill'](foeB); await sleep(200);

	// Heavy blow on an aware target: costs 1 (surprise gates the bonus, never the cost),
	// dazes, and lands without accruing anything back.
	setWeapon('Mace');
	const foeC = spawnAwakeRat(200);
	s['useWeaponAbility'](); await sleep(300);
	// Daze reads 4+: applied at 5, then the ability's own spent turn ticks it once.
	out.heavy = [s['weaponCharge'], foeC.buffs['daze'] ?? 0];
	s['kill'](foeC); await sleep(200);

	// COUNTER_ABILITY at rank 4: sneak spends 1, then refunds 1.5 and consumes the tracker.
	setWeapon('Dagger');
	s['weaponCharge'] = 1; s['weaponPartialCharge'] = 0;
	s['talentRanks']['counter_ability'] = 4;
	s['hero'].buffs['counterAbility'] = 3;
	s['useWeaponAbility'](); await sleep(300);
	out.counter = [s['weaponCharge'], s['weaponPartialCharge'], s['hero'].buffs['counterAbility']];
	s['talentRanks']['counter_ability'] = 0;

	// Charged shot readies free: 1 charge, no turn spent.
	setWeapon('Crossbow');
	spendCalls.length = 0;
	s['useWeaponAbility'](); await sleep(300);
	out.shot = [s['weaponCharge'], s['chargedShotArmed'], spendCalls.length];
	s['chargedShotArmed'] = false;

	// Time accrual through the scene tick: 0.99 banks one charge, over-cap drops.
	s['weaponCharge'] = 0; s['weaponPartialCharge'] = 0.99;
	s['tickWeaponAbility'](1); await sleep(200);
	out.accrue = [s['weaponCharge'], s['weaponPartialCharge']];
	s['weaponCharge'] = 5; s['weaponPartialCharge'] = 0.3;
	s['tickWeaponAbility'](1); await sleep(200);
	out.accrueCap = [s['weaponCharge'], s['weaponPartialCharge']];

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
	['sneak costs 1, grants 1 invisibility, spends no turn', JSON.stringify(result.sneak) === JSON.stringify([9, 1, 0])],
	['first spin costs 1', JSON.stringify(result.spin1) === JSON.stringify([1, 9])],
	['re-spin is free', JSON.stringify(result.spin2) === JSON.stringify([2, 9])],
	['spin caps at 3', JSON.stringify(result.spin3) === JSON.stringify([3, 9])],
	['fourth spin warns, spends nothing', JSON.stringify(result.spin4) === JSON.stringify([3, 9])],
	['cleave kill costs 1 and refunds free turns', result.cleaveKill[0] === true && result.cleaveKill[1] === true && result.cleaveKill[2] === 9],
	['free recast costs nothing and lands', JSON.stringify(result.cleaveFree) === JSON.stringify([true, true])],
	['heavy blow costs 1 with no accrual payback and dazes', result.heavy[0] === 9 && result.heavy[1] >= 4],
	['rank-4 counter refunds 1.5 and is consumed', result.counter[0] === 1 && result.counter[1] === 0.5 && result.counter[2] === undefined],
	['charged shot readies for 1 charge, no turn', JSON.stringify(result.shot) === JSON.stringify([9, true, 0])],
	['scene tick banks the crossing fraction', result.accrue[0] === 1 && Math.abs(result.accrue[1] - (0.99 + 1 / 57 - 1)) < 1e-9],
	['over-cap tick drops the fraction', JSON.stringify(result.accrueCap) === JSON.stringify([5, 0])],
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
