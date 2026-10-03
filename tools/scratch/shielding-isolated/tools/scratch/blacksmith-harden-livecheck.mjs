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

// ---- the real quest turn-in through interactWithBlacksmith() itself, not a direct
// openBlacksmithWindow() bypass: pickaxe out, then pickaxe+15 darkGold in, then a third talk
// should now find `status === 'complete'` and actually open the window - this is the exact path
// a fixed QuestLog off-by-one (advanceStage needed calling twice to reach 'complete', see the
// code comment at each of the three call sites) used to leave permanently unreachable.
const questFlow = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	s['quests']['stageIndex'].delete('blacksmith');
	for (const id of ['pickaxe', 'darkGold']) {
		const item = s['bag'].find(id);
		if (item) s['bag'].remove(id, item.quantity, item.instanceId);
	}
	s['blacksmithFavor'] = 0;
	s['blacksmithAlternative'] = false;
	const before = s['quests'].status('blacksmith');
	s['interactWithBlacksmith'](); // available -> active, grants the pickaxe
	const afterOffer = { status: s['quests'].status('blacksmith'), hasPickaxe: s['bag'].find('pickaxe') !== undefined };
	s['bag'].add({ id: 'darkGold', quantity: 15, identified: true });
	s['interactWithBlacksmith'](); // active, condition now met -> should reach 'complete'
	const afterTurnIn = { status: s['quests'].status('blacksmith'), favor: s['blacksmithFavor'] };
	const windowsBefore = s['gameWindows'].children.filter((c) => c.content).length;
	s['interactWithBlacksmith'](); // complete -> should now open the real service window
	const windowsAfter = s['gameWindows'].children.filter((c) => c.content).length;
	// close it - the probes below open their own window and assert it is the only one
	s['gameWindows'].children.filter((c) => c.content).at(-1)?.close();
	return { before, afterOffer, afterTurnIn, windowsBefore, windowsAfter };
});

// ---- the turn-in arithmetic itself (`Blacksmith.Quest.complete()`): the DarkGold half
// is capped at 2000 favor, and a beaten quest-branch boss adds 1000 on top of the cap
const turnInRules = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	const reset = () => {
		s['quests']['stageIndex'].delete('blacksmith');
		for (const id of ['pickaxe', 'darkGold']) {
			const item = s['bag'].find(id);
			if (item) s['bag'].remove(id, item.quantity, item.instanceId);
		}
		s['blacksmithFavor'] = 0;
		s['blacksmithAlternative'] = false;
		s['blacksmithBossBeaten'] = false;
		s['blacksmithPickaxeAvailable'] = false;
		s['blacksmithPickaxeFree'] = false;
	};
	reset();
	s['interactWithBlacksmith']();
	s['bag'].add({ id: 'darkGold', quantity: 50, identified: true });
	s['interactWithBlacksmith']();
	const capped = s['blacksmithFavor'];
	reset();
	s['interactWithBlacksmith']();
	s['bag'].add({ id: 'darkGold', quantity: 15, identified: true });
	s['blacksmithBossBeaten'] = true;
	s['interactWithBlacksmith']();
	const withBonus = s['blacksmithFavor'];
	s['blacksmithBossBeaten'] = false;
	return { capped, withBonus };
});

// ---- the legacy alternative (bat-blood) turn-in: no favor at all, but the buy-back is
// free - old Java scores a flat `questScores[2] = 3000`, clearing its own `score >= 2500`
// gate, and this port records that observable half directly on the free flag
const altPath = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	s['quests']['stageIndex'].delete('blacksmith');
	for (const id of ['pickaxe', 'darkGold']) {
		const item = s['bag'].find(id);
		if (item) s['bag'].remove(id, item.quantity, item.instanceId);
	}
	s['blacksmithFavor'] = 0;
	s['blacksmithAlternative'] = true;
	s['blacksmithPickaxeAvailable'] = false;
	s['blacksmithPickaxeFree'] = false;
	s['interactWithBlacksmith'](); // available -> active, grants the pickaxe
	const pick = s['bag'].find('pickaxe');
	if (pick) pick.affix = 'bloodStained'; // exactly what the Bat-kill branch does
	s['interactWithBlacksmith'](); // active, bloodied pickaxe -> complete
	const afterTurnIn = { status: s['quests'].status('blacksmith'), favor: s['blacksmithFavor'], free: s['blacksmithPickaxeFree'], available: s['blacksmithPickaxeAvailable'] };
	const windowsBefore = s['gameWindows'].children.filter((c) => c.content).length;
	s['interactWithBlacksmith'](); // complete with no favor but a free buy-back -> window opens
	const windowsAfter = s['gameWindows'].children.filter((c) => c.content).length;
	s['gameWindows'].children.filter((c) => c.content).at(-1)?.close();
	s['buyBlacksmithPickaxe']();
	const afterBuyback = { favor: s['blacksmithFavor'], available: s['blacksmithPickaxeAvailable'], hasPickaxe: s['bag'].find('pickaxe') !== undefined };
	s['blacksmithAlternative'] = false;
	return { afterTurnIn, windowsBefore, windowsAfter, afterBuyback };
});

// ---- the service window, opened the way this section's own probes drive the rest of the
// services below (a direct call, not through the interaction above, to isolate each probe)
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

// ---- clicking Harden (the third entry, after pickaxe and reforge) opens the item picker, and picking the equipped weapon
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
	const bounds = buttons[2].getBounds();
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

// ---- the paid upgrade: an item below +2 gains a level for `1000 + 1000*upgrades`
const afterUpgrade = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	s['blacksmithFavor'] = 5000;
	s['blacksmithUpgrades'] = 0;
	s['weaponLevel'] = 1;
	s['openBlacksmithUpgrade']();
	const entries = (s['itemPickerEntries'] ?? []).map((e) => e.id);
	s['chooseItemPicker'](0);
	return { entries, weaponLevel: s['weaponLevel'], favor: s['blacksmithFavor'], upgrades: s['blacksmithUpgrades'] };
});

// ---- cash out: the whole favor becomes gold, 1 for 1, after the confirm
const cashOut = await page.evaluate(async () => {
	const s = window.__MWG__.currentScene;
	s['blacksmithFavor'] = 750;
	const goldBefore = s['bag'].find('gold')?.quantity ?? 0;
	s['confirmBlacksmithCashOut']();
	await new Promise((r) => requestAnimationFrame(r));
	await new Promise((r) => requestAnimationFrame(r));
	const win = s['gameWindows'].children.filter((c) => c.content).at(-1);
	const buttons = [];
	const walk = (node) => {
		if (node.onClick) buttons.push(node);
		for (const child of node.children ?? []) walk(child);
	};
	walk(win.content);
	const bounds = buttons[0].getBounds();
	return { goldBefore, x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2, confirms: buttons.length };
});
await page.evaluate(([x, y]) => {
	const c = document.querySelector('canvas');
	const r = c.getBoundingClientRect();
	const opts = { bubbles: true, cancelable: true, composed: true, clientX: r.x + (x / 1024) * r.width, clientY: r.y + (y / 768) * r.height, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: 1 };
	c.dispatchEvent(new PointerEvent('pointermove', opts));
	c.dispatchEvent(new PointerEvent('pointerdown', opts));
	c.dispatchEvent(new PointerEvent('pointerup', { ...opts, buttons: 0 }));
	c.dispatchEvent(new MouseEvent('click', { ...opts, buttons: 0 }));
}, [cashOut.x, cashOut.y]);
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(shots, 'cashout.png') });
const afterCashOut = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	return { favor: s['blacksmithFavor'], gold: s['bag'].find('gold')?.quantity ?? 0 };
});

// ---- Java's `rewardsAvailable()`: cashed out to 0 with only a paid buy-back left, the
// window stays shut with the done line - the port used to open a useless menu here
const afterGateShut = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	const windowsBefore = s['gameWindows'].children.filter((c) => c.content).length;
	s['interactWithBlacksmith']();
	const windowsAfter = s['gameWindows'].children.filter((c) => c.content).length;
	return { windowsBefore, windowsAfter, favor: s['blacksmithFavor'] };
});

// ---- the smith: four pre-generated rewards, one of them taken for its flat price
const smith = await page.evaluate(async () => {
	const s = window.__MWG__.currentScene;
	s['blacksmithFavor'] = 3000;
	s['blacksmithSmiths'] = 0;
	s['openBlacksmithSmith']();
	await new Promise((r) => requestAnimationFrame(r));
	await new Promise((r) => requestAnimationFrame(r));
	const win = s['gameWindows'].children.filter((c) => c.content).at(-1);
	const buttons = [];
	const walk = (node) => {
		if (node.onClick) buttons.push(node);
		for (const child of node.children ?? []) walk(child);
	};
	walk(win.content);
	const labels = buttons.map((b) => {
		const label = (b.children ?? []).flatMap((c) => (c.children ?? []).concat(c)).find((c) => typeof c.text === 'string');
		return label?.text ?? '';
	});
	return {
		options: buttons.length,
		labels,
		bagBefore: s['bag'].items.length,
		x: buttons[0].getBounds().x + buttons[0].getBounds().width / 2,
		y: buttons[0].getBounds().y + buttons[0].getBounds().height / 2,
	};
});
await page.screenshot({ path: path.join(shots, 'smith.png') });
await page.evaluate(([x, y]) => {
	const c = document.querySelector('canvas');
	const r = c.getBoundingClientRect();
	const opts = { bubbles: true, cancelable: true, composed: true, clientX: r.x + (x / 1024) * r.width, clientY: r.y + (y / 768) * r.height, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: 1 };
	c.dispatchEvent(new PointerEvent('pointermove', opts));
	c.dispatchEvent(new PointerEvent('pointerdown', opts));
	c.dispatchEvent(new PointerEvent('pointerup', { ...opts, buttons: 0 }));
	c.dispatchEvent(new MouseEvent('click', { ...opts, buttons: 0 }));
}, [smith.x, smith.y]);
await page.waitForTimeout(400);
const afterSmith = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	return { favor: s['blacksmithFavor'], smiths: s['blacksmithSmiths'], bag: s['bag'].items.length, cleared: s['blacksmithSmithRewards'] === null };
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
	questFlow, turnInRules, altPath, opened, afterHarden: { ...afterHarden, name: afterHarden.name }, afterUpgrade, smith, afterSmith, cashOut, afterCashOut, afterGateShut, rolls,
}, null, 1));
const expect = [
	['the real quest turn-in reaches complete, not stuck one QuestLog stage short',
		questFlow.before === 'available' && questFlow.afterOffer.status === 'active' && questFlow.afterOffer.hasPickaxe
		&& questFlow.afterTurnIn.status === 'complete' && questFlow.afterTurnIn.favor === 750],
	['a third real talk (status now complete) opens the service window itself, not a reminder',
		questFlow.windowsAfter === questFlow.windowsBefore + 1],
	['the DarkGold half of favor is capped at 2000 (50 ore would be 2500)',
		turnInRules.capped === 2000],
	['a beaten quest-branch boss adds Java\'s 1000 on top of the cap math',
		turnInRules.withBonus === 1750],
	['the bat-blood alternative grants no favor but earns the free buy-back',
		altPath.afterTurnIn.status === 'complete' && altPath.afterTurnIn.favor === 0
		&& altPath.afterTurnIn.free === true && altPath.afterTurnIn.available === true],
	['and a favorless-but-free completion still opens the service window',
		altPath.windowsAfter === altPath.windowsBefore + 1],
	['whose free buy-back returns the pickaxe for 0 favor and consumes the flag',
		altPath.afterBuyback.favor === 0 && altPath.afterBuyback.available === false
		&& altPath.afterBuyback.hasPickaxe === true],
	['the Blacksmith offers a service window with his six ported services',
		opened.windowCount === 1 && opened.buttonCount === 6],
	['both enabled at 2000 favor (Java `enable(favor >= cost)`)', opened.disabled.every((d) => d === false)],
	['choosing Harden opens the real item picker', afterHarden.pickerOpen === true && afterHarden.entries.length > 0],
	['picking the equipped weapon hardens it (`Weapon.enchantHardened`)', afterHarden.weaponHardened === true],
	['and charges Java\'s `500 + 1000 x hardens`', afterHarden.favor === 1500 && afterHarden.hardens === 1],
	['the hardened state shows in the item\'s own name', afterHarden.name.includes('hardened') || afterHarden.name.includes('durcie') || afterHarden.name.includes('verhärtet')],
	['the paid upgrade takes an item below +2 up one level, for its own cost',
		afterUpgrade.entries.length > 0 && afterUpgrade.weaponLevel === 2 && afterUpgrade.favor === 4000 && afterUpgrade.upgrades === 1],
	['the smith offers Java\'s four tier-3 rewards to choose from',
		smith.options === 4 && smith.labels.every((label) => label.length > 0)],
	['taking one charges the flat 2000, hands it over, and clears the set',
		afterSmith.favor === 1000 && afterSmith.smiths === 1 && afterSmith.bag === smith.bagBefore + 1 && afterSmith.cleared === true],
	['cash out asks first, then trades the whole favor for gold 1 for 1',
		cashOut.confirms === 2 && afterCashOut.favor === 0 && afterCashOut.gold === cashOut.goldBefore + 750],
	['cashed out to 0 with only a paid buy-back left, the window stays shut',
		afterGateShut.windowsAfter === afterGateShut.windowsBefore && afterGateShut.favor === 0],
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
