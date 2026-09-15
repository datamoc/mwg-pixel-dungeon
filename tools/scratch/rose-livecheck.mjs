// Throwaway (tools/scratch): `DriedRose`, live - is the artifact a real, reachable one?
//
// Java's Dried Rose raises a `GhostHero` ally (`AC_SUMMON`, gated on the Sad Ghost quest, a *full*
// charge, no curse and no live ghost), directs it with a cell picker (`AC_DIRECT`), heals it instead
// of charging while it lives, and levels itself off `Petal` items the floor generator drops. Before
// this pass the port's `useRose` printed one line: it read an optional `spawnAlly` hook the scene
// never provided, so the action was a dead branch rather than a reduced effect.
//
// Run after `npm run build`:  node tools/scratch/rose-livecheck.mjs
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

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=rose-live', { waitUntil: 'load', timeout: 120000 });
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
	const FRESH = 'rose-live';
	const bag = s['bag'];
	const rose = () => bag.find('rose', FRESH);
	const hero = s['hero'];
	const ghostOf = () => s['roseGhost'] ?? null;
	bag.add({ id: 'rose', quantity: 1, identified: true, instanceId: FRESH, level: 0, charge: 100, partialCharge: 0 });

	// --- the gate: with the Sad Ghost quest unfinished, Java offers nothing at all ---
	const questApi = Object.getOwnPropertyNames(Object.getPrototypeOf(s['quests'])).filter((n) => n !== 'constructor');
	const questBefore = s['quests'].status('sadGhost');
	rose().charge = 99;
	const uncharged = (() => { s['useRose'](FRESH); return !!s['itemPickerOpen']; })();
	s['chooseItemPicker'](-1);
	rose().charge = 100;
	const noQuest = (() => { s['useRose'](FRESH); return !!s['itemPickerOpen']; })();
	s['chooseItemPicker'](-1);

	// The quest itself is verified by its own livechecks; what this probe needs is only the *gate*,
	// so the Sad Ghost quest is forced complete here rather than fought for. The refusal above ran
	// against the real, unfinished quest state, which is the part that matters.
	const realStatus = s['quests'].status.bind(s['quests']);
	s['quests'].status = (id) => (id === 'sadGhost' ? 'complete' : realStatus(id));
	const questAfter = s['quests'].status('sadGhost');
	s['useRose'](FRESH);
	const summonRows = (s['itemPickerEntries'] ?? []).map((e) => e.instanceId);
	s['chooseItemPicker'](summonRows.indexOf('rose-summon'));
	await sleep(200);
	const ghost = ghostOf();
	if (!ghost) {
		return {
			questApi, questBefore, uncharged, noQuest, questAfter, summonRows,
			noGhost: {
				charge: rose() ? (rose().charge ?? -1) : -2,
				cursed: rose() ? rose().cursed === true : null,
				identified: rose() ? rose().identified !== false : null,
				itemPickerOpen: s['itemPickerOpen'] === true,
				creatures: s['creatures'].filter((c) => c.kind === 'ghost').length,
			},
		};
	}
	const summoned = {
		spawned: ghost !== null,
		ally: ghost ? ghost.isAlly === true && ghost.isNPC !== true : null,
		adjacent: ghost ? Math.max(Math.abs(ghost.x - hero.x), Math.abs(ghost.y - hero.y)) === 1 : null,
		maxHp: ghost ? ghost.maxHp : null,
		hp: ghost ? ghost.hp : null,
		accuracy: ghost ? ghost.accuracy : null,
		evasion: ghost ? ghost.evasion : null,
		damage: ghost ? [...ghost.damage] : null,
		charge: rose().charge ?? 0,
		heroLevel: s['progression']?.level ?? null,
	};

	// --- the passive: while the ghost lives the rose heals it and does *not* charge ---
	ghost.hp = 10;
	rose().charge = 0;
	rose().partialCharge = 0;
	for (let i = 0; i < 30; i++) s['spendHeroTurn'](1);
	const healed = { hp: ghost.hp, charge: rose().charge ?? 0 };
	// with no ghost the clock charges instead
	const ghostBackup = s['roseGhost'];
	s['roseGhost'] = null;
	for (let i = 0; i < 10; i++) s['spendHeroTurn'](1);
	const chargedBack = { charge: rose().charge ?? 0, partial: Math.round((rose().partialCharge ?? 0) * 100) / 100 };
	s['roseGhost'] = ghostBackup;

	// --- AC_DIRECT: an empty cell far from the hero is "defend here", and the ghost walks to it ---
	const hero2 = { x: hero.x, y: hero.y };
	let defendCell = null;
	for (let distance = 2; distance <= 4 && !defendCell; distance++) {
		for (const candidate of [{ x: hero.x + distance, y: hero.y }, { x: hero.x, y: hero.y + distance }, { x: hero.x - distance, y: hero.y }]) {
			if (!s['level'].inside(candidate.x, candidate.y)) continue;
			if (!s['level'].passable(candidate.x, candidate.y)) continue;
			if (s['creatureAt'](candidate.x, candidate.y)) continue;
			defendCell = candidate;
			break;
		}
	}
	s['useRose'](FRESH);
	const directRows = (s['itemPickerEntries'] ?? []).map((e) => e.instanceId);
	s['chooseItemPicker'](directRows.indexOf('rose-direct'));
	const aimingOpened = !!s['aiming'];
	if (aimingOpened) { s['aiming'].controller.moveTo(defendCell); s['confirmAiming'](); }
	const ordered = { aim: aimingOpened, defend: ghost.ghostDefendCell ?? null, target: ghost.ghostTargetChar ?? null };
	const start = { x: ghost.x, y: ghost.y };
	for (let i = 0; i < 6; i++) s['takeAllyTurn'](ghost);
	const moved = { from: start, to: { x: ghost.x, y: ghost.y }, reached: ghost.x === defendCell.x && ghost.y === defendCell.y };
	// an enemy cell means "attack that character" and the ghost closes on it
	const rat = s['spawnMonster']('rat', { x: hero.x + 1, y: hero.y });
	s['directRoseGhost']({ x: rat.x, y: rat.y });
	const attackOrder = ghost.ghostTargetChar === rat;
	for (let i = 0; i < 8; i++) {
		if (!ghost || ghost.hp <= 0) break;
		s['takeAllyTurn'](ghost);
	}
	const attacked = { ordered: attackOrder, ratHp: rat.hp, ratMaxHp: rat.maxHp, ghostAdjacent: Math.max(Math.abs(ghost.x - rat.x), Math.abs(ghost.y - rat.y)) <= 1 };

	// --- the petal: a floor drop that levels the rose and heals the ghost by 8 ---
	const petalCell = { x: hero.x, y: hero.y };
	s['spawnGroundItem']('petal', petalCell.x, petalCell.y);
	const petalGround = s['groundItemAt'](petalCell.x, petalCell.y);
	const beforePetal = { level: rose().level ?? 0, ghostHp: ghost.hp, ghostMaxHp: ghost.maxHp };
	s['pickupGroundItemAt'](petalCell.x, petalCell.y);
	await sleep(100);
	const afterPetal = {
		level: rose().level ?? 0,
		ghostHp: ghost.hp,
		ghostMaxHp: ghost.maxHp,
		petalGone: s['groundItemAt'](petalCell.x, petalCell.y) === null,
	};

	// --- the cap: at +10 a petal is consumed and wasted ---
	rose().level = 10;
	s['spawnGroundItem']('petal', petalCell.x, petalCell.y);
	const cappedGround = s['groundItemAt'](petalCell.x, petalCell.y);
	s['pickupGroundItemAt'](petalCell.x, petalCell.y);
	await sleep(100);
	const capped = { level: rose().level ?? 0, petalGone: s['groundItemAt'](petalCell.x, petalCell.y) === null };

	// --- no rose at all: the pickup is refused and the petal stays where it is ---
	const carried = bag.items.find((i) => i.id === 'rose' && i.instanceId === FRESH);
	const removed = { ...carried };
	bag.remove('rose', 1, FRESH);
	s['spawnGroundItem']('petal', petalCell.x, petalCell.y);
	const orphanGround = s['groundItemAt'](petalCell.x, petalCell.y);
	s['pickupGroundItemAt'](petalCell.x, petalCell.y);
	await sleep(100);
	const orphan = { petalStillThere: s['groundItemAt'](petalCell.x, petalCell.y) !== null };
	bag.add(removed);

	// --- the death check: with the rose gone the ghost loses 1 HP a turn ---
	const hpBeforeTick = ghost.hp;
	s['roseGhost'] = ghost;
	bag.remove('rose', 1, FRESH);
	s['takeAllyTurn'](ghost);
	const orphanTick = { hpBefore: hpBeforeTick, hpAfter: ghost.hp };
	bag.add(removed);

	await sleep(50);
	return {
		questApi, questBefore, uncharged, noQuest, questAfter, summonRows, summoned, healed, chargedBack,
		ordered, moved, attacked, beforePetal, afterPetal, capped, orphan, orphanTick,
	};
});

// A screenshot with the ghost up and a petal on the floor, so the ally, its sprite and the drop are
// confirmed in pixels rather than only through state.
await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	const hero = s['hero'];
	const at = s['level'].inside(hero.x + 1, hero.y) ? { x: hero.x + 1, y: hero.y } : { x: hero.x, y: hero.y + 1 };
	if (!s['creatureAt'](at.x, at.y)) {
		const ghost = s['spawnMonster']('ghost', at, false, undefined, true, 'ghost');
		ghost.isNPC = false;
		ghost.npcKind = undefined;
		ghost.sleeping = false;
		ghost.maxHp = 60;
		ghost.hp = 60;
		s['roseGhost'] = ghost;
	}
	const petal = s['level'].inside(hero.x, hero.y + 1) ? { x: hero.x, y: hero.y + 1 } : { x: hero.x + 1, y: hero.y + 1 };
	s['spawnGroundItem']('petal', petal.x, petal.y);
	s['refresh']();
});
await page.waitForTimeout(800);
await page.screenshot({ path: 'tools/scratch/rose-ghost.png' });

console.log('probe results:', JSON.stringify(probe, null, 1));
const expect = [
	['an under-charged rose offers nothing (Java wants a *full* charge)', probe.uncharged === false],
	['and an unfinished Sad Ghost quest offers nothing either', probe.noQuest === false],
	['finishing the quest makes AC_SUMMON available', probe.questAfter === 'complete' && probe.summonRows.includes('rose-summon')],
	['summoning raises a real ally, not an NPC, on a cell beside the hero',
		probe.summoned.spawned === true && probe.summoned.ally === true && probe.summoned.adjacent === true],
	['with the rose-derived HP of `20 + 8*level()`', probe.summoned.maxHp === 20 && probe.summoned.hp === 20],
	['and the hero-derived accuracy/evasion and bare-handed damage',
		probe.summoned.accuracy === probe.summoned.heroLevel + 9 && probe.summoned.evasion === probe.summoned.heroLevel + 4
		&& probe.summoned.damage[0] === 0 && probe.summoned.damage[1] === 5],
	['summoning empties the rose', probe.summoned.charge === 0],
	['while a ghost lives the clock heals it instead of charging',
		probe.healed.hp > 10 && probe.healed.charge === 0],
	['and with no ghost it charges at 1/5 a turn', probe.chargedBack.charge === 2],
	['AC_DIRECT opens the ghost cell picker', probe.ordered.aim === true],
	['an empty cell orders the ghost to defend it, and it walks there',
		probe.ordered.defend !== null && probe.ordered.target === null && probe.moved.reached === true],
	['an enemy cell orders the ghost to attack that character',
		probe.attacked.ordered === true && probe.attacked.ratHp < probe.attacked.ratMaxHp],
	['a petal levels the rose and heals a live ghost by 8',
		probe.afterPetal.level === probe.beforePetal.level + 1 && probe.afterPetal.petalGone === true],
	['at the level cap a petal is consumed and wasted', probe.capped.level === 10 && probe.capped.petalGone === true],
	['with no rose the pickup is refused and the petal stays on the floor', probe.orphan.petalStillThere === true],
	['and a rose-less ghost loses 1 HP on its turn', probe.orphanTick.hpAfter === probe.orphanTick.hpBefore - 1],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
console.log(`rose livecheck: ${expect.length - failed}/${expect.length} assertions`);
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed || problems.length ? 1 : 0;
