// Throwaway (tools/scratch): `SummonElemental`'s imbue picker, mature summons and recall, live.
//
// Java's spell has two actions: the cast (`onCast`, which recalls an existing summoned elemental
// instead of making a second one) and `AC_IMBUE`, whose bag selector consumes an identified
// Liquid Flame / Frost / Recharging / Transmutation item and raises a *mature* elemental of that
// element from then on. Before this pass the port cast a newborn every time, with a normal ranged
// cooldown Java's `AllyNewBornElemental` deliberately does not have.
//
// Run after `npm run build`:  node tools/scratch/elemental-livecheck.mjs
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

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=elemental-live', { waitUntil: 'load', timeout: 120000 });
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
	const bag = s['bag'];
	const spell = () => bag.find('summonElemental', 'spell-live');
	const allies = () => s['creatures'].filter((c) => c.isAlly === true && c.hp > 0
		&& (c.kind === 'newbornElemental' || c.kind === 'elemental'));
	bag.add({ id: 'summonElemental', quantity: 1, identified: true, instanceId: 'spell-live' });
	bag.add({ id: 'potionFlame', quantity: 1, identified: true, instanceId: 'flame-live' });
	bag.add({ id: 'potionHealing', quantity: 1, identified: true, instanceId: 'heal-live' });

	// --- the picker: a cast row and an imbue row ---
	s['useSummonElemental']('spell-live');
	const rows = (s['itemPickerEntries'] ?? []).map((e) => e.instanceId);
	const labels = (s['itemPickerEntries'] ?? []).map((e) => s['itemDisplayName'](e.id, e.identified ?? false, e.instanceId));
	s['chooseItemPicker'](-1);

	// --- an un-imbued cast: Java's `AllyNewBornElemental` ---
	s['castSummonElemental']('spell-live');
	await sleep(200);
	const first = allies()[0];
	const newborn = first ? { kind: first.kind, rangedCooldown: first.rangedCooldown, miniboss: first.miniboss, hp: first.hp, maxHp: first.maxHp } : null;
	const spellAfterCast = bag.find('summonElemental', 'spell-live') !== undefined;

	// --- the recall: a second cast repositions the same ally and keeps the spell ---
	const before = first ? { x: first.x, y: first.y } : null;
	bag.add({ id: 'summonElemental', quantity: 1, identified: true, instanceId: 'spell-again' });
	s['castSummonElemental']('spell-again');
	await sleep(200);
	const after = allies();
	const recall = {
		count: after.length,
		moved: first && before ? (first.x !== before.x || first.y !== before.y) : null,
		spellKept: bag.find('summonElemental', 'spell-again') !== undefined,
	};

	// --- the imbue: the picker offers only the eligible consumable, and choosing it imbues the
	// spell (the one `spell-again` still carries - the first cast consumed its own copy) ---
	s['useSummonElemental']('spell-again');
	s['chooseItemPicker']((s['itemPickerEntries'] ?? []).findIndex((e) => e.instanceId === 'summonElemental-imbue'));
	const imbueRows = (s['itemPickerEntries'] ?? []).map((e) => e.instanceId);
	s['chooseItemPicker'](imbueRows.indexOf('flame-live'));
	await sleep(100);
	const imbued = {
		offered: imbueRows,
		element: bag.find('summonElemental', 'spell-again')?.imbuedElement ?? null,
		potionGone: bag.find('potionFlame', 'flame-live') === undefined,
	};

	// --- an imbued cast now raises a *mature* elemental of that element ---
	for (const ally of allies()) {
		s['creatures'].splice(s['creatures'].indexOf(ally), 1);
		s['sprite'](ally).destroy();
	}
	bag.add({ id: 'summonElemental', quantity: 1, identified: true, instanceId: 'spell-mature' });
	// the imbue lives on the *spell item*, so the fresh copy has to inherit it the way a re-imbued
	// one would after Java's save/load round-trip
	bag.find('summonElemental', 'spell-mature').imbuedElement = bag.find('summonElemental', 'spell-again').imbuedElement;
	s['castSummonElemental']('spell-mature');
	await sleep(200);
	const mature = allies()[0];
	const matureSummon = mature ? { kind: mature.kind, element: mature.elementalType ?? null, rangedCooldown: mature.rangedCooldown } : null;

	await sleep(50);
	return { rows, labels, newborn, spellAfterCast, recall, imbued, matureSummon, bagIds: bag.items.map((i) => `${i.id}(${i.quantity})`) };
});

console.log('probe results:', JSON.stringify(probe, null, 1));
const expect = [
	['the spell offers both of Java\'s actions as picker rows',
		probe.rows.includes('summonElemental-cast') && probe.rows.includes('summonElemental-imbue')],
	['labelled with SPD\'s own cast/imbue strings',
		probe.labels.length === 2 && probe.labels.every((label) => label.length > 0)],
	['an un-imbued cast raises the newborn ally', probe.newborn !== null && probe.newborn.kind === 'newbornElemental'],
	['which never uses its ranged attack and is not a miniboss (`AllyNewBornElemental`)',
		probe.newborn.rangedCooldown > 1e9 && probe.newborn.miniboss === false],
	['and it arrives at full health', probe.newborn.hp === probe.newborn.maxHp],
	['the cast consumes the spell', probe.spellAfterCast === false],
	['a second cast recalls the existing elemental instead of summoning another',
		probe.recall.count === 1 && probe.recall.moved === true],
	['and does not consume that spell', probe.recall.spellKept === true],
	['the imbue picker offers exactly the carried eligible consumable',
		probe.imbued.offered.length === 1 && probe.imbued.offered[0] === 'flame-live'],
	['choosing it consumes the item and imbues the spell with fire',
		probe.imbued.element === 'fire' && probe.imbued.potionGone === true],
	['and a later cast raises a mature elemental of that element instead',
		probe.matureSummon !== null && probe.matureSummon.kind === 'elemental' && probe.matureSummon.element === 'fire'],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
console.log(`elemental livecheck: ${expect.length - failed}/${expect.length} assertions`);
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed || problems.length ? 1 : 0;
