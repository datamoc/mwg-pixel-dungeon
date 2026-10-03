// T52 trap-position probe: full trap map at spawn, per-step positions + spent + hp.
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
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=t52-trappos', { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(6000);
await page.mouse.click(398, 400); await page.waitForTimeout(3000);
await page.mouse.click(62, 261); await page.waitForTimeout(1500);
await page.mouse.click(170, 707); await page.waitForTimeout(6000);
const dump = () => page.evaluate(() => {
  const s = window.__MWG__.currentScene;
  const W = s.level.width;
  const traps = [];
  for (const [cell, kind] of s.trapKinds.entries()) {
    traps.push({ x: cell % W, y: Math.floor(cell / W), kind, spent: s.spentTrapCells.has(cell) });
  }
  const lines = (s.gameLog?.blocks ?? []).slice(-2).map((b) => { try { return b.label?.text ?? null; } catch { return null; } }).filter(Boolean);
  return { depth: s.depth, hero: [s.hero.x, s.hero.y, s.hero.hp], buffs: s.hero.buffs ? Object.keys(s.hero.buffs) : null, traps, lines };
});
console.log('spawn:', JSON.stringify(await dump()));
for (let i = 0; i < 12; i++) {
  const cell = await page.evaluate(() => {
    const s = window.__MWG__.currentScene;
    for (const [ox, oy] of [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, -1]]) {
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
  console.log(`step${i} tap(${cell.x},${cell.y}):`, JSON.stringify(await dump()));
  const hp = await page.evaluate(() => window.__MWG__.currentScene.hero.hp);
  if (hp <= 0) break;
}
await browser.close();
