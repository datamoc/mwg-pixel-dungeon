// Throwaway (tools/scratch): live-check Bounty Hunter's real effect.
//
// Java: `Char.attack()` arms `BountyHunterTracker` only for a *prepared* hero attack with the
// talent, and `Mob.lootChance()` then adds `0.02 * 2^(prepLevel-1) * points` to the drop-chance
// *multiplier*. So the drop rate should rise only for kills made while Preparation is up, and
// never on an ordinary kill. Gnolls drop gold at 0.5 with no LimitedDrops decay, which makes the
// difference measurable: rank 3 at prep level 4 multiplies it by 1 + 0.48.
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
	const originalSpawn = s['spawnGroundItem'].bind(s);
	let drops = 0;
	// count the loot roll's own output rather than ground items, so heap merging cannot hide a drop
	s['spawnGroundItem'] = (...args) => { drops++; return originalSpawn(...args); };

	const cell = () => {
		for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
			const x = s.hero.x + dx, y = s.hero.y + dy;
			if (s.level.inside(x, y) && s.level.passable(x, y)) return { x, y };
		}
		return null;
	};
	/** kill `trials` gnolls and report the drop rate under one configuration */
	const rate = (trials, { prepared = false, rank = 3 } = {}) => {
		s.subclass = () => 'assassin';
		s.talentRank = (key) => (key === 'bounty_hunter' ? rank : originalTalentRank(key));
		drops = 0;
		for (let i = 0; i < trials; i++) {
			const mob = s.spawnMonster('gnoll', cell());
			mob.maxHp = 100;
			mob.hp = 1;
			mob.armor = [0, 0];
			mob.evasion = 0;
			mob.sleeping = true;
			const hero = s.hero;
			hero.damage = [10, 10];
			hero.str = hero.strReq ?? hero.str;
			if (prepared) {
				hero.buffs['invisibility'] = 9999;
				s['prepInvisibleTurns'] = 9;
			} else {
				delete hero.buffs['invisibility'];
				s['prepInvisibleTurns'] = 0;
			}
			s['syncPreparation']();
			s.attack(hero, mob);
			if (mob.hp > 0) { mob.hp = 0; s.kill(mob); }   // never leave a survivor skewing the count
			// `attack()` dispels invisibility, and the tracker is cleared by the turn pipeline, which
			// this probe never runs - clear it here so the next iteration starts from a clean slate
			s['bountyTrackerArmed'] = false;
		}
		return { trials, drops, rate: +(drops / trials).toFixed(3) };
	};

	const baseline = rate(900, { prepared: false, rank: 0 });   // no talent, no tracker
	const talentOnly = rate(900, { prepared: false, rank: 3 }); // talent but an ordinary attack
	const prepared = rate(900, { prepared: true, rank: 3 });    // prepared attack, rank 3, level 4

	s['spawnGroundItem'] = originalSpawn;
	s.subclass = originalSubclass;
	s.talentRank = originalTalentRank;
	return { baseline, talentOnly, prepared };
});

console.log('probe results:', JSON.stringify(result));
const expect = [
	['a plain gnoll drops at Java\'s own 0.5', result.baseline.rate > 0.4 && result.baseline.rate < 0.6],
	['the talent alone changes nothing on an ordinary kill', Math.abs(result.talentOnly.rate - result.baseline.rate) < 0.08],
	['a prepared attack raises the rate towards 0.5 * 1.48', result.prepared.rate > 0.65 && result.prepared.rate <= 1],
	['the prepared rate is clearly above the ordinary one', result.prepared.rate > result.baseline.rate + 0.12],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed ? 1 : 0;
