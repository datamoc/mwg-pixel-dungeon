// Throwaway (tools/scratch): live-check the new Preparation (stealth Assassin) behaviour.
//
// Java: while invisible, the hero's attack damage roll is *replaced* by the best of 1-3 rolls with
// its own percentage bonus (10/20/35/50% at 1/3/5/9 turns of invisibility), and the attack may
// execute a weak enemy outright - only while `Preparation` is up, at `AttackLevel.KOThreshold()`
// from the level and the `enhanced_lethality` rank, bosses at a fifth.
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
	for (const c of [...s.creatures]) if (!c.isHero) { c.hp = 0; s.kill(c); }
	const cell = () => {
		for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
			const x = s.hero.x + dx, y = s.hero.y + dy;
			if (s.level.inside(x, y) && s.level.passable(x, y)) return { x, y };
		}
		return null;
	};
	const originalTalentRank = s.talentRank.bind(s);
	const originalSubclass = s.subclass.bind(s);

	/** strike a fresh rat for `turns` of invisibility and report the HP it lost */
	const strike = (turns, damageRange, { invisible = true, subclass = null, ranks = {} } = {}) => {
		s.subclass = () => subclass ?? originalSubclass();
		s.talentRank = (key) => (key in ranks ? ranks[key] : originalTalentRank(key));
		const mob = s.spawnMonster('rat', cell());
		mob.maxHp = mob.hp = 100000;
		mob.armor = [0, 0];
		mob.evasion = 0;
		mob.sleeping = true;
		const hero = s.hero;
		hero.damage = damageRange;
		hero.str = hero.strReq ?? hero.str;
		if (invisible) hero.buffs['invisibility'] = 9999;
		else delete hero.buffs['invisibility'];
		s['prepInvisibleTurns'] = turns;
		const before = mob.hp;
		// diagnostics: what the scene actually holds, and what syncing produces
		const syncWorked = typeof s['syncPreparation'] === 'function';
		if (syncWorked) s['syncPreparation']();
		const prepBefore = hero.prepLevel;
		const counterRead = s['prepInvisibleTurns'];
		const strInfo = { str: hero.str, strReq: hero.strReq, damage: hero.damage };
		s.attack(hero, mob);
		const dealt = before - mob.hp;
		const prepLevel = hero.prepLevel;
		const prepped = s['prepInvisibleTurns'];
		mob.hp = 0;
		s.kill(mob);
		return { dealt, prepLevel, counter: prepped, prepBefore, counterRead, syncWorked, strInfo };
	};

	/** many strikes, reporting the single largest hit (to separate the roll counts) */
	const ceiling = (turns, trials) => {
		let max = 0;
		for (let i = 0; i < trials; i++) max = Math.max(max, strike(turns, [1, 20]).dealt);
		return max;
	};

	const flat = [10, 10];
	const byTurns = {
		none: strike(0, flat, { invisible: false }),
		one: strike(1, flat),
		three: strike(3, flat),
		five: strike(5, flat),
		nine: strike(9, flat),
	};
	const ceilings = { one: ceiling(1, 60), nine: ceiling(9, 60) };

	// assassinate: a target at 99% of maximum, with the Assassin's `enhanced_lethality`
	const assassinate = (turns, hpFraction, { invisible = true, rank = 3, boss = false } = {}) => {
		s.subclass = () => 'assassin';
		s.talentRank = (key) => (key === 'enhanced_lethality' ? rank : originalTalentRank(key));
		const mob = s.spawnMonster(boss ? 'goo' : 'rat', cell());
		mob.maxHp = 1000;
		mob.hp = Math.round(1000 * hpFraction);
		mob.armor = [0, 0];
		mob.evasion = 0;
		mob.sleeping = true;
		const hero = s.hero;
		hero.damage = [1, 1];   // negligible, so only an execute can kill
		hero.str = hero.strReq ?? hero.str;
		if (invisible) hero.buffs['invisibility'] = 9999;
		else delete hero.buffs['invisibility'];
		s['prepInvisibleTurns'] = turns;
		s.attack(hero, mob);
		const died = mob.hp <= 0;
		mob.hp = 0;
		s.kill(mob);
		return died;
	};

	const assassinations = {
		level4Rank3At99: assassinate(9, 0.99),
		level1Rank0At99: assassinate(1, 0.99, { rank: 0 }),
		noPrepAt99: assassinate(9, 0.99, { invisible: false }),
		// The threshold is read on the HP `damage()` leaves - exactly Java's own post-damage
		// position, since `canKO` runs after `enemy.damage()`. The hit itself is prep-boosted:
		// `[1,1]` at level 4 becomes round(1 * 1.5) = 2 damage, so the 0.2 boundary (200/1000)
		// sits at a starting 202 (survives, 0.20 is not `<`) versus 201 (lands on 0.199, dies).
		bossAboveBoundary: assassinate(9, 0.202, { boss: true }),
		bossAtBoundary: assassinate(9, 0.201, { boss: true }),
	};

	s.talentRank = originalTalentRank;
	s.subclass = originalSubclass;
	return { byTurns, ceilings, assassinations };
});

console.log('probe results:', JSON.stringify(result));
const expect = [
	['no invisibility means no Preparation bonus (10 stays 10)', result.byTurns.none.dealt === 10],
	['1 turn invisible = level 1, +10% (10 -> 11)', result.byTurns.one.dealt === 11],
	['3 turns = level 2, +20% (10 -> 12)', result.byTurns.three.dealt === 12],
	['5 turns = level 3, +35% (10 -> 14)', result.byTurns.five.dealt === 14],
	['9 turns = level 4, +50% (10 -> 15)', result.byTurns.nine.dealt === 15],
	['level 4 rolls three times (ceiling above a single 20*1.5)', result.ceilings.nine > 22],
	['level 1 rolls once (ceiling within one roll of 20*1.1)', result.ceilings.one <= 22],
	['level 4 + rank 3 assassinates at 99% of maximum', result.assassinations.level4Rank3At99 === true],
	['level 1 + rank 0 does not (0.99 is far above 0.03)', result.assassinations.level1Rank0At99 === false],
	['without invisibility there is no assassinate at all', result.assassinations.noPrepAt99 === false],
	['a boss just above the boundary survives (lands on 0.20, not `<`)', result.assassinations.bossAboveBoundary === false],
	['a boss a hair below the boundary dies (lands on 0.199)', result.assassinations.bossAtBoundary === true],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed ? 1 : 0;
