// Throwaway (tools/scratch): the Wandmaker's three quest types, live, end to end.
//
// ROADMAP.md's "Port City NPCs and quests"/"Replace the simplified Wandmaker quests" bullets
// describe all three fetch types (corpse dust, embers, rotberry seed) as implemented, but the
// checkbox stayed open for a live browser pass that never happened (no tools/scratch script
// existed for it). This drives all three: offer -> fetch item -> turn-in -> wand reward, and
// specifically checks the reward log line is real, translated text (not the raw key, not
// English) - the exact class of bug just found and fixed in this same pass, where the reward
// line was hardcoded English bypassing t() entirely while every sibling line already used it.
//
// All three types run in one page session: `heroClass` is overridden directly (no need to
// guess the other class-select buttons' pixel coordinates) and `quests['stageIndex']` is
// cleared between trials (QuestLog has no public reset, but nothing else backs its state).
//
// Run after `npm run build`:  node tools/scratch/wandmaker-livecheck.mjs
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

const shots = 'C:/Users/miche/dev/_browsercheck/mwgpd_shots_wandmaker';
fs.mkdirSync(shots, { recursive: true });

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=wandmaker', { waitUntil: 'load', timeout: 120000 });
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

const runType = (type, heroClass) => page.evaluate(([type, heroClass]) => {
	const s = window.__MWG__.currentScene;
	const log = [];
	const origSay = s['say'].bind(s);
	s['say'] = (text, ...rest) => { log.push(text); return origSay(text, ...rest); };

	s['quests']['stageIndex'].delete('wandmaker');
	s['heroClass'] = heroClass;
	s['wandmakerType'] = type;
	s['wandmakerSpawned'] = true;
	// clear any wand/quest items a prior trial left behind, so bag deltas below are unambiguous
	for (const id of ['corpseDust', 'embers', 'seed', 'wand']) {
		const item = s['bag'].find(id);
		if (item) s['bag'].remove(id, item.quantity, item.instanceId);
	}

	const before = { status: s['quests'].status('wandmaker') };
	s['interactWithWandmaker'](); // offer -> starts the quest, says the type-specific intro
	const afterOffer = { status: s['quests'].status('wandmaker'), logLen: log.length };

	s['interactWithWandmaker'](); // no item yet -> should just remind, not consume/advance
	const afterRemind = { status: s['quests'].status('wandmaker'), logLen: log.length };

	if (type === 1) s['bag'].add({ id: 'corpseDust', quantity: 1, identified: true });
	else if (type === 2) s['bag'].add({ id: 'embers', quantity: 1, identified: true, sourceClass: 'Embers' });
	else if (type === 3) s['bag'].add({ id: 'seed', quantity: 1, identified: true, sourceClass: 'Rotberry' });
	const bagBefore = s['bag'].items.length;

	s['interactWithWandmaker'](); // turn-in -> consumes the item, grants the wand, completes

	s['say'] = origSay;
	return {
		before, afterOffer, afterRemind,
		bagBefore,
		bagAfter: s['bag'].items.length,
		questComplete: s['quests'].status('wandmaker') === 'complete',
		hasWand: s['bag'].find('wand') !== undefined,
		frostWand: s['frostWand'],
		wandType: s['wandType'],
		rewardLine: log.at(-1),
		fullLog: log,
	};
}, [type, heroClass]);

const r1 = await runType(1, 'warrior');
const r2 = await runType(2, 'mage');
const r3 = await runType(3, 'rogue');
await page.screenshot({ path: path.join(shots, 'after-all-three.png') });

console.log('results:', JSON.stringify({ r1, r2, r3 }, null, 1));
if (problems.length > 0) console.log('PROBLEMS:', problems);

const isEnglishy = (s) => /\b(wandmaker|frost wand|tunes your staff)\b/i.test(s ?? '');
const expect = [
	['type 1 (dust): offer starts the quest and says something', r1.before.status === 'available' && r1.afterOffer.status === 'active' && r1.afterOffer.logLen > 0],
	['type 1: reminding without the item does not consume/advance', r1.afterRemind.status === 'active' && r1.afterRemind.logLen > r1.afterOffer.logLen],
	['type 1: turn-in consumes the dust and completes the quest', r1.bagAfter === r1.bagBefore && r1.questComplete],
	["type 1: hero gets a wand, warrior -> frost per this port's simplification", r1.hasWand && r1.frostWand === true && r1.wandType === 'frost'],
	['type 1: the reward line is real translated text, not raw English/key', typeof r1.rewardLine === 'string' && r1.rewardLine.length > 0 && !isEnglishy(r1.rewardLine) && !r1.rewardLine.startsWith('port.')],
	['type 2 (ember): offer/turn-in/reward all mirror type 1', r2.afterOffer.status === 'active' && r2.questComplete && r2.hasWand],
	['type 2: mage gets magicMissile, not frost', r2.frostWand === false && r2.wandType === 'magicMissile'],
	['type 2: the reward line is real translated text', typeof r2.rewardLine === 'string' && !isEnglishy(r2.rewardLine) && !r2.rewardLine.startsWith('port.')],
	['type 3 (berry): offer/turn-in/reward all mirror type 1', r3.afterOffer.status === 'active' && r3.questComplete && r3.hasWand],
	['type 3: rogue gets frost per the same simplification', r3.frostWand === true && r3.wandType === 'frost'],
	['type 3: the reward line is real translated text', typeof r3.rewardLine === 'string' && !isEnglishy(r3.rewardLine) && !r3.rewardLine.startsWith('port.')],
	['no page/console errors across all three runs', problems.length === 0],
];
let pass = 0;
for (const [name, ok] of expect) { console.log(ok ? 'PASS' : 'FAIL', name); if (ok) pass++; }
console.log(`wandmaker livecheck: ${pass}/${expect.length} assertions`);

await browser.close();
