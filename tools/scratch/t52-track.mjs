// T52 tracking probe: dump Pixi EventSystem tracking state before/after jam.
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const globalRoot = process.env.GLOBAL_NODE_MODULES ?? 'C:\\Users\\miche\\AppData\\Roaming\\npm\\node_modules';
const { chromium } = require(path.join(globalRoot, 'playwright'));
const executablePath = path.join(
  process.env.LOCALAPPDATA ?? 'C:\\Users\\miche\\AppData\\Local',
  'ms-playwright', 'chromium-1193', 'chrome-win', 'chrome.exe');
const browser = await chromium.launch({
  executablePath,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newContext({ viewport: { width: 1024, height: 768 } }).then((c) => c.newPage());
const tapFrac = async (fx, fy, waitMs = 1000) => {
  await page.evaluate(([x, y]) => {
    const c = document.querySelector('canvas');
    const r = c.getBoundingClientRect();
    const move = { bubbles: true, cancelable: true, composed: true, clientX: r.x + r.width * x, clientY: r.y + r.height * y, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: 0 };
    c.dispatchEvent(new PointerEvent('pointermove', move));
    const down = { ...move, buttons: 1 };
    c.dispatchEvent(new PointerEvent('pointerdown', down));
    c.dispatchEvent(new PointerEvent('pointerup', { ...down, buttons: 0 }));
    c.dispatchEvent(new MouseEvent('click', { ...down, buttons: 0 }));
  }, [fx, fy]);
  await page.waitForTimeout(waitMs);
};
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=t52-track', { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(6000);
await tapFrac(398 / 1024, 400 / 768, 3000);
await tapFrac(62 / 1024, 261 / 768, 1500);
await tapFrac(0.166, 0.921, 6000);
const out = await page.evaluate(async () => {
  const s = window.__MWG__.currentScene;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const app = window.__MWG__.app;
  const ev = app?.renderer?.events ?? app?.stage?.eventSystem ?? null;
  const evKeys = ev ? Object.keys(ev) : null;
  const tracking = () => {
    if (!ev) return null;
    const t = ev.trackingData ?? ev.tracking ?? null;
    if (!t) return 'no-tracking-field';
    try {
      if (t instanceof Map) return [...t.entries()].map(([k, v]) => [k, Object.keys(v ?? {})]);
      if (typeof t === 'object') return Object.entries(t).map(([k, v]) => [k, v instanceof Set ? [...v].map((x) => x?.constructor?.name) : Object.keys(v ?? {})]);
    } catch (e) { return `err ${String(e).slice(0, 60)}`; }
    return typeof t;
  };
  const seq = [{ tag: 'boot', tracking: tracking(), evKeys }];
  for (let i = 0; i < 5; i++) {
    let cell = null;
    for (const [ox, oy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
      const c = { x: s.hero.x + ox, y: s.hero.y + oy };
      if (!s.level.inside(c.x, c.y)) continue;
      try { if (s.pathfinder.find({ x: s.hero.x, y: s.hero.y }, c, {})) { cell = c; break; } } catch { }
    }
    const g = s.map.toGlobal({ x: cell.x * 16 + 8, y: cell.y * 16 + 8 });
    const c = document.querySelector('canvas');
    c.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: g.x, clientY: g.y, pointerId: 1, pointerType: 'mouse', button: 0, buttons: 0 }));
    c.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: g.x, clientY: g.y, pointerId: 1, pointerType: 'mouse', button: 0, buttons: 1 }));
    c.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: g.x, clientY: g.y, pointerId: 1, pointerType: 'mouse', button: 0, buttons: 0 }));
    await sleep(800);
    seq.push({ tag: `tap${i}`, hero: [s.hero.x, s.hero.y], tracking: tracking() });
  }
  return { seq };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
