// T52 post-fix audit: every 48px TilingSprite must be eventMode none.
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
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=t52-postfix', { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(6000);
await page.mouse.click(398, 400); await page.waitForTimeout(3000);
await page.mouse.click(62, 261); await page.waitForTimeout(1500);
await page.mouse.click(170, 707); await page.waitForTimeout(6000);
const out = await page.evaluate(() => {
  const s = window.__MWG__.currentScene;
  const tiles = [];
  const walk = (n, depth) => {
    if (!n || depth > 9 || tiles.length >= 500) return;
    let bounds = null;
    try { if (typeof n.getBounds === 'function') bounds = n.getBounds(); } catch { }
    if (bounds && Math.abs(bounds.width - 48) < 1 && Math.abs(bounds.height - 48) < 1
      && (n.label === 'TilingSprite' || n.constructor?.name?.includes('Tiling'))) {
      tiles.push(n.eventMode ?? null);
    }
    for (const k of (n.children ?? [])) walk(k, depth + 1);
  };
  walk(s.stage, 0);
  const hist = {};
  for (const m of tiles) hist[m] = (hist[m] ?? 0) + 1;
  return { tiles: tiles.length, modes: hist };
});
console.log(JSON.stringify(out));
await browser.close();
