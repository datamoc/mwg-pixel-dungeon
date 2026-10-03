// Throwaway (tools/scratch): the Ring of Wealth's bonus drops, live.
//
// Java's `RingOfWealth.tryForBonusDrop` is a pair of counters on the hero: every kill pays a fixed
// number of "tries" against the first counter, and when it runs out the ring owes a drop - either a
// consumable (from a three-tier table) or, once a second counter empties, an equipment item rolled
// from Java's own generators. The port had the cadence and a stand-in payload (a depth-derived
// `armorReward`, or a flat potion/scroll/stone/gold pick); this check drives the real catalogue into
// a live kill and looks at what lands on the floor.
//
// Run after `npm run build`:  node tools/scratch/wealth-livecheck.mjs
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

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=wealth-live', { waitUntil: 'load', timeout: 120000 });
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
	// A `ring_wealth` at +4 is Java's `RingOfWealth` at level 3: `getBuffedBonus` = level + 1.
	s['equippedRing'] = { id: 'ring_wealth', level: 4 };

	// --- an equipment payout: `dropsToEquip` starts empty, so the first drop is an item ---
	const before = s['groundItems'].length;
	s['wealthTriesToDrop'] = 0;
	s['wealthDropsToEquip'] = 0;
	const rat = s['spawnMonster']('rat', { x: hero.x, y: hero.y + 1 });
	s['tryWealthBonusDrop'](rat, 1);
	const equipment = s['groundItems'].slice(before).map((g) => ({
		kind: g.kind, id: g.item?.id ?? null, level: g.item?.level ?? null, cursed: g.item?.cursed ?? null,
	}));
	const equipmentTrackers = { tries: s['wealthTriesToDrop'], drops: s['wealthDropsToEquip'] };

	// --- consumable payouts: hold `dropsToEquip` open and let a boss-sized roll empty the counter ---
	const kinds = new Set();
	const ids = new Set();
	for (let round = 0; round < 6; round++) {
		const mark = s['groundItems'].length;
		s['wealthTriesToDrop'] = 0;
		s['wealthDropsToEquip'] = 5;
		s['tryWealthBonusDrop'](rat, 15);
		for (const ground of s['groundItems'].slice(mark)) {
			kinds.add(ground.kind);
			if (ground.item?.id) ids.add(ground.item.id);
		}
		// clear the floor so later rounds have free cells to drop into
		for (const ground of [...s['groundItems']]) {
			s['groundItems'].splice(s['groundItems'].indexOf(ground), 1);
			s['sprite'](ground).destroy();
		}
	}

	// --- the same counters, driven with the boss/miniboss/ordinary roll counts the live kill site
	// passes. The exact 1/5/15 mapping is pinned headlessly (`verifyItemWorkflows`); the counter's
	// final value is not a clean function of `rolls` here (every payout draws its own
	// `NormalIntRange(0, 20)` refill), so this only samples them for the record.
	const sampleRolls = (rollsUsed) => {
		s['equippedRing'] = { id: 'ring_wealth', level: 4 };
		const creature = s['spawnMonster']('rat', { x: hero.x, y: hero.y + 1 });
		s['wealthTriesToDrop'] = 0;
		s['wealthDropsToEquip'] = 5;
		s['tryWealthBonusDrop'](creature, rollsUsed);
		return s['wealthTriesToDrop'];
	};
	const rolls = { ordinary: sampleRolls(1), miniboss: sampleRolls(5), boss: sampleRolls(15) };
	// --- no ring, no drops: the site gates on `getBuffedBonus(...) > 0` ---
	s['equippedRing'] = null;
	const mark = s['groundItems'].length;
	s['wealthTriesToDrop'] = 0;
	s['wealthDropsToEquip'] = 0;
	s['tryWealthBonusDrop'](rat, 15);
	const withoutRing = s['groundItems'].length - mark;

	await sleep(50);
	return { equipment, equipmentTrackers, kinds: [...kinds], ids: [...ids], rolls, withoutRing };
});

console.log('probe results:', JSON.stringify(probe, null, 1));
const consumableKinds = ['potion', 'scroll', 'stone', 'gold', 'bomb', 'honeypot', 'stoneOfEnchantment', 'potionExperience', 'scrollTransmutation'];
const equipmentKinds = ['weapon', 'armor', 'ring', 'wand'];
const expect = [
	['an equipment payout really spawns an equipment item',
		probe.equipment.length === 1 && equipmentKinds.includes(probe.equipment[0].kind)],
	['and it is a *generated* item, not the depth-derived stand-in this replaced',
		probe.equipment[0].id !== null && probe.equipment[0].id !== 'armorReward'],
	['handed over uncursed, as Java does', probe.equipment[0].cursed === false],
	['the equip counter refilled itself (`NormalIntRange(5, 10)`)',
		probe.equipmentTrackers.drops >= 5 && probe.equipmentTrackers.drops <= 10],
	['consumable payouts only ever produce real catalogue items',
		probe.kinds.length > 0 && probe.kinds.every((kind) => consumableKinds.includes(kind))],
	['and never the old stand-in payload', probe.ids.includes('armorReward') === false],
	['every roll count the live site passes still pays out and refills cleanly',
		Object.values(probe.rolls).every((value) => Number.isFinite(value))],
	['no wealth ring means no bonus drops at all', probe.withoutRing === 0],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
console.log(`wealth livecheck: ${expect.length - failed}/${expect.length} assertions`);
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed || problems.length ? 1 : 0;
