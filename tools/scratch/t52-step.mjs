// T52 stepwise-movement probe: dump map vocabulary + tap an adjacent floor cell.
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
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=t52-step', { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(6000);
await tap(398 / 1024, 400 / 768, 3000);
await tap(62 / 1024, 261 / 768, 1500);
await tap(0.166, 0.921, 6000);
// Dump map vocabulary around hero.
const info = await page.evaluate(() => {
  const s = window.__MWG__.currentScene;
  const hero = [...(s.creatures?.values?.() ?? [])].find((c) => c.isHero);
  const L = s.level ?? s.dungeon?.level ?? null;
  const keys = L ? Object.keys(L).filter((k) => /pass|explor|vis|walk|map|solid|avoid|pit|trap|door/i.test(k)) : null;
  const sub = {};
  if (L) {
    for (const k of Object.keys(L)) {
      const v = L[k];
      if (ArrayBuffer.isView(v) && v.length > 100) sub[k] = `${v.constructor.name}[${v.length}]`;
      else if (typeof v === 'number' || typeof v === 'string') sub[k] = v;
    }
  }
  return {
    hero: hero && { x: hero.x, y: hero.y },
    levelKeys: L ? Object.keys(L).slice(0, 60) : null,
    matchedKeys: keys,
    scalars: sub,
    sceneKeys: Object.keys(s).slice(0, 60),
    cam: s.camera ? { x: s.camera.x, y: s.camera.y, zoom: s.camera.zoom } : null,
  };
});
console.log(JSON.stringify(info, null, 1).slice(0, 3000));
await browser.close();
