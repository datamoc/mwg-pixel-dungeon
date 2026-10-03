#!/usr/bin/env node
/**
 * BACKLOG B4 (coord T58): deterministic screenshot baseline for visual parity.
 *
 * Captures a fixed-viewport, fixed-seed run of the built game (`dist/`) into
 * `tools/parity/screenshots/`: title, class select, and the sewers-1 spawn.
 * The `?seed=` query makes generation deterministic (dungeonScene reads it at
 * run setup), so two captures of the same seed differ only in wall-clock
 * animation phase - `compareScreenshots.mjs` diffs with a threshold for that.
 *
 * Run `npm run build` first (or pass --build):
 *   node tools/captureVisualBaseline.mjs --out tools/parity/screenshots --seed 12345
 *   node tools/captureVisualBaseline.mjs --browser firefox --seed 12345
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openGame, serveDir } from './browserTest.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function args(argv) {
	const a = { browser: 'chrome', out: join(ROOT, 'tools', 'parity', 'screenshots'), seed: '12345', hero: 0, width: 1568, height: 779, build: false };
	for (let i = 0; i < argv.length; i++) {
		const k = argv[i];
		if (k === '--browser') a.browser = argv[++i];
		else if (k === '--out') a.out = resolve(argv[++i]);
		else if (k === '--seed') a.seed = argv[++i];
		else if (k === '--hero') a.hero = Number(argv[++i]);
		else if (k === '--width') a.width = Number(argv[++i]);
		else if (k === '--height') a.height = Number(argv[++i]);
		else if (k === '--build') a.build = true;
	}
	return a;
}

const a = args(process.argv.slice(2));
if (a.build) {
	const { spawnSync } = await import('node:child_process');
	const r = spawnSync('npm', ['run', 'build'], { cwd: ROOT, stdio: 'inherit', shell: true });
	if (r.status !== 0) process.exit(r.status ?? 1);
}
mkdirSync(a.out, { recursive: true });
const step = (label) => console.log(`step: ${label}`);
const server = await serveDir(join(ROOT, 'dist'));
const game = await openGame({ browser: a.browser, url: `${server.url}?seed=${encodeURIComponent(a.seed)}`, width: a.width, height: a.height });
// Close the browser first (its keep-alive connections would otherwise hold
// the static server's close() open), and never wait forever for either.
async function shutdown() {
	try { await Promise.race([game.close(), sleep(15000)]); }
	catch (error) { console.error(`browser close: ${error.message}`); }
	await Promise.race([server.close(), sleep(5000)]);
}
try {
	step('boot');
	await game.waitFor('!!window.__MWG__ && !!window.__MWG__.app', { timeout: 60000 });
	await sleep(1500);
	await game.screenshot(join(a.out, '01-title.png'));
	step('title captured, entering class select');
	await game.tapText('entrer dans le donjon|enter the dungeon|enter dungeon', { timeout: 60000 });
	await sleep(1200);
	await game.screenshot(join(a.out, '02-select.png'));
	step('select captured, starting hero slot ' + a.hero);
	const slots = [[0.098, 0.344], [0.169, 0.344], [0.236, 0.344], [0.098, 0.475], [0.169, 0.475], [0.236, 0.475]];
	await game.tap(...slots[a.hero % 6]);
	await sleep(800);
	await game.tapText('^commencer$|^start$', { timeout: 60000 });
	await game.waitFor('!!(window.__MWG__.currentScene && window.__MWG__.currentScene["hero"] && window.__MWG__.currentScene["creatures"])', { timeout: 90000 });
	await sleep(2500);
	await game.screenshot(join(a.out, '03-spawn.png'));
	step('spawn captured');
	const state = await game.eval(`({
		seed: scene.runSeedLabel, depth: scene.depth,
		hero: scene.hero ? [scene.hero.x, scene.hero.y, scene.hero.hp] : null,
		creatures: scene.creatures ? scene.creatures.length : null,
	})`);
	writeFileSync(join(a.out, 'manifest.json'), JSON.stringify({
		seed: a.seed, hero: a.hero, width: a.width, height: a.height,
		browser: a.browser, capturedAt: new Date().toISOString(), state,
	}, null, 2) + '\n');
	const errors = game.consoleErrors();
	if (errors.length > 0) {
		console.error(`console errors:\n${errors.slice(0, 5).join('\n')}`);
		process.exitCode = 1;
	}
	console.log(`baseline captured to ${a.out} (seed ${a.seed}, ${a.browser})`);
	console.log(JSON.stringify(state));
} finally {
	await shutdown();
}
