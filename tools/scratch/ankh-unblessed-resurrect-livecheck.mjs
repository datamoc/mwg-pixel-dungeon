// Throwaway (tools/scratch): unblessed-ankh resurrect - dying with an unblessed ankh opens
// the keeps window instead of ending the run; changing a keep through the selector and
// confirming regenerates the depth with full HP and only the two keeps in the bag.
//
// Run after `npm run build`:  node tools/scratch/ankh-unblessed-resurrect-livecheck.mjs
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

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=ankh-unblessed', { waitUntil: 'load', timeout: 120000 });
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

const first = await page.evaluate(async () => {
	const s = window.__MWG__.currentScene;
	const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
	s['depth'] = 6;
	s['enterLevel']();
	await sleep(3500);
	s['bag'].add({ id: 'ankh', quantity: 1 });
	s['bag'].add({ id: 'potionHealing', quantity: 1, stackable: true });
	const bagIds = () => s['bag'].items.filter((i) => (i.quantity ?? 0) > 0).map((i) => i.id).sort();

	// death with an unblessed ankh: no game over, the keeps window opens on its own
	s['hero'].hp = 1;
	s['kill'](s['hero']);
	await sleep(2500);
	const offered = {
		noGameOver: s['gameOver'] !== true,
		windowOpen: s['gameWindows'].top != null,
		pending: s['resurrectPending'] === true,
		noInput: s['awaitingInput'] !== true,
	};
	return { offered };
});
await page.screenshot({ path: 'tools/scratch/ankh-resurrect-window.png' });

// change keep 1 to the potion through the selector, then confirm
const confirmed = await page.evaluate(async () => {
	const s = window.__MWG__.currentScene;
	const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
	const bagIds = () => s['bag'].items.filter((i) => (i.quantity ?? 0) > 0).map((i) => i.id).sort();
	const closeTop = () => { if (s['gameWindows'].top != null && typeof s['gameWindows'].top.close === 'function') s['gameWindows'].top.close(); };
	// A real keep-row tap closes the keeps window before the selector opens; mirror that here.
	closeTop();
	s['openResurrectSelector'](1);
	await sleep(300);
	const selectorIds = (s['itemPickerEntries'] ?? []).map((e) => e.id);
	const potionIndex = selectorIds.indexOf('potionHealing');
	const selectorClean = !selectorIds.includes('ankh') && !selectorIds.includes('velvetPouch');
	if (potionIndex >= 0) s['chooseItemPicker'](potionIndex);
	await sleep(300);

	// A real confirm tap closes the keeps window before confirmResurrect runs; mirror that.
	closeTop();
	s['confirmResurrect']();
	await sleep(2000);
	return {
		selectorClean, selectorIds,
		after: {
			hpFull: s['hero'].hp === s['hero'].maxHp,
			pending: s['resurrectPending'] === true,
			noWindowLeft: s['gameWindows'].top == null,
			awaitingInput: s['awaitingInput'] === true,
			stillDepth6: s['depth'] === 6,
			bag: bagIds(),
			invisible: (s['hero'].buffs['invisibility'] ?? 0) > 0,
		},
	};
});
await page.screenshot({ path: 'tools/scratch/ankh-resurrected.png' });
const result = { ...first, ...confirmed };

console.log('probe results:', JSON.stringify(result, null, 1));
const expect = [
	['death offers the keeps window, never the defeat panel',
		result.offered.noGameOver === true && result.offered.windowOpen === true && result.offered.pending === true && result.offered.noInput === true],
	['the selector admits everything but ankhs and bags', result.selectorClean === true && result.selectorIds.includes('potionHealing')],
	['confirm regenerates at full health with input restored',
		result.after.hpFull === true && result.after.pending === false && result.after.awaitingInput === true && result.after.stillDepth6 === true],
	['only the two keeps survive: potion and armor, ankh/food/pouch gone',
		result.after.bag.length === 2 && result.after.bag.includes('potionHealing')
		&& !result.after.bag.includes('ankh') && !result.after.bag.includes('food') && !result.after.bag.includes('velvetPouch')],
	['no duplicate windows left behind and the hero walks out invisible', result.after.noWindowLeft === true && result.after.invisible === true],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
console.log(`ankh unblessed-resurrect livecheck: ${expect.length - failed}/${expect.length} assertions`);
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed || problems.length ? 1 : 0;
