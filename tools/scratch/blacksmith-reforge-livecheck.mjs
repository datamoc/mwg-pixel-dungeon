// Throwaway (tools/scratch): the Troll Blacksmith's reforge, on the class rule Java uses.
//
// `WndBlacksmith.WndReforge` pairs two picks of the *same class* (`getClass()` equality), which this
// port used to approximate by bag id - and since every generated weapon shares the id `weaponReward`,
// that happily reforged a handaxe with a shortsword. This drives a real floor: two same-class
// weapons are reforged (the higher survives at +1, the other is consumed, favour is charged), and
// two different weapon classes cannot be paired at all.
//
// Run after `npm run build`:  node tools/scratch/blacksmith-reforge-livecheck.mjs
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const globalRoot = process.env.GLOBAL_NODE_MODULES ?? 'C:\\Users\\miche\\AppData\\Roaming\\npm\\node_modules';
const { chromium } = require(path.join(globalRoot, 'playwright'));
const browser = await chromium.launch({
	executablePath: path.join(process.env.LOCALAPPDATA ?? 'C:\\Users\\miche\\AppData\\Local', 'ms-playwright', 'chromium-1193', 'chrome-win', 'chrome.exe'),
	args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await (await browser.newContext({ viewport: { width: 1024, height: 768 } })).newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`console.error: ${m.text()}`); });
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=blacksmith-reforge', { waitUntil: 'load', timeout: 120000 });
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

// Two phases, because the driver cannot screenshot while the page is inside an `evaluate`: phase A
// opens the window and makes the first pick, leaving the second picker up for the screenshot; phase
// B completes the reforge.
const phaseA = await page.evaluate(async () => {
	const s = window.__MWG__.currentScene;
	const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
	s['depth'] = 12;
	s['enterLevel']();
	await sleep(3500);

	s['blacksmithFavor'] = 5000;
	s['blacksmithReforges'] = 0;
	s['bag'].add({ id: 'weaponReward', quantity: 1, identified: true, level: 1, sourceClass: 'Shortsword', instanceId: 'rf-low' });
	s['bag'].add({ id: 'weaponReward', quantity: 1, identified: true, level: 3, sourceClass: 'Shortsword', instanceId: 'rf-high' });
	s['bag'].add({ id: 'weaponReward', quantity: 1, identified: true, level: 0, sourceClass: 'Handaxe', instanceId: 'rf-axe' });
	s['bag'].add({ id: 'ring_garnet', quantity: 1, identified: true, level: 1, instanceId: 'rf-ring' });
	s['bag'].add({ id: 'stone', quantity: 5, identified: true, sourceClass: 'ThrowingKnife', level: 0, instanceId: 'rf-missile' });

	s['openBlacksmithReforge']();
	await sleep(250);
	const firstList = s['itemPickerEntries'].map((e) => `${e.id}:${e.sourceClass ?? ''}:${e.level ?? 0}`);
	const low = s['itemPickerEntries'].findIndex((e) => e.instanceId === 'rf-low');
	if (low < 0) return { found: false, firstList };
	s['chooseItemPicker'](low);
	await sleep(250);
	const secondList = s['itemPickerEntries'].map((e) => `${e.id}:${e.sourceClass ?? ''}:${e.level ?? 0}`);
	return { found: true, firstList, secondList, favorBefore: s['blacksmithFavor'], cost: s['blacksmithReforgeCost']() };
});
console.log('first phase:', JSON.stringify(phaseA, null, 1));
if (phaseA.found === false) {
	console.log('FAIL the shortsword was not offered:', JSON.stringify(phaseA.firstList));
	await browser.close();
	process.exit(1);
}
await page.screenshot({ path: 'tools/scratch/blacksmith-reforge-picker.png' });

const result = await page.evaluate(async (phase) => {
	const s = window.__MWG__.currentScene;
	const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
	const high = s['itemPickerEntries'].findIndex((e) => e.instanceId === 'rf-high');
	s['chooseItemPicker'](high);
	await sleep(300);
	const logs = (s['gameLog']?.['blocks'] ?? []).map((b) => b.text ?? b.label?.text ?? '').join(' | ');
	return {
		...phase,
		favorAfter: s['blacksmithFavor'],
		reforges: s['blacksmithReforges'],
		keptLevel: s['bag'].find('weaponReward', 'rf-high')?.level ?? null,
		lowGone: s['bag'].find('weaponReward', 'rf-low') === undefined,
		axeUntouched: s['bag'].find('weaponReward', 'rf-axe')?.level ?? null,
		ringUntouched: s['bag'].find('ring_garnet', 'rf-ring') !== undefined,
		missileUntouched: s['bag'].find('stone', 'rf-missile')?.quantity ?? 0,
		logNamesItem: /reforg/i.test(logs),
	};
}, phaseA);
console.log('probe results:', JSON.stringify(result, null, 1));
if (result.found === false) {
	console.log('FAIL the shortsword was not offered:', JSON.stringify(result.firstList));
	await browser.close();
	process.exit(1);
}
const expect = [
	['the picker offers both same-class weapons and the ring, but neither the missile stack nor a wand',
		result.firstList.filter((entry) => entry.startsWith('weaponReward:Shortsword')).length === 2
		&& result.firstList.includes('ring_garnet::1')
		&& !result.firstList.some((entry) => entry.startsWith('stone'))],
	["the second list holds only the first pick's class - not the handaxe, the ring or the potion",
		result.secondList.length === 1 && result.secondList[0] === 'weaponReward:Shortsword:3'],
	['the higher-level item survives and gains exactly one level',
		result.keptLevel === 4],
	['the consumed one is gone and its class-mates are untouched',
		result.lowGone === true && result.axeUntouched === 0 && result.ringUntouched === true
		&& result.missileUntouched === 5],
	['the reforge charges `500 + 1000*reforges` and counts itself',
		result.favorAfter === result.favorBefore - result.cost && result.cost === 500 && result.reforges === 1],
	['and the log names the reforged item rather than this scene\'s weapon/armor counters',
		result.logNamesItem === true],
	['no page errors', true],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
console.log(`blacksmith reforge livecheck: ${expect.length - failed}/${expect.length} assertions`);
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed || problems.length ? 1 : 0;
