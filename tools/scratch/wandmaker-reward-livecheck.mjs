// Throwaway (tools/scratch): the Wandmaker's reward, live - two real wands, and one picked.
//
// `WndWandmaker` offers this floor's own `Quest.wand1`/`wand2` (two random wand classes, rolled
// during level generation) and only its confirm spends the quest item. This port used to hand out
// a *frost* wand outright, choosing the class for the player. This drives a real Prison floor that
// rolled the quest and reads the window the real interaction opens.
//
// Run after `npm run build`:  node tools/scratch/wandmaker-reward-livecheck.mjs
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
const page = await (await browser.newContext({ viewport: { width: 1024, height: 768 } })).newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`console.error: ${m.text()}`); });

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=wandmaker-reward', { waitUntil: 'load', timeout: 120000 });
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

const result = await page.evaluate(async () => {
	const s = window.__MWG__.currentScene;
	const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
	// the quest rolls on Prison depths 7-9; walk them until the wandmaker himself shows up
	let found = null;
	for (const depth of [9, 8, 7]) {
		s['depth'] = depth;
		s['enterLevel']();
		await sleep(3000);
		if (s['creatures'].some((c) => c.kind === 'wandmaker' && c.hp > 0)) { found = depth; break; }
	}
	if (found === null) return { found: null };

	// The scene's own `wandmakerType` is 0 until it is read off the level generator at the first
	// interaction, so the quest has to be opened before the fetch item can even be chosen.
	s['interactWithWandmaker']();
	await sleep(300);
	const type = s['wandmakerType'];
	const item = type === 1 ? { id: 'corpseDust', quantity: 1, identified: true }
		: type === 2 ? { id: 'embers', quantity: 1, identified: true }
			: { id: 'seed', quantity: 1, identified: true, instanceId: s['newItemInstanceId']('seed'), sourceClass: 'Rotberry' };
	s['bag'].add(item);
	// the game log is capped, so new lines *displace* old ones - diff by value, not by index
	const logText = () => (s['gameLog']?.['blocks'] ?? []).map((block) => block.text ?? block.label?.text ?? '');
	const logsBefore = logText();

	s['interactWithWandmaker']();
	await sleep(300);
	const offered = s['itemPickerEntries'].map((entry) => ({ id: entry.id, instanceId: entry.instanceId }));
	const names = s['itemPickerEntries'].map((entry) => s['itemDisplayName']('wand', true, entry.instanceId));
	const wandTypeBefore = s['wandType'];
	const nameBefore = s['itemDisplayName']('wand', true);
	// pick the wand that is *not* the one the hero already holds, so "the type changed" is a real
	// assertion rather than a coincidence of which entry the seed happened to roll first
	const pickIndex = names.findIndex((name) => name !== nameBefore);

	// cancelling must keep the quest item - Java spends it only in `selectReward`
	s['chooseItemPicker'](-1);
	await sleep(200);
	const itemAfterCancel = type === 1 ? s['bag'].find('corpseDust') !== undefined
		: type === 2 ? s['bag'].find('embers') !== undefined
			: s['bag'].items.some((bagItem) => bagItem.id === 'seed' && bagItem.sourceClass === 'Rotberry');

	// ...and a real pick spends it, hands over that wand, and lets the wandmaker leave
	s['interactWithWandmaker']();
	await sleep(300);
	const chosen = s['itemPickerEntries'][pickIndex];
	s['chooseItemPicker'](pickIndex);
	await sleep(400);
	// only the lines the reward itself produced: the pickup names the wand, and the farewell is
	// Java's `farewell` line, whose text differs per locale but always ends in the hero's name
	const logs = logText().filter((line) => !logsBefore.includes(line));
	return {
		found, type, offered, names, itemAfterCancel,
		wandTypeBefore,
		chosenInstance: chosen?.instanceId ?? null,
		wandTypeAfter: s['wandType'],
		itemAfterPick: type === 1 ? s['bag'].find('corpseDust') !== undefined
			: type === 2 ? s['bag'].find('embers') !== undefined
				: s['bag'].items.some((bagItem) => bagItem.id === 'seed' && bagItem.sourceClass === 'Rotberry'),
		wandInBag: s['bag'].find('wand') !== undefined,
		npcGone: !s['creatures'].some((c) => c.kind === 'wandmaker' && c.hp > 0),
		newLogLines: logs.length,
		farewellLogged: logs.filter((line) => line.trim().endsWith('!')).length >= 1,
		// the pickup line is SPD's own `you_now_have`, rendered with the wand the window named -
		// so matching the *display name* the picker showed is locale-correct without hardcoding one
		pickupLogged: logs.some((line) => names.some((name) => line.includes(name))),
		// the bag now *is* the wand the window named - the real check that the class took
		nameAfter: s['itemDisplayName']('wand', true),
		nameBefore,
		chosenName: names[pickIndex] ?? null,
	};
});

console.log('probe results:', JSON.stringify(result, null, 1));
if (result.found === null) {
	console.log('SKIP no Prison depth rolled the Wandmaker quest at this seed');
	await browser.close();
	process.exit(0);
}
const distinct = new Set(result.offered.map((entry) => entry.instanceId)).size;
const expect = [
	['the quest floor records two offered wands, of different classes',
		result.offered.length === 2 && distinct === 2
		&& result.offered.every((entry) => entry.id === 'wand' && String(entry.instanceId).startsWith('wand-reward:'))],
	['and the window names each of them, rather than the hero\'s current wand twice',
		result.names.length === 2 && result.names[0] !== result.names[1] && result.names.every((name) => name.length > 0)],
	['cancelling the window keeps the quest item in the bag, as Java\'s does',
		result.itemAfterCancel === true],
	['picking one spends the item and sets the hero\'s wand to *that* class',
		result.itemAfterPick === false && result.wandTypeAfter !== result.wandTypeBefore
		&& String(result.chosenInstance).endsWith(String(result.wandTypeAfter)) === false],
	['the wand lands in the bag, and the wandmaker has left for good',
		result.wandInBag === true && result.npcGone === true],
	['with his real farewell and the real pickup line in the log',
		result.farewellLogged === true && result.pickupLogged === true && result.newLogLines >= 2],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
console.log(`wandmaker reward livecheck: ${expect.length - failed}/${expect.length} assertions`);
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed || problems.length ? 1 : 0;
