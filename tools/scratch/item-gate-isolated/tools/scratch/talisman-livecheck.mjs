// Throwaway (tools/scratch): `TalismanOfForesight`, live - is the artifact a real, reachable one?
//
// Java's Talisman of Foresight has one active action and one passive: `AC_SCRY` aims a
// distance-scaled cone that maps ground, uncovers secrets, marks unseen creatures and heaps as
// "aware" for `5 + 2*level()` turns, awards experience for each, and spends `3 + dist*1.08` charge;
// the `Foresight` passive trickles charge each turn and warns once ("You feel uneasy.") when a
// hidden trap sits inside the hero's own sight. Before this pass the port's `useTalisman` printed
// the item's own name: it read an optional `revealNearbyTraps` hook the scene never provided, so the
// action was a dead branch rather than a reduced effect.
//
// Run after `npm run build`:  node tools/scratch/talisman-livecheck.mjs
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

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=talisman-live', { waitUntil: 'load', timeout: 120000 });
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
	const FRESH = 'talisman-live';
	const FLOOR = 1, TRAP = 2;
	const bag = s['bag'];
	const talisman = () => bag.find('talisman', FRESH);
	const hero = s['hero'];
	const cell = (x, y) => s['level'].index(x, y);
	// Every scry below zeroes `partialCharge` first: the `Foresight` passive trickles 0.05 a turn and
	// the actor loop keeps running between probe steps, so a leftover fraction would read differently
	// on every run. The scry itself is synchronous, so nothing ticks between the reset and the read.
	const scry = (charge, target, level) => {
		talisman().charge = charge;
		talisman().partialCharge = 0;
		if (level !== undefined) talisman().level = level;
		const ranAtLevel = talisman().level ?? 0;
		s['useTalisman'](FRESH);
		const opened = !!s['aiming'];
		if (opened) s['aiming'].controller.moveTo(target);
		const valid = opened ? s['aiming'].controller.valid : null;
		const confirmed = opened ? s['confirmAiming']() : false;
		return { opened, valid, confirmed, ranAtLevel };
	};
	// Aiming at `hero.x + n` breaks near a map edge: `TargetingController.moveTo` ignores an off-map
	// cell, so the cursor would silently stay on the hero's own cell - which the scry refuses - and the
	// probe would read a no-op as a failure. This picks the first off-axis direction that stays in-map.
	const aimFrom = (distance) => {
		for (const candidate of [
			{ x: hero.x + distance, y: hero.y }, { x: hero.x - distance, y: hero.y },
			{ x: hero.x, y: hero.y + distance }, { x: hero.x, y: hero.y - distance },
		]) {
			if (s['level'].inside(candidate.x, candidate.y)) return candidate;
		}
		return { x: hero.x + 1, y: hero.y };
	};
	bag.add({ id: 'talisman', quantity: 1, identified: true, instanceId: FRESH });

	// --- the gate: below 5 charge the action refuses and opens no aim ---
	const fresh = { inBag: talisman() !== undefined, level: talisman().level ?? 0, charge: talisman().charge ?? 0 };
	const lowGate = scry(4, aimFrom(2));

	// --- mapping: at +10 the reach is 25 tiles, so a scry can reveal ground beyond the hero's own
	// 8-tile view. Aimed ten cells out, that cell must come back explored and still unseen - which
	// nothing else in the loop can account for. ---
	const farCell = aimFrom(10);
	s['fov'].explored.clear();
	const mapping = scry(100, farCell, 10);
	const mapped = {
		...mapping,
		farInMap: s['level'].inside(farCell.x, farCell.y),
		explored: s['fov'].explored.has(cell(farCell.x, farCell.y)),
		stillUnseen: !s['fov'].isVisible(farCell.x, farCell.y),
	};

	// --- a scry over a concealed trap two cells out: discovery, experience, cost, invisibility ---
	const nearCell = aimFrom(2);
	s['secrets'].conceal(nearCell.x, nearCell.y, FLOOR, TRAP);
	hero.buffs['invisibility'] = 12;
	const expBefore = talisman().exp ?? 0;
	const near = scry(100, nearCell, 0);
	const levelBefore = near.ranAtLevel;
	const afterScry = {
		confirmed: near.confirmed,
		secretAtTarget: s['secrets'].isSecret(nearCell.x, nearCell.y),
		terrainAtTarget: s['level'].get(nearCell.x, nearCell.y),
		// `3 + dist*1.08` = 5.16 at two tiles, spent on an int charge: trunc(100-5.16) = 94, and the
		// 0.16 owed comes out of `partialCharge` as a borrow, leaving 0.84 - then the scry's own turn
		// advances the passive, which adds its 0.05 tick on top, for 0.89.
		charge: talisman().charge ?? 0,
		partialCharge: Math.round((talisman().partialCharge ?? 0) * 100) / 100,
		// The concealed trap is worth 10 (`expSecretTrap`); a level-up reached on the way spends a
		// threshold, so the award is measured net of it rather than as a raw difference.
		expAwarded: (talisman().exp ?? 0) - expBefore
			+ ((talisman().level ?? 0) > levelBefore ? 100 + 50 * levelBefore : 0),
		invisible: hero.buffs['invisibility'] !== undefined,
	};

	// --- `maxDist()` truncation, read off the cost it produces. Aimed five cells out at +0: a full
	// charge reaches all five (`cost 8.4`, leaving charge 90), while a 5-charge talisman is capped at
	// `(5-3)/1.08 = 1.85` tiles and so resolves one tile out instead (`cost 4.08`, which an int charge
	// of 5 cannot cover at all - charge 0, with 0.08 owed). An *untruncated* five-tile aim would have
	// left `partialCharge` at -3.4, so this tells the two apart.
	const far = aimFrom(5);
	const fullReach = scry(100, far, 0);
	const fullCost = { charge: talisman().charge ?? 0, confirmed: fullReach.confirmed };
	const truncated = scry(5, far, 0);
	const shortCost = { charge: talisman().charge ?? 0, partialCharge: Math.round((talisman().partialCharge ?? 0) * 100) / 100, confirmed: truncated.confirmed };

	// --- the level-up: `exp >= 100 + 50*level()` ---
	const levelCell = aimFrom(2);
	s['secrets'].conceal(levelCell.x, levelCell.y, FLOOR, TRAP);
	talisman().exp = 99;
	const levelScry = scry(100, levelCell, 0);
	const leveled = { level: talisman().level ?? 0, exp: talisman().exp ?? 0, ...levelScry };

	// --- the awareness mark, last of all: a creature in the cone is marked for `5 + 2*level()` turns
	// and keeps rendering after it leaves the hero's sight ---
	const ratCell = aimFrom(1);
	const rat = s['spawnMonster']('rat', ratCell);
	scry(100, ratCell, 0);
	const marked = s['awareCreatures'].has(rat);
	// Somewhere the hero genuinely cannot see, as far away as the floor allows - the mark has to be
	// what keeps the sprite drawn, so the cell must be outside `isVisible` either way.
	let hidden = null;
	let hiddenDistance = -1;
	for (let y = 0; y < s['level'].height; y++) {
		for (let x = 0; x < s['level'].width; x++) {
			if (!s['level'].passable(x, y)) continue;
			if (s['fov'].isVisible(x, y)) continue;
			const distance = Math.max(Math.abs(x - hero.x), Math.abs(y - hero.y));
			if (distance > hiddenDistance) { hiddenDistance = distance; hidden = { x, y }; }
		}
	}
	if (hidden) { rat.x = hidden.x; rat.y = hidden.y; }
	s['refresh']();
	const awareness = {
		marked,
		movedTo: hidden,
		stillHidden: hidden ? !s['fov'].isVisible(hidden.x, hidden.y) : null,
		spriteVisible: hidden ? s['sprite'](rat).visible : null,
		turns: s['awareCreatures'].get(rat) ?? 0,
	};

	// --- `Foresight.checkAwareness()`: one "uneasy" per hidden trap in the hero's own sight, cleared
	// once it is found ---
	const trapCell = aimFrom(1);
	s['secrets'].conceal(trapCell.x, trapCell.y, FLOOR, TRAP);
	s['checkTalismanAwareness']();
	const warned = talisman().warn === true;
	s['secrets'].discover(trapCell.x, trapCell.y);
	s['checkTalismanAwareness']();
	const cleared = talisman().warn === false;

	await sleep(50);
	return { fresh, lowGate, mapped, afterScry, fullCost, shortCost, leveled, awareness, warned, cleared };
});

// A screenshot of a live aim, so the cone the scry would cover is confirmed in pixels and not only
// through the cells it turned out to reveal: this is the preview the targeting seam draws.
await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	const FRESH = 'talisman-live';
	const talisman = s['bag'].find('talisman', FRESH);
	talisman.level = 10;
	talisman.charge = 100;
	s['useTalisman'](FRESH);
	const hero = s['hero'];
	const at = s['level'].inside(hero.x + 6, hero.y) ? { x: hero.x + 6, y: hero.y } : { x: hero.x, y: hero.y + 6 };
	s['aiming'].controller.moveTo(at);
	s['refresh']();
});
await page.waitForTimeout(800);
await page.screenshot({ path: 'tools/scratch/talisman-aim.png' });

console.log('probe results:', JSON.stringify(probe, null, 1));
const expect = [
	['the artifact is carried and starts empty', probe.fresh.inBag === true && probe.fresh.charge === 0],
	['below 5 charge the scry refuses without opening an aim',
		probe.lowGate.opened === false && probe.lowGate.confirmed === false],
	['a +10 talisman scry maps ground ten tiles out, past the hero view',
		probe.mapped.farInMap === true && probe.mapped.explored === true && probe.mapped.stillUnseen === true],
	['a scry uncovers a concealed trap inside its cone',
		probe.afterScry.confirmed === true && probe.afterScry.secretAtTarget === false && probe.afterScry.terrainAtTarget === 2],
	['and awards the experience that goes with it', probe.afterScry.expAwarded >= 10],
	['spends `3 + dist*1.08` charge, truncated, with the fraction borrowed from partialCharge',
		(probe.afterScry.charge === 93 || probe.afterScry.charge === 94)
		&& probe.afterScry.partialCharge >= 0.84 && probe.afterScry.partialCharge <= 0.94],
	['and dispels the hero invisibility, as Java does', probe.afterScry.invisible === false],
	['a full charge resolves a five-tile aim on the fifth tile', probe.fullCost.charge === 90],
	['while a 5-charge scry is truncated to one tile by `maxDist()`, for a 4-point cost it cannot cover',
		probe.shortCost.charge === 0 && probe.shortCost.partialCharge > -0.1 && probe.shortCost.partialCharge <= 0],
	['experience levels the artifact at `100 + 50*level()`',
		probe.leveled.level === 1 && probe.leveled.exp === (99 + 10 - 100) && probe.leveled.confirmed === true],
	['a creature in the cone is marked aware', probe.awareness.marked === true && probe.awareness.turns > 0],
	['and keeps rendering after it leaves the hero sight',
		probe.awareness.stillHidden === true && probe.awareness.spriteVisible === true],
	['the passive warns once for a hidden trap in sight, and clears when it is found',
		probe.warned === true && probe.cleared === true],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
console.log(`talisman livecheck: ${expect.length - failed}/${expect.length} assertions`);
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed || problems.length ? 1 : 0;
