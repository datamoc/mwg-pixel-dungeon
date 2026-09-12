// Throwaway (tools/scratch): the Fireblast wand's charge scaling.
//
// `WandOfFireblast.chargesPerCast()` is Java's `gate(1, ceil(curCharges * 0.3), 3)` - the same rule
// Regrowth uses - and both its `min()` and the three-case `max()` scale with the charges spent:
// `(1+lvl) * charges` up to `2 + 2*lvl`, `2*(4 + 2*lvl)` or `3*(6 + 2*lvl)`. This port computed that
// charge count for Regrowth alone, so Fireblast always cast for one charge: it spent 1 instead of up
// to 3, and its damage was capped at 2 at level 0 where Java's two-charge cast reaches 8.
//
// Run after `npm run build`:  node tools/scratch/fireblast-charges-livecheck.mjs
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
	for (const c of [...s.creatures]) if (!c.isHero) { c.hp = 0; s.kill(c); }
	const freeCell = (fromX, fromY) => {
		for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
			const x = fromX + dx, y = fromY + dy;
			if (s.level.inside(x, y) && s.level.passable(x, y) && !s.creatureAt(x, y)) return { x, y };
		}
		return null;
	};
	const monster = s.spawnMonster('rat', freeCell(hero.x, hero.y));
	monster.maxHp = monster.hp = 100000;
	// the mage's special action is the staff zap, which is the branch the wand types live in
	s.heroClass = 'mage';
	s.wandType = 'fireblast';
	s.weaponLevel = 0;
	const heroHp = hero.hp;
	// `Charges.current` is a getter - assigning to it silently does nothing (it is `spend`/`refund`
	// that move it) - so the wand is restocked through the framework API instead
	const restock = (to) => {
		const charges = s.wandCharges;
		charges.refund(charges.max - charges.current);
		if (to < charges.current) charges.spend(charges.current - to);
	};
	const casts = (startCharges, trials) => {
		const spent = new Set();
		const damages = [];
		const returns = new Set();
		const perCast = [];
		for (let i = 0; i < trials; i++) {
			restock(startCharges);
			const before = s.wandCharges.current;
			const hpBefore = monster.hp;
			returns.add(s['useSpecial']() === true);
			spent.add(before - s.wandCharges.current);
			damages.push(hpBefore - monster.hp);
			if (perCast.length < 3) perCast.push({ before, after: s.wandCharges.current, damage: hpBefore - monster.hp });
			monster.hp = 100000;
		}
		return { spent: [...spent], minDamage: Math.min(...damages), maxDamage: Math.max(...damages), returns: [...returns], perCast };
	};
	const max = s.wandCharges.max;
	const diagnostics = { heroClass: s.heroClass, wandType: s.wandType, ammo: s.ammo, wandLevel: s.weaponLevel, max };
	const full = casts(max, 40);
	const half = casts(2, 40);

	// ---- the area half: the cone (every creature hit), the fire seeding with its
	// adjacent-to-caster exception, and the per-charge Cripple
	for (const c of [...s.creatures]) if (!c.isHero) { c.hp = 0; s.kill(c); }
	const free = (x, y) => s.level.inside(x, y) && s.level.passable(x, y) && !s.creatureAt(x, y);
	const run = (() => {
		const offsets = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
		for (const [dx, dy] of offsets) {
			const cells = [1, 2, 3].map((n) => ({ x: hero.x + dx * n, y: hero.y + dy * n }));
			if (cells.every((c) => free(c.x, c.y))) return { cells, dx, dy };
		}
		return null;
	})();
	let area = run ? null : { skipped: 'no open three-cell run beside the hero on this seed' };
	if (run) {
		const [near, , aim] = run.cells;
		// a second target beside the aim, inside the arc but not on the line (and farther than the
		// aim, so the port's own "nearest visible enemy" targeting still picks the aim)
		const beside = [{ x: aim.x + run.dy, y: aim.y + run.dx }, { x: aim.x - run.dy, y: aim.y - run.dx }].find((c) => free(c.x, c.y));
		// a third behind the hero, farther than the aim and off the cone's axis entirely
		const behind = [[-run.dx, -run.dy], [run.dy, run.dx], [-run.dy, -run.dx]]
			.flatMap(([dx, dy]) => [4, 5, 6].map((n) => ({ x: hero.x + dx * n, y: hero.y + dy * n })))
			.find((c) => free(c.x, c.y));
		const aimed = s.spawnMonster('rat', aim);
		const flanked = beside ? s.spawnMonster('snake', beside) : null;
		const rear = behind ? s.spawnMonster('crab', behind) : null;
		for (const mob of [aimed, flanked, rear]) if (mob) { mob.maxHp = mob.hp = 100000; }
		// a full wand spends two charges (ceil(4*0.3)), which is the branch that cripples; the
		// one-charge case is phase 1's `half` above, since the count follows the *current* charges
		restock(max);
		const chargesSpent = s.wandCharges.current;
		const fireBefore = { near: s.fire.volumeAt(near.x, near.y), aim: s.fire.volumeAt(aim.x, aim.y), total: s.fire.total() };
		s['useSpecial']();
		area = {
			chargesAtCast: chargesSpent,
			aimedDamaged: aimed.hp < 100000,
			aimedBurning: aimed.buffs['burning'] !== undefined,
			aimedCrippled: aimed.buffs['cripple'] !== undefined,
			flankedDamaged: flanked ? flanked.hp < 100000 : null,
			flankedBurning: flanked ? flanked.buffs['burning'] !== undefined : null,
			rearUntouched: rear ? rear.hp === 100000 && rear.buffs['burning'] === undefined : null,
			fireNearCell: s.fire.volumeAt(near.x, near.y),
			fireAtAim: s.fire.volumeAt(aim.x, aim.y),
			fireTotalBefore: fireBefore.total,
			fireTotalAfter: s.fire.total(),
			fireBefore,
		};
		for (const mob of [aimed, flanked, rear]) if (mob) { mob.hp = 0; s.kill(mob); }
	}
	const heroUnharmed = hero.hp === heroHp;
	s.wandType = 'magicMissile';
	monster.hp = 0;
	s.kill(monster);
	return { max, full, half, heroUnharmed, diagnostics, area };
});

console.log('probe results:', JSON.stringify(result, null, 1));
const area = result.area;
const areaOk = area !== null && area.skipped === undefined;
const expect = [
	['a full wand spends two charges on a Fireblast cast (ceil(4 * 0.3), not one)', result.full.spent.length === 1 && result.full.spent[0] === 2],
	['and its damage is in Java\'s two-charge range at level 0: 2 to 8', result.full.minDamage >= 2 && result.full.maxDamage <= 8],
	['reaching above the old one-charge ceiling of 2 (so the formula really changed)', result.full.maxDamage > 2],
	['a wand at 2 charges spends exactly one', result.half.spent.length === 1 && result.half.spent[0] === 1],
	['and its damage stays in the one-charge range: 1 to 2', result.half.minDamage >= 1 && result.half.maxDamage <= 2],
	['the caster is unharmed by its own wand', result.heroUnharmed === true],
	['the aimed creature is hit by the cone and set burning', areaOk && area.aimedDamaged === true && area.aimedBurning === true],
	['a creature flanking it inside the arc is hit and set burning too', areaOk && area.flankedDamaged === true && area.flankedBurning === true],
	['a creature behind the caster is outside the cone entirely', areaOk && area.rearUntouched === true],
	['and a two-charge cast cripples what it hits', areaOk && area.aimedCrippled === true],
	['the cone seeds no fire on the plain cell directly in front of the caster (Java\'s exception)', areaOk && area.fireNearCell === 0],
	['but the aimed cell itself is lit, one step before the cone\'s rim', areaOk && area.fireAtAim > 0],
	['and the floor\'s fire volume grew overall', areaOk && area.fireTotalAfter > area.fireTotalBefore],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed ? 1 : 0;
