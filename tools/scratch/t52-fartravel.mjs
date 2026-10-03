// T52 far-travel instrumented probe: tap, then dissect why stepTravel clears.
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
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=t52-traveldbg', { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(6000);
await tap(398 / 1024, 400 / 768, 3000);
await tap(62 / 1024, 261 / 768, 1500);
await tap(0.166, 0.921, 6000);
const out = await page.evaluate(() => {
  const s = window.__MWG__.currentScene;
  const hx = s.hero.x, hy = s.hero.y;
  // same dest search as traveldbg
  let dest = null;
  for (let r = 12; r >= 4; r--) {
    for (const [dx, dy] of [[r, 0], [0, r], [-r, 0], [0, -r], [r, r], [-r, -r]]) {
      const c = { x: hx + dx, y: hy + dy };
      if (!s.level.inside(c.x, c.y)) continue;
      try {
        const p = s.pathfinder.find({ x: hx, y: hy }, c, {});
        if (p && p.length > 3) { dest = { c, len: p.length, first: p[0] }; break; }
      } catch { }
    }
    if (dest) break;
  }
  // replicate stepTravel's interrupt + blocked computation (read-only)
  const list = [...(s.creatures?.values?.() ?? s.creatures ?? [])];
  const interrupters = list
    .filter((c) => !c.isHero && !c.isNPC && c.hp > 0 && !c.sleeping)
    .map((c) => ({ kind: c.kind ?? null, x: c.x, y: c.y, vis: (() => { try { return s.fov.isVisible(c.x, c.y); } catch { return 'err'; } })() }));
  const blocked = new Set(list.filter((c) => c !== s.hero).map((c) => s.level.index(c.x, c.y)));
  try { s.eternalFireBlockedInto(blocked); } catch (e) { return { err: `fire: ${String(e).slice(0, 100)}` }; }
  let path = null, pathErr = null;
  try { path = s.pathfinder.find({ x: hx, y: hy }, dest.c, { blocked }); }
  catch (e) { pathErr = String(e).slice(0, 120); }
  // now perform the real tap on dest and read travelTarget synchronously
  const g = s.map.toGlobal({ x: dest.c.x * 16 + 8, y: dest.c.y * 16 + 8 });
  const c = document.querySelector('canvas');
  const r = c.getBoundingClientRect();
  const cx = r.x + r.width * (g.x / 1024), cy = r.y + r.height * (g.y / 768);
  const fire = (type) => c.dispatchEvent(new PointerEvent(type, {
    bubbles: true, cancelable: true, composed: true, clientX: cx, clientY: cy,
    pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: type === 'pointerup' ? 0 : 1,
  }));
  fire('pointermove'); fire('pointerdown');
  const sync = { hero: [s.hero.x, s.hero.y], travel: s.travelTarget, awaiting: s.awaitingInput };
  fire('pointerup');
  return {
    hero0: [hx, hy], dest, interrupters,
    blockedSize: blocked.size, pathLen: path?.length ?? null, pathFirst: path?.[0] ?? null, pathErr,
    syncAfterTap: sync, problems: null,
  };
});
console.log(JSON.stringify({ ...out, pageerrors: problems }));
await browser.close();
