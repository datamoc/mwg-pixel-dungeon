// T52 A/B probe: down-only vs move-then-down on the SAME far cell.
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
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=t52-ab', { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(6000);
await tap(398 / 1024, 400 / 768, 3000);
await tap(62 / 1024, 261 / 768, 1500);
await tap(0.166, 0.921, 6000);
const out = await page.evaluate(() => {
  const s = window.__MWG__.currentScene;
  const dest = { x: s.hero.x, y: s.hero.y + 5 };
  const g = s.map.toGlobal({ x: dest.x * 16 + 8, y: dest.y * 16 + 8 });
  const c = document.querySelector('canvas');
  const r = c.getBoundingClientRect();
  const cx = r.x + r.width * (g.x / 1024), cy = r.y + r.height * (g.y / 768);
  const mk = (type) => new PointerEvent(type, {
    bubbles: true, cancelable: true, composed: true, clientX: cx, clientY: cy,
    pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: type === 'pointerup' ? 0 : 1,
  });
  const hits = [];
  s.map.on('pointerdown', (e) => hits.push(`map:${Math.round(e.global.x)},${Math.round(e.global.y)}`));
  // A: down only
  c.dispatchEvent(mk('pointerdown'));
  const a = { hits: [...hits], travel: s.travelTarget, hero: [s.hero.x, s.hero.y] };
  hits.length = 0;
  c.dispatchEvent(mk('pointerup'));
  // B: move then down (fresh pointerId to avoid tracking carryover)
  const mk2 = (type) => new PointerEvent(type, {
    bubbles: true, cancelable: true, composed: true, clientX: cx, clientY: cy,
    pointerId: 7, pointerType: 'mouse', isPrimary: true, button: 0, buttons: type === 'pointerup' ? 0 : 1,
  });
  c.dispatchEvent(mk2('pointermove'));
  c.dispatchEvent(mk2('pointerdown'));
  const b = { hits: [...hits], travel: s.travelTarget, hero: [s.hero.x, s.hero.y] };
  return { hero0: [s.hero.x, s.hero.y], dest, client: { x: cx, y: cy }, a, b };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
