// T52 travel debug 2: bypass pointer dispatch, call handleMapPointer directly.
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
const tap = async (fx, fy, waitMs = 1000) => {
  await page.evaluate(([x, y]) => {
    const c = document.querySelector('canvas');
    const r = c.getBoundingClientRect();
    const opts = { bubbles: true, cancelable: true, composed: true, clientX: r.x + r.width * x, clientY: r.y + r.height * y, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: 1 };
    c.dispatchEvent(new PointerEvent('pointermove', opts));
    c.dispatchEvent(new PointerEvent('pointerdown', opts));
    c.dispatchEvent(new PointerEvent('pointerup', { ...opts, buttons: 0 }));
    c.dispatchEvent(new MouseEvent('click', { ...opts, buttons: 0 }));
  }, [fx, fy]);
  await page.waitForTimeout(waitMs);
};
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=t52-traveldbg2', { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(6000);
await tap(398 / 1024, 400 / 768, 3000);
await tap(62 / 1024, 261 / 768, 1500);
await tap(0.166, 0.921, 6000);
const out = await page.evaluate(() => {
  const s = window.__MWG__.currentScene;
  const c = document.querySelector('canvas');
  const r = c.getBoundingClientRect();
  const TILE = 16;
  const tx = s.hero.x + 5, ty = s.hero.y;
  const g = s.map.toGlobal({ x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 });
  const sx = (g.x / 1024) * r.width + r.x, sy = (g.y / 768) * r.height + r.y;
  const before = [s.hero.x, s.hero.y, !!s.travelTarget];
  // what does the tile under the tap contain? elementFromPoint
  const el = document.elementFromPoint(sx - r.x > 0 ? sx : 0, sy);
  // direct handler call with the same screen coords a tap would deliver
  s.handleMapPointer(sx, sy);
  const after = [s.hero.x, s.hero.y, !!s.travelTarget, JSON.stringify(s.travelTarget)];
  return { before, after, el: el ? el.tagName : null, tile: [tx, ty], passable: null };
});
console.log(JSON.stringify(out));
// check what is at the target: passable? creature? item?
const out2 = await page.evaluate(() => {
  const s = window.__MWG__.currentScene;
  const t = s.travelTarget;
  return { travel: t, coarse: t ? s.level.get(t.x, t.y) : null };
});
console.log(JSON.stringify(out2));
await page.waitForTimeout(4000);
const out3 = await page.evaluate(() => {
  const s = window.__MWG__.currentScene;
  return { hero: [s.hero.x, s.hero.y, s.hero.hp], travel: !!s.travelTarget };
});
console.log(JSON.stringify(out3));
await browser.close();
