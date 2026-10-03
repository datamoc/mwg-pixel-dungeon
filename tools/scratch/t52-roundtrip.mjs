// T52 coordinate round-trip probe.
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
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=t52-roundtrip', { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(6000);
await tap(398 / 1024, 400 / 768, 3000);
await tap(62 / 1024, 261 / 768, 1500);
await tap(0.166, 0.921, 6000);
const out = await page.evaluate(() => {
  const s = window.__MWG__.currentScene;
  const c = document.querySelector('canvas');
  const r = c.getBoundingClientRect();
  const tx = s.hero.x + 2, ty = s.hero.y;
  const g = s.map.toGlobal({ x: tx * 16 + 8, y: ty * 16 + 8 });
  const fx = g.x / 1024, fy = g.y / 768;
  // where does the bot's tap actually land, per the game's own math?
  const clientX = r.x + r.width * fx, clientY = r.y + r.height * fy;
  const app = window.__MWG__.app ?? null;
  const w = s.camera.toWorld(clientX, clientY);
  const cell = { x: Math.floor(w.x / 16), y: Math.floor(w.y / 16) };
  return {
    rect: { x: r.x, y: r.y, w: r.width, h: r.height },
    canvasAttr: { w: c.width, h: c.height },
    renderer: app?.renderer ? { w: app.renderer.width, h: app.renderer.height, res: app.renderer.resolution } : null,
    hero: { x: s.hero.x, y: s.hero.y },
    intended: { x: tx, y: ty },
    toGlobal: { x: g.x, y: g.y },
    fraction: { x: fx, y: fy },
    client: { x: clientX, y: clientY },
    landedCell: cell,
    inside: s.level.inside(cell.x, cell.y),
  };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
