// T52 blob-shape probe: list blob fields, sample volumes around hero.
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
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=t52-blob', { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(6000);
await page.mouse.click(398, 400); await page.waitForTimeout(3000);
await page.mouse.click(62, 261); await page.waitForTimeout(1500);
await page.mouse.click(170, 707); await page.waitForTimeout(6000);
const out = await page.evaluate(() => {
  const s = window.__MWG__.currentScene;
  const blobFields = [];
  for (const k of Object.keys(s)) {
    try {
      const v = s[k];
      if (v && typeof v.volumeAt === 'function') blobFields.push(k);
    } catch { }
  }
  const samp = {};
  for (const k of blobFields) {
    try {
      samp[k] = {
        heroVol: s[k].volumeAt(s.hero.x, s.hero.y),
        total: typeof s[k].total === 'function' ? s[k].total() : 'n/a',
      };
    } catch (e) { samp[k] = `err ${String(e).slice(0, 60)}`; }
  }
  return { hero: [s.hero.x, s.hero.y], blobFields, samp };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
