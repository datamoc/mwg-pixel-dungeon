// T52 full-trap dump probe: all trap kinds near spawn + secrets.
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
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=t52-dart', { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(6000);
await page.mouse.click(398, 400); await page.waitForTimeout(3000);
await page.mouse.click(62, 261); await page.waitForTimeout(1500);
await page.mouse.click(170, 707); await page.waitForTimeout(6000);
const out = await page.evaluate(() => {
  const s = window.__MWG__.currentScene;
  const hx = s.hero.x, hy = s.hero.y, W = s.level.width;
  const traps = [];
  for (const [cell, kind] of s.trapKinds.entries()) {
    const x = cell % W, y = Math.floor(cell / W);
    if (Math.max(Math.abs(x - hx), Math.abs(y - hy)) <= 20) {
      traps.push({ x, y, kind, spent: s.spentTrapCells.has(cell) });
    }
  }
  return { spawn: [hx, hy], traps };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
