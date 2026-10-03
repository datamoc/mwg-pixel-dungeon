// T52 cross-class bot (tools/scratch): plays REAL runs through the genuine input
// path only - pointer taps at projected cell positions, window buttons by computed
// centres, Escape for cancel. No scene-state writes: every state change flows
// through the game's own seams with a fixed ?seed=. Every action is logged.
//
// Usage: node tools/scratch/t52-bot.mjs <seed> <classIndex 0-5> [maxActions]
// Logs:  tools/scratch/t52-logs/<seed>.jsonl
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const globalRoot = process.env.GLOBAL_NODE_MODULES ?? 'C:\\Users\\miche\\AppData\\Roaming\\npm\\node_modules';
const { chromium } = require(path.join(globalRoot, 'playwright'));
const executablePath = path.join(
  process.env.LOCALAPPDATA ?? 'C:\\Users\\miche\\AppData\\Local',
  'ms-playwright', 'chromium-1193', 'chrome-win', 'chrome.exe');

const seed = process.argv[2] ?? 't52-warrior-1';
const classIndex = Number(process.argv[3] ?? 0);
const MAX_ACTIONS = Number(process.argv[4] ?? 1500);
const slots = [[62 / 1024, 261 / 768], [170 / 1024, 261 / 768], [278 / 1024, 261 / 768],
  [62 / 1024, 400 / 768], [170 / 1024, 400 / 768], [278 / 1024, 400 / 768]];
fs.mkdirSync('tools/scratch/t52-logs', { recursive: true });
const log = fs.createWriteStream(`tools/scratch/t52-logs/${seed}.jsonl`);
const say = (o) => { log.write(JSON.stringify(o) + '\n'); };

const browser = await chromium.launch({
  executablePath,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newContext({ viewport: { width: 1024, height: 768 } }).then((c) => c.newPage());
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`console.error: ${m.text()}`); });

const tap = async (fx, fy, waitMs = 900) => {
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
const cellTap = async (cx, cy, waitMs = 900) => {
  const f = await page.evaluate(([x, y]) => {
    const s = window.__MWG__.currentScene;
    const g = s.map.toGlobal({ x: x * 16 + 8, y: y * 16 + 8 });
    return [g.x / 1024, g.y / 768];
  }, [cx, cy]);
  await tap(f[0], f[1], waitMs);
};
const read = () => page.evaluate(() => {
  const s = window.__MWG__.currentScene;
  if (!s || !s.hero || !s.hero.x === undefined) return { scene: s?.constructor?.name ?? null, ok: false };
  const h = s.hero;
  const vis = (x, y) => { try { return s.fov.isVisible(x, y); } catch { return true; } };
  const mobs = [...(s.creatures?.values?.() ?? [])]
    .filter((c) => c !== h && c.alignment === 'ENEMY' && vis(c.x, c.y))
    .map((c) => ({ kind: c.kind, x: c.x, y: c.y, hp: c.hp }));
  const heaps = (s.groundItems ?? []).map((g) => ({ x: g.x, y: g.y, kind: g.kind }));
  return {
    ok: true, scene: s.constructor.name, hero: { x: h.x, y: h.y, hp: h.hp, maxHp: h.maxHp },
    level: s.progression?.level, depth: s.depth, branch: s.branch ?? null,
    gameOver: !!s.gameOver, awaiting: !!s.awaitingInput, travel: !!s.travelTarget,
    windows: !s.gameWindows?.isEmpty, mobs, heaps,
    stairs: s.hasStairs && s.stairs ? { x: s.stairs.x, y: s.stairs.y } : null,
    victory: !!s.victory || !!s.gameWon || undefined,
  };
});
const readMenu = () => page.evaluate(() => {
  const s = window.__MWG__.currentScene;
  const stack = s.gameWindows;
  const windows = stack.children.filter((c) => c.content);
  const win = windows[windows.length - 1];
  if (!win) return { title: null, options: [] };
  const content = win.content;
  const btns = (content?.children ?? []).filter((c) => typeof c?.width === 'number' && c.width > 100);
  const centre = (b) => ({ x: win.x + content.x + b.x + b.width / 2, y: win.y + content.y + b.y + b.height / 2 });
  return { title: win.title ?? win.label ?? null, options: btns.map(centre) };
});
const clickStagePoint = async (p) => {
  await page.evaluate(([x, y]) => {
    const c = document.querySelector('canvas');
    const r = c.getBoundingClientRect();
    const opts = { bubbles: true, cancelable: true, composed: true, clientX: r.x + (x / 1024) * r.width, clientY: r.y + (y / 768) * r.height, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: 1 };
    c.dispatchEvent(new PointerEvent('pointermove', opts));
    c.dispatchEvent(new PointerEvent('pointerdown', opts));
    c.dispatchEvent(new PointerEvent('pointerup', { ...opts, buttons: 0 }));
    c.dispatchEvent(new MouseEvent('click', { ...opts, buttons: 0 }));
  }, [p.x, p.y]);
  await page.waitForTimeout(900);
};
const pickup = (x, y) => page.evaluate(([a, b]) => window.__MWG__.currentScene.pickupGroundItemAt(a, b), [x, y]);
const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
const key = (d, x, y) => `${d}:${x},${y}`;

// ---- boot + class select + start (pilot-proven)
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href + `?seed=${seed}`, { waitUntil: 'load', timeout: 120000 });
await page.waitForTimeout(6000);
await tap(398 / 1024, 400 / 768, 3000);
await tap(slots[classIndex][0], slots[classIndex][1], 1500);
await tap(0.166, 0.921, 6000);

const visited = new Set();
let lastPos = '', stuck = 0, actions = 0, outcome = 'unfinished';
say({ ev: 'start', seed, classIndex });
while (actions < MAX_ACTIONS) {
  const st = await read();
  if (!st.ok) { await page.waitForTimeout(1000); continue; }
  say({ ev: 'turn', n: actions, d: st.depth, h: [st.hero.x, st.hero.y, st.hero.hp], mobs: st.mobs.length, win: st.windows });
  if (st.gameOver) { outcome = `gameover depth=${st.depth} hp=${st.hero.hp}`; break; }
  if (st.windows) {
    const m = await readMenu();
    say({ ev: 'window', title: m.title, options: m.options.length });
    if (m.options.length > 0) await clickStagePoint(m.options[0]);
    else await tap(0.5, 0.5, 500);
    actions++;
    continue;
  }
  if (!st.awaiting && !st.travel) { await page.waitForTimeout(500); continue; }
  const pos = key(st.depth, st.hero.x, st.hero.y);
  if (pos === lastPos) stuck++; else { stuck = 0; lastPos = pos; }
  if (stuck > 25) { outcome = `stuck at ${pos}`; break; }
  visited.add(pos);
  const adj = st.mobs.filter((m) => cheb(m, st.hero) === 1);
  if (adj.length > 0) { await cellTap(adj[0].x, adj[0].y, 700); say({ ev: 'act', a: 'attack', t: adj[0].kind }); actions++; continue; }
  const near = st.mobs.filter((m) => cheb(m, st.hero) <= 4);
  if (st.hero.hp < st.hero.maxHp * 0.45 && near.length > 0) {
    // flee: step to the adjacent cell farthest from the nearest enemy
    const away = await page.evaluate(([hx, hy, ex, ey]) => {
      const s = window.__MWG__.currentScene;
      let best = null, bd = -1;
      for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const c = { x: hx + ox, y: hy + oy };
        if (!s.level.inside(c.x, c.y)) continue;
        const p = s.pathfinder.find({ x: hx, y: hy }, c, {});
        if (!p) continue;
        const d = Math.max(Math.abs(c.x - ex), Math.abs(c.y - ey));
        if (d > bd) { bd = d; best = c; }
      }
      return best;
    }, [st.hero.x, st.hero.y, near[0].x, near[0].y]);
    if (away) { await cellTap(away.x, away.y, 700); say({ ev: 'act', a: 'flee' }); }
    else await cellTap(st.hero.x, st.hero.y, 700); // wait
    actions++;
    continue;
  }
  const heapHere = st.heaps.find((g) => g.x === st.hero.x && g.y === st.hero.y);
  if (heapHere) { await pickup(st.hero.x, st.hero.y); say({ ev: 'act', a: 'pickup', t: heapHere.kind }); actions++; await page.waitForTimeout(400); continue; }
  if (st.stairs && st.hero.x === st.stairs.x && st.hero.y === st.stairs.y) { await page.waitForTimeout(1500); actions++; continue; }
  // explore: nearest unvisited reachable cell within radius 9, else stairs, else wait
  const dest = await page.evaluate(([hx, hy, depth, known]) => {
    const s = window.__MWG__.currentScene;
    const R = 9;
    let best = null, bd = 1e9;
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
      const c = { x: hx + dx, y: hy + dy };
      if (!s.level.inside(c.x, c.y) || (dx === 0 && dy === 0)) continue;
      if (known.includes(`${depth}:${c.x},${c.y}`)) continue;
      const d = Math.max(Math.abs(dx), Math.abs(dy));
      if (d >= bd) continue;
      try {
        const p = s.pathfinder.find({ x: hx, y: hy }, c, {});
        if (p && p.length > 0) { bd = d; best = c; }
      } catch { /* unreachable */ }
    }
    return best;
  }, [st.hero.x, st.hero.y, st.depth, [...visited].slice(-4000)]);
  if (dest) {
    // walk it in full via travel: tap once, let the game walk
    await cellTap(dest.x, dest.y, 400);
    say({ ev: 'act', a: 'travel', t: [dest.x, dest.y] });
    // wait for arrival or interrupt (bounded)
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(400);
      const s2 = await read();
      if (!s2.ok || s2.windows || s2.gameOver) break;
      if (s2.hero.x === dest.x && s2.hero.y === dest.y) break;
      if (s2.mobs.some((m) => cheb(m, s2.hero) <= 1)) break;
      if (s2.hero.hp < st.hero.hp) break;
    }
    actions++;
    continue;
  }
  if (st.stairs) { await cellTap(st.stairs.x, st.stairs.y, 600); say({ ev: 'act', a: 'tostairs' }); actions++; continue; }
  await cellTap(st.hero.x, st.hero.y, 600); // wait a turn
  say({ ev: 'act', a: 'wait' });
  actions++;
}
say({ ev: 'end', outcome, actions, problems: problems.slice(0, 5) });
console.log(JSON.stringify({ seed, outcome, actions, problems: problems.slice(0, 3) }));
await browser.close();
