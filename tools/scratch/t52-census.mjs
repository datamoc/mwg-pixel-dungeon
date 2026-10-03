// T52 trap-census probe: trapKinds size + histogram on fresh depth-1 boots.
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const globalRoot = process.env.GLOBAL_NODE_MODULES ?? 'C:\\Users\\miche\\AppData\\Roaming\\npm\\node_modules';
const { chromium } = require(path.join(globalRoot, 'playwright'));
const executablePath = path.join(
  process.env.LOCALAPPDATA ?? 'C:\\Users\\miche\\AppData\\Local',
  'ms-playwright', 'chromium-1193', 'chrome-win', 'chrome.exe');

for (let run = 0; run < 5; run++) {
  const browser = await chromium.launch({
    executablePath,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newContext({ viewport: { width: 1024, height: 768 } }).then((c) => c.newPage());
  await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + `?seed=t52-census-${run}`, { waitUntil: 'load', timeout: 120000 });
  await page.waitForTimeout(6000);
  await page.mouse.click(398, 400); await page.waitForTimeout(3000);
  await page.mouse.click(62, 261); await page.waitForTimeout(1500);
  await page.mouse.click(170, 707); await page.waitForTimeout(6000);
  const out = await page.evaluate(() => {
    const s = window.__MWG__.currentScene;
    const hist = {};
    for (const [, kind] of s.trapKinds.entries()) hist[kind] = (hist[kind] ?? 0) + 1;
    return { depth: s.depth, total: s.trapKinds.size, hist, rooms: s.level?.rooms?.length ?? null };
  });
  console.log(`run${run}:`, JSON.stringify(out));
  await browser.close();
}
