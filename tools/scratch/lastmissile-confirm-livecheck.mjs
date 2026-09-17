// Throwaway (tools/scratch): `MissileWeapon.doThrow()`'s pre-throw warning.
//
// Java asks before throwing the last missile of a stack that is about to break and is worth
// warning about ("known and upgraded, or with a good enchant, or a mastery potion bonus, or
// hardened" - see `MissileWeapon.java` 234-250). This port had no modal UI at all, so it threw
// silently. The check drives the real `special` action and looks at the window stack:
//
//   - the last missile of an upgraded, about-to-break stack raises a window instead of throwing;
//   - nothing about the world moves while it is up (the window blocker holds it);
//   - its "Yes" really throws - through the real pointer path, not by calling the handler;
//   - and none of the three neighbours (a stack of several, an unupgraded stack, a durable one)
//     raises a window at all.
//
// Run after `npm run build`:  node tools/scratch/lastmissile-confirm-livecheck.mjs
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

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=lastmissile', { waitUntil: 'load', timeout: 120000 });
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
// HERO -> warrior: the warrior throws darts, so `special` is a throw
await tap(398 / 1024, 400 / 768);
await tap(62 / 1024, 261 / 768);
await tap(0.166, 0.921);
await page.waitForTimeout(5000);

/** the window stack's own view: how many windows, and each one's button labels */
const readWindows = () => page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	const stack = s['gameWindows'];
	const windows = stack.children.filter((child) => child.content);
	return {
		count: windows.length,
		labels: windows.flatMap((win) => (win.content?.children ?? [])
			.flatMap((child) => (child.children ?? []).filter((c) => typeof c.text === 'string').map((c) => c.text))),
		ammo: s['ammo'],
		missileLevel: s['missileLevel'],
		confirmed: s['missileThrowConfirmed'],
	};
});

/** sets the throw up: one upgraded, nearly-broken missile and a visible target */
const prepare = async ({ ammo, missileLevel, durability }) => page.evaluate(({ ammo, missileLevel, durability }) => {
	const s = window.__MWG__.currentScene;
	const hero = s['hero'];
	s['ammo'] = ammo;
	s['missileLevel'] = missileLevel;
	// `null` is Java's "one throw from breaking": `durabilityLeft() <= durabilityPerUse()`
	s['ammoDurability'] = durability === null ? s['missileDurabilityCost']() : durability;
	// a target in sight, far enough that the throw is a ranged attack
	for (const creature of s['creatures']) if (!creature.isHero && !creature.isNPC) { creature.hp = 0; }
	const target = s['spawnMonster']('rat', { x: hero.x + 2, y: hero.y });
	target.hp = target.maxHp = 500;
	// `MissileWeapon.doThrow()`'s own cell picker resolves the target *before* the pre-throw warning
	// runs (the port latches it in `specialTarget` and re-enters `useSpecial`), so a bare
	// `useSpecial()` opens the targeting cursor and never reaches the warning. This livecheck used to
	// rely on the old auto-nearest-enemy targeting and went stale when the cursor landed.
	s['specialTarget'] = target;
	s['fov'].update(hero.x, hero.y, 8);
	s['refresh']();
	return { ammo: s['ammo'], durability: s['ammoDurability'], cost: s['missileDurabilityCost'](), target: target.id };
}, { ammo, missileLevel, durability });

fs.mkdirSync(path.join(process.env.BROWSERCHECK_DIR ?? 'C:/Users/miche/dev/_browsercheck', 'mwgpd_shots_lastmissile'), { recursive: true });
const result = {};
// ---- the case Java warns about: last missile, upgraded, one throw from breaking
result.aboutToBreak = await prepare({ ammo: 1, missileLevel: 3, durability: null });
await page.evaluate(() => window.__MWG__.currentScene['useSpecial']());
await page.waitForTimeout(300);
result.raised = await readWindows();
await page.screenshot({ path: path.join(process.env.BROWSERCHECK_DIR ?? 'C:/Users/miche/dev/_browsercheck', 'mwgpd_shots_lastmissile', 'confirm.png') }).catch(() => {});
// and the world is untouched while the window is up
await page.evaluate(() => window.__MWG__.currentScene['onAction']('wait'));
await page.waitForTimeout(600);
result.afterWait = await readWindows();
// ---- its "Yes" throws, clicked through the real pointer path
result.yesButton = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	const win = s['gameWindows'].children.filter((c) => c.content).at(-1);
	if (!win) return { x: -1, y: -1, labels: [], missing: true };
	// a button is the thing carrying an `onClick` signal - the same walk `game-menu-livecheck`
	// uses, since the buttons sit inside a container rather than directly in `content`
	const found = [];
	const walk = (node) => {
		if (node.onClick) found.push(node);
		for (const child of node.children ?? []) walk(child);
	};
	walk(win.content);
	const label = (node) => (/^[A-Za-zÀ-ɏ]+$/.test(node.text ?? '') ? node.text : node.children?.find((c) => typeof c.text === 'string')?.text);
	return {
		x: found[0] ? found[0].getBounds().x + found[0].getBounds().width / 2 : -1,
		y: found[0] ? found[0].getBounds().y + found[0].getBounds().height / 2 : -1,
		labels: found.map(label),
	};
});
await page.evaluate(([x, y]) => {
	const c = document.querySelector('canvas');
	const r = c.getBoundingClientRect();
	const opts = { bubbles: true, cancelable: true, composed: true, clientX: r.x + (x / 1024) * r.width, clientY: r.y + (y / 768) * r.height, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: 1 };
	c.dispatchEvent(new PointerEvent('pointermove', opts));
	c.dispatchEvent(new PointerEvent('pointerdown', opts));
	c.dispatchEvent(new PointerEvent('pointerup', { ...opts, buttons: 0 }));
	c.dispatchEvent(new MouseEvent('click', { ...opts, buttons: 0 }));
}, [result.yesButton.x, result.yesButton.y]);
await page.waitForTimeout(800);
result.afterYes = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	const rat = s['creatures'].find((c) => c.kind === 'rat');
	return { windows: s['gameWindows'].children.filter((c) => c.content).length, ammo: s['ammo'], ratHp: rat ? rat.hp : null, maxHp: rat ? rat.maxHp : null };
});
// ---- the neighbours Java does not warn about
for (const [name, setup] of Object.entries({
	severalLeft: { ammo: 3, missileLevel: 3, durability: null },
	notUpgraded: { ammo: 1, missileLevel: 0, durability: null },
	durableStack: { ammo: 1, missileLevel: 3, durability: null },
})) {
	await page.evaluate(() => {
		const s = window.__MWG__.currentScene;
		for (const win of s['gameWindows'].children.filter((c) => c.content)) win.close();
	});
	await page.evaluate(({ setup }) => {
		const s = window.__MWG__.currentScene;
		s['ammo'] = setup.ammo;
		s['missileLevel'] = setup.missileLevel;
		// `prepare` sets a durable stack by passing a cost above one use; do the same here
		s['ammoDurability'] = setup.durableStack ? s['missileDurabilityCost']() + 50 : s['missileDurabilityCost']();
	}, { setup: { ...setup, durableStack: name === 'durableStack' ? true : undefined } });
	if (name === 'durableStack') {
		await page.evaluate(() => { const s = window.__MWG__.currentScene; s['ammoDurability'] = s['missileDurabilityCost']() + 50; });
	}
	await page.evaluate(() => window.__MWG__.currentScene['useSpecial']());
	await page.waitForTimeout(400);
	result[name] = await readWindows();
	await page.evaluate(() => {
		const s = window.__MWG__.currentScene;
		for (const win of s['gameWindows'].children.filter((c) => c.content)) win.close();
		s['missileThrowConfirmed'] = false;
	});
}

console.log('probe results:', JSON.stringify(result, null, 1));
console.log(`confirm labels: ${JSON.stringify(result.yesButton.labels)}`);
const expect = [
	['the last upgraded, about-to-break missile raises the warning', result.raised.count === 1],
	// the wording comes from the active locale (this probe runs in the port's own default,
	// French, where SPD's own strings are "Oui"/"Non"), so what is asserted is the shape: two
	// labelled options, the first of which is the affirmative one the click below targets
	['with a real yes/no pair', result.yesButton.labels.length === 2
		&& result.yesButton.labels.every((label) => typeof label === 'string' && label.length > 0)],
	['and nothing it asks about can proceed while it is up (the window blocker holds the world)',
		result.afterWait.ammo === 1 && result.afterWait.count === 1],
	['clicking "Yes" really throws: the missile is spent and the target is hit',
		result.afterYes.windows === 0 && result.afterYes.ammo === 0 && result.afterYes.ratHp < result.afterYes.maxHp],
	['a stack with several left is not warned about', result.severalLeft.count === 0],
	['an unupgraded last missile is not warned about', result.notUpgraded.count === 0],
	['a durable last missile is not warned about', result.durableStack.count === 0],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
console.log(`last-missile confirm livecheck: ${expect.length - failed}/${expect.length} assertions`);
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed || problems.length ? 1 : 0;
