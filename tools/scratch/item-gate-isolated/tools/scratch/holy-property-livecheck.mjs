// Throwaway (tools/scratch): live-check the two holy-property fixes.
//
// 1. WandOfTransfusion charms a living enemy but *harms* Java's `Property.UNDEAD` (Guard/Ghoul/
//    Monk/Thief/Warlock/King/...). The port's list named only skeletons and necromancers, so an
//    undead Guard was charmed. Also pins that the harm branch ignores armor.
// 2. WandOfPrismaticLight deals x1.333 against `UNDEAD || DEMONIC`. With weaponLevel 0 the plain
//    roll is 1-5, so a demon's observed maximum over many shots must exceed 5; a rat's must not.
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
	const cell = () => {
		for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
			const x = s.hero.x + dx, y = s.hero.y + dy;
			if (s.level.inside(x, y) && s.level.passable(x, y)) return { x, y };
		}
		return null;
	};
	// isolate the target: `useSpecial` picks the nearest qualifying visible creature
	const only = (kind) => {
		for (const c of [...s.creatures]) {
			if (!c.isHero) { c.hp = 0; s.kill(c); }
		}
		const mob = s.spawnMonster(kind, cell());
		mob.maxHp = mob.hp = 100000;
		mob.armor = [0, 0];
		mob.evasion = 0;
		mob.sleeping = false;
		return mob;
	};
	const restock = () => {
		// never replace the object itself: `kill()` and friends call its own methods
		const charges = s.wandCharges;
		if (!charges) return;
		if (typeof charges.refund === 'function') charges.refund(99);
		else if (typeof charges.count === 'number') charges.count = 99;
		else if (typeof charges.charge === 'number') charges.charge = 99;
	};

	// --- 1. transfusion: UNDEAD must be harmed, not charmed
	const transfusion = (kind) => {
		const mob = only(kind);
		s.wandType = 'transfusion';
		s.weaponLevel = 0;
		restock();
		const before = mob.hp;
		s['useTransfusionWand'](mob);
		return { kind, hpDelta: before - mob.hp, charmed: mob.buffs.charm !== undefined };
	};

	// --- 2. prismatic light: x1.333 against UNDEAD || DEMONIC
	const prismatic = (kind) => {
		const mob = only(kind);
		// the ClassId decides what `useSpecial` does at all: a warrior's is the HolyTome, so the
		// wand path needs the mage's 'zap' special
		s.heroClass = 'mage';
		s.wandType = 'prismaticLight';
		s.weaponLevel = 0;
		let max = 0;
		let fired = 0;
		let affordable = 0;
		for (let i = 0; i < 80; i++) {
			mob.hp = 100000;
			restock();
			if (typeof s.wandCharges.canAfford === 'function' && s.wandCharges.canAfford(1)) affordable++;
			const before = mob.hp;
			const ok = s['useSpecial']();
			if (ok) fired++;
			max = Math.max(max, before - mob.hp);
		}
		return { kind, maxDealt: max, fired, affordable, progress: s.wandCharges.progress, max: s.wandCharges.max };
	};

	return {
		chargesApi: s.wandCharges ? { proto: Object.getOwnPropertyNames(Object.getPrototypeOf(s.wandCharges)), own: Object.keys(s.wandCharges) } : null,
		guard: transfusion('guard'),
		ghoul: transfusion('ghoul'),
		mimic: transfusion('mimic'),
		rat: transfusion('rat'),
		prismRat: prismatic('rat'),
		prismGuard: prismatic('guard'),
		prismSuccubus: prismatic('succubus'),
	};
});

console.log('probe results:', JSON.stringify(result, null, 1));
const expect = [
	['transfusion harms an UNDEAD Guard', result.guard.hpDelta > 0 && !result.guard.charmed],
	['transfusion harms an UNDEAD Ghoul', result.ghoul.hpDelta > 0 && !result.ghoul.charmed],
	['transfusion charms a living Mimic (DEMONIC but not UNDEAD)', result.mimic.charmed && result.mimic.hpDelta === 0],
	['transfusion charms a Rat', result.rat.charmed && result.rat.hpDelta === 0],
	['prismatic light vs a Rat never exceeds the plain 1-5 roll', result.prismRat.maxDealt <= 5],
	['prismatic light vs an UNDEAD Guard reaches the x1.333 roll', result.prismGuard.maxDealt > 5],
	['prismatic light vs a DEMONIC Succubus reaches the x1.333 roll', result.prismSuccubus.maxDealt > 5],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed ? 1 : 0;
