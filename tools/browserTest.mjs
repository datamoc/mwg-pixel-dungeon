#!/usr/bin/env node
/**
 * Dependency-free browser test harness for the built game (`dist/`), for humans and agents.
 *
 * Drives a real headless Chrome (Chrome DevTools Protocol) or Firefox (WebDriver BiDi) using only
 * Node built-ins (`http`, `WebSocket`, `child_process`) - no Playwright/Puppeteer install needed.
 * Serves `dist/` from an OS-chosen free port itself, so the Windows excluded-port-range pitfall
 * in CLAUDE.md ("Browser verification workflow") cannot bite.
 *
 * CLI (run `npm run build` first, or pass --build):
 *   node tools/browserTest.mjs                       smoke test in Chrome: boot, start a Warrior, screenshot
 *   node tools/browserTest.mjs --browser firefox     same in Firefox
 *   node tools/browserTest.mjs --browser both        both, one after the other
 *   node tools/browserTest.mjs --eval "scene.hero.hp"        evaluate in the running game and print JSON
 *   node tools/browserTest.mjs --script my-check.mjs         run `export default async (game) => {...}`
 *   options: --dist <dir> --hero <0-5> --width 1568 --height 779 --out <dir> --headed --build
 *            --no-start (stop at the title screen)  --keep (leave browsers running: never; for debugging use --headed)
 *
 * Library:
 *   import { openGame } from './browserTest.mjs';
 *   const game = await openGame({ browser: 'chrome' });   // or 'firefox'
 *   await game.startGame();                                // title -> class select -> Warrior -> level ready
 *   await game.eval('scene.hero.hp');                      // expression, or a body with `return`; `scene` is
 *                                                          // window.__MWG__.currentScene, `mwg` is window.__MWG__
 *   await game.tap(0.44, 0.52);                            // full pointer sequence at a canvas fraction
 *   await game.screenshot('out/a.png');
 *   game.consoleErrors();                                  // page errors / console.error since load
 *   await game.close();
 *
 * A `game.eval` result must be JSON-serialisable. Exit code is non-zero when the smoke test fails.
 */
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const MIME = {
	'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
	'.svg': 'image/svg+xml', '.wasm': 'application/wasm', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg',
	'.wav': 'audio/wav', '.ttf': 'font/ttf', '.woff': 'font/woff', '.woff2': 'font/woff2', '.map': 'application/json',
};

/** Static file server for `dir` on a free port. Returns `{ url, close }`. */
export async function serveDir(dir) {
	const base = resolve(dir);
	if (!existsSync(join(base, 'index.html'))) throw new Error(`no index.html in ${base} - run "npm run build" first (or pass --build)`);
	const server = createServer((req, res) => {
		const path = normalize(decodeURIComponent((req.url ?? '/').split('?')[0]));
		let file = join(base, path.endsWith('/') || path === '\\' ? join(path, 'index.html') : path);
		if (!file.startsWith(base) || !existsSync(file) || statSync(file).isDirectory()) {
			res.writeHead(404); res.end('not found'); return;
		}
		res.writeHead(200, { 'content-type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream', 'cache-control': 'no-store' });
		res.end(readFileSync(file));
	});
	await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
	return { url: `http://127.0.0.1:${server.address().port}/`, close: () => new Promise((ok) => server.close(ok)) };
}

/** First existing path among the usual install locations, or an executable on PATH. */
function findBrowser(kind) {
	const env = kind === 'chrome' ? process.env.CHROME_PATH : process.env.FIREFOX_PATH;
	if (env && existsSync(env)) return env;
	const pf = [process.env['ProgramFiles'], process.env['ProgramFiles(x86)'], process.env.LOCALAPPDATA].filter(Boolean);
	const candidates = kind === 'chrome'
		? [...pf.map((p) => join(p, 'Google/Chrome/Application/chrome.exe')), ...pf.map((p) => join(p, 'Chromium/Application/chrome.exe')),
			...pf.map((p) => join(p, 'Microsoft/Edge/Application/msedge.exe')),
			'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser']
		: [...pf.map((p) => join(p, 'Mozilla Firefox/firefox.exe')), '/Applications/Firefox.app/Contents/MacOS/firefox', '/usr/bin/firefox'];
	for (const c of candidates) if (existsSync(c)) return c;
	const which = spawnSync(process.platform === 'win32' ? 'where' : 'which', [kind === 'chrome' ? 'chrome' : 'firefox'], { encoding: 'utf8' });
	const hit = which.status === 0 ? which.stdout.split(/\r?\n/)[0]?.trim() : '';
	if (hit && existsSync(hit)) return hit;
	throw new Error(`${kind} not found - set ${kind === 'chrome' ? 'CHROME_PATH' : 'FIREFOX_PATH'}`);
}

/* Security note: evaluating caller-supplied code inside the page under test is this tool's whole purpose
 * (like DevTools' console). The page is our own build served from 127.0.0.1 in a throwaway browser profile;
 * nothing here evaluates untrusted remote input, and the `--eval`/`--script` code comes from the invoking user. */
/** Wraps user code so it evaluates as an expression, or - failing to parse as one - as an async body. */
function wrapEval(code) {
	return `(async () => {
		const mwg = window.__MWG__, scene = mwg && mwg.currentScene;
		const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
		const src = ${JSON.stringify(code)};
		let fn;
		try { fn = new AsyncFunction('mwg', 'scene', 'return (' + src + '\\n);'); } catch (e) { fn = new AsyncFunction('mwg', 'scene', src); }
		const v = await fn(mwg, scene);
		return JSON.stringify(v === undefined ? null : v);
	})()`;
}

/** Full pointer sequence Pixi's event system needs (a bare `click` is not enough - see CLAUDE.md). */
const TAP_SOURCE = (fx, fy) => `(() => {
	const c = document.querySelector('canvas'); if (!c) throw new Error('no canvas');
	const r = c.getBoundingClientRect();
	const o = { clientX: r.left + ${fx} * r.width, clientY: r.top + ${fy} * r.height, bubbles: true, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: 1 };
	for (const t of ['pointermove', 'pointerdown', 'pointerup', 'click']) c.dispatchEvent(new PointerEvent(t, o));
	return true;
})()`;

// ---------------------------------------------------------------- Chrome (CDP)

async function connectWs(url) {
	const ws = new WebSocket(url);
	await new Promise((ok, bad) => { ws.onopen = ok; ws.onerror = () => bad(new Error(`websocket failed: ${url}`)); });
	return ws;
}

class Rpc {
	constructor(ws) {
		this.ws = ws; this.id = 0; this.pending = new Map(); this.handlers = [];
		ws.onmessage = (ev) => {
			const msg = JSON.parse(ev.data);
			if (msg.id !== undefined && this.pending.has(msg.id)) {
				const { ok, bad } = this.pending.get(msg.id); this.pending.delete(msg.id);
				if (msg.error) bad(new Error(`${msg.error.message ?? msg.error.error ?? 'rpc error'}${msg.error.data ? ` (${msg.error.data})` : ''}${msg.message ? `: ${msg.message}` : ''}`)); else ok(msg.result);
			} else for (const h of this.handlers) h(msg);
		};
	}
	send(method, params = {}, extra = {}) {
		const id = ++this.id;
		this.ws.send(JSON.stringify({ id, method, params, ...extra }));
		return new Promise((ok, bad) => this.pending.set(id, { ok, bad }));
	}
	on(h) { this.handlers.push(h); }
}

/** Kills the browser process tree and removes its throwaway profile (best effort: Windows may keep locks). */
async function stopBrowser(child, profile) {
	if (child.exitCode === null) {
		if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' }); else child.kill('SIGKILL');
		await Promise.race([new Promise((ok) => child.once('exit', ok)), sleep(3000)]);
	}
	for (let i = 0; i < 10; i++) {
		try { rmSync(profile, { recursive: true, force: true }); return; } catch { await sleep(300); }
	}
}

async function launchChrome({ headed, width, height, url }) {
	const profile = mkdtempSync(join(tmpdir(), 'mwg-chrome-'));
	const args = [`--user-data-dir=${profile}`, '--remote-debugging-port=0', '--no-first-run', '--no-default-browser-check',
		'--disable-extensions', '--disable-background-networking', `--window-size=${width},${height}`,
		'--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', ...(headed ? [] : ['--headless=new']),
		...(process.env.MWG_BROWSER_ARGS ? process.env.MWG_BROWSER_ARGS.split(' ') : []), 'about:blank'];
	const child = spawn(findBrowser('chrome'), args, { stdio: 'ignore' });
	const portFile = join(profile, 'DevToolsActivePort');
	for (let i = 0; i < 100 && !existsSync(portFile); i++) await sleep(100);
	if (!existsSync(portFile)) { child.kill(); throw new Error('Chrome did not open a debugging port'); }
	const port = readFileSync(portFile, 'utf8').split('\n')[0].trim();
	const created = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' }).then((r) => r.json());
	const rpc = new Rpc(await connectWs(created.webSocketDebuggerUrl));
	const errors = [], logs = [];
	rpc.on((m) => {
		if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
		if (m.method === 'Runtime.consoleAPICalled') {
			const text = m.params.args.map((a) => a.value ?? a.description ?? '').join(' ');
			logs.push({ type: m.params.type, text });
			if (m.params.type === 'error') errors.push(text);
		}
		if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errors.push(`${m.params.entry.text} ${m.params.entry.url ?? ''}`.trim());
	});
	await rpc.send('Runtime.enable'); await rpc.send('Page.enable'); await rpc.send('Log.enable');
	await rpc.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
	await rpc.send('Page.navigate', { url });
	return {
		errors, logs,
		async evaluate(expression) {
			const r = await rpc.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
			if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
			return r.result.value;
		},
		async screenshot() { return Buffer.from((await rpc.send('Page.captureScreenshot', { format: 'png' })).data, 'base64'); },
		async close() { try { await rpc.send('Browser.close'); } catch { /* already gone */ } await stopBrowser(child, profile); },
	};
}

// ---------------------------------------------------------------- Firefox (WebDriver BiDi)

async function launchFirefox({ headed, width, height, url }) {
	const profile = mkdtempSync(join(tmpdir(), 'mwg-firefox-'));
	writeFileSync(join(profile, 'user.js'), [
		'user_pref("remote.active-protocols", 3);', 'user_pref("browser.shell.checkDefaultBrowser", false);',
		'user_pref("browser.startup.homepage_override.mstone", "ignore");', 'user_pref("datareporting.policy.dataSubmissionEnabled", false);',
		'user_pref("app.update.enabled", false);', 'user_pref("webgl.force-enabled", true);', 'user_pref("layers.acceleration.disabled", true);',
	].join('\n'));
	const port = 9222 + Math.floor(Math.random() * 3000);
	const args = ['--remote-debugging-port', String(port), '--profile', profile, '--no-remote', `--width=${width}`, `--height=${height}`,
		...(headed ? [] : ['--headless']), ...(process.env.MWG_BROWSER_ARGS ? process.env.MWG_BROWSER_ARGS.split(' ') : []), 'about:blank'];
	const child = spawn(findBrowser('firefox'), args, { stdio: 'ignore' });
	let ws;
	for (let i = 0; i < 150 && !ws; i++) {
		try { ws = await connectWs(`ws://127.0.0.1:${port}/session`); } catch { await sleep(200); }
	}
	if (!ws) { child.kill(); throw new Error('Firefox did not open a BiDi port'); }
	const rpc = new Rpc(ws);
	const errors = [], logs = [];
	rpc.on((m) => {
		if (m.type === 'event' && m.method === 'log.entryAdded') {
			const e = m.params; logs.push({ type: e.level, text: e.text });
			if (e.level === 'error') errors.push(e.text);
		}
	});
	await rpc.send('session.new', { capabilities: {} });
	await rpc.send('session.subscribe', { events: ['log.entryAdded'] });
	const tree = await rpc.send('browsingContext.getTree', {});
	const context = tree.contexts[0].context;
	try { await rpc.send('browsingContext.setViewport', { context, viewport: { width, height } }); } catch { /* headed windows size themselves */ }
	await rpc.send('browsingContext.navigate', { context, url, wait: 'complete' });
	return {
		errors, logs,
		async evaluate(expression) {
			const r = await rpc.send('script.evaluate', { expression, target: { context }, awaitPromise: true, resultOwnership: 'none' });
			if (r.type === 'exception') throw new Error(r.exceptionDetails?.text ?? 'script exception');
			return r.result.value;
		},
		async screenshot() { return Buffer.from((await rpc.send('browsingContext.captureScreenshot', { context })).data, 'base64'); },
		async close() { try { await rpc.send('browser.close'); } catch { /* already gone */ } await stopBrowser(child, profile); },
	};
}

// ---------------------------------------------------------------- game session

async function pollText(game, pattern, timeout) {
	const end = Date.now() + timeout;
	while (Date.now() < end) {
		const hit = await game.findText(pattern).catch(() => null);
		if (hit) return hit;
		await sleep(300);
	}
	throw new Error(`no visible text matching /${pattern}/ within ${timeout}ms`);
}

/**
 * Opens the built game in a real browser. `dist` defaults to `<repo>/dist`; pass `url` to test an
 * already-running server instead. Returns the session described at the top of this file.
 */
export async function openGame({ browser = 'chrome', dist = join(ROOT, 'dist'), url, headed = false, width = 1568, height = 779 } = {}) {
	const server = url ? null : await serveDir(dist);
	const target = url ?? server.url;
	const b = await (browser === 'firefox' ? launchFirefox : launchChrome)({ headed, width, height, url: target });
	const game = {
		browser, url: target, width, height,
		async eval(code) { const raw = await b.evaluate(wrapEval(code)); return raw === undefined || raw === null ? null : JSON.parse(raw); },
		/** Full pointer sequence at a fraction (0-1) of the canvas. */
		async tap(fx, fy) { return b.evaluate(TAP_SOURCE(fx, fy)); },
		async screenshot(path) {
			const png = await b.screenshot();
			if (path) { mkdirSync(dirname(resolve(path)), { recursive: true }); writeFileSync(path, png); }
			return png;
		},
		async waitFor(code, { timeout = 30000, interval = 250 } = {}) {
			const end = Date.now() + timeout; let last;
			while (Date.now() < end) {
				try { last = await game.eval(code); if (last) return last; } catch { /* page still booting */ }
				await sleep(interval);
			}
			throw new Error(`waitFor timed out after ${timeout}ms: ${code}`);
		},
		consoleErrors: () => [...b.errors],
		consoleLogs: () => [...b.logs],
		/** Centre of the first visible Pixi Text whose string matches `pattern` (RegExp source), as canvas fractions. */
		findText(pattern, flags = 'i') {
			return game.eval(`(() => {
				const re = new RegExp(${JSON.stringify(pattern)}, ${JSON.stringify(flags)}), stage = mwg.app.stage, screen = mwg.app.renderer.screen;
				let hit = null;
				const walk = (n) => {
					if (hit) return;
					if (n.text !== undefined && n.visible !== false && re.test(String(n.text))) { const b = n.getBounds(); if (b.width > 0) hit = { text: String(n.text), fx: (b.x + b.width / 2) / screen.width, fy: (b.y + b.height / 2) / screen.height }; }
					for (const c of (n.children || [])) walk(c);
				};
				walk(stage); return hit;
			})()`);
		},
		/** Waits for a visible Text matching `pattern`, then taps its centre. */
		async tapText(pattern, { timeout = 30000 } = {}) {
			const hit = await pollText(game, pattern, timeout);
			await game.tap(hit.fx, hit.fy);
			return hit;
		},
		/** Title -> class select -> hero slot -> Start, then waits until a level scene with a hero exists.
		 * Button labels are found in the Pixi display tree (French or English), so layout changes do not matter;
		 * the six hero slots have no text and use fixed fractions of the default 1568x779 viewport. */
		async startGame({ hero = 0, timeout = 90000 } = {}) {
			await game.waitFor('!!window.__MWG__ && !!window.__MWG__.app', { timeout });
			await game.tapText('entrer dans le donjon|enter the dungeon|enter dungeon', { timeout });
			await pollText(game, 'choisissez votre h|choose your hero', timeout);
			await sleep(800);
			const slots = [[0.098, 0.344], [0.169, 0.344], [0.236, 0.344], [0.098, 0.475], [0.169, 0.475], [0.236, 0.475]];
			await game.tap(...slots[hero % 6]);
			await sleep(800);
			await game.tapText('^commencer$|^start$', { timeout });
			return game.waitFor('!!(window.__MWG__.currentScene && window.__MWG__.currentScene["hero"] && window.__MWG__.currentScene["creatures"])', { timeout });
		},
		async close() { await b.close(); if (server) await server.close(); },
	};
	return game;
}

// ---------------------------------------------------------------- smoke test + CLI

/** Boot, start a game, check the scene is alive, no console errors, non-blank pixels. */
export async function smoke(game, out) {
	const checks = [];
	const check = (name, ok, detail = '') => { checks.push({ name, ok: !!ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'} [${game.browser}] ${name}${detail ? ` - ${detail}` : ''}`); };
	await game.startGame().catch((e) => check('game starts (title -> level)', false, e.message));
	const state = await game.eval('({ hero: scene && scene.hero ? [scene.hero.x, scene.hero.y, scene.hero.hp] : null, creatures: scene && scene.creatures ? scene.creatures.length : null })').catch(() => null);
	check('a level scene with a hero is running', state?.hero, state ? JSON.stringify(state) : 'no state');
	await sleep(1500);
	const png = await game.screenshot(join(out, `${game.browser}.png`));
	check('screenshot captured', png.length > 5000, `${png.length} bytes -> ${join(out, `${game.browser}.png`)}`);
	const errors = game.consoleErrors();
	check('no console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
	return checks.every((c) => c.ok);
}

function parseArgs(argv) {
	const a = { browser: 'chrome', dist: join(ROOT, 'dist'), out: join(ROOT, 'tools', 'scratch', 'browser-test'), hero: 0, width: 1568, height: 779 };
	for (let i = 0; i < argv.length; i++) {
		const k = argv[i];
		if (k === '--browser') a.browser = argv[++i]; else if (k === '--dist') a.dist = resolve(argv[++i]); else if (k === '--out') a.out = resolve(argv[++i]);
		else if (k === '--hero') a.hero = Number(argv[++i]); else if (k === '--width') a.width = Number(argv[++i]); else if (k === '--height') a.height = Number(argv[++i]);
		else if (k === '--eval') a.eval = argv[++i]; else if (k === '--script') a.script = resolve(argv[++i]); else if (k === '--url') a.url = argv[++i];
		else if (k === '--screenshot') a.screenshot = resolve(argv[++i]);
		else if (k === '--headed') a.headed = true; else if (k === '--build') a.build = true; else if (k === '--no-start') a.noStart = true;
		else if (k === '--help' || k === '-h') a.help = true; else throw new Error(`unknown option ${k}`);
	}
	return a;
}

async function main() {
	const a = parseArgs(process.argv.slice(2));
	if (a.help) { console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0].replace(/^#!.*\n/, '').replace(/^\/\*\*|^ \* ?/gm, '')); return 0; }
	if (a.build) {
		const r = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' });
		if (r.status !== 0) return 1;
	}
	const kinds = a.browser === 'both' ? ['chrome', 'firefox'] : [a.browser];
	let failed = false;
	for (const browser of kinds) {
		let game;
		try {
			game = await openGame({ browser, dist: a.dist, url: a.url, headed: a.headed, width: a.width, height: a.height });
			if (a.script) {
				const mod = await import(pathToFileURL(a.script).href);
				await mod.default(game);
			} else if (a.eval !== undefined) {
				if (!a.noStart) await game.startGame({ hero: a.hero });
				console.log(JSON.stringify(await game.eval(a.eval), null, 2));
			} else if (a.screenshot) {
				if (!a.noStart) await game.startGame({ hero: a.hero });
				await game.screenshot(a.screenshot); console.log(`saved ${a.screenshot}`);
			} else if (!(await smoke(game, a.out))) failed = true;
		} catch (e) {
			console.error(`FAIL [${browser}] ${e.stack ?? e}`); failed = true;
		} finally {
			await game?.close();
		}
	}
	return failed ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	main().then((code) => process.exit(code), (e) => { console.error(e); process.exit(1); });
}
