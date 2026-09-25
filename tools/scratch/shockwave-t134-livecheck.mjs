// Live verification for T134 (coord task, landed @255d7105): Shockwave's
// striking-wave hits run every weapon enchantment, like Java's attackProc.
//
// Drives the built game headlessly: a rank-4 STRIKING_WAVE cone (procs always)
// is cast at live rats, first plain for a damage baseline, then with a
// Polarized weapon (every hit must whiff or amplify), then with a Corrupting
// weapon (a lethal hit must convert, not kill). The other four mirrors are
// exercised direct-call (same functions the cone invokes - wiring is proven
// by the cone casts plus the source-level ordering pins).
//
// Run with cwd = the tree whose dist/ is under test:
//   node tools/scratch/shockwave-t134-livecheck.mjs
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
	'chrome.exe',
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

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=shockwave-t134', { waitUntil: 'load', timeout: 120000 });
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

const probe = await page.evaluate(async () => {
	const s = window.__MWG__.currentScene;
	const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
	const hero = s['hero'];
	s['talentRanks'] = { ...(s['talentRanks'] ?? {}), striking_wave: 4, shock_force: 0, expanding_wave: 0 };
	s['armorCharge'] = 500;
	const liveFoes = () => (s['creatures'] ?? []).filter((c) => !c.isHero && !c.isAlly && !c.isNPC && c.hp > 0);
	// Place a foe two cells from the hero in each cardinal direction until a
	// cast lands (walls can block a given cone ray).
	const placeAndCast = async (affix, maxRounds) => {
		const dirs = [[2, 0], [-2, 0], [0, 2], [0, -2], [1, 0]];
		const landed = [];
		for (let round = 0; round < maxRounds; round++) {
			const foe = liveFoes()[0];
			if (!foe) return { landed, note: 'out of foes' };
			hero.hp = hero.maxHp;
			foe.hp = foe.maxHp;
			const [dx, dy] = dirs[round % dirs.length];
			foe.x = hero.x + dx;
			foe.y = hero.y + dy;
			s['weaponAffix'] = affix;
			const before = foe.hp;
			s['activateShockwave']({ id: 'shockwave' }, 0, { x: foe.x, y: foe.y });
			await sleep(150);
			landed.push({ dealt: before - foe.hp, foeHp: foe.hp, isAlly: foe.isAlly === true, foeX: foe.x, foeY: foe.y });
			if (foe.hp <= 0 || foe.isAlly === true) continue;
		}
		return { landed };
	};
	const out = {};
	// --- A. plain baseline, then Polarized: whiffs and amplifies ---
	s['weaponAffix'] = null;
	out.plain = await placeAndCast(null, 3);
	s['weaponAffix'] = 'polarized';
	out.polarized = await placeAndCast('polarized', 8);
	// --- B. full-path Corrupting: a lethal hit converts instead of killing ---
	s['weaponLevel'] = 20;
	const conv = await placeAndCast('corrupting', 6);
	out.corrupting = conv;
	// --- C-F. direct mirror calls (same functions the cone invokes) ---
	const rat = () => liveFoes()[0] ?? null;
	const heroRef = hero;
	// Friendly attacker-charmed zero is synchronous and deterministic.
	let f = rat();
	if (f) {
		s['weaponAffix'] = 'friendly';
		heroRef.buffs['charm'] = 10;
		s['charmTargets'].set(heroRef.id, f.id);
		out.friendlyZero = s['friendlyCurseProc'](heroRef, f, 10, true);
		delete heroRef.buffs['charm'];
		s['charmTargets'].delete(heroRef.id);
	}
	// Chance-gated procs: loop until observed (bounded, near-certain).
	const tries = { friendlyAttach: 0, displacing: 0, sacrificial: 0, grim: 0 };
	f = rat();
	if (f) {
		s['weaponAffix'] = 'friendly';
		for (let i = 0; i < 60 && f.buffs['charm'] === undefined; i++) {
			s['friendlyCurseProc'](heroRef, f, 8, true);
			tries.friendlyAttach++;
		}
		out.friendlyAttached = f.buffs['charm'] !== undefined;
	}
	f = rat();
	if (f) {
		s['weaponAffix'] = 'displacing';
		const ox = f.x, oy = f.y;
		for (let i = 0; i < 60 && f.x === ox && f.y === oy; i++) {
			s['cursedWeaponPreProcs'](heroRef, f, 6, true);
			tries.displacing++;
		}
		out.displaced = f.x !== ox || f.y !== oy;
	}
	for (let i = 0; i < 60 && heroRef.buffs['bleeding'] === undefined; i++) {
		s['weaponAffix'] = 'sacrificial';
		s['cursedWeaponPreProcs'](heroRef, rat() ?? heroRef, 6, true);
		tries.sacrificial++;
	}
	out.sacrificialBled = heroRef.buffs['bleeding'] !== undefined;
	f = rat();
	if (f) {
		f.hp = 1;
		let extra = 0;
		for (let i = 0; i < 10 && extra <= 0; i++) {
			s['weaponAffix'] = 'grim';
			extra = s['grimExecuteBonus'](f, true);
			tries.grim++;
		}
		out.grimExtra = extra;
	}
	out.tries = tries;
	out.foesLeft = liveFoes().length;
	out.canvas = (() => {
		const c = document.querySelector('canvas');
		return c ? { w: c.width, h: c.height } : null;
	})();
	return out;
});

console.log('probe results:', JSON.stringify(probe, null, 1));
const plainDealt = (probe.plain?.landed ?? []).map((h) => h.dealt);
const polDealt = (probe.polarized?.landed ?? []).map((h) => h.dealt);
const polHit = polDealt.filter((d) => d > 0);
const plainMean = plainDealt.length ? plainDealt.reduce((a, b) => a + b, 0) / plainDealt.length : 0;
const polMean = polHit.length ? polHit.reduce((a, b) => a + b, 0) / polHit.length : 0;
const convHits = probe.corrupting?.landed ?? [];
const expect = [
	['the cone lands plain hits (baseline)', plainDealt.some((d) => d > 0)],
	['Polarized whiffs at least once in 8 casts', polDealt.some((d) => d === 0)],
	['and its non-zero hits average well above the plain baseline', polHit.length > 0 && polMean > plainMean * 1.2],
	['Corrupting converts (ally) instead of killing on a lethal cone hit',
		convHits.some((h) => h.isAlly === true)],
	['Friendly zeroes damage for an already-charmed attacker', probe.friendlyZero === 0],
	['Friendly attaches Charm through its mirror', probe.friendlyAttached === true],
	['Displacing teleports through its mirror', probe.displaced === true],
	['Sacrificial bleeds the wielder through its mirror', probe.sacrificialBled === true],
	['Grim rolls a positive execute through its mirror', (probe.grimExtra ?? 0) > 0],
	['no page errors', problems.length === 0],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { console.log(`FAIL ${label}`); failed++; }
}
await page.screenshot({ path: 'C:/tmp/shockwave-t134.png' });
try { await browser.close(); } catch { /* already closed */ }
if (problems.length) console.log('problems:', JSON.stringify(problems));
process.exit(failed ? 1 : 0);
