// T52 water-tap trace: instance-patched handleMapPointer + map counter on water.
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
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=t52-water', { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(6000);
await page.mouse.click(398, 400); await page.waitForTimeout(3000);
await page.mouse.click(62, 261); await page.waitForTimeout(1500);
await page.mouse.click(170, 707); await page.waitForTimeout(6000);
const out = await page.evaluate(async () => {
  const s = window.__MWG__.currentScene;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  // find an adjacent water cell, else report none nearby
  let water = null;
  for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const c = { x: s.hero.x + ox, y: s.hero.y + oy };
    if (!s.level.inside(c.x, c.y)) continue;
    try { if (s.level.terrain[s.level.index(c.x, c.y)] === 3) { water = c; break; } } catch { }
  }
  if (!water) {
    // walk east up to 12 steps looking for adjacent water
    for (let i = 0; i < 12 && !water; i++) {
      let cell = null;
      for (const [ox, oy] of [[1, 0], [0, 1], [0, -1], [-1, 0]]) {
        const c = { x: s.hero.x + ox, y: s.hero.y + oy };
        if (!s.level.inside(c.x, c.y)) continue;
        try { if (s.level.passable(c.x, c.y) && !s.creatureAt(c.x, c.y)) { cell = c; break; } } catch { }
      }
      if (!cell) break;
      const g = s.map.toGlobal({ x: cell.x * 16 + 8, y: cell.y * 16 + 8 });
      const cv = document.querySelector('canvas');
      cv.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: g.x, clientY: g.y, pointerId: 1, pointerType: 'mouse', button: 0, buttons: 0 }));
      cv.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: g.x, clientY: g.y, pointerId: 1, pointerType: 'mouse', button: 0, buttons: 1 }));
      cv.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: g.x, clientY: g.y, pointerId: 1, pointerType: 'mouse', button: 0, buttons: 0 }));
      await sleep(800);
      for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const c = { x: s.hero.x + ox, y: s.hero.y + oy };
        if (!s.level.inside(c.x, c.y)) continue;
        try { if (s.level.terrain[s.level.index(c.x, c.y)] === 3) { water = c; break; } } catch { }
      }
    }
  }
  if (!water) return { noWater: true, hero: [s.hero.x, s.hero.y] };
  const log = [];
  let downs = 0;
  s.map.on('pointerdown', () => downs++);
  const origH = s.handleMapPointer.bind(s);
  s.handleMapPointer = function (sx, sy) {
    log.push({ call: [Math.round(sx), Math.round(sy)], awaiting: this.awaitingInput });
    const r = origH(sx, sy);
    log.push({ after: [this.hero.x, this.hero.y], travel: this.travelTarget });
    return r;
  };
  const g = s.map.toGlobal({ x: water.x * 16 + 8, y: water.y * 16 + 8 });
  const cv = document.querySelector('canvas');
  cv.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: g.x, clientY: g.y, pointerId: 1, pointerType: 'mouse', button: 0, buttons: 0 }));
  cv.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: g.x, clientY: g.y, pointerId: 1, pointerType: 'mouse', button: 0, buttons: 1 }));
  cv.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: g.x, clientY: g.y, pointerId: 1, pointerType: 'mouse', button: 0, buttons: 0 }));
  await sleep(800);
  return { hero0: null, water, client: [Math.round(g.x), Math.round(g.y)], downs, log, hero: [s.hero.x, s.hero.y] };
});
console.log(JSON.stringify(out));
await browser.close();
