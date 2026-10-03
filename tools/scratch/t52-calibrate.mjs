// T52 calibration (tools/scratch): derive cell->screen mapping live, then prove it
// by tapping an adjacent floor cell through the REAL pointer path and watching
// the hero step there.
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
const tap = async (fx, fy, waitMs = 1500) => {
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
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=t52-cal', { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(6000);
await tap(398 / 1024, 400 / 768, 3000);
await tap(62 / 1024, 261 / 768, 1500);
await tap(0.166, 0.921, 6000);

// cellToScreen: world cell centre -> canvas CSS pixels, via the map's own transform.
const info = await page.evaluate(() => {
  const s = window.__MWG__.currentScene;
  const c = document.querySelector('canvas');
  const r = c.getBoundingClientRect();
  const TILE = 16;
  const probe = (x, y) => {
    const g = s.map.toGlobal({ x: x * TILE + TILE / 2, y: y * TILE + TILE / 2 });
    return { gx: g.x, gy: g.y };
  };
  return {
    rect: { x: r.x, y: r.y, w: r.width, h: r.height },
    hero: { x: s.hero.x, y: s.hero.y },
    heroGlobal: probe(s.hero.x, s.hero.y),
    rendererSize: window.__MWG__.app ? { w: window.__MWG__.app.renderer?.width, h: window.__MWG__.app.renderer?.height } : null,
  };
});
console.log(JSON.stringify(info, null, 1));
// cellToFraction: world cell -> canvas fractions, via the map's own transform.
// toGlobal yields renderer backing pixels; the canvas rect maps those 1:1 to CSS.
const cellToFraction = async (cx, cy) => page.evaluate(([x, y]) => {
  const s = window.__MWG__.currentScene;
  const TILE = 16;
  const g = s.map.toGlobal({ x: x * TILE + TILE / 2, y: y * TILE + TILE / 2 });
  const rw = window.__MWG__.app?.renderer?.width ?? 1024;
  const rh = window.__MWG__.app?.renderer?.height ?? 768;
  return [g.x / rw, g.y / rh];
}, [cx, cy]);

const before = await page.evaluate(() => ({ x: window.__MWG__.currentScene.hero.x, y: window.__MWG__.currentScene.hero.y }));
// step east twice through the REAL pointer path (adjacent click = single step)
const step = await cellToFraction(before.x + 1, before.y);
console.log('step fraction:', JSON.stringify(step));
await tap(step[0], step[1], 2500);
const after = await page.evaluate(() => ({ x: window.__MWG__.currentScene.hero.x, y: window.__MWG__.currentScene.hero.y }));
console.log('moved:', JSON.stringify(before), '->', JSON.stringify(after));
await browser.close();
