// Throwaway (tools/scratch): the Blacksmith's harden service, live.
//
// `WndBlacksmith`'s harden button (`Blacksmith.Quest.hardens`, `500 + 1000*hardens` favor) sets
// `Weapon.enchantHardened`/`Armor.glyphHardened` on an identified, uncursed, upgradable item; from
// then on `upgrade()`'s affix-loss roll is replaced by a *hardening*-loss roll, so the enchantment
// is protected until the protection itself wears off (`level() >= 6 && Random.Float(10) <
// 2^(level-6)`). The check drives the real service window and then the real upgrade roll.
//
// Run after `npm run build`:  node tools/scratch/blacksmith-harden-livecheck.mjs
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

const shots = 'C:/Users/miche/dev/_browsercheck/mwgpd_shots_blacksmith';
fs.mkdirSync(shots, { recursive: true });

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=harden', { waitUntil: 'load', timeout: 120000 });
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

// ---- the service window, opened the way the Blacksmith interaction opens it
const opened = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	s['blacksmithFavor'] = 2000;
	s['blacksmithReforges'] = 0;
	s['blacksmithHardens'] = 0;
	s['openBlacksmithWindow']();
	const win = s['gameWindows'].children.filter((c) => c.content).at(-1);
	const buttons = [];
	const walk = (node) => {
		if (node.onClick) buttons.push(node);
		for (const child of node.children ?? []) walk(child);
	};
	walk(win.content);
	const labelOf = (b) => (b.children ?? []).map((c) => c.children ?? []).flat().find((c) => typeof c.text === 'string')?.text ?? '';
	return {
		windowCount: s['gameWindows'].children.filter((c) => c.content).length,
		buttonCount: buttons.length,
		disabled: buttons.map((b) => b.disabled),
		labels: buttons.map((b) => labelOf(b) || (b.children ?? []).find((c) => typeof c.text === 'string')?.text),
	};
});
await page.screenshot({ path: path.join(shots, 'services.png') });

// ---- clicking Harden (the second entry) opens the item picker, and picking the equipped weapon
// hardens it and charges the favor. The click goes through the real pointer path, as this
// project's livechecks always do, rather than by firing the handler.
const hardenTarget = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	const win = s['gameWindows'].children.filter((c) => c.content).at(-1);
	const buttons = [];
	const walk = (node) => {
		if (node.onClick) buttons.push(node);
		for (const child of node.children ?? []) walk(child);
	};
	walk(win.content);
	const bounds = buttons[1].getBounds();
	return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
});
await page.evaluate(([x, y]) => {
	const c = document.querySelector('canvas');
	const r = c.getBoundingClientRect();
	const opts = { bubbles: true, cancelable: true, composed: true, clientX: r.x + (x / 1024) * r.width, clientY: r.y + (y / 768) * r.height, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: 1 };
	c.dispatchEvent(new PointerEvent('pointermove', opts));
	c.dispatchEvent(new PointerEvent('pointerdown', opts));
	c.dispatchEvent(new PointerEvent('pointerup', { ...opts, buttons: 0 }));
	c.dispatchEvent(new MouseEvent('click', { ...opts, buttons: 0 }));
}, [hardenTarget.x, hardenTarget.y]);
await page.waitForTimeout(400);
const afterHarden = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	const pickerOpen = s['itemPickerOpen'];
	const entries = (s['itemPickerEntries'] ?? []).map((e) => e.id);
	s['chooseItemPicker'](0);
	return {
		pickerOpen,
		entries,
		weaponHardened: s['weaponHardened'],
		favor: s['blacksmithFavor'],
		hardens: s['blacksmithHardens'],
		name: s['itemDisplayName'](s['weaponId'], true, s['weaponInstanceId']),
		// the rate expectations below are Java's own: `upgrade()`'s hardened branch rolls
		// `Random.Float(10) < 2^(level-6)` - 10% at +6, 20% at +7, ... 100% at +10 - and the
		// ordinary affix roll is the same shape one step earlier, 10% at +4 up to 100% at +8.
	};
});

// ---- and the upgrade roll itself: hardened protects the enchant, and the protection wears off
// exactly where Java says it does
const rolls = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	s['weaponAffix'] = 'blazing';
	const sample = (level, hardened, trials) => {
		let affixLost = 0, hardeningLost = 0;
		for (let i = 0; i < trials; i++) {
			s['weaponAffix'] = 'blazing';
			s['weaponLevel'] = level;
			s['weaponHardened'] = hardened;
			s['rollUpgradeAffixLoss']('weapon');
			if (s['weaponAffix'] === null) affixLost++;
			if (hardened && !s['weaponHardened']) hardeningLost++;
		}
		return { affixLost, hardeningLost };
	};
	const result = {
		hardenedBelowThreshold: sample(5, true, 200),
		hardenedAtThreshold: sample(6, true, 200),
		unhardenedAtFour: sample(4, false, 200),
		unhardenedAtThree: sample(3, false, 200),
	};
	s['weaponHardened'] = false;
	s['weaponAffix'] = null;
	return result;
});

console.log('probe results:', JSON.stringify({
	opened, afterHarden: { ...afterHarden, name: afterHarden.name }, rolls,
}, null, 1));
const expect = [
	['the Blacksmith offers a service window with two entries', opened.windowCount === 1 && opened.buttonCount === 2],
	['both enabled at 2000 favor (Java `enable(favor >= cost)`)', opened.disabled.every((d) => d === false)],
	['choosing Harden opens the real item picker', afterHarden.pickerOpen === true && afterHarden.entries.length > 0],
	['picking the equipped weapon hardens it (`Weapon.enchantHardened`)', afterHarden.weaponHardened === true],
	['and charges Java\'s `500 + 1000 x hardens`', afterHarden.favor === 1500 && afterHarden.hardens === 1],
	['the hardened state shows in the item\'s own name', afterHarden.name.includes('hardened') || afterHarden.name.includes('durcie') || afterHarden.name.includes('verhärtet')],
	['a hardened item below +6 never loses the enchant or the hardening (`level() >= 6` gate)',
		rolls.hardenedBelowThreshold.affixLost === 0 && rolls.hardenedBelowThreshold.hardeningLost === 0],
	// Java's rates, not certainties: `Random.Float(10) < 2^(level-6)` is 10% at +6 (100% only at
	// +10), and the ordinary affix roll is the same shape one step earlier, 10% at +4
	['at +6 the hardening breaks at Java\'s 10%, with the enchant surviving every time',
		Math.abs(rolls.hardenedAtThreshold.hardeningLost - 20) < 12 && rolls.hardenedAtThreshold.affixLost === 0],
	['an unhardened item at +4 loses the enchant at Java\'s 10%',
		Math.abs(rolls.unhardenedAtFour.affixLost - 20) < 12],
	['and below +4 it keeps it', rolls.unhardenedAtThree.affixLost === 0],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
console.log(`blacksmith harden livecheck: ${expect.length - failed}/${expect.length} assertions`);
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed || problems.length ? 1 : 0;
