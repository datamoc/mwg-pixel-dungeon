// T52 eater probe: tap a stuck cell, identify who receives the event.
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
const tapFrac = async (fx, fy, waitMs = 1000) => {
  await page.evaluate(([x, y]) => {
    const c = document.querySelector('canvas');
    const r = c.getBoundingClientRect();
    const move = { bubbles: true, cancelable: true, composed: true, clientX: r.x + r.width * x, clientY: r.y + r.height * y, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: 0 };
    c.dispatchEvent(new PointerEvent('pointermove', move));
    const down = { ...move, buttons: 1 };
    c.dispatchEvent(new PointerEvent('pointerdown', down));
    c.dispatchEvent(new PointerEvent('pointerup', { ...down, buttons: 0 }));
    c.dispatchEvent(new MouseEvent('click', { ...down, buttons: 0 }));
  }, [fx, fy]);
  await page.waitForTimeout(waitMs);
};
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + '?seed=t52-eater', { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(6000);
await tapFrac(398 / 1024, 400 / 768, 3000);
await tapFrac(62 / 1024, 261 / 768, 1500);
await tapFrac(0.166, 0.921, 6000);
const out = await page.evaluate(async () => {
  const s = window.__MWG__.currentScene;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  // walk east until stuck (max 6 taps), then diagnose the stuck target
  let last = [s.hero.x, s.hero.y];
  let stuckCell = null;
  for (let i = 0; i < 6; i++) {
    let cell = null;
    for (const [ox, oy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
      const c = { x: s.hero.x + ox, y: s.hero.y + oy };
      if (!s.level.inside(c.x, c.y)) continue;
      try { if (s.pathfinder.find({ x: s.hero.x, y: s.hero.y }, c, {})) { cell = c; break; } } catch { }
    }
    const g = s.map.toGlobal({ x: cell.x * 16 + 8, y: cell.y * 16 + 8 });
    const c = document.querySelector('canvas');
    c.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: g.x, clientY: g.y, pointerId: 1, pointerType: 'mouse', button: 0, buttons: 0 }));
    c.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: g.x, clientY: g.y, pointerId: 1, pointerType: 'mouse', button: 0, buttons: 1 }));
    c.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: g.x, clientY: g.y, pointerId: 1, pointerType: 'mouse', button: 0, buttons: 0 }));
    await sleep(900);
    if (s.hero.x === last[0] && s.hero.y === last[1] && s.awaitingInput) { stuckCell = cell; break; }
    last = [s.hero.x, s.hero.y];
  }
  if (!stuckCell) return { walked: last };
  // diagnose: who is at that cell, who gets the event?
  const g = s.map.toGlobal({ x: stuckCell.x * 16 + 8, y: stuckCell.y * 16 + 8 });
  const occ = s.creatureAt(stuckCell.x, stuckCell.y);
  const hits = [];
  const mk = (who) => (e) => {
    let chain = [];
    try {
      let n = e.target;
      for (let d = 0; d < 4 && n; d++) { chain.push(n.constructor?.name ?? '?'); n = n.parent; }
    } catch { }
    hits.push(`${who}:${Math.round(e.global.x)},${Math.round(e.global.y)}:${chain.join('>')}`);
  };
  s.map.on('pointerdown', mk('map'));
  s.stage.on('pointerdown', mk('stage'));
  const c = document.querySelector('canvas');
  c.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: g.x, clientY: g.y, pointerId: 1, pointerType: 'mouse', button: 0, buttons: 0 }));
  c.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: g.x, clientY: g.y, pointerId: 1, pointerType: 'mouse', button: 0, buttons: 1 }));
  return {
    hero: [s.hero.x, s.hero.y], stuckCell, client: [Math.round(g.x), Math.round(g.y)],
    occupant: occ ? { kind: occ.kind ?? null, hero: !!occ.isHero, ally: !!occ.isAlly, npc: !!occ.isNPC, hp: occ.hp, sleeping: !!occ.sleeping } : null,
    vis: (() => { try { return s.fov.isVisible(stuckCell.x, stuckCell.y); } catch { return 'err'; } })(),
    awaiting: s.awaitingInput, hits,
    spriteFor: (() => { try { const sp = s.spriteFor?.(occ); return sp ? { ctor: sp.constructor?.name, mode: sp.eventMode, vis: sp.visible } : null; } catch { return 'err'; } })(),
  };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
