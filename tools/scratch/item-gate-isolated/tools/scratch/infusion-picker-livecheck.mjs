// Throwaway (tools/scratch): the two infusion selectors' candidate sets.
//
// Java's selectors are predicates, not hand-lists: `MagicalInfusion.usableOnItem(item)` is
// `item.isUpgradable()` and nothing else, and `CurseInfusion.usableOnItem(item)` is
// `(item instanceof EquipableItem && item.isUpgradable()) || item instanceof Wand || item
// instanceof SpiritBow` (tag `v3.3.8`). Both used to be a hand-written list of four bag-id shapes
// here, which left carried missile stacks out - a `MissileWeapon` extends `Weapon` and never
// overrides `isUpgradable()`, so Java offers them.
//
// This drives the real items through the real pickers in the built game and reads back the
// candidates the scene hands the picker, rather than trusting the predicate alone.
//
//   node tools/scratch/infusion-picker-livecheck.mjs      (after `npm run build`)
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

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=infusionpicker', { waitUntil: 'load', timeout: 120000 });
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
// HERO -> warrior
await tap(398 / 1024, 400 / 768);
await tap(62 / 1024, 261 / 768);
await tap(0.166, 0.934);
await page.waitForTimeout(5000);

/** Puts a spread of carried items in the bag, then captures what the picker is offered. */
const runPicker = (spell) => page.evaluate((spellId) => {
	const s = window.__MWG__.currentScene;
	const bag = s['bag'];
	// clear anything carried, then add one item per interesting family
	for (const item of [...bag.items]) bag.remove(item.id, item.quantity, item.instanceId);
	const added = [
		['missile stack', { id: 'stone', quantity: 1, identified: true, sourceClass: 'Bolas' }],
		['runestone', { id: 'stone', quantity: 1, identified: true, sourceClass: 'StoneOfBlast', instanceId: 'rs1' }],
		['generated weapon', { id: 'weaponReward', quantity: 1, identified: true, tier: 2, level: 0, instanceId: 'w1', sourceClass: 'ShortSword' }],
		['generated armor', { id: 'armorReward', quantity: 1, identified: true, tier: 2, level: 0, instanceId: 'a1', sourceClass: 'LeatherArmor' }],
		['wand', { id: 'wand', quantity: 1, identified: true, instanceId: 'wd1', sourceClass: 'WandOfFrost' }],
		['ring', { id: 'ring_might', quantity: 1, identified: true, instanceId: 'r1', sourceClass: 'RingOfMight' }],
		['artifact', { id: 'artifact_chalice', quantity: 1, identified: true, instanceId: 'art1', sourceClass: 'ChaliceOfBlood' }],
		['potion', { id: 'potionHealing', quantity: 1, identified: true }],
		['scroll', { id: 'scrollUpgrade', quantity: 1, identified: true }],
		['bomb', { id: 'bomb', quantity: 2, identified: true }],
		['seed', { id: 'seed', quantity: 1, identified: true }],
		[spellId, { id: spellId, quantity: 1, identified: true }],
	];
	for (const [, item] of added) bag.add(item);

	let captured = null;
	let onPick = null;
	const original = s['openItemPicker'].bind(s);
	s['openItemPicker'] = (title, candidates, pick) => { captured = { title, ids: candidates.map((c) => `${c.id}${c.instanceId ? '#' + c.instanceId : ''}`) }; onPick = pick; return original(title, candidates, pick); };
	if (spellId === 'magicalInfusion') s['useMagicalInfusion'](); else s['useCurseInfusion']();
	s['openItemPicker'] = original;
	// Now run the real callback on a real candidate, so the spell's own effects - the sound cue
	// and, for the curse infusion, the shadow burst - actually execute. A cue naming a clip that
	// is not bundled throws (`SpdAudio.asset`), which the page-error listener would report.
	const before = s['effectBursts'].length;
	const target = (captured?.ids ?? []).find((entry) => entry.startsWith('stone')) ?? (captured?.ids ?? [])[0];
	if (target && onPick) onPick({ id: target.split('#')[0], instanceId: target.includes('#') ? target.split('#')[1] : undefined });
	const bursts = s['effectBursts'].map((burst) => ({
		remaining: burst.remaining,
		// mwg's Pool exposes its live particles; count only the active ones
		active: (burst.emitter.particles ?? []).filter((particle) => particle.active).length,
		at: [burst.emitter.position.x, burst.emitter.position.y],
		hero: [s['hero'].x * 16, s['hero'].y * 16],
	}));
	return {
		added: added.map(([label, item]) => `${label}=${item.id}${item.instanceId ? '#' + item.instanceId : ''}`),
		captured, target, burstsBefore: before, bursts,
	};
}, spell);

const magical = await runPicker('magicalInfusion');
const curse = await runPicker('curseInfusion');
const ids = (r) => new Set((r.captured?.ids ?? []).map((entry) => entry.split('#')[0]));

const result = { magical, curse };
const checks = [
	['the Magical Infusion picker opens', magical.captured !== null],
	['the Curse Infusion picker opens', curse.captured !== null],
	['a carried missile stack is offered to Magical Infusion', ids(magical).has('stone')],
	['and to Curse Infusion', ids(curse).has('stone')],
	['a runestone is not (same bag id, different class)', !magical.captured.ids.some((entry) => entry === 'stone#rs1')],
	['a generated weapon is offered', ids(magical).has('weaponReward')],
	['a generated armor is offered', ids(magical).has('armorReward')],
	['a wand is offered', ids(magical).has('wand')],
	['a ring is offered', ids(magical).has('ring_might')],
	['an artifact is not offered to Magical Infusion', !ids(magical).has('artifact_chalice')],
	['nor to Curse Infusion', !ids(curse).has('artifact_chalice')],
	['a potion is not offered', !ids(magical).has('potionHealing')],
	['a scroll is not offered', !ids(magical).has('scrollUpgrade')],
	['a bomb is not offered', !ids(magical).has('bomb')],
	['a seed is not offered', !ids(magical).has('seed')],
	['the equipped weapon and armor lead the list', magical.captured.ids.length > 0],
	// presentation: `CurseInfusion.onItemSelected()` bursts 5 `ShadowParticle.UP`s at the hero's
	// cell and plays CURSED; `MagicalInfusion` plays READ and bursts nothing.
	['the curse infusion bursts 5 shadow particles at the hero cell',
		curse.bursts.length === curse.burstsBefore + 1 && curse.bursts.at(-1).active === 5
		&& curse.bursts.at(-1).at.join() === curse.bursts.at(-1).hero.join()],
	['the magical infusion bursts nothing', magical.bursts.length === magical.burstsBefore],
	['both casts ran without a page error (a missing sound clip throws)', problems.length === 0],
];
let failed = 0;
for (const [name, ok] of checks) { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); }
console.log(`\n${checks.length - failed}/${checks.length} infusion-picker checks passed.`);
console.log(`magicalInfusion candidates: ${JSON.stringify(magical.captured?.ids)}`);
console.log(`curseInfusion candidates:  ${JSON.stringify(curse.captured?.ids)}`);
if (problems.length) console.log(`page problems: ${JSON.stringify(problems.slice(0, 3))}`);
const dir = path.join(process.env.BROWSERCHECK_DIR ?? 'C:/Users/miche/dev/_browsercheck', 'mwgpd_shots_infusion');
fs.mkdirSync(dir, { recursive: true });
await page.screenshot({ path: path.join(dir, 'picker.png') }).catch(() => {});
await browser.close();
process.exit(failed === 0 && problems.length === 0 ? 0 : 1);
