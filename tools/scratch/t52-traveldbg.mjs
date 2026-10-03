// T52 travel debug (tools/scratch): tap a far cell, sample travel state + buffs.
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
const tap = async (fx, fy, waitMs = 1000) => {
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
const cellTap = async (cx, cy, waitMs = 800) => {
  const f = await page.evaluate(([x, y]) => {
    const s = window.__MWG__.currentScene;
    const g = s.map.toGlobal({ x: x * 16 + 8, y: y * 16 + 8 });
    return [g.x / 1024, g.y / 768];
  }, [cx, cy]);
  await tap(f[0], f[1], waitMs);
};
const snap = () => page.evaluate(() => {
  const s = window.__MWG__.currentScene;
  return {
    hero: [s.hero.x, s.hero.y, s.hero.hp], awaiting: !!s.awaitingInput,
    travel: s.travelTarget, buffs: s.hero.buffs ? Object.keys(s.hero.buffs) : null,
    fire: s.fire?.volumeAt ? s.fire.volumeAt(s.hero.x, s.hero.y) : null,
    gameOver: !!s.gameOver,
  };
});
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=t52-traveldbg', { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(6000);
await tap(398 / 1024, 400 / 768, 3000);
await tap(62 / 1024, 261 / 768, 1500);
await tap(0.166, 0.921, 6000);
console.log('spawn:', JSON.stringify(await snap()));
// pick a far reachable cell via the game's own pathfinder and tap it
const dest = await page.evaluate(() => {
  const s = window.__MWG__.currentScene;
  for (let r = 12; r >= 4; r--) {
    for (const [dx, dy] of [[r, 0], [0, r], [-r, 0], [0, -r], [r, r], [-r, -r]]) {
      const c = { x: s.hero.x + dx, y: s.hero.y + dy };
      if (!s.level.inside(c.x, c.y)) continue;
      try {
        const p = s.pathfinder.find({ x: s.hero.x, y: s.hero.y }, c, {});
        if (p && p.length > 3) return { c, len: p.length };
      } catch { /* skip */ }
    }
  }
  return null;
});
console.log('dest:', JSON.stringify(dest));
if (dest) await cellTap(dest.c.x, dest.c.y, 1500);
for (let i = 0; i < 8; i++) {
  await page.waitForTimeout(1500);
  console.log(i, JSON.stringify(await snap()));
}
await browser.close();
