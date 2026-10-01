// Throwaway (tools/scratch): live-verify R066 - Char.interact()'s ally-bump time split.
// Method level: the default swap moves both and passes time; paralysis/Vertigo/immovable
// refusals are handled and pass no time at all. Adapter level (the real onAction path):
// a plain step and a bump swap both pay the same blanket 1/speed() cost (never the attack
// rate, even with a speed augment), a refused bump costs 0 AND readies the hero again
// (finishFreeHeroAction - no softlock), Ally Warp swaps free, and a map-tap at 2 cells
// warps at range through handleMapPointer.
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const globalRoot = process.env.GLOBAL_NODE_MODULES ?? 'C:\\Users\\miche\\AppData\\Roaming\\npm\\node_modules';
const { chromium } = require(path.join(globalRoot, 'playwright'));
const executablePath = path.join(process.env.LOCALAPPDATA ?? 'C:\\Users\\miche\\AppData\\Local', 'ms-playwright', 'chromium-1193', 'chrome-win', 'chrome.exe');
const browser = await chromium.launch({ executablePath, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 1024, height: 768 } })).newPage();
page.on('pageerror', (e) => console.log('pageerror:', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('console.error:', m.text()); });

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=allyorders', { waitUntil: 'load', timeout: 120000 });
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

const e1 = await page.evaluate(async () => {
	const s = window.__MWG__.currentScene;
	const hero = s['hero'];
	const out = { pass: [], fail: [], meta: {} };
	const ok = (name, cond, detail) => { (cond ? out.pass : out.fail).push(cond ? name : name + ' :: ' + JSON.stringify(detail ?? null)); };
	const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
	const clock = () => s['clock'].turn;

	// a clean 6-cell run of passable floor: no ground items (a pickup would add its own
	// pickup-delay cost) and no trap
	let row = null;
	outer:
	for (let y = 2; y < s['level'].height - 2; y++) for (let x = 4; x < s['level'].width - 4; x++) {
		let good = true;
		for (let k = -3; k <= 2; k++) {
			const cx = x + k;
			if (!s['level'].passable(cx, y) || s['groundItems'].some((g) => g.x === cx && g.y === y) || s['trapAt']?.(cx, y)) { good = false; break; }
		}
		if (good) { row = { x, y }; break outer; }
	}
	if (!row) { out.fail.push('no clean 6-cell row'); return out; }
	out.meta.row = row;

	// place hero at row.x and (optionally) the ally at row.x+1 - both cells directly,
	// so a previous swap's crossing never leaks into the next case
	const place = (ally) => {
		hero.x = row.x; hero.y = row.y; hero.buffs = {};
		if (ally) { ally.x = row.x + 1; ally.y = row.y; ally.buffs = {}; }
		s['travelTarget'] = null;
		s['fov'].update(hero.x, hero.y, 32);
	};
	const freshWorld = (ally) => { s['creatures'].splice(0, s['creatures'].length, hero); place(ally); };
	const arm = () => {
		s['gameOver'] = false; s['awaitingInput'] = true; s['aiming'] = null;
		s['itemPickerOpen'] = false; s['inventoryOpen'] = false; s['journalOpen'] = false;
		s['travelTarget'] = null;
	};
	const spawn = (kind, dx) => {
		s['spawnMonster'](kind, { x: row.x + dx, y: row.y }, false, undefined, true, 'mirror', false, undefined, 0);
		return s['creatures'].find((c) => c.kind === kind);
	};

	// --- method level -----------------------------------------------------------
	freshWorld();
	const ally = spawn('rat', 1);
	place(ally);
	const tile = s['sprite'](ally).x / ally.x || 16;
	out.meta.tile = tile;
	let t0 = clock();
	const swapped = s['tryDefaultAllyPlaceSwap'](ally);
	ok('method swap moves both and passes time', swapped === true && hero.x === row.x + 1 && ally.x === row.x && clock() > t0,
		{ swapped, hero: hero.x, ally: ally.x, dt: clock() - t0 });

	place(ally);
	hero.buffs.paralysis = 5;
	t0 = clock();
	const pHandled = s['tryDefaultAllyPlaceSwap'](ally);
	ok('hero paralysis refuses, handled, passes no time', pHandled === true && hero.x === row.x && ally.x === row.x + 1 && clock() - t0 === 0,
		{ pHandled, hero: hero.x, ally: ally.x, dt: clock() - t0 });
	place(ally);
	ally.buffs = { vertigo: 3 };
	t0 = clock();
	const vHandled = s['tryDefaultAllyPlaceSwap'](ally);
	ok('ally Vertigo refuses, handled, passes no time', vHandled === true && hero.x === row.x && ally.x === row.x + 1 && clock() - t0 === 0,
		{ vHandled, hero: hero.x, ally: ally.x, dt: clock() - t0 });
	ally.buffs = {};

	freshWorld();
	const keeper = spawn('shopkeeper', 1);
	place(undefined);
	if (keeper) {
		t0 = clock();
		const kHandled = s['tryDefaultAllyPlaceSwap'](keeper);
		ok('immovable shopkeeper refuses, handled, passes no time', kHandled === true && hero.x === row.x && keeper.x === row.x + 1 && clock() - t0 === 0,
			{ kHandled, hero: hero.x, keeper: keeper.x, dt: clock() - t0 });
	} else out.fail.push('shopkeeper did not spawn');

	// --- adapter level: the real onAction path ---------------------------------
	// speed augment: the OLD code charged the attack rate here (augment x 2/3), the fix
	// charges the same blanket 1/speed() a plain step pays - so swap delta === step delta
	s['weaponAugment'] = 'speed';
	out.meta.blanketCost = s['getActionTurnCostMod']();
	out.meta.attackCost = s['getAttackTurnCostMod']();
	out.meta.discriminated = out.meta.blanketCost !== out.meta.attackCost;
	freshWorld();
	arm();
	t0 = clock();
	const stepped = s['onAction']('right');
	await sleep(400);
	const stepDelta = clock() - t0;
	ok('plain step (speed augment) passes blanket cost and readies again',
		stepped === true && hero.x === row.x + 1 && stepDelta > 0 && s['awaitingInput'] === true,
		{ stepped, hero: hero.x, stepDelta, awaiting: s['awaitingInput'] });

	place(null);
	const swapAlly = spawn('rat', 1);
	place(swapAlly);
	arm();
	t0 = clock();
	const bumped = s['onAction']('right');
	await sleep(400);
	const swapDelta = clock() - t0;
	ok('bump swap costs exactly the step cost (blanket, not the attack rate) and readies',
		bumped === true && hero.x === row.x + 1 && swapAlly.x === row.x && swapDelta === stepDelta && s['awaitingInput'] === true,
		{ bumped, hero: hero.x, ally: swapAlly.x, swapDelta, stepDelta, awaiting: s['awaitingInput'] });

	// free refusal through the adapter: costs nothing AND readies the hero
	place(swapAlly);
	swapAlly.buffs = { vertigo: 3 };
	arm();
	t0 = clock();
	const refused = s['onAction']('right');
	await sleep(400);
	ok('adapter refusal is free and readies the hero',
		refused === true && hero.x === row.x && swapAlly.x === row.x + 1 && clock() - t0 === 0 && s['awaitingInput'] === true,
		{ refused, hero: hero.x, dt: clock() - t0, awaiting: s['awaitingInput'] });
	swapAlly.buffs = {};

	// adjacent Ally Warp through the adapter: swaps, free
	s['heroClass'] = 'mage';
	s['talentRanks']['ally_warp'] = 2;
	place(swapAlly);
	arm();
	t0 = clock();
	const warped = s['onAction']('right');
	await sleep(400);
	ok('adapter Ally Warp (adjacent) swaps and is free',
		warped === true && hero.x === row.x + 1 && swapAlly.x === row.x && clock() - t0 === 0 && s['awaitingInput'] === true,
		{ warped, hero: hero.x, ally: swapAlly.x, dt: clock() - t0, awaiting: s['awaitingInput'] });

	s['camera'].follow(s['heroPoint'](), 5);
	return out;
});
console.log('E1 ' + JSON.stringify(e1, null, 1));
await page.waitForTimeout(1500);
await page.screenshot({ path: path.resolve('tools/scratch/browser-test/r066-ally-swap-20261002b.png') });

const e2 = await page.evaluate(async (meta) => {
	const s = window.__MWG__.currentScene;
	const hero = s['hero'];
	const { row, tile } = meta;
	const out = { pass: [], fail: [], meta: {} };
	const ok = (name, cond, detail) => { (cond ? out.pass : out.fail).push(cond ? name : name + ' :: ' + JSON.stringify(detail ?? null)); };
	const clock = () => s['clock'].turn;

	// ranged warp fixture: hero at row.x, ally at row.x+2 (chebyshev 2 <= rank-2 range 4)
	hero.x = row.x; hero.y = row.y; hero.buffs = {};
	s['creatures'].splice(0, s['creatures'].length, hero);
	s['spawnMonster']('rat', { x: row.x + 2, y: row.y }, false, undefined, true, 'mirror', false, undefined, 0);
	const ally = s['creatures'].find((c) => c.kind === 'rat');
	s['fov'].update(hero.x, hero.y, 32);
	s['travelTarget'] = null;
	s['gameOver'] = false; s['awaitingInput'] = true; s['aiming'] = null;
	s['itemPickerOpen'] = false; s['inventoryOpen'] = false; s['journalOpen'] = false;
	out.meta.heroClass = s['heroClass'];
	out.meta.allyWarpRank = s['talentRanks']['ally_warp'];

	// probe: the screen point whose camera.toWorld lands inside the ally's cell
	const tx = (ally.x + 0.5) * tile, ty = (ally.y + 0.5) * tile;
	let hit = null;
	for (let sy = 0; sy < 900 && !hit; sy += 4) for (let sx = 0; sx < 1300 && !hit; sx += 4) {
		const w = s['camera'].toWorld(sx, sy);
		if (Math.abs(w.x - tx) < tile * 0.4 && Math.abs(w.y - ty) < tile * 0.4) hit = { sx, sy };
	}
	ok('tap probe found a screen point on the ally cell', !!hit, { tile, tx, ty });
	if (hit) {
		const t0 = clock();
		s['handleMapPointer'](hit.sx, hit.sy);
		await new Promise((r) => setTimeout(r, 400));
		ok('ranged tap Ally Warp swaps at range and passes no time',
			hero.x === row.x + 2 && ally.x === row.x && clock() - t0 === 0 && s['awaitingInput'] === true,
			{ hero: hero.x, ally: ally.x, dt: clock() - t0, awaiting: s['awaitingInput'], hit });
	}
	s['camera'].follow(s['heroPoint'](), 5);
	return out;
}, { row: e1.meta.row, tile: e1.meta.tile });
console.log('E2 ' + JSON.stringify(e2, null, 1));
await page.waitForTimeout(1500);
await page.screenshot({ path: path.resolve('tools/scratch/browser-test/r066-tap-warp-20261002b.png') });

const fails = [...e1.fail, ...e2.fail];
console.log(fails.length === 0 ? `ALL GREEN (${e1.pass.length + e2.pass.length} checks)` : `FAILURES (${fails.length}):\n${fails.join('\n')}`);
await browser.close();
if (fails.length) process.exitCode = 1;
