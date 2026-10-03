// T52 dart-source probe: map dart traps near spawn, tap around, log what fires.
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
const out = await page.evaluate(async () => {
  const s = window.__MWG__.currentScene;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const hx = s.hero.x, hy = s.hero.y, W = s.level.width;
  const darts = [];
  for (const [cell, kind] of s.trapKinds.entries()) {
    const x = cell % W, y = Math.floor(cell / W);
    if (Math.max(Math.abs(x - hx), Math.abs(y - hy)) <= 12 && (kind === 'poisonDart' || kind === 'wornDart')) {
      darts.push({ x, y, kind, spent: s.spentTrapCells.has(cell) });
    }
  }
  const lines = () => (s.gameLog?.blocks ?? []).slice(-3).map((b) => { try { return b.label?.text ?? null; } catch { return null; } }).filter(Boolean);
  const seq = [{ hero: [s.hero.x, s.hero.y, s.hero.hp], lines: lines() }];
  // tap each of the 8 neighbors in turn, record darts
  for (const [ox, oy] of [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const c = { x: s.hero.x + ox, y: s.hero.y + oy };
    if (!s.level.inside(c.x, c.y)) continue;
    const g = s.map.toGlobal({ x: c.x * 16 + 8, y: c.y * 16 + 8 });
    const cv = document.querySelector('canvas');
    cv.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: g.x, clientY: g.y, pointerId: 1, pointerType: 'mouse', button: 0, buttons: 0 }));
    cv.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: g.x, clientY: g.y, pointerId: 1, pointerType: 'mouse', button: 0, buttons: 1 }));
    cv.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: g.x, clientY: g.y, pointerId: 1, pointerType: 'mouse', button: 0, buttons: 0 }));
    await sleep(1000);
    seq.push({ tap: [c.x, c.y], hero: [s.hero.x, s.hero.y, s.hero.hp], lines: lines() });
    if (s.hero.hp <= 0) break;
  }
  return { spawn: [hx, hy], darts, seq };
});
console.log(JSON.stringify(out, null, 1).slice(0, 3000));
await browser.close();
