// T52 refused-cell probe: passable? occupant? terrain? pathfinder {} vs blocked?
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
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=t52-refused', { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(6000);
await page.mouse.click(398, 400); await page.waitForTimeout(3000);
await page.mouse.click(62, 261); await page.waitForTimeout(1500);
await page.mouse.click(170, 707); await page.waitForTimeout(6000);
const out = await page.evaluate(async () => {
  const s = window.__MWG__.currentScene;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const state = () => ({ hero: [s.hero.x, s.hero.y], awaiting: s.awaitingInput });
  let last = state().hero.join(',');
  let stuckCell = null;
  for (let i = 0; i < 8; i++) {
    const st = state();
    const cell = await (async () => null)();
    const pick = (() => {
      for (const [ox, oy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
        const c = { x: st.hero[0] + ox, y: st.hero[1] + oy };
        if (!s.level.inside(c.x, c.y)) continue;
        try { if (s.pathfinder.find({ x: st.hero[0], y: st.hero[1] }, c, {})) return c; } catch { }
      }
      return null;
    })();
    if (!pick) break;
    const g = s.map.toGlobal({ x: pick.x * 16 + 8, y: pick.y * 16 + 8 });
    await (async () => { })();
    // use trusted mouse via CDP is page-side; here dispatch like bot (delivery proven equivalent)
    const c = document.querySelector('canvas');
    c.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: g.x, clientY: g.y, pointerId: 1, pointerType: 'mouse', button: 0, buttons: 0 }));
    c.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: g.x, clientY: g.y, pointerId: 1, pointerType: 'mouse', button: 0, buttons: 1 }));
    c.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: g.x, clientY: g.y, pointerId: 1, pointerType: 'mouse', button: 0, buttons: 0 }));
    await sleep(900);
    const now = state();
    if (now.hero.join(',') === last && now.awaiting) { stuckCell = pick; break; }
    last = now.hero.join(',');
  }
  if (!stuckCell) return { walked: last };
  const hx = s.hero.x, hy = s.hero.y;
  const occ = s.creatureAt(stuckCell.x, stuckCell.y);
  const list = [...(s.creatures?.values?.() ?? s.creatures ?? [])];
  const blocked = new Set(list.filter((c) => c !== s.hero).map((c) => s.level.index(c.x, c.y)));
  let pEmpty = null, pBlocked = null, pEmptyErr = null, pBlockedErr = null;
  try { const p = s.pathfinder.find({ x: hx, y: hy }, stuckCell, {}); pEmpty = Array.isArray(p) ? p.length : typeof p; } catch (e) { pEmptyErr = String(e).slice(0, 80); }
  try { const p = s.pathfinder.find({ x: hx, y: hy }, stuckCell, { blocked }); pBlocked = Array.isArray(p) ? p.length : typeof p; } catch (e) { pBlockedErr = String(e).slice(0, 80); }
  return {
    hero: [hx, hy], stuckCell,
    passable: (() => { try { return s.level.passable(stuckCell.x, stuckCell.y); } catch (e) { return `err ${String(e).slice(0, 60)}`; } })(),
    terrain: (() => { try { return s.level.terrain[s.level.index(stuckCell.x, stuckCell.y)]; } catch (e) { return 'err'; } })(),
    occupant: occ ? { kind: occ.kind ?? null, hero: !!occ.isHero, ally: !!occ.isAlly, npc: !!occ.isNPC, hp: occ.hp, sleeping: !!occ.sleeping } : null,
    vis: (() => { try { return s.fov.isVisible(stuckCell.x, stuckCell.y); } catch { return 'err'; } })(),
    pEmpty, pEmptyErr, pBlocked, pBlockedErr,
  };
});
console.log(JSON.stringify(out));
await browser.close();
