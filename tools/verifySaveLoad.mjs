#!/usr/bin/env node
/**
 * Save/load state check (BACKLOG B3 / coord T57), run in a real browser through tools/browserTest.mjs:
 *
 *   npm run build && node tools/verifySaveLoad.mjs [--browser chrome|firefox|both]
 *
 * For each scenario the game is driven into a state (fresh floor, hurt hero with buffs and gold, deeper floors including
 * boss floors), then `saveRun()` -> mutate everything the save should carry -> `loadRun()`, and three things are asserted:
 *   1. the restored state equals the saved one (depth, hero hp/position/level/xp/gold, hero buffs, hunger, the creatures on
 *      the floor with their hp and cells, ground items);
 *   2. save -> load -> save reaches a fixed point: a second load and save produce the same payload as the first (a load loses,
 *      invents and re-reveals nothing; fields a newer build adds with defaults may appear once, never keep changing);
 *   3. the payload survives a real page reload (`localStorage` -> new page -> `loadRun()`), so it is not just in-memory state.
 * Java's own Bundle format is not comparable byte-for-byte to the port's JSON save (an accepted platform difference, see
 * BACKLOG B5 / PORT_COVERAGE); this checks the port's own round-trip fidelity, which is what a player can lose progress to.
 */
import { openGame } from './browserTest.mjs';

const browsers = (() => { const i = process.argv.indexOf('--browser'); const v = i >= 0 ? process.argv[i + 1] : 'chrome'; return v === 'both' ? ['chrome', 'firefox'] : [v]; })();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SNAP = `(() => {
	const s = mwg.currentScene, h = s.hero;
	const creatures = s.creatures.filter((c) => !c.isHero).map((c) => [c.kind || c.name, c.hp, c.x, c.y]).sort((a, b) => JSON.stringify(a) < JSON.stringify(b) ? -1 : 1);
	return {
		depth: s.depth, deepest: s.deepestDepth,
		hero: { hp: h.hp, maxHp: h.maxHp, x: h.x, y: h.y, buffs: JSON.parse(JSON.stringify(h.buffs || {})) },
		level: s.progression.level, xp: s.progression.experience, gold: s.heroStats.base('gold'),
		hunger: s.hunger !== undefined ? JSON.stringify(s.hunger) : null,
		terrain: (() => { let h = 0; const t = s.level.terrain; for (let i = 0; i < t.length; i++) h = (h * 31 + t[i]) | 0; return h; })(),
		secretDoors: [...(s.secretDoorCells || [])].sort((a, b) => a - b).map((i) => i + ':' + s.level.terrain[i]),
		creatures, groundItems: (s.groundItems || []).length, bag: s.bag && s.bag.items ? s.bag.items.map((i) => i.id + ':' + (i.quantity ?? 1)).sort() : null,
	};
})()`;

// Storage keys written by SaveSystem for the run slot, minus fields that legitimately change between two saves: the save
// time, and `itemSerial` (a monotonic instance-id counter: a load re-runs the floor adoption and consumes ids for the baseline
// items it then drops).
const PAYLOAD = `(() => {
	const keys = Object.keys(localStorage).filter((k) => /spd-mwg/.test(k) && /run/.test(k));
	const strip = (v) => JSON.stringify(v, (k, x) => (k === 'savedAt' || k === 'timestamp' || k === 'time' || k === 'itemSerial' ? undefined : x));
	return keys.sort().map((k) => k + '=' + strip(JSON.parse(localStorage.getItem(k)))).join('\\n');
})()`;

const SCENARIOS = [
	{ name: 'fresh floor 1', setup: '0' },
	{ name: 'hurt hero, gold, bless + weakness buffs', setup: `(() => { const s = mwg.currentScene; s.hero.hp = Math.max(1, s.hero.maxHp - 7); s.heroStats.setBase && s.heroStats.setBase('gold', 137); s.hero.buffs.bless = 20; s.hero.buffs.weakness = 12; return 1; })()` },
	{ name: 'floor 3 via the real level transition', setup: `(() => { const s = mwg.currentScene; s.depth = 3; s.deepestDepth = 3; s.enterLevel(); return 1; })()`, wait: 4000 },
	{ name: 'boss floor 5 (Goo), hero damaged', setup: `(() => { const s = mwg.currentScene; s.depth = 5; s.deepestDepth = 5; s.enterLevel(); s.hero.hp = Math.max(1, s.hero.hp - 5); return 1; })()`, wait: 4000 },
	{ name: 'boss floor 10 (Tengu prison level)', setup: `(() => { const s = mwg.currentScene; s.depth = 10; s.deepestDepth = 10; s.enterLevel(); return 1; })()`, wait: 5000 },
];

let failed = 0;
const check = (b, name, ok, detail = '') => { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'} [${b}] ${name}${detail ? ` - ${detail}` : ''}`); };
const leafDiff = (x, y) => {
	const out = [];
	const walk = (a, b, path) => {
		if (JSON.stringify(a) === JSON.stringify(b)) return;
		if (a && b && typeof a === 'object' && typeof b === 'object') { for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) walk(a[k], b[k], path + '.' + k); }
		else out.push(`${path}: ${JSON.stringify(a)?.slice(0, 40)} -> ${JSON.stringify(b)?.slice(0, 40)}`);
	};
	const split = (t) => Object.fromEntries(t.split('\n').map((l) => { const i = l.indexOf('='); return [l.slice(0, i), JSON.parse(l.slice(i + 1))]; }));
	try { walk(split(x), split(y), 'save'); } catch (e) { return String(e); }
	return `${out.length} leaves: ${out.slice(0, 4).join('; ')}`;
};
const diff = (a, b) => { const out = []; for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) out.push(`${k}: ${JSON.stringify(a[k])} != ${JSON.stringify(b[k])}`); return out.join('; '); };

for (const browser of browsers) {
	let game;
	try {
		game = await openGame({ browser, height: 900 });
		await game.startGame();
		for (const sc of SCENARIOS) {
			try {
				await game.eval(sc.setup); await sleep(sc.wait ?? 500);
				const saved = await game.eval(SNAP);
				await game.eval('mwg.currentScene.saveRun()'); await sleep(300);
				const payload1 = await game.eval(PAYLOAD);
				// mutate everything the save is supposed to carry
				await game.eval(`(() => { const s = mwg.currentScene; s.hero.hp = 1; s.hero.buffs = {}; s.heroStats.setBase && s.heroStats.setBase('gold', 1); s.depth = 1; return 1; })()`);
				await game.eval('mwg.currentScene.loadRun()'); await sleep(sc.wait ?? 1500);
				const restored = await game.eval(SNAP);
				check(browser, `${sc.name}: load restores the saved state`, JSON.stringify(saved) === JSON.stringify(restored), diff(saved, restored));
				await game.eval('mwg.currentScene.saveRun()'); await sleep(300);
				const payload2 = await game.eval(PAYLOAD);
				await game.eval('mwg.currentScene.loadRun()'); await sleep(sc.wait ?? 1500);
				await game.eval('mwg.currentScene.saveRun()'); await sleep(300);
				const payload3 = await game.eval(PAYLOAD);
				check(browser, `${sc.name}: save/load/save reaches a fixed point (${payload2.length} bytes)`, payload1.length > 100 && payload2 === payload3, payload2 === payload3 ? '' : leafDiff(payload2, payload3));
			} catch (e) {
				check(browser, sc.name, false, e.message);
			}
		}
		// real reload: the port has no title-screen "Continue", so a saved run is resumed by starting a run and loading (F9 / menu)
		const before = await game.eval(SNAP);
		await game.eval('mwg.currentScene.saveRun()'); await sleep(300);
		await game.eval('location.reload()').catch(() => {});
		await sleep(3000);
		await game.startGame();
		await sleep(1500);
		await game.eval('mwg.currentScene.loadRun()'); await sleep(4000);
		const after = await game.eval(SNAP).catch(() => null);
		check(browser, 'a saved run resumes in a fresh page (new run, then load)', after && JSON.stringify(before) === JSON.stringify(after), after ? diff(before, after) : 'no scene after reload');
		check(browser, 'no console errors', game.consoleErrors().filter((e) => !/Failed to load resource/.test(e)).length === 0, game.consoleErrors().slice(0, 2).join(' | '));
	} catch (e) {
		check(browser, 'harness', false, e.stack ?? String(e));
	} finally {
		await game?.close();
	}
}
console.log(failed === 0 ? 'SAVE/LOAD OK' : `SAVE/LOAD FAILED (${failed})`);
process.exit(failed === 0 ? 0 : 1);
