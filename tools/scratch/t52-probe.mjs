// T52 probe 2 (tools/scratch): heap/item shapes, descend seams, hero fields,
// explored-data shape, window-stack shape - everything the bot loop needs.
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
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
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
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=t52-probe2', { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(6000);
await tap(398 / 1024, 400 / 768, 3000);
await tap(62 / 1024, 261 / 768, 1500);
await tap(0.166, 0.921, 6000);

const dump = await page.evaluate(() => {
  const s = window.__MWG__.currentScene;
  const h = s.hero;
  const heroKeys = Object.keys(h).filter((k) => /lvl|level|exp|xp|tier|subclass|armor|charge|talent/i.test(k));
  const proto = Object.getOwnPropertyNames(Object.getPrototypeOf(s));
  // heaps: try likely containers
  const heapInfo = {};
  for (const k of ['heaps', 'groundItems', 'items', 'heapsByCell', 'level']) {
    const v = s[k];
    if (!v) { heapInfo[k] = null; continue; }
    if (v instanceof Map) {
      const e = [...v.entries()].slice(0, 3).map(([ck, cv]) => [ck, JSON.stringify(cv).slice(0, 200)]);
      heapInfo[k] = { map: v.size, sample: e };
    } else if (Array.isArray(v)) heapInfo[k] = { array: v.length, sample: JSON.stringify(v[0]).slice(0, 200) };
    else heapInfo[k] = typeof v;
  }
  // level explored data
  const lvl = s.level ?? {};
  const lvlKeys = Object.keys(lvl).filter((k) => /explor|visit|map|fog|seen|fov/i.test(k));
  return {
    heroKeys, heroVals: Object.fromEntries(heroKeys.map((k) => [k, h[k]])),
    descendSeams: proto.filter((n) => /escend|tair|xit|nterLevel|hangeDepth|goDown/i.test(n)),
    heapInfo, lvlKeys,
    windows: { game: !!s.gameWindows, info: !!s.windows, open: s.gameWindows ? !s.gameWindows.isEmpty : null },
    bagKeys: s.hero && s.hero.bag ? Object.keys(s.hero.bag).slice(0, 20) : ('bag' in h ? typeof h.bag : 'no-bag'),
  };
});
console.log(JSON.stringify(dump, null, 1).slice(0, 4000));
console.log('PROBLEMS:', JSON.stringify(problems.slice(0, 5)));
await browser.close();
