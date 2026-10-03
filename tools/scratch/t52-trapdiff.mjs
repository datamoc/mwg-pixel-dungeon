// T52 trap-diff probe: does trapKinds grow/change as the hero walks?
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
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=t52-trapdiff', { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(6000);
await page.mouse.click(398, 400); await page.waitForTimeout(3000);
await page.mouse.click(62, 261); await page.waitForTimeout(1500);
await page.mouse.click(170, 707); await page.waitForTimeout(6000);
const dump = () => page.evaluate(() => {
  const s = window.__MWG__.currentScene;
  const hist = {};
  for (const [, kind] of s.trapKinds.entries()) hist[kind] = (hist[kind] ?? 0) + 1;
  return { depth: s.depth, hero: [s.hero.x, s.hero.y, s.hero.hp], total: s.trapKinds.size, hist, spent: s.spentTrapCells.size };
});
console.log('spawn:', JSON.stringify(await dump()));
for (let i = 0; i < 10; i++) {
  const cell = await page.evaluate(() => {
    const s = window.__MWG__.currentScene;
    for (const [ox, oy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
      const c = { x: s.hero.x + ox, y: s.hero.y + oy };
      if (!s.level.inside(c.x, c.y)) continue;
      try { if (s.level.passable(c.x, c.y)) return c; } catch { }
    }
    return null;
  });
  if (!cell) break;
  const [px, py] = await page.evaluate(([x, y]) => {
    const s = window.__MWG__.currentScene;
    const g = s.map.toGlobal({ x: x * 16 + 8, y: y * 16 + 8 });
    return [g.x, g.y];
  }, [cell.x, cell.y]);
  await page.mouse.click(px, py);
  await page.waitForTimeout(900);
  console.log(`step${i}:`, JSON.stringify(await dump()));
}
await browser.close();
