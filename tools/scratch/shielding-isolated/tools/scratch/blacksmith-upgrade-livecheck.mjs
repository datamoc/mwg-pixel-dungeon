// Throwaway (tools/scratch): the Blacksmith's Upgrade service, live - which items does it offer?
//
// `WndBlacksmith.WndUpgrade.itemSelectable` is `isUpgradable() && isIdentified() && !cursed &&
// level() < 2` - no type test, so Java can upgrade a wand, a ring or a carried missile stack. This
// port's picker filtered on a three-id hand-list (weapons/armor only) until 2026-09-16. This check
// drives the real service over a real bag and reads the picker it opens, then buys one upgrade.
//
// Run after `npm run build`:  node tools/scratch/blacksmith-upgrade-livecheck.mjs
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

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=bsmith-upgrade', { waitUntil: 'load', timeout: 120000 });
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
	s['depth'] = 11;
	s['enterLevel']();
	await sleep(3500);

	// a bag with one of each class the predicate has to tell apart
	const ringId = 'ring_garnet';
	s['bag'].add({ id: ringId, quantity: 1, instanceId: s['newItemInstanceId']('ring'), identified: true });
	s['bag'].add({ id: 'wand', quantity: 1, stackable: true, identified: true, sourceClass: 'WandOfFireblast' });
	s['bag'].add({ id: 'stone', quantity: 5, identified: true, sourceClass: 'ThrowingKnife', missileSet: 3 });
	s['bag'].add({ id: 'stone', quantity: 1, identified: true, sourceClass: 'StoneOfBlast' });
	s['bag'].add({ id: 'potionHealing', quantity: 1, identified: true });
	s['blacksmithFavor'] = 5000;
	const favorBefore = s['blacksmithFavor'];
	const cost = s['blacksmithUpgradeCost']();

	s['openBlacksmithUpgrade']();
	await sleep(300);
	const offered = s['itemPickerEntries'].map((entry) => entry.id);
	const ringEntry = s['itemPickerEntries'].find((entry) => entry.id === ringId) ?? null;

	// buy the ring's upgrade through the picker's own callback
	if (ringEntry) s['itemPickerOnPick'](ringEntry);
	await sleep(300);
	const after = {
		ringLevel: s['bag'].find(ringId)?.level ?? null,
		favorSpent: favorBefore - s['blacksmithFavor'],
		cost,
		upgrades: s['blacksmithUpgrades'],
	};

	return { offered, ringEntry: ringEntry !== null, after };
});

console.log('probe results:', JSON.stringify(result, null, 1));
const { offered, ringEntry, after } = result;
const has = (id) => offered.includes(id);
const expect = [
	['a carried ring is offered by the real picker', has('ring_garnet')],
	['a carried wand is not - this port reads wand power from `weaponLevel`, so its own level is dead',
		has('wand') === false],
	['and neither is a carried missile stack, which has no per-stack level here',
		has('stone') === false],
	['nor a runestone (not upgradable at all) or a potion',
		has('potionHealing') === false],
	['the list is exactly the two equipped items plus that ring - nothing else slipped in',
		offered.length === 3],
	['buying the ring\'s upgrade moves its own level and the favor, and counts once',
		ringEntry === true && after.ringLevel === 1 && after.favorSpent === after.cost && after.upgrades === 1],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
console.log(`blacksmith upgrade livecheck: ${expect.length - failed}/${expect.length} assertions`);
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed || problems.length ? 1 : 0;
