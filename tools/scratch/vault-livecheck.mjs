// Throwaway (tools/scratch): the depth-26 Amulet vault (`LastLevel`), live.
//
// Three things this checks that nothing else can:
//   - the floor-decoration scatter added to `lastLevel()` is really there and really consumed its
//     Random draws (`EMPTY_DECO` cells exist, at roughly Java's `Random.Int(5) == 0` rate);
//   - `LastLevel`'s three custom tilemaps render from `halls_special.png` at the atlas indices
//     Java's own arrays name, including the candle cluster and its `amuletObtained` variant;
//   - `LastLevel.create()`'s passive override is real: the vault's pits and its sealed entrance
//     chamber are unwalkable, so the hero cannot fall into the void - and the way down is still
//     open (the shaft, and the arrival cell).
//
// Run after `npm run build`:  node tools/scratch/vault-livecheck.mjs
import { createRequire } from 'node:module';
import fs from 'node:fs';
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

const shots = path.join(process.env.BROWSERCHECK_DIR ?? 'C:\\Users\\miche\\dev\\_browsercheck', 'mwgpd_shots_vault');
fs.mkdirSync(shots, { recursive: true });

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=vault-livecheck', { waitUntil: 'load', timeout: 120000 });
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

// ---- the vault, entered the way the game enters it (`depth` then `enterLevel`)
const vault = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	s['depth'] = 26;
	s['enterLevel']();
	const paint = s['portedPaint'];
	const width = s['level'].width;
	const cell = (x, y) => y * width + x;
	const CHASM = 0, EMPTY = 1, EMPTY_DECO = 20, ENTRANCE = 7;
	let chasms = 0, empties = 0, decos = 0;
	for (let i = 0; i < paint.map.length; i++) {
		if (paint.map[i] === CHASM) chasms++;
		else if (paint.map[i] === EMPTY) empties++;
		else if (paint.map[i] === EMPTY_DECO) decos++;
	}
	const layers = () => {
		//`TileMap` keeps its layers private with no getter, so the probe reads the same map the
		//renderer does - `layersByName` - rather than going through the public setter
		const map = new Map();
		for (const child of s['camera'].world.children) {
			const byName = child['layersByName'];
			if (!byName || typeof byName.get !== 'function') continue;
			for (const name of ['vaultFloor', 'vaultCenter', 'vaultCenterWalls']) {
				//a layer entry is `{ name, data, sprites, container }` - the frames are `.data`
				const data = byName.get(name)?.data;
				if (data) map.set(name, data);
			}
		}
		return Object.fromEntries(map);
	};
	const L = layers();
	const terrain = [];
	for (let y = 0; y < s['level'].height; y++) terrain.push(s['level'].get(0, y));
	return {
		depth: s['depth'],
		seed: String(s['runSeedLong']),
		size: { width, height: s['level'].height },
		chasms, empties, decos,
		entranceTerrain: paint.map[cell(8, 54)],
		amuletCell: { x: 8, y: 12 },
		paintAtAmulet: paint.map[cell(8, 12)],
		amuletHeaped: s['groundItems'].some((g) => g.kind === 'amulet' && g.x === 8 && g.y === 12),
		passable: {
			shaft: s['level'].passable(8, 20),
			chasmCorner: s['level'].passable(0, 0),
			chasmBesideShaft: s['level'].passable(6, 20),
			arrival: s['level'].passable(8, 54),
			chamber: s['level'].passable(8, 58),
			chamberCol: s['level'].passable(2, 58),
		},
		rawLayers: (() => {
			for (const child of s['camera'].world.children) {
				const byName = child['layersByName'];
				if (!byName || typeof byName.get !== 'function' || !byName.get('vaultFloor')) continue;
				const entry = byName.get('vaultFloor');
				return { kind: Object.prototype.toString.call(entry), keys: entry && typeof entry === 'object' ? Object.keys(entry).slice(0, 12) : null,
					probe: entry ? { ctor: entry.constructor?.name, isArray: Array.isArray(entry), len: entry.length ?? null } : null };
			}
			return null;
		})(),
		frames: L.vaultFloor ? {
			candleStart: L.vaultFloor[cell(5, 9)],
			candleRow: L.vaultFloor[cell(6, 9)],
			candleFlame: L.vaultFloor[cell(8, 9)],
			amuletCellFrame: L.vaultFloor[cell(8, 12)],
			shaft: L.vaultFloor[cell(8, 20)],
			chasmStrip: L.vaultFloor[cell(6, 20)],
			decoCells: (() => {
				const out = [];
				for (let i = 0; i < paint.map.length && out.length < 3; i++) if (paint.map[i] === EMPTY_DECO) out.push({ i, frame: L.vaultFloor[i] });
				return out;
			})(),
			length: L.vaultFloor.length,
		} : null,
		centerFrames: L.vaultCenter ? {
			top: L.vaultCenter[cell(0, s['level'].height - 10)],
			column0: L.vaultCenter[cell(0, s['level'].height - 9)],
			length: L.vaultCenter.length,
		} : null,
		wallFrames: L.vaultCenterWalls ? {
			top: L.vaultCenterWalls[cell(0, s['level'].height - 11)],
			gate: L.vaultCenterWalls[cell(8, s['level'].height - 11)],
			length: L.vaultCenterWalls.length,
		} : null,
		hero: { x: s['hero'].x, y: s['hero'].y },
	};
});

// the interlevel curtain has to finish first: until it does, `awaitingInput` is false and every
// action is ignored - which is also what made the first run of this probe look like a stuck hero
await page.waitForTimeout(3000);

// ---- the hero beside the void, told to walk into it: Java's solid override must refuse
const blocked = await page.evaluate(async () => {
	const s = window.__MWG__.currentScene;
	const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
	const hero = s['hero'];
	// (6,20) and (6,21) are pit cells: Java's `create()` made them unwalkable, this port's
	// `SOLID` kind. The step is issued through the scene's real action path and the hero's own
	// turn is allowed to run before the position is read - a first attempt read it synchronously
	// and saw the *previous* position, which is exactly the kind of false result not worth having.
	hero.x = 7; hero.y = 20;
	s['refresh']();
	await sleep(400);
	const before = { x: hero.x, y: hero.y, hp: hero.hp };
	s['onAction']('left');
	await sleep(1200);
	const after = { x: hero.x, y: hero.y, hp: hero.hp, gameOver: s['gameOver'] };
	// and the open direction still works, so a refusal above is the rule and not a stuck hero
	s['onAction']('down');
	await sleep(1200);
	const moved = { x: hero.x, y: hero.y };
	return {
		before, after, moved,
		cell: { kind: s['level'].get(6, 20), passable: s['level'].passable(6, 20), chasm: s['isChasmCell'](6, 20) },
	};
});

// ---- the Amulet's own variant: candles light (+8) and the floor decoration swaps 27 -> 31
const variant = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	const width = s['level'].width;
	const cell = (x, y) => y * width + x;
	const before = s['vaultTileLayers']();
	s['gameState'].setSwitch('amuletObtained', true);
	const after = s['vaultTileLayers']();
	s['gameState'].setSwitch('amuletObtained', false);
	const deco = [];
	for (let i = 0; i < s['portedPaint'].map.length; i++) if (s['portedPaint'].map[i] === 20) deco.push(i);
	const at = deco.slice(0, 4);
	return {
		decoCount: deco.length,
		beforeDeco: at.map((i) => before.floor[i]),
		afterDeco: at.map((i) => after.floor[i]),
		beforeCandle: before.floor[cell(8, 9)],
		afterCandle: after.floor[cell(8, 9)],
		centerUnchanged: before.center.every((f, i) => f === after.center[i]),
	};
});

await page.screenshot({ path: path.join(shots, 'vault_full.png') });

console.log('probe results:', JSON.stringify({ vault, blocked, variant }, null, 1));

const frameOf = (name, x, y) => vault.frames && vault.frames[name] !== undefined ? vault.frames[name] : null;
const expect = [
	['the vault was entered at depth 26', vault.depth === 26 && vault.size.width === 16 && vault.size.height === 64],
	['the floor-decoration scatter ran (Java `Random.Int(5) == 0` over EMPTY cells)',
		vault.decos > 40 && vault.decos < vault.chasms / 2],
	['and it stayed inside its rate (roughly a fifth of the EMPTY cells)',
		Math.abs(vault.decos / (vault.decos + vault.empties) - 0.2) < 0.06],
	// the Amulet itself is dropped by the Yog-death path (`LastLevel.createItems()` lets a fresh
	// entry to 26 have one too, but arriving here by debug jump never ran that), so what this
	// asserts is the *cell* Java's `AMULET_POS` names: plain floor, blank centre of the cluster
	['the Amulet cell (`AMULET_POS` = (8,12)) is plain EMPTY floor, not decoration',
		vault.paintAtAmulet === 1],
	['the hero arrives at the vault entrance cell (8,54)', vault.passable.arrival === true],
	['the shaft is walkable', vault.passable.shaft === true],
	['the void is not, beside the shaft or at a corner',
		vault.passable.chasmBesideShaft === false && vault.passable.chasmCorner === false],
	['and the sealed entrance chamber is not walkable either, centre column included',
		vault.passable.chamber === false && vault.passable.chamberCol === false],
	['walking into the void neither moves nor kills the hero',
		blocked.after.x === blocked.before.x && blocked.after.y === blocked.before.y && blocked.after.hp === blocked.before.hp && blocked.after.gameOver === false],
	['and the open direction still moves, so the refusal is the rule and not a stuck hero',
		blocked.moved.x !== blocked.before.x || blocked.moved.y !== blocked.before.y],
	// `CustomFloor`'s CANDLES array, at the cells its cursor arithmetic puts them on
	['the custom floor layer covers the shaft strip',
		vault.frames !== null && vault.frames.shaft === 19 && vault.frames.chasmStrip === -1],
	['the candle cluster sits where Java puts it (corner blank, 42 beside it, a candle on the row above the Amulet)',
		frameOf('candleStart', 0, 0) === -1 && vault.frames.candleRow === 42
			&& (vault.frames.candleFlame === 46 || vault.frames.candleFlame === 47)],
	['the Amulet cell carries the cluster centre tile (19)',
		vault.frames.amuletCellFrame === 19],
	['decorated floor cells use Java\'s un-obtained decoration tile (27)',
		variant.beforeDeco.length === 4 && variant.beforeDeco.every((f) => f === 27) && variant.decoCount > 20],
	// `CenterPieceVisuals`/`CenterPieceWalls` are stamped at `pos(0, height-10)` / `pos(0, height-11)`
	['the centre-piece visuals are stamped at their Java position',
		vault.centerFrames !== null && vault.centerFrames.column0 === 0 && vault.centerFrames.top === -1],
	['the centre-piece walls are stamped one row higher, with the gate tile centred',
		vault.wallFrames !== null && vault.wallFrames.top === 4 && vault.wallFrames.gate === 7],
	['all three layers span the whole floor', vault.frames.length === 16 * 64 && vault.centerFrames.length === 16 * 64 && vault.wallFrames.length === 16 * 64],
	// taking the Amulet: candles +8 (Java's `data[i] > 40` branch) and the floor swaps to 31
	['taking the Amulet lights the candles (Java `+8` above tile 40)',
		variant.afterCandle === variant.beforeCandle + 8],
	['and swaps the floor decoration to its obtained tile (31)',
		variant.afterDeco.every((f) => f === 31) && variant.beforeDeco.every((f) => f === 27)],
	['while the centre pieces do not depend on it', variant.centerUnchanged === true],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
console.log(`vault livecheck: ${expect.length - failed}/${expect.length} assertions, screenshots in ${shots}`);
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed || problems.length ? 1 : 0;
