// Throwaway (tools/scratch): live-check the four weapon curses audited against tag v3.3.8.
//
// All four used to be resolved in `mobOnHit` - the *monster's* attack - so a cursed weapon never
// procced on the hero's own swings and instead fired whenever the hero was hit. Each also had its
// own second divergence:
//   Explosive  `ExplosiveCurseBomb` = a bare `Bomb.ConjuredBomb`: `Bomb.explode` at the adjacent
//              non-solid cell *closest to the attacker* (the attacker's own cell when adjacent),
//              `NormalIntRange(4 + scalingDepth, 12 + 3*scalingDepth)` on every char in range -
//              hero included.  Was: the *trap* formula at the *defender's* cell, hero excluded.
//   Dazzling   1/10 x arcana, blinding every char whose own FOV holds the defender for 10 turns
//              (5 for everyone but the attacker).  Was: hero always dazed (it can always see
//              itself), mob-side FOV ignored, and the hero's invisibility wrongly dispelled.
//   Annoying   1/20 x arcana, beckoning every mob and dispelling invisibility (this one is real).
//   Wayward    1/4 x arcana *toggling* a 10-turn `WaywardBuff`; `Weapon.accuracyFactor` divides the
//              weapon's ACC (1) by 5 while it is up, multiplying the whole attack skill.
//              Was: a flat, permanent -3 accuracy for merely owning the weapon.
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
	const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
	const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
	const clearFloor = () => { for (const c of [...s.creatures]) if (!c.isHero) { c.hp = 0; s.kill(c); } };
	const free = (x, y) => s.level.inside(x, y) && s.level.passable(x, y) && !s.creatureAt(x, y);
	const findCell = (pred) => {
		for (let y = 0; y < s.level.height; y++) for (let x = 0; x < s.level.width; x++) if (pred(x, y)) return { x, y };
		return null;
	};
	const hits = (canGo = () => true) => {
		const out = [];
		for (const [dx, dy] of DIRS) {
			const x = hero.x + dx, y = hero.y + dy;
			if (free(x, y) && canGo(x, y)) out.push({ x, y });
		}
		return out;
	};
	s['unstableDelegated'] = null;
	hero.attackMode = 'melee';
	hero.maxHp = 100;

	// --- 1. the curses belong to the *hero's* attack, not the monster's
	clearFloor();
	const probeCell = hits()[0];
	const probeMob = s.spawnMonster('rat', probeCell);
	probeMob.maxHp = probeMob.hp = 100000;
	s.weaponAffix = 'annoying';
	let mobSideProcs = 0;
	for (let i = 0; i < 400; i++) {
		probeMob.seesHero = false;
		s['mobOnHit'](probeMob, hero, 10);
		if (probeMob.seesHero) mobSideProcs++;
	}
	let heroSideProcs = 0;
	for (let i = 0; i < 600; i++) {
		probeMob.seesHero = false;
		hero.buffs.invisibility = 20;
		s['heroOnHit'](hero, probeMob, 10);
		if (probeMob.seesHero) heroSideProcs++;
	}
	const invisDispelled = hero.buffs.invisibility === undefined;
	s.weaponAffix = undefined;
	hero.hp = hero.maxHp;
	probeMob.hp = 0;
	s.kill(probeMob);

	// --- 2. Dazzling: visibility is the *hero's* FOV of the defender, invisibility survives
	clearFloor();
	s.weaponAffix = 'dazzling';
	s.weaponLevel = 0;
	const witnessCell = hits((x, y) => s.fov.isVisible(x, y))[0];
	const witness = s.spawnMonster('rat', witnessCell);
	witness.maxHp = witness.hp = 100000;
	const blindCell = findCell((x, y) => free(x, y) && !s.fov.isVisible(x, y) && cheb({ x, y }, hero) > 2);
	const farMob = blindCell ? s.spawnMonster('snake', blindCell) : null;
	if (farMob) farMob.maxHp = farMob.hp = 100000;
	let dazzlingProcs = 0;
	let witnessDaze = null;
	let heroDazeWhenBlind = null;
	let farDaze = null;
	let invisAfterDazzle = null;
	for (let i = 0; i < 500 && dazzlingProcs === 0; i++) {
		delete witness.buffs.daze;
		delete hero.buffs.daze;
		if (farMob) delete farMob.buffs.daze;
		hero.buffs.invisibility = 20;
		s['heroOnHit'](hero, farMob ?? witness, 10);
		if (witness.buffs.daze !== undefined) {
			dazzlingProcs++;
			witnessDaze = witness.buffs.daze;
			heroDazeWhenBlind = hero.buffs.daze ?? null;
			farDaze = farMob ? (farMob.buffs.daze ?? null) : 'no-cell';
			invisAfterDazzle = hero.buffs.invisibility !== undefined;
		}
	}
	// and the hero *is* blinded when the hero can see the defender
	let heroDazeWhenVisible = null;
	for (let i = 0; i < 500 && heroDazeWhenVisible === null; i++) {
		delete hero.buffs.daze;
		s['heroOnHit'](hero, witness, 10);
		if (hero.buffs.daze !== undefined) heroDazeWhenVisible = hero.buffs.daze;
	}
	s.weaponAffix = undefined;

	// --- 3. Wayward: a real toggle, and a 5x accuracy cut only while it is up
	clearFloor();
	s.weaponAffix = 'wayward';
	delete hero.buffs.wayward;
	s['syncHeroFromStats']();
	const baseAccuracy = s.heroStats.get('accuracy');
	const accuracyWithoutBuff = hero.accuracy;
	const waywardHit = (mob) => { delete hero.buffs.daze; s['heroOnHit'](hero, mob, 10); };
	const waywardMob = s.spawnMonster('rat', hits()[0]);
	waywardMob.maxHp = waywardMob.hp = 100000;
	let waywardProcs = 0;
	for (let i = 0; i < 2000; i++) {
		delete hero.buffs.wayward;
		waywardHit(waywardMob);
		if (hero.buffs.wayward !== undefined) waywardProcs++;
	}
	delete hero.buffs.wayward;
	let grantedTurns = null;
	for (let i = 0; i < 200 && grantedTurns === null; i++) {
		waywardHit(waywardMob);
		if (hero.buffs.wayward !== undefined) grantedTurns = hero.buffs.wayward;
	}
	s['syncHeroFromStats']();
	const accuracyWithBuff = hero.accuracy;
	waywardHit(waywardMob);
	const toggledOff = hero.buffs.wayward === undefined;
	s['syncHeroFromStats']();
	const accuracyAfterToggle = hero.accuracy;
	s.weaponAffix = undefined;
	waywardMob.hp = 0;
	s.kill(waywardMob);

	// --- 4. Explosive: `Bomb.explode` at the cell nearest the attacker, hero included
	clearFloor();
	s.weaponAffix = 'explosive';
	const defCell = hits()[0];
	const defender = s.spawnMonster('rat', defCell);
	defender.armor = [0, 0];
	defender.maxHp = defender.hp = 100000;
	// a bystander that a defender-centred blast would catch but an attacker-centred one cannot:
	// Chebyshev 1 from the defender and 2 from the hero
	const sideCell = DIRS.map(([dx, dy]) => ({ x: defCell.x + dx, y: defCell.y + dy }))
		.find((c) => free(c.x, c.y) && cheb(c, hero) === 2);
	const bystander = sideCell ? s.spawnMonster('snake', sideCell) : null;
	if (bystander) bystander.maxHp = bystander.hp = 100000;
	const depth = s['depth'];
	const trials = 300;
	let heroLost = 0;
	let heroLostTotal = 0;
	let defenderMax = 0;
	let bystanderTotal = 0;
	let durabilityAfter = null;
	let durabilityDrained = 0;
	for (let i = 0; i < trials; i++) {
		s.weaponCurseDurability = 0;
		hero.hp = hero.maxHp;
		defender.hp = 100000;
		if (bystander) bystander.hp = 100000;
		s['heroOnHit'](hero, defender, 10);
		const hl = hero.maxHp - hero.hp;
		if (hl > 0) { heroLost++; heroLostTotal += hl; }
		defenderMax = Math.max(defenderMax, 100000 - defender.hp);
		if (bystander) bystanderTotal += 100000 - bystander.hp;
		durabilityAfter = s.weaponCurseDurability;
	}
	// a non-detonating hit still drains the fuse
	s.weaponCurseDurability = 100;
	for (let i = 0; i < 10; i++) s['heroOnHit'](hero, defender, 10);
	durabilityDrained = s.weaponCurseDurability;
	s.weaponAffix = undefined;
	s.weaponCurseDurability = 100;

	return {
		depth,
		annoying: { mobSideProcs, heroSideProcs, rate: +(heroSideProcs / 600).toFixed(3), invisDispelled },
		dazzling: { procs: dazzlingProcs, witnessDaze, heroDazeWhenBlind, farDaze, invisAfterDazzle, heroDazeWhenVisible, noBlindCell: !blindCell },
		wayward: { baseAccuracy, accuracyWithoutBuff, accuracyWithBuff, expectedWithBuff: Math.max(1, Math.round(baseAccuracy / 5)), grantedTurns, toggledOff, accuracyAfterToggle, rate: +(waywardProcs / 2000).toFixed(3) },
		explosive: { trials, heroLost, heroLostTotal, defenderMax, bystanderTotal, durabilityAfter, durabilityDrained, hasBystander: !!bystander },
	};
});

console.log('probe results:', JSON.stringify(result, null, 1));
const e = result.explosive;
const expect = [
	['no curse procs from a monster\'s attack any more', result.annoying.mobSideProcs === 0],
	['Annoying procs on the hero\'s own attack at about 1 in 20', result.annoying.rate > 0.025 && result.annoying.rate < 0.09],
	['Annoying still dispels the hero\'s invisibility', result.annoying.invisDispelled === true],
	['a visible bystander is blinded for 5 turns by Dazzling', result.dazzling.witnessDaze === 5],
	['the hero is not blinded when it cannot see the defender', result.dazzling.heroDazeWhenBlind === null],
	['a monster the hero cannot see is not blinded', result.dazzling.farDaze === null && !result.dazzling.noBlindCell],
	['Dazzling no longer dispels the hero\'s invisibility', result.dazzling.invisAfterDazzle === true],
	['the hero is blinded for 10 turns when it can see the defender', result.dazzling.heroDazeWhenVisible === 10],
	['a wayward weapon no longer docks accuracy permanently', result.wayward.accuracyWithoutBuff === result.wayward.baseAccuracy],
	['Wayward\'s buff lasts its own 10 turns', result.wayward.grantedTurns === 10],
	['the buff divides the attack skill by 5', result.wayward.accuracyWithBuff === result.wayward.expectedWithBuff],
	['the next hit toggles the buff off', result.wayward.toggledOff === true],
	['and accuracy returns to its full value', result.wayward.accuracyAfterToggle === result.wayward.baseAccuracy],
	['Wayward toggles on at about 1 in 4', result.wayward.rate > 0.20 && result.wayward.rate < 0.31],
	['an Explosive detonation damages its own wielder (the hero)', e.heroLost >= e.trials * 0.9 || e.heroLostTotal > 0],
	['the blast hits the defender for bomb damage above the old trap ceiling', e.defenderMax > 10 + 2 * result.depth],
	['and never above the bomb ceiling', e.defenderMax <= 12 + 3 * result.depth],
	['the blast is centred near the attacker, not on the defender', e.hasBystander ? e.bystanderTotal === 0 : false],
	['the fuse resets toward 100 after detonating', e.durabilityAfter !== null && e.durabilityAfter >= 90 && e.durabilityAfter <= 100],
	['a non-detonating hit drains the fuse', e.durabilityDrained < 100],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed ? 1 : 0;
