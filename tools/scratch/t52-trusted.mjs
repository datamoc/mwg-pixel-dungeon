// T52 trusted-input probe: page.mouse (real CDP events) instead of synthetic dispatch.
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
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=t52-trusted', { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(6000);
await page.mouse.click(398, 400); await page.waitForTimeout(3000);
await page.mouse.click(62, 261); await page.waitForTimeout(1500);
await page.mouse.click(170, 707); await page.waitForTimeout(6000);
const cellXY = (cx, cy) => page.evaluate(([x, y]) => {
  const s = window.__MWG__.currentScene;
  const g = s.map.toGlobal({ x: x * 16 + 8, y: y * 16 + 8 });
  return [g.x, g.y];
}, [cx, cy]);
const state = () => page.evaluate(() => {
  const s = window.__MWG__.currentScene;
  return { hero: [s.hero.x, s.hero.y, s.hero.hp], awaiting: s.awaitingInput, travel: !!s.travelTarget };
});
console.log('boot:', JSON.stringify(await state()));
const res = [];
for (let i = 0; i < 10; i++) {
  const st = await state();
  // east-first adjacent floor via pathfinder
  const cell = await page.evaluate(([hx, hy]) => {
    const s = window.__MWG__.currentScene;
    for (const [ox, oy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
      const c = { x: hx + ox, y: hy + oy };
      if (!s.level.inside(c.x, c.y)) continue;
      try { if (s.pathfinder.find({ x: hx, y: hy }, c, {})) return c; } catch { }
    }
    return null;
  }, [st.hero[0], st.hero[1]]);
  const [px, py] = await cellXY(cell.x, cell.y);
  await page.mouse.click(px, py);
  await page.waitForTimeout(900);
  const after = await state();
  res.push({ i, cell, moved: after.hero[0] !== st.hero[0] || after.hero[1] !== st.hero[1], after: after.hero });
}
console.log(JSON.stringify(res));
await browser.close();
