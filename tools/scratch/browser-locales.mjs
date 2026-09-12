// Throwaway (tools/scratch): drive the built game in a real Chromium, one locale per run, and
// answer the two questions a type-check cannot: does the locale actually reach the screen, and
// do the shipped fonts have glyphs for the text it draws (ROADMAP section 10's "tofu" check).
//
// Needs the globally installed playwright and a built dist/. Reads locale-probe.json for the
// game's own font stack and each locale's codepoints. Screenshots land in the shots directory for
// a human to look at; the pass/fail signal is programmatic.
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const globalRoot = process.env.GLOBAL_NODE_MODULES ?? 'C:\\Users\\miche\\AppData\\Roaming\\npm\\node_modules';
const { chromium } = require(path.join(globalRoot, 'playwright'));

const probe = JSON.parse(readFileSync(new URL('./locale-probe.json', import.meta.url), 'utf8'));
const shots = process.argv[2] ?? 'C:/Users/miche/dev/_browsercheck/mwgpd_shots_2026-09-12-locales';
const locales = process.argv.slice(3);
if (locales.length === 0) {
	console.error('usage: node tools/scratch/browser-locales.mjs <shotsDir> <locale> [locale ...]');
	process.exit(2);
}
mkdirSync(shots, { recursive: true });

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

let failures = 0;
const fail = (message) => {
	failures++;
	console.log(`FAIL  ${message}`);
};

const titleShots = new Map();
const ingameShots = new Map();

for (const locale of locales) {
	const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
	await context.addInitScript((code) => window.localStorage.setItem('spd-on-mwg.language', code), locale);
	const page = await context.newPage();
	const problems = [];
	page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
	page.on('console', (m) => {
		if (m.type() === 'error') problems.push(`console.error: ${m.text()}`);
	});

	await page.goto(pathToFileURL(path.resolve('dist/index.html')).href, { waitUntil: 'load', timeout: 120000 });
	await page.waitForTimeout(6000);

	const stored = await page.evaluate(() => window.localStorage.getItem('spd-on-mwg.language'));
	if (stored !== locale) fail(`${locale}: localStorage did not stick (${stored})`);

	// Glyph coverage: render every codepoint the locale can draw and compare its pixels with a
	// codepoint no font has. Identical pixels mean the same .notdef box - i.e. tofu.
	const coverage = await page.evaluate(([font, chars]) => {
		const size = 40;
		const canvas = document.createElement('canvas');
		canvas.width = size;
		canvas.height = size;
		const ctx = canvas.getContext('2d');
		ctx.font = `28px ${font.join(', ')}`;
		ctx.textBaseline = 'top';
		ctx.fillStyle = '#fff';

		const draw = (text) => {
			ctx.clearRect(0, 0, size, size);
			ctx.fillText(text, 2, 4);
			return Array.from(ctx.getImageData(0, 0, size, size).data);
		};
		const sentinelA = draw('\u{10FFFF}');
		const sentinelB = draw('\uE0FF');
		const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

		const tofu = [];
		const blank = [];
		for (const ch of chars) {
			// Never judge a character that is invisible by classification: a space, a zero-width
			// space, a BOM, a bidi mark. SPD's own Portuguese table contains a U+200B inside
			// `scenes.gamescene.blacksmith_quest_window`, so without this the probe reports a
			// missing glyph for a character that is not supposed to draw anything.
			if (/[\s\p{Cf}\p{Zl}\p{Zp}]/u.test(ch)) continue;
			const pixels = draw(ch);
			if (pixels.every((v) => v === 0)) {
				// Chromium with no glyph for a codepoint draws nothing here rather than a hollow
				// box, so "no ink at all" is the tofu signal in this environment
				blank.push(ch);
				continue;
			}
			if (same(pixels, sentinelA) && same(pixels, sentinelB)) tofu.push(ch);
		}
		return {
			count: chars.length,
			tofu,
			blank,
			sentinelAgrees: same(sentinelA, sentinelB),
			sentinelBlank: sentinelA.every((v) => v === 0),
		};
	}, [probe.font, probe.chars[locale] ?? []]);

	if (!coverage.sentinelAgrees) fail(`${locale}: the two no-glyph sentinels render differently; probe unreliable`);
	if (coverage.tofu.length) fail(`${locale}: ${coverage.tofu.length} codepoint(s) render as tofu: ${coverage.tofu.slice(0, 20).join(' ')}`);
	if (coverage.blank.length) fail(`${locale}: ${coverage.blank.length} non-space codepoint(s) draw no glyph: ${coverage.blank.slice(0, 20).join(' ')}`);

	const title = path.join(shots, `${locale}-01-title.png`);
	await page.screenshot({ path: title });
	titleShots.set(locale, readFileSync(title));

	// Drive into the game with real pointer events: the welcome log line is a port string that
	// also interpolates SPD names, so it exercises both catalogues at once.
	const tap = async (fx, fy) => {
		await page.evaluate(
			([x, y]) => {
				const c = document.querySelector('canvas');
				const r = c.getBoundingClientRect();
				const px = r.x + r.width * x;
				const py = r.y + r.height * y;
				const opts = { bubbles: true, cancelable: true, composed: true, clientX: px, clientY: py, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: 1 };
				c.dispatchEvent(new PointerEvent('pointermove', opts));
				c.dispatchEvent(new PointerEvent('pointerdown', opts));
				c.dispatchEvent(new PointerEvent('pointerup', { ...opts, buttons: 0 }));
				c.dispatchEvent(new MouseEvent('click', { ...opts, buttons: 0 }));
			},
			[fx, fy]
		);
		await page.waitForTimeout(1200);
	};
	await tap(398 / 1024, 400 / 768);
	await tap(62 / 1024, 261 / 768);
	await tap(0.166, 0.921);
	await page.waitForTimeout(5000);
	const ingame = path.join(shots, `${locale}-02-ingame.png`);
	await page.screenshot({ path: ingame });
	ingameShots.set(locale, readFileSync(ingame));

	const state = await page.evaluate(() => {
		const scene = window.__MWG__?.currentScene;
		return { scene: scene?.constructor?.name ?? null, depth: scene?.['depth'] ?? null, hasHero: !!scene?.hero };
	});
	// the class name is minified in the built bundle, so assert on state, not on a name
	if (!state.hasHero || state.depth !== 1) fail(`${locale}: never reached a playable depth-1 floor (scene=${state.scene} depth=${state.depth})`);
	console.log(
		`${locale}: ${coverage.count} codepoints probed, ${coverage.blank.length} without a glyph, ${coverage.tofu.length} tofu, ` +
			`depth=${state.depth}, sentinel draws nothing=${coverage.sentinelBlank}${problems.length ? ` PROBLEMS: ${problems.join(' | ')}` : ''}`
	);
	for (const problem of problems) fail(`${locale}: ${problem}`);

	await context.close();
}

// A locale that renders identically to English did not reach the screen at all. Checked on both
// screens: the title buttons and the in-game HUD/log are translated text.
const englishTitle = titleShots.get('en');
const englishIngame = ingameShots.get('en');
if (englishTitle) {
	for (const [locale, bytes] of titleShots) {
		if (locale === 'en') continue;
		if (bytes.equals(englishTitle)) fail(`${locale}: title screen is pixel-identical to English`);
	}
}
if (englishIngame) {
	for (const [locale, bytes] of ingameShots) {
		if (locale === 'en') continue;
		if (bytes.equals(englishIngame)) fail(`${locale}: in-game screen is pixel-identical to English`);
	}
}

console.log(failures === 0 ? `LOCALES OK - ${locales.length} locale(s) verified live` : `LOCALES FAILED - ${failures} problem(s)`);
await browser.close();
process.exitCode = failures === 0 ? 0 : 1;
