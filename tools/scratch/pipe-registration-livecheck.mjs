// Throwaway (tools/scratch): are the three hand-registered Pixi render pipes in `main.ts`'s
// `new Game({ extensions: [...] })` actually needed?
//
// mwg's own contract says no: `two-d/Game.d.ts` documents `extensions` as the escape hatch for
// extensions *the game* defines, and states that `TintedSprite` "registers its own
// colour-transform pipe automatically, at module scope, the moment a game imports it; a game never
// has to pass anything here for that". mwg whitelists `dist/two-d/render/TintedSprite.js` in its
// `sideEffects` field to keep that self-registration through bundling, and pixi.js marks its own
// `sprite-tiling`/`sprite-nine-slice` init modules the same way.
//
// This probe settles it empirically against the *built* bundle: it writes variants of `dist/game.js`
// (generated output, never edited in place - the variants live in `dist/audit/`) with the
// registration array emptied of one, two or all three entries, loads each from `file://`, and reads
// the live renderer's pipe registry (`window.__MWG__.app.renderer.renderPipes`, the only authority
// on what actually got registered) after clicking through the title into a dungeon floor.
//
// Run after `npm run build`:  node tools/scratch/pipe-registration-livecheck.mjs
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

const bundlePath = path.resolve('dist/game.js');
const htmlPath = path.resolve('dist/index.html');
const bundle = fs.readFileSync(bundlePath, 'utf8');
const html = fs.readFileSync(htmlPath, 'utf8');

// the minified call site is `new J({canvas:...,background:0,extensions:[...]})` inside `main()`.
// Its *contents* are found structurally rather than by a fixed minified spelling, because a source
// edit changes Rollup's identifier numbering and a hard-coded shape silently stops matching.
const anchor = bundle.indexOf('extensions:[');
if (anchor === -1) throw new Error('`extensions:[...]` not found in dist/game.js - rebuild first');
let end = -1;
for (let i = anchor + 'extensions:['.length, depth = 0; i < bundle.length; i++) {
	const ch = bundle[i];
	if (ch === '(' || ch === '[') depth++;
	else if (ch === ')' || ch === ']') {
		if (ch === ']' && depth === 0) { end = i; break; }
		depth--;
	}
}
if (end === -1) throw new Error('unterminated `extensions:[...]` array in dist/game.js');
const REGISTRATIONS = bundle.slice(anchor, end + 1);
const elements = (() => {
	const inner = REGISTRATIONS.slice('extensions:['.length, -1);
	const parts = [];
	let depth = 0, current = '';
	for (const ch of inner) {
		if (ch === '(' || ch === '[') depth++;
		else if (ch === ')' || ch === ']') depth--;
		if (ch === ',' && depth === 0) { parts.push(current); current = ''; continue; }
		current += ch;
	}
	if (current.trim()) parts.push(current);
	return parts.map((p) => p.trim());
})();
if (elements.length !== 3) {
	throw new Error(`expected the three registrations in the shipped bundle, found ${elements.length}: ${JSON.stringify(elements)}`);
}
console.log(`shipped registrations found: ${elements.map((e) => e.slice(0, 40)).join(' | ')}`);

const variants = [
	['all three registrations (shipped)', REGISTRATIONS],
	['none at all', 'extensions:[]'],
	['colour transform only', `extensions:[${elements[0]}]`],
	['the two Pixi built-ins only', `extensions:[${elements.slice(1).join(',')}]`],
];

const auditDir = path.resolve('dist/audit');
fs.rmSync(auditDir, { recursive: true, force: true });
fs.mkdirSync(auditDir, { recursive: true });
fs.writeFileSync(path.join(auditDir, 'index.html'), html);

const browser = await chromium.launch({
	executablePath,
	args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

let failed = 0;
for (const [label, replacement] of variants) {
	const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
	const problems = [];
	page.on('pageerror', (e) => problems.push(`pageerror: ${String(e.message).slice(0, 160)}`));
	page.on('console', (m) => { if (m.type() === 'error') problems.push(`console.error: ${m.text().slice(0, 160)}`); });
	fs.writeFileSync(path.join(auditDir, 'game.js'), bundle.replace(REGISTRATIONS, replacement));

	await page.goto(pathToFileURL(path.join(auditDir, 'index.html')).href, { waitUntil: 'load', timeout: 120000 });
	await page.waitForTimeout(6000);
	const tap = async (fx, fy) => {
		await page.evaluate(([x, y]) => {
			const c = document.querySelector('canvas');
			if (!c) return;
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

	const seen = await page.evaluate(() => {
		const mwgGlobal = window.__MWG__ ?? {};
		const scene = mwgGlobal.currentScene ?? null;
		return {
			pipes: Object.keys(mwgGlobal.app?.renderer?.renderPipes ?? {}),
			depth: scene?.['depth'] ?? null,
			creatures: Array.isArray(scene?.['creatures']) ? scene['creatures'].length : null,
		};
	});
	await page.close();

	const has = (id) => seen.pipes.includes(id);
	const reached = typeof seen.depth === 'number' && (seen.creatures ?? 0) > 0;
	console.log(`\n=== ${label} ===`);
	console.log(`  renderer pipes: ${seen.pipes.join(', ') || '(none)'}`);
	console.log(`  in game: depth=${seen.depth} creatures=${seen.creatures}`);
	const ok = reached && has('mwg-tinted-sprite') && has('tilingSprite') && has('nineSliceSprite') && problems.length === 0;
	if (!ok) failed++;
	console.log(`  ${ok ? 'PASS' : 'FAIL'} - reached a floor with all three pipes registered${problems.length ? `, ${problems.length} page problem(s)` : ''}`);
	for (const problem of problems) console.log(`  PROBLEM ${problem}`);
}

fs.rmSync(auditDir, { recursive: true, force: true });
await browser.close();

console.log(failed === 0
	? '\nPASS every variant reached a floor with mwg-tinted-sprite + tilingSprite + nineSliceSprite registered: the three manual registrations are redundant against this mwg/pixi pair.'
	: `\nFAIL ${failed} variant(s) broke without the manual registrations, so they are load-bearing - keep them.`);
process.exitCode = failed ? 1 : 0;
