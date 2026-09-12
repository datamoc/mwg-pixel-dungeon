// Throwaway (tools/scratch): the in-game menu (`WndGame`), opened by the back key.
//
// Java opens it from `GameScene.onBackPressed()`: `if (!cancel()) add(new WndGame())`. So one
// back keypress either closes whatever window is open or opens the menu - never both - and the
// port reproduces that by binding Escape to MWG's own `cancel` (Java's `SPDAction.BACK`) and
// opening the menu only where nothing consumed the action. This checks exactly that, plus what a
// window over the map owes the map: Java's `Window` blocker swallows keys and clicks outside its
// chrome, so the hero must not walk while it is up and clicking the map must close it.
//
// Two profiles are run, because `WndGame`'s exit entry is disabled while the intro is unfinished
// (`SPDSettings.intro()`, which `entranceRoomContext.guideIntroRead` stands in for here):
//   - a fresh profile: the exit entry is disabled and clicking it stays in the run;
//   - a profile whose intro is done: it saves the run and leaves for the title.
//
// Buttons are clicked through the real pointer path at their computed position, not by calling
// their handlers. Run after `npm run build`:  node tools/scratch/game-menu-livecheck.mjs
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
const problems = [];

/** The port's `guideProgress` slot, in MWG's `SaveSystem` shape (`core/Save.js`). */
const guideSeed = JSON.stringify({
	meta: { version: 1, savedAt: Date.now() },
	state: { introRead: true, searchingFound: true },
});

async function runFlow(introDone) {
	const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
	if (introDone) {
		await context.addInitScript((seed) => localStorage.setItem('mwg-save:spd-guide:guide', seed), guideSeed);
	}
	const page = await context.newPage();
	page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
	page.on('console', (m) => { if (m.type() === 'error') problems.push(`console.error: ${m.text()}`); });

	//a fixed seed, so the level and the camera - and with them the geometry this probe clicks - are
	//the same on every run (the port reads `?seed=` at startup; an unseeded run picks its own)
	await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=menu-livecheck', { waitUntil: 'load', timeout: 120000 });
	await page.waitForTimeout(6000);
	//class names are minified in the bundle, so "are we back on the title screen?" is asked by
	//comparing against the constructor name captured here, while the title is still up
	const titleScene = await page.evaluate(() => window.__MWG__.currentScene.constructor.name);

	/** every clickable `Button` in a scene, as stage-space centres, found by walking the graph
	 * (a `Button` is the thing carrying an `onClick` signal) - the title screen's own buttons are
	 * what proves `ui/portWindows.ts` still serves that scene, since they moved there this session */
	const clickables = () => page.evaluate(() => {
		const found = [];
		const walk = (node) => {
			if (node.onClick) {
				const bounds = node.getBounds();
				found.push({ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 });
			}
			for (const child of node.children ?? []) walk(child);
		};
		walk(window.__MWG__.currentScene['stage']);
		return found;
	});
	const clickStagePoint = async (point) => {
		await page.evaluate(([x, y]) => {
			const c = document.querySelector('canvas');
			const r = c.getBoundingClientRect();
			const opts = { bubbles: true, cancelable: true, composed: true, clientX: r.x + (x / 1024) * r.width, clientY: r.y + (y / 768) * r.height, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: 1 };
			c.dispatchEvent(new PointerEvent('pointermove', opts));
			c.dispatchEvent(new PointerEvent('pointerdown', opts));
			c.dispatchEvent(new PointerEvent('pointerup', { ...opts, buttons: 0 }));
			c.dispatchEvent(new MouseEvent('click', { ...opts, buttons: 0 }));
		}, [point.x, point.y]);
		await page.waitForTimeout(400);
	};
	// ---- the title screen's eight buttons and their windows, now that `portWindows.ts` owns them
	const titleButtons = await clickables();
	await clickStagePoint(titleButtons[1]); // Support -> the shared single-message window
	const titleInfo = await page.evaluate(() => ({ empty: window.__MWG__.currentScene['windows'].isEmpty, scene: window.__MWG__.currentScene.constructor.name }));
	await page.evaluate(() => {
		window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape', bubbles: true }));
		window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Escape', key: 'Escape', bubbles: true }));
	});
	await page.waitForTimeout(200);
	await clickStagePoint(titleButtons[4]); // Settings -> the shared settings window
	const titleSettings = await page.evaluate(() => {
		const s = window.__MWG__.currentScene;
		const win = s['windows'].children.filter((child) => child.content).at(-1);
		return { empty: s['windows'].isEmpty, scene: s.constructor.name, width: win?.content?.width ?? null };
	});
	await page.evaluate(() => {
		window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape', bubbles: true }));
		window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Escape', key: 'Escape', bubbles: true }));
	});
	await page.waitForTimeout(200);

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

	const key = async (code) => {
		await page.evaluate((c) => {
			window.dispatchEvent(new KeyboardEvent('keydown', { code: c, key: c, bubbles: true, cancelable: true }));
			window.dispatchEvent(new KeyboardEvent('keyup', { code: c, key: c, bubbles: true, cancelable: true }));
		}, code);
		await page.waitForTimeout(200);
	};

	/** reads the menu out of the scene: the buttons, where they are, and which are disabled */
	const readMenu = () => page.evaluate(() => {
		const s = window.__MWG__.currentScene;
		const stack = s['gameWindows'];
		//the stack's own first child is the full-screen dim backdrop, not a window - the windows
		//are the children carrying a `content` container
		const windows = stack.children.filter((child) => child.content);
		const win = windows[windows.length - 1];
		const content = win?.content;
		const buttons = (content?.children ?? []).filter((child) => typeof child?.width === 'number' && child.width > 100);
		const centreOf = (button) => ({
			x: win.x + content.x + button.x + button.width / 2,
			y: win.y + content.y + button.y + button.height / 2,
		});
		return {
			empty: stack.isEmpty,
			scene: s.constructor.name,
			windowCount: windows.length,
			backdrops: stack.children.length - windows.length,
			buttons: buttons.map((button) => ({
				text: button.children?.find((child) => typeof child.text === 'string')?.text ?? null,
				disabled: button.disabled === true,
				centre: centreOf(button),
				icons: (button.children ?? []).filter((child) => child.texture).length,
			})),
			contentSize: content ? { width: content.width, height: content.height } : null,
			windowRect: win ? { x: win.x, y: win.y, width: win.width, height: win.height } : null,
			hero: { x: s['hero'].x, y: s['hero'].y },
			mapBounds: (() => { const b = s['map']?.getBounds?.(); return b ? { x: b.x, y: b.y, width: b.width, height: b.height } : null; })(),
			saveKeys: Object.keys(localStorage).filter((k) => k.includes('spd-mwg')),
		};
	});

	/** clicks a point of the canvas, given in the scene's own (stage) coordinates */
	const clickStage = async (x, y) => {
		await page.evaluate(([sx, sy]) => {
			const s = window.__MWG__.currentScene;
			const c = document.querySelector('canvas');
			const r = c.getBoundingClientRect();
			const scale = (s['stage'].scale?.x) || 1;
			const opts = { bubbles: true, cancelable: true, composed: true, clientX: r.x + (sx / scale) * (r.width / 1024), clientY: r.y + (sy / scale) * (r.height / 768), pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: 1 };
			c.dispatchEvent(new PointerEvent('pointermove', opts));
			c.dispatchEvent(new PointerEvent('pointerdown', opts));
			c.dispatchEvent(new PointerEvent('pointerup', { ...opts, buttons: 0 }));
			c.dispatchEvent(new MouseEvent('click', { ...opts, buttons: 0 }));
		}, [x, y]);
		await page.waitForTimeout(400);
	};

	const result = { titleScene, gameScene: null };
	const phase = (name, value) => {
		console.log(`  [${introDone ? 'intro done' : 'fresh'}] ${name}: ${JSON.stringify({ empty: value.empty, windows: value.windowCount, buttons: value.buttons?.map((b) => b.text), scene: value.scene })}`);
		return value;
	};

	// ---- Escape opens the menu, and describes it: how many buttons, which are disabled, where
	await key('Escape');
	result.opened = phase('Escape', await readMenu());
	result.gameScene = result.opened.scene;

	// ---- the hero must not walk around under an open window (Java's `Window.onSignal`)
	await key('ArrowRight');
	await page.waitForTimeout(800);
	result.afterArrow = phase('ArrowRight', await readMenu());

	// ---- clicking the map outside the window closes it (Java's `Window` blocker)
	result.outsideClick = await page.evaluate(() => {
		const s = window.__MWG__.currentScene;
		const stack = s['gameWindows'];
		const win = stack.children.filter((c) => c.content).at(-1);
		//the map's bounds are read here, not earlier: they follow the camera, which the level-entry
		//transition and the hero's own moves shift
		const b = s['map'].getBounds();
		const centreY = win.y + win.height / 2;
		const windowRect = { x: win.x, y: win.y, w: win.width, h: win.height };
		const candidates = [
			{ x: win.x + win.width + 60, y: centreY },
			{ x: win.x - 60, y: centreY },
			{ x: win.x + win.width / 2, y: win.y + win.height + 60 },
		];
		const point = candidates.find((p) => p.x > b.x + 4 && p.x < b.x + b.width - 4 && p.y > b.y + 4 && p.y < b.y + b.height - 4);
		if (!point) return { point: null, windowRect, mapBounds: { x: b.x, y: b.y, w: b.width, h: b.height } };
		const c = document.querySelector('canvas');
		const r = c.getBoundingClientRect();
		const opts = { bubbles: true, cancelable: true, composed: true, clientX: r.x + (point.x / 1024) * r.width, clientY: r.y + (point.y / 768) * r.height, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: 1 };
		c.dispatchEvent(new PointerEvent('pointermove', opts));
		c.dispatchEvent(new PointerEvent('pointerdown', opts));
		c.dispatchEvent(new PointerEvent('pointerup', { ...opts, buttons: 0 }));
		c.dispatchEvent(new MouseEvent('click', { ...opts, buttons: 0 }));
		//the click closed the window, so nothing may be read off it after this point
		return { point, windowRect };
	});
	await page.waitForTimeout(300);
	result.afterOutsideClick = phase('outside click', await readMenu());

	// ---- Escape again reopens it, and a second Escape closes it through the window stack
	await key('Escape');
	result.reopened = phase('Escape again', await readMenu());
	await key('Escape');
	result.closed = phase('Escape closes', await readMenu());

	// ---- the toolbar's own entry (Java's `MenuPane` has one; a pointer-only player has no Escape)
	await page.evaluate(() => window.__MWG__.currentScene['onAction']('gameMenu'));
	await page.waitForTimeout(200);
	result.viaToolbar = phase('toolbar action', await readMenu());
	await key('Escape');

	// ---- Escape, then clicking Settings, opens the shared settings window in place of the menu
	await key('Escape');
	await clickStage(result.opened.buttons[0].centre.x, result.opened.buttons[0].centre.y);
	result.settings = await readMenu();

	// ---- and the exit entry: disabled until the intro is done, then saves and leaves for the title
	await key('Escape'); // close settings
	await key('Escape'); // reopen the menu
	result.exitEntry = (await readMenu()).buttons.at(-1);
	await clickStage(result.exitEntry.centre.x, result.exitEntry.centre.y);
	await page.waitForTimeout(1500);
	result.afterExit = await page.evaluate(() => ({
		scene: window.__MWG__.currentScene.constructor.name,
		saveKeys: Object.keys(localStorage).filter((k) => k.includes('spd-mwg')),
	}));

	await context.close();
	return { ...result, titleButtons, titleInfo, titleSettings };
}

const fresh = await runFlow(false);
const introDone = await runFlow(true);
console.log('title screen:', JSON.stringify({ buttons: fresh.titleButtons.length, info: fresh.titleInfo, settings: fresh.titleSettings }, null, 1));
console.log('fresh profile:', JSON.stringify({ opened: fresh.opened, closed: fresh.closed, exitEntry: fresh.exitEntry, afterExit: fresh.afterExit }, null, 1));
console.log('intro done  :', JSON.stringify({ exitEntry: introDone.exitEntry, afterExit: introDone.afterExit }, null, 1));

const expect = [
	// ---- the title screen still works now that `ui/portWindows.ts` owns its windows
	['the title screen still builds its eight buttons', fresh.titleButtons.length === 8],
	['its Support button opens the shared single-message window', fresh.titleInfo.empty === false],
	['and that window closes on the back key', fresh.titleSettings.scene === fresh.titleScene],
	['its Settings button opens the shared settings window, in the title scene', fresh.titleSettings.empty === false && fresh.titleSettings.scene === fresh.titleScene && fresh.titleSettings.width > 100],
	// ---- the menu itself
	['Escape opens the in-game menu', fresh.opened.empty === false && fresh.opened.windowCount === 1],
	['the menu draws Java\'s entries (Settings and save-and-exit, no challenges, hero alive)', fresh.opened.buttons.length === 2],
	['every entry is a labelled, iconed button', fresh.opened.buttons.every((b) => typeof b.text === 'string' && b.text.length > 1 && b.icons >= 1)],
	['its content is Java\'s 120 units wide, with stacked 20+2 button rows', fresh.opened.contentSize.width === 120 && fresh.opened.contentSize.height === 42],
	['Escape again reopens it after the outside click', fresh.reopened.empty === false && fresh.reopened.windowCount === 1],
	['a second Escape closes it through the window stack', fresh.closed.empty === true],
	['and the run is still the current scene (closing the menu does not leave the game)', fresh.closed.scene === fresh.gameScene],
	['opening it through the toolbar action works too (the pointer-only path)', fresh.viaToolbar.empty === false && fresh.viaToolbar.windowCount === 1],
	['clicking Settings replaces the menu with the shared settings window', fresh.settings.empty === false && fresh.settings.windowCount === 1],
	['and that window is the settings one, not the menu', fresh.settings.contentSize.height !== fresh.opened.contentSize.height],
	// ---- what a window over the map owes the map
	['an open window swallows movement keys', fresh.afterArrow.hero.x === fresh.opened.hero.x && fresh.afterArrow.hero.y === fresh.opened.hero.y],
	['and it is still open after them', fresh.afterArrow.empty === false],
	['the outside click landed on the map, clear of the window', fresh.outsideClick.point !== null],
	['clicking the map outside the window closes it', fresh.afterOutsideClick.empty === true],
	// ---- the intro gate on save-and-exit
	['with the intro unfinished, save-and-exit is disabled (Java\'s `SPDSettings.intro()`)', fresh.exitEntry.disabled === true],
	['and clicking it stays in the run', fresh.afterExit.scene === fresh.gameScene],
	['with the intro done, that entry is enabled', introDone.exitEntry.disabled === false],
	['and clicking it switches to the title screen', introDone.afterExit.scene === introDone.titleScene],
	['saving the run on the way out', introDone.afterExit.saveKeys.length > 0],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed ? 1 : 0;
