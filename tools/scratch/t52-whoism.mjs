// T52 _m identification probe: find 48x48 passive tiles, report ancestry + props.
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
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=t52-whoism', { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(6000);
await page.mouse.click(398, 400); await page.waitForTimeout(3000);
await page.mouse.click(62, 261); await page.waitForTimeout(1500);
await page.mouse.click(170, 707); await page.waitForTimeout(6000);
// walk a few steps to generate footprints/effects, then inspect
for (let i = 0; i < 4; i++) {
  await page.evaluate(() => {
    const s = window.__MWG__.currentScene;
    for (const [ox, oy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
      const c = { x: s.hero.x + ox, y: s.hero.y + oy };
      if (!s.level.inside(c.x, c.y)) continue;
      try { if (s.level.passable(c.x, c.y) && !s.creatureAt(c.x, c.y)) {
        const g = s.map.toGlobal({ x: c.x * 16 + 8, y: c.y * 16 + 8 });
        const cv = document.querySelector('canvas');
        cv.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: g.x, clientY: g.y, pointerId: 1, pointerType: 'mouse', button: 0, buttons: 1 }));
        cv.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: g.x, clientY: g.y, pointerId: 1, pointerType: 'mouse', button: 0, buttons: 0 }));
        break;
      } } catch { }
    }
  });
  await page.waitForTimeout(900);
}
const out = await page.evaluate(() => {
  const s = window.__MWG__.currentScene;
  const found = [];
  const walk = (n, depth, chain) => {
    if (!n || depth > 9 || found.length >= 6) return;
    let bounds = null;
    try { if (typeof n.getBounds === 'function') bounds = n.getBounds(); } catch { }
    if (bounds && Math.abs(bounds.width - 48) < 1 && Math.abs(bounds.height - 48) < 1
      && (n.eventMode === 'passive')) {
      const props = {};
      for (const k of ['tileX', 'tileY', 'cellX', 'cellY', 'kind', 'label', 'text', 'alpha']) {
        try { const v = n[k]; if (v !== undefined && v !== null && typeof v !== 'object') props[k] = v; } catch { }
      }
      let spriteInfo = null;
      try {
        const kids = n.children ?? [];
        spriteInfo = kids.map((k) => k.constructor?.name ?? '?').slice(0, 4);
      } catch { }
      found.push({ ctor: n.constructor?.name, bounds: [Math.round(bounds.x), Math.round(bounds.y)], chain, props, kids: spriteInfo });
      return;
    }
    for (const k of (n.children ?? [])) walk(k, depth + 1, [...chain, n.constructor?.name ?? '?']);
  };
  walk(s.stage, 0, []);
  return { hero: [s.hero.x, s.hero.y], found };
});
console.log(JSON.stringify(out, null, 1).slice(0, 3000));
await browser.close();
