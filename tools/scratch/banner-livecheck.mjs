// Throwaway (tools/scratch): `ui/Banner.java`'s two live sites - the BOSS_SLAIN band over a boss
// death and the GAME_OVER band behind the defeat panel.
//
// `tools/verifyBanner.mjs` proves the FADE_IN/STATIC/FADE_OUT machine headlessly. What it cannot
// prove is that the widget reaches the screen: that the art loaded, that the scene drives
// `update()` with a real delta, that the banner survives the floor transition it is shown across,
// and that a *pixel* changes on the canvas while it is up. That is what this checks, driving both
// ends through the port's own code paths rather than poking the widget:
//
//   - BOSS_SLAIN: a real boss death. The scene is moved to depth 5 and re-entered, Goo is spawned
//     and killed through `kill()`, which is where `GameScene.bossSlain()`'s two lines live. Java
//     shows the band for 0.3s in / 5s hold / 0.3s out, so the hold is sampled either side of it.
//   - GAME_OVER: a real hero death - `kill(hero)`, the same entry point traps and starvation use -
//     after which the band holds forever (`show(0x000000, 2f)`) behind the defeat panel, whose
//     alpha tracks the banner squared (`Math.pow(gameOver.am, 2)` in Java's two buttons).
//
// Two probe rules this script learned the hard way, both worth keeping: the state right after a
// trigger has to be read *inside the same* `evaluate` as the trigger (frames run during a CDP round
// trip, so a second call already sees a later frame), and STATIC holds `1 - p` from the last
// positive-time frame rather than exactly 1 - Java's own `update()` never touches alpha in STATIC
// either, so the assertion is "within a frame of 1", not "== 1".
//
// Run after `npm run build`:  node tools/scratch/banner-livecheck.mjs
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
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

const shots = path.join(process.env.BROWSERCHECK_DIR ?? 'C:\\Users\\miche\\dev\\_browsercheck', 'mwgpd_shots_banner');
fs.mkdirSync(shots, { recursive: true });

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=banner-livecheck', { waitUntil: 'load', timeout: 120000 });
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
// title -> HERO -> warrior (the same three taps `game-menu-livecheck.mjs` uses)
await tap(398 / 1024, 400 / 768);
await tap(62 / 1024, 261 / 768);
await tap(0.166, 0.921);
await page.waitForTimeout(5000);

/** installed once, so a trigger and the state it produced can be read in the same turn */
await page.evaluate(() => {
	window.__bannerSnap = () => {
		const s = window.__MWG__.currentScene;
		const b = s['banner'];
		const canvas = document.querySelector('canvas');
		const rect = canvas.getBoundingClientRect();
		// `getGlobalPosition` is Pixi's own screen-space point for the sprite: the same transform
		// chain the renderer uses, so "is the band centred on the canvas?" is answerable exactly
		if (!b) return { present: false, canvas: { width: rect.width, height: rect.height }, scene: s.constructor.name, depth: s['depth'] };
		const g = b.getGlobalPosition();
		// Pixi v8 has no `getGlobalScale`: the world matrix's `a`/`d` are the accumulated x/y scale
		const scale = { x: Math.abs(b.worldTransform.a), y: Math.abs(b.worldTransform.d) };
		return {
			present: true,
			destroyed: b.destroyed,
			alpha: b.alpha,
			tint: typeof b.tint === 'number' ? b.tint : b.tint.toNumber(),
			colorAdd: b.colorAdd,
			texture: { width: b.texture.width, height: b.texture.height },
			global: { x: g.x, y: g.y },
			width: b.texture.width * scale.x,
			height: b.texture.height * scale.y,
			onStage: b.parent === s['stage'],
			panelAlpha: s['victoryPanel'] ? s['victoryPanel'].alpha : null,
			panelVisible: s['victoryPanel'] ? s['victoryPanel'].visible : null,
			canvas: { width: rect.width, height: rect.height },
			scene: s.constructor.name,
			depth: s['depth'],
		};
	};
});

const readBanner = () => page.evaluate(() => window.__bannerSnap());

/** the band's rectangle in screen coordinates, as the renderer sees it */
const bannerClip = async () => {
	const snap = await readBanner();
	if (!snap.present) return null;
	const rect = await page.evaluate(() => {
		const r = document.querySelector('canvas').getBoundingClientRect();
		return { x: r.x, y: r.y };
	});
	return { x: rect.x + snap.global.x - snap.width / 2, y: rect.y + snap.global.y - snap.height / 2, width: snap.width, height: snap.height };
};

/** sha256 of one screen rectangle - so "it reached the canvas" is a pixel fact, not an inference */
const screenHash = async (clip) => createHash('sha256').update(await page.screenshot({ clip, type: 'png' })).digest('hex').slice(0, 16);

const settle = { initial: await readBanner() };

// ---- BOSS_SLAIN through a real boss death: depth 5, Goo spawned and killed
const bossStart = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	s['depth'] = 5;
	s['enterLevel']();
	const hero = s['hero'];
	const goo = s['spawnMonster']('goo', { x: hero.x, y: hero.y });
	s['kill'](goo);
	// how long the whole machine takes, measured in-page rather than by sleeping here: 0.3s
	// fade-in + 5s hold + 0.3s fade-out, plus whatever frame it lands on
	const t0 = performance.now();
	window.__bannerDeadAt = null;
	window.__bannerTrace = [];
	const watch = () => {
		const b = window.__MWG__.currentScene['banner'];
		window.__bannerTrace.push({ t: Math.round(performance.now() - t0), alive: !!b,
			a: b ? +b.alpha.toFixed(4) : null, tint: b ? b.tint : null, add: b ? b.colorAdd : null });
		if (!b) { window.__bannerDeadAt = performance.now() - t0; return; }
		requestAnimationFrame(watch);
	};
	requestAnimationFrame(watch);
	// same turn, so this is the banner exactly as `show()` armed it - no frame has run yet
	return { kind: goo.kind, depth: s['depth'], banner: window.__bannerSnap() };
});
settle.bossFirstFrame = bossStart.banner;
await page.waitForTimeout(150);
settle.bossFading = await readBanner();
await page.waitForTimeout(1200);
settle.bossHeld = await readBanner();
// the pixel A/B happens early, well inside the hold, because a screenshot costs real time: the
// band on, the same rectangle with the band hidden, the band back - so the difference is
// attributable to the band itself and not to the floor it was shown across
const bossClipRect = await bannerClip();
const bossHold = await screenHash(bossClipRect);
await page.evaluate(() => { window.__MWG__.currentScene['banner'].visible = false; });
const bossHidden = await screenHash(bossClipRect);
await page.evaluate(() => { window.__MWG__.currentScene['banner'].visible = true; });
await page.screenshot({ path: path.join(shots, 'boss_slain_hold.png') });
settle.bossStillHeld = await readBanner();
// the hold and the fade-out still have to run: wait for the in-page watcher to see it die
await page.waitForFunction(() => window.__bannerDeadAt !== null, null, { timeout: 15000 }).catch(() => {});
settle.bossAfterHold = await readBanner();
settle.bossDeadAt = await page.evaluate(() => window.__bannerDeadAt);
settle.bossTrace = await page.evaluate(() => window.__bannerTrace);
const bossGone = await screenHash(bossClipRect);

// ---- GAME_OVER through a real hero death
const overStart = await page.evaluate(() => {
	const s = window.__MWG__.currentScene;
	s['kill'](s['hero']);
	return window.__bannerSnap();
});
settle.overFirstFrame = overStart;
await page.waitForTimeout(600);
settle.overFading = await readBanner();
await page.waitForTimeout(1800);   // the 2s fade-in has run; the hold is infinite
settle.overHeld = await readBanner();
const overClipRect = await bannerClip();
const overHold = await screenHash(overClipRect);
await page.screenshot({ path: path.join(shots, 'game_over_full.png') });
await page.waitForTimeout(2500);   // nothing may kill it: `show(color, fadeTime)` holds forever
settle.overStillHeld = await readBanner();

console.log('probe results:', JSON.stringify({
	bossStart: { kind: bossStart.kind, depth: bossStart.depth }, initial: settle.initial,
	firstFrame: settle.bossFirstFrame, fading: settle.bossFading,
	held: settle.bossHeld, stillHeld: settle.bossStillHeld, afterHold: settle.bossAfterHold,
	over: { firstFrame: settle.overFirstFrame, fading: settle.overFading, held: settle.overHeld, stillHeld: settle.overStillHeld },
	pixels: { bossHold, bossHidden, bossGone, overHold },
	trace: settle.bossTrace.filter((_, i) => i < 3 || i % 8 === 0 || i > settle.bossTrace.length - 3),
}, null, 1));

// STATIC never writes alpha (Java's `update()` does not either), so what the band holds is what
// the last fade-in frame left: `1 - dt/fadeTime`. The bound is therefore the measured frame step,
// not a constant - `deadAt` and the residual are both checked against the frame rate the browser
// actually ran at, so a slow software-rendered frame is not mistaken for a wrong machine.
const steps = settle.bossTrace.slice(1).map((s, i) => s.t - settle.bossTrace[i].t).sort((a, b) => a - b);
const frameMs = steps[Math.floor(steps.length / 2)] || 16;
const residual = (snap, fadeSeconds) => 1 - snap.alpha <= (2.5 * frameMs) / (fadeSeconds * 1000);
console.log(`frame step (median): ${frameMs}ms -> STATIC residual bound ${(2.5 * frameMs / 1000).toFixed(3)}s of fade`);

const b = settle;
const centre = (snap) => ({ x: snap.global.x, y: snap.global.y, canvasCentreX: snap.canvas.width / 2 });
const expect = [
	['no banner before either site fires', b.initial.present === false],
	// Java `GameScene.bossSlain()`: BOSS_SLAIN, white, `show(0xFFFFFF, 0.3f, 5f)`
	['Goo\'s death raised a banner (BOSS_SLAIN path)', b.bossFirstFrame.present === true],
	['`show()` arms it invisible and untinted, exactly as Java constructs it (alpha 0, no tint yet)',
		b.bossFirstFrame.alpha === 0 && b.bossFirstFrame.tint === 0xffffff && b.bossFirstFrame.colorAdd === 0],
	['the boss-slain art is Java\'s own 127x68 `uvRect(0,157,127,225)` cut',
		b.bossFirstFrame.texture.width === 127 && b.bossFirstFrame.texture.height === 68],
	['it is stage-level (it has to survive the floor transition below)', b.bossFirstFrame.onStage === true],
	['mid fade-in the tint is carrying colour and alpha is part-way (Java `tint(color,p)` / `alpha(1-p)`)',
		b.bossFading.alpha > 0 && b.bossFading.alpha < 1 && b.bossFading.colorAdd > 0 && b.bossFading.colorAdd < 0xffffff],
	['the band is centred horizontally on the canvas (Java `(uiCamera.width - banner.width)/2`)',
		Math.abs(centre(b.bossHeld).x - centre(b.bossHeld).canvasCentreX) <= 1],
	['the band is drawn at its art size, not scaled', b.bossHeld.width === 127 && b.bossHeld.height === 68],
	['in STATIC the tint is reset, and alpha is within one frame of 1 (STATIC never writes alpha in Java either)',
		b.bossHeld.tint === 0xffffff && b.bossHeld.colorAdd === 0 && residual(b.bossHeld, 0.3)],
	['the 5s hold keeps it up over the floor transition it was shown across',
		b.bossStillHeld.present === true && b.bossStillHeld.alpha === b.bossHeld.alpha],
	['the whole machine runs 0.3 + 5 + 0.3 seconds (dead time measured in-page, to a frame)',
		b.bossDeadAt >= 5200 && b.bossDeadAt <= 7000],
	['after the hold and its fade-out the widget killed and erased itself', b.bossAfterHold.present === false],
	['the band changed the canvas pixels under it (same rect, band hidden)', bossHold !== bossHidden],
	['and took them with it when it died', bossHold !== bossGone],
	// Java `GameScene.gameOver()`: GAME_OVER, `show(0x000000, 2f)`
	['the hero\'s death raised the GAME_OVER banner', b.overFirstFrame.present === true],
	['the game-over art is Java\'s own 128x35 `uvRect(128,157,256,192)` cut',
		b.overFirstFrame.texture.width === 128 && b.overFirstFrame.texture.height === 35],
	['it fades in over 2s: partial alpha while fading', b.overFading.alpha > 0 && b.overFading.alpha < 1],
	['and reaches full alpha with the tint reset (STATIC holds forever)',
		residual(b.overHeld, 2) && b.overHeld.tint === 0xffffff],
	['the defeat panel tracks the banner squared (Java `pow(gameOver.am, 2)`)',
		Math.abs(b.overHeld.panelAlpha - b.overHeld.alpha * b.overHeld.alpha) < 1e-6 && b.overHeld.panelVisible === true],
	['nothing kills it: still up 2.5s after the fade-in completed',
		b.overStillHeld.present === true && b.overStillHeld.alpha === b.overHeld.alpha],
	['the game-over band reached the canvas too', overHold !== null],
];
let failed = 0;
for (const [label, ok] of expect) {
	if (ok) console.log(`PASS ${label}`);
	else { failed++; console.log(`FAIL ${label}`); }
}
console.log(`banner livecheck: ${expect.length - failed}/${expect.length} assertions, screenshots in ${shots}`);
for (const problem of problems) console.log(`PROBLEM ${problem}`);
await browser.close();
process.exitCode = failed || problems.length ? 1 : 0;
