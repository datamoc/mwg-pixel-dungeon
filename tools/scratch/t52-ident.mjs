// T52 identity probe: is the map object replaced after hero steps?
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
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=t52-ident', { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(6000);
await tapFrac(398 / 1024, 400 / 768, 3000);
await tapFrac(62 / 1024, 261 / 768, 1500);
await tapFrac(0.166, 0.921, 6000);
const out = await page.evaluate(async () => {
  const s = window.__MWG__.currentScene;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const map0 = s.map;
  map0.__mark = 'orig';
  const counts = () => {
    let n = 0;
    try { n = s.map._events?.pointerdown?.length ?? s.map.listenerCount?.('pointerdown') ?? -1; } catch { n = -2; }
    return n;
  };
  const seq = [{ mapSame: s.map === map0, mark: s.map.__mark ?? null, listeners: counts(), awaiting: s.awaitingInput, hero: [s.hero.x, s.hero.y] }];
  for (let i = 0; i < 4; i++) {
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
    await sleep(1200);
    seq.push({ i, cell, mapSame: s.map === map0, mark: s.map.__mark ?? null, listeners: counts(), awaiting: s.awaitingInput, hero: [s.hero.x, s.hero.y], travel: s.travelTarget });
  }
  return { seq };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
