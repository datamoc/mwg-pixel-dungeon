// T52 recipe probe: hover-style move (buttons 0) before down, 10 taps.
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
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=t52-recipe', { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(6000);
await tapFrac(398 / 1024, 400 / 768, 3000);
await tapFrac(62 / 1024, 261 / 768, 1500);
await tapFrac(0.166, 0.921, 6000);
const out = await page.evaluate(() => {
  const s = window.__MWG__.currentScene;
  const res = [];
  let downs = 0;
  s.map.on('pointerdown', () => downs++);
  for (let i = 0; i < 10; i++) {
    let cell = null;
    for (const [ox, oy] of [[1, 0], [0, 1], [-1, 0], [0, -1], [0, 0]]) {
      const c = { x: s.hero.x + ox, y: s.hero.y + oy };
      if (!s.level.inside(c.x, c.y)) continue;
      try { if ((ox === 0 && oy === 0) || s.pathfinder.find({ x: s.hero.x, y: s.hero.y }, c, {})) { cell = c; break; } } catch { }
    }
    const before = [s.hero.x, s.hero.y];
    const g = s.map.toGlobal({ x: cell.x * 16 + 8, y: cell.y * 16 + 8 });
    const c = document.querySelector('canvas');
    const downsBefore = downs;
    c.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, cancelable: true, composed: true, clientX: g.x, clientY: g.y, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: 0 }));
    c.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, composed: true, clientX: g.x, clientY: g.y, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: 1 }));
    c.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, composed: true, clientX: g.x, clientY: g.y, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: 0 }));
    c.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: g.x, clientY: g.y }));
    res.push({ i, cell, before, after: [s.hero.x, s.hero.y], downs: downs - downsBefore });
  }
  return { res };
});
console.log(JSON.stringify(out));
await browser.close();
