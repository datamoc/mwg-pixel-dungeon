// Throwaway (tools/scratch): P14's wall-decoration particle migration, live.
//
// `wallDecorations.ts`'s Sink/Torch/Smoke spots were rewritten onto MWG 0.8.1's pooled
// `ParticleEmitter` (per-particle tint ranges, ParticleCurve scale/alpha, flicker) this session.
// ROADMAP.md/PORT_COVERAGE.md already mark the migration itself done, but both explicitly say
// "browser verification is required before this item is finally closed" - this is that check.
// It teleports to a Sewers floor (sink) and a Prison floor (torch), puts the hero next to a real
// WALL_DECO spot so it enters FOV, lets a few emitter cycles run, and screenshots a tight crop
// around the spot so the actual pixels (per-particle colour variety, motion) are visible.
//
// Run after `npm run build`:  node tools/scratch/wall-decorations-livecheck.mjs
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

const shots = 'C:/Users/miche/dev/_browsercheck/mwgpd_shots_walldeco';
fs.mkdirSync(shots, { recursive: true });

await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=walldeco', { waitUntil: 'load', timeout: 120000 });
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

const findSpot = async (depth) => {
	return page.evaluate(async (depth) => {
		const s = window.__MWG__.currentScene;
		const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
		s['depth'] = depth;
		s['enterLevel']();
		await sleep(3000);
		const layer = s['wallDecorations'];
		const spots = layer ? layer['spots'] : [];
		if (!spots || spots.length === 0) return { found: false, kind: layer ? layer['kind'] : null, count: 0 };
		const spot = spots[0];
		// stand right next to it (never on a wall cell) so it enters FOV without needing pathing
		const nx = spot.x, ny = spot.y + 1;
		s['hero'].x = nx; s['hero'].y = ny;
		s['refresh']();
		await sleep(1500);
		const pos = spot.emitter.getGlobalPosition();
		return { found: true, kind: layer['kind'], count: spots.length, x: pos.x, y: pos.y };
	}, depth);
};

const shoot = async (name, cx, cy) => {
	const box = await page.evaluate(() => {
		const c = document.querySelector('canvas');
		const r = c.getBoundingClientRect();
		return { left: r.left, top: r.top, sx: r.width / 1024, sy: r.height / 768 };
	});
	const size = 220;
	await page.screenshot({
		path: path.join(shots, name),
		clip: {
			x: Math.max(0, box.left + cx * box.sx - size / 2),
			y: Math.max(0, box.top + cy * box.sy - size / 2),
			width: size,
			height: size,
		},
	});
};

// ---- Sewers: Sink (per-particle random blue-green tint)
let sink = null;
for (const depth of [1, 2, 3, 4, 5]) {
	sink = await findSpot(depth);
	if (sink.found) { await shoot('sink.png', sink.x, sink.y); break; }
}

// ---- Prison: Torch (two-phase fade + flicker, plus the halo) - sparks are transient, so grab
// three frames a beat apart rather than trusting one still to catch one mid-flight
let torch = null;
for (const depth of [8, 9, 7, 10, 6]) {
	torch = await findSpot(depth);
	if (torch.found) {
		await shoot('torch-1.png', torch.x, torch.y);
		await page.waitForTimeout(400);
		await shoot('torch-2.png', torch.x, torch.y);
		await page.waitForTimeout(400);
		await shoot('torch-3.png', torch.x, torch.y);
		break;
	}
}

console.log('wall decoration spots found:', JSON.stringify({ sink, torch }, null, 1));
if (problems.length > 0) console.log('PROBLEMS:', problems);
console.log(sink?.found && torch?.found ? 'PASS both spots found and screenshotted' : 'INCONCLUSIVE - see above, may need different seed/depth');

await browser.close();
